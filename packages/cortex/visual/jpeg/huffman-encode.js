/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file JPEG Huffman encoding implementation.
 *
 * Implements Huffman encoding for JPEG compression, including bit stream writing,
 * coefficient encoding, and standard Huffman table creation for encoding.
 * This is the inverse of the huffman-decode module.
 */

import { createStandardHuffmanTable } from "./huffman-decode.js";

/**
 * Bit stream writer for JPEG encoding.
 * Handles bit-level writing with JPEG byte stuffing (0xFF -> 0xFF 0x00).
 */
export class BitWriter {
  /**
   * Creates new bit writer.
   *
   * @param {number} [initialCapacity=1024] - Initial buffer capacity in bytes
   */
  constructor(initialCapacity = 1024) {
    this.buffer = new Uint8Array(initialCapacity);
    this.position = 0; // Byte position
    this.bitPosition = 0; // Bit position within current byte (0-7)
    this.currentByte = 0; // Current byte being written
  }

  /**
   * Write bits to the stream.
   *
   * @param {number} value - Value to write
   * @param {number} bitCount - Number of bits to write (1-32)
   * @throws {Error} If parameters are invalid
   */
  writeBits(value, bitCount) {
    if (typeof value !== "number" || value < 0) {
      throw new Error(`Invalid value: ${value} (must be non-negative number)`);
    }

    if (typeof bitCount !== "number" || bitCount < 1 || bitCount > 32) {
      throw new Error(`Invalid bit count: ${bitCount} (must be 1-32)`);
    }

    // Ensure value fits in specified bit count
    const maxValue = (1 << bitCount) - 1;
    if (value > maxValue) {
      throw new Error(`Value ${value} too large for ${bitCount} bits (max: ${maxValue})`);
    }

    // Write bits from most significant to least significant
    for (let i = bitCount - 1; i >= 0; i--) {
      const bit = (value >> i) & 1;
      this.currentByte = (this.currentByte << 1) | bit;
      this.bitPosition++;

      // If byte is complete, write it to buffer
      if (this.bitPosition === 8) {
        this._writeByte(this.currentByte);
        this.currentByte = 0;
        this.bitPosition = 0;
      }
    }
  }

  /**
   * Write a complete byte to the buffer with JPEG byte stuffing.
   *
   * @private
   * @param {number} byte - Byte value to write
   */
  _writeByte(byte) {
    // Ensure buffer has capacity
    if (this.position >= this.buffer.length) {
      this._expandBuffer();
    }

    this.buffer[this.position++] = byte;

    // JPEG byte stuffing: 0xFF -> 0xFF 0x00
    if (byte === 0xff) {
      if (this.position >= this.buffer.length) {
        this._expandBuffer();
      }
      this.buffer[this.position++] = 0x00;
    }
  }

  /**
   * Expand buffer capacity when needed.
   *
   * @private
   */
  _expandBuffer() {
    const newCapacity = this.buffer.length * 2;
    const newBuffer = new Uint8Array(newCapacity);
    newBuffer.set(this.buffer);
    this.buffer = newBuffer;
  }

  /**
   * Flush any remaining bits and return the encoded data.
   *
   * @returns {Uint8Array} Encoded bit stream
   */
  flush() {
    // If there are remaining bits, pad with zeros and write final byte
    if (this.bitPosition > 0) {
      // Pad remaining bits with 1s (JPEG standard)
      const padding = 8 - this.bitPosition;
      const paddedByte = (this.currentByte << padding) | ((1 << padding) - 1);
      this._writeByte(paddedByte);
    }

    // Return trimmed buffer
    return this.buffer.slice(0, this.position);
  }

  /**
   * Get current bit position for debugging.
   *
   * @returns {{bytePosition: number, bitPosition: number, totalBits: number}} Position info
   */
  getPosition() {
    return {
      bytePosition: this.position,
      bitPosition: this.bitPosition,
      totalBits: this.position * 8 + this.bitPosition,
    };
  }

  /**
   * Reset writer for reuse.
   */
  reset() {
    this.position = 0;
    this.bitPosition = 0;
    this.currentByte = 0;
  }
}

/**
 * Huffman encoder for JPEG compression.
 * Builds encoding tables from standard or custom Huffman tables.
 */
