/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for PNG decode function.
 */

import assert from "node:assert";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { decodePNG } from "./decode.js";

describe("PNG decode function", () => {
  it("decodes valid PNG buffer to RGBA pixels", async () => {
    // Use the test PNG from the media folder
    const pngBuffer = readFileSync("../../media/apple-touch-icon.png");

    const result = await decodePNG(pngBuffer);

    assert(result.pixels instanceof Uint8Array, "Should return Uint8Array pixels");
    assert(typeof result.width === "number" && result.width > 0, "Should return valid width");
    assert(typeof result.height === "number" && result.height > 0, "Should return valid height");
    assert(typeof result.metadata === "object", "Should return metadata object");

    // Check pixel data size matches dimensions (RGBA = 4 bytes per pixel)
    const expectedPixelCount = result.width * result.height * 4;
    assert.equal(result.pixels.length, expectedPixelCount, "Pixel data size should match dimensions");
  });

  it("throws error for invalid PNG signature", async () => {
    const invalidBuffer = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

    await assert.rejects(
      async () => await decodePNG(invalidBuffer),
      /PNG decoding failed.*Invalid PNG signature/,
      "Should reject invalid PNG signature"
    );
  });

  it("throws error for empty buffer", async () => {
    const emptyBuffer = new Uint8Array(0);

    await assert.rejects(async () => await decodePNG(emptyBuffer), /PNG decoding failed/, "Should reject empty buffer");
  });

  it("handles ArrayBuffer input", async () => {
    const pngBuffer = readFileSync("../../media/apple-touch-icon.png");
    const arrayBuffer = pngBuffer.buffer.slice(pngBuffer.byteOffset, pngBuffer.byteOffset + pngBuffer.byteLength);

    const result = await decodePNG(arrayBuffer);

    assert(result.pixels instanceof Uint8Array, "Should handle ArrayBuffer input");
    assert(result.width > 0 && result.height > 0, "Should decode successfully from ArrayBuffer");
  });
});
