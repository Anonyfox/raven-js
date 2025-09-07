/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Huffman decoding for JPEG compressed data.
 *
 * JPEG uses Huffman coding for entropy compression of DCT coefficients.
 * This module handles building decode tables from DHT markers and decoding
 * variable-length codes from the compressed bit stream.
 */

/**
 * Bit stream reader for JPEG data.
 * Handles byte-stuffing (0xFF 0x00 sequences) and bit-level reading.
 */
export class BitStream {
  /**
   * Creates a new bit stream reader.
   *
   * @param {Uint8Array} data - Compressed data buffer
   * @param {number} [offset=0] - Starting byte offset
   */
  constructor(data, offset = 0) {
    if (!(data instanceof Uint8Array)) {
      throw new Error("Data must be a Uint8Array");
    }

    this.data = data;
    this.byteOffset = offset;
    this.bitOffset = 0;
    this.currentByte = 0;
    this.bitsAvailable = 0;
    this.ended = false;

    this._loadNextByte();
  }

  /**
   * Loads the next byte from the stream, handling byte-stuffing.
   * In JPEG, 0xFF 0x00 sequences represent a literal 0xFF byte.
   *
   * @private
   */
  _loadNextByte() {
    if (this.byteOffset >= this.data.length) {
      this.ended = true;
      return;
    }

    this.currentByte = this.data[this.byteOffset++];

    // Handle byte-stuffing: 0xFF 0x00 -> 0xFF
    if (this.currentByte === 0xff && this.byteOffset < this.data.length) {
      const nextByte = this.data[this.byteOffset];

      if (nextByte === 0x00) {
        // Byte-stuffed 0xFF, consume the 0x00
        this.byteOffset++;
      } else if (nextByte >= 0xd0 && nextByte <= 0xd7) {
        // Restart marker (RST0-RST7), consume it
        this.byteOffset++;
        this.currentByte = 0; // Treat as padding
      } else {
        // End of scan or other marker
        this.ended = true;
        return;
      }
    }

    this.bitsAvailable = 8;
  }

  /**
   * Reads a specified number of bits from the stream.
   *
   * @param {number} numBits - Number of bits to read (1-16)
   * @returns {number} The bits as an integer
   * @throws {Error} If stream has ended or invalid bit count
   */
  readBits(numBits) {
    if (numBits < 1 || numBits > 16) {
      throw new Error(`Invalid bit count: ${numBits} (must be 1-16)`);
    }

    if (this.ended) {
      throw new Error("Bit stream has ended");
    }

    let result = 0;
    let bitsNeeded = numBits;

    while (bitsNeeded > 0 && !this.ended) {
      if (this.bitsAvailable === 0) {
        this._loadNextByte();
        if (this.ended) {
          throw new Error("Unexpected end of bit stream");
        }
      }

      const bitsToTake = Math.min(bitsNeeded, this.bitsAvailable);
      const shift = this.bitsAvailable - bitsToTake;
      const mask = (1 << bitsToTake) - 1;

      const bits = (this.currentByte >> shift) & mask;
      result = (result << bitsToTake) | bits;

      this.bitsAvailable -= bitsToTake;
      bitsNeeded -= bitsToTake;

      // Clear consumed bits
      this.currentByte &= (1 << this.bitsAvailable) - 1;
    }

    return result;
  }

  /**
   * Peeks at the next bits without consuming them.
   *
   * @param {number} numBits - Number of bits to peek (1-16)
   * @returns {number} The bits as an integer
   */
  peekBits(numBits) {
    if (numBits < 1 || numBits > 16) {
      throw new Error(`Invalid bit count: ${numBits} (must be 1-16)`);
    }

    // Save current state
    const savedByteOffset = this.byteOffset;
    const savedBitOffset = this.bitOffset;
    const savedCurrentByte = this.currentByte;
    const savedBitsAvailable = this.bitsAvailable;
    const savedEnded = this.ended;

    try {
      const result = this.readBits(numBits);

      // Restore state
      this.byteOffset = savedByteOffset;
      this.bitOffset = savedBitOffset;
      this.currentByte = savedCurrentByte;
      this.bitsAvailable = savedBitsAvailable;
      this.ended = savedEnded;

      return result;
    } catch (error) {
      // Restore state on error
      this.byteOffset = savedByteOffset;
      this.bitOffset = savedBitOffset;
      this.currentByte = savedCurrentByte;
      this.bitsAvailable = savedBitsAvailable;
      this.ended = savedEnded;

      throw error;
    }
  }

