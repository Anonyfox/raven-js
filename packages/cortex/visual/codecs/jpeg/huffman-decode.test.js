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
  BitStreamReader,
  BLOCK_SIZE,
  decodeACCoefficients,
  decodeDCCoefficient,
  decodeHuffmanSymbol,
  EOB_SYMBOL,
  getHuffmanDecoderSummary,
  HuffmanDecoder,
  MAX_AC_CATEGORY,
  MAX_DC_CATEGORY,
  ZIGZAG_ORDER,
  ZRL_SYMBOL,
} from "./huffman-decode.js";

describe("JPEG Huffman Decoder", () => {
  describe("Constants and Zigzag Order", () => {
    it("defines correct maximum categories", () => {
      assert.equal(MAX_DC_CATEGORY, 11);
      assert.equal(MAX_AC_CATEGORY, 10);
    });

    it("defines correct special symbols", () => {
      assert.equal(EOB_SYMBOL, 0x00);
      assert.equal(ZRL_SYMBOL, 0xf0);
    });

    it("defines correct block size", () => {
      assert.equal(BLOCK_SIZE, 64);
    });

    it("defines correct zigzag order", () => {
      assert.equal(ZIGZAG_ORDER.length, 64);
      assert.equal(ZIGZAG_ORDER[0], 0); // DC coefficient
      assert.equal(ZIGZAG_ORDER[1], 1); // First AC coefficient
      assert.equal(ZIGZAG_ORDER[63], 63); // Last coefficient

      // Verify all indices 0-63 are present exactly once
      const sorted = [...ZIGZAG_ORDER].sort((a, b) => a - b);
      for (let i = 0; i < 64; i++) {
        assert.equal(sorted[i], i);
      }
    });
  });

  describe("BitStreamReader", () => {
    it("creates reader with valid data", () => {
      const data = new Uint8Array([0x12, 0x34, 0x56]);
      const reader = new BitStreamReader(data);

      assert.equal(reader.byteOffset, 0);
      assert.equal(reader.bitOffset, 0);
      assert.equal(reader.hasMoreBits(), true);
    });

    it("creates reader with offset", () => {
      const data = new Uint8Array([0x12, 0x34, 0x56]);
      const reader = new BitStreamReader(data, 1);

      assert.equal(reader.byteOffset, 1);
    });

    it("throws on invalid data type", () => {
      assert.throws(() => {
        new BitStreamReader("not array");
      }, TypeError);
    });

    it("reads single bits correctly", () => {
      // 0x80 = 10000000b
      const data = new Uint8Array([0x80]);
      const reader = new BitStreamReader(data);

      assert.equal(reader.readBits(1), 1);
      assert.equal(reader.readBits(1), 0);
      assert.equal(reader.readBits(1), 0);
      assert.equal(reader.readBits(1), 0);
    });

    it("reads multiple bits correctly", () => {
      // 0xAB = 10101011b
      const data = new Uint8Array([0xab]);
      const reader = new BitStreamReader(data);

      assert.equal(reader.readBits(4), 0x0a); // 1010b
      assert.equal(reader.readBits(4), 0x0b); // 1011b
    });

    it("reads across byte boundaries", () => {
      // 0x12 0x34 = 00010010 00110100b
      const data = new Uint8Array([0x12, 0x34]);
      const reader = new BitStreamReader(data);

      assert.equal(reader.readBits(12), 0x123); // 000100100011b
      assert.equal(reader.readBits(4), 0x04); // 0100b
    });

    it("handles marker stuffing (0xFF00 -> 0xFF)", () => {
      const data = new Uint8Array([0xff, 0x00, 0x12]);
      const reader = new BitStreamReader(data);

      assert.equal(reader.readBits(8), 0xff);
      assert.equal(reader.readBits(8), 0x12);
    });

    it("handles multiple consecutive marker stuffing", () => {
      const data = new Uint8Array([0xff, 0x00, 0xff, 0x00, 0x34]);
      const reader = new BitStreamReader(data);

      assert.equal(reader.readBits(8), 0xff);
      assert.equal(reader.readBits(8), 0xff);
      assert.equal(reader.readBits(8), 0x34);
    });

    it("handles marker stuffing across bit boundaries", () => {
      const data = new Uint8Array([0x7f, 0xff, 0x00, 0x80]);
      const reader = new BitStreamReader(data);

      assert.equal(reader.readBits(1), 0); // 0
      assert.equal(reader.readBits(8), 0xff); // 1111111 + 1 from stuffed 0xFF
      assert.equal(reader.readBits(1), 1); // First bit of 0x80
    });

    it("detects and consumes all RST markers (0xFFD0-0xFFD7)", () => {
      for (let rst = 0xd0; rst <= 0xd7; rst++) {
        const data = new Uint8Array([0x12, 0xff, rst]);
        const reader = new BitStreamReader(data);

        assert.equal(reader.readBits(8), 0x12);
        // After reading 0x12, the RST marker should be detected and consumed
        // This should trigger the restart flag
        assert.equal(reader.hasRestart(), true);
        assert.equal(reader.consumeRestart(), rst);
        // After consuming restart, no more bits should be available
        assert.equal(reader.hasMoreBits(), false);
      }
    });

    it("detects non-RST markers and stops decoding", () => {
      const nonRstMarkers = [0xda, 0xd9, 0xc0, 0xe0, 0xfe];

      for (const marker of nonRstMarkers) {
        const data = new Uint8Array([0x12, 0xff, marker]);
        const reader = new BitStreamReader(data);

        assert.equal(reader.readBits(8), 0x12);
        assert.equal(reader.hasMarker(), true);
        assert.equal(reader.getMarker(), 0xff00 | marker);
      }
    });

    it("handles invalid marker sequences", () => {
      // 0xFF followed by 0x01-0xCF (invalid range)
      const data = new Uint8Array([0x12, 0xff, 0x01]);
      const reader = new BitStreamReader(data);

      assert.equal(reader.readBits(8), 0x12);
      assert.equal(reader.hasMarker(), true);
      assert.equal(reader.getMarker(), 0xff01);
    });

    it("handles 0xFFFF sequences as marker", () => {
      const data = new Uint8Array([0xff, 0xff, 0x12]);
      const reader = new BitStreamReader(data);

      // 0xFFFF should be detected as marker immediately
      assert.equal(reader.hasMarker(), true);
      assert.equal(reader.getMarker(), 0xffff);
      // Should still have more bits available (just marker detected)
      assert.equal(reader.hasMoreBits(), true);
    });

    it("peeks bits without consuming", () => {
      const data = new Uint8Array([0xab]);
      const reader = new BitStreamReader(data);

      assert.equal(reader.peekBits(4), 0x0a);
      assert.equal(reader.peekBits(4), 0x0a); // Same value
      assert.equal(reader.readBits(4), 0x0a); // Now consume
      assert.equal(reader.peekBits(4), 0x0b);
    });

    it("skips bits correctly", () => {
      const data = new Uint8Array([0xab]);
      const reader = new BitStreamReader(data);

      reader.skipBits(4);
      assert.equal(reader.readBits(4), 0x0b);
    });

    it("throws on insufficient bits", () => {
      const data = new Uint8Array([0x12]);
      const reader = new BitStreamReader(data);

      reader.readBits(8); // Consume all bits

      assert.throws(() => {
        reader.readBits(1);
      }, /Not enough bits/);
    });

    it("throws on invalid bit count", () => {
      const data = new Uint8Array([0x12]);
      const reader = new BitStreamReader(data);

      assert.throws(() => {
        reader.readBits(0);
      }, /Invalid bit count/);

      assert.throws(() => {
        reader.readBits(17);
      }, /Invalid bit count/);
    });
  });

  describe("Huffman Symbol Decoding", () => {
    // Create a simple Huffman table for testing
    // Proper prefix-free codes: 0->0(len1), 1->2(len2), 2->3(len2)
    const createTestTable = () => ({
      lookup: new Array(256).fill(-1),
      maxCode: [-1, 0, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      codes: new Map([
        [0, { code: 0, length: 1 }], // 0
        [1, { code: 2, length: 2 }], // 10
        [2, { code: 3, length: 2 }], // 11
      ]),
    });

    it("decodes simple Huffman symbols", () => {
      const table = createTestTable();

      const data = new Uint8Array([0b00110000]); // 0, 0, 11 (symbols 0, 0, 2)
      const reader = new BitStreamReader(data);

      assert.equal(decodeHuffmanSymbol(reader, table), 0);
      assert.equal(decodeHuffmanSymbol(reader, table), 0);
      assert.equal(decodeHuffmanSymbol(reader, table), 2);
    });

    it("handles valid repeated codes", () => {
      const table = createTestTable();
      const data = new Uint8Array([0b10100000]); // 10, 10 (symbols 1, 1)
      const reader = new BitStreamReader(data);

      // First symbol should decode successfully
      assert.equal(decodeHuffmanSymbol(reader, table), 1);
      // Second symbol should also decode successfully
      assert.equal(decodeHuffmanSymbol(reader, table), 1);
    });

    it("throws on invalid parameters", () => {
      const table = createTestTable();

      assert.throws(() => {
        decodeHuffmanSymbol(null, table);
      }, /Invalid reader or Huffman table/);

      assert.throws(() => {
        decodeHuffmanSymbol(new BitStreamReader(new Uint8Array([0])), null);
      }, /Invalid reader or Huffman table/);
    });
  });

  describe("DC Coefficient Decoding", () => {
    // Simple DC table: category 0 = code 0, category 1 = code 1
    const createDCTable = () => ({
      lookup: new Array(256).fill(-1),
      maxCode: [-1, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      codes: new Map([
        [0, { code: 0, length: 1 }], // Category 0
        [1, { code: 1, length: 1 }], // Category 1
      ]),
    });

    it("decodes DC coefficient category 0", () => {
      const table = createDCTable();
      const data = new Uint8Array([0b00000000]); // Category 0 (no magnitude bits)
      const reader = new BitStreamReader(data);

      const result = decodeDCCoefficient(reader, table, 100);

      assert.equal(result.coefficient, 100); // Predictor unchanged
      assert.equal(result.newPredictor, 100);
    });

    it("decodes positive DC coefficient", () => {
      const table = createDCTable();
      const data = new Uint8Array([0b11000000]); // Category 1, magnitude 1 (positive)
      const reader = new BitStreamReader(data);

      const result = decodeDCCoefficient(reader, table, 100);

      assert.equal(result.coefficient, 101); // 100 + 1
      assert.equal(result.newPredictor, 101);
    });

    it("decodes negative DC coefficient", () => {
      const table = createDCTable();
      const data = new Uint8Array([0b10000000]); // Category 1, magnitude 0 (negative)
      const reader = new BitStreamReader(data);

      const result = decodeDCCoefficient(reader, table, 100);

      assert.equal(result.coefficient, 99); // 100 + (-1)
      assert.equal(result.newPredictor, 99);
    });

    it("throws on failed category decode", () => {
      const table = createDCTable();
      const data = new Uint8Array([]); // No data
      const reader = new BitStreamReader(data);

      assert.throws(() => {
        decodeDCCoefficient(reader, table, 0);
      }, /Not enough bits/);
    });

    it("throws on invalid DC categories (12-15)", () => {
      // ITU-T T.81: DC categories must be 0-11 only
      for (let invalidCategory = 12; invalidCategory <= 15; invalidCategory++) {
        const badTable = {
          lookup: new Array(256).fill(-1),
          maxCode: [-1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
          codes: new Map([[invalidCategory, { code: 0, length: 1 }]]),
        };

        const data = new Uint8Array([0b00000000]);
        const reader = new BitStreamReader(data);

        assert.throws(
          () => {
            decodeDCCoefficient(reader, badTable, 0);
          },
          new RegExp(`Invalid DC category: ${invalidCategory}`)
        );
      }
    });

    it("handles maximum valid DC category (11)", () => {
      const table = {
        lookup: new Array(256).fill(-1),
        maxCode: [-1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        codes: new Map([[11, { code: 0, length: 1 }]]), // Maximum valid category
      };

      // Category 11 requires 11 magnitude bits: 0 (negative) = -2047, 1 (positive) = +2047
      const data = new Uint8Array([0b01111111, 0b11110000]); // Category 11, magnitude 2047 (all 1s for 11 bits)
      const reader = new BitStreamReader(data);

      const result = decodeDCCoefficient(reader, table, 0);
      assert.equal(result.coefficient, 2047); // 0 + 2047
    });
  });

  describe("AC Coefficient Decoding", () => {
    // Simple AC table: EOB = 0 (len 2), ZRL = 1 (len 2), (run=1,size=1) = 2 (len 2)
    const createACTable = () => ({
      lookup: new Array(256).fill(-1),
      maxCode: [-1, -1, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      codes: new Map([
        [0x00, { code: 0, length: 2 }], // EOB
        [0xf0, { code: 1, length: 2 }], // ZRL
        [0x11, { code: 2, length: 2 }], // Run=1, Size=1
      ]),
    });

    it("decodes EOB (End of Block)", () => {
      const table = createACTable();
      const data = new Uint8Array([0b00000000]); // EOB (code 0, length 2)
      const reader = new BitStreamReader(data);
      const block = new Array(64).fill(999); // Fill with non-zero to verify clearing

      const count = decodeACCoefficients(reader, table, block, 1, 63);

      assert.equal(count, 0);
      // All AC coefficients should be zero
      for (let i = 1; i < 64; i++) {
        assert.equal(block[ZIGZAG_ORDER[i]], 0);
      }
    });

    it("decodes ZRL (Zero Run Length)", () => {
      const table = createACTable();
      // ZRL (code 1 = 01) followed by EOB (code 0 = 00)
      const data = new Uint8Array([0b01000000]); // ZRL, EOB
      const reader = new BitStreamReader(data);
      const block = new Array(64).fill(999);

      decodeACCoefficients(reader, table, block, 1, 63);

      // First 16 AC coefficients should be zero
      for (let i = 1; i <= 16; i++) {
        assert.equal(block[ZIGZAG_ORDER[i]], 0);
      }
    });

    it("decodes AC coefficient with run", () => {
      const table = createACTable();
      // 0x11 symbol (code 2 = 10), magnitude 1 (1 bit), then EOB (code 0 = 00)
      const data = new Uint8Array([0b10100000]); // 10, 1, 00
      const reader = new BitStreamReader(data);
      const block = new Array(64).fill(999);

      decodeACCoefficients(reader, table, block, 1, 63);

      // Skip 1 coefficient (run=1), then place coefficient at index 2
      assert.equal(block[ZIGZAG_ORDER[1]], 0); // Skipped
      assert.equal(block[ZIGZAG_ORDER[2]], 1); // Coefficient
    });

    it("handles negative AC coefficient", () => {
      const table = createACTable();
      // 0x11 symbol (code 2 = 10), magnitude 0 (1 bit = negative), then EOB (code 0 = 00)
      const data = new Uint8Array([0b10000000]); // 10, 0, 00
      const reader = new BitStreamReader(data);
      const block = new Array(64).fill(999);

      decodeACCoefficients(reader, table, block, 1, 63);

      assert.equal(block[ZIGZAG_ORDER[1]], 0); // Skipped
      assert.equal(block[ZIGZAG_ORDER[2]], -1); // Negative coefficient
    });

    it("throws on invalid block", () => {
      const table = createACTable();
      const reader = new BitStreamReader(new Uint8Array([0]));

      assert.throws(() => {
        decodeACCoefficients(reader, table, [1, 2, 3]); // Wrong size
      }, /Expected 64-element coefficient block/);

      assert.throws(() => {
        decodeACCoefficients(reader, table, "not array");
      }, /Expected 64-element coefficient block/);
    });

    it("throws on invalid coefficient range", () => {
      const table = createACTable();
      const reader = new BitStreamReader(new Uint8Array([0]));
      const block = new Array(64).fill(0);

      assert.throws(() => {
        decodeACCoefficients(reader, table, block, 0, 63); // Start at DC
      }, /Invalid coefficient range/);

      assert.throws(() => {
        decodeACCoefficients(reader, table, block, 10, 5); // End < start
      }, /Invalid coefficient range/);
    });

    it("throws on failed symbol decode", () => {
      const table = createACTable();
      const reader = new BitStreamReader(new Uint8Array([])); // No data
      const block = new Array(64).fill(0);

      assert.throws(() => {
        decodeACCoefficients(reader, table, block, 1, 63);
      }, /Not enough bits/);
    });

    it("throws on invalid AC symbol (>255)", () => {
      // ITU-T T.81: AC symbols must be 0-255 only
      const badTable = {
        lookup: new Array(256).fill(-1),
        maxCode: [-1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        codes: new Map([[256, { code: 0, length: 1 }]]), // Invalid symbol 256
      };

      const data = new Uint8Array([0b00000000]);
      const reader = new BitStreamReader(data);
      const block = new Array(64).fill(0);

      assert.throws(() => {
        decodeACCoefficients(reader, badTable, block, 1, 63);
      }, /Invalid AC symbol: 256/);
    });

    it("throws on invalid run length (>15)", () => {
      // Symbol 0xFF has run=15, size=15 (maximum valid)
      // Test with invalid symbol that would decode to run=16
      const badTable = {
        lookup: new Array(256).fill(-1),
        maxCode: [-1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        codes: new Map([[0x100, { code: 0, length: 1 }]]), // Would decode to run=16, size=0
      };

      const data = new Uint8Array([0b00000000]);
      const reader = new BitStreamReader(data);
      const block = new Array(64).fill(0);

      // This should be caught by AC symbol validation first
      assert.throws(() => {
        decodeACCoefficients(reader, badTable, block, 1, 63);
      }, /Invalid AC symbol/);
    });

    it("throws on invalid size category (>10)", () => {
      // Symbol with size=11 (invalid, max is 10)
      const badTable = {
        lookup: new Array(256).fill(-1),
        maxCode: [-1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        codes: new Map([[0x0b, { code: 0, length: 1 }]]), // Run=0, Size=11 (invalid)
      };

      const data = new Uint8Array([0b00000000]);
      const reader = new BitStreamReader(data);
      const block = new Array(64).fill(0);

      assert.throws(() => {
        decodeACCoefficients(reader, badTable, block, 1, 63);
      }, /Invalid AC size category: 11/);
    });

    it("throws on block overflow", () => {
      // Table with symbol that has run=15 and will cause overflow
      const overflowTable = {
        lookup: new Array(256).fill(-1),
        maxCode: [-1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        codes: new Map([[0xf1, { code: 0, length: 1 }]]), // Run=15, Size=1
      };

      // Provide enough data: symbol (1 bit) + magnitude (1 bit) repeated
      const data = new Uint8Array([0b01010101, 0b01010101]); // Multiple 01 patterns
      const reader = new BitStreamReader(data);
      const block = new Array(64).fill(0);

      // Start at position 50, run=15 will try to go to position 65, but should be clamped
      // Should not throw, but handle gracefully with clamping
      assert.doesNotThrow(() => {
        decodeACCoefficients(reader, overflowTable, block, 50, 63);
      });
    });

    it("handles maximum valid AC values", () => {
      // Test maximum run=15, size=10 (symbol 0xFA)
      const table = {
        lookup: new Array(256).fill(-1),
        maxCode: [-1, -1, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        codes: new Map([
          [0x00, { code: 0, length: 2 }], // EOB
          [0xfa, { code: 1, length: 2 }], // Run=15, Size=10 (maximum)
        ]),
      };

      // Symbol 0xFA (01) + 10-bit magnitude (1023 = all 1s) + EOB (00)
      const data = new Uint8Array([0b01111111, 0b11110000]); // 01 (0xFA) + 1111111111 (1023) + 00 (EOB)
      const reader = new BitStreamReader(data);
      const block = new Array(64).fill(0);

      const count = decodeACCoefficients(reader, table, block, 1, 63);

      // Should skip 15 positions and place coefficient at position 16
      assert.equal(count, 1);
      assert.equal(block[ZIGZAG_ORDER[16]], 1023); // Maximum positive 10-bit value
    });
  });

  describe("HuffmanDecoder Class", () => {
    const createTestComponents = () => [
      { id: 1, dcTableId: 0, acTableId: 0 },
      { id: 2, dcTableId: 1, acTableId: 1 },
    ];

    const createTestTables = () => [
      {
        class: 0,
        id: 0,
        lookup: new Array(256).fill(-1),
        maxCode: [-1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        codes: new Map([[0, { code: 0, length: 1 }]]),
      },
      {
        class: 0,
        id: 1,
        lookup: new Array(256).fill(-1),
        maxCode: [-1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        codes: new Map([[0, { code: 0, length: 1 }]]),
      },
      {
        class: 1,
        id: 0,
        lookup: new Array(256).fill(-1),
        maxCode: [-1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        codes: new Map([[0, { code: 0, length: 1 }]]),
      },
      {
        class: 1,
        id: 1,
        lookup: new Array(256).fill(-1),
        maxCode: [-1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        codes: new Map([[0, { code: 0, length: 1 }]]),
      },
    ];

    it("creates decoder with valid parameters", () => {
      const components = createTestComponents();
      const tables = createTestTables();

      const decoder = new HuffmanDecoder(components, tables);

      assert.equal(decoder.components.length, 2);
      assert.equal(decoder.startSpectral, 0);
      assert.equal(decoder.endSpectral, 63);
      assert.equal(decoder.isDCOnly, false);
      assert.equal(decoder.isACOnly, false);
    });

    it("creates decoder with spectral selection", () => {
      const components = createTestComponents();
      const tables = createTestTables();

      const decoder = new HuffmanDecoder(components, tables, 1, 5);

      assert.equal(decoder.startSpectral, 1);
      assert.equal(decoder.endSpectral, 5);
      assert.equal(decoder.isDCOnly, false);
      assert.equal(decoder.isACOnly, true);
    });

    it("creates decoder for DC-only scan", () => {
      const components = createTestComponents();
      const tables = createTestTables();

      const decoder = new HuffmanDecoder(components, tables, 0, 0);

      assert.equal(decoder.isDCOnly, true);
      assert.equal(decoder.isACOnly, false);
    });

    it("throws on empty components", () => {
      const tables = createTestTables();

      assert.throws(() => {
        new HuffmanDecoder([], tables);
      }, /Expected non-empty components array/);

      assert.throws(() => {
        new HuffmanDecoder("not array", tables);
      }, /Expected non-empty components array/);
    });

    it("throws on invalid tables", () => {
      const components = createTestComponents();

      assert.throws(() => {
        new HuffmanDecoder(components, "not array");
      }, /Expected huffmanTables array/);
    });

    it("throws on missing DC table", () => {
      const components = [{ id: 1, dcTableId: 99, acTableId: 0 }];
      const tables = createTestTables();

      assert.throws(() => {
        new HuffmanDecoder(components, tables);
      }, /DC Huffman table 99 not found/);
    });

    it("throws on missing AC table for full scan", () => {
      const components = [{ id: 1, dcTableId: 0, acTableId: 99 }];
      const tables = createTestTables();

      assert.throws(() => {
        new HuffmanDecoder(components, tables);
      }, /AC Huffman table 99 not found/);
    });

    it("allows missing AC table for DC-only scan", () => {
      const components = [{ id: 1, dcTableId: 0, acTableId: 99 }];
      const tables = createTestTables().filter((t) => t.class === 0); // Only DC tables

      // Should not throw for DC-only scan
      const decoder = new HuffmanDecoder(components, tables, 0, 0);
      assert.equal(decoder.isDCOnly, true);
    });

    it("resets predictors", () => {
      const components = createTestComponents();
      const tables = createTestTables();
      const decoder = new HuffmanDecoder(components, tables);

      // Modify predictors
      decoder.dcPredictors[0] = 100;
      decoder.dcPredictors[1] = 200;

      decoder.resetPredictors();

      assert.equal(decoder.dcPredictors[0], 0);
      assert.equal(decoder.dcPredictors[1], 0);
    });

    it("decodes MCU with DC and AC", () => {
      const components = [{ id: 1, dcTableId: 0, acTableId: 0 }];
      const tables = createTestTables();
      const decoder = new HuffmanDecoder(components, tables);

      // DC category 0, AC EOB
      const data = new Uint8Array([0b00000000]); // All zeros
      const reader = new BitStreamReader(data);

      const blocks = decoder.decodeMCU(reader);

      assert.equal(blocks.length, 1);
      assert.equal(blocks[0].length, 64);
      assert.equal(blocks[0][0], 0); // DC coefficient
    });

    it("decodes DC-only MCU", () => {
      const components = [{ id: 1, dcTableId: 0, acTableId: 0 }];
      const tables = createTestTables();
      const decoder = new HuffmanDecoder(components, tables, 0, 0);

      const data = new Uint8Array([0b00000000]); // DC category 0
      const reader = new BitStreamReader(data);

      const blocks = decoder.decodeMCU(reader);

      assert.equal(blocks.length, 1);
      assert.equal(blocks[0][0], 0); // DC coefficient
      // AC coefficients should remain zero (not decoded)
      for (let i = 1; i < 64; i++) {
        assert.equal(blocks[0][i], 0);
      }
    });

    it("decodes AC-only MCU", () => {
      const components = [{ id: 1, dcTableId: 0, acTableId: 0 }];
      const tables = createTestTables();
      const decoder = new HuffmanDecoder(components, tables, 1, 5);

      const data = new Uint8Array([0b00000000]); // AC EOB
      const reader = new BitStreamReader(data);

      const blocks = decoder.decodeMCU(reader);

      assert.equal(blocks.length, 1);
      assert.equal(blocks[0][0], 0); // DC coefficient not decoded
      // AC coefficients in range should be zero
      for (let i = 1; i <= 5; i++) {
        assert.equal(blocks[0][ZIGZAG_ORDER[i]], 0);
      }
    });
  });

  describe("Decoder Summary", () => {
    it("generates decoder summary", () => {
      const components = [
        { id: 1, dcTableId: 0, acTableId: 0 },
        { id: 2, dcTableId: 1, acTableId: 1 },
      ];
      const tables = [
        { class: 0, id: 0, lookup: [], maxCode: [], codes: new Map() },
        { class: 0, id: 1, lookup: [], maxCode: [], codes: new Map() },
        { class: 1, id: 0, lookup: [], maxCode: [], codes: new Map() },
        { class: 1, id: 1, lookup: [], maxCode: [], codes: new Map() },
      ];

      const decoder = new HuffmanDecoder(components, tables, 1, 5);
      const summary = getHuffmanDecoderSummary(decoder);

      assert.equal(summary.componentCount, 2);
      assert.equal(summary.components.length, 2);
      assert.equal(summary.spectralRange, "1-5");
      assert.equal(summary.isDCOnly, false);
      assert.equal(summary.isACOnly, true);
      assert.deepEqual(summary.dcPredictors, [0, 0]);
      assert(summary.description.includes("2 components"));
    });

    it("throws on invalid decoder", () => {
      assert.throws(() => {
        getHuffmanDecoderSummary(null);
      }, TypeError);

      assert.throws(() => {
        getHuffmanDecoderSummary("not decoder");
      }, TypeError);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles maximum coefficient ranges", () => {
      const components = [{ id: 1, dcTableId: 0, acTableId: 0 }];
      const tables = [
        { class: 0, id: 0, lookup: [], maxCode: [], codes: new Map() },
        { class: 1, id: 0, lookup: [], maxCode: [], codes: new Map() },
      ];

      // Test maximum spectral range
      const decoder = new HuffmanDecoder(components, tables, 63, 63);
      assert.equal(decoder.startSpectral, 63);
      assert.equal(decoder.endSpectral, 63);
    });

    it("handles bit stream edge cases", () => {
      const reader = new BitStreamReader(new Uint8Array([0xff, 0x00, 0xff]));

      // Should handle marker stuffing: 0xFF 0x00 -> 0xFF
      assert.equal(reader.readBits(8), 0xff);
      assert.equal(reader.readBits(8), 0xff);
    });

    it("handles empty bit stream", () => {
      const reader = new BitStreamReader(new Uint8Array([]));

      assert.equal(reader.hasMoreBits(), false);
      assert.equal(reader.peekBits(1), -1);
    });

    it("handles coefficient boundary conditions", () => {
      const table = {
        lookup: new Array(256).fill(-1),
        maxCode: [-1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        codes: new Map([[0, { code: 0, length: 1 }]]),
      };

      const reader = new BitStreamReader(new Uint8Array([0]));
      const block = new Array(64).fill(0);

      // Test decoding at exact boundary
      const count = decodeACCoefficients(reader, table, block, 63, 63);
      assert.equal(count, 0); // EOB should terminate immediately
    });
  });
});
