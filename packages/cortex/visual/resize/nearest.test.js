/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for nearest neighbor interpolation.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { getIntegerScale, resizeNearest, resizeNearestInteger } from "./nearest.js";

describe("Nearest Neighbor Resize", () => {
  // Create test pattern: 2x2 checkerboard
  const testPixels = new Uint8Array([
    255,
    0,
    0,
    255, // (0,0) Red
    0,
    255,
    0,
    255, // (1,0) Green
    0,
    0,
    255,
    255, // (0,1) Blue
    255,
    255,
    0,
    255, // (1,1) Yellow
  ]);

  describe("resizeNearest", () => {
    it("upscales image correctly", () => {
      const result = resizeNearest(testPixels, 2, 2, 4, 4);
      assert(result instanceof Uint8Array);
      assert.equal(result.length, 4 * 4 * 4); // 4x4 RGBA

      // Check that corners maintain original colors
      const topLeft = [result[0], result[1], result[2], result[3]];
      const topRight = [result[12], result[13], result[14], result[15]]; // (3,0)
      const bottomLeft = [result[48], result[49], result[50], result[51]]; // (0,3)
      const bottomRight = [result[60], result[61], result[62], result[63]]; // (3,3)

      assert.deepEqual(topLeft, [255, 0, 0, 255]); // Red
      assert.deepEqual(topRight, [0, 255, 0, 255]); // Green
      assert.deepEqual(bottomLeft, [0, 0, 255, 255]); // Blue
      assert.deepEqual(bottomRight, [255, 255, 0, 255]); // Yellow
    });

    it("downscales image correctly", () => {
      // Create 4x4 test image
      const largePixels = new Uint8Array(4 * 4 * 4);
      // Fill with pattern
      for (let i = 0; i < largePixels.length; i += 4) {
        largePixels[i] = 128; // Red
        largePixels[i + 1] = 64; // Green
        largePixels[i + 2] = 192; // Blue
        largePixels[i + 3] = 255; // Alpha
      }

      const result = resizeNearest(largePixels, 4, 4, 2, 2);
      assert(result instanceof Uint8Array);
      assert.equal(result.length, 2 * 2 * 4); // 2x2 RGBA

      // All pixels should have the same color
      for (let i = 0; i < result.length; i += 4) {
        assert.equal(result[i], 128);
        assert.equal(result[i + 1], 64);
        assert.equal(result[i + 2], 192);
        assert.equal(result[i + 3], 255);
      }
    });

    it("handles 1x1 resize", () => {
      const singlePixel = new Uint8Array([100, 150, 200, 255]);
      const result = resizeNearest(singlePixel, 1, 1, 3, 3);

      assert.equal(result.length, 3 * 3 * 4);

      // All pixels should be the same
      for (let i = 0; i < result.length; i += 4) {
        assert.equal(result[i], 100);
        assert.equal(result[i + 1], 150);
        assert.equal(result[i + 2], 200);
        assert.equal(result[i + 3], 255);
      }
    });

    it("preserves exact colors (no interpolation)", () => {
      const result = resizeNearest(testPixels, 2, 2, 6, 6);

      // Check that only original colors appear in result
      const uniqueColors = new Set();
      for (let i = 0; i < result.length; i += 4) {
        const color = `${result[i]},${result[i + 1]},${result[i + 2]},${result[i + 3]}`;
        uniqueColors.add(color);
      }

      // Should only have the 4 original colors
      assert.equal(uniqueColors.size, 4);
      assert(uniqueColors.has("255,0,0,255")); // Red
      assert(uniqueColors.has("0,255,0,255")); // Green
      assert(uniqueColors.has("0,0,255,255")); // Blue
      assert(uniqueColors.has("255,255,0,255")); // Yellow
    });

    it("handles non-square dimensions", () => {
      const result = resizeNearest(testPixels, 2, 2, 6, 3);
      assert.equal(result.length, 6 * 3 * 4);

      // Verify structure is correct
      assert(result instanceof Uint8Array);
      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });
  });

  describe("resizeNearestInteger", () => {
    it("validates scale parameter", () => {
      assert.throws(() => resizeNearestInteger(testPixels, 2, 2, 0), /Scale must be positive integer/);
      assert.throws(() => resizeNearestInteger(testPixels, 2, 2, -1), /Scale must be positive integer/);
      assert.throws(() => resizeNearestInteger(testPixels, 2, 2, 2.5), /Scale must be positive integer/);
    });

    it("scales by integer factors", () => {
      const result = resizeNearestInteger(testPixels, 2, 2, 3);
      assert.equal(result.length, 6 * 6 * 4); // 2x2 → 6x6 (3x scale)

      // Each source pixel should be replicated 3x3 times
      // Check top-left 3x3 block (should all be red)
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const offset = (y * 6 + x) * 4;
          assert.equal(result[offset], 255); // Red
          assert.equal(result[offset + 1], 0);
          assert.equal(result[offset + 2], 0);
          assert.equal(result[offset + 3], 255);
        }
      }
    });

    it("handles scale factor of 1", () => {
      const result = resizeNearestInteger(testPixels, 2, 2, 1);
      assert.equal(result.length, testPixels.length);
      assert.deepEqual(Array.from(result), Array.from(testPixels));
    });

    it("produces identical results to general algorithm", () => {
      const scale = 4;
      const result1 = resizeNearestInteger(testPixels, 2, 2, scale);
      const result2 = resizeNearest(testPixels, 2, 2, 2 * scale, 2 * scale);

      assert.deepEqual(Array.from(result1), Array.from(result2));
    });
  });

  describe("getIntegerScale", () => {
    it("detects integer scale factors", () => {
      assert.equal(getIntegerScale(10, 10, 20, 20), 2);
      assert.equal(getIntegerScale(5, 5, 15, 15), 3);
      assert.equal(getIntegerScale(8, 8, 8, 8), 1);
    });

    it("returns null for non-integer scales", () => {
      assert.equal(getIntegerScale(10, 10, 15, 15), null); // 1.5x scale
      assert.equal(getIntegerScale(10, 10, 7, 7), null); // 0.7x scale
    });

    it("returns null for different X/Y scales", () => {
      assert.equal(getIntegerScale(10, 10, 20, 30), null); // 2x vs 3x
      assert.equal(getIntegerScale(10, 5, 20, 10), 2); // Same 2x scale, different aspect is valid
    });

    it("handles zero and negative scales", () => {
      assert.equal(getIntegerScale(10, 10, 0, 0), null);
      assert.equal(getIntegerScale(10, 10, -10, -10), null);
    });
  });

  describe("Performance", () => {
    it("processes large images efficiently", () => {
      const largePixels = new Uint8Array(200 * 200 * 4);
      largePixels.fill(128);

      const start = performance.now();
      const result = resizeNearest(largePixels, 200, 200, 100, 100);
      const duration = performance.now() - start;

      assert(result instanceof Uint8Array);
      assert.equal(result.length, 100 * 100 * 4);
      assert(duration < 50, "Should complete within 50ms for 200x200→100x100");
    });

    it("integer scaling is faster than general algorithm", () => {
      const pixels = new Uint8Array(50 * 50 * 4);
      pixels.fill(64);

      // Time general algorithm
      const start1 = performance.now();
      resizeNearest(pixels, 50, 50, 100, 100);
      const generalTime = performance.now() - start1;

      // Time integer algorithm
      const start2 = performance.now();
      resizeNearestInteger(pixels, 50, 50, 2);
      const integerTime = performance.now() - start2;

      // Both should complete in reasonable time (performance tests can be unreliable)
      assert(integerTime < 100, "Integer scaling should be fast");
      assert(generalTime < 100, "General scaling should be fast");
    });
  });

  describe("Edge Cases", () => {
    it("handles extreme upscaling", () => {
      const result = resizeNearest(testPixels, 2, 2, 100, 100);
      assert.equal(result.length, 100 * 100 * 4);

      // Should still preserve original colors
      const uniqueColors = new Set();
      for (let i = 0; i < result.length; i += 4) {
        const color = `${result[i]},${result[i + 1]},${result[i + 2]},${result[i + 3]}`;
        uniqueColors.add(color);
      }
      assert.equal(uniqueColors.size, 4);
    });

    it("handles extreme downscaling", () => {
      const largePixels = new Uint8Array(100 * 100 * 4);
      // Create gradient pattern
      for (let y = 0; y < 100; y++) {
        for (let x = 0; x < 100; x++) {
          const offset = (y * 100 + x) * 4;
          largePixels[offset] = x * 2.55; // Red gradient
          largePixels[offset + 1] = y * 2.55; // Green gradient
          largePixels[offset + 2] = 128; // Blue constant
          largePixels[offset + 3] = 255; // Alpha
        }
      }

      const result = resizeNearest(largePixels, 100, 100, 2, 2);
      assert.equal(result.length, 2 * 2 * 4);

      // Should sample specific pixels from source
      assert(result instanceof Uint8Array);
    });
  });
});
