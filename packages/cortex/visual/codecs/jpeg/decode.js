/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main JPEG decoder orchestrator.
 *
 * Coordinates the complete JPEG decoding pipeline from marker parsing
 * through entropy decoding to final RGBA output. Handles baseline and
 * progressive JPEG with full subsampling support.
 */

import { grayscaleToRgb, ycbcrToRgb } from "./color.js";
import { BitReader, HuffmanTable } from "./huffman.js";
import { processBlock } from "./idct.js";
import {
  assembleICCProfile,
  extractAppSegments,
  getAdobeMetadata,
  getEXIFMetadata,
  getJFIFMetadata,
  getXMPMetadata,
  MARKERS,
  parseMarker,
  validateMetadata,
  validateSOI,
} from "./parse.js";
import { UPSAMPLE_QUALITY, upsamplePlaneQuality } from "./upsample.js";

/**
 * @typedef {import('./parse.js').ProgressiveComponentData} ProgressiveComponentData
 */

/**
 * @typedef {Object} MarkerResult
 * @property {number} marker
 * @property {number} length
 * @property {number} dataOffset
 * @property {number} endOffset
 */

/**
 * @typedef {Object} ComponentInfo
 * @property {number} id
 * @property {number} horizontalSampling
 * @property {number} verticalSampling
 * @property {number} quantTableId
 * @property {number} width
 * @property {number} height
 * @property {number} blocksPerLine
 * @property {number} blocksPerColumn
 * @property {(Int16Array|Uint8Array)[]|null} blocks
 */

/**
 * @typedef {Object} HuffmanTables
 * @property {HuffmanTable[]} dc
 * @property {HuffmanTable[]} ac
 */

/**
 * @typedef {Object} ScanComponentInfo
 * @property {ComponentInfo} component
 * @property {number} dcTableIndex
 * @property {number} acTableIndex
 */

/**
 * @typedef {Object} ScanInfo
 * @property {ScanComponentInfo[]} scanComponents
 * @property {number} spectralStart
 * @property {number} spectralEnd
 * @property {number} approximationHigh
 * @property {number} approximationLow
 */

/**
 * @typedef {Object} DecodedImage
 * @property {number} width
 * @property {number} height
 * @property {Uint8Array} data
 * @property {number} components
 * @property {boolean} progressive
 * @property {string} frameType
 */

/**
 * @typedef {Object} JPEGMetadata
 * @property {Object} [jfif] - JFIF metadata
 * @property {Object} [exif] - EXIF metadata
 * @property {Object} [xmp] - XMP metadata
 * @property {Object} [adobe] - Adobe metadata
 * @property {Uint8Array} [iccProfile] - ICC color profile
 * @property {Object} [validation] - Metadata validation results
 * @property {Array<Object>} [warnings] - Warnings from tolerant decoding
 */

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} totalTime - Total decoding time in milliseconds
 * @property {number} parseTime - Segment parsing time
 * @property {number} scanTime - Scan decoding time
 * @property {number} idctTime - IDCT processing time
 * @property {number} upsampleTime - Upsampling time
 * @property {number} colorTime - Color conversion time
 * @property {number} memoryPeak - Peak memory usage in bytes
 * @property {number} scanCount - Number of scans processed
 */

/**
 * @typedef {Object} DecodeResult
 * @property {Uint8Array} pixels - Decoded pixel data
 * @property {number} width - Image width
 * @property {number} height - Image height
 * @property {number} components - Number of color components
 * @property {boolean} progressive - Whether progressive JPEG
 * @property {string} frameType - Frame type description
 * @property {JPEGMetadata} [metadata] - Extracted metadata
 * @property {PerformanceMetrics} [metrics] - Performance metrics
 * @property {string} format - Output format used
 * @property {string} [error] - Error message if decoding failed
 * @property {string} [errorCode] - Error code for diagnostics
 * @property {number} [errorOffset] - Offset where error occurred
 * @property {number|null} [errorMarker] - Marker associated with error
 */

/**
 * @typedef {Object} ValidationResult
 * @property {Uint8Array|null} data - Validated data buffer
 * @property {Error|null} error - Validation error if any
 */

/**
 * JPEG decoder options
 */
/**
 * @typedef {Object} JPEGDecoderOptions
 * @property {boolean} tolerantDecoding - Allow decoding of malformed JPEGs
 * @property {number} maxResolutionMP - Maximum resolution in megapixels
 * @property {number} maxMemoryMB - Maximum memory usage in MB
 * @property {boolean} fancyUpsampling - Legacy upsampling flag
 * @property {string} upsampleQuality - Quality option for upsampling
 * @property {string|undefined} colorTransform - Color transformation method
 * @property {boolean} extractMetadata - Extract and return metadata
 * @property {boolean} validateMetadata - Validate metadata completeness
 * @property {Function} [onProgress] - Progress callback function
 * @property {string} outputFormat - Output format ('rgba', 'rgb', 'grayscale')
 * @property {boolean} streamingMode - Enable streaming for large images
 * @property {number} maxScanPasses - Maximum progressive scan passes
 * @property {boolean} performanceMetrics - Collect performance metrics
 * @property {number} [maxQuantTables] - Maximum quantization tables allowed (default 4)
 * @property {number} [maxHuffmanTables] - Maximum Huffman tables allowed (default 8)
 */

/** @type {JPEGDecoderOptions} */
const DEFAULT_OPTIONS = {
  tolerantDecoding: false,
  maxResolutionMP: 100,
  maxMemoryMB: 1024,
  fancyUpsampling: false,
  upsampleQuality: UPSAMPLE_QUALITY.FAST,
  colorTransform: undefined,
  extractMetadata: true,
  validateMetadata: true,
  onProgress: null,
  outputFormat: "rgba",
  streamingMode: false,
  maxScanPasses: 20,
  performanceMetrics: false,
  maxQuantTables: 4,
  maxHuffmanTables: 8,
};

// ============================================================================
// PERFORMANCE OPTIMIZATIONS: Precomputed Constants
// Based on DECODE.md section 27 performance guidance
// ============================================================================

/**
 * Precomputed zig-zag to natural order mapping.
 * Maps zig-zag indices (0-63) to natural raster order indices (0-63).
 */
const ZIGZAG_TO_NATURAL = new Uint8Array([
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28,
  35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47,
  55, 62, 63,
]);

/**
 * Precomputed IDCT constants for AAN (Arai, Agui, Nakajima) scaling.
 * These are the cosine values scaled by the AAN factors.
 */
const _IDCT_CONSTANTS = new Float32Array([
  1.0, // 1 * cos(0)
  0.9807852804032304, // cos(π/16)
  0.9238795325112867, // cos(2π/16)
  0.8314696123025452, // cos(3π/16)
  Math.SQRT1_2, // cos(4π/16) = 1/√2
  0.5555702330196023, // cos(5π/16)
  0.3826834323650898, // cos(6π/16)
  0.1950903220161283, // cos(7π/16)
]);

/**
 * Scratch buffer pool for IDCT operations.
 * Reused across blocks to avoid allocations.
 */
const _IDCT_SCRATCH_BUFFER = new Int32Array(64);

/**
 * Scratch buffer for upsampling operations.
 * Reused to avoid allocations during plane upsampling.
 */
const _UPSAMPLE_SCRATCH_BUFFER = new Int32Array(1024);

/**
 * JPEG decoder state
 */
export class JPEGDecoder {
  constructor(options = {}) {
    /** @type {JPEGDecoderOptions} */
    this.options = { ...DEFAULT_OPTIONS, ...options };
    /** @type {number} */
    this.width = 0;
    /** @type {number} */
    this.height = 0;
    /** @type {ComponentInfo[]} */
    this.components = [];
    /** @type {Int32Array[]} */
    this.quantTables = new Array(4);
    /** @type {HuffmanTables} */
    this.huffmanTables = { dc: new Array(4), ac: new Array(4) };
    /** @type {Int32Array} */
    this.dcPredictors = new Int32Array(4); // DC predictors for each component
    /** @type {number} */
    this.sosOffset = 0;
    /** @type {number} */
    this.restartInterval = 0;
    /** @type {boolean} */
    this.restartEnabled = false;
    /** @type {number} */
    this.restartCount = 0;
    /** @type {number} */
    this.mcuCount = 0;
    /** @type {Object} */
    this.metadata = {};

    // Progressive JPEG support
    /** @type {boolean} */
    this.isProgressive = false;
    /** @type {string} */
    this.frameType = "Baseline";
    /** @type {ProgressiveComponentData[]|null} */
    this.progressiveCoefficients = null;
    /** @type {number} */
    this.maxHorizontalSampling = 1;
    /** @type {number} */
    this.maxVerticalSampling = 1;
    /** @type {number} */
    this.mcusPerLine = 0;
    /** @type {number} */
    this.mcusPerColumn = 0;

    // Performance tracking
    /** @type {number} */
    this.startTime = 0;
    /** @type {PerformanceMetrics|null} */
    this.performanceMetrics = null;

    // Tolerant decoding support
    /** @type {Array<Object>} */
    this.warnings = [];
  }

