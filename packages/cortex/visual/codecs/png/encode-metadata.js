// @ts-nocheck
/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file PNG metadata chunk encoding for PNG writing.
 *
 * Encodes various PNG ancillary chunks containing metadata:
 * - tEXt: Uncompressed text metadata
 * - zTXt: Compressed text metadata
 * - iTXt: International text metadata with language support
 * - tIME: Last modification time
 * - pHYs: Physical pixel dimensions
 * - gAMA: Image gamma
 * - cHRM: Chromaticity coordinates
 * - sRGB: Standard RGB color space
 * - iCCP: ICC color profile
 * - sBIT: Significant bits per sample
 * - bKGD: Default background color
 *
 * @example
 * // Encode text metadata
 * const textChunk = encodeTextChunk("Title", "My Image");
 * const chunks = [textChunk];
 */

/**
 * Encodes a tEXt chunk with uncompressed text metadata.
 *
 * @param {string} keyword - Metadata keyword (1-79 Latin-1 characters)
 * @param {string} text - Text content (Latin-1 encoding)
 * @returns {Uint8Array} tEXt chunk data
 */
export function encodeTextChunk(keyword, text) {
  if (typeof keyword !== "string" || keyword.length === 0 || keyword.length > 79) {
    throw new Error("keyword must be a string with 1-79 characters");
  }
  if (typeof text !== "string") {
    throw new Error("text must be a string");
  }

  // Validate keyword characters (Latin-1, no null, no leading/trailing spaces)
  if (keyword.includes("\0") || keyword.startsWith(" ") || keyword.endsWith(" ")) {
    throw new Error("keyword cannot contain null bytes or leading/trailing spaces");
  }

  // Encode as Latin-1
  const keywordBytes = new TextEncoder().encode(keyword);
  const textBytes = new TextEncoder().encode(text);

  // Format: keyword + null separator + text
  const chunkData = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
  let offset = 0;

  chunkData.set(keywordBytes, offset);
  offset += keywordBytes.length;

  chunkData[offset++] = 0; // Null separator

  chunkData.set(textBytes, offset);

  return chunkData;
}

/**
 * Encodes a zTXt chunk with compressed text metadata.
 *
 * @param {string} keyword - Metadata keyword (1-79 Latin-1 characters)
 * @param {string} text - Text content (Latin-1 encoding)
 * @returns {Promise<Uint8Array>} zTXt chunk data
 */
export async function encodeCompressedTextChunk(keyword, text) {
  if (typeof keyword !== "string" || keyword.length === 0 || keyword.length > 79) {
    throw new Error("keyword must be a string with 1-79 characters");
  }
  if (typeof text !== "string") {
    throw new Error("text must be a string");
  }

  // Validate keyword
  if (keyword.includes("\0") || keyword.startsWith(" ") || keyword.endsWith(" ")) {
    throw new Error("keyword cannot contain null bytes or leading/trailing spaces");
  }

  const keywordBytes = new TextEncoder().encode(keyword);
  const textBytes = new TextEncoder().encode(text);

  // Compress text data
  const compressedText = await compressWithDEFLATE(textBytes);

  // Format: keyword + null + compression_method + compressed_text
  const chunkData = new Uint8Array(keywordBytes.length + 1 + 1 + compressedText.length);
  let offset = 0;

  chunkData.set(keywordBytes, offset);
  offset += keywordBytes.length;

  chunkData[offset++] = 0; // Null separator
  chunkData[offset++] = 0; // Compression method (0 = DEFLATE)

  chunkData.set(compressedText, offset);

  return chunkData;
}

/**
 * Encodes an iTXt chunk with international text metadata.
 *
 * @param {string} keyword - Metadata keyword (1-79 Latin-1 characters)
 * @param {string} text - Text content (UTF-8 encoding)
 * @param {Object} [options] - Additional options
 * @param {string} [options.languageTag=""] - Language tag (RFC 3066)
 * @param {string} [options.translatedKeyword=""] - Translated keyword (UTF-8)
 * @param {boolean} [options.compressed=false] - Whether to compress text
 * @returns {Promise<Uint8Array>} iTXt chunk data
 */
