/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for RGB ↔ YCbCr color space conversion.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  analyzeConversionAccuracy,
  convertRGBAToYCbCrA,
  convertYCbCrAToRGBA,
  createColorTestPattern,
  getConversionCoefficients,
  rgbToYCbCr,
  validateRGB,
  validateYCbCr,
  yCbCrToRGB,
} from "./color-conversion.js";

describe("RGB ↔ YCbCr Color Conversion", () => {
  describe("validateRGB", () => {
    it("accepts valid RGB values", () => {
      assert.doesNotThrow(() => validateRGB(0, 0, 0));
      assert.doesNotThrow(() => validateRGB(255, 255, 255));
      assert.doesNotThrow(() => validateRGB(128, 64, 192));
    });

    it("rejects invalid RGB values", () => {
      assert.throws(() => validateRGB(-1, 0, 0), /Red component/);
      assert.throws(() => validateRGB(256, 0, 0), /Red component/);
      assert.throws(() => validateRGB(0, -1, 0), /Green component/);
      assert.throws(() => validateRGB(0, 256, 0), /Green component/);
      assert.throws(() => validateRGB(0, 0, -1), /Blue component/);
      assert.throws(() => validateRGB(0, 0, 256), /Blue component/);
      assert.throws(() => validateRGB(NaN, 0, 0), /Red component/);
      assert.throws(() => validateRGB("255", 0, 0), /Red component/);
    });
  });

  describe("validateYCbCr", () => {
    it("accepts valid YCbCr values", () => {
      assert.doesNotThrow(() => validateYCbCr(0, -128, -128));
      assert.doesNotThrow(() => validateYCbCr(255, 127, 127));
      assert.doesNotThrow(() => validateYCbCr(128, 0, 0));
    });

    it("rejects invalid YCbCr values", () => {
      assert.throws(() => validateYCbCr(-1, 0, 0), /Y \(luminance\)/);
      assert.throws(() => validateYCbCr(256, 0, 0), /Y \(luminance\)/);
      assert.throws(() => validateYCbCr(128, -129, 0), /Cb \(chrominance\)/);
      assert.throws(() => validateYCbCr(128, 128, 0), /Cb \(chrominance\)/);
      assert.throws(() => validateYCbCr(128, 0, -129), /Cr \(chrominance\)/);
      assert.throws(() => validateYCbCr(128, 0, 128), /Cr \(chrominance\)/);
      assert.throws(() => validateYCbCr(NaN, 0, 0), /Y \(luminance\)/);
    });
  });

  describe("rgbToYCbCr", () => {
    it("converts pure colors correctly", () => {
      // Pure red
      const [yR, cbR, crR] = rgbToYCbCr(255, 0, 0);
      assert(yR > 0, "Red should have positive luminance");
      assert(crR > 0, "Red should have positive Cr (red chrominance)");
      assert(cbR < 0, "Red should have negative Cb (blue chrominance)");

      // Pure green
      const [yG, cbG, crG] = rgbToYCbCr(0, 255, 0);
      assert(yG > yR, "Green should have higher luminance than red");
      assert(cbG < 0, "Green should have negative Cb");
      assert(crG < 0, "Green should have negative Cr");

      // Pure blue
      const [yB, cbB, crB] = rgbToYCbCr(0, 0, 255);
      assert(yB > 0, "Blue should have positive luminance");
      assert(cbB > 0, "Blue should have positive Cb (blue chrominance)");
      assert(crB < 0, "Blue should have negative Cr");
    });

    it("converts white and black correctly", () => {
      // White
      const [yW, cbW, crW] = rgbToYCbCr(255, 255, 255);
      assert.equal(yW, 255, "White should have maximum luminance");
      assert(Math.abs(cbW) <= 1, "White should have near-zero chrominance");
      assert(Math.abs(crW) <= 1, "White should have near-zero chrominance");

      // Black
      const [yBlack, cbBlack, crBlack] = rgbToYCbCr(0, 0, 0);
      assert.equal(yBlack, 0, "Black should have zero luminance");
      assert.equal(cbBlack, 0, "Black should have zero chrominance");
      assert.equal(crBlack, 0, "Black should have zero chrominance");
    });

    it("produces values in valid ranges", () => {
      // Test with various RGB values
      for (let r = 0; r <= 255; r += 51) {
        for (let g = 0; g <= 255; g += 51) {
          for (let b = 0; b <= 255; b += 51) {
            const [y, cb, cr] = rgbToYCbCr(r, g, b);

            assert(y >= 0 && y <= 255, `Y out of range: ${y} for RGB(${r},${g},${b})`);
            assert(cb >= -128 && cb <= 127, `Cb out of range: ${cb} for RGB(${r},${g},${b})`);
            assert(cr >= -128 && cr <= 127, `Cr out of range: ${cr} for RGB(${r},${g},${b})`);
          }
        }
      }
    });

    it("validates input RGB values", () => {
      assert.throws(() => rgbToYCbCr(-1, 0, 0), /Red component/);
      assert.throws(() => rgbToYCbCr(0, 256, 0), /Green component/);
    });
  });

  describe("yCbCrToRGB", () => {
    it("converts YCbCr values correctly", () => {
      // Test with known YCbCr values
      const [r, g, b] = yCbCrToRGB(128, 0, 0);

      // Should produce a gray color
      assert(r >= 0 && r <= 255, `R out of range: ${r}`);
      assert(g >= 0 && g <= 255, `G out of range: ${g}`);
      assert(b >= 0 && b <= 255, `B out of range: ${b}`);
    });

    it("produces values in valid RGB range", () => {
      // Test with various YCbCr values
      for (let y = 0; y <= 255; y += 51) {
        for (let cb = -128; cb <= 127; cb += 51) {
          for (let cr = -128; cr <= 127; cr += 51) {
            const [r, g, b] = yCbCrToRGB(y, cb, cr);

            assert(r >= 0 && r <= 255, `R out of range: ${r} for YCbCr(${y},${cb},${cr})`);
            assert(g >= 0 && g <= 255, `G out of range: ${g} for YCbCr(${y},${cb},${cr})`);
            assert(b >= 0 && b <= 255, `B out of range: ${b} for YCbCr(${y},${cb},${cr})`);
          }
        }
      }
    });

    it("validates input YCbCr values", () => {
      assert.throws(() => yCbCrToRGB(-1, 0, 0), /Y \(luminance\)/);
      assert.throws(() => yCbCrToRGB(128, -129, 0), /Cb \(chrominance\)/);
    });
  });

  describe("Color Conversion Roundtrip", () => {
    it("is approximately reversible for pure colors", () => {
      const testColors = [
        [255, 0, 0], // Red
        [0, 255, 0], // Green
        [0, 0, 255], // Blue
        [255, 255, 0], // Yellow
        [255, 0, 255], // Magenta
        [0, 255, 255], // Cyan
        [255, 255, 255], // White
        [0, 0, 0], // Black
        [128, 128, 128], // Gray
      ];

      for (const [r, g, b] of testColors) {
        const [y, cb, cr] = rgbToYCbCr(r, g, b);
        const [rBack, gBack, bBack] = yCbCrToRGB(y, cb, cr);

        // Allow small rounding errors
        assert(Math.abs(r - rBack) <= 1, `Red roundtrip error: ${r} -> ${rBack}`);
        assert(Math.abs(g - gBack) <= 1, `Green roundtrip error: ${g} -> ${gBack}`);
        assert(Math.abs(b - bBack) <= 1, `Blue roundtrip error: ${b} -> ${bBack}`);
      }
    });

    it("maintains reasonable accuracy for all RGB values", () => {
      let maxError = 0;
      let errorCount = 0;

      // Test subset of RGB space for performance
      for (let r = 0; r <= 255; r += 17) {
        for (let g = 0; g <= 255; g += 17) {
          for (let b = 0; b <= 255; b += 17) {
            const [y, cb, cr] = rgbToYCbCr(r, g, b);
            const [rBack, gBack, bBack] = yCbCrToRGB(y, cb, cr);

            const rError = Math.abs(r - rBack);
            const gError = Math.abs(g - gBack);
            const bError = Math.abs(b - bBack);

            maxError = Math.max(maxError, rError, gError, bError);

            if (rError > 2 || gError > 2 || bError > 2) {
              errorCount++;
            }
          }
        }
      }

      // Should have very low error rate and reasonable max error
      assert(maxError <= 3, `Maximum roundtrip error too high: ${maxError}`);
      assert(errorCount < 10, `Too many pixels with high error: ${errorCount}`);
    });
  });

  describe("convertRGBAToYCbCrA", () => {
    it("converts RGBA pixel array correctly", () => {
      // Single red pixel
      const rgbaPixels = new Uint8Array([255, 0, 0, 255]);
      const ycbcrPixels = convertRGBAToYCbCrA(rgbaPixels, 1, 1);

      assert.equal(ycbcrPixels.length, 4);
      assert(ycbcrPixels[0] > 0, "Y should be positive for red");
      assert(ycbcrPixels[1] < 128, "Cb should be < 128 for red (negative chrominance)");
      assert(ycbcrPixels[2] > 128, "Cr should be > 128 for red (positive chrominance)");
      assert.equal(ycbcrPixels[3], 255, "Alpha should be preserved");
    });

    it("preserves alpha channel", () => {
      const rgbaPixels = new Uint8Array([128, 128, 128, 200]);
      const ycbcrPixels = convertRGBAToYCbCrA(rgbaPixels, 1, 1);

      assert.equal(ycbcrPixels[3], 200, "Alpha should be preserved exactly");
    });

    it("handles multiple pixels", () => {
      // 2x1 image: red and blue pixels
      const rgbaPixels = new Uint8Array([
        255,
        0,
        0,
        255, // Red
        0,
        0,
        255,
        128, // Blue with alpha
      ]);

      const ycbcrPixels = convertRGBAToYCbCrA(rgbaPixels, 2, 1);

      assert.equal(ycbcrPixels.length, 8);

      // Check red pixel conversion
      assert(ycbcrPixels[0] > 0, "Red Y should be positive");
      assert.equal(ycbcrPixels[3], 255, "Red alpha preserved");

      // Check blue pixel conversion
      assert(ycbcrPixels[4] > 0, "Blue Y should be positive");
      assert(ycbcrPixels[5] > 128, "Blue Cb should be > 128 (positive chrominance)");
      assert.equal(ycbcrPixels[7], 128, "Blue alpha preserved");
    });

    it("validates input parameters", () => {
      assert.throws(() => convertRGBAToYCbCrA([], 1, 1), /Pixels must be a Uint8Array/);
      assert.throws(() => convertRGBAToYCbCrA(new Uint8Array([255, 0, 0]), 1, 1), /Expected 4 bytes/);
    });
  });

  describe("convertYCbCrAToRGBA", () => {
    it("converts YCbCrA pixel array correctly", () => {
      // Convert red pixel back to RGB
      const ycbcrPixels = new Uint8Array([76, 85, 255, 255]); // Approximate red in YCbCr
      const rgbaPixels = convertYCbCrAToRGBA(ycbcrPixels, 1, 1);

      assert.equal(rgbaPixels.length, 4);
      assert(rgbaPixels[0] > 200, "Should approximate red");
      assert(rgbaPixels[1] < 50, "Green should be low");
      assert(rgbaPixels[2] < 50, "Blue should be low");
      assert.equal(rgbaPixels[3], 255, "Alpha should be preserved");
    });

    it("validates input parameters", () => {
      assert.throws(() => convertYCbCrAToRGBA([], 1, 1), /Pixels must be a Uint8Array/);
      assert.throws(() => convertYCbCrAToRGBA(new Uint8Array([128, 128, 128]), 1, 1), /Expected 4 bytes/);
    });
  });

  describe("Pixel Array Roundtrip", () => {
    it("maintains reasonable accuracy for pixel arrays", () => {
      // Create test pattern
      const originalRGBA = createColorTestPattern("primary", 3, 1);

      // Convert to YCbCr and back
      const ycbcrPixels = convertRGBAToYCbCrA(originalRGBA, 3, 1);
      const convertedRGBA = convertYCbCrAToRGBA(ycbcrPixels, 3, 1);

      // Analyze accuracy
      const accuracy = analyzeConversionAccuracy(originalRGBA, convertedRGBA, 3, 1);

      assert(accuracy.maxError <= 3, `Max error too high: ${accuracy.maxError}`);
      assert(accuracy.avgError <= 1, `Average error too high: ${accuracy.avgError}`);
      assert(accuracy.pixelsWithError <= 3, "Too many pixels with conversion errors");
    });

    it("preserves alpha channel exactly", () => {
      const rgbaPixels = new Uint8Array([
        255,
        0,
        0,
        100, // Red with alpha 100
        0,
        255,
        0,
        200, // Green with alpha 200
        0,
        0,
        255,
        50, // Blue with alpha 50
      ]);

      const ycbcrPixels = convertRGBAToYCbCrA(rgbaPixels, 3, 1);
      const convertedRGBA = convertYCbCrAToRGBA(ycbcrPixels, 3, 1);

      // Check alpha preservation
      assert.equal(convertedRGBA[3], 100, "First pixel alpha");
      assert.equal(convertedRGBA[7], 200, "Second pixel alpha");
      assert.equal(convertedRGBA[11], 50, "Third pixel alpha");
    });
  });

  describe("analyzeConversionAccuracy", () => {
    it("analyzes identical arrays correctly", () => {
      const pixels = createColorTestPattern("gradient", 4, 4);
      const accuracy = analyzeConversionAccuracy(pixels, pixels, 4, 4);

      assert.equal(accuracy.maxError, 0);
      assert.equal(accuracy.avgError, 0);
      assert.equal(accuracy.rmseError, 0);
      assert.equal(accuracy.pixelsWithError, 0);
      assert.equal(accuracy.totalPixels, 16);
    });

    it("analyzes different arrays correctly", () => {
      const original = new Uint8Array([255, 0, 0, 255]);
      const converted = new Uint8Array([250, 5, 5, 255]);

      const accuracy = analyzeConversionAccuracy(original, converted, 1, 1);

      assert.equal(accuracy.maxError, 5);
      assert(accuracy.avgError > 0);
      assert(accuracy.rmseError > 0);
      assert.equal(accuracy.pixelsWithError, 1);
      assert.equal(accuracy.totalPixels, 1);
    });

    it("validates input arrays", () => {
      const pixels1 = new Uint8Array([255, 0, 0, 255]);
      const pixels2 = new Uint8Array([255, 0, 0]);

      assert.throws(() => analyzeConversionAccuracy(pixels1, pixels2, 1, 1), /same length/);
    });
  });

  describe("createColorTestPattern", () => {
    it("creates gradient pattern", () => {
      const pixels = createColorTestPattern("gradient", 4, 4);

      assert.equal(pixels.length, 4 * 4 * 4);

      // Check gradient properties
      assert.equal(pixels[0], 0); // First pixel R should be 0
      assert.equal(pixels[60], 255); // Last pixel R should be 255 (pixel 15, index 60)
      assert.equal(pixels[3], 255); // Alpha should be 255
    });

    it("creates primary colors pattern", () => {
      const pixels = createColorTestPattern("primary", 3, 1);

      // Should have red, green, blue pixels
      assert.equal(pixels[0], 255); // Red R
      assert.equal(pixels[1], 0); // Red G
      assert.equal(pixels[2], 0); // Red B

      assert.equal(pixels[4], 0); // Green R
      assert.equal(pixels[5], 255); // Green G
      assert.equal(pixels[6], 0); // Green B

      assert.equal(pixels[8], 0); // Blue R
      assert.equal(pixels[9], 0); // Blue G
      assert.equal(pixels[10], 255); // Blue B
    });

    it("creates grayscale pattern", () => {
      const pixels = createColorTestPattern("grayscale", 4, 1);

      // Should have grayscale gradient
      for (let i = 0; i < 4; i++) {
        const pixelIndex = i * 4;
        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];

        assert.equal(r, g, "R and G should be equal for grayscale");
        assert.equal(g, b, "G and B should be equal for grayscale");
      }
    });

    it("creates random pattern", () => {
      const pixels = createColorTestPattern("random", 4, 4);

      assert.equal(pixels.length, 4 * 4 * 4);

      // Should have varied values (not all the same)
      const uniqueValues = new Set();
      for (let i = 0; i < pixels.length; i += 4) {
        uniqueValues.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
      }

      assert(uniqueValues.size > 1, "Random pattern should have varied colors");
    });

    it("rejects unknown patterns", () => {
      assert.throws(() => createColorTestPattern("unknown"), /Unknown test pattern/);
    });
  });

  describe("getConversionCoefficients", () => {
    it("returns coefficient objects", () => {
      const coeffs = getConversionCoefficients();

      assert(coeffs.rgbToYCbCr);
      assert(coeffs.yCbCrToRGB);

      // Check that coefficients are numbers
      assert(typeof coeffs.rgbToYCbCr.YR === "number");
      assert(typeof coeffs.yCbCrToRGB.RY === "number");

      // Check some known values
      assert(Math.abs(coeffs.rgbToYCbCr.YR - 0.299) < 0.001);
      assert(Math.abs(coeffs.yCbCrToRGB.RY - 1.0) < 0.001);
    });

    it("returns independent copies", () => {
      const coeffs1 = getConversionCoefficients();
      const coeffs2 = getConversionCoefficients();

      // Modify one copy
      coeffs1.rgbToYCbCr.YR = 999;

      // Other copy should be unchanged
      assert.notEqual(coeffs2.rgbToYCbCr.YR, 999);
    });
  });

  describe("Performance", () => {
    it("handles large pixel arrays efficiently", () => {
      // Create large test image
      const width = 256;
      const height = 256;
      const rgbaPixels = createColorTestPattern("random", width, height);

      // Should complete conversion without timeout
      const ycbcrPixels = convertRGBAToYCbCrA(rgbaPixels, width, height);
      const convertedRGBA = convertYCbCrAToRGBA(ycbcrPixels, width, height);

      // Verify results
      assert.equal(convertedRGBA.length, rgbaPixels.length);

      // Check accuracy on large image
      const accuracy = analyzeConversionAccuracy(rgbaPixels, convertedRGBA, width, height);
      assert(accuracy.maxError <= 3, "Large image conversion should maintain accuracy");
    });

    it("handles many individual conversions efficiently", () => {
      // Test many individual color conversions
      for (let i = 0; i < 1000; i++) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);

        const [y, cb, cr] = rgbToYCbCr(r, g, b);
        const [rBack, gBack, bBack] = yCbCrToRGB(y, cb, cr);

        // Should complete without errors
        assert(typeof rBack === "number");
        assert(typeof gBack === "number");
        assert(typeof bBack === "number");
      }
    });
  });
});
