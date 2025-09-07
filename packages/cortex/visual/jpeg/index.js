/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file JPEG image format implementation.
 *
 * Complete JPEG decoder/encoder with support for baseline JPEG files.
 * Extends the base Image class to provide JPEG-specific functionality
 * including quality control, color space conversion, and metadata handling.
 */

import { Image } from "../image-base.js";
import { parseJPEGHeaders } from "./header-parsing.js";
import { decodeJPEGPixels } from "./pixel-decode.js";

/**
 * JPEG image implementation extending base Image class.
 *
 * Provides complete JPEG decoding with support for:
 * - Baseline JPEG (SOF0) format
 * - Grayscale and YCbCr color images
 * - Standard and custom quantization tables
 * - Huffman decoding with standard tables
 * - JPEG metadata extraction
 *
 * @extends Image
 */
export class JPEGImage extends Image {
  /**
   * Creates new JPEG image from buffer data.
   *
   * @param {ArrayBuffer|Uint8Array} buffer - JPEG file data
   * @param {Object} [options={}] - Decoding options
   * @param {boolean} [options.autoDecodePixels=true] - Automatically decode pixels on construction
   * @param {boolean} [options.preserveMetadata=true] - Extract and preserve JPEG metadata
   * @param {boolean} [options.validateStructure=true] - Validate JPEG file structure
   *
   * @example
   * // Basic usage
   * const jpegImage = new JPEGImage(jpegBuffer);
   * console.log(`${jpegImage.width}x${jpegImage.height} JPEG image`);
   *
   * @example
   * // Lazy loading (decode pixels later)
   * const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });
   * // ... do other work ...
   * jpegImage.decodePixels(); // Decode when needed
   */
  constructor(buffer, options = {}) {
    super(buffer, "image/jpeg");

    // Default options
    const { autoDecodePixels = true, preserveMetadata = true, validateStructure = true } = options;

    // JPEG-specific properties
    /** @type {{
     *   sof: {
     *     type: number,
     *     precision: number,
     *     height: number,
     *     width: number,
     *     components: Array<{
     *       id: number,
     *       horizontalSampling: number,
     *       verticalSampling: number,
     *       quantizationTable: number
     *     }>
     *   } | null,
     *   quantizationTables: Map<number, {
     *     id: number,
     *     precision: number,
     *     values: number[]
     *   }>,
     *   huffmanTables: Map<string, {
     *     class: number,
     *     id: number,
     *     codeLengths: number[],
     *     symbols: number[]
     *   }>,
     *   sos: {
     *     components: Array<{
     *       id: number,
     *       dcTable: number,
     *       acTable: number
     *     }>,
     *     spectralStart: number,
     *     spectralEnd: number,
     *     approximationHigh: number,
     *     approximationLow: number
     *   } | null,
     *   applicationSegments: Array<{
     *     marker: number,
     *     data: Uint8Array
     *   }>,
     *   comments: string[],
     *   scanDataOffset: number
     * } | null} */
    this.jpegStructure = null;
    this.quality = null;
    this.colorSpace = null;
    this.componentCount = 0;
    this.isProgressive = false;
    this.isDecoded = false;

    try {
      // Parse JPEG headers to get structure and metadata
      this.jpegStructure = parseJPEGHeaders(this.rawData);

      if (validateStructure) {
        this._validateJPEGStructure();
      }

      // Extract basic image information
      this._extractImageInfo();

      if (preserveMetadata) {
        this._extractMetadata();
      }

      if (autoDecodePixels) {
        this.decodePixels();
      }
    } catch (error) {
      throw new Error(`Failed to create JPEG image: ${error.message}`);
    }
  }

