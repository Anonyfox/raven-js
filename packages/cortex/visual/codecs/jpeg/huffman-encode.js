/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Huffman entropy encoding with optimal table generation for JPEG encoding.
 *
 * Implements ITU-T T.81 Annex F entropy encoding and Annex C canonical Huffman
 * table construction. Converts quantized DCT coefficients into compressed bit
 * streams using optimal variable-length codes. Supports DC differential encoding,
 * AC run-length encoding, and automatic optimal table generation from statistics.
 */

/**
 * Huffman table types for DC and AC coefficients.
 * Different tables are used for different coefficient types.
 */
export const HUFFMAN_TABLE_TYPES = {
  /** DC coefficient tables */
  DC: "dc",
  /** AC coefficient tables */
  AC: "ac",
};

/**
 * Huffman table classes for luminance and chrominance.
 * Different tables optimize for different component characteristics.
 */
export const HUFFMAN_TABLE_CLASSES = {
  /** Luminance (Y) component tables */
  LUMINANCE: "luminance",
  /** Chrominance (Cb, Cr) component tables */
  CHROMINANCE: "chrominance",
};

/**
 * Coefficient magnitude categories for Huffman encoding.
 * Categories represent ranges of coefficient magnitudes.
 */
export const COEFFICIENT_CATEGORIES = {
  /** Category 0: coefficient = 0 */
  CAT_0: 0,
  /** Category 1: coefficient = ±1 */
  CAT_1: 1,
  /** Category 2: coefficient = ±2,±3 */
  CAT_2: 2,
  /** Category 3: coefficient = ±4...±7 */
  CAT_3: 3,
  /** Category 4: coefficient = ±8...±15 */
  CAT_4: 4,
  /** Category 5: coefficient = ±16...±31 */
  CAT_5: 5,
  /** Category 6: coefficient = ±32...±63 */
  CAT_6: 6,
  /** Category 7: coefficient = ±64...±127 */
  CAT_7: 7,
  /** Category 8: coefficient = ±128...±255 */
  CAT_8: 8,
  /** Category 9: coefficient = ±256...±511 */
  CAT_9: 9,
  /** Category 10: coefficient = ±512...±1023 */
  CAT_10: 10,
  /** Category 11: coefficient = ±1024...±2047 */
  CAT_11: 11,
  /** Category 12: coefficient = ±2048...±4095 */
  CAT_12: 12,
  /** Category 13: coefficient = ±4096...±8191 */
  CAT_13: 13,
  /** Category 14: coefficient = ±8192...±16383 */
  CAT_14: 14,
  /** Category 15: coefficient = ±16384...±32767 */
  CAT_15: 15,
};

/**
 * Special AC coefficient symbols for run-length encoding.
 * Special symbols handle common AC coefficient patterns.
 */
export const SPECIAL_AC_SYMBOLS = {
  /** End of Block - all remaining coefficients are zero */
  EOB: { run: 0, category: 0 },
  /** Zero Run Length - 16 consecutive zeros */
  ZRL: { run: 15, category: 0 },
};

/**
 * Default Huffman encoding options.
 * Standard settings for JPEG Huffman encoding.
 */
export const DEFAULT_HUFFMAN_OPTIONS = {
  generateOptimalTables: true,
  useStandardTables: false,
  trackStatistics: true,
  validateOutput: true,
  enableByteStuffing: true,
  bufferSize: 65536, // 64KB bit buffer
};

/**
 * Standard JPEG DC Huffman table for luminance (ITU-T T.81 Annex K).
 * Optimized for typical luminance DC coefficient distributions.
 */
