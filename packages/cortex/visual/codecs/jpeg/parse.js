/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG marker parsing utilities (subset: DHT parser).
 *
 * Pure utilities for parsing JPEG segments. This file implements only
 * the DHT (Define Huffman Table) segment parser as a foundational
 * primitive for the decoder. Additional parsers will be added here.
 */

import { buildHuffmanTable } from "./huffman.js";
import { zigZagToNatural } from "./zigzag.js";

/**
 * Custom JPEG error with code for precise diagnostics.
 * @extends Error
 */
class JPEGError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = "JPEGError";
    /** @type {string} */
    this.code = code;
  }
}

/**
 * @typedef {Object} Component
 * @property {number} id
 * @property {number} h
 * @property {number} v
 * @property {number} tq
 * @property {number} blocksPerLine
 * @property {number} blocksPerColumn
 * @property {Int16Array[][]} blocks
 */

/**
 * @typedef {Object} Frame
 * @property {number} precision
 * @property {number} width
 * @property {number} height
 * @property {Component[]} components
 * @property {number} Hmax
 * @property {number} Vmax
 * @property {number} mcusPerLine
 * @property {number} mcusPerColumn
 * @property {boolean} progressive
 * @property {(Int32Array|null)[]} qtables
 * @property {number} _consumed
 */

/**
 * @typedef {import('./huffman.js').buildHuffmanTable} _
 */

/**
 * @typedef {Object} HuffmanStore
 * @property {(import('./huffman.js').buildHuffmanTable extends (...args: any) => infer R ? R[] : never)} dc
 * @property {(import('./huffman.js').buildHuffmanTable extends (...args: any) => infer R ? R[] : never)} ac
 */

/**
 * Create an empty Huffman table store for DC and AC tables (ids 0..3).
 * @returns {HuffmanStore}
 */
export function createHuffmanStore() {
  return { dc: [null, null, null, null], ac: [null, null, null, null] };
}

/**
 * Parse a DHT (Define Huffman Table) segment payload.
 *
 * Segment format (after marker and 2-byte length L): sequence of tables.
 * Each table:
 *  - 1 byte: Tc|Th (high nibble class: 0=DC,1=AC; low nibble id:0..3)
 *  - 16 bytes: Li counts for code lengths 1..16
 *  - Sum(Li) bytes: symbols in canonical order
 *
 * @param {Uint8Array} bytes Entire buffer
 * @param {number} offset Offset to start of DHT payload (immediately after the 2-byte length field)
 * @param {number} lengthPayload Length of payload in bytes (L-2)
 * @param {HuffmanStore} store Target store to fill dc/ac tables
 * @param {number} [fastBits=9] Width of primary fast decode table
 * @returns {number} newOffset (offset advanced by lengthPayload)
 */
export function parseDHTSegment(bytes, offset, lengthPayload, store, fastBits = 9) {
  if (lengthPayload < 0) throw new JPEGError("ERR_DHT_LENGTH", "negative payload length");
  const end = offset + lengthPayload;
  if (end > bytes.length) throw new JPEGError("ERR_DHT_LENGTH", "payload exceeds buffer");

  while (offset < end) {
    if (end - offset < 17) throw new JPEGError("ERR_DHT_LENGTH", "not enough bytes for header");
    const tcTh = bytes[offset++];
    const tc = tcTh >> 4;
    const th = tcTh & 0x0f;
    if (tc !== 0 && tc !== 1) throw new JPEGError("ERR_DHT_CLASS", `invalid table class ${tc}`);
    if (th < 0 || th > 3) throw new JPEGError("ERR_DHT_ID", `invalid table id ${th}`);

    // Read 16 code length counts
    /** @type {Uint8Array} */
    const L = bytes.subarray(offset, offset + 16);
    offset += 16;
    let symbolsCount = 0;
    for (let i = 0; i < 16; i++) symbolsCount += L[i];
    if (symbolsCount === 0) throw new JPEGError("ERR_DHT_EMPTY", "sum(lengths)==0");
    if (end - offset < symbolsCount) throw new JPEGError("ERR_DHT_LENGTH", "not enough bytes for symbols");

    const V = bytes.subarray(offset, offset + symbolsCount);
    offset += symbolsCount;

    // Build canonical table
    const table = buildHuffmanTable(L, V, fastBits);
    if (tc === 0) {
      store.dc[th] = table;
    } else {
      store.ac[th] = table;
    }
  }

  if (offset !== end) throw new JPEGError("ERR_DHT_LENGTH", "payload parsing did not consume exact length");
  return offset;
}

