/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * VP8L Huffman Decoder (Corrected Implementation)
 *
 * Implements canonical Huffman decoding for VP8L lossless WebP format.
 * This is a completely rewritten version using the correct algorithm.
 *
 * @fileoverview Zero-dependency canonical Huffman decoder
 */

/**
 * Builds a canonical Huffman table from code lengths using the correct algorithm.
 *
 * @param {Uint8Array} codeLengths - Array of code lengths for each symbol
 * @returns {{table: Uint16Array, maxBits: number, symbols: number, lengths: Uint8Array}} Huffman table
 * @throws {Error} For invalid code length distributions
 */
export function buildHuffman(codeLengths) {
  if (!codeLengths || !(codeLengths instanceof Uint8Array)) {
    throw new Error("Huffman: code lengths must be Uint8Array");
  }

  if (codeLengths.length === 0) {
    throw new Error("Huffman: invalid symbol count 0");
  }

  // Count symbols and find max length
  let symbolCount = 0;
  let maxBits = 0;
  let singleSymbol = -1;

  for (let i = 0; i < codeLengths.length; i++) {
    const length = codeLengths[i];

    if (length > 15) {
      throw new Error(`Huffman: code length ${length} exceeds maximum 15`);
    }

    if (length > 0) {
      symbolCount++;
      maxBits = Math.max(maxBits, length);
      singleSymbol = i;
    }
  }

  if (symbolCount === 0) {
    throw new Error("Huffman: no symbols in tree");
  }

  // Count symbols at each length
  const lengthCounts = new Array(maxBits + 1).fill(0);
  for (let i = 0; i < codeLengths.length; i++) {
    if (codeLengths[i] > 0) {
      lengthCounts[codeLengths[i]]++;
    }
  }

  // Check Kraft inequality: sum of 2^(-length) must equal 1
  let kraftSum = 0;
  for (let length = 1; length <= maxBits; length++) {
    kraftSum += lengthCounts[length] / 2 ** length;
  }

  const tolerance = 1e-10;
  if (kraftSum > 1.0 + tolerance) {
    throw new Error("Huffman: over-subscribed tree");
  }
  // Under-subscription: permitted at build time; invalid paths surface during decode.

  // Handle single symbol case (after Kraft check)
  if (symbolCount === 1) {
    const tableSize = 1 << maxBits;
    const table = new Uint16Array(tableSize);
    table.fill(singleSymbol);

    return {
      table,
      maxBits,
      symbols: 1,
      lengths: new Uint8Array(tableSize),
    };
  }

  // Build canonical codes using the standard algorithm
  // Step 1: Calculate starting codes for each length
  const startCodes = new Array(maxBits + 1).fill(0);
  let code = 0;
  for (let length = 1; length <= maxBits; length++) {
    startCodes[length] = code;
    code += lengthCounts[length];
    code <<= 1;
  }

  // Step 2: Assign codes to symbols in canonical order
  const codes = new Array(codeLengths.length).fill(0);
  const currentCodes = [...startCodes]; // Copy to avoid modifying original
  for (let symbol = 0; symbol < codeLengths.length; symbol++) {
    const length = codeLengths[symbol];
    if (length > 0) {
      codes[symbol] = currentCodes[length];
      currentCodes[length]++;
    }
  }

  // Step 3: Build lookup table for LSB-first bit reading
  const tableSize = 1 << maxBits;
  const table = new Uint16Array(tableSize);
  table.fill(0xffff); // Invalid marker
  // Parallel table storing the code length for each filled entry
  const lengths = new Uint8Array(tableSize);

  for (let symbol = 0; symbol < codeLengths.length; symbol++) {
    const length = codeLengths[symbol];
    if (length === 0) continue;

    const code = codes[symbol];

    // For LSB-first reading, we need to reverse the bits and fill extensions
    const reversedCode = reverseBits(code, length);
    const step = 1 << length;

    // Fill all table entries that match this reversed code
    for (let i = reversedCode; i < tableSize; i += step) {
      table[i] = symbol;
      lengths[i] = length;
    }
  }

  return {
    table,
    maxBits,
    symbols: symbolCount,
    lengths,
  };
}