  /**
   * Main JPEG decoding orchestrator function - DECODE.md Section 15.
   *
   * Comprehensive JPEG decoder with full feature set and error handling.
   *
   * @param {ArrayBuffer|Uint8Array} buffer - JPEG data buffer
   * @param {Partial<JPEGDecoderOptions>} [options] - Decoding options
   * @returns {DecodeResult} Complete decoding result with metadata and metrics
   * @throws {Error} If decoding fails and tolerant mode is disabled
   */
  decodeJPEG(buffer, options = {}) {
    // Start performance tracking
    this.startTime = performance.now();
    this.performanceMetrics = null;

    try {
      // Step 1: Parameter validation and setup
      const result = this.validateAndSetup(buffer, options);
      if (result.error) {
        if (!options.tolerantDecoding) {
          throw result.error;
        }
        return this.createErrorResult(result.error, options);
      }

      const { data } = result;

      // Step 2: Progress callback for setup complete
      this.reportProgress(options.onProgress, 10, "Setup complete");

      // Step 3: Parse JPEG segments
      const parseStart = performance.now();
      this.parseSegments(data);
      const parseTime = performance.now() - parseStart;

      // Step 4: Extract and validate metadata
      let metadata = null;
      if (options.extractMetadata) {
        try {
          metadata = this.extractMetadata(data);
          if (options.validateMetadata) {
            const appSegments = extractAppSegments(data);
            metadata.validation = validateMetadata(appSegments);
          }
        } catch (metadataError) {
          // If metadata extraction fails, continue without metadata
          console.warn("Metadata extraction failed, continuing without metadata:", metadataError.message);
          metadata = null;
        }
      }

      // Step 5: Progress callback for parsing complete
      this.reportProgress(options.onProgress, 30, "Segments parsed");

      // Step 6: Decode entropy-coded data
      const scanStart = performance.now();
      const decodedImage = this.decodeScans(data);
      const scanTime = performance.now() - scanStart;

      // Step 7: Progress callback for decoding complete
      this.reportProgress(options.onProgress, 80, "Entropy decoding complete");

      // Step 8: Apply output format conversion
      const finalPixels = this.convertOutputFormat(
        decodedImage.data,
        decodedImage.width,
        decodedImage.height,
        decodedImage.components,
        options.outputFormat
      );

      // Step 9: Collect performance metrics
      const totalTime = performance.now() - this.startTime;
      const metrics = options.performanceMetrics
        ? {
            totalTime,
            parseTime,
            scanTime,
            idctTime: 0, // Would need to track this in the IDCT functions
            upsampleTime: 0, // Would need to track this in the upsampling functions
            colorTime: 0, // Would need to track this in the color conversion functions
            memoryPeak:
              this.estimateMemoryUsage(decodedImage.width, decodedImage.height, decodedImage.components) /
              (1024 * 1024), // Convert to MB
            scanCount: this.isProgressive ? 1 : 1, // Would need to track actual scan count
          }
        : null;

      // Step 10: Progress callback for completion
      this.reportProgress(options.onProgress, 100, "Decoding complete");

      // Step 11: Return comprehensive result
      return {
        pixels: decodedImage.data,
        width: decodedImage.width,
        height: decodedImage.height,
        components: decodedImage.components,
        progressive: decodedImage.progressive,
        frameType: decodedImage.frameType,
        metadata,
        metrics,
        format: options.outputFormat,
      };
    } catch (error) {
      // Handle errors with fallback or re-throwing
      if (options.tolerantDecoding) {
        // Enhance error with context for better diagnostics
        // Convert buffer to Uint8Array if needed for error context
        const dataBuffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        const enhancedError = this.enhanceErrorContext(error, dataBuffer, 0);

        // Collect any warnings from the decoding process
        const warnings = [];
        if (this.warnings && this.warnings.length > 0) {
          warnings.push(...this.warnings);
        }

        // Add a generic warning about the decoding failure
        warnings.push({
          type: "DECODE_ERROR",
          message: `Decoding failed: ${enhancedError.message}`,
          offset: /** @type {number} */ (/** @type {any} */ (enhancedError).offset || -1),
          timestamp: Date.now(),
        });

        return this.createErrorResult(enhancedError, options, { warnings });
      }
      throw error;
    }
  }

  /**
   * Legacy decode method for backward compatibility.
   *
   * @param {ArrayBuffer|Uint8Array} buffer - JPEG data
   * @returns {Object} Decoded image with pixels, width, height, metadata
   */
  decode(buffer) {
    const result = this.decodeJPEG(buffer, this.options);

    return {
      pixels: result.pixels,
      width: result.width,
      height: result.height,
      metadata: result.metadata,
      components: result.components,
      progressive: result.progressive,
      frameType: result.frameType,
    };
  }