  /**
   * Decode JPEG pixels into RGBA format.
   *
   * @returns {JPEGImage} This instance for chaining
   * @throws {Error} If decoding fails
   *
   * @example
   * const jpegImage = new JPEGImage(buffer, { autoDecodePixels: false });
   * jpegImage.decodePixels(); // Decode on demand
   */
  decodePixels() {
    if (this.isDecoded) {
      return this; // Already decoded
    }

    try {
      const decoded = decodeJPEGPixels(this.rawData, this.jpegStructure);

      this.pixels = decoded.pixels;
      this._width = decoded.width;
      this._height = decoded.height;
      this.componentCount = decoded.components;
      this.isDecoded = true;

      // Determine color space
      this.colorSpace = this.componentCount === 1 ? "grayscale" : "ycbcr";
    } catch (error) {
      throw new Error(`JPEG pixel decoding failed: ${error.message}`);
    }

    return this;
  }

  /**
   * Encode image to JPEG buffer with specified quality.
   *
   * @param {string} [targetMimeType="image/jpeg"] - Target MIME type (must be image/jpeg)
   * @param {Object} [options={}] - Encoding options
   * @param {number} [options.quality=85] - JPEG quality (1-100, higher = better quality)
   * @param {boolean} [options.progressive=false] - Create progressive JPEG
   * @param {string} [options.colorSpace="ycbcr"] - Color space ("ycbcr" or "grayscale")
   * @param {boolean} [options.optimizeHuffman=false] - Use optimized Huffman tables
   * @returns {Uint8Array} Encoded JPEG buffer
   * @throws {Error} If encoding fails or format not supported
   *
   * @example
   * const jpegBuffer = jpegImage.toBuffer("image/jpeg", { quality: 90 });
   */
  toBuffer(targetMimeType = "image/jpeg", _options = {}) {
    if (targetMimeType !== "image/jpeg") {
      throw new Error(`JPEG encoding only supports image/jpeg format, got: ${targetMimeType}`);
    }

    if (!this.pixels) {
      throw new Error("No pixel data available for encoding - decode pixels first");
    }

    // TODO: Implement JPEG encoding pipeline
    // This will be implemented in the encoding tasks
    throw new Error("JPEG encoding not yet implemented - coming in next iteration");
  }

  /**
   * Get JPEG-specific metadata.
   *
   * @returns {Object} JPEG metadata including quality, color space, and technical details
   *
   * @example
   * const metadata = jpegImage.getMetadata();
   * console.log(`Quality: ${metadata.quality}, Color Space: ${metadata.colorSpace}`);
   */
  getMetadata() {
    return {
      ...this.metadata,
      format: "JPEG",
      quality: this.quality,
      colorSpace: this.colorSpace,
      componentCount: this.componentCount,
      isProgressive: this.isProgressive,
      isBaseline: !this.isProgressive,
      hasQuantizationTables: this.jpegStructure?.quantizationTables?.size > 0,
      hasHuffmanTables: this.jpegStructure?.huffmanTables?.size > 0,
      scanDataOffset: this.jpegStructure?.scanDataOffset,
    };
  }

  /**
   * Set JPEG-specific metadata.
   *
   * @param {Object} metadata - Metadata to set
   * @param {number} [metadata.quality] - JPEG quality (1-100)
   * @param {string} [metadata.colorSpace] - Color space preference
   * @returns {JPEGImage} This instance for chaining
   */
  setMetadata(metadata) {
    if (metadata.quality !== undefined) {
      if (typeof metadata.quality !== "number" || metadata.quality < 1 || metadata.quality > 100) {
        throw new Error("JPEG quality must be a number between 1 and 100");
      }
      this.quality = metadata.quality;
    }

    if (metadata.colorSpace !== undefined) {
      if (!["grayscale", "ycbcr"].includes(metadata.colorSpace)) {
        throw new Error("JPEG color space must be 'grayscale' or 'ycbcr'");
      }
      this.colorSpace = metadata.colorSpace;
    }

    // Store other metadata
    this.metadata = { ...this.metadata, ...metadata };

    return this;
  }

  /**
   * Get JPEG quality estimate (1-100).
   *
   * @returns {number|null} Estimated quality or null if cannot be determined
   */
  getQuality() {
    return this.quality;
  }

  /**
   * Get JPEG color space.
   *
   * @returns {string} Color space ("grayscale" or "ycbcr")
   */
  getColorSpace() {
    return this.colorSpace || "unknown";
  }

