/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file PNG chunk parser with CRC32 validation.
 *
 * Parses PNG chunk structure according to PNG specification.
 * Each chunk consists of: Length (4 bytes) + Type (4 bytes) + Data (Length bytes) + CRC (4 bytes)
 * Validates chunk integrity using CRC32 checksums over Type + Data.
 */

/**
 * CRC32 lookup table for PNG chunk validation.
 * Pre-computed table using polynomial 0xEDB88320 (IEEE 802.3).
 * @type {Uint32Array|null}
 */
let crcTable = null;

/**
 * Initialize CRC32 lookup table.
 * Uses the standard IEEE 802.3 polynomial: 0xEDB88320
 *
 * @private
 */
function initCRCTable() {
  if (crcTable) return;

  crcTable = new Uint32Array(256);

  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = 0xedb88320 ^ (crc >>> 1);
      } else {
        crc = crc >>> 1;
      }
    }
    crcTable[i] = crc;
  }
}

/**
 * Calculate CRC32 checksum for PNG chunk validation.
 *
 * Calculates CRC32 over the chunk type and data fields.
 * Uses the IEEE 802.3 polynomial as specified in PNG standard.
 *
 * @param {Uint8Array} data - Data to calculate CRC32 for (type + data)
 * @returns {number} CRC32 checksum as unsigned 32-bit integer
 *
 * @private
 */
function calculateCRC32(data) {
  initCRCTable();

  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i++) {
    const tableIndex = (crc ^ data[i]) & 0xff;
    crc = crcTable[tableIndex] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0; // Ensure unsigned 32-bit
}

/**
 * Read 32-bit big-endian unsigned integer from buffer.
 *
 * @param {Uint8Array} buffer - Buffer to read from
 * @param {number} offset - Byte offset to read from
 * @returns {number} 32-bit unsigned integer
 *
 * @private
 */
function readUint32BE(buffer, offset) {
  return ((buffer[offset] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3]) >>> 0; // Ensure unsigned
}

/**
 * Convert 4 bytes to ASCII string for chunk type.
 *
 * @param {Uint8Array} buffer - Buffer containing 4 ASCII bytes
 * @param {number} offset - Offset to start reading from
 * @returns {string} 4-character ASCII string
 *
 * @private
 */
function readChunkType(buffer, offset) {
  return String.fromCharCode(buffer[offset], buffer[offset + 1], buffer[offset + 2], buffer[offset + 3]);
}

/**
 * Parse PNG chunks from buffer data.
 *
 * Parses all chunks in a PNG file after the signature.
 * Validates chunk structure and CRC32 checksums.
 * Returns array of chunk objects with type, data, and metadata.
 *
 * @param {ArrayBuffer|Uint8Array} buffer - PNG data buffer (without signature)
 * @param {Object} [options] - Parsing options
 * @param {boolean} [options.validateCRC=true] - Whether to validate CRC32 checksums
 * @param {boolean} [options.strictMode=true] - Whether to throw on invalid chunks
 * @returns {Array<{type: string, data: Uint8Array, length: number, crc: number, offset: number, valid: boolean, error?: string}>} Array of parsed chunks
 * @throws {Error} If chunk structure is invalid or CRC validation fails
 *
 * @example
 * // Parse chunks with CRC validation
 * const chunks = parseChunks(pngData);
 * console.log(chunks[0].type); // 'IHDR'
 *
 * @example
 * // Parse without CRC validation (faster but less safe)
 * const chunks = parseChunks(pngData, { validateCRC: false });
 */
export function parseChunks(buffer, options = {}) {
  const { validateCRC = true, strictMode = true } = options;

  if (!buffer || (!(buffer instanceof ArrayBuffer) && !(buffer instanceof Uint8Array))) {
    throw new TypeError("Expected buffer to be ArrayBuffer or Uint8Array");
  }

  const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  const chunks = [];
  let offset = 0;

  while (offset < data.length) {
    // Need at least 12 bytes for chunk header (length + type + crc)
    if (offset + 12 > data.length) {
      if (strictMode) {
        throw new Error(`Incomplete chunk at offset ${offset}: need 12 bytes, got ${data.length - offset}`);
      }
      break;
    }

    // Read chunk length (4 bytes, big-endian)
    const length = readUint32BE(data, offset);

    // Validate chunk length doesn't exceed remaining buffer
    if (offset + 12 + length > data.length) {
      if (strictMode) {
        throw new Error(`Chunk length ${length} exceeds remaining buffer at offset ${offset}`);
      }
      break;
    }

    // Read chunk type (4 bytes ASCII)
    const type = readChunkType(data, offset + 4);

    // Extract chunk data
    const chunkData = data.slice(offset + 8, offset + 8 + length);

    // Read CRC32 (4 bytes, big-endian)
    const crc = readUint32BE(data, offset + 8 + length);

    // Validate CRC32 if requested
    if (validateCRC) {
      // CRC is calculated over type + data
      const crcData = data.slice(offset + 4, offset + 8 + length);
      const calculatedCRC = calculateCRC32(crcData);

      if (calculatedCRC !== crc) {
        const error = new Error(
          `CRC32 mismatch in ${type} chunk at offset ${offset}: expected ${crc.toString(16)}, got ${calculatedCRC.toString(16)}`
        );

        if (strictMode) {
          throw error;
        }

        // In non-strict mode, include error info but continue
        chunks.push({
          type,
          data: chunkData,
          length,
          crc,
          offset,
          error: error.message,
          valid: false,
        });

        offset += 12 + length;
        continue;
      }
    }

    // Add valid chunk
    chunks.push({
      type,
      data: chunkData,
      length,
      crc,
      offset,
      valid: true,
    });

    // Move to next chunk
    offset += 12 + length;
  }

  return chunks;
}

