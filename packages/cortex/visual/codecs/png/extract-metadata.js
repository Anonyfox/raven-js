// @ts-nocheck
/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Extracts metadata from PNG ancillary chunks.
 *
 * PNG files can contain various metadata chunks that provide information
 * about the image beyond the pixel data. This module handles:
 * - tEXt: Uncompressed Latin-1 text
 * - zTXt: Compressed Latin-1 text
 * - iTXt: International text (UTF-8) with optional compression
 * - tIME: Last modification time
 * - pHYs: Physical pixel dimensions
 * - sBIT: Significant bits per sample
 * - gAMA: Image gamma
 * - cHRM: Chromaticity coordinates
 * - sRGB: Standard RGB color space
 * - iCCP: ICC color profile
 *
 * @param {Array<Object>} chunks - Parsed PNG chunks
 * @returns {Object} Extracted metadata object
 *
 * @example
 * // Extract all metadata from PNG chunks
 * const metadata = extractMetadata(chunks);
 * console.log(`Title: ${metadata.text.Title}`);
 * console.log(`Created: ${metadata.time}`);
 *
 * @example
 * // Check for specific metadata types
 * if (metadata.physicalDimensions) {
 *   console.log(`DPI: ${metadata.physicalDimensions.dpiX}×${metadata.physicalDimensions.dpiY}`);
 * }
 */

/**
 * Extracts metadata from PNG ancillary chunks.
 *
 * @param {Array<{type: string, data: Uint8Array}>} chunks - Parsed PNG chunks
 * @returns {Promise<Object>} Extracted metadata object
 */
export async function extractMetadata(chunks) {
  // Parameter validation
  if (!Array.isArray(chunks)) {
    throw new TypeError("chunks must be an array");
  }

  const metadata = {
    text: {},
    time: null,
    physicalDimensions: null,
    significantBits: null,
    gamma: null,
    chromaticity: null,
    colorSpace: null,
    iccProfile: null,
    backgroundColor: null,
  };

  // Find IHDR chunk first to get color type for sBIT processing
  let colorType = 6; // Default to RGBA if not found
  const ihdrChunk = chunks.find((chunk) => chunk.type === "IHDR");
  if (ihdrChunk && ihdrChunk.data.length >= 10) {
    colorType = ihdrChunk.data[9]; // Color type is at byte 9 in IHDR
  }

  // Process each chunk
  for (const chunk of chunks) {
    if (!chunk || typeof chunk.type !== "string" || !(chunk.data instanceof Uint8Array)) {
      continue; // Skip invalid chunks
    }

    try {
      switch (chunk.type) {
        case "tEXt": {
          const textData = extractTextChunk(chunk.data);
          metadata.text[textData.keyword] = textData.value;
          break;
        }

        case "zTXt": {
          const compressedTextData = await extractCompressedTextChunk(chunk.data);
          metadata.text[compressedTextData.keyword] = compressedTextData.value;
          break;
        }

        case "iTXt": {
          const internationalTextData = await extractInternationalTextChunk(chunk.data);
          metadata.text[internationalTextData.keyword] = internationalTextData.value;
          break;
        }

        case "tIME": {
          metadata.time = extractTimeChunk(chunk.data);
          break;
        }

        case "pHYs": {
          metadata.physicalDimensions = extractPhysicalDimensionsChunk(chunk.data);
          break;
        }

        case "gAMA": {
          metadata.gamma = extractGammaChunk(chunk.data);
          break;
        }

        case "cHRM": {
          metadata.chromaticity = extractChromaticityChunk(chunk.data);
          break;
        }

        case "sRGB": {
          metadata.colorSpace = extractSRGBChunk(chunk.data);
          break;
        }

        case "iCCP": {
          metadata.iccProfile = await extractICCProfileChunk(chunk.data);
          break;
        }

        case "sBIT": {
          metadata.significantBits = extractSignificantBitsChunk(chunk.data, colorType);
          break;
        }

        case "bKGD": {
          metadata.backgroundColor = extractBackgroundColorChunk(chunk.data);
          break;
        }

        // Ignore other chunk types
        default:
          break;
      }
    } catch (error) {
      // Log warning but continue processing other chunks
      console.warn(`Failed to extract ${chunk.type} metadata: ${error.message}`);
    }
  }

  return metadata;
}

/**
 * Extracts text metadata from tEXt chunks.
 *
 * @param {Uint8Array} chunkData - tEXt chunk data
 * @returns {Object} Text metadata with keyword and value
 */
