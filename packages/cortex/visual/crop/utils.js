/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Utility functions for image cropping operations.
 *
 * This module provides validation, bounds checking, and helper functions
 * for cropping RGBA pixel data. All functions are designed to be pure
 * and testable in isolation.
 *
 * @example
 * // Validate crop parameters
 * validateCropParameters(pixels, 800, 600, 100, 50, 200, 150);
 *
 * // Clamp crop region to image bounds
 * const bounds = clampCropRegion(800, 600, -10, -5, 220, 160);
 * console.log(bounds); // { x: 0, y: 0, width: 210, height: 155 }
 */

/**
 * Validates crop parameters for correctness and safety.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width in pixels
 * @param {number} srcHeight - Source image height in pixels
 * @param {number} x - Crop region X coordinate (top-left)
 * @param {number} y - Crop region Y coordinate (top-left)
 * @param {number} width - Crop region width in pixels
 * @param {number} height - Crop region height in pixels
 * @throws {Error} If any parameter is invalid
 */
export function validateCropParameters(pixels, srcWidth, srcHeight, x, y, width, height) {
  // Validate pixel data
  if (!(pixels instanceof Uint8Array)) {
    throw new Error("Pixels must be a Uint8Array");
  }

  // Validate source dimensions
  if (!Number.isInteger(srcWidth) || srcWidth <= 0) {
    throw new Error(`Invalid source width: ${srcWidth}. Must be positive integer`);
  }
  if (!Number.isInteger(srcHeight) || srcHeight <= 0) {
    throw new Error(`Invalid source height: ${srcHeight}. Must be positive integer`);
  }

  // Validate pixel data size
  const expectedSize = srcWidth * srcHeight * 4; // RGBA = 4 bytes per pixel
  if (pixels.length !== expectedSize) {
    throw new Error(`Invalid pixel data size: expected ${expectedSize}, got ${pixels.length}`);
  }

  // Validate crop coordinates
  if (!Number.isInteger(x)) {
    throw new Error(`Invalid crop X coordinate: ${x}. Must be integer`);
  }
  if (!Number.isInteger(y)) {
    throw new Error(`Invalid crop Y coordinate: ${y}. Must be integer`);
  }

  // Validate crop dimensions
  if (!Number.isInteger(width) || width <= 0) {
    throw new Error(`Invalid crop width: ${width}. Must be positive integer`);
  }
  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`Invalid crop height: ${height}. Must be positive integer`);
  }
}

/**
 * Clamps crop region to fit within image bounds.
 * Adjusts coordinates and dimensions to ensure the crop region
 * is entirely within the source image boundaries.
 *
 * @param {number} srcWidth - Source image width in pixels
 * @param {number} srcHeight - Source image height in pixels
 * @param {number} x - Crop region X coordinate (top-left)
 * @param {number} y - Crop region Y coordinate (top-left)
 * @param {number} width - Crop region width in pixels
 * @param {number} height - Crop region height in pixels
 * @returns {{x: number, y: number, width: number, height: number}} Clamped crop bounds
 */
export function clampCropRegion(srcWidth, srcHeight, x, y, width, height) {
  // Clamp starting coordinates to image bounds
  const clampedX = Math.max(0, Math.min(x, srcWidth - 1));
  const clampedY = Math.max(0, Math.min(y, srcHeight - 1));

  // Calculate maximum available dimensions from clamped coordinates
  const maxWidth = srcWidth - clampedX;
  const maxHeight = srcHeight - clampedY;

  // Clamp dimensions to available space
  const clampedWidth = Math.max(1, Math.min(width, maxWidth));
  const clampedHeight = Math.max(1, Math.min(height, maxHeight));

  return {
    x: clampedX,
    y: clampedY,
    width: clampedWidth,
    height: clampedHeight,
  };
}

/**
 * Calculates effective crop bounds, handling edge cases.
 * Returns null if the crop region is entirely outside the image.
 *
 * @param {number} srcWidth - Source image width in pixels
 * @param {number} srcHeight - Source image height in pixels
 * @param {number} x - Crop region X coordinate (top-left)
 * @param {number} y - Crop region Y coordinate (top-left)
 * @param {number} width - Crop region width in pixels
 * @param {number} height - Crop region height in pixels
 * @returns {{x: number, y: number, width: number, height: number} | null} Effective crop bounds or null
 */
export function calculateCropBounds(srcWidth, srcHeight, x, y, width, height) {
  // Check if crop region is entirely outside image bounds
  if (x >= srcWidth || y >= srcHeight || x + width <= 0 || y + height <= 0) {
    return null; // No intersection with image
  }

  // Calculate intersection with image bounds
  const left = Math.max(0, x);
  const top = Math.max(0, y);
  const right = Math.min(srcWidth, x + width);
  const bottom = Math.min(srcHeight, y + height);

  // Calculate effective dimensions
  const effectiveWidth = right - left;
  const effectiveHeight = bottom - top;

  // Ensure we have a valid region
  if (effectiveWidth <= 0 || effectiveHeight <= 0) {
    return null;
  }

  return {
    x: left,
    y: top,
    width: effectiveWidth,
    height: effectiveHeight,
  };
}

/**
 * Checks if a crop operation would be a no-op (identity crop).
 * An identity crop covers the entire source image.
 *
 * @param {number} srcWidth - Source image width in pixels
 * @param {number} srcHeight - Source image height in pixels
 * @param {number} x - Crop region X coordinate (top-left)
 * @param {number} y - Crop region Y coordinate (top-left)
 * @param {number} width - Crop region width in pixels
 * @param {number} height - Crop region height in pixels
 * @returns {boolean} True if this is an identity crop
 */
export function isIdentityCrop(srcWidth, srcHeight, x, y, width, height) {
  return x === 0 && y === 0 && width === srcWidth && height === srcHeight;
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

