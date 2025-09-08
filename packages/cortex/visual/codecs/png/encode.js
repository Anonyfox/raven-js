/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file PNG encoder - Pure function to encode RGBA pixels to PNG buffer.
 *
 * Extracts PNG encoding logic from PNGImage class into a pure function
 * that takes RGBA pixel data, dimensions, and options, and returns a PNG buffer.
 */

import { applyFilters } from "./apply-filters.js";
import { compressToIDATChunks } from "./compress-idat.js";
import { createIHDRFromImageInfo } from "./encode-ihdr.js";
import { encodeMetadataChunks } from "./encode-metadata.js";
import { writePNGFile } from "./write-chunks.js";

/**
 * Encode RGBA pixel data to PNG buffer.
 *
 * @param {Uint8Array} pixels - RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {Object} [options] - PNG encoding options
 * @param {number} [options.compressionLevel=6] - DEFLATE compression level (0-9)
 * @param {number|'optimal'} [options.filterStrategy='optimal'] - Filter strategy
 * @param {number} [options.maxChunkSize=65536] - Maximum IDAT chunk size
 * @param {Object} [options.metadata={}] - Metadata to embed in PNG
 * @returns {Promise<Uint8Array>} PNG encoded buffer
 * @throws {Error} If PNG encoding fails
 *
 * @example
 * const pixels = new Uint8Array(width * height * 4); // RGBA data
 * const pngBuffer = await encodePNG(pixels, width, height, { compressionLevel: 9 });
 * writeFileSync('output.png', pngBuffer);
 */
export async function encodePNG(pixels, width, height, options = {}) {
  const { compressionLevel = 6, filterStrategy = "optimal", maxChunkSize = 65536, metadata = {} } = options;

  // Validate input parameters
  if (!pixels || pixels.length === 0) {
    throw new Error("No pixel data provided for encoding");
  }

  if (!Number.isInteger(width) || width <= 0) {
    throw new Error(`Invalid width: ${width} (must be positive integer)`);
  }

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`Invalid height: ${height} (must be positive integer)`);
  }

  const expectedPixelCount = width * height * 4; // RGBA = 4 bytes per pixel
  if (pixels.length !== expectedPixelCount) {
    throw new Error(
      `Pixel data length mismatch: expected ${expectedPixelCount} bytes for ${width}×${height} RGBA, got ${pixels.length}`
    );
  }

  try {
    // Step 1: Create IHDR chunk for RGBA format
    const actualChannels = 4; // Always RGBA
    const actualColorType = 6; // 6 = RGBA
    const actualBitDepth = 8; // Always 8-bit per channel

    const ihdrData = createIHDRFromImageInfo({
      width,
      height,
      bitDepth: actualBitDepth,
      colorType: actualColorType,
      interlaceMethod: 0, // No interlacing
    });

    // Step 2: Apply scanline filters
    const bytesPerPixel = actualChannels;
    const filteredData = applyFilters(pixels, width, height, bytesPerPixel, filterStrategy);

    // Step 3: Compress filtered data into IDAT chunks
    const idatChunkData = await compressToIDATChunks(filteredData, {
      level: compressionLevel,
      maxChunkSize,
    });

    // Step 4: Encode metadata chunks
    const metadataChunks = await encodeMetadataChunks(metadata);

    // Step 5: Create PNG chunks
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

    // Step 6: Write complete PNG file
    const pngBuffer = writePNGFile(chunks);

    console.log(`✓ Successfully encoded PNG: ${width}×${height}`);
    console.log(`  - Compression level: ${compressionLevel}`);
    console.log(`  - Filter strategy: ${filterStrategy}`);
    console.log(`  - IDAT chunks: ${idatChunkData.length}`);
    console.log(`  - Output size: ${pngBuffer.length} bytes`);

    return pngBuffer;
  } catch (error) {
    throw new Error(`PNG encoding failed: ${error.message}`);
  }
}
