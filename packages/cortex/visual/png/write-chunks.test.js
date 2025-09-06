/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for PNG chunk writing and CRC32 calculation.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
  calculateCRC32,
  createIENDChunk,
  getChunkInfo,
  validateChunkType,
  writeChunk,
  writeChunks,
  writePNGFile,
} from "./write-chunks.js";

describe("PNG Chunk Writing", () => {
  describe("calculateCRC32", () => {
    it("calculates correct CRC32 for empty data", () => {
      const crc = calculateCRC32(new Uint8Array(0));
      assert.equal(crc, 0, "CRC32 of empty data should be 0");
    });

    it("calculates correct CRC32 for known test vectors", () => {
      // Test vector: "123456789" should have CRC32 0xCBF43926
      const testData = new Uint8Array([49, 50, 51, 52, 53, 54, 55, 56, 57]);
      const crc = calculateCRC32(testData);
      assert.equal(crc, 0xcbf43926, "CRC32 should match known test vector");
    });

    it("calculates correct CRC32 for IHDR type field", () => {
      // "IHDR" should have CRC32 0xA8A1AE0A
      const ihdrType = new Uint8Array([73, 72, 68, 82]); // "IHDR"
      const crc = calculateCRC32(ihdrType);
      assert.equal(crc, 0xa8a1ae0a, "CRC32 of 'IHDR' should match expected value");
    });

    it("calculates different CRC32 for different data", () => {
      const data1 = new Uint8Array([1, 2, 3]);
      const data2 = new Uint8Array([1, 2, 4]);

      const crc1 = calculateCRC32(data1);
      const crc2 = calculateCRC32(data2);

      assert.notEqual(crc1, crc2, "Different data should have different CRC32");
    });

    it("validates input parameter", () => {
      assert.throws(() => calculateCRC32("not a uint8array"), TypeError);
      assert.throws(() => calculateCRC32(null), TypeError);
      assert.throws(() => calculateCRC32([1, 2, 3]), TypeError);
    });
  });

  describe("writeChunk", () => {
    it("writes valid chunk with correct format", () => {
      const data = new Uint8Array([1, 2, 3, 4]);
      const chunk = writeChunk("TEST", data);

      // Check total length: 4 (length) + 4 (type) + 4 (data) + 4 (CRC) = 16
      assert.equal(chunk.length, 16, "Chunk should be 16 bytes total");

      // Check length field (big-endian 4)
      assert.equal(chunk[0], 0, "Length byte 0");
      assert.equal(chunk[1], 0, "Length byte 1");
      assert.equal(chunk[2], 0, "Length byte 2");
      assert.equal(chunk[3], 4, "Length byte 3");

      // Check type field
      assert.equal(chunk[4], 84, "Type 'T'");
      assert.equal(chunk[5], 69, "Type 'E'");
      assert.equal(chunk[6], 83, "Type 'S'");
      assert.equal(chunk[7], 84, "Type 'T'");

      // Check data field
      assert.equal(chunk[8], 1, "Data byte 0");
      assert.equal(chunk[9], 2, "Data byte 1");
      assert.equal(chunk[10], 3, "Data byte 2");
      assert.equal(chunk[11], 4, "Data byte 3");

      // CRC should be calculated over type + data
      const crcData = chunk.slice(4, 12); // type + data
      const expectedCRC = calculateCRC32(crcData);
      const actualCRC = (chunk[12] << 24) | (chunk[13] << 16) | (chunk[14] << 8) | chunk[15];
      assert.equal(actualCRC >>> 0, expectedCRC, "CRC should match calculated value");
    });

    it("writes empty chunk correctly", () => {
      const chunk = writeChunk("IEND", new Uint8Array(0));

      assert.equal(chunk.length, 12, "Empty chunk should be 12 bytes");

      // Check length field (0)
      assert.equal(chunk[0], 0, "Length should be 0");
      assert.equal(chunk[1], 0, "Length should be 0");
      assert.equal(chunk[2], 0, "Length should be 0");
      assert.equal(chunk[3], 0, "Length should be 0");

      // Check type
      assert.equal(chunk[4], 73, "Type 'I'");
      assert.equal(chunk[5], 69, "Type 'E'");
      assert.equal(chunk[6], 78, "Type 'N'");
      assert.equal(chunk[7], 68, "Type 'D'");

      // CRC should be calculated over type only
      const expectedCRC = calculateCRC32(chunk.slice(4, 8));
      const actualCRC = (chunk[8] << 24) | (chunk[9] << 16) | (chunk[10] << 8) | chunk[11];
      assert.equal(actualCRC >>> 0, expectedCRC, "CRC should match for type-only");
    });

    it("handles large chunks", () => {
      const largeData = new Uint8Array(65536); // 64KB
      largeData.fill(42);

      const chunk = writeChunk("IDAT", largeData);

      assert.equal(chunk.length, 4 + 4 + 65536 + 4, "Large chunk should have correct size");

      // Check length field (65536 = 0x00010000)
      assert.equal(chunk[0], 0x00, "Length byte 0");
      assert.equal(chunk[1], 0x01, "Length byte 1");
      assert.equal(chunk[2], 0x00, "Length byte 2");
      assert.equal(chunk[3], 0x00, "Length byte 3");
    });

    it("validates chunk type parameter", () => {
      const data = new Uint8Array([1, 2, 3]);

      assert.throws(() => writeChunk("", data), /Invalid chunk type/);
      assert.throws(() => writeChunk("ABC", data), /Invalid chunk type/);
      assert.throws(() => writeChunk("ABCDE", data), /Invalid chunk type/);
      assert.throws(() => writeChunk("AB12", data), /Invalid chunk type character/);
      assert.throws(() => writeChunk("AB@D", data), /Invalid chunk type character/);
      assert.throws(() => writeChunk(123, data), /Invalid chunk type/);
      assert.throws(() => writeChunk(null, data), /Invalid chunk type/);
    });

    it("validates data parameter", () => {
      assert.throws(() => writeChunk("TEST", "not uint8array"), TypeError);
      assert.throws(() => writeChunk("TEST", null), TypeError);
      assert.throws(() => writeChunk("TEST", [1, 2, 3]), TypeError);
    });

    it("handles maximum chunk size", () => {
      // Test with a reasonably large chunk (not 2GB for performance)
      const data = new Uint8Array(1000000); // 1MB
      assert.doesNotThrow(() => writeChunk("IDAT", data), "Should handle large chunks");
    });
  });

  describe("writeChunks", () => {
    it("combines multiple chunks correctly", () => {
      const chunks = [
        { type: "IHDR", data: new Uint8Array([1, 2, 3]) },
        { type: "IDAT", data: new Uint8Array([4, 5]) },
        { type: "IEND", data: new Uint8Array(0) },
      ];

      const combined = writeChunks(chunks);

      // Calculate expected length
      const expectedLength =
        4 +
        4 +
        3 +
        4 + // IHDR: 15 bytes
        (4 + 4 + 2 + 4) + // IDAT: 14 bytes
        (4 + 4 + 0 + 4); // IEND: 12 bytes

      assert.equal(combined.length, expectedLength, "Combined chunks should have correct total length");

      // Check that first chunk starts correctly
      assert.equal(combined[0], 0, "First chunk length byte 0");
      assert.equal(combined[1], 0, "First chunk length byte 1");
      assert.equal(combined[2], 0, "First chunk length byte 2");
      assert.equal(combined[3], 3, "First chunk length byte 3");
      assert.equal(combined[4], 73, "First chunk type 'I'");
      assert.equal(combined[5], 72, "First chunk type 'H'");
    });

    it("handles empty chunks array", () => {
      const combined = writeChunks([]);
      assert.equal(combined.length, 0, "Empty chunks array should produce empty result");
    });

    it("validates chunks parameter", () => {
      assert.throws(() => writeChunks("not array"), TypeError);
      assert.throws(() => writeChunks(null), TypeError);

      assert.throws(() => writeChunks([null]), /Each chunk must be an object/);
      assert.throws(() => writeChunks([{}]), /Each chunk must have type and data properties/);
      assert.throws(() => writeChunks([{ type: "TEST" }]), /Each chunk must have type and data properties/);
      assert.throws(() => writeChunks([{ data: new Uint8Array() }]), /Each chunk must have type and data properties/);
    });
  });

  describe("writePNGFile", () => {
    it("creates complete PNG file with signature", () => {
      const chunks = [
        { type: "IHDR", data: new Uint8Array([1, 2, 3]) },
        { type: "IEND", data: new Uint8Array(0) },
      ];

      const pngFile = writePNGFile(chunks);

      // Check PNG signature (first 8 bytes)
      const expectedSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      for (let i = 0; i < 8; i++) {
        assert.equal(pngFile[i], expectedSignature[i], `PNG signature byte ${i}`);
      }

      // Check that chunks follow signature
      assert.equal(pngFile[8], 0, "First chunk length byte 0");
      assert.equal(pngFile[9], 0, "First chunk length byte 1");
      assert.equal(pngFile[10], 0, "First chunk length byte 2");
      assert.equal(pngFile[11], 3, "First chunk length byte 3");
    });

    it("validates chunks parameter", () => {
      assert.throws(() => writePNGFile([]), /chunks must be a non-empty array/);
      assert.throws(() => writePNGFile(null), /chunks must be a non-empty array/);
      assert.throws(() => writePNGFile("not array"), /chunks must be a non-empty array/);
    });
  });

  describe("createIENDChunk", () => {
    it("creates valid IEND chunk", () => {
      const iendChunk = createIENDChunk();

      assert.equal(iendChunk.length, 12, "IEND chunk should be 12 bytes");

      // Check length (0)
      assert.equal(iendChunk[0], 0, "Length should be 0");
      assert.equal(iendChunk[1], 0, "Length should be 0");
      assert.equal(iendChunk[2], 0, "Length should be 0");
      assert.equal(iendChunk[3], 0, "Length should be 0");

      // Check type
      assert.equal(iendChunk[4], 73, "Type 'I'");
      assert.equal(iendChunk[5], 69, "Type 'E'");
      assert.equal(iendChunk[6], 78, "Type 'N'");
      assert.equal(iendChunk[7], 68, "Type 'D'");

      // IEND should have CRC 0xAE426082
      const expectedCRC = 0xae426082;
      const actualCRC = (iendChunk[8] << 24) | (iendChunk[9] << 16) | (iendChunk[10] << 8) | iendChunk[11];
      assert.equal(actualCRC >>> 0, expectedCRC, "IEND should have correct CRC");
    });
  });

  describe("validateChunkType", () => {
    it("validates critical chunks correctly", () => {
      const ihdr = validateChunkType("IHDR");
      assert.equal(ihdr.valid, true, "IHDR should be valid");
      assert.equal(ihdr.critical, true, "IHDR should be critical");
      assert.equal(ihdr.public, true, "IHDR should be public");
      assert.equal(ihdr.reserved, false, "IHDR should not be reserved");
      assert.equal(ihdr.safeToCopy, false, "IHDR should not be safe to copy");
    });

    it("validates ancillary chunks correctly", () => {
      const text = validateChunkType("tEXt");
      assert.equal(text.valid, true, "tEXt should be valid");
      assert.equal(text.critical, false, "tEXt should be ancillary");
      assert.equal(text.public, true, "tEXt should be public (E is uppercase)");
      assert.equal(text.reserved, false, "tEXt should not be reserved");
      assert.equal(text.safeToCopy, true, "tEXt should be safe to copy");
    });

    it("rejects invalid chunk types", () => {
      assert.throws(() => validateChunkType(""), /Invalid chunk type/);
      assert.throws(() => validateChunkType("ABC"), /Invalid chunk type/);
      assert.throws(() => validateChunkType("ABCDE"), /Invalid chunk type/);

      const invalid1 = validateChunkType("AB1D");
      assert.equal(invalid1.valid, false, "Chunk with numbers should be invalid");

      const invalid2 = validateChunkType("ABcD");
      assert.equal(invalid2.valid, false, "Chunk with reserved bit set should be invalid");
    });

    it("handles edge cases", () => {
      const allUpper = validateChunkType("ABCD");
      assert.equal(allUpper.valid, true, "All uppercase should be valid");
      assert.equal(allUpper.critical, true, "All uppercase should be critical");

      const allLower = validateChunkType("abcd");
      assert.equal(allLower.valid, false, "All lowercase should be invalid (reserved bit set)");
      assert.equal(allLower.critical, false, "All lowercase should be ancillary");
    });
  });

  describe("getChunkInfo", () => {
    it("returns info for standard critical chunks", () => {
      const ihdr = getChunkInfo("IHDR");
      assert.equal(ihdr.name, "Image Header", "Should have correct name");
      assert.equal(ihdr.critical, true, "Should be marked as critical");
      assert.equal(typeof ihdr.description, "string", "Should have description");

      const idat = getChunkInfo("IDAT");
      assert.equal(idat.name, "Image Data", "Should have correct name");
      assert.equal(idat.critical, true, "Should be marked as critical");
    });

    it("returns info for standard ancillary chunks", () => {
      const text = getChunkInfo("tEXt");
      assert.equal(text.name, "Text", "Should have correct name");
      assert.equal(text.critical, false, "Should be marked as ancillary");

      const gamma = getChunkInfo("gAMA");
      assert.equal(gamma.name, "Gamma", "Should have correct name");
      assert.equal(gamma.critical, false, "Should be marked as ancillary");
    });

    it("returns null for unknown chunks", () => {
      const unknown = getChunkInfo("UNKN");
      assert.equal(unknown, null, "Should return null for unknown chunks");

      const custom = getChunkInfo("myPv");
      assert.equal(custom, null, "Should return null for custom chunks");
    });
  });

  describe("Integration Tests", () => {
    it("creates minimal valid PNG file", () => {
      // Create minimal IHDR data (13 bytes)
      const ihdrData = new Uint8Array([
        0,
        0,
        0,
        1, // width: 1
        0,
        0,
        0,
        1, // height: 1
        8, // bit depth: 8
        0, // color type: grayscale
        0, // compression: 0
        0, // filter: 0
        0, // interlace: 0
      ]);

      const chunks = [
        { type: "IHDR", data: ihdrData },
        { type: "IDAT", data: new Uint8Array([1, 2, 3]) }, // Dummy IDAT
        { type: "IEND", data: new Uint8Array(0) },
      ];

      const pngFile = writePNGFile(chunks);

      // Should start with PNG signature
      assert.equal(pngFile[0], 0x89, "Should start with PNG signature");
      assert.equal(pngFile[1], 0x50, "Should have PNG signature");

      // Should be reasonable size
      assert(pngFile.length > 50, "PNG file should be reasonable size");
      assert(pngFile.length < 1000, "PNG file should not be too large for minimal file");
    });

    it("handles chunk order correctly", () => {
      const chunks = [
        { type: "IHDR", data: new Uint8Array([1, 2, 3]) },
        { type: "tEXt", data: new Uint8Array([4, 5]) },
        { type: "IDAT", data: new Uint8Array([6, 7, 8]) },
        { type: "IEND", data: new Uint8Array(0) },
      ];

      const combined = writeChunks(chunks);

      // Verify chunks appear in correct order by checking type fields
      let offset = 0;

      // First chunk: IHDR
      offset += 4; // Skip length
      assert.equal(combined[offset], 73, "First chunk should be IHDR");
      assert.equal(combined[offset + 1], 72, "First chunk should be IHDR");
      offset += 4 + 3 + 4; // Skip type, data, CRC

      // Second chunk: tEXt
      offset += 4; // Skip length
      assert.equal(combined[offset], 116, "Second chunk should be tEXt");
      assert.equal(combined[offset + 1], 69, "Second chunk should be tEXt");
    });
  });
});
