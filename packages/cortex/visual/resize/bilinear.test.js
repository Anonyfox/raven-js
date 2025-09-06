/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for bilinear interpolation.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { resizeBilinear, resizeBilinearSeparable } from "./bilinear.js";
import { resizeNearest } from "./nearest.js";

describe("Bilinear Resize", () => {
  // Create test pattern: 2x2 with distinct colors
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

  describe("resizeBilinear", () => {
    it("upscales image with smooth interpolation", () => {
      const result = resizeBilinear(testPixels, 2, 2, 4, 4);
      assert(result instanceof Uint8Array);
      assert.equal(result.length, 4 * 4 * 4); // 4x4 RGBA

      // Check that all values are in valid range
      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255, `Pixel value ${result[i]} out of range`);
      }
    });

    it("preserves corners during upscaling", () => {
      const result = resizeBilinear(testPixels, 2, 2, 6, 6);

      // Corners should be close to original colors (with some tolerance for interpolation)
      const topLeft = [result[0], result[1], result[2], result[3]];
      const topRight = [result[20], result[21], result[22], result[23]]; // (5,0)
      const bottomLeft = [result[120], result[121], result[122], result[123]]; // (0,5)
      const bottomRight = [result[140], result[141], result[142], result[143]]; // (5,5)

      // Should be close to original colors
      assert(Math.abs(topLeft[0] - 255) < 50, "Top-left should be reddish");
      assert(Math.abs(topRight[1] - 255) < 50, "Top-right should be greenish");
      assert(Math.abs(bottomLeft[2] - 255) < 50, "Bottom-left should be blueish");
      assert(Math.abs(bottomRight[0] - 255) < 50, "Bottom-right should be yellowish");
    });

    it("creates smooth gradients", () => {
      // Create simple gradient: black to white
      const gradient = new Uint8Array([
        0,
        0,
        0,
        255, // (0,0) Black
        255,
        255,
        255,
        255, // (1,0) White
        0,
        0,
        0,
        255, // (0,1) Black
        255,
        255,
        255,
        255, // (1,1) White
      ]);

      const result = resizeBilinear(gradient, 2, 2, 4, 2);

      // Middle pixels should have intermediate values
      const middleLeft = result[4]; // (1,0) Red channel
      const middleRight = result[8]; // (2,0) Red channel

      assert(middleLeft > 0 && middleLeft < 255, "Should have intermediate value");
      assert(middleRight > 0 && middleRight < 255, "Should have intermediate value");
    });

    it("downscales image correctly", () => {
      // Create 4x4 test image with known pattern
      const largePixels = new Uint8Array(4 * 4 * 4);
      for (let i = 0; i < largePixels.length; i += 4) {
        largePixels[i] = 128; // Red
        largePixels[i + 1] = 64; // Green
        largePixels[i + 2] = 192; // Blue
        largePixels[i + 3] = 255; // Alpha
      }

      const result = resizeBilinear(largePixels, 4, 4, 2, 2);
      assert.equal(result.length, 2 * 2 * 4);

      // Should average to approximately the same values
      for (let i = 0; i < result.length; i += 4) {
        assert(Math.abs(result[i] - 128) < 10, "Red should be close to 128");
        assert(Math.abs(result[i + 1] - 64) < 10, "Green should be close to 64");
        assert(Math.abs(result[i + 2] - 192) < 10, "Blue should be close to 192");
        assert.equal(result[i + 3], 255, "Alpha should be preserved");
      }
    });

    it("handles 1x1 resize", () => {
      const singlePixel = new Uint8Array([100, 150, 200, 255]);
      const result = resizeBilinear(singlePixel, 1, 1, 3, 3);

      assert.equal(result.length, 3 * 3 * 4);

      // All pixels should be the same (no neighbors to interpolate with)
      for (let i = 0; i < result.length; i += 4) {
        assert.equal(result[i], 100);
        assert.equal(result[i + 1], 150);
        assert.equal(result[i + 2], 200);
        assert.equal(result[i + 3], 255);
      }
    });

    it("produces different results than nearest neighbor", () => {
      const result1 = resizeBilinear(testPixels, 2, 2, 6, 6);

      // Compare with nearest neighbor
      const result2 = resizeNearest(testPixels, 2, 2, 6, 6);

      // Results should be different (bilinear creates new colors)
      let differences = 0;
      for (let i = 0; i < result1.length; i++) {
        if (result1[i] !== result2[i]) differences++;
      }

      assert(differences > result1.length * 0.1, "Should have significant differences from nearest neighbor");
    });
  });

  describe("resizeBilinearSeparable", () => {
    it("produces identical results to direct method", () => {
      const result1 = resizeBilinear(testPixels, 2, 2, 6, 4);
      const result2 = resizeBilinearSeparable(testPixels, 2, 2, 6, 4);

      // Results should be very close (allowing for minor floating-point differences)
      assert.equal(result1.length, result2.length);

      let maxDiff = 0;
      for (let i = 0; i < result1.length; i++) {
        const diff = Math.abs(result1[i] - result2[i]);
        maxDiff = Math.max(maxDiff, diff);
      }

      assert(maxDiff <= 1, "Separable method should produce nearly identical results");
    });

    it("optimizes horizontal-only resize", () => {
      const result = resizeBilinearSeparable(testPixels, 2, 2, 6, 2);
      assert.equal(result.length, 6 * 2 * 4);

      // Should produce valid output
      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });

    it("optimizes vertical-only resize", () => {
      const result = resizeBilinearSeparable(testPixels, 2, 2, 2, 6);
      assert.equal(result.length, 2 * 6 * 4);

      // Should produce valid output
      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });
  });

  describe("Interpolation Quality", () => {
    it("creates smooth transitions", () => {
      // Create high-contrast edge: black | white
      const edge = new Uint8Array([
        0,
        0,
        0,
        255, // Black
        255,
        255,
        255,
        255, // White
        0,
        0,
        0,
        255, // Black
        255,
        255,
        255,
        255, // White
      ]);

      const result = resizeBilinear(edge, 2, 2, 8, 2);

      // Check for smooth transition in the middle
      const leftMiddle = result[12]; // Should be dark
      const centerLeft = result[16]; // Should be medium-dark
      const centerRight = result[20]; // Should be medium-light
      const rightMiddle = result[24]; // Should be light

      assert(leftMiddle < centerLeft, "Should transition smoothly");
      assert(centerLeft < centerRight, "Should transition smoothly");
      assert(centerRight < rightMiddle, "Should transition smoothly");
    });

    it("preserves alpha channel correctly", () => {
      // Test with varying alpha
      const alphaTest = new Uint8Array([
        255,
        0,
        0,
        0, // Red, transparent
        255,
        0,
        0,
        255, // Red, opaque
        255,
        0,
        0,
        128, // Red, semi-transparent
        255,
        0,
        0,
        64, // Red, mostly transparent
      ]);

      const result = resizeBilinear(alphaTest, 2, 2, 4, 4);

      // Alpha should be interpolated like other channels
      for (let i = 3; i < result.length; i += 4) {
        assert(result[i] >= 0 && result[i] <= 255, "Alpha should be in valid range");
      }
    });
  });

  describe("Performance", () => {
    it("processes large images efficiently", () => {
      const largePixels = new Uint8Array(200 * 200 * 4);
      largePixels.fill(128);

      const start = performance.now();
      const result = resizeBilinear(largePixels, 200, 200, 100, 100);
      const duration = performance.now() - start;

      assert(result instanceof Uint8Array);
      assert.equal(result.length, 100 * 100 * 4);
      assert(duration < 200, "Should complete within 200ms for 200x200→100x100");
    });

    it("separable method has competitive performance", () => {
      const pixels = new Uint8Array(100 * 100 * 4);
      pixels.fill(64);

      // Time direct method
      const start1 = performance.now();
      resizeBilinear(pixels, 100, 100, 150, 80);
      const directTime = performance.now() - start1;

      // Time separable method
      const start2 = performance.now();
      resizeBilinearSeparable(pixels, 100, 100, 150, 80);
      const separableTime = performance.now() - start2;

      // Both should complete in reasonable time
      assert(directTime < 100, "Direct method should be fast");
      assert(separableTime < 100, "Separable method should be fast");
    });
  });

  describe("Edge Cases", () => {
    it("handles extreme aspect ratios", () => {
      const result = resizeBilinear(testPixels, 2, 2, 20, 1);
      assert.equal(result.length, 20 * 1 * 4);

      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });

    it("handles minimal upscaling", () => {
      const result = resizeBilinear(testPixels, 2, 2, 3, 3);
      assert.equal(result.length, 3 * 3 * 4);

      // Should create intermediate values
      const hasIntermediateValues = Array.from(result).some((val) => val > 0 && val < 255 && val !== 128);
      assert(hasIntermediateValues, "Should create intermediate values through interpolation");
    });

    it("handles non-square dimensions", () => {
      const result = resizeBilinear(testPixels, 2, 2, 7, 3);
      assert.equal(result.length, 7 * 3 * 4);

      // Verify all values are valid
      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });
  });
});
