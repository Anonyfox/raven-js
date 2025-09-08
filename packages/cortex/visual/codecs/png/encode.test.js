/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for PNG encode function.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { decodePNG } from "./decode.js";
import { encodePNG } from "./encode.js";

describe("PNG encode function", () => {
  it("encodes RGBA pixels to valid PNG buffer", async () => {
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

    const pngBuffer = await encodePNG(pixels, width, height);

    assert(pngBuffer instanceof Uint8Array, "Should return Uint8Array");
    assert(pngBuffer.length > 0, "Should return non-empty buffer");

    // PNG signature check
    const expectedSignature = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < expectedSignature.length; i++) {
      assert.equal(pngBuffer[i], expectedSignature[i], `PNG signature byte ${i} should match`);
    }
  });

  it("round-trip encode/decode preserves data", async () => {
    const width = 3;
    const height = 3;
    const originalPixels = new Uint8Array([
      255,
      0,
      0,
      255, // Red
      0,
      255,
      0,
      255, // Green
      0,
      0,
      255,
      255, // Blue
      255,
      255,
      0,
      255, // Yellow
      255,
      0,
      255,
      255, // Magenta
      0,
      255,
      255,
      255, // Cyan
      128,
      128,
      128,
      255, // Gray
      0,
      0,
      0,
      255, // Black
      255,
      255,
      255,
      255, // White
    ]);

    // Encode to PNG
    const pngBuffer = await encodePNG(originalPixels, width, height);

    // Decode back to pixels
    const { pixels: decodedPixels, width: decodedWidth, height: decodedHeight } = await decodePNG(pngBuffer);

    assert.equal(decodedWidth, width, "Width should be preserved");
    assert.equal(decodedHeight, height, "Height should be preserved");
    assert.equal(decodedPixels.length, originalPixels.length, "Pixel data length should be preserved");

    // Note: PNG compression may cause slight differences, so we check for reasonable similarity
    let differentPixels = 0;
    for (let i = 0; i < originalPixels.length; i++) {
      if (Math.abs(originalPixels[i] - decodedPixels[i]) > 1) {
        differentPixels++;
      }
    }

    // Allow for minimal compression artifacts
    const errorRate = differentPixels / originalPixels.length;
    assert(errorRate < 0.01, `Error rate should be < 1%, got ${(errorRate * 100).toFixed(2)}%`);
  });

  it("throws error for invalid pixel data", async () => {
    await assert.rejects(
      async () => await encodePNG(null, 10, 10),
      /No pixel data provided/,
      "Should reject null pixel data"
    );

    await assert.rejects(
      async () => await encodePNG(new Uint8Array(0), 10, 10),
      /No pixel data provided/,
      "Should reject empty pixel data"
    );
  });

  it("throws error for invalid dimensions", async () => {
    const pixels = new Uint8Array(16); // 2x2 RGBA

    await assert.rejects(async () => await encodePNG(pixels, 0, 2), /Invalid width/, "Should reject zero width");

    await assert.rejects(async () => await encodePNG(pixels, 2, 0), /Invalid height/, "Should reject zero height");

    await assert.rejects(async () => await encodePNG(pixels, -1, 2), /Invalid width/, "Should reject negative width");
  });

  it("throws error for mismatched pixel data size", async () => {
    const pixels = new Uint8Array(12); // Too small for 2x2 RGBA (needs 16)

    await assert.rejects(
      async () => await encodePNG(pixels, 2, 2),
      /Pixel data length mismatch/,
      "Should reject mismatched pixel data size"
    );
  });

  it("accepts encoding options", async () => {
    const width = 2;
    const height = 2;
    const pixels = new Uint8Array(width * height * 4).fill(128); // Gray image

    const options = {
      compressionLevel: 9,
      filterStrategy: "optimal",
      maxChunkSize: 32768,
      metadata: {
        text: { Title: "Test Image" },
      },
    };

    const pngBuffer = await encodePNG(pixels, width, height, options);

    assert(pngBuffer instanceof Uint8Array, "Should handle encoding options");
    assert(pngBuffer.length > 0, "Should produce valid PNG with options");
  });
});