export function extractTextChunk(chunkData) {
  // Parameter validation
  if (!(chunkData instanceof Uint8Array)) {
    throw new TypeError("chunkData must be a Uint8Array");
  }
  if (chunkData.length < 2) {
    throw new Error("tEXt chunk data too short (minimum 2 bytes)");
  }

  // Find null separator between keyword and text
  let separatorIndex = -1;
  for (let i = 0; i < chunkData.length; i++) {
    if (chunkData[i] === 0) {
      separatorIndex = i;
      break;
    }
  }

  if (separatorIndex === -1) {
    throw new Error("tEXt chunk missing null separator");
  }
  if (separatorIndex === 0) {
    throw new Error("tEXt chunk has empty keyword");
  }
  if (separatorIndex > 79) {
    throw new Error("tEXt keyword too long (maximum 79 bytes)");
  }

  // Extract keyword (Latin-1 encoded)
  const keywordBytes = chunkData.slice(0, separatorIndex);
  const keyword = Array.from(keywordBytes, (byte) => String.fromCharCode(byte)).join("");

  // Validate keyword characters (printable Latin-1, no leading/trailing spaces)
  if (keyword.startsWith(" ") || keyword.endsWith(" ")) {
    throw new Error("tEXt keyword cannot have leading or trailing spaces");
  }
  for (let i = 0; i < keyword.length; i++) {
    const code = keyword.charCodeAt(i);
    if (code < 32 || code > 126) {
      throw new Error(`tEXt keyword contains invalid character at position ${i}`);
    }
  }

  // Extract text value (Latin-1 encoded)
  const textBytes = chunkData.slice(separatorIndex + 1);
  const value = Array.from(textBytes, (byte) => String.fromCharCode(byte)).join("");

  return { keyword, value };
}

/**
 * Extracts compressed text metadata from zTXt chunks.
 *
 * @param {Uint8Array} chunkData - zTXt chunk data
 * @returns {Promise<Object>} Text metadata with keyword and value
 */
export async function extractCompressedTextChunk(chunkData) {
  // Parameter validation
  if (!(chunkData instanceof Uint8Array)) {
    throw new TypeError("chunkData must be a Uint8Array");
  }
  if (chunkData.length < 4) {
    throw new Error("zTXt chunk data too short (minimum 4 bytes)");
  }

  // Find null separator between keyword and compression method
  let separatorIndex = -1;
  for (let i = 0; i < chunkData.length; i++) {
    if (chunkData[i] === 0) {
      separatorIndex = i;
      break;
    }
  }

  if (separatorIndex === -1) {
    throw new Error("zTXt chunk missing null separator");
  }
  if (separatorIndex === 0) {
    throw new Error("zTXt chunk has empty keyword");
  }
  if (separatorIndex > 79) {
    throw new Error("zTXt keyword too long (maximum 79 bytes)");
  }

  // Extract keyword (Latin-1 encoded)
  const keywordBytes = chunkData.slice(0, separatorIndex);
  const keyword = new TextDecoder("latin1").decode(keywordBytes);

  // Validate keyword characters (printable Latin-1)
  for (let i = 0; i < keywordBytes.length; i++) {
    const byte = keywordBytes[i];
    if (byte < 32 || byte > 126) {
      throw new Error(`Invalid character in zTXt keyword at position ${i}: ${byte}`);
    }
  }

  // Check compression method (must be 0 for DEFLATE)
  if (separatorIndex + 1 >= chunkData.length) {
    throw new Error("zTXt chunk missing compression method");
  }
  const compressionMethod = chunkData[separatorIndex + 1];
  if (compressionMethod !== 0) {
    throw new Error(`Unsupported zTXt compression method: ${compressionMethod} (only DEFLATE/0 supported)`);
  }

  // Extract compressed text data
  const compressedData = chunkData.slice(separatorIndex + 2);
  if (compressedData.length === 0) {
    // Empty compressed data is valid
    return { keyword, value: "" };
  }

  try {
    // Decompress using the same logic as IDAT decompression
    let decompressedData;

    // Platform detection for decompression
    if (typeof window !== "undefined") {
      // Browser environment - use DecompressionStream
      const stream = new DecompressionStream("deflate");
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      // Write compressed data
      await writer.write(compressedData);
      await writer.close();

      // Read decompressed data
      const chunks = [];
      let result;
      result = await reader.read();
      while (!result.done) {
        chunks.push(result.value);
        result = await reader.read();
      }

      // Combine chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      decompressedData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        decompressedData.set(chunk, offset);
        offset += chunk.length;
      }
    } else {
      // Node.js environment - use zlib
      const zlib = await import("node:zlib");
      decompressedData = zlib.inflateSync(compressedData);
    }

    // Decode text as Latin-1
    const value = new TextDecoder("latin1").decode(decompressedData);

    return { keyword, value };
  } catch (error) {
    throw new Error(`zTXt decompression failed: ${error.message}`);
  }
}

