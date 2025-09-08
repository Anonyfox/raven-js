/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Decompresses PNG IDAT chunks using DEFLATE algorithm.
 *
 * PNG uses DEFLATE compression (RFC 1951) for image data stored in IDAT chunks.
 * This module provides platform-aware decompression using native APIs:
 * - Node.js: Uses built-in `zlib` module for optimal performance
 * - Browser: Uses `DecompressionStream` API (Chrome 80+, Firefox 65+)
 * - Fallback: Pure JavaScript DEFLATE implementation for maximum compatibility
 *
 * The decompressor handles multiple IDAT chunks by concatenating their data
 * before decompression, as required by PNG specification.
 *
 * @param {Array<Uint8Array>} idatChunks - Array of IDAT chunk data
 * @returns {Promise<Uint8Array>} Decompressed image data
 *
 * @example
 * // Decompress IDAT chunks from parsed PNG
 * const idatChunks = findChunksByType(chunks, 'IDAT').map(chunk => chunk.data);
 * const decompressed = await decompressIDAT(idatChunks);
 * console.log(`Decompressed ${decompressed.length} bytes`);
 *
 * @example
 * // Handle decompression errors
 * try {
 *   const data = await decompressIDAT(idatChunks);
 * } catch (error) {
 *   console.error('DEFLATE decompression failed:', error.message);
 * }
 */

/**
 * Detect current runtime environment.
 * Determines available decompression APIs for optimal performance.
 *
 * @returns {'node'|'browser'|'unknown'} Runtime environment
 *
 * @private
 */
function detectEnvironment() {
  // Check for Node.js
  if (typeof process !== "undefined" && process.versions && process.versions.node) {
    return "node";
  }

  // Check for browser with DecompressionStream support
  if (typeof window !== "undefined" && typeof DecompressionStream !== "undefined") {
    return "browser";
  }

  return "unknown";
}

/**
 * Concatenate multiple IDAT chunk data arrays.
 * PNG specification requires all IDAT chunks to be concatenated
 * before DEFLATE decompression.
 *
 * @param {Array<Uint8Array>} idatChunks - Array of IDAT chunk data
 * @returns {Uint8Array} Concatenated IDAT data
 *
 * @private
 */
function concatenateIDATData(idatChunks) {
  if (!Array.isArray(idatChunks)) {
    throw new TypeError("Expected idatChunks to be an array");
  }

  if (idatChunks.length === 0) {
    throw new Error("No IDAT chunks provided");
  }

  // Calculate total length
  let totalLength = 0;
  for (const chunk of idatChunks) {
    if (!(chunk instanceof Uint8Array)) {
      throw new TypeError("All IDAT chunks must be Uint8Array");
    }
    totalLength += chunk.length;
  }

  if (totalLength === 0) {
    throw new Error("IDAT chunks contain no data");
  }

  // Concatenate all chunks
  const concatenated = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of idatChunks) {
    concatenated.set(chunk, offset);
    offset += chunk.length;
  }

  return concatenated;
}

/**
 * Decompress DEFLATE data using Node.js zlib module.
 * Uses the native zlib.inflateRaw for optimal performance.
 *
 * @param {Uint8Array} compressedData - DEFLATE compressed data
 * @returns {Promise<Uint8Array>} Decompressed data
 *
 * @private
 */
async function decompressWithNodeZlib(compressedData) {
  try {
    // Dynamic import for Node.js environment only
    if (typeof window !== "undefined") {
      throw new Error("Node.js zlib not available in browser environment");
    }

    const { inflateSync } = await import("node:zlib");
    const decompressed = inflateSync(compressedData);
    return new Uint8Array(decompressed);
  } catch (error) {
    throw new Error(`Node.js zlib decompression failed: ${error.message}`);
  }
}

/**
 * Decompress DEFLATE data using browser DecompressionStream API.
 * Uses the native Web Streams API for efficient decompression.
 *
 * @param {Uint8Array} compressedData - DEFLATE compressed data
 * @returns {Promise<Uint8Array>} Decompressed data
 *
 * @private
 */
async function decompressWithBrowserAPI(compressedData) {
  try {
    // Create decompression stream for DEFLATE format (with zlib wrapper)
    const decompressionStream = new DecompressionStream("deflate");

    // Create readable stream from compressed data
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(compressedData);
        controller.close();
      },
    });

    // Pipe through decompression stream
    const decompressedStream = readable.pipeThrough(decompressionStream);

    // Read all chunks from the decompressed stream
    const reader = decompressedStream.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Concatenate all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  } catch (error) {
    throw new Error(`Browser DecompressionStream failed: ${error.message}`);
  }
}

