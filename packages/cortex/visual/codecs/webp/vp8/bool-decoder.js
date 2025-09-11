/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file VP8 Boolean arithmetic decoder for entropy coding.
 *
 * Implements VP8's range-based boolean arithmetic decoder with renormalization.
 * Maintains constant-time operation per bit for security and predictable performance.
 */

/**
 * Create a VP8 boolean arithmetic decoder.
 *
 * The decoder maintains a range [0, range) and a value within that range.
 * Each bit is decoded by splitting the range based on probability and comparing
 * the value to determine which half it falls in.
 *
 * @param {Uint8Array} view - Input data buffer
 * @param {number} start - Start offset in buffer
 * @param {number} end - End offset in buffer (exclusive)
 * @returns {Object} Boolean decoder instance
 * @throws {Error} Invalid buffer or range
 */
export function createBoolDecoder(view, start, end) {
  if (!(view instanceof Uint8Array)) {
    throw new Error("BoolDecoder: view must be Uint8Array");
  }

  if (start < 0 || end > view.length || start >= end) {
    throw new Error(`BoolDecoder: invalid range [${start}, ${end}) for buffer of length ${view.length}`);
  }

  if (end - start < 2) {
    throw new Error(`BoolDecoder: need at least 2 bytes for initialization (got ${end - start})`);
  }

  // Initialize decoder state
  let pos = start;
  let range = 255; // Initial range [0, 255]
  let value = 0; // Current value within range
  let count = -8; // Number of bits available in value (negative means we need to load)

  // Load initial bytes
  if (pos < end) {
    value = view[pos++] << 8;
  }
  if (pos < end) {
    value |= view[pos++];
  }

  /**
   * Read a single bit with given probability.
   *
   * @param {number} prob - Probability of bit being 1 (0-255)
   * @returns {0|1} Decoded bit
   * @throws {Error} Invalid probability or insufficient data
   */
  function readBit(prob) {
    if (typeof prob !== "number" || prob < 0 || prob > 255) {
      throw new Error(`BoolDecoder: probability must be 0-255 (got ${prob})`);
    }

    // Split range based on probability
    const split = 1 + (((range - 1) * prob) >> 8);

    let bit;

    if (value >= split << 8) {
      // Bit is 1, use upper half
      bit = 1;
      range -= split;
      value -= split << 8;
    } else {
      // Bit is 0, use lower half
      bit = 0;
      range = split;
    }

    // Renormalize if range becomes too small
    while (range < 128) {
      value <<= 1;
      range <<= 1;

      if (++count >= 0) {
        count = -8;
        if (pos < end) {
          value |= view[pos++];
        }
      }
    }

    return /** @type {0|1} */ (bit);
  }

  /**
   * Read n-bit literal value (uniform probability).
   *
   * @param {number} n - Number of bits to read (1-24)
   * @returns {number} Decoded value
   * @throws {Error} Invalid bit count
   */
  function readLiteral(n) {
    if (typeof n !== "number" || n < 1 || n > 24) {
      throw new Error(`BoolDecoder: literal bits must be 1-24 (got ${n})`);
    }

    let result = 0;
    for (let i = 0; i < n; i++) {
      result = (result << 1) | readBit(128); // 50% probability
    }
    return result;
  }

  /**
   * Get current bit position for debugging/validation.
   *
   * @returns {number} Approximate bit position
   */
  function tell() {
    return (pos - start) * 8 + count;
  }

  /**
   * Check if decoder has more data available.
   *
   * @returns {boolean} True if more data is available
   */
  function hasData() {
    return pos < end || count < 0;
  }

  return {
    readBit,
    readLiteral,
    tell,
    hasData,
  };
}
