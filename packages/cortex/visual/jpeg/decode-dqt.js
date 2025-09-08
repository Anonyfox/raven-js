/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG Quantization Table (DQT) decoder implementation.
 *
 * Implements ITU-T T.81 Section B.2.4.1 quantization table parsing with full
 * precision support, zigzag ordering, and quality estimation. Handles multiple
 * tables per marker, precision mixing, and standard table recognition.
 */

/**
 * Zigzag scan order for 8x8 DCT blocks.
 * Maps linear index (0-63) to 2D coordinates in zigzag pattern.
 * Critical for correct quantization table coefficient mapping.
 *
 * @type {number[]}
 */
export const ZIGZAG_ORDER = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28,
  35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47,
  55, 62, 63,
];

/**
 * Standard JPEG luminance quantization table (quality ~50).
 * Used for quality estimation and table recognition.
 *
 * @type {number[]}
 */
export const STANDARD_LUMINANCE_TABLE = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51,
  87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99,
];

/**
 * Standard JPEG chrominance quantization table (quality ~50).
 * Used for quality estimation and table recognition.
 *
 * @type {number[]}
 */
export const STANDARD_CHROMINANCE_TABLE = [
  17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99,
];

/**
 * Read 16-bit big-endian value from buffer.
 * Validates buffer bounds to prevent overruns.
 *
 * @param {Uint8Array} buffer - Source buffer
 * @param {number} offset - Read offset
 * @returns {number} 16-bit value
 * @throws {Error} If buffer is too short
 *
 * @private
 */
function readUint16BE(buffer, offset) {
  if (offset + 1 >= buffer.length) {
    throw new Error(`Cannot read uint16 at offset ${offset}: buffer too short`);
  }
  return (buffer[offset] << 8) | buffer[offset + 1];
}

/**
 * Convert zigzag-ordered coefficients to natural 8x8 matrix order.
 * JPEG stores quantization tables in zigzag scan order for compression.
 *
 * @param {number[]} zigzagData - 64 coefficients in zigzag order
 * @returns {number[][]} 8x8 matrix in natural row-column order
 *
 * @example
 * const matrix = zigzagToMatrix(quantTable);
 * const dcCoeff = matrix[0][0]; // DC coefficient
 * const highFreq = matrix[7][7]; // Highest frequency AC coefficient
 */
export function zigzagToMatrix(zigzagData) {
  if (!Array.isArray(zigzagData) || zigzagData.length !== 64) {
    throw new Error("Expected zigzagData to be array of 64 elements");
  }

  const matrix = Array.from({ length: 8 }, () => new Array(8));

  for (let i = 0; i < 64; i++) {
    const row = Math.floor(ZIGZAG_ORDER[i] / 8);
    const col = ZIGZAG_ORDER[i] % 8;
    matrix[row][col] = zigzagData[i];
  }

  return matrix;
}

/**
 * Convert natural 8x8 matrix to zigzag-ordered coefficients.
 * Inverse of zigzagToMatrix for encoding operations.
 *
 * @param {number[][]} matrix - 8x8 matrix in natural order
 * @returns {number[]} 64 coefficients in zigzag order
 *
 * @example
 * const zigzag = matrixToZigzag(quantMatrix);
 * // zigzag[0] is DC coefficient, zigzag[63] is highest frequency
 */
export function matrixToZigzag(matrix) {
  if (!Array.isArray(matrix) || matrix.length !== 8) {
    throw new Error("Expected matrix to be 8x8 array");
  }

  for (let i = 0; i < 8; i++) {
    if (!Array.isArray(matrix[i]) || matrix[i].length !== 8) {
      throw new Error(`Expected matrix row ${i} to be array of 8 elements`);
    }
  }

  const zigzag = new Array(64);

  for (let i = 0; i < 64; i++) {
    const row = Math.floor(ZIGZAG_ORDER[i] / 8);
    const col = ZIGZAG_ORDER[i] % 8;
    zigzag[i] = matrix[row][col];
  }

  return zigzag;
}

