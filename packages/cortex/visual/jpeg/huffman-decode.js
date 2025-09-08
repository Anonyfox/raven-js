/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG Huffman entropy decoder implementation.
 *
 * Implements ITU-T T.81 Annex F Huffman entropy decoding with state machine
 * for DC/AC coefficient extraction, differential DC prediction, marker stuffing
 * handling, and progressive JPEG support. Transforms bit streams into quantized
 * DCT coefficients using canonical Huffman tables.
 */

/**
 * Maximum DC coefficient category (0-11 for 8-bit precision).
 * ITU-T T.81 Table F.1 constraint.
 *
 * @type {number}
 */
export const MAX_DC_CATEGORY = 11;

/**
 * Maximum AC coefficient category (0-10 for 8-bit precision).
 * ITU-T T.81 Table F.2 constraint.
 *
 * @type {number}
 */
export const MAX_AC_CATEGORY = 10;

/**
 * End of Block (EOB) symbol for AC coefficients.
 * Indicates no more non-zero AC coefficients in current block.
 *
 * @type {number}
 */
export const EOB_SYMBOL = 0x00;

/**
 * Zero Run Length (ZRL) symbol for AC coefficients.
 * Represents 16 consecutive zero coefficients.
 *
 * @type {number}
 */
export const ZRL_SYMBOL = 0xf0;

/**
 * Number of coefficients in an 8x8 DCT block.
 * Standard JPEG block size.
 *
 * @type {number}
 */
export const BLOCK_SIZE = 64;

/**
 * Zigzag scan order for 8x8 DCT blocks.
 * ITU-T T.81 Figure A.6 - natural order to zigzag order.
 *
 * @type {number[]}
 */
export const ZIGZAG_ORDER = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28,
  35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47,
  55, 62, 63,
];

/**
 * Bit stream reader for JPEG entropy-coded data.
 * Handles marker stuffing, bit alignment, and efficient bit extraction.
 */
export class BitStreamReader {
  /**
   * Create a bit stream reader.
   *
   * @param {Uint8Array} data - Entropy-coded data buffer
   * @param {number} [offset=0] - Starting offset in buffer
   */
  constructor(data, offset = 0) {
    if (!(data instanceof Uint8Array)) {
      throw new TypeError("Expected data to be Uint8Array");
    }

    /** @type {Uint8Array} */
    this.data = data;
    /** @type {number} */
    this.byteOffset = offset;
    /** @type {number} */
    this.bitOffset = 0;
    /** @type {number} */
    this.bitBuffer = 0;
    /** @type {number} */
    this.bitsInBuffer = 0;
    /** @type {boolean} */
    this.markerFound = false;
    /** @type {number} */
    this.foundMarker = 0;
  }

  /**
   * Check if more data is available for reading.
   *
   * @returns {boolean} True if more bits can be read
   */
  hasMoreBits() {
    return this.byteOffset < this.data.length || this.bitsInBuffer > 0;
  }

  /**
   * Peek at the next byte without consuming it.
   * Used for marker detection.
   *
   * @returns {number} Next byte value or -1 if no more data
   * @private
   */
  peekByte() {
    if (this.byteOffset >= this.data.length) {
      return -1;
    }
    return this.data[this.byteOffset];
  }

  /**
   * Read next byte from stream with marker stuffing handling.
   * Handles 0xFF00 → 0xFF conversion and marker detection.
   *
   * @returns {number} Next byte value or -1 if marker found/end of data
   * @private
   */
  readByte() {
    if (this.byteOffset >= this.data.length) {
      return -1;
    }

    const byte = this.data[this.byteOffset++];

    // Handle marker stuffing
    if (byte === 0xff) {
      const nextByte = this.peekByte();

      if (nextByte === 0x00) {
        // 0xFF00 → 0xFF (stuffed byte)
        this.byteOffset++; // Skip the 0x00
        return 0xff;
      }

      if (nextByte >= 0xd0 && nextByte <= 0xd7) {
        // RST marker - consume it but continue
        this.byteOffset++;
        return this.readByte(); // Read next byte after RST
      }

      if (nextByte !== -1) {
        // Found a marker
        this.markerFound = true;
        this.foundMarker = (0xff << 8) | nextByte;
        return -1;
      }
    }

    return byte;
  }

