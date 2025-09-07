/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Main convolution functions for kernel-based image filtering.
 */

import {
  applyKernelToPixel,
  createBoxBlurKernel,
  createEdgeDetectionKernel,
  createGaussianKernel,
  createSharpenKernel,
  createUnsharpMaskKernel,
  validateConvolutionParameters,
  validateKernel,
} from "./utils.js";

/**
 * Applies a convolution kernel to RGBA pixel data.
 *
 * Convolution is a fundamental operation in image processing that applies
 * a kernel (small matrix) to each pixel and its neighbors to create effects
 * like blur, sharpen, edge detection, and more.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number[][]} kernel - 2D convolution kernel matrix
 * @param {Object} [options={}] - Convolution options
 * @param {string} [options.edgeHandling="clamp"] - Edge handling ("clamp", "wrap", "mirror")
 * @param {boolean} [options.preserveAlpha=true] - Whether to preserve original alpha values
 * @param {boolean} [options.inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Convolved image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Apply Gaussian blur
 * const blurKernel = createGaussianKernel(5, 1.0);
 * const result = applyConvolution(pixels, 800, 600, blurKernel);
 *
 * // Apply sharpening
 * const sharpenKernel = createSharpenKernel(1.5);
 * const result = applyConvolution(pixels, 800, 600, sharpenKernel);
 *
 * // Custom edge handling
 * const result = applyConvolution(pixels, 800, 600, kernel, {
 *   edgeHandling: "mirror",
 *   preserveAlpha: false
 * });
 */
export function applyConvolution(pixels, width, height, kernel, options = {}) {
  // Validate all parameters
  validateConvolutionParameters(pixels, width, height, kernel);

  const { edgeHandling = "clamp", preserveAlpha = true, inPlace = true } = options;

  const output = inPlace ? pixels : new Uint8Array(pixels);

  // Process all pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [newR, newG, newB, newA] = applyKernelToPixel(
        pixels, // Always read from original
        x,
        y,
        width,
        height,
        kernel,
        edgeHandling
      );

      const index = (y * width + x) * 4;
      output[index] = newR; // Red
      output[index + 1] = newG; // Green
      output[index + 2] = newB; // Blue
      output[index + 3] = preserveAlpha ? pixels[index + 3] : newA; // Alpha
    }
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Applies Gaussian blur to RGBA pixel data.
 *
 * Gaussian blur creates a smooth, natural-looking blur effect using a
 * mathematically derived Gaussian distribution kernel.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} [radius=1.0] - Blur radius [0.5 to 5.0]
 * @param {number} [sigma] - Standard deviation (auto-calculated if not provided)
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Blurred image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Light blur
 * const result = applyGaussianBlur(pixels, 800, 600, 1.0);
 *
 * // Heavy blur
 * const result = applyGaussianBlur(pixels, 800, 600, 3.0);
 *
 * // Custom sigma
 * const result = applyGaussianBlur(pixels, 800, 600, 2.0, 1.5);
 */
export function applyGaussianBlur(pixels, width, height, radius = 1.0, sigma, inPlace = true) {
  if (radius < 0.5 || radius > 5.0) {
    throw new Error("Blur radius must be between 0.5 and 5.0");
  }

  // Auto-calculate sigma if not provided (common practice: sigma = radius / 2)
  const actualSigma = sigma ?? radius / 2;

  // Calculate kernel size (should be odd and cover ~3 sigma on each side)
  const kernelSize = Math.max(3, Math.ceil(radius * 2) * 2 + 1);

  const kernel = createGaussianKernel(kernelSize, actualSigma);

  return applyConvolution(pixels, width, height, kernel, {
    edgeHandling: "clamp",
    preserveAlpha: true,
    inPlace,
  });
}

/**
 * Applies box blur to RGBA pixel data.
 *
 * Box blur creates a simple, uniform blur effect. It's faster than Gaussian
 * blur but produces less natural-looking results.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} [size=3] - Kernel size (must be odd: 3, 5, 7, etc.)
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Blurred image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Light box blur
 * const result = applyBoxBlur(pixels, 800, 600, 3);
 *
 * // Heavy box blur
 * const result = applyBoxBlur(pixels, 800, 600, 9);
 */
export function applyBoxBlur(pixels, width, height, size = 3, inPlace = true) {
  const kernel = createBoxBlurKernel(size);

  return applyConvolution(pixels, width, height, kernel, {
    edgeHandling: "clamp",
    preserveAlpha: true,
    inPlace,
  });
}

/**
 * Applies sharpening to RGBA pixel data.
 *
 * Sharpening enhances edges and details in the image by emphasizing
 * differences between neighboring pixels.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} [strength=1.0] - Sharpening strength [0.0 to 2.0]
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Sharpened image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Light sharpening
 * const result = applySharpen(pixels, 800, 600, 0.5);
 *
 * // Strong sharpening
 * const result = applySharpen(pixels, 800, 600, 1.5);
 */