/**
 * Simple test to verify the implementation works
 */
function test() {
  console.log("Testing new Huffman implementation...");

  // Test [1, 1] - should work
  try {
    const huffman = buildHuffman(new Uint8Array([1, 1]));
    console.log("✓ [1,1] test passed:", huffman.table);
  } catch (e) {
    console.log("✗ [1,1] test failed:", e.message);
  }

  // Test [3, 1, 3, 2] - should work with Kraft sum = 1.0
  try {
    const huffman = buildHuffman(new Uint8Array([3, 1, 3, 2]));
    console.log("✓ [3,1,3,2] test passed:", huffman.table.slice(0, 8));
  } catch (e) {
    console.log("✗ [3,1,3,2] test failed:", e.message);
  }

  // Test [2, 1, 3, 2] - should fail (over-subscribed)
  try {
    const _huffman = buildHuffman(new Uint8Array([2, 1, 3, 2]));
    console.log("✗ [2,1,3,2] should have failed but passed");
  } catch (e) {
    console.log("✓ [2,1,3,2] correctly failed:", e.message);
  }
}

/**
 * Decodes a single symbol from the bit stream using the Huffman table.
 *
 * @param {object} reader - Bit reader with readBits method
 * @param {object} huffman - Huffman table from buildHuffman
 * @returns {number} Decoded symbol
 * @throws {Error} For invalid codes or reader errors
 */
export function decodeSymbol(reader, huffman) {
  // @ts-expect-error - reader validated to have readBits method
  if (!reader || typeof reader.readBits !== "function") {
    throw new Error("Huffman: reader must have readBits method");
  }

  // @ts-expect-error - huffman validated to have required properties
  if (!huffman || !huffman.table || !huffman.maxBits) {
    throw new Error("Huffman: invalid huffman table");
  }

  // Handle single symbol case
  // @ts-expect-error - huffman validated above
  if (huffman.symbols === 1) {
    // @ts-expect-error - huffman validated above
    return huffman.table[0];
  }

  // Incremental variable-length decode using the precomputed table.
  // Read one bit at a time; at each length L, check the block head index
  // (prefix left-shifted to maxBits) for a resolved symbol.
  // @ts-expect-error - huffman validated above
  const maxBits = huffman.maxBits;

  // Accumulate bits in LSB-first order so that after reading `length` bits,
  // the low `length` bits of `lsbPrefix` match the table's filled pattern.
  let lsbPrefix = 0;
  let msbPrefix = 0;
  for (let length = 1; length <= maxBits; length++) {
    // @ts-expect-error - runtime bit reader provides readBits
    const bit = reader.readBits(1);
    // Place the newly read bit at position (length - 1)
    lsbPrefix |= bit << (length - 1);
    msbPrefix = (msbPrefix << 1) | bit;

    const index = lsbPrefix; // high bits are zero → block head index
    // @ts-expect-error - huffman validated above
    const candidate = huffman.table[index];
    // @ts-expect-error - huffman validated above
    const candLen = huffman.lengths[index];
    if (candidate !== 0xffff && candLen === length) {
      return candidate;
    }
  }

  throw new Error(`Huffman: invalid code ${msbPrefix.toString(2).padStart(maxBits, "0")}`);
}

/**
 * Creates a simple bit reader from a Uint8Array.
 * This is a basic implementation for Huffman testing.
 *
 * @param {Uint8Array} data - Input data
 * @param {number} [offset=0] - Starting byte offset
 * @returns {{readBits: function(number): number, tell: function(): number, hasData: function(): boolean}} Bit reader with readBits, tell, and hasData methods
 */
