/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Base Image class providing uniform interface for all image formats.
 *
 * Abstract base class defining the standard API for image manipulation operations.
 * All format-specific implementations extend this class to ensure consistent
 * behavior across PNG, JPEG, WebP, and GIF formats.
 */

import {
  adjustBrightness,
  adjustContrast,
  adjustHue,
  adjustHueSaturation,
  adjustSaturation,
  applyColorInversion,
  applySepiaEffect,
  convertToGrayscale,
  getColorAdjustmentInfo,
  getColorInversionInfo,
  getGrayscaleInfo,
  getHslAdjustmentInfo,
  getSepiaInfo,
} from "./color/index.js";
import {
  applyBoxBlur,
  applyConvolution,
  applyEdgeDetection,
  applyGaussianBlur,
  applySharpen,
  applyUnsharpMask,
  getConvolutionInfo,
} from "./convolution/index.js";
import { cropPixels, getCropInfo } from "./crop/index.js";
import { flipPixels, getFlipInfo } from "./flip/index.js";
import { resizePixels } from "./resize/index.js";
import { getRotationInfo, rotatePixels } from "./rotate/index.js";

/**
 * Base class for image processing operations.
 *
 * Provides uniform interface for decoding, manipulating, and encoding images
 * regardless of source format. Internal pixel representation uses RGBA Uint8Array
 * for consistent operations across all formats.
 */
export class Image {
  /**
   * Creates new Image instance from buffer data.
   *
   * @param {ArrayBuffer|Uint8Array} buffer - Raw image data
   * @param {string} mimeType - MIME type of source image
   */
  constructor(buffer, mimeType) {
    this.rawData = new Uint8Array(buffer);
    this.mimeType = mimeType;
    this.originalMimeType = mimeType;
    this.pixels = null; // RGBA Uint8Array
    this.metadata = {};
    this._width = 0;
    this._height = 0;
    this._channels = 4; // RGBA
  }

  /**
   * Resize image to specified dimensions.
   *
   * @param {number} width - Target width in pixels
   * @param {number} height - Target height in pixels
   * @param {string} algorithm - Resampling algorithm ('nearest'|'bilinear'|'bicubic'|'lanczos')
   * @returns {Image} This instance for chaining
   */
  resize(width, height, algorithm = "bilinear") {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for resizing");
    }

