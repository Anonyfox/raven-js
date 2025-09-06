/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main flipping functionality for RGBA pixel data.
 *
 * This module provides efficient horizontal and vertical flipping operations
 * for RGBA pixel data. Flipping is a lossless operation that rearranges
 * pixels without any interpolation or quality loss.
 *
 * @example
 * // Flip horizontally (mirror left-right)
 * const result = flipPixels(pixels, 800, 600, "horizontal");
 *
 * // Flip vertically (mirror top-bottom)
 * const result = flipPixels(pixels, 800, 600, "vertical");
 */

import { copyPixel, copyRow, getPixelIndex, swapPixels, swapRows, validateFlipParameters } from "./utils.js";

/**
 * Flips RGBA pixel data horizontally or vertically.
 *
 * This function provides efficient flipping operations:
 * - Horizontal: mirrors the image left-to-right
 * - Vertical: mirrors the image top-to-bottom
 *
 * The operation is performed in-place when possible for optimal performance,
 * or creates a new array when necessary.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {"horizontal"|"vertical"} direction - Flip direction
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Flipped image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Horizontal flip (mirror left-right)
 * const result = flipPixels(pixels, 800, 600, "horizontal");
 *
 * // Vertical flip (mirror top-bottom)
 * const result = flipPixels(pixels, 800, 600, "vertical");
 *
 * // Create new array instead of modifying original
 * const result = flipPixels(pixels, 800, 600, "horizontal", false);
 */
export function flipPixels(pixels, width, height, direction, inPlace = true) {
  // Validate all parameters
  validateFlipParameters(pixels, width, height, direction);

  // Choose the appropriate flipping algorithm
  if (direction === "horizontal") {
    return flipHorizontal(pixels, width, height, inPlace);
  } else {
    return flipVertical(pixels, width, height, inPlace);
  }
}

/**
 * Flips image horizontally (mirrors left-to-right).
 * Each row is reversed, so the leftmost pixel becomes rightmost.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {boolean} inPlace - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Flipped image data
 */
export function flipHorizontal(pixels, width, height, inPlace) {
  const output = inPlace ? pixels : new Uint8Array(pixels);

  // Process each row
  for (let y = 0; y < height; y++) {
    // Swap pixels from both ends of the row, working towards center
    for (let x = 0; x < Math.floor(width / 2); x++) {
      const leftIndex = getPixelIndex(x, y, width);
      const rightIndex = getPixelIndex(width - 1 - x, y, width);

      if (inPlace) {
        swapPixels(output, leftIndex, rightIndex);
      } else {
        // Copy pixels to swapped positions
        copyPixel(pixels, output, leftIndex, rightIndex);
        copyPixel(pixels, output, rightIndex, leftIndex);
      }
    }
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Flips image vertically (mirrors top-to-bottom).
 * Rows are reversed, so the top row becomes the bottom row.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {boolean} inPlace - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Flipped image data
 */
export function flipVertical(pixels, width, height, inPlace) {
  const output = inPlace ? pixels : new Uint8Array(pixels);

  // Process pairs of rows from top/bottom working towards center
  for (let y = 0; y < Math.floor(height / 2); y++) {
    const topRow = y;
    const bottomRow = height - 1 - y;

    if (inPlace) {
      swapRows(output, topRow, bottomRow, width);
    } else {
      // Copy rows to swapped positions
      copyRow(pixels, output, topRow, bottomRow, width);
      copyRow(pixels, output, bottomRow, topRow, width);
    }
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Optimized horizontal flip using row-based processing.
 * Processes entire rows at once for better cache performance.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {boolean} inPlace - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Flipped image data
 */
export function flipHorizontalOptimized(pixels, width, height, inPlace) {
  const output = inPlace ? pixels : new Uint8Array(pixels);

  // Process each row with optimized pixel swapping
  for (let y = 0; y < height; y++) {
    const rowStart = y * width * 4;
    const rowEnd = rowStart + width * 4;

    // Create temporary buffer for the row
    const rowData = output.subarray(rowStart, rowEnd);

    // Reverse the row by swapping 4-byte pixels
    for (let i = 0; i < width * 2; i += 4) {
      const leftPixel = i;
      const rightPixel = (width - 1) * 4 - i;

      if (leftPixel >= rightPixel) break;

      // Swap RGBA values
      for (let channel = 0; channel < 4; channel++) {
        const temp = rowData[leftPixel + channel];
        rowData[leftPixel + channel] = rowData[rightPixel + channel];
        rowData[rightPixel + channel] = temp;
      }
    }
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Gets information about a flip operation without performing it.
 * Useful for validation and UI feedback.
 *
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {"horizontal"|"vertical"} direction - Flip direction
 * @returns {{
 *   direction: string,
 *   outputDimensions: {width: number, height: number},
 *   isLossless: boolean,
 *   outputSize: number,
 *   isValid: boolean
 * }} Flip operation information
 */
export function getFlipInfo(width, height, direction) {
  try {
    // Basic validation
    if (!Number.isInteger(width) || width <= 0) {
      throw new Error("Invalid width");
    }
    if (!Number.isInteger(height) || height <= 0) {
      throw new Error("Invalid height");
    }
    if (direction !== "horizontal" && direction !== "vertical") {
      throw new Error("Invalid direction");
    }

    // Flipping never changes dimensions
    const outputDimensions = { width, height };
    const outputSize = width * height * 4;

    return {
      direction,
      outputDimensions,
      isLossless: true, // Flipping is always lossless
      outputSize,
      isValid: true,
    };
  } catch (_error) {
    return {
      direction: "horizontal",
      outputDimensions: { width: 0, height: 0 },
      isLossless: true,
      outputSize: 0,
      isValid: false,
    };
  }
}
