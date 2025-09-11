/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * VP8L LZ77 Decoder
 *
 * Implements LZ77-style backward references for VP8L lossless compression.
 * Supports overlap-safe copying and length/distance decoding.
 *
 * @fileoverview Zero-dependency LZ77 decoder with strict bounds checking
 */

/**
 * Maximum backward reference distance allowed in VP8L
 */
const MAX_DISTANCE = 32768;

/**
 * Maximum copy length for a single LZ77 operation
 */
const MAX_LENGTH = 4096;

/**
 * Performs overlap-safe LZ77 copy operation.
 *
 * Copies `length` pixels from `distance` pixels back in the destination array.
 * Handles overlapping source and destination correctly by copying one pixel at a time.
 *
 * @param {Uint32Array} dst - Destination array (ARGB packed pixels)
 * @param {number} dstPos - Current position in destination
 * @param {number} distance - Backward distance to copy from (1-based)
 * @param {number} length - Number of pixels to copy
 * @throws {Error} For invalid parameters or bounds violations
 */
export function lz77Copy(dst, dstPos, distance, length) {
  if (!(dst instanceof Uint32Array)) {
    throw new Error("LZ77: destination must be Uint32Array");
  }

  if (!Number.isInteger(dstPos) || dstPos < 0 || dstPos >= dst.length) {
    throw new Error(`LZ77: invalid destination position ${dstPos}`);
  }

  if (!Number.isInteger(distance) || distance < 1 || distance > MAX_DISTANCE) {
    throw new Error(`LZ77: invalid distance ${distance} (must be 1-${MAX_DISTANCE})`);
  }

  if (!Number.isInteger(length) || length < 1 || length > MAX_LENGTH) {
    throw new Error(`LZ77: invalid length ${length} (must be 1-${MAX_LENGTH})`);
  }

  // Check bounds
  const srcPos = dstPos - distance;
  if (srcPos < 0) {
    throw new Error(`LZ77: distance ${distance} exceeds available data at position ${dstPos}`);
  }

  if (dstPos + length > dst.length) {
    throw new Error(`LZ77: copy would exceed destination bounds (${dstPos + length} > ${dst.length})`);
  }

  // Perform overlap-safe copy
  // Must copy one pixel at a time to handle overlapping regions correctly
  for (let i = 0; i < length; i++) {
    dst[dstPos + i] = dst[srcPos + i];
  }
}

/**
 * Decodes LZ77 length from a length code.
 *
 * VP8L uses a specific encoding for copy lengths:
 * - Codes 0-255: literal length (code + 1)
 * - Codes 256+: encoded using extra bits
 *
 * @param {number} lengthCode - Encoded length code
 * @param {object} reader - Bit reader for extra bits
 * @returns {number} Decoded length
 * @throws {Error} For invalid length codes
 */
export function decodeLZ77Length(lengthCode, reader) {
  if (!Number.isInteger(lengthCode) || lengthCode < 0) {
    throw new Error(`LZ77: invalid length code ${lengthCode}`);
  }

  // Direct encoding for small lengths
  if (lengthCode < 256) {
    return lengthCode + 1; // Lengths are 1-based
  }

  // For codes 256+, use extra bits table
  // This is a simplified version - full VP8L has a complex table
  const extraBitsTable = [
    { base: 3, bits: 0 }, // Code 256: length 3
    { base: 4, bits: 0 }, // Code 257: length 4
    { base: 5, bits: 0 }, // Code 258: length 5
    { base: 6, bits: 1 }, // Code 259: length 6-7
    { base: 8, bits: 1 }, // Code 260: length 8-9
    { base: 10, bits: 2 }, // Code 261: length 10-13
    { base: 14, bits: 2 }, // Code 262: length 14-17
    { base: 18, bits: 3 }, // Code 263: length 18-25
    { base: 26, bits: 3 }, // Code 264: length 26-33
    { base: 34, bits: 4 }, // Code 265: length 34-49
    { base: 50, bits: 4 }, // Code 266: length 50-65
    { base: 66, bits: 5 }, // Code 267: length 66-97
    { base: 98, bits: 5 }, // Code 268: length 98-129
    { base: 130, bits: 6 }, // Code 269: length 130-193
    { base: 194, bits: 6 }, // Code 270: length 194-257
    { base: 258, bits: 7 }, // Code 271: length 258-385
  ];

  const tableIndex = lengthCode - 256;
  if (tableIndex >= extraBitsTable.length) {
    throw new Error(`LZ77: unsupported length code ${lengthCode}`);
  }

  const entry = extraBitsTable[tableIndex];
  let extraBits = 0;

  if (entry.bits > 0) {
    // @ts-expect-error - reader validated to have readBits method
    if (!reader || typeof reader.readBits !== "function") {
      throw new Error("LZ77: reader required for length codes with extra bits");
    }
    // @ts-expect-error - reader validated above
    extraBits = reader.readBits(entry.bits);
  }

  return entry.base + extraBits;
}

/**
 * Decodes LZ77 distance from a distance code.
 *
 * VP8L uses a specific encoding for backward distances:
 * - Codes 0-3: short distances (1-4)
 * - Codes 4+: encoded using extra bits
 *
 * @param {number} distanceCode - Encoded distance code
 * @param {object} reader - Bit reader for extra bits
 * @returns {number} Decoded distance
 * @throws {Error} For invalid distance codes
 */
