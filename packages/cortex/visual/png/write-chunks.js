// @ts-nocheck
/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file PNG chunk writing with CRC32 calculation.
 *
 * PNG files consist of chunks with the following format:
 * - Length: 4 bytes (big-endian) - length of data field
 * - Type: 4 bytes (ASCII) - chunk type code
 * - Data: variable length - chunk data
 * - CRC: 4 bytes (big-endian) - CRC32 of type and data fields
 *
 * This module provides functions to create properly formatted PNG chunks
 * with correct CRC32 checksums for data integrity.
 *
 * @example
 * // Create IHDR chunk
 * const ihdrData = new Uint8Array([...]);
 * const ihdrChunk = writeChunk('IHDR', ihdrData);
 * console.log(`IHDR chunk: ${ihdrChunk.length} bytes`);
 *
 * @example
 * // Create complete PNG file
 * const chunks = [
 *   writeChunk('IHDR', ihdrData),
 *   writeChunk('IDAT', idatData),
 *   writeChunk('IEND', new Uint8Array(0))
 * ];
 * const pngFile = writePNGFile(chunks);
 */

/**
 * CRC32 lookup table for fast calculation.
 * Pre-computed using the standard PNG CRC32 polynomial: 0xEDB88320
 */
const CRC32_TABLE = new Uint32Array(256);

// Initialize CRC32 lookup table
for (let i = 0; i < 256; i++) {
  let crc = i;
  for (let j = 0; j < 8; j++) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  CRC32_TABLE[i] = crc;
}

/**
 * Calculates CRC32 checksum for PNG chunk.
 *
 * @param {Uint8Array} data - Data to calculate CRC for
 * @returns {number} CRC32 checksum (32-bit unsigned integer)
 */
export function calculateCRC32(data) {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("data must be a Uint8Array");
  }

  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i++) {
    const tableIndex = (crc ^ data[i]) & 0xff;
    crc = CRC32_TABLE[tableIndex] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0; // Ensure unsigned 32-bit result
}

/**
 * Writes a PNG chunk with proper format and CRC32.
 *
 * @param {string} type - 4-character chunk type (e.g., 'IHDR', 'IDAT', 'IEND')
 * @param {Uint8Array} data - Chunk data
 * @returns {Uint8Array} Complete PNG chunk (length + type + data + CRC)
 */
export function writeChunk(type, data) {
  // Parameter validation
  if (typeof type !== "string" || type.length !== 4) {
    throw new Error(`Invalid chunk type: "${type}" (must be 4-character string)`);
  }
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("data must be a Uint8Array");
  }
  if (data.length > 0x7fffffff) {
    throw new Error(`Chunk data too large: ${data.length} bytes (maximum 2147483647)`);
  }

  // Validate chunk type characters (must be ASCII letters)
  for (let i = 0; i < 4; i++) {
    const charCode = type.charCodeAt(i);
    if (charCode < 65 || charCode > 122 || (charCode > 90 && charCode < 97)) {
      throw new Error(`Invalid chunk type character: "${type[i]}" (must be ASCII letter)`);
    }
  }

  const dataLength = data.length;
  const chunkLength = 4 + 4 + dataLength + 4; // length + type + data + CRC
  const chunk = new Uint8Array(chunkLength);
  let offset = 0;

  // Write length (4 bytes, big-endian)
  chunk[offset++] = (dataLength >>> 24) & 0xff;
  chunk[offset++] = (dataLength >>> 16) & 0xff;
  chunk[offset++] = (dataLength >>> 8) & 0xff;
  chunk[offset++] = dataLength & 0xff;

  // Write type (4 bytes, ASCII)
  for (let i = 0; i < 4; i++) {
    chunk[offset++] = type.charCodeAt(i);
  }

  // Write data
  chunk.set(data, offset);
  offset += dataLength;

  // Calculate CRC32 over type + data
  const crcData = chunk.slice(4, 4 + 4 + dataLength);
  const crc = calculateCRC32(crcData);

  // Write CRC (4 bytes, big-endian)
  chunk[offset++] = (crc >>> 24) & 0xff;
  chunk[offset++] = (crc >>> 16) & 0xff;
  chunk[offset++] = (crc >>> 8) & 0xff;
  chunk[offset++] = crc & 0xff;

  return chunk;
}

/**
 * Writes multiple PNG chunks and combines them.
 *
 * @param {Array<{type: string, data: Uint8Array}>} chunks - Array of chunk specifications
 * @returns {Uint8Array} Combined PNG chunks
 */
