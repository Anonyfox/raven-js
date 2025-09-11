/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG Huffman + Bitreader utilities.
 *
 * Pure, dependency-free primitives used by the JPEG decoder:
 * - createBitReader: byte-stuff aware bit reader for entropy-coded segments
 * - buildHuffmanTable: canonical JPEG Huffman (Annex C) table builder
 * - decodeHuffmanSymbol: decode one symbol using table and reader
 */

/**
 * @typedef {Object} BitReader
 * @property {number} offset Current byte offset in source
 * @property {number} bitBuffer Internal 32-bit buffer
 * @property {number} bitCount Number of valid bits in bitBuffer
 * @property {number|null} marker Last seen 0xFFxx marker inside entropy stream (if any)
 * @property {() => number} readBit Read a single bit (0/1)
 * @property {(n:number)=>number} receive Read n bits as unsigned integer
 * @property {(n:number)=>number} receiveSigned Read n bits and apply JPEG sign-extension
 * @property {() => void} alignToByte Drop remaining bits to align to next byte boundary
 * @property {() => (number|null)} getMarker Get and clear the last seen marker (returns value and clears internal state)
 * @property {() => boolean} hasMarker Whether a marker was seen and is pending consumption
 * @property {() => boolean} eof Whether source is exhausted
 */

/**
 * Create a byte-stuff aware bit reader.
 * - Unstuffs 0xFF 0x00 to literal 0xFF
 * - On 0xFF followed by non-zero, records marker (0xFFxx), drops bit-buffer (byte align), and prevents further reads until marker is consumed via getMarker().
 *
 * @param {Uint8Array|ArrayBuffer} source
 * @returns {BitReader}
 */
export function createBitReader(source) {
  /** @type {Uint8Array} */
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(source);

  /** @type {BitReader} */
  const state = {
    offset: 0,
    bitBuffer: 0,
    bitCount: 0,
    marker: null,
    readBit,
    receive,
    receiveSigned,
    alignToByte,
    getMarker,
    hasMarker: () => state.marker !== null,
    eof: () => state.offset >= bytes.length && state.bitCount === 0,
  };

  function getMarker() {
    const m = state.marker;
    state.marker = null;
    return m;
  }

  function alignToByte() {
    state.bitBuffer &= ~((1 << (state.bitCount & 7)) - 1);
    state.bitCount &= ~7;
  }

  /** @param {number} n */
  function ensureBits(n) {
    if (state.marker !== null) throw markerError(state.marker);
    while (state.bitCount < n) {
      if (state.offset >= bytes.length) throw new Error("ERR_UNDERFLOW: entropy data exhausted");
      let b = bytes[state.offset++];
      if (b === 0xff) {
        if (state.offset >= bytes.length) throw new Error("ERR_STUFFING: stray 0xFF at end of stream");
        const next = bytes[state.offset++];
        if (next === 0x00) {
          // stuffed 0xFF literal
          b = 0xff;
        } else {
          // encountered marker; record and stop feeding bits
          state.marker = (0xff << 8) | next;
          state.bitCount = 0;
          state.bitBuffer = 0;
          throw markerError(state.marker);
        }
      }
      state.bitBuffer = (state.bitBuffer << 8) | b;
      state.bitCount += 8;
    }
  }

  function readBit() {
    ensureBits(1);
    state.bitCount -= 1;
    const bit = (state.bitBuffer >>> state.bitCount) & 1;
    state.bitBuffer &= (1 << state.bitCount) - 1;
    return bit;
  }

  /**
   * @param {number} n
   */
  function receive(n) {
    if (n === 0) return 0;
    ensureBits(n);
    state.bitCount -= n;
    const value = (state.bitBuffer >>> state.bitCount) & ((1 << n) - 1);
    state.bitBuffer &= (1 << state.bitCount) - 1;
    return value >>> 0;
  }

  /**
   * JPEG receive-and-extend
   * @param {number} n
   */
  function receiveSigned(n) {
    const v = receive(n);
    if (n === 0) return 0;
    const threshold = 1 << (n - 1);
    return v < threshold ? v - ((1 << n) - 1) : v;
  }

  return state;

  /** @param {number} m */
  function markerError(m) {
    const hex = `0x${m.toString(16).toUpperCase().padStart(4, "0")}`;
    return new JPEGError("ERR_MARKER", `encountered marker ${hex} inside entropy stream`, m);
  }
}

/**
 * Custom JPEG error with code and optional marker field.
 * @extends Error
 */
class JPEGError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number=} marker
   */
  constructor(code, message, marker) {
    super(`${code}: ${message}`);
    this.name = "JPEGError";
    /** @type {string} */
    this.code = code;
    if (marker !== undefined) {
      /** @type {number|undefined} */
      this.marker = marker;
    }
  }
}

