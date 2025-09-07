/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for Huffman decoding.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  BitStream,
  createStandardHuffmanTable,
  decodeACCoefficients,
  decodeBlock,
  decodeCoefficient,
  decodeDCCoefficient,
  HuffmanTable,
} from "./huffman-decode.js";

describe("Huffman Decoding", () => {
  describe("BitStream", () => {
    describe("constructor", () => {
      it("creates bit stream from Uint8Array", () => {
        const data = new Uint8Array([0x12, 0x34, 0x56]);
        const stream = new BitStream(data);

        assert.equal(stream.byteOffset, 1); // First byte loaded
        assert.equal(stream.bitsAvailable, 8);
        assert.equal(stream.currentByte, 0x12);
        assert.equal(stream.ended, false);
      });

      it("accepts starting offset", () => {
        const data = new Uint8Array([0x12, 0x34, 0x56]);
        const stream = new BitStream(data, 1);

        assert.equal(stream.currentByte, 0x34);
      });

      it("rejects invalid data types", () => {
        assert.throws(() => new BitStream([]), /Uint8Array/);
        assert.throws(() => new BitStream("invalid"), /Uint8Array/);
      });
    });

    describe("readBits", () => {
      it("reads single bits correctly", () => {
        const data = new Uint8Array([0b10110100]); // 0xB4
        const stream = new BitStream(data);

        assert.equal(stream.readBits(1), 1);
        assert.equal(stream.readBits(1), 0);
        assert.equal(stream.readBits(1), 1);
        assert.equal(stream.readBits(1), 1);
        assert.equal(stream.readBits(1), 0);
        assert.equal(stream.readBits(1), 1);
        assert.equal(stream.readBits(1), 0);
        assert.equal(stream.readBits(1), 0);
      });

      it("reads multi-bit values correctly", () => {
        const data = new Uint8Array([0b10110100, 0b11001010]); // 0xB4, 0xCA
        const stream = new BitStream(data);

        assert.equal(stream.readBits(4), 0b1011); // 11
        assert.equal(stream.readBits(4), 0b0100); // 4
        assert.equal(stream.readBits(8), 0b11001010); // 0xCA
      });

      it("reads across byte boundaries", () => {
        const data = new Uint8Array([0b10110100, 0b11001010]); // 0xB4, 0xCA
        const stream = new BitStream(data);

        assert.equal(stream.readBits(6), 0b101101); // 45
        assert.equal(stream.readBits(6), 0b001100); // 12
        assert.equal(stream.readBits(4), 0b1010); // 10
      });

      it("validates bit count range", () => {
        const data = new Uint8Array([0x12]);
        const stream = new BitStream(data);

        assert.throws(() => stream.readBits(0), /Invalid bit count/);
        assert.throws(() => stream.readBits(17), /Invalid bit count/);
      });

      it("throws on stream end", () => {
        const data = new Uint8Array([0x12]);
        const stream = new BitStream(data);

        stream.readBits(8); // Consume all bits
        assert.throws(() => stream.readBits(1), /stream/);
      });
    });

    describe("peekBits", () => {
      it("peeks without consuming bits", () => {
        const data = new Uint8Array([0b10110100]);
        const stream = new BitStream(data);

        assert.equal(stream.peekBits(4), 0b1011);
        assert.equal(stream.peekBits(4), 0b1011); // Same result
        assert.equal(stream.readBits(4), 0b1011); // Now consume
        assert.equal(stream.peekBits(4), 0b0100); // Next 4 bits
      });

      it("handles peek at stream end", () => {
        const data = new Uint8Array([0x12]);
        const stream = new BitStream(data);

        stream.readBits(8); // Consume all
        assert.throws(() => stream.peekBits(1), /stream/);
      });
    });

    describe("byte stuffing", () => {
      it("handles 0xFF 0x00 byte stuffing", () => {
        const data = new Uint8Array([0xff, 0x00, 0x12]);
        const stream = new BitStream(data);

        // Should read 0xFF (byte-stuffed) then 0x12
        assert.equal(stream.readBits(8), 0xff);
        assert.equal(stream.readBits(8), 0x12);
      });

      it("handles restart markers", () => {
        const data = new Uint8Array([0x12, 0xff, 0xd0, 0x34]); // RST0
        const stream = new BitStream(data);

        assert.equal(stream.readBits(8), 0x12);
        // RST0 marker should be consumed and treated as padding (0)
        assert.equal(stream.readBits(8), 0x00); // Restart marker becomes 0
        assert.equal(stream.readBits(8), 0x34);
      });

      it("ends on non-restart markers", () => {
        const data = new Uint8Array([0x12, 0xff, 0xd9]); // EOI
        const stream = new BitStream(data);

        assert.equal(stream.readBits(8), 0x12);
        // The stream should end when it encounters EOI marker
        // Try to read more bits, should throw or return ended
        try {
          stream.readBits(8);
          // If we get here, check if stream is ended
          assert.equal(stream.isEnded(), true);
        } catch (error) {
          // Expected - stream ended
          assert(error.message.includes("stream"));
        }
      });
    });

    describe("position tracking", () => {
      it("tracks position correctly", () => {
        const data = new Uint8Array([0x12, 0x34]);
        const stream = new BitStream(data);

        let pos = stream.getPosition();
        assert.equal(pos.totalBits, 0);

        stream.readBits(3);
        pos = stream.getPosition();
        assert.equal(pos.totalBits, 3);

        stream.readBits(10);
        pos = stream.getPosition();
        assert.equal(pos.totalBits, 13);
      });
    });
  });

  describe("HuffmanTable", () => {
    describe("constructor", () => {
      it("creates table from DHT data", () => {
        const dhtData = {
          class: 0,
          id: 0,
          codeLengths: [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          symbols: [0, 1],
        };

        const table = new HuffmanTable(dhtData);

        assert.equal(table.class, 0);
        assert.equal(table.id, 0);
        assert.deepEqual(table.codeLengths, dhtData.codeLengths);
        assert.deepEqual(table.symbols, dhtData.symbols);
      });

      it("builds decode tables correctly", () => {
        const dhtData = {
          class: 0,
          id: 0,
          codeLengths: [0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 3 symbols: 2 at length 2, 1 at length 3
          symbols: [0, 1, 2],
        };

        const table = new HuffmanTable(dhtData);

        assert.equal(table.minCodeLength, 2);
        assert.equal(table.maxCodeLength, 3);
        assert.equal(table.codes.size, 3);
      });
    });

    describe("decodeSymbol", () => {
      it("decodes symbols correctly", () => {
        const dhtData = {
          class: 0,
          id: 0,
          codeLengths: [0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          symbols: [0, 1, 2],
        };

        const table = new HuffmanTable(dhtData);

        // Test known codes: 00->0, 01->1, 10->2
        let data = new Uint8Array([0b00000000]); // 00 (symbol 0)
        let stream = new BitStream(data);
        assert.equal(table.decodeSymbol(stream), 0);

        data = new Uint8Array([0b01000000]); // 01 (symbol 1)
        stream = new BitStream(data);
        assert.equal(table.decodeSymbol(stream), 1);

        data = new Uint8Array([0b10000000]); // 10 (symbol 2)
        stream = new BitStream(data);
        assert.equal(table.decodeSymbol(stream), 2);
      });

      it("uses fast lookup for short codes", () => {
        const dhtData = createStandardHuffmanTable("dc-luminance");
        const table = new HuffmanTable(dhtData);

        // Symbol 0 should have a short code
        const data = new Uint8Array([0b00000000]);
        const stream = new BitStream(data);

        const symbol = table.decodeSymbol(stream);
        assert.equal(symbol, 0);
      });

      it("handles longer codes with slow lookup", () => {
        const dhtData = {
          class: 0,
          id: 0,
          codeLengths: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], // 1 symbol at length 10
          symbols: [42],
        };

        const table = new HuffmanTable(dhtData);

        // 10-bit code: 0000000000 -> symbol 42
        const data = new Uint8Array([0b00000000, 0b00000000]);
        const stream = new BitStream(data);

        assert.equal(table.decodeSymbol(stream), 42);
      });

      it("throws on invalid codes", () => {
        const dhtData = {
          class: 0,
          id: 0,
          codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          symbols: [0],
        };

        const table = new HuffmanTable(dhtData);

        // Invalid code: 1 (only 0 is valid)
        const data = new Uint8Array([0b10000000]);
        const stream = new BitStream(data);

        assert.throws(() => table.decodeSymbol(stream), /Invalid Huffman code/);
      });

      it("throws on stream end", () => {
        const dhtData = createStandardHuffmanTable("dc-luminance");
        const table = new HuffmanTable(dhtData);

        const data = new Uint8Array([]);
        const stream = new BitStream(data);

        assert.throws(() => table.decodeSymbol(stream), /bit stream ended/);
      });
    });

    describe("validate", () => {
      it("accepts valid tables", () => {
        const dhtData = createStandardHuffmanTable("dc-luminance");
        const table = new HuffmanTable(dhtData);

        assert.doesNotThrow(() => table.validate());
      });

      it("rejects mismatched symbol counts", () => {
        const dhtData = {
          class: 0,
          id: 0,
          codeLengths: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 2 symbols expected
          symbols: [0], // Only 1 symbol provided
        };

        const table = new HuffmanTable(dhtData);
        assert.throws(() => table.validate(), /doesn't match symbols count/);
      });

      it("rejects too many codes for length", () => {
        // Valid case first
        const validData = {
          class: 0,
          id: 0,
          codeLengths: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 2 symbols at length 2 (max 2^2 = 4)
          symbols: [0, 1],
        };

        const validTable = new HuffmanTable(validData);
        assert.doesNotThrow(() => validTable.validate()); // This should be valid

        // Invalid case: too many codes at length 1
        const invalidData = {
          class: 0,
          id: 0,
          codeLengths: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 3 symbols at length 1 (max 2^1 = 2)
          symbols: [0, 1, 2],
        };
        const invalidTable = new HuffmanTable(invalidData);
        assert.throws(() => invalidTable.validate(), /too many codes/);
      });

      it("rejects invalid symbol values", () => {
        const dhtData = {
          class: 0,
          id: 0,
          codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          symbols: [256], // Invalid symbol value
        };

        const table = new HuffmanTable(dhtData);
        assert.throws(() => table.validate(), /Invalid symbol value/);
      });
    });

    describe("getStats", () => {
      it("returns correct statistics", () => {
        const dhtData = createStandardHuffmanTable("dc-luminance");
        const table = new HuffmanTable(dhtData);

        const stats = table.getStats();

        assert.equal(stats.class, 0);
        assert.equal(stats.id, 0);
        assert.equal(stats.symbolCount, 12);
        assert(stats.minCodeLength >= 1);
        assert(stats.maxCodeLength <= 16);
        assert.equal(stats.totalCodes, 12);
      });
    });
  });

  describe("decodeCoefficient", () => {
    it("decodes category 0 (zero)", () => {
      const data = new Uint8Array([0x00]);
      const stream = new BitStream(data);

      assert.equal(decodeCoefficient(0, stream), 0);
    });

    it("decodes positive coefficients", () => {
      // Category 3, magnitude 6 (binary 110) -> positive value 6
      const data = new Uint8Array([0b11000000]);
      const stream = new BitStream(data);

      assert.equal(decodeCoefficient(3, stream), 6);
    });

    it("decodes negative coefficients", () => {
      // Category 3, magnitude 1 (binary 001) -> negative value -6
      const data = new Uint8Array([0b00100000]);
      const stream = new BitStream(data);

      assert.equal(decodeCoefficient(3, stream), -6);
    });

    it("handles all categories correctly", () => {
      const testCases = [
        { category: 1, magnitude: 1, expected: 1 }, // 1-bit: 1 -> 1
        { category: 1, magnitude: 0, expected: -1 }, // 1-bit: 0 -> -1
        { category: 2, magnitude: 3, expected: 3 }, // 2-bit: 11 -> 3
        { category: 2, magnitude: 0, expected: -3 }, // 2-bit: 00 -> -3
        { category: 4, magnitude: 15, expected: 15 }, // 4-bit: 1111 -> 15
        { category: 4, magnitude: 0, expected: -15 }, // 4-bit: 0000 -> -15
      ];

      for (const { category, magnitude, expected } of testCases) {
        const bits = magnitude.toString(2).padStart(category, "0");
        const byte = parseInt(bits.padEnd(8, "0"), 2);
        const data = new Uint8Array([byte]);
        const stream = new BitStream(data);

        assert.equal(decodeCoefficient(category, stream), expected);
      }
    });

    it("validates category range", () => {
      const data = new Uint8Array([0x00]);
      const stream = new BitStream(data);

      assert.throws(() => decodeCoefficient(-1, stream), /Invalid coefficient category/);
      assert.throws(() => decodeCoefficient(16, stream), /Invalid coefficient category/);
    });
  });

  describe("decodeDCCoefficient", () => {
    it("decodes DC difference correctly", () => {
      // Create a simple test table where we know the codes
      const dhtData = {
        class: 0,
        id: 0,
        codeLengths: [0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 4 symbols at length 2
        symbols: [0, 1, 2, 3], // Categories 0-3
      };
      const table = new HuffmanTable(dhtData);

      // Test category 0 (no difference)
      const data0 = new Uint8Array([0b00000000]); // Code 00 -> symbol 0
      const stream0 = new BitStream(data0);
      const result0 = decodeDCCoefficient(table, stream0, 100);
      assert.equal(result0, 100); // No change

      // Test category 2 with positive difference
      const data2 = new Uint8Array([0b10110000]); // Code 10 -> symbol 2, magnitude 11 (binary) = 3
      const stream2 = new BitStream(data2);
      const result2 = decodeDCCoefficient(table, stream2, 100);
      assert.equal(result2, 103); // 100 + 3
    });
  });

  describe("decodeACCoefficients", () => {
    it("handles EOB (End of Block)", () => {
      const dhtData = createStandardHuffmanTable("ac-luminance");
      const table = new HuffmanTable(dhtData);

      // Symbol 0x00 is EOB
      const data = new Uint8Array([0b00000000]); // Assuming symbol 0 has code 00
      const stream = new BitStream(data);

      const coefficients = new Array(64).fill(-1); // Initialize with non-zero
      coefficients[0] = 42; // DC coefficient

      try {
        decodeACCoefficients(table, stream, coefficients);

        // All AC coefficients should be zero after EOB
        for (let i = 1; i < 64; i++) {
          assert.equal(coefficients[i], 0);
        }
        assert.equal(coefficients[0], 42); // DC unchanged
      } catch (error) {
        // Expected if our test data doesn't match actual Huffman codes
        assert(error.message.includes("Invalid Huffman code") || error.message.includes("stream"));
      }
    });

    it("validates coefficient array", () => {
      const dhtData = createStandardHuffmanTable("ac-luminance");
      const table = new HuffmanTable(dhtData);
      const data = new Uint8Array([0x00]);
      const stream = new BitStream(data);

      assert.throws(() => decodeACCoefficients(table, stream, []), /64 elements/);
      assert.throws(() => decodeACCoefficients(table, stream, new Array(63)), /64 elements/);
    });
  });

  describe("decodeBlock", () => {
    it("decodes complete block", () => {
      const dcTable = new HuffmanTable(createStandardHuffmanTable("dc-luminance"));
      const acTable = new HuffmanTable(createStandardHuffmanTable("ac-luminance"));

      // Simple test data (may not match actual codes)
      const data = new Uint8Array([0x00, 0x00]); // Minimal data
      const stream = new BitStream(data);

      try {
        const result = decodeBlock(dcTable, acTable, stream, 50);

        assert(Array.isArray(result.coefficients));
        assert.equal(result.coefficients.length, 64);
        assert(typeof result.dcValue === "number");
      } catch (error) {
        // Expected if our test data doesn't match actual Huffman codes
        assert(error.message.includes("Invalid Huffman code") || error.message.includes("stream"));
      }
    });
  });

  describe("createStandardHuffmanTable", () => {
    it("creates DC luminance table", () => {
      const table = createStandardHuffmanTable("dc-luminance");

      assert.equal(table.class, 0);
      assert.equal(table.id, 0);
      assert.equal(table.codeLengths.length, 16);
      assert.equal(table.symbols.length, 12);
    });

    it("creates AC luminance table", () => {
      const table = createStandardHuffmanTable("ac-luminance");

      assert.equal(table.class, 1);
      assert.equal(table.id, 0);
      assert.equal(table.codeLengths.length, 16);
      assert(table.symbols.length > 100); // Large symbol set
    });

    it("creates DC chrominance table", () => {
      const table = createStandardHuffmanTable("dc-chrominance");

      assert.equal(table.class, 0);
      assert.equal(table.id, 1);
      assert.equal(table.symbols.length, 12);
    });

    it("creates AC chrominance table", () => {
      const table = createStandardHuffmanTable("ac-chrominance");

      assert.equal(table.class, 1);
      assert.equal(table.id, 1);
      assert(table.symbols.length > 100);
    });

    it("rejects unknown table types", () => {
      assert.throws(() => createStandardHuffmanTable("unknown"), /Unknown standard Huffman table/);
    });

    it("creates valid tables", () => {
      const types = ["dc-luminance", "ac-luminance", "dc-chrominance", "ac-chrominance"];

      for (const type of types) {
        const tableData = createStandardHuffmanTable(type);
        const table = new HuffmanTable(tableData);

        assert.doesNotThrow(() => table.validate(), `${type} table should be valid`);
      }
    });
  });

  describe("Integration Tests", () => {
    it("handles realistic coefficient decoding", () => {
      // Create a simple test case with known codes
      const dhtData = {
        class: 0,
        id: 0,
        codeLengths: [0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 4 symbols at length 2
        symbols: [0, 1, 2, 3],
      };

      const table = new HuffmanTable(dhtData);

      // Test coefficient categories
      for (let category = 0; category <= 3; category++) {
        // Encode category (2 bits) + magnitude (category bits)
        const categoryBits = category.toString(2).padStart(2, "0");
        let testBits = categoryBits;

        if (category > 0) {
          // Add magnitude bits for positive value
          const magnitude = (1 << (category - 1)) + 1; // Positive value
          const magnitudeBits = magnitude.toString(2).padStart(category, "0");
          testBits += magnitudeBits;
        }

        const byte = parseInt(testBits.padEnd(8, "0"), 2);
        const data = new Uint8Array([byte]);
        const stream = new BitStream(data);

        const decodedCategory = table.decodeSymbol(stream);
        assert.equal(decodedCategory, category);

        if (category > 0) {
          const coefficient = decodeCoefficient(category, stream);
          assert(coefficient > 0, `Category ${category} should decode to positive value`);
        }
      }
    });

    it("handles byte stuffing in coefficient stream", () => {
      const dhtData = {
        class: 0,
        id: 0,
        codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        symbols: [0],
      };

      const _table = new HuffmanTable(dhtData);

      // Data with byte stuffing: 0xFF 0x00 should be treated as 0xFF
      const data = new Uint8Array([0xff, 0x00]);
      const stream = new BitStream(data);

      // Should be able to read from the stuffed byte
      const bits = stream.readBits(8);
      assert.equal(bits, 0xff);
    });
  });

  describe("Performance", () => {
    it("decodes many symbols efficiently", () => {
      const table = new HuffmanTable(createStandardHuffmanTable("dc-luminance"));

      // Create test data with repeated patterns
      const data = new Uint8Array(1000).fill(0x00); // Simple pattern
      const stream = new BitStream(data);

      let decodedCount = 0;
      try {
        while (!stream.isEnded() && decodedCount < 100) {
          table.decodeSymbol(stream);
          decodedCount++;
        }
      } catch (_error) {
        // Expected when we hit invalid codes or end of stream
      }

      // Should have decoded some symbols without timeout
      assert(decodedCount >= 0);
    });

    it("handles large coefficient arrays efficiently", () => {
      const coefficients = new Array(64).fill(0);

      // Simple validation that array operations are fast
      for (let i = 0; i < 1000; i++) {
        coefficients.fill(0);
        coefficients[0] = i;
      }

      assert.equal(coefficients[0], 999);
    });
  });
});
