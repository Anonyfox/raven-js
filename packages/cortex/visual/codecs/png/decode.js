/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file PNG decoder - Pure function to decode PNG buffer to RGBA pixels.
 *
 * Extracts PNG decoding logic from PNGImage class into a pure function
 * that takes a PNG buffer and returns pixel data, dimensions, and metadata.
 */

import { decodeIHDR } from "./decode-ihdr.js";
import { decompressIDAT } from "./decompress-idat.js";
import { extractMetadata } from "./extract-metadata.js";
import { findChunksByType, parseChunks } from "./parse-chunks.js";
import { reconstructPixels } from "./reconstruct-pixels.js";
import { reverseFilters } from "./reverse-filters.js";
import { validatePNGSignature } from "./validate-signature.js";

/**
 * Decode PNG buffer to RGBA pixel data.
 *
 * @param {ArrayBuffer|Uint8Array} buffer - PNG file buffer
 * @returns {Promise<{pixels: Uint8Array, width: number, height: number, metadata: Object}>} Decoded image data
 * @throws {Error} If PNG decoding fails
 *
 * @example
 * const pngBuffer = readFileSync('image.png');
 * const { pixels, width, height, metadata } = await decodePNG(pngBuffer);
 * console.log(`Decoded ${width}×${height} PNG with ${pixels.length} RGBA bytes`);
 */
export async function decodePNG(buffer) {
  // Convert to Uint8Array if needed
  const rawData = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

  try {
    // Step 1: Validate PNG signature
    if (!validatePNGSignature(rawData)) {
      throw new Error("Invalid PNG signature");
    }

    // Step 2: Parse PNG chunks
    const chunkData = rawData.slice(8); // Skip 8-byte signature
    const chunks = parseChunks(chunkData);

    // Step 3: Decode IHDR chunk (must be first)
    const ihdrChunks = findChunksByType(chunks, "IHDR");
    if (ihdrChunks.length !== 1) {
      throw new Error(`Expected exactly 1 IHDR chunk, found ${ihdrChunks.length}`);
    }
    const ihdr = decodeIHDR(/** @type {any} */ (ihdrChunks[0]).data);

    // Step 4: Decompress IDAT chunks
    const idatChunks = findChunksByType(chunks, "IDAT");
    if (idatChunks.length === 0) {
      throw new Error("No IDAT chunks found");
    }
    const idatData = idatChunks.map((chunk) => /** @type {any} */ (chunk).data);
    const compressedData = await decompressIDAT(idatData);

    // Step 5: Reverse PNG scanline filters
    const unfilteredData = reverseFilters(compressedData, ihdr.width, ihdr.height, ihdr.bytesPerPixel);

    // Step 6: Reconstruct RGBA pixels
    const pixels = reconstructPixels(unfilteredData, ihdr);

    // Step 7: Extract metadata
    const metadata = await extractMetadata(chunks);

    console.log(`✓ Successfully decoded PNG: ${ihdr.width}×${ihdr.height}, ${ihdr.channels} channels`);
    console.log(`  - Bit depth: ${ihdr.bitDepth}, Color type: ${ihdr.colorType}`);
    console.log(`  - Unfiltered data: ${unfilteredData.length} bytes`);
    console.log(`  - Reconstructed pixels: ${pixels.length} bytes (${pixels.length / 4} RGBA pixels)`);
    console.log(`  - Metadata: ${Object.keys(/** @type {any} */ (metadata).text || {}).length} text entries`);

    return {
      pixels,
      width: ihdr.width,
      height: ihdr.height,
      metadata,
    };
  } catch (error) {
    throw new Error(`PNG decoding failed: ${error.message}`);
  }
}