  /**
   * Fill bit buffer with available bits.
   * Maintains at least 8 bits in buffer when possible.
   *
   * @private
   */
  fillBitBuffer() {
    while (this.bitsInBuffer < 24 && !this.markerFound) {
      const byte = this.readByte();
      if (byte === -1) {
        break;
      }

      this.bitBuffer = (this.bitBuffer << 8) | byte;
      this.bitsInBuffer += 8;
    }
  }

  /**
   * Read specified number of bits from stream.
   * Returns bits in MSB-first order.
   *
   * @param {number} numBits - Number of bits to read (1-16)
   * @returns {number} Bits read as integer
   * @throws {Error} If not enough bits available
   */
  readBits(numBits) {
    if (numBits < 1 || numBits > 16) {
      throw new Error(`Invalid bit count: ${numBits} (must be 1-16)`);
    }

    this.fillBitBuffer();

    if (this.bitsInBuffer < numBits) {
      throw new Error(`Not enough bits: need ${numBits}, have ${this.bitsInBuffer}`);
    }

    // Extract bits from MSB side
    const shift = this.bitsInBuffer - numBits;
    const mask = (1 << numBits) - 1;
    const bits = (this.bitBuffer >> shift) & mask;

    // Update buffer state
    this.bitsInBuffer -= numBits;
    this.bitBuffer &= (1 << this.bitsInBuffer) - 1;

    return bits;
  }

  /**
   * Peek at next bits without consuming them.
   * Used for Huffman code lookup.
   *
   * @param {number} numBits - Number of bits to peek (1-16)
   * @returns {number} Bits as integer or -1 if not enough bits
   */
  peekBits(numBits) {
    if (numBits < 1 || numBits > 16) {
      return -1;
    }

    this.fillBitBuffer();

    if (this.bitsInBuffer < numBits) {
      return -1;
    }

    const shift = this.bitsInBuffer - numBits;
    const mask = (1 << numBits) - 1;
    return (this.bitBuffer >> shift) & mask;
  }

  /**
   * Skip specified number of bits.
   * Used after successful Huffman decode.
   *
   * @param {number} numBits - Number of bits to skip
   */
  skipBits(numBits) {
    this.fillBitBuffer();

    if (numBits < 1 || numBits > this.bitsInBuffer) {
      throw new Error(`Cannot skip ${numBits} bits: only ${this.bitsInBuffer} available`);
    }

    this.bitsInBuffer -= numBits;
    this.bitBuffer &= (1 << this.bitsInBuffer) - 1;
  }

  /**
   * Check if a marker was encountered during reading.
   *
   * @returns {boolean} True if marker found
   */
  hasMarker() {
    return this.markerFound;
  }

  /**
   * Get the marker that was found.
   *
   * @returns {number} Marker code or 0 if no marker
   */
  getMarker() {
    return this.foundMarker;
  }
}

/**
 * Decode Huffman symbol using canonical Huffman table.
 * Uses fast lookup for short codes, sequential search for long codes.
 *
 * @param {BitStreamReader} reader - Bit stream reader
 * @param {{lookup: number[], maxCode: number[], codes: Map<number, {code: number, length: number}>}} huffmanTable - Canonical Huffman table
 * @returns {number} Decoded symbol or -1 if invalid code
 */
export function decodeHuffmanSymbol(reader, huffmanTable) {
  if (!reader || !huffmanTable) {
    throw new Error("Invalid reader or Huffman table");
  }

  const { maxCode, codes } = huffmanTable;

  // Sequential decode - build code bit by bit
  let code = 0;
  for (let length = 1; length <= 16; length++) {
    const bit = reader.readBits(1);
    if (bit === -1) {
      return -1; // Not enough bits
    }

    code = (code << 1) | bit;

    // Only check for symbols if this length has valid codes
    if (maxCode[length] !== -1 && code <= maxCode[length]) {
      // Check if this exact code exists at this length
      for (const [symbol, { code: symbolCode, length: symbolLength }] of codes) {
        if (symbolCode === code && symbolLength === length) {
          return symbol;
        }
      }
    }
  }

  return -1; // Invalid code
}

/**
 * Decode DC coefficient with differential prediction.
 * Handles category decoding, magnitude reading, and predictor update.
 *
 * @param {BitStreamReader} reader - Bit stream reader
 * @param {{lookup: number[], maxCode: number[], codes: Map<number, {code: number, length: number}>}} dcTable - DC Huffman table
 * @param {number} predictor - Current DC predictor value
 * @returns {{coefficient: number, newPredictor: number}} Decoded DC coefficient and updated predictor
 * @throws {Error} If decoding fails
 */
