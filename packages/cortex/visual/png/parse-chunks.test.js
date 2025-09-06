/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { findChunksByType, parseChunks, validateChunkStructure } from "./parse-chunks.js";
import { validatePNGSignature } from "./validate-signature.js";

describe("PNG Chunk Parser", () => {
  describe("parseChunks", () => {
    it("throws TypeError for invalid buffer types", () => {
      assert.throws(() => parseChunks(null), TypeError);
      assert.throws(() => parseChunks(undefined), TypeError);
      assert.throws(() => parseChunks("invalid"), TypeError);
      assert.throws(() => parseChunks(123), TypeError);
    });

    it("handles empty buffer", () => {
      const chunks = parseChunks(new Uint8Array(0));
      assert.equal(chunks.length, 0);
    });

    it("handles ArrayBuffer input", () => {
      const buffer = new ArrayBuffer(0);
      const chunks = parseChunks(buffer);
      assert.equal(chunks.length, 0);
    });

    it("throws on incomplete chunk in strict mode", () => {
      // Create buffer with incomplete chunk (only 8 bytes instead of minimum 12)
      const incompleteChunk = new Uint8Array([
        0,
        0,
        0,
        5, // length = 5
        73,
        72,
        68,
        82, // "IHDR" type (incomplete)
      ]);

      assert.throws(() => parseChunks(incompleteChunk), /Incomplete chunk/);
    });

    it("handles incomplete chunk in non-strict mode", () => {
      const incompleteChunk = new Uint8Array([
        0,
        0,
        0,
        5, // length = 5
        73,
        72,
        68,
        82, // "IHDR" type (incomplete)
      ]);

      const chunks = parseChunks(incompleteChunk, { strictMode: false });
      assert.equal(chunks.length, 0);
    });

    it("throws on chunk length exceeding buffer in strict mode", () => {
      const oversizedChunk = new Uint8Array([
        0,
        0,
        1,
        0, // length = 256 (too large for remaining buffer)
        73,
        72,
        68,
        82, // "IHDR"
        0,
        0,
        0,
        0, // partial data
      ]);

      assert.throws(() => parseChunks(oversizedChunk), /exceeds remaining buffer/);
    });

    it("handles chunk length exceeding buffer in non-strict mode", () => {
      const oversizedChunk = new Uint8Array([
        0,
        0,
        1,
        0, // length = 256
        73,
        72,
        68,
        82, // "IHDR"
        0,
        0,
        0,
        0, // partial data
      ]);

      const chunks = parseChunks(oversizedChunk, { strictMode: false });
      assert.equal(chunks.length, 0);
    });

    it("parses valid minimal chunk", () => {
      // Create minimal valid chunk: IEND (length=0)
      const iendChunk = new Uint8Array([
        0,
        0,
        0,
        0, // length = 0
        73,
        69,
        78,
        68, // "IEND"
        174,
        66,
        96,
        130, // CRC32 for "IEND" with no data
      ]);

      const chunks = parseChunks(iendChunk);
      assert.equal(chunks.length, 1);
      assert.equal(chunks[0].type, "IEND");
      assert.equal(chunks[0].length, 0);
      assert.equal(chunks[0].data.length, 0);
      assert.equal(chunks[0].valid, true);
    });

    it("detects CRC32 mismatch in strict mode", () => {
      const badCrcChunk = new Uint8Array([
        0,
        0,
        0,
        0, // length = 0
        73,
        69,
        78,
        68, // "IEND"
        0,
        0,
        0,
        0, // Wrong CRC32
      ]);

      assert.throws(() => parseChunks(badCrcChunk), /CRC32 mismatch/);
    });

    it("handles CRC32 mismatch in non-strict mode", () => {
      const badCrcChunk = new Uint8Array([
        0,
        0,
        0,
        0, // length = 0
        73,
        69,
        78,
        68, // "IEND"
        0,
        0,
        0,
        0, // Wrong CRC32
      ]);

      const chunks = parseChunks(badCrcChunk, { strictMode: false });
      assert.equal(chunks.length, 1);
      assert.equal(chunks[0].valid, false);
      assert(chunks[0].error.includes("CRC32 mismatch"));
    });

    it("skips CRC validation when disabled", () => {
      const badCrcChunk = new Uint8Array([
        0,
        0,
        0,
        0, // length = 0
        73,
        69,
        78,
        68, // "IEND"
        0,
        0,
        0,
        0, // Wrong CRC32
      ]);

      const chunks = parseChunks(badCrcChunk, { validateCRC: false });
      assert.equal(chunks.length, 1);
      assert.equal(chunks[0].valid, true);
    });

    it("parses multiple chunks", () => {
      // Create two IEND chunks
      const twoChunks = new Uint8Array([
        // First IEND chunk
        0,
        0,
        0,
        0, // length = 0
        73,
        69,
        78,
        68, // "IEND"
        174,
        66,
        96,
        130, // CRC32
        // Second IEND chunk
        0,
        0,
        0,
        0, // length = 0
        73,
        69,
        78,
        68, // "IEND"
        174,
        66,
        96,
        130, // CRC32
      ]);

      const chunks = parseChunks(twoChunks);
      assert.equal(chunks.length, 2);
      assert.equal(chunks[0].type, "IEND");
      assert.equal(chunks[1].type, "IEND");
    });

    it("includes chunk metadata", () => {
      const iendChunk = new Uint8Array([
        0,
        0,
        0,
        0, // length = 0
        73,
        69,
        78,
        68, // "IEND"
        174,
        66,
        96,
        130, // CRC32
      ]);

      const chunks = parseChunks(iendChunk);
      const chunk = chunks[0];

      assert.equal(chunk.type, "IEND");
      assert.equal(chunk.length, 0);
      assert.equal(chunk.crc, 0xae426082);
      assert.equal(chunk.offset, 0);
      assert.equal(chunk.valid, true);
      assert(chunk.data instanceof Uint8Array);
    });
  });

  describe("findChunksByType", () => {
    const sampleChunks = [
      { type: "IHDR", valid: true },
      { type: "IDAT", valid: true },
      { type: "IDAT", valid: true },
      { type: "tEXt", valid: true },
      { type: "IEND", valid: true },
      { type: "FAKE", valid: false }, // Invalid chunk
    ];

    it("finds chunks by type", () => {
      const idatChunks = findChunksByType(sampleChunks, "IDAT");
      assert.equal(idatChunks.length, 2);
      assert(idatChunks.every((chunk) => chunk.type === "IDAT"));
    });

    it("returns empty array for non-existent type", () => {
      const missing = findChunksByType(sampleChunks, "MISSING");
      assert.equal(missing.length, 0);
    });

    it("excludes invalid chunks", () => {
      const fakeChunks = findChunksByType(sampleChunks, "FAKE");
      assert.equal(fakeChunks.length, 0);
    });

    it("finds single chunk", () => {
      const ihdrChunks = findChunksByType(sampleChunks, "IHDR");
      assert.equal(ihdrChunks.length, 1);
      assert.equal(ihdrChunks[0].type, "IHDR");
    });

    it("throws TypeError for invalid input", () => {
      assert.throws(() => findChunksByType(null, "IHDR"), TypeError);
      assert.throws(() => findChunksByType(sampleChunks, null), TypeError);
      assert.throws(() => findChunksByType("invalid", "IHDR"), TypeError);
      assert.throws(() => findChunksByType(sampleChunks, 123), TypeError);
    });
  });

  describe("validateChunkStructure", () => {
    it("throws on empty chunk array", () => {
      assert.throws(() => validateChunkStructure([]), /at least one chunk/);
    });

    it("throws on non-array input", () => {
      assert.throws(() => validateChunkStructure(null), /at least one chunk/);
    });

    it("throws when first chunk is not IHDR", () => {
      const badOrder = [{ type: "IDAT", valid: true }];
      assert.throws(() => validateChunkStructure(badOrder), /First chunk must be IHDR/);
    });

    it("throws when last chunk is not IEND", () => {
      const badOrder = [
        { type: "IHDR", valid: true },
        { type: "IDAT", valid: true },
      ];
      assert.throws(() => validateChunkStructure(badOrder), /Last chunk must be IEND/);
    });

    it("throws on missing IHDR", () => {
      const noIhdr = [
        { type: "IDAT", valid: true },
        { type: "IEND", valid: true },
      ];
      assert.throws(() => validateChunkStructure(noIhdr), /First chunk must be IHDR/);
    });

    it("throws on multiple IHDR chunks", () => {
      const multiIhdr = [
        { type: "IHDR", valid: true },
        { type: "IHDR", valid: true },
        { type: "IDAT", valid: true },
        { type: "IEND", valid: true },
      ];
      assert.throws(() => validateChunkStructure(multiIhdr), /exactly one IHDR chunk/);
    });

    it("throws on missing IDAT chunks", () => {
      const noIdat = [
        { type: "IHDR", valid: true },
        { type: "IEND", valid: true },
      ];
      assert.throws(() => validateChunkStructure(noIdat), /at least one IDAT chunk/);
    });

    it("throws on non-consecutive IDAT chunks", () => {
      const nonConsecutive = [
        { type: "IHDR", valid: true },
        { type: "IDAT", valid: true },
        { type: "tEXt", valid: true },
        { type: "IDAT", valid: true },
        { type: "IEND", valid: true },
      ];
      assert.throws(() => validateChunkStructure(nonConsecutive), /IDAT chunks must be consecutive/);
    });

    it("accepts valid chunk structure", () => {
      const validStructure = [
        { type: "IHDR", valid: true },
        { type: "IDAT", valid: true },
        { type: "IDAT", valid: true },
        { type: "IEND", valid: true },
      ];

      // Should not throw
      validateChunkStructure(validStructure);
    });

    it("accepts valid structure with ancillary chunks", () => {
      const validWithAncillary = [
        { type: "IHDR", valid: true },
        { type: "gAMA", valid: true },
        { type: "IDAT", valid: true },
        { type: "IDAT", valid: true },
        { type: "tEXt", valid: true },
        { type: "IEND", valid: true },
      ];

      // Should not throw
      validateChunkStructure(validWithAncillary);
    });
  });

  describe("Real PNG Integration", () => {
    it("parses real PNG file", () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");

        // Verify it's a PNG file
        assert(validatePNGSignature(pngBuffer), "Should be valid PNG");

        // Skip PNG signature (first 8 bytes) for chunk parsing
        const chunkData = pngBuffer.slice(8);
        const chunks = parseChunks(chunkData);

        // Basic structure validation
        assert(chunks.length > 0, "Should have chunks");
        validateChunkStructure(chunks);

        // Check for required chunks
        const ihdrChunks = findChunksByType(chunks, "IHDR");
        const idatChunks = findChunksByType(chunks, "IDAT");
        const iendChunks = findChunksByType(chunks, "IEND");

        assert.equal(ihdrChunks.length, 1, "Should have exactly one IHDR");
        assert(idatChunks.length > 0, "Should have IDAT chunks");
        assert.equal(iendChunks.length, 1, "Should have exactly one IEND");

        // Verify all chunks are valid (CRC32 passed)
        const invalidChunks = chunks.filter((chunk) => chunk.valid === false);
        assert.equal(invalidChunks.length, 0, "All chunks should be valid");

        console.log(`✓ Parsed ${chunks.length} chunks from apple-touch-icon.png`);
        console.log(`  - IHDR: ${ihdrChunks.length}`);
        console.log(`  - IDAT: ${idatChunks.length}`);
        console.log(`  - Other: ${chunks.length - ihdrChunks.length - idatChunks.length - iendChunks.length}`);
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping real PNG test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });

    it("validates CRC32 on real PNG chunks", () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");
        const chunkData = pngBuffer.slice(8);

        // Parse with CRC validation enabled (default)
        const chunks = parseChunks(chunkData, { validateCRC: true });

        // All chunks should pass CRC validation
        chunks.forEach((chunk, index) => {
          assert.equal(chunk.valid, true, `Chunk ${index} (${chunk.type}) should have valid CRC32`);
        });
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping CRC validation test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });
  });

  describe("CRC32 Calculation", () => {
    it("calculates correct CRC32 for IEND chunk", () => {
      // IEND chunk with no data should have CRC32 = 0xAE426082
      const iendChunk = new Uint8Array([
        0,
        0,
        0,
        0, // length = 0
        73,
        69,
        78,
        68, // "IEND"
        174,
        66,
        96,
        130, // Expected CRC32
      ]);

      const chunks = parseChunks(iendChunk);
      assert.equal(chunks.length, 1);
      assert.equal(chunks[0].valid, true);
      assert.equal(chunks[0].crc, 0xae426082);
    });

    it("handles chunks with data", () => {
      // Create chunk with some data
      const testData = new Uint8Array([1, 2, 3, 4]);
      const testChunk = new Uint8Array([
        0,
        0,
        0,
        4, // length = 4
        116,
        69,
        88,
        116, // "tEXt"
        ...testData, // data
        0,
        0,
        0,
        0, // Placeholder CRC (will be wrong)
      ]);

      // This should fail CRC validation
      assert.throws(() => parseChunks(testChunk), /CRC32 mismatch/);
    });
  });

  describe("Edge Cases", () => {
    it("handles maximum chunk length", () => {
      // PNG spec allows chunks up to 2^31-1 bytes, but we'll test a reasonable size
      const largeLength = 1024;
      const largeData = new Uint8Array(largeLength).fill(42);

      // We can't easily calculate the correct CRC32 here, so disable validation
      const largeChunk = new Uint8Array([
        (largeLength >>> 24) & 0xff,
        (largeLength >>> 16) & 0xff,
        (largeLength >>> 8) & 0xff,
        largeLength & 0xff,
        116,
        69,
        88,
        116, // "tEXt"
        ...largeData,
        0,
        0,
        0,
        0, // Placeholder CRC
      ]);

      const chunks = parseChunks(largeChunk, { validateCRC: false });
      assert.equal(chunks.length, 1);
      assert.equal(chunks[0].length, largeLength);
      assert.equal(chunks[0].data.length, largeLength);
    });

    it("handles zero-length chunks", () => {
      const zeroLengthChunk = new Uint8Array([
        0,
        0,
        0,
        0, // length = 0
        116,
        69,
        88,
        116, // "tEXt"
        109,
        15,
        1,
        2, // Some CRC (likely wrong, so disable validation)
      ]);

      const chunks = parseChunks(zeroLengthChunk, { validateCRC: false });
      assert.equal(chunks.length, 1);
      assert.equal(chunks[0].length, 0);
      assert.equal(chunks[0].data.length, 0);
    });
  });
});
