/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file RGB ↔ YCbCr color space conversion for JPEG processing.
 *
 * JPEG uses YCbCr color space where Y is luminance (brightness) and
 * Cb/Cr are chrominance (color information). Human eyes are more
 * sensitive to luminance than chrominance, allowing better compression.
 */

/**
 * Standard JPEG color conversion coefficients.
 * Based on ITU-R BT.601 standard for digital video.
 */
const RGB_TO_YCBCR_COEFFICIENTS = {
  // Y (luminance) coefficients
  YR: 0.299,
  YG: 0.587,
  YB: 0.114,

  // Cb (blue chrominance) coefficients
  CbR: -0.168736,
  CbG: -0.331264,
  CbB: 0.5,

  // Cr (red chrominance) coefficients
  CrR: 0.5,
  CrG: -0.418688,
  CrB: -0.081312,
};

/**
 * Inverse coefficients for YCbCr to RGB conversion.
 * Derived from the forward transformation matrix.
 */
const YCBCR_TO_RGB_COEFFICIENTS = {
  // R coefficients
  RY: 1.0,
  RCb: 0.0,
  RCr: 1.402,

  // G coefficients
  GY: 1.0,
  GCb: -0.344136,
  GCr: -0.714136,

  // B coefficients
  BY: 1.0,
  BCb: 1.772,
  BCr: 0.0,
};

/**
 * Validates RGB color values.
 *
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @throws {Error} If values are invalid
 */
export function validateRGB(r, g, b) {
  if (typeof r !== "number" || Number.isNaN(r) || r < 0 || r > 255) {
    throw new Error(`Red component must be 0-255 (got ${r})`);
  }
  if (typeof g !== "number" || Number.isNaN(g) || g < 0 || g > 255) {
    throw new Error(`Green component must be 0-255 (got ${g})`);
  }
  if (typeof b !== "number" || Number.isNaN(b) || b < 0 || b > 255) {
    throw new Error(`Blue component must be 0-255 (got ${b})`);
  }
}

/**
 * Validates YCbCr color values.
 *
 * @param {number} y - Luminance component (0-255)
 * @param {number} cb - Blue chrominance component (-128 to 127)
 * @param {number} cr - Red chrominance component (-128 to 127)
 * @throws {Error} If values are invalid
 */
export function validateYCbCr(y, cb, cr) {
  if (typeof y !== "number" || Number.isNaN(y) || y < 0 || y > 255) {
    throw new Error(`Y (luminance) component must be 0-255 (got ${y})`);
  }
  if (typeof cb !== "number" || Number.isNaN(cb) || cb < -128 || cb > 127) {
    throw new Error(`Cb (chrominance) component must be -128 to 127 (got ${cb})`);
  }
  if (typeof cr !== "number" || Number.isNaN(cr) || cr < -128 || cr > 127) {
    throw new Error(`Cr (chrominance) component must be -128 to 127 (got ${cr})`);
  }
}

/**
 * Converts RGB color to YCbCr color space.
 *
 * Uses ITU-R BT.601 standard coefficients. The conversion shifts
 * chrominance components to center around 0 for better compression.
 *
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {[number, number, number]} [Y, Cb, Cr] components
 * @throws {Error} If RGB values are invalid
 *
 * @example
 * const [y, cb, cr] = rgbToYCbCr(255, 0, 0); // Pure red
 * // y ≈ 76, cb ≈ -43, cr ≈ 127
 */
export function rgbToYCbCr(r, g, b) {
  validateRGB(r, g, b);

  const { YR, YG, YB, CbR, CbG, CbB, CrR, CrG, CrB } = RGB_TO_YCBCR_COEFFICIENTS;

  // Calculate Y (luminance)
  const y = YR * r + YG * g + YB * b;

  // Calculate Cb (blue chrominance) - shifted to center around 0
  const cb = CbR * r + CbG * g + CbB * b;

  // Calculate Cr (red chrominance) - shifted to center around 0
  const cr = CrR * r + CrG * g + CrB * b;

  return [
    Math.round(Math.max(0, Math.min(255, y))),
    Math.round(Math.max(-128, Math.min(127, cb))),
    Math.round(Math.max(-128, Math.min(127, cr))),
  ];
}

/**
 * Converts YCbCr color to RGB color space.
 *
 * Reverses the RGB to YCbCr transformation using inverse coefficients.
 * Clamps results to valid RGB range [0, 255].
 *
 * @param {number} y - Luminance component (0-255)
 * @param {number} cb - Blue chrominance component (-128 to 127)
 * @param {number} cr - Red chrominance component (-128 to 127)
 * @returns {[number, number, number]} [R, G, B] components
 * @throws {Error} If YCbCr values are invalid
 *
 * @example
 * const [r, g, b] = yCbCrToRGB(76, -43, 127);
 * // Should approximate original red: [255, 0, 0]
 */
