// @ts-nocheck
/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file IDAT chunk creation with DEFLATE compression for PNG encoding.
 *
 * PNG uses DEFLATE compression (RFC 1951) wrapped in zlib format (RFC 1950)
 * to compress the filtered scanline data. This module provides cross-platform
 * DEFLATE compression using native APIs when available.
 *
 * Compression process:
 * 1. Apply scanline filters to raw pixel data
 * 2. Compress filtered data using DEFLATE algorithm
 * 3. Wrap compressed data in zlib format (header + data + checksum)
 * 4. Split into IDAT chunks if needed (max 2GB per chunk)
 *
 * @example
 * // Compress filtered pixel data
 * const filteredData = applyFilters(pixels, width, height, bytesPerPixel);
 * const idatChunks = await createIDATChunks(filteredData);
 * console.log(`Created ${idatChunks.length} IDAT chunks`);
 */

/**
 * Compresses data using DEFLATE algorithm with cross-platform support.
 *
 * @param {Uint8Array} data - Data to compress
 * @param {number} [level=6] - Compression level (0-9, where 9 is maximum compression)
 * @returns {Promise<Uint8Array>} Compressed data in zlib format
 */
export async function compressWithDEFLATE(data, level = 6) {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("data must be a Uint8Array");
  }
  if (!Number.isInteger(level) || level < 0 || level > 9) {
    throw new Error("level must be an integer between 0 and 9");
  }

  // Try browser CompressionStream first
  if (typeof CompressionStream !== "undefined") {
    return compressWithCompressionStream(data, level);
  }

  // Fall back to Node.js zlib
  if (typeof window === "undefined") {
    return compressWithNodeZlib(data, level);
  }

  throw new Error("No DEFLATE compression available in this environment");
}

/**
 * Compresses data using browser CompressionStream API.
 *
 * @param {Uint8Array} data - Data to compress
 * @param {number} _level - Compression level (ignored by CompressionStream)
 * @returns {Promise<Uint8Array>} Compressed data in zlib format
 */
async function compressWithCompressionStream(data, _level) {
  const stream = new CompressionStream("deflate");
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  // Write data to compression stream
  await writer.write(data);
  await writer.close();

  // Read compressed chunks
  const chunks = [];
  let result = await reader.read();
  while (!result.done) {
    chunks.push(result.value);
    result = await reader.read();
  }

  // Combine chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const compressed = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    compressed.set(chunk, offset);
    offset += chunk.length;
  }

  return compressed;
}

/**
 * Compresses data using Node.js zlib module.
 *
 * @param {Uint8Array} data - Data to compress
 * @param {number} level - Compression level
 * @returns {Promise<Uint8Array>} Compressed data in zlib format
 */
async function compressWithNodeZlib(data, level) {
  const { deflateSync } = await import("node:zlib");

  const options = {
    level,
    windowBits: 15, // Standard zlib window size
    memLevel: 8, // Default memory usage
    strategy: 0, // Default strategy
  };

  const compressed = deflateSync(data, options);
  return new Uint8Array(compressed);
}

/**
 * Creates IDAT chunks from compressed data.
 *
 * @param {Uint8Array} compressedData - DEFLATE-compressed data
 * @param {number} [maxChunkSize=65536] - Maximum size per IDAT chunk (default 64KB)
 * @returns {Array<Uint8Array>} Array of IDAT chunk data (without chunk headers)
 */
export function createIDATChunks(compressedData, maxChunkSize = 65536) {
  if (!(compressedData instanceof Uint8Array)) {
    throw new TypeError("compressedData must be a Uint8Array");
  }
  if (!Number.isInteger(maxChunkSize) || maxChunkSize < 1 || maxChunkSize > 0x7fffffff) {
    throw new Error("maxChunkSize must be a positive integer <= 2147483647");
  }

  // Handle empty data - still need at least one IDAT chunk (even if empty)
  if (compressedData.length === 0) {
    return [new Uint8Array(0)];
  }

  const chunks = [];
  let offset = 0;

  while (offset < compressedData.length) {
    const chunkSize = Math.min(maxChunkSize, compressedData.length - offset);
    const chunk = compressedData.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }

  return chunks;
}

/**
 * Compresses filtered pixel data and creates IDAT chunks.
 *
 * @param {Uint8Array} filteredData - Filtered scanline data with filter bytes
 * @param {Object} [options] - Compression options
 * @param {number} [options.level=6] - Compression level (0-9)
 * @param {number} [options.maxChunkSize=65536] - Maximum IDAT chunk size
 * @returns {Promise<Array<Uint8Array>>} Array of IDAT chunk data
 */
