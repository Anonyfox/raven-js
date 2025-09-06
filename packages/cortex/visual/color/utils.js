/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Utility functions for color manipulation operations.
 *
 * This module provides validation, clamping, and helper functions for
 * color adjustments on RGBA pixel data. All functions are designed to be
 * pure and testable in isolation with V8-optimized performance.
 *
 * @example
 * // Validate adjustment parameters
 * validateColorParameters(pixels, 800, 600, 1.2);
 *
 * // Clamp color values
 * const clamped = clampColor(300); // 255
 *
 * // Apply brightness adjustment
 * const bright = applyBrightness(128, 1.5); // 192
 */

/**
 * Validates color adjustment parameters for correctness and safety.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} factor - Adjustment factor
 * @throws {Error} If any parameter is invalid
 */
export function validateColorParameters(pixels, width, height, factor) {
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

  // Validate factor
  if (typeof factor !== "number" || !Number.isFinite(factor)) {
    throw new Error(`Invalid factor: ${factor}. Must be a finite number`);
  }

  if (factor < 0) {
    throw new Error(`Invalid factor: ${factor}. Must be non-negative`);
  }
}

/**
 * Clamps a color value to the valid range [0, 255].
 *
 * @param {number} value - Input color value
 * @returns {number} Clamped value in range [0, 255]
 */
export function clampColor(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Applies brightness adjustment to a single color channel.
 * Brightness is a linear multiplication of the color value.
 *
 * @param {number} value - Original color value [0-255]
 * @param {number} factor - Brightness factor (1.0 = no change, >1.0 = brighter, <1.0 = darker)
 * @returns {number} Adjusted color value [0-255]
 */
export function applyBrightness(value, factor) {
  return clampColor(value * factor);
}

/**
 * Applies contrast adjustment to a single color channel.
 * Contrast adjustment uses the formula: newValue = (value - 128) * factor + 128
 * This centers the adjustment around middle gray (128).
 *
 * @param {number} value - Original color value [0-255]
 * @param {number} factor - Contrast factor (1.0 = no change, >1.0 = more contrast, <1.0 = less contrast)
 * @returns {number} Adjusted color value [0-255]
 */
export function applyContrast(value, factor) {
  // Center around middle gray (128) for natural contrast adjustment
  const centered = value - 128;
  const adjusted = centered * factor + 128;
  return clampColor(adjusted);
}

/**
 * Applies combined brightness and contrast adjustment to a single color channel.
 * More efficient than applying them separately.
 *
 * @param {number} value - Original color value [0-255]
 * @param {number} brightnessFactor - Brightness factor
 * @param {number} contrastFactor - Contrast factor
 * @returns {number} Adjusted color value [0-255]
 */
export function applyBrightnessContrast(value, brightnessFactor, contrastFactor) {
  // Apply brightness first, then contrast
  const brightened = value * brightnessFactor;
  const centered = brightened - 128;
  const adjusted = centered * contrastFactor + 128;
  return clampColor(adjusted);
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
 * Applies a function to each RGB channel of a pixel, preserving alpha.
 * This is a higher-order function for efficient pixel processing.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} index - Pixel byte index
 * @param {function(number): number} fn - Function to apply to each RGB channel
 */
export function applyToRGBChannels(pixels, index, fn) {
  pixels[index] = fn(pixels[index]); // Red
  pixels[index + 1] = fn(pixels[index + 1]); // Green
  pixels[index + 2] = fn(pixels[index + 2]); // Blue
  // Alpha (index + 3) is preserved unchanged
}

/**
 * Applies a function to each RGBA channel of a pixel.
 * This is a higher-order function for processing all channels including alpha.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} index - Pixel byte index
 * @param {function(number): number} fn - Function to apply to each RGBA channel
 */
export function applyToRGBAChannels(pixels, index, fn) {
  pixels[index] = fn(pixels[index]); // Red
  pixels[index + 1] = fn(pixels[index + 1]); // Green
  pixels[index + 2] = fn(pixels[index + 2]); // Blue
  pixels[index + 3] = fn(pixels[index + 3]); // Alpha
}

/**
 * Creates a lookup table for fast color adjustments.
 * Pre-computes all possible color transformations for O(1) lookup.
 *
 * @param {function(number): number} fn - Color transformation function
 * @returns {Uint8Array} Lookup table with 256 entries
 */
export function createColorLookupTable(fn) {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = fn(i);
  }
  return lut;
}

/**
 * Applies a lookup table to RGB channels for maximum performance.
 * This is the fastest way to apply color adjustments to large images.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} index - Pixel byte index
 * @param {Uint8Array} lut - Pre-computed lookup table
 */
export function applyLookupTableToRGB(pixels, index, lut) {
  pixels[index] = lut[pixels[index]]; // Red
  pixels[index + 1] = lut[pixels[index + 1]]; // Green
  pixels[index + 2] = lut[pixels[index + 2]]; // Blue
  // Alpha is preserved unchanged
}

/**
 * Checks if a color adjustment factor represents no change.
 * Handles floating point precision issues.
 *
 * @param {number} factor - Adjustment factor
 * @returns {boolean} True if factor represents no change
 */
export function isIdentityFactor(factor) {
  return Math.abs(factor - 1.0) < 0.001;
}

/**
 * Validates that a factor is within reasonable bounds.
 * Prevents extreme values that could cause performance issues.
 *
 * @param {number} factor - Adjustment factor
 * @param {number} [min=0] - Minimum allowed value
 * @param {number} [max=10] - Maximum allowed value
 * @throws {Error} If factor is outside bounds
 */
export function validateFactorBounds(factor, min = 0, max = 10) {
  if (factor < min || factor > max) {
    throw new Error(`Factor ${factor} is outside valid range [${min}, ${max}]`);
  }
}