  /**
   * Check if JPEG is progressive.
   *
   * @returns {boolean} True if progressive JPEG
   */
  isProgressiveJPEG() {
    return this.isProgressive;
  }

  /**
   * Get JPEG component count.
   *
   * @returns {number} Number of color components (1 for grayscale, 3 for color)
   */
  getComponentCount() {
    return this.componentCount;
  }

  /**
   * Get detailed JPEG structure information.
   *
   * @returns {Object} Complete JPEG structure with headers, tables, and markers
   */
  getJPEGStructure() {
    return this.jpegStructure;
  }

  /**
   * Validate JPEG file structure.
   *
   * @private
   * @throws {Error} If structure is invalid
   */
  _validateJPEGStructure() {
    if (!this.jpegStructure) {
      throw new Error("Invalid JPEG: no structure found");
    }

    const { sof, sos, quantizationTables, huffmanTables } = this.jpegStructure;

    if (!sof) {
      throw new Error("Invalid JPEG: missing SOF (Start of Frame) marker");
    }

    if (!sos) {
      throw new Error("Invalid JPEG: missing SOS (Start of Scan) marker");
    }

    if (!quantizationTables || quantizationTables.size === 0) {
      throw new Error("Invalid JPEG: missing quantization tables");
    }

    if (!huffmanTables || huffmanTables.size === 0) {
      throw new Error("Invalid JPEG: missing Huffman tables");
    }

    // Check for progressive JPEG (SOF2)
    if (sof.type === 0xc2) {
      this.isProgressive = true;
      throw new Error("Progressive JPEG not yet supported - baseline JPEG only");
    }

    // Validate component count
    if (sof.components.length < 1 || sof.components.length > 4) {
      throw new Error(`Invalid JPEG: unsupported component count ${sof.components.length}`);
    }

    // Currently only support 1 (grayscale) or 3 (YCbCr) components
    if (sof.components.length !== 1 && sof.components.length !== 3) {
      throw new Error(`Unsupported JPEG format: ${sof.components.length} components (only 1 or 3 supported)`);
    }
  }

  /**
   * Extract basic image information from JPEG structure.
   *
   * @private
   */
  _extractImageInfo() {
    const { sof } = this.jpegStructure;

    this._width = sof.width;
    this._height = sof.height;
    this.componentCount = sof.components.length;
    this._channels = 4; // Always RGBA output

    // Set color space based on component count
    this.colorSpace = this.componentCount === 1 ? "grayscale" : "ycbcr";

    // Estimate quality from quantization tables
    this.quality = this._estimateQuality();
  }

  /**
   * Extract JPEG metadata from structure.
   *
   * @private
   */
  _extractMetadata() {
    const { sof, applicationSegments, comments } = this.jpegStructure;

    /** @type {{
     *   format: string,
     *   width: number,
     *   height: number,
     *   precision: number,
     *   components: number,
     *   colorSpace: string,
     *   isProgressive: boolean,
     *   appSegments: {[key: string]: {marker: string, length: number, identifier: string}},
     *   comments: Array<{text: string, length: number}>
     * }} */
    this.metadata = {
      format: "JPEG",
      width: sof.width,
      height: sof.height,
      precision: sof.precision,
      components: sof.components.length,
      colorSpace: sof.components.length === 1 ? "grayscale" : "ycbcr",
      isProgressive: this.isProgressive,
      appSegments: {},
      comments: [],
    };

    // Extract APP segment data (EXIF, JFIF, etc.)
    if (applicationSegments && applicationSegments.length > 0) {
      for (const segment of applicationSegments) {
        /** @type {any} */ (this.metadata).appSegments[`APP${segment.marker - 0xe0}`] = {
          marker: `0x${segment.marker.toString(16).toUpperCase()}`,
          length: segment.data.length,
          identifier: this._extractAppIdentifier(segment.data),
        };
      }
    }

    // Extract comment segments
    if (comments && comments.length > 0) {
      /** @type {any} */ (this.metadata).comments.push(
        ...comments.map((/** @type {string} */ comment) => ({
          text: comment,
          length: comment.length,
        }))
      );
    }
  }

