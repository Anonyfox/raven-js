/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { parseVP8X, validateVP8XFeatures } from "./vp8x.js";

describe("parseVP8X", () => {
  describe("core functionality", () => {
    it("parses minimal VP8X header (no features)", () => {
      const data = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x00, // flags = 0, reserved = 0
        0x0f,
        0x00,
        0x00, // width-1 = 15 (width = 16)
        0x0f,
        0x00,
        0x00, // height-1 = 15 (height = 16)
      ]);

      const result = parseVP8X(data);

      assert.equal(result.width, 16);
      assert.equal(result.height, 16);
      assert.deepEqual(result.flags, {
        icc: false,
        alpha: false,
        exif: false,
        xmp: false,
        anim: false,
        tiles: false,
      });
    });

    it("parses VP8X with all features enabled", () => {
      const data = new Uint8Array([
        0x3f,
        0x00,
        0x00,
        0x00, // flags = 0x3F (all features), reserved = 0
        0xff,
        0x3f,
        0x00, // width-1 = 16383 (width = 16384)
        0xff,
        0x3f,
        0x00, // height-1 = 16383 (height = 16384)
      ]);

      const result = parseVP8X(data);

      assert.equal(result.width, 16384);
      assert.equal(result.height, 16384);
      assert.deepEqual(result.flags, {
        icc: true,
        alpha: true,
        exif: true,
        xmp: true,
        anim: true,
        tiles: true,
      });
    });

    it("parses VP8X with selective features", () => {
      const data = new Uint8Array([
        0x2c,
        0x00,
        0x00,
        0x00, // flags = 0x2C (ICC|EXIF|XMP), reserved = 0
        0x7f,
        0x01,
        0x00, // width-1 = 383 (width = 384)
        0xdf,
        0x01,
        0x00, // height-1 = 479 (height = 480)
      ]);

      const result = parseVP8X(data);

      assert.equal(result.width, 384);
      assert.equal(result.height, 480);
      assert.deepEqual(result.flags, {
        icc: true,
        alpha: false,
        exif: true,
        xmp: true,
        anim: false,
        tiles: false,
      });
    });

    it("parses minimum dimensions (1x1)", () => {
      const data = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x00, // flags = 0, reserved = 0
        0x00,
        0x00,
        0x00, // width-1 = 0 (width = 1)
        0x00,
        0x00,
        0x00, // height-1 = 0 (height = 1)
      ]);

      const result = parseVP8X(data);

      assert.equal(result.width, 1);
      assert.equal(result.height, 1);
    });
  });

  describe("edge cases and validation", () => {
    it("rejects invalid header size", () => {
      const data = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x0f]); // Only 5 bytes

      assert.throws(() => parseVP8X(data), /invalid header size.*expected 10, got 5/);
    });

    it("rejects non-zero reserved bytes", () => {
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00,
        0x00, // flags = 0, reserved[1] = 1 (should be 0)
        0x0f,
        0x00,
        0x00, // width-1 = 15
        0x0f,
        0x00,
        0x00, // height-1 = 15
      ]);

      assert.throws(() => parseVP8X(data), /reserved bytes must be zero.*got 0x010000/);
    });

    it("rejects dimensions exceeding maximum", () => {
      const data = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x00, // flags = 0, reserved = 0
        0x00,
        0x40,
        0x00, // width-1 = 16384 (width = 16385, exceeds max)
        0x0f,
        0x00,
        0x00, // height-1 = 15
      ]);

      assert.throws(() => parseVP8X(data), /dimensions 16385x16 exceed maximum 16384x16384/);
    });

    it("handles edge case of maximum valid dimensions", () => {
      const data = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x00, // flags = 0, reserved = 0
        0xff,
        0x3f,
        0x00, // width-1 = 16383 (width = 16384, max valid)
        0xff,
        0x3f,
        0x00, // height-1 = 16383 (height = 16384, max valid)
      ]);

      const result = parseVP8X(data);

      assert.equal(result.width, 16384);
      assert.equal(result.height, 16384);
    });
  });

  describe("flag parsing precision", () => {
    it("parses individual flags correctly", () => {
      const testCases = [
        { flags: 0x20, expected: { icc: true, alpha: false, exif: false, xmp: false, anim: false, tiles: false } },
        { flags: 0x10, expected: { icc: false, alpha: true, exif: false, xmp: false, anim: false, tiles: false } },
        { flags: 0x08, expected: { icc: false, alpha: false, exif: true, xmp: false, anim: false, tiles: false } },
        { flags: 0x04, expected: { icc: false, alpha: false, exif: false, xmp: true, anim: false, tiles: false } },
        { flags: 0x02, expected: { icc: false, alpha: false, exif: false, xmp: false, anim: true, tiles: false } },
        { flags: 0x01, expected: { icc: false, alpha: false, exif: false, xmp: false, anim: false, tiles: true } },
      ];

      for (const testCase of testCases) {
        const data = new Uint8Array([testCase.flags, 0x00, 0x00, 0x00, 0x0f, 0x00, 0x00, 0x0f, 0x00, 0x00]);

        const result = parseVP8X(data);
        assert.deepEqual(result.flags, testCase.expected, `Failed for flags 0x${testCase.flags.toString(16)}`);
      }
    });
  });
});

