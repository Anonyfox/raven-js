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
  applyColorInversionToPixel,
  applyContrast,
  applyGrayscaleToPixel,
  applyHslAdjustmentToPixel,
  applyLookupTableToRGB,
  applySepiaToPixel,
  createColorLookupTable,
  getGrayscaleConverter,
  isIdentityFactor,
  rgbToHsl,
  validateColorInversionParameters,
  validateColorParameters,
  validateFactorBounds,
  validateGrayscaleParameters,
  validateHslAdjustmentParameters,
  validateSepiaParameters,
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

/**
 * Converts RGBA pixel data to grayscale.
 *
 * Supports multiple conversion methods for different visual effects.
 * The luminance method provides the most perceptually accurate results.
 * Alpha channel is preserved in all methods.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {string} [method="luminance"] - Conversion method ("luminance", "average", "desaturate", "max", "min")
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Grayscale image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Convert to grayscale using luminance (most accurate)
 * const result = convertToGrayscale(pixels, 800, 600, "luminance");
 *
 * // Convert using simple average (faster)
 * const result = convertToGrayscale(pixels, 800, 600, "average");
 *
 * // Convert using desaturation
 * const result = convertToGrayscale(pixels, 800, 600, "desaturate");
 *
 * // Create new array instead of modifying original
 * const result = convertToGrayscale(pixels, 800, 600, "luminance", false);
 */