/**
 * Find chunks by type.
 *
 * Utility function to filter chunks by their type code.
 * Useful for extracting specific chunk types like IHDR, IDAT, etc.
 *
 * @param {Array<{type: string, valid?: boolean}>} chunks - Array of parsed chunks
 * @param {string} type - Chunk type to find (e.g., 'IHDR', 'IDAT')
 * @returns {Array<{type: string, valid?: boolean}>} Array of chunks matching the type
 *
 * @example
 * // Find all IDAT chunks
 * const idatChunks = findChunksByType(chunks, 'IDAT');
 *
 * @example
 * // Find IHDR chunk (should be exactly one)
 * const ihdrChunks = findChunksByType(chunks, 'IHDR');
 * if (ihdrChunks.length !== 1) throw new Error('Invalid PNG: missing or multiple IHDR chunks');
 */
export function findChunksByType(chunks, type) {
  if (!Array.isArray(chunks)) {
    throw new TypeError("Expected chunks to be an array");
  }

  if (typeof type !== "string") {
    throw new TypeError("Expected type to be a string");
  }

  return chunks.filter((chunk) => chunk.type === type && chunk.valid !== false);
}

/**
 * Validate PNG chunk structure and ordering.
 *
 * Validates that PNG chunks follow the specification requirements:
 * - IHDR must be first chunk
 * - IEND must be last chunk
 * - Critical chunks appear in correct order
 * - No duplicate critical chunks (except IDAT)
 *
 * @param {Array<{type: string, valid?: boolean}>} chunks - Array of parsed chunks
 * @throws {Error} If chunk structure violates PNG specification
 *
 * @example
 * // Validate chunk structure
 * validateChunkStructure(chunks); // throws if invalid
 */
export function validateChunkStructure(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error("PNG must contain at least one chunk");
  }

  // First chunk must be IHDR
  if (chunks[0].type !== "IHDR") {
    throw new Error(`First chunk must be IHDR, got ${chunks[0].type}`);
  }

  // Last chunk must be IEND
  if (chunks[chunks.length - 1].type !== "IEND") {
    throw new Error(`Last chunk must be IEND, got ${chunks[chunks.length - 1].type}`);
  }

  // Check for required chunks
  const ihdrChunks = findChunksByType(chunks, "IHDR");
  const iendChunks = findChunksByType(chunks, "IEND");
  const idatChunks = findChunksByType(chunks, "IDAT");

  if (ihdrChunks.length !== 1) {
    throw new Error(`PNG must have exactly one IHDR chunk, found ${ihdrChunks.length}`);
  }

  if (iendChunks.length !== 1) {
    throw new Error(`PNG must have exactly one IEND chunk, found ${iendChunks.length}`);
  }

  if (idatChunks.length === 0) {
    throw new Error("PNG must have at least one IDAT chunk");
  }

  // Validate IDAT chunks are consecutive (PNG spec requirement)
  let idatStartIndex = -1;
  let idatEndIndex = -1;

  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].type === "IDAT") {
      if (idatStartIndex === -1) {
        idatStartIndex = i;
      }
      idatEndIndex = i;
    } else if (idatStartIndex !== -1 && idatEndIndex !== -1) {
      // Found non-IDAT chunk after IDAT sequence
      break;
    }
  }

  // Check if all IDAT chunks are consecutive
  const expectedIdatCount = idatEndIndex - idatStartIndex + 1;
  if (expectedIdatCount !== idatChunks.length) {
    throw new Error("IDAT chunks must be consecutive");
  }
}