export const STANDARD_DC_LUMINANCE_TABLE = {
  codeLengths: [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  symbols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

/**
 * Standard JPEG DC Huffman table for chrominance (ITU-T T.81 Annex K).
 * Optimized for typical chrominance DC coefficient distributions.
 */
export const STANDARD_DC_CHROMINANCE_TABLE = {
  codeLengths: [0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  symbols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

/**
 * Standard JPEG AC Huffman table for luminance (ITU-T T.81 Annex K).
 * Optimized for typical luminance AC coefficient distributions.
 */
export const STANDARD_AC_LUMINANCE_TABLE = {
  codeLengths: [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125],
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
 * Standard JPEG AC Huffman table for chrominance (ITU-T T.81 Annex K).
 * Optimized for typical chrominance AC coefficient distributions.
 */
export const STANDARD_AC_CHROMINANCE_TABLE = {
  codeLengths: [0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 119],
  symbols: [
    0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71, 0x13, 0x22, 0x32,
    0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16,
    0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39,
    0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64,
    0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86,
    0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
    0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8,
    0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9,
    0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
  ],
};

/**
 * Determine coefficient magnitude category.
 * Classifies coefficient magnitude into JPEG categories (0-15).
 *
 * @param {number} coefficient - Coefficient value
 * @returns {number} Category (0-15)
 */
export function getCoefficientCategory(coefficient) {
  const absValue = Math.abs(coefficient);

  if (absValue === 0) return COEFFICIENT_CATEGORIES.CAT_0;
  if (absValue === 1) return COEFFICIENT_CATEGORIES.CAT_1;
  if (absValue <= 3) return COEFFICIENT_CATEGORIES.CAT_2;
  if (absValue <= 7) return COEFFICIENT_CATEGORIES.CAT_3;
  if (absValue <= 15) return COEFFICIENT_CATEGORIES.CAT_4;
  if (absValue <= 31) return COEFFICIENT_CATEGORIES.CAT_5;
  if (absValue <= 63) return COEFFICIENT_CATEGORIES.CAT_6;
  if (absValue <= 127) return COEFFICIENT_CATEGORIES.CAT_7;
  if (absValue <= 255) return COEFFICIENT_CATEGORIES.CAT_8;
  if (absValue <= 511) return COEFFICIENT_CATEGORIES.CAT_9;
  if (absValue <= 1023) return COEFFICIENT_CATEGORIES.CAT_10;
  if (absValue <= 2047) return COEFFICIENT_CATEGORIES.CAT_11;
  if (absValue <= 4095) return COEFFICIENT_CATEGORIES.CAT_12;
  if (absValue <= 8191) return COEFFICIENT_CATEGORIES.CAT_13;
  if (absValue <= 16383) return COEFFICIENT_CATEGORIES.CAT_14;
  if (absValue <= 32767) return COEFFICIENT_CATEGORIES.CAT_15;

  throw new Error(`Coefficient magnitude too large: ${absValue} (max 32767)`);
}

/**
 * Encode coefficient magnitude within category.
 * Generates additional bits for exact magnitude representation.
 *
 * @param {number} coefficient - Coefficient value
 * @param {number} category - Magnitude category
 * @returns {{
 *   bits: number,
 *   length: number
 * }} Additional bits and bit length
 */
export function encodeCoefficientMagnitude(coefficient, category) {
  if (category === 0) {
    return { bits: 0, length: 0 };
  }

  const absValue = Math.abs(coefficient);
  let bits;

  if (coefficient > 0) {
    // Positive coefficients use their binary representation
    bits = absValue;
  } else {
    // Negative coefficients use one's complement within category range
    const maxInCategory = (1 << category) - 1;
    bits = maxInCategory - absValue;
  }

  return { bits, length: category };
}

/**
 * Create AC coefficient symbol from run and category.
 * Combines zero run-length and coefficient category into symbol.
 *
 * @param {number} run - Zero run-length (0-15)
 * @param {number} category - Coefficient category (0-15)
 * @returns {number} AC symbol (0-255)
 */
export function createACSymbol(run, category) {
  if (run < 0 || run > 15) {
    throw new Error(`Invalid run length: ${run} (must be 0-15)`);
  }
  if (category < 0 || category > 15) {
    throw new Error(`Invalid category: ${category} (must be 0-15)`);
  }

  return (run << 4) | category;
}

/**
 * Parse AC coefficient symbol into run and category.
 * Extracts zero run-length and coefficient category from symbol.
 *
 * @param {number} symbol - AC symbol (0-255)
 * @returns {{
 *   run: number,
 *   category: number
 * }} Run-length and category
 */
export function parseACSymbol(symbol) {
  if (symbol < 0 || symbol > 255) {
    throw new Error(`Invalid AC symbol: ${symbol} (must be 0-255)`);
  }

  return {
    run: (symbol >> 4) & 0x0f,
    category: symbol & 0x0f,
  };
}

/**
 * Collect symbol statistics from quantized coefficient blocks.
 * Analyzes coefficient patterns to build optimal Huffman tables.
 *
 * @param {Int16Array[]} coefficientBlocks - Array of quantized coefficient blocks
 * @param {string} _componentClass - Component class (luminance/chrominance)
 * @returns {{
 *   dcStatistics: Map<number, number>,
 *   acStatistics: Map<number, number>,
 *   totalBlocks: number,
 *   totalDCCoefficients: number,
 *   totalACCoefficients: number,
 *   sparsityRatio: number
 * }} Symbol frequency statistics
 */
export function collectSymbolStatistics(coefficientBlocks, _componentClass = HUFFMAN_TABLE_CLASSES.LUMINANCE) {
  if (!Array.isArray(coefficientBlocks)) {
    throw new Error("Coefficient blocks must be an array");
  }

  const dcStatistics = new Map();
  const acStatistics = new Map();
  let totalDCCoefficients = 0;
  let totalACCoefficients = 0;
  let totalZeroACCoefficients = 0;
  let previousDC = 0; // DC prediction chain

  for (let blockIndex = 0; blockIndex < coefficientBlocks.length; blockIndex++) {
    const block = coefficientBlocks[blockIndex];

    if (!(block instanceof Int16Array) || block.length !== 64) {
      throw new Error(`Invalid coefficient block at index ${blockIndex}: must be Int16Array with 64 values`);
    }

    // Process DC coefficient (differential encoding)
    const currentDC = block[0];
    const dcDifference = currentDC - previousDC;
    const dcCategory = getCoefficientCategory(dcDifference);

    dcStatistics.set(dcCategory, (dcStatistics.get(dcCategory) || 0) + 1);
    totalDCCoefficients++;
    previousDC = currentDC;

    // Process AC coefficients (run-length encoding)
    let zeroRun = 0;
    let hasNonZeroAC = false;

    for (let i = 1; i < 64; i++) {
      const coefficient = block[i];

      if (coefficient === 0) {
        zeroRun++;
        totalZeroACCoefficients++;
      } else {
        hasNonZeroAC = true;

        // Encode accumulated zero runs
        while (zeroRun >= 16) {
          // ZRL symbol for runs of 16+ zeros
          const zrlSymbol = createACSymbol(SPECIAL_AC_SYMBOLS.ZRL.run, SPECIAL_AC_SYMBOLS.ZRL.category);
          acStatistics.set(zrlSymbol, (acStatistics.get(zrlSymbol) || 0) + 1);
          zeroRun -= 16;
        }

        // Encode non-zero coefficient
        const category = getCoefficientCategory(coefficient);
        const symbol = createACSymbol(zeroRun, category);
        acStatistics.set(symbol, (acStatistics.get(symbol) || 0) + 1);
        totalACCoefficients++;
        zeroRun = 0;
      }
    }

    // Add EOB if there were any non-zero AC coefficients
    if (hasNonZeroAC) {
      const eobSymbol = createACSymbol(SPECIAL_AC_SYMBOLS.EOB.run, SPECIAL_AC_SYMBOLS.EOB.category);
      acStatistics.set(eobSymbol, (acStatistics.get(eobSymbol) || 0) + 1);
    }
  }

  const totalACValues = totalACCoefficients + totalZeroACCoefficients;
  const sparsityRatio = totalACValues > 0 ? totalZeroACCoefficients / totalACValues : 0;

  return {
    dcStatistics,
    acStatistics,
    totalBlocks: coefficientBlocks.length,
    totalDCCoefficients,
    totalACCoefficients,
    sparsityRatio: Math.round(sparsityRatio * 10000) / 100, // Percentage with 2 decimal places
  };
}

/**
 * Generate optimal Huffman table from symbol statistics.
 * Creates canonical Huffman table using ITU-T T.81 Annex C algorithm.
 *
 * @param {Map<number, number>} statistics - Symbol frequency map
 * @param {number} maxCodeLength - Maximum code length (16 for JPEG)
 * @returns {{
 *   codeLengths: number[],
 *   symbols: number[],
 *   codes: Map<number, {code: number, length: number}>,
 *   averageCodeLength: number,
 *   compressionRatio: number
 * }} Canonical Huffman table
 */
export function generateOptimalHuffmanTable(statistics, maxCodeLength = 16) {
  if (!(statistics instanceof Map)) {
    throw new Error("Statistics must be a Map");
  }

  if (statistics.size === 0) {
    throw new Error("Cannot generate Huffman table from empty statistics");
  }

  if (maxCodeLength < 1 || maxCodeLength > 16) {
    throw new Error("Maximum code length must be between 1 and 16");
  }

  // Convert statistics to frequency array
  const symbols = Array.from(statistics.keys()).sort((a, b) => a - b);
  const frequencies = symbols.map((symbol) => statistics.get(symbol));

  // Handle single symbol case
  if (symbols.length === 1) {
    const codeLengths = new Array(17).fill(0);
    codeLengths[1] = 1; // Single symbol gets 1-bit code
    const codes = new Map();
    codes.set(symbols[0], { code: 0, length: 1 });

    return {
      codeLengths,
      symbols,
      codes,
      averageCodeLength: 1,
      compressionRatio: 1,
    };
  }

  // Build Huffman tree using priority queue (min-heap)
  const heap = frequencies.map((freq, index) => ({
    frequency: freq,
    symbol: symbols[index],
    left: null,
    right: null,
  }));

  // Sort by frequency (ascending)
  heap.sort((a, b) => a.frequency - b.frequency);

  // Build tree by combining nodes
  while (heap.length > 1) {
    const left = heap.shift();
    const right = heap.shift();

    const combined = {
      frequency: left.frequency + right.frequency,
      /** @type {number|null} */
      symbol: null,
      left,
      right,
    };

    // Insert in correct position to maintain sorted order
    let insertIndex = 0;
    while (insertIndex < heap.length && heap[insertIndex].frequency <= combined.frequency) {
      insertIndex++;
    }
    heap.splice(insertIndex, 0, combined);
  }

  const root = heap[0];

  // Calculate code lengths for each symbol
  const symbolCodeLengths = new Map();

  /**
   * @param {any} node
   * @param {number} depth
   */
  function calculateCodeLengths(node, depth = 0) {
    if (node.symbol !== null) {
      // Leaf node - store code length
      symbolCodeLengths.set(node.symbol, Math.min(depth, maxCodeLength));
    } else {
      // Internal node - recurse
      if (node.left) calculateCodeLengths(node.left, depth + 1);
      if (node.right) calculateCodeLengths(node.right, depth + 1);
    }
  }

  calculateCodeLengths(root);

  // Handle code length limit enforcement
  if (Math.max(...symbolCodeLengths.values()) > maxCodeLength) {
    // Implement Package-Merge algorithm for length-limited codes
    // For simplicity, we'll use a heuristic approach
    for (const [symbol, length] of symbolCodeLengths.entries()) {
      if (length > maxCodeLength) {
        symbolCodeLengths.set(symbol, maxCodeLength);
      }
    }
  }

  // Create canonical Huffman codes (ITU-T T.81 Annex C)
  const codeLengths = new Array(17).fill(0); // Index 0 unused, 1-16 for code lengths
  const sortedSymbols = [];

  // Count symbols per code length
  for (const [symbol, length] of symbolCodeLengths.entries()) {
    codeLengths[length]++;
    sortedSymbols.push({ symbol, length });
  }

  // Sort symbols by code length, then by symbol value
  sortedSymbols.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    return a.symbol - b.symbol;
  });

  // Generate canonical codes
  const codes = new Map();
  let code = 0;

  for (let length = 1; length <= maxCodeLength; length++) {
    for (const { symbol, length: symLength } of sortedSymbols) {
      if (symLength === length) {
        codes.set(symbol, { code, length });
        code++;
      }
    }
    code <<= 1; // Left shift for next length
  }

  // Calculate compression metrics
  let totalBits = 0;
  let totalFrequency = 0;

  for (const [symbol, frequency] of statistics.entries()) {
    const codeInfo = codes.get(symbol);
    if (codeInfo) {
      totalBits += frequency * codeInfo.length;
      totalFrequency += frequency;
    }
  }

  const averageCodeLength = totalFrequency > 0 ? totalBits / totalFrequency : 0;
  const compressionRatio = totalFrequency > 0 ? (totalFrequency * 8) / totalBits : 1; // Assume 8-bit symbols

  return {
    codeLengths,
    symbols: sortedSymbols.map((s) => s.symbol),
    codes,
    averageCodeLength: Math.round(averageCodeLength * 100) / 100,
    compressionRatio: Math.round(compressionRatio * 100) / 100,
  };
}

/**
 * Bit stream writer for Huffman encoded data.
 * Efficiently packs variable-length codes into byte stream.
 */
export class BitStreamWriter {
  /**
   * Create bit stream writer.
   *
   * @param {number} bufferSize - Initial buffer size in bytes
   */
  constructor(bufferSize = 65536) {
    /** @type {Uint8Array} */
    this.buffer = new Uint8Array(bufferSize);
    /** @type {number} */
    this.bytePosition = 0;
    /** @type {number} */
    this.bitPosition = 0;
    /** @type {number} */
    this.currentByte = 0;
    /** @type {boolean} */
    this.enableByteStuffing = true;
    /** @type {number} */
    this.totalBitsWritten = 0;
    /** @type {number} */
    this.bytesStuffed = 0;
  }

  /**
   * Write bits to stream.
   *
   * @param {number} bits - Bits to write
   * @param {number} length - Number of bits to write
   */
  writeBits(bits, length) {
    if (length < 0 || length > 32) {
      throw new Error(`Invalid bit length: ${length} (must be 0-32)`);
    }

    if (length === 0) return;

    // Mask bits to ensure only specified length is used
    const mask = (1 << length) - 1;
    bits = bits & mask;

    this.totalBitsWritten += length;

    let remainingBits = length;

    while (remainingBits > 0) {
      const bitsToWrite = Math.min(remainingBits, 8 - this.bitPosition);
      const bitShift = remainingBits - bitsToWrite;
      const bitsValue = (bits >> bitShift) & ((1 << bitsToWrite) - 1);

      this.currentByte = (this.currentByte << bitsToWrite) | bitsValue;
      this.bitPosition += bitsToWrite;
      remainingBits -= bitsToWrite;

      if (this.bitPosition === 8) {
        this._flushByte();
      }
    }
  }

  /**
   * Flush current byte to buffer.
   * @private
   */
  _flushByte() {
    // Ensure buffer has space
    if (this.bytePosition >= this.buffer.length) {
      this._expandBuffer();
    }

    this.buffer[this.bytePosition] = this.currentByte;
    this.bytePosition++;

    // Handle byte stuffing for 0xFF bytes
    if (this.enableByteStuffing && this.currentByte === 0xff) {
      // Ensure buffer has space for stuffing byte
      if (this.bytePosition >= this.buffer.length) {
        this._expandBuffer();
      }

      this.buffer[this.bytePosition] = 0x00; // Stuff with 0x00
      this.bytePosition++;
      this.bytesStuffed++;
    }

    this.currentByte = 0;
    this.bitPosition = 0;
  }

  /**
   * Expand buffer when full.
   * @private
   */
  _expandBuffer() {
    const newBuffer = new Uint8Array(this.buffer.length * 2);
    newBuffer.set(this.buffer);
    this.buffer = newBuffer;
  }

  /**
   * Flush remaining bits and return final byte array.
   *
   * @returns {Uint8Array} Encoded byte stream
   */
  flush() {
    // Pad remaining bits with 1s (JPEG standard)
    if (this.bitPosition > 0) {
      const paddingBits = 8 - this.bitPosition;
      const padding = (1 << paddingBits) - 1; // All 1s
      this.currentByte = (this.currentByte << paddingBits) | padding;
      this._flushByte();
    }

    return this.buffer.slice(0, this.bytePosition);
  }

  /**
   * Get current stream statistics.
   *
   * @returns {{
   *   totalBitsWritten: number,
   *   totalBytesWritten: number,
   *   bytesStuffed: number,
   *   compressionRatio: number,
   *   bitsPerByte: number
   * }} Stream statistics
   */
  getStatistics() {
    const totalBytesWritten = this.bytePosition + (this.bitPosition > 0 ? 1 : 0);
    const compressionRatio = this.totalBitsWritten > 0 ? this.totalBitsWritten / 8 / totalBytesWritten : 1;
    const bitsPerByte = totalBytesWritten > 0 ? this.totalBitsWritten / totalBytesWritten : 0;

    return {
      totalBitsWritten: this.totalBitsWritten,
      totalBytesWritten,
      bytesStuffed: this.bytesStuffed,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      bitsPerByte: Math.round(bitsPerByte * 100) / 100,
    };
  }

  /**
   * Reset writer for reuse.
   */
  reset() {
    this.bytePosition = 0;
    this.bitPosition = 0;
    this.currentByte = 0;
    this.totalBitsWritten = 0;
    this.bytesStuffed = 0;
  }
}

/**
 * Encode quantized coefficient blocks using Huffman encoding.
 * Converts DCT coefficients to compressed bit stream.
 *
 * @param {Int16Array[]} coefficientBlocks - Array of quantized coefficient blocks
 * @param {{
 *   dcTable: {codes: Map<number, {code: number, length: number}>},
 *   acTable: {codes: Map<number, {code: number, length: number}>}
 * }} huffmanTables - Huffman encoding tables
 * @param {Object} options - Encoding options
 * @returns {{
 *   encodedData: Uint8Array,
 *   statistics: {
 *     totalBlocks: number,
 *     totalBits: number,
 *     totalBytes: number,
 *     compressionRatio: number,
 *     averageBitsPerBlock: number,
 *     dcCoefficients: number,
 *     acCoefficients: number,
 *     eobSymbols: number,
 *     zrlSymbols: number,
 *     bytesStuffed: number
 *   }
 * }} Encoded data and statistics
 */
export function encodeHuffmanBlocks(coefficientBlocks, huffmanTables, options = {}) {
  const opts = { ...DEFAULT_HUFFMAN_OPTIONS, ...options };

  if (!Array.isArray(coefficientBlocks)) {
    throw new Error("Coefficient blocks must be an array");
  }

  if (!huffmanTables || !huffmanTables.dcTable || !huffmanTables.acTable) {
    throw new Error("Huffman tables must include dcTable and acTable");
  }

  const writer = new BitStreamWriter(opts.bufferSize);
  writer.enableByteStuffing = opts.enableByteStuffing;

  let previousDC = 0; // DC prediction chain
  let dcCoefficients = 0;
  let acCoefficients = 0;
  let eobSymbols = 0;
  let zrlSymbols = 0;

  for (let blockIndex = 0; blockIndex < coefficientBlocks.length; blockIndex++) {
    const block = coefficientBlocks[blockIndex];

    if (!(block instanceof Int16Array) || block.length !== 64) {
      throw new Error(`Invalid coefficient block at index ${blockIndex}: must be Int16Array with 64 values`);
    }

    // Encode DC coefficient (differential)
    const currentDC = block[0];
    const dcDifference = currentDC - previousDC;
    const dcCategory = getCoefficientCategory(dcDifference);

    // Encode DC category
    const dcCategoryCode = huffmanTables.dcTable.codes.get(dcCategory);
    if (!dcCategoryCode) {
      throw new Error(`DC category ${dcCategory} not found in Huffman table`);
    }

    writer.writeBits(dcCategoryCode.code, dcCategoryCode.length);

    // Encode DC magnitude
    if (dcCategory > 0) {
      const { bits, length } = encodeCoefficientMagnitude(dcDifference, dcCategory);
      writer.writeBits(bits, length);
    }

    dcCoefficients++;
    previousDC = currentDC;

    // Encode AC coefficients (run-length)
    let zeroRun = 0;
    let hasNonZeroAC = false;

    for (let i = 1; i < 64; i++) {
      const coefficient = block[i];

      if (coefficient === 0) {
        zeroRun++;
      } else {
        hasNonZeroAC = true;

        // Encode accumulated zero runs
        while (zeroRun >= 16) {
          const zrlSymbol = createACSymbol(SPECIAL_AC_SYMBOLS.ZRL.run, SPECIAL_AC_SYMBOLS.ZRL.category);
          const zrlCode = huffmanTables.acTable.codes.get(zrlSymbol);
          if (!zrlCode) {
            throw new Error(`ZRL symbol ${zrlSymbol} not found in AC Huffman table`);
          }

          writer.writeBits(zrlCode.code, zrlCode.length);
          zrlSymbols++;
          zeroRun -= 16;
        }

        // Encode non-zero coefficient
        const category = getCoefficientCategory(coefficient);
        const symbol = createACSymbol(zeroRun, category);

        const acCode = huffmanTables.acTable.codes.get(symbol);
        if (!acCode) {
          throw new Error(`AC symbol ${symbol} not found in Huffman table`);
        }

        writer.writeBits(acCode.code, acCode.length);

        // Encode coefficient magnitude
        const { bits, length } = encodeCoefficientMagnitude(coefficient, category);
        writer.writeBits(bits, length);

        acCoefficients++;
        zeroRun = 0;
      }
    }

    // Add EOB if there were any non-zero AC coefficients
    if (hasNonZeroAC) {
      const eobSymbol = createACSymbol(SPECIAL_AC_SYMBOLS.EOB.run, SPECIAL_AC_SYMBOLS.EOB.category);
      const eobCode = huffmanTables.acTable.codes.get(eobSymbol);
      if (!eobCode) {
        throw new Error(`EOB symbol ${eobSymbol} not found in AC Huffman table`);
      }

      writer.writeBits(eobCode.code, eobCode.length);
      eobSymbols++;
    }
  }

  const encodedData = writer.flush();
  const writerStats = writer.getStatistics();

  const statistics = {
    totalBlocks: coefficientBlocks.length,
    totalBits: writerStats.totalBitsWritten,
    totalBytes: writerStats.totalBytesWritten,
    compressionRatio: writerStats.compressionRatio,
    averageBitsPerBlock:
      coefficientBlocks.length > 0
        ? Math.round((writerStats.totalBitsWritten / coefficientBlocks.length) * 100) / 100
        : 0,
    dcCoefficients,
    acCoefficients,
    eobSymbols,
    zrlSymbols,
    bytesStuffed: writerStats.bytesStuffed,
  };

  return {
    encodedData,
    statistics,
  };
}

/**
 * Get standard Huffman table.
 * Returns standard JPEG Huffman tables from ITU-T T.81 Annex K.
 *
 * @param {string} tableType - Table type (dc/ac)
 * @param {string} tableClass - Table class (luminance/chrominance)
 * @returns {{
 *   codeLengths: number[],
 *   symbols: number[],
 *   codes: Map<number, {code: number, length: number}>,
 *   averageCodeLength: number,
 *   compressionRatio: number
 * }} Standard Huffman table
 */
export function getStandardHuffmanTable(tableType, tableClass) {
  let standardTable;

  if (tableType === HUFFMAN_TABLE_TYPES.DC) {
    if (tableClass === HUFFMAN_TABLE_CLASSES.LUMINANCE) {
      standardTable = STANDARD_DC_LUMINANCE_TABLE;
    } else if (tableClass === HUFFMAN_TABLE_CLASSES.CHROMINANCE) {
      standardTable = STANDARD_DC_CHROMINANCE_TABLE;
    } else {
      throw new Error(`Unknown table class: ${tableClass}`);
    }
  } else if (tableType === HUFFMAN_TABLE_TYPES.AC) {
    if (tableClass === HUFFMAN_TABLE_CLASSES.LUMINANCE) {
      standardTable = STANDARD_AC_LUMINANCE_TABLE;
    } else if (tableClass === HUFFMAN_TABLE_CLASSES.CHROMINANCE) {
      standardTable = STANDARD_AC_CHROMINANCE_TABLE;
    } else {
      throw new Error(`Unknown table class: ${tableClass}`);
    }
  } else {
    throw new Error(`Unknown table type: ${tableType}`);
  }

  // Convert standard table to canonical format
  const codes = new Map();
  let code = 0;
  let symbolIndex = 0;

  for (let length = 1; length <= 16; length++) {
    const symbolCount = standardTable.codeLengths[length - 1]; // Adjust for 0-based indexing

    for (let i = 0; i < symbolCount; i++) {
      const symbol = standardTable.symbols[symbolIndex];
      codes.set(symbol, { code, length });
      code++;
      symbolIndex++;
    }

    code <<= 1; // Left shift for next length
  }

  // Add index 0 (unused) to match expected format
  const codeLengths = [0, ...standardTable.codeLengths];

  return {
    codeLengths,
    symbols: [...standardTable.symbols],
    codes,
    averageCodeLength: 0, // Would need statistics to calculate
    compressionRatio: 0, // Would need statistics to calculate
  };
}

/**
 * Huffman encoding performance and quality metrics.
 * Tracks encoding operations and analyzes compression characteristics.
 */
export class HuffmanEncodingMetrics {
  /**
   * Create Huffman encoding metrics analyzer.
   */
  constructor() {
    /** @type {number} */
    this.encodingsPerformed = 0;
    /** @type {number} */
    this.blocksProcessed = 0;
    /** @type {number} */
    this.totalBitsGenerated = 0;
    /** @type {number} */
    this.totalBytesGenerated = 0;
    /** @type {number} */
    this.totalProcessingTime = 0;
    /** @type {number} */
    this.dcCoefficientsEncoded = 0;
    /** @type {number} */
    this.acCoefficientsEncoded = 0;
    /** @type {number} */
    this.eobSymbolsGenerated = 0;
    /** @type {number} */
    this.zrlSymbolsGenerated = 0;
    /** @type {number} */
    this.bytesStuffed = 0;
    /** @type {number[]} */
    this.compressionRatios = [];
    /** @type {number[]} */
    this.bitsPerBlock = [];
    /** @type {string[]} */
    this.errors = [];
  }

  /**
   * Record encoding operation.
   *
   * @param {{
   *   totalBlocks: number,
   *   totalBits: number,
   *   totalBytes: number,
   *   compressionRatio: number,
   *   averageBitsPerBlock: number,
   *   dcCoefficients: number,
   *   acCoefficients: number,
   *   eobSymbols: number,
   *   zrlSymbols: number,
   *   bytesStuffed: number,
   *   processingTime: number
   * }} statistics - Encoding operation statistics
   */
  recordEncoding(statistics) {
    this.encodingsPerformed++;
    this.blocksProcessed += statistics.totalBlocks;
    this.totalBitsGenerated += statistics.totalBits;
    this.totalBytesGenerated += statistics.totalBytes;
    this.totalProcessingTime += statistics.processingTime || 0;
    this.dcCoefficientsEncoded += statistics.dcCoefficients;
    this.acCoefficientsEncoded += statistics.acCoefficients;
    this.eobSymbolsGenerated += statistics.eobSymbols;
    this.zrlSymbolsGenerated += statistics.zrlSymbols;
    this.bytesStuffed += statistics.bytesStuffed;

    this.compressionRatios.push(statistics.compressionRatio);
    this.bitsPerBlock.push(statistics.averageBitsPerBlock);
  }

  /**
   * Record encoding error.
   *
   * @param {string} error - Error message
   */
  recordError(error) {
    this.errors.push(error);
  }

  /**
   * Get encoding metrics summary.
   *
   * @returns {{
   *   encodingsPerformed: number,
   *   blocksProcessed: number,
   *   averageBlocksPerEncoding: number,
   *   totalBitsGenerated: number,
   *   totalBytesGenerated: number,
   *   averageCompressionRatio: number,
   *   averageBitsPerBlock: number,
   *   coefficientRatio: number,
   *   specialSymbolRatio: number,
   *   byteStuffingRatio: number,
   *   averageProcessingTime: number,
   *   blocksPerSecond: number,
   *   errorCount: number,
   *   description: string
   * }} Metrics summary
   */
  getSummary() {
    const averageBlocksPerEncoding =
      this.encodingsPerformed > 0 ? Math.round(this.blocksProcessed / this.encodingsPerformed) : 0;

    const averageCompressionRatio =
      this.compressionRatios.length > 0
        ? this.compressionRatios.reduce((sum, val) => sum + val, 0) / this.compressionRatios.length
        : 0;

    const averageBitsPerBlock =
      this.bitsPerBlock.length > 0
        ? this.bitsPerBlock.reduce((sum, val) => sum + val, 0) / this.bitsPerBlock.length
        : 0;

    const totalCoefficients = this.dcCoefficientsEncoded + this.acCoefficientsEncoded;
    const coefficientRatio = totalCoefficients > 0 ? this.acCoefficientsEncoded / totalCoefficients : 0;

    const totalSpecialSymbols = this.eobSymbolsGenerated + this.zrlSymbolsGenerated;
    const specialSymbolRatio = this.acCoefficientsEncoded > 0 ? totalSpecialSymbols / this.acCoefficientsEncoded : 0;

    const byteStuffingRatio = this.totalBytesGenerated > 0 ? this.bytesStuffed / this.totalBytesGenerated : 0;

    const averageProcessingTime = this.encodingsPerformed > 0 ? this.totalProcessingTime / this.encodingsPerformed : 0;

    const blocksPerSecond =
      this.totalProcessingTime > 0 ? Math.round((this.blocksProcessed / this.totalProcessingTime) * 1000) : 0;

    return {
      encodingsPerformed: this.encodingsPerformed,
      blocksProcessed: this.blocksProcessed,
      averageBlocksPerEncoding,
      totalBitsGenerated: this.totalBitsGenerated,
      totalBytesGenerated: this.totalBytesGenerated,
      averageCompressionRatio: Math.round(averageCompressionRatio * 100) / 100,
      averageBitsPerBlock: Math.round(averageBitsPerBlock * 100) / 100,
      coefficientRatio: Math.round(coefficientRatio * 100) / 100,
      specialSymbolRatio: Math.round(specialSymbolRatio * 100) / 100,
      byteStuffingRatio: Math.round(byteStuffingRatio * 10000) / 100, // Percentage
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      blocksPerSecond,
      errorCount: this.errors.length,
      description: `Huffman Encoding: ${this.encodingsPerformed} operations, ${this.blocksProcessed.toLocaleString()} blocks, ${blocksPerSecond.toLocaleString()} blocks/s`,
    };
  }

  /**
   * Reset encoding metrics.
   */
  reset() {
    this.encodingsPerformed = 0;
    this.blocksProcessed = 0;
    this.totalBitsGenerated = 0;
    this.totalBytesGenerated = 0;
    this.totalProcessingTime = 0;
    this.dcCoefficientsEncoded = 0;
    this.acCoefficientsEncoded = 0;
    this.eobSymbolsGenerated = 0;
    this.zrlSymbolsGenerated = 0;
    this.bytesStuffed = 0;
    this.compressionRatios = [];
    this.bitsPerBlock = [];
    this.errors = [];
  }
}

/**
 * Validate Huffman table structure.
 * Ensures table conforms to JPEG specification requirements.
 *
 * @param {{
 *   codeLengths: number[],
 *   symbols: number[],
 *   codes: Map<number, {code: number, length: number}>
 * }} table - Huffman table to validate
 * @param {string} tableType - Table type for validation context
 * @returns {{
 *   isValid: boolean,
 *   errors: string[],
 *   warnings: string[],
 *   statistics: {
 *     totalSymbols: number,
 *     maxCodeLength: number,
 *     averageCodeLength: number,
 *     codeEfficiency: number
 *   }
 * }} Validation results
 */
export function validateHuffmanTable(table, tableType = "unknown") {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  // Validate table structure
  if (!table || typeof table !== "object") {
    errors.push("Table must be an object");
    return {
      isValid: false,
      errors,
      warnings,
      statistics: {
        totalSymbols: 0,
        maxCodeLength: 0,
        averageCodeLength: 0,
        codeEfficiency: 0,
      },
    };
  }

  if (!Array.isArray(table.codeLengths)) {
    errors.push("Table must have codeLengths array");
  } else if (table.codeLengths.length !== 17) {
    errors.push("codeLengths array must have exactly 17 elements (index 0 unused)");
  }

  if (!Array.isArray(table.symbols)) {
    errors.push("Table must have symbols array");
  }

  if (!(table.codes instanceof Map)) {
    errors.push("Table must have codes Map");
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      statistics: {
        totalSymbols: 0,
        maxCodeLength: 0,
        averageCodeLength: 0,
        codeEfficiency: 0,
      },
    };
  }

  // Validate code lengths
  let totalSymbols = 0;
  let maxCodeLength = 0;

  for (let i = 1; i <= 16; i++) {
    const count = table.codeLengths[i];
    if (count < 0) {
      errors.push(`Invalid code length count at position ${i}: ${count}`);
    }
    totalSymbols += count;
    if (count > 0) {
      maxCodeLength = i;
    }
  }

  // Validate symbol count matches
  if (table.symbols.length !== totalSymbols) {
    errors.push(
      `Symbol count mismatch: codeLengths indicates ${totalSymbols}, symbols array has ${table.symbols.length}`
    );
  }

  // Validate code map matches symbols
  if (table.codes.size !== table.symbols.length) {
    errors.push(`Code map size mismatch: ${table.codes.size} codes, ${table.symbols.length} symbols`);
  }

  // Validate code lengths don't exceed JPEG limit
  if (maxCodeLength > 16) {
    errors.push(`Code length exceeds JPEG limit: ${maxCodeLength} (max 16)`);
  }

  // Validate symbol ranges for different table types
  if (tableType === HUFFMAN_TABLE_TYPES.DC) {
    for (const symbol of table.symbols) {
      if (symbol < 0 || symbol > 15) {
        errors.push(`DC symbol out of range: ${symbol} (must be 0-15)`);
      }
    }
  } else if (tableType === HUFFMAN_TABLE_TYPES.AC) {
    for (const symbol of table.symbols) {
      if (symbol < 0 || symbol > 255) {
        errors.push(`AC symbol out of range: ${symbol} (must be 0-255)`);
      }
    }
  }

  // Check for duplicate symbols
  const symbolSet = new Set(table.symbols);
  if (symbolSet.size !== table.symbols.length) {
    errors.push("Duplicate symbols found in table");
  }

  // Validate canonical code properties
  let expectedCode = 0;
  for (let length = 1; length <= 16; length++) {
    const symbolsAtLength = table.symbols.filter((symbol) => {
      const codeInfo = table.codes.get(symbol);
      return codeInfo && codeInfo.length === length;
    });

    // Sort symbols by value for canonical order
    symbolsAtLength.sort((a, b) => a - b);

    for (const symbol of symbolsAtLength) {
      const codeInfo = table.codes.get(symbol);
      if (codeInfo.code !== expectedCode) {
        warnings.push(`Non-canonical code for symbol ${symbol}: expected ${expectedCode}, got ${codeInfo.code}`);
      }
      expectedCode++;
    }
    expectedCode <<= 1;
  }

  // Performance warnings
  if (maxCodeLength > 12) {
    warnings.push(`Long maximum code length (${maxCodeLength}) may impact decoding performance`);
  }

  if (totalSymbols < 2) {
    warnings.push("Very few symbols may indicate suboptimal table usage");
  }

  // Calculate statistics
  let totalCodeBits = 0;
  for (const symbol of table.symbols) {
    const codeInfo = table.codes.get(symbol);
    if (codeInfo) {
      totalCodeBits += codeInfo.length;
    }
  }

  const averageCodeLength = totalSymbols > 0 ? totalCodeBits / totalSymbols : 0;
  const theoreticalMinLength = totalSymbols > 1 ? Math.log2(totalSymbols) : 1;
  const codeEfficiency = theoreticalMinLength > 0 ? theoreticalMinLength / averageCodeLength : 1;

  const statistics = {
    totalSymbols,
    maxCodeLength,
    averageCodeLength: Math.round(averageCodeLength * 100) / 100,
    codeEfficiency: Math.round(codeEfficiency * 100) / 100,
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    statistics,
  };
}
