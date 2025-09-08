/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for PNG scanline filter application.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
  applyAverageFilter,
  applyFilter,
  applyFilters,
  applyNoneFilter,
  applyPaethFilter,
  applySubFilter,
  applyUpFilter,
  calculateFilterSum,
  FILTER_TYPES,
  findOptimalFilter,
} from "./apply-filters.js";

describe("PNG Filter Application", () => {
  describe("FILTER_TYPES constants", () => {
    it("defines correct filter type constants", () => {
      assert.equal(FILTER_TYPES.NONE, 0, "None filter should be 0");
      assert.equal(FILTER_TYPES.SUB, 1, "Sub filter should be 1");
      assert.equal(FILTER_TYPES.UP, 2, "Up filter should be 2");
      assert.equal(FILTER_TYPES.AVERAGE, 3, "Average filter should be 3");
      assert.equal(FILTER_TYPES.PAETH, 4, "Paeth filter should be 4");
    });
  });

  describe("applyNoneFilter", () => {
    it("applies no filtering correctly", () => {
      const scanline = new Uint8Array([10, 20, 30, 40]);
      const filtered = applyNoneFilter(scanline);

      assert.equal(filtered.length, 5, "Should add filter byte");
      assert.equal(filtered[0], 0, "Filter byte should be 0");
      assert.equal(filtered[1], 10, "Data should be unchanged");
      assert.equal(filtered[2], 20, "Data should be unchanged");
      assert.equal(filtered[3], 30, "Data should be unchanged");
      assert.equal(filtered[4], 40, "Data should be unchanged");
    });

    it("handles empty scanline", () => {
      const scanline = new Uint8Array(0);
      const filtered = applyNoneFilter(scanline);

      assert.equal(filtered.length, 1, "Should only contain filter byte");
      assert.equal(filtered[0], 0, "Filter byte should be 0");
    });

    it("validates input parameter", () => {
      assert.throws(() => applyNoneFilter("not uint8array"), TypeError);
      assert.throws(() => applyNoneFilter(null), TypeError);
    });
  });

  describe("applySubFilter", () => {
    it("applies Sub filter correctly", () => {
      // Test with RGB data (3 bytes per pixel)
      const scanline = new Uint8Array([100, 150, 200, 110, 160, 210]);
      const filtered = applySubFilter(scanline, 3);

      assert.equal(filtered.length, 7, "Should add filter byte");
      assert.equal(filtered[0], 1, "Filter byte should be 1");

      // First pixel unchanged
      assert.equal(filtered[1], 100, "First pixel R unchanged");
      assert.equal(filtered[2], 150, "First pixel G unchanged");
      assert.equal(filtered[3], 200, "First pixel B unchanged");

      // Second pixel: subtract first pixel
      assert.equal(filtered[4], 10, "Second pixel R: 110 - 100 = 10");
      assert.equal(filtered[5], 10, "Second pixel G: 160 - 150 = 10");
      assert.equal(filtered[6], 10, "Second pixel B: 210 - 200 = 10");
    });

    it("handles modulo 256 arithmetic", () => {
      const scanline = new Uint8Array([200, 50]); // 50 - 200 = -150 = 106 (mod 256)
      const filtered = applySubFilter(scanline, 1);

      assert.equal(filtered[0], 1, "Filter byte should be 1");
      assert.equal(filtered[1], 200, "First byte unchanged");
      assert.equal(filtered[2], 106, "Second byte: (50 - 200) & 0xFF = 106");
    });

    it("validates parameters", () => {
      const scanline = new Uint8Array([1, 2, 3]);

      assert.throws(() => applySubFilter("not uint8array", 1), TypeError);
      assert.throws(() => applySubFilter(scanline, 0), /bytesPerPixel must be a positive integer/);
      assert.throws(() => applySubFilter(scanline, -1), /bytesPerPixel must be a positive integer/);
      assert.throws(() => applySubFilter(scanline, 1.5), /bytesPerPixel must be a positive integer/);
    });
  });

  describe("applyUpFilter", () => {
    it("applies Up filter correctly", () => {
      const scanline = new Uint8Array([100, 150, 200]);
      const prevScanline = new Uint8Array([90, 140, 190]);
      const filtered = applyUpFilter(scanline, prevScanline);

      assert.equal(filtered.length, 4, "Should add filter byte");
      assert.equal(filtered[0], 2, "Filter byte should be 2");
      assert.equal(filtered[1], 10, "100 - 90 = 10");
      assert.equal(filtered[2], 10, "150 - 140 = 10");
      assert.equal(filtered[3], 10, "200 - 190 = 10");
    });

    it("handles first scanline (no previous)", () => {
      const scanline = new Uint8Array([100, 150, 200]);
      const filtered = applyUpFilter(scanline, null);

      assert.equal(filtered[0], 2, "Filter byte should be 2");
      assert.equal(filtered[1], 100, "No previous scanline: unchanged");
      assert.equal(filtered[2], 150, "No previous scanline: unchanged");
      assert.equal(filtered[3], 200, "No previous scanline: unchanged");
    });

    it("handles modulo 256 arithmetic", () => {
      const scanline = new Uint8Array([50]);
      const prevScanline = new Uint8Array([200]);
      const filtered = applyUpFilter(scanline, prevScanline);

      assert.equal(filtered[1], 106, "(50 - 200) & 0xFF = 106");
    });

    it("validates parameters", () => {
      const scanline = new Uint8Array([1, 2, 3]);
      const prevScanline = new Uint8Array([4, 5, 6]);

      assert.throws(() => applyUpFilter("not uint8array", prevScanline), TypeError);
      assert.throws(() => applyUpFilter(scanline, "not uint8array"), TypeError);
      assert.throws(() => applyUpFilter(scanline, new Uint8Array([1, 2])), /must have same length/);
    });
  });

  describe("applyAverageFilter", () => {
    it("applies Average filter correctly", () => {
      // Test with 2 bytes per pixel
      const scanline = new Uint8Array([100, 150, 110, 160]);
      const prevScanline = new Uint8Array([90, 140, 95, 145]);
      const filtered = applyAverageFilter(scanline, prevScanline, 2);

      assert.equal(filtered[0], 3, "Filter byte should be 3");

      // First pixel: no left pixel, so average = above / 2
      assert.equal(filtered[1], 55, "100 - floor(90/2) = 100 - 45 = 55");
      assert.equal(filtered[2], 80, "150 - floor(140/2) = 150 - 70 = 80");

      // Second pixel: average = (left + above) / 2
      assert.equal(filtered[3], 13, "110 - floor((100+95)/2) = 110 - 97 = 13");
      assert.equal(filtered[4], 13, "160 - floor((150+145)/2) = 160 - 147 = 13");
    });

    it("handles first scanline and first pixel", () => {
      const scanline = new Uint8Array([100, 150]);
      const filtered = applyAverageFilter(scanline, null, 1);

      assert.equal(filtered[0], 3, "Filter byte should be 3");
      assert.equal(filtered[1], 100, "First pixel, no previous: unchanged");
      assert.equal(filtered[2], 100, "Second pixel: 150 - floor(100/2) = 150 - 50 = 100");
    });

    it("validates parameters", () => {
      const scanline = new Uint8Array([1, 2, 3]);

      assert.throws(() => applyAverageFilter("not uint8array", null, 1), TypeError);
      assert.throws(() => applyAverageFilter(scanline, null, 0), /bytesPerPixel must be a positive integer/);
    });
  });

  describe("applyPaethFilter", () => {
    it("applies Paeth filter correctly", () => {
      const scanline = new Uint8Array([100, 110]);
      const prevScanline = new Uint8Array([90, 95]);
      const filtered = applyPaethFilter(scanline, prevScanline, 1);

      assert.equal(filtered[0], 4, "Filter byte should be 4");
      assert.equal(filtered[1], 10, "First pixel: 100 - 90 = 10 (Paeth = above)");

      // Second pixel: Paeth predictor with left=100, above=95, upperLeft=90
      // p = 100 + 95 - 90 = 105
      // pa = |105 - 100| = 5, pb = |105 - 95| = 10, pc = |105 - 90| = 15
      // Paeth = left (100) since pa <= pb && pa <= pc
      assert.equal(filtered[2], 10, "Second pixel: 110 - 100 = 10");
    });

    it("handles edge cases", () => {
      const scanline = new Uint8Array([100]);
      const filtered = applyPaethFilter(scanline, null, 1);

      assert.equal(filtered[0], 4, "Filter byte should be 4");
      assert.equal(filtered[1], 100, "No previous scanline: unchanged");
    });

    it("validates parameters", () => {
      const scanline = new Uint8Array([1, 2, 3]);

      assert.throws(() => applyPaethFilter("not uint8array", null, 1), TypeError);
      assert.throws(() => applyPaethFilter(scanline, null, 0), /bytesPerPixel must be a positive integer/);
    });
  });

  describe("applyFilter", () => {
    it("dispatches to correct filter functions", () => {
      const scanline = new Uint8Array([100, 150]);
      const prevScanline = new Uint8Array([90, 140]);

      const none = applyFilter(0, scanline, prevScanline, 1);
      assert.equal(none[0], 0, "Should use None filter");

      const sub = applyFilter(1, scanline, prevScanline, 1);
      assert.equal(sub[0], 1, "Should use Sub filter");

      const up = applyFilter(2, scanline, prevScanline, 1);
      assert.equal(up[0], 2, "Should use Up filter");

      const average = applyFilter(3, scanline, prevScanline, 1);
      assert.equal(average[0], 3, "Should use Average filter");

      const paeth = applyFilter(4, scanline, prevScanline, 1);
      assert.equal(paeth[0], 4, "Should use Paeth filter");
    });

    it("validates filter type", () => {
      const scanline = new Uint8Array([1, 2, 3]);

      assert.throws(() => applyFilter(-1, scanline, null, 1), /Invalid filter type/);
      assert.throws(() => applyFilter(5, scanline, null, 1), /Invalid filter type/);
      assert.throws(() => applyFilter(1.5, scanline, null, 1), /Invalid filter type/);
    });
  });

  describe("calculateFilterSum", () => {
    it("calculates sum of absolute values correctly", () => {
      // Test with positive values
      const filtered1 = new Uint8Array([1, 10, 20, 30]); // Sum = 10 + 20 + 30 = 60
      assert.equal(calculateFilterSum(filtered1), 60, "Should sum positive values");

      // Test with values > 127 (treated as negative in two's complement)
      const filtered2 = new Uint8Array([1, 200, 250]); // 200 -> 56, 250 -> 6, sum = 62
      assert.equal(calculateFilterSum(filtered2), 62, "Should handle large values as negative");

      // Test with mixed values
      const filtered3 = new Uint8Array([2, 10, 200]); // 10 + 56 = 66
      assert.equal(calculateFilterSum(filtered3), 66, "Should handle mixed values");
    });

    it("ignores filter byte", () => {
      const filtered = new Uint8Array([99, 10, 20]); // Filter byte 99 ignored
      assert.equal(calculateFilterSum(filtered), 30, "Should ignore first byte");
    });

    it("validates input", () => {
      assert.throws(() => calculateFilterSum(new Uint8Array(0)), TypeError);
      assert.throws(() => calculateFilterSum("not uint8array"), TypeError);
    });
  });

  describe("findOptimalFilter", () => {
    it("finds filter with lowest sum", () => {
      // Create test data where Sub filter should be optimal
      const scanline = new Uint8Array([100, 101, 102, 103]); // Gradual increase
      const prevScanline = new Uint8Array([50, 60, 70, 80]); // Different pattern

      const result = findOptimalFilter(scanline, prevScanline, 1);

      assert(typeof result.filterType === "number", "Should return filter type");
      assert(result.filterType >= 0 && result.filterType <= 4, "Filter type should be 0-4");
      assert(result.filteredScanline instanceof Uint8Array, "Should return filtered scanline");
      assert.equal(result.filteredScanline[0], result.filterType, "Filter byte should match type");
    });

    it("handles edge cases", () => {
      const scanline = new Uint8Array([100]);
      const result = findOptimalFilter(scanline, null, 1);

      assert(result.filterType >= 0 && result.filterType <= 4, "Should return valid filter");
      assert.equal(result.filteredScanline.length, 2, "Should have filter byte + data");
    });
  });

  describe("applyFilters", () => {
    it("applies filters to complete image", () => {
      // 2x2 image, 1 byte per pixel (grayscale)
      const imageData = new Uint8Array([
        100,
        110, // First scanline
        120,
        130, // Second scanline
      ]);

      const filtered = applyFilters(imageData, 2, 2, 1, FILTER_TYPES.NONE);

      assert.equal(filtered.length, 6, "Should add filter byte per scanline: 2*(2+1) = 6");
      assert.equal(filtered[0], 0, "First scanline filter byte");
      assert.equal(filtered[1], 100, "First scanline data");
      assert.equal(filtered[2], 110, "First scanline data");
      assert.equal(filtered[3], 0, "Second scanline filter byte");
      assert.equal(filtered[4], 120, "Second scanline data");
      assert.equal(filtered[5], 130, "Second scanline data");
    });

    it("applies optimal filtering", () => {
      const imageData = new Uint8Array([100, 110, 120, 130]);

      const filtered = applyFilters(imageData, 2, 2, 1, "optimal");

      assert.equal(filtered.length, 6, "Should have correct output size");
      assert(filtered[0] >= 0 && filtered[0] <= 4, "First scanline should have valid filter");
      assert(filtered[3] >= 0 && filtered[3] <= 4, "Second scanline should have valid filter");
    });

    it("validates parameters", () => {
      const imageData = new Uint8Array([1, 2, 3, 4]);

      assert.throws(() => applyFilters("not uint8array", 2, 2, 1), TypeError);
      assert.throws(() => applyFilters(imageData, 0, 2, 1), /width must be a positive integer/);
      assert.throws(() => applyFilters(imageData, 2, 0, 1), /height must be a positive integer/);
      assert.throws(() => applyFilters(imageData, 2, 2, 0), /bytesPerPixel must be a positive integer/);
      assert.throws(() => applyFilters(imageData, 2, 2, 1, 5), /Invalid filter strategy/);
      assert.throws(() => applyFilters(new Uint8Array([1, 2, 3]), 2, 2, 1), /Invalid image data size/);
    });
  });

  describe("Integration Tests", () => {
    it("processes RGB image correctly", () => {
      // 2x1 RGB image (2 pixels, 3 bytes each)
      const imageData = new Uint8Array([
        255,
        0,
        0, // Red pixel
        0,
        255,
        0, // Green pixel
      ]);

      const filtered = applyFilters(imageData, 2, 1, 3, FILTER_TYPES.SUB);

      assert.equal(filtered.length, 7, "Should be 6 data bytes + 1 filter byte");
      assert.equal(filtered[0], 1, "Should use Sub filter");
      assert.equal(filtered[1], 255, "First pixel R unchanged");
      assert.equal(filtered[2], 0, "First pixel G unchanged");
      assert.equal(filtered[3], 0, "First pixel B unchanged");
      assert.equal(filtered[4], 1, "Second pixel R: 0 - 255 = 1 (mod 256)");
      assert.equal(filtered[5], 255, "Second pixel G: 255 - 0 = 255");
      assert.equal(filtered[6], 0, "Second pixel B: 0 - 0 = 0");
    });

    it("handles large images efficiently", () => {
      // 100x100 RGBA image
      const width = 100;
      const height = 100;
      const bytesPerPixel = 4;
      const imageData = new Uint8Array(width * height * bytesPerPixel);

      // Fill with gradient pattern
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * bytesPerPixel;
          imageData[offset] = x % 256; // R
          imageData[offset + 1] = y % 256; // G
          imageData[offset + 2] = 128; // B
          imageData[offset + 3] = 255; // A
        }
      }

      const filtered = applyFilters(imageData, width, height, bytesPerPixel, "optimal");

      assert.equal(filtered.length, height * (width * bytesPerPixel + 1), "Should have correct size");

      // Check that all filter bytes are valid
      for (let y = 0; y < height; y++) {
        const filterByte = filtered[y * (width * bytesPerPixel + 1)];
        assert(filterByte >= 0 && filterByte <= 4, `Filter byte ${filterByte} should be 0-4`);
      }
    });

    it("produces deterministic results", () => {
      const imageData = new Uint8Array([100, 110, 120, 130]);

      const filtered1 = applyFilters(imageData, 2, 2, 1, FILTER_TYPES.UP);
      const filtered2 = applyFilters(imageData, 2, 2, 1, FILTER_TYPES.UP);

      assert.equal(filtered1.length, filtered2.length, "Results should be same length");
      for (let i = 0; i < filtered1.length; i++) {
        assert.equal(filtered1[i], filtered2[i], `Byte ${i} should be identical`);
      }
    });
  });
});
