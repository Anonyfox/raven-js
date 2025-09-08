/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for JPEG encode function.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { decodeJPEG } from "./decode.js";
import { encodeJPEG } from "./encode.js";

describe("JPEG encode function", () => {
  it("encodes RGBA pixels to valid JPEG buffer", async () => {
    // Create simple 2x2 RGBA test data
    const width = 2;
    const height = 2;
    const pixels = new Uint8Array([
      255,
      0,
      0,
      255, // Red pixel
      0,
      255,
      0,
      255, // Green pixel
      0,
      0,
      255,
      255, // Blue pixel
      255,
      255,
      0,
      255, // Yellow pixel
    ]);

    const jpegBuffer = await encodeJPEG(pixels, width, height);

    assert(jpegBuffer instanceof Uint8Array, "Should return Uint8Array");
    assert(jpegBuffer.length > 0, "Should return non-empty buffer");

    // JPEG signature check
    assert.equal(jpegBuffer[0], 0xff, "Should start with JPEG marker");
    assert.equal(jpegBuffer[1], 0xd8, "Should have SOI marker");
  });

  it("round-trip encode/decode preserves dimensions", async () => {
    const width = 4;
    const height = 4;
    const originalPixels = new Uint8Array(width * height * 4);

    // Create a simple pattern
    for (let i = 0; i < originalPixels.length; i += 4) {
      originalPixels[i] = (i / 4) % 256; // R
      originalPixels[i + 1] = ((i / 4) * 2) % 256; // G
      originalPixels[i + 2] = ((i / 4) * 3) % 256; // B
      originalPixels[i + 3] = 255; // A
    }

    // Encode to JPEG
    const jpegBuffer = await encodeJPEG(originalPixels, width, height);

    // Decode back to pixels
    const { pixels: decodedPixels, width: decodedWidth, height: decodedHeight } = await decodeJPEG(jpegBuffer);

    assert.equal(decodedWidth, width, "Width should be preserved");
    assert.equal(decodedHeight, height, "Height should be preserved");
    assert.equal(decodedPixels.length, originalPixels.length, "Pixel data length should be preserved");
  });

  it("throws error for invalid pixel data", async () => {
    await assert.rejects(
      async () => await encodeJPEG(null, 10, 10),
      /No pixel data provided/,
      "Should reject null pixel data"
    );

    await assert.rejects(
      async () => await encodeJPEG(new Uint8Array(0), 10, 10),
      /No pixel data provided/,
      "Should reject empty pixel data"
    );
  });

  it("throws error for invalid dimensions", async () => {
    const pixels = new Uint8Array(16); // 2x2 RGBA

    await assert.rejects(async () => await encodeJPEG(pixels, 0, 2), /Invalid width/, "Should reject zero width");

    await assert.rejects(async () => await encodeJPEG(pixels, 2, 0), /Invalid height/, "Should reject zero height");

    await assert.rejects(async () => await encodeJPEG(pixels, -1, 2), /Invalid width/, "Should reject negative width");
  });

  it("throws error for mismatched pixel data size", async () => {
    const pixels = new Uint8Array(12); // Too small for 2x2 RGBA (needs 16)

    await assert.rejects(
      async () => await encodeJPEG(pixels, 2, 2),
      /Pixel data length mismatch/,
      "Should reject mismatched pixel data size"
    );
  });

  it("accepts encoding options", async () => {
    const width = 2;
    const height = 2;
    const pixels = new Uint8Array(width * height * 4).fill(128); // Gray image

    const options = {
      quality: 90,
      progressive: false,
      subsampling: "4:4:4",
      optimize: false,
    };

    const jpegBuffer = await encodeJPEG(pixels, width, height, options);

    assert(jpegBuffer instanceof Uint8Array, "Should handle encoding options");
    assert(jpegBuffer.length > 0, "Should produce valid JPEG with options");
  });
});