/**
 * Parse a DQT (Define Quantization Table) segment payload.
 * - Supports 8-bit and 16-bit entries; de-zigzags into natural order.
 * - Stores tables as Int32Array[64].
 * - Latest definition wins if redefined before use (per spec).
 *
 * @param {Uint8Array} bytes Entire buffer
 * @param {number} offset Offset to start of DQT payload (after the 2-byte length field)
 * @param {number} lengthPayload Length of payload in bytes (L-2)
 * @param {(Array<Int32Array|null>)} qtables Target store size 4 (ids 0..3)
 * @returns {number} newOffset
 */
export function parseDQTSegment(bytes, offset, lengthPayload, qtables) {
  if (lengthPayload < 0) throw new JPEGError("ERR_DQT_LENGTH", "negative payload length");
  const end = offset + lengthPayload;
  if (end > bytes.length) throw new JPEGError("ERR_DQT_LENGTH", "payload exceeds buffer");
  while (offset < end) {
    if (end - offset < 1) throw new JPEGError("ERR_DQT_LENGTH", "not enough bytes for table header");
    const pqTq = bytes[offset++];
    const pq = pqTq >> 4; // 0=8-bit, 1=16-bit
    const tq = pqTq & 0x0f; // 0..3
    if (pq !== 0 && pq !== 1) throw new JPEGError("ERR_DQT_PRECISION", `invalid precision ${pq}`);
    if (tq < 0 || tq > 3) throw new JPEGError("ERR_DQT_ID", `invalid table id ${tq}`);

    const entrySize = pq === 0 ? 1 : 2;
    const needed = 64 * entrySize;
    if (end - offset < needed) throw new JPEGError("ERR_DQT_LENGTH", "not enough bytes for 64 entries");

    const table = new Int32Array(64);
    if (pq === 0) {
      // 8-bit values
      for (let i = 0; i < 64; i++) {
        const zz = bytes[offset + i];
        const nat = zigZagToNatural[i];
        table[nat] = zz | 0;
      }
    } else {
      // 16-bit big-endian values
      let p = offset;
      for (let i = 0; i < 64; i++) {
        const hi = bytes[p++];
        const lo = bytes[p++];
        const val = (hi << 8) | lo;
        const nat = zigZagToNatural[i];
        table[nat] = val | 0;
      }
    }
    offset += needed;
    qtables[tq] = table;
  }
  if (offset !== end) throw new JPEGError("ERR_DQT_LENGTH", "payload parsing did not consume exact length");
  return offset;
}

/**
 * Parse SOF0 (baseline) or SOF2 (progressive) frame header and allocate component geometry.
 *
 * SOF structure:
 *  - P (precision, expect 8)
 *  - Y (height)
 *  - X (width)
 *  - Nf (number of components)
 *  - for i in 1..Nf: Ci, HiVi, Tqi
 *
 * Geometry:
 *  - Hmax = max(Hi), Vmax = max(Vi)
 *  - mcusPerLine  = ceil(width / (8*Hmax))
 *  - mcusPerColumn= ceil(height / (8*Vmax))
 *  - For component i:
 *      blocksPerLine   = ceil(ceil(width/8)  * Hi / Hmax)
 *      blocksPerColumn = ceil(ceil(height/8) * Vi / Vmax)
 *
 * Allocation:
 *  - Allocate zeroed Int16Array(64) per block for all components.
 *
 * @param {Uint8Array} bytes
 * @param {number} offset Offset to start of SOF payload (after 2-byte length)
 * @param {number} lengthPayload Payload length (L-2)
 * @param {boolean} progressive true for SOF2, false for SOF0
 * @param {Array<Int32Array|null>} qtables Quantization tables (ids 0..3) to reference (not required to be all present now)
 * @returns {Frame} frame
 */