/**
 * Extracts international text metadata from iTXt chunks.
 *
 * @param {Uint8Array} chunkData - iTXt chunk data
 * @returns {Promise<Object>} International text metadata
 */
export async function extractInternationalTextChunk(chunkData) {
  // Parameter validation
  if (!(chunkData instanceof Uint8Array)) {
    throw new TypeError("chunkData must be a Uint8Array");
  }
  if (chunkData.length < 5) {
    throw new Error("iTXt chunk data too short (minimum 5 bytes)");
  }

  let offset = 0;

  // Find first null separator (end of keyword)
  let keywordEnd = -1;
  for (let i = offset; i < chunkData.length; i++) {
    if (chunkData[i] === 0) {
      keywordEnd = i;
      break;
    }
  }

  if (keywordEnd === -1) {
    throw new Error("iTXt chunk missing keyword null separator");
  }
  if (keywordEnd === 0) {
    throw new Error("iTXt chunk has empty keyword");
  }
  if (keywordEnd > 79) {
    throw new Error("iTXt keyword too long (maximum 79 bytes)");
  }

  // Extract keyword (Latin-1 encoded)
  const keywordBytes = chunkData.slice(offset, keywordEnd);
  const keyword = new TextDecoder("latin1").decode(keywordBytes);

  // Validate keyword characters (printable Latin-1)
  for (let i = 0; i < keywordBytes.length; i++) {
    const byte = keywordBytes[i];
    if (byte < 32 || byte > 126) {
      throw new Error(`Invalid character in iTXt keyword at position ${i}: ${byte}`);
    }
  }

  offset = keywordEnd + 1;

  // Check compression flag
  if (offset >= chunkData.length) {
    throw new Error("iTXt chunk missing compression flag");
  }
  const compressionFlag = chunkData[offset++];
  if (compressionFlag !== 0 && compressionFlag !== 1) {
    throw new Error(`Invalid iTXt compression flag: ${compressionFlag} (must be 0 or 1)`);
  }

  // Check compression method (only relevant if compressed)
  if (offset >= chunkData.length) {
    throw new Error("iTXt chunk missing compression method");
  }
  const compressionMethod = chunkData[offset++];
  if (compressionFlag === 1 && compressionMethod !== 0) {
    throw new Error(`Unsupported iTXt compression method: ${compressionMethod} (only DEFLATE/0 supported)`);
  }

  // Find second null separator (end of language tag)
  let languageEnd = -1;
  for (let i = offset; i < chunkData.length; i++) {
    if (chunkData[i] === 0) {
      languageEnd = i;
      break;
    }
  }

  if (languageEnd === -1) {
    throw new Error("iTXt chunk missing language tag null separator");
  }

  // Extract language tag (ASCII)
  const languageBytes = chunkData.slice(offset, languageEnd);
  const languageTag = new TextDecoder("ascii").decode(languageBytes);
  offset = languageEnd + 1;

  // Find third null separator (end of translated keyword)
  let translatedKeywordEnd = -1;
  for (let i = offset; i < chunkData.length; i++) {
    if (chunkData[i] === 0) {
      translatedKeywordEnd = i;
      break;
    }
  }

  if (translatedKeywordEnd === -1) {
    throw new Error("iTXt chunk missing translated keyword null separator");
  }

  // Extract translated keyword (UTF-8)
  const translatedKeywordBytes = chunkData.slice(offset, translatedKeywordEnd);
  const translatedKeyword = new TextDecoder("utf-8").decode(translatedKeywordBytes);
  offset = translatedKeywordEnd + 1;

  // Extract text data (UTF-8, possibly compressed)
  const textData = chunkData.slice(offset);
  let value;

  if (compressionFlag === 1) {
    // Compressed text - decompress first
    try {
      let decompressedData;

      // Platform detection for decompression
      if (typeof window !== "undefined") {
        // Browser environment - use DecompressionStream
        const stream = new DecompressionStream("deflate");
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        // Write compressed data
        await writer.write(textData);
        await writer.close();

        // Read decompressed data
        const chunks = [];
        let result;
        result = await reader.read();
        while (!result.done) {
          chunks.push(result.value);
          result = await reader.read();
        }

        // Combine chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        decompressedData = new Uint8Array(totalLength);
        let chunkOffset = 0;
        for (const chunk of chunks) {
          decompressedData.set(chunk, chunkOffset);
          chunkOffset += chunk.length;
        }
      } else {
        // Node.js environment - use zlib
        const zlib = await import("node:zlib");
        decompressedData = zlib.inflateSync(textData);
      }

      // Decode decompressed text as UTF-8
      value = new TextDecoder("utf-8").decode(decompressedData);
    } catch (error) {
      throw new Error(`iTXt decompression failed: ${error.message}`);
    }
  } else {
    // Uncompressed text - decode directly as UTF-8
    value = new TextDecoder("utf-8").decode(textData);
  }

  return {
    keyword,
    languageTag,
    translatedKeyword,
    value,
    compressed: compressionFlag === 1,
  };
}

