/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JPEG Huffman coding.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { BitReader, HUFFMAN_TABLE_TYPES, HuffmanDecoder, HuffmanTable } from "./huffman.js";

/**
 * Helper to create bit reader from byte array
 */
function createBitReader(bytes) {
  const buffer = new Uint8Array(bytes);
  return new BitReader(buffer, 0, buffer.length);
}

describe("JPEG Huffman Coding", () => {
  describe("BitReader", () => {
    it("should read single bits correctly", () => {
      const reader = createBitReader([0xaa]); // 10101010

      assert.strictEqual(reader.readBit(), 1);
      assert.strictEqual(reader.readBit(), 0);
      assert.strictEqual(reader.readBit(), 1);
      assert.strictEqual(reader.readBit(), 0);
      assert.strictEqual(reader.readBit(), 1);
      assert.strictEqual(reader.readBit(), 0);
      assert.strictEqual(reader.readBit(), 1);
      assert.strictEqual(reader.readBit(), 0);
    });

    it("should read multi-bit values correctly", () => {
      const reader = createBitReader([0xab, 0xcd]); // 10101011 11001101

      assert.strictEqual(reader.receive(4), 0xa); // 1010
      assert.strictEqual(reader.receive(4), 0xb); // 1011
      assert.strictEqual(reader.receive(8), 0xcd); // 11001101
    });

    it("should handle signed values with JPEG sign extension", () => {
      const reader = createBitReader([0xff]); // Large negative value

      // 8-bit: 0xff -> -1 (two's complement)
      assert.strictEqual(reader.receiveSigned(8), -1);
    });

    it("should handle 0xFF00 stuffing correctly", () => {
      // 0xFF 0x00 (stuffed) followed by 0xAA
      const reader = createBitReader([0xff, 0x00, 0xaa]);

      // Should skip the stuffed 0xFF 0x00 and read 0xAA
      assert.strictEqual(reader.receive(8), 0xaa);
    });

    it("should detect markers in entropy stream", () => {
      // Data followed by marker (0xFF 0xDA)
      const reader = createBitReader([0x12, 0x34, 0xff, 0xda]);

      assert.strictEqual(reader.receive(8), 0x12);
      assert.strictEqual(reader.receive(8), 0x34);
      // Next read should detect marker and stop
      assert.throws(() => reader.receive(8), /Bit stream exhausted/);
    });
  });

  describe("HuffmanTable", () => {
    it("should build canonical codes correctly", () => {
      // Simple table: 1 code of length 1, 1 code of length 2
      const lengths = new Uint8Array([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const values = new Uint8Array([0, 1]);

      const table = new HuffmanTable(HUFFMAN_TABLE_TYPES.DC, 0, lengths, values);

      assert.strictEqual(table.codes[0], 0); // Symbol 0: code 0, length 1
      assert.strictEqual(table.codes[1], 2); // Symbol 1: code 2, length 2
      assert.strictEqual(table.codeLengths[0], 1);
      assert.strictEqual(table.codeLengths[1], 2);
    });

    it("should decode symbols correctly", () => {
      const lengths = new Uint8Array([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const values = new Uint8Array([0, 1]);
      const table = new HuffmanTable(HUFFMAN_TABLE_TYPES.DC, 0, lengths, values);

      const reader = createBitReader([0xaa]); // 10101010

      // First 2 bits: 10 -> symbol 1 (code 2 = 10 binary)
      assert.strictEqual(table.decodeSymbol(reader), 1);
      // Next 2 bits: 10 -> symbol 1 again
      assert.strictEqual(table.decodeSymbol(reader), 1);
      // Next 2 bits: 10 -> symbol 1 again
      assert.strictEqual(table.decodeSymbol(reader), 1);
      // Next 2 bits: 10 -> symbol 1 again
      assert.strictEqual(table.decodeSymbol(reader), 1);
    });

    it("should reject invalid table data", () => {
      const lengths = new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // 2 codes of length 1
      const values = new Uint8Array([0]); // But only 1 value

      assert.throws(() => new HuffmanTable(HUFFMAN_TABLE_TYPES.DC, 0, lengths, values), /Too few symbols/);
    });
  });

  describe("HuffmanDecoder", () => {
    it("should decode DC coefficients correctly", () => {
      // Simple DC table: 2 symbols (0, 1)
      const dcLengths = new Uint8Array([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const dcValues = new Uint8Array([0, 1]);
      const dcTable = new HuffmanTable(HUFFMAN_TABLE_TYPES.DC, 0, dcLengths, dcValues);

      const decoder = new HuffmanDecoder(dcTable, null);

      // Test DC coefficient with diff=0
      const reader1 = createBitReader([0x00]); // Symbol 0 (no additional bits)
      assert.strictEqual(decoder.decodeDC(reader1), 0);
      assert.strictEqual(decoder.dcPredictor, 0);

      // Test DC coefficient with symbol 1, diff=-1
      // Symbol 1 (code 2 = 10 binary, 2 bits) + diff bit (1) = 10100000 = 0xA0
      // Additional bit 1 for symbol 1 means diff = -1
      const reader3 = createBitReader([0xa0]);
      assert.strictEqual(decoder.decodeDC(reader3), -1);
      assert.strictEqual(decoder.dcPredictor, -1);
    });

    it("should decode AC coefficients correctly", () => {
      // Simple AC table with EOB and ZRL
      const acLengths = new Uint8Array([1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const acValues = new Uint8Array([0x00, 0xf0, 0x01]); // EOB, ZRL, (0,1)
      const acTable = new HuffmanTable(HUFFMAN_TABLE_TYPES.AC, 0, acLengths, acValues);

      const decoder = new HuffmanDecoder(null, acTable);
      const block = new Int16Array(64);

      // Test EOB (end of block)
      const reader1 = createBitReader([0x00]);
      decoder.decodeAC(reader1, block, 1);
      // All coefficients should be 0
      for (let i = 1; i < 64; i++) {
        assert.strictEqual(block[i], 0);
      }
    });

    it("should reset predictor correctly", () => {
      const dcLengths = new Uint8Array([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const dcValues = new Uint8Array([0, 1]);
      const dcTable = new HuffmanTable(HUFFMAN_TABLE_TYPES.DC, 0, dcLengths, dcValues);

      const decoder = new HuffmanDecoder(dcTable, null);

      // Set predictor to non-zero
      // Symbol 1 (code 2 = 10 binary) + diff bit (1) = 10100000 = 0xA0
      // This gives diff = -1, so predictor becomes -1
      const reader = createBitReader([0xa0]);
      decoder.decodeDC(reader);
      assert.strictEqual(decoder.dcPredictor, -1);

      // Reset predictor
      decoder.resetPredictor();
      assert.strictEqual(decoder.dcPredictor, 0);
    });
  });
});
