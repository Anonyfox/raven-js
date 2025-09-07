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
  applyColorInversionToPixel,
  applyContrast,
  applyGrayscaleToPixel,
  applyHslAdjustmentToPixel,
  applyLookupTableToRGB,
  applySepia,
  applySepiaToPixel,
  applyToRGBAChannels,
  applyToRGBChannels,
  clampColor,
  createColorLookupTable,
  getGrayscaleConverter,
  getPixelIndex,
  hslToRgb,
  invertColor,
  isIdentityFactor,
  rgbToGrayscale,
  rgbToGrayscaleAverage,
  rgbToGrayscaleDesaturate,
  rgbToGrayscaleMax,
  rgbToGrayscaleMin,
  rgbToHsl,
  validateColorInversionParameters,
  validateColorParameters,
  validateFactorBounds,
  validateGrayscaleParameters,
  validateHslAdjustmentParameters,
  validateHslValues,
  validateSepiaParameters,
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

  describe("invertColor", () => {
    it("inverts color values correctly", () => {
      assert.equal(invertColor(0), 255); // Black -> White
      assert.equal(invertColor(255), 0); // White -> Black
      assert.equal(invertColor(128), 127); // Middle gray -> slightly darker
      assert.equal(invertColor(100), 155); // Dark -> Light
      assert.equal(invertColor(200), 55); // Light -> Dark
    });

    it("is reversible", () => {
      const testValues = [0, 50, 100, 128, 200, 255];
      for (const value of testValues) {
        const inverted = invertColor(value);
        const restored = invertColor(inverted);
        assert.equal(restored, value);
      }
    });
  });

  describe("applyColorInversionToPixel", () => {
    it("inverts RGB channels and preserves alpha", () => {
      const pixels = new Uint8Array([100, 150, 200, 255]); // RGBA

      applyColorInversionToPixel(pixels, 0);

      assert.deepEqual(Array.from(pixels), [155, 105, 55, 255]); // RGB inverted, A preserved
    });

    it("preserves alpha channel with different alpha values", () => {
      const pixels = new Uint8Array([100, 150, 200, 128]); // Semi-transparent

      applyColorInversionToPixel(pixels, 0);

      assert.equal(pixels[3], 128); // Alpha preserved
      assert.equal(pixels[0], 155); // Red inverted: 255 - 100 = 155
      assert.equal(pixels[1], 105); // Green inverted: 255 - 150 = 105
      assert.equal(pixels[2], 55); // Blue inverted: 255 - 200 = 55
    });

    it("handles edge cases", () => {
      // Pure black
      const blackPixel = new Uint8Array([0, 0, 0, 255]);
      applyColorInversionToPixel(blackPixel, 0);
      assert.deepEqual(Array.from(blackPixel), [255, 255, 255, 255]); // Black -> White

      // Pure white
      const whitePixel = new Uint8Array([255, 255, 255, 255]);
      applyColorInversionToPixel(whitePixel, 0);
      assert.deepEqual(Array.from(whitePixel), [0, 0, 0, 255]); // White -> Black
    });
  });

  describe("validateColorInversionParameters", () => {
    let validPixels;

    beforeEach(() => {
      validPixels = new Uint8Array(800 * 600 * 4);
    });

    it("accepts valid parameters", () => {
      assert.doesNotThrow(() => {
        validateColorInversionParameters(validPixels, 800, 600);
      });
    });

    it("rejects invalid parameters", () => {
      assert.throws(() => validateColorInversionParameters([], 800, 600), /Pixels must be a Uint8Array/);
      assert.throws(() => validateColorInversionParameters(validPixels, 0, 600), /Invalid width/);
      assert.throws(() => validateColorInversionParameters(validPixels, 800, -1), /Invalid height/);
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
        validateColorInversionParameters(mediumPixels, 200, 200);
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

      // Test color inversion
      for (let i = 0; i < mediumPixels.length; i += 4) {
        applyColorInversionToPixel(mediumPixels, i);
      }

      // Should complete without issues
      assert.equal(mediumPixels.length, 200 * 200 * 4);
    });
  });

  describe("applySepia", () => {
    it("applies sepia transformation correctly", () => {
      // Test with pure white (should become sepia white)
      const [r, g, b] = applySepia(255, 255, 255);

      // Calculate expected sepia values for white
      const expectedR = Math.round(0.393 * 255 + 0.769 * 255 + 0.189 * 255); // ~255 (clamped)
      const expectedG = Math.round(0.349 * 255 + 0.686 * 255 + 0.168 * 255); // ~255 (clamped)
      const expectedB = Math.round(0.272 * 255 + 0.534 * 255 + 0.131 * 255); // ~239

      // For white input, sepia produces very light values that may be clamped
      assert.equal(r, Math.min(255, expectedR));
      assert.equal(g, Math.min(255, expectedG));
      assert.equal(b, Math.min(255, expectedB));

      // Blue should be less than red and green (warmer tone)
      assert(b < Math.max(r, g));

      // All values should be valid
      assert(r >= 0 && r <= 255);
      assert(g >= 0 && g <= 255);
      assert(b >= 0 && b <= 255);
    });

    it("applies sepia transformation to pure colors", () => {
      // Pure red
      const [redR, redG, redB] = applySepia(255, 0, 0);
      assert.equal(redR, Math.round(0.393 * 255)); // Should be ~100
      assert.equal(redG, Math.round(0.349 * 255)); // Should be ~89
      assert.equal(redB, Math.round(0.272 * 255)); // Should be ~69

      // Pure green
      const [greenR, greenG, greenB] = applySepia(0, 255, 0);
      assert.equal(greenR, Math.round(0.769 * 255)); // Should be ~196
      assert.equal(greenG, Math.round(0.686 * 255)); // Should be ~175
      assert.equal(greenB, Math.round(0.534 * 255)); // Should be ~136
    });

    it("handles black correctly", () => {
      const [r, g, b] = applySepia(0, 0, 0);
      assert.equal(r, 0);
      assert.equal(g, 0);
      assert.equal(b, 0);
    });

    it("preserves luminance characteristics", () => {
      // Sepia should maintain relative brightness
      const [darkR, darkG, darkB] = applySepia(50, 50, 50);
      const [lightR, lightG, lightB] = applySepia(200, 200, 200);

      // Light sepia should be brighter than dark sepia
      assert(lightR > darkR);
      assert(lightG > darkG);
      assert(lightB > darkB);
    });

    it("clamps values to valid range", () => {
      // Test with values that might overflow
      const [r, g, b] = applySepia(255, 255, 255);

      assert(r >= 0 && r <= 255);
      assert(g >= 0 && g <= 255);
      assert(b >= 0 && b <= 255);
    });
  });

  describe("applySepiaToPixel", () => {
    it("applies sepia to RGB channels and preserves alpha", () => {
      const pixels = new Uint8Array([100, 150, 200, 255]); // RGBA

      applySepiaToPixel(pixels, 0);

      // Should have sepia-toned RGB values
      const expectedR = Math.round(0.393 * 100 + 0.769 * 150 + 0.189 * 200);
      const expectedG = Math.round(0.349 * 100 + 0.686 * 150 + 0.168 * 200);
      const expectedB = Math.round(0.272 * 100 + 0.534 * 150 + 0.131 * 200);

      assert.equal(pixels[0], expectedR);
      assert.equal(pixels[1], expectedG);
      assert.equal(pixels[2], expectedB);
      assert.equal(pixels[3], 255); // Alpha preserved
    });

    it("preserves alpha channel with different alpha values", () => {
      const pixels = new Uint8Array([100, 150, 200, 128]); // Semi-transparent

      applySepiaToPixel(pixels, 0);

      assert.equal(pixels[3], 128); // Alpha preserved
      // RGB should be transformed
      assert.notEqual(pixels[0], 100);
      assert.notEqual(pixels[1], 150);
      assert.notEqual(pixels[2], 200);
    });

    it("creates warm brown tones", () => {
      const pixels = new Uint8Array([128, 128, 128, 255]); // Middle gray

      applySepiaToPixel(pixels, 0);

      // Sepia should create warm tones (more red/yellow, less blue)
      assert(pixels[0] >= pixels[1]); // Red >= Green
      assert(pixels[1] >= pixels[2]); // Green >= Blue
    });
  });

  describe("validateSepiaParameters", () => {
    let validPixels;

    beforeEach(() => {
      validPixels = new Uint8Array(800 * 600 * 4);
    });

    it("accepts valid parameters", () => {
      assert.doesNotThrow(() => {
        validateSepiaParameters(validPixels, 800, 600);
      });
    });

    it("rejects invalid parameters", () => {
      assert.throws(() => validateSepiaParameters([], 800, 600), /Pixels must be a Uint8Array/);
      assert.throws(() => validateSepiaParameters(validPixels, 0, 600), /Invalid width/);
      assert.throws(() => validateSepiaParameters(validPixels, 800, -1), /Invalid height/);
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
        validateColorInversionParameters(mediumPixels, 200, 200);
        validateSepiaParameters(mediumPixels, 200, 200);
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

      // Test color inversion
      for (let i = 0; i < mediumPixels.length; i += 4) {
        applyColorInversionToPixel(mediumPixels, i);
      }

      // Test sepia effect
      for (let i = 0; i < mediumPixels.length; i += 4) {
        applySepiaToPixel(mediumPixels, i);
      }

      // Should complete without issues
      assert.equal(mediumPixels.length, 200 * 200 * 4);
    });
  });

  describe("rgbToHsl", () => {
    it("converts pure colors correctly", () => {
      // Pure red
      const [redH, redS, redL] = rgbToHsl(255, 0, 0);
      assert.equal(redH, 0); // Red is at 0 degrees
      assert.equal(redS, 100); // Fully saturated
      assert.equal(redL, 50); // Middle lightness

      // Pure green
      const [greenH, greenS, greenL] = rgbToHsl(0, 255, 0);
      assert.equal(greenH, 120); // Green is at 120 degrees
      assert.equal(greenS, 100);
      assert.equal(greenL, 50);

      // Pure blue
      const [blueH, blueS, blueL] = rgbToHsl(0, 0, 255);
      assert.equal(blueH, 240); // Blue is at 240 degrees
      assert.equal(blueS, 100);
      assert.equal(blueL, 50);
    });

    it("converts grayscale colors correctly", () => {
      // Black
      const [blackH, blackS, blackL] = rgbToHsl(0, 0, 0);
      assert.equal(blackH, 0);
      assert.equal(blackS, 0); // No saturation
      assert.equal(blackL, 0); // No lightness

      // White
      const [whiteH, whiteS, whiteL] = rgbToHsl(255, 255, 255);
      assert.equal(whiteH, 0);
      assert.equal(whiteS, 0); // No saturation
      assert.equal(whiteL, 100); // Full lightness

      // Middle gray
      const [grayH, grayS, grayL] = rgbToHsl(128, 128, 128);
      assert.equal(grayH, 0);
      assert.equal(grayS, 0); // No saturation
      assert.equal(grayL, 50); // Middle lightness
    });

    it("handles intermediate colors", () => {
      // Orange (255, 128, 0)
      const [orangeH, orangeS, orangeL] = rgbToHsl(255, 128, 0);
      assert.equal(orangeH, 30); // Orange is around 30 degrees
      assert.equal(orangeS, 100); // Fully saturated
      assert.equal(orangeL, 50); // Middle lightness
    });
  });

  describe("hslToRgb", () => {
    it("converts pure hues correctly", () => {
      // Pure red (0°, 100%, 50%)
      const [redR, redG, redB] = hslToRgb(0, 100, 50);
      assert.equal(redR, 255);
      assert.equal(redG, 0);
      assert.equal(redB, 0);

      // Pure green (120°, 100%, 50%)
      const [greenR, greenG, greenB] = hslToRgb(120, 100, 50);
      assert.equal(greenR, 0);
      assert.equal(greenG, 255);
      assert.equal(greenB, 0);

      // Pure blue (240°, 100%, 50%)
      const [blueR, blueG, blueB] = hslToRgb(240, 100, 50);
      assert.equal(blueR, 0);
      assert.equal(blueG, 0);
      assert.equal(blueB, 255);
    });

    it("converts grayscale correctly", () => {
      // Black (any hue, 0%, 0%)
      const [blackR, blackG, blackB] = hslToRgb(0, 0, 0);
      assert.equal(blackR, 0);
      assert.equal(blackG, 0);
      assert.equal(blackB, 0);

      // White (any hue, 0%, 100%)
      const [whiteR, whiteG, whiteB] = hslToRgb(0, 0, 100);
      assert.equal(whiteR, 255);
      assert.equal(whiteG, 255);
      assert.equal(whiteB, 255);

      // Gray (any hue, 0%, 50%)
      const [grayR, grayG, grayB] = hslToRgb(0, 0, 50);
      assert.equal(grayR, 128);
      assert.equal(grayG, 128);
      assert.equal(grayB, 128);
    });

    it("handles hue wrapping", () => {
      // 360° should be same as 0°
      const [red360R, red360G, red360B] = hslToRgb(360, 100, 50);
      const [red0R, red0G, red0B] = hslToRgb(0, 100, 50);
      assert.equal(red360R, red0R);
      assert.equal(red360G, red0G);
      assert.equal(red360B, red0B);

      // Negative hue should wrap
      const [redNegR, redNegG, redNegB] = hslToRgb(-120, 100, 50);
      const [redPosR, redPosG, redPosB] = hslToRgb(240, 100, 50);
      assert.equal(redNegR, redPosR);
      assert.equal(redNegG, redPosG);
      assert.equal(redNegB, redPosB);
    });

    it("clamps saturation and lightness", () => {
      // Over-saturated should clamp to 100%
      const [overSatR, overSatG, overSatB] = hslToRgb(0, 150, 50);
      const [normalSatR, normalSatG, normalSatB] = hslToRgb(0, 100, 50);
      assert.equal(overSatR, normalSatR);
      assert.equal(overSatG, normalSatG);
      assert.equal(overSatB, normalSatB);

      // Over-lightness should clamp to 100%
      const [overLightR, overLightG, overLightB] = hslToRgb(0, 100, 150);
      assert.equal(overLightR, 255);
      assert.equal(overLightG, 255);
      assert.equal(overLightB, 255);
    });
  });

  describe("RGB ↔ HSL Conversion Roundtrip", () => {
    it("is reversible for pure colors", () => {
      const testColors = [
        [255, 0, 0], // Red
        [0, 255, 0], // Green
        [0, 0, 255], // Blue
        [255, 255, 0], // Yellow
        [255, 0, 255], // Magenta
        [0, 255, 255], // Cyan
      ];

      for (const [r, g, b] of testColors) {
        const [h, s, l] = rgbToHsl(r, g, b);
        const [newR, newG, newB] = hslToRgb(h, s, l);

        // Allow small rounding errors
        assert(Math.abs(newR - r) <= 1, `Red: expected ${r}, got ${newR}`);
        assert(Math.abs(newG - g) <= 1, `Green: expected ${g}, got ${newG}`);
        assert(Math.abs(newB - b) <= 1, `Blue: expected ${b}, got ${newB}`);
      }
    });

    it("is reversible for grayscale", () => {
      const grayValues = [0, 64, 128, 192, 255];

      for (const gray of grayValues) {
        const [h, s, l] = rgbToHsl(gray, gray, gray);
        const [newR, newG, newB] = hslToRgb(h, s, l);

        // Allow small rounding errors for grayscale
        assert(Math.abs(newR - gray) <= 1, `Red: expected ${gray}, got ${newR}`);
        assert(Math.abs(newG - gray) <= 1, `Green: expected ${gray}, got ${newG}`);
        assert(Math.abs(newB - gray) <= 1, `Blue: expected ${gray}, got ${newB}`);
      }
    });
  });

  describe("validateHslValues", () => {
    it("accepts valid HSL values", () => {
      assert.doesNotThrow(() => validateHslValues(0, 0, 0));
      assert.doesNotThrow(() => validateHslValues(360, 100, 100));
      assert.doesNotThrow(() => validateHslValues(180, 50, 50));
    });

    it("rejects invalid hue", () => {
      assert.throws(() => validateHslValues(NaN, 50, 50), /Hue must be a valid number/);
      assert.throws(() => validateHslValues("red", 50, 50), /Hue must be a valid number/);
    });

    it("rejects invalid saturation", () => {
      assert.throws(() => validateHslValues(0, -1, 50), /Saturation must be a number between 0 and 100/);
      assert.throws(() => validateHslValues(0, 101, 50), /Saturation must be a number between 0 and 100/);
      assert.throws(() => validateHslValues(0, NaN, 50), /Saturation must be a number between 0 and 100/);
    });

    it("rejects invalid lightness", () => {
      assert.throws(() => validateHslValues(0, 50, -1), /Lightness must be a number between 0 and 100/);
      assert.throws(() => validateHslValues(0, 50, 101), /Lightness must be a number between 0 and 100/);
      assert.throws(() => validateHslValues(0, 50, NaN), /Lightness must be a number between 0 and 100/);
    });
  });

  describe("validateHslAdjustmentParameters", () => {
    let validPixels;

    beforeEach(() => {
      validPixels = new Uint8Array(800 * 600 * 4);
    });

    it("accepts valid parameters", () => {
      assert.doesNotThrow(() => {
        validateHslAdjustmentParameters(validPixels, 800, 600, 0, 1.0);
        validateHslAdjustmentParameters(validPixels, 800, 600, 180, 1.5);
        validateHslAdjustmentParameters(validPixels, 800, 600, -90, 0.5);
      });
    });

    it("rejects invalid hue shift", () => {
      assert.throws(
        () => validateHslAdjustmentParameters(validPixels, 800, 600, 361, 1.0),
        /Hue shift must be a number between -360 and 360/
      );
      assert.throws(
        () => validateHslAdjustmentParameters(validPixels, 800, 600, -361, 1.0),
        /Hue shift must be a number between -360 and 360/
      );
      assert.throws(
        () => validateHslAdjustmentParameters(validPixels, 800, 600, NaN, 1.0),
        /Hue shift must be a number between -360 and 360/
      );
    });

    it("rejects invalid saturation factor", () => {
      assert.throws(
        () => validateHslAdjustmentParameters(validPixels, 800, 600, 0, -0.1),
        /Saturation factor must be a number between 0.0 and 2.0/
      );
      assert.throws(
        () => validateHslAdjustmentParameters(validPixels, 800, 600, 0, 2.1),
        /Saturation factor must be a number between 0.0 and 2.0/
      );
      assert.throws(
        () => validateHslAdjustmentParameters(validPixels, 800, 600, 0, NaN),
        /Saturation factor must be a number between 0.0 and 2.0/
      );
    });
  });

  describe("applyHslAdjustmentToPixel", () => {
    it("adjusts hue correctly", () => {
      const pixels = new Uint8Array([255, 0, 0, 255]); // Pure red

      // Shift hue by 120 degrees (red -> green)
      applyHslAdjustmentToPixel(pixels, 0, 120, 1.0);

      // Should be close to pure green
      assert(pixels[0] < 50); // Red should be low
      assert(pixels[1] > 200); // Green should be high
      assert(pixels[2] < 50); // Blue should be low
      assert.equal(pixels[3], 255); // Alpha preserved
    });

    it("adjusts saturation correctly", () => {
      const pixels = new Uint8Array([255, 128, 128, 255]); // Light red
      const originalG = pixels[1];
      const originalB = pixels[2];

      // Increase saturation
      applyHslAdjustmentToPixel(pixels, 0, 0, 1.5);

      // Should be more saturated (more red, less green/blue)
      assert(pixels[0] > 200); // Red should remain high
      assert(pixels[1] <= originalG); // Green should not increase
      assert(pixels[2] <= originalB); // Blue should not increase
      assert.equal(pixels[3], 255); // Alpha preserved
    });

    it("preserves alpha channel", () => {
      const pixels = new Uint8Array([100, 150, 200, 128]); // Semi-transparent

      applyHslAdjustmentToPixel(pixels, 0, 45, 1.2);

      assert.equal(pixels[3], 128); // Alpha preserved
    });

    it("handles grayscale pixels", () => {
      const pixels = new Uint8Array([128, 128, 128, 255]); // Gray

      // Hue shift on gray should have no effect
      applyHslAdjustmentToPixel(pixels, 0, 180, 1.0);

      assert.equal(pixels[0], 128);
      assert.equal(pixels[1], 128);
      assert.equal(pixels[2], 128);
      assert.equal(pixels[3], 255);
    });

    it("handles desaturation", () => {
      const pixels = new Uint8Array([255, 0, 0, 255]); // Pure red

      // Complete desaturation
      applyHslAdjustmentToPixel(pixels, 0, 0, 0.0);

      // Should become gray
      assert.equal(pixels[0], pixels[1]);
      assert.equal(pixels[1], pixels[2]);
      assert.equal(pixels[3], 255); // Alpha preserved
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
        validateColorInversionParameters(mediumPixels, 200, 200);
        validateSepiaParameters(mediumPixels, 200, 200);
        validateHslAdjustmentParameters(mediumPixels, 200, 200, 45, 1.3);
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

      // Test color inversion
      for (let i = 0; i < mediumPixels.length; i += 4) {
        applyColorInversionToPixel(mediumPixels, i);
      }

      // Test sepia effect
      for (let i = 0; i < mediumPixels.length; i += 4) {
        applySepiaToPixel(mediumPixels, i);
      }

      // Test HSL adjustment
      for (let i = 0; i < mediumPixels.length; i += 4) {
        applyHslAdjustmentToPixel(mediumPixels, i, 30, 1.2);
      }

      // Should complete without issues
      assert.equal(mediumPixels.length, 200 * 200 * 4);
    });
  });
});
