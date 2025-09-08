// @ts-nocheck
/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file IHDR chunk creation for PNG encoding.
 *
 * The IHDR (Image Header) chunk contains critical image information and must
 * be the first chunk in every PNG file. This module provides functions to
 * create properly formatted IHDR chunks from image parameters.
 *
 * IHDR chunk format (13 bytes):
 * - Width: 4 bytes (big-endian)
 * - Height: 4 bytes (big-endian)
 * - Bit depth: 1 byte
 * - Color type: 1 byte
 * - Compression method: 1 byte (always 0 for DEFLATE)
 * - Filter method: 1 byte (always 0 for adaptive filtering)
 * - Interlace method: 1 byte (0=none, 1=Adam7)
 *
 * @example
 * // Create IHDR chunk for 800x600 RGBA image
 * const ihdrData = createIHDRChunk(800, 600, 8, 6, 0, 0, 0);
 * console.log(`IHDR chunk: ${ihdrData.length} bytes`);
 */

/**
 * Creates IHDR chunk data for PNG encoding.
 *
 * @param {number} width - Image width in pixels (1-2^31-1)
 * @param {number} height - Image height in pixels (1-2^31-1)
 * @param {number} bitDepth - Bits per sample (1, 2, 4, 8, or 16)
 * @param {number} colorType - PNG color type (0, 2, 3, 4, or 6)
 * @param {number} compressionMethod - Compression method (always 0 for DEFLATE)
 * @param {number} filterMethod - Filter method (always 0 for adaptive)
 * @param {number} interlaceMethod - Interlace method (0=none, 1=Adam7)
 * @returns {Uint8Array} IHDR chunk data (13 bytes)
 */
export function createIHDRChunk(width, height, bitDepth, colorType, compressionMethod, filterMethod, interlaceMethod) {
  // Parameter validation
  if (!Number.isInteger(width) || width < 1 || width > 0x7fffffff) {
    throw new Error(`Invalid width: ${width} (must be integer 1-2147483647)`);
  }
  if (!Number.isInteger(height) || height < 1 || height > 0x7fffffff) {
    throw new Error(`Invalid height: ${height} (must be integer 1-2147483647)`);
  }
  if (![1, 2, 4, 8, 16].includes(bitDepth)) {
    throw new Error(`Invalid bit depth: ${bitDepth} (must be 1, 2, 4, 8, or 16)`);
  }
  if (![0, 2, 3, 4, 6].includes(colorType)) {
    throw new Error(`Invalid color type: ${colorType} (must be 0, 2, 3, 4, or 6)`);
  }
  if (compressionMethod !== 0) {
    throw new Error(`Invalid compression method: ${compressionMethod} (must be 0 for DEFLATE)`);
  }
  if (filterMethod !== 0) {
    throw new Error(`Invalid filter method: ${filterMethod} (must be 0 for adaptive)`);
  }
  if (![0, 1].includes(interlaceMethod)) {
    throw new Error(`Invalid interlace method: ${interlaceMethod} (must be 0 or 1)`);
  }

  // Validate bit depth and color type combinations
  validateBitDepthColorType(bitDepth, colorType);

  // Create 13-byte IHDR chunk data
  const ihdrData = new Uint8Array(13);
  let offset = 0;

  // Width (4 bytes, big-endian)
  ihdrData[offset++] = (width >>> 24) & 0xff;
  ihdrData[offset++] = (width >>> 16) & 0xff;
  ihdrData[offset++] = (width >>> 8) & 0xff;
  ihdrData[offset++] = width & 0xff;

  // Height (4 bytes, big-endian)
  ihdrData[offset++] = (height >>> 24) & 0xff;
  ihdrData[offset++] = (height >>> 16) & 0xff;
  ihdrData[offset++] = (height >>> 8) & 0xff;
  ihdrData[offset++] = height & 0xff;

  // Bit depth (1 byte)
  ihdrData[offset++] = bitDepth;

  // Color type (1 byte)
  ihdrData[offset++] = colorType;

  // Compression method (1 byte)
  ihdrData[offset++] = compressionMethod;

  // Filter method (1 byte)
  ihdrData[offset++] = filterMethod;

  // Interlace method (1 byte)
  ihdrData[offset++] = interlaceMethod;

  return ihdrData;
}

/**
 * Validates bit depth and color type combination according to PNG specification.
 *
 * @param {number} bitDepth - Bits per sample
 * @param {number} colorType - PNG color type
 * @throws {Error} If combination is invalid
 */
function validateBitDepthColorType(bitDepth, colorType) {
  const validCombinations = {
    0: [1, 2, 4, 8, 16], // Grayscale
    2: [8, 16], // RGB
    3: [1, 2, 4, 8], // Palette
    4: [8, 16], // Grayscale + Alpha
    6: [8, 16], // RGB + Alpha
  };

  const validBitDepths = validCombinations[colorType];
  if (!validBitDepths || !validBitDepths.includes(bitDepth)) {
    throw new Error(
      `Invalid bit depth ${bitDepth} for color type ${colorType}. ` +
        `Valid bit depths: ${validBitDepths ? validBitDepths.join(", ") : "none"}`
    );
  }
}

/**
 * Creates IHDR chunk data from image properties.
 *
 * @param {{width: number, height: number, bitDepth: number, colorType: number, interlaceMethod?: number}} imageInfo - Image properties
 * @returns {Uint8Array} IHDR chunk data (13 bytes)
 */
export function createIHDRFromImageInfo(imageInfo) {
  const { width, height, bitDepth, colorType, interlaceMethod = 0 } = imageInfo;

  return createIHDRChunk(
    width,
    height,
    bitDepth,
    colorType,
    0, // compression method (always 0)
    0, // filter method (always 0)
    interlaceMethod
  );
}

/**
 * Gets the number of samples per pixel for a given color type.
 *
 * @param {number} colorType - PNG color type
 * @returns {number} Samples per pixel
 */
export function getSamplesPerPixel(colorType) {
  switch (colorType) {
    case 0:
      return 1; // Grayscale
    case 2:
      return 3; // RGB
    case 3:
      return 1; // Palette (index)
    case 4:
      return 2; // Grayscale + Alpha
    case 6:
      return 4; // RGB + Alpha
    default:
      throw new Error(`Invalid color type: ${colorType}`);
  }
}

/**
 * Gets the number of bytes per pixel for given bit depth and color type.
 *
 * @param {number} bitDepth - Bits per sample
 * @param {number} colorType - PNG color type
 * @returns {number} Bytes per pixel (may be fractional for bit depths < 8)
 */
export function getBytesPerPixel(bitDepth, colorType) {
  const samplesPerPixel = getSamplesPerPixel(colorType);
  const bitsPerPixel = bitDepth * samplesPerPixel;
  return Math.ceil(bitsPerPixel / 8);
}

/**
 * Gets the scanline width in bytes for given image parameters.
 *
 * @param {number} width - Image width in pixels
 * @param {number} bitDepth - Bits per sample
 * @param {number} colorType - PNG color type
 * @returns {number} Scanline width in bytes (including filter byte)
 */
export function getScanlineWidth(width, bitDepth, colorType) {
  const samplesPerPixel = getSamplesPerPixel(colorType);
  const bitsPerScanline = width * bitDepth * samplesPerPixel;
  const bytesPerScanline = Math.ceil(bitsPerScanline / 8);
  return bytesPerScanline + 1; // +1 for filter byte
}
