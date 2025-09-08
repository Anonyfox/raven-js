/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for PNG metadata encoding.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
  encodeCompressedTextChunk,
  encodeGammaChunk,
  encodeInternationalTextChunk,
  encodeMetadataChunks,
  encodePhysicalDimensionsChunk,
  encodeSRGBChunk,
  encodeTextChunk,
  encodeTimeChunk,
} from "./encode-metadata.js";

describe("PNG Metadata Encoding", () => {
  describe("encodeTextChunk", () => {
    it("encodes text metadata correctly", () => {
      const data = encodeTextChunk("Title", "My Image");

      assert(data instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(data.length, 5 + 1 + 8, "Should have correct length"); // "Title" + null + "My Image"

      // Check keyword
      assert.equal(data[0], 84, "T");
      assert.equal(data[1], 105, "i");
      assert.equal(data[2], 116, "t");
      assert.equal(data[3], 108, "l");
      assert.equal(data[4], 101, "e");

      // Check null separator
      assert.equal(data[5], 0, "Null separator");

      // Check text
      const textStart = 6;
      const expectedText = "My Image";
      for (let i = 0; i < expectedText.length; i++) {
        assert.equal(data[textStart + i], expectedText.charCodeAt(i), `Text char ${i}`);
      }
    });

    it("handles empty text", () => {
      const data = encodeTextChunk("Author", "");
      assert.equal(data.length, 6 + 1, "Should handle empty text");
    });

    it("validates keyword parameter", () => {
      assert.throws(() => encodeTextChunk("", "text"), /keyword must be a string with 1-79 characters/);
      assert.throws(() => encodeTextChunk("a".repeat(80), "text"), /keyword must be a string with 1-79 characters/);
      assert.throws(() => encodeTextChunk("key\0word", "text"), /cannot contain null bytes/);
      assert.throws(() => encodeTextChunk(" keyword", "text"), /leading\/trailing spaces/);
      assert.throws(() => encodeTextChunk("keyword ", "text"), /leading\/trailing spaces/);
    });

    it("validates text parameter", () => {
      assert.throws(() => encodeTextChunk("Title", 123), /text must be a string/);
      assert.throws(() => encodeTextChunk("Title", null), /text must be a string/);
    });
  });

  describe("encodeCompressedTextChunk", () => {
    it("encodes compressed text metadata", async () => {
      const data = await encodeCompressedTextChunk("Description", "A long description that should compress well");

      assert(data instanceof Uint8Array, "Should return Uint8Array");
      assert(data.length > 11 + 1 + 1, "Should have keyword + null + method + compressed data"); // "Description" + null + method + data

      // Check keyword
      const keyword = "Description";
      for (let i = 0; i < keyword.length; i++) {
        assert.equal(data[i], keyword.charCodeAt(i), `Keyword char ${i}`);
      }

      // Check null separator and compression method
      assert.equal(data[keyword.length], 0, "Null separator");
      assert.equal(data[keyword.length + 1], 0, "Compression method should be 0 (DEFLATE)");
    });

    it("validates parameters", async () => {
      await assert.rejects(() => encodeCompressedTextChunk("", "text"), /keyword must be a string/);
      await assert.rejects(() => encodeCompressedTextChunk("Title", 123), /text must be a string/);
    });
  });

  describe("encodeInternationalTextChunk", () => {
    it("encodes international text metadata", async () => {
      const data = await encodeInternationalTextChunk("Title", "My Image", {
        languageTag: "en-US",
        translatedKeyword: "Title",
        compressed: false,
      });

      assert(data instanceof Uint8Array, "Should return Uint8Array");

      // Check keyword
      assert.equal(data[0], 84, "T");
      assert.equal(data[5], 0, "Null separator after keyword");

      // Check compression flag and method
      assert.equal(data[6], 0, "Compression flag should be 0");
      assert.equal(data[7], 0, "Compression method should be 0");
    });

    it("handles compressed text", async () => {
      const data = await encodeInternationalTextChunk("Title", "My Image", {
        compressed: true,
      });

      assert.equal(data[6], 1, "Compression flag should be 1");
    });

    it("validates parameters", async () => {
      await assert.rejects(() => encodeInternationalTextChunk("", "text"), /keyword must be a string/);
      await assert.rejects(() => encodeInternationalTextChunk("Title", 123), /text must be a string/);
    });
  });

  describe("encodeTimeChunk", () => {
    it("encodes timestamp correctly", () => {
      const date = new Date(2023, 11, 25, 14, 30, 45); // December 25, 2023, 14:30:45
      const data = encodeTimeChunk(date);

      assert.equal(data.length, 7, "Should be 7 bytes");

      // Check year (2023 = 0x07E7)
      assert.equal(data[0], 0x07, "Year high byte");
      assert.equal(data[1], 0xe7, "Year low byte");

      // Check month (December = 12)
      assert.equal(data[2], 12, "Month");

      // Check day
      assert.equal(data[3], 25, "Day");

      // Check time
      assert.equal(data[4], 14, "Hour");
      assert.equal(data[5], 30, "Minute");
      assert.equal(data[6], 45, "Second");
    });

    it("validates date parameter", () => {
      assert.throws(() => encodeTimeChunk("not a date"), /date must be a valid Date object/);
      assert.throws(() => encodeTimeChunk(new Date("invalid")), /date must be a valid Date object/);
    });

    it("validates date ranges", () => {
      // Test invalid year (too large)
      const futureDate = new Date(70000, 0, 1);
      assert.throws(() => encodeTimeChunk(futureDate), /Invalid year/);
    });
  });

  describe("encodePhysicalDimensionsChunk", () => {
    it("encodes physical dimensions correctly", () => {
      const data = encodePhysicalDimensionsChunk(2835, 2835, 1); // 72 DPI in meters

      assert.equal(data.length, 9, "Should be 9 bytes");

      // Check pixels per unit X (2835 = 0x00000B13)
      assert.equal(data[0], 0x00, "X pixels per unit byte 0");
      assert.equal(data[1], 0x00, "X pixels per unit byte 1");
      assert.equal(data[2], 0x0b, "X pixels per unit byte 2");
      assert.equal(data[3], 0x13, "X pixels per unit byte 3");

      // Check pixels per unit Y (same)
      assert.equal(data[4], 0x00, "Y pixels per unit byte 0");
      assert.equal(data[5], 0x00, "Y pixels per unit byte 1");
      assert.equal(data[6], 0x0b, "Y pixels per unit byte 2");
      assert.equal(data[7], 0x13, "Y pixels per unit byte 3");

      // Check unit specifier
      assert.equal(data[8], 1, "Unit specifier should be 1 (meters)");
    });

    it("validates parameters", () => {
      assert.throws(() => encodePhysicalDimensionsChunk(-1, 100, 1), /pixelsPerUnitX must be a 32-bit/);
      assert.throws(() => encodePhysicalDimensionsChunk(100, -1, 1), /pixelsPerUnitY must be a 32-bit/);
      assert.throws(
        () => encodePhysicalDimensionsChunk(100, 100, 2),
        /unitSpecifier must be 0 \(unknown\) or 1 \(meters\)/
      );
    });
  });

  describe("encodeGammaChunk", () => {
    it("encodes gamma value correctly", () => {
      const data = encodeGammaChunk(2.2);

      assert.equal(data.length, 4, "Should be 4 bytes");

      // 2.2 * 100000 = 220000 = 0x00035B60
      assert.equal(data[0], 0x00, "Gamma byte 0");
      assert.equal(data[1], 0x03, "Gamma byte 1");
      assert.equal(data[2], 0x5b, "Gamma byte 2");
      assert.equal(data[3], 0x60, "Gamma byte 3");
    });

    it("validates gamma parameter", () => {
      assert.throws(() => encodeGammaChunk(0), /gamma must be a positive number/);
      assert.throws(() => encodeGammaChunk(-1), /gamma must be a positive number/);
      assert.throws(() => encodeGammaChunk("not a number"), /gamma must be a positive number/);
    });
  });

  describe("encodeSRGBChunk", () => {
    it("encodes rendering intent correctly", () => {
      const data0 = encodeSRGBChunk(0);
      assert.equal(data0.length, 1, "Should be 1 byte");
      assert.equal(data0[0], 0, "Rendering intent 0");

      const data3 = encodeSRGBChunk(3);
      assert.equal(data3[0], 3, "Rendering intent 3");
    });

    it("validates rendering intent parameter", () => {
      assert.throws(() => encodeSRGBChunk(-1), /renderingIntent must be 0-3/);
      assert.throws(() => encodeSRGBChunk(4), /renderingIntent must be 0-3/);
      assert.throws(() => encodeSRGBChunk(1.5), /renderingIntent must be 0-3/);
    });
  });

  describe("encodeMetadataChunks", () => {
    it("encodes complete metadata object", async () => {
      const metadata = {
        text: {
          Title: "My Image",
          Author: "Test User",
        },
        time: new Date(2023, 0, 1, 12, 0, 0),
        physicalDimensions: {
          pixelsPerUnitX: 2835,
          pixelsPerUnitY: 2835,
          unitSpecifier: 1,
        },
        gamma: 2.2,
        renderingIntent: 0,
      };

      const chunks = await encodeMetadataChunks(metadata);

      assert(Array.isArray(chunks), "Should return array of chunks");
      assert(chunks.length >= 5, "Should create multiple chunks");

      // Check chunk types
      const chunkTypes = chunks.map((chunk) => chunk.type);
      assert(chunkTypes.includes("tEXt"), "Should include tEXt chunks");
      assert(chunkTypes.includes("tIME"), "Should include tIME chunk");
      assert(chunkTypes.includes("pHYs"), "Should include pHYs chunk");
      assert(chunkTypes.includes("gAMA"), "Should include gAMA chunk");
      assert(chunkTypes.includes("sRGB"), "Should include sRGB chunk");

      // Verify all chunks have valid data
      assert(
        chunks.every((chunk) => chunk.data instanceof Uint8Array),
        "All chunks should have Uint8Array data"
      );
      assert(
        chunks.every((chunk) => chunk.data.length > 0),
        "All chunks should have non-empty data"
      );
    });

    it("handles empty metadata", async () => {
      const chunks1 = await encodeMetadataChunks({});
      assert.equal(chunks1.length, 0, "Empty object should produce no chunks");

      const chunks2 = await encodeMetadataChunks(null);
      assert.equal(chunks2.length, 0, "Null should produce no chunks");
    });

    it("handles partial metadata", async () => {
      const metadata = {
        text: { Title: "Test" },
        // Missing other fields
      };

      const chunks = await encodeMetadataChunks(metadata);
      assert.equal(chunks.length, 1, "Should create only tEXt chunk");
      assert.equal(chunks[0].type, "tEXt", "Should be tEXt chunk");
    });

    it("handles invalid metadata gracefully", async () => {
      const metadata = {
        text: { "": "invalid empty keyword" }, // Invalid keyword
        time: "not a date", // Invalid date
        gamma: -1, // Invalid gamma
      };

      // Should not throw, but should skip invalid entries
      const chunks = await encodeMetadataChunks(metadata);
      assert.equal(chunks.length, 0, "Should skip all invalid metadata");
    });
  });

  describe("Integration Tests", () => {
    it("creates valid chunk data that can be written to PNG", async () => {
      const metadata = {
        text: { Title: "Test Image", Description: "A test PNG image" },
        time: new Date(),
        gamma: 2.2,
      };

      const chunks = await encodeMetadataChunks(metadata);

      // Verify chunks can be used with PNG writer
      for (const chunk of chunks) {
        assert(typeof chunk.type === "string", "Chunk type should be string");
        assert.equal(chunk.type.length, 4, "Chunk type should be 4 characters");
        assert(chunk.data instanceof Uint8Array, "Chunk data should be Uint8Array");
      }
    });

    it("handles Unicode text correctly", async () => {
      const unicodeText = "Hello 世界 🌍";
      const data = await encodeInternationalTextChunk("Title", unicodeText);

      assert(data instanceof Uint8Array, "Should handle Unicode text");
      assert(data.length > unicodeText.length, "Should account for UTF-8 encoding");
    });
  });
});