export function decodeDCCoefficient(reader, dcTable, predictor) {
  // Decode DC category
  const category = decodeHuffmanSymbol(reader, dcTable);
  if (category === -1) {
    throw new Error("Failed to decode DC category");
  }

  if (category < 0 || category > MAX_DC_CATEGORY) {
    throw new Error(`Invalid DC category: ${category} (must be 0-${MAX_DC_CATEGORY})`);
  }

  let magnitude = 0;
  if (category > 0) {
    // Read magnitude bits
    magnitude = reader.readBits(category);

    // Apply sign extension for negative values
    if (magnitude < 1 << (category - 1)) {
      magnitude -= (1 << category) - 1;
    }
  }

  // Apply differential prediction
  const coefficient = predictor + magnitude;
  return {
    coefficient,
    newPredictor: coefficient,
  };
}

/**
 * Decode AC coefficients for a single 8x8 block.
 * Handles run-length decoding, EOB, ZRL, and zigzag placement.
 *
 * @param {BitStreamReader} reader - Bit stream reader
 * @param {{lookup: number[], maxCode: number[], codes: Map<number, {code: number, length: number}>}} acTable - AC Huffman table
 * @param {number[]} block - 64-element coefficient block (modified in place)
 * @param {number} startCoeff - Starting coefficient index (for progressive)
 * @param {number} endCoeff - Ending coefficient index (for progressive)
 * @returns {number} Number of coefficients decoded
 * @throws {Error} If decoding fails
 */
export function decodeACCoefficients(reader, acTable, block, startCoeff = 1, endCoeff = 63) {
  if (!Array.isArray(block) || block.length !== BLOCK_SIZE) {
    throw new Error("Expected 64-element coefficient block");
  }

  if (startCoeff < 1 || startCoeff > 63 || endCoeff < startCoeff || endCoeff > 63) {
    throw new Error(`Invalid coefficient range: ${startCoeff}-${endCoeff}`);
  }

  let coeffIndex = startCoeff;
  let coefficientsDecoded = 0;

  while (coeffIndex <= endCoeff) {
    // Decode run/size symbol
    const symbol = decodeHuffmanSymbol(reader, acTable);
    if (symbol === -1) {
      throw new Error("Failed to decode AC symbol");
    }

    // Handle special symbols
    if (symbol === EOB_SYMBOL) {
      // End of block - fill remaining coefficients with zero
      while (coeffIndex <= endCoeff) {
        block[ZIGZAG_ORDER[coeffIndex++]] = 0;
      }
      break;
    }

    if (symbol === ZRL_SYMBOL) {
      // Zero run length - skip 16 coefficients
      for (let i = 0; i < 16 && coeffIndex <= endCoeff; i++) {
        block[ZIGZAG_ORDER[coeffIndex++]] = 0;
      }
      continue;
    }

    // Extract run and size from symbol
    const run = (symbol >> 4) & 0x0f;
    const size = symbol & 0x0f;

    if (size < 0 || size > MAX_AC_CATEGORY) {
      throw new Error(`Invalid AC coefficient size: ${size} (must be 0-${MAX_AC_CATEGORY})`);
    }

    // Skip run zeros
    for (let i = 0; i < run && coeffIndex <= endCoeff; i++) {
      block[ZIGZAG_ORDER[coeffIndex++]] = 0;
    }

    if (coeffIndex > endCoeff) {
      break;
    }

    // Decode coefficient magnitude
    let magnitude = 0;
    if (size > 0) {
      magnitude = reader.readBits(size);

      // Apply sign extension for negative values
      if (magnitude < 1 << (size - 1)) {
        magnitude -= (1 << size) - 1;
      }
    }

    // Place coefficient in zigzag order
    block[ZIGZAG_ORDER[coeffIndex]] = magnitude;
    coeffIndex++;
    coefficientsDecoded++;
  }

  return coefficientsDecoded;
}

/**
 * Huffman entropy decoder state machine.
 * Manages multi-component MCU decoding with DC prediction.
 */
