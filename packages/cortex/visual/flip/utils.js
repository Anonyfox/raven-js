/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Utility functions for image flipping operations.
 *
 * This module provides validation and helper functions for flipping RGBA pixel data
 * horizontally and vertically. All functions are designed to be pure and testable
 * in isolation with V8-optimized performance.
 *
 * @example
 * // Validate flip parameters
 * validateFlipParameters(pixels, 800, 600, "horizontal");
 *
 * // Get pixel index
 * const index = getPixelIndex(100, 50, 800);
 *
 * // Copy pixel data
 * copyPixel(src, dst, srcIndex, dstIndex);
 */

/**
 * Validates flip parameters for correctness and safety.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {string} direction - Flip direction ("horizontal" or "vertical")
 * @throws {Error} If any parameter is invalid
 */
export function validateFlipParameters(pixels, width, height, direction) {
  // Validate pixel data
  if (!(pixels instanceof Uint8Array)) {
    throw new Error("Pixels must be a Uint8Array");
  }

  // Validate dimensions
  if (!Number.isInteger(width) || width <= 0) {
    throw new Error(`Invalid width: ${width}. Must be positive integer`);
  }
  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`Invalid height: ${height}. Must be positive integer`);
  }

  // Validate pixel data size
  const expectedSize = width * height * 4; // RGBA = 4 bytes per pixel
  if (pixels.length !== expectedSize) {
    throw new Error(`Invalid pixel data size: expected ${expectedSize}, got ${pixels.length}`);
  }

  // Validate direction
  if (direction !== "horizontal" && direction !== "vertical") {
    throw new Error(`Invalid flip direction: ${direction}. Must be "horizontal" or "vertical"`);
  }
}

/**
 * Gets the pixel index for RGBA data at given coordinates.
 * Each pixel is 4 bytes (R, G, B, A) in row-major order.
 *
 * @param {number} x - X coordinate (column)
 * @param {number} y - Y coordinate (row)
 * @param {number} width - Image width in pixels
 * @returns {number} Byte index in RGBA array
 */
export function getPixelIndex(x, y, width) {
  return (y * width + x) * 4;
}

/**
 * Copies a single RGBA pixel from source to destination array.
 *
 * @param {Uint8Array} src - Source RGBA pixel data
 * @param {Uint8Array} dst - Destination RGBA pixel data
 * @param {number} srcIndex - Source pixel byte index
 * @param {number} dstIndex - Destination pixel byte index
 */
export function copyPixel(src, dst, srcIndex, dstIndex) {
  dst[dstIndex] = src[srcIndex]; // Red
  dst[dstIndex + 1] = src[srcIndex + 1]; // Green
  dst[dstIndex + 2] = src[srcIndex + 2]; // Blue
  dst[dstIndex + 3] = src[srcIndex + 3]; // Alpha
}

/**
 * Swaps two pixels in the same RGBA array.
 * More efficient than copying when doing in-place operations.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} index1 - First pixel byte index
 * @param {number} index2 - Second pixel byte index
 */
export function swapPixels(pixels, index1, index2) {
  // Swap Red
  const tempR = pixels[index1];
  pixels[index1] = pixels[index2];
  pixels[index2] = tempR;

  // Swap Green
  const tempG = pixels[index1 + 1];
  pixels[index1 + 1] = pixels[index2 + 1];
  pixels[index2 + 1] = tempG;

  // Swap Blue
  const tempB = pixels[index1 + 2];
  pixels[index1 + 2] = pixels[index2 + 2];
  pixels[index2 + 2] = tempB;

  // Swap Alpha
  const tempA = pixels[index1 + 3];
  pixels[index1 + 3] = pixels[index2 + 3];
  pixels[index2 + 3] = tempA;
}

/**
 * Copies an entire row of pixels from source to destination.
 * Optimized for horizontal operations.
 *
 * @param {Uint8Array} src - Source RGBA pixel data
 * @param {Uint8Array} dst - Destination RGBA pixel data
 * @param {number} srcRow - Source row index
 * @param {number} dstRow - Destination row index
 * @param {number} width - Image width in pixels
 */
export function copyRow(src, dst, srcRow, dstRow, width) {
  const srcStart = srcRow * width * 4;
  const dstStart = dstRow * width * 4;
  const rowBytes = width * 4;

  // Use TypedArray.set() for efficient copying
  dst.set(src.subarray(srcStart, srcStart + rowBytes), dstStart);
}

/**
 * Swaps two rows of pixels in the same RGBA array.
 * More efficient for in-place vertical flipping.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} row1 - First row index
 * @param {number} row2 - Second row index
 * @param {number} width - Image width in pixels
 */
export function swapRows(pixels, row1, row2, width) {
  const index1 = row1 * width * 4;
  const index2 = row2 * width * 4;
  const rowBytes = width * 4;

  // Create temporary buffer for one row
  const temp = new Uint8Array(rowBytes);

  // Copy row1 to temp
  temp.set(pixels.subarray(index1, index1 + rowBytes));

  // Copy row2 to row1
  pixels.set(pixels.subarray(index2, index2 + rowBytes), index1);

  // Copy temp to row2
  pixels.set(temp, index2);
}