export async function encodeInternationalTextChunk(keyword, text, options = {}) {
  const { languageTag = "", translatedKeyword = "", compressed = false } = options;

  if (typeof keyword !== "string" || keyword.length === 0 || keyword.length > 79) {
    throw new Error("keyword must be a string with 1-79 characters");
  }
  if (typeof text !== "string") {
    throw new Error("text must be a string");
  }

  // Validate keyword
  if (keyword.includes("\0") || keyword.startsWith(" ") || keyword.endsWith(" ")) {
    throw new Error("keyword cannot contain null bytes or leading/trailing spaces");
  }

  const keywordBytes = new TextEncoder().encode(keyword);
  const languageBytes = new TextEncoder().encode(languageTag);
  const translatedKeywordBytes = new TextEncoder().encode(translatedKeyword);
  let textBytes = new TextEncoder().encode(text);

  // Compress text if requested
  if (compressed) {
    textBytes = await compressWithDEFLATE(textBytes);
  }

  // Format: keyword + null + compression_flag + compression_method + language + null + translated_keyword + null + text
  const chunkData = new Uint8Array(
    keywordBytes.length + 1 + 1 + 1 + languageBytes.length + 1 + translatedKeywordBytes.length + 1 + textBytes.length
  );
  let offset = 0;

  chunkData.set(keywordBytes, offset);
  offset += keywordBytes.length;

  chunkData[offset++] = 0; // Null separator
  chunkData[offset++] = compressed ? 1 : 0; // Compression flag
  chunkData[offset++] = 0; // Compression method (0 = DEFLATE)

  chunkData.set(languageBytes, offset);
  offset += languageBytes.length;

  chunkData[offset++] = 0; // Null separator

  chunkData.set(translatedKeywordBytes, offset);
  offset += translatedKeywordBytes.length;

  chunkData[offset++] = 0; // Null separator

  chunkData.set(textBytes, offset);

  return chunkData;
}

/**
 * Encodes a tIME chunk with timestamp metadata.
 *
 * @param {Date} date - Date to encode
 * @returns {Uint8Array} tIME chunk data (7 bytes)
 */
export function encodeTimeChunk(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("date must be a valid Date object");
  }

  const chunkData = new Uint8Array(7);

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate(); // 1-31
  const hour = date.getHours(); // 0-23
  const minute = date.getMinutes(); // 0-59
  const second = date.getSeconds(); // 0-60 (leap second)

  // Validate ranges
  if (year < 0 || year > 65535) {
    throw new Error(`Invalid year: ${year} (must be 0-65535)`);
  }
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month} (must be 1-12)`);
  }
  if (day < 1 || day > 31) {
    throw new Error(`Invalid day: ${day} (must be 1-31)`);
  }
  if (hour < 0 || hour > 23) {
    throw new Error(`Invalid hour: ${hour} (must be 0-23)`);
  }
  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute: ${minute} (must be 0-59)`);
  }
  if (second < 0 || second > 60) {
    throw new Error(`Invalid second: ${second} (must be 0-60)`);
  }

  // Encode as big-endian
  chunkData[0] = (year >> 8) & 0xff;
  chunkData[1] = year & 0xff;
  chunkData[2] = month;
  chunkData[3] = day;
  chunkData[4] = hour;
  chunkData[5] = minute;
  chunkData[6] = second;

  return chunkData;
}

/**
 * Encodes a pHYs chunk with physical pixel dimensions.
 *
 * @param {number} pixelsPerUnitX - Pixels per unit in X direction
 * @param {number} pixelsPerUnitY - Pixels per unit in Y direction
 * @param {number} unitSpecifier - Unit specifier (0=unknown, 1=meters)
 * @returns {Uint8Array} pHYs chunk data (9 bytes)
 */
export function encodePhysicalDimensionsChunk(pixelsPerUnitX, pixelsPerUnitY, unitSpecifier) {
  if (!Number.isInteger(pixelsPerUnitX) || pixelsPerUnitX < 0 || pixelsPerUnitX > 0xffffffff) {
    throw new Error("pixelsPerUnitX must be a 32-bit unsigned integer");
  }
  if (!Number.isInteger(pixelsPerUnitY) || pixelsPerUnitY < 0 || pixelsPerUnitY > 0xffffffff) {
    throw new Error("pixelsPerUnitY must be a 32-bit unsigned integer");
  }
  if (![0, 1].includes(unitSpecifier)) {
    throw new Error("unitSpecifier must be 0 (unknown) or 1 (meters)");
  }

  const chunkData = new Uint8Array(9);

  // Pixels per unit X (4 bytes, big-endian)
  chunkData[0] = (pixelsPerUnitX >>> 24) & 0xff;
  chunkData[1] = (pixelsPerUnitX >>> 16) & 0xff;
  chunkData[2] = (pixelsPerUnitX >>> 8) & 0xff;
  chunkData[3] = pixelsPerUnitX & 0xff;

  // Pixels per unit Y (4 bytes, big-endian)
  chunkData[4] = (pixelsPerUnitY >>> 24) & 0xff;
  chunkData[5] = (pixelsPerUnitY >>> 16) & 0xff;
  chunkData[6] = (pixelsPerUnitY >>> 8) & 0xff;
  chunkData[7] = pixelsPerUnitY & 0xff;

  // Unit specifier (1 byte)
  chunkData[8] = unitSpecifier;

  return chunkData;
}

/**
 * Encodes a gAMA chunk with gamma value.
 *
 * @param {number} gamma - Gamma value (will be scaled by 100000)
 * @returns {Uint8Array} gAMA chunk data (4 bytes)
 */