export function createBitReader(data, offset = 0) {
  let bytePos = offset;
  let bitPos = 0;

  return {
    /**
     * Reads the specified number of bits from the stream.
     *
     * @param {number} numBits - Number of bits to read (1-16)
     * @returns {number} Read bits as integer
     * @throws {Error} For invalid bit count or end of data
     */
    readBits(numBits) {
      if (numBits < 1 || numBits > 16) {
        throw new Error(`BitReader: invalid bit count ${numBits}`);
      }

      let result = 0;
      let bitsRead = 0;

      while (bitsRead < numBits) {
        // Check if we need to advance to next byte
        if (bitPos >= 8) {
          bytePos++;
          bitPos = 0;
        }

        if (bytePos >= data.length) {
          throw new Error("BitReader: unexpected end of data");
        }

        // Read one bit (LSB first)
        const bit = (data[bytePos] >> bitPos) & 1;
        result = (result << 1) | bit;

        bitPos++;
        bitsRead++;
      }

      return result;
    },

    /**
     * Checks if there's more data available.
     *
     * @returns {boolean} True if more data is available
     */
    hasData() {
      return bytePos < data.length && bitPos < 8;
    },

    /**
     * Gets the current bit position.
     *
     * @returns {number} Current bit position
     */
    tell() {
      return (bytePos - offset) * 8 + bitPos;
    },
  };
}

/**
 * Validates a Huffman tree for correctness.
 *
 * @param {Uint8Array} codeLengths - Code lengths to validate
 * @returns {{valid: boolean, totalCodes?: number, error?: string}} Validation result
 */
export function validateHuffmanTree(codeLengths) {
  if (!codeLengths || !(codeLengths instanceof Uint8Array)) {
    return { valid: false, error: "code lengths must be Uint8Array" };
  }
  if (codeLengths.length === 0) {
    return { valid: false, error: "invalid symbol count 0" };
  }
  let symbolCount = 0;
  let maxBits = 0;
  for (let i = 0; i < codeLengths.length; i++) {
    const len = codeLengths[i] >>> 0;
    if (len > 15) return { valid: false, error: `code length ${len} exceeds maximum 15` };
    if (len > 0) {
      symbolCount++;
      if (len > maxBits) maxBits = len;
    }
  }
  if (symbolCount === 0) return { valid: false, error: "no symbols in tree" };
  const lengthCounts = new Array(maxBits + 1).fill(0);
  for (let i = 0; i < codeLengths.length; i++) {
    const len = codeLengths[i];
    if (len > 0) lengthCounts[len]++;
  }
  let kraftSum = 0;
  for (let l = 1; l <= maxBits; l++) kraftSum += lengthCounts[l] / (1 << l);
  const tolerance = 1e-10;
  if (kraftSum > 1.0 + tolerance) return { valid: false, error: "over-subscribed tree" };
  if (kraftSum < 1.0 - tolerance) {
    // Single-symbol with length 1 is fine; others are invalid as standalone
    if (symbolCount === 1 && maxBits === 1) {
      // valid trivial
    } else {
      return { valid: false, error: "under-subscribed tree" };
    }
  }
  return { valid: true, totalCodes: symbolCount };
}

/**
 * Builds a meta-Huffman table for code length encoding.
 *
 * @param {Uint8Array} metaCodeLengths - Meta code lengths (19 symbols max)
 * @returns {object} Meta Huffman table
 * @throws {Error} For invalid meta code lengths
 */
export function buildMetaHuffman(metaCodeLengths) {
  if (!metaCodeLengths || metaCodeLengths.length > 19) {
    throw new Error("Huffman: meta tree too large");
  }

  // Pad to 19 symbols if needed
  const paddedLengths = new Uint8Array(19);
  paddedLengths.set(metaCodeLengths);

  return buildHuffman(paddedLengths);
}

/**
 * Reverses the bits in a number for the given bit length.
 *
 * @param {number} value - The value to reverse
 * @param {number} bits - Number of bits to consider
 * @returns {number} The bit-reversed value
 */
function reverseBits(value, bits) {
  let result = 0;
  for (let i = 0; i < bits; i++) {
    result = (result << 1) | (value & 1);
    value >>= 1;
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  test();
}