export function convertToGrayscale(pixels, width, height, method = "luminance", inPlace = true) {
  // Validate all parameters
  validateGrayscaleParameters(pixels, width, height, method);

  const output = inPlace ? pixels : new Uint8Array(pixels);
  const converter = getGrayscaleConverter(method);

  // Process all pixels
  for (let i = 0; i < output.length; i += 4) {
    applyGrayscaleToPixel(output, i, converter);
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Gets information about a grayscale conversion operation without performing it.
 * Useful for validation and UI feedback.
 *
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {string} method - Conversion method
 * @returns {{
 *   method: string,
 *   isLossless: boolean,
 *   outputDimensions: {width: number, height: number},
 *   outputSize: number,
 *   description: string,
 *   isValid: boolean
 * }} Grayscale conversion operation information
 */
export function getGrayscaleInfo(width, height, method = "luminance") {
  try {
    // Basic validation
    if (!Number.isInteger(width) || width <= 0) {
      throw new Error("Invalid width");
    }
    if (!Number.isInteger(height) || height <= 0) {
      throw new Error("Invalid height");
    }

    const validMethods = ["luminance", "average", "desaturate", "max", "min"];
    if (!validMethods.includes(method)) {
      throw new Error("Invalid method");
    }

    // Grayscale conversion never changes dimensions
    const outputDimensions = { width, height };
    const outputSize = width * height * 4;

    // Method descriptions
    /** @type {Record<string, string>} */
    const descriptions = {
      luminance: "ITU-R BT.709 standard luminance weights (most perceptually accurate)",
      average: "Simple RGB average (fastest, less accurate)",
      desaturate: "Average of min and max RGB values (preserves contrast)",
      max: "Maximum RGB value (preserves highlights)",
      min: "Minimum RGB value (preserves shadows)",
    };

    return {
      method,
      isLossless: false, // Color information is lost
      outputDimensions,
      outputSize,
      description: descriptions[method] || "Unknown method",
      isValid: true,
    };
  } catch (_error) {
    return {
      method: "luminance",
      isLossless: false,
      outputDimensions: { width: 0, height: 0 },
      outputSize: 0,
      description: "",
      isValid: false,
    };
  }
}

/**
 * Creates a preview of grayscale conversion effects on a small sample.
 * Useful for real-time UI feedback without processing the entire image.
 *
 * @param {Uint8Array} samplePixels - Small sample of RGBA pixel data
 * @param {number} sampleWidth - Sample width in pixels
 * @param {number} sampleHeight - Sample height in pixels
 * @param {string} method - Conversion method
 * @returns {{pixels: Uint8Array, width: number, height: number}} Preview result
 */
export function createGrayscalePreview(samplePixels, sampleWidth, sampleHeight, method = "luminance") {
  // Validate sample size (should be small for performance)
  if (samplePixels.length > 64 * 64 * 4) {
    throw new Error("Sample too large for preview (max 64x64 pixels)");
  }

  return convertToGrayscale(
    samplePixels,
    sampleWidth,
    sampleHeight,
    method,
    false // Always create new array for preview
  );
}

/**
 * Compares different grayscale conversion methods on the same image data.
 * Returns results from all methods for visual comparison.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {{
 *   luminance: Uint8Array,
 *   average: Uint8Array,
 *   desaturate: Uint8Array,
 *   max: Uint8Array,
 *   min: Uint8Array
 * }} Results from all conversion methods
 */
export function compareGrayscaleMethods(pixels, width, height) {
  validateGrayscaleParameters(pixels, width, height, "luminance");

  const methods = ["luminance", "average", "desaturate", "max", "min"];
  /** @type {Record<string, Uint8Array>} */
  const results = {};

  for (const method of methods) {
    const result = convertToGrayscale(pixels, width, height, method, false);
    results[method] = result.pixels;
  }

  return /** @type {{luminance: Uint8Array, average: Uint8Array, desaturate: Uint8Array, max: Uint8Array, min: Uint8Array}} */ (
    results
  );
}

/**
 * Inverts the colors of RGBA pixel data.
 *
 * Color inversion creates a photographic negative effect by subtracting each
 * RGB channel value from 255. Alpha channel is preserved unchanged.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Inverted image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Invert colors to create negative effect
 * const result = applyColorInversion(pixels, 800, 600);
 *
 * // Create new array instead of modifying original
 * const result = applyColorInversion(pixels, 800, 600, false);
 *
 * // Double inversion should restore original
 * const inverted = applyColorInversion(pixels, 800, 600, false);
 * const restored = applyColorInversion(inverted.pixels, 800, 600, false);
 */
export function applyColorInversion(pixels, width, height, inPlace = true) {
  // Validate all parameters
  validateColorInversionParameters(pixels, width, height);

  const output = inPlace ? pixels : new Uint8Array(pixels);

  // Process all pixels - simple and fast operation
  for (let i = 0; i < output.length; i += 4) {
    applyColorInversionToPixel(output, i);
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Gets information about a color inversion operation without performing it.
 * Useful for validation and UI feedback.
 *
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {{
 *   operation: string,
 *   isLossless: boolean,
 *   isReversible: boolean,
 *   outputDimensions: {width: number, height: number},
 *   outputSize: number,
 *   description: string,
 *   isValid: boolean
 * }} Color inversion operation information
 */
export function getColorInversionInfo(width, height) {
  try {
    // Basic validation
    if (!Number.isInteger(width) || width <= 0) {
      throw new Error("Invalid width");
    }
    if (!Number.isInteger(height) || height <= 0) {
      throw new Error("Invalid height");
    }

    // Color inversion never changes dimensions
    const outputDimensions = { width, height };
    const outputSize = width * height * 4;

    return {
      operation: "inversion",
      isLossless: true, // No information is lost
      isReversible: true, // invert(invert(x)) = x
      outputDimensions,
      outputSize,
      description: "Photographic negative effect - subtracts each RGB value from 255",
      isValid: true,
    };
  } catch (_error) {
    return {
      operation: "inversion",
      isLossless: false,
      isReversible: false,
      outputDimensions: { width: 0, height: 0 },
      outputSize: 0,
      description: "",
      isValid: false,
    };
  }
}

/**
 * Creates a preview of color inversion effects on a small sample.
 * Useful for real-time UI feedback without processing the entire image.
 *
 * @param {Uint8Array} samplePixels - Small sample of RGBA pixel data
 * @param {number} sampleWidth - Sample width in pixels
 * @param {number} sampleHeight - Sample height in pixels
 * @returns {{pixels: Uint8Array, width: number, height: number}} Preview result
 */
export function createColorInversionPreview(samplePixels, sampleWidth, sampleHeight) {
  // Validate sample size (should be small for performance)
  if (samplePixels.length > 64 * 64 * 4) {
    throw new Error("Sample too large for preview (max 64x64 pixels)");
  }

  return applyColorInversion(
    samplePixels,
    sampleWidth,
    sampleHeight,
    false // Always create new array for preview
  );
}

/**
 * Applies sepia tone effect to RGBA pixel data.
 *
 * Sepia tone creates a vintage brown-tinted photographic effect using a
 * standard 3x3 transformation matrix. Alpha channel is preserved unchanged.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Sepia-toned image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Apply sepia tone for vintage effect
 * const result = applySepiaEffect(pixels, 800, 600);
 *
 * // Create new array instead of modifying original
 * const result = applySepiaEffect(pixels, 800, 600, false);
 *
 * // Sepia preserves luminance while adding brown tint
 * const sepia = applySepiaEffect(colorPixels, 400, 300);
 */
export function applySepiaEffect(pixels, width, height, inPlace = true) {
  // Validate all parameters
  validateSepiaParameters(pixels, width, height);

  const output = inPlace ? pixels : new Uint8Array(pixels);

  // Process all pixels using sepia transformation matrix
  for (let i = 0; i < output.length; i += 4) {
    applySepiaToPixel(output, i);
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Gets information about a sepia tone operation without performing it.
 * Useful for validation and UI feedback.
 *
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {{
 *   operation: string,
 *   isLossless: boolean,
 *   isReversible: boolean,
 *   outputDimensions: {width: number, height: number},
 *   outputSize: number,
 *   description: string,
 *   isValid: boolean
 * }} Sepia tone operation information
 */
export function getSepiaInfo(width, height) {
  try {
    // Basic validation
    if (!Number.isInteger(width) || width <= 0) {
      throw new Error("Invalid width");
    }
    if (!Number.isInteger(height) || height <= 0) {
      throw new Error("Invalid height");
    }

    // Sepia tone never changes dimensions
    const outputDimensions = { width, height };
    const outputSize = width * height * 4;

    return {
      operation: "sepia",
      isLossless: false, // Color information is transformed
      isReversible: false, // Matrix transformation is not reversible
      outputDimensions,
      outputSize,
      description: "Vintage brown-tinted photographic effect using standard sepia matrix",
      isValid: true,
    };
  } catch (_error) {
    return {
      operation: "sepia",
      isLossless: false,
      isReversible: false,
      outputDimensions: { width: 0, height: 0 },
      outputSize: 0,
      description: "",
      isValid: false,
    };
  }
}

/**
 * Creates a preview of sepia tone effects on a small sample.
 * Useful for real-time UI feedback without processing the entire image.
 *
 * @param {Uint8Array} samplePixels - Small sample of RGBA pixel data
 * @param {number} sampleWidth - Sample width in pixels
 * @param {number} sampleHeight - Sample height in pixels
 * @returns {{pixels: Uint8Array, width: number, height: number}} Preview result
 */
export function createSepiaPreview(samplePixels, sampleWidth, sampleHeight) {
  // Validate sample size (should be small for performance)
  if (samplePixels.length > 64 * 64 * 4) {
    throw new Error("Sample too large for preview (max 64x64 pixels)");
  }

  return applySepiaEffect(
    samplePixels,
    sampleWidth,
    sampleHeight,
    false // Always create new array for preview
  );
}

/**
 * Adjusts the saturation of RGBA pixel data using HSL color space.
 *
 * Saturation adjustment multiplies the saturation component in HSL space
 * while preserving hue and lightness. Alpha channel is preserved unchanged.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} saturationFactor - Saturation multiplier [0.0 to 2.0]
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Adjusted image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Increase saturation by 50%
 * const result = adjustSaturation(pixels, 800, 600, 1.5);
 *
 * // Desaturate image (50% less saturated)
 * const result = adjustSaturation(pixels, 800, 600, 0.5);
 *
 * // Complete desaturation (grayscale)
 * const result = adjustSaturation(pixels, 800, 600, 0.0);
 */
export function adjustSaturation(pixels, width, height, saturationFactor, inPlace = true) {
  // Validate all parameters
  validateHslAdjustmentParameters(pixels, width, height, 0, saturationFactor);

  const output = inPlace ? pixels : new Uint8Array(pixels);

  // Process all pixels using HSL conversion
  for (let i = 0; i < output.length; i += 4) {
    applyHslAdjustmentToPixel(output, i, 0, saturationFactor);
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Adjusts the hue of RGBA pixel data using HSL color space.
 *
 * Hue adjustment shifts the hue component in HSL space while preserving
 * saturation and lightness. Alpha channel is preserved unchanged.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} hueShift - Hue shift in degrees [-360 to 360]
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Adjusted image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Shift hue by 90 degrees (red -> green, green -> blue, etc.)
 * const result = adjustHue(pixels, 800, 600, 90);
 *
 * // Shift hue by -120 degrees (reverse color wheel)
 * const result = adjustHue(pixels, 800, 600, -120);
 *
 * // Full color inversion via hue (180 degrees)
 * const result = adjustHue(pixels, 800, 600, 180);
 */
export function adjustHue(pixels, width, height, hueShift, inPlace = true) {
  // Validate all parameters
  validateHslAdjustmentParameters(pixels, width, height, hueShift, 1.0);

  const output = inPlace ? pixels : new Uint8Array(pixels);

  // Process all pixels using HSL conversion
  for (let i = 0; i < output.length; i += 4) {
    applyHslAdjustmentToPixel(output, i, hueShift, 1.0);
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Adjusts both hue and saturation of RGBA pixel data using HSL color space.
 *
 * Combined HSL adjustment for efficient processing when both hue and
 * saturation need to be modified. Alpha channel is preserved unchanged.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} hueShift - Hue shift in degrees [-360 to 360]
 * @param {number} saturationFactor - Saturation multiplier [0.0 to 2.0]
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Adjusted image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Shift hue and increase saturation
 * const result = adjustHueSaturation(pixels, 800, 600, 45, 1.3);
 *
 * // Create vintage effect with hue shift and desaturation
 * const result = adjustHueSaturation(pixels, 800, 600, 15, 0.7);
 */
export function adjustHueSaturation(pixels, width, height, hueShift, saturationFactor, inPlace = true) {
  // Validate all parameters
  validateHslAdjustmentParameters(pixels, width, height, hueShift, saturationFactor);

  const output = inPlace ? pixels : new Uint8Array(pixels);

  // Process all pixels using HSL conversion
  for (let i = 0; i < output.length; i += 4) {
    applyHslAdjustmentToPixel(output, i, hueShift, saturationFactor);
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Gets information about HSL adjustment operations without performing them.
 * Useful for validation and UI feedback.
 *
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} hueShift - Hue shift in degrees [-360 to 360]
 * @param {number} saturationFactor - Saturation multiplier [0.0 to 2.0]
 * @returns {{
 *   operation: string,
 *   isLossless: boolean,
 *   isReversible: boolean,
 *   outputDimensions: {width: number, height: number},
 *   outputSize: number,
 *   description: string,
 *   isValid: boolean
 * }} HSL adjustment operation information
 */
export function getHslAdjustmentInfo(width, height, hueShift, saturationFactor) {
  try {
    // Basic validation
    if (!Number.isInteger(width) || width <= 0) {
      throw new Error("Invalid width");
    }
    if (!Number.isInteger(height) || height <= 0) {
      throw new Error("Invalid height");
    }

    // Validate HSL parameters
    validateHslAdjustmentParameters(new Uint8Array(4), 1, 1, hueShift, saturationFactor);

    // HSL adjustments never change dimensions
    const outputDimensions = { width, height };
    const outputSize = width * height * 4;

    // Determine operation type and reversibility
    const isHueAdjustment = hueShift !== 0;
    const isSaturationAdjustment = saturationFactor !== 1.0;

    let operation = "hsl";
    let description = "";
    let isReversible = true;

    if (isHueAdjustment && isSaturationAdjustment) {
      operation = "hue-saturation";
      description = `Hue shift by ${hueShift}° and saturation adjustment by ${saturationFactor}x`;
      isReversible = saturationFactor !== 0; // Can't reverse complete desaturation
    } else if (isHueAdjustment) {
      operation = "hue";
      description = `Hue shift by ${hueShift}° on color wheel`;
      isReversible = true; // Hue shifts are always reversible
    } else if (isSaturationAdjustment) {
      operation = "saturation";
      description = `Saturation adjustment by ${saturationFactor}x`;
      isReversible = saturationFactor !== 0; // Can't reverse complete desaturation
    } else {
      operation = "identity";
      description = "No HSL adjustments (identity operation)";
      isReversible = true;
    }

    return {
      operation,
      isLossless: false, // HSL conversion involves rounding
      isReversible,
      outputDimensions,
      outputSize,
      description,
      isValid: true,
    };
  } catch (_error) {
    return {
      operation: "hsl",
      isLossless: false,
      isReversible: false,
      outputDimensions: { width: 0, height: 0 },
      outputSize: 0,
      description: "",
      isValid: false,
    };
  }
}

/**
 * Creates a preview of HSL adjustment effects on a small sample.
 * Useful for real-time UI feedback without processing the entire image.
 *
 * @param {Uint8Array} samplePixels - Small sample of RGBA pixel data
 * @param {number} sampleWidth - Sample width in pixels
 * @param {number} sampleHeight - Sample height in pixels
 * @param {number} hueShift - Hue shift in degrees [-360 to 360]
 * @param {number} saturationFactor - Saturation multiplier [0.0 to 2.0]
 * @returns {{pixels: Uint8Array, width: number, height: number}} Preview result
 */
export function createHslAdjustmentPreview(samplePixels, sampleWidth, sampleHeight, hueShift, saturationFactor) {
  // Validate sample size (should be small for performance)
  if (samplePixels.length > 64 * 64 * 4) {
    throw new Error("Sample too large for preview (max 64x64 pixels)");
  }

  return adjustHueSaturation(
    samplePixels,
    sampleWidth,
    sampleHeight,
    hueShift,
    saturationFactor,
    false // Always create new array for preview
  );
}

/**
 * Converts RGB pixel data to HSL representation for analysis.
 * Useful for color analysis and histogram generation.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {{
 *   hues: Float32Array,
 *   saturations: Float32Array,
 *   lightnesses: Float32Array,
 *   averageHue: number,
 *   averageSaturation: number,
 *   averageLightness: number
 * }} HSL analysis data
 */
export function analyzeHslDistribution(pixels, width, height) {
  validateColorParameters(pixels, width, height, 1.0);

  const pixelCount = width * height;
  const hues = new Float32Array(pixelCount);
  const saturations = new Float32Array(pixelCount);
  const lightnesses = new Float32Array(pixelCount);

  let totalHue = 0;
  let totalSaturation = 0;
  let totalLightness = 0;
  let validHueCount = 0; // For averaging (exclude achromatic pixels)

  for (let i = 0, pixelIndex = 0; i < pixels.length; i += 4, pixelIndex++) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const [h, s, l] = rgbToHsl(r, g, b);

    hues[pixelIndex] = h;
    saturations[pixelIndex] = s;
    lightnesses[pixelIndex] = l;

    if (s > 0) {
      // Only count chromatic pixels for hue average
      totalHue += h;
      validHueCount++;
    }
    totalSaturation += s;
    totalLightness += l;
  }

  return {
    hues,
    saturations,
    lightnesses,
    averageHue: validHueCount > 0 ? totalHue / validHueCount : 0,
    averageSaturation: totalSaturation / pixelCount,
    averageLightness: totalLightness / pixelCount,
  };
}
