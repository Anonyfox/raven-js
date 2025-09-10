/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG Huffman coding and bitstream reading.
 *
 * Implements canonical Huffman code construction, fast decode tables,
 * and bit-level reading with 0xFF00 unstuffing. Provides entropy decoding
 * for both baseline and progressive JPEG scans.
 */

/**
 * Huffman table types
 */
export const HUFFMAN_TABLE_TYPES = {
  DC: 0,
  AC: 1,
};

/**
 * Bit reader for JPEG entropy-coded data.
 *
 * Handles byte-aligned reading with 0xFF00 unstuffing and marker detection.
 * Maintains 32-bit bit buffer for efficient bit operations.
 */
export class BitReader {
  /**
   * Create bit reader for buffer segment.
   *
   * @param {Uint8Array} buffer - Source buffer
   * @param {number} startOffset - Start of entropy-coded segment
   * @param {number} endOffset - End of entropy-coded segment
   */
  constructor(buffer, startOffset, endOffset) {
    this.buffer = buffer;
    this.offset = startOffset;
    this.endOffset = endOffset;
    this.bitBuffer = 0;
    this.bitCount = 0;
  }

  /**
   * Refill bit buffer from source data.
   * Handles 0xFF00 unstuffing and marker detection.
   *
   * @returns {boolean} True if more data available, false if end reached
   */
  refillBuffer() {
    while (this.bitCount <= 24 && this.offset < this.endOffset) {
      const byte = this.buffer[this.offset++];

      // Handle 0xFF stuffing BEFORE adding to buffer
      if (byte === 0xff) {
        if (this.offset >= this.endOffset) {
          // End of segment - add the 0xff and stop
          this.bitBuffer = (this.bitBuffer << 8) | byte;
          this.bitCount += 8;
          break;
        }

        const nextByte = this.buffer[this.offset];
        if (nextByte === 0x00) {
          // Stuffed byte - skip both 0xff and 0x00, continue to next byte
          this.offset++;
          continue; // Don't add 0xff to buffer, read next byte
        } else {
          // Found marker - back up to 0xff and signal end
          this.offset--; // Don't consume marker
          break;
        }
      }

      // Add byte to bit buffer (MSB first)
      this.bitBuffer = (this.bitBuffer << 8) | byte;
      this.bitCount += 8;
    }

    return this.bitCount > 0;
  }

  /**
   * Read single bit from stream.
   *
   * @returns {number} Bit value (0 or 1)
   * @throws {Error} If insufficient data
   */
  readBit() {
    if (this.bitCount === 0 && !this.refillBuffer()) {
      throw new Error("Bit stream exhausted");
    }

    const bit = (this.bitBuffer >>> (this.bitCount - 1)) & 1;
    this.bitCount--;

    return bit;
  }

  /**
   * Read n bits from stream and return as unsigned integer.
   *
   * @param {number} n - Number of bits to read (1-16)
   * @returns {number} Unsigned integer value
   * @throws {Error} If insufficient data or invalid n
   */
  receive(n) {
    if (n < 1 || n > 16) {
      throw new Error(`Invalid bit count: ${n}`);
    }

    let value = 0;
    for (let i = 0; i < n; i++) {
      value = (value << 1) | this.readBit();
    }

    return value;
  }

  /**
   * Read n bits and convert to signed integer using JPEG sign extension.
   *
   * @param {number} n - Number of bits to read (1-16)
   * @returns {number} Signed integer value
   */
  receiveSigned(n) {
    const unsigned = this.receive(n);

    // JPEG sign extension: if MSB is 0, value is positive
    // If MSB is 1, extend sign by subtracting 2^n
    if (n === 0) return 0;

    const msb = unsigned >>> (n - 1);
    if (msb === 0) {
      return unsigned;
    } else {
      return unsigned - (1 << n);
    }
  }

  /**
   * Check if bit stream has reached end or marker.
   *
   * @returns {boolean} True if at end
   */
  isAtEnd() {
    return this.bitCount === 0 && this.offset >= this.endOffset;
  }

  /**
   * Get current byte offset for error reporting.
   *
   * @returns {number} Current offset
   */
  getOffset() {
    return this.offset;
  }
}

/**
 * Huffman table for JPEG entropy decoding.
 *
 * Stores canonical Huffman codes and provides fast decoding lookup.
 */
export class HuffmanTable {
  /**
   * Create Huffman table from DHT segment data.
   *
   * @param {number} tableType - DC (0) or AC (1)
   * @param {number} tableId - Table ID (0-3)
   * @param {Uint8Array} lengths - Code length counts (16 bytes)
   * @param {Uint8Array} values - Symbol values
   */
  constructor(tableType, tableId, lengths, values) {
    this.tableType = tableType;
    this.tableId = tableId;
    this.lengths = lengths;
    this.values = values;
    this.codes = new Array(256); // Canonical codes
    this.codeLengths = new Array(256); // Code lengths for each symbol

    this.buildCanonicalCodes();
    this.buildFastTable();
  }