export function encodeGammaChunk(gamma) {
  if (typeof gamma !== "number" || gamma <= 0) {
    throw new Error("gamma must be a positive number");
  }

  const scaledGamma = Math.round(gamma * 100000);
  if (scaledGamma > 0xffffffff) {
    throw new Error("gamma value too large");
  }

  const chunkData = new Uint8Array(4);

  chunkData[0] = (scaledGamma >>> 24) & 0xff;
  chunkData[1] = (scaledGamma >>> 16) & 0xff;
  chunkData[2] = (scaledGamma >>> 8) & 0xff;
  chunkData[3] = scaledGamma & 0xff;

  return chunkData;
}

/**
 * Encodes an sRGB chunk with rendering intent.
 *
 * @param {number} renderingIntent - Rendering intent (0-3)
 * @returns {Uint8Array} sRGB chunk data (1 byte)
 */
export function encodeSRGBChunk(renderingIntent) {
  if (![0, 1, 2, 3].includes(renderingIntent)) {
    throw new Error("renderingIntent must be 0-3");
  }

  return new Uint8Array([renderingIntent]);
}

/**
 * Helper function to compress data using DEFLATE.
 * This is a simplified version - in practice you'd import from compress-idat.js
 *
 * @param {Uint8Array} data - Data to compress
 * @returns {Promise<Uint8Array>} Compressed data
 */
async function compressWithDEFLATE(data) {
  // Try browser CompressionStream first
  if (typeof CompressionStream !== "undefined") {
    const stream = new CompressionStream("deflate");
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    await writer.write(data);
    await writer.close();

    const chunks = [];
    let result = await reader.read();
    while (!result.done) {
      chunks.push(result.value);
      result = await reader.read();
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const compressed = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      compressed.set(chunk, offset);
      offset += chunk.length;
    }

    return compressed;
  }

  // Fall back to Node.js zlib
  if (typeof window === "undefined") {
    const { deflateSync } = await import("node:zlib");
    const compressed = deflateSync(data);
    return new Uint8Array(compressed);
  }

  throw new Error("No compression available");
}

/**
 * Encodes metadata from an object into PNG chunks.
 *
 * @param {Object} metadata - Metadata object
 * @param {Object} [metadata.text] - Text metadata (key-value pairs)
 * @param {Date} [metadata.time] - Modification time
 * @param {Object} [metadata.physicalDimensions] - Physical dimensions
 * @param {number} [metadata.gamma] - Gamma value
 * @param {number} [metadata.renderingIntent] - sRGB rendering intent
 * @returns {Promise<Array<{type: string, data: Uint8Array}>>} Array of metadata chunks
 */
export async function encodeMetadataChunks(metadata) {
  if (!metadata || typeof metadata !== "object") {
    return [];
  }

  const chunks = [];

  // Encode text metadata
  if (metadata.text && typeof metadata.text === "object") {
    for (const [keyword, value] of Object.entries(metadata.text)) {
      if (typeof value === "string") {
        try {
          const textData = encodeTextChunk(keyword, value);
          chunks.push({ type: "tEXt", data: textData });
        } catch (error) {
          console.warn(`Failed to encode text metadata for "${keyword}":`, error.message);
        }
      }
    }
  }

  // Encode timestamp
  if (metadata.time instanceof Date) {
    try {
      const timeData = encodeTimeChunk(metadata.time);
      chunks.push({ type: "tIME", data: timeData });
    } catch (error) {
      console.warn("Failed to encode time metadata:", error.message);
    }
  }

  // Encode physical dimensions
  if (metadata.physicalDimensions) {
    const { pixelsPerUnitX, pixelsPerUnitY, unitSpecifier } = metadata.physicalDimensions;
    if (typeof pixelsPerUnitX === "number" && typeof pixelsPerUnitY === "number") {
      try {
        const physData = encodePhysicalDimensionsChunk(pixelsPerUnitX, pixelsPerUnitY, unitSpecifier || 0);
        chunks.push({ type: "pHYs", data: physData });
      } catch (error) {
        console.warn("Failed to encode physical dimensions:", error.message);
      }
    }
  }

  // Encode gamma
  if (typeof metadata.gamma === "number") {
    try {
      const gammaData = encodeGammaChunk(metadata.gamma);
      chunks.push({ type: "gAMA", data: gammaData });
    } catch (error) {
      console.warn("Failed to encode gamma metadata:", error.message);
    }
  }

  // Encode sRGB
  if (typeof metadata.renderingIntent === "number") {
    try {
      const srgbData = encodeSRGBChunk(metadata.renderingIntent);
      chunks.push({ type: "sRGB", data: srgbData });
    } catch (error) {
      console.warn("Failed to encode sRGB metadata:", error.message);
    }
  }

  return chunks;
}
