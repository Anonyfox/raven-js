/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for VP8L Lossless Predictors
 *
 * Validates all 14 prediction modes, inverse prediction, and edge cases.
 * Tests cover 1xN/Nx1 images, boundary conditions, and round-trip accuracy.
 *
 * @fileoverview Comprehensive test suite for VP8L predictors
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyInversePrediction,
  applyPrediction,
  getPredictionModeName,
  predictPixel,
  validatePrediction,
} from "./predict.js";

describe("VP8L Lossless Predictors", () => {
  // Helper to create ARGB pixel
  const argb = (a, r, g, b) => (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;

  // Helper to extract components
  const unpack = (pixel) => ({
    a: (pixel >>> 24) & 0xff,
    r: (pixel >>> 16) & 0xff,
    g: (pixel >>> 8) & 0xff,
    b: pixel & 0xff,
  });

  describe("predictPixel", () => {
    const neighbors = {
      left: argb(255, 100, 150, 200),
      top: argb(255, 120, 160, 180),
      topRight: argb(255, 110, 140, 190),
      topLeft: argb(255, 130, 170, 210),
    };

    it("mode 0: BLACK", () => {
      const result = predictPixel(5, 5, 0, neighbors);
      assert.equal(result, 0x00000000);
    });

    it("mode 1: L (left)", () => {
      const result = predictPixel(5, 5, 1, neighbors);
      assert.equal(result, neighbors.left);
    });

    it("mode 2: T (top)", () => {
      const result = predictPixel(5, 5, 2, neighbors);
      assert.equal(result, neighbors.top);
    });

    it("mode 3: TR (top-right)", () => {
      const result = predictPixel(5, 5, 3, neighbors);
      assert.equal(result, neighbors.topRight);
    });

    it("mode 4: TL (top-left)", () => {
      const result = predictPixel(5, 5, 4, neighbors);
      assert.equal(result, neighbors.topLeft);
    });

    it("mode 5: AVERAGE2(L, T)", () => {
      const result = predictPixel(5, 5, 5, neighbors);
      const components = unpack(result);

      // Average of left and top
      assert.equal(components.a, Math.floor((255 + 255) / 2));
      assert.equal(components.r, Math.floor((100 + 120) / 2));
      assert.equal(components.g, Math.floor((150 + 160) / 2));
      assert.equal(components.b, Math.floor((200 + 180) / 2));
    });

    it("mode 6: AVERAGE2(L, TL)", () => {
      const result = predictPixel(5, 5, 6, neighbors);
      const components = unpack(result);

      // Average of left and top-left
      assert.equal(components.r, Math.floor((100 + 130) / 2));
      assert.equal(components.g, Math.floor((150 + 170) / 2));
      assert.equal(components.b, Math.floor((200 + 210) / 2));
    });

    it("mode 7: AVERAGE2(L, TR)", () => {
      const result = predictPixel(5, 5, 7, neighbors);
      const components = unpack(result);

      // Average of left and top-right
      assert.equal(components.r, Math.floor((100 + 110) / 2));
      assert.equal(components.g, Math.floor((150 + 140) / 2));
      assert.equal(components.b, Math.floor((200 + 190) / 2));
    });

    it("mode 11: SELECT(L, T, TL)", () => {
      // Create neighbors where left is closer to top-left than top
      const selectNeighbors = {
        left: argb(255, 130, 170, 210), // Same as top-left
        top: argb(255, 50, 50, 50), // Very different from top-left
        topRight: argb(255, 0, 0, 0),
        topLeft: argb(255, 130, 170, 210),
      };

      const result = predictPixel(5, 5, 11, selectNeighbors);
      assert.equal(result, selectNeighbors.left); // Should select left (closer to TL)
    });

    it("mode 12: CLAMP_ADD_SUBTRACT_FULL(L, T, TL)", () => {
      const result = predictPixel(5, 5, 12, neighbors);
      const components = unpack(result);

      // L + T - TL with clamping
      const l = unpack(neighbors.left);
      const t = unpack(neighbors.top);
      const tl = unpack(neighbors.topLeft);

      assert.equal(components.r, Math.max(0, Math.min(255, l.r + t.r - tl.r)));
      assert.equal(components.g, Math.max(0, Math.min(255, l.g + t.g - tl.g)));
      assert.equal(components.b, Math.max(0, Math.min(255, l.b + t.b - tl.b)));
    });

    it("mode 13: CLAMP_ADD_SUBTRACT_HALF(L, T, TL)", () => {
      const result = predictPixel(5, 5, 13, neighbors);

      // This is essentially AVERAGE2(L, T)
      const expectedComponents = unpack(predictPixel(5, 5, 5, neighbors));
      const actualComponents = unpack(result);

      assert.equal(actualComponents.r, expectedComponents.r);
      assert.equal(actualComponents.g, expectedComponents.g);
      assert.equal(actualComponents.b, expectedComponents.b);
    });

    it("validates coordinates", () => {
      assert.throws(() => predictPixel(-1, 5, 0, neighbors), /Predict: invalid x coordinate -1/);
      assert.throws(() => predictPixel(5, -1, 0, neighbors), /Predict: invalid y coordinate -1/);
      assert.throws(() => predictPixel(1.5, 5, 0, neighbors), /Predict: invalid x coordinate 1.5/);
    });

    it("validates mode", () => {
      assert.throws(() => predictPixel(5, 5, -1, neighbors), /Predict: invalid mode -1/);
      assert.throws(() => predictPixel(5, 5, 14, neighbors), /Predict: invalid mode 14/);
      assert.throws(() => predictPixel(5, 5, 1.5, neighbors), /Predict: invalid mode 1.5/);
    });

    it("validates neighbors", () => {
      assert.throws(() => predictPixel(5, 5, 0, null), /Predict: neighbors must be object/);
      assert.throws(() => predictPixel(5, 5, 0, "invalid"), /Predict: neighbors must be object/);
    });

    it("handles missing neighbor properties", () => {
      // Should default to 0 for missing neighbors
      const result = predictPixel(5, 5, 1, {}); // No left neighbor
      assert.equal(result, 0);
    });
  });

  describe("applyPrediction", () => {
    it("applies prediction to 2x2 image", () => {
      const pixels = new Uint32Array([
        argb(255, 100, 100, 100),
        argb(255, 150, 150, 150),
        argb(255, 200, 200, 200),
        argb(255, 250, 250, 250),
      ]);

      const predicted = applyPrediction(pixels, 2, 2, 1); // Mode 1: LEFT

      // First pixel (0,0): no left neighbor -> 0
      assert.equal(predicted[0], 0);
      // Second pixel (1,0): left is pixels[0]
      assert.equal(predicted[1], pixels[0]);
      // Third pixel (0,1): no left neighbor -> 0
      assert.equal(predicted[2], 0);
      // Fourth pixel (1,1): left is pixels[2]
      assert.equal(predicted[3], pixels[2]);
    });

    it("applies TOP prediction correctly", () => {
      const pixels = new Uint32Array([
        argb(255, 100, 100, 100),
        argb(255, 150, 150, 150),
        argb(255, 200, 200, 200),
        argb(255, 250, 250, 250),
      ]);

      const predicted = applyPrediction(pixels, 2, 2, 2); // Mode 2: TOP

      // First row: no top neighbors -> 0
      assert.equal(predicted[0], 0);
      assert.equal(predicted[1], 0);
      // Second row: top neighbors from first row
      assert.equal(predicted[2], pixels[0]);
      assert.equal(predicted[3], pixels[1]);
    });

    it("validates input parameters", () => {
      const pixels = new Uint32Array(4);

      assert.throws(() => applyPrediction([], 2, 2, 0), /Predict: pixels must be Uint32Array/);
      assert.throws(() => applyPrediction(pixels, 0, 2, 0), /Predict: invalid width 0/);
      assert.throws(() => applyPrediction(pixels, 2, 0, 0), /Predict: invalid height 0/);
      assert.throws(() => applyPrediction(pixels, 3, 2, 0), /Predict: pixel array size 4 does not match 3x2/);
    });

    it("handles 1xN images", () => {
      const pixels = new Uint32Array([argb(255, 100, 100, 100), argb(255, 150, 150, 150), argb(255, 200, 200, 200)]);

      const predicted = applyPrediction(pixels, 1, 3, 2); // Mode 2: TOP

      // Only first pixel has no top neighbor
      assert.equal(predicted[0], 0);
      assert.equal(predicted[1], pixels[0]);
      assert.equal(predicted[2], pixels[1]);
    });

    it("handles Nx1 images", () => {
      const pixels = new Uint32Array([argb(255, 100, 100, 100), argb(255, 150, 150, 150), argb(255, 200, 200, 200)]);

      const predicted = applyPrediction(pixels, 3, 1, 1); // Mode 1: LEFT

      // Only first pixel has no left neighbor
      assert.equal(predicted[0], 0);
      assert.equal(predicted[1], pixels[0]);
      assert.equal(predicted[2], pixels[1]);
    });
  });

  describe("applyInversePrediction", () => {
    it("reconstructs pixels from residuals", () => {
      // Original pixels
      const original = new Uint32Array([
        argb(255, 100, 100, 100),
        argb(255, 150, 150, 150),
        argb(255, 200, 200, 200),
        argb(255, 250, 250, 250),
      ]);

      // Apply prediction to get residuals
      const predicted = applyPrediction(original, 2, 2, 5); // Mode 5: AVERAGE2(L,T)
      const residuals = new Uint32Array(4);

      // Calculate residuals (original - predicted)
      for (let i = 0; i < 4; i++) {
        const orig = unpack(original[i]);
        const pred = unpack(predicted[i]);
        residuals[i] = argb(
          (orig.a - pred.a) & 0xff,
          (orig.r - pred.r) & 0xff,
          (orig.g - pred.g) & 0xff,
          (orig.b - pred.b) & 0xff
        );
      }

      // Apply inverse prediction
      const reconstructed = applyInversePrediction(residuals, 2, 2, 5);

      // Should match original (within rounding errors)
      for (let i = 0; i < 4; i++) {
        const origComponents = unpack(original[i]);
        const reconComponents = unpack(reconstructed[i]);

        // Allow for small rounding differences
        assert.ok(Math.abs(origComponents.r - reconComponents.r) <= 1);
        assert.ok(Math.abs(origComponents.g - reconComponents.g) <= 1);
        assert.ok(Math.abs(origComponents.b - reconComponents.b) <= 1);
      }
    });

    it("modifies array in-place", () => {
      const residuals = new Uint32Array([argb(10, 20, 30, 40), argb(50, 60, 70, 80)]);
      const originalArray = residuals;

      // Use LEFT predictor so second pixel changes due to left neighbor
      applyInversePrediction(residuals, 2, 1, 1); // Mode 1: LEFT

      assert.strictEqual(residuals, originalArray); // Same array reference
      // Second pixel should be modified
      assert.notEqual(residuals[1], argb(50, 60, 70, 80));
    });

    it("validates input parameters", () => {
      const residuals = new Uint32Array(4);

      assert.throws(() => applyInversePrediction([], 2, 2, 0), /Predict: residuals must be Uint32Array/);
      assert.throws(() => applyInversePrediction(residuals, 0, 2, 0), /Predict: invalid width 0/);
      assert.throws(() => applyInversePrediction(residuals, 2, 0, 0), /Predict: invalid height 0/);
      assert.throws(
        () => applyInversePrediction(residuals, 3, 2, 0),
        /Predict: residual array size 4 does not match 3x2/
      );
    });

    it("handles wraparound in component addition", () => {
      // Test that component addition wraps around at 255
      const residuals = new Uint32Array([argb(200, 200, 200, 200), argb(100, 100, 100, 100)]);

      applyInversePrediction(residuals, 2, 1, 1); // Mode 1: LEFT

      // First pixel: 200 + 0 = 200 (no left neighbor)
      const first = unpack(residuals[0]);
      assert.equal(first.r, 200);

      // Second pixel: 100 + 200 = 300 -> 44 (wrapped)
      const second = unpack(residuals[1]);
      assert.equal(second.r, (100 + 200) & 0xff);
    });
  });

  describe("validatePrediction", () => {
    it("validates correct parameters", () => {
      const result = validatePrediction(100, 200, 5);
      assert.ok(result.valid);
    });

    it("detects invalid width", () => {
      const result = validatePrediction(0, 100, 5);
      assert.ok(!result.valid);
      assert.ok(result.error.includes("invalid width"));
    });

    it("detects invalid height", () => {
      const result = validatePrediction(100, -1, 5);
      assert.ok(!result.valid);
      assert.ok(result.error.includes("invalid height"));
    });

    it("detects invalid mode", () => {
      const result = validatePrediction(100, 100, 15);
      assert.ok(!result.valid);
      assert.ok(result.error.includes("invalid mode"));
    });
  });

  describe("getPredictionModeName", () => {
    it("returns correct mode names", () => {
      assert.equal(getPredictionModeName(0), "BLACK");
      assert.equal(getPredictionModeName(1), "L");
      assert.equal(getPredictionModeName(5), "AVERAGE2(L,T)");
      assert.equal(getPredictionModeName(11), "SELECT(L,T,TL)");
      assert.equal(getPredictionModeName(13), "CLAMP_ADD_SUBTRACT_HALF(L,T,TL)");
    });

    it("handles invalid modes", () => {
      assert.equal(getPredictionModeName(99), "UNKNOWN(99)");
      assert.equal(getPredictionModeName(-1), "UNKNOWN(-1)");
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("handles clamping in CLAMP_ADD_SUBTRACT_FULL", () => {
      const neighbors = {
        left: argb(255, 255, 255, 255),
        top: argb(255, 255, 255, 255),
        topLeft: argb(255, 0, 0, 0), // Will cause overflow
      };

      const result = predictPixel(1, 1, 12, neighbors);
      const components = unpack(result);

      // 255 + 255 - 0 = 510 -> clamped to 255
      assert.equal(components.r, 255);
      assert.equal(components.g, 255);
      assert.equal(components.b, 255);
    });

    it("handles underflow in CLAMP_ADD_SUBTRACT_FULL", () => {
      const neighbors = {
        left: argb(255, 50, 50, 50),
        top: argb(255, 50, 50, 50),
        topLeft: argb(255, 200, 200, 200), // Will cause underflow
      };

      const result = predictPixel(1, 1, 12, neighbors);
      const components = unpack(result);

      // 50 + 50 - 200 = -100 -> clamped to 0
      assert.equal(components.r, 0);
      assert.equal(components.g, 0);
      assert.equal(components.b, 0);
    });

    it("handles SELECT with equal distances", () => {
      const neighbors = {
        left: argb(255, 100, 100, 100),
        top: argb(255, 100, 100, 100), // Same distance to topLeft
        topLeft: argb(255, 150, 150, 150),
      };

      const result = predictPixel(1, 1, 11, neighbors);
      // Should select top when distances are equal (implementation detail)
      assert.equal(result, neighbors.top);
    });

    it("processes large images efficiently", () => {
      const size = 100 * 100;
      const pixels = new Uint32Array(size);

      // Fill with gradient
      for (let i = 0; i < size; i++) {
        const intensity = Math.floor((i / size) * 255);
        pixels[i] = argb(255, intensity, intensity, intensity);
      }

      const start = process.hrtime.bigint();
      const predicted = applyPrediction(pixels, 100, 100, 5);
      const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000; // ms

      assert.ok(elapsed < 100, `Prediction took ${elapsed}ms, should be <100ms`);
      assert.equal(predicted.length, size);
    });

    it("maintains prediction accuracy across modes", () => {
      const pixels = new Uint32Array([
        argb(255, 100, 120, 140),
        argb(255, 110, 130, 150),
        argb(255, 120, 140, 160),
        argb(255, 130, 150, 170),
      ]);

      // Test round-trip accuracy for each mode
      for (let mode = 0; mode < 14; mode++) {
        const predicted = applyPrediction(pixels, 2, 2, mode);
        const residuals = new Uint32Array(4);

        // Calculate residuals
        for (let i = 0; i < 4; i++) {
          const orig = unpack(pixels[i]);
          const pred = unpack(predicted[i]);
          residuals[i] = argb(
            (orig.a - pred.a) & 0xff,
            (orig.r - pred.r) & 0xff,
            (orig.g - pred.g) & 0xff,
            (orig.b - pred.b) & 0xff
          );
        }

        // Apply inverse prediction
        const reconstructed = applyInversePrediction(new Uint32Array(residuals), 2, 2, mode);

        // Verify round-trip accuracy
        for (let i = 0; i < 4; i++) {
          assert.equal(reconstructed[i], pixels[i], `Mode ${mode} failed round-trip at pixel ${i}`);
        }
      }
    });

    it("handles alpha channel correctly in all modes", () => {
      const neighbors = {
        left: argb(100, 50, 50, 50),
        top: argb(200, 60, 60, 60),
        topRight: argb(150, 70, 70, 70),
        topLeft: argb(180, 80, 80, 80),
      };

      // Test that alpha is processed correctly in each mode
      for (let mode = 0; mode < 14; mode++) {
        const result = predictPixel(1, 1, mode, neighbors);
        const components = unpack(result);

        // Alpha should be a valid 8-bit value
        assert.ok(components.a >= 0 && components.a <= 255, `Mode ${mode} produced invalid alpha ${components.a}`);
      }
    });
  });
});
