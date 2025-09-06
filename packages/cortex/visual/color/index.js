/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main color adjustment functionality for RGBA pixel data.
 *
 * This module provides efficient brightness and contrast adjustment operations
 * for RGBA pixel data. Operations preserve the alpha channel and use optimized
 * lookup tables for maximum performance on large images.
 *
 * @example
 * // Adjust brightness
 * const result = adjustBrightness(pixels, 800, 600, 1.2);
 *
 * // Adjust contrast
 * const result = adjustContrast(pixels, 800, 600, 1.5);
 *
 * // Combine both adjustments
 * const result = adjustBrightnessContrast(pixels, 800, 600, 1.2, 1.5);
 */

import {
  applyBrightness,
  applyBrightnessContrast,
  applyContrast,
  applyLookupTableToRGB,
  createColorLookupTable,
  isIdentityFactor,
  validateColorParameters,
  validateFactorBounds,
} from "./utils.js";

/**
 * Adjusts the brightness of RGBA pixel data.
 *
 * Brightness adjustment multiplies each RGB channel by the given factor.
 * Values are clamped to [0, 255] range. Alpha channel is preserved.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} factor - Brightness factor (1.0 = no change, >1.0 = brighter, <1.0 = darker)
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Adjusted image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Make image 20% brighter
 * const result = adjustBrightness(pixels, 800, 600, 1.2);
 *
 * // Make image 50% darker
 * const result = adjustBrightness(pixels, 800, 600, 0.5);
 *
 * // Create new array instead of modifying original
 * const result = adjustBrightness(pixels, 800, 600, 1.2, false);
 */
