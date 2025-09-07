/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for color adjustment utility functions.
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import {
  applyBrightness,
  applyBrightnessContrast,
  applyContrast,
  applyGrayscaleToPixel,
  applyLookupTableToRGB,
  applyToRGBAChannels,
  applyToRGBChannels,
  clampColor,
  createColorLookupTable,
  getGrayscaleConverter,
  getPixelIndex,
  isIdentityFactor,
  rgbToGrayscale,
  rgbToGrayscaleAverage,
  rgbToGrayscaleDesaturate,
  rgbToGrayscaleMax,
  rgbToGrayscaleMin,
  validateColorParameters,
  validateFactorBounds,
  validateGrayscaleParameters,
} from "./utils.js";

describe("Color Adjustment Utilities", () => {
  describe("validateColorParameters", () => {
    let validPixels;

    beforeEach(() => {
      validPixels = new Uint8Array(800 * 600 * 4); // 800x600 RGBA
    });

    it("accepts valid parameters", () => {
      assert.doesNotThrow(() => {
        validateColorParameters(validPixels, 800, 600, 1.2);
      });
    });

    it("rejects non-Uint8Array pixels", () => {
      assert.throws(() => validateColorParameters([], 800, 600, 1.2), /Pixels must be a Uint8Array/);
    });

    it("rejects invalid dimensions", () => {
      assert.throws(() => validateColorParameters(validPixels, 0, 600, 1.2), /Invalid width.*Must be positive integer/);
      assert.throws(
        () => validateColorParameters(validPixels, 800, -1, 1.2),
        /Invalid height.*Must be positive integer/
      );
    });

    it("rejects mismatched pixel data size", () => {
      const wrongSizePixels = new Uint8Array(100);
      assert.throws(
        () => validateColorParameters(wrongSizePixels, 800, 600, 1.2),
        /Invalid pixel data size: expected 1920000, got 100/
      );
    });

    it("rejects invalid factors", () => {
      assert.throws(
        () => validateColorParameters(validPixels, 800, 600, "1.2"),
        /Invalid factor.*Must be a finite number/
      );
      assert.throws(
        () => validateColorParameters(validPixels, 800, 600, Number.POSITIVE_INFINITY),
        /Invalid factor.*Must be a finite number/
      );
      assert.throws(() => validateColorParameters(validPixels, 800, 600, -0.5), /Invalid factor.*Must be non-negative/);
    });
  });

  describe("clampColor", () => {
    it("clamps values to 0-255 range", () => {
      assert.equal(clampColor(-10), 0);
      assert.equal(clampColor(0), 0);
      assert.equal(clampColor(128), 128);
      assert.equal(clampColor(255), 255);
      assert.equal(clampColor(300), 255);
    });

    it("rounds fractional values", () => {
      assert.equal(clampColor(127.4), 127);
      assert.equal(clampColor(127.6), 128);
      assert.equal(clampColor(255.9), 255);
    });
  });

  describe("applyBrightness", () => {
    it("applies brightness correctly", () => {
      assert.equal(applyBrightness(100, 1.0), 100); // No change
      assert.equal(applyBrightness(100, 1.5), 150); // 50% brighter
      assert.equal(applyBrightness(100, 0.5), 50); // 50% darker
    });

    it("clamps results to valid range", () => {
      assert.equal(applyBrightness(200, 2.0), 255); // Clamp to max
      assert.equal(applyBrightness(50, 0.0), 0); // Clamp to min
    });

    it("handles edge cases", () => {
      assert.equal(applyBrightness(0, 2.0), 0); // Black stays black
      assert.equal(applyBrightness(255, 1.0), 255); // White unchanged
    });
  });

  describe("applyContrast", () => {
    it("applies contrast correctly", () => {
      assert.equal(applyContrast(128, 1.0), 128); // Middle gray unchanged
      assert.equal(applyContrast(128, 2.0), 128); // Middle gray still unchanged
      assert.equal(applyContrast(192, 2.0), 255); // Bright gets brighter
      assert.equal(applyContrast(64, 2.0), 0); // Dark gets darker
    });

    it("centers around middle gray (128)", () => {
      // Values above 128 should get brighter with higher contrast
      assert(applyContrast(200, 1.5) > 200);
      // Values below 128 should get darker with higher contrast
      assert(applyContrast(50, 1.5) < 50);
    });

    it("reduces contrast correctly", () => {
      // Lower contrast should move values toward middle gray
      assert(applyContrast(200, 0.5) < 200);
      assert(applyContrast(50, 0.5) > 50);
    });
  });

  describe("applyBrightnessContrast", () => {
    it("combines brightness and contrast", () => {
      const value = 100;
      const brightness = 1.2;
      const contrast = 1.5;

      const combined = applyBrightnessContrast(value, brightness, contrast);
      const separate = applyContrast(applyBrightness(value, brightness), contrast);

      // Should be equivalent to applying separately
      assert.equal(combined, separate);
    });

    it("handles identity factors", () => {
      assert.equal(applyBrightnessContrast(150, 1.0, 1.0), 150);
    });
  });

  describe("getPixelIndex", () => {
    it("calculates correct index", () => {
      assert.equal(getPixelIndex(0, 0, 800), 0);
      assert.equal(getPixelIndex(100, 50, 800), 160400);
      assert.equal(getPixelIndex(799, 0, 800), 3196);
    });
  });

  describe("applyToRGBChannels", () => {
    it("applies function to RGB channels only", () => {
      const pixels = new Uint8Array([100, 150, 200, 255]); // RGBA
      const double = (value) => Math.min(255, value * 2);

      applyToRGBChannels(pixels, 0, double);

      assert.deepEqual(Array.from(pixels), [200, 255, 255, 255]); // RGB doubled, A unchanged
    });
  });

  describe("applyToRGBAChannels", () => {
    it("applies function to all RGBA channels", () => {
      const pixels = new Uint8Array([100, 150, 200, 128]); // RGBA
      const double = (value) => Math.min(255, value * 2);

      applyToRGBAChannels(pixels, 0, double);

      assert.deepEqual(Array.from(pixels), [200, 255, 255, 255]); // All channels doubled
    });
  });

  describe("createColorLookupTable", () => {
    it("creates correct lookup table", () => {
      const double = (value) => Math.min(255, value * 2);
      const lut = createColorLookupTable(double);

      assert.equal(lut.length, 256);
      assert.equal(lut[0], 0);
      assert.equal(lut[100], 200);
      assert.equal(lut[128], 255); // Clamped
      assert.equal(lut[255], 255); // Clamped
    });

    it("returns Uint8Array", () => {
      const identity = (value) => value;
      const lut = createColorLookupTable(identity);

      assert(lut instanceof Uint8Array);
    });
  });

  describe("applyLookupTableToRGB", () => {
    it("applies lookup table to RGB channels", () => {
      const pixels = new Uint8Array([100, 150, 200, 255]); // RGBA
      const lut = new Uint8Array(256);

      // Create doubling lookup table
      for (let i = 0; i < 256; i++) {
        lut[i] = Math.min(255, i * 2);
      }

      applyLookupTableToRGB(pixels, 0, lut);

      assert.deepEqual(Array.from(pixels), [200, 255, 255, 255]); // RGB from LUT, A unchanged
    });
  });

  describe("isIdentityFactor", () => {
    it("identifies identity factors", () => {
      assert.equal(isIdentityFactor(1.0), true);
      assert.equal(isIdentityFactor(1.0001), true); // Within tolerance
      assert.equal(isIdentityFactor(0.9999), true); // Within tolerance
    });

    it("rejects non-identity factors", () => {
      assert.equal(isIdentityFactor(1.1), false);
      assert.equal(isIdentityFactor(0.9), false);
      assert.equal(isIdentityFactor(2.0), false);
    });
  });

  describe("validateFactorBounds", () => {
    it("accepts factors within bounds", () => {
      assert.doesNotThrow(() => validateFactorBounds(1.0));
      assert.doesNotThrow(() => validateFactorBounds(5.0));
      assert.doesNotThrow(() => validateFactorBounds(0.1));
    });

    it("rejects factors outside bounds", () => {
      assert.throws(() => validateFactorBounds(-0.1), /Factor -0.1 is outside valid range/);
      assert.throws(() => validateFactorBounds(11), /Factor 11 is outside valid range/);
    });

    it("accepts custom bounds", () => {
      assert.doesNotThrow(() => validateFactorBounds(0.5, 0.5, 2.0));
      assert.throws(() => validateFactorBounds(0.4, 0.5, 2.0), /Factor 0.4 is outside valid range/);
      assert.throws(() => validateFactorBounds(2.1, 0.5, 2.0), /Factor 2.1 is outside valid range/);
    });
  });

  describe("rgbToGrayscale", () => {
    it("converts RGB to grayscale using luminance", () => {
      // Pure colors
      assert.equal(rgbToGrayscale(255, 0, 0), 54); // Red: 0.2126 * 255 ≈ 54
      assert.equal(rgbToGrayscale(0, 255, 0), 182); // Green: 0.7152 * 255 ≈ 182
      assert.equal(rgbToGrayscale(0, 0, 255), 18); // Blue: 0.0722 * 255 ≈ 18

      // Grayscale values
      assert.equal(rgbToGrayscale(128, 128, 128), 128); // Middle gray
      assert.equal(rgbToGrayscale(0, 0, 0), 0); // Black
      assert.equal(rgbToGrayscale(255, 255, 255), 255); // White
    });

    it("uses correct ITU-R BT.709 weights", () => {
      // Test with known values
      const result = rgbToGrayscale(100, 150, 200);
      const expected = Math.round(0.2126 * 100 + 0.7152 * 150 + 0.0722 * 200);
      assert.equal(result, expected);
    });
  });

  describe("rgbToGrayscaleAverage", () => {
    it("converts RGB to grayscale using simple average", () => {
      assert.equal(rgbToGrayscaleAverage(255, 0, 0), 85); // (255 + 0 + 0) / 3 = 85
      assert.equal(rgbToGrayscaleAverage(0, 255, 0), 85); // (0 + 255 + 0) / 3 = 85
      assert.equal(rgbToGrayscaleAverage(0, 0, 255), 85); // (0 + 0 + 255) / 3 = 85
      assert.equal(rgbToGrayscaleAverage(100, 150, 200), 150); // (100 + 150 + 200) / 3 = 150
    });
  });

  describe("rgbToGrayscaleDesaturate", () => {
    it("converts RGB to grayscale using min-max average", () => {
      assert.equal(rgbToGrayscaleDesaturate(100, 150, 200), 150); // (100 + 200) / 2 = 150
      assert.equal(rgbToGrayscaleDesaturate(50, 100, 75), 75); // (50 + 100) / 2 = 75
      assert.equal(rgbToGrayscaleDesaturate(255, 255, 255), 255); // (255 + 255) / 2 = 255
    });
  });

  describe("rgbToGrayscaleMax", () => {
    it("converts RGB to grayscale using maximum value", () => {
      assert.equal(rgbToGrayscaleMax(100, 150, 200), 200);
      assert.equal(rgbToGrayscaleMax(255, 100, 50), 255);
      assert.equal(rgbToGrayscaleMax(0, 0, 0), 0);
    });
  });

  describe("rgbToGrayscaleMin", () => {
    it("converts RGB to grayscale using minimum value", () => {
      assert.equal(rgbToGrayscaleMin(100, 150, 200), 100);
      assert.equal(rgbToGrayscaleMin(255, 100, 50), 50);
      assert.equal(rgbToGrayscaleMin(255, 255, 255), 255);
    });
  });

  describe("validateGrayscaleParameters", () => {
    let validPixels;

    beforeEach(() => {
      validPixels = new Uint8Array(800 * 600 * 4);
    });

    it("accepts valid parameters", () => {
      assert.doesNotThrow(() => {
        validateGrayscaleParameters(validPixels, 800, 600, "luminance");
      });
    });

    it("rejects invalid methods", () => {
      assert.throws(
        () => validateGrayscaleParameters(validPixels, 800, 600, "invalid"),
        /Invalid grayscale method.*Must be one of/
      );
    });

    it("accepts all valid methods", () => {
      const validMethods = ["luminance", "average", "desaturate", "max", "min"];
      for (const method of validMethods) {
        assert.doesNotThrow(() => {
          validateGrayscaleParameters(validPixels, 800, 600, method);
        });
      }
    });
  });

  describe("getGrayscaleConverter", () => {
    it("returns correct converter functions", () => {
      assert.equal(getGrayscaleConverter("luminance"), rgbToGrayscale);
      assert.equal(getGrayscaleConverter("average"), rgbToGrayscaleAverage);
      assert.equal(getGrayscaleConverter("desaturate"), rgbToGrayscaleDesaturate);
      assert.equal(getGrayscaleConverter("max"), rgbToGrayscaleMax);
      assert.equal(getGrayscaleConverter("min"), rgbToGrayscaleMin);
    });

    it("defaults to luminance for unknown methods", () => {
      assert.equal(getGrayscaleConverter("unknown"), rgbToGrayscale);
    });
  });

  describe("applyGrayscaleToPixel", () => {
    it("applies grayscale conversion to RGB channels", () => {
      const pixels = new Uint8Array([100, 150, 200, 255]); // RGBA
      const converter = rgbToGrayscale;

      applyGrayscaleToPixel(pixels, 0, converter);

      const expectedGray = rgbToGrayscale(100, 150, 200);
      assert.deepEqual(Array.from(pixels), [expectedGray, expectedGray, expectedGray, 255]);
    });

    it("preserves alpha channel", () => {
      const pixels = new Uint8Array([100, 150, 200, 128]); // Semi-transparent
      const converter = rgbToGrayscaleAverage;

      applyGrayscaleToPixel(pixels, 0, converter);

      assert.equal(pixels[3], 128); // Alpha preserved
    });
  });

  describe("Performance", () => {
    it("handles medium images efficiently", () => {
      const mediumPixels = new Uint8Array(200 * 200 * 4);
      mediumPixels.fill(128);

      // Test validation
      assert.doesNotThrow(() => {
        validateColorParameters(mediumPixels, 200, 200, 1.2);
        validateGrayscaleParameters(mediumPixels, 200, 200, "luminance");
      });

      // Test lookup table creation
      const lut = createColorLookupTable((value) => applyBrightness(value, 1.2));
      assert.equal(lut.length, 256);

      // Test applying to all pixels
      for (let i = 0; i < mediumPixels.length; i += 4) {
        applyLookupTableToRGB(mediumPixels, i, lut);
      }

      // Test grayscale conversion
      const converter = getGrayscaleConverter("luminance");
      for (let i = 0; i < mediumPixels.length; i += 4) {
        applyGrayscaleToPixel(mediumPixels, i, converter);
      }

      // Should complete without issues
      assert.equal(mediumPixels.length, 200 * 200 * 4);
    });
  });
});
