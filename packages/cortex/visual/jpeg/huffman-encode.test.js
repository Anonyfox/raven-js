/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  BitStreamWriter,
  COEFFICIENT_CATEGORIES,
  collectSymbolStatistics,
  createACSymbol,
  DEFAULT_HUFFMAN_OPTIONS,
  encodeCoefficientMagnitude,
  encodeHuffmanBlocks,
  generateOptimalHuffmanTable,
  getCoefficientCategory,
  getStandardHuffmanTable,
  HUFFMAN_TABLE_CLASSES,
  HUFFMAN_TABLE_TYPES,
  HuffmanEncodingMetrics,
  parseACSymbol,
  SPECIAL_AC_SYMBOLS,
  STANDARD_AC_CHROMINANCE_TABLE,
  STANDARD_AC_LUMINANCE_TABLE,
  STANDARD_DC_CHROMINANCE_TABLE,
  STANDARD_DC_LUMINANCE_TABLE,
  validateHuffmanTable,
} from "./huffman-encode.js";

describe("Huffman Entropy Encoding with Optimal Tables", () => {
  describe("Constants and Definitions", () => {
    it("defines Huffman table types", () => {
      assert.equal(HUFFMAN_TABLE_TYPES.DC, "dc");
      assert.equal(HUFFMAN_TABLE_TYPES.AC, "ac");
    });

    it("defines Huffman table classes", () => {
      assert.equal(HUFFMAN_TABLE_CLASSES.LUMINANCE, "luminance");
      assert.equal(HUFFMAN_TABLE_CLASSES.CHROMINANCE, "chrominance");
    });

    it("defines coefficient categories", () => {
      assert.equal(COEFFICIENT_CATEGORIES.CAT_0, 0);
      assert.equal(COEFFICIENT_CATEGORIES.CAT_1, 1);
      assert.equal(COEFFICIENT_CATEGORIES.CAT_15, 15);
    });

    it("defines special AC symbols", () => {
      assert.deepEqual(SPECIAL_AC_SYMBOLS.EOB, { run: 0, category: 0 });
      assert.deepEqual(SPECIAL_AC_SYMBOLS.ZRL, { run: 15, category: 0 });
    });

    it("defines default options", () => {
      assert.equal(DEFAULT_HUFFMAN_OPTIONS.generateOptimalTables, true);
      assert.equal(DEFAULT_HUFFMAN_OPTIONS.useStandardTables, false);
      assert.equal(DEFAULT_HUFFMAN_OPTIONS.trackStatistics, true);
      assert.equal(DEFAULT_HUFFMAN_OPTIONS.validateOutput, true);
      assert.equal(DEFAULT_HUFFMAN_OPTIONS.enableByteStuffing, true);
      assert.equal(DEFAULT_HUFFMAN_OPTIONS.bufferSize, 65536);
    });

    it("defines standard Huffman tables", () => {
      assert(Array.isArray(STANDARD_DC_LUMINANCE_TABLE.codeLengths));
      assert(Array.isArray(STANDARD_DC_LUMINANCE_TABLE.symbols));
      assert.equal(STANDARD_DC_LUMINANCE_TABLE.codeLengths.length, 16);

      assert(Array.isArray(STANDARD_AC_LUMINANCE_TABLE.codeLengths));
      assert(Array.isArray(STANDARD_AC_LUMINANCE_TABLE.symbols));
      assert.equal(STANDARD_AC_LUMINANCE_TABLE.codeLengths.length, 16);

      assert(Array.isArray(STANDARD_DC_CHROMINANCE_TABLE.codeLengths));
      assert(Array.isArray(STANDARD_DC_CHROMINANCE_TABLE.symbols));

      assert(Array.isArray(STANDARD_AC_CHROMINANCE_TABLE.codeLengths));
      assert(Array.isArray(STANDARD_AC_CHROMINANCE_TABLE.symbols));
    });
  });

  describe("Coefficient Categorization", () => {
    it("categorizes zero coefficient", () => {
      assert.equal(getCoefficientCategory(0), COEFFICIENT_CATEGORIES.CAT_0);
    });

    it("categorizes small positive coefficients", () => {
      assert.equal(getCoefficientCategory(1), COEFFICIENT_CATEGORIES.CAT_1);
      assert.equal(getCoefficientCategory(2), COEFFICIENT_CATEGORIES.CAT_2);
      assert.equal(getCoefficientCategory(3), COEFFICIENT_CATEGORIES.CAT_2);
      assert.equal(getCoefficientCategory(4), COEFFICIENT_CATEGORIES.CAT_3);
      assert.equal(getCoefficientCategory(7), COEFFICIENT_CATEGORIES.CAT_3);
    });

    it("categorizes small negative coefficients", () => {
      assert.equal(getCoefficientCategory(-1), COEFFICIENT_CATEGORIES.CAT_1);
      assert.equal(getCoefficientCategory(-2), COEFFICIENT_CATEGORIES.CAT_2);
      assert.equal(getCoefficientCategory(-3), COEFFICIENT_CATEGORIES.CAT_2);
      assert.equal(getCoefficientCategory(-4), COEFFICIENT_CATEGORIES.CAT_3);
      assert.equal(getCoefficientCategory(-7), COEFFICIENT_CATEGORIES.CAT_3);
    });

    it("categorizes medium range coefficients", () => {
      assert.equal(getCoefficientCategory(15), COEFFICIENT_CATEGORIES.CAT_4);
      assert.equal(getCoefficientCategory(31), COEFFICIENT_CATEGORIES.CAT_5);
      assert.equal(getCoefficientCategory(63), COEFFICIENT_CATEGORIES.CAT_6);
      assert.equal(getCoefficientCategory(127), COEFFICIENT_CATEGORIES.CAT_7);
      assert.equal(getCoefficientCategory(255), COEFFICIENT_CATEGORIES.CAT_8);
    });

    it("categorizes large coefficients", () => {
      assert.equal(getCoefficientCategory(511), COEFFICIENT_CATEGORIES.CAT_9);
      assert.equal(getCoefficientCategory(1023), COEFFICIENT_CATEGORIES.CAT_10);
      assert.equal(getCoefficientCategory(2047), COEFFICIENT_CATEGORIES.CAT_11);
      assert.equal(getCoefficientCategory(4095), COEFFICIENT_CATEGORIES.CAT_12);
      assert.equal(getCoefficientCategory(8191), COEFFICIENT_CATEGORIES.CAT_13);
      assert.equal(getCoefficientCategory(16383), COEFFICIENT_CATEGORIES.CAT_14);
      assert.equal(getCoefficientCategory(32767), COEFFICIENT_CATEGORIES.CAT_15);
    });

    it("throws on coefficient too large", () => {
      assert.throws(() => {
        getCoefficientCategory(32768);
      }, /Coefficient magnitude too large/);

      assert.throws(() => {
        getCoefficientCategory(-32768);
      }, /Coefficient magnitude too large/);
    });
  });

  describe("Magnitude Encoding", () => {
    it("encodes zero coefficient", () => {
      const result = encodeCoefficientMagnitude(0, 0);
      assert.equal(result.bits, 0);
      assert.equal(result.length, 0);
    });

    it("encodes positive coefficients", () => {
      // Category 1: ±1
      let result = encodeCoefficientMagnitude(1, 1);
      assert.equal(result.bits, 1);
      assert.equal(result.length, 1);

      // Category 2: ±2,±3
      result = encodeCoefficientMagnitude(2, 2);
      assert.equal(result.bits, 2); // 10 binary
      assert.equal(result.length, 2);

      result = encodeCoefficientMagnitude(3, 2);
      assert.equal(result.bits, 3); // 11 binary
      assert.equal(result.length, 2);

      // Category 3: ±4...±7
      result = encodeCoefficientMagnitude(4, 3);
      assert.equal(result.bits, 4); // 100 binary
      assert.equal(result.length, 3);

      result = encodeCoefficientMagnitude(7, 3);
      assert.equal(result.bits, 7); // 111 binary
      assert.equal(result.length, 3);
    });

    it("encodes negative coefficients using one's complement", () => {
      // Category 1: ±1
      let result = encodeCoefficientMagnitude(-1, 1);
      assert.equal(result.bits, 0); // 1's complement of 1 in 1-bit = 0
      assert.equal(result.length, 1);

      // Category 2: ±2,±3
      result = encodeCoefficientMagnitude(-2, 2);
      assert.equal(result.bits, 1); // 1's complement of 2 in 2-bit = 01
      assert.equal(result.length, 2);

      result = encodeCoefficientMagnitude(-3, 2);
      assert.equal(result.bits, 0); // 1's complement of 3 in 2-bit = 00
      assert.equal(result.length, 2);

      // Category 3: ±4...±7
      result = encodeCoefficientMagnitude(-4, 3);
      assert.equal(result.bits, 3); // 1's complement of 4 in 3-bit = 011
      assert.equal(result.length, 3);
    });
  });

  describe("AC Symbol Handling", () => {
    it("creates AC symbols from run and category", () => {
      assert.equal(createACSymbol(0, 0), 0x00); // EOB
      assert.equal(createACSymbol(15, 0), 0xf0); // ZRL
      assert.equal(createACSymbol(1, 2), 0x12); // Run=1, Cat=2
      assert.equal(createACSymbol(7, 5), 0x75); // Run=7, Cat=5
    });

    it("parses AC symbols into run and category", () => {
      let result = parseACSymbol(0x00);
      assert.equal(result.run, 0);
      assert.equal(result.category, 0);

      result = parseACSymbol(0xf0);
      assert.equal(result.run, 15);
      assert.equal(result.category, 0);

      result = parseACSymbol(0x12);
      assert.equal(result.run, 1);
      assert.equal(result.category, 2);

      result = parseACSymbol(0x75);
      assert.equal(result.run, 7);
      assert.equal(result.category, 5);
    });

    it("validates AC symbol parameters", () => {
      assert.throws(() => {
        createACSymbol(-1, 0);
      }, /Invalid run length/);

      assert.throws(() => {
        createACSymbol(16, 0);
      }, /Invalid run length/);

      assert.throws(() => {
        createACSymbol(0, -1);
      }, /Invalid category/);

      assert.throws(() => {
        createACSymbol(0, 16);
      }, /Invalid category/);

      assert.throws(() => {
        parseACSymbol(-1);
      }, /Invalid AC symbol/);

      assert.throws(() => {
        parseACSymbol(256);
      }, /Invalid AC symbol/);
    });
  });

  describe("Symbol Statistics Collection", () => {
    /**
     * Create test coefficient blocks with known patterns.
     * @returns {Int16Array[]} Test coefficient blocks
     */
    function createTestCoefficientBlocks() {
      const blocks = [];

      // Block 1: DC=100, some AC coefficients
      const block1 = new Int16Array(64);
      block1[0] = 100; // DC
      block1[1] = 50; // AC
      block1[2] = -30; // AC
      block1[8] = 20; // AC
      blocks.push(block1);

      // Block 2: DC=120, different AC pattern
      const block2 = new Int16Array(64);
      block2[0] = 120; // DC (difference = 20)
      block2[1] = 0; // Zero
      block2[2] = 0; // Zero
      block2[3] = 25; // AC after 2 zeros
      blocks.push(block2);

      // Block 3: DC=110, mostly zeros
      const block3 = new Int16Array(64);
      block3[0] = 110; // DC (difference = -10)
      block3[10] = 15; // AC after 9 zeros
      blocks.push(block3);

      return blocks;
    }

    it("collects DC and AC statistics", () => {
      const blocks = createTestCoefficientBlocks();
      const stats = collectSymbolStatistics(blocks);

      assert(stats.dcStatistics instanceof Map);
      assert(stats.acStatistics instanceof Map);
      assert.equal(stats.totalBlocks, 3);
      assert.equal(stats.totalDCCoefficients, 3);
      assert(stats.totalACCoefficients > 0);
      assert(typeof stats.sparsityRatio === "number");
      assert(stats.sparsityRatio >= 0 && stats.sparsityRatio <= 100);
    });

    it("handles DC differential encoding", () => {
      const blocks = createTestCoefficientBlocks();
      const stats = collectSymbolStatistics(blocks);

      // Should have DC categories for differences: 100, 20, -10
      const dcCategories = Array.from(stats.dcStatistics.keys()).sort();
      assert(dcCategories.length > 0);

      // Verify some expected categories are present
      const cat100 = getCoefficientCategory(100); // First DC
      const cat20 = getCoefficientCategory(20); // Second DC difference
      const cat10 = getCoefficientCategory(-10); // Third DC difference

      assert(stats.dcStatistics.has(cat100));
      assert(stats.dcStatistics.has(cat20));
      assert(stats.dcStatistics.has(cat10));
    });

    it("handles AC run-length encoding", () => {
      const blocks = createTestCoefficientBlocks();
      const stats = collectSymbolStatistics(blocks);

      const acSymbols = Array.from(stats.acStatistics.keys());
      assert(acSymbols.length > 0);

      // Should include EOB symbols
      const eobSymbol = createACSymbol(SPECIAL_AC_SYMBOLS.EOB.run, SPECIAL_AC_SYMBOLS.EOB.category);
      assert(stats.acStatistics.has(eobSymbol));
    });

    it("calculates sparsity ratio correctly", () => {
      // Create block with known sparsity
      const block = new Int16Array(64);
      block[0] = 100; // DC
      block[1] = 50; // 1 AC coefficient
      // 62 zeros

      const stats = collectSymbolStatistics([block]);

      // Sparsity = zeros / total AC = 62 / 63 ≈ 98.41%
      assert(stats.sparsityRatio > 98);
      assert(stats.sparsityRatio < 99);
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        collectSymbolStatistics("not-array");
      }, /Coefficient blocks must be an array/);

      const invalidBlock = new Int16Array(63); // Wrong size
      assert.throws(() => {
        collectSymbolStatistics([invalidBlock]);
      }, /Invalid coefficient block/);

      const wrongType = new Array(64).fill(0); // Not Int16Array
      assert.throws(() => {
        collectSymbolStatistics([wrongType]);
      }, /Invalid coefficient block/);
    });
  });

  describe("Optimal Huffman Table Generation", () => {
    it("generates table from simple statistics", () => {
      const stats = new Map();
      stats.set(0, 10); // Symbol 0: frequency 10
      stats.set(1, 5); // Symbol 1: frequency 5
      stats.set(2, 3); // Symbol 2: frequency 3
      stats.set(3, 1); // Symbol 3: frequency 1

      const table = generateOptimalHuffmanTable(stats);

      assert(Array.isArray(table.codeLengths));
      assert.equal(table.codeLengths.length, 17); // Index 0 unused
      assert(Array.isArray(table.symbols));
      assert(table.codes instanceof Map);
      assert(typeof table.averageCodeLength === "number");
      assert(typeof table.compressionRatio === "number");

      // Most frequent symbol should have shortest code
      const code0 = table.codes.get(0);
      const code3 = table.codes.get(3);
      assert(code0.length <= code3.length);
    });

    it("handles single symbol case", () => {
      const stats = new Map();
      stats.set(42, 100); // Only one symbol

      const table = generateOptimalHuffmanTable(stats);

      assert.equal(table.symbols.length, 1);
      assert.equal(table.symbols[0], 42);
      assert.equal(table.codes.get(42).length, 1);
      assert.equal(table.codes.get(42).code, 0);
      assert.equal(table.averageCodeLength, 1);
    });

    it("generates canonical codes", () => {
      const stats = new Map();
      stats.set(0, 8);
      stats.set(1, 4);
      stats.set(2, 2);
      stats.set(3, 1);

      const table = generateOptimalHuffmanTable(stats);

      // Verify codes are canonical (sorted by length, then by symbol)
      const codes = [];
      for (const [symbol, codeInfo] of table.codes.entries()) {
        codes.push({ symbol, ...codeInfo });
      }

      codes.sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        return a.symbol - b.symbol;
      });

      // Verify codes are assigned in canonical order
      let expectedCode = 0;
      let currentLength = codes[0].length;

      for (const codeInfo of codes) {
        if (codeInfo.length > currentLength) {
          expectedCode <<= codeInfo.length - currentLength;
          currentLength = codeInfo.length;
        }
        assert.equal(codeInfo.code, expectedCode);
        expectedCode++;
      }
    });

    it("respects maximum code length", () => {
      const stats = new Map();
      for (let i = 0; i < 100; i++) {
        stats.set(i, Math.floor(Math.random() * 100) + 1);
      }

      const table = generateOptimalHuffmanTable(stats, 8); // Max 8 bits

      for (const [, codeInfo] of table.codes.entries()) {
        assert(codeInfo.length <= 8);
      }
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        generateOptimalHuffmanTable("not-map");
      }, /Statistics must be a Map/);

      assert.throws(() => {
        generateOptimalHuffmanTable(new Map());
      }, /Cannot generate Huffman table from empty statistics/);

      const stats = new Map([[0, 1]]);
      assert.throws(() => {
        generateOptimalHuffmanTable(stats, 0);
      }, /Maximum code length must be between 1 and 16/);

      assert.throws(() => {
        generateOptimalHuffmanTable(stats, 17);
      }, /Maximum code length must be between 1 and 16/);
    });
  });

  describe("Bit Stream Writer", () => {
    it("creates bit stream writer", () => {
      const writer = new BitStreamWriter();

      assert.equal(writer.bytePosition, 0);
      assert.equal(writer.bitPosition, 0);
      assert.equal(writer.currentByte, 0);
      assert.equal(writer.enableByteStuffing, true);
      assert.equal(writer.totalBitsWritten, 0);
      assert.equal(writer.bytesStuffed, 0);
    });

    it("writes single bits", () => {
      const writer = new BitStreamWriter();

      writer.writeBits(1, 1); // Write bit 1
      writer.writeBits(0, 1); // Write bit 0
      writer.writeBits(1, 1); // Write bit 1

      assert.equal(writer.totalBitsWritten, 3);
      assert.equal(writer.bitPosition, 3);
    });

    it("writes multi-bit values", () => {
      const writer = new BitStreamWriter();

      writer.writeBits(0b1010, 4); // Write 4 bits: 1010
      writer.writeBits(0b11, 2); // Write 2 bits: 11

      assert.equal(writer.totalBitsWritten, 6);
      assert.equal(writer.bitPosition, 6);
    });

    it("handles byte boundaries", () => {
      const writer = new BitStreamWriter();

      writer.writeBits(0b11111111, 8); // Write full byte

      assert.equal(writer.totalBitsWritten, 8);
      assert.equal(writer.bitPosition, 0); // Should reset after full byte
      assert(writer.bytePosition >= 1); // Should advance byte position (may be 2 due to stuffing)
    });

    it("performs byte stuffing for 0xFF", () => {
      const writer = new BitStreamWriter();
      writer.enableByteStuffing = true;

      writer.writeBits(0xff, 8); // Write 0xFF byte

      const result = writer.flush();
      assert.equal(result[0], 0xff);
      assert.equal(result[1], 0x00); // Stuffed byte
      assert.equal(writer.bytesStuffed, 1);
    });

    it("disables byte stuffing when requested", () => {
      const writer = new BitStreamWriter();
      writer.enableByteStuffing = false;

      writer.writeBits(0xff, 8); // Write 0xFF byte

      const result = writer.flush();
      assert.equal(result.length, 1);
      assert.equal(result[0], 0xff);
      assert.equal(writer.bytesStuffed, 0);
    });

    it("pads final byte with 1s", () => {
      const writer = new BitStreamWriter();

      writer.writeBits(0b101, 3); // Write 3 bits, leaving 5 bits in byte

      const result = writer.flush();
      assert.equal(result.length, 1);
      // Should be: 101 + 11111 (padding) = 10111111 = 0xBF
      assert.equal(result[0], 0xbf);
    });

    it("expands buffer when needed", () => {
      const writer = new BitStreamWriter(4); // Small buffer

      // Write more than 4 bytes
      for (let i = 0; i < 10; i++) {
        writer.writeBits(0xff, 8);
      }

      const result = writer.flush();
      assert(result.length >= 10);
    });

    it("provides accurate statistics", () => {
      const writer = new BitStreamWriter();

      writer.writeBits(0b1010, 4);
      writer.writeBits(0xff, 8); // Will trigger byte stuffing

      const stats = writer.getStatistics();
      assert.equal(stats.totalBitsWritten, 12);
      assert(stats.totalBytesWritten > 0);
      assert(stats.bytesStuffed >= 0); // May or may not have byte stuffing
      assert(typeof stats.compressionRatio === "number");
      assert(typeof stats.bitsPerByte === "number");
    });

    it("resets properly", () => {
      const writer = new BitStreamWriter();

      writer.writeBits(0xff, 8);
      writer.reset();

      assert.equal(writer.bytePosition, 0);
      assert.equal(writer.bitPosition, 0);
      assert.equal(writer.currentByte, 0);
      assert.equal(writer.totalBitsWritten, 0);
      assert.equal(writer.bytesStuffed, 0);
    });

    it("validates bit length parameters", () => {
      const writer = new BitStreamWriter();

      assert.throws(() => {
        writer.writeBits(0, -1);
      }, /Invalid bit length/);

      assert.throws(() => {
        writer.writeBits(0, 33);
      }, /Invalid bit length/);
    });
  });

  describe("Huffman Block Encoding", () => {
    /**
     * Create simple Huffman tables for testing.
     * @returns {{dcTable: Object, acTable: Object}} Test Huffman tables
     */
    function createSimpleHuffmanTables() {
      const dcCodes = new Map();
      // Add all DC categories (0-15)
      for (let i = 0; i <= 15; i++) {
        dcCodes.set(i, { code: i, length: 4 });
      }

      const acCodes = new Map();
      // Add common AC symbols
      acCodes.set(0x00, { code: 0b00, length: 2 }); // EOB
      acCodes.set(0x01, { code: 0b01, length: 2 }); // Run=0, Cat=1
      acCodes.set(0x11, { code: 0b10, length: 2 }); // Run=1, Cat=1
      acCodes.set(0xf0, { code: 0b11, length: 2 }); // ZRL

      // Add more AC symbols for various run/category combinations
      let code = 4;
      for (let run = 0; run <= 15; run++) {
        for (let cat = 1; cat <= 15; cat++) {
          const symbol = createACSymbol(run, cat);
          if (!acCodes.has(symbol)) {
            acCodes.set(symbol, { code: code, length: 8 });
            code++;
            if (code > 255) break;
          }
        }
        if (code > 255) break;
      }

      return {
        dcTable: { codes: dcCodes },
        acTable: { codes: acCodes },
      };
    }

    /**
     * Create simple coefficient blocks for testing.
     * @returns {Int16Array[]} Test coefficient blocks
     */
    function createSimpleTestBlocks() {
      const block1 = new Int16Array(64);
      block1[0] = 10; // DC
      block1[1] = 1; // AC coefficient

      const block2 = new Int16Array(64);
      block2[0] = 12; // DC (difference = 2)
      block2[2] = 1; // AC coefficient after 1 zero

      return [block1, block2];
    }

    it("encodes coefficient blocks", () => {
      const blocks = createSimpleTestBlocks();
      const tables = createSimpleHuffmanTables();

      const result = encodeHuffmanBlocks(blocks, tables);

      assert(result.encodedData instanceof Uint8Array);
      assert(result.encodedData.length > 0);
      assert(typeof result.statistics === "object");
      assert.equal(result.statistics.totalBlocks, 2);
      assert(result.statistics.totalBits > 0);
      assert(result.statistics.dcCoefficients > 0);
      assert(result.statistics.acCoefficients > 0);
    });

    it("handles DC differential encoding", () => {
      const blocks = createSimpleTestBlocks();
      const tables = createSimpleHuffmanTables();

      const result = encodeHuffmanBlocks(blocks, tables);

      // Should encode DC differences: 10, 2
      assert.equal(result.statistics.dcCoefficients, 2);
    });

    it("handles AC run-length encoding", () => {
      const block = new Int16Array(64);
      block[0] = 10; // DC
      block[1] = 0; // Zero
      block[2] = 0; // Zero
      block[3] = 1; // AC after 2 zeros

      const tables = createSimpleHuffmanTables();
      const result = encodeHuffmanBlocks([block], tables);

      assert(result.statistics.acCoefficients > 0);
      assert(result.statistics.eobSymbols > 0);
    });

    it("handles ZRL symbols for long zero runs", () => {
      const block = new Int16Array(64);
      block[0] = 10; // DC
      // 16 consecutive zeros, then a coefficient
      block[17] = 1; // AC after 16 zeros

      const tables = createSimpleHuffmanTables();
      const result = encodeHuffmanBlocks([block], tables);

      assert(result.statistics.zrlSymbols > 0);
    });

    it("validates input parameters", () => {
      const blocks = createSimpleTestBlocks();
      const tables = createSimpleHuffmanTables();

      assert.throws(() => {
        encodeHuffmanBlocks("not-array", tables);
      }, /Coefficient blocks must be an array/);

      assert.throws(() => {
        encodeHuffmanBlocks(blocks, null);
      }, /Huffman tables must include dcTable and acTable/);

      const invalidBlock = new Int16Array(63);
      assert.throws(() => {
        encodeHuffmanBlocks([invalidBlock], tables);
      }, /Invalid coefficient block/);
    });

    it("handles missing symbols in tables", () => {
      const blocks = createSimpleTestBlocks();
      const incompleteTables = {
        dcTable: { codes: new Map() }, // Empty table
        acTable: { codes: new Map() },
      };

      assert.throws(() => {
        encodeHuffmanBlocks(blocks, incompleteTables);
      }, /not found in Huffman table/);
    });

    it("tracks encoding statistics", () => {
      const blocks = createSimpleTestBlocks();
      const tables = createSimpleHuffmanTables();

      const result = encodeHuffmanBlocks(blocks, tables);
      const stats = result.statistics;

      assert.equal(stats.totalBlocks, 2);
      assert(stats.totalBits > 0);
      assert(stats.totalBytes > 0);
      assert(stats.averageBitsPerBlock > 0);
      assert(stats.dcCoefficients > 0);
      assert(stats.compressionRatio > 0);
    });
  });

  describe("Standard Huffman Tables", () => {
    it("gets standard DC luminance table", () => {
      const table = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.DC, HUFFMAN_TABLE_CLASSES.LUMINANCE);

      assert(Array.isArray(table.codeLengths));
      assert(Array.isArray(table.symbols));
      assert(table.codes instanceof Map);
      assert.equal(table.codeLengths.length, 17);

      // Should have codes for all DC categories (0-11)
      for (let i = 0; i <= 11; i++) {
        assert(table.codes.has(i));
      }
    });

    it("gets standard DC chrominance table", () => {
      const table = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.DC, HUFFMAN_TABLE_CLASSES.CHROMINANCE);

      assert(Array.isArray(table.codeLengths));
      assert(Array.isArray(table.symbols));
      assert(table.codes instanceof Map);

      // Should have codes for DC categories
      assert(table.codes.size > 0);
    });

    it("gets standard AC luminance table", () => {
      const table = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.AC, HUFFMAN_TABLE_CLASSES.LUMINANCE);

      assert(Array.isArray(table.codeLengths));
      assert(Array.isArray(table.symbols));
      assert(table.codes instanceof Map);

      // Should have many AC symbols
      assert(table.codes.size > 100);

      // Should include special symbols
      const eobSymbol = createACSymbol(SPECIAL_AC_SYMBOLS.EOB.run, SPECIAL_AC_SYMBOLS.EOB.category);
      const zrlSymbol = createACSymbol(SPECIAL_AC_SYMBOLS.ZRL.run, SPECIAL_AC_SYMBOLS.ZRL.category);
      assert(table.codes.has(eobSymbol));
      assert(table.codes.has(zrlSymbol));
    });

    it("gets standard AC chrominance table", () => {
      const table = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.AC, HUFFMAN_TABLE_CLASSES.CHROMINANCE);

      assert(Array.isArray(table.codeLengths));
      assert(Array.isArray(table.symbols));
      assert(table.codes instanceof Map);
      assert(table.codes.size > 0);
    });

    it("validates table parameters", () => {
      assert.throws(() => {
        getStandardHuffmanTable("invalid-type", HUFFMAN_TABLE_CLASSES.LUMINANCE);
      }, /Unknown table type/);

      assert.throws(() => {
        getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.DC, "invalid-class");
      }, /Unknown table class/);
    });
  });

  describe("Huffman Encoding Metrics", () => {
    it("creates metrics analyzer", () => {
      const metrics = new HuffmanEncodingMetrics();

      assert.equal(metrics.encodingsPerformed, 0);
      assert.equal(metrics.blocksProcessed, 0);
      assert.equal(metrics.totalBitsGenerated, 0);
      assert.equal(metrics.totalBytesGenerated, 0);
      assert.equal(metrics.dcCoefficientsEncoded, 0);
      assert.equal(metrics.acCoefficientsEncoded, 0);
      assert.equal(metrics.eobSymbolsGenerated, 0);
      assert.equal(metrics.zrlSymbolsGenerated, 0);
      assert.equal(metrics.bytesStuffed, 0);
      assert.deepEqual(metrics.compressionRatios, []);
      assert.deepEqual(metrics.bitsPerBlock, []);
      assert.deepEqual(metrics.errors, []);
    });

    it("records encoding operations", () => {
      const metrics = new HuffmanEncodingMetrics();

      const stats = {
        totalBlocks: 10,
        totalBits: 800,
        totalBytes: 100,
        compressionRatio: 8.0,
        averageBitsPerBlock: 80,
        dcCoefficients: 10,
        acCoefficients: 30,
        eobSymbols: 10,
        zrlSymbols: 2,
        bytesStuffed: 1,
        processingTime: 5.5,
      };

      metrics.recordEncoding(stats);

      assert.equal(metrics.encodingsPerformed, 1);
      assert.equal(metrics.blocksProcessed, 10);
      assert.equal(metrics.totalBitsGenerated, 800);
      assert.equal(metrics.totalBytesGenerated, 100);
      assert.equal(metrics.dcCoefficientsEncoded, 10);
      assert.equal(metrics.acCoefficientsEncoded, 30);
      assert.equal(metrics.eobSymbolsGenerated, 10);
      assert.equal(metrics.zrlSymbolsGenerated, 2);
      assert.equal(metrics.bytesStuffed, 1);
      assert.equal(metrics.compressionRatios[0], 8.0);
      assert.equal(metrics.bitsPerBlock[0], 80);
    });

    it("records errors", () => {
      const metrics = new HuffmanEncodingMetrics();

      metrics.recordError("Test error 1");
      metrics.recordError("Test error 2");

      assert.equal(metrics.errors.length, 2);
      assert.equal(metrics.errors[0], "Test error 1");
      assert.equal(metrics.errors[1], "Test error 2");
    });

    it("generates summary statistics", () => {
      const metrics = new HuffmanEncodingMetrics();

      // Record multiple operations
      metrics.recordEncoding({
        totalBlocks: 5,
        totalBits: 400,
        totalBytes: 50,
        compressionRatio: 8.0,
        averageBitsPerBlock: 80,
        dcCoefficients: 5,
        acCoefficients: 15,
        eobSymbols: 5,
        zrlSymbols: 1,
        bytesStuffed: 0,
        processingTime: 2.5,
      });

      metrics.recordEncoding({
        totalBlocks: 10,
        totalBits: 800,
        totalBytes: 100,
        compressionRatio: 8.0,
        averageBitsPerBlock: 80,
        dcCoefficients: 10,
        acCoefficients: 30,
        eobSymbols: 10,
        zrlSymbols: 2,
        bytesStuffed: 1,
        processingTime: 5.0,
      });

      const summary = metrics.getSummary();

      assert.equal(summary.encodingsPerformed, 2);
      assert.equal(summary.blocksProcessed, 15);
      assert.equal(summary.averageBlocksPerEncoding, 8); // Round(15/2)
      assert.equal(summary.totalBitsGenerated, 1200);
      assert.equal(summary.totalBytesGenerated, 150);
      assert.equal(summary.averageCompressionRatio, 8.0);
      assert.equal(summary.averageBitsPerBlock, 80);
      assert(summary.coefficientRatio > 0); // AC / (DC + AC)
      assert(summary.specialSymbolRatio > 0); // (EOB + ZRL) / AC
      assert(typeof summary.byteStuffingRatio === "number");
      assert(typeof summary.blocksPerSecond === "number");
      assert(summary.description.includes("Huffman Encoding"));
    });

    it("handles empty metrics", () => {
      const metrics = new HuffmanEncodingMetrics();
      const summary = metrics.getSummary();

      assert.equal(summary.encodingsPerformed, 0);
      assert.equal(summary.blocksProcessed, 0);
      assert.equal(summary.averageCompressionRatio, 0);
      assert.equal(summary.averageBitsPerBlock, 0);
      assert.equal(summary.coefficientRatio, 0);
      assert.equal(summary.blocksPerSecond, 0);
    });

    it("resets metrics", () => {
      const metrics = new HuffmanEncodingMetrics();

      metrics.recordEncoding({
        totalBlocks: 1,
        totalBits: 100,
        totalBytes: 10,
        compressionRatio: 10.0,
        averageBitsPerBlock: 100,
        dcCoefficients: 1,
        acCoefficients: 3,
        eobSymbols: 1,
        zrlSymbols: 0,
        bytesStuffed: 0,
      });

      metrics.recordError("Test error");

      assert.equal(metrics.encodingsPerformed, 1);
      assert.equal(metrics.errors.length, 1);

      metrics.reset();

      assert.equal(metrics.encodingsPerformed, 0);
      assert.equal(metrics.blocksProcessed, 0);
      assert.equal(metrics.errors.length, 0);
      assert.deepEqual(metrics.compressionRatios, []);
    });
  });

  describe("Huffman Table Validation", () => {
    /**
     * Create valid test Huffman table.
     * @returns {Object} Valid Huffman table
     */
    function createValidTestTable() {
      const codeLengths = new Array(17).fill(0);
      codeLengths[1] = 2; // Two 1-bit codes
      codeLengths[2] = 2; // Two 2-bit codes

      const symbols = [0, 1, 2, 3];

      const codes = new Map();
      codes.set(0, { code: 0b0, length: 1 });
      codes.set(1, { code: 0b1, length: 1 });
      codes.set(2, { code: 0b00, length: 2 });
      codes.set(3, { code: 0b01, length: 2 });

      return { codeLengths, symbols, codes };
    }

    it("validates correct Huffman table", () => {
      const table = createValidTestTable();
      const result = validateHuffmanTable(table, HUFFMAN_TABLE_TYPES.DC);

      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
      assert(typeof result.statistics.totalSymbols === "number");
      assert(typeof result.statistics.maxCodeLength === "number");
      assert(typeof result.statistics.averageCodeLength === "number");
      assert(typeof result.statistics.codeEfficiency === "number");
    });

    it("detects invalid table structure", () => {
      let result = validateHuffmanTable(null);
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("must be an object")));

      result = validateHuffmanTable({});
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("codeLengths array")));

      result = validateHuffmanTable({ codeLengths: [] });
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("exactly 17 elements")));
    });

    it("detects symbol count mismatches", () => {
      const table = createValidTestTable();
      table.symbols = [0, 1]; // Wrong count

      const result = validateHuffmanTable(table);
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("Symbol count mismatch")));
    });

    it("detects code map mismatches", () => {
      const table = createValidTestTable();
      table.codes.delete(3); // Remove one code

      const result = validateHuffmanTable(table);
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("Code map size mismatch")));
    });

    it("validates DC symbol ranges", () => {
      const table = createValidTestTable();
      table.symbols = [0, 1, 2, 16]; // Invalid DC symbol

      const result = validateHuffmanTable(table, HUFFMAN_TABLE_TYPES.DC);
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("DC symbol out of range")));
    });

    it("validates AC symbol ranges", () => {
      const table = createValidTestTable();
      table.symbols = [0, 1, 2, 256]; // Invalid AC symbol

      const result = validateHuffmanTable(table, HUFFMAN_TABLE_TYPES.AC);
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("AC symbol out of range")));
    });

    it("detects duplicate symbols", () => {
      const table = createValidTestTable();
      table.symbols = [0, 1, 2, 2]; // Duplicate symbol

      const result = validateHuffmanTable(table);
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("Duplicate symbols")));
    });

    it("detects non-canonical codes", () => {
      const table = createValidTestTable();
      table.codes.set(3, { code: 0b10, length: 2 }); // Wrong canonical code

      const result = validateHuffmanTable(table);
      assert.equal(result.isValid, true); // Should still be valid, just with warnings
      assert(result.warnings.some((warn) => warn.includes("Non-canonical code")));
    });

    it("generates performance warnings", () => {
      const table = createValidTestTable();
      table.codeLengths[15] = 1; // Very long code
      table.symbols.push(15);
      table.codes.set(15, { code: 0, length: 15 });

      const result = validateHuffmanTable(table);
      assert(result.warnings.some((warn) => warn.includes("Long maximum code length")));
    });

    it("calculates accurate statistics", () => {
      const table = createValidTestTable();
      const result = validateHuffmanTable(table);

      assert.equal(result.statistics.totalSymbols, 4);
      assert.equal(result.statistics.maxCodeLength, 2);
      assert.equal(result.statistics.averageCodeLength, 1.5); // (1+1+2+2)/4
      assert(result.statistics.codeEfficiency > 0);
    });
  });

  describe("Integration and Edge Cases", () => {
    it("handles empty coefficient blocks", () => {
      const blocks = [new Int16Array(64)]; // All zeros
      const tables = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.DC, HUFFMAN_TABLE_CLASSES.LUMINANCE);
      const acTable = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.AC, HUFFMAN_TABLE_CLASSES.LUMINANCE);

      const result = encodeHuffmanBlocks(blocks, { dcTable: tables, acTable });

      assert(result.encodedData.length > 0);
      assert.equal(result.statistics.totalBlocks, 1);
      assert.equal(result.statistics.dcCoefficients, 1);
    });

    it("handles blocks with only DC coefficients", () => {
      const block = new Int16Array(64);
      block[0] = 100; // Only DC, all AC are zero

      const dcTable = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.DC, HUFFMAN_TABLE_CLASSES.LUMINANCE);
      const acTable = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.AC, HUFFMAN_TABLE_CLASSES.LUMINANCE);

      const result = encodeHuffmanBlocks([block], { dcTable, acTable });

      assert(result.encodedData.length > 0);
      assert.equal(result.statistics.dcCoefficients, 1);
      assert.equal(result.statistics.acCoefficients, 0);
    });

    it("handles maximum coefficient values", () => {
      const block = new Int16Array(64);
      block[0] = 1023; // Large but manageable DC
      block[1] = -1023; // Large but manageable AC

      const dcTable = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.DC, HUFFMAN_TABLE_CLASSES.LUMINANCE);
      const acTable = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.AC, HUFFMAN_TABLE_CLASSES.LUMINANCE);

      const result = encodeHuffmanBlocks([block], { dcTable, acTable });

      assert(result.encodedData.length > 0);
      assert(result.statistics.totalBits > 0);
    });

    it("maintains encoding consistency", () => {
      const blocks = [
        new Int16Array(64).fill(0).map((_, i) => (i === 0 ? 100 : i % 8 === 0 ? 10 : 0)),
        new Int16Array(64).fill(0).map((_, i) => (i === 0 ? 105 : i % 8 === 0 ? 15 : 0)),
      ];

      const dcTable = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.DC, HUFFMAN_TABLE_CLASSES.LUMINANCE);
      const acTable = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.AC, HUFFMAN_TABLE_CLASSES.LUMINANCE);

      const result1 = encodeHuffmanBlocks(blocks, { dcTable, acTable });
      const result2 = encodeHuffmanBlocks(blocks, { dcTable, acTable });

      // Results should be identical (deterministic)
      assert.equal(result1.encodedData.length, result2.encodedData.length);
      assert.deepEqual(result1.encodedData, result2.encodedData);
    });

    it("works with optimal tables generated from statistics", () => {
      const blocks = [
        new Int16Array(64)
          .fill(0)
          .map((_, i) => (i === 0 ? 100 : Math.random() < 0.1 ? Math.floor(Math.random() * 20) - 10 : 0)),
        new Int16Array(64)
          .fill(0)
          .map((_, i) => (i === 0 ? 110 : Math.random() < 0.1 ? Math.floor(Math.random() * 20) - 10 : 0)),
      ];

      // Generate optimal tables from statistics
      const stats = collectSymbolStatistics(blocks);
      const dcTable = generateOptimalHuffmanTable(stats.dcStatistics);
      const acTable = generateOptimalHuffmanTable(stats.acStatistics);

      const result = encodeHuffmanBlocks(blocks, { dcTable, acTable });

      assert(result.encodedData.length > 0);
      assert(result.statistics.compressionRatio > 0);
    });

    it("handles extreme sparsity patterns", () => {
      // Create block with single non-zero AC coefficient at end
      const block = new Int16Array(64);
      block[0] = 50; // DC
      block[63] = 1; // Last AC coefficient

      const dcTable = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.DC, HUFFMAN_TABLE_CLASSES.LUMINANCE);
      const acTable = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.AC, HUFFMAN_TABLE_CLASSES.LUMINANCE);

      const result = encodeHuffmanBlocks([block], { dcTable, acTable });

      assert(result.encodedData.length > 0);
      assert(result.statistics.zrlSymbols > 0); // Should generate ZRL symbols
    });

    it("processes large number of blocks efficiently", () => {
      const blocks = [];
      for (let i = 0; i < 100; i++) {
        const block = new Int16Array(64);
        block[0] = 100 + i; // Varying DC
        block[1] = i % 10; // Some AC variation
        blocks.push(block);
      }

      const dcTable = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.DC, HUFFMAN_TABLE_CLASSES.LUMINANCE);
      const acTable = getStandardHuffmanTable(HUFFMAN_TABLE_TYPES.AC, HUFFMAN_TABLE_CLASSES.LUMINANCE);

      const startTime = performance.now();
      const result = encodeHuffmanBlocks(blocks, { dcTable, acTable });
      const endTime = performance.now();

      assert.equal(result.statistics.totalBlocks, 100);
      assert(result.encodedData.length > 0);
      assert(endTime - startTime < 1000); // Should complete within 1 second
    });
  });
});
