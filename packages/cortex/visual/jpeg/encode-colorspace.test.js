/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  analyzeConversionQuality,
  applyRounding,
  BT601_COEFFICIENTS,
  BT709_COEFFICIENTS,
  BT2020_COEFFICIENTS,
  COLOR_RANGES,
  COLOR_STANDARDS,
  ConversionMetrics,
  clampValue,
  convertRgbPixelToYcbcr,
  convertRgbToYcbcr,
  DEFAULT_CONVERSION_OPTIONS,
  detectColorRange,
  getConversionCoefficients,
  PRECISION_MODES,
  RANGE_PARAMETERS,
  ROUNDING_MODES,
} from "./encode-colorspace.js";

describe("RGB to YCbCr Color Space Conversion", () => {
  describe("Constants and Definitions", () => {
    it("defines color standards", () => {
      assert.equal(COLOR_STANDARDS.BT601, "bt601");
      assert.equal(COLOR_STANDARDS.BT709, "bt709");
      assert.equal(COLOR_STANDARDS.BT2020, "bt2020");
      assert.equal(COLOR_STANDARDS.SRGB, "srgb");
    });

    it("defines color ranges", () => {
      assert.equal(COLOR_RANGES.FULL, "full");
      assert.equal(COLOR_RANGES.LIMITED, "limited");
      assert.equal(COLOR_RANGES.AUTO, "auto");
    });

    it("defines rounding modes", () => {
      assert.equal(ROUNDING_MODES.NEAREST, "nearest");
      assert.equal(ROUNDING_MODES.FLOOR, "floor");
      assert.equal(ROUNDING_MODES.CEILING, "ceiling");
      assert.equal(ROUNDING_MODES.BANKERS, "bankers");
    });

    it("defines precision modes", () => {
      assert.equal(PRECISION_MODES.HIGH, "high");
      assert.equal(PRECISION_MODES.MEDIUM, "medium");
      assert.equal(PRECISION_MODES.FAST, "fast");
    });

    it("defines conversion coefficients", () => {
      // BT.601 coefficients
      assert(typeof BT601_COEFFICIENTS.YR === "number");
      assert(typeof BT601_COEFFICIENTS.YG === "number");
      assert(typeof BT601_COEFFICIENTS.YB === "number");
      assert.equal(BT601_COEFFICIENTS.CHROMA_OFFSET, 128);

      // BT.709 coefficients
      assert(typeof BT709_COEFFICIENTS.YR === "number");
      assert(typeof BT709_COEFFICIENTS.YG === "number");
      assert(typeof BT709_COEFFICIENTS.YB === "number");
      assert.equal(BT709_COEFFICIENTS.CHROMA_OFFSET, 128);

      // BT.2020 coefficients
      assert(typeof BT2020_COEFFICIENTS.YR === "number");
      assert(typeof BT2020_COEFFICIENTS.YG === "number");
      assert(typeof BT2020_COEFFICIENTS.YB === "number");
      assert.equal(BT2020_COEFFICIENTS.CHROMA_OFFSET, 128);
    });

    it("defines range parameters", () => {
      const fullRange = RANGE_PARAMETERS[COLOR_RANGES.FULL];
      assert.equal(fullRange.yMin, 0);
      assert.equal(fullRange.yMax, 255);
      assert.equal(fullRange.yScale, 1.0);

      const limitedRange = RANGE_PARAMETERS[COLOR_RANGES.LIMITED];
      assert.equal(limitedRange.yMin, 16);
      assert.equal(limitedRange.yMax, 235);
      assert(limitedRange.yScale < 1.0);
    });

    it("defines default options", () => {
      assert.equal(DEFAULT_CONVERSION_OPTIONS.standard, COLOR_STANDARDS.BT601);
      assert.equal(DEFAULT_CONVERSION_OPTIONS.range, COLOR_RANGES.FULL);
      assert.equal(DEFAULT_CONVERSION_OPTIONS.rounding, ROUNDING_MODES.NEAREST);
      assert.equal(DEFAULT_CONVERSION_OPTIONS.precision, PRECISION_MODES.MEDIUM);
      assert.equal(DEFAULT_CONVERSION_OPTIONS.gamutMapping, true);
      assert.equal(DEFAULT_CONVERSION_OPTIONS.qualityMetrics, false);
    });
  });

  describe("Rounding Functions", () => {
    it("applies nearest rounding", () => {
      assert.equal(applyRounding(2.3, ROUNDING_MODES.NEAREST), 2);
      assert.equal(applyRounding(2.5, ROUNDING_MODES.NEAREST), 3);
      assert.equal(applyRounding(2.7, ROUNDING_MODES.NEAREST), 3);
      assert.equal(applyRounding(-2.3, ROUNDING_MODES.NEAREST), -2);
      assert.equal(applyRounding(-2.7, ROUNDING_MODES.NEAREST), -3);
    });

    it("applies floor rounding", () => {
      assert.equal(applyRounding(2.3, ROUNDING_MODES.FLOOR), 2);
      assert.equal(applyRounding(2.7, ROUNDING_MODES.FLOOR), 2);
      assert.equal(applyRounding(-2.3, ROUNDING_MODES.FLOOR), -3);
      assert.equal(applyRounding(-2.7, ROUNDING_MODES.FLOOR), -3);
    });

    it("applies ceiling rounding", () => {
      assert.equal(applyRounding(2.3, ROUNDING_MODES.CEILING), 3);
      assert.equal(applyRounding(2.7, ROUNDING_MODES.CEILING), 3);
      assert.equal(applyRounding(-2.3, ROUNDING_MODES.CEILING), -2);
      assert.equal(applyRounding(-2.7, ROUNDING_MODES.CEILING), -2);
    });

    it("applies banker's rounding", () => {
      assert.equal(applyRounding(2.5, ROUNDING_MODES.BANKERS), 2); // Round to even
      assert.equal(applyRounding(3.5, ROUNDING_MODES.BANKERS), 4); // Round to even
      assert.equal(applyRounding(2.3, ROUNDING_MODES.BANKERS), 2);
      assert.equal(applyRounding(2.7, ROUNDING_MODES.BANKERS), 3);
      assert.equal(applyRounding(-2.5, ROUNDING_MODES.BANKERS), -2); // Round to even
      assert.equal(applyRounding(-3.5, ROUNDING_MODES.BANKERS), -4); // Round to even
    });

    it("throws on invalid rounding mode", () => {
      assert.throws(() => {
        applyRounding(2.5, "invalid");
      }, /Unknown rounding mode/);
    });

    it("throws on invalid input", () => {
      assert.throws(() => {
        applyRounding("not a number", ROUNDING_MODES.NEAREST);
      }, /Value must be a finite number/);

      assert.throws(() => {
        applyRounding(Number.POSITIVE_INFINITY, ROUNDING_MODES.NEAREST);
      }, /Value must be a finite number/);
    });
  });

  describe("Value Clamping", () => {
    it("clamps values to range", () => {
      assert.equal(clampValue(50, 0, 255), 50);
      assert.equal(clampValue(-10, 0, 255), 0);
      assert.equal(clampValue(300, 0, 255), 255);
    });

    it("applies gamut mapping", () => {
      // Out-of-range values should be compressed rather than hard-clamped
      const belowRange = clampValue(-50, 0, 255, true);
      const aboveRange = clampValue(350, 0, 255, true);

      assert(belowRange > 0); // Should be compressed, not clamped to 0
      assert(belowRange < 127); // Should be in lower half
      assert(aboveRange < 255); // Should be compressed, not clamped to 255
      assert(aboveRange > 127); // Should be in upper half
    });

    it("handles invalid inputs", () => {
      assert.equal(clampValue(Number.NaN, 0, 255), 0);
      assert.equal(clampValue(Number.POSITIVE_INFINITY, 0, 255), 255);
      assert.equal(clampValue(Number.NEGATIVE_INFINITY, 0, 255), 0);
    });
  });

  describe("Conversion Coefficients", () => {
    it("returns BT.601 coefficients", () => {
      const coeff = getConversionCoefficients(COLOR_STANDARDS.BT601);
      assert.equal(coeff, BT601_COEFFICIENTS);
    });

    it("returns BT.709 coefficients", () => {
      const coeff = getConversionCoefficients(COLOR_STANDARDS.BT709);
      assert.equal(coeff, BT709_COEFFICIENTS);
    });

    it("returns BT.2020 coefficients", () => {
      const coeff = getConversionCoefficients(COLOR_STANDARDS.BT2020);
      assert.equal(coeff, BT2020_COEFFICIENTS);
    });

    it("maps sRGB to BT.601", () => {
      const coeff = getConversionCoefficients(COLOR_STANDARDS.SRGB);
      assert.equal(coeff, BT601_COEFFICIENTS);
    });

    it("throws on unsupported standard", () => {
      assert.throws(() => {
        getConversionCoefficients("unknown");
      }, /Unsupported color standard/);
    });
  });

  describe("Color Range Detection", () => {
    it("detects full range content", () => {
      // Create RGB data with full range values
      const rgbData = new Uint8Array([
        0,
        0,
        0,
        255, // Black pixel
        255,
        255,
        255,
        255, // White pixel
        128,
        64,
        192,
        255, // Mid-range pixel
        200,
        100,
        50,
        255, // Another pixel
      ]);

      const range = detectColorRange(rgbData, 4);
      assert.equal(range, COLOR_RANGES.FULL);
    });

    it("detects limited range content", () => {
      // Create RGB data with limited range characteristics
      const rgbData = new Uint8Array([
        16,
        16,
        16,
        255, // Near-black pixel (limited range indicator)
        235,
        235,
        235,
        255, // Near-white pixel (limited range indicator)
        128,
        64,
        192,
        255, // Mid-range pixel
        200,
        100,
        50,
        255, // Another pixel
      ]);

      const range = detectColorRange(rgbData, 4);
      assert.equal(range, COLOR_RANGES.LIMITED);
    });

    it("handles RGB format (3 channels)", () => {
      const rgbData = new Uint8Array([
        0,
        0,
        0, // Black pixel
        255,
        255,
        255, // White pixel
        128,
        64,
        192, // Mid-range pixel
      ]);

      const range = detectColorRange(rgbData, 3);
      assert.equal(range, COLOR_RANGES.FULL);
    });

    it("handles empty data", () => {
      const rgbData = new Uint8Array([]);
      const range = detectColorRange(rgbData, 4);
      assert.equal(range, COLOR_RANGES.FULL);
    });

    it("throws on invalid input", () => {
      assert.throws(() => {
        detectColorRange("not an array", 4);
      }, /RGB data must be Uint8Array or Uint8ClampedArray/);

      assert.throws(() => {
        detectColorRange(new Uint8Array([]), 5);
      }, /Channels must be 3 \(RGB\) or 4 \(RGBA\)/);
    });
  });

  describe("Single Pixel Conversion", () => {
    it("converts RGB to YCbCr with BT.601", () => {
      const result = convertRgbPixelToYcbcr(255, 0, 0, {
        standard: COLOR_STANDARDS.BT601,
      });

      assert(typeof result.y === "number");
      assert(typeof result.cb === "number");
      assert(typeof result.cr === "number");

      // Red pixel should have high Y and Cr, low Cb
      assert(result.y > 50); // Should have decent luminance
      assert(result.cr > 128); // Should have high red chroma
      assert(result.cb < 128); // Should have low blue chroma
    });

    it("converts RGB to YCbCr with BT.709", () => {
      const result = convertRgbPixelToYcbcr(0, 255, 0, {
        standard: COLOR_STANDARDS.BT709,
      });

      // Green pixel should have high Y, low Cb and Cr
      assert(result.y > 150); // Green has high luminance in BT.709
      assert(result.cb < 128); // Should have low blue chroma
      assert(result.cr < 128); // Should have low red chroma
    });

    it("handles different precision modes", () => {
      const rgb = [128, 128, 128];

      const highPrecision = convertRgbPixelToYcbcr(...rgb, {
        precision: PRECISION_MODES.HIGH,
      });

      const mediumPrecision = convertRgbPixelToYcbcr(...rgb, {
        precision: PRECISION_MODES.MEDIUM,
      });

      const fastPrecision = convertRgbPixelToYcbcr(...rgb, {
        precision: PRECISION_MODES.FAST,
      });

      // All should be close for gray pixel
      assert(Math.abs(highPrecision.y - mediumPrecision.y) < 2);
      assert(Math.abs(mediumPrecision.y - fastPrecision.y) < 5);
    });

    it("handles limited range conversion", () => {
      const fullRange = convertRgbPixelToYcbcr(255, 255, 255, {
        range: COLOR_RANGES.FULL,
      });

      const limitedRange = convertRgbPixelToYcbcr(255, 255, 255, {
        range: COLOR_RANGES.LIMITED,
      });

      // Limited range should have lower maximum values
      assert(limitedRange.y < fullRange.y);
      assert.equal(limitedRange.y, 235); // Limited range white
    });

    it("applies different rounding modes", () => {
      // Use values that will produce fractional results
      const nearest = convertRgbPixelToYcbcr(100, 150, 200, {
        rounding: ROUNDING_MODES.NEAREST,
      });

      const floor = convertRgbPixelToYcbcr(100, 150, 200, {
        rounding: ROUNDING_MODES.FLOOR,
      });

      const ceiling = convertRgbPixelToYcbcr(100, 150, 200, {
        rounding: ROUNDING_MODES.CEILING,
      });

      // Floor should be <= nearest <= ceiling
      assert(floor.y <= nearest.y);
      assert(nearest.y <= ceiling.y);
    });

    it("throws on invalid RGB values", () => {
      assert.throws(() => {
        convertRgbPixelToYcbcr("not a number", 0, 0);
      }, /RGB components must be numbers/);
    });
  });

  describe("Batch Image Conversion", () => {
    /**
     * Create test RGB image data.
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @param {number} channels - Number of channels
     * @returns {Uint8Array} RGB image data
     */
    function createTestRgbData(width, height, channels = 4) {
      const pixelCount = width * height;
      const data = new Uint8Array(pixelCount * channels);

      for (let i = 0; i < pixelCount; i++) {
        const offset = i * channels;
        // Create gradient pattern
        data[offset] = (i % width) * (255 / width); // R
        data[offset + 1] = Math.floor(i / width) * (255 / height); // G
        data[offset + 2] = (i % 128) * 2; // B
        if (channels === 4) {
          data[offset + 3] = 255; // A
        }
      }

      return data;
    }

    it("converts RGBA image to YCbCr", () => {
      const width = 8;
      const height = 8;
      const rgbData = createTestRgbData(width, height, 4);

      const result = convertRgbToYcbcr(rgbData, width, height, 4);

      assert(result.yData instanceof Uint8Array);
      assert(result.cbData instanceof Uint8Array);
      assert(result.crData instanceof Uint8Array);
      assert.equal(result.yData.length, width * height);
      assert.equal(result.cbData.length, width * height);
      assert.equal(result.crData.length, width * height);

      // Check metadata
      assert(typeof result.metadata === "object");
      assert.equal(result.metadata.pixelsConverted, width * height);
      assert(typeof result.metadata.conversionTime === "number");
    });

    it("converts RGB image to YCbCr", () => {
      const width = 4;
      const height = 4;
      const rgbData = createTestRgbData(width, height, 3);

      const result = convertRgbToYcbcr(rgbData, width, height, 3);

      assert.equal(result.yData.length, width * height);
      assert.equal(result.cbData.length, width * height);
      assert.equal(result.crData.length, width * height);
    });

    it("auto-detects color range", () => {
      const width = 4;
      const height = 4;
      const rgbData = createTestRgbData(width, height, 4);

      const result = convertRgbToYcbcr(rgbData, width, height, 4, {
        range: COLOR_RANGES.AUTO,
      });

      // Range should be detected and set in metadata
      assert(result.metadata.range === COLOR_RANGES.FULL || result.metadata.range === COLOR_RANGES.LIMITED);
    });

    it("tracks out-of-gamut pixels", () => {
      // Create data that will produce out-of-gamut values
      const rgbData = new Uint8Array([
        255,
        0,
        0,
        255, // Pure red
        0,
        255,
        0,
        255, // Pure green
        0,
        0,
        255,
        255, // Pure blue
        255,
        255,
        255,
        255, // White
      ]);

      const result = convertRgbToYcbcr(rgbData, 2, 2, 4, {
        gamutMapping: false, // Disable gamut mapping to see clamping
      });

      assert(typeof result.metadata.outOfGamutPixels === "number");
    });

    it("validates input parameters", () => {
      const rgbData = new Uint8Array([255, 0, 0, 255]);

      assert.throws(() => {
        convertRgbToYcbcr("not an array", 1, 1, 4);
      }, /RGB data must be Uint8Array or Uint8ClampedArray/);

      assert.throws(() => {
        convertRgbToYcbcr(rgbData, 0, 1, 4);
      }, /Width must be positive integer/);

      assert.throws(() => {
        convertRgbToYcbcr(rgbData, 1, -1, 4);
      }, /Height must be positive integer/);

      assert.throws(() => {
        convertRgbToYcbcr(rgbData, 1, 1, 2);
      }, /Channels must be 3 \(RGB\) or 4 \(RGBA\)/);

      assert.throws(() => {
        convertRgbToYcbcr(new Uint8Array([255, 0]), 1, 1, 4);
      }, /Insufficient RGB data/);
    });

    it("handles different precision modes efficiently", () => {
      const width = 10;
      const height = 10;
      const rgbData = createTestRgbData(width, height, 4);

      const fastResult = convertRgbToYcbcr(rgbData, width, height, 4, {
        precision: PRECISION_MODES.FAST,
      });

      const mediumResult = convertRgbToYcbcr(rgbData, width, height, 4, {
        precision: PRECISION_MODES.MEDIUM,
      });

      // Fast mode should generally be faster (though timing may vary)
      // Results should be reasonably close
      const maxDifference = Math.max(
        ...Array.from({ length: width * height }, (_, i) => Math.abs(fastResult.yData[i] - mediumResult.yData[i]))
      );

      assert(maxDifference < 10); // Should be reasonably close
    });
  });

  describe("Conversion Metrics", () => {
    it("creates metrics analyzer", () => {
      const metrics = new ConversionMetrics();

      assert.equal(metrics.conversionsPerformed, 0);
      assert.equal(metrics.totalPixelsConverted, 0);
      assert.equal(metrics.totalOutOfGamutPixels, 0);
      assert.equal(metrics.totalConversionTime, 0);
      assert.deepEqual(metrics.standardUsage, {});
      assert.deepEqual(metrics.rangeUsage, {});
      assert.deepEqual(metrics.errors, []);
    });

    it("records conversion operations", () => {
      const metrics = new ConversionMetrics();

      const metadata = {
        standard: COLOR_STANDARDS.BT601,
        range: COLOR_RANGES.FULL,
        precision: PRECISION_MODES.MEDIUM,
        pixelsConverted: 100,
        outOfGamutPixels: 5,
        conversionTime: 10.5,
      };

      metrics.recordConversion(metadata);

      assert.equal(metrics.conversionsPerformed, 1);
      assert.equal(metrics.totalPixelsConverted, 100);
      assert.equal(metrics.totalOutOfGamutPixels, 5);
      assert.equal(metrics.totalConversionTime, 10.5);
      assert.equal(metrics.standardUsage[COLOR_STANDARDS.BT601], 1);
      assert.equal(metrics.rangeUsage[COLOR_RANGES.FULL], 1);
    });

    it("records errors", () => {
      const metrics = new ConversionMetrics();

      metrics.recordError("Test error 1");
      metrics.recordError("Test error 2");

      assert.equal(metrics.errors.length, 2);
      assert.equal(metrics.errors[0], "Test error 1");
      assert.equal(metrics.errors[1], "Test error 2");
    });

    it("generates summary statistics", () => {
      const metrics = new ConversionMetrics();

      metrics.recordConversion({
        standard: COLOR_STANDARDS.BT601,
        range: COLOR_RANGES.FULL,
        precision: PRECISION_MODES.MEDIUM,
        pixelsConverted: 100,
        outOfGamutPixels: 2,
        conversionTime: 5,
      });

      metrics.recordConversion({
        standard: COLOR_STANDARDS.BT709,
        range: COLOR_RANGES.LIMITED,
        precision: PRECISION_MODES.HIGH,
        pixelsConverted: 200,
        outOfGamutPixels: 8,
        conversionTime: 15,
      });

      metrics.recordError("Test error");

      const summary = metrics.getSummary();

      assert.equal(summary.conversionsPerformed, 2);
      assert.equal(summary.totalPixelsConverted, 300);
      assert.equal(summary.averagePixelsPerConversion, 150);
      assert.equal(summary.outOfGamutRatio, 3.33); // 10/300 * 100 = 3.33%
      assert.equal(summary.averageConversionTime, 10);
      assert.equal(summary.errorCount, 1);
      assert(summary.description.includes("2 conversions"));
    });

    it("resets metrics", () => {
      const metrics = new ConversionMetrics();

      metrics.recordConversion({
        standard: COLOR_STANDARDS.BT601,
        range: COLOR_RANGES.FULL,
        precision: PRECISION_MODES.MEDIUM,
        pixelsConverted: 100,
        outOfGamutPixels: 0,
        conversionTime: 5,
      });

      metrics.recordError("Test error");

      assert.equal(metrics.conversionsPerformed, 1);
      assert.equal(metrics.errors.length, 1);

      metrics.reset();

      assert.equal(metrics.conversionsPerformed, 0);
      assert.equal(metrics.errors.length, 0);
      assert.deepEqual(metrics.standardUsage, {});
    });
  });

  describe("Quality Analysis", () => {
    it("analyzes conversion quality", () => {
      // Create test data
      const width = 4;
      const height = 4;
      const rgbData = new Uint8Array([
        0,
        0,
        0,
        255, // Black
        128,
        128,
        128,
        255, // Gray
        255,
        255,
        255,
        255, // White
        255,
        0,
        0,
        255, // Red
        0,
        255,
        0,
        255, // Green
        0,
        0,
        255,
        255, // Blue
        255,
        255,
        0,
        255, // Yellow
        255,
        0,
        255,
        255, // Magenta
        0,
        255,
        255,
        255, // Cyan
        64,
        64,
        64,
        255, // Dark gray
        192,
        192,
        192,
        255, // Light gray
        128,
        64,
        32,
        255, // Brown
        200,
        150,
        100,
        255, // Tan
        50,
        100,
        150,
        255, // Blue-gray
        150,
        50,
        100,
        255, // Maroon
        100,
        150,
        50,
        255, // Olive
      ]);

      const ycbcrData = convertRgbToYcbcr(rgbData, width, height, 4);
      const analysis = analyzeConversionQuality(rgbData, ycbcrData, width, height);

      assert(typeof analysis === "object");
      assert(typeof analysis.luminanceRange === "object");
      assert(typeof analysis.luminanceRange.min === "number");
      assert(typeof analysis.luminanceRange.max === "number");
      assert(typeof analysis.luminanceRange.mean === "number");

      assert(typeof analysis.chromaRange === "object");
      assert(typeof analysis.chromaRange.cbMin === "number");
      assert(typeof analysis.chromaRange.cbMax === "number");

      assert(typeof analysis.dynamicRange === "number");
      assert(typeof analysis.gamutUtilization === "number");
      assert(typeof analysis.qualityScore === "number");
      assert(Array.isArray(analysis.recommendations));

      // Quality score should be reasonable
      assert(analysis.qualityScore >= 0);
      assert(analysis.qualityScore <= 100);

      // Dynamic range should be positive
      assert(analysis.dynamicRange >= 0);
      assert(analysis.gamutUtilization >= 0);
      assert(analysis.gamutUtilization <= 1);
    });

    it("provides quality recommendations", () => {
      // Create low dynamic range data
      const width = 2;
      const height = 2;
      const lowDynamicRgb = new Uint8Array([
        100, 100, 100, 255, 110, 110, 110, 255, 105, 105, 105, 255, 115, 115, 115, 255,
      ]);

      const ycbcrData = convertRgbToYcbcr(lowDynamicRgb, width, height, 4);
      const analysis = analyzeConversionQuality(lowDynamicRgb, ycbcrData, width, height);

      // Should recommend improvements for low dynamic range
      assert(analysis.recommendations.length > 0);
      assert(analysis.dynamicRange < 100);
      assert(analysis.qualityScore < 100);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles extreme RGB values", () => {
      const extremeValues = [
        [0, 0, 0], // Pure black
        [255, 255, 255], // Pure white
        [255, 0, 0], // Pure red
        [0, 255, 0], // Pure green
        [0, 0, 255], // Pure blue
      ];

      for (const [r, g, b] of extremeValues) {
        const result = convertRgbPixelToYcbcr(r, g, b);

        assert(result.y >= 0 && result.y <= 255);
        assert(result.cb >= 0 && result.cb <= 255);
        assert(result.cr >= 0 && result.cr <= 255);
      }
    });

    it("handles large image conversion", () => {
      const width = 100;
      const height = 100;
      const rgbData = new Uint8Array(width * height * 4);

      // Fill with gradient
      for (let i = 0; i < width * height; i++) {
        const offset = i * 4;
        rgbData[offset] = i % 256; // R
        rgbData[offset + 1] = (i * 2) % 256; // G
        rgbData[offset + 2] = (i * 3) % 256; // B
        rgbData[offset + 3] = 255; // A
      }

      const result = convertRgbToYcbcr(rgbData, width, height, 4);

      assert.equal(result.yData.length, width * height);
      assert.equal(result.cbData.length, width * height);
      assert.equal(result.crData.length, width * height);
      assert(result.metadata.conversionTime > 0);
    });

    it("handles single pixel images", () => {
      const rgbData = new Uint8Array([128, 64, 192, 255]);
      const result = convertRgbToYcbcr(rgbData, 1, 1, 4);

      assert.equal(result.yData.length, 1);
      assert.equal(result.cbData.length, 1);
      assert.equal(result.crData.length, 1);
    });

    it("handles Uint8ClampedArray input", () => {
      const rgbData = new Uint8ClampedArray([255, 128, 64, 255]);
      const result = convertRgbToYcbcr(rgbData, 1, 1, 4);

      assert(result.yData instanceof Uint8Array);
      assert(result.cbData instanceof Uint8Array);
      assert(result.crData instanceof Uint8Array);
    });

    it("maintains precision across different standards", () => {
      const testPixel = [128, 128, 128]; // Gray pixel

      const bt601Result = convertRgbPixelToYcbcr(...testPixel, {
        standard: COLOR_STANDARDS.BT601,
      });

      const bt709Result = convertRgbPixelToYcbcr(...testPixel, {
        standard: COLOR_STANDARDS.BT709,
      });

      // Gray pixel should be similar across standards but not identical
      assert(Math.abs(bt601Result.y - bt709Result.y) < 10);
      assert(Math.abs(bt601Result.cb - 128) < 5); // Should be near neutral
      assert(Math.abs(bt601Result.cr - 128) < 5); // Should be near neutral
    });

    it("handles conversion with all options", () => {
      const rgbData = new Uint8Array([255, 128, 64, 255]);

      const result = convertRgbToYcbcr(rgbData, 1, 1, 4, {
        standard: COLOR_STANDARDS.BT709,
        range: COLOR_RANGES.LIMITED,
        rounding: ROUNDING_MODES.BANKERS,
        precision: PRECISION_MODES.HIGH,
        gamutMapping: true,
        qualityMetrics: true,
      });

      assert.equal(result.metadata.standard, COLOR_STANDARDS.BT709);
      assert.equal(result.metadata.range, COLOR_RANGES.LIMITED);
      assert.equal(result.metadata.rounding, ROUNDING_MODES.BANKERS);
      assert.equal(result.metadata.precision, PRECISION_MODES.HIGH);
      assert.equal(result.metadata.gamutMapping, true);
    });
  });
});