  /**
   * Validate input parameters and setup decoder state.
   * @param {ArrayBuffer|Uint8Array} buffer - Input buffer
   * @param {Partial<JPEGDecoderOptions>} options - Decoding options
   * @returns {ValidationResult} Validation result with data or error
   */
  validateAndSetup(buffer, options) {
    try {
      // Validate input buffer
      if (!buffer) {
        throw new Error("Input buffer is required");
      }

      let data;
      if (buffer instanceof ArrayBuffer) {
        data = new Uint8Array(buffer);
      } else if (buffer instanceof Uint8Array) {
        data = buffer;
      } else {
        throw new Error("Input must be ArrayBuffer or Uint8Array");
      }

      // Check minimum buffer size
      if (data.length < 2) {
        throw new Error("Buffer too small for JPEG data");
      }

      // Validate options
      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
      this.options = mergedOptions;

      // Early memory budget estimation
      const estimatedMemoryBytes = this.estimateMemoryUsage(data.length);
      const estimatedMemoryMB = estimatedMemoryBytes / (1024 * 1024);
      if (estimatedMemoryMB > 0 && mergedOptions.maxMemoryMB > 0 && estimatedMemoryMB > mergedOptions.maxMemoryMB) {
        throw new Error(
          `Estimated memory usage (${estimatedMemoryMB.toFixed(1)}MB) exceeds limit (${mergedOptions.maxMemoryMB}MB)`
        );
      }

      // Validate table limits from options
      if (mergedOptions.maxQuantTables && mergedOptions.maxQuantTables > 4) {
        throw new Error(`maxQuantTables (${mergedOptions.maxQuantTables}) exceeds maximum allowed (4)`);
      }
      if (mergedOptions.maxHuffmanTables && mergedOptions.maxHuffmanTables > 8) {
        throw new Error(`maxHuffmanTables (${mergedOptions.maxHuffmanTables}) exceeds maximum allowed (8)`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Estimate memory usage for JPEG decoding.
   * Based on DECODE.md section 14 memory budget estimation.
   * @param {number} widthOrBufferLength - Image width or buffer length
   * @param {number} [height] - Image height (if provided)
   * @param {number} [components] - Number of components (if provided)
   * @returns {number} Estimated memory usage in bytes
   */
  estimateMemoryUsage(widthOrBufferLength, height, components) {
    if (height !== undefined && components !== undefined) {
      // Calculate actual memory usage for decoded image
      const width = widthOrBufferLength;

      // Memory requirements for decoded image:
      // - RGBA output: 4 * width * height bytes
      // - Coefficient blocks: sum over components (blocksPerLine * blocksPerColumn * 64 * 2)
      // - Scratch buffers: 64KB for IDCT + 1KB for upsampling
      // - Overhead: 1MB

      const rgbaMemory = 4 * width * height;

      // Estimate coefficient memory (rough approximation)
      const blocksPerLine = Math.ceil(width / 8);
      const blocksPerColumn = Math.ceil(height / 8);
      const coefficientMemory = components * blocksPerLine * blocksPerColumn * 64 * 2;

      const scratchMemory = 64 * 1024 + 1024; // IDCT + upsampling scratch
      const overheadMemory = 1024 * 1024; // General overhead

      return rgbaMemory + coefficientMemory + scratchMemory + overheadMemory;
    } else {
      // Rough estimation based on buffer length (early estimation)
      const bufferLength = widthOrBufferLength;

      // For very small buffers (likely invalid), don't enforce memory limits
      if (bufferLength < 100) {
        return 0; // Skip memory validation for clearly invalid small buffers
      }

      // For small but potentially valid buffers, use a small minimum
      if (bufferLength < 1000) {
        return 512 * 1024; // 512KB minimum
      }

      // More conservative estimation: assume 3-5 bytes per pixel for compressed data
      const estimatedPixels = Math.max(1000, bufferLength / 4);
      const estimatedWidth = Math.sqrt(estimatedPixels);
      const estimatedHeight = estimatedPixels / estimatedWidth;

      // Use more realistic memory estimates
      const rgbaMemory = 4 * estimatedWidth * estimatedHeight;
      const coefficientMemory = 1.5 * estimatedWidth * estimatedHeight; // More conservative
      const scratchMemory = 32 * 1024; // Smaller scratch buffer
      const overheadMemory = 512 * 1024; // Smaller overhead

      return rgbaMemory + coefficientMemory + scratchMemory + overheadMemory;
    }
  }

  /**
   * Validate memory requirements for the current image dimensions and components.
   * Based on DECODE.md section 14 memory budget estimation.
   * @throws {Error} If memory requirements exceed limits
   */
  validateMemoryRequirements() {
    if (!this.width || !this.height || !this.components) {
      return; // Not enough information yet
    }

    const maxMemoryMB = this.options?.maxMemoryMB || 512;
    const maxMemoryBytes = maxMemoryMB * 1024 * 1024;

    // Calculate memory requirements:
    // - RGBA output: 4 * width * height
    const rgbaMemory = 4 * this.width * this.height;

    // - Coefficient blocks: for each component, blocksPerLine * blocksPerColumn * 64 * 2 (Int16)
    // We need to calculate MCU geometry first
    let coefficientMemory = 0;
    for (const component of this.components) {
      const blocksPerLine = Math.ceil((this.width * component.horizontalSampling) / this.maxHorizontalSampling);
      const blocksPerColumn = Math.ceil((this.height * component.verticalSampling) / this.maxVerticalSampling);
      coefficientMemory += blocksPerLine * blocksPerColumn * 64 * 2; // 64 coefficients per block, 2 bytes each
    }

    // - Scratch buffers: ~64KB for IDCT and other operations
    const scratchMemory = 64 * 1024;

    // - Overhead and temporary buffers: ~1MB
    const overheadMemory = 1024 * 1024;

    const totalBytes = rgbaMemory + coefficientMemory + scratchMemory + overheadMemory;

    if (totalBytes > maxMemoryBytes) {
      const requiredMB = totalBytes / (1024 * 1024);
      throw new Error(
        `Memory requirements (${requiredMB.toFixed(1)}MB) exceed limit (${maxMemoryMB}MB) for ${this.width}x${this.height} image`
      );
    }
  }

  /**
   * Create error result for tolerant decoding mode.
   * @param {Error} error - The error that occurred
   * @param {Partial<JPEGDecoderOptions>} [options] - Decoding options
   * @param {object} [additionalData] - Additional error context
   * @returns {DecodeResult} Error result with empty data
   */
  createErrorResult(error, options = {}, additionalData = /** @type {Object|undefined} */ ({})) {
    /** @type {DecodeResult} */
    const result = {
      pixels: new Uint8Array(0),
      width: 0,
      height: 0,
      components: 0,
      progressive: false,
      frameType: "Error",
      metadata: null,
      metrics: null,
      format: options.outputFormat || "rgba",
      error: error.message,
      errorCode: /** @type {string} */ (/** @type {any} */ (error).code || "UNKNOWN_ERROR"),
      errorOffset: /** @type {number} */ (/** @type {any} */ (error).offset || -1),
      errorMarker: /** @type {number|null} */ (/** @type {any} */ (error).marker || null),
    };

    // Always include metadata with warnings if provided
    const warnings =
      additionalData && /** @type {any} */ (additionalData).warnings
        ? /** @type {any} */ (additionalData).warnings
        : [];
    result.metadata = { warnings };

    return result;
  }

  /**
   * Report progress to callback function.
   * @param {Function|null} callback - Progress callback function
   * @param {number} percent - Progress percentage (0-100)
   * @param {string} message - Progress message
   */
  reportProgress(callback, percent, message) {
    if (callback && typeof callback === "function") {
      try {
        callback({ percent, message, timestamp: Date.now() });
      } catch (error) {
        // Ignore callback errors to prevent breaking decoding
        console.warn("Progress callback error:", error);
      }
    }
  }

  /**
   * Attempt to resynchronize after an error in tolerant mode.
   * Scans forward for valid markers and tries to recover.
   * @param {Uint8Array} data - JPEG data buffer
   * @param {number} startOffset - Starting offset for resync
   * @param {number} maxSearchBytes - Maximum bytes to search (default 1024)
   * @returns {object} Resync result with new offset and marker info
   */
  attemptResync(data, startOffset, maxSearchBytes = 1024) {
    /** @type {{success: boolean, newOffset: number, marker: number|null, skippedBytes: number, warnings: Array<Object>}} */
    const result =
      /** @type {{success: boolean, newOffset: number, marker: number|null, skippedBytes: number, warnings: Array<Object>}} */ ({
        success: false,
        newOffset: startOffset,
        marker: null,
        skippedBytes: 0,
        warnings: [],
      });

    const endOffset = Math.min(data.length, startOffset + maxSearchBytes);

    for (let i = startOffset; i < endOffset; i++) {
      // Look for 0xFF followed by a non-zero byte (potential marker)
      if (data[i] === 0xff && i + 1 < endOffset && data[i + 1] !== 0x00) {
        const potentialMarker = data[i + 1];

        // Check if this is a valid marker we can resync to
        if (this.isValidResyncMarker(potentialMarker)) {
          result.success = true;
          result.newOffset = i;
          result.marker = potentialMarker;
          result.skippedBytes = i - startOffset;

          if (result.skippedBytes > 0) {
            result.warnings.push({
              type: "RESYNC",
              message: `Skipped ${result.skippedBytes} bytes during resync`,
              offset: startOffset,
              marker: potentialMarker,
            });
          }

          break;
        }
      }
    }

    return result;
  }

  /**
   * Check if a marker is valid for resynchronization.
   * @param {number} marker - Marker byte (without 0xFF prefix)
   * @returns {boolean} True if marker is valid for resync
   */
  isValidResyncMarker(marker) {
    // Valid resync markers: RST0-RST7, SOS, EOI, or other segment markers
    return (
      (marker >= 0xd0 && marker <= 0xd7) || // RST0-RST7
      marker === 0xda || // SOS
      marker === 0xd9 || // EOI
      (marker >= 0xc0 && marker <= 0xc2) || // SOF0, SOF1, SOF2
      (marker >= 0xe0 && marker <= 0xef) // APP markers
    );
  }

  /**
   * Safely skip a malformed segment in tolerant mode.
   * @param {Uint8Array} data - JPEG data buffer
   * @param {number} startOffset - Start of the malformed segment
   * @param {number} maxSkipBytes - Maximum bytes to skip (default 65536)
   * @returns {object} Skip result with new offset and warnings
   */
  skipMalformedSegment(data, startOffset, maxSkipBytes = 65536) {
    /** @type {{success: boolean, newOffset: number, skippedBytes: number, warnings: Array<Object>}} */
    const result =
      /** @type {{success: boolean, newOffset: number, skippedBytes: number, warnings: Array<Object>}} */ ({
        success: false,
        newOffset: startOffset,
        skippedBytes: 0,
        warnings: [],
      });

    const endOffset = Math.min(data.length, startOffset + maxSkipBytes);

    // First, try to find any valid marker from the current position
    for (let i = startOffset; i < endOffset; i++) {
      // Look for 0xFF followed by a non-zero byte (potential marker)
      if (data[i] === 0xff && i + 1 < endOffset && data[i + 1] !== 0x00) {
        const marker = data[i + 1];

        // Check if this looks like a valid marker
        if (this.isValidResyncMarker(marker) || (marker >= 0xc0 && marker <= 0xfe)) {
          // Try to safely skip this segment if it has a valid length
          if (i + 4 < endOffset) {
            const length = (data[i + 2] << 8) | data[i + 3];
            // If length looks reasonable (not too small, not too large)
            if (length >= 2 && length <= 65535 && i + length <= endOffset) {
              result.success = true;
              result.newOffset = i + length;
              result.skippedBytes = result.newOffset - startOffset;
              break;
            }
          }

          // If length is invalid or we can't read it, just skip to this marker
          result.success = true;
          result.newOffset = i;
          result.skippedBytes = i - startOffset;
          break;
        }
      }
    }

    // If we couldn't find a valid marker, try a more aggressive approach
    if (!result.success && startOffset + 4 <= endOffset) {
      // Check if we have what looks like a marker with length field at startOffset
      if (data[startOffset] === 0xff && data[startOffset + 1] !== 0x00) {
        // Try to read the length field safely
        const lengthField = (data[startOffset + 2] << 8) | data[startOffset + 3];

        // If length is invalid (< 2), skip just the marker and length field (4 bytes)
        if (lengthField < 2) {
          result.success = true;
          result.newOffset = startOffset + 4;
          result.skippedBytes = 4;
        } else if (lengthField <= 1024) {
          // If length looks reasonable, skip that amount
          result.success = true;
          result.newOffset = Math.min(startOffset + lengthField, endOffset);
          result.skippedBytes = result.newOffset - startOffset;
        } else {
          // Length is suspiciously large, skip minimal amount
          result.success = true;
          result.newOffset = startOffset + 4;
          result.skippedBytes = 4;
        }
      }
    }

    if (!result.success) {
      // If we couldn't find a valid marker, skip to end
      result.newOffset = endOffset;
      result.skippedBytes = endOffset - startOffset;
    }

    if (result.skippedBytes > 0) {
      result.warnings.push({
        type: "SKIP_MALFORMED",
        message: `Skipped ${result.skippedBytes} bytes of malformed segment`,
        offset: startOffset,
      });
    }

    return result;
  }

  /**
   * Handle truncated entropy data in tolerant mode.
   * @param {Uint8Array} data - JPEG data buffer
   * @param {number} currentOffset - Current position in the data
   * @param {object} _frameInfo - Frame information (unused)
   * @returns {object} Truncation handling result
   */
  handleTruncatedEntropy(data, currentOffset, _frameInfo) {
    /** @type {{canRecover: boolean, newOffset: number, warnings: Array<Object>}} */
    const result = {
      canRecover: false,
      newOffset: currentOffset,
      warnings: [],
    };

    // Check if we're at a byte boundary (not in the middle of a Huffman code)
    const remainingBytes = data.length - currentOffset;

    if (remainingBytes === 0) {
      // Clean truncation at EOI
      result.canRecover = true;
      result.warnings.push({
        type: "TRUNCATION",
        message: "File ends abruptly but at byte boundary",
        offset: currentOffset,
      });
    } else if (remainingBytes <= 2) {
      // Very small amount of remaining data - likely just padding
      result.canRecover = true;
      result.newOffset = data.length;
      result.warnings.push({
        type: "TRUNCATION",
        message: `Ignored ${remainingBytes} trailing bytes`,
        offset: currentOffset,
      });
    } else {
      // Significant truncation - cannot safely recover
      result.canRecover = false;
      result.warnings.push({
        type: "TRUNCATION",
        message: `Truncated entropy data: ${remainingBytes} bytes remaining`,
        offset: currentOffset,
      });
    }

    return result;
  }

  /**
   * Validate and enhance error context for better diagnostics.
   * @param {Error} error - Original error
   * @param {Uint8Array} data - JPEG data buffer
   * @param {number} offset - Current offset
   * @returns {Error} Enhanced error with additional context
   */
  enhanceErrorContext(error, data, offset) {
    /** @type {Error & {code?: string, offset?: number, originalError?: Error, marker?: number, context?: string}} */
    const enhancedError = Object.assign(new Error(error.message), {
      code: /** @type {string} */ (/** @type {any} */ (error).code || "JPEG_DECODE_ERROR"),
      offset: offset,
      originalError: error,
    });

    // Try to identify the marker at the error location
    if (offset > 0 && offset < data.length) {
      if (data[offset] === 0xff && offset + 1 < data.length) {
        enhancedError.marker = data[offset + 1];
      } else if (data[offset - 1] === 0xff) {
        enhancedError.marker = data[offset - 1];
      }
    }

    // Add context about the error location
    if (offset >= data.length) {
      enhancedError.context = "End of file reached";
    } else if (offset < 0) {
      enhancedError.context = "Invalid negative offset";
    } else {
      enhancedError.context = `Near byte ${offset.toString(16).toUpperCase()}H`;
    }

    return enhancedError;
  }

  /**
   * Add a warning to the warnings collection.
   * @param {string} type - Warning type (e.g., "RESYNC", "SKIP_MALFORMED")
   * @param {string} message - Warning message
   * @param {number} [offset] - Offset where the warning occurred
   * @param {object} [additionalData] - Additional warning data
   */
  addWarning(type, message, offset = -1, additionalData = {}) {
    const warning = {
      type,
      message,
      offset,
      timestamp: Date.now(),
      ...additionalData,
    };

    this.warnings.push(warning);
  }

  /**
   * Extract comprehensive metadata from JPEG buffer.
   * @param {Uint8Array} buffer - JPEG data buffer
   * @returns {JPEGMetadata} Extracted metadata
   */
  extractMetadata(buffer) {
    let appSegments = [];
    try {
      appSegments = extractAppSegments(buffer);
    } catch (appError) {
      // If APP segment extraction fails, continue with empty segments
      console.warn("APP segment extraction failed in metadata, using empty segments:", appError.message);
    }

    return {
      jfif: getJFIFMetadata(appSegments),
      exif: getEXIFMetadata(appSegments),
      xmp: getXMPMetadata(appSegments),
      adobe: getAdobeMetadata(appSegments),
      iccProfile: assembleICCProfile(appSegments),
    };
  }

  /**
   * Convert decoded pixels to specified output format.
   * @param {Uint8Array} pixels - Input pixel data (RGBA)
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {number} _components - Number of components (unused)
   * @param {string} outputFormat - Desired output format
   * @returns {Uint8Array} Converted pixel data
   */
  convertOutputFormat(pixels, width, height, _components, outputFormat) {
    const pixelCount = width * height;

    switch (outputFormat.toLowerCase()) {
      case "rgba":
        // Already in RGBA format
        return pixels;

      case "rgb": {
        // Convert RGBA to RGB (remove alpha channel)
        const rgbPixels = new Uint8Array(pixelCount * 3);
        for (let i = 0; i < pixelCount; i++) {
          const srcOffset = i * 4;
          const dstOffset = i * 3;
          rgbPixels[dstOffset] = pixels[srcOffset]; // R
          rgbPixels[dstOffset + 1] = pixels[srcOffset + 1]; // G
          rgbPixels[dstOffset + 2] = pixels[srcOffset + 2]; // B
        }
        return rgbPixels;
      }

      case "grayscale": {
        // Convert to grayscale using luminance formula
        const grayPixels = new Uint8Array(pixelCount);
        for (let i = 0; i < pixelCount; i++) {
          const srcOffset = i * 4;
          // Use ITU-R BT.709 luminance coefficients
          const gray = Math.round(
            pixels[srcOffset] * 0.2126 + // R
              pixels[srcOffset + 1] * 0.7152 + // G
              pixels[srcOffset + 2] * 0.0722 // B
          );
          grayPixels[i] = Math.min(255, Math.max(0, gray));
        }
        return grayPixels;
      }

      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }
  }

  /**
   * Quick JPEG format detection and basic info extraction.
   *
   * @param {ArrayBuffer|Uint8Array} buffer - JPEG data buffer
   * @returns {Object} Basic JPEG information
   */
  getJPEGInfo(buffer) {
    try {
      const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      validateSOI(data);

      // Reset decoder state for info extraction
      this.reset();

      // Parse segments to extract basic info
      this.parseSegments(data);

      return {
        width: this.width,
        height: this.height,
        components: this.components.length,
        progressive: this.isProgressive,
        frameType: this.frameType,
        hasMetadata: Object.keys(this.metadata).length > 0,
      };
    } catch (error) {
      return {
        error: error.message,
        width: 0,
        height: 0,
        components: 0,
        progressive: false,
        frameType: "Unknown",
        hasMetadata: false,
      };
    }
  }

  /**
   * Decode JPEG with streaming support for large images.
   *
   * @param {ArrayBuffer|Uint8Array} buffer - JPEG data buffer
   * @param {Partial<JPEGDecoderOptions>} options - Decoding options
   * @param {Function} chunkCallback - Callback for each decoded chunk
   * @returns {Promise<DecodeResult>} Promise resolving to complete result
   */
  async decodeJPEGStreaming(buffer, options = {}, chunkCallback = null) {
    // For now, implement basic streaming by processing in chunks
    // In a full implementation, this would process the image in tiles

    const result = this.decodeJPEG(buffer, { ...options, streamingMode: true });

    if (chunkCallback && typeof chunkCallback === "function") {
      // Simulate chunked processing
      const chunkSize = Math.max(1, Math.floor(result.height / 10));

      for (let y = 0; y < result.height; y += chunkSize) {
        const chunkHeight = Math.min(chunkSize, result.height - y);
        const chunk = {
          x: 0,
          y,
          width: result.width,
          height: chunkHeight,
          pixels: result.pixels.subarray(
            y * result.width * (result.format === "rgba" ? 4 : 3),
            (y + chunkHeight) * result.width * (result.format === "rgba" ? 4 : 3)
          ),
        };

        chunkCallback(chunk);

        // Allow async processing
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    return result;
  }

  /**
   * Reset decoder state for reuse.
   */
  reset() {
    this.width = 0;
    this.height = 0;
    this.components = [];
    this.quantTables = new Array(4);
    this.huffmanTables = { dc: new Array(4), ac: new Array(4) };
    this.dcPredictors = new Int32Array(4);
    this.sosOffset = 0;
    this.restartInterval = 0;
    this.restartEnabled = false;
    this.restartCount = 0;
    this.mcuCount = 0;
    this.metadata = {};
    this.isProgressive = false;
    this.frameType = "Baseline";
    this.progressiveCoefficients = null;
    this.maxHorizontalSampling = 1;
    this.maxVerticalSampling = 1;
    this.mcusPerLine = 0;
    this.mcusPerColumn = 0;
    this.startTime = 0;
    this.performanceMetrics = null;
    this.warnings = [];
  }

  /**
   * Parse all JPEG segments except entropy-coded data.
   * @param {Uint8Array} buffer - JPEG data buffer
   */
  parseSegments(buffer) {
    let offset = 2; // Skip SOI
    let iterations = 0;
    const maxIterations = Math.max(100, buffer.length); // Safety limit

    while (offset < buffer.length) {
      iterations++;
      if (iterations > maxIterations) {
        throw new Error(`Parse loop exceeded maximum iterations (${maxIterations}) - possible infinite loop`);
      }
      let markerResult;

      try {
        markerResult = /** @type {MarkerResult} */ (parseMarker(buffer, offset));
      } catch (error) {
        if (this.options?.tolerantDecoding) {
          // In tolerant mode, try to skip malformed segments
          const skipResult =
            /** @type {{success: boolean, newOffset: number, skippedBytes: number, warnings: Array<Object>}} */ (
              this.skipMalformedSegment(buffer, offset, 1024)
            );
          if (skipResult.success) {
            this.addWarning("MALFORMED_SEGMENT", `Skipped malformed segment: ${error.message}`, offset, {
              originalError: error.message,
              skippedBytes: skipResult.skippedBytes,
            });
            offset = skipResult.newOffset;
            continue;
          } else {
            // If we can't safely skip, still try resync
            const resyncResult =
              /** @type {{success: boolean, newOffset: number, marker: number|null, skippedBytes: number, warnings: Array<Object>}} */ (
                this.attemptResync(buffer, offset, 1024)
              );
            if (resyncResult.success) {
              this.addWarning(
                "MALFORMED_SEGMENT_RESYNC",
                `Resynced after malformed segment: ${error.message}`,
                offset,
                {
                  originalError: error.message,
                  skippedBytes: resyncResult.skippedBytes,
                  foundMarker: resyncResult.marker,
                }
              );
              offset = resyncResult.newOffset;
              continue;
            }
          }
        }
        // In strict mode or if tolerant recovery failed, re-throw
        throw error;
      }

      const { marker, dataOffset, endOffset } = markerResult;

      switch (marker) {
        case MARKERS.DQT:
          this.parseDQT(buffer, dataOffset, endOffset);
          break;
        case MARKERS.DHT:
          this.parseDHT(buffer, dataOffset, endOffset);
          break;
        case MARKERS.SOF0:
        case MARKERS.SOF2:
          this.parseSOF(buffer, dataOffset, marker === MARKERS.SOF2);
          break;
        case MARKERS.DRI:
          this.parseDRI(buffer, dataOffset);
          break;
        case MARKERS.SOS:
          // SOS marks start of entropy-coded data
          this.sosOffset = offset + 2;
          return;
        case MARKERS.EOI:
          // EOI can appear at the end of the file or as a terminator
          if (endOffset >= buffer.length) {
            // We're at the end of the file, this is normal termination
            return;
          } else if (this.options?.tolerantDecoding) {
            // In tolerant mode, accept EOI even if not at end
            this.addWarning("UNEXPECTED_EOI", "EOI marker found before SOS", offset);
            return;
          } else {
            throw new Error("Unexpected EOI marker");
          }
        default:
          // Handle APP markers and other segments
          if (marker >= 0xe0 && marker <= 0xef) {
            // APP marker (APP0-APP15)
            this.parseAPP(buffer, marker, dataOffset, endOffset);
          } else {
            // Skip unknown segments
            if (this.options?.tolerantDecoding) {
              this.addWarning(
                "UNKNOWN_SEGMENT",
                `Skipping unknown marker 0x${marker.toString(16).toUpperCase()}`,
                offset
              );
            }
          }
          break;
      }

      // Ensure offset always advances
      if (endOffset > offset) {
        offset = endOffset;
      } else {
        // Safety: advance at least 2 bytes if no progress
        offset += 2;
        if (this.options?.tolerantDecoding) {
          this.addWarning("PARSE_ERROR", `No progress made parsing marker at offset ${offset - 2}`, offset - 2);
        }
      }
    }

    throw new Error("No SOS marker found");
  }

  /**
   * Parse APP (Application) marker segments with tolerant decoding.
   * @param {Uint8Array} buffer - JPEG data buffer
   * @param {number} marker - APP marker value
   * @param {number} dataOffset - Start of APP data
   * @param {number} endOffset - End of APP segment
   */
  parseAPP(buffer, marker, dataOffset, endOffset) {
    const segmentLength = endOffset - dataOffset;

    // Check for minimum segment length (at least identifier)
    if (segmentLength < 2) {
      if (this.options?.tolerantDecoding) {
        this.addWarning("MALFORMED_APP", `APP${marker & 0x0f} segment too short (${segmentLength} bytes)`, dataOffset);
        return;
      }
      throw new Error(`APP${marker & 0x0f} segment too short (${segmentLength} bytes)`);
    }

    try {
      // Try to parse the APP segment
      // This would integrate with the existing APP parsing from parse.js
      // For now, just validate the segment doesn't overrun
      if (endOffset > buffer.length) {
        if (this.options?.tolerantDecoding) {
          this.addWarning("MALFORMED_APP", `APP${marker & 0x0f} segment overruns buffer`, dataOffset);
          return;
        }
        throw new Error(`APP${marker & 0x0f} segment overruns buffer`);
      }

      // In a full implementation, this would call the appropriate parseJFIF, parseEXIF, etc.
      // For tolerant mode, we just ensure the segment is well-formed enough to skip safely
    } catch (error) {
      if (this.options?.tolerantDecoding) {
        // In tolerant mode, skip malformed APP segments with a warning
        this.addWarning("MALFORMED_APP", `Failed to parse APP${marker & 0x0f}: ${error.message}`, dataOffset, {
          originalError: error.message,
          marker: marker,
        });
      } else {
        // In strict mode, re-throw the error
        throw error;
      }
    }
  }

  /**
   * Handle restart marker synchronization issues in tolerant mode.
   * @param {Uint8Array} _data - JPEG data buffer (unused)
   * @param {number} currentOffset - Current position in entropy data
   * @param {number} expectedRstIndex - Expected RST marker index (0-7)
   * @param {number} foundRstIndex - Found RST marker index (0-7)
   * @returns {object} Resync result with recovery information
   */
  handleRestartSync(_data, currentOffset, expectedRstIndex, foundRstIndex) {
    /** @type {{canRecover: boolean, newOffset: number, correctedIndex: number, warnings: Array<Object>}} */
    const result = {
      canRecover: false,
      newOffset: currentOffset,
      correctedIndex: expectedRstIndex,
      warnings: [],
    };

    if (this.options?.tolerantDecoding) {
      // In tolerant mode, accept the RST marker and resync
      result.canRecover = true;
      result.correctedIndex = foundRstIndex;

      // Calculate how many bytes we skipped (from RST marker start to current position)
      const rstMarkerStart = currentOffset - 2; // RST markers are 2 bytes: FF D0-D7
      result.newOffset = currentOffset;

      result.warnings.push({
        type: "RST_SYNC",
        message: `RST marker index mismatch: expected RST${expectedRstIndex}, found RST${foundRstIndex}`,
        offset: rstMarkerStart,
        expected: expectedRstIndex,
        found: foundRstIndex,
      });

      // Reset DC predictors as per restart semantics
      this.dcPredictors = new Int32Array(4);
    } else {
      // In strict mode, this would be an error
      result.canRecover = false;
    }

    return result;
  }

  /**
   * Parse DQT (quantization table) segment.
   * @param {Uint8Array} buffer - JPEG data buffer
   * @param {number} startOffset - Start of DQT segment
   * @param {number} endOffset - End of DQT segment
   */
  parseDQT(buffer, startOffset, endOffset) {
    let offset = startOffset;

    while (offset < endOffset) {
      const header = buffer[offset++];
      const precision = header >>> 4; // Pq: 0=8-bit, 1=16-bit
      const tableId = header & 15; // Tq: 0..3

      // Validate table ID and precision
      if (tableId > 3) {
        throw new Error(`Invalid quantization table ID: ${tableId} (must be 0-3)`);
      }
      if (precision !== 0 && precision !== 1) {
        throw new Error(`Invalid quantization table precision: ${precision} (must be 0 or 1)`);
      }

      // Calculate bytes per entry (1 for 8-bit, 2 for 16-bit)
      const bytesPerEntry = precision + 1;

      // Check if we have enough data for 64 entries
      const requiredBytes = 64 * bytesPerEntry;
      if (offset + requiredBytes > endOffset) {
        throw new Error(`DQT segment truncated: need ${requiredBytes} bytes for table, have ${endOffset - offset}`);
      }

      // Create table in natural order (not zig-zag)
      const table = new Int32Array(64);

      // Read entries in zig-zag order and store in natural order
      for (let i = 0; i < 64; i++) {
        let value;
        if (precision === 0) {
          // 8-bit entry
          value = buffer[offset++];
        } else {
          // 16-bit entry (big-endian)
          value = (buffer[offset] << 8) | buffer[offset + 1];
          offset += 2;
        }

        // Map from zig-zag order to natural order using precomputed constant
        const naturalIndex = ZIGZAG_TO_NATURAL[i];
        table[naturalIndex] = value;
      }

      // Store the quantization table
      this.quantTables[tableId] = table;
    }
  }

  /**
   * Parse DHT (Huffman table) segment.
   * @param {Uint8Array} buffer - JPEG data buffer
   * @param {number} startOffset - Start of DHT segment
   * @param {number} endOffset - End of DHT segment
   */
  parseDHT(buffer, startOffset, endOffset) {
    let offset = startOffset;

    while (offset < endOffset) {
      const header = buffer[offset++];
      const tableClass = header >>> 4; // Tc: 0=DC table, 1=AC table
      const tableId = header & 15; // Th: 0..3

      // Validate table class and ID per DECODE.md section 5
      if (tableClass !== 0 && tableClass !== 1) {
        throw new Error(`Invalid Huffman table class: ${tableClass} (must be 0 or 1)`);
      }
      if (tableId > 3) {
        throw new Error(`Invalid Huffman table ID: ${tableId} (must be 0-3)`);
      }

      // Read 16 bytes of symbol counts for each code length (1-16)
      const symbolCounts = new Uint8Array(16);
      let totalSymbols = 0;
      for (let i = 0; i < 16; i++) {
        symbolCounts[i] = buffer[offset++];
        totalSymbols += symbolCounts[i];
      }

      // Validate total symbols doesn't exceed segment bounds
      if (offset + totalSymbols > endOffset) {
        throw new Error(`DHT segment truncated: need ${totalSymbols} symbols, have ${endOffset - offset}`);
      }

      // Read symbol values
      const symbols = new Uint8Array(totalSymbols);
      for (let i = 0; i < totalSymbols; i++) {
        symbols[i] = buffer[offset++];
      }

      // Create Huffman table with canonical code generation
      const huffmanTable = new HuffmanTable(tableClass, tableId, symbolCounts, symbols);

      // Store table in appropriate array (DC or AC)
      if (tableClass === 0) {
        this.huffmanTables.dc[tableId] = huffmanTable;
      } else {
        this.huffmanTables.ac[tableId] = huffmanTable;
      }
    }
  }

  /**
   * Parse SOF (start of frame) segment.
   * @param {Uint8Array} buffer - JPEG data buffer
   * @param {number} startOffset - Start of SOF segment
   * @param {boolean} isProgressive - Whether progressive JPEG
   */
  parseSOF(buffer, startOffset, isProgressive) {
    let offset = startOffset;

    // Parse precision (must be 8 for baseline JPEG)
    const precision = buffer[offset++];
    if (precision !== 8) {
      throw new Error(`Unsupported precision: ${precision} (must be 8 for baseline JPEG)`);
    }

    // Parse image dimensions
    this.height = (buffer[offset++] << 8) | buffer[offset++];
    this.width = (buffer[offset++] << 8) | buffer[offset++];

    // Validate dimensions
    if (this.height === 0 || this.width === 0) {
      throw new Error(`Invalid image dimensions: ${this.width}x${this.height}`);
    }
    if (this.height > 65535 || this.width > 65535) {
      throw new Error(`Image dimensions too large: ${this.width}x${this.height} (max 65535x65535)`);
    }

    // Check resolution limits
    const totalPixels = this.width * this.height;
    const maxPixels = this.options?.maxResolutionMP ? this.options.maxResolutionMP * 1000000 : 100000000; // Default 100MP
    if (totalPixels > maxPixels) {
      const actualMP = totalPixels / 1000000;
      throw new Error(
        `Image resolution (${this.width}x${this.height} = ${actualMP.toFixed(1)}MP) exceeds limit (${this.options?.maxResolutionMP || 100}MP)`
      );
    }

    // Validate memory requirements for this image
    this.validateMemoryRequirements();

    // Parse number of components
    const numComponents = buffer[offset++];
    if (numComponents === 0 || numComponents > 255) {
      throw new Error(`Invalid number of components: ${numComponents} (must be 1-255)`);
    }

    // Initialize component array
    this.components = [];
    let maxHorizontalSampling = 0;
    let maxVerticalSampling = 0;

    // Parse component information
    for (let i = 0; i < numComponents; i++) {
      const componentId = buffer[offset++];
      const sampling = buffer[offset++];
      const horizontalSampling = sampling >>> 4;
      const verticalSampling = sampling & 15;
      const quantTableId = buffer[offset++];

      // Validate component parameters
      if (horizontalSampling < 1 || horizontalSampling > 4) {
        throw new Error(`Invalid horizontal sampling factor for component ${i}: ${horizontalSampling} (must be 1-4)`);
      }
      if (verticalSampling < 1 || verticalSampling > 4) {
        throw new Error(`Invalid vertical sampling factor for component ${i}: ${verticalSampling} (must be 1-4)`);
      }
      if (quantTableId > 3) {
        throw new Error(`Invalid quantization table ID for component ${i}: ${quantTableId} (must be 0-3)`);
      }

      // Track maximum sampling factors for MCU calculation
      maxHorizontalSampling = Math.max(maxHorizontalSampling, horizontalSampling);
      maxVerticalSampling = Math.max(maxVerticalSampling, verticalSampling);

      // Store component information
      this.components.push({
        id: componentId,
        horizontalSampling,
        verticalSampling,
        quantTableId,
        // Component geometry (calculated below)
        width: 0,
        height: 0,
        blocksPerLine: 0,
        blocksPerColumn: 0,
        blocks: null, // Will be allocated during scan decoding
      });
    }

    // Calculate MCU dimensions and component geometry
    this.mcuWidth = maxHorizontalSampling * 8; // MCU width in pixels
    this.mcuHeight = maxVerticalSampling * 8; // MCU height in pixels

    // Calculate component dimensions and block counts
    for (let i = 0; i < numComponents; i++) {
      const component = this.components[i];

      // Component dimensions (rounded up to MCU boundaries)
      component.width = Math.ceil((this.width * component.horizontalSampling) / maxHorizontalSampling);
      component.height = Math.ceil((this.height * component.verticalSampling) / maxVerticalSampling);

      // Block counts for this component
      component.blocksPerLine = Math.ceil(component.width / 8);
      component.blocksPerColumn = Math.ceil(component.height / 8);
    }

    // Calculate total MCU count
    this.mcusPerLine = Math.ceil(this.width / this.mcuWidth);
    this.mcusPerColumn = Math.ceil(this.height / this.mcuHeight);
    this.totalMcus = this.mcusPerLine * this.mcusPerColumn;

    // Store frame type
    this.isProgressive = isProgressive;
    this.frameType = isProgressive ? "Progressive DCT" : "Baseline DCT";
  }

  /**
   * Parse DRI (restart interval) segment.
   * @param {Uint8Array} buffer - JPEG data buffer
   * @param {number} startOffset - Start of DRI segment
   */
  parseDRI(buffer, startOffset) {
    // DRI segment format: 2 bytes restart interval
    const restartInterval = (buffer[startOffset] << 8) | buffer[startOffset + 1];

    // Validate restart interval (must be >= 1 for restart markers to be meaningful)
    if (restartInterval === 0) {
      throw new Error("Invalid restart interval: cannot be zero");
    }

    // Store restart interval
    this.restartInterval = restartInterval;
    this.restartEnabled = true;

    // Initialize restart state
    this.restartCount = 0;
    this.mcuCount = 0;
  }

  /**
   * Check for and handle restart markers in entropy stream.
   * @param {BitReader} bitReader - Bit reader instance
   * @returns {boolean} True if restart marker was found and handled
   */
  handleRestartMarker(bitReader) {
    // If restart is not enabled, don't look for restart markers
    if (!this.restartEnabled) {
      return false;
    }

    // Check if we have enough bits to peek at a potential marker
    if (bitReader.bitCount < 16) {
      // Need to refill buffer to check for markers
      if (!bitReader.refillBuffer()) {
        return false; // No more data available
      }
      if (bitReader.bitCount < 16) {
        return false; // Not enough data for a marker
      }
    }

    // Peek at next 16 bits to check for restart marker
    // BitReader stores data MSB first, so we need the upper 16 bits
    const peekBits = bitReader.bitBuffer >>> (bitReader.bitCount - 16);
    const highByte = (peekBits >>> 8) & 0xff;
    const lowByte = peekBits & 0xff;

    // Check if it's a restart marker (0xFF followed by D0-D7)
    if (highByte === 0xff && lowByte >= 0xd0 && lowByte <= 0xd7) {
      // Found restart marker - consume the 16 bits
      bitReader.bitCount -= 16;

      // Validate restart marker sequence
      const expectedRestartIndex = this.restartCount % 8;
      const actualRestartIndex = lowByte - 0xd0;

      if (actualRestartIndex !== expectedRestartIndex) {
        throw new Error(`Unexpected restart marker: expected RST${expectedRestartIndex}, got RST${actualRestartIndex}`);
      }

      // Reset DC predictors for all components
      this.dcPredictors.fill(0);

      // Update restart state
      this.restartCount++;
      this.mcuCount = 0;

      return true;
    }

    return false;
  }

  /**
   * Decode DC coefficient with differential prediction.
   * @param {BitReader} bitReader - Bit reader instance
   * @param {number} componentIndex - Component index for predictor
   * @param {number} dcTableIndex - DC Huffman table index
   * @returns {number} Decoded DC coefficient
   */
  decodeDCCoefficient(bitReader, componentIndex, dcTableIndex) {
    const huffmanTable = this.huffmanTables.dc[dcTableIndex];
    if (!huffmanTable) {
      throw new Error(`DC Huffman table ${dcTableIndex} not found`);
    }

    // Decode Huffman symbol (category)
    const category = huffmanTable.decodeSymbol(bitReader);

    if (category === 0) {
      // DC coefficient is 0 (no additional bits)
      return this.dcPredictors[componentIndex];
    }

    // Read additional bits for magnitude with JPEG sign extension
    const diff = bitReader.receiveSigned(category);

    // Update predictor
    this.dcPredictors[componentIndex] += diff;

    return this.dcPredictors[componentIndex];
  }

  /**
   * Decode AC coefficients using run-length encoding.
   * @param {BitReader} bitReader - Bit reader instance
   * @param {number} acTableIndex - AC Huffman table index
   * @returns {Int16Array} Decoded AC coefficients (63 values)
   */
  decodeACCoefficients(bitReader, acTableIndex) {
    const huffmanTable = this.huffmanTables.ac[acTableIndex];
    if (!huffmanTable) {
      throw new Error(`AC Huffman table ${acTableIndex} not found`);
    }

    const acCoefficients = new Int16Array(63); // AC coefficients 1-63
    let coefficientIndex = 0;

    while (coefficientIndex < 63) {
      // Decode Huffman symbol (run/size)
      const symbol = huffmanTable.decodeSymbol(bitReader);

      if (symbol === 0) {
        // End of block (EOB)
        break;
      }

      if (symbol === 0xf0) {
        // ZRL (zero run of 16)
        coefficientIndex += 16;
        continue;
      }

      // Extract run length and size
      const run = symbol >>> 4; // High 4 bits: run length
      const size = symbol & 0xf; // Low 4 bits: coefficient size

      // Skip run zeros
      coefficientIndex += run;

      if (coefficientIndex >= 63) {
        // Run exceeded block size
        break;
      }

      if (size === 0) {
        throw new Error("Invalid AC symbol: size cannot be 0");
      }

      // Read additional bits for coefficient magnitude with JPEG sign extension
      const coefficient = bitReader.receiveSigned(size);

      // Store coefficient in natural order
      acCoefficients[coefficientIndex] = coefficient;
      coefficientIndex++;
    }

    return acCoefficients;
  }

  /**
   * Decode a complete 8x8 coefficient block.
   * @param {BitReader} bitReader - Bit reader instance
   * @param {number} componentIndex - Component index
   * @param {number} dcTableIndex - DC Huffman table index
   * @param {number} acTableIndex - AC Huffman table index
   * @returns {Int16Array} Decoded 8x8 coefficient block
   */
  decodeBlock(bitReader, componentIndex, dcTableIndex, acTableIndex) {
    const block = new Int16Array(64);

    // Check for restart marker before DC coefficient (rare but possible)
    if (this.restartEnabled) {
      this.handleRestartMarker(bitReader);
    }

    // Decode DC coefficient
    const dcCoefficient = this.decodeDCCoefficient(bitReader, componentIndex, dcTableIndex);
    block[0] = dcCoefficient;

    // Check for restart marker after DC coefficient
    if (this.restartEnabled) {
      this.handleRestartMarker(bitReader);
    }

    // Decode AC coefficients
    const acCoefficients = this.decodeACCoefficients(bitReader, acTableIndex);

    // Copy AC coefficients to block (natural order)
    for (let i = 0; i < 63; i++) {
      block[i + 1] = acCoefficients[i];
    }

    return block;
  }

  /**
   * Dequantize a coefficient block using the quantization table.
   * @param {Int16Array} block - Coefficient block
   * @param {number} quantTableIndex - Quantization table index
   * @returns {Int16Array} Dequantized coefficient block
   */
  dequantizeBlock(block, quantTableIndex) {
    const quantTable = this.quantTables[quantTableIndex];
    if (!quantTable) {
      throw new Error(`Quantization table ${quantTableIndex} not found`);
    }

    const dequantizedBlock = new Int16Array(64);

    // Dequantize each coefficient
    // Both block and quantTable are in natural order
    for (let i = 0; i < 64; i++) {
      const quantValue = quantTable[i];
      if (quantValue === 0) {
        throw new Error("Invalid quantization table: zero divisor");
      }
      dequantizedBlock[i] = block[i] * quantValue;
    }

    return dequantizedBlock;
  }

  /**
   * Decode entropy-coded scans.
   * @param {Uint8Array} buffer - JPEG data buffer
   */
  decodeScans(buffer) {
    // Initialize coefficient arrays for progressive decoding
    if (this.isProgressive) {
      this.initializeProgressiveArrays();
    }

    const scans = [];
    let currentOffset = this.sosOffset;

    // Parse all scans in the image
    while (currentOffset < buffer.length - 1) {
      const bitReader = new BitReader(buffer, currentOffset, buffer.length);
      const scan = this.parseSOS(buffer, bitReader);

      scans.push(scan);

      // Decode this scan
      if (this.isProgressive) {
        this.decodeProgressiveScan(bitReader, scan);
      } else {
        this.decodeBaselineScan(bitReader, scan);
        // For baseline, we only need one scan
        break;
      }

      // Find next SOS or EOI marker
      currentOffset = this.findNextScan(buffer, bitReader.offset);

      // If we hit EOI or no more data, we're done
      if (currentOffset >= buffer.length - 1 || buffer[currentOffset] === MARKERS.EOI) {
        break;
      }
    }

    // For progressive JPEG, reconstruct from accumulated coefficients
    if (this.isProgressive) {
      return this.reconstructProgressiveImage();
    }

    // Return baseline result
    return this.getDecodedImage();
  }

  /**
   * Initialize coefficient arrays for progressive JPEG decoding.
   */
  initializeProgressiveArrays() {
    this.progressiveCoefficients = [];

    for (const component of this.components) {
      const blocksPerLine = Math.ceil(this.width / 8 / (this.maxHorizontalSampling / component.horizontalSampling));
      const blocksPerColumn = Math.ceil(this.height / 8 / (this.maxVerticalSampling / component.verticalSampling));

      // Initialize coefficient array for this component
      const coefficients = new Array(blocksPerLine * blocksPerColumn);
      for (let i = 0; i < coefficients.length; i++) {
        coefficients[i] = new Int16Array(64); // 8x8 coefficients in zigzag order
      }

      this.progressiveCoefficients.push({
        component,
        coefficients,
        blocksPerLine,
        blocksPerColumn,
      });
    }
  }

  /**
   * Find the next SOS marker in the buffer.
   * @param {Uint8Array} buffer - JPEG data buffer
   * @param {number} startOffset - Starting offset to search from
   * @returns {number} Offset of next SOS marker, or buffer.length if none found
   */
  findNextScan(buffer, startOffset) {
    let offset = startOffset;

    while (offset < buffer.length - 1) {
      // Look for 0xFF
      if (buffer[offset] === 0xff) {
        const nextByte = buffer[offset + 1];
        if (nextByte === MARKERS.SOS) {
          return offset; // Found SOS marker
        } else if (nextByte === MARKERS.EOI) {
          return offset; // Found EOI marker
        } else if (nextByte !== 0x00) {
          // Skip other markers
          offset += 2;
          continue;
        }
      }
      offset++;
    }

    return buffer.length; // No more markers found
  }

  /**
   * Decode a single progressive scan.
   * @param {BitReader} bitReader - Bit reader instance
   * @param {ScanInfo} scan - Scan information
   */
  decodeProgressiveScan(bitReader, scan) {
    // Reset DC predictors for this scan
    this.dcPredictors.fill(0);

    // Process all MCUs in raster order
    for (let mcuY = 0; mcuY < this.mcusPerColumn; mcuY++) {
      for (let mcuX = 0; mcuX < this.mcusPerLine; mcuX++) {
        this.decodeProgressiveMCU(bitReader, scan, mcuX, mcuY);
      }
    }
  }

  /**
   * Decode single MCU for progressive JPEG.
   * @param {BitReader} bitReader - Bit reader instance
   * @param {ScanInfo} scan - Scan information
   * @param {number} mcuX - MCU X coordinate
   * @param {number} mcuY - MCU Y coordinate
   */
  decodeProgressiveMCU(bitReader, scan, mcuX, mcuY) {
    // Check for restart marker at MCU boundary if restart is enabled
    if (this.restartEnabled && this.mcuCount > 0 && this.mcuCount % this.restartInterval === 0) {
      if (!this.handleRestartMarker(bitReader)) {
        throw new Error(`Expected restart marker at MCU ${this.mcuCount}, but none found`);
      }
    }

    // Process each component in the MCU
    for (let compIndex = 0; compIndex < scan.scanComponents.length; compIndex++) {
      const scanComp = scan.scanComponents[compIndex];
      const component = scanComp.component;
      const progressiveData = this.progressiveCoefficients[compIndex];

      // Calculate number of 8x8 blocks for this component in the MCU
      const blocksPerMCU_X = component.horizontalSampling;
      const blocksPerMCU_Y = component.verticalSampling;

      // Process blocks within this MCU
      for (let blockY = 0; blockY < blocksPerMCU_Y; blockY++) {
        for (let blockX = 0; blockX < blocksPerMCU_X; blockX++) {
          // Calculate block position in component
          const blockIndexX = mcuX * blocksPerMCU_X + blockX;
          const blockIndexY = mcuY * blocksPerMCU_Y + blockY;

          // Skip if block is outside component bounds
          if (blockIndexX >= progressiveData.blocksPerLine || blockIndexY >= progressiveData.blocksPerColumn) {
            continue;
          }

          // Calculate block index in component's coefficient array
          const blockIndex = blockIndexY * progressiveData.blocksPerLine + blockIndexX;

          // Decode coefficients for this block in the progressive scan
          this.decodeProgressiveBlock(
            bitReader,
            progressiveData.coefficients[blockIndex],
            compIndex,
            scanComp.dcTableIndex,
            scanComp.acTableIndex,
            scan.spectralStart,
            scan.spectralEnd,
            scan.approximationHigh,
            scan.approximationLow
          );
        }
      }
    }

    // Increment MCU count for restart interval tracking
    this.mcuCount++;
  }

  /**
   * Decode a single 8x8 coefficient block in progressive mode.
   * @param {BitReader} bitReader - Bit reader instance
   * @param {Int16Array} coefficients - Coefficient array for this block
   * @param {number} compIndex - Component index
   * @param {number} dcTableIndex - DC Huffman table index
   * @param {number} acTableIndex - AC Huffman table index
   * @param {number} spectralStart - Start of spectral selection
   * @param {number} spectralEnd - End of spectral selection
   * @param {number} approximationHigh - Successive approximation high bits
   * @param {number} approximationLow - Successive approximation low bits
   */
  decodeProgressiveBlock(
    bitReader,
    coefficients,
    compIndex,
    dcTableIndex,
    acTableIndex,
    spectralStart,
    spectralEnd,
    approximationHigh,
    approximationLow
  ) {
    // DC coefficient refinement (spectralStart === spectralEnd === 0)
    if (spectralStart === 0 && spectralEnd === 0) {
      this.decodeDCProgressive(bitReader, coefficients, compIndex, dcTableIndex, approximationHigh, approximationLow);
    }
    // AC coefficient refinement
    else {
      this.decodeACProgressive(
        bitReader,
        coefficients,
        acTableIndex,
        spectralStart,
        spectralEnd,
        approximationHigh,
        approximationLow
      );
    }
  }

  /**
   * Decode DC coefficient in progressive mode.
   * @param {BitReader} bitReader - Bit reader instance
   * @param {Int16Array} coefficients - Coefficient array for this block
   * @param {number} compIndex - Component index
   * @param {number} dcTableIndex - DC Huffman table index
   * @param {number} approximationHigh - Successive approximation high bits
   * @param {number} approximationLow - Successive approximation low bits
   */
  decodeDCProgressive(bitReader, coefficients, compIndex, dcTableIndex, approximationHigh, approximationLow) {
    // First DC scan (approximationLow === 0)
    if (approximationLow === 0) {
      // Decode differential DC coefficient
      const dcTable = this.huffmanTables.dc[dcTableIndex];
      const value = dcTable.decodeSymbol(bitReader);
      const diff = this.decodeHuffmanValue(bitReader, value);

      // Update DC predictor
      this.dcPredictors[compIndex] += diff;

      // Apply successive approximation scaling
      coefficients[0] = this.dcPredictors[compIndex] << approximationHigh;
    }
    // DC refinement scan (approximationLow > 0)
    else {
      // Read additional bit for DC refinement
      const bit = bitReader.receive(1);

      // Apply refinement to existing DC coefficient
      const refinement = bit << approximationLow;
      coefficients[0] |= refinement;
    }
  }

  /**
   * Decode AC coefficients in progressive mode.
   * @param {BitReader} bitReader - Bit reader instance
   * @param {Int16Array} coefficients - Coefficient array for this block
   * @param {number} acTableIndex - AC Huffman table index
   * @param {number} spectralStart - Start of spectral selection
   * @param {number} spectralEnd - End of spectral selection
   * @param {number} approximationHigh - Successive approximation high bits
   * @param {number} approximationLow - Successive approximation low bits
   */
  decodeACProgressive(
    bitReader,
    coefficients,
    acTableIndex,
    spectralStart,
    spectralEnd,
    approximationHigh,
    approximationLow
  ) {
    const acTable = this.huffmanTables.ac[acTableIndex];
    let coeffIndex = spectralStart;

    // First AC scan (approximationLow === 0)
    if (approximationLow === 0) {
      while (coeffIndex <= spectralEnd) {
        // Decode run-length encoded AC coefficient
        const value = acTable.decodeSymbol(bitReader);

        if (value === 0) {
          // End of block
          break;
        }

        const runLength = value >>> 4;
        const size = value & 0xf;

        // Skip zero coefficients
        coeffIndex += runLength;

        if (coeffIndex > spectralEnd) {
          throw new Error("AC coefficient index out of spectral range");
        }

        // Decode coefficient value
        const coeffValue = this.decodeHuffmanValue(bitReader, size);

        // Apply successive approximation scaling
        coefficients[coeffIndex] = coeffValue << approximationHigh;
        coeffIndex++;
      }
    }
    // AC refinement scan (approximationLow > 0)
    else {
      let eobRun = 0;

      while (coeffIndex <= spectralEnd) {
        if (eobRun > 0) {
          // Apply refinement to next coefficient
          while (coeffIndex <= spectralEnd) {
            if (coefficients[coeffIndex] !== 0) {
              // This coefficient was non-zero, apply refinement
              const bit = bitReader.receive(1);
              const refinement = bit << approximationLow;
              if ((coefficients[coeffIndex] & (1 << approximationLow)) === 0) {
                coefficients[coeffIndex] += refinement;
              } else {
                coefficients[coeffIndex] -= refinement;
              }
            }
            coeffIndex++;
            eobRun--;
            if (eobRun === 0) break;
          }
        } else {
          // Decode next symbol
          const value = acTable.decodeSymbol(bitReader);

          const runLength = value >>> 4;
          const size = value & 0xf;

          if (size === 0) {
            if (runLength === 15) {
              // Run of 16 zero coefficients
              coeffIndex += 16;
            } else {
              // End of band or end of block
              eobRun = 1 << runLength;
              if (runLength > 0) {
                // Read additional bits for EOB run
                const additional = bitReader.receive(runLength);
                eobRun += additional;
              }
            }
          } else {
            // Non-zero coefficient
            coeffIndex += runLength;

            if (coeffIndex > spectralEnd) {
              throw new Error("AC coefficient index out of spectral range");
            }

            // Read refinement bit
            const bit = bitReader.receive(1);

            // Apply refinement
            const refinement = bit << approximationLow;
            coefficients[coeffIndex] = refinement;
            coeffIndex++;
          }
        }
      }
    }
  }

  /**
   * Decode Huffman-encoded value with sign extension.
   * @param {BitReader} bitReader - Bit reader instance
   * @param {number} size - Number of bits to read
   * @returns {number} Decoded value
   */
  decodeHuffmanValue(bitReader, size) {
    if (size === 0) return 0;

    const value = bitReader.receive(size);

    // Sign extension for JPEG
    if (value < 1 << (size - 1)) {
      return value - (1 << size) + 1;
    }

    return value;
  }

  /**
   * Reconstruct final image from progressive coefficients.
   * @returns {DecodedImage} Decoded image data
   */
  reconstructProgressiveImage() {
    // Apply IDCT to coefficient blocks and convert to spatial domain
    const spatialPlanes = this.progressiveCoefficientsToSpatial();

    // Upsample chroma components to match luma resolution
    this.upsampleComponents(spatialPlanes);

    // Convert color space and assemble final RGBA image
    const rgbaImage = this.assembleRGBAImage(spatialPlanes);

    return {
      width: this.width,
      height: this.height,
      data: rgbaImage,
      components: this.components.length,
      progressive: true,
      frameType: this.frameType,
    };
  }

  /**
   * Convert progressive coefficients to spatial domain planes.
   * @returns {Array<Uint8Array>} Spatial domain planes
   */
  progressiveCoefficientsToSpatial() {
    const planes = [];

    for (let compIndex = 0; compIndex < this.progressiveCoefficients.length; compIndex++) {
      const progressiveData = this.progressiveCoefficients[compIndex];
      const component = progressiveData.component;

      const planeWidth = progressiveData.blocksPerLine * 8;
      const planeHeight = progressiveData.blocksPerColumn * 8;
      const plane = new Uint8Array(planeWidth * planeHeight);

      // Convert coefficient blocks to spatial domain
      for (let blockY = 0; blockY < progressiveData.blocksPerColumn; blockY++) {
        for (let blockX = 0; blockX < progressiveData.blocksPerLine; blockX++) {
          const blockIndex = blockY * progressiveData.blocksPerLine + blockX;
          const coefficients = progressiveData.coefficients[blockIndex];
          const spatialBlock = new Uint8Array(64);

          // Dequantize and IDCT
          const quantTable = this.quantTables[component.quantTableId];
          processBlock(/** @type {Int16Array} */ (coefficients), quantTable, spatialBlock);

          // Copy to plane
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              const spatialIndex = y * 8 + x;
              const planeIndex = (blockY * 8 + y) * planeWidth + (blockX * 8 + x);
              plane[planeIndex] = spatialBlock[spatialIndex];
            }
          }
        }
      }

      planes.push(plane);
    }

    return planes;
  }

  /**
   * Get decoded image for baseline compatibility.
   * @returns {DecodedImage} Decoded image data
   */
  getDecodedImage() {
    // Apply IDCT and convert blocks to spatial domain
    this.applyIDCTToBlocks();

    // Allocate spatial planes for each component
    const spatialPlanes = this.allocateSpatialPlanes();

    // Convert block data to spatial planes
    this.blocksToSpatialPlanes(spatialPlanes);

    // Upsample chroma components to match luma resolution
    this.upsampleComponents(spatialPlanes);

    // Convert color space and assemble final RGBA image
    const rgbaImage = this.assembleRGBAImage(spatialPlanes);

    return {
      width: this.width,
      height: this.height,
      data: rgbaImage,
      components: this.components.length,
      progressive: this.isProgressive,
      frameType: this.frameType,
    };
  }

  /**
   * Parse SOS (start of scan) segment.
   * @param {Uint8Array} buffer - JPEG data buffer
   * @param {BitReader} bitReader - Bit reader instance
   */
  parseSOS(buffer, bitReader) {
    // BitReader is already positioned at SOS segment data (after marker)

    // Read SOS segment length
    const sosLength = (buffer[bitReader.offset++] << 8) | buffer[bitReader.offset++];
    const sosStartOffset = bitReader.offset;
    const sosEndOffset = sosStartOffset + sosLength - 2;

    // Read number of components in scan
    const numScanComponents = buffer[bitReader.offset++];

    // Read component specifications
    const scanComponents = [];
    for (let i = 0; i < numScanComponents; i++) {
      const componentId = buffer[bitReader.offset++];
      const huffmanTables = buffer[bitReader.offset++];
      const dcTableIndex = huffmanTables >>> 4; // High 4 bits: DC table
      const acTableIndex = huffmanTables & 0xf; // Low 4 bits: AC table

      // Find component by ID
      const component = this.components.find((c) => c.id === componentId);
      if (!component) {
        throw new Error(`Component ${componentId} not found in frame header`);
      }

      scanComponents.push({
        component,
        dcTableIndex,
        acTableIndex,
      });
    }

    // Read spectral selection (for progressive JPEG)
    const spectralStart = buffer[bitReader.offset++];
    const spectralEnd = buffer[bitReader.offset++];

    // Read successive approximation (for progressive JPEG)
    const successiveApprox = buffer[bitReader.offset++];
    const approximationHigh = successiveApprox >>> 4;
    const approximationLow = successiveApprox & 0xf;

    // Validate we consumed exactly the SOS segment
    if (bitReader.offset !== sosEndOffset) {
      throw new Error(`SOS segment parsing error: expected offset ${sosEndOffset}, got ${bitReader.offset}`);
    }

    return {
      scanComponents,
      spectralStart,
      spectralEnd,
      approximationHigh,
      approximationLow,
    };
  }

  /**
   * Decode single scan.
   * @param {BitReader} bitReader - Bit reader instance
   * @param {ScanInfo} scan - Scan information
   */
  decodeScan(bitReader, scan) {
    // Allocate component blocks if not already done
    this.allocateBlocks();

    // Reset DC predictors for this scan
    this.dcPredictors.fill(0);

    // Process all MCUs in raster order
    let processedMCUs = 0;
    for (let mcuY = 0; mcuY < this.mcusPerColumn; mcuY++) {
      for (let mcuX = 0; mcuX < this.mcusPerLine; mcuX++) {
        try {
          this.decodeMCU(bitReader, scan.scanComponents, mcuX, mcuY);
          processedMCUs++;
        } catch (error) {
          if (error.message.includes("Bit stream exhausted")) {
            // Return early - we've processed as much as possible
            return;
          }
          throw error;
        }
      }
    }
  }

  /**
   * Decode single MCU (Minimum Coded Unit).
   * @param {BitReader} bitReader - Bit reader instance
   * @param {ScanComponentInfo[]} scanComponents - Components in this scan
   * @param {number} mcuX - MCU X coordinate
   * @param {number} mcuY - MCU Y coordinate
   */
  decodeMCU(bitReader, scanComponents, mcuX, mcuY) {
    // Check for restart marker when expected (with some tolerance)
    if (this.restartEnabled && this.mcuCount > 0 && this.mcuCount % this.restartInterval === 0) {
      // Try to find the restart marker
      if (!this.handleRestartMarker(bitReader)) {
        // In tolerant mode, continue without restart marker but log warning
        if (this.options?.tolerantDecoding) {
          this.addWarning("MISSING_RST", `Expected restart marker at MCU ${this.mcuCount}, continuing without it`);
        } else {
          throw new Error(`Expected restart marker at MCU ${this.mcuCount}, but none found`);
        }
      }
    }

    // Process each component in the MCU
    for (let compIndex = 0; compIndex < scanComponents.length; compIndex++) {
      const scanComp = scanComponents[compIndex];
      const component = scanComp.component;

      // Calculate number of 8x8 blocks for this component in the MCU
      const blocksPerMCU_X = component.horizontalSampling;
      const blocksPerMCU_Y = component.verticalSampling;
      const _blocksPerMCU = blocksPerMCU_X * blocksPerMCU_Y;

      // Process blocks within this MCU
      for (let blockY = 0; blockY < blocksPerMCU_Y; blockY++) {
        for (let blockX = 0; blockX < blocksPerMCU_X; blockX++) {
          // Calculate block position in component
          const blockIndexX = mcuX * blocksPerMCU_X + blockX;
          const blockIndexY = mcuY * blocksPerMCU_Y + blockY;

          // Skip if block is outside component bounds
          if (blockIndexX >= component.blocksPerLine || blockIndexY >= component.blocksPerColumn) {
            continue;
          }

          // Calculate block index in component's block array
          const blockIndex = blockIndexY * component.blocksPerLine + blockIndexX;

          // Decode 8x8 coefficient block
          const block = this.decodeBlock(bitReader, compIndex, scanComp.dcTableIndex, scanComp.acTableIndex);

          // Dequantize the block
          const dequantizedBlock = this.dequantizeBlock(block, component.quantTableId);

          // Store the dequantized block
          component.blocks[blockIndex] = dequantizedBlock;
        }
      }
    }

    // Increment MCU count for restart interval tracking
    this.mcuCount++;
  }

  /**
   * Allocate block grids for all components.
   */
  allocateBlocks() {
    // Calculate maximum sampling factors
    let maxHorizontalSampling = 1;
    let maxVerticalSampling = 1;

    for (const component of this.components) {
      maxHorizontalSampling = Math.max(maxHorizontalSampling, component.horizontalSampling);
      maxVerticalSampling = Math.max(maxVerticalSampling, component.verticalSampling);
    }

    // Allocate blocks for each component
    for (const component of this.components) {
      const blocksPerLine = Math.ceil(this.width / 8 / (maxHorizontalSampling / component.horizontalSampling));
      const blocksPerColumn = Math.ceil(this.height / 8 / (maxVerticalSampling / component.verticalSampling));

      component.blocksPerLine = blocksPerLine;
      component.blocksPerColumn = blocksPerColumn;
      component.blocks = new Array(blocksPerLine * blocksPerColumn);

      for (let i = 0; i < component.blocks.length; i++) {
        component.blocks[i] = new Int16Array(64);
      }
    }
  }

  /**
   * Reconstruct image from component blocks.
   */
  reconstructImage() {
    const planes = [];

    for (const component of this.components) {
      const planeWidth = component.blocksPerLine * 8;
      const planeHeight = component.blocksPerColumn * 8;
      const plane = new Uint8Array(planeWidth * planeHeight);

      // Reconstruct spatial domain from blocks
      for (let blockY = 0; blockY < component.blocksPerColumn; blockY++) {
        for (let blockX = 0; blockX < component.blocksPerLine; blockX++) {
          const blockIndex = blockY * component.blocksPerLine + blockX;
          const block = component.blocks[blockIndex];
          const spatialBlock = new Uint8Array(64);

          // IDCT
          processBlock(/** @type {Int16Array} */ (block), this.quantTables[component.quantTableId], spatialBlock);

          // Copy to plane
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              const spatialIndex = y * 8 + x;
              const planeIndex = (blockY * 8 + y) * planeWidth + (blockX * 8 + x);
              plane[planeIndex] = spatialBlock[spatialIndex];
            }
          }
        }
      }

      planes.push(plane);
    }

    return planes;
  }

  /**
   * Convert component planes to final RGBA output.
   * @param {Array<Uint8Array>} planes - Component planes
   */
  convertToRGBA(planes) {
    const rgbaBuffer = new Uint8Array(this.width * this.height * 4);

    if (planes.length === 1) {
      // Grayscale
      grayscaleToRgb(planes[0], this.width, this.height, rgbaBuffer);
    } else if (planes.length === 3) {
      // YCbCr
      ycbcrToRgb(planes[0], planes[1], planes[2], this.width, this.height, rgbaBuffer);
    } else {
      throw new Error(`Unsupported number of components: ${planes.length}`);
    }

    return rgbaBuffer;
  }

  /**
   * Decode complete baseline JPEG scan.
   * @param {BitReader} bitReader - Bit reader instance
   * @param {ScanInfo} scan - Scan information
   * @returns {DecodedImage} Decoded image data
   */
  decodeBaselineScan(bitReader, scan) {
    // Decode entropy-coded data
    this.decodeScan(bitReader, scan);

    // Apply IDCT and convert blocks to spatial domain
    this.applyIDCTToBlocks();

    // Allocate spatial planes for each component
    const spatialPlanes = this.allocateSpatialPlanes();

    // Convert block data to spatial planes
    this.blocksToSpatialPlanes(spatialPlanes);

    // Upsample chroma components to match luma resolution
    this.upsampleComponents(spatialPlanes);

    // Convert color space and assemble final RGBA image
    const rgbaImage = this.assembleRGBAImage(spatialPlanes);

    return {
      width: this.width,
      height: this.height,
      data: rgbaImage,
      components: this.components.length,
      progressive: this.isProgressive,
      frameType: this.frameType,
    };
  }

  /**
   * Apply IDCT to all coefficient blocks.
   */
  applyIDCTToBlocks() {
    for (const component of this.components) {
      const quantTable = this.quantTables[component.quantTableId];
      if (!quantTable) {
        throw new Error(`Quantization table ${component.quantTableId} not found for component`);
      }

      // Process each block
      for (let blockIndex = 0; blockIndex < component.blocks.length; blockIndex++) {
        const block = component.blocks[blockIndex];
        if (!block) continue; // Skip empty blocks

        // Apply IDCT to convert coefficients to spatial samples
        const spatialBlock = new Uint8Array(64);
        processBlock(/** @type {Int16Array} */ (block), quantTable, spatialBlock);
        component.blocks[blockIndex] = spatialBlock;
      }
    }
  }

  /**
   * Allocate spatial plane buffers for all components.
   * @returns {Uint8Array[]} Array of spatial plane buffers
   */
  allocateSpatialPlanes() {
    const spatialPlanes = [];

    for (const component of this.components) {
      const planeSize = component.width * component.height;
      spatialPlanes.push(new Uint8Array(planeSize));
    }

    return spatialPlanes;
  }

  /**
   * Convert 8x8 blocks to full spatial planes.
   * @param {Uint8Array[]} spatialPlanes - Output spatial plane buffers
   */
  blocksToSpatialPlanes(spatialPlanes) {
    for (let compIndex = 0; compIndex < this.components.length; compIndex++) {
      const component = this.components[compIndex];
      const spatialPlane = spatialPlanes[compIndex];

      // Convert blocks to spatial plane
      for (let blockY = 0; blockY < component.blocksPerColumn; blockY++) {
        for (let blockX = 0; blockX < component.blocksPerLine; blockX++) {
          const blockIndex = blockY * component.blocksPerLine + blockX;
          const block = component.blocks[blockIndex];

          if (!block) continue; // Skip empty blocks

          // Copy 8x8 block to spatial plane
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              const blockPixel = block[y * 8 + x];
              const planeX = blockX * 8 + x;
              const planeY = blockY * 8 + y;

              // Bounds check (should not be necessary if geometry is correct)
              if (planeX < component.width && planeY < component.height) {
                const planeIndex = planeY * component.width + planeX;
                spatialPlane[planeIndex] = blockPixel;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Upsample chroma components to match luma resolution.
   * @param {Uint8Array[]} spatialPlanes - Spatial plane buffers (modified in-place)
   */
  upsampleComponents(spatialPlanes) {
    if (this.components.length === 1) {
      // Grayscale - no upsampling needed
      return;
    }

    // Find maximum sampling factors (luma component)
    let maxHorizontalSampling = 1;
    let maxVerticalSampling = 1;

    for (const component of this.components) {
      maxHorizontalSampling = Math.max(maxHorizontalSampling, component.horizontalSampling);
      maxVerticalSampling = Math.max(maxVerticalSampling, component.verticalSampling);
    }

    // Upsample each component to match maximum resolution
    for (let compIndex = 0; compIndex < this.components.length; compIndex++) {
      const component = this.components[compIndex];

      if (
        component.horizontalSampling === maxHorizontalSampling &&
        component.verticalSampling === maxVerticalSampling
      ) {
        // Already at maximum resolution
        continue;
      }

      // Calculate target dimensions (upsample to match maximum resolution)
      const targetWidth = Math.ceil((component.width * maxHorizontalSampling) / component.horizontalSampling);
      const targetHeight = Math.ceil((component.height * maxVerticalSampling) / component.verticalSampling);

      // Upsample the plane using quality-based selection
      const quality = this.options.upsampleQuality || UPSAMPLE_QUALITY.FAST;
      const upsampledPlane = upsamplePlaneQuality(
        spatialPlanes[compIndex],
        component.width,
        component.height,
        targetWidth,
        targetHeight,
        quality
      );

      // Update component dimensions and replace plane
      component.width = targetWidth;
      component.height = targetHeight;
      spatialPlanes[compIndex] = upsampledPlane;
    }
  }

  /**
   * Convert color space and assemble final RGBA image.
   * @param {Uint8Array[]} spatialPlanes - Spatial plane buffers
   * @returns {Uint8Array} Final RGBA image buffer
   */
  assembleRGBAImage(spatialPlanes) {
    const rgbaBuffer = new Uint8Array(this.width * this.height * 4);

    if (this.components.length === 1) {
      // Grayscale image
      grayscaleToRgb(spatialPlanes[0], this.width, this.height, rgbaBuffer);
    } else if (this.components.length === 3) {
      // YCbCr color image (most common)
      ycbcrToRgb(spatialPlanes[0], spatialPlanes[1], spatialPlanes[2], this.width, this.height, rgbaBuffer);
    } else {
      throw new Error(`Unsupported number of components: ${this.components.length}`);
    }

    return rgbaBuffer;
  }
}

/**
 * Zigzag to natural order mapping (JPEG standard).
 * Maps zig-zag serialized index to natural (row,col) order index.
 */
JPEGDecoder.prototype.zigzagToNatural = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28,
  35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47,
  55, 62, 63,
];

/**
 * Main JPEG decode function.
 *
 * @param {ArrayBuffer|Uint8Array} buffer - JPEG data
 * @param {Object} options - Decode options
 * @returns {Promise<Object>} Decoded image
 */
export async function decodeJPEG(buffer, options = {}) {
  const decoder = new JPEGDecoder(options);
  return decoder.decode(buffer);
}
