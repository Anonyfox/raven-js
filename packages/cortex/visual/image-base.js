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

import { adjustBrightness, adjustContrast, getColorAdjustmentInfo } from "./color/index.js";
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
   * @returns {Image} This instance for chaining
   */
  grayscale() {
    // Stub implementation
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