export function applySharpen(pixels, width, height, strength = 1.0, inPlace = true) {
  const kernel = createSharpenKernel(strength);

  return applyConvolution(pixels, width, height, kernel, {
    edgeHandling: "clamp",
    preserveAlpha: true,
    inPlace,
  });
}

/**
 * Applies unsharp mask sharpening to RGBA pixel data.
 *
 * Unsharp masking is a more sophisticated sharpening technique that
 * creates a "mask" from a blurred version of the image and uses it
 * to enhance edge contrast.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} [amount=1.0] - Sharpening amount [0.0 to 3.0]
 * @param {number} [radius=1.0] - Blur radius for mask [0.5 to 3.0]
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Sharpened image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Subtle unsharp masking
 * const result = applyUnsharpMask(pixels, 800, 600, 0.8, 1.0);
 *
 * // Strong unsharp masking
 * const result = applyUnsharpMask(pixels, 800, 600, 2.0, 1.5);
 */
export function applyUnsharpMask(pixels, width, height, amount = 1.0, radius = 1.0, inPlace = true) {
  const kernel = createUnsharpMaskKernel(amount, radius);

  return applyConvolution(pixels, width, height, kernel, {
    edgeHandling: "clamp",
    preserveAlpha: true,
    inPlace,
  });
}

/**
 * Applies edge detection to RGBA pixel data.
 *
 * Edge detection highlights boundaries and transitions in the image
 * using various mathematical operators.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {string} [type="sobel-x"] - Edge detection type
 * @param {boolean} [inPlace=true] - Whether to modify the original array
 * @returns {{pixels: Uint8Array, width: number, height: number}} Edge-detected image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Horizontal edge detection
 * const result = applyEdgeDetection(pixels, 800, 600, "sobel-x");
 *
 * // Laplacian edge detection
 * const result = applyEdgeDetection(pixels, 800, 600, "laplacian");
 */
export function applyEdgeDetection(pixels, width, height, type = "sobel-x", inPlace = true) {
  const kernel = createEdgeDetectionKernel(type);

  return applyConvolution(pixels, width, height, kernel, {
    edgeHandling: "clamp",
    preserveAlpha: true,
    inPlace,
  });
}

/**
 * Gets information about a convolution operation without performing it.
 * Useful for validation and UI feedback.
 *
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number[][]} kernel - 2D convolution kernel matrix
 * @param {string} [operation="convolution"] - Operation name for description
 * @returns {{
 *   operation: string,
 *   kernelSize: number,
 *   isLossless: boolean,
 *   isReversible: boolean,
 *   outputDimensions: {width: number, height: number},
 *   outputSize: number,
 *   description: string,
 *   isValid: boolean
 * }} Convolution operation information
 */
export function getConvolutionInfo(width, height, kernel, operation = "convolution") {
  try {
    // Basic validation
    if (!Number.isInteger(width) || width <= 0) {
      throw new Error("Invalid width");
    }
    if (!Number.isInteger(height) || height <= 0) {
      throw new Error("Invalid height");
    }

    // Validate kernel
    validateKernel(kernel);

    // Convolution never changes dimensions
    const outputDimensions = { width, height };
    const outputSize = width * height * 4;
    const kernelSize = kernel.length;

    // Determine operation characteristics (for future use)
    const _isBlur = operation.includes("blur");
    const _isSharpen = operation.includes("sharpen");
    const _isEdge = operation.includes("edge");

    return {
      operation,
      kernelSize,
      isLossless: false, // Convolution typically involves rounding
      isReversible: false, // Most convolutions are not reversible
      outputDimensions,
      outputSize,
      description: `${operation} using ${kernelSize}×${kernelSize} kernel`,
      isValid: true,
    };
  } catch (_error) {
    return {
      operation,
      kernelSize: 0,
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
 * Creates a preview of convolution effects on a small sample.
 * Useful for real-time UI feedback without processing the entire image.
 *
 * @param {Uint8Array} samplePixels - Small sample of RGBA pixel data
 * @param {number} sampleWidth - Sample width in pixels
 * @param {number} sampleHeight - Sample height in pixels
 * @param {number[][]} kernel - 2D convolution kernel matrix
 * @param {Object} [options={}] - Convolution options
 * @returns {{pixels: Uint8Array, width: number, height: number}} Preview result
 */
export function createConvolutionPreview(samplePixels, sampleWidth, sampleHeight, kernel, options = {}) {
  // Validate sample size (should be small for performance)
  if (samplePixels.length > 64 * 64 * 4) {
    throw new Error("Sample too large for preview (max 64x64 pixels)");
  }

  return applyConvolution(
    samplePixels,
    sampleWidth,
    sampleHeight,
    kernel,
    { ...options, inPlace: false } // Always create new array for preview
  );
}