  /**
   * Checks if the stream has ended.
   *
   * @returns {boolean} True if no more bits available
   */
  isEnded() {
    return this.ended && this.bitsAvailable === 0;
  }

  /**
   * Gets the current position in the stream.
   *
   * @returns {{
   *   byteOffset: number,
   *   bitOffset: number,
   *   totalBits: number
   * }} Current position information
   */
  getPosition() {
    const totalBits = (this.byteOffset - (this.bitsAvailable > 0 ? 1 : 0)) * 8 + (8 - this.bitsAvailable);
    return {
      byteOffset: this.byteOffset,
      bitOffset: 8 - this.bitsAvailable,
      totalBits,
    };
  }
}

/**
 * Huffman decode table for fast symbol lookup.
 */
export class HuffmanTable {
  /**
   * Creates a Huffman decode table from DHT data.
   *
   * @param {Object} dhtData - DHT table data from header parsing
   * @param {number} dhtData.class - Table class (0=DC, 1=AC)
   * @param {number} dhtData.id - Table ID (0-3)
   * @param {number[]} dhtData.codeLengths - Code lengths array (16 elements)
   * @param {number[]} dhtData.symbols - Symbol values
   */
  constructor(dhtData) {
    this.class = dhtData.class;
    this.id = dhtData.id;
    this.codeLengths = [...dhtData.codeLengths];
    this.symbols = [...dhtData.symbols];

    // Build fast lookup tables
    this.maxCodeLength = 0;
    this.minCodeLength = 16;
    this.codes = new Map(); // code -> symbol
    this.fastLookup = new Array(256).fill(-1); // For codes <= 8 bits

    this._buildDecodeTables();
  }

  /**
   * Builds decode tables for fast symbol lookup.
   *
   * @private
   */
  _buildDecodeTables() {
    let code = 0;
    let symbolIndex = 0;

    // Generate codes for each length
    for (let length = 1; length <= 16; length++) {
      const count = this.codeLengths[length - 1];

      if (count > 0) {
        this.minCodeLength = Math.min(this.minCodeLength, length);
        this.maxCodeLength = Math.max(this.maxCodeLength, length);

        for (let i = 0; i < count; i++) {
          const symbol = this.symbols[symbolIndex++];
          this.codes.set((code << 16) | length, symbol);

          // Fast lookup for short codes (≤ 8 bits)
          if (length <= 8) {
            const paddedCode = code << (8 - length);
            const numEntries = 1 << (8 - length);

            for (let j = 0; j < numEntries; j++) {
              this.fastLookup[paddedCode + j] = (symbol << 8) | length;
            }
          }

          code++;
        }
      }

      code <<= 1;
    }

    if (this.minCodeLength === 16) {
      this.minCodeLength = 1; // No codes found
    }
  }

