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

/**
 * Converts RGB values to grayscale using standard luminance weights.
 * Uses the ITU-R BT.709 standard for accurate perceptual brightness.
 *
 * @param {number} r - Red channel value [0-255]
 * @param {number} g - Green channel value [0-255]
 * @param {number} b - Blue channel value [0-255]
 * @returns {number} Grayscale value [0-255]
 */
export function rgbToGrayscale(r, g, b) {
  // ITU-R BT.709 standard luminance weights
  // These weights account for human eye sensitivity to different colors
  return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
}

/**
 * Alternative grayscale conversion using simple average.
 * Faster but less perceptually accurate than luminance-based conversion.
 *
 * @param {number} r - Red channel value [0-255]
 * @param {number} g - Green channel value [0-255]
 * @param {number} b - Blue channel value [0-255]
 * @returns {number} Grayscale value [0-255]
 */
export function rgbToGrayscaleAverage(r, g, b) {
  return Math.round((r + g + b) / 3);
}

/**
 * Alternative grayscale conversion using desaturation (min-max average).
 * Takes the average of the minimum and maximum RGB values.
 *
 * @param {number} r - Red channel value [0-255]
 * @param {number} g - Green channel value [0-255]
 * @param {number} b - Blue channel value [0-255]
 * @returns {number} Grayscale value [0-255]
 */
export function rgbToGrayscaleDesaturate(r, g, b) {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return Math.round((min + max) / 2);
}

/**
 * Alternative grayscale conversion using maximum RGB value.
 * Preserves highlights but may appear too bright.
 *
 * @param {number} r - Red channel value [0-255]
 * @param {number} g - Green channel value [0-255]
 * @param {number} b - Blue channel value [0-255]
 * @returns {number} Grayscale value [0-255]
 */
export function rgbToGrayscaleMax(r, g, b) {
  return Math.max(r, g, b);
}

/**
 * Alternative grayscale conversion using minimum RGB value.
 * Preserves shadows but may appear too dark.
 *
 * @param {number} r - Red channel value [0-255]
 * @param {number} g - Green channel value [0-255]
 * @param {number} b - Blue channel value [0-255]
 * @returns {number} Grayscale value [0-255]
 */
export function rgbToGrayscaleMin(r, g, b) {
  return Math.min(r, g, b);
}

/**
 * Validates grayscale conversion parameters.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {string} method - Conversion method
 * @throws {Error} If any parameter is invalid
 */
export function validateGrayscaleParameters(pixels, width, height, method) {
  // Reuse existing color parameter validation
  validateColorParameters(pixels, width, height, 1.0);

  // Validate method
  const validMethods = ["luminance", "average", "desaturate", "max", "min"];
  if (!validMethods.includes(method)) {
    throw new Error(`Invalid grayscale method: ${method}. Must be one of: ${validMethods.join(", ")}`);
  }
}

/**
 * Gets the appropriate grayscale conversion function for a method.
 *
 * @param {string} method - Conversion method name
 * @returns {function(number, number, number): number} Conversion function
 */
export function getGrayscaleConverter(method) {
  switch (method) {
    case "luminance":
      return rgbToGrayscale;
    case "average":
      return rgbToGrayscaleAverage;
    case "desaturate":
      return rgbToGrayscaleDesaturate;
    case "max":
      return rgbToGrayscaleMax;
    case "min":
      return rgbToGrayscaleMin;
    default:
      return rgbToGrayscale; // Default to luminance
  }
}

/**
 * Applies grayscale conversion to RGB channels of a pixel, preserving alpha.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} index - Pixel byte index
 * @param {function(number, number, number): number} converter - Grayscale conversion function
 */
export function applyGrayscaleToPixel(pixels, index, converter) {
  const r = pixels[index];
  const g = pixels[index + 1];
  const b = pixels[index + 2];
  const gray = converter(r, g, b);

  // Set RGB channels to grayscale value, preserve alpha
  pixels[index] = gray; // Red
  pixels[index + 1] = gray; // Green
  pixels[index + 2] = gray; // Blue
  // Alpha (index + 3) is preserved unchanged
}

