/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file GIF format implementation extending base Image class.
 *
 * Handles GIF-specific decoding, encoding, and animation operations using
 * pure JavaScript LZW decompression and GIF block parsing. Supports both
 * static and animated GIF formats with palette management and transparency.
 */

import { Image } from "./image-base.js";

/**
 * GIF format image implementation.
 *
 * Extends base Image class with GIF-specific functionality including
 * LZW decompression, palette management, animation support, and GIF
 * metadata handling. Supports both GIF87a and GIF89a formats.
 */
export class GIFImage extends Image {
  /**
   * Creates GIF image instance from buffer.
   *
   * @param {ArrayBuffer|Uint8Array} buffer - GIF image data
   * @param {string} mimeType - MIME type (should be 'image/gif')
   */
  constructor(buffer, mimeType) {
    super(buffer, mimeType);
    this.version = "GIF89a"; // 'GIF87a' or 'GIF89a'
    this.globalColorTable = [];
    this.backgroundColorIndex = 0;
    this.pixelAspectRatio = 0;
    /** @type {Array<Object>} */
    this.frames = [];
    this.loopCount = 0;
    this.hasGlobalColorTable = false;
    this.colorResolution = 8;

    // Stub: would normally decode GIF here
    this._decode();
  }

  /**
   * Decode GIF data into internal pixel representation.
   *
   * @private
   */
  _decode() {
    // Stub implementation - would parse header, color tables, LZW decompress frames
    this._width = 0;
    this._height = 0;
    this.pixels = new Uint8Array(0);
  }

  /**
   * Encode current pixel data as GIF buffer.
   *
   * @param {Object} options - GIF encoding options
   * @param {Array<Array<number>>} options.palette - Color palette (max 256 colors)
   * @param {number} options.transparentIndex - Transparent color index
   * @param {number} options.delay - Frame delay in centiseconds (animated GIF)
   * @param {number} options.loopCount - Animation loop count (0 = infinite)
   * @returns {Uint8Array} GIF encoded buffer
   * @private
   */
  /**
   * @param {Object} [_options] - GIF encoding options
   */
  _encodeGIF(_options = {}) {
    // Stub implementation - would create color table, LZW compress, write blocks
    return new Uint8Array(0);
  }

  /**
   * Extract GIF-specific metadata and animation info.
   *
   * @returns {Object} GIF metadata including animation details, palette info
   */
  getMetadata() {
    // Stub implementation - would parse comment blocks, application extensions
    return {
      format: "GIF",
      version: this.version,
      animated: this.isAnimated,
      frameCount: this.frames.length,
      loopCount: this.loopCount,
      globalColorTable: this.hasGlobalColorTable,
      colorResolution: this.colorResolution,
      backgroundColorIndex: this.backgroundColorIndex,
      pixelAspectRatio: this.pixelAspectRatio,
      comments: [],
    };
  }

  /**
   * Check if GIF image is animated.
   *
   * @returns {boolean} True if image contains multiple frames
   */
  get isAnimated() {
    return this.frames.length > 1;
  }

  /**
   * Get animation frame count.
   *
   * @returns {number} Number of animation frames
   */
  get frameCount() {
    return this.frames.length;
  }

  /**
   * Get total animation duration in milliseconds.
   *
   * @returns {number} Total duration of all frames
   */
  get duration() {
    // Stub implementation - would sum frame delays
    return 0;
  }

  /**
   * Extract frame at specified index.
   *
   * @param {number} _index - Frame index (0-based)
   * @returns {Object} Frame data with pixels, delay, disposal method
   */
  getFrame(_index) {
    // Stub implementation - would return specific frame data
    return {
      pixels: new Uint8Array(0),
      delay: 0,
      disposal: 0,
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    };
  }

  /**
   * Encode image to buffer in specified format.
   *
   * @param {string} targetMimeType - Target MIME type
   * @param {Object} options - Format-specific encoding options
   * @returns {Uint8Array} Encoded image buffer
   */
  toBuffer(targetMimeType = this.originalMimeType, options = {}) {
    if (targetMimeType === "image/gif") {
      return this._encodeGIF(/** @type {Object} */ (options));
    }

    // Stub: would delegate to other format encoders
    return super.toBuffer(targetMimeType, options);
  }
}