export function yCbCrToRGB(y, cb, cr) {
  validateYCbCr(y, cb, cr);

  const { RY, RCb, RCr, GY, GCb, GCr, BY, BCb, BCr } = YCBCR_TO_RGB_COEFFICIENTS;

  // Calculate R (red)
  const r = RY * y + RCb * cb + RCr * cr;

  // Calculate G (green)
  const g = GY * y + GCb * cb + GCr * cr;

  // Calculate B (blue)
  const b = BY * y + BCb * cb + BCr * cr;

  return [
    Math.round(Math.max(0, Math.min(255, r))),
    Math.round(Math.max(0, Math.min(255, g))),
    Math.round(Math.max(0, Math.min(255, b))),
  ];
}

/**
 * Converts RGB pixel array to YCbCr format.
 * Processes RGBA pixels and converts RGB channels while preserving alpha.
 *
 * @param {Uint8Array} rgbaPixels - RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {Uint8Array} YCbCrA pixel data (4 bytes per pixel)
 * @throws {Error} If inputs are invalid
 *
 * @example
 * const rgbaPixels = new Uint8Array([255, 0, 0, 255]); // Red pixel
 * const ycbcrPixels = convertRGBAToYCbCrA(rgbaPixels, 1, 1);
 * // ycbcrPixels contains [Y, Cb, Cr, A] for the red pixel
 */
export function convertRGBAToYCbCrA(rgbaPixels, width, height) {
  if (!(rgbaPixels instanceof Uint8Array)) {
    throw new Error("Pixels must be a Uint8Array");
  }

  const expectedLength = width * height * 4;
  if (rgbaPixels.length !== expectedLength) {
    throw new Error(`Expected ${expectedLength} bytes for ${width}x${height} RGBA image, got ${rgbaPixels.length}`);
  }

  const ycbcrPixels = new Uint8Array(rgbaPixels.length);

  for (let i = 0; i < rgbaPixels.length; i += 4) {
    const r = rgbaPixels[i];
    const g = rgbaPixels[i + 1];
    const b = rgbaPixels[i + 2];
    const a = rgbaPixels[i + 3];

    const [y, cb, cr] = rgbToYCbCr(r, g, b);

    // Store as Y, Cb+128, Cr+128, A (shift chrominance to 0-255 range)
    ycbcrPixels[i] = y;
    ycbcrPixels[i + 1] = cb + 128;
    ycbcrPixels[i + 2] = cr + 128;
    ycbcrPixels[i + 3] = a;
  }

  return ycbcrPixels;
}

/**
 * Converts YCbCr pixel array to RGB format.
 * Processes YCbCrA pixels and converts YCbCr channels while preserving alpha.
 *
 * @param {Uint8Array} ycbcrPixels - YCbCrA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {Uint8Array} RGBA pixel data (4 bytes per pixel)
 * @throws {Error} If inputs are invalid
 *
 * @example
 * const ycbcrPixels = new Uint8Array([76, 85, 255, 255]); // Red pixel in YCbCr
 * const rgbaPixels = convertYCbCrAToRGBA(ycbcrPixels, 1, 1);
 * // rgbaPixels contains [R, G, B, A] approximating original red
 */
export function convertYCbCrAToRGBA(ycbcrPixels, width, height) {
  if (!(ycbcrPixels instanceof Uint8Array)) {
    throw new Error("Pixels must be a Uint8Array");
  }

  const expectedLength = width * height * 4;
  if (ycbcrPixels.length !== expectedLength) {
    throw new Error(`Expected ${expectedLength} bytes for ${width}x${height} YCbCrA image, got ${ycbcrPixels.length}`);
  }

  const rgbaPixels = new Uint8Array(ycbcrPixels.length);

  for (let i = 0; i < ycbcrPixels.length; i += 4) {
    const y = ycbcrPixels[i];
    const cb = ycbcrPixels[i + 1] - 128; // Shift back to -128 to 127 range
    const cr = ycbcrPixels[i + 2] - 128; // Shift back to -128 to 127 range
    const a = ycbcrPixels[i + 3];

    const [r, g, b] = yCbCrToRGB(y, cb, cr);

    rgbaPixels[i] = r;
    rgbaPixels[i + 1] = g;
    rgbaPixels[i + 2] = b;
    rgbaPixels[i + 3] = a;
  }

  return rgbaPixels;
}