/**
 * Inverts a single color channel value.
 * Color inversion creates a negative effect by subtracting from maximum value.
 *
 * @param {number} value - Original color value [0-255]
 * @returns {number} Inverted color value [0-255]
 */
export function invertColor(value) {
  return 255 - value;
}

/**
 * Applies color inversion to RGB channels of a pixel, preserving alpha.
 * Creates a photographic negative effect.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} index - Pixel byte index
 */
export function applyColorInversionToPixel(pixels, index) {
  pixels[index] = invertColor(pixels[index]); // Red
  pixels[index + 1] = invertColor(pixels[index + 1]); // Green
  pixels[index + 2] = invertColor(pixels[index + 2]); // Blue
  // Alpha (index + 3) is preserved unchanged
}

/**
 * Validates color inversion parameters.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @throws {Error} If any parameter is invalid
 */
export function validateColorInversionParameters(pixels, width, height) {
  // Reuse existing color parameter validation
  validateColorParameters(pixels, width, height, 1.0);
}

/**
 * Applies sepia tone transformation to RGB values.
 * Uses the standard sepia matrix for authentic vintage effect.
 *
 * The sepia transformation matrix:
 * R' = 0.393*R + 0.769*G + 0.189*B
 * G' = 0.349*R + 0.686*G + 0.168*B
 * B' = 0.272*R + 0.534*G + 0.131*B
 *
 * @param {number} r - Original red value [0-255]
 * @param {number} g - Original green value [0-255]
 * @param {number} b - Original blue value [0-255]
 * @returns {[number, number, number]} Sepia-transformed RGB values [0-255]
 */
export function applySepia(r, g, b) {
  // Standard sepia transformation matrix
  const newR = 0.393 * r + 0.769 * g + 0.189 * b;
  const newG = 0.349 * r + 0.686 * g + 0.168 * b;
  const newB = 0.272 * r + 0.534 * g + 0.131 * b;

  // Clamp to valid range
  return [clampColor(newR), clampColor(newG), clampColor(newB)];
}

/**
 * Applies sepia tone transformation to RGB channels of a pixel, preserving alpha.
 * Creates a vintage brown-tinted photographic effect.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} index - Pixel byte index
 */
export function applySepiaToPixel(pixels, index) {
  const r = pixels[index];
  const g = pixels[index + 1];
  const b = pixels[index + 2];

  const [newR, newG, newB] = applySepia(r, g, b);

  pixels[index] = newR; // Red
  pixels[index + 1] = newG; // Green
  pixels[index + 2] = newB; // Blue
  // Alpha (index + 3) is preserved unchanged
}

/**
 * Validates sepia tone parameters.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @throws {Error} If any parameter is invalid
 */
export function validateSepiaParameters(pixels, width, height) {
  // Reuse existing color parameter validation
  validateColorParameters(pixels, width, height, 1.0);
}

/**
 * Converts RGB color values to HSL color space.
 *
 * HSL (Hue, Saturation, Lightness) is a cylindrical color model that's more
 * intuitive for color adjustments than RGB.
 *
 * @param {number} r - Red component [0-255]
 * @param {number} g - Green component [0-255]
 * @param {number} b - Blue component [0-255]
 * @returns {[number, number, number]} HSL values [H: 0-360, S: 0-100, L: 0-100]
 */
export function rgbToHsl(r, g, b) {
  // Normalize RGB values to 0-1 range
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  // Calculate Lightness
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    // Calculate Saturation
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    // Calculate Hue
    switch (max) {
      case rNorm:
        hue = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        hue = ((bNorm - rNorm) / delta + 2) / 6;
        break;
      case bNorm:
        hue = ((rNorm - gNorm) / delta + 4) / 6;
        break;
    }
  }

  return [
    Math.round(hue * 360), // Hue: 0-360 degrees
    Math.round(saturation * 100), // Saturation: 0-100%
    Math.round(lightness * 100), // Lightness: 0-100%
  ];
}