export function parseSOFSegment(bytes, offset, lengthPayload, progressive, qtables) {
  const start = offset;
  const end = offset + lengthPayload;
  if (end > bytes.length) throw new JPEGError("ERR_SOF_LENGTH", "payload exceeds buffer");
  if (end - offset < 6) throw new JPEGError("ERR_SOF_LENGTH", "insufficient header bytes");
  const P = bytes[offset++];
  const Y = (bytes[offset++] << 8) | bytes[offset++];
  const X = (bytes[offset++] << 8) | bytes[offset++];
  const Nf = bytes[offset++];
  if (P !== 8) throw new JPEGError("ERR_SOF_PRECISION", `unsupported precision ${P}`);
  if (X <= 0 || Y <= 0) throw new JPEGError("ERR_SOF_DIMENSIONS", "non-positive width/height");
  if (Nf < 1 || Nf > 4) throw new JPEGError("ERR_SOF_COMPONENTS", `unsupported component count ${Nf}`);
  if (end - offset < Nf * 3) throw new JPEGError("ERR_SOF_LENGTH", "insufficient component bytes");

  /** @type {Component[]} */
  const components = new Array(Nf);
  let Hmax = 0;
  let Vmax = 0;
  for (let i = 0; i < Nf; i++) {
    const Ci = bytes[offset++];
    const HiVi = bytes[offset++];
    const Hi = HiVi >> 4;
    const Vi = HiVi & 0x0f;
    const Tqi = bytes[offset++];
    if (Hi < 1 || Hi > 4 || Vi < 1 || Vi > 4) throw new JPEGError("ERR_SOF_SAMPLING", `invalid sampling ${Hi}x${Vi}`);
    if (Tqi < 0 || Tqi > 3) throw new JPEGError("ERR_SOF_QUANT", `invalid quant table id ${Tqi}`);
    Hmax = Math.max(Hmax, Hi);
    Vmax = Math.max(Vmax, Vi);
    components[i] = {
      id: Ci,
      h: Hi,
      v: Vi,
      tq: Tqi,
      blocksPerLine: 0,
      blocksPerColumn: 0,
      blocks: [],
    };
  }

  // Compute geometry
  const mcusPerLine = Math.ceil(X / (8 * Hmax));
  const mcusPerColumn = Math.ceil(Y / (8 * Vmax));
  for (let i = 0; i < Nf; i++) {
    const comp = components[i];
    // Use direct MCU-based geometry to avoid double-ceil mismatches
    comp.blocksPerLine = mcusPerLine * comp.h;
    comp.blocksPerColumn = mcusPerColumn * comp.v;
  }

  // Allocate coefficient blocks (zeroed) per component
  for (let i = 0; i < Nf; i++) {
    const comp = components[i];
    const rows = comp.blocksPerColumn;
    const cols = comp.blocksPerLine;
    comp.blocks = new Array(rows);
    for (let r = 0; r < rows; r++) {
      const row = new Array(cols);
      for (let c = 0; c < cols; c++) row[c] = new Int16Array(64);
      comp.blocks[r] = row;
    }
  }

  if (offset !== end)
    throw new JPEGError("ERR_SOF_LENGTH", `payload not fully consumed (${end - offset} bytes remain)`);

  /** @type {Frame} */
  const frame = {
    precision: P,
    width: X,
    height: Y,
    components,
    Hmax,
    Vmax,
    mcusPerLine,
    mcusPerColumn,
    progressive: !!progressive,
    qtables,
    _consumed: end - start,
  };
  return frame;
}

/**
 * Parse SOS (Start of Scan) segment for baseline constraints.
 * Returns scan description: participating components with DC/AC table ids,
 * and spectral/approximation params (validated for baseline).
 *
 * @param {Uint8Array} bytes
 * @param {number} offset Offset after 2-byte length
 * @param {number} lengthPayload (L-2)
 * @param {ReturnType<typeof parseSOFSegment>} frame Parsed frame with components
 * @returns {{ components: { idx:number, id:number, td:number, ta:number }[], Ss:number, Se:number, Ah:number, Al:number }}
 */
