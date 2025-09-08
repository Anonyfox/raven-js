/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for PNG codec module exports.
 */

import assert from "node:assert";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { decodePNG, encodePNG } from "./index.js";

describe("PNG codec module", () => {
  describe("exports", () => {
    it("exports decodePNG function", () => {
      assert.equal(typeof decodePNG, "function", "Should export decodePNG function");
    });

    it("exports encodePNG function", () => {
      assert.equal(typeof encodePNG, "function", "Should export encodePNG function");
    });
  });

  describe("integration", () => {
    it("can decode and encode PNG files", async () => {
      // Load test PNG
      const originalBuffer = readFileSync("../../media/apple-touch-icon.png");

      // Decode PNG to pixels
      const { pixels, width, height, metadata } = await decodePNG(originalBuffer);

      assert(pixels instanceof Uint8Array, "Should decode to Uint8Array pixels");
      assert(typeof width === "number" && width > 0, "Should have valid width");
      assert(typeof height === "number" && height > 0, "Should have valid height");
      assert(typeof metadata === "object", "Should have metadata object");

      // Encode pixels back to PNG
      const encodedBuffer = await encodePNG(pixels, width, height, { metadata });

      assert(encodedBuffer instanceof Uint8Array, "Should encode to Uint8Array buffer");
      assert(encodedBuffer.length > 0, "Should produce non-empty PNG buffer");

      // Verify PNG signature
      const expectedSignature = [137, 80, 78, 71, 13, 10, 26, 10];
      for (let i = 0; i < expectedSignature.length; i++) {
        assert.equal(encodedBuffer[i], expectedSignature[i], `PNG signature byte ${i} should match`);
      }
    });

    it("preserves image quality through encode/decode cycle", async () => {
      // Create test image data
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

      // Encode to PNG
      const pngBuffer = await encodePNG(originalPixels, width, height);

      // Decode back
      const { pixels: decodedPixels, width: decodedWidth, height: decodedHeight } = await decodePNG(pngBuffer);

      // Verify dimensions preserved
      assert.equal(decodedWidth, width, "Width should be preserved");
      assert.equal(decodedHeight, height, "Height should be preserved");
      assert.equal(decodedPixels.length, originalPixels.length, "Pixel count should be preserved");

      // Verify pixel data similarity (allowing for minimal compression artifacts)
      let maxDifference = 0;
      for (let i = 0; i < originalPixels.length; i++) {
        const diff = Math.abs(originalPixels[i] - decodedPixels[i]);
        maxDifference = Math.max(maxDifference, diff);
      }

      assert(maxDifference <= 1, `Maximum pixel difference should be ≤ 1, got ${maxDifference}`);
    });
  });
});