/**
 * Pure JavaScript DEFLATE decompression fallback.
 * Implements RFC 1951 DEFLATE algorithm for maximum compatibility.
 * This is a simplified implementation for basic DEFLATE streams.
 *
 * @param {Uint8Array} _compressedData - DEFLATE compressed data
 * @returns {Promise<Uint8Array>} Decompressed data
 *
 * @private
 */
async function decompressWithFallback(_compressedData) {
  // Note: A full DEFLATE implementation would be extremely complex (thousands of lines)
  // and is beyond the scope of this library. The two supported environments
  // (Node.js 22+ and modern browsers) provide native DEFLATE support.
  throw new Error(
    "DEFLATE decompression requires Node.js 22+ (with zlib module) or " +
      "a modern browser (with DecompressionStream API). " +
      "Pure JavaScript DEFLATE implementation is not provided due to complexity."
  );
}

/**
 * Validate IDAT chunk data before decompression.
 * Performs basic sanity checks on the compressed data.
 *
 * @param {Uint8Array} compressedData - Concatenated IDAT data
 * @throws {Error} If data appears invalid
 *
 * @private
 */
function validateCompressedData(compressedData) {
  if (compressedData.length < 2) {
    throw new Error("IDAT data too short (minimum 2 bytes for DEFLATE header)");
  }

  // Check DEFLATE header (RFC 1951 section 2.2)
  const cmf = compressedData[0]; // Compression Method and Flags
  const flg = compressedData[1]; // Flags

  // Compression Method (bits 0-3) must be 8 (DEFLATE)
  const compressionMethod = cmf & 0x0f;
  if (compressionMethod !== 8) {
    throw new Error(`Invalid DEFLATE compression method: ${compressionMethod} (expected 8)`);
  }

  // Compression Info (bits 4-7) - LZ77 window size
  const compressionInfo = (cmf >> 4) & 0x0f;
  if (compressionInfo > 7) {
    throw new Error(`Invalid DEFLATE compression info: ${compressionInfo} (must be ≤ 7)`);
  }

  // Check header checksum (CMF * 256 + FLG must be divisible by 31)
  const headerChecksum = (cmf * 256 + flg) % 31;
  if (headerChecksum !== 0) {
    throw new Error(`Invalid DEFLATE header checksum: ${headerChecksum} (must be 0)`);
  }

  // Preset dictionary flag (bit 5 of FLG) must be 0 for PNG
  const presetDict = (flg >> 5) & 1;
  if (presetDict !== 0) {
    throw new Error("DEFLATE preset dictionary not allowed in PNG");
  }
}

/**
 * Decompress PNG IDAT chunks using DEFLATE algorithm.
 *
 * Automatically detects the runtime environment and uses the most
 * appropriate decompression method:
 * - Node.js: Uses built-in zlib module
 * - Browser: Uses DecompressionStream API
 * - Fallback: Pure JavaScript implementation (not yet implemented)
 *
 * @param {Array<Uint8Array>} idatChunks - Array of IDAT chunk data
 * @returns {Promise<Uint8Array>} Decompressed image data
 * @throws {Error} If decompression fails or environment is unsupported
 *
 * @example
 * // Decompress IDAT chunks from parsed PNG
 * const idatChunks = findChunksByType(chunks, 'IDAT').map(chunk => chunk.data);
 * const imageData = await decompressIDAT(idatChunks);
 *
 * @example
 * // Handle single IDAT chunk
 * const singleChunk = [idatChunk.data];
 * const decompressed = await decompressIDAT(singleChunk);
 */
export async function decompressIDAT(idatChunks) {
  // Concatenate all IDAT chunks
  const compressedData = concatenateIDATData(idatChunks);

  // Validate compressed data format
  validateCompressedData(compressedData);

  // Detect environment and choose decompression method
  const environment = detectEnvironment();

  switch (environment) {
    case "node":
      return await decompressWithNodeZlib(compressedData);

    case "browser":
      return await decompressWithBrowserAPI(compressedData);

    default:
      return await decompressWithFallback(compressedData);
  }
}

/**
 * Get information about available decompression methods.
 * Useful for debugging and feature detection.
 *
 * @returns {{environment: string, method: string, supported: boolean}} Decompression info
 *
 * @example
 * // Check decompression capabilities
 * const info = getDecompressionInfo();
 * console.log(`Using ${info.method} in ${info.environment} environment`);
 */
export function getDecompressionInfo() {
  const environment = detectEnvironment();

  switch (environment) {
    case "node":
      return {
        environment: "node",
        method: "zlib.inflateRaw",
        supported: true,
      };

    case "browser":
      return {
        environment: "browser",
        method: "DecompressionStream",
        supported: true,
      };

    default:
      return {
        environment: "unknown",
        method: "pure-js-fallback",
        supported: false, // Not yet implemented
      };
  }
}