export function adjustBrightness(pixels, width, height, factor, inPlace = true) {
  // Validate all parameters
  validateColorParameters(pixels, width, height, factor);
  validateFactorBounds(factor, 0, 10);

  // Early return for identity operations
  if (isIdentityFactor(factor)) {
    return {
      pixels: inPlace ? pixels : new Uint8Array(pixels),
      width,
      height,
    };
  }

  const output = inPlace ? pixels : new Uint8Array(pixels);

  // Use lookup table for maximum performance
  const lut = createColorLookupTable((value) => applyBrightness(value, factor));

  // Process all pixels
  for (let i = 0; i < output.length; i += 4) {
    applyLookupTableToRGB(output, i, lut);
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Adjusts the contrast of RGBA pixel data.
 *
 * Contrast adjustment centers around middle gray (128) and multiplies
 * the difference by the given factor. Alpha channel is preserved.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} factor - Contrast factor (1.0 = no change, >1.0 = more contrast, <1.0 = less contrast)
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Adjusted image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Increase contrast by 50%
 * const result = adjustContrast(pixels, 800, 600, 1.5);
 *
 * // Decrease contrast by 30%
 * const result = adjustContrast(pixels, 800, 600, 0.7);
 *
 * // Create new array instead of modifying original
 * const result = adjustContrast(pixels, 800, 600, 1.5, false);
 */
export function adjustContrast(pixels, width, height, factor, inPlace = true) {
  // Validate all parameters
  validateColorParameters(pixels, width, height, factor);
  validateFactorBounds(factor, 0, 10);

  // Early return for identity operations
  if (isIdentityFactor(factor)) {
    return {
      pixels: inPlace ? pixels : new Uint8Array(pixels),
      width,
      height,
    };
  }

  const output = inPlace ? pixels : new Uint8Array(pixels);

  // Use lookup table for maximum performance
  const lut = createColorLookupTable((value) => applyContrast(value, factor));

  // Process all pixels
  for (let i = 0; i < output.length; i += 4) {
    applyLookupTableToRGB(output, i, lut);
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Adjusts both brightness and contrast of RGBA pixel data in a single pass.
 * More efficient than applying adjustments separately.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} brightnessFactor - Brightness factor (1.0 = no change)
 * @param {number} contrastFactor - Contrast factor (1.0 = no change)
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Adjusted image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Increase brightness and contrast
 * const result = adjustBrightnessContrast(pixels, 800, 600, 1.2, 1.3);
 *
 * // Decrease both
 * const result = adjustBrightnessContrast(pixels, 800, 600, 0.8, 0.9);
 */
export function adjustBrightnessContrast(pixels, width, height, brightnessFactor, contrastFactor, inPlace = true) {
  // Validate all parameters
  validateColorParameters(pixels, width, height, brightnessFactor);
  validateColorParameters(pixels, width, height, contrastFactor);
  validateFactorBounds(brightnessFactor, 0, 10);
  validateFactorBounds(contrastFactor, 0, 10);

  // Early return for identity operations
  if (isIdentityFactor(brightnessFactor) && isIdentityFactor(contrastFactor)) {
    return {
      pixels: inPlace ? pixels : new Uint8Array(pixels),
      width,
      height,
    };
  }

  const output = inPlace ? pixels : new Uint8Array(pixels);

  // Use lookup table for maximum performance
  const lut = createColorLookupTable((value) => applyBrightnessContrast(value, brightnessFactor, contrastFactor));

  // Process all pixels
  for (let i = 0; i < output.length; i += 4) {
    applyLookupTableToRGB(output, i, lut);
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Gets information about a color adjustment operation without performing it.
 * Useful for validation and UI feedback.
 *
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} factor - Adjustment factor
 * @param {string} operation - Operation type ("brightness" or "contrast")
 * @returns {{
 *   operation: string,
 *   factor: number,
 *   isIdentity: boolean,
 *   outputDimensions: {width: number, height: number},
 *   outputSize: number,
 *   isValid: boolean
 * }} Color adjustment operation information
 */
export function getColorAdjustmentInfo(width, height, factor, operation) {
  try {
    // Basic validation
    if (!Number.isInteger(width) || width <= 0) {
      throw new Error("Invalid width");
    }
    if (!Number.isInteger(height) || height <= 0) {
      throw new Error("Invalid height");
    }
    if (typeof factor !== "number" || !Number.isFinite(factor)) {
      throw new Error("Invalid factor");
    }
    if (operation !== "brightness" && operation !== "contrast") {
      throw new Error("Invalid operation");
    }

    validateFactorBounds(factor, 0, 10);

    // Color adjustments never change dimensions
    const outputDimensions = { width, height };
    const outputSize = width * height * 4;
    const isIdentity = isIdentityFactor(factor);

    return {
      operation,
      factor,
      isIdentity,
      outputDimensions,
      outputSize,
      isValid: true,
    };
  } catch (_error) {
    return {
      operation: "brightness",
      factor: 1.0,
      isIdentity: true,
      outputDimensions: { width: 0, height: 0 },
      outputSize: 0,
      isValid: false,
    };
  }
}

/**
 * Creates a preview of color adjustment effects on a small sample.
 * Useful for real-time UI feedback without processing the entire image.
 *
 * @param {Uint8Array} samplePixels - Small sample of RGBA pixel data
 * @param {number} sampleWidth - Sample width in pixels
 * @param {number} sampleHeight - Sample height in pixels
 * @param {number} brightnessFactor - Brightness factor
 * @param {number} contrastFactor - Contrast factor
 * @returns {{pixels: Uint8Array, width: number, height: number}} Preview result
 */
export function createColorAdjustmentPreview(
  samplePixels,
  sampleWidth,
  sampleHeight,
  brightnessFactor,
  contrastFactor
) {
  // Validate sample size (should be small for performance)
  if (samplePixels.length > 64 * 64 * 4) {
    throw new Error("Sample too large for preview (max 64x64 pixels)");
  }

  return adjustBrightnessContrast(
    samplePixels,
    sampleWidth,
    sampleHeight,
    brightnessFactor,
    contrastFactor,
    false // Always create new array for preview
  );
}

/**
 * Analyzes the brightness distribution of an image.
 * Returns statistics useful for automatic adjustment suggestions.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {{
 *   averageBrightness: number,
 *   minBrightness: number,
 *   maxBrightness: number,
 *   histogram: Uint32Array
 * }} Brightness analysis results
 */
export function analyzeBrightness(pixels, width, height) {
  validateColorParameters(pixels, width, height, 1.0);

  const histogram = new Uint32Array(256);
  let totalBrightness = 0;
  let minBrightness = 255;
  let maxBrightness = 0;
  let pixelCount = 0;

  // Process each pixel
  for (let i = 0; i < pixels.length; i += 4) {
    // Calculate luminance using standard weights
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    histogram[brightness]++;
    totalBrightness += brightness;
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
    pixelCount++;
  }

  return {
    averageBrightness: totalBrightness / pixelCount,
    minBrightness,
    maxBrightness,
    histogram,
  };
}
