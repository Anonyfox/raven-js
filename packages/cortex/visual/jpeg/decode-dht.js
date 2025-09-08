/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG Huffman Table (DHT) decoder implementation.
 *
 * Implements ITU-T T.81 Section B.2.4.2 Huffman table parsing with canonical
 * tree construction, symbol validation, and Kraft inequality verification.
 * Handles both DC and AC tables with full symbol range validation.
 */

/**
 * Maximum number of Huffman codes allowed in JPEG.
 * Based on ITU-T T.81 specification limits.
 *
 * @type {number}
 */
export const MAX_HUFFMAN_CODES = 65535;

/**
 * Maximum Huffman code length in JPEG (16 bits).
 * ITU-T T.81 Section B.2.4.2 constraint.
 *
 * @type {number}
 */
export const MAX_CODE_LENGTH = 16;

/**
 * Valid symbol ranges for DC Huffman tables.
 * DC symbols represent difference categories (0-11).
 *
 * @type {{min: number, max: number}}
 */
export const DC_SYMBOL_RANGE = { min: 0, max: 11 };

/**
 * Valid symbol ranges for AC Huffman tables.
 * AC symbols represent run/size combinations (0-255).
 *
 * @type {{min: number, max: number}}
 */
export const AC_SYMBOL_RANGE = { min: 0, max: 255 };

/**
 * Standard JPEG DC Huffman table for luminance.
 * Used for quality assessment and table recognition.
 *
 * @type {{lengths: number[], symbols: number[]}}
 */
export const STANDARD_DC_LUMINANCE = {
  lengths: [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  symbols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

/**
 * Standard JPEG AC Huffman table for luminance.
 * Used for quality assessment and table recognition.
 *
 * @type {{lengths: number[], symbols: number[]}}
 */
export const STANDARD_AC_LUMINANCE = {
  lengths: [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125],
  symbols: [
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14,
    0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09,
    0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a,
    0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65,
    0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88,
    0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9,
    0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca,
    0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea,
    0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
  ],
};

/**
 * Validate Huffman table code lengths using Kraft inequality.
 * Ensures the code lengths can form a valid prefix-free code.
 *
 * @param {number[]} lengths - Array of 16 length counts
 * @returns {boolean} True if lengths satisfy Kraft inequality
 *
 * @example
 * const valid = validateKraftInequality([0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]);
 * console.log(valid); // true for standard DC table
 */
export function validateKraftInequality(lengths) {
  if (!Array.isArray(lengths) || lengths.length !== 16) {
    throw new Error("Expected lengths to be array of 16 elements");
  }

  let sum = 0;
  for (let i = 0; i < 16; i++) {
    const codeLength = i + 1;
    const codeCount = lengths[i];

    if (codeCount < 0) {
      return false;
    }

    // Add contribution: count * 2^(-length)
    sum += codeCount * 2 ** -codeLength;
  }

  // Kraft inequality: sum must not exceed 1.0
  return sum <= 1.0 + Number.EPSILON; // Allow small floating point tolerance
}

/**
 * Build canonical Huffman codes from code lengths.
 * Generates deterministic codes following JPEG canonical construction.
 *
 * @param {number[]} lengths - Array of 16 length counts
 * @param {number[]} symbols - Symbol values in length order
 * @returns {{codes: Map<number, {code: number, length: number}>, maxLength: number}} Canonical codes and max length
 *
 * @example
 * const {codes, maxLength} = buildCanonicalCodes(lengths, symbols);
 * const symbolInfo = codes.get(0); // Get code info for symbol 0
 * console.log(`Symbol 0: ${symbolInfo.code.toString(2).padStart(symbolInfo.length, '0')}`);
 */
export function buildCanonicalCodes(lengths, symbols) {
  if (!Array.isArray(lengths) || lengths.length !== 16) {
    throw new Error("Expected lengths to be array of 16 elements");
  }

  if (!Array.isArray(symbols)) {
    throw new Error("Expected symbols to be an array");
  }

  // Validate total symbol count matches length specification
  const totalSymbols = lengths.reduce((sum, count) => sum + count, 0);
  if (symbols.length !== totalSymbols) {
    throw new Error(`Symbol count mismatch: expected ${totalSymbols}, got ${symbols.length}`);
  }

  const codes = new Map();
  let code = 0;
  let symbolIndex = 0;
  let maxLength = 0;

  // Generate canonical codes
  for (let length = 1; length <= 16; length++) {
    const count = lengths[length - 1];

    for (let i = 0; i < count; i++) {
      if (symbolIndex >= symbols.length) {
        throw new Error("Not enough symbols for specified lengths");
      }

      const symbol = symbols[symbolIndex++];
      codes.set(symbol, {
        code,
        length,
      });

      maxLength = Math.max(maxLength, length);
      code++;
    }

    // Left-shift for next length (only if there are more lengths to process)
    if (length < 16) {
      code <<= 1;
    }
  }

  return { codes, maxLength };
}

/**
 * Create lookup table for fast Huffman decoding.
 * Builds direct lookup for codes up to specified bit width.
 *
 * @param {Map<number, {code: number, length: number}>} codes - Canonical codes map
 * @param {number} maxLookupBits - Maximum bits for direct lookup (default 8)
 * @returns {{lookup: number[], maxCode: number[]}} Fast lookup table and max codes per length
 *
 * @example
 * const {lookup, maxCode} = createLookupTable(codes, 8);
 * // lookup[bits] gives symbol for 8-bit prefix, or -1 if longer code needed
 */
export function createLookupTable(codes, maxLookupBits = 8) {
  const lookupSize = 1 << maxLookupBits;
  const lookup = new Array(lookupSize).fill(-1);
  const maxCode = new Array(17).fill(-1); // Index 0 unused, 1-16 for code lengths

  // Build direct lookup for short codes
  for (const [symbol, { code, length }] of codes) {
    maxCode[length] = Math.max(maxCode[length], code);

    if (length <= maxLookupBits) {
      // Fill all possible suffixes for this code
      const shift = maxLookupBits - length;
      const base = code << shift;
      const count = 1 << shift;

      for (let i = 0; i < count; i++) {
        lookup[base + i] = symbol;
      }
    }
  }

  return { lookup, maxCode };
}

/**
 * Validate Huffman table symbols for DC or AC table.
 * Ensures symbols are within valid ranges for table type.
 *
 * @param {number[]} symbols - Symbol values to validate
 * @param {boolean} isDC - True for DC table, false for AC table
 * @param {number} tableId - Table ID for error messages
 * @throws {Error} If validation fails
 *
 * @private
 */
function validateHuffmanSymbols(symbols, isDC, tableId) {
  const range = isDC ? DC_SYMBOL_RANGE : AC_SYMBOL_RANGE;
  const tableName = isDC ? "DC" : "AC";

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];

    if (!Number.isInteger(symbol) || symbol < range.min || symbol > range.max) {
      throw new Error(
        `${tableName} table ${tableId}: invalid symbol ${symbol} at index ${i} (valid range: ${range.min}-${range.max})`
      );
    }
  }

  // Check for duplicate symbols
  const uniqueSymbols = new Set(symbols);
  if (uniqueSymbols.size !== symbols.length) {
    throw new Error(`${tableName} table ${tableId}: duplicate symbols found`);
  }
}