export async function compressToIDATChunks(filteredData, options = {}) {
  const { level = 6, maxChunkSize = 65536 } = options;

  if (!(filteredData instanceof Uint8Array)) {
    throw new TypeError("filteredData must be a Uint8Array");
  }

  // Compress the filtered data
  const compressedData = await compressWithDEFLATE(filteredData, level);

  // Split into IDAT chunks
  return createIDATChunks(compressedData, maxChunkSize);
}

/**
 * Estimates compression ratio for given data.
 *
 * @param {Uint8Array} data - Data to analyze
 * @returns {Promise<{originalSize: number, compressedSize: number, ratio: number}>} Compression statistics
 */
export async function estimateCompressionRatio(data) {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("data must be a Uint8Array");
  }

  const originalSize = data.length;

  if (originalSize === 0) {
    return { originalSize: 0, compressedSize: 0, ratio: 0 };
  }

  const compressed = await compressWithDEFLATE(data, 6);
  const compressedSize = compressed.length;
  const ratio = compressedSize / originalSize;

  return {
    originalSize,
    compressedSize,
    ratio,
  };
}

/**
 * Validates DEFLATE-compressed data format.
 *
 * @param {Uint8Array} data - Compressed data to validate
 * @returns {boolean} True if data appears to be valid zlib format
 */
export function validateCompressedData(data) {
  if (!(data instanceof Uint8Array) || data.length < 6) {
    return false; // Too short for zlib format
  }

  // Check zlib header (RFC 1950)
  const cmf = data[0]; // Compression Method and Flags
  const flg = data[1]; // Flags

  // Compression method should be 8 (DEFLATE)
  const cm = cmf & 0x0f;
  if (cm !== 8) {
    return false;
  }

  // Compression info should be <= 7 for DEFLATE
  const cinfo = (cmf >> 4) & 0x0f;
  if (cinfo > 7) {
    return false;
  }

  // Check that (CMF * 256 + FLG) is divisible by 31
  const checksum = (cmf * 256 + flg) % 31;
  if (checksum !== 0) {
    return false;
  }

  // Check for preset dictionary flag (not used in PNG)
  const fdict = (flg >> 5) & 1;
  if (fdict !== 0) {
    return false;
  }

  return true;
}

/**
 * Gets compression statistics for different levels.
 *
 * @param {Uint8Array} data - Data to test compression on
 * @returns {Promise<Array<{level: number, size: number, time: number}>>} Compression statistics
 */
export async function benchmarkCompressionLevels(data) {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("data must be a Uint8Array");
  }

  const results = [];

  for (let level = 0; level <= 9; level++) {
    const startTime = performance.now();
    const compressed = await compressWithDEFLATE(data, level);
    const endTime = performance.now();

    results.push({
      level,
      size: compressed.length,
      time: endTime - startTime,
    });
  }

  return results;
}

/**
 * Optimizes compression settings for given data.
 *
 * @param {Uint8Array} data - Sample data to optimize for
 * @param {Object} [options] - Optimization options
 * @param {number} [options.targetRatio=0.5] - Target compression ratio
 * @param {number} [options.maxTime=100] - Maximum acceptable compression time (ms)
 * @returns {Promise<{level: number, expectedSize: number, expectedTime: number}>} Optimal settings
 */
export async function optimizeCompressionSettings(data, options = {}) {
  const { targetRatio = 0.5, maxTime = 100 } = options;

  if (!(data instanceof Uint8Array)) {
    throw new TypeError("data must be a Uint8Array");
  }

  const benchmark = await benchmarkCompressionLevels(data);
  const originalSize = data.length;

  // Find best level that meets constraints
  let bestLevel = 6; // Default
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const result of benchmark) {
    const ratio = result.size / originalSize;
    const timeOk = result.time <= maxTime;
    const ratioOk = ratio <= targetRatio;

    // Score based on compression ratio and time
    const compressionScore = (1 - ratio) * 100; // Higher is better
    const timeScore = timeOk ? 50 : Math.max(0, 50 - (result.time - maxTime)); // Penalty for slow
    const totalScore = compressionScore + timeScore;

    if ((ratioOk || ratio < targetRatio * 1.1) && totalScore > bestScore) {
      bestScore = totalScore;
      bestLevel = result.level;
    }
  }

  const bestResult = benchmark[bestLevel];
  return {
    level: bestLevel,
    expectedSize: bestResult.size,
    expectedTime: bestResult.time,
  };
}
