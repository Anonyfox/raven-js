/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { decodeWEBP } from "./index.js";

describe("WebP codec index", () => {
  describe("exports", () => {
    it("exports decodeWEBP function", () => {
      assert.equal(typeof decodeWEBP, "function");
    });

    it("decodeWEBP throws not implemented for VP8", () => {
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
      ]);

      // VP8 decoding is now implemented, but this will fail due to insufficient VP8 data
      assert.throws(() => decodeWEBP(bytes), /VP8Decode: insufficient data for VP8 header/);
    });
  });
});
