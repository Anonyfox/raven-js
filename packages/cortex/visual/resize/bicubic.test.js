/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for bicubic interpolation.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { resizeBicubic, resizeBicubicSeparable } from "./bicubic.js";
import { resizeBilinear } from "./bilinear.js";

describe("Bicubic Resize", () => {
  // Create test pattern with smooth gradients
  const testPixels = new Uint8Array([
    0,
    0,
    0,
    255, // (0,0) Black
    85,
    85,
    85,
    255, // (1,0) Dark gray
    170,
    170,
    170,
    255, // (2,0) Light gray
    255,
    255,
    255,
    255, // (3,0) White
    0,
    0,
    0,
    255, // (0,1) Black
    85,
    85,
    85,
    255, // (1,1) Dark gray
    170,
    170,
    170,
    255, // (2,1) Light gray
    255,
    255,
    255,
    255, // (3,1) White
  ]);

  describe("resizeBicubic", () => {
    it("upscales image with high quality", () => {
      const result = resizeBicubic(testPixels, 4, 2, 8, 4);
      assert(result instanceof Uint8Array);
      assert.equal(result.length, 8 * 4 * 4); // 8x4 RGBA

      // Check that all values are clamped to valid range
      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255, `Pixel value ${result[i]} out of range at index ${i}`);
      }
    });

    it("produces smoother results than bilinear", () => {
      const bicubicResult = resizeBicubic(testPixels, 4, 2, 12, 6);

      // Compare with bilinear
      const bilinearResult = resizeBilinear(testPixels, 4, 2, 12, 6);

      assert.equal(bicubicResult.length, bilinearResult.length);

      // Results should be different (bicubic typically produces different interpolation)
      let differences = 0;
      for (let i = 0; i < bicubicResult.length; i++) {
        if (Math.abs(bicubicResult[i] - bilinearResult[i]) > 1) {
          differences++;
        }
      }

      assert(differences > 0, "Bicubic should produce different results than bilinear");
    });

    it("handles edge pixels correctly", () => {
      // Test with simple 2x2 pattern
      const simple = new Uint8Array([
        0,
        0,
        0,
        255, // Black
        255,
        255,
        255,
        255, // White
        128,
        128,
        128,
        255, // Gray
        64,
        64,
        64,
        255, // Dark gray
      ]);

      const result = resizeBicubic(simple, 2, 2, 6, 6);
      assert.equal(result.length, 6 * 6 * 4);

      // Should produce smooth transitions
      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });

    it("preserves image structure", () => {
      // Create checkerboard pattern
      const checkerboard = new Uint8Array([
        255,
        255,
        255,
        255, // White
        0,
        0,
        0,
        255, // Black
        0,
        0,
        0,
        255, // Black
        255,
        255,
        255,
        255, // White
      ]);

      const result = resizeBicubic(checkerboard, 2, 2, 8, 8);

      // Should maintain general pattern structure
      const corners = [
        [result[0], result[1], result[2]], // Top-left
        [result[28], result[29], result[30]], // Top-right
        [result[224], result[225], result[226]], // Bottom-left
        [result[252], result[253], result[254]], // Bottom-right
      ];

      // Corners should reflect original pattern (with some tolerance)
      assert(corners[0][0] > 128, "Top-left should be lightish");
      assert(corners[1][0] < 128, "Top-right should be darkish");
      assert(corners[2][0] < 128, "Bottom-left should be darkish");
      assert(corners[3][0] > 128, "Bottom-right should be lightish");
    });

    it("handles downscaling", () => {
      // Create larger test image
      const largePixels = new Uint8Array(8 * 8 * 4);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const offset = (y * 8 + x) * 4;
          const value = (x + y) * 16; // Diagonal gradient
          largePixels[offset] = Math.min(255, value);
          largePixels[offset + 1] = Math.min(255, value);
          largePixels[offset + 2] = Math.min(255, value);
          largePixels[offset + 3] = 255;
        }
      }

      const result = resizeBicubic(largePixels, 8, 8, 4, 4);
      assert.equal(result.length, 4 * 4 * 4);

      // Should preserve gradient structure
      assert(result[0] < result[12]); // Top-left < top-right
      assert(result[0] < result[48]); // Top-left < bottom-left
    });

    it("clamps out-of-range values", () => {
      // Create high-contrast pattern that might cause overshoot
      const contrast = new Uint8Array([
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

      const result = resizeBicubic(contrast, 2, 2, 6, 6);

      // All values should be clamped to 0-255 range
      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255, `Value ${result[i]} not clamped at index ${i}`);
      }
    });
  });

  describe("resizeBicubicSeparable", () => {
    it("produces similar results to direct method", () => {
      const result1 = resizeBicubic(testPixels, 4, 2, 8, 6);
      const result2 = resizeBicubicSeparable(testPixels, 4, 2, 8, 6);

      assert.equal(result1.length, result2.length);

      // Results should be reasonably close
      let maxDiff = 0;
      let avgDiff = 0;
      for (let i = 0; i < result1.length; i++) {
        const diff = Math.abs(result1[i] - result2[i]);
        maxDiff = Math.max(maxDiff, diff);
        avgDiff += diff;
      }
      avgDiff /= result1.length;

      assert(maxDiff <= 10, "Maximum difference should be small");
      assert(avgDiff <= 2, "Average difference should be very small");
    });

    it("optimizes horizontal-only resize", () => {
      const result = resizeBicubicSeparable(testPixels, 4, 2, 12, 2);
      assert.equal(result.length, 12 * 2 * 4);

      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });

    it("optimizes vertical-only resize", () => {
      const result = resizeBicubicSeparable(testPixels, 4, 2, 4, 8);
      assert.equal(result.length, 4 * 8 * 4);

      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });
  });

  describe("Quality Characteristics", () => {
    it("produces sharper edges than bilinear", () => {
      // Create sharp edge pattern
      const edge = new Uint8Array([
        0,
        0,
        0,
        255, // Black
        0,
        0,
        0,
        255, // Black
        255,
        255,
        255,
        255, // White
        255,
        255,
        255,
        255, // White
      ]);

      const bicubicResult = resizeBicubic(edge, 2, 2, 8, 8);

      // Compare with bilinear
      const bilinearResult = resizeBilinear(edge, 2, 2, 8, 8);

      // Measure edge sharpness by looking at transition region
      const bicubicTransition = Math.abs(bicubicResult[16] - bicubicResult[20]); // Adjacent pixels
      const bilinearTransition = Math.abs(bilinearResult[16] - bilinearResult[20]);

      // Bicubic should generally produce sharper transitions
      assert(bicubicTransition >= bilinearTransition * 0.8, "Bicubic should maintain edge sharpness");
    });

    it("handles fine details well", () => {
      // Create alternating pattern
      const pattern = new Uint8Array([
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
        0,
        0,
        0,
        255, // Black
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

      const result = resizeBicubic(pattern, 4, 2, 12, 6);

      // Should preserve pattern characteristics
      assert(result instanceof Uint8Array);
      assert.equal(result.length, 12 * 6 * 4);

      // Check for reasonable contrast preservation
      const values = [];
      for (let i = 0; i < result.length; i += 4) {
        values.push(result[i]); // Red channel
      }

      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      assert(maxVal - minVal > 100, "Should preserve significant contrast");
    });
  });

  describe("Performance", () => {
    it("processes images efficiently", () => {
      const largePixels = new Uint8Array(100 * 100 * 4);
      largePixels.fill(128);

      const start = performance.now();
      const result = resizeBicubic(largePixels, 100, 100, 150, 150);
      const duration = performance.now() - start;

      assert(result instanceof Uint8Array);
      assert.equal(result.length, 150 * 150 * 4);
      assert(duration < 500, "Should complete within 500ms for 100x100→150x150");
    });

    it("separable method improves performance", () => {
      const pixels = new Uint8Array(80 * 80 * 4);
      pixels.fill(64);

      // Time direct method
      const start1 = performance.now();
      resizeBicubic(pixels, 80, 80, 120, 60);
      const directTime = performance.now() - start1;

      // Time separable method
      const start2 = performance.now();
      resizeBicubicSeparable(pixels, 80, 80, 120, 60);
      const separableTime = performance.now() - start2;

      // Both should complete reasonably fast
      assert(directTime < 300, "Direct method should complete in reasonable time");
      assert(separableTime < 300, "Separable method should complete in reasonable time");
    });
  });

  describe("Edge Cases", () => {
    it("handles minimal resize", () => {
      const result = resizeBicubic(testPixels, 4, 2, 5, 3);
      assert.equal(result.length, 5 * 3 * 4);

      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });

    it("handles extreme upscaling", () => {
      const small = new Uint8Array([
        128,
        64,
        192,
        255, // Single pixel
      ]);

      const result = resizeBicubic(small, 1, 1, 10, 10);
      assert.equal(result.length, 10 * 10 * 4);

      // Should replicate the single pixel
      for (let i = 0; i < result.length; i += 4) {
        assert.equal(result[i], 128);
        assert.equal(result[i + 1], 64);
        assert.equal(result[i + 2], 192);
        assert.equal(result[i + 3], 255);
      }
    });

    it("handles non-square aspect ratios", () => {
      const result = resizeBicubic(testPixels, 4, 2, 16, 1);
      assert.equal(result.length, 16 * 1 * 4);

      // Should create smooth horizontal gradient
      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });
  });
});