    try {
      // Perform resize operation
      this.pixels = resizePixels(this.pixels, this._width, this._height, width, height, algorithm);

      // Update dimensions
      this._width = width;
      this._height = height;
    } catch (error) {
      throw new Error(`Resize failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Crop image to specified rectangle.
   *
   * @param {number} x - Left offset in pixels
   * @param {number} y - Top offset in pixels
   * @param {number} width - Crop width in pixels
   * @param {number} height - Crop height in pixels
   * @returns {Image} This instance for chaining
   */
  crop(x, y, width, height) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for cropping");
    }

    try {
      // Get crop information to determine actual output dimensions
      const cropInfo = getCropInfo(this._width, this._height, x, y, width, height);

      if (!cropInfo.isValid) {
        throw new Error(`Invalid crop region (${x}, ${y}, ${width}x${height})`);
      }

      // Perform crop operation
      const croppedPixels = cropPixels(this.pixels, this._width, this._height, x, y, width, height);

      // Update image state with actual dimensions
      this.pixels = croppedPixels;
      this._width = cropInfo.effectiveBounds.width;
      this._height = cropInfo.effectiveBounds.height;
    } catch (error) {
      throw new Error(`Crop failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Rotate image by specified degrees.
   *
   * @param {number} degrees - Rotation angle in degrees (positive = clockwise)
   * @param {string} [algorithm="bilinear"] - Interpolation algorithm for arbitrary angles
   * @param {[number, number, number, number]} [fillColor=[0, 0, 0, 0]] - RGBA fill color for empty areas
   * @returns {Image} This instance for chaining
   */
  rotate(degrees, algorithm = "bilinear", fillColor = [0, 0, 0, 0]) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for rotation");
    }

    try {
      // Get rotation information to determine actual output dimensions
      const rotationInfo = getRotationInfo(this._width, this._height, degrees);

      if (!rotationInfo.outputDimensions.width || !rotationInfo.outputDimensions.height) {
        throw new Error(`Invalid rotation angle: ${degrees}`);
      }

      // Perform rotation operation
      const rotatedResult = rotatePixels(this.pixels, this._width, this._height, degrees, algorithm, fillColor);

      // Update image state with rotated data
      this.pixels = rotatedResult.pixels;
      this._width = rotatedResult.width;
      this._height = rotatedResult.height;
    } catch (error) {
      throw new Error(`Rotation failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Flip image horizontally or vertically.
   *
   * @param {'horizontal'|'vertical'} direction - Flip direction
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  flip(direction, inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for flipping");
    }

    try {
      // Get flip information to validate parameters
      const flipInfo = getFlipInfo(this._width, this._height, direction);

      if (!flipInfo.isValid) {
        throw new Error(`Invalid flip direction: ${direction}`);
      }

      // Perform flip operation
      const flippedResult = flipPixels(this.pixels, this._width, this._height, direction, inPlace);

      // Update image state with flipped data
      this.pixels = flippedResult.pixels;
      // Note: dimensions don't change for flipping
      this._width = flippedResult.width;
      this._height = flippedResult.height;
    } catch (error) {
      throw new Error(`Flip failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Adjust image brightness.
   *
   * @param {number} factor - Brightness multiplier (1.0 = no change, >1.0 = brighter, <1.0 = darker)
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  adjustBrightness(factor, inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for brightness adjustment");
    }

    try {
      // Get adjustment information to validate parameters
      const adjustmentInfo = getColorAdjustmentInfo(this._width, this._height, factor, "brightness");

      if (!adjustmentInfo.isValid) {
        throw new Error(`Invalid brightness factor: ${factor}`);
      }

      // Perform brightness adjustment
      const adjustedResult = adjustBrightness(this.pixels, this._width, this._height, factor, inPlace);

      // Update image state with adjusted data
      this.pixels = adjustedResult.pixels;
      // Note: dimensions don't change for color adjustments
      this._width = adjustedResult.width;
      this._height = adjustedResult.height;
    } catch (error) {
      throw new Error(`Brightness adjustment failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Adjust image contrast.
   *
   * @param {number} factor - Contrast multiplier (1.0 = no change, >1.0 = more contrast, <1.0 = less contrast)
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  adjustContrast(factor, inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for contrast adjustment");
    }

    try {
      // Get adjustment information to validate parameters
      const adjustmentInfo = getColorAdjustmentInfo(this._width, this._height, factor, "contrast");

      if (!adjustmentInfo.isValid) {
        throw new Error(`Invalid contrast factor: ${factor}`);
      }

      // Perform contrast adjustment
      const adjustedResult = adjustContrast(this.pixels, this._width, this._height, factor, inPlace);

      // Update image state with adjusted data
      this.pixels = adjustedResult.pixels;
      // Note: dimensions don't change for color adjustments
      this._width = adjustedResult.width;
      this._height = adjustedResult.height;
    } catch (error) {
      throw new Error(`Contrast adjustment failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Convert image to grayscale.
   *
   * @param {string} [method="luminance"] - Conversion method ("luminance", "average", "desaturate", "max", "min")
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  grayscale(method = "luminance", inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for grayscale conversion");
    }

    try {
      // Get grayscale information to validate parameters
      const grayscaleInfo = getGrayscaleInfo(this._width, this._height, method);

      if (!grayscaleInfo.isValid) {
        throw new Error(`Invalid grayscale method: ${method}`);
      }

      // Perform grayscale conversion
      const grayscaleResult = convertToGrayscale(this.pixels, this._width, this._height, method, inPlace);

      // Update image state with grayscale data
      this.pixels = grayscaleResult.pixels;
      // Note: dimensions don't change for grayscale conversion
      this._width = grayscaleResult.width;
      this._height = grayscaleResult.height;
    } catch (error) {
      throw new Error(`Grayscale conversion failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Invert image colors to create negative effect.
   *
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  invert(inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for color inversion");
    }

    try {
      // Get inversion information to validate parameters
      const inversionInfo = getColorInversionInfo(this._width, this._height);

      if (!inversionInfo.isValid) {
        throw new Error("Invalid parameters for color inversion");
      }

      // Perform color inversion
      const inversionResult = applyColorInversion(this.pixels, this._width, this._height, inPlace);

      // Update image state with inverted data
      this.pixels = inversionResult.pixels;
      // Note: dimensions don't change for color inversion
      this._width = inversionResult.width;
      this._height = inversionResult.height;
    } catch (error) {
      throw new Error(`Color inversion failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Apply sepia tone effect for vintage appearance.
   *
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  sepia(inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for sepia effect");
    }

    try {
      // Get sepia information to validate parameters
      const sepiaInfo = getSepiaInfo(this._width, this._height);

      if (!sepiaInfo.isValid) {
        throw new Error("Invalid parameters for sepia effect");
      }

      // Perform sepia transformation
      const sepiaResult = applySepiaEffect(this.pixels, this._width, this._height, inPlace);

      // Update image state with sepia data
      this.pixels = sepiaResult.pixels;
      // Note: dimensions don't change for sepia effect
      this._width = sepiaResult.width;
      this._height = sepiaResult.height;
    } catch (error) {
      throw new Error(`Sepia effect failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Adjust image saturation using HSL color space.
   *
   * @param {number} saturationFactor - Saturation multiplier [0.0 to 2.0]
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  adjustSaturation(saturationFactor, inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for saturation adjustment");
    }

    try {
      // Get HSL adjustment information to validate parameters
      const hslInfo = getHslAdjustmentInfo(this._width, this._height, 0, saturationFactor);

      if (!hslInfo.isValid) {
        throw new Error("Invalid parameters for saturation adjustment");
      }

      // Perform saturation adjustment
      const saturationResult = adjustSaturation(this.pixels, this._width, this._height, saturationFactor, inPlace);

      // Update image state with adjusted data
      this.pixels = saturationResult.pixels;
      // Note: dimensions don't change for saturation adjustment
      this._width = saturationResult.width;
      this._height = saturationResult.height;
    } catch (error) {
      throw new Error(`Saturation adjustment failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Adjust image hue using HSL color space.
   *
   * @param {number} hueShift - Hue shift in degrees [-360 to 360]
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  adjustHue(hueShift, inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for hue adjustment");
    }

    try {
      // Get HSL adjustment information to validate parameters
      const hslInfo = getHslAdjustmentInfo(this._width, this._height, hueShift, 1.0);

      if (!hslInfo.isValid) {
        throw new Error("Invalid parameters for hue adjustment");
      }

      // Perform hue adjustment
      const hueResult = adjustHue(this.pixels, this._width, this._height, hueShift, inPlace);

      // Update image state with adjusted data
      this.pixels = hueResult.pixels;
      // Note: dimensions don't change for hue adjustment
      this._width = hueResult.width;
      this._height = hueResult.height;
    } catch (error) {
      throw new Error(`Hue adjustment failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Adjust both hue and saturation using HSL color space.
   *
   * @param {number} hueShift - Hue shift in degrees [-360 to 360]
   * @param {number} saturationFactor - Saturation multiplier [0.0 to 2.0]
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  adjustHueSaturation(hueShift, saturationFactor, inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for HSL adjustment");
    }

    try {
      // Get HSL adjustment information to validate parameters
      const hslInfo = getHslAdjustmentInfo(this._width, this._height, hueShift, saturationFactor);

      if (!hslInfo.isValid) {
        throw new Error("Invalid parameters for HSL adjustment");
      }

      // Perform combined HSL adjustment
      const hslResult = adjustHueSaturation(
        this.pixels,
        this._width,
        this._height,
        hueShift,
        saturationFactor,
        inPlace
      );

      // Update image state with adjusted data
      this.pixels = hslResult.pixels;
      // Note: dimensions don't change for HSL adjustment
      this._width = hslResult.width;
      this._height = hslResult.height;
    } catch (error) {
      throw new Error(`HSL adjustment failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Apply Gaussian blur to the image.
   *
   * @param {number} [radius=1.0] - Blur radius [0.5 to 5.0]
   * @param {number} [sigma] - Standard deviation (auto-calculated if not provided)
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  blur(radius = 1.0, sigma, inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for blur");
    }

    try {
      // Get convolution information to validate parameters
      const convolutionInfo = getConvolutionInfo(this._width, this._height, [[1]], "gaussian-blur");

      if (!convolutionInfo.isValid) {
        throw new Error("Invalid parameters for blur operation");
      }

      // Perform Gaussian blur
      const blurResult = applyGaussianBlur(this.pixels, this._width, this._height, radius, sigma, inPlace);

      // Update image state with blurred data
      this.pixels = blurResult.pixels;
      // Note: dimensions don't change for blur
      this._width = blurResult.width;
      this._height = blurResult.height;
    } catch (error) {
      throw new Error(`Blur operation failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Apply box blur to the image.
   *
   * @param {number} [size=3] - Kernel size (must be odd: 3, 5, 7, etc.)
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  boxBlur(size = 3, inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for box blur");
    }

    try {
      // Perform box blur
      const blurResult = applyBoxBlur(this.pixels, this._width, this._height, size, inPlace);

      // Update image state with blurred data
      this.pixels = blurResult.pixels;
      this._width = blurResult.width;
      this._height = blurResult.height;
    } catch (error) {
      throw new Error(`Box blur operation failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Apply sharpening to the image.
   *
   * @param {number} [strength=1.0] - Sharpening strength [0.0 to 2.0]
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  sharpen(strength = 1.0, inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for sharpening");
    }

    try {
      // Perform sharpening
      const sharpenResult = applySharpen(this.pixels, this._width, this._height, strength, inPlace);

      // Update image state with sharpened data
      this.pixels = sharpenResult.pixels;
      this._width = sharpenResult.width;
      this._height = sharpenResult.height;
    } catch (error) {
      throw new Error(`Sharpen operation failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Apply unsharp mask sharpening to the image.
   *
   * @param {number} [amount=1.0] - Sharpening amount [0.0 to 3.0]
   * @param {number} [radius=1.0] - Blur radius for mask [0.5 to 3.0]
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  unsharpMask(amount = 1.0, radius = 1.0, inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for unsharp mask");
    }

    try {
      // Perform unsharp mask sharpening
      const sharpenResult = applyUnsharpMask(this.pixels, this._width, this._height, amount, radius, inPlace);

      // Update image state with sharpened data
      this.pixels = sharpenResult.pixels;
      this._width = sharpenResult.width;
      this._height = sharpenResult.height;
    } catch (error) {
      throw new Error(`Unsharp mask operation failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Apply edge detection to the image.
   *
   * @param {string} [type="sobel-x"] - Edge detection type ("sobel-x", "sobel-y", "laplacian", etc.)
   * @param {boolean} [inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  detectEdges(type = "sobel-x", inPlace = true) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for edge detection");
    }

    try {
      // Perform edge detection
      const edgeResult = applyEdgeDetection(this.pixels, this._width, this._height, type, inPlace);

      // Update image state with edge-detected data
      this.pixels = edgeResult.pixels;
      this._width = edgeResult.width;
      this._height = edgeResult.height;
    } catch (error) {
      throw new Error(`Edge detection failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Apply custom convolution kernel to the image.
   *
   * @param {number[][]} kernel - 2D convolution kernel matrix
   * @param {Object} [options={}] - Convolution options
   * @param {string} [options.edgeHandling="clamp"] - Edge handling ("clamp", "wrap", "mirror")
   * @param {boolean} [options.preserveAlpha=true] - Whether to preserve original alpha values
   * @param {boolean} [options.inPlace=true] - Whether to modify pixels in-place for performance
   * @returns {Image} This instance for chaining
   */
  convolve(kernel, options = {}) {
    if (!this.pixels) {
      throw new Error("Image not decoded yet - no pixel data available for convolution");
    }

    try {
      // Get convolution information to validate parameters
      const convolutionInfo = getConvolutionInfo(this._width, this._height, kernel, "custom");

      if (!convolutionInfo.isValid) {
        throw new Error("Invalid parameters for convolution operation");
      }

      // Perform convolution
      const convolutionResult = applyConvolution(this.pixels, this._width, this._height, kernel, {
        inPlace: true,
        ...options,
      });

      // Update image state with convolved data
      this.pixels = convolutionResult.pixels;
      this._width = convolutionResult.width;
      this._height = convolutionResult.height;
    } catch (error) {
      throw new Error(`Convolution operation failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Encode image to buffer in specified format.
   *
   * @param {string} _targetMimeType - Target MIME type
   * @param {Object} _options - Format-specific encoding options
   * @returns {Uint8Array} Encoded image buffer
   */
  toBuffer(_targetMimeType = this.originalMimeType, _options = {}) {
    // Stub implementation
    return new Uint8Array(0);
  }

  /**
   * Extract image metadata (EXIF, XMP, IPTC, etc.).
   *
   * @returns {Object} Metadata object with format-specific properties
   */
  getMetadata() {
    // Stub implementation
    return {};
  }

  /**
   * Set image metadata.
   *
   * @param {Object} _metadata - Metadata to set
   * @returns {Image} This instance for chaining
   */
  setMetadata(_metadata) {
    // Stub implementation
    return this;
  }

  /**
   * Get image width in pixels.
   *
   * @returns {number} Image width
   */
  get width() {
    return this._width;
  }

  /**
   * Get image height in pixels.
   *
   * @returns {number} Image height
   */
  get height() {
    return this._height;
  }

  /**
   * Get number of color channels.
   *
   * @returns {number} Channel count (typically 3 for RGB, 4 for RGBA)
   */
  get channels() {
    return this._channels;
  }

  /**
   * Get total pixel count.
   *
   * @returns {number} Total pixels (width × height)
   */
  get pixelCount() {
    return this._width * this._height;
  }

  /**
   * Check if image has alpha channel.
   *
   * @returns {boolean} True if alpha channel present
   */
  get hasAlpha() {
    return this._channels === 4;
  }
}