export function writeChunks(chunks) {
  if (!Array.isArray(chunks)) {
    throw new TypeError("chunks must be an array");
  }

  const chunkBuffers = [];
  let totalLength = 0;

  // Write each chunk
  for (const chunkSpec of chunks) {
    if (!chunkSpec || typeof chunkSpec !== "object") {
      throw new Error("Each chunk must be an object with type and data properties");
    }

    const { type, data } = chunkSpec;
    if (!type || !data) {
      throw new Error("Each chunk must have type and data properties");
    }

    const chunkBuffer = writeChunk(type, data);
    chunkBuffers.push(chunkBuffer);
    totalLength += chunkBuffer.length;
  }

  // Combine all chunks
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunkBuffer of chunkBuffers) {
    result.set(chunkBuffer, offset);
    offset += chunkBuffer.length;
  }

  return result;
}

/**
 * Writes a complete PNG file with signature and chunks.
 *
 * @param {Array<{type: string, data: Uint8Array}>} chunks - Array of chunk specifications
 * @returns {Uint8Array} Complete PNG file data
 */
export function writePNGFile(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error("chunks must be a non-empty array");
  }

  // PNG signature (8 bytes)
  const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // Write chunks
  const chunksData = writeChunks(chunks);

  // Combine signature and chunks
  const pngFile = new Uint8Array(PNG_SIGNATURE.length + chunksData.length);
  pngFile.set(PNG_SIGNATURE, 0);
  pngFile.set(chunksData, PNG_SIGNATURE.length);

  return pngFile;
}

/**
 * Creates an IEND chunk (marks end of PNG file).
 *
 * @returns {Uint8Array} IEND chunk
 */
export function createIENDChunk() {
  return writeChunk("IEND", new Uint8Array(0));
}

/**
 * Validates PNG chunk type according to PNG specification.
 *
 * @param {string} type - Chunk type to validate
 * @returns {Object} Validation result with properties and flags
 */
export function validateChunkType(type) {
  if (typeof type !== "string" || type.length !== 4) {
    throw new Error(`Invalid chunk type: "${type}" (must be 4-character string)`);
  }

  const result = {
    valid: true,
    critical: false,
    public: false,
    reserved: false,
    safeToCopy: false,
  };

  for (let i = 0; i < 4; i++) {
    const charCode = type.charCodeAt(i);
    const char = type[i];

    // Must be ASCII letter (A-Z or a-z)
    if (!((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122))) {
      result.valid = false;
      break;
    }

    // Check properties based on case (PNG specification)
    switch (i) {
      case 0: // Ancillary bit (uppercase = critical, lowercase = ancillary)
        result.critical = char >= "A" && char <= "Z";
        break;
      case 1: // Private bit (uppercase = public, lowercase = private)
        result.public = char >= "A" && char <= "Z";
        break;
      case 2: // Reserved bit (must be uppercase for valid chunks)
        result.reserved = char >= "a" && char <= "z";
        if (result.reserved) result.valid = false;
        break;
      case 3: // Safe-to-copy bit (uppercase = unsafe, lowercase = safe)
        result.safeToCopy = char >= "a" && char <= "z";
        break;
    }
  }

  return result;
}

/**
 * Gets information about standard PNG chunk types.
 *
 * @param {string} type - Chunk type
 * @returns {Object|null} Chunk information or null if unknown
 */
export function getChunkInfo(type) {
  const standardChunks = {
    // Critical chunks
    IHDR: { name: "Image Header", critical: true, description: "Image dimensions, bit depth, color type" },
    PLTE: { name: "Palette", critical: true, description: "Palette for indexed-color images" },
    IDAT: { name: "Image Data", critical: true, description: "Compressed image data" },
    IEND: { name: "Image End", critical: true, description: "Marks the end of the PNG file" },

    // Ancillary chunks
    tRNS: { name: "Transparency", critical: false, description: "Transparency information" },
    cHRM: { name: "Chromaticity", critical: false, description: "White point and color primaries" },
    gAMA: { name: "Gamma", critical: false, description: "Image gamma value" },
    iCCP: { name: "ICC Profile", critical: false, description: "Embedded ICC color profile" },
    sBIT: { name: "Significant Bits", critical: false, description: "Significant bits per sample" },
    sRGB: { name: "sRGB", critical: false, description: "Standard RGB color space" },
    tEXt: { name: "Text", critical: false, description: "Uncompressed text metadata" },
    zTXt: { name: "Compressed Text", critical: false, description: "Compressed text metadata" },
    iTXt: { name: "International Text", critical: false, description: "International text metadata" },
    bKGD: { name: "Background", critical: false, description: "Default background color" },
    pHYs: { name: "Physical Dimensions", critical: false, description: "Physical pixel dimensions" },
    sPLT: { name: "Suggested Palette", critical: false, description: "Suggested palette for quantization" },
    hIST: { name: "Histogram", critical: false, description: "Palette histogram" },
    tIME: { name: "Time", critical: false, description: "Last modification time" },
  };

  return standardChunks[type] || null;
}