/**
 * Estimate JPEG quality factor from quantization table.
 * Uses correlation with standard tables to estimate original quality setting.
 *
 * @param {number[]} table - Quantization table in zigzag order
 * @param {boolean} isLuminance - Whether this is a luminance table
 * @returns {number} Estimated quality (1-100), or -1 if non-standard
 *
 * @example
 * const quality = estimateQuality(lumTable, true);
 * if (quality > 0) {
 *   console.log(`Estimated quality: ${quality}%`);
 * }
 */
export function estimateQuality(table, isLuminance = true) {
  if (!Array.isArray(table) || table.length !== 64) {
    throw new Error("Expected table to be array of 64 elements");
  }

  const standardTable = isLuminance ? STANDARD_LUMINANCE_TABLE : STANDARD_CHROMINANCE_TABLE;

  // Try to find quality by comparing with scaled standard tables
  for (let quality = 1; quality <= 100; quality++) {
    let scaleFactor;

    if (quality < 50) {
      scaleFactor = 5000 / quality;
    } else {
      scaleFactor = 200 - 2 * quality;
    }

    // Generate scaled table for this quality
    const scaledTable = standardTable.map((val) => {
      const scaled = Math.floor((val * scaleFactor + 50) / 100);
      return Math.max(1, Math.min(scaled, 255)); // Clamp to valid range
    });

    // Check if tables match (allow small tolerance for rounding)
    let matches = 0;
    for (let i = 0; i < 64; i++) {
      if (Math.abs(table[i] - scaledTable[i]) <= 1) {
        matches++;
      }
    }

    // If most coefficients match, this is likely the quality
    if (matches >= 60) {
      // Allow 4 mismatches for rounding differences
      return quality;
    }
  }

  return -1; // Non-standard table
}

/**
 * Validate quantization table values.
 * Ensures all values are positive and within precision limits.
 *
 * @param {number[]} table - Quantization table values
 * @param {number} precision - Table precision (0=8-bit, 1=16-bit)
 * @param {number} tableId - Table ID for error messages
 * @throws {Error} If validation fails
 *
 * @private
 */
function validateQuantizationTable(table, precision, tableId) {
  const maxValue = precision === 0 ? 255 : 65535;
  const precisionName = precision === 0 ? "8-bit" : "16-bit";

  for (let i = 0; i < table.length; i++) {
    const value = table[i];

    if (value <= 0) {
      throw new Error(`Table ${tableId}: quantization value at index ${i} is ${value} (must be > 0)`);
    }

    if (value > maxValue) {
      throw new Error(`Table ${tableId}: quantization value ${value} exceeds ${precisionName} limit (${maxValue})`);
    }
  }
}

/**
 * Parse single quantization table from DQT data.
 * Handles both 8-bit and 16-bit precision tables.
 *
 * @param {Uint8Array} data - DQT marker data
 * @param {number} offset - Current parsing offset
 * @returns {{table: Object, bytesRead: number}} Parsed table and bytes consumed
 * @throws {Error} If parsing fails
 *
 * @private
 */
function parseQuantizationTable(data, offset) {
  if (offset >= data.length) {
    throw new Error(`Cannot read table header at offset ${offset}: buffer too short`);
  }

  // Parse Pq|Tq byte
  const pqTq = data[offset++];
  const precision = (pqTq >> 4) & 0x0f; // Upper 4 bits
  const tableId = pqTq & 0x0f; // Lower 4 bits

  // Validate precision
  if (precision > 1) {
    throw new Error(`Invalid quantization table precision: ${precision} (must be 0 or 1)`);
  }

  // Validate table ID
  if (tableId > 3) {
    throw new Error(`Invalid quantization table ID: ${tableId} (must be 0-3)`);
  }

  // Calculate table size
  const elementSize = precision === 0 ? 1 : 2; // 8-bit or 16-bit
  const tableSize = 64 * elementSize;

  // Validate remaining data
  if (offset + tableSize > data.length) {
    throw new Error(`Incomplete quantization table ${tableId}: need ${tableSize} bytes, got ${data.length - offset}`);
  }

  // Read quantization values
  const values = new Array(64);
  for (let i = 0; i < 64; i++) {
    if (precision === 0) {
      values[i] = data[offset++];
    } else {
      values[i] = readUint16BE(data, offset);
      offset += 2;
    }
  }

  // Validate table values
  validateQuantizationTable(values, precision, tableId);

  // Create table object
  const table = {
    id: tableId,
    precision,
    values, // In zigzag order
    matrix: zigzagToMatrix(values), // In natural 8x8 order
    elementSize,
    estimatedQuality: estimateQuality(values, tableId === 0), // Assume table 0 is luminance
  };

  return {
    table,
    bytesRead: 1 + tableSize, // Pq|Tq byte + table data
  };
}