/**
 * Extracts timestamp from tIME chunk.
 *
 * @param {Uint8Array} chunkData - tIME chunk data
 * @returns {Date} Last modification date
 */
export function extractTimeChunk(chunkData) {
  // Parameter validation
  if (!(chunkData instanceof Uint8Array)) {
    throw new TypeError("chunkData must be a Uint8Array");
  }
  if (chunkData.length !== 7) {
    throw new Error(`Invalid tIME chunk length: expected 7 bytes, got ${chunkData.length}`);
  }

  // Extract timestamp components
  const year = (chunkData[0] << 8) | chunkData[1]; // 16-bit big-endian
  const month = chunkData[2]; // 1-12
  const day = chunkData[3]; // 1-31
  const hour = chunkData[4]; // 0-23
  const minute = chunkData[5]; // 0-59
  const second = chunkData[6]; // 0-60 (leap seconds)

  // Validate ranges
  if (year < 1 || year > 65535) {
    throw new Error(`Invalid year in tIME chunk: ${year}`);
  }
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in tIME chunk: ${month}`);
  }
  if (day < 1 || day > 31) {
    throw new Error(`Invalid day in tIME chunk: ${day}`);
  }
  if (hour < 0 || hour > 23) {
    throw new Error(`Invalid hour in tIME chunk: ${hour}`);
  }
  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute in tIME chunk: ${minute}`);
  }
  if (second < 0 || second > 60) {
    // 60 allows for leap seconds
    throw new Error(`Invalid second in tIME chunk: ${second}`);
  }

  // Create Date object (month is 0-based in JavaScript)
  const date = new Date(year, month - 1, day, hour, minute, second);

  // Validate that the date is valid (handles invalid dates like Feb 30)
  // Note: JavaScript Date has issues with very early years, so we're more lenient for years < 100
  if (year >= 100) {
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day ||
      date.getHours() !== hour ||
      date.getMinutes() !== minute ||
      date.getSeconds() !== second
    ) {
      throw new Error(
        `Invalid date in tIME chunk: ${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")} ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`
      );
    }
  } else {
    // For early years, just do basic validation (JavaScript Date constructor is unreliable for years < 100)
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
      daysInMonth[1] = 29; // Leap year
    }
    if (day > daysInMonth[month - 1]) {
      throw new Error(
        `Invalid date in tIME chunk: ${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")} ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`
      );
    }
  }

  return date;
}

/**
 * Extracts physical dimensions from pHYs chunk.
 *
 * @param {Uint8Array} chunkData - pHYs chunk data
 * @returns {Object} Physical dimension information
 */
export function extractPhysicalDimensionsChunk(chunkData) {
  // Parameter validation
  if (!(chunkData instanceof Uint8Array)) {
    throw new TypeError("chunkData must be a Uint8Array");
  }
  if (chunkData.length !== 9) {
    throw new Error(`Invalid pHYs chunk length: ${chunkData.length} bytes (expected 9)`);
  }

  // Extract pixels per unit X (4 bytes, big-endian)
  const pixelsPerUnitX = (chunkData[0] << 24) | (chunkData[1] << 16) | (chunkData[2] << 8) | chunkData[3];

  // Extract pixels per unit Y (4 bytes, big-endian)
  const pixelsPerUnitY = (chunkData[4] << 24) | (chunkData[5] << 16) | (chunkData[6] << 8) | chunkData[7];

  // Extract unit specifier (1 byte)
  const unit = chunkData[8];

  // Validate unit specifier
  if (unit !== 0 && unit !== 1) {
    throw new Error(`Invalid pHYs unit specifier: ${unit} (must be 0 or 1)`);
  }

  // Calculate DPI if unit is meters
  let dpiX = 0;
  let dpiY = 0;
  if (unit === 1 && pixelsPerUnitX > 0 && pixelsPerUnitY > 0) {
    // Convert pixels per meter to dots per inch
    // 1 meter = 39.3701 inches
    dpiX = Math.round(pixelsPerUnitX / 39.3701);
    dpiY = Math.round(pixelsPerUnitY / 39.3701);
  }

  return {
    pixelsPerUnitX,
    pixelsPerUnitY,
    unit, // 0 = unknown, 1 = meters
    unitName: unit === 1 ? "meters" : "unknown",
    dpiX,
    dpiY,
    aspectRatio: pixelsPerUnitY > 0 ? pixelsPerUnitX / pixelsPerUnitY : 1,
  };
}