  /**
   * Decodes the next symbol from the bit stream.
   *
   * @param {BitStream} bitStream - Bit stream to read from
   * @returns {number} Decoded symbol value
   * @throws {Error} If no valid code found
   */
  decodeSymbol(bitStream) {
    if (bitStream.isEnded()) {
      throw new Error("Cannot decode symbol: bit stream ended");
    }

    // Try fast lookup first (for codes ≤ 8 bits)
    if (!bitStream.isEnded()) {
      try {
        const peek8 = bitStream.peekBits(8);
        const fastResult = this.fastLookup[peek8];

        if (fastResult !== -1) {
          const symbol = fastResult >> 8;
          const length = fastResult & 0xff;
          bitStream.readBits(length); // Consume the bits
          return symbol;
        }
      } catch (_error) {
        // Fall through to slow lookup
      }
    }

    // Slow lookup for longer codes
    let code = 0;
    let bitsRead = 0;

    for (let length = this.minCodeLength; length <= this.maxCodeLength; length++) {
      try {
        // Read additional bits to reach the current length
        while (bitsRead < length) {
          code = (code << 1) | bitStream.readBits(1);
          bitsRead++;
        }

        const key = (code << 16) | length;

        if (this.codes.has(key)) {
          return this.codes.get(key);
        }
      } catch (_error) {
        throw new Error("Unexpected end of stream while decoding Huffman symbol");
      }
    }

    throw new Error(`Invalid Huffman code: no symbol found for code ${code.toString(2)}`);
  }

  /**
   * Validates the Huffman table structure.
   *
   * @throws {Error} If table is invalid
   */
  validate() {
    // Check code lengths sum
    const totalSymbols = this.codeLengths.reduce((sum, count) => sum + count, 0);
    if (totalSymbols !== this.symbols.length) {
      throw new Error(`Code lengths sum (${totalSymbols}) doesn't match symbols count (${this.symbols.length})`);
    }

    // Check for valid code length distribution
    let codeCount = 0;
    for (let length = 1; length <= 16; length++) {
      codeCount += this.codeLengths[length - 1];
      if (codeCount > 1 << length) {
        throw new Error(`Invalid Huffman table: too many codes for length ${length}`);
      }
      codeCount <<= 1;
    }

    // Check symbols are in valid range
    for (const symbol of this.symbols) {
      if (symbol < 0 || symbol > 255) {
        throw new Error(`Invalid symbol value: ${symbol} (must be 0-255)`);
      }
    }
  }

  /**
   * Gets table statistics for debugging.
   *
   * @returns {{
   *   class: number,
   *   id: number,
   *   symbolCount: number,
   *   minCodeLength: number,
   *   maxCodeLength: number,
   *   totalCodes: number
   * }} Table statistics
   */
  getStats() {
    return {
      class: this.class,
      id: this.id,
      symbolCount: this.symbols.length,
      minCodeLength: this.minCodeLength,
      maxCodeLength: this.maxCodeLength,
      totalCodes: this.codes.size,
    };
  }
}

/**
 * Decodes JPEG coefficient values using magnitude and sign encoding.
 *
 * @param {number} category - Coefficient category (0-15)
 * @param {BitStream} bitStream - Bit stream to read magnitude from
 * @returns {number} Decoded coefficient value
 * @throws {Error} If category is invalid
 */
export function decodeCoefficient(category, bitStream) {
  if (category < 0 || category > 15) {
    throw new Error(`Invalid coefficient category: ${category} (must be 0-15)`);
  }

  if (category === 0) {
    return 0; // No additional bits needed
  }

  const magnitude = bitStream.readBits(category);
  const threshold = 1 << (category - 1);

  // If magnitude >= threshold, it's positive
  // Otherwise, it's negative: value = magnitude - (2^category - 1)
  return magnitude >= threshold ? magnitude : magnitude - (1 << category) + 1;
}

/**
 * Decodes a DC coefficient difference.
 *
 * @param {HuffmanTable} dcTable - DC Huffman table
 * @param {BitStream} bitStream - Bit stream to read from
 * @param {number} previousDC - Previous DC value for difference decoding
 * @returns {number} Decoded DC coefficient
 */
export function decodeDCCoefficient(dcTable, bitStream, previousDC) {
  const category = dcTable.decodeSymbol(bitStream);
  const difference = decodeCoefficient(category, bitStream);
  return previousDC + difference;
}

