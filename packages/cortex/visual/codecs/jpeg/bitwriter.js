/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG entropy bit writer with 0xFF byte stuffing.
 *
 * MSB-first bit packing. Whenever an emitted byte equals 0xFF, we write a stuffed 0x00 byte next.
 * Flush pads with 1-bits to next byte boundary per JPEG.
 */

/**
 * @typedef {Object} BitWriter
 * @property {(code:number, len:number)=>void} writeBits Append len (1..16) MSB-first bits from code
 * @property {(byte:number)=>void} writeByte Append a raw byte (used for markers’ payload where needed)
 * @property {(marker:number)=>void} writeMarker Append a restart marker byte pair 0xFF,0xD0..0xD7 (requires alignment)
 * @property {()=>void} align Flush pending bits by padding with 1s to byte boundary
 * @property {()=>Uint8Array} toUint8Array Finalize and get the written bytes
 * @property {number} length Current byte length (without pending bits)
 */

/**
 * Create a bit writer with internal growable buffer.
 * @returns {BitWriter}
 */
export function createBitWriter() {
  /** @type {number[]} */
  const out = [];
  let bitBuffer = 0;
  let bitCount = 0;

  /** @param {number} b */
  function emitByte(b) {
    const v = b & 0xff;
    out.push(v);
    if (v === 0xff) out.push(0x00); // byte stuffing
  }

  /**
   * @param {number} code
   * @param {number} len
   */
  function writeBits(code, len) {
    if (len === 0) return;
    if (len < 0 || len > 24) throw new Error("ERR_BITLEN: len out of range");
    // Keep only low len bits
    const mask = len === 32 ? 0xffffffff : (1 << len) - 1;
    const val = code & mask;
    bitBuffer = (bitBuffer << len) | val;
    bitCount += len;
    while (bitCount >= 8) {
      bitCount -= 8;
      const byte = (bitBuffer >>> bitCount) & 0xff;
      // Clear consumed bits
      bitBuffer &= (1 << bitCount) - 1;
      emitByte(byte);
    }
  }

  /** @param {number} byte */
  function writeByte(byte) {
    if (bitCount !== 0) throw new Error("ERR_ALIGN: writeByte requires byte alignment");
    emitByte(byte & 0xff);
  }

  /** @param {number} marker */
  function writeMarker(marker) {
    if (bitCount !== 0) throw new Error("ERR_MARKER_ALIGN: marker requires byte alignment");
    // Raw marker bytes without stuffing
    out.push(0xff, marker & 0xff);
  }

  function align() {
    if (bitCount > 0) {
      // Pad with 1s to next byte boundary
      const rem = bitCount & 7;
      const need = (8 - rem) & 7;
      if (need > 0) writeBits((1 << need) - 1, need);
      if ((bitCount & 7) !== 0) throw new Error("ERR_ALIGN_INTERNAL");
      // After above, bitCount%8==0; emit any full bytes remaining
      while (bitCount >= 8) {
        bitCount -= 8;
        const byte = (bitBuffer >>> bitCount) & 0xff;
        bitBuffer &= (1 << bitCount) - 1;
        emitByte(byte);
      }
    }
  }

  function toUint8Array() {
    if (bitCount !== 0) throw new Error("ERR_FINALIZE_ALIGN: pending bits not flushed");
    return Uint8Array.from(out);
  }

  return {
    writeBits,
    writeByte,
    writeMarker,
    align,
    toUint8Array,
    get length() {
      return out.length;
    },
  };
}