/**
 * Parse single Huffman table from DHT data.
 * Handles both DC and AC tables with full validation.
 *
 * @param {Uint8Array} data - DHT marker data
 * @param {number} offset - Current parsing offset
 * @returns {{table: Object, bytesRead: number}} Parsed table and bytes consumed
 * @throws {Error} If parsing fails
 *
 * @private
 */
function parseHuffmanTable(data, offset) {
  if (offset >= data.length) {
    throw new Error(`Cannot read table header at offset ${offset}: buffer too short`);
  }

  // Parse Tc|Th byte
  const tcTh = data[offset++];
  const tableClass = (tcTh >> 4) & 0x0f; // Upper 4 bits
  const tableId = tcTh & 0x0f; // Lower 4 bits

  // Validate table class
  if (tableClass > 1) {
    throw new Error(`Invalid Huffman table class: ${tableClass} (must be 0 for DC or 1 for AC)`);
  }

  // Validate table ID
  if (tableId > 3) {
    throw new Error(`Invalid Huffman table ID: ${tableId} (must be 0-3)`);
  }

  // Read 16 code length counts
  if (offset + 16 > data.length) {
    throw new Error(`Incomplete Huffman table ${tableId}: need 16 length bytes, got ${data.length - offset}`);
  }

  const lengths = Array.from(data.slice(offset, offset + 16));
  offset += 16;

  // Calculate total number of symbols
  const totalSymbols = lengths.reduce((sum, count) => sum + count, 0);

  // Validate symbol count
  if (totalSymbols === 0) {
    throw new Error(`Huffman table ${tableId}: no symbols defined`);
  }

  if (totalSymbols > MAX_HUFFMAN_CODES) {
    throw new Error(`Huffman table ${tableId}: too many symbols (${totalSymbols} > ${MAX_HUFFMAN_CODES})`);
  }

  // Validate Kraft inequality
  if (!validateKraftInequality(lengths)) {
    throw new Error(`Huffman table ${tableId}: code lengths violate Kraft inequality`);
  }

  // Read symbol values
  if (offset + totalSymbols > data.length) {
    throw new Error(
      `Incomplete Huffman table ${tableId}: need ${totalSymbols} symbol bytes, got ${data.length - offset}`
    );
  }

  const symbols = Array.from(data.slice(offset, offset + totalSymbols));
  offset += totalSymbols;

  // Validate symbols for table type
  const isDC = tableClass === 0;
  validateHuffmanSymbols(symbols, isDC, tableId);

  // Build canonical codes
  const { codes, maxLength } = buildCanonicalCodes(lengths, symbols);

  // Create fast lookup table
  const { lookup, maxCode } = createLookupTable(codes);

  // Create table object
  const table = {
    id: tableId,
    class: tableClass,
    isDC,
    lengths,
    symbols,
    totalSymbols,
    codes,
    maxLength,
    lookup,
    maxCode,
    isStandard: isStandardTable(lengths, symbols, isDC),
  };

  return {
    table,
    bytesRead: 1 + 16 + totalSymbols, // Tc|Th + lengths + symbols
  };
}

