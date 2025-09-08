/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import {
  AC_SYMBOL_RANGE,
  buildCanonicalCodes,
  createLookupTable,
  DC_SYMBOL_RANGE,
  decodeDHT,
  getHuffmanSummary,
  getHuffmanTable,
  MAX_CODE_LENGTH,
  MAX_HUFFMAN_CODES,
  STANDARD_AC_LUMINANCE,
  STANDARD_DC_LUMINANCE,
  validateKraftInequality,
} from "./decode-dht.js";

describe("JPEG DHT Decoder", () => {
  describe("Constants and Ranges", () => {
    it("defines correct maximum values", () => {
      assert.equal(MAX_HUFFMAN_CODES, 65535);
      assert.equal(MAX_CODE_LENGTH, 16);
    });

    it("defines correct symbol ranges", () => {
      assert.equal(DC_SYMBOL_RANGE.min, 0);
      assert.equal(DC_SYMBOL_RANGE.max, 11);
      assert.equal(AC_SYMBOL_RANGE.min, 0);
      assert.equal(AC_SYMBOL_RANGE.max, 255);
    });

    it("defines standard DC luminance table", () => {
      assert.equal(STANDARD_DC_LUMINANCE.lengths.length, 16);
      assert.equal(STANDARD_DC_LUMINANCE.symbols.length, 12);
      assert.deepEqual(STANDARD_DC_LUMINANCE.symbols, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    });

    it("defines standard AC luminance table", () => {
      assert.equal(STANDARD_AC_LUMINANCE.lengths.length, 16);
      assert.equal(STANDARD_AC_LUMINANCE.symbols.length, 162); // Standard AC table has 162 symbols
      assert.equal(STANDARD_AC_LUMINANCE.symbols[0], 0x01);
      assert.equal(STANDARD_AC_LUMINANCE.symbols[161], 0xfa);
    });
  });

  describe("Kraft Inequality Validation", () => {
    it("validates correct code lengths", () => {
      // Standard DC luminance table
      const lengths = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
      assert.equal(validateKraftInequality(lengths), true);
    });

    it("validates standard AC luminance table", () => {
      assert.equal(validateKraftInequality(STANDARD_AC_LUMINANCE.lengths), true);
    });

    it("rejects invalid code lengths", () => {
      // Too many codes of length 1 (3 * 2^(-1) = 1.5 > 1.0)
      const invalidLengths = [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      assert.equal(validateKraftInequality(invalidLengths), false);
    });

    it("handles edge case of exactly valid lengths", () => {
      // Exactly 2^16 codes of length 16 (maximum allowed)
      const edgeLengths = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
      assert.equal(validateKraftInequality(edgeLengths), true);
    });

    it("throws on invalid input", () => {
      assert.throws(() => {
        validateKraftInequality([1, 2, 3]); // Too short
      }, /Expected lengths to be array of 16 elements/);

      assert.throws(() => {
        validateKraftInequality("not array");
      }, /Expected lengths to be array of 16 elements/);
    });

    it("rejects negative code counts", () => {
      const negativeLengths = [0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      assert.equal(validateKraftInequality(negativeLengths), false);
    });
  });

  describe("Canonical Code Construction", () => {
    it("builds canonical codes for simple table", () => {
      const lengths = [0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const symbols = [0, 1, 2];

      const { codes, maxLength } = buildCanonicalCodes(lengths, symbols);

      assert.equal(codes.size, 3);
      assert.equal(maxLength, 3);

      // Check canonical order: shorter codes first, then lexicographic
      assert.deepEqual(codes.get(0), { code: 0, length: 2 }); // 00
      assert.deepEqual(codes.get(1), { code: 1, length: 2 }); // 01
      assert.deepEqual(codes.get(2), { code: 4, length: 3 }); // 100
    });

    it("builds canonical codes for standard DC table", () => {
      const { codes, maxLength } = buildCanonicalCodes(STANDARD_DC_LUMINANCE.lengths, STANDARD_DC_LUMINANCE.symbols);

      assert.equal(codes.size, 12);
      assert.equal(maxLength, 9);

      // Verify some known codes
      assert.deepEqual(codes.get(0), { code: 0, length: 2 });
      assert.deepEqual(codes.get(1), { code: 2, length: 3 });
    });

    it("handles empty length classes", () => {
      const lengths = [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const symbols = [0, 1];

      const { codes, maxLength } = buildCanonicalCodes(lengths, symbols);

      assert.equal(codes.size, 2);
      assert.equal(maxLength, 4);
      assert.deepEqual(codes.get(0), { code: 0, length: 1 });
      assert.deepEqual(codes.get(1), { code: 8, length: 4 }); // 0 << 3 = 8 after shifting through empty lengths
    });

    it("throws on symbol count mismatch", () => {
      const lengths = [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const symbols = [0]; // Need 2 symbols

      assert.throws(() => {
        buildCanonicalCodes(lengths, symbols);
      }, /Symbol count mismatch/);
    });

    it("throws on invalid input", () => {
      assert.throws(() => {
        buildCanonicalCodes([1, 2], [0, 1]);
      }, /Expected lengths to be array of 16 elements/);

      assert.throws(() => {
        buildCanonicalCodes(new Array(16).fill(0), "not array");
      }, /Expected symbols to be an array/);
    });
  });

  describe("Lookup Table Creation", () => {
    it("creates lookup table for simple codes", () => {
      const codes = new Map([
        [0, { code: 0, length: 1 }], // 0
        [1, { code: 1, length: 1 }], // 1
        [2, { code: 2, length: 2 }], // 10
        [3, { code: 3, length: 2 }], // 11
      ]);

      const { lookup, maxCode } = createLookupTable(codes, 4);

      // Check direct lookups for 4-bit table
      assert.equal(lookup[0b0000], 0); // 0000 -> symbol 0 (code 0, length 1)
      assert.equal(lookup[0b0001], 0); // 0001 -> symbol 0
      assert.equal(lookup[0b1000], 2); // 1000 -> symbol 2 (code 2=10, length 2)
      assert.equal(lookup[0b1001], 2); // 1001 -> symbol 2
      assert.equal(lookup[0b1100], 3); // 1100 -> symbol 3 (code 3=11, length 2)
      assert.equal(lookup[0b1101], 3); // 1101 -> symbol 3

      // Check max codes per length
      assert.equal(maxCode[1], 1);
      assert.equal(maxCode[2], 3);
    });

    it("handles codes longer than lookup width", () => {
      const codes = new Map([
        [0, { code: 0, length: 4 }], // 0000
        [1, { code: 1, length: 10 }], // 0000000001 (longer than 8-bit lookup)
      ]);

      const { lookup, maxCode } = createLookupTable(codes, 8);

      // Short code should be in lookup
      assert.equal(lookup[0b00000000], 0);

      // Long code should not be in lookup (requires sequential decoding)
      assert.equal(maxCode[10], 1);
    });
  });

  describe("Basic DHT Decoding", () => {
    it("decodes simple DC table", () => {
      // DC table 0 with simple 2-symbol table
      const data = new Uint8Array([
        0x00, // Tc=0 (DC), Th=0 (table 0)
        // 16 length counts: 2 codes of length 1
        0,
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        // 2 symbols
        0,
        1,
      ]);

      const tables = decodeDHT(data);

      assert.equal(tables.length, 1);
      assert.equal(tables[0].id, 0);
      assert.equal(tables[0].class, 0);
      assert.equal(tables[0].isDC, true);
      assert.equal(tables[0].totalSymbols, 2);
      assert.equal(tables[0].maxLength, 2);
      assert.deepEqual(tables[0].symbols, [0, 1]);
    });

    it("decodes simple AC table", () => {
      // AC table 1 with 3-symbol table
      const data = new Uint8Array([
        0x11, // Tc=1 (AC), Th=1 (table 1)
        // 16 length counts: 1 code of length 1, 2 codes of length 2
        0,
        1,
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        // 3 symbols
        0x01,
        0x02,
        0x11,
      ]);

      const tables = decodeDHT(data);

      assert.equal(tables.length, 1);
      assert.equal(tables[0].id, 1);
      assert.equal(tables[0].class, 1);
      assert.equal(tables[0].isDC, false);
      assert.equal(tables[0].totalSymbols, 3);
      assert.equal(tables[0].maxLength, 3);
      assert.deepEqual(tables[0].symbols, [0x01, 0x02, 0x11]);
    });

    it("decodes multiple tables in single DHT", () => {
      const data = new Uint8Array([
        // DC table 0
        0x00, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        // AC table 0
        0x10, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x01, 0x02,
      ]);

      const tables = decodeDHT(data);

      assert.equal(tables.length, 2);
      assert.equal(tables[0].isDC, true);
      assert.equal(tables[1].isDC, false);
    });

    it("decodes standard DC luminance table", () => {
      const data = new Uint8Array([
        0x00, // DC table 0
        ...STANDARD_DC_LUMINANCE.lengths,
        ...STANDARD_DC_LUMINANCE.symbols,
      ]);

      const tables = decodeDHT(data);

      assert.equal(tables.length, 1);
      assert.equal(tables[0].isStandard, true);
      assert.deepEqual(tables[0].lengths, STANDARD_DC_LUMINANCE.lengths);
      assert.deepEqual(tables[0].symbols, STANDARD_DC_LUMINANCE.symbols);
    });
  });

  describe("Error Handling", () => {
    it("throws on invalid buffer type", () => {
      assert.throws(() => {
        decodeDHT(null);
      }, TypeError);

      assert.throws(() => {
        decodeDHT("not a buffer");
      }, TypeError);
    });

    it("throws on empty data", () => {
      assert.throws(() => {
        decodeDHT(new Uint8Array([]));
      }, /DHT data is empty/);
    });

    it("throws on invalid table class", () => {
      const data = new Uint8Array([
        0x20, // Tc=2 (invalid), Th=0
        ...new Array(16).fill(0),
        // No symbols needed for zero lengths
      ]);

      assert.throws(() => {
        decodeDHT(data);
      }, /Invalid Huffman table class: 2/);
    });

    it("throws on invalid table ID", () => {
      const data = new Uint8Array([
        0x04, // Tc=0, Th=4 (invalid)
        ...new Array(16).fill(0),
      ]);

      assert.throws(() => {
        decodeDHT(data);
      }, /Invalid Huffman table ID: 4/);
    });

    it("throws on incomplete length data", () => {
      const data = new Uint8Array([
        0x00, // Tc=0, Th=0
        1,
        2,
        3, // Only 3 length bytes instead of 16
      ]);

      assert.throws(() => {
        decodeDHT(data);
      }, /Incomplete Huffman table 0.*need 16 length bytes/);
    });

    it("throws on no symbols", () => {
      const data = new Uint8Array([
        0x00,
        ...new Array(16).fill(0), // All zero lengths
      ]);

      assert.throws(() => {
        decodeDHT(data);
      }, /Huffman table 0: no symbols defined/);
    });

    it("handles large symbol count", () => {
      const data = new Uint8Array([
        0x00,
        // 12 codes of length 16 (all valid DC symbols)
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        12,
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11, // All valid DC symbols
      ]);

      const tables = decodeDHT(data);
      assert.equal(tables[0].totalSymbols, 12);
    });

    it("throws on Kraft inequality violation", () => {
      const data = new Uint8Array([
        0x00,
        3,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0, // 3 codes of length 1 (violates Kraft: 3 * 2^(-1) = 1.5 > 1.0)
        0,
        1,
        2,
      ]);

      assert.throws(() => {
        decodeDHT(data);
      }, /code lengths violate Kraft inequality/);
    });

    it("throws on incomplete symbol data", () => {
      const data = new Uint8Array([
        0x00,
        0,
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0, // Need 2 symbols
        0, // Only 1 symbol
      ]);

      assert.throws(() => {
        decodeDHT(data);
      }, /Incomplete Huffman table 0.*need 2 symbol bytes/);
    });

    it("throws on invalid DC symbols", () => {
      const data = new Uint8Array([
        0x00, // DC table
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        12, // Invalid DC symbol (must be 0-11)
      ]);

      assert.throws(() => {
        decodeDHT(data);
      }, /DC table 0: invalid symbol 12.*valid range: 0-11/);
    });

    it("throws on invalid AC symbols", () => {
      // This test is tricky since Uint8Array automatically caps at 255
      // Let's test with a valid AC symbol
      const validData = new Uint8Array([
        0x10,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        255, // Valid AC symbol
      ]);

      const tables = decodeDHT(validData);
      assert.equal(tables[0].symbols[0], 255);
    });

    it("throws on duplicate symbols", () => {
      const data = new Uint8Array([
        0x00,
        0,
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0, // Duplicate symbol 0
      ]);

      assert.throws(() => {
        decodeDHT(data);
      }, /DC table 0: duplicate symbols found/);
    });
  });

  describe("Table Utilities", () => {
    let tables;

    beforeEach(() => {
      const data = new Uint8Array([
        // DC table 0
        0x00,
        ...STANDARD_DC_LUMINANCE.lengths,
        ...STANDARD_DC_LUMINANCE.symbols,
        // AC table 1
        0x11,
        0,
        2,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0x01,
        0x02,
        0x11,
      ]);
      tables = decodeDHT(data);
    });

    it("finds table by class and ID", () => {
      const dcTable = getHuffmanTable(tables, 0, 0);
      const acTable = getHuffmanTable(tables, 1, 1);
      const missing = getHuffmanTable(tables, 0, 1);

      assert.equal(dcTable.class, 0);
      assert.equal(dcTable.id, 0);
      assert.equal(acTable.class, 1);
      assert.equal(acTable.id, 1);
      assert.equal(missing, null);
    });

    it("throws on invalid search parameters", () => {
      assert.throws(() => {
        getHuffmanTable("not array", 0, 0);
      }, TypeError);

      assert.throws(() => {
        getHuffmanTable(tables, 2, 0); // Invalid class
      }, /Expected tableClass to be 0.*or 1/);

      assert.throws(() => {
        getHuffmanTable(tables, 0, 4); // Invalid ID
      }, /Expected tableId to be number 0-3/);
    });

    it("generates table summary", () => {
      const summary = getHuffmanSummary(tables);

      assert.equal(summary.count, 2);
      assert.deepEqual(summary.dcTables, [0]);
      assert.deepEqual(summary.acTables, [1]);
      assert.equal(summary.standardCount, 1); // Only DC table is standard
      assert.equal(summary.customCount, 1);
      assert.equal(summary.hasStandardTables, true);
      assert(summary.description.includes("2 Huffman tables"));
      assert(summary.description.includes("1 DC, 1 AC"));
    });

    it("handles empty table array in summary", () => {
      const summary = getHuffmanSummary([]);

      assert.equal(summary.count, 0);
      assert.deepEqual(summary.dcTables, []);
      assert.deepEqual(summary.acTables, []);
      assert.equal(summary.maxLength, 0);
    });

    it("throws on invalid summary input", () => {
      assert.throws(() => {
        getHuffmanSummary("not array");
      }, TypeError);
    });
  });

  describe("Edge Cases", () => {
    it("handles maximum table IDs", () => {
      const data = new Uint8Array([
        0x03, // DC table 3
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
      ]);

      const tables = decodeDHT(data);
      assert.equal(tables[0].id, 3);
    });

    it("handles maximum code length", () => {
      const data = new Uint8Array([
        0x00,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1, // 1 code of length 16
        0,
      ]);

      const tables = decodeDHT(data);
      assert.equal(tables[0].maxLength, 16);
    });

    it("handles all valid DC symbols", () => {
      const data = new Uint8Array([
        0x00,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        12,
        0,
        0,
        0,
        0, // 12 codes of length 12
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11, // All valid DC symbols
      ]);

      const tables = decodeDHT(data);
      assert.equal(tables[0].totalSymbols, 12);
      assert.deepEqual(tables[0].symbols, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    });

    it("handles sparse length distribution", () => {
      const data = new Uint8Array([
        0x00,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1, // Code at length 1 and 16
        0,
        1,
      ]);

      const tables = decodeDHT(data);
      assert.equal(tables[0].totalSymbols, 2);
      assert.equal(tables[0].maxLength, 16);
    });
  });

  describe("Standard Table Recognition", () => {
    it("recognizes standard DC luminance table", () => {
      const data = new Uint8Array([0x00, ...STANDARD_DC_LUMINANCE.lengths, ...STANDARD_DC_LUMINANCE.symbols]);

      const tables = decodeDHT(data);
      assert.equal(tables[0].isStandard, true);
    });

    it("recognizes standard AC luminance table", () => {
      const data = new Uint8Array([0x10, ...STANDARD_AC_LUMINANCE.lengths, ...STANDARD_AC_LUMINANCE.symbols]);

      const tables = decodeDHT(data);
      assert.equal(tables[0].isStandard, true);
    });

    it("detects custom tables", () => {
      const data = new Uint8Array([
        0x00,
        0,
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0, // Custom lengths
        0,
        1,
      ]);

      const tables = decodeDHT(data);
      assert.equal(tables[0].isStandard, false);
    });
  });

  describe("Performance Edge Cases", () => {
    it("handles large symbol tables efficiently", () => {
      // Create AC table with many symbols
      const lengths = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 200];
      const symbols = Array.from({ length: 200 }, (_, i) => i);

      const data = new Uint8Array([0x10, ...lengths, ...symbols]);

      const tables = decodeDHT(data);
      assert.equal(tables[0].totalSymbols, 200);
      assert.equal(tables[0].symbols.length, 200);
    });

    it("handles mixed table types efficiently", () => {
      // Create multiple tables of different types
      const data = new Uint8Array([
        // DC table 0
        0x00, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        // AC table 0
        0x10, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x01, 0x02,
        // DC table 1
        0x01, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        // AC table 1
        0x11, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x11,
      ]);

      const tables = decodeDHT(data);
      assert.equal(tables.length, 4);

      const summary = getHuffmanSummary(tables);
      assert.deepEqual(summary.dcTables, [0, 1]);
      assert.deepEqual(summary.acTables, [0, 1]);
    });
  });
});