export class HuffmanEncoder {
  /**
   * Creates Huffman encoder from table data.
   *
   * @param {{codeLengths: number[], symbols: number[]}} tableData - Huffman table data
   */
  constructor(tableData) {
    this.codeLengths = tableData.codeLengths;
    this.symbols = tableData.symbols;
    this.encodeTable = new Map(); // symbol -> {code, length}

    this._buildEncodeTable();
  }

  /**
   * Build encoding table from Huffman table data.
   *
   * @private
   */
  _buildEncodeTable() {
    let code = 0;
    let symbolIndex = 0;

    // Build codes for each bit length
    for (let bitLength = 1; bitLength <= 16; bitLength++) {
      const symbolCount = this.codeLengths[bitLength - 1];

      for (let i = 0; i < symbolCount; i++) {
        const symbol = this.symbols[symbolIndex++];
        this.encodeTable.set(symbol, {
          code,
          length: bitLength,
        });
        code++;
      }

      // Left-shift for next bit length
      code <<= 1;
    }
  }

  /**
   * Encode a symbol using Huffman codes.
   *
   * @param {number} symbol - Symbol to encode
   * @returns {{code: number, length: number}} Huffman code and bit length
   * @throws {Error} If symbol not found in table
   */
  encodeSymbol(symbol) {
    const entry = this.encodeTable.get(symbol);
    if (!entry) {
      throw new Error(`Symbol ${symbol} not found in Huffman table`);
    }
    return entry;
  }

  /**
   * Check if symbol exists in encoding table.
   *
   * @param {number} symbol - Symbol to check
   * @returns {boolean} True if symbol can be encoded
   */
  hasSymbol(symbol) {
    return this.encodeTable.has(symbol);
  }

  /**
   * Get encoding table statistics.
   *
   * @returns {{symbolCount: number, maxCodeLength: number, minCodeLength: number}} Statistics
   */
  getStats() {
    const lengths = Array.from(this.encodeTable.values()).map((entry) => entry.length);
    return {
      symbolCount: this.encodeTable.size,
      maxCodeLength: Math.max(...lengths),
      minCodeLength: Math.min(...lengths),
    };
  }
}

/**
 * Encode coefficient value using JPEG coefficient encoding.
 *
 * @param {number} coefficient - Coefficient value to encode
 * @returns {{category: number, bits: number, bitCount: number}} Encoded coefficient
 */
export function encodeCoefficient(coefficient) {
  if (typeof coefficient !== "number") {
    throw new Error(`Coefficient must be a number, got ${typeof coefficient}`);
  }

  if (coefficient === 0) {
    return { category: 0, bits: 0, bitCount: 0 };
  }

  const absValue = Math.abs(coefficient);
  let category = 0;

  // Find category (number of bits needed)
  let temp = absValue;
  while (temp > 0) {
    category++;
    temp >>= 1;
  }

  if (category > 15) {
    throw new Error(`Coefficient ${coefficient} too large (category ${category} > 15)`);
  }

  // For negative values, use JPEG's one's complement representation
  let bits = absValue;
  if (coefficient < 0) {
    bits = (1 << category) - 1 + coefficient; // JPEG one's complement: (2^category - 1) + coefficient
  }

  return {
    category,
    bits,
    bitCount: category,
  };
}

/**
 * Encode DC coefficient difference.
 *
 * @param {HuffmanEncoder} dcEncoder - DC Huffman encoder
 * @param {BitWriter} bitWriter - Bit writer
 * @param {number} dcDifference - DC difference value
 */
export function encodeDCCoefficient(dcEncoder, bitWriter, dcDifference) {
  const { category, bits, bitCount } = encodeCoefficient(dcDifference);

  // Encode category using Huffman table
  const { code, length } = dcEncoder.encodeSymbol(category);
  bitWriter.writeBits(code, length);

  // Encode coefficient bits if non-zero
  if (bitCount > 0) {
    bitWriter.writeBits(bits, bitCount);
  }
}

/**
 * Encode AC coefficients for a block.
 *
 * @param {HuffmanEncoder} acEncoder - AC Huffman encoder
 * @param {BitWriter} bitWriter - Bit writer
 * @param {number[]} coefficients - AC coefficients (63 elements, in zigzag order)
 */