export class HuffmanDecoder {
  /**
   * Create Huffman decoder.
   *
   * @param {Array<{id: number, dcTableId: number, acTableId: number}>} components - Scan components
   * @param {Array<{class: number, id: number, lookup: number[], maxCode: number[], codes: Map<number, {code: number, length: number}>}>} huffmanTables - Huffman tables
   * @param {number} startSpectral - Start of spectral selection (Ss)
   * @param {number} endSpectral - End of spectral selection (Se)
   */
  constructor(components, huffmanTables, startSpectral = 0, endSpectral = 63) {
    if (!Array.isArray(components) || components.length === 0) {
      throw new Error("Expected non-empty components array");
    }

    if (!Array.isArray(huffmanTables)) {
      throw new Error("Expected huffmanTables array");
    }

    /** @type {Array<{id: number, dcTableId: number, acTableId: number, dcTable: {lookup: number[], maxCode: number[], codes: Map<number, {code: number, length: number}>}, acTable: {lookup: number[], maxCode: number[], codes: Map<number, {code: number, length: number}>}}>} */
    this.components = components.map((comp) => {
      const dcTable = huffmanTables.find((t) => t.class === 0 && t.id === comp.dcTableId);
      const acTable = huffmanTables.find((t) => t.class === 1 && t.id === comp.acTableId);

      if (!dcTable) {
        throw new Error(`DC Huffman table ${comp.dcTableId} not found for component ${comp.id}`);
      }

      if (!acTable && endSpectral > 0) {
        throw new Error(`AC Huffman table ${comp.acTableId} not found for component ${comp.id}`);
      }

      return {
        ...comp,
        dcTable,
        acTable,
      };
    });

    /** @type {number} */
    this.startSpectral = startSpectral;
    /** @type {number} */
    this.endSpectral = endSpectral;
    /** @type {number[]} */
    this.dcPredictors = new Array(components.length).fill(0);
    /** @type {boolean} */
    this.isDCOnly = startSpectral === 0 && endSpectral === 0;
    /** @type {boolean} */
    this.isACOnly = startSpectral > 0;
  }

  /**
   * Reset DC predictors to zero.
   * Called when RST marker is encountered.
   */
  resetPredictors() {
    this.dcPredictors.fill(0);
  }

  /**
   * Decode single MCU (Minimum Coded Unit).
   * Returns array of coefficient blocks for each component.
   *
   * @param {BitStreamReader} reader - Bit stream reader
   * @returns {number[][]} Array of 64-element coefficient blocks
   * @throws {Error} If decoding fails
   */
  decodeMCU(reader) {
    const blocks = [];

    for (let compIndex = 0; compIndex < this.components.length; compIndex++) {
      const component = this.components[compIndex];
      const block = new Array(BLOCK_SIZE).fill(0);

      // Decode DC coefficient (if in range)
      if (this.startSpectral === 0 && !this.isACOnly) {
        const { coefficient, newPredictor } = decodeDCCoefficient(
          reader,
          component.dcTable,
          this.dcPredictors[compIndex]
        );

        block[0] = coefficient;
        this.dcPredictors[compIndex] = newPredictor;
      }

      // Decode AC coefficients (if in range)
      if (this.endSpectral > 0 && !this.isDCOnly) {
        const startCoeff = Math.max(1, this.startSpectral);
        const endCoeff = this.endSpectral;

        decodeACCoefficients(reader, component.acTable, block, startCoeff, endCoeff);
      }

      blocks.push(block);
    }

    return blocks;
  }
}

/**
 * Get summary information about Huffman decoder state.
 * Provides debugging information about decoder configuration.
 *
 * @param {HuffmanDecoder} decoder - Huffman decoder instance
 * @returns {Object} Summary information
 */
export function getHuffmanDecoderSummary(decoder) {
  if (!decoder || !(decoder instanceof HuffmanDecoder)) {
    throw new TypeError("Expected HuffmanDecoder instance");
  }

  const componentSummary = decoder.components.map((comp) => ({
    id: comp.id,
    dcTableId: comp.dcTableId,
    acTableId: comp.acTableId,
    hasDCTable: !!comp.dcTable,
    hasACTable: !!comp.acTable,
  }));

  return {
    componentCount: decoder.components.length,
    components: componentSummary,
    spectralRange: `${decoder.startSpectral}-${decoder.endSpectral}`,
    isDCOnly: decoder.isDCOnly,
    isACOnly: decoder.isACOnly,
    dcPredictors: [...decoder.dcPredictors],
    description: `Huffman decoder: ${decoder.components.length} component${decoder.components.length === 1 ? "" : "s"}, spectral ${decoder.startSpectral}-${decoder.endSpectral}`,
  };
}
