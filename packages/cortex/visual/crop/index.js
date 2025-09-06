/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main cropping functionality for RGBA pixel data.
 *
 * This module provides the core cropPixels function that extracts a rectangular
 * region from RGBA pixel data. The implementation is optimized for performance
 * with efficient memory access patterns and minimal allocations.
 *
 * @example
 * // Crop a 200x150 region starting at (100, 50)
 * const croppedPixels = cropPixels(pixels, 800, 600, 100, 50, 200, 150);
 * console.log(`Cropped: ${croppedPixels.length / 4} pixels`);
 */

import { calculateCropBounds, copyPixel, getPixelIndex, isIdentityCrop, validateCropParameters } from "./utils.js";

/**
 * Crops RGBA pixel data to extract a rectangular region.
 *
 * This function efficiently extracts a rectangular region from source RGBA
 * pixel data, handling edge cases like out-of-bounds coordinates and
 * optimizing for common scenarios like identity crops.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} srcWidth - Source image width in pixels
 * @param {number} srcHeight - Source image height in pixels
 * @param {number} x - Crop region X coordinate (top-left, can be negative)
 * @param {number} y - Crop region Y coordinate (top-left, can be negative)
 * @param {number} width - Crop region width in pixels (must be positive)
 * @param {number} height - Crop region height in pixels (must be positive)
 * @returns {Uint8Array} Cropped RGBA pixel data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Basic crop operation
 * const pixels = new Uint8Array(800 * 600 * 4); // 800x600 RGBA
 * const cropped = cropPixels(pixels, 800, 600, 100, 50, 200, 150);
 * console.log(`Result: ${cropped.length / 4} pixels (${200}x${150})`);
 *
 * @example
 * // Handle out-of-bounds crop (automatically clamped)
 * const cropped = cropPixels(pixels, 800, 600, 750, 550, 100, 100);
 * // Result will be smaller than 100x100 due to clamping
 */
export function cropPixels(pixels, srcWidth, srcHeight, x, y, width, height) {
  // Validate all parameters
  validateCropParameters(pixels, srcWidth, srcHeight, x, y, width, height);

  // Check for identity crop (no-op optimization)
  if (isIdentityCrop(srcWidth, srcHeight, x, y, width, height)) {
    return new Uint8Array(pixels); // Return copy of original
  }

  // Calculate effective crop bounds (handles out-of-bounds cases)
  const bounds = calculateCropBounds(srcWidth, srcHeight, x, y, width, height);

  // Handle case where crop region is entirely outside image
  if (!bounds) {
    throw new Error(
      `Crop region (${x}, ${y}, ${width}x${height}) is entirely outside ` + `image bounds (${srcWidth}x${srcHeight})`
    );
  }

  // Extract effective bounds
  const { x: cropX, y: cropY, width: cropWidth, height: cropHeight } = bounds;

  // Allocate output buffer
  const outputSize = cropWidth * cropHeight * 4; // RGBA = 4 bytes per pixel
  const output = new Uint8Array(outputSize);

  // Perform the crop operation
  // Use row-by-row copying for optimal memory access patterns
  for (let row = 0; row < cropHeight; row++) {
    const srcY = cropY + row;
    const srcRowStart = getPixelIndex(cropX, srcY, srcWidth);
    const dstRowStart = getPixelIndex(0, row, cropWidth);

    // Copy entire row at once for maximum efficiency
    const rowBytes = cropWidth * 4;
    output.set(pixels.subarray(srcRowStart, srcRowStart + rowBytes), dstRowStart);
  }

  return output;
}

/**
 * Crops RGBA pixel data with pixel-by-pixel copying (alternative implementation).
 * This version is more explicit but potentially slower than the row-based approach.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width in pixels
 * @param {number} srcHeight - Source image height in pixels
 * @param {number} x - Crop region X coordinate (top-left)
 * @param {number} y - Crop region Y coordinate (top-left)
 * @param {number} width - Crop region width in pixels
 * @param {number} height - Crop region height in pixels
 * @returns {Uint8Array} Cropped RGBA pixel data
 */
export function cropPixelsExplicit(pixels, srcWidth, srcHeight, x, y, width, height) {
  // Validate all parameters
  validateCropParameters(pixels, srcWidth, srcHeight, x, y, width, height);

  // Check for identity crop
  if (isIdentityCrop(srcWidth, srcHeight, x, y, width, height)) {
    return new Uint8Array(pixels);
  }

  // Calculate effective crop bounds
  const bounds = calculateCropBounds(srcWidth, srcHeight, x, y, width, height);

  if (!bounds) {
    throw new Error(
      `Crop region (${x}, ${y}, ${width}x${height}) is entirely outside ` + `image bounds (${srcWidth}x${srcHeight})`
    );
  }

  const { x: cropX, y: cropY, width: cropWidth, height: cropHeight } = bounds;

  // Allocate output buffer
  const outputSize = cropWidth * cropHeight * 4;
  const output = new Uint8Array(outputSize);

  // Copy pixels one by one
  for (let row = 0; row < cropHeight; row++) {
    for (let col = 0; col < cropWidth; col++) {
      const srcIndex = getPixelIndex(cropX + col, cropY + row, srcWidth);
      const dstIndex = getPixelIndex(col, row, cropWidth);
      copyPixel(pixels, output, srcIndex, dstIndex);
    }
  }

  return output;
}

/**
 * Gets information about a crop operation without performing it.
 * Useful for validation and UI feedback.
 *
 * @param {number} srcWidth - Source image width in pixels
 * @param {number} srcHeight - Source image height in pixels
 * @param {number} x - Crop region X coordinate (top-left)
 * @param {number} y - Crop region Y coordinate (top-left)
 * @param {number} width - Crop region width in pixels
 * @param {number} height - Crop region height in pixels
 * @returns {{
 *   isValid: boolean,
 *   isIdentity: boolean,
 *   effectiveBounds: {x: number, y: number, width: number, height: number} | null,
 *   outputSize: number
 * }} Crop operation information
 */
export function getCropInfo(srcWidth, srcHeight, x, y, width, height) {
  try {
    // Basic validation (without pixel data)
    if (!Number.isInteger(srcWidth) || srcWidth <= 0) {
      throw new Error("Invalid source width");
    }
    if (!Number.isInteger(srcHeight) || srcHeight <= 0) {
      throw new Error("Invalid source height");
    }
    if (!Number.isInteger(x)) {
      throw new Error("Invalid crop X coordinate");
    }
    if (!Number.isInteger(y)) {
      throw new Error("Invalid crop Y coordinate");
    }
    if (!Number.isInteger(width) || width <= 0) {
      throw new Error("Invalid crop width");
    }
    if (!Number.isInteger(height) || height <= 0) {
      throw new Error("Invalid crop height");
    }

    const isIdentity = isIdentityCrop(srcWidth, srcHeight, x, y, width, height);
    const effectiveBounds = calculateCropBounds(srcWidth, srcHeight, x, y, width, height);
    const outputSize = effectiveBounds ? effectiveBounds.width * effectiveBounds.height * 4 : 0;

    return {
      isValid: effectiveBounds !== null,
      isIdentity,
      effectiveBounds,
      outputSize,
    };
  } catch (_error) {
    return {
      isValid: false,
      isIdentity: false,
      effectiveBounds: null,
      outputSize: 0,
    };
  }
}

