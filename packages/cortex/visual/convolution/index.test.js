/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for main convolution functionality.
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import {
  applyBoxBlur,
  applyConvolution,
  applyEdgeDetection,
  applyGaussianBlur,
  applySharpen,
  applyUnsharpMask,
  createConvolutionPreview,
  getConvolutionInfo,
} from "./index.js";

describe("Main Convolution Functions", () => {
  let testPixels;

  beforeEach(() => {
    // Create a 4x4 test image with gradient pattern
    testPixels = new Uint8Array([
      // Row 0
      0, 0, 0, 255, 64, 64, 64, 255, 128, 128, 128, 255, 192, 192, 192, 255,
      // Row 1
      32, 32, 32, 255, 96, 96, 96, 255, 160, 160, 160, 255, 224, 224, 224, 255,
      // Row 2
      64, 64, 64, 255, 128, 128, 128, 255, 192, 192, 192, 255, 255, 255, 255, 255,
      // Row 3
      96, 96, 96, 255, 160, 160, 160, 255, 224, 224, 224, 255, 255, 255, 255, 255,
    ]);
  });

  describe("applyConvolution", () => {
    it("applies identity kernel correctly", () => {
      const identityKernel = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ];
      const result = applyConvolution(testPixels, 4, 4, identityKernel, { inPlace: false });

      assert.equal(result.width, 4);
      assert.equal(result.height, 4);
      assert.equal(result.pixels.length, 4 * 4 * 4);

      // Should be identical to original (identity transformation)
      assert.deepEqual(result.pixels, testPixels);
    });

    it("applies box blur kernel correctly", () => {
      const boxKernel = [
        [1 / 9, 1 / 9, 1 / 9],
        [1 / 9, 1 / 9, 1 / 9],
        [1 / 9, 1 / 9, 1 / 9],
      ];
      const result = applyConvolution(testPixels, 4, 4, boxKernel, { inPlace: false });

      assert.equal(result.width, 4);
      assert.equal(result.height, 4);
      assert.equal(result.pixels.length, 4 * 4 * 4);

      // Result should be different from original (blurred)
      assert.notDeepEqual(result.pixels, testPixels);

      // Should preserve alpha by default
      for (let i = 3; i < result.pixels.length; i += 4) {
        assert.equal(result.pixels[i], 255);
      }
    });

    it("supports different edge handling modes", () => {
      const kernel = [
        [0, -1, 0],
        [-1, 4, -1],
        [0, -1, 0],
      ]; // Laplacian

      const clampResult = applyConvolution(testPixels, 4, 4, kernel, {
        edgeHandling: "clamp",
        inPlace: false,
      });

      const wrapResult = applyConvolution(testPixels, 4, 4, kernel, {
        edgeHandling: "wrap",
        inPlace: false,
      });

      // Results should be different due to different edge handling
      assert.notDeepEqual(clampResult.pixels, wrapResult.pixels);
    });

    it("supports alpha preservation option", () => {
      // Create test pixels with varying alpha values
      const alphaTestPixels = new Uint8Array([
        100,
        100,
        100,
        128, // Semi-transparent
        150,
        150,
        150,
        200, // More opaque
        200,
        200,
        200,
        64, // More transparent
        255,
        255,
        255,
        255, // Fully opaque
      ]);

      const kernel = [
        [0.5, 0.5, 0.5],
        [0.5, 0.5, 0.5],
        [0.5, 0.5, 0.5],
      ]; // Kernel that would change alpha

      const preserveAlpha = applyConvolution(alphaTestPixels, 2, 2, kernel, {
        preserveAlpha: true,
        inPlace: false,
      });

      const processAlpha = applyConvolution(alphaTestPixels, 2, 2, kernel, {
        preserveAlpha: false,
        inPlace: false,
      });

      // Alpha channels should be different
      assert.notDeepEqual(
        preserveAlpha.pixels.filter((_, i) => i % 4 === 3),
        processAlpha.pixels.filter((_, i) => i % 4 === 3)
      );

      // Preserved alpha should match original
      assert.deepEqual(
        preserveAlpha.pixels.filter((_, i) => i % 4 === 3),
        alphaTestPixels.filter((_, i) => i % 4 === 3)
      );
    });

    it("supports in-place modification", () => {
      const original = new Uint8Array(testPixels);
      const kernel = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ];

      const result = applyConvolution(testPixels, 4, 4, kernel, { inPlace: true });

      // Should return the same array reference
      assert.equal(result.pixels, testPixels);

      // Original array should be modified (though identity kernel doesn't change values)
      assert.deepEqual(testPixels, original); // Identity kernel preserves values
    });

    it("supports creating new array", () => {
      const original = new Uint8Array(testPixels);
      const kernel = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ];

      const result = applyConvolution(testPixels, 4, 4, kernel, { inPlace: false });

      // Should return a different array reference
      assert.notEqual(result.pixels, testPixels);

      // Original array should be unchanged
      assert.deepEqual(testPixels, original);
    });

    it("validates parameters", () => {
      const validKernel = [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1],
      ];

      assert.throws(() => applyConvolution([], 4, 4, validKernel), /Uint8Array/);
      assert.throws(() => applyConvolution(testPixels, 0, 4, validKernel), /positive integer/);
      assert.throws(() => applyConvolution(testPixels, 4, -1, validKernel), /positive integer/);
      assert.throws(() => applyConvolution(testPixels, 4, 4, []), /non-empty 2D array/);
    });
  });

  describe("applyGaussianBlur", () => {
    it("applies Gaussian blur correctly", () => {
      const result = applyGaussianBlur(testPixels, 4, 4, 1.0, undefined, false);

      assert.equal(result.width, 4);
      assert.equal(result.height, 4);
      assert.equal(result.pixels.length, 4 * 4 * 4);

      // Should be blurred (different from original)
      assert.notDeepEqual(result.pixels, testPixels);

      // Should preserve alpha
      for (let i = 3; i < result.pixels.length; i += 4) {
        assert.equal(result.pixels[i], 255);
      }
    });

    it("handles different blur radii", () => {
      const lightBlur = applyGaussianBlur(testPixels, 4, 4, 0.5, undefined, false);
      const heavyBlur = applyGaussianBlur(testPixels, 4, 4, 2.0, undefined, false);

      // Results should be different
      assert.notDeepEqual(lightBlur.pixels, heavyBlur.pixels);
    });

    it("supports custom sigma", () => {
      const autoSigma = applyGaussianBlur(testPixels, 4, 4, 1.0, undefined, false);
      const customSigma = applyGaussianBlur(testPixels, 4, 4, 1.0, 0.8, false);

      // Results should be different
      assert.notDeepEqual(autoSigma.pixels, customSigma.pixels);
    });

    it("validates radius parameter", () => {
      assert.throws(() => applyGaussianBlur(testPixels, 4, 4, 0.4), /between 0.5 and 5.0/);
      assert.throws(() => applyGaussianBlur(testPixels, 4, 4, 5.1), /between 0.5 and 5.0/);
    });
  });

  describe("applyBoxBlur", () => {
    it("applies box blur correctly", () => {
      const result = applyBoxBlur(testPixels, 4, 4, 3, false);

      assert.equal(result.width, 4);
      assert.equal(result.height, 4);
      assert.equal(result.pixels.length, 4 * 4 * 4);

      // Should be blurred (different from original)
      assert.notDeepEqual(result.pixels, testPixels);
    });

    it("handles different kernel sizes", () => {
      const small = applyBoxBlur(testPixels, 4, 4, 3, false);
      const large = applyBoxBlur(testPixels, 4, 4, 5, false);

      // Results should be different
      assert.notDeepEqual(small.pixels, large.pixels);
    });
  });

  describe("applySharpen", () => {
    it("applies sharpening correctly", () => {
      const result = applySharpen(testPixels, 4, 4, 1.0, false);

      assert.equal(result.width, 4);
      assert.equal(result.height, 4);
      assert.equal(result.pixels.length, 4 * 4 * 4);

      // Should be sharpened (different from original)
      assert.notDeepEqual(result.pixels, testPixels);
    });

    it("handles different strength levels", () => {
      const weak = applySharpen(testPixels, 4, 4, 0.5, false);
      const strong = applySharpen(testPixels, 4, 4, 1.5, false);

      // Results should be different
      assert.notDeepEqual(weak.pixels, strong.pixels);
    });
  });

  describe("applyUnsharpMask", () => {
    it("applies unsharp masking correctly", () => {
      const result = applyUnsharpMask(testPixels, 4, 4, 1.0, 1.0, false);

      assert.equal(result.width, 4);
      assert.equal(result.height, 4);
      assert.equal(result.pixels.length, 4 * 4 * 4);

      // Should be sharpened (different from original)
      assert.notDeepEqual(result.pixels, testPixels);
    });

    it("handles different parameters", () => {
      const subtle = applyUnsharpMask(testPixels, 4, 4, 0.5, 0.8, false);
      const strong = applyUnsharpMask(testPixels, 4, 4, 2.0, 1.5, false);

      // Results should be different
      assert.notDeepEqual(subtle.pixels, strong.pixels);
    });
  });

  describe("applyEdgeDetection", () => {
    it("applies Sobel X edge detection", () => {
      const result = applyEdgeDetection(testPixels, 4, 4, "sobel-x", false);

      assert.equal(result.width, 4);
      assert.equal(result.height, 4);
      assert.equal(result.pixels.length, 4 * 4 * 4);

      // Should detect edges (different from original)
      assert.notDeepEqual(result.pixels, testPixels);
    });

    it("handles different edge detection types", () => {
      const sobelX = applyEdgeDetection(testPixels, 4, 4, "sobel-x", false);
      const sobelY = applyEdgeDetection(testPixels, 4, 4, "sobel-y", false);
      const laplacian = applyEdgeDetection(testPixels, 4, 4, "laplacian", false);

      // Results should be different
      assert.notDeepEqual(sobelX.pixels, sobelY.pixels);
      assert.notDeepEqual(sobelX.pixels, laplacian.pixels);
      assert.notDeepEqual(sobelY.pixels, laplacian.pixels);
    });
  });

  describe("getConvolutionInfo", () => {
    it("returns correct info for convolution", () => {
      const kernel = [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1],
      ];
      const info = getConvolutionInfo(800, 600, kernel, "gaussian-blur");

      assert.equal(info.operation, "gaussian-blur");
      assert.equal(info.kernelSize, 3);
      assert.equal(info.isLossless, false);
      assert.equal(info.isReversible, false);
      assert.equal(info.isValid, true);
      assert.deepEqual(info.outputDimensions, { width: 800, height: 600 });
      assert.equal(info.outputSize, 800 * 600 * 4);
      assert(info.description.includes("3×3"));
    });

    it("handles invalid parameters gracefully", () => {
      const info = getConvolutionInfo(-1, 600, [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1],
      ]);

      assert.equal(info.isValid, false);
      assert.equal(info.outputSize, 0);
    });
  });

  describe("createConvolutionPreview", () => {
    it("creates preview for small samples", () => {
      const smallSample = new Uint8Array([100, 150, 200, 255]); // 1x1 pixel
      const kernel = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ]; // Identity
      const preview = createConvolutionPreview(smallSample, 1, 1, kernel);

      assert.equal(preview.width, 1);
      assert.equal(preview.height, 1);
      assert.equal(preview.pixels.length, 4);

      // Identity kernel should preserve values
      assert.deepEqual(Array.from(preview.pixels), [100, 150, 200, 255]);
    });

    it("rejects samples that are too large", () => {
      const largeSample = new Uint8Array(65 * 65 * 4); // Too large
      const kernel = [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1],
      ];

      assert.throws(() => createConvolutionPreview(largeSample, 65, 65, kernel), /Sample too large for preview/);
    });
  });

  describe("Convolution Integration", () => {
    it("works with different kernel types", () => {
      // Test that different convolution types produce different results
      const blur = applyGaussianBlur(testPixels, 4, 4, 1.0, undefined, false);
      const sharpen = applySharpen(testPixels, 4, 4, 1.0, false);
      const edge = applyEdgeDetection(testPixels, 4, 4, "laplacian", false);

      // All results should be different
      assert.notDeepEqual(blur.pixels, sharpen.pixels);
      assert.notDeepEqual(blur.pixels, edge.pixels);
      assert.notDeepEqual(sharpen.pixels, edge.pixels);

      // All should have same dimensions
      assert.equal(blur.width, 4);
      assert.equal(sharpen.width, 4);
      assert.equal(edge.width, 4);
    });

    it("handles edge cases gracefully", () => {
      // Single pixel image
      const singlePixel = new Uint8Array([128, 128, 128, 255]);
      const result = applyGaussianBlur(singlePixel, 1, 1, 1.0, undefined, false);

      assert.equal(result.width, 1);
      assert.equal(result.height, 1);
      assert.equal(result.pixels.length, 4);
    });

    it("preserves image structure", () => {
      // Apply multiple convolutions in sequence
      let result = applyGaussianBlur(testPixels, 4, 4, 1.0, undefined, false);
      result = applySharpen(result.pixels, result.width, result.height, 0.8, false);

      // Should maintain dimensions
      assert.equal(result.width, 4);
      assert.equal(result.height, 4);
      assert.equal(result.pixels.length, 4 * 4 * 4);
    });

    it("handles performance requirements", () => {
      // Test with larger image to ensure reasonable performance
      const largePixels = new Uint8Array(50 * 50 * 4);
      largePixels.fill(128);

      // Should complete without timeout
      const result = applyGaussianBlur(largePixels, 50, 50, 1.0, undefined, false);

      assert.equal(result.width, 50);
      assert.equal(result.height, 50);
      assert.equal(result.pixels.length, 50 * 50 * 4);
    });
  });
});