/**
 * Analyzes color space conversion accuracy.
 * Useful for testing and validation of conversion algorithms.
 *
 * @param {Uint8Array} originalRGBA - Original RGBA pixels
 * @param {Uint8Array} convertedRGBA - Converted RGBA pixels after roundtrip
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {{
 *   maxError: number,
 *   avgError: number,
 *   rmseError: number,
 *   pixelsWithError: number,
 *   totalPixels: number
 * }} Conversion accuracy analysis
 */
export function analyzeConversionAccuracy(originalRGBA, convertedRGBA, width, height) {
  if (originalRGBA.length !== convertedRGBA.length) {
    throw new Error("Original and converted arrays must have same length");
  }

  const totalPixels = width * height;
  let maxError = 0;
  let totalError = 0;
  let squaredError = 0;
  let pixelsWithError = 0;

  for (let i = 0; i < originalRGBA.length; i += 4) {
    // Compare RGB channels (skip alpha)
    for (let channel = 0; channel < 3; channel++) {
      const original = originalRGBA[i + channel];
      const converted = convertedRGBA[i + channel];
      const error = Math.abs(original - converted);

      if (error > 0) {
        if (channel === 0) pixelsWithError++; // Count once per pixel
        maxError = Math.max(maxError, error);
        totalError += error;
        squaredError += error * error;
      }
    }
  }

  const avgError = totalError / (totalPixels * 3); // Average per channel
  const rmseError = Math.sqrt(squaredError / (totalPixels * 3));

  return {
    maxError,
    avgError,
    rmseError,
    pixelsWithError,
    totalPixels,
  };
}

/**
 * Creates test patterns for color conversion validation.
 * Generates known RGB patterns useful for testing conversion accuracy.
 *
 * @param {string} pattern - Pattern type ("gradient", "primary", "grayscale", "random")
 * @param {number} [width=8] - Pattern width
 * @param {number} [height=8] - Pattern height
 * @returns {Uint8Array} RGBA pixel data for the test pattern
 *
 * @example
 * const gradient = createColorTestPattern("gradient", 256, 256);
 * const primary = createColorTestPattern("primary", 3, 1);
 * // Use for testing conversion accuracy and edge cases
 */
export function createColorTestPattern(pattern, width = 8, height = 8) {
  const pixels = new Uint8Array(width * height * 4);

  switch (pattern) {
    case "gradient": {
      // Smooth RGB gradient
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          pixels[index] = Math.floor((x / (width - 1)) * 255); // R gradient
          pixels[index + 1] = Math.floor((y / (height - 1)) * 255); // G gradient
          pixels[index + 2] = 128; // Constant B
          pixels[index + 3] = 255; // Full alpha
        }
      }
      break;
    }

    case "primary": {
      // Primary colors: Red, Green, Blue
      const colors = [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
      ];
      for (let i = 0; i < width * height; i++) {
        const colorIndex = i % colors.length;
        const pixelIndex = i * 4;
        pixels[pixelIndex] = colors[colorIndex][0];
        pixels[pixelIndex + 1] = colors[colorIndex][1];
        pixels[pixelIndex + 2] = colors[colorIndex][2];
        pixels[pixelIndex + 3] = 255;
      }
      break;
    }

    case "grayscale": {
      // Grayscale gradient
      for (let i = 0; i < width * height; i++) {
        const gray = Math.floor((i / (width * height - 1)) * 255);
        const pixelIndex = i * 4;
        pixels[pixelIndex] = gray;
        pixels[pixelIndex + 1] = gray;
        pixels[pixelIndex + 2] = gray;
        pixels[pixelIndex + 3] = 255;
      }
      break;
    }

    case "random": {
      // Random colors for stress testing
      for (let i = 0; i < width * height * 4; i += 4) {
        pixels[i] = Math.floor(Math.random() * 256); // R
        pixels[i + 1] = Math.floor(Math.random() * 256); // G
        pixels[i + 2] = Math.floor(Math.random() * 256); // B
        pixels[i + 3] = 255; // A
      }
      break;
    }

    default:
      throw new Error(`Unknown test pattern: ${pattern}`);
  }

  return pixels;
}

/**
 * Gets color space conversion coefficients.
 * Useful for debugging and validation purposes.
 *
 * @returns {{
 *   rgbToYCbCr: Object,
 *   yCbCrToRGB: Object
 * }} Conversion coefficient matrices
 */
export function getConversionCoefficients() {
  return {
    rgbToYCbCr: { ...RGB_TO_YCBCR_COEFFICIENTS },
    yCbCrToRGB: { ...YCBCR_TO_RGB_COEFFICIENTS },
  };
}