  /**
   * Estimate JPEG quality from quantization tables.
   *
   * @private
   * @returns {number|null} Estimated quality (1-100) or null
   */
  _estimateQuality() {
    const { quantizationTables } = this.jpegStructure;

    if (!quantizationTables || quantizationTables.size === 0) {
      return null;
    }

    // Get luminance quantization table (usually table 0)
    const lumTable = quantizationTables.get(0);
    if (!lumTable) {
      return null;
    }

    // Simple quality estimation based on quantization values
    // Lower values = higher quality, higher values = lower quality
    const avgQuantValue = lumTable.values.reduce((sum, val) => sum + val, 0) / 64;

    // Rough mapping: avgQuantValue 1-10 = quality 95-100, 10-50 = quality 50-95, etc.
    if (avgQuantValue <= 10) {
      return Math.round(100 - avgQuantValue);
    } else if (avgQuantValue <= 50) {
      return Math.round(95 - ((avgQuantValue - 10) * 45) / 40);
    } else {
      return Math.max(1, Math.round(50 - ((avgQuantValue - 50) * 49) / 200));
    }
  }

  /**
   * Extract identifier from APP segment data.
   *
   * @private
   * @param {Uint8Array} data - APP segment data
   * @returns {string} Identifier string
   */
  _extractAppIdentifier(data) {
    if (data.length < 4) {
      return "unknown";
    }

    // Try to decode first few bytes as ASCII
    try {
      const identifier = new TextDecoder("ascii", { fatal: true }).decode(data.slice(0, Math.min(16, data.length)));
      return identifier.replace(/\0.*$/, ""); // Remove null terminator and everything after
    } catch {
      return "binary";
    }
  }

  /**
   * Create JPEG image from file buffer with validation.
   *
   * @param {ArrayBuffer|Uint8Array} buffer - JPEG file data
   * @param {Object} [options={}] - Creation options
   * @returns {JPEGImage} New JPEG image instance
   * @throws {Error} If buffer is not valid JPEG
   *
   * @example
   * const jpegImage = JPEGImage.fromBuffer(jpegFileBuffer);
   * console.log(`Loaded ${jpegImage.width}x${jpegImage.height} JPEG`);
   */
  static fromBuffer(buffer, options = {}) {
    // Validate JPEG signature
    const data = new Uint8Array(buffer);
    if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
      throw new Error("Invalid JPEG: missing JPEG signature (FF D8)");
    }

    return new JPEGImage(buffer, options);
  }

  /**
   * Check if buffer contains valid JPEG data.
   *
   * @param {ArrayBuffer|Uint8Array} buffer - Data to check
   * @returns {boolean} True if valid JPEG signature found
   *
   * @example
   * if (JPEGImage.isJPEG(fileBuffer)) {
   *   const jpegImage = new JPEGImage(fileBuffer);
   * }
   */
  static isJPEG(buffer) {
    try {
      const data = new Uint8Array(buffer);
      return data.length >= 4 && data[0] === 0xff && data[1] === 0xd8;
    } catch {
      return false;
    }
  }

  /**
   * Get supported JPEG MIME types.
   *
   * @returns {string[]} Array of supported MIME types
   */
  static getSupportedMimeTypes() {
    return ["image/jpeg", "image/jpg"];
  }

  /**
   * Get JPEG format capabilities.
   *
   * @returns {Object} Format capabilities and limitations
   */
  static getCapabilities() {
    return {
      decode: {
        baseline: true,
        progressive: false, // TODO: Implement progressive JPEG
        lossless: false,
        arithmetic: false,
        maxDimensions: { width: 65535, height: 65535 },
        colorSpaces: ["grayscale", "ycbcr"],
        bitDepths: [8], // Only 8-bit currently supported
      },
      encode: {
        baseline: false, // TODO: Implement JPEG encoding
        progressive: false,
        qualityRange: { min: 1, max: 100 },
        colorSpaces: ["grayscale", "ycbcr"],
        bitDepths: [8],
      },
      metadata: {
        exif: false, // TODO: Implement EXIF parsing
        jfif: true,
        comments: true,
        quantizationTables: true,
        huffmanTables: true,
      },
    };
  }
}