/**
 * Converts HSL color values to RGB color space.
 *
 * @param {number} h - Hue [0-360 degrees]
 * @param {number} s - Saturation [0-100%]
 * @param {number} l - Lightness [0-100%]
 * @returns {[number, number, number]} RGB values [0-255]
 */
export function hslToRgb(h, s, l) {
  // Normalize HSL values to 0-1 range
  const hNorm = (h % 360) / 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;

  if (sNorm === 0) {
    // Achromatic (gray)
    const gray = Math.round(lNorm * 255);
    return [gray, gray, gray];
  }

  /**
   * Helper function for hue to RGB conversion.
   * @param {number} p - Lower bound value
   * @param {number} q - Upper bound value
   * @param {number} t - Normalized hue value
   * @returns {number} RGB component value
   */
  const hueToRgb = (p, q, t) => {
    let tNorm = t;
    if (tNorm < 0) tNorm += 1;
    if (tNorm > 1) tNorm -= 1;
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
    if (tNorm < 1 / 2) return q;
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;

  const r = hueToRgb(p, q, hNorm + 1 / 3);
  const g = hueToRgb(p, q, hNorm);
  const b = hueToRgb(p, q, hNorm - 1 / 3);

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Validates HSL color values.
 *
 * @param {number} h - Hue [0-360 degrees]
 * @param {number} s - Saturation [0-100%]
 * @param {number} l - Lightness [0-100%]
 * @throws {Error} If any HSL value is invalid
 */
export function validateHslValues(h, s, l) {
  if (typeof h !== "number" || Number.isNaN(h)) {
    throw new Error("Hue must be a valid number");
  }
  if (typeof s !== "number" || Number.isNaN(s) || s < 0 || s > 100) {
    throw new Error("Saturation must be a number between 0 and 100");
  }
  if (typeof l !== "number" || Number.isNaN(l) || l < 0 || l > 100) {
    throw new Error("Lightness must be a number between 0 and 100");
  }
}

/**
 * Validates HSL adjustment parameters.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} hueShift - Hue shift in degrees [-360 to 360]
 * @param {number} saturationFactor - Saturation multiplier [0.0 to 2.0]
 * @throws {Error} If any parameter is invalid
 */
export function validateHslAdjustmentParameters(pixels, width, height, hueShift, saturationFactor) {
  // Validate basic parameters
  validateColorParameters(pixels, width, height, 1.0);

  if (typeof hueShift !== "number" || Number.isNaN(hueShift) || hueShift < -360 || hueShift > 360) {
    throw new Error("Hue shift must be a number between -360 and 360 degrees");
  }

  if (
    typeof saturationFactor !== "number" ||
    Number.isNaN(saturationFactor) ||
    saturationFactor < 0 ||
    saturationFactor > 2
  ) {
    throw new Error("Saturation factor must be a number between 0.0 and 2.0");
  }
}

/**
 * Applies HSL adjustments to RGB channels of a pixel, preserving alpha.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} index - Pixel byte index
 * @param {number} hueShift - Hue shift in degrees [-360 to 360]
 * @param {number} saturationFactor - Saturation multiplier [0.0 to 2.0]
 */
export function applyHslAdjustmentToPixel(pixels, index, hueShift, saturationFactor) {
  const r = pixels[index];
  const g = pixels[index + 1];
  const b = pixels[index + 2];

  // Convert RGB to HSL
  const [h, s, l] = rgbToHsl(r, g, b);

  // Apply adjustments
  const newH = (h + hueShift + 360) % 360; // Ensure positive hue
  const newS = Math.max(0, Math.min(100, s * saturationFactor)); // Clamp saturation
  const newL = l; // Lightness unchanged

  // Convert back to RGB
  const [newR, newG, newB] = hslToRgb(newH, newS, newL);

  pixels[index] = newR; // Red
  pixels[index + 1] = newG; // Green
  pixels[index + 2] = newB; // Blue
  // Alpha (index + 3) is preserved unchanged
}
