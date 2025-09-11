/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { parseRIFFWebP } from "./parse-riff.js";

describe("parseRIFFWebP", () => {
  describe("core functionality", () => {
    it("parses minimal RIFF WebP with single VP8 chunk", () => {
      // Minimal RIFF WebP: RIFF(4) + size(4) + WEBP(4) + VP8(4) + size(4) + data(4)
      const bytes = new Uint8Array([
        // RIFF header
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x10,
        0x00,
        0x00,
        0x00, // size = 16 (WEBP + VP8 chunk)
        0x57,
        0x45,
        0x42,
        0x50, // "WEBP"
        // VP8 chunk
        0x56,
        0x50,
        0x38,
        0x20, // "VP8 "
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x01,
        0x02,
        0x03,
        0x04, // dummy data
      ]);

      const result = parseRIFFWebP(bytes);

      assert.equal(result.riffSize, 16);
      assert.equal(result.chunks.length, 1);
      assert.equal(result.chunks[0].type, "VP8 ");
      assert.equal(result.chunks[0].size, 4);
      assert.equal(result.chunks[0].offset, 20);
      assert.deepEqual([...result.chunks[0].data], [0x01, 0x02, 0x03, 0x04]);
      assert.equal(result.hasVP8X, false);
      assert.equal(result.orderValid, true);
      assert.equal(result.errors.length, 0);

      // Check chunksByType mapping
      assert.equal(result.chunksByType.has("VP8 "), true);
      assert.equal(result.chunksByType.get("VP8 ").length, 1);
    });

    it("parses minimal RIFF WebP with single VP8L chunk", () => {
      const bytes = new Uint8Array([
        // RIFF header
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x10,
        0x00,
        0x00,
        0x00, // size = 16
        0x57,
        0x45,
        0x42,
        0x50, // "WEBP"
        // VP8L chunk
        0x56,
        0x50,
        0x38,
        0x4c, // "VP8L"
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x05,
        0x06,
        0x07,
        0x08, // dummy data
      ]);

      const result = parseRIFFWebP(bytes);

      assert.equal(result.chunks.length, 1);
      assert.equal(result.chunks[0].type, "VP8L");
      assert.equal(result.hasVP8X, false);
      assert.equal(result.errors.length, 0);
    });

    it("parses VP8X with features and metadata chunks", () => {
      const bytes = new Uint8Array([
        // RIFF header
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x2e,
        0x00,
        0x00,
        0x00, // size = 46
        0x57,
        0x45,
        0x42,
        0x50, // "WEBP"
        // VP8X chunk (must be first)
        0x56,
        0x50,
        0x38,
        0x58, // "VP8X"
        0x0a,
        0x00,
        0x00,
        0x00, // size = 10
        0x3c,
        0x00,
        0x00,
        0x00, // flags = 0x3C (ICC|Alpha|EXIF|XMP)
        0x0f,
        0x00,
        0x00, // width-1 = 15 (width = 16)
        0x0f,
        0x00,
        0x00, // height-1 = 15 (height = 16)
        // ICCP chunk
        0x49,
        0x43,
        0x43,
        0x50, // "ICCP"
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x01,
        0x02,
        0x03,
        0x04, // dummy ICC data
        // VP8 chunk
        0x56,
        0x50,
        0x38,
        0x20, // "VP8 "
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x05,
        0x06,
        0x07,
        0x08, // dummy data
      ]);

      const result = parseRIFFWebP(bytes);

      assert.equal(result.hasVP8X, true);
      assert.equal(result.chunks.length, 3);
      assert.equal(result.chunks[0].type, "VP8X");
      assert.equal(result.chunks[1].type, "ICCP");
      assert.equal(result.chunks[2].type, "VP8 ");

      // Check features parsing
      assert.deepEqual(result.features, {
        icc: true,
        alpha: true,
        exif: true,
        xmp: true,
        anim: false,
        tiles: false,
      });

      assert.equal(result.orderValid, true);
      assert.equal(result.errors.length, 0);
    });
  });

  describe("edge cases and validation", () => {
    it("handles odd-sized chunk with padding", () => {
      const bytes = new Uint8Array([
        // RIFF header
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x11,
        0x00,
        0x00,
        0x00, // size = 17
        0x57,
        0x45,
        0x42,
        0x50, // "WEBP"
        // VP8 chunk with odd size
        0x56,
        0x50,
        0x38,
        0x20, // "VP8 "
        0x05,
        0x00,
        0x00,
        0x00, // size = 5 (odd)
        0x01,
        0x02,
        0x03,
        0x04,
        0x05, // data
        0x00, // padding byte (should be skipped)
      ]);

      const result = parseRIFFWebP(bytes);

      assert.equal(result.chunks.length, 1);
      assert.equal(result.chunks[0].size, 5);
      assert.deepEqual([...result.chunks[0].data], [0x01, 0x02, 0x03, 0x04, 0x05]);
      assert.equal(result.errors.length, 0);
    });

    it("rejects file too small", () => {
      const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // Only "RIFF"

      assert.throws(() => parseRIFFWebP(bytes), /file too small/);
    });

    it("rejects invalid RIFF signature", () => {
      const bytes = new Uint8Array([
        0x52,
        0x49,
        0x46,
        0x58, // "RIFX" instead of "RIFF"
        0x08,
        0x00,
        0x00,
        0x00,
        0x57,
        0x45,
        0x42,
        0x50,
      ]);

      assert.throws(() => parseRIFFWebP(bytes), /invalid signature "RIFX"/);
    });

    it("rejects invalid WebP signature", () => {
      const bytes = new Uint8Array([
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x08,
        0x00,
        0x00,
        0x00,
        0x57,
        0x45,
        0x42,
        0x58, // "WEBX" instead of "WEBP"
      ]);

      assert.throws(() => parseRIFFWebP(bytes), /invalid WebP signature "WEBX"/);
    });

    it("rejects size overflow", () => {
      const bytes = new Uint8Array([
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x64,
        0x00,
        0x00,
        0x00, // size = 100 (but file is only 12 bytes)
        0x57,
        0x45,
        0x42,
        0x50,
      ]);

      assert.throws(() => parseRIFFWebP(bytes), /size overflow/);
    });

    it("handles chunk size overflow gracefully", () => {
      const bytes = new Uint8Array([
        // RIFF header
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x10,
        0x00,
        0x00,
        0x00, // size = 16
        0x57,
        0x45,
        0x42,
        0x50, // "WEBP"
        // VP8 chunk with oversized claim
        0x56,
        0x50,
        0x38,
        0x20, // "VP8 "
        0xff,
        0x00,
        0x00,
        0x00, // size = 255 (but only 4 bytes left)
        0x01,
        0x02,
        0x03,
        0x04,
      ]);

      const result = parseRIFFWebP(bytes);

      assert.equal(result.chunks.length, 0);
      assert.equal(result.errors.length, 2);
      assert.match(result.errors[0], /chunk "VP8 " size overflow/);
      assert.match(result.errors[1], /simple WebP requires exactly one VP8 or VP8L chunk/);
    });

    it("detects duplicate metadata chunks", () => {
      const bytes = new Uint8Array([
        // RIFF header
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x28,
        0x00,
        0x00,
        0x00, // size = 40
        0x57,
        0x45,
        0x42,
        0x50, // "WEBP"
        // First ICCP
        0x49,
        0x43,
        0x43,
        0x50, // "ICCP"
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x01,
        0x02,
        0x03,
        0x04,
        // Second ICCP (duplicate)
        0x49,
        0x43,
        0x43,
        0x50, // "ICCP"
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x05,
        0x06,
        0x07,
        0x08,
        // VP8 chunk
        0x56,
        0x50,
        0x38,
        0x20, // "VP8 "
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x09,
        0x0a,
        0x0b,
        0x0c,
      ]);

      const result = parseRIFFWebP(bytes);

      assert.equal(result.chunks.length, 3);
      assert.equal(result.errors.length, 1);
      assert.match(result.errors[0], /duplicate ICCP chunks \(2 found\)/);
    });

    it("detects VP8X ordering violation", () => {
      const bytes = new Uint8Array([
        // RIFF header
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x22,
        0x00,
        0x00,
        0x00, // size = 34
        0x57,
        0x45,
        0x42,
        0x50, // "WEBP"
        // VP8 chunk first (should be VP8X first)
        0x56,
        0x50,
        0x38,
        0x20, // "VP8 "
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x01,
        0x02,
        0x03,
        0x04,
        // VP8X chunk second (wrong order)
        0x56,
        0x50,
        0x38,
        0x58, // "VP8X"
        0x0a,
        0x00,
        0x00,
        0x00, // size = 10
        0x00,
        0x00,
        0x00,
        0x00, // flags = 0
        0x0f,
        0x00,
        0x00, // width-1 = 15
        0x0f,
        0x00,
        0x00, // height-1 = 15
      ]);

      const result = parseRIFFWebP(bytes);

      assert.equal(result.hasVP8X, true);
      assert.equal(result.orderValid, false);
      assert.equal(result.errors.length, 1);
      assert.match(result.errors[0], /VP8X: must be first chunk/);
    });

    it("detects multiple primary streams in simple WebP", () => {
      const bytes = new Uint8Array([
        // RIFF header
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x1c,
        0x00,
        0x00,
        0x00, // size = 28
        0x57,
        0x45,
        0x42,
        0x50, // "WEBP"
        // VP8 chunk
        0x56,
        0x50,
        0x38,
        0x20, // "VP8 "
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x01,
        0x02,
        0x03,
        0x04,
        // VP8L chunk (second primary)
        0x56,
        0x50,
        0x38,
        0x4c, // "VP8L"
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x05,
        0x06,
        0x07,
        0x08,
      ]);

      const result = parseRIFFWebP(bytes);

      assert.equal(result.hasVP8X, false);
      assert.equal(result.errors.length, 1);
      assert.match(result.errors[0], /simple WebP requires exactly one VP8 or VP8L chunk/);
    });

    it("preserves unknown chunks", () => {
      const bytes = new Uint8Array([
        // RIFF header
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x1c,
        0x00,
        0x00,
        0x00, // size = 28
        0x57,
        0x45,
        0x42,
        0x50, // "WEBP"
        // Unknown chunk
        0x58,
        0x58,
        0x58,
        0x58, // "XXXX"
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x01,
        0x02,
        0x03,
        0x04,
        // VP8 chunk
        0x56,
        0x50,
        0x38,
        0x20, // "VP8 "
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x05,
        0x06,
        0x07,
        0x08,
      ]);

      const result = parseRIFFWebP(bytes);

      assert.equal(result.chunks.length, 2);
      assert.equal(result.chunks[0].type, "XXXX");
      assert.equal(result.chunks[1].type, "VP8 ");
      assert.equal(result.chunksByType.has("XXXX"), true);
      assert.equal(result.errors.length, 0);
    });
  });

  describe("integration scenarios", () => {
    it("parses complete VP8X file with all metadata types", () => {
      const bytes = new Uint8Array([
        // RIFF header
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x46,
        0x00,
        0x00,
        0x00, // size = 70
        0x57,
        0x45,
        0x42,
        0x50, // "WEBP"

        // VP8X chunk (first)
        0x56,
        0x50,
        0x38,
        0x58, // "VP8X"
        0x0a,
        0x00,
        0x00,
        0x00, // size = 10
        0x2c,
        0x00,
        0x00,
        0x00, // flags = ICC|EXIF|XMP
        0x1f,
        0x00,
        0x00, // width-1 = 31 (width = 32)
        0x1f,
        0x00,
        0x00, // height-1 = 31 (height = 32)

        // ICCP chunk
        0x49,
        0x43,
        0x43,
        0x50, // "ICCP"
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x49,
        0x43,
        0x43,
        0x50, // dummy ICC data

        // EXIF chunk
        0x45,
        0x58,
        0x49,
        0x46, // "EXIF"
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x45,
        0x58,
        0x49,
        0x46, // dummy EXIF data

        // XMP chunk (note space in "XMP ")
        0x58,
        0x4d,
        0x50,
        0x20, // "XMP "
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x58,
        0x4d,
        0x50,
        0x20, // dummy XMP data

        // VP8 chunk
        0x56,
        0x50,
        0x38,
        0x20, // "VP8 "
        0x04,
        0x00,
        0x00,
        0x00, // size = 4
        0x56,
        0x50,
        0x38,
        0x20, // dummy VP8 data
      ]);

      const result = parseRIFFWebP(bytes);

      assert.equal(result.hasVP8X, true);
      assert.equal(result.chunks.length, 5);
      assert.equal(result.orderValid, true);
      assert.equal(result.errors.length, 0);

      // Verify features
      assert.deepEqual(result.features, {
        icc: true,
        alpha: false,
        exif: true,
        xmp: true,
        anim: false,
        tiles: false,
      });

      // Verify all chunk types present
      assert.equal(result.chunksByType.has("VP8X"), true);
      assert.equal(result.chunksByType.has("ICCP"), true);
      assert.equal(result.chunksByType.has("EXIF"), true);
      assert.equal(result.chunksByType.has("XMP "), true);
      assert.equal(result.chunksByType.has("VP8 "), true);
    });
  });
});
