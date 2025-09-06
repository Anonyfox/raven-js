// @ts-nocheck
/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file PNG format implementation extending base Image class.
 *
 * Handles PNG-specific decoding, encoding, and metadata operations using
 * pure JavaScript DEFLATE decompression and chunk parsing. Supports all
 * PNG color types, bit depths, and ancillary chunks including text metadata.
 */

import { Image } from "../image-base.js";
import { decodeIHDR } from "./decode-ihdr.js";
import { decompressIDAT } from "./decompress-idat.js";
import { extractMetadata } from "./extract-metadata.js";
import { findChunksByType, parseChunks } from "./parse-chunks.js";
import { reconstructPixels } from "./reconstruct-pixels.js";
import { reverseFilters } from "./reverse-filters.js";
import { validatePNGSignature } from "./validate-signature.js";

/**
 * PNG format image implementation.
 *
 * Extends base Image class with PNG-specific functionality including
 * DEFLATE decompression, chunk parsing, and PNG metadata handling.
 * Supports all standard PNG features without external dependencies.
 */
export class PNGImage extends Image {
  // Private fields
  #decodePromise;

  /**
   * Creates PNG image instance from buffer.
   *
   * @param {ArrayBuffer|Uint8Array} buffer - PNG image data
   * @param {string} mimeType - MIME type (should be 'image/png')
   */
  constructor(buffer, mimeType) {
    super(buffer, mimeType);
    /** @type {Array<Object>} */
    this.chunks = [];
    this.colorType = 0;
    this.bitDepth = 8;
    this.compressionMethod = 0;
    this.filterMethod = 0;
    this.interlaceMethod = 0;
    /** @type {Object|null} */
    this.metadata = null;

    // Initialize with stub values for immediate access
    this._width = 0;
    this._height = 0;
    this.pixels = new Uint8Array(0);

    // Start decoding asynchronously (don't await to keep constructor sync)
    this.#decodePromise = this.#decode().catch((error) => {
      console.warn(`PNG decoding failed: ${error.message}`);
      // Keep stub values on decode failure
    });
  }

  /**
   * Waits for PNG decoding to complete.
   *
   * @returns {Promise<void>} Promise that resolves when decoding is complete
   */
  async waitForDecode() {
    await this.#decodePromise;
  }

  /**
   * Decode PNG data into internal pixel representation.
   */
  async #decode() {
    try {
      // Step 1: Validate PNG signature
      if (!validatePNGSignature(this.rawData)) {
        throw new Error("Invalid PNG signature");
      }

      // Step 2: Parse PNG chunks
      const chunkData = this.rawData.slice(8); // Skip 8-byte signature
      const chunks = parseChunks(chunkData);
      this.chunks = chunks;

      // Step 3: Decode IHDR chunk (must be first)
      const ihdrChunks = findChunksByType(chunks, "IHDR");
      if (ihdrChunks.length !== 1) {
        throw new Error(`Expected exactly 1 IHDR chunk, found ${ihdrChunks.length}`);
      }
      const ihdr = decodeIHDR(ihdrChunks[0].data);

      // Step 4: Decompress IDAT chunks
      const idatChunks = findChunksByType(chunks, "IDAT");
      if (idatChunks.length === 0) {
        throw new Error("No IDAT chunks found");
      }
      const idatData = idatChunks.map((chunk) => chunk.data);
      const compressedData = await decompressIDAT(idatData);

      // Step 5: Reverse PNG scanline filters
      const unfilteredData = reverseFilters(compressedData, ihdr.width, ihdr.height, ihdr.bytesPerPixel);

      // Step 6: Reconstruct pixels
      const reconstructedPixels = reconstructPixels(unfilteredData, ihdr);

      // Set image properties
      this._width = ihdr.width;
      this._height = ihdr.height;
      this._channels = ihdr.channels;
      this.bitDepth = ihdr.bitDepth;
      this.colorType = ihdr.colorType;
      this.compressionMethod = ihdr.compressionMethod;
      this.filterMethod = ihdr.filterMethod;
      this.interlaceMethod = ihdr.interlaceMethod;

      // Store reconstructed RGBA pixel data
      this.pixels = reconstructedPixels;

      // Step 7: Extract metadata
      const metadata = await extractMetadata(chunks);
      this.metadata = metadata;

      console.log(`✓ Successfully decoded PNG: ${this._width}×${this._height}, ${this.channels} channels`);
      console.log(`  - Bit depth: ${this.bitDepth}, Color type: ${this.colorType}`);
      console.log(`  - Unfiltered data: ${unfilteredData.length} bytes`);
      console.log(
        `  - Reconstructed pixels: ${reconstructedPixels.length} bytes (${reconstructedPixels.length / 4} RGBA pixels)`
      );
      console.log(`  - Metadata: ${Object.keys(metadata.text || {}).length} text entries`);
    } catch (error) {
      throw new Error(`PNG decoding failed: ${error.message}`);
    }
  }

  /**
   * Encode current pixel data as PNG buffer.
   *
   * @param {Object} [options] - PNG encoding options
   * @param {number} [options.compressionLevel=6] - DEFLATE compression level (0-9)
   * @param {number|'optimal'} [options.filterStrategy='optimal'] - Filter strategy
   * @param {number} [options.maxChunkSize=65536] - Maximum IDAT chunk size
   * @returns {Promise<Uint8Array>} PNG encoded buffer
   */
  async #encodePNG(options = {}) {
    const { compressionLevel = 6, filterStrategy = "optimal", maxChunkSize = 65536 } = options;

    // Validate that we have pixel data to encode
    if (!this.pixels || this.pixels.length === 0) {
      throw new Error("No pixel data available for encoding");
    }

    // Import encoding modules
    const { createIHDRFromImageInfo } = await import("./encode-ihdr.js");
    const { applyFilters } = await import("./apply-filters.js");
    const { compressToIDATChunks } = await import("./compress-idat.js");
    const { writePNGFile } = await import("./write-chunks.js");
    const { encodeMetadataChunks } = await import("./encode-metadata.js");

    try {
      // Step 1: Create IHDR chunk
      const ihdrData = createIHDRFromImageInfo({
        width: this.width,
        height: this.height,
        bitDepth: this.bitDepth,
        colorType: this.colorType,
        interlaceMethod: this.interlaceMethod || 0,
      });

      // Step 2: Convert RGBA pixels back to raw format for filtering
      // Note: This assumes pixels are in RGBA format, may need conversion for other formats
      const bytesPerPixel = this.channels;
      const rawPixelData = this.pixels;

      // Step 3: Apply scanline filters
      const filteredData = applyFilters(rawPixelData, this.width, this.height, bytesPerPixel, filterStrategy);

      // Step 4: Compress filtered data into IDAT chunks
      const idatChunkData = await compressToIDATChunks(filteredData, {
        level: compressionLevel,
        maxChunkSize,
      });

      // Step 5: Encode metadata chunks
      const metadataChunks = await encodeMetadataChunks(this.metadata || {});

      // Step 6: Create PNG chunks
      const chunks = [];

      // Add IHDR chunk (must be first)
      chunks.push({ type: "IHDR", data: ihdrData });

      // Add metadata chunks before IDAT
      chunks.push(...metadataChunks);

      // Add IDAT chunks
      for (const idatData of idatChunkData) {
        chunks.push({ type: "IDAT", data: idatData });
      }

      // Add IEND chunk (must be last)
      chunks.push({ type: "IEND", data: new Uint8Array(0) });

      // Step 7: Write complete PNG file
      const pngBuffer = writePNGFile(chunks);

      console.log(`✓ Successfully encoded PNG: ${this.width}×${this.height}`);
      console.log(`  - Compression level: ${compressionLevel}`);
      console.log(`  - Filter strategy: ${filterStrategy}`);
      console.log(`  - IDAT chunks: ${idatChunkData.length}`);
      console.log(`  - Output size: ${pngBuffer.length} bytes`);

      return pngBuffer;
    } catch (error) {
      throw new Error(`PNG encoding failed: ${error.message}`);
    }
  }

  /**
   * Extract PNG-specific metadata from chunks.
   *
   * @returns {Object} PNG metadata including tEXt, iTXt, zTXt chunks
   */
  getMetadata() {
    // Return decoded metadata if available, otherwise return basic info
    const baseMetadata = {
      format: "PNG",
      colorType: this.colorType,
      bitDepth: this.bitDepth,
      interlaced: this.interlaceMethod === 1,
    };

    if (this.metadata) {
      return {
        ...baseMetadata,
        ...this.metadata,
      };
    }

    return {
      ...baseMetadata,
      text: {},
      time: null,
      physicalDimensions: null,
      gamma: null,
      chromaticity: null,
      colorSpace: null,
      iccProfile: null,
      timestamp: null, // Legacy property name for compatibility
    };
  }

  /**
   * Encode image to buffer in specified format.
   *
   * @param {string} targetMimeType - Target MIME type
   * @param {Object} options - Format-specific encoding options
   * @returns {Uint8Array} Encoded image buffer
   */
  async toBuffer(targetMimeType = this.originalMimeType, options = {}) {
    if (targetMimeType === "image/png") {
      return await this.#encodePNG(/** @type {Object} */ (options));
    }

    // Stub: would delegate to other format encoders
    return super.toBuffer(targetMimeType, options);
  }
}