/**
 * Extracts significant bits from sBIT chunk.
 *
 * @param {Uint8Array} chunkData - sBIT chunk data
 * @param {number} colorType - PNG color type from IHDR
 * @returns {Object} Significant bits per channel
 */
export function extractSignificantBitsChunk(chunkData, colorType) {
  // Parameter validation
  if (!(chunkData instanceof Uint8Array)) {
    throw new TypeError("chunkData must be a Uint8Array");
  }
  if (typeof colorType !== "number" || colorType < 0 || colorType > 6) {
    throw new Error(`Invalid color type: ${colorType} (must be 0-6)`);
  }

  // Determine expected length based on color type
  let expectedLength;
  switch (colorType) {
    case 0: // Grayscale
      expectedLength = 1;
      break;
    case 2: // RGB
    case 3: // Palette
      expectedLength = 3;
      break;
    case 4: // Grayscale + Alpha
      expectedLength = 2;
      break;
    case 6: // RGB + Alpha
      expectedLength = 4;
      break;
    default:
      throw new Error(`Unsupported color type for sBIT: ${colorType}`);
  }

  if (chunkData.length !== expectedLength) {
    throw new Error(
      `Invalid sBIT chunk length: ${chunkData.length} bytes (expected ${expectedLength} for color type ${colorType})`
    );
  }

  // Initialize result object
  const result = {
    red: 0,
    green: 0,
    blue: 0,
    alpha: 0,
    grayscale: 0,
  };

  // Extract significant bits based on color type
  switch (colorType) {
    case 0: {
      // Grayscale
      result.grayscale = chunkData[0];
      if (result.grayscale === 0 || result.grayscale > 16) {
        throw new Error(`Invalid grayscale significant bits: ${result.grayscale} (must be 1-16)`);
      }
      break;
    }
    case 2: {
      // RGB
      result.red = chunkData[0];
      result.green = chunkData[1];
      result.blue = chunkData[2];

      if (result.red === 0 || result.red > 16) {
        throw new Error(`Invalid red significant bits: ${result.red} (must be 1-16)`);
      }
      if (result.green === 0 || result.green > 16) {
        throw new Error(`Invalid green significant bits: ${result.green} (must be 1-16)`);
      }
      if (result.blue === 0 || result.blue > 16) {
        throw new Error(`Invalid blue significant bits: ${result.blue} (must be 1-16)`);
      }
      break;
    }
    case 3: {
      // Palette (same as RGB)
      result.red = chunkData[0];
      result.green = chunkData[1];
      result.blue = chunkData[2];

      if (result.red === 0 || result.red > 8) {
        throw new Error(`Invalid palette red significant bits: ${result.red} (must be 1-8)`);
      }
      if (result.green === 0 || result.green > 8) {
        throw new Error(`Invalid palette green significant bits: ${result.green} (must be 1-8)`);
      }
      if (result.blue === 0 || result.blue > 8) {
        throw new Error(`Invalid palette blue significant bits: ${result.blue} (must be 1-8)`);
      }
      break;
    }
    case 4: {
      // Grayscale + Alpha
      result.grayscale = chunkData[0];
      result.alpha = chunkData[1];

      if (result.grayscale === 0 || result.grayscale > 16) {
        throw new Error(`Invalid grayscale significant bits: ${result.grayscale} (must be 1-16)`);
      }
      if (result.alpha === 0 || result.alpha > 16) {
        throw new Error(`Invalid alpha significant bits: ${result.alpha} (must be 1-16)`);
      }
      break;
    }
    case 6: {
      // RGB + Alpha
      result.red = chunkData[0];
      result.green = chunkData[1];
      result.blue = chunkData[2];
      result.alpha = chunkData[3];

      if (result.red === 0 || result.red > 16) {
        throw new Error(`Invalid red significant bits: ${result.red} (must be 1-16)`);
      }
      if (result.green === 0 || result.green > 16) {
        throw new Error(`Invalid green significant bits: ${result.green} (must be 1-16)`);
      }
      if (result.blue === 0 || result.blue > 16) {
        throw new Error(`Invalid blue significant bits: ${result.blue} (must be 1-16)`);
      }
      if (result.alpha === 0 || result.alpha > 16) {
        throw new Error(`Invalid alpha significant bits: ${result.alpha} (must be 1-16)`);
      }
      break;
    }
  }

  return result;
}

