/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for JPEG Huffman encoding.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { createStandardHuffmanTable } from "./huffman-decode.js";
import {
  analyzeEncodingEfficiency,
  BitWriter,
  createStandardHuffmanEncoder,
  createTestCoefficientBlock,
  encodeACCoefficients,
  encodeBlock,
  encodeCoefficient,
  encodeDCCoefficient,
  estimateEncodedSize,
  HuffmanEncoder,
  validateEncodingParameters,
} from "./huffman-encode.js";

describe("JPEG Huffman Encoding", () => {
  describe("BitWriter", () => {
    describe("constructor", () => {
      it("creates bit writer with default capacity", () => {
        const writer = new BitWriter();

        assert(writer.buffer instanceof Uint8Array);
        assert.equal(writer.buffer.length, 1024);
        assert.equal(writer.position, 0);
        assert.equal(writer.bitPosition, 0);
      });

      it("creates bit writer with custom capacity", () => {
        const writer = new BitWriter(512);

        assert.equal(writer.buffer.length, 512);
      });
    });

    describe("writeBits", () => {
      it("writes single bits correctly", () => {
        const writer = new BitWriter();

        writer.writeBits(1, 1);
        writer.writeBits(0, 1);
        writer.writeBits(1, 1);
        writer.writeBits(1, 1);
        writer.writeBits(0, 1);
        writer.writeBits(0, 1);
        writer.writeBits(1, 1);
        writer.writeBits(0, 1);

        const result = writer.flush();
        assert.equal(result[0], 0b10110010); // 0xB2
      });

      it("writes multi-bit values correctly", () => {
        const writer = new BitWriter();

        writer.writeBits(0b1010, 4);
        writer.writeBits(0b1100, 4);

        const result = writer.flush();
        assert.equal(result[0], 0b10101100); // 0xAC
      });

      it("handles byte stuffing for 0xFF", () => {
        const writer = new BitWriter();

        writer.writeBits(0xff, 8);

        const result = writer.flush();
        assert.equal(result.length, 2);
        assert.equal(result[0], 0xff);
        assert.equal(result[1], 0x00); // Stuffed byte
      });

      it("validates input parameters", () => {
        const writer = new BitWriter();

        assert.throws(() => writer.writeBits(-1, 8), /Invalid value/);
        assert.throws(() => writer.writeBits(256, 8), /too large/);
        assert.throws(() => writer.writeBits(1, 0), /Invalid bit count/);
        assert.throws(() => writer.writeBits(1, 33), /Invalid bit count/);
      });

      it("expands buffer when needed", () => {
        const writer = new BitWriter(1); // Very small buffer

        // Write enough data to trigger expansion
        for (let i = 0; i < 10; i++) {
          writer.writeBits(0xff, 8);
        }

        const result = writer.flush();
        assert(result.length > 1);
        assert(writer.buffer.length > 1);
      });
    });

    describe("flush", () => {
      it("pads incomplete bytes with 1s", () => {
        const writer = new BitWriter();

        writer.writeBits(0b101, 3); // 3 bits, needs 5-bit padding

        const result = writer.flush();
        assert.equal(result[0], 0b10111111); // Padded with 1s
      });

      it("returns exact data for complete bytes", () => {
        const writer = new BitWriter();

        writer.writeBits(0xaa, 8);
        writer.writeBits(0x55, 8);

        const result = writer.flush();
        assert.equal(result.length, 2);
        assert.equal(result[0], 0xaa);
        assert.equal(result[1], 0x55);
      });
    });

    describe("getPosition", () => {
      it("tracks position correctly", () => {
        const writer = new BitWriter();

        let pos = writer.getPosition();
        assert.equal(pos.bytePosition, 0);
        assert.equal(pos.bitPosition, 0);
        assert.equal(pos.totalBits, 0);

        writer.writeBits(0b101, 3);

        pos = writer.getPosition();
        assert.equal(pos.bytePosition, 0);
        assert.equal(pos.bitPosition, 3);
        assert.equal(pos.totalBits, 3);

        writer.writeBits(0b11010, 5);

        pos = writer.getPosition();
        assert.equal(pos.bytePosition, 1);
        assert.equal(pos.bitPosition, 0);
        assert.equal(pos.totalBits, 8);
      });
    });

    describe("reset", () => {
      it("resets writer state", () => {
        const writer = new BitWriter();

        writer.writeBits(0xff, 8);
        writer.reset();

        const pos = writer.getPosition();
        assert.equal(pos.bytePosition, 0);
        assert.equal(pos.bitPosition, 0);
        assert.equal(pos.totalBits, 0);
      });
    });
  });

  describe("HuffmanEncoder", () => {
    describe("constructor", () => {
      it("creates encoder from table data", () => {
        const tableData = createStandardHuffmanTable("dc-luminance");
        const encoder = new HuffmanEncoder(tableData);

        assert(encoder instanceof HuffmanEncoder);
        assert(encoder.encodeTable instanceof Map);
        assert(encoder.encodeTable.size > 0);
      });

      it("builds correct encoding table", () => {
        const tableData = {
          codeLengths: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          symbols: [0, 1],
        };

        const encoder = new HuffmanEncoder(tableData);

        // With codeLengths [0, 2, 0, ...], we have:
        // - 0 symbols of length 1
        // - 2 symbols of length 2 (symbols 0 and 1)

        // Symbol 0 should have code 0, length 2
        const entry0 = encoder.encodeSymbol(0);
        assert.equal(entry0.code, 0);
        assert.equal(entry0.length, 2);

        // Symbol 1 should have code 1, length 2
        const entry1 = encoder.encodeSymbol(1);
        assert.equal(entry1.code, 1);
        assert.equal(entry1.length, 2);
      });
    });

    describe("encodeSymbol", () => {
      it("encodes symbols correctly", () => {
        const tableData = createStandardHuffmanTable("dc-luminance");
        const encoder = new HuffmanEncoder(tableData);

        // Symbol 0 should be encodable
        const entry = encoder.encodeSymbol(0);
        assert(typeof entry.code === "number");
        assert(typeof entry.length === "number");
        assert(entry.length > 0);
      });

      it("throws for unknown symbols", () => {
        const tableData = {
          codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          symbols: [0],
        };

        const encoder = new HuffmanEncoder(tableData);

        assert.throws(() => encoder.encodeSymbol(99), /Symbol 99 not found/);
      });
    });

    describe("hasSymbol", () => {
      it("checks symbol existence correctly", () => {
        const tableData = createStandardHuffmanTable("dc-luminance");
        const encoder = new HuffmanEncoder(tableData);

        assert.equal(encoder.hasSymbol(0), true);
        assert.equal(encoder.hasSymbol(999), false);
      });
    });

    describe("getStats", () => {
      it("returns correct statistics", () => {
        const tableData = createStandardHuffmanTable("dc-luminance");
        const encoder = new HuffmanEncoder(tableData);

        const stats = encoder.getStats();

        assert(typeof stats.symbolCount === "number");
        assert(typeof stats.maxCodeLength === "number");
        assert(typeof stats.minCodeLength === "number");
        assert(stats.symbolCount > 0);
        assert(stats.maxCodeLength >= stats.minCodeLength);
      });
    });
  });

  describe("encodeCoefficient", () => {
    it("encodes zero coefficient", () => {
      const result = encodeCoefficient(0);

      assert.equal(result.category, 0);
      assert.equal(result.bits, 0);
      assert.equal(result.bitCount, 0);
    });

    it("encodes positive coefficients", () => {
      const result = encodeCoefficient(5);

      assert.equal(result.category, 3); // 5 needs 3 bits
      assert.equal(result.bits, 5);
      assert.equal(result.bitCount, 3);
    });

    it("encodes negative coefficients", () => {
      const result = encodeCoefficient(-5);

      assert.equal(result.category, 3); // abs(5) needs 3 bits
      assert.equal(result.bits, 4); // One's complement: 5-1 = 4
      assert.equal(result.bitCount, 3);
    });

    it("handles edge cases", () => {
      // Test powers of 2
      let result = encodeCoefficient(1);
      assert.equal(result.category, 1);

      result = encodeCoefficient(2);
      assert.equal(result.category, 2);

      result = encodeCoefficient(4);
      assert.equal(result.category, 3);

      // Test negative powers of 2
      result = encodeCoefficient(-1);
      assert.equal(result.category, 1);
      assert.equal(result.bits, 0); // -1 -> 0 in one's complement

      result = encodeCoefficient(-2);
      assert.equal(result.category, 2);
      assert.equal(result.bits, 1); // -2 -> 1 in one's complement
    });

    it("validates input", () => {
      assert.throws(() => encodeCoefficient("not a number"), /must be a number/);
    });

    it("rejects coefficients that are too large", () => {
      const largeCoeff = 1 << 16; // Too large for 15-bit category
      assert.throws(() => encodeCoefficient(largeCoeff), /too large/);
    });
  });

  describe("encodeDCCoefficient", () => {
    it("encodes DC coefficient correctly", () => {
      const tableData = createStandardHuffmanTable("dc-luminance");
      const encoder = new HuffmanEncoder(tableData);
      const writer = new BitWriter();

      encodeDCCoefficient(encoder, writer, 5);

      const result = writer.flush();
      assert(result.length > 0);
    });

    it("encodes zero DC coefficient", () => {
      const tableData = createStandardHuffmanTable("dc-luminance");
      const encoder = new HuffmanEncoder(tableData);
      const writer = new BitWriter();

      encodeDCCoefficient(encoder, writer, 0);

      const result = writer.flush();
      assert(result.length > 0);
    });
  });

  describe("encodeACCoefficients", () => {
    it("encodes AC coefficients correctly", () => {
      const tableData = createStandardHuffmanTable("ac-luminance");
      const encoder = new HuffmanEncoder(tableData);
      const writer = new BitWriter();

      const acCoeffs = new Array(63).fill(0);
      acCoeffs[0] = 10; // First AC coefficient
      acCoeffs[5] = -5; // Another AC coefficient

      encodeACCoefficients(encoder, writer, acCoeffs);

      const result = writer.flush();
      assert(result.length > 0);
    });

    it("handles all-zero AC coefficients (EOB only)", () => {
      const tableData = createStandardHuffmanTable("ac-luminance");
      const encoder = new HuffmanEncoder(tableData);
      const writer = new BitWriter();

      const acCoeffs = new Array(63).fill(0);

      encodeACCoefficients(encoder, writer, acCoeffs);

      const result = writer.flush();
      assert(result.length > 0);
    });

    it("handles zero run lengths correctly", () => {
      const tableData = createStandardHuffmanTable("ac-luminance");
      const encoder = new HuffmanEncoder(tableData);
      const writer = new BitWriter();

      const acCoeffs = new Array(63).fill(0);
      // Create a pattern with zeros and non-zeros
      acCoeffs[0] = 5; // Non-zero
      acCoeffs[10] = 3; // Non-zero after 9 zeros
      acCoeffs[30] = -2; // Non-zero after 19 zeros

      encodeACCoefficients(encoder, writer, acCoeffs);

      const result = writer.flush();
      assert(result.length > 0);
    });

    it("validates input array", () => {
      const tableData = createStandardHuffmanTable("ac-luminance");
      const encoder = new HuffmanEncoder(tableData);
      const writer = new BitWriter();

      assert.throws(() => encodeACCoefficients(encoder, writer, []), /63 elements/);
      assert.throws(() => encodeACCoefficients(encoder, writer, new Array(62)), /63 elements/);
    });
  });

  describe("encodeBlock", () => {
    it("encodes complete block correctly", () => {
      const dcTableData = createStandardHuffmanTable("dc-luminance");
      const acTableData = createStandardHuffmanTable("ac-luminance");
      const dcEncoder = new HuffmanEncoder(dcTableData);
      const acEncoder = new HuffmanEncoder(acTableData);
      const writer = new BitWriter();

      const coefficients = new Array(64).fill(0);
      coefficients[0] = 100; // DC
      coefficients[1] = 50; // First AC
      coefficients[8] = -25; // Second AC

      const newDC = encodeBlock(dcEncoder, acEncoder, writer, coefficients, 0);

      assert.equal(newDC, 100);

      const result = writer.flush();
      assert(result.length > 0);
    });

    it("handles DC difference encoding", () => {
      const dcTableData = createStandardHuffmanTable("dc-luminance");
      const acTableData = createStandardHuffmanTable("ac-luminance");
      const dcEncoder = new HuffmanEncoder(dcTableData);
      const acEncoder = new HuffmanEncoder(acTableData);
      const writer = new BitWriter();

      const coefficients = new Array(64).fill(0);
      coefficients[0] = 150; // DC

      const newDC = encodeBlock(dcEncoder, acEncoder, writer, coefficients, 100);

      assert.equal(newDC, 150);
      // DC difference should be 150 - 100 = 50

      const result = writer.flush();
      assert(result.length > 0);
    });

    it("validates input coefficients", () => {
      const dcTableData = createStandardHuffmanTable("dc-luminance");
      const acTableData = createStandardHuffmanTable("ac-luminance");
      const dcEncoder = new HuffmanEncoder(dcTableData);
      const acEncoder = new HuffmanEncoder(acTableData);
      const writer = new BitWriter();

      assert.throws(() => encodeBlock(dcEncoder, acEncoder, writer, [], 0), /64 elements/);
      assert.throws(() => encodeBlock(dcEncoder, acEncoder, writer, new Array(63), 0), /64 elements/);
    });
  });

  describe("createStandardHuffmanEncoder", () => {
    it("creates DC luminance encoder", () => {
      const encoder = createStandardHuffmanEncoder("dc-luminance");

      assert(encoder instanceof HuffmanEncoder);
      assert(encoder.hasSymbol(0));
    });

    it("creates AC luminance encoder", () => {
      const encoder = createStandardHuffmanEncoder("ac-luminance");

      assert(encoder instanceof HuffmanEncoder);
      assert(encoder.hasSymbol(0x00)); // EOB symbol
    });

    it("creates DC chrominance encoder", () => {
      const encoder = createStandardHuffmanEncoder("dc-chrominance");

      assert(encoder instanceof HuffmanEncoder);
      assert(encoder.hasSymbol(0));
    });

    it("creates AC chrominance encoder", () => {
      const encoder = createStandardHuffmanEncoder("ac-chrominance");

      assert(encoder instanceof HuffmanEncoder);
      assert(encoder.hasSymbol(0x00)); // EOB symbol
    });
  });

  describe("validateEncodingParameters", () => {
    it("accepts valid parameters", () => {
      const tableData = createStandardHuffmanTable("dc-luminance");
      const encoder = new HuffmanEncoder(tableData);
      const writer = new BitWriter();

      assert.doesNotThrow(() => validateEncodingParameters(encoder, writer));
    });

    it("rejects invalid encoder", () => {
      const writer = new BitWriter();

      assert.throws(() => validateEncodingParameters(null, writer), /HuffmanEncoder instance/);
      assert.throws(() => validateEncodingParameters("not encoder", writer), /HuffmanEncoder instance/);
    });

    it("rejects invalid bit writer", () => {
      const tableData = createStandardHuffmanTable("dc-luminance");
      const encoder = new HuffmanEncoder(tableData);

      assert.throws(() => validateEncodingParameters(encoder, null), /BitWriter instance/);
      assert.throws(() => validateEncodingParameters(encoder, "not writer"), /BitWriter instance/);
    });
  });

  describe("estimateEncodedSize", () => {
    it("estimates size for simple blocks", () => {
      const dcTableData = createStandardHuffmanTable("dc-luminance");
      const acTableData = createStandardHuffmanTable("ac-luminance");
      const dcEncoder = new HuffmanEncoder(dcTableData);
      const acEncoder = new HuffmanEncoder(acTableData);

      const blocks = [createTestCoefficientBlock("dc-only"), createTestCoefficientBlock("simple")];

      const estimate = estimateEncodedSize(dcEncoder, acEncoder, blocks);

      assert(typeof estimate.estimatedBits === "number");
      assert(typeof estimate.estimatedBytes === "number");
      assert(estimate.estimatedBits > 0);
      assert(estimate.estimatedBytes > 0);
      assert(estimate.estimatedBytes >= Math.ceil(estimate.estimatedBits / 8));
    });

    it("validates input blocks", () => {
      const dcTableData = createStandardHuffmanTable("dc-luminance");
      const acTableData = createStandardHuffmanTable("ac-luminance");
      const dcEncoder = new HuffmanEncoder(dcTableData);
      const acEncoder = new HuffmanEncoder(acTableData);

      const invalidBlocks = [new Array(63)]; // Wrong size

      assert.throws(() => estimateEncodedSize(dcEncoder, acEncoder, invalidBlocks), /64 coefficients/);
    });
  });

  describe("createTestCoefficientBlock", () => {
    it("creates DC-only block", () => {
      const block = createTestCoefficientBlock("dc-only");

      assert.equal(block.length, 64);
      assert.equal(block[0], 128); // DC coefficient
      assert(block.slice(1).every((coeff) => coeff === 0)); // All AC coefficients are zero
    });

    it("creates simple block", () => {
      const block = createTestCoefficientBlock("simple");

      assert.equal(block.length, 64);
      assert.equal(block[0], 100); // DC
      assert.equal(block[1], 50); // First AC
      assert.equal(block[8], -25); // Second AC
    });

    it("creates complex block", () => {
      const block = createTestCoefficientBlock("complex");

      assert.equal(block.length, 64);
      assert.equal(block[0], 200); // DC
      assert(block.slice(1, 20).some((coeff) => coeff !== 0)); // Some AC coefficients are non-zero
    });

    it("creates zeros block", () => {
      const block = createTestCoefficientBlock("zeros");

      assert.equal(block.length, 64);
      assert.equal(block[0], 64); // DC only
      assert(block.slice(1).every((coeff) => coeff === 0)); // All AC coefficients are zero
    });

    it("rejects unknown patterns", () => {
      assert.throws(() => createTestCoefficientBlock("unknown"), /Unknown test pattern/);
    });
  });

  describe("analyzeEncodingEfficiency", () => {
    it("analyzes encoding efficiency correctly", () => {
      const tableData = createStandardHuffmanTable("dc-luminance");
      const encoder = new HuffmanEncoder(tableData);

      const symbols = [0, 1, 2, 0, 1, 0]; // Some repeated symbols

      const analysis = analyzeEncodingEfficiency(encoder, symbols);

      assert(typeof analysis.totalBits === "number");
      assert(typeof analysis.averageBitsPerSymbol === "number");
      assert(analysis.symbolFrequency instanceof Map);
      assert(typeof analysis.efficiency === "number");

      assert(analysis.totalBits > 0);
      assert(analysis.averageBitsPerSymbol > 0);
      assert(analysis.efficiency > 0 && analysis.efficiency <= 1);
      assert.equal(analysis.symbolFrequency.get(0), 3); // Symbol 0 appears 3 times
      assert.equal(analysis.symbolFrequency.get(1), 2); // Symbol 1 appears 2 times
    });

    it("handles empty symbol array", () => {
      const tableData = createStandardHuffmanTable("dc-luminance");
      const encoder = new HuffmanEncoder(tableData);

      const analysis = analyzeEncodingEfficiency(encoder, []);

      assert.equal(analysis.totalBits, 0);
      assert.equal(analysis.averageBitsPerSymbol, 0);
      assert.equal(analysis.symbolFrequency.size, 0);
    });
  });

  describe("Integration Tests", () => {
    it("encodes and measures realistic coefficient blocks", () => {
      const dcEncoder = createStandardHuffmanEncoder("dc-luminance");
      const acEncoder = createStandardHuffmanEncoder("ac-luminance");
      const writer = new BitWriter();

      const blocks = [
        createTestCoefficientBlock("dc-only"),
        createTestCoefficientBlock("simple"),
        createTestCoefficientBlock("complex"),
      ];

      let previousDC = 0;
      for (const block of blocks) {
        previousDC = encodeBlock(dcEncoder, acEncoder, writer, block, previousDC);
      }

      const result = writer.flush();
      assert(result.length > 0);

      // Verify the encoded data has reasonable size
      const estimate = estimateEncodedSize(dcEncoder, acEncoder, blocks);
      assert(result.length <= estimate.estimatedBytes + 10); // Allow some overhead
    });

    it("handles encoding with byte stuffing", () => {
      const writer = new BitWriter();

      // Write pattern that creates 0xFF bytes
      writer.writeBits(0xff, 8);
      writer.writeBits(0xff, 8);
      writer.writeBits(0xaa, 8);

      const result = writer.flush();

      // Should have byte stuffing: FF 00 FF 00 AA
      assert(result.length >= 5);
      assert.equal(result[0], 0xff);
      assert.equal(result[1], 0x00); // Stuffed
      assert.equal(result[2], 0xff);
      assert.equal(result[3], 0x00); // Stuffed
      assert.equal(result[4], 0xaa);
    });
  });

  describe("Performance", () => {
    it("encodes many blocks efficiently", () => {
      const dcEncoder = createStandardHuffmanEncoder("dc-luminance");
      const acEncoder = createStandardHuffmanEncoder("ac-luminance");

      const blocks = [];
      for (let i = 0; i < 100; i++) {
        blocks.push(createTestCoefficientBlock("simple"));
      }

      const startTime = Date.now();

      const writer = new BitWriter();
      let previousDC = 0;

      for (const block of blocks) {
        previousDC = encodeBlock(dcEncoder, acEncoder, writer, block, previousDC);
      }

      writer.flush();

      const endTime = Date.now();

      assert(endTime - startTime < 100, `Encoding took ${endTime - startTime}ms`);
    });

    it("handles large bit streams efficiently", () => {
      const writer = new BitWriter(64); // Small initial capacity

      const startTime = Date.now();

      // Write lots of data to trigger multiple buffer expansions
      for (let i = 0; i < 1000; i++) {
        writer.writeBits(i & 0xff, 8);
      }

      const result = writer.flush();

      const endTime = Date.now();

      assert(result.length > 1000);
      assert(endTime - startTime < 50, `Large stream encoding took ${endTime - startTime}ms`);
    });
  });
});
