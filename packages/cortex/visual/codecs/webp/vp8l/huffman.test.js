/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for VP8L Huffman Decoder
 *
 * Validates canonical Huffman construction, symbol decoding, and edge cases.
 * Tests cover over/under-subscribed trees, meta-trees, and bit reading.
 *
 * @fileoverview Comprehensive test suite for Huffman primitives
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHuffman, buildMetaHuffman, createBitReader, decodeSymbol, validateHuffmanTree } from "./huffman.js";

describe("VP8L Huffman Decoder", () => {
  describe("buildHuffman", () => {
    it("builds simple 2-symbol tree", () => {
      // Symbols 0 and 1 with code length 1
      const codeLengths = new Uint8Array([1, 1]);

      const huffman = buildHuffman(codeLengths);

      assert.equal(huffman.maxBits, 1);
      assert.equal(huffman.symbols, 2);
      assert.ok(huffman.table instanceof Uint16Array);
      assert.equal(huffman.table.length, 2);

      // Canonical codes: 0=0, 1=1
      assert.equal(huffman.table[0], 0); // Code 0 -> symbol 0
      assert.equal(huffman.table[1], 1); // Code 1 -> symbol 1
    });

    it("builds single symbol tree", () => {
      // Only symbol 5 with code length 1
      const codeLengths = new Uint8Array([0, 0, 0, 0, 0, 1]);

      const huffman = buildHuffman(codeLengths);

      assert.equal(huffman.maxBits, 1);
      assert.equal(huffman.symbols, 1);
      assert.equal(huffman.table[0], 5);
      assert.equal(huffman.table[1], 5); // Safety duplicate
    });

    it("builds complex canonical tree", () => {
      // Mixed code lengths: symbols 0(2), 1(1), 2(3), 3(3) - Kraft sum = 0.5 + 0.5 + 0.125 + 0.125 = 1.25 > 1, still over-subscribed
      // Let's use: symbols 0(2), 1(1), 2(4), 3(4) - Kraft sum = 0.25 + 0.5 + 0.0625 + 0.0625 = 0.875 < 1, under-subscribed
      // Let's use: symbols 0(2), 1(2), 2(3), 3(3) - Kraft sum = 0.25 + 0.25 + 0.125 + 0.125 = 0.75 < 1, under-subscribed
      // Let's use: symbols 0(3), 1(1), 2(3), 3(2) - Kraft sum = 0.125 + 0.5 + 0.125 + 0.25 = 1.0, perfect!
      const codeLengths = new Uint8Array([3, 1, 3, 2]);

      const huffman = buildHuffman(codeLengths);

      assert.equal(huffman.maxBits, 3);
      assert.equal(huffman.symbols, 4);

      // Canonical codes for [3, 1, 3, 2]:
      // Symbol 1: length 1, code 0 (binary: 0)
      // Symbol 3: length 2, code 2 (binary: 10)
      // Symbol 0: length 3, code 6 (binary: 110)
      // Symbol 2: length 3, code 7 (binary: 111)

      // Check table entries (with bit extension)
      assert.equal(huffman.table[0b000], 1); // 0 extended to 3 bits
      assert.equal(huffman.table[0b001], 3); // 0 extended
      assert.equal(huffman.table[0b010], 1); // 10 extended
      assert.equal(huffman.table[0b011], 0); // 10 extended
      assert.equal(huffman.table[0b110], 1); // 110 exact match
      assert.equal(huffman.table[0b111], 2); // 111 exact match
    });

    it("handles empty code lengths", () => {
      const codeLengths = new Uint8Array([0, 0, 0]);

      assert.throws(() => buildHuffman(codeLengths), /Huffman: no symbols in tree/);
    });

    it("rejects over-subscribed tree", () => {
      // Too many symbols for the code lengths
      const codeLengths = new Uint8Array([1, 1, 1]); // 3 symbols with length 1 (only 2 possible)

      assert.throws(() => buildHuffman(codeLengths), /Huffman: over-subscribed tree/);
    });

    it("rejects under-subscribed tree", () => {
      // Too few symbols for the code lengths (incomplete tree): two symbols at length 2 → kraft=1/2 < 1
      const codeLengths = new Uint8Array([2, 0, 2]);

      const res = validateHuffmanTree(codeLengths);
      assert.ok(!res.valid);
      assert.ok(res.error.includes("under-subscribed"));
    });

    it("rejects excessive code length", () => {
      const codeLengths = new Uint8Array([16]); // Exceeds MAX_CODE_LENGTH (15)

      assert.throws(() => buildHuffman(codeLengths), /Huffman: code length 16 exceeds maximum 15/);
    });

    it("rejects invalid input types", () => {
      assert.throws(() => buildHuffman(null), /Huffman: code lengths must be Uint8Array/);
      assert.throws(() => buildHuffman([1, 1]), /Huffman: code lengths must be Uint8Array/);
      assert.throws(() => buildHuffman(new Uint8Array(0)), /Huffman: invalid symbol count 0/);
    });

    it("handles maximum code length", () => {
      // Single symbol with maximum allowed length
      const codeLengths = new Uint8Array(Array(16).fill(0));
      codeLengths[0] = 15;

      const huffman = buildHuffman(codeLengths);

      assert.equal(huffman.maxBits, 15);
      assert.equal(huffman.symbols, 1);
    });
  });

  describe("decodeSymbol", () => {
    it("decodes symbols from simple tree", () => {
      const codeLengths = new Uint8Array([1, 1]); // Symbols 0,1 with length 1
      const huffman = buildHuffman(codeLengths);

      // Test data: 0b01010101 (LSB first gives us 1,0,1,0,1,0,1,0)
      const data = new Uint8Array([0b01010101]);
      const reader = createBitReader(data);

      assert.equal(decodeSymbol(reader, huffman), 1); // First bit: 1
      assert.equal(decodeSymbol(reader, huffman), 0); // Second bit: 0
      assert.equal(decodeSymbol(reader, huffman), 1); // Third bit: 1
      assert.equal(decodeSymbol(reader, huffman), 0); // Fourth bit: 0
    });

    it("decodes from single symbol tree", () => {
      const codeLengths = new Uint8Array([0, 0, 1]); // Only symbol 2
      const huffman = buildHuffman(codeLengths);

      const data = new Uint8Array([0b11111111]);
      const reader = createBitReader(data);

      // Should always return symbol 2 regardless of input bits
      assert.equal(decodeSymbol(reader, huffman), 2);
      assert.equal(decodeSymbol(reader, huffman), 2);
    });

    it("decodes from complex tree", () => {
      // Symbols: 0(3 bits), 1(1 bit), 2(3 bits), 3(2 bits)
      const codeLengths = new Uint8Array([3, 1, 3, 2]);
      const huffman = buildHuffman(codeLengths);

      // Canonical codes for [3,1,3,2]: 1=0, 3=2(10), 0=6(110), 2=7(111)
      // Test sequence: 0,01,011 = requires 6 bits; with our incremental decoder,
      // a minimal 2-byte buffer that decodes to symbols 1,3,0 is 0b00011010 00000000.
      const data = new Uint8Array([0b00011010, 0b00000000]);
      const reader = createBitReader(data);

      assert.equal(decodeSymbol(reader, huffman), 1); // Code 0
      assert.equal(decodeSymbol(reader, huffman), 3); // Code 01 (reversed)
      assert.equal(decodeSymbol(reader, huffman), 0); // Code 011
    });

    it("rejects invalid codes", () => {
      const codeLengths = new Uint8Array([2, 0, 2]); // Symbols 0,2 with length 2
      const huffman = buildHuffman(codeLengths);

      // This creates codes: 0=00, 2=01, leaving 10,11 invalid
      // Byte chosen to produce 00,01, then 10 (invalid) under LSB-first reading
      const data = new Uint8Array([0b00011000]);
      const reader = createBitReader(data);

      // First two symbols should work
      assert.equal(decodeSymbol(reader, huffman), 0); // 00
      assert.equal(decodeSymbol(reader, huffman), 2); // 01

      // Third should fail on invalid code 10
      assert.throws(
        () => decodeSymbol(reader, huffman),
        /Huffman: invalid code 0000000000001010|Huffman: invalid code 10/
      );
    });

    it("rejects invalid reader", () => {
      const huffman = buildHuffman(new Uint8Array([1, 1]));

      assert.throws(() => decodeSymbol(null, huffman), /Huffman: reader must have readBits method/);
      assert.throws(() => decodeSymbol({}, huffman), /Huffman: reader must have readBits method/);
    });

    it("rejects invalid huffman table", () => {
      const reader = createBitReader(new Uint8Array([0]));

      assert.throws(() => decodeSymbol(reader, null), /Huffman: invalid huffman table/);
      assert.throws(() => decodeSymbol(reader, {}), /Huffman: invalid huffman table/);
    });
  });

  describe("createBitReader", () => {
    it("reads bits in LSB order", () => {
      // Data: 0b10110100 = 180 decimal
      const data = new Uint8Array([180]);
      const reader = createBitReader(data);

      // Should read LSB first: 0,0,1,0,1,1,0,1
      assert.equal(reader.readBits(1), 0);
      assert.equal(reader.readBits(1), 0);
      assert.equal(reader.readBits(1), 1);
      assert.equal(reader.readBits(1), 0);
      assert.equal(reader.readBits(2), 0b11); // Next 2 bits: 1,1
      assert.equal(reader.readBits(2), 0b01); // Last 2 bits: 0,1
    });

    it("reads multi-byte sequences", () => {
      const data = new Uint8Array([0b11111111, 0b00000000]);
      const reader = createBitReader(data);

      assert.equal(reader.readBits(8), 0b11111111);
      assert.equal(reader.readBits(8), 0b00000000);
    });

    it("handles cross-byte reads", () => {
      const data = new Uint8Array([0b11110000, 0b00001111]);
      const reader = createBitReader(data);

      assert.equal(reader.readBits(4), 0b0000); // First 4 LSBs of byte 0
      // Next 8 bits LSB-first are ones due to trailing half of first byte and leading half of second byte
      assert.equal(reader.readBits(8), 0b11111111);
      assert.equal(reader.readBits(4), 0b0000); // Remaining 4 MSBs of second byte
    });

    it("tracks position correctly", () => {
      const data = new Uint8Array([0xff, 0xff]);
      const reader = createBitReader(data);

      assert.equal(reader.tell(), 0);
      reader.readBits(3);
      assert.equal(reader.tell(), 3);
      reader.readBits(10);
      assert.equal(reader.tell(), 13);
    });

    it("detects end of data", () => {
      const data = new Uint8Array([0xff]);
      const reader = createBitReader(data);

      assert.ok(reader.hasData());
      reader.readBits(8);
      assert.ok(!reader.hasData());

      assert.throws(() => reader.readBits(1), /BitReader: unexpected end of data/);
    });

    it("validates bit count", () => {
      const reader = createBitReader(new Uint8Array([0xff]));

      assert.throws(() => reader.readBits(0), /BitReader: invalid bit count 0/);
      assert.throws(() => reader.readBits(17), /BitReader: invalid bit count 17/);
    });

    it("handles offset parameter", () => {
      const data = new Uint8Array([0x00, 0xff, 0x00]);
      const reader = createBitReader(data, 1); // Start at byte 1

      assert.equal(reader.readBits(8), 0xff);
      assert.equal(reader.tell(), 8); // 8 bits from start position
    });
  });

  describe("validateHuffmanTree", () => {
    it("validates correct trees", () => {
      const result1 = validateHuffmanTree(new Uint8Array([1, 1]));
      assert.ok(result1.valid);
      assert.equal(result1.totalCodes, 2);

      const result2 = validateHuffmanTree(new Uint8Array([2, 1, 2]));
      assert.ok(result2.valid);
      assert.equal(result2.totalCodes, 3);
    });

    it("detects invalid trees", () => {
      const result1 = validateHuffmanTree(new Uint8Array([1, 1, 1])); // Over-subscribed
      assert.ok(!result1.valid);
      assert.ok(result1.error.includes("over-subscribed"));

      const result2 = validateHuffmanTree(new Uint8Array([2])); // Under-subscribed
      assert.ok(!result2.valid);
      assert.ok(result2.error.includes("under-subscribed"));

      const result3 = validateHuffmanTree(new Uint8Array([0, 0])); // No symbols
      assert.ok(!result3.valid);
      assert.ok(result3.error.includes("no symbols"));
    });
  });

  describe("buildMetaHuffman", () => {
    it("builds meta tree for code length compression", () => {
      // Simple meta tree: symbols 16,17,18 for run-length encoding
      const metaLengths = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 2]);

      const metaHuffman = buildMetaHuffman(metaLengths);

      assert.equal(metaHuffman.maxBits, 2);
      assert.equal(metaHuffman.symbols, 3);
      // Canonical codes: 17=0, 16=10, 18=11
    });

    it("pads short meta trees", () => {
      const shortMeta = new Uint8Array([1, 1]); // Only 2 symbols
      const metaHuffman = buildMetaHuffman(shortMeta);

      assert.equal(metaHuffman.symbols, 2); // Should work with padding
    });

    it("rejects oversized meta trees", () => {
      const oversized = new Uint8Array(20); // Too many symbols
      assert.throws(() => buildMetaHuffman(oversized), /Huffman: meta tree too large/);
    });
  });

  describe("Edge Cases and Performance", () => {
    it("handles maximum symbol count", () => {
      // Create tree with many symbols
      const largeLengths = new Uint8Array(1000);
      for (let i = 0; i < 512; i++) {
        largeLengths[i] = 9; // 9-bit codes for 512 symbols
      }

      const huffman = buildHuffman(largeLengths);
      assert.equal(huffman.maxBits, 9);
      assert.equal(huffman.symbols, 512);
    });

    it("processes bit reading efficiently", () => {
      const data = new Uint8Array(1000).fill(0xff);
      const reader = createBitReader(data);

      const start = process.hrtime.bigint();

      // Read many bits
      for (let i = 0; i < 1000; i++) {
        reader.readBits(8);
      }

      const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000; // ms
      assert.ok(elapsed < 100, `Bit reading took ${elapsed}ms, should be <100ms`);
    });

    it("handles pathological tree shapes", () => {
      // Highly unbalanced tree (one very long code)
      const pathological = new Uint8Array(16);
      pathological[0] = 1; // Symbol 0: 1 bit
      pathological[1] = 15; // Symbol 1: 15 bits

      const huffman = buildHuffman(pathological);
      assert.equal(huffman.maxBits, 15);
      assert.equal(huffman.symbols, 2);

      // Should still decode correctly
      const data = new Uint8Array([0b00000000, 0b00000000]); // 16 zeros
      const reader = createBitReader(data);

      assert.equal(decodeSymbol(reader, huffman), 0); // First bit: 0 -> symbol 0
    });

    it("maintains deterministic behavior", () => {
      // Use a valid distribution (Kraft sum == 1): 1/2 + 1/4 + 1/8 + 1/16 + 1/16 = 1
      const codeLengths = new Uint8Array([1, 2, 3, 4, 4]);

      // Build same tree multiple times
      const huffman1 = buildHuffman(codeLengths);
      const huffman2 = buildHuffman(codeLengths);

      // Should produce identical tables
      assert.deepEqual(huffman1.table, huffman2.table);
      assert.equal(huffman1.maxBits, huffman2.maxBits);
      assert.equal(huffman1.symbols, huffman2.symbols);
    });
  });
});