export function decodeLZ77Distance(distanceCode, reader) {
  if (!Number.isInteger(distanceCode) || distanceCode < 0) {
    throw new Error(`LZ77: invalid distance code ${distanceCode}`);
  }

  // Direct encoding for short distances
  if (distanceCode < 4) {
    return distanceCode + 1; // Distances are 1-based
  }

  // For codes 4+, calculate extra bits needed
  const extraBits = Math.floor((distanceCode - 2) / 2);
  const baseDistance = 1 + (1 << (extraBits + 1)) + ((distanceCode - 2) & 1) * (1 << extraBits);

  if (extraBits > 0) {
    // @ts-expect-error - reader validated to have readBits method
    if (!reader || typeof reader.readBits !== "function") {
      throw new Error("LZ77: reader required for distance codes with extra bits");
    }
    // @ts-expect-error - reader validated above
    const extra = reader.readBits(extraBits);
    return baseDistance + extra;
  }

  return baseDistance;
}

/**
 * Validates LZ77 parameters for safety.
 *
 * @param {Uint32Array} dst - Destination array
 * @param {number} position - Current position
 * @param {number} distance - Backward distance
 * @param {number} length - Copy length
 * @returns {{
 *   valid: boolean,
 *   error?: string,
 *   srcPos: number,
 *   endPos: number
 * }} Validation result
 */
export function validateLZ77Copy(dst, position, distance, length) {
  try {
    if (!(dst instanceof Uint32Array)) {
      return { valid: false, error: "destination must be Uint32Array", srcPos: 0, endPos: 0 };
    }

    if (position < 0 || position >= dst.length) {
      return { valid: false, error: `invalid position ${position}`, srcPos: 0, endPos: 0 };
    }

    if (distance < 1 || distance > MAX_DISTANCE) {
      return { valid: false, error: `invalid distance ${distance}`, srcPos: 0, endPos: 0 };
    }

    if (length < 1 || length > MAX_LENGTH) {
      return { valid: false, error: `invalid length ${length}`, srcPos: 0, endPos: 0 };
    }

    const srcPos = position - distance;
    const endPos = position + length;

    if (srcPos < 0) {
      return { valid: false, error: `distance exceeds available data`, srcPos, endPos };
    }

    if (endPos > dst.length) {
      return { valid: false, error: `copy exceeds bounds`, srcPos, endPos };
    }

    return { valid: true, srcPos, endPos };
  } catch (error) {
    return { valid: false, error: error.message, srcPos: 0, endPos: 0 };
  }
}

/**
 * Performs a batch of LZ77 operations.
 *
 * @param {Uint32Array} dst - Destination array
 * @param {Array<{pos: number, distance: number, length: number}>} operations - LZ77 operations
 * @throws {Error} For any invalid operation
 */
export function batchLZ77Copy(dst, operations) {
  if (!Array.isArray(operations)) {
    throw new Error("LZ77: operations must be array");
  }

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (!op || typeof op !== "object") {
      throw new Error(`LZ77: invalid operation at index ${i}`);
    }

    const { pos, distance, length } = op;
    try {
      lz77Copy(dst, pos, distance, length);
    } catch (error) {
      throw new Error(`LZ77: operation ${i} failed: ${error.message}`);
    }
  }
}

/**
 * Creates a simple color cache for LZ77 operations.
 * VP8L uses a color cache to store recently used colors for efficient encoding.
 *
 * @param {number} bits - Number of bits for cache size (cache size = 2^bits)
 * @returns {object} Color cache with get/set methods
 * @throws {Error} For invalid cache size
 */
export function createColorCache(bits) {
  if (!Number.isInteger(bits) || bits < 0 || bits > 11) {
    throw new Error(`LZ77: invalid cache bits ${bits} (must be 0-11)`);
  }

  const size = 1 << bits;
  const cache = new Uint32Array(size);
  let index = 0;

  return {
    /**
     * Gets a color from the cache.
     *
     * @param {number} idx - Cache index
     * @returns {number} ARGB color value
     * @throws {Error} For invalid index
     */
    get(idx) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= size) {
        throw new Error(`ColorCache: invalid index ${idx}`);
      }
      return cache[idx];
    },

    /**
     * Stores a color in the cache.
     *
     * @param {number} color - ARGB color value
     * @returns {number} Cache index where color was stored
     */
    set(color) {
      cache[index] = color;
      const currentIndex = index;
      index = (index + 1) % size;
      return currentIndex;
    },

    /**
     * Calculates cache index for a color (without storing).
     *
     * @param {number} color - ARGB color value
     * @returns {number} Cache index for this color
     */
    indexOf(color) {
      // VP8L uses a hash function: (color * 0x1e35a7bd) >> (32 - bits)
      return ((color * 0x1e35a7bd) >>> (32 - bits)) & (size - 1);
    },

    /**
     * Clears the cache.
     */
    clear() {
      cache.fill(0);
      index = 0;
    },

    /**
     * Gets cache size.
     *
     * @returns {number} Cache size
     */
    size() {
      return size;
    },
  };
}
