/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file VP8X header parsing - Extended WebP header parsing and validation.
 *
 * Parses VP8X chunks to extract:
 * - Canvas dimensions (24-bit width/height)
 * - Feature flags (ICC, Alpha, EXIF, XMP, Animation, Tiles)
 * - Validation of extended format constraints
 *
 * All parsing uses precise bit manipulation and strict validation.
 */

/**
 * Parse VP8X extended header chunk.
 *
 * @param {Uint8Array} data - VP8X chunk data (exactly 10 bytes)
 * @returns {{
 *   width: number,
 *   height: number,
 *   flags: {
 *     icc: boolean,
 *     alpha: boolean,
 *     exif: boolean,
 *     xmp: boolean,
 *     anim: boolean,
 *     tiles: boolean
 *   }
 * }}
 * @throws {Error} Invalid VP8X header format or dimensions
 */
export function parseVP8X(data) {
  if (data.length !== 10) {
    throw new Error(`VP8X: invalid header size (expected 10, got ${data.length})`);
  }

  // Parse feature flags from byte 0
  const flagByte = data[0];
  const flags = {
    icc: !!(flagByte & 0x20), // bit 5
    alpha: !!(flagByte & 0x10), // bit 4
    exif: !!(flagByte & 0x08), // bit 3
    xmp: !!(flagByte & 0x04), // bit 2
    anim: !!(flagByte & 0x02), // bit 1
    tiles: !!(flagByte & 0x01), // bit 0
  };

  // Bytes 1-3 are reserved (should be 0)
  if (data[1] !== 0 || data[2] !== 0 || data[3] !== 0) {
    throw new Error(
      `VP8X: reserved bytes must be zero (got 0x${data[1].toString(16).padStart(2, "0")}${data[2].toString(16).padStart(2, "0")}${data[3].toString(16).padStart(2, "0")})`
    );
  }

  // Parse 24-bit little-endian canvas dimensions (stored as width-1, height-1)
  const widthMinus1 = data[4] | (data[5] << 8) | (data[6] << 16);
  const heightMinus1 = data[7] | (data[8] << 8) | (data[9] << 16);

  const width = widthMinus1 + 1;
  const height = heightMinus1 + 1;

  // Validate dimensions
  if (width <= 0 || height <= 0) {
    throw new Error(`VP8X: invalid dimensions ${width}x${height} (must be positive)`);
  }

  if (width > 16384 || height > 16384) {
    throw new Error(`VP8X: dimensions ${width}x${height} exceed maximum 16384x16384`);
  }

  return { width, height, flags };
}

/**
 * Validate VP8X feature flags against available chunks.
 *
 * @param {{icc: boolean, alpha: boolean, exif: boolean, xmp: boolean, anim: boolean, tiles: boolean}} flags - VP8X flags
 * @param {Map<string, Array<{type: string, data: Uint8Array}>>} chunksByType - Available chunks by type
 * @returns {Array<string>} Array of validation errors (empty if valid)
 */
export function validateVP8XFeatures(flags, chunksByType) {
  const errors = [];

  // Check mandatory chunks for set flags
  if (flags.alpha && !chunksByType.has("ALPH")) {
    errors.push("VP8X: Alpha flag set but no ALPH chunk found");
  }

  if (flags.icc && !chunksByType.has("ICCP")) {
    errors.push("VP8X: ICC flag set but no ICCP chunk found");
  }

  if (flags.exif && !chunksByType.has("EXIF")) {
    errors.push("VP8X: EXIF flag set but no EXIF chunk found");
  }

  if (flags.xmp && !chunksByType.has("XMP ")) {
    errors.push("VP8X: XMP flag set but no XMP chunk found");
  }

  if (flags.anim && !chunksByType.has("ANIM")) {
    errors.push("VP8X: Animation flag set but no ANIM chunk found");
  }

  // Check for contradictory chunks (chunks present but flag not set)
  if (!flags.alpha && chunksByType.has("ALPH")) {
    errors.push("VP8X: ALPH chunk present but Alpha flag not set");
  }

  if (!flags.icc && chunksByType.has("ICCP")) {
    errors.push("VP8X: ICCP chunk present but ICC flag not set");
  }

  if (!flags.exif && chunksByType.has("EXIF")) {
    errors.push("VP8X: EXIF chunk present but EXIF flag not set");
  }

  if (!flags.xmp && chunksByType.has("XMP ")) {
    errors.push("VP8X: XMP chunk present but XMP flag not set");
  }

  if (!flags.anim && chunksByType.has("ANIM")) {
    errors.push("VP8X: ANIM chunk present but Animation flag not set");
  }

  return errors;
}