/**
 * Extracts gamma value from gAMA chunk.
 *
 * @param {Uint8Array} chunkData - gAMA chunk data
 * @returns {number} Gamma value
 */
export function extractGammaChunk(chunkData) {
  // Parameter validation
  if (!(chunkData instanceof Uint8Array)) {
    throw new TypeError("chunkData must be a Uint8Array");
  }
  if (chunkData.length !== 4) {
    throw new Error(`Invalid gAMA chunk length: ${chunkData.length} bytes (expected 4)`);
  }

  // Extract gamma value (4 bytes, big-endian, scaled by 100000)
  const gammaRaw = (chunkData[0] << 24) | (chunkData[1] << 16) | (chunkData[2] << 8) | chunkData[3];

  // Convert to actual gamma value
  const gamma = gammaRaw / 100000;

  // Validate gamma range (should be positive)
  if (gamma <= 0) {
    throw new Error(`Invalid gamma value: ${gamma} (must be positive)`);
  }

  // Common gamma values validation (optional warning for unusual values)
  if (gamma < 0.1 || gamma > 10) {
    console.warn(`Unusual gamma value: ${gamma} (typical range is 0.45-2.2)`);
  }

  return gamma;
}

/**
 * Extracts chromaticity coordinates from cHRM chunk.
 *
 * @param {Uint8Array} chunkData - cHRM chunk data
 * @returns {Object} Chromaticity coordinates
 */