/**
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @param {number} lengthPayload
 * @param {ReturnType<typeof parseSOFSegment>} frame
 */
/**
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @param {number} lengthPayload
 * @param {Frame} frame
 */
export function parseSOSSegment(bytes, offset, lengthPayload, frame) {
  const end = offset + lengthPayload;
  if (end > bytes.length) throw new JPEGError("ERR_SOS_LENGTH", "payload exceeds buffer");
  if (end - offset < 1) throw new JPEGError("ERR_SOS_LENGTH", "not enough bytes for Ns");
  const Ns = bytes[offset++];
  if (Ns < 1 || Ns > frame.components.length) throw new JPEGError("ERR_SOS_COMPONENTS", `invalid Ns ${Ns}`);
  if (end - offset < Ns * 2 + 3) throw new JPEGError("ERR_SOS_LENGTH", "insufficient bytes for components and params");
  const scanComps = [];
  for (let i = 0; i < Ns; i++) {
    const Cs = bytes[offset++];
    const tdta = bytes[offset++];
    const td = tdta >> 4;
    const ta = tdta & 0x0f;
    const idx = frame.components.findIndex((c) => c.id === Cs);
    if (idx === -1) throw new JPEGError("ERR_SOS_COMPONENTS", `component id ${Cs} not found in frame`);
    if (td < 0 || td > 3 || ta < 0 || ta > 3)
      throw new JPEGError("ERR_SOS_TABLES", `invalid table ids td=${td} ta=${ta}`);
    scanComps.push({ idx, id: Cs, td, ta });
  }
  const Ss = bytes[offset++];
  const Se = bytes[offset++];
  const AhAl = bytes[offset++];
  const Ah = AhAl >> 4;
  const Al = AhAl & 0x0f;
  if (!frame.progressive) {
    // Baseline constraints
    if (Ss !== 0 || Se !== 63 || Ah !== 0 || Al !== 0)
      throw new JPEGError("ERR_SOS_BASELINE", "baseline requires Ss=0 Se=63 Ah=0 Al=0");
  } else {
    // Progressive legality checks
    if (Ss === 0) {
      if (Se !== 0) throw new JPEGError("ERR_SOS_PROGRESSIVE", "DC scans must have Se=0");
      // Ah=0 (first) or Ah>0 (refine) allowed
    } else {
      if (Ss < 1 || Ss > 63) throw new JPEGError("ERR_SOS_PROGRESSIVE", "AC scans Ss out of range");
      if (Se < Ss || Se > 63) throw new JPEGError("ERR_SOS_PROGRESSIVE", "AC scans Se out of range");
      // Ah=0 (first) or Ah>0 (refine) allowed
    }
  }
  if (offset !== end)
    throw new JPEGError("ERR_SOS_LENGTH", `payload not fully consumed (${end - offset} bytes remain)`);
  return { components: scanComps, Ss, Se, Ah, Al };
}

/**
 * Parse DRI (Define Restart Interval) segment payload.
 * - Payload format: 2-byte big-endian Ri (MCUs per restart interval)
 * - Length should be 4 (including length field); here we receive L-2 in lengthPayload.
 *
 * @param {Uint8Array} bytes
 * @param {number} offset Offset after 2-byte length
 * @param {number} lengthPayload (L-2)
 * @returns {{ Ri: number, offset: number }}
 */
export function parseDRISegment(bytes, offset, lengthPayload) {
  if (lengthPayload !== 2) throw new JPEGError("ERR_DRI_LENGTH", `unexpected DRI payload length ${lengthPayload}`);
  if (offset + 2 > bytes.length) throw new JPEGError("ERR_DRI_LENGTH", "payload exceeds buffer");
  const Ri = (bytes[offset] << 8) | bytes[offset + 1];
  return { Ri, offset: offset + 2 };
}