/**
 * @typedef {Object} HuffmanTable
 * @property {Int32Array} minCode
 * @property {Int32Array} maxCode
 * @property {Int32Array} valPtr
 * @property {Uint8Array} huffVal
 * @property {Uint16Array} fast
 * @property {Uint8Array} fastLen
 * @property {number} fastBits
 */

/**
 * Build a canonical JPEG Huffman table per Annex C (minCode/maxCode/valPtr),
 * plus a primary fast lookup table for the first N bits.
 *
 * @param {Uint8Array|number[]} codeLengthCounts 16 counts for code lengths 1..16
 * @param {Uint8Array|number[]} symbols Symbol values in order
 * @param {number} [fastBits=9] Primary table width
 * @returns {HuffmanTable}
 */
export function buildHuffmanTable(codeLengthCounts, symbols, fastBits = 9) {
  const L = codeLengthCounts instanceof Uint8Array ? codeLengthCounts : Uint8Array.from(codeLengthCounts);
  const V = symbols instanceof Uint8Array ? symbols : Uint8Array.from(symbols);

  if (L.length !== 16) throw new Error("ERR_DHT_LENGTHS: expected 16 length counts");
  let total = 0;
  for (let i = 0; i < 16; i++) total += L[i];
  if (total !== V.length) throw new Error("ERR_DHT_SYMBOLS: symbol count must equal sum(lengthCounts)");
  if (total === 0) throw new Error("ERR_DHT_EMPTY: at least one symbol required");

  const minCode = new Int32Array(17);
  const maxCode = new Int32Array(17);
  const valPtr = new Int32Array(17);

  let code = 0;
  let k = 0;
  for (let i = 1; i <= 16; i++) {
    const count = L[i - 1];
    if (count === 0) {
      minCode[i] = -1;
      maxCode[i] = -1;
      valPtr[i] = k;
    } else {
      valPtr[i] = k;
      minCode[i] = code;
      code += count;
      maxCode[i] = code - 1;
    }
    code <<= 1;
    k += count;
  }

  // Fast table: maps prefix -> (len<<8)|symbol, or 0xFFFF for slow path
  const size = 1 << fastBits;
  const fast = new Uint16Array(size);
  const fastLen = new Uint8Array(size);
  fast.fill(0xffff);

  code = 0;
  k = 0;
  for (let i = 1; i <= 16; i++) {
    const count = L[i - 1];
    for (let j = 0; j < count; j++, k++) {
      const sym = V[k];
      const len = i;
      if (len <= fastBits) {
        const start = code << (fastBits - len);
        const end = start + (1 << (fastBits - len));
        for (let p = start; p < end; p++) {
          fast[p] = (len << 8) | sym;
          fastLen[p] = len;
        }
      }
      code++;
    }
    code <<= 1;
  }

  return { minCode, maxCode, valPtr, huffVal: V, fast, fastLen, fastBits };
}

/**
 * Decode one symbol using the provided Huffman table and bit reader.
 * Uses fast table when possible, falls back to Annex C traversal.
 *
 * @param {BitReader} br
 * @param {HuffmanTable} tab
 * @returns {number}
 */
export function decodeHuffmanSymbol(br, tab) {
  // Try fast path by peeking fastBits
  // Ensure enough bits for peek; if marker is hit, ensureBits throws with marker error
  // We conservatively request fastBits bits; if not available due to marker, the error propagates
  const need = tab.fastBits;
  // local ensure: mimic receive but non-destructive
  // We rely on createBitReader's ensureBits via a shadow call: readBit cannot peek.
  // Implement a small local peek by temporarily pulling bits via receive, then pushing back is complex.
  // Instead, do slow path always if bitCount < need.
  if (br.bitCount >= need) {
    const peek = (br.bitBuffer >>> (br.bitCount - need)) & ((1 << need) - 1);
    const entry = tab.fast[peek];
    if (entry !== 0xffff) {
      const len = entry >>> 8;
      const sym = entry & 0xff;
      // consume len bits
      br.bitCount -= len;
      br.bitBuffer &= (1 << br.bitCount) - 1;
      return sym;
    }
  }

  // Slow path: read bit-by-bit comparing against min/max codes
  let code = 0;
  for (let len = 1; len <= 16; len++) {
    code = (code << 1) | br.readBit();
    const min = tab.minCode[len];
    const max = tab.maxCode[len];
    if (min >= 0 && code <= max) {
      const idx = tab.valPtr[len] + (code - min);
      return tab.huffVal[idx];
    }
  }
  throw new Error("ERR_HUFF_DECODE: code length exceeded 16 bits");
}