describe("validateVP8XFeatures", () => {
  describe("feature validation", () => {
    it("passes validation when all required chunks present", () => {
      const flags = { icc: true, alpha: true, exif: false, xmp: false, anim: false, tiles: false };
      const chunksByType = new Map([
        ["ICCP", [{ type: "ICCP", data: new Uint8Array([1, 2, 3, 4]) }]],
        ["ALPH", [{ type: "ALPH", data: new Uint8Array([5, 6, 7, 8]) }]],
      ]);

      const errors = validateVP8XFeatures(flags, chunksByType);

      assert.equal(errors.length, 0);
    });

    it("detects missing required chunks", () => {
      const flags = { icc: true, alpha: true, exif: true, xmp: true, anim: true, tiles: false };
      const chunksByType = new Map(); // No chunks

      const errors = validateVP8XFeatures(flags, chunksByType);

      assert.equal(errors.length, 5);
      assert.match(errors[0], /Alpha flag set but no ALPH chunk found/);
      assert.match(errors[1], /ICC flag set but no ICCP chunk found/);
      assert.match(errors[2], /EXIF flag set but no EXIF chunk found/);
      assert.match(errors[3], /XMP flag set but no XMP chunk found/);
      assert.match(errors[4], /Animation flag set but no ANIM chunk found/);
    });

    it("detects contradictory chunks (present but flag not set)", () => {
      const flags = { icc: false, alpha: false, exif: false, xmp: false, anim: false, tiles: false };
      const chunksByType = new Map([
        ["ICCP", [{ type: "ICCP", data: new Uint8Array([1, 2, 3, 4]) }]],
        ["ALPH", [{ type: "ALPH", data: new Uint8Array([5, 6, 7, 8]) }]],
        ["EXIF", [{ type: "EXIF", data: new Uint8Array([9, 10, 11, 12]) }]],
        ["XMP ", [{ type: "XMP ", data: new Uint8Array([13, 14, 15, 16]) }]],
        ["ANIM", [{ type: "ANIM", data: new Uint8Array([17, 18, 19, 20]) }]],
      ]);

      const errors = validateVP8XFeatures(flags, chunksByType);

      assert.equal(errors.length, 5);
      assert.match(errors[0], /ALPH chunk present but Alpha flag not set/);
      assert.match(errors[1], /ICCP chunk present but ICC flag not set/);
      assert.match(errors[2], /EXIF chunk present but EXIF flag not set/);
      assert.match(errors[3], /XMP chunk present but XMP flag not set/);
      assert.match(errors[4], /ANIM chunk present but Animation flag not set/);
    });

    it("handles partial mismatches correctly", () => {
      const flags = { icc: true, alpha: false, exif: true, xmp: false, anim: false, tiles: false };
      const chunksByType = new Map([
        ["ICCP", [{ type: "ICCP", data: new Uint8Array([1, 2, 3, 4]) }]], // Correct: flag set, chunk present
        ["ALPH", [{ type: "ALPH", data: new Uint8Array([5, 6, 7, 8]) }]], // Error: flag not set, chunk present
        // EXIF: Error: flag set, chunk missing
        ["XMP ", [{ type: "XMP ", data: new Uint8Array([9, 10, 11, 12]) }]], // Error: flag not set, chunk present
      ]);

      const errors = validateVP8XFeatures(flags, chunksByType);

      assert.equal(errors.length, 3);
      assert.match(errors[0], /EXIF flag set but no EXIF chunk found/);
      assert.match(errors[1], /ALPH chunk present but Alpha flag not set/);
      assert.match(errors[2], /XMP chunk present but XMP flag not set/);
    });
  });
});