export function encodeACCoefficients(acEncoder, bitWriter, coefficients) {
  if (!Array.isArray(coefficients) || coefficients.length !== 63) {
    throw new Error("AC coefficients must be an array of 63 elements");
  }

  let runLength = 0;

  for (let i = 0; i < 63; i++) {
    const coefficient = coefficients[i];

    if (coefficient === 0) {
      runLength++;
      // Handle run length overflow (max 15)
      if (runLength === 16) {
        // Encode ZRL (Zero Run Length) symbol: 0xF0
        const { code, length } = acEncoder.encodeSymbol(0xf0);
        bitWriter.writeBits(code, length);
        runLength = 0;
      }
    } else {
      // Encode non-zero coefficient
      const { category, bits, bitCount } = encodeCoefficient(coefficient);

      // Create AC symbol: (runLength << 4) | category
      const symbol = (runLength << 4) | category;

      if (!acEncoder.hasSymbol(symbol)) {
        throw new Error(`AC symbol ${symbol.toString(16)} not found in Huffman table`);
      }

      // Encode symbol
      const { code, length } = acEncoder.encodeSymbol(symbol);
      bitWriter.writeBits(code, length);

      // Encode coefficient bits
      if (bitCount > 0) {
        bitWriter.writeBits(bits, bitCount);
      }

      runLength = 0;
    }
  }

  // If we end with zeros, encode EOB (End of Block)
  if (runLength > 0) {
    const { code, length } = acEncoder.encodeSymbol(0x00); // EOB symbol
    bitWriter.writeBits(code, length);
  }
}

/**
 * Encode complete 8x8 block of coefficients.
 *
 * @param {HuffmanEncoder} dcEncoder - DC Huffman encoder
 * @param {HuffmanEncoder} acEncoder - AC Huffman encoder
 * @param {BitWriter} bitWriter - Bit writer
 * @param {number[]} coefficients - Block coefficients in zigzag order (64 elements)
 * @param {number} previousDC - Previous DC value for difference encoding
 * @returns {number} Current DC value for next block
 */
export function encodeBlock(dcEncoder, acEncoder, bitWriter, coefficients, previousDC) {
  if (!Array.isArray(coefficients) || coefficients.length !== 64) {
    throw new Error("Coefficients must be an array of 64 elements");
  }

  const currentDC = coefficients[0];
  const dcDifference = currentDC - previousDC;

  // Encode DC coefficient
  encodeDCCoefficient(dcEncoder, bitWriter, dcDifference);

  // Encode AC coefficients (skip DC at index 0)
  const acCoefficients = coefficients.slice(1);
  encodeACCoefficients(acEncoder, bitWriter, acCoefficients);

  return currentDC;
}

/**
 * Create standard JPEG Huffman encoding table.
 *
 * @param {string} tableType - Table type ("dc-luminance", "ac-luminance", "dc-chrominance", "ac-chrominance")
 * @returns {HuffmanEncoder} Huffman encoder for the specified table
 * @throws {Error} If table type is unknown
 */
export function createStandardHuffmanEncoder(tableType) {
  const tableData = createStandardHuffmanTable(tableType);
  return new HuffmanEncoder(tableData);
}

/**
 * Validate Huffman encoding parameters.
 *
 * @param {HuffmanEncoder} encoder - Huffman encoder
 * @param {BitWriter} bitWriter - Bit writer
 * @param {string} operation - Operation name for error messages
 * @throws {Error} If parameters are invalid
 */
export function validateEncodingParameters(encoder, bitWriter, operation = "encoding") {
  if (!(encoder instanceof HuffmanEncoder)) {
    throw new Error(`${operation} requires a HuffmanEncoder instance`);
  }

  if (!(bitWriter instanceof BitWriter)) {
    throw new Error(`${operation} requires a BitWriter instance`);
  }
}

/**
 * Calculate encoded size estimate for coefficients.
 *
 * @param {HuffmanEncoder} dcEncoder - DC Huffman encoder
 * @param {HuffmanEncoder} acEncoder - AC Huffman encoder
 * @param {number[][]} blocks - Array of coefficient blocks
 * @returns {{estimatedBits: number, estimatedBytes: number}} Size estimate
 */