export function extractChromaticityChunk(chunkData) {
  // Parameter validation
  if (!(chunkData instanceof Uint8Array)) {
    throw new TypeError("chunkData must be a Uint8Array");
  }
  if (chunkData.length !== 32) {
    throw new Error(`Invalid cHRM chunk length: expected 32 bytes, got ${chunkData.length}`);
  }

  // Helper function to read 32-bit big-endian unsigned integer
  /** @type {function(Uint8Array, number): number} */
  const readUint32BE = (data, offset) => {
    return (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
  };

  // Extract chromaticity values (8 × 32-bit values)
  // Values are stored as integers × 100000 (so divide by 100000 to get actual coordinates)
  const whitePointX = readUint32BE(chunkData, 0) / 100000;
  const whitePointY = readUint32BE(chunkData, 4) / 100000;
  const redX = readUint32BE(chunkData, 8) / 100000;
  const redY = readUint32BE(chunkData, 12) / 100000;
  const greenX = readUint32BE(chunkData, 16) / 100000;
  const greenY = readUint32BE(chunkData, 20) / 100000;
  const blueX = readUint32BE(chunkData, 24) / 100000;
  const blueY = readUint32BE(chunkData, 28) / 100000;

  // Validate chromaticity coordinates (should be between 0 and 1)
  const coordinates = [
    { name: "whitePointX", value: whitePointX },
    { name: "whitePointY", value: whitePointY },
    { name: "redX", value: redX },
    { name: "redY", value: redY },
    { name: "greenX", value: greenX },
    { name: "greenY", value: greenY },
    { name: "blueX", value: blueX },
    { name: "blueY", value: blueY },
  ];

  for (const coord of coordinates) {
    if (coord.value < 0 || coord.value > 1) {
      throw new Error(`Invalid chromaticity coordinate ${coord.name}: ${coord.value} (must be 0-1)`);
    }
  }

  return {
    whitePointX,
    whitePointY,
    redX,
    redY,
    greenX,
    greenY,
    blueX,
    blueY,
  };
}

/**
 * Extracts sRGB color space information from sRGB chunk.
 *
 * @param {Uint8Array} chunkData - sRGB chunk data
 * @returns {Object} sRGB rendering intent
 */
export function extractSRGBChunk(chunkData) {
  // Parameter validation
  if (!(chunkData instanceof Uint8Array)) {
    throw new TypeError("chunkData must be a Uint8Array");
  }
  if (chunkData.length !== 1) {
    throw new Error(`Invalid sRGB chunk length: ${chunkData.length} bytes (expected 1)`);
  }

  // Extract rendering intent (1 byte)
  const renderingIntent = chunkData[0];

  // Validate rendering intent
  if (renderingIntent > 3) {
    throw new Error(`Invalid sRGB rendering intent: ${renderingIntent} (must be 0-3)`);
  }

  // Map rendering intent to name
  const intentNames = [
    "perceptual", // 0: Perceptual
    "relative colorimetric", // 1: Relative colorimetric
    "saturation", // 2: Saturation
    "absolute colorimetric", // 3: Absolute colorimetric
  ];

  return {
    renderingIntent,
    intentName: intentNames[renderingIntent],
    description: getSRGBIntentDescription(renderingIntent),
  };
}

/**
 * Gets description for sRGB rendering intent.
 *
 * @param {number} intent - Rendering intent (0-3)
 * @returns {string} Intent description
 */
function getSRGBIntentDescription(intent) {
  switch (intent) {
    case 0:
      return "Perceptual - for photographs and complex images";
    case 1:
      return "Relative colorimetric - for logos and simple graphics";
    case 2:
      return "Saturation - for business graphics and charts";
    case 3:
      return "Absolute colorimetric - for proofing and exact color matching";
    default:
      return "Unknown rendering intent";
  }
}

/**
 * Extracts ICC color profile from iCCP chunk.
 *
 * @param {Uint8Array} chunkData - iCCP chunk data
 * @returns {Promise<Object>} ICC profile information
 */
export async function extractICCProfileChunk(chunkData) {
  // Parameter validation
  if (!(chunkData instanceof Uint8Array)) {
    throw new TypeError("chunkData must be a Uint8Array");
  }
  if (chunkData.length < 3) {
    throw new Error("iCCP chunk data too short (minimum 3 bytes)");
  }

  let offset = 0;

  // Find null separator (end of profile name)
  let nameEnd = -1;
  for (let i = offset; i < chunkData.length; i++) {
    if (chunkData[i] === 0) {
      nameEnd = i;
      break;
    }
  }

  if (nameEnd === -1) {
    throw new Error("iCCP chunk missing profile name null separator");
  }
  if (nameEnd === 0) {
    throw new Error("iCCP chunk has empty profile name");
  }
  if (nameEnd > 79) {
    throw new Error("iCCP profile name too long (maximum 79 bytes)");
  }

  // Extract profile name (Latin-1 encoded)
  const nameBytes = chunkData.slice(offset, nameEnd);
  const profileName = new TextDecoder("latin1").decode(nameBytes);

  // Validate profile name characters (printable Latin-1)
  for (let i = 0; i < nameBytes.length; i++) {
    const byte = nameBytes[i];
    if (byte < 32 || byte > 126) {
      throw new Error(`Invalid character in iCCP profile name at position ${i}: ${byte}`);
    }
  }

  offset = nameEnd + 1;

  // Check compression method
  if (offset >= chunkData.length) {
    throw new Error("iCCP chunk missing compression method");
  }
  const compressionMethod = chunkData[offset++];
  if (compressionMethod !== 0) {
    throw new Error(`Unsupported iCCP compression method: ${compressionMethod} (only DEFLATE/0 supported)`);
  }

  // Extract compressed profile data
  const compressedData = chunkData.slice(offset);
  if (compressedData.length === 0) {
    throw new Error("iCCP chunk has no profile data");
  }

  // Decompress profile data
  let profileData;
  try {
    // Platform detection for decompression
    if (typeof window !== "undefined") {
      // Browser environment - use DecompressionStream
      const stream = new DecompressionStream("deflate");
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      // Write compressed data
      await writer.write(compressedData);
      await writer.close();

      // Read decompressed data
      const chunks = [];
      let result;
      result = await reader.read();
      while (!result.done) {
        chunks.push(result.value);
        result = await reader.read();
      }

      // Combine chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      profileData = new Uint8Array(totalLength);
      let chunkOffset = 0;
      for (const chunk of chunks) {
        profileData.set(chunk, chunkOffset);
        chunkOffset += chunk.length;
      }
    } else {
      // Node.js environment - use zlib
      const zlib = await import("node:zlib");
      profileData = zlib.inflateSync(compressedData);
    }
  } catch (error) {
    throw new Error(`iCCP decompression failed: ${error.message}`);
  }

  // Basic ICC profile validation (check signature)
  if (profileData.length < 4) {
    throw new Error("Decompressed ICC profile too short");
  }

  // ICC profiles should start with profile size (4 bytes, big-endian)
  const profileSize = (profileData[0] << 24) | (profileData[1] << 16) | (profileData[2] << 8) | profileData[3];
  if (profileSize !== profileData.length) {
    console.warn(`ICC profile size mismatch: header says ${profileSize}, actual ${profileData.length}`);
  }

  // Extract basic ICC profile information
  let colorSpace = "unknown";
  let deviceClass = "unknown";

  if (profileData.length >= 20) {
    // Color space signature at offset 16-19
    const colorSpaceBytes = profileData.slice(16, 20);
    const colorSpaceSignature = new TextDecoder("ascii").decode(colorSpaceBytes);

    switch (colorSpaceSignature) {
      case "RGB ":
        colorSpace = "RGB";
        break;
      case "CMYK":
        colorSpace = "CMYK";
        break;
      case "GRAY":
        colorSpace = "Grayscale";
        break;
      case "LAB ":
        colorSpace = "LAB";
        break;
      case "XYZ ":
        colorSpace = "XYZ";
        break;
      default:
        colorSpace = colorSpaceSignature.trim() || "unknown";
    }
  }

  if (profileData.length >= 16) {
    // Device class at offset 12-15
    const deviceClassBytes = profileData.slice(12, 16);
    const deviceClassSignature = new TextDecoder("ascii").decode(deviceClassBytes);

    switch (deviceClassSignature) {
      case "scnr":
        deviceClass = "Input Device (Scanner)";
        break;
      case "mntr":
        deviceClass = "Display Device (Monitor)";
        break;
      case "prtr":
        deviceClass = "Output Device (Printer)";
        break;
      case "link":
        deviceClass = "Device Link";
        break;
      case "spac":
        deviceClass = "Color Space Conversion";
        break;
      case "abst":
        deviceClass = "Abstract";
        break;
      case "nmcl":
        deviceClass = "Named Color";
        break;
      default:
        deviceClass = deviceClassSignature.trim() || "unknown";
    }
  }

  return {
    profileName,
    compressionMethod,
    profileData,
    profileSize: profileData.length,
    colorSpace,
    deviceClass,
  };
}

/**
 * Validates metadata extraction parameters.
 *
 * @param {Array<Object>} _chunks - PNG chunks array
 * @returns {boolean} True if parameters are valid
 */
export function validateMetadataParameters(_chunks) {
  // Stub implementation
  return false;
}

/**
 * Gets standard text keywords used in PNG metadata.
 *
 * @returns {Array<string>} Array of standard keywords
 */
export function getStandardTextKeywords() {
  return [
    "Title",
    "Author",
    "Description",
    "Copyright",
    "Creation Time",
    "Software",
    "Disclaimer",
    "Warning",
    "Source",
    "Comment",
  ];
}

/**
 * Converts PNG timestamp to ISO string.
 *
 * @param {Date} _date - PNG timestamp
 * @returns {string} ISO formatted date string
 */
export function formatPNGTimestamp(_date) {
  // Stub implementation
  return "";
}

/**
 * Analyzes metadata completeness and quality.
 *
 * @param {Object} _metadata - Extracted metadata object
 * @returns {Object} Metadata analysis
 */
export function analyzeMetadata(_metadata) {
  // Stub implementation
  return {
    hasText: false,
    hasTimestamp: false,
    hasPhysicalDimensions: false,
    hasColorProfile: false,
    completeness: 0, // 0-100%
    standardKeywords: 0,
    customKeywords: 0,
  };
}

/**
 * Extracts background color from bKGD chunk.
 *
 * @param {Uint8Array} chunkData - bKGD chunk data
 * @returns {Object} Background color information
 */
export function extractBackgroundColorChunk(chunkData) {
  // Parameter validation
  if (!(chunkData instanceof Uint8Array)) {
    throw new TypeError("chunkData must be a Uint8Array");
  }

  // bKGD chunk format depends on the color type of the image
  // Since we don't have the color type here, we need to infer from chunk length
  let backgroundColor;

  switch (chunkData.length) {
    case 1: {
      // Grayscale: 1 byte (palette index for color type 3, or grayscale value for color type 0)
      backgroundColor = {
        type: "grayscale",
        gray: chunkData[0],
      };
      break;
    }

    case 2: {
      // Grayscale: 2 bytes (16-bit grayscale value for color type 0)
      const gray = (chunkData[0] << 8) | chunkData[1];
      backgroundColor = {
        type: "grayscale16",
        gray,
      };
      break;
    }

    case 6: {
      // RGB: 6 bytes (3 × 16-bit RGB values for color type 2)
      const red = (chunkData[0] << 8) | chunkData[1];
      const green = (chunkData[2] << 8) | chunkData[3];
      const blue = (chunkData[4] << 8) | chunkData[5];
      backgroundColor = {
        type: "rgb",
        red,
        green,
        blue,
      };
      break;
    }

    default:
      throw new Error(`Invalid bKGD chunk length: ${chunkData.length} bytes`);
  }

  return backgroundColor;
}