  /**
   * Build canonical Huffman codes from lengths and values.
   */
  buildCanonicalCodes() {
    let code = 0;
    let symbolIndex = 0;

    // Standard canonical Huffman code generation
    for (let length = 1; length <= 16; length++) {
      // Assign codes to all symbols of this length
      for (let i = 0; i < this.lengths[length - 1]; i++) {
        if (symbolIndex >= this.values.length) {
          throw new Error("Too few symbols for Huffman table");
        }

        const symbol = this.values[symbolIndex++];
        this.codes[symbol] = code;
        this.codeLengths[symbol] = length;
        code++;
      }

      // Shift for next length (ensures lexicographic ordering)
      code <<= 1;
    }

    if (symbolIndex !== this.values.length) {
      throw new Error("Too many symbols for Huffman table");
    }
  }

  /**
   * Build fast lookup table for decoding.
   * Uses 8-bit prefix lookup with fallback to sequential search.
   */
  buildFastTable() {
    const FAST_TABLE_SIZE = 256; // 2^8
    this.fastTable = new Array(FAST_TABLE_SIZE);
    this.fastTableSymbols = new Array(FAST_TABLE_SIZE);

    for (let i = 0; i < FAST_TABLE_SIZE; i++) {
      this.fastTable[i] = -1; // -1 = need more bits
      this.fastTableSymbols[i] = -1;
    }

    // Populate fast table with 8-bit prefixes
    for (let symbol = 0; symbol < 256; symbol++) {
      const code = this.codes[symbol];
      const length = this.codeLengths[symbol];

      if (length === undefined || code === undefined) continue;

      if (length <= 8) {
        // Can fit in fast table
        const prefix = code << (8 - length);
        const mask = (1 << (8 - length)) - 1;

        for (let i = 0; i <= mask; i++) {
          const index = prefix | i;
          if (this.fastTable[index] === -1) {
            this.fastTable[index] = length;
            this.fastTableSymbols[index] = symbol;
          }
        }
      }
    }
  }

  /**
   * Decode next Huffman symbol from bit reader.
   *
   * @param {BitReader} bitReader - Bit reader instance
   * @returns {number} Decoded symbol
   * @throws {Error} If invalid Huffman code
   */
  decodeSymbol(bitReader) {
    // Try fast table first
    if (bitReader.bitCount >= 8) {
      const peek = bitReader.bitBuffer >>> (bitReader.bitCount - 8);
      const fastLength = this.fastTable[peek];

      if (fastLength !== -1) {
        // Fast path hit
        const symbol = this.fastTableSymbols[peek];
        // Consume the bits
        bitReader.bitCount -= fastLength;
        return symbol;
      }
    }

    // Slow path: build code bit by bit
    let code = 0;
    let length = 0;

    while (length < 16) {
      code = (code << 1) | bitReader.readBit();
      length++;

      // Check if this code matches any symbol
      for (let symbol = 0; symbol < 256; symbol++) {
        if (this.codes[symbol] === code && this.codeLengths[symbol] === length) {
          return symbol;
        }
      }
    }

    throw new Error("Invalid Huffman code");
  }
}

/**
 * Huffman decoder state for scan processing.
 */
export class HuffmanDecoder {
  /**
   * Create decoder with DC and AC tables.
   *
   * @param {HuffmanTable} dcTable - DC Huffman table
   * @param {HuffmanTable} acTable - AC Huffman table
   */
  constructor(dcTable, acTable) {
    this.dcTable = dcTable;
    this.acTable = acTable;
    this.dcPredictor = 0; // DC predictor for component
  }

  /**
   * Decode DC coefficient.
   *
   * @param {BitReader} bitReader - Bit reader
   * @returns {number} DC coefficient value
   */
  decodeDC(bitReader) {
    const symbol = this.dcTable.decodeSymbol(bitReader);

    if (symbol === 0) {
      // No additional bits
      this.dcPredictor = 0;
      return 0;
    }

    const diff = bitReader.receiveSigned(symbol);
    const coeff = this.dcPredictor + diff;
    this.dcPredictor = coeff;

    return coeff;
  }

  /**
   * Decode AC coefficients for block.
   *
   * @param {BitReader} bitReader - Bit reader
   * @param {Int16Array} block - 64-element block to fill
   * @param {number} startIndex - Starting coefficient index (0 for DC, 1 for AC)
   */
  decodeAC(bitReader, block, startIndex = 1) {
    let k = startIndex;

    while (k < 64) {
      const rs = this.acTable.decodeSymbol(bitReader);
      const r = rs >>> 4; // Run length
      const s = rs & 15; // Size of coefficient

      if (rs === 0) {
        // EOB - end of block
        break;
      }

      if (rs === 0xf0) {
        // ZRL - 16 zeros
        k += 16;
        continue;
      }

      // Skip r zeros
      k += r;

      if (k >= 64) break;

      // Read coefficient
      const coeff = bitReader.receiveSigned(s);
      block[k] = coeff;
      k++;
    }

    // Fill remaining with zeros
    for (; k < 64; k++) {
      block[k] = 0;
    }
  }

  /**
   * Reset DC predictor (called at restart markers).
   */
  resetPredictor() {
    this.dcPredictor = 0;
  }
}
