/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Utility functions for image rotation operations.
 *
 * This module provides validation, angle normalization, and helper functions
 * for rotating RGBA pixel data. All functions are designed to be pure
 * and testable in isolation with V8-optimized performance.
 *
 * @example
 * // Normalize angle to 0-360 range
 * const normalized = normalizeAngle(450); // 90
 *
 * // Check if rotation is a 90° multiple
 * const isQuadrant = isQuadrantRotation(180); // true
 *
 * // Calculate output dimensions for arbitrary rotation
 * const dims = calculateRotatedDimensions(800, 600, 45);
 * console.log(dims); // { width: 989, height: 989 }
 */

/**
 * Validates rotation parameters for correctness and safety.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width in pixels
 * @param {number} srcHeight - Source image height in pixels
 * @param {number} degrees - Rotation angle in degrees
 * @throws {Error} If any parameter is invalid
 */
export function validateRotationParameters(pixels, srcWidth, srcHeight, degrees) {
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

  // Validate rotation angle
  if (typeof degrees !== "number" || !Number.isFinite(degrees)) {
    throw new Error(`Invalid rotation angle: ${degrees}. Must be a finite number`);
  }
}

/**
 * Normalizes angle to 0-360 degree range.
 * Handles negative angles and angles > 360°.
 *
 * @param {number} degrees - Input angle in degrees
 * @returns {number} Normalized angle in range [0, 360)
 *
 * @example
 * normalizeAngle(450) // 90
 * normalizeAngle(-90) // 270
 * normalizeAngle(0)   // 0
 * normalizeAngle(360) // 0
 */
export function normalizeAngle(degrees) {
  // Use modulo to handle large angles efficiently
  let normalized = degrees % 360;

  // Handle negative angles
  if (normalized < 0) {
    normalized += 360;
  }

  // Handle -0 edge case
  return normalized === 0 ? 0 : normalized;
}

/**
 * Checks if angle is a 90° quadrant rotation (0°, 90°, 180°, 270°).
 * These can be optimized with fast pixel rearrangement.
 *
 * @param {number} degrees - Rotation angle in degrees
 * @returns {boolean} True if angle is a 90° multiple
 */
export function isQuadrantRotation(degrees) {
  const normalized = normalizeAngle(degrees);
  return normalized === 0 || normalized === 90 || normalized === 180 || normalized === 270;
}

/**
 * Checks if rotation is effectively identity (no change).
 * Handles floating point precision issues.
 *
 * @param {number} degrees - Rotation angle in degrees
 * @returns {boolean} True if rotation is identity
 */
export function isIdentityRotation(degrees) {
  const normalized = normalizeAngle(degrees);
  return Math.abs(normalized) < 0.001 || Math.abs(normalized - 360) < 0.001;
}

/**
 * Calculates output dimensions for rotated image.
 * For 90° rotations, dimensions may swap. For arbitrary angles,
 * dimensions increase to fit the rotated image.
 *
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @param {number} degrees - Rotation angle in degrees
 * @returns {{width: number, height: number}} Output dimensions
 */
export function calculateRotatedDimensions(width, height, degrees) {
  const normalized = normalizeAngle(degrees);

  // Handle 90° rotations (dimensions may swap)
  if (normalized === 90 || normalized === 270) {
    return { width: height, height: width };
  }

  if (normalized === 0 || normalized === 180) {
    return { width, height };
  }

  // For arbitrary angles, calculate bounding box
  const radians = (normalized * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));

  const newWidth = Math.ceil(width * cos + height * sin);
  const newHeight = Math.ceil(width * sin + height * cos);

  return { width: newWidth, height: newHeight };
}

/**
 * Converts degrees to radians for trigonometric calculations.
 *
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
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
 * Safely gets a pixel from RGBA data with bounds checking.
 * Returns transparent black for out-of-bounds coordinates.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {[number, number, number, number]} RGBA values [0-255]
 */
export function getPixelSafe(pixels, x, y, width, height) {
  // Return transparent black for out-of-bounds
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return [0, 0, 0, 0];
  }

  const index = getPixelIndex(x, y, width);
  return [
    pixels[index], // Red
    pixels[index + 1], // Green
    pixels[index + 2], // Blue
    pixels[index + 3], // Alpha
  ];
}

/**
 * Sets a pixel in RGBA data at given coordinates.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Image width
 * @param {number} r - Red value [0-255]
 * @param {number} g - Green value [0-255]
 * @param {number} b - Blue value [0-255]
 * @param {number} a - Alpha value [0-255]
 */
export function setPixel(pixels, x, y, width, r, g, b, a) {
  const index = getPixelIndex(x, y, width);
  pixels[index] = r;
  pixels[index + 1] = g;
  pixels[index + 2] = b;
  pixels[index + 3] = a;
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
 * Clamps a value to the range [0, 255] for color values.
 *
 * @param {number} value - Input value
 * @returns {number} Clamped value in range [0, 255]
 */
export function clampColor(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