/**
 * Decode JPEG quantization tables from DQT marker data.
 * Parses all tables in the marker, handling mixed precisions.
 *
 * @param {Uint8Array} data - DQT marker data (without marker and length)
 * @returns {Object[]} Array of quantization table objects
 * @throws {Error} If decoding fails
 *
 * @example
 * const tables = decodeDQT(dqtData);
 * for (const table of tables) {
 *   console.log(`Table ${table.id}: ${table.precision ? '16-bit' : '8-bit'}`);
 *   console.log(`Quality: ${table.estimatedQuality}`);
 * }
 */
export function decodeDQT(data) {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("Expected data to be Uint8Array");
  }

  if (data.length === 0) {
    throw new Error("DQT data is empty");
  }

  const tables = [];
  let offset = 0;

  // Parse all tables in this DQT marker
  while (offset < data.length) {
    const { table, bytesRead } = parseQuantizationTable(data, offset);
    tables.push(table);
    offset += bytesRead;
  }

  // Validate we consumed all data
  if (offset !== data.length) {
    throw new Error(`DQT parsing error: expected to consume ${data.length} bytes, consumed ${offset}`);
  }

  return tables;
}

/**
 * Get quantization table by ID from array of tables.
 * Useful for looking up specific tables during decoding.
 *
 * @param {Array<{id: number}>} tables - Array of quantization tables
 * @param {number} tableId - Table ID to find (0-3)
 * @returns {Object|null} Table object or null if not found
 *
 * @example
 * const lumTable = getQuantizationTable(tables, 0);
 * const chromaTable = getQuantizationTable(tables, 1);
 */
export function getQuantizationTable(tables, tableId) {
  if (!Array.isArray(tables)) {
    throw new TypeError("Expected tables to be an array");
  }

  if (typeof tableId !== "number" || tableId < 0 || tableId > 3) {
    throw new Error("Expected tableId to be number 0-3");
  }

  return tables.find((table) => table.id === tableId) || null;
}

/**
 * Get summary information about quantization tables.
 * Provides human-readable overview for debugging.
 *
 * @param {Array<{id: number, precision: number, estimatedQuality: number}>} tables - Array of quantization tables
 * @returns {Object} Summary information
 *
 * @example
 * const summary = getQuantizationSummary(tables);
 * console.log(`Found ${summary.count} tables`);
 * console.log(`Precisions: ${summary.precisions.join(', ')}`);
 */
export function getQuantizationSummary(tables) {
  if (!Array.isArray(tables)) {
    throw new TypeError("Expected tables to be an array");
  }

  const ids = tables.map((t) => t.id).sort((a, b) => a - b);
  const precisions = [...new Set(tables.map((t) => (t.precision === 0 ? "8-bit" : "16-bit")))];
  const qualities = tables
    .map((t) => t.estimatedQuality)
    .filter((q) => q > 0)
    .sort((a, b) => a - b);

  return {
    count: tables.length,
    ids,
    precisions,
    qualities: qualities.length > 0 ? qualities : ["Custom"],
    hasStandardTables: qualities.length > 0,
    description: `${tables.length} quantization table${tables.length === 1 ? "" : "s"} (IDs: ${ids.join(", ")})`,
  };
}