/**
 * Decodes AC coefficients for an 8x8 block.
 *
 * @param {HuffmanTable} acTable - AC Huffman table
 * @param {BitStream} bitStream - Bit stream to read from
 * @param {number[]} coefficients - Coefficient array to fill (64 elements, DC already set)
 * @param {number} [startIndex=1] - Starting index for AC coefficients
 * @throws {Error} If decoding fails
 */
export function decodeACCoefficients(acTable, bitStream, coefficients, startIndex = 1) {
  if (!Array.isArray(coefficients) || coefficients.length !== 64) {
    throw new Error("Coefficients array must have exactly 64 elements");
  }

  let index = startIndex;

  while (index < 64) {
    const symbol = acTable.decodeSymbol(bitStream);

    if (symbol === 0x00) {
      // EOB (End of Block) - remaining coefficients are zero
      break;
    }

    const runLength = (symbol >> 4) & 0x0f; // High nibble
    const category = symbol & 0x0f; // Low nibble

    if (symbol === 0xf0) {
      // ZRL (Zero Run Length) - 16 zeros
      for (let i = 0; i < 16 && index < 64; i++) {
        coefficients[index++] = 0;
      }
      if (index >= 64) {
        // ZRL extends beyond block boundary - remaining coefficients are implicitly zero
        break;
      }
      continue;
    }

    // Skip run of zeros
    for (let i = 0; i < runLength && index < 64; i++) {
      coefficients[index++] = 0;
    }
    if (index >= 64) {
      // Run length extends beyond block boundary - remaining coefficients are implicitly zero
      break;
    }

    // Decode coefficient value
    const value = decodeCoefficient(category, bitStream);
    coefficients[index] = value;
    index++;
  }

  // Fill remaining coefficients with zeros (if not already done by EOB)
  while (index < 64) {
    coefficients[index++] = 0;
  }
}

/**
 * Decodes a complete 8x8 coefficient block.
 *
 * @param {HuffmanTable} dcTable - DC Huffman table
 * @param {HuffmanTable} acTable - AC Huffman table
 * @param {BitStream} bitStream - Bit stream to read from
 * @param {number} previousDC - Previous DC value for difference decoding
 * @returns {{
 *   coefficients: number[],
 *   dcValue: number
 * }} Decoded block data
 */
export function decodeBlock(dcTable, acTable, bitStream, previousDC) {
  const coefficients = new Array(64).fill(0);

  // Decode DC coefficient
  const dcValue = decodeDCCoefficient(dcTable, bitStream, previousDC);
  coefficients[0] = dcValue;

  // Decode AC coefficients
  decodeACCoefficients(acTable, bitStream, coefficients);

  return {
    coefficients,
    dcValue,
  };
}

/**
 * Creates standard JPEG Huffman table data.
 * @param {string} type - Table type ("dc-luminance", "ac-luminance", "dc-chrominance", "ac-chrominance")
 * @returns {{class: number, id: number, codeLengths: number[], symbols: number[]}} Huffman table data
 * @throws {Error} If type is unknown
 */
export function createStandardHuffmanTable(type) {
  switch (type) {
    case "dc-luminance":
      return {
        class: 0,
        id: 0,
        codeLengths: [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        symbols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      };

    case "ac-luminance":
      return {
        class: 1,
        id: 0,
        codeLengths: [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d],
        symbols: [
          0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71,
          0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
          0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37,
          0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
          0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83,
          0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
          0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3,
          0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
          0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
        ],
      };

    case "dc-chrominance":
      return {
        class: 0,
        id: 1,
        codeLengths: [0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
        symbols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      };

    case "ac-chrominance":
      return {
        class: 1,
        id: 1,
        codeLengths: [0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77],
        symbols: [
          0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71, 0x13, 0x22,
          0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1,
          0x0a, 0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x35, 0x36,
          0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58,
          0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a,
          0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a,
          0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba,
          0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda,
          0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
        ],
      };

    default:
      throw new Error(`Unknown standard Huffman table type: ${type}`);
  }
}
