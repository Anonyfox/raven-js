/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for main color adjustment functionality.
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import {
  adjustBrightness,
  adjustBrightnessContrast,
  adjustContrast,
  analyzeBrightness,
  compareGrayscaleMethods,
  convertToGrayscale,
  createColorAdjustmentPreview,
  createGrayscalePreview,
  getColorAdjustmentInfo,
  getGrayscaleInfo,
} from "./index.js";

describe("Main Color Adjustment Functions", () => {
  let testPixels;

  beforeEach(() => {
    // Create 2x2 test image with known values
    testPixels = new Uint8Array([
      // Pixel 0: Dark gray
      64, 64, 64, 255,
      // Pixel 1: Medium gray
      128, 128, 128, 255,
      // Pixel 2: Light gray
      192, 192, 192, 255,
      // Pixel 3: White
      255, 255, 255, 255,
    ]);
  });

  describe("adjustBrightness", () => {
    it("increases brightness correctly", () => {
      const result = adjustBrightness(testPixels, 2, 2, 1.5, false);

      assert.equal(result.width, 2);
      assert.equal(result.height, 2);
      assert.equal(result.pixels.length, 2 * 2 * 4);

      // Check specific pixels
      assert.equal(result.pixels[0], 96); // 64 * 1.5 = 96
      assert.equal(result.pixels[4], 192); // 128 * 1.5 = 192
      assert.equal(result.pixels[8], 255); // 192 * 1.5 = 288 -> clamped to 255
      assert.equal(result.pixels[12], 255); // 255 * 1.5 = 382.5 -> clamped to 255

      // Alpha should be preserved
      assert.equal(result.pixels[3], 255);
      assert.equal(result.pixels[7], 255);
    });

    it("decreases brightness correctly", () => {
      const result = adjustBrightness(testPixels, 2, 2, 0.5, false);

      // Check specific pixels
      assert.equal(result.pixels[0], 32); // 64 * 0.5 = 32
      assert.equal(result.pixels[4], 64); // 128 * 0.5 = 64
      assert.equal(result.pixels[8], 96); // 192 * 0.5 = 96
      assert.equal(result.pixels[12], 128); // 255 * 0.5 = 127.5 -> rounded to 128
    });

    it("handles identity factor", () => {
      const result = adjustBrightness(testPixels, 2, 2, 1.0, false);

      // Should be unchanged
      assert.deepEqual(result.pixels, testPixels);
    });

    it("supports in-place modification", () => {
      const original = new Uint8Array(testPixels);
      const result = adjustBrightness(testPixels, 2, 2, 1.5, true);

      // Should return the same array reference
      assert.equal(result.pixels, testPixels);

      // Original array should be modified
      assert.notDeepEqual(testPixels, original);
    });

    it("supports creating new array", () => {
      const original = new Uint8Array(testPixels);
      const result = adjustBrightness(testPixels, 2, 2, 1.5, false);

      // Should return a different array reference
      assert.notEqual(result.pixels, testPixels);

      // Original array should be unchanged
      assert.deepEqual(testPixels, original);
    });

    it("validates parameters", () => {
      assert.throws(() => adjustBrightness([], 2, 2, 1.5), /Pixels must be a Uint8Array/);
      assert.throws(() => adjustBrightness(testPixels, 2, 2, -0.5), /Invalid factor.*Must be non-negative/);
      assert.throws(() => adjustBrightness(testPixels, 2, 2, 15), /Factor 15 is outside valid range/);
    });
  });

  describe("adjustContrast", () => {
    it("increases contrast correctly", () => {
      const result = adjustContrast(testPixels, 2, 2, 2.0, false);

      // Contrast centers around 128
      // 64: (64 - 128) * 2 + 128 = -64 * 2 + 128 = 0
      // 128: (128 - 128) * 2 + 128 = 0 * 2 + 128 = 128
      // 192: (192 - 128) * 2 + 128 = 64 * 2 + 128 = 256 -> clamped to 255
      // 255: (255 - 128) * 2 + 128 = 127 * 2 + 128 = 382 -> clamped to 255

      assert.equal(result.pixels[0], 0); // Dark gets darker
      assert.equal(result.pixels[4], 128); // Middle gray unchanged
      assert.equal(result.pixels[8], 255); // Light gets lighter (clamped)
      assert.equal(result.pixels[12], 255); // White stays white (clamped)
    });

    it("decreases contrast correctly", () => {
      const result = adjustContrast(testPixels, 2, 2, 0.5, false);

      // Lower contrast moves values toward middle gray
      // 64: (64 - 128) * 0.5 + 128 = -32 + 128 = 96
      // 128: (128 - 128) * 0.5 + 128 = 0 + 128 = 128
      // 192: (192 - 128) * 0.5 + 128 = 32 + 128 = 160
      // 255: (255 - 128) * 0.5 + 128 = 63.5 + 128 = 191.5 -> rounded to 192

      assert.equal(result.pixels[0], 96); // Moves toward middle
      assert.equal(result.pixels[4], 128); // Middle gray unchanged
      assert.equal(result.pixels[8], 160); // Moves toward middle
      assert.equal(result.pixels[12], 192); // Moves toward middle
    });

    it("handles identity factor", () => {
      const result = adjustContrast(testPixels, 2, 2, 1.0, false);

      // Should be unchanged
      assert.deepEqual(result.pixels, testPixels);
    });

    it("validates parameters", () => {
      assert.throws(() => adjustContrast([], 2, 2, 1.5), /Pixels must be a Uint8Array/);
      assert.throws(() => adjustContrast(testPixels, 2, 2, -0.5), /Invalid factor.*Must be non-negative/);
    });
  });

  describe("adjustBrightnessContrast", () => {
    it("combines brightness and contrast adjustments", () => {
      const result = adjustBrightnessContrast(testPixels, 2, 2, 1.2, 1.5, false);

      assert.equal(result.width, 2);
      assert.equal(result.height, 2);
      assert.equal(result.pixels.length, 2 * 2 * 4);

      // Should apply brightness first, then contrast
      // This is tested by comparing with separate applications
      const brightened = adjustBrightness(testPixels, 2, 2, 1.2, false);
      const separate = adjustContrast(brightened.pixels, 2, 2, 1.5, false);

      // Results should be very close (within rounding errors)
      for (let i = 0; i < result.pixels.length; i++) {
        assert(Math.abs(result.pixels[i] - separate.pixels[i]) <= 1);
      }
    });

    it("handles identity factors", () => {
      const result = adjustBrightnessContrast(testPixels, 2, 2, 1.0, 1.0, false);

      // Should be unchanged
      assert.deepEqual(result.pixels, testPixels);
    });

    it("validates parameters", () => {
      assert.throws(() => adjustBrightnessContrast([], 2, 2, 1.2, 1.5), /Pixels must be a Uint8Array/);
      assert.throws(
        () => adjustBrightnessContrast(testPixels, 2, 2, -0.5, 1.5),
        /Invalid factor.*Must be non-negative/
      );
      assert.throws(
        () => adjustBrightnessContrast(testPixels, 2, 2, 1.2, -0.5),
        /Invalid factor.*Must be non-negative/
      );
    });
  });

  describe("getColorAdjustmentInfo", () => {
    it("returns correct info for brightness adjustment", () => {
      const info = getColorAdjustmentInfo(800, 600, 1.2, "brightness");

      assert.equal(info.operation, "brightness");
      assert.equal(info.factor, 1.2);
      assert.equal(info.isIdentity, false);
      assert.equal(info.isValid, true);
      assert.deepEqual(info.outputDimensions, { width: 800, height: 600 });
      assert.equal(info.outputSize, 800 * 600 * 4);
    });

    it("returns correct info for contrast adjustment", () => {
      const info = getColorAdjustmentInfo(800, 600, 1.5, "contrast");

      assert.equal(info.operation, "contrast");
      assert.equal(info.factor, 1.5);
      assert.equal(info.isIdentity, false);
      assert.equal(info.isValid, true);
    });

    it("identifies identity factors", () => {
      const info = getColorAdjustmentInfo(800, 600, 1.0, "brightness");

      assert.equal(info.isIdentity, true);
    });

    it("handles invalid parameters gracefully", () => {
      const info = getColorAdjustmentInfo(-1, 600, 1.2, "brightness");

      assert.equal(info.isValid, false);
      assert.equal(info.outputSize, 0);
    });

    it("handles invalid operations gracefully", () => {
      const info = getColorAdjustmentInfo(800, 600, 1.2, "saturation");

      assert.equal(info.isValid, false);
    });
  });

  describe("createColorAdjustmentPreview", () => {
    it("creates preview for small samples", () => {
      const smallSample = new Uint8Array([128, 128, 128, 255]); // 1x1 gray pixel
      const preview = createColorAdjustmentPreview(smallSample, 1, 1, 1.5, 1.2);

      assert.equal(preview.width, 1);
      assert.equal(preview.height, 1);
      assert.equal(preview.pixels.length, 4);

      // Should be brighter than original
      assert(preview.pixels[0] > 128);
    });

    it("rejects samples that are too large", () => {
      const largeSample = new Uint8Array(65 * 65 * 4); // Too large

      assert.throws(() => createColorAdjustmentPreview(largeSample, 65, 65, 1.2, 1.5), /Sample too large for preview/);
    });
  });

  describe("analyzeBrightness", () => {
    it("analyzes brightness distribution", () => {
      const analysis = analyzeBrightness(testPixels, 2, 2);

      assert.equal(typeof analysis.averageBrightness, "number");
      assert.equal(typeof analysis.minBrightness, "number");
      assert.equal(typeof analysis.maxBrightness, "number");
      assert(analysis.histogram instanceof Uint32Array);
      assert.equal(analysis.histogram.length, 256);

      // Should have reasonable values for our test data
      assert(analysis.averageBrightness >= 64);
      assert(analysis.averageBrightness <= 255);
      assert.equal(analysis.minBrightness, 64); // Darkest pixel
      assert.equal(analysis.maxBrightness, 255); // Brightest pixel
    });

    it("counts pixels correctly in histogram", () => {
      const analysis = analyzeBrightness(testPixels, 2, 2);

      // Should have 4 pixels total
      let totalCount = 0;
      for (let i = 0; i < analysis.histogram.length; i++) {
        totalCount += analysis.histogram[i];
      }
      assert.equal(totalCount, 4);
    });
  });

  describe("Integration", () => {
    it("brightness adjustments produce expected changes", () => {
      // Test that brightness adjustments work in the expected direction
      const brightened = adjustBrightness(testPixels, 2, 2, 1.5, false);
      const darkened = adjustBrightness(testPixels, 2, 2, 0.7, false);

      // Brightened should be brighter than original
      for (let i = 0; i < testPixels.length; i += 4) {
        // Check RGB channels (skip alpha)
        for (let j = 0; j < 3; j++) {
          if (testPixels[i + j] < 255) {
            // Skip pixels that would be clamped
            assert(brightened.pixels[i + j] >= testPixels[i + j]);
          }
          if (testPixels[i + j] > 0) {
            // Skip pixels that would be clamped
            assert(darkened.pixels[i + j] <= testPixels[i + j]);
          }
        }
      }
    });

    it("supports method chaining pattern", () => {
      // Simulate chaining by using result of one adjustment as input to next
      const step1 = adjustBrightness(testPixels, 2, 2, 1.2, false);
      const step2 = adjustContrast(step1.pixels, step1.width, step1.height, 1.3, false);

      // Should have valid dimensions
      assert.equal(step2.width, 2);
      assert.equal(step2.height, 2);
      assert.equal(step2.pixels.length, 2 * 2 * 4);
    });

    it("preserves alpha channel in all operations", () => {
      const withAlpha = new Uint8Array([100, 150, 200, 128]); // Semi-transparent

      const brightened = adjustBrightness(withAlpha, 1, 1, 1.5, false);
      const contrasted = adjustContrast(withAlpha, 1, 1, 1.5, false);
      const combined = adjustBrightnessContrast(withAlpha, 1, 1, 1.2, 1.3, false);

      // Alpha should be preserved in all cases
      assert.equal(brightened.pixels[3], 128);
      assert.equal(contrasted.pixels[3], 128);
      assert.equal(combined.pixels[3], 128);
    });
  });

  describe("Performance", () => {
    it("handles medium images efficiently", () => {
      const mediumPixels = new Uint8Array(200 * 200 * 4);
      mediumPixels.fill(128);

      const brightness = adjustBrightness(mediumPixels, 200, 200, 1.2, false);
      const contrast = adjustContrast(mediumPixels, 200, 200, 1.3, false);
      const combined = adjustBrightnessContrast(mediumPixels, 200, 200, 1.2, 1.3, false);

      assert.equal(brightness.width, 200);
      assert.equal(brightness.height, 200);
      assert.equal(contrast.width, 200);
      assert.equal(contrast.height, 200);
      assert.equal(combined.width, 200);
      assert.equal(combined.height, 200);
    });

    it("in-place operations are efficient", () => {
      const pixels = new Uint8Array(100 * 100 * 4);
      pixels.fill(128);

      const result = adjustBrightness(pixels, 100, 100, 1.2, true);

      // Should return same array reference (no allocation)
      assert.equal(result.pixels, pixels);
      assert.equal(result.width, 100);
      assert.equal(result.height, 100);
    });
  });

  describe("convertToGrayscale", () => {
    it("converts color image to grayscale using luminance", () => {
      const result = convertToGrayscale(testPixels, 2, 2, "luminance", false);

      assert.equal(result.width, 2);
      assert.equal(result.height, 2);
      assert.equal(result.pixels.length, 2 * 2 * 4);

      // Check that RGB channels are equal (grayscale)
      for (let i = 0; i < result.pixels.length; i += 4) {
        const r = result.pixels[i];
        const g = result.pixels[i + 1];
        const b = result.pixels[i + 2];
        const a = result.pixels[i + 3];

        assert.equal(r, g); // R = G
        assert.equal(g, b); // G = B
        assert.equal(a, 255); // Alpha preserved
      }
    });

    it("supports different conversion methods", () => {
      const methods = ["luminance", "average", "desaturate", "max", "min"];

      for (const method of methods) {
        const result = convertToGrayscale(testPixels, 2, 2, method, false);

        assert.equal(result.width, 2);
        assert.equal(result.height, 2);
        assert.equal(result.pixels.length, 2 * 2 * 4);

        // Should be grayscale (R = G = B)
        for (let i = 0; i < result.pixels.length; i += 4) {
          assert.equal(result.pixels[i], result.pixels[i + 1]);
          assert.equal(result.pixels[i + 1], result.pixels[i + 2]);
        }
      }
    });

    it("produces different results for different methods", () => {
      // Use a colorful pixel to see differences
      const colorPixels = new Uint8Array([255, 100, 50, 255]); // Bright red-orange

      const luminance = convertToGrayscale(colorPixels, 1, 1, "luminance", false);
      const average = convertToGrayscale(colorPixels, 1, 1, "average", false);
      const max = convertToGrayscale(colorPixels, 1, 1, "max", false);
      const min = convertToGrayscale(colorPixels, 1, 1, "min", false);

      // Results should be different
      assert.notEqual(luminance.pixels[0], average.pixels[0]);
      assert.notEqual(average.pixels[0], max.pixels[0]);
      assert.notEqual(max.pixels[0], min.pixels[0]);

      // Max should be brightest, min should be darkest
      assert.equal(max.pixels[0], 255); // Max of (255, 100, 50)
      assert.equal(min.pixels[0], 50); // Min of (255, 100, 50)
    });

    it("supports in-place modification", () => {
      // Use colorful pixels that will actually change when converted to grayscale
      const colorPixels = new Uint8Array([
        255,
        100,
        50,
        255, // Red-orange
        50,
        200,
        100,
        255, // Green
        100,
        50,
        255,
        255, // Blue
        200,
        200,
        50,
        255, // Yellow
      ]);
      const original = new Uint8Array(colorPixels);
      const result = convertToGrayscale(colorPixels, 2, 2, "luminance", true);

      // Should return the same array reference
      assert.equal(result.pixels, colorPixels);

      // Original array should be modified
      assert.notDeepEqual(colorPixels, original);
    });

    it("supports creating new array", () => {
      const original = new Uint8Array(testPixels);
      const result = convertToGrayscale(testPixels, 2, 2, "luminance", false);

      // Should return a different array reference
      assert.notEqual(result.pixels, testPixels);

      // Original array should be unchanged
      assert.deepEqual(testPixels, original);
    });

    it("validates parameters", () => {
      assert.throws(() => convertToGrayscale([], 2, 2, "luminance"), /Pixels must be a Uint8Array/);
      assert.throws(() => convertToGrayscale(testPixels, 2, 2, "invalid"), /Invalid grayscale method/);
    });
  });

  describe("getGrayscaleInfo", () => {
    it("returns correct info for grayscale conversion", () => {
      const info = getGrayscaleInfo(800, 600, "luminance");

      assert.equal(info.method, "luminance");
      assert.equal(info.isLossless, false); // Color information is lost
      assert.equal(info.isValid, true);
      assert.deepEqual(info.outputDimensions, { width: 800, height: 600 });
      assert.equal(info.outputSize, 800 * 600 * 4);
      assert(info.description.includes("ITU-R BT.709"));
    });

    it("provides descriptions for all methods", () => {
      const methods = ["luminance", "average", "desaturate", "max", "min"];

      for (const method of methods) {
        const info = getGrayscaleInfo(800, 600, method);
        assert.equal(info.method, method);
        assert(info.description.length > 0);
        assert.equal(info.isValid, true);
      }
    });

    it("handles invalid parameters gracefully", () => {
      const info = getGrayscaleInfo(-1, 600, "luminance");

      assert.equal(info.isValid, false);
      assert.equal(info.outputSize, 0);
    });

    it("handles invalid methods gracefully", () => {
      const info = getGrayscaleInfo(800, 600, "invalid");

      assert.equal(info.isValid, false);
    });
  });

  describe("createGrayscalePreview", () => {
    it("creates preview for small samples", () => {
      const smallSample = new Uint8Array([255, 100, 50, 255]); // 1x1 colorful pixel
      const preview = createGrayscalePreview(smallSample, 1, 1, "luminance");

      assert.equal(preview.width, 1);
      assert.equal(preview.height, 1);
      assert.equal(preview.pixels.length, 4);

      // Should be grayscale
      assert.equal(preview.pixels[0], preview.pixels[1]);
      assert.equal(preview.pixels[1], preview.pixels[2]);
      assert.equal(preview.pixels[3], 255); // Alpha preserved
    });

    it("rejects samples that are too large", () => {
      const largeSample = new Uint8Array(65 * 65 * 4); // Too large

      assert.throws(() => createGrayscalePreview(largeSample, 65, 65, "luminance"), /Sample too large for preview/);
    });
  });

  describe("compareGrayscaleMethods", () => {
    it("compares all grayscale methods", () => {
      const results = compareGrayscaleMethods(testPixels, 2, 2);

      const expectedMethods = ["luminance", "average", "desaturate", "max", "min"];

      // Should have results for all methods
      for (const method of expectedMethods) {
        assert(results[method] instanceof Uint8Array);
        assert.equal(results[method].length, 2 * 2 * 4);
      }
    });

    it("produces different results for different methods", () => {
      // Use colorful test data
      const colorPixels = new Uint8Array([
        255,
        100,
        50,
        255, // Bright red-orange
        50,
        200,
        100,
        255, // Green-ish
        100,
        50,
        255,
        255, // Blue-ish
        200,
        200,
        50,
        255, // Yellow-ish
      ]);

      const results = compareGrayscaleMethods(colorPixels, 2, 2);

      // Results should be different for at least some pixels
      let foundDifference = false;
      for (let i = 0; i < colorPixels.length; i += 4) {
        const luminance = results.luminance[i];
        const average = results.average[i];
        const max = results.max[i];

        if (luminance !== average || average !== max) {
          foundDifference = true;
          break;
        }
      }

      assert(foundDifference, "Different methods should produce different results");
    });
  });

  describe("Grayscale Integration", () => {
    it("grayscale conversion preserves alpha channel", () => {
      const withAlpha = new Uint8Array([255, 100, 50, 128]); // Semi-transparent

      const result = convertToGrayscale(withAlpha, 1, 1, "luminance", false);

      // Alpha should be preserved
      assert.equal(result.pixels[3], 128);
    });

    it("supports method chaining pattern", () => {
      // Simulate chaining by using result of one operation as input to next
      const step1 = adjustBrightness(testPixels, 2, 2, 1.2, false);
      const step2 = convertToGrayscale(step1.pixels, step1.width, step1.height, "luminance", false);

      // Should have valid dimensions
      assert.equal(step2.width, 2);
      assert.equal(step2.height, 2);
      assert.equal(step2.pixels.length, 2 * 2 * 4);

      // Should be grayscale
      for (let i = 0; i < step2.pixels.length; i += 4) {
        assert.equal(step2.pixels[i], step2.pixels[i + 1]);
        assert.equal(step2.pixels[i + 1], step2.pixels[i + 2]);
      }
    });

    it("luminance method produces perceptually accurate results", () => {
      // Test with pure colors - green should be brightest in luminance
      const pureRed = new Uint8Array([255, 0, 0, 255]);
      const pureGreen = new Uint8Array([0, 255, 0, 255]);
      const pureBlue = new Uint8Array([0, 0, 255, 255]);

      const redGray = convertToGrayscale(pureRed, 1, 1, "luminance", false);
      const greenGray = convertToGrayscale(pureGreen, 1, 1, "luminance", false);
      const blueGray = convertToGrayscale(pureBlue, 1, 1, "luminance", false);

      // Green should be brightest, blue should be darkest (human eye sensitivity)
      assert(greenGray.pixels[0] > redGray.pixels[0]);
      assert(redGray.pixels[0] > blueGray.pixels[0]);
    });
  });
});
