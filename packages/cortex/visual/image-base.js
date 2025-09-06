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

import { resizePixels } from "./resize/index.js";

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
   * @param {number} _x - Left offset in pixels
   * @param {number} _y - Top offset in pixels
   * @param {number} _width - Crop width in pixels
   * @param {number} _height - Crop height in pixels
   * @returns {Image} This instance for chaining
   */
  crop(_x, _y, _width, _height) {
    // Stub implementation
    return this;
  }

  /**
   * Rotate image by specified degrees.
   *
   * @param {number} _degrees - Rotation angle (90, 180, 270, or arbitrary)
   * @returns {Image} This instance for chaining
   */
  rotate(_degrees) {
    // Stub implementation
    return this;
  }

  /**
   * Flip image horizontally or vertically.
   *
   * @param {'horizontal'|'vertical'} _direction - Flip direction
   * @returns {Image} This instance for chaining
   */
  flip(_direction) {
    // Stub implementation
    return this;
  }

  /**
   * Adjust image brightness.
   *
   * @param {number} _factor - Brightness multiplier (1.0 = no change)
   * @returns {Image} This instance for chaining
   */
  adjustBrightness(_factor) {
    // Stub implementation
    return this;
  }

  /**
   * Adjust image contrast.
   *
   * @param {number} _factor - Contrast multiplier (1.0 = no change)
   * @returns {Image} This instance for chaining
   */
  adjustContrast(_factor) {
    // Stub implementation
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
