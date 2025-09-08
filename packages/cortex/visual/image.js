/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Unified Image class for image processing and format conversion.
 *
 * Provides a single, unified interface for loading, manipulating, and saving images
 * across multiple formats. Uses static constructors for format-specific loading
 * and async instance methods for format-specific encoding.
 */

import { decodeJPEG, encodeJPEG } from "./codecs/jpeg/index.js";
import { decodePNG, encodePNG } from "./codecs/png/index.js";
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
 * Unified Image class for image processing and format conversion.
 *
 * Provides a single interface for loading, manipulating, and saving images
 * across multiple formats. Internal pixel representation uses RGBA Uint8Array
 * for consistent operations. Use static constructors to load images and
 * async instance methods to save in different formats.
 *
 * @example
 * // Load from PNG buffer
 * const image = await Image.fromPngBuffer(pngBuffer);
 *
 * // Manipulate image
 * image.resize(800, 600).brightness(0.1);
 *
 * // Save as JPEG
 * const jpegBuffer = await image.toJpegBuffer({ quality: 85 });
 */
export class Image {
  /**
   * Creates new Image instance with RGBA pixel data.
   *
   * @param {Uint8Array} pixels - RGBA pixel data
   * @param {number} width - Image width in pixels
   * @param {number} height - Image height in pixels
   * @param {Object} [metadata={}] - Image metadata
   */
  constructor(pixels, width, height, metadata = {}) {
    this.pixels = pixels; // RGBA Uint8Array
    this._width = width;
    this._height = height;
    this._channels = 4; // RGBA
    this.metadata = metadata;
  }

  /**
   * Create Image instance from PNG buffer.
   *
   * @param {ArrayBuffer|Uint8Array} buffer - PNG image data
   * @returns {Promise<Image>} Image instance with decoded PNG data
   * @throws {Error} If PNG decoding fails
   *
   * @example
   * const pngBuffer = readFileSync('image.png');
   * const image = await Image.fromPngBuffer(pngBuffer);
   */
  static async fromPngBuffer(buffer) {
    const { pixels, width, height, metadata } = await decodePNG(buffer);
    return new Image(pixels, width, height, metadata);
  }

  /**
   * Create Image instance from JPEG buffer.
   *
   * @param {ArrayBuffer|Uint8Array} buffer - JPEG image data
   * @returns {Promise<Image>} Image instance with decoded JPEG data
   * @throws {Error} If JPEG decoding fails
   *
   * @example
   * const jpegBuffer = readFileSync('image.jpg');
   * const image = await Image.fromJpegBuffer(jpegBuffer);
   */
  static async fromJpegBuffer(buffer) {
    const { pixels, width, height, metadata } = await decodeJPEG(buffer);
    return new Image(pixels, width, height, metadata);
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
    // Pixels are always available in unified Image class cropping");

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
    // Pixels are always available in unified Image class rotation");

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
    // Pixels are always available in unified Image class flipping");

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
    // Pixels are always available in unified Image class brightness adjustment");

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
    // Pixels are always available in unified Image class contrast adjustment");

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
    // Pixels are always available in unified Image class grayscale conversion");

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
    // Pixels are always available in unified Image class color inversion");

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
    // Pixels are always available in unified Image class sepia effect");

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
    // Pixels are always available in unified Image class saturation adjustment");

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
    // Pixels are always available in unified Image class hue adjustment");

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
    // Pixels are always available in unified Image class HSL adjustment");

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
    // Pixels are always available in unified Image class blur");

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
    // Pixels are always available in unified Image class box blur");

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
    // Pixels are always available in unified Image class sharpening");

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
    // Pixels are always available in unified Image class unsharp mask");

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
    // Pixels are always available in unified Image class edge detection");

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
    // Pixels are always available in unified Image class convolution");

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
  toBuffer(_targetMimeType, _options = {}) {
    throw new Error("toBuffer() is deprecated. Use toPngBuffer() or toJpegBuffer() instead.");
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

  /**
   * Encode image as PNG buffer.
   *
   * @param {Object} [options={}] - PNG encoding options
   * @param {number} [options.compressionLevel=6] - PNG compression level (0-9)
   * @param {string} [options.filter='auto'] - PNG filter type
   * @returns {Promise<Uint8Array>} PNG encoded buffer
   * @throws {Error} If PNG encoding fails
   *
   * @example
   * const pngBuffer = await image.toPngBuffer({ compressionLevel: 9 });
   * writeFileSync('output.png', pngBuffer);
   */
  async toPngBuffer(options = {}) {
    // Pixels are always available in unified Image class PNG encoding");
    return await encodePNG(this.pixels, this._width, this._height, options);
  }

  /**
   * Encode image as JPEG buffer.
   *
   * @param {Object} [options={}] - JPEG encoding options
   * @param {number} [options.quality=75] - JPEG quality (1-100)
   * @param {boolean} [options.progressive=false] - Enable progressive encoding
   * @param {string} [options.subsampling="4:2:0"] - Chroma subsampling mode
   * @returns {Promise<Uint8Array>} JPEG encoded buffer
   * @throws {Error} If JPEG encoding fails
   *
   * @example
   * const jpegBuffer = await image.toJpegBuffer({ quality: 85, progressive: true });
   * writeFileSync('output.jpg', jpegBuffer);
   */
  async toJpegBuffer(options = {}) {
    // Pixels are always available in unified Image class JPEG encoding");
    return await encodeJPEG(this.pixels, this._width, this._height, options);
  }
}