/**
 * Check if table matches standard JPEG Huffman tables.
 * Used for quality assessment and optimization detection.
 *
 * @param {number[]} lengths - Code length counts
 * @param {number[]} symbols - Symbol values
 * @param {boolean} isDC - True for DC table
 * @returns {boolean} True if matches standard table
 *
 * @private
 */
function isStandardTable(lengths, symbols, isDC) {
  const standard = isDC ? STANDARD_DC_LUMINANCE : STANDARD_AC_LUMINANCE;

  // Compare lengths
  if (lengths.length !== standard.lengths.length) {
    return false;
  }

  for (let i = 0; i < lengths.length; i++) {
    if (lengths[i] !== standard.lengths[i]) {
      return false;
    }
  }

  // Compare symbols
  if (symbols.length !== standard.symbols.length) {
    return false;
  }

  for (let i = 0; i < symbols.length; i++) {
    if (symbols[i] !== standard.symbols[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Decode JPEG Huffman tables from DHT marker data.
 * Parses all tables in the marker, handling mixed DC/AC tables.
 *
 * @param {Uint8Array} data - DHT marker data (without marker and length)
 * @returns {Object[]} Array of Huffman table objects
 * @throws {Error} If decoding fails
 *
 * @example
 * const tables = decodeDHT(dhtData);
 * for (const table of tables) {
 *   console.log(`Table ${table.id}: ${table.isDC ? 'DC' : 'AC'}`);
 *   console.log(`Symbols: ${table.totalSymbols}, Max length: ${table.maxLength}`);
 * }
 */
export function decodeDHT(data) {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("Expected data to be Uint8Array");
  }

  if (data.length === 0) {
    throw new Error("DHT data is empty");
  }

  const tables = [];
  let offset = 0;

  // Parse all tables in this DHT marker
  while (offset < data.length) {
    const { table, bytesRead } = parseHuffmanTable(data, offset);
    tables.push(table);
    offset += bytesRead;
  }

  // Validate we consumed all data
  if (offset !== data.length) {
    throw new Error(`DHT parsing error: expected to consume ${data.length} bytes, consumed ${offset}`);
  }

  return tables;
}

/**
 * Get Huffman table by class and ID from array of tables.
 * Useful for looking up specific tables during decoding.
 *
 * @param {Array<{class: number, id: number}>} tables - Array of Huffman tables
 * @param {number} tableClass - Table class (0=DC, 1=AC)
 * @param {number} tableId - Table ID (0-3)
 * @returns {Object|null} Table object or null if not found
 *
 * @example
 * const dcTable = getHuffmanTable(tables, 0, 0); // DC table 0
 * const acTable = getHuffmanTable(tables, 1, 0); // AC table 0
 */
export function getHuffmanTable(tables, tableClass, tableId) {
  if (!Array.isArray(tables)) {
    throw new TypeError("Expected tables to be an array");
  }

  if (typeof tableClass !== "number" || tableClass < 0 || tableClass > 1) {
    throw new Error("Expected tableClass to be 0 (DC) or 1 (AC)");
  }

  if (typeof tableId !== "number" || tableId < 0 || tableId > 3) {
    throw new Error("Expected tableId to be number 0-3");
  }

  return tables.find((table) => table.class === tableClass && table.id === tableId) || null;
}

/**
 * Get summary information about Huffman tables.
 * Provides human-readable overview for debugging.
 *
 * @param {Array<{class: number, id: number, totalSymbols: number, maxLength: number, isStandard: boolean}>} tables - Array of Huffman tables
 * @returns {Object} Summary information
 *
 * @example
 * const summary = getHuffmanSummary(tables);
 * console.log(`Found ${summary.count} tables`);
 * console.log(`DC tables: ${summary.dcTables.join(', ')}`);
 * console.log(`AC tables: ${summary.acTables.join(', ')}`);
 */
export function getHuffmanSummary(tables) {
  if (!Array.isArray(tables)) {
    throw new TypeError("Expected tables to be an array");
  }

  const dcTables = tables.filter((t) => t.class === 0).map((t) => t.id);
  const acTables = tables.filter((t) => t.class === 1).map((t) => t.id);
  const standardCount = tables.filter((t) => t.isStandard).length;
  const totalSymbols = tables.reduce((sum, t) => sum + t.totalSymbols, 0);
  const maxLength = Math.max(...tables.map((t) => t.maxLength), 0);

  return {
    count: tables.length,
    dcTables: dcTables.sort(),
    acTables: acTables.sort(),
    standardCount,
    customCount: tables.length - standardCount,
    totalSymbols,
    maxLength,
    hasStandardTables: standardCount > 0,
    description: `${tables.length} Huffman table${tables.length === 1 ? "" : "s"} (${dcTables.length} DC, ${acTables.length} AC)`,
  };
}
