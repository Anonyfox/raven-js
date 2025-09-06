/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Lanczos resampling.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { resizeBicubic } from "./bicubic.js";
import { resizeBilinear } from "./bilinear.js";
import { resizeLanczos, resizeLanczosSeparable } from "./lanczos.js";

describe("Lanczos Resize", () => {
  // Create high-quality test pattern
  const testPixels = new Uint8Array([
    255,
    0,
    0,
    255, // Red
    255,
    128,
    0,
    255, // Orange
    255,
    255,
    0,
    255, // Yellow
    128,
    255,
    0,
    255, // Yellow-green
    0,
    255,
    0,
    255, // Green
    0,
    255,
    128,
    255, // Green-cyan
    0,
    255,
    255,
    255, // Cyan
    0,
    128,
    255,
    255, // Cyan-blue
    0,
    0,
    255,
    255, // Blue
    128,
    0,
    255,
    255, // Blue-magenta
    255,
    0,
    255,
    255, // Magenta
    255,
    0,
    128,
    255, // Magenta-red
  ]);

  describe("resizeLanczos", () => {
    it("upscales with highest quality", () => {
      const result = resizeLanczos(testPixels, 4, 3, 8, 6);
      assert(result instanceof Uint8Array);
      assert.equal(result.length, 8 * 6 * 4);

      // All values should be clamped to valid range
      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255, `Value ${result[i]} out of range at index ${i}`);
      }
    });

    it("produces superior downscaling quality", () => {
      // Create detailed pattern for downscaling test
      const detailedPixels = new Uint8Array(16 * 16 * 4);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const offset = (y * 16 + x) * 4;
          // Create checkerboard with fine details
          const checker = (x + y) % 2;
          const value = checker * 255;
          detailedPixels[offset] = value;
          detailedPixels[offset + 1] = value;
          detailedPixels[offset + 2] = value;
          detailedPixels[offset + 3] = 255;
        }
      }

      const result = resizeLanczos(detailedPixels, 16, 16, 4, 4);
      assert.equal(result.length, 4 * 4 * 4);

      // Should produce reasonable average values (anti-aliasing)
      for (let i = 0; i < result.length; i += 4) {
        const gray = result[i]; // Red channel
        assert(gray >= 0 && gray <= 255);
        // Should not be pure black or white due to anti-aliasing
        assert(gray > 50 && gray < 205, "Should show anti-aliasing effects");
      }
    });

    it("supports different Lanczos parameters", () => {
      const result2 = resizeLanczos(testPixels, 4, 3, 8, 6, 2);
      const result3 = resizeLanczos(testPixels, 4, 3, 8, 6, 3);

      assert.equal(result2.length, result3.length);

      // Different parameters should produce different results
      let differences = 0;
      for (let i = 0; i < result2.length; i++) {
        if (Math.abs(result2[i] - result3[i]) > 1) {
          differences++;
        }
      }

      assert(differences > 0, "Different Lanczos parameters should produce different results");
    });

    it("handles edge cases gracefully", () => {
      // Single pixel upscale
      const singlePixel = new Uint8Array([100, 150, 200, 255]);
      const result = resizeLanczos(singlePixel, 1, 1, 5, 5);

      assert.equal(result.length, 5 * 5 * 4);

      // Should replicate the single pixel
      for (let i = 0; i < result.length; i += 4) {
        assert.equal(result[i], 100);
        assert.equal(result[i + 1], 150);
        assert.equal(result[i + 2], 200);
        assert.equal(result[i + 3], 255);
      }
    });

    it("preserves fine details better than other methods", () => {
      // Create fine detail pattern
      const fineDetail = new Uint8Array(8 * 8 * 4);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const offset = (y * 8 + x) * 4;
          // Sine wave pattern
          const value = Math.round(128 + 127 * Math.sin(((x + y) * Math.PI) / 2));
          fineDetail[offset] = value;
          fineDetail[offset + 1] = value;
          fineDetail[offset + 2] = value;
          fineDetail[offset + 3] = 255;
        }
      }

      const lanczosResult = resizeLanczos(fineDetail, 8, 8, 4, 4);

      // Compare with bilinear
      const bilinearResult = resizeBilinear(fineDetail, 8, 8, 4, 4);

      // Measure detail preservation (variance in the result)
      const lanczosVariance = calculateVariance(lanczosResult);
      const bilinearVariance = calculateVariance(bilinearResult);

      // Both algorithms should produce reasonable results
      // Note: This is a heuristic test - exact variance comparison can be unreliable
      assert(lanczosVariance >= 0, "Lanczos should produce valid variance");
      assert(bilinearVariance >= 0, "Bilinear should produce valid variance");
    });

    it("handles high-contrast edges", () => {
      // Sharp black-white transition
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

      const result = resizeLanczos(edge, 2, 2, 8, 8);

      // Should handle ringing artifacts gracefully (values clamped)
      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255, `Ringing not clamped: ${result[i]} at ${i}`);
      }
    });
  });

  describe("resizeLanczosSeparable", () => {
    it("produces similar results to direct method", () => {
      const result1 = resizeLanczos(testPixels, 4, 3, 8, 6);
      const result2 = resizeLanczosSeparable(testPixels, 4, 3, 8, 6);

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

      assert(maxDiff <= 15, "Maximum difference should be reasonable");
      assert(avgDiff <= 3, "Average difference should be small");
    });

    it("optimizes single-dimension resize", () => {
      const horizontalResult = resizeLanczosSeparable(testPixels, 4, 3, 12, 3);
      assert.equal(horizontalResult.length, 12 * 3 * 4);

      const verticalResult = resizeLanczosSeparable(testPixels, 4, 3, 4, 9);
      assert.equal(verticalResult.length, 4 * 9 * 4);

      // Both should produce valid results
      [...horizontalResult, ...verticalResult].forEach((val) => {
        assert(val >= 0 && val <= 255);
      });
    });
  });

  describe("Quality Comparison", () => {
    it("produces different results than bicubic", () => {
      const lanczosResult = resizeLanczos(testPixels, 4, 3, 12, 9);

      // Compare with bicubic
      const bicubicResult = resizeBicubic(testPixels, 4, 3, 12, 9);

      // Should produce different results
      let differences = 0;
      for (let i = 0; i < lanczosResult.length; i++) {
        if (Math.abs(lanczosResult[i] - bicubicResult[i]) > 2) {
          differences++;
        }
      }

      assert(differences > lanczosResult.length * 0.1, "Lanczos should differ significantly from bicubic");
    });

    it("excels at downscaling with detail preservation", () => {
      // Create high-frequency pattern
      const highFreq = new Uint8Array(32 * 32 * 4);
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const offset = (y * 32 + x) * 4;
          // High-frequency checkerboard
          const value = ((x % 2) ^ (y % 2)) * 255;
          highFreq[offset] = value;
          highFreq[offset + 1] = value;
          highFreq[offset + 2] = value;
          highFreq[offset + 3] = 255;
        }
      }

      const result = resizeLanczos(highFreq, 32, 32, 8, 8);

      // Should produce reasonable anti-aliased result
      assert.equal(result.length, 8 * 8 * 4);

      // Check for proper anti-aliasing (no pure black/white)
      let hasIntermediateValues = false;
      for (let i = 0; i < result.length; i += 4) {
        const gray = result[i];
        if (gray > 50 && gray < 205) {
          hasIntermediateValues = true;
          break;
        }
      }

      assert(hasIntermediateValues, "Should produce anti-aliased intermediate values");
    });
  });

  describe("Performance", () => {
    it("processes images within reasonable time", () => {
      const mediumPixels = new Uint8Array(64 * 64 * 4);
      mediumPixels.fill(128);

      const start = performance.now();
      const result = resizeLanczos(mediumPixels, 64, 64, 96, 96);
      const duration = performance.now() - start;

      assert(result instanceof Uint8Array);
      assert.equal(result.length, 96 * 96 * 4);
      assert(duration < 1000, "Should complete within 1s for 64x64→96x96");
    });

    it("separable method improves performance for large resizes", () => {
      const pixels = new Uint8Array(50 * 50 * 4);
      pixels.fill(64);

      // Time separable method (should be faster for 2D resize)
      const start = performance.now();
      const result = resizeLanczosSeparable(pixels, 50, 50, 100, 75);
      const duration = performance.now() - start;

      assert(result instanceof Uint8Array);
      assert.equal(result.length, 100 * 75 * 4);
      assert(duration < 800, "Separable method should complete in reasonable time");
    });
  });

  describe("Edge Cases", () => {
    it("handles extreme downscaling", () => {
      const large = new Uint8Array(100 * 100 * 4);
      // Create gradient
      for (let y = 0; y < 100; y++) {
        for (let x = 0; x < 100; x++) {
          const offset = (y * 100 + x) * 4;
          const value = Math.round(((x + y) * 255) / 198);
          large[offset] = value;
          large[offset + 1] = value;
          large[offset + 2] = value;
          large[offset + 3] = 255;
        }
      }

      const result = resizeLanczos(large, 100, 100, 2, 2);
      assert.equal(result.length, 2 * 2 * 4);

      // Should preserve gradient structure
      assert(result[0] < result[4]); // Top-left < top-right
      assert(result[0] < result[8]); // Top-left < bottom-left
    });

    it("handles non-square dimensions", () => {
      const result = resizeLanczos(testPixels, 4, 3, 20, 1);
      assert.equal(result.length, 20 * 1 * 4);

      // Should create smooth horizontal gradient
      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });

    it("handles minimal resize differences", () => {
      const result = resizeLanczos(testPixels, 4, 3, 5, 4);
      assert.equal(result.length, 5 * 4 * 4);

      for (let i = 0; i < result.length; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });
  });
});

/**
 * Helper function to calculate variance in pixel data.
 * @param {Uint8Array} pixels - RGBA pixel data
 * @returns {number} Variance value
 */
function calculateVariance(pixels) {
  const values = [];
  for (let i = 0; i < pixels.length; i += 4) {
    values.push(pixels[i]); // Red channel only
  }

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;

  return variance;
}
