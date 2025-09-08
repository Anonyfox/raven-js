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
  CHROMA_CENTER,
  COLOR_RANGES,
  COLOR_STANDARDS,
  ColorSpaceMetrics,
  clampRgb,
  clampYcbcr,
  convertRgbToYcbcrInterleaved,
  convertRgbToYcbcrPlanar,
  convertYcbcrToRgbInterleaved,
  convertYcbcrToRgbPlanar,
  getColorConversionSummary,
  RGB_MAX,
  RGB_MIN,
  ROUNDING_MODES,
  rgbToYcbcr,
  ycbcrToRgb,
} from "./colorspace-convert.js";

describe("YCbCr ↔ RGB Color Space Conversion", () => {
  describe("Constants and Standards", () => {
    it("defines correct RGB bounds", () => {
      assert.equal(RGB_MIN, 0);
      assert.equal(RGB_MAX, 255);
      assert.equal(CHROMA_CENTER, 128);
    });

    it("defines color standards", () => {
      assert(COLOR_STANDARDS.BT601);
      assert(COLOR_STANDARDS.BT709);

      // Check BT.601 coefficients
      const bt601 = COLOR_STANDARDS.BT601;
      assert.equal(bt601.rgbToYcbcr.yr, 0.299);
      assert.equal(bt601.rgbToYcbcr.yg, 0.587);
      assert.equal(bt601.rgbToYcbcr.yb, 0.114);

      // Sum should be 1.0 for luminance coefficients
      const ySum = bt601.rgbToYcbcr.yr + bt601.rgbToYcbcr.yg + bt601.rgbToYcbcr.yb;
      assert(Math.abs(ySum - 1.0) < 0.001);
    });

    it("defines color ranges", () => {
      assert(COLOR_RANGES.FULL);
      assert(COLOR_RANGES.LIMITED);

      const full = COLOR_RANGES.FULL;
      assert.equal(full.yMin, 0);
      assert.equal(full.yMax, 255);
      assert.equal(full.cCenter, 128);

      const limited = COLOR_RANGES.LIMITED;
      assert.equal(limited.yMin, 16);
      assert.equal(limited.yMax, 235);
      assert.equal(limited.cMin, 16);
      assert.equal(limited.cMax, 240);
    });

    it("defines rounding modes", () => {
      assert.equal(ROUNDING_MODES.NEAREST, "nearest");
      assert.equal(ROUNDING_MODES.TRUNCATE, "truncate");
      assert.equal(ROUNDING_MODES.BANKERS, "bankers");
    });
  });

  describe("Clamping Functions", () => {
    it("clamps RGB values", () => {
      assert.equal(clampRgb(-10), 0);
      assert.equal(clampRgb(0), 0);
      assert.equal(clampRgb(128), 128);
      assert.equal(clampRgb(255), 255);
      assert.equal(clampRgb(300), 255);
    });

    it("clamps YCbCr values", () => {
      assert.equal(clampYcbcr(10, 16, 235), 16);
      assert.equal(clampYcbcr(100, 16, 235), 100);
      assert.equal(clampYcbcr(250, 16, 235), 235);
    });
  });

  describe("Single Pixel RGB → YCbCr", () => {
    it("converts pure black", () => {
      const result = rgbToYcbcr(0, 0, 0);

      assert.equal(result.y, 0);
      assert.equal(result.cb, 128);
      assert.equal(result.cr, 128);
    });

    it("converts pure white", () => {
      const result = rgbToYcbcr(255, 255, 255);

      assert.equal(result.y, 255);
      assert.equal(result.cb, 128);
      assert.equal(result.cr, 128);
    });

    it("converts pure red", () => {
      const result = rgbToYcbcr(255, 0, 0);

      // Red should have high luminance from R coefficient
      assert(result.y > 0);
      // Should have low Cb (blue chroma)
      assert(result.cb < 128);
      // Should have high Cr (red chroma)
      assert(result.cr > 128);
    });

    it("converts pure green", () => {
      const result = rgbToYcbcr(0, 255, 0);

      // Green should have highest luminance (largest Y coefficient)
      assert(result.y > 100);
      // Should have low Cb and Cr
      assert(result.cb < 128);
      assert(result.cr < 128);
    });

    it("converts pure blue", () => {
      const result = rgbToYcbcr(0, 0, 255);

      // Blue should have low luminance
      assert(result.y < 50);
      // Should have high Cb (blue chroma)
      assert(result.cb > 128);
      // Should have low Cr
      assert(result.cr < 128);
    });

    it("uses different color standards", () => {
      const bt601 = rgbToYcbcr(128, 128, 128, "BT601");
      const bt709 = rgbToYcbcr(128, 128, 128, "BT709");

      // Gray should be same in both standards
      assert.equal(bt601.y, bt709.y);
      assert.equal(bt601.cb, bt709.cb);
      assert.equal(bt601.cr, bt709.cr);

      // But different for colored pixels
      const bt601Red = rgbToYcbcr(255, 0, 0, "BT601");
      const bt709Red = rgbToYcbcr(255, 0, 0, "BT709");

      // Should have different luminance due to different coefficients
      assert.notEqual(bt601Red.y, bt709Red.y);
    });

    it("handles different rounding modes", () => {
      // Use values that will produce fractional results
      const nearest = rgbToYcbcr(100, 150, 200, "BT601", "FULL", ROUNDING_MODES.NEAREST);
      const truncate = rgbToYcbcr(100, 150, 200, "BT601", "FULL", ROUNDING_MODES.TRUNCATE);
      const bankers = rgbToYcbcr(100, 150, 200, "BT601", "FULL", ROUNDING_MODES.BANKERS);

      // Results should be valid
      assert(nearest.y >= 0 && nearest.y <= 255);
      assert(truncate.y >= 0 && truncate.y <= 255);
      assert(bankers.y >= 0 && bankers.y <= 255);
    });

    it("throws on invalid inputs", () => {
      assert.throws(() => {
        rgbToYcbcr(-1, 128, 128);
      }, /RGB components must be in range 0-255/);

      assert.throws(() => {
        rgbToYcbcr(128, 128, 300);
      }, /RGB components must be in range 0-255/);

      assert.throws(() => {
        rgbToYcbcr("128", 128, 128);
      }, /RGB components must be numbers/);

      assert.throws(() => {
        rgbToYcbcr(128, 128, 128, "INVALID");
      }, /Unknown color standard/);

      assert.throws(() => {
        rgbToYcbcr(128, 128, 128, "BT601", "INVALID");
      }, /Unknown color range/);
    });
  });

  describe("Single Pixel YCbCr → RGB", () => {
    it("converts neutral gray", () => {
      const result = ycbcrToRgb(128, 128, 128);

      // Neutral chroma should produce gray
      assert(Math.abs(result.r - result.g) <= 1);
      assert(Math.abs(result.g - result.b) <= 1);
      assert(Math.abs(result.r - result.b) <= 1);
    });

    it("converts black", () => {
      const result = ycbcrToRgb(0, 128, 128);

      assert.equal(result.r, 0);
      assert.equal(result.g, 0);
      assert.equal(result.b, 0);
    });

    it("converts white", () => {
      const result = ycbcrToRgb(255, 128, 128);

      assert.equal(result.r, 255);
      assert.equal(result.g, 255);
      assert.equal(result.b, 255);
    });

    it("handles high Cr (red chroma)", () => {
      const result = ycbcrToRgb(128, 128, 200);

      // High Cr should increase red, decrease green
      assert(result.r > 128);
      assert(result.g < 128);
    });

    it("handles high Cb (blue chroma)", () => {
      const result = ycbcrToRgb(128, 200, 128);

      // High Cb should increase blue, decrease green
      assert(result.b > 128);
      assert(result.g < 128);
    });

    it("clamps out-of-range values", () => {
      // Extreme chroma values that would produce out-of-range RGB
      const result = ycbcrToRgb(255, 255, 255);

      // All values should be clamped to valid RGB range
      assert(result.r >= 0 && result.r <= 255);
      assert(result.g >= 0 && result.g <= 255);
      assert(result.b >= 0 && result.b <= 255);
    });

    it("throws on invalid inputs", () => {
      assert.throws(() => {
        ycbcrToRgb("128", 128, 128);
      }, /YCbCr components must be numbers/);

      assert.throws(() => {
        ycbcrToRgb(128, 128, 128, "INVALID");
      }, /Unknown color standard/);
    });
  });

  describe("Round-trip Conversion", () => {
    it("preserves black", () => {
      const original = { r: 0, g: 0, b: 0 };
      const ycbcr = rgbToYcbcr(original.r, original.g, original.b);
      const recovered = ycbcrToRgb(ycbcr.y, ycbcr.cb, ycbcr.cr);

      assert.equal(recovered.r, original.r);
      assert.equal(recovered.g, original.g);
      assert.equal(recovered.b, original.b);
    });

    it("preserves white", () => {
      const original = { r: 255, g: 255, b: 255 };
      const ycbcr = rgbToYcbcr(original.r, original.g, original.b);
      const recovered = ycbcrToRgb(ycbcr.y, ycbcr.cb, ycbcr.cr);

      assert.equal(recovered.r, original.r);
      assert.equal(recovered.g, original.g);
      assert.equal(recovered.b, original.b);
    });

    it("preserves gray values", () => {
      for (let gray = 0; gray <= 255; gray += 32) {
        const original = { r: gray, g: gray, b: gray };
        const ycbcr = rgbToYcbcr(original.r, original.g, original.b);
        const recovered = ycbcrToRgb(ycbcr.y, ycbcr.cb, ycbcr.cr);

        // Gray should be preserved exactly
        assert(Math.abs(recovered.r - original.r) <= 1);
        assert(Math.abs(recovered.g - original.g) <= 1);
        assert(Math.abs(recovered.b - original.b) <= 1);
      }
    });

    it("has minimal error for typical colors", () => {
      const testColors = [
        [255, 0, 0], // Red
        [0, 255, 0], // Green
        [0, 0, 255], // Blue
        [255, 255, 0], // Yellow
        [255, 0, 255], // Magenta
        [0, 255, 255], // Cyan
        [128, 64, 192], // Purple
        [64, 128, 96], // Olive
      ];

      for (const [r, g, b] of testColors) {
        const ycbcr = rgbToYcbcr(r, g, b);
        const recovered = ycbcrToRgb(ycbcr.y, ycbcr.cb, ycbcr.cr);

        // Should have minimal rounding error
        assert(Math.abs(recovered.r - r) <= 2);
        assert(Math.abs(recovered.g - g) <= 2);
        assert(Math.abs(recovered.b - b) <= 2);
      }
    });
  });

  describe("Planar Image Conversion", () => {
    it("converts RGB to YCbCr planar", () => {
      // 2x2 test image: red, green, blue, white
      const rgbData = new Uint8Array([
        255,
        0,
        0, // Red
        0,
        255,
        0, // Green
        0,
        0,
        255, // Blue
        255,
        255,
        255, // White
      ]);

      const result = convertRgbToYcbcrPlanar(rgbData, 2, 2);

      assert.equal(result.y.length, 4);
      assert.equal(result.cb.length, 4);
      assert.equal(result.cr.length, 4);

      // White pixel should have high Y, neutral chroma
      assert.equal(result.y[3], 255);
      assert.equal(result.cb[3], 128);
      assert.equal(result.cr[3], 128);
    });

    it("converts YCbCr planar to RGB", () => {
      // Create test YCbCr data
      const yData = new Uint8Array([0, 128, 255, 76]); // Black, gray, white, typical
      const cbData = new Uint8Array([128, 128, 128, 85]); // Neutral, neutral, neutral, blue-ish
      const crData = new Uint8Array([128, 128, 128, 255]); // Neutral, neutral, neutral, red-ish

      const result = convertYcbcrToRgbPlanar(yData, cbData, crData, 2, 2);

      assert.equal(result.length, 12); // 4 pixels * 3 components

      // Black pixel
      assert.equal(result[0], 0); // R
      assert.equal(result[1], 0); // G
      assert.equal(result[2], 0); // B

      // White pixel
      assert.equal(result[6], 255); // R
      assert.equal(result[7], 255); // G
      assert.equal(result[8], 255); // B
    });

    it("handles round-trip planar conversion", () => {
      // Create test RGB image
      const originalRgb = new Uint8Array([
        255,
        0,
        0, // Red
        0,
        255,
        0, // Green
        0,
        0,
        255, // Blue
        128,
        128,
        128, // Gray
      ]);

      // Convert to YCbCr and back
      const ycbcr = convertRgbToYcbcrPlanar(originalRgb, 2, 2);
      const recoveredRgb = convertYcbcrToRgbPlanar(ycbcr.y, ycbcr.cb, ycbcr.cr, 2, 2);

      assert.equal(recoveredRgb.length, originalRgb.length);

      // Check that conversion is reasonably accurate
      for (let i = 0; i < originalRgb.length; i++) {
        assert(Math.abs(recoveredRgb[i] - originalRgb[i]) <= 2);
      }
    });

    it("throws on invalid planar inputs", () => {
      const rgbData = new Uint8Array([255, 0, 0]);

      assert.throws(() => {
        convertRgbToYcbcrPlanar(rgbData, 0, 1);
      }, /Width and height must be positive/);

      assert.throws(() => {
        convertRgbToYcbcrPlanar(rgbData, 2, 2);
      }, /doesn't match dimensions/);

      assert.throws(() => {
        convertRgbToYcbcrPlanar([255, 0, 0], 1, 1);
      }, /RGB data must be Uint8Array/);
    });
  });

  describe("Interleaved Image Conversion", () => {
    it("converts RGB to YCbCr interleaved", () => {
      const rgbData = new Uint8Array([255, 255, 255, 0, 0, 0]); // White, black

      const result = convertRgbToYcbcrInterleaved(rgbData, 2, 1);

      assert.equal(result.length, 6);

      // White pixel
      assert.equal(result[0], 255); // Y
      assert.equal(result[1], 128); // Cb
      assert.equal(result[2], 128); // Cr

      // Black pixel
      assert.equal(result[3], 0); // Y
      assert.equal(result[4], 128); // Cb
      assert.equal(result[5], 128); // Cr
    });

    it("converts YCbCr interleaved to RGB", () => {
      const ycbcrData = new Uint8Array([255, 128, 128, 0, 128, 128]); // White, black

      const result = convertYcbcrToRgbInterleaved(ycbcrData, 2, 1);

      assert.equal(result.length, 6);

      // White pixel
      assert.equal(result[0], 255); // R
      assert.equal(result[1], 255); // G
      assert.equal(result[2], 255); // B

      // Black pixel
      assert.equal(result[3], 0); // R
      assert.equal(result[4], 0); // G
      assert.equal(result[5], 0); // B
    });

    it("handles round-trip interleaved conversion", () => {
      const originalRgb = new Uint8Array([
        255,
        128,
        64, // Orange-ish
        64,
        192,
        128, // Green-ish
      ]);

      // Convert to YCbCr and back
      const ycbcr = convertRgbToYcbcrInterleaved(originalRgb, 2, 1);
      const recoveredRgb = convertYcbcrToRgbInterleaved(ycbcr, 2, 1);

      assert.equal(recoveredRgb.length, originalRgb.length);

      // Check accuracy
      for (let i = 0; i < originalRgb.length; i++) {
        assert(Math.abs(recoveredRgb[i] - originalRgb[i]) <= 2);
      }
    });
  });

  describe("Color Space Metrics", () => {
    it("creates metrics analyzer", () => {
      const metrics = new ColorSpaceMetrics();

      assert.equal(metrics.pixelsProcessed, 0);
      assert.equal(metrics.clampingEvents, 0);
      assert.deepEqual(metrics.standardUsage, {});
      assert.deepEqual(metrics.rangeUsage, {});
    });

    it("records conversion operations", () => {
      const metrics = new ColorSpaceMetrics();

      metrics.recordConversion(100, "BT601", "FULL", false);
      metrics.recordConversion(50, "BT709", "LIMITED", true);

      assert.equal(metrics.pixelsProcessed, 150);
      assert.equal(metrics.clampingEvents, 1);
      assert.equal(metrics.standardUsage.BT601, 1);
      assert.equal(metrics.standardUsage.BT709, 1);
      assert.equal(metrics.rangeUsage.FULL, 1);
      assert.equal(metrics.rangeUsage.LIMITED, 1);
    });

    it("tracks color value ranges", () => {
      const metrics = new ColorSpaceMetrics();

      metrics.updateRanges({ r: 100, g: 150, b: 200 }, { y: 120, cb: 110, cr: 140 });
      metrics.updateRanges({ r: 50, g: 250, b: 75 }, { y: 180, cb: 90, cr: 160 });

      const summary = metrics.getSummary();

      assert.equal(summary.rgbRange.r.min, 50);
      assert.equal(summary.rgbRange.r.max, 100);
      assert.equal(summary.rgbRange.g.min, 150);
      assert.equal(summary.rgbRange.g.max, 250);
      assert.equal(summary.ycbcrRange.y.min, 120);
      assert.equal(summary.ycbcrRange.y.max, 180);
    });

    it("calculates summary statistics", () => {
      const metrics = new ColorSpaceMetrics();

      metrics.recordConversion(100, "BT601", "FULL", false);
      metrics.recordConversion(50, "BT601", "FULL", true);

      const summary = metrics.getSummary();

      assert.equal(summary.pixelsProcessed, 150);
      assert.equal(summary.mostUsedStandard, "BT601");
      assert.equal(summary.mostUsedRange, "FULL");
      assert.equal(summary.clampingRate, 1 / 150);
    });

    it("resets metrics", () => {
      const metrics = new ColorSpaceMetrics();

      metrics.recordConversion(100, "BT601", "FULL", false);
      assert.equal(metrics.pixelsProcessed, 100);

      metrics.reset();
      assert.equal(metrics.pixelsProcessed, 0);
      assert.deepEqual(metrics.standardUsage, {});
    });
  });

  describe("Summary Generation", () => {
    it("generates conversion summary", () => {
      const summary = getColorConversionSummary(1000, "RGB→YCbCr", "BT601", "FULL", "planar");

      assert.equal(summary.pixelCount, 1000);
      assert.equal(summary.direction, "RGB→YCbCr");
      assert.equal(summary.standard, "ITU-R BT.601");
      assert.equal(summary.range, "Full Range");
      assert.equal(summary.format, "planar");
      assert.equal(summary.totalOperations, 3000); // 3 per pixel
      assert(summary.description.includes("1000 pixels"));
    });

    it("handles unknown standards gracefully", () => {
      const summary = getColorConversionSummary(100, "YCbCr→RGB", "CUSTOM", "CUSTOM", "interleaved");

      assert.equal(summary.standard, "CUSTOM");
      assert.equal(summary.range, "CUSTOM");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles extreme RGB values", () => {
      // Test boundary values
      const corners = [
        [0, 0, 0],
        [255, 255, 255],
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [255, 255, 0],
        [255, 0, 255],
        [0, 255, 255],
      ];

      for (const [r, g, b] of corners) {
        const ycbcr = rgbToYcbcr(r, g, b);
        const recovered = ycbcrToRgb(ycbcr.y, ycbcr.cb, ycbcr.cr);

        // Should produce valid results
        assert(ycbcr.y >= 0 && ycbcr.y <= 255);
        assert(ycbcr.cb >= 0 && ycbcr.cb <= 255);
        assert(ycbcr.cr >= 0 && ycbcr.cr <= 255);
        assert(recovered.r >= 0 && recovered.r <= 255);
        assert(recovered.g >= 0 && recovered.g <= 255);
        assert(recovered.b >= 0 && recovered.b <= 255);
      }
    });

    it("handles limited range properly", () => {
      const white = rgbToYcbcr(255, 255, 255, "BT601", "LIMITED");
      const black = rgbToYcbcr(0, 0, 0, "BT601", "LIMITED");

      // Limited range should constrain Y values
      assert(white.y <= 235);
      assert(black.y >= 16);
    });

    it("maintains precision with different rounding modes", () => {
      const testValue = [123, 156, 189];

      const nearest = rgbToYcbcr(...testValue, "BT601", "FULL", ROUNDING_MODES.NEAREST);
      const truncate = rgbToYcbcr(...testValue, "BT601", "FULL", ROUNDING_MODES.TRUNCATE);
      const bankers = rgbToYcbcr(...testValue, "BT601", "FULL", ROUNDING_MODES.BANKERS);

      // All should produce valid results
      [nearest, truncate, bankers].forEach((result) => {
        assert(result.y >= 0 && result.y <= 255);
        assert(result.cb >= 0 && result.cb <= 255);
        assert(result.cr >= 0 && result.cr <= 255);
        assert(Number.isInteger(result.y));
        assert(Number.isInteger(result.cb));
        assert(Number.isInteger(result.cr));
      });
    });

    it("handles single pixel images", () => {
      const rgbData = new Uint8Array([128, 64, 192]);

      const planar = convertRgbToYcbcrPlanar(rgbData, 1, 1);
      assert.equal(planar.y.length, 1);
      assert.equal(planar.cb.length, 1);
      assert.equal(planar.cr.length, 1);

      const interleaved = convertRgbToYcbcrInterleaved(rgbData, 1, 1);
      assert.equal(interleaved.length, 3);
    });

    it("validates image dimension consistency", () => {
      const yData = new Uint8Array([100, 120]);
      const cbData = new Uint8Array([110, 130]);
      const crData = new Uint8Array([115]); // Wrong length

      assert.throws(() => {
        convertYcbcrToRgbPlanar(yData, cbData, crData, 2, 1);
      }, /YCbCr data lengths don't match dimensions/);
    });
  });
});
