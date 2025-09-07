/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for convolution utility functions.
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import {
  applyKernelToPixel,
  createBoxBlurKernel,
  createEdgeDetectionKernel,
  createGaussianKernel,
  createSharpenKernel,
  createUnsharpMaskKernel,
  getPixelWithEdgeHandling,
  normalizeKernel,
  validateConvolutionParameters,
  validateKernel,
} from "./utils.js";

describe("Convolution Utilities", () => {
  describe("validateKernel", () => {
    it("accepts valid kernels", () => {
      assert.doesNotThrow(() => {
        validateKernel([
          [1, 2, 1],
          [2, 4, 2],
          [1, 2, 1],
        ]); // 3x3
        validateKernel([
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
        ]); // 5x5
      });
    });

    it("rejects invalid kernels", () => {
      assert.throws(() => validateKernel([]), /non-empty 2D array/);
      assert.throws(
        () =>
          validateKernel([
            [1, 2],
            [3, 4],
          ]),
        /must be odd/
      ); // Even size
      assert.throws(
        () =>
          validateKernel([
            [1, 2, 3],
            [4, 5],
            [7, 8, 9],
          ]),
        /must be square/
      ); // Not square (3x2 middle row)
      assert.throws(
        () =>
          validateKernel([
            [1, 2, 3],
            [4, "invalid", 6],
            [7, 8, 9],
          ]),
        /valid numbers/
      );
      assert.throws(
        () =>
          validateKernel([
            [1, 2, 3],
            [4, NaN, 6],
            [7, 8, 9],
          ]),
        /valid numbers/
      );
    });
  });

  describe("validateConvolutionParameters", () => {
    let validPixels;
    let validKernel;

    beforeEach(() => {
      validPixels = new Uint8Array(800 * 600 * 4);
      validKernel = [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1],
      ];
    });

    it("accepts valid parameters", () => {
      assert.doesNotThrow(() => {
        validateConvolutionParameters(validPixels, 800, 600, validKernel);
      });
    });

    it("rejects invalid pixels", () => {
      assert.throws(() => validateConvolutionParameters([], 800, 600, validKernel), /Uint8Array/);
      assert.throws(() => validateConvolutionParameters("invalid", 800, 600, validKernel), /Uint8Array/);
    });

    it("rejects invalid dimensions", () => {
      assert.throws(() => validateConvolutionParameters(validPixels, 0, 600, validKernel), /positive integer/);
      assert.throws(() => validateConvolutionParameters(validPixels, 800, -1, validKernel), /positive integer/);
      assert.throws(() => validateConvolutionParameters(validPixels, 1.5, 600, validKernel), /positive integer/);
    });

    it("rejects mismatched pixel data size", () => {
      const wrongSizePixels = new Uint8Array(100);
      assert.throws(() => validateConvolutionParameters(wrongSizePixels, 800, 600, validKernel), /width × height × 4/);
    });
  });

  describe("getPixelWithEdgeHandling", () => {
    const width = 5;
    const height = 5;

    it("handles clamp edge mode", () => {
      // Inside bounds
      let result = getPixelWithEdgeHandling(2, 2, width, height, "clamp");
      assert.equal(result.x, 2);
      assert.equal(result.y, 2);
      assert.equal(result.index, (2 * width + 2) * 4);

      // Outside bounds - should clamp
      result = getPixelWithEdgeHandling(-1, -1, width, height, "clamp");
      assert.equal(result.x, 0);
      assert.equal(result.y, 0);
      assert.equal(result.index, 0);

      result = getPixelWithEdgeHandling(10, 10, width, height, "clamp");
      assert.equal(result.x, 4);
      assert.equal(result.y, 4);
      assert.equal(result.index, (4 * width + 4) * 4);
    });

    it("handles wrap edge mode", () => {
      // Negative coordinates should wrap
      let result = getPixelWithEdgeHandling(-1, -1, width, height, "wrap");
      assert.equal(result.x, 4);
      assert.equal(result.y, 4);

      // Coordinates beyond bounds should wrap
      result = getPixelWithEdgeHandling(5, 6, width, height, "wrap");
      assert.equal(result.x, 0);
      assert.equal(result.y, 1);
    });

    it("handles mirror edge mode", () => {
      // Negative coordinates should mirror
      let result = getPixelWithEdgeHandling(-1, -1, width, height, "mirror");
      assert.equal(result.x, 0);
      assert.equal(result.y, 0);

      // Coordinates beyond bounds should mirror
      result = getPixelWithEdgeHandling(5, 6, width, height, "mirror");
      assert.equal(result.x, 4);
      assert.equal(result.y, 3);
    });

    it("rejects unknown edge handling methods", () => {
      assert.throws(() => getPixelWithEdgeHandling(0, 0, width, height, "unknown"), /Unknown edge handling/);
    });
  });

  describe("applyKernelToPixel", () => {
    let testPixels;
    const width = 3;
    const height = 3;

    beforeEach(() => {
      // Create a 3x3 test image with known values
      testPixels = new Uint8Array([
        100, 100, 100, 255, 150, 150, 150, 255, 200, 200, 200, 255, 110, 110, 110, 255, 160, 160, 160, 255, 210, 210,
        210, 255, 120, 120, 120, 255, 170, 170, 170, 255, 220, 220, 220, 255,
      ]);
    });

    it("applies identity kernel correctly", () => {
      const identityKernel = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ];

      const [r, g, b, a] = applyKernelToPixel(testPixels, 1, 1, width, height, identityKernel);

      // Should return the center pixel unchanged
      assert.equal(r, 160);
      assert.equal(g, 160);
      assert.equal(b, 160);
      assert.equal(a, 255);
    });

    it("applies averaging kernel correctly", () => {
      const averageKernel = [
        [1 / 9, 1 / 9, 1 / 9],
        [1 / 9, 1 / 9, 1 / 9],
        [1 / 9, 1 / 9, 1 / 9],
      ];

      const [r, g, b, _a] = applyKernelToPixel(testPixels, 1, 1, width, height, averageKernel);

      // Should return the average of all 9 pixels
      const expectedAverage = Math.round((100 + 150 + 200 + 110 + 160 + 210 + 120 + 170 + 220) / 9);
      assert.equal(r, expectedAverage);
      assert.equal(g, expectedAverage);
      assert.equal(b, expectedAverage);
    });

    it("handles edge pixels with clamping", () => {
      const identityKernel = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ];

      // Corner pixel should work without errors
      const [r, g, b, a] = applyKernelToPixel(testPixels, 0, 0, width, height, identityKernel, "clamp");

      assert.equal(r, 100);
      assert.equal(g, 100);
      assert.equal(b, 100);
      assert.equal(a, 255);
    });

    it("clamps output values to valid range", () => {
      // Kernel that would produce values outside 0-255 range
      const amplifyKernel = [
        [0, 0, 0],
        [0, 5, 0],
        [0, 0, 0],
      ];

      const [r, g, b, a] = applyKernelToPixel(testPixels, 1, 1, width, height, amplifyKernel);

      // Values should be clamped to 255
      assert.equal(r, 255);
      assert.equal(g, 255);
      assert.equal(b, 255);
      assert(a >= 0 && a <= 255);
    });
  });

  describe("normalizeKernel", () => {
    it("normalizes kernel correctly", () => {
      const kernel = [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1],
      ];
      const normalized = normalizeKernel(kernel);

      // Sum should be 1
      const sum = normalized.flat().reduce((acc, val) => acc + val, 0);
      assert(Math.abs(sum - 1) < 0.0001);

      // Center value should be largest
      assert(normalized[1][1] > normalized[0][0]);
    });

    it("rejects zero-sum kernels", () => {
      const zeroSumKernel = [
        [1, -1, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      assert.throws(() => normalizeKernel(zeroSumKernel), /zero sum/);
    });
  });

  describe("createBoxBlurKernel", () => {
    it("creates correct box blur kernel", () => {
      const kernel = createBoxBlurKernel(3);

      assert.equal(kernel.length, 3);
      assert.equal(kernel[0].length, 3);

      // All values should be equal and sum to 1
      const expectedValue = 1 / 9;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          assert(Math.abs(kernel[i][j] - expectedValue) < 0.0001);
        }
      }
    });

    it("rejects invalid sizes", () => {
      assert.throws(() => createBoxBlurKernel(2), /must be odd/);
      assert.throws(() => createBoxBlurKernel(1), /at least 3/);
    });
  });

  describe("createGaussianKernel", () => {
    it("creates correct Gaussian kernel", () => {
      const kernel = createGaussianKernel(3, 1.0);

      assert.equal(kernel.length, 3);
      assert.equal(kernel[0].length, 3);

      // Center should be largest value
      const center = kernel[1][1];
      const corner = kernel[0][0];
      assert(center > corner);

      // Should be normalized (sum ≈ 1)
      const sum = kernel.flat().reduce((acc, val) => acc + val, 0);
      assert(Math.abs(sum - 1) < 0.0001);
    });

    it("creates larger kernels correctly", () => {
      const kernel = createGaussianKernel(5, 1.5);

      assert.equal(kernel.length, 5);
      assert.equal(kernel[0].length, 5);

      // Should be symmetric
      assert(Math.abs(kernel[0][0] - kernel[4][4]) < 0.0001);
      assert(Math.abs(kernel[0][2] - kernel[4][2]) < 0.0001);
    });

    it("rejects invalid parameters", () => {
      assert.throws(() => createGaussianKernel(2, 1.0), /must be odd/);
      assert.throws(() => createGaussianKernel(3, 0), /must be positive/);
      assert.throws(() => createGaussianKernel(3, -1), /must be positive/);
    });
  });

  describe("createSharpenKernel", () => {
    it("creates correct sharpening kernel", () => {
      const kernel = createSharpenKernel(1.0);

      assert.equal(kernel.length, 3);
      assert.equal(kernel[0].length, 3);

      // Should have positive center and negative edges
      assert(kernel[1][1] > 0); // Center
      assert(kernel[0][1] < 0); // Top edge
      assert(kernel[1][0] < 0); // Left edge

      // Corners should be zero
      assert.equal(kernel[0][0], 0);
      assert.equal(kernel[2][2], 0);
    });

    it("scales with strength", () => {
      const weak = createSharpenKernel(0.5);
      const strong = createSharpenKernel(2.0);

      // Stronger kernel should have larger absolute values
      assert(Math.abs(strong[1][1]) > Math.abs(weak[1][1]));
      assert(Math.abs(strong[0][1]) > Math.abs(weak[0][1]));
    });

    it("rejects invalid strength", () => {
      assert.throws(() => createSharpenKernel(-0.1), /between 0.0 and 2.0/);
      assert.throws(() => createSharpenKernel(2.1), /between 0.0 and 2.0/);
    });
  });

  describe("createUnsharpMaskKernel", () => {
    it("creates unsharp mask kernel", () => {
      const kernel = createUnsharpMaskKernel(1.0, 1.0);

      // Should be at least 3x3
      assert(kernel.length >= 3);
      assert(kernel[0].length >= 3);

      // Center should be positive and larger than 1
      const center = Math.floor(kernel.length / 2);
      assert(kernel[center][center] > 1);
    });

    it("rejects invalid parameters", () => {
      assert.throws(() => createUnsharpMaskKernel(-0.1, 1.0), /between 0.0 and 3.0/);
      assert.throws(() => createUnsharpMaskKernel(3.1, 1.0), /between 0.0 and 3.0/);
      assert.throws(() => createUnsharpMaskKernel(1.0, 0.4), /between 0.5 and 3.0/);
      assert.throws(() => createUnsharpMaskKernel(1.0, 3.1), /between 0.5 and 3.0/);
    });
  });

  describe("createEdgeDetectionKernel", () => {
    it("creates Sobel X kernel", () => {
      const kernel = createEdgeDetectionKernel("sobel-x");

      assert.deepEqual(kernel, [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
      ]);
    });

    it("creates Sobel Y kernel", () => {
      const kernel = createEdgeDetectionKernel("sobel-y");

      assert.deepEqual(kernel, [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1],
      ]);
    });

    it("creates Laplacian kernel", () => {
      const kernel = createEdgeDetectionKernel("laplacian");

      assert.deepEqual(kernel, [
        [0, -1, 0],
        [-1, 4, -1],
        [0, -1, 0],
      ]);
    });

    it("creates Laplacian diagonal kernel", () => {
      const kernel = createEdgeDetectionKernel("laplacian-diagonal");

      assert.deepEqual(kernel, [
        [-1, -1, -1],
        [-1, 8, -1],
        [-1, -1, -1],
      ]);
    });

    it("rejects unknown edge detection types", () => {
      assert.throws(() => createEdgeDetectionKernel("unknown"), /Unknown edge detection type/);
    });
  });

  describe("Performance", () => {
    it("handles medium kernels efficiently", () => {
      const mediumPixels = new Uint8Array(100 * 100 * 4);
      mediumPixels.fill(128);

      // Test various kernel operations
      assert.doesNotThrow(() => {
        validateConvolutionParameters(mediumPixels, 100, 100, [
          [1, 2, 1],
          [2, 4, 2],
          [1, 2, 1],
        ]);

        const boxKernel = createBoxBlurKernel(5);
        const gaussianKernel = createGaussianKernel(5, 1.0);
        const sharpenKernel = createSharpenKernel(1.0);
        const edgeKernel = createEdgeDetectionKernel("sobel-x");

        // Apply kernels to a few pixels
        for (let i = 0; i < 10; i++) {
          applyKernelToPixel(mediumPixels, i, i, 100, 100, boxKernel);
          applyKernelToPixel(mediumPixels, i, i, 100, 100, gaussianKernel);
          applyKernelToPixel(mediumPixels, i, i, 100, 100, sharpenKernel);
          applyKernelToPixel(mediumPixels, i, i, 100, 100, edgeKernel);
        }
      });

      // Should complete without issues
      assert.equal(mediumPixels.length, 100 * 100 * 4);
    });
  });
});