export function estimateEncodedSize(dcEncoder, acEncoder, blocks) {
  let totalBits = 0;
  let previousDC = 0;

  for (const block of blocks) {
    if (!Array.isArray(block) || block.length !== 64) {
      throw new Error("Each block must be an array of 64 coefficients");
    }

    // Estimate DC coefficient size
    const currentDC = block[0];
    const dcDifference = currentDC - previousDC;
    const { category } = encodeCoefficient(dcDifference);

    if (dcEncoder.hasSymbol(category)) {
      const { length } = dcEncoder.encodeSymbol(category);
      totalBits += length + category; // Huffman code + coefficient bits
    }

    // Estimate AC coefficients size
    let runLength = 0;
    for (let i = 1; i < 64; i++) {
      const coefficient = block[i];

      if (coefficient === 0) {
        runLength++;
        if (runLength === 16) {
          // ZRL symbol
          if (acEncoder.hasSymbol(0xf0)) {
            const { length } = acEncoder.encodeSymbol(0xf0);
            totalBits += length;
          }
          runLength = 0;
        }
      } else {
        const { category } = encodeCoefficient(coefficient);
        const symbol = (runLength << 4) | category;

        if (acEncoder.hasSymbol(symbol)) {
          const { length } = acEncoder.encodeSymbol(symbol);
          totalBits += length + category; // Huffman code + coefficient bits
        }

        runLength = 0;
      }
    }

    // EOB if needed
    if (runLength > 0 && acEncoder.hasSymbol(0x00)) {
      const { length } = acEncoder.encodeSymbol(0x00);
      totalBits += length;
    }

    previousDC = currentDC;
  }

  return {
    estimatedBits: totalBits,
    estimatedBytes: Math.ceil(totalBits / 8),
  };
}

/**
 * Create test coefficient block for encoding validation.
 *
 * @param {string} pattern - Pattern type ("dc-only", "simple", "complex", "zeros")
 * @returns {number[]} Test coefficient block (64 elements)
 */
export function createTestCoefficientBlock(pattern) {
  const block = new Array(64).fill(0);

  switch (pattern) {
    case "dc-only":
      block[0] = 128; // DC coefficient only
      break;

    case "simple":
      block[0] = 100; // DC
      block[1] = 50; // First AC
      block[8] = -25; // Second AC
      break;

    case "complex":
      block[0] = 200; // DC
      // Add various AC coefficients
      for (let i = 1; i < 20; i++) {
        block[i] = Math.floor(Math.sin(i) * 50);
      }
      break;

    case "zeros":
      block[0] = 64; // DC only, all AC coefficients are zero
      break;

    default:
      throw new Error(`Unknown test pattern: ${pattern}`);
  }

  return block;
}

/**
 * Analyze Huffman encoding efficiency.
 *
 * @param {HuffmanEncoder} encoder - Huffman encoder
 * @param {number[]} symbols - Symbols to analyze
 * @returns {{
 *   totalBits: number,
 *   averageBitsPerSymbol: number,
 *   symbolFrequency: Map<number, number>,
 *   efficiency: number
 * }} Encoding analysis
 */
export function analyzeEncodingEfficiency(encoder, symbols) {
  const symbolFrequency = new Map();
  let totalBits = 0;

  // Count symbol frequencies and calculate total bits
  for (const symbol of symbols) {
    symbolFrequency.set(symbol, (symbolFrequency.get(symbol) || 0) + 1);

    if (encoder.hasSymbol(symbol)) {
      const { length } = encoder.encodeSymbol(symbol);
      totalBits += length;
    }
  }

  const averageBitsPerSymbol = symbols.length > 0 ? totalBits / symbols.length : 0;

  // Calculate theoretical minimum (entropy)
  let entropy = 0;
  const totalSymbols = symbols.length;

  for (const [, frequency] of symbolFrequency) {
    const probability = frequency / totalSymbols;
    if (probability > 0) {
      entropy -= probability * Math.log2(probability);
    }
  }

  const efficiency = entropy > 0 ? entropy / averageBitsPerSymbol : 1;

  return {
    totalBits,
    averageBitsPerSymbol,
    symbolFrequency,
    efficiency: Math.min(1, efficiency), // Cap at 100% efficiency
  };
}
