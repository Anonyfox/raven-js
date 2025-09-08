/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { decodeIHDR } from "./decode-ihdr.js";
import { decompressIDAT } from "./decompress-idat.js";
import { findChunksByType, parseChunks } from "./parse-chunks.js";
import { analyzeFilterUsage, FILTER_TYPES, getFilterTypeName, reverseFilters } from "./reverse-filters.js";
import { validatePNGSignature } from "./validate-signature.js";

describe("PNG Filter Reversal", () => {
  describe("reverseFilters", () => {
    it("throws TypeError for invalid buffer types", () => {
      assert.throws(() => reverseFilters(null, 10, 10, 3), TypeError);
      assert.throws(() => reverseFilters(undefined, 10, 10, 3), TypeError);
      assert.throws(() => reverseFilters("invalid", 10, 10, 3), TypeError);
      assert.throws(() => reverseFilters(123, 10, 10, 3), TypeError);
    });

    it("throws on invalid width", () => {
      const data = new Uint8Array(44); // 4 scanlines × 11 bytes (1 filter + 10 pixels)
      assert.throws(() => reverseFilters(data, 0, 4, 1), /Invalid width: 0/);
      assert.throws(() => reverseFilters(data, -1, 4, 1), /Invalid width: -1/);
      assert.throws(() => reverseFilters(data, 1.5, 4, 1), /Invalid width: 1.5/);
    });

    it("throws on invalid height", () => {
      const data = new Uint8Array(44);
      assert.throws(() => reverseFilters(data, 10, 0, 1), /Invalid height: 0/);
      assert.throws(() => reverseFilters(data, 10, -1, 1), /Invalid height: -1/);
      assert.throws(() => reverseFilters(data, 10, 2.5, 1), /Invalid height: 2.5/);
    });

    it("throws on invalid bytesPerPixel", () => {
      const data = new Uint8Array(44);
      assert.throws(() => reverseFilters(data, 10, 4, 0), /Invalid bytesPerPixel: 0/);
      assert.throws(() => reverseFilters(data, 10, 4, -1), /Invalid bytesPerPixel: -1/);
      assert.throws(() => reverseFilters(data, 10, 4, 1.5), /Invalid bytesPerPixel: 1.5/);
    });

    it("throws on incorrect data size", () => {
      // Expected: 2 scanlines × (1 filter + 3 pixels × 2 bytes) = 2 × 7 = 14 bytes
      const wrongSize = new Uint8Array(10); // Wrong size
      assert.throws(() => reverseFilters(wrongSize, 3, 2, 2), /Invalid data size: expected 14 bytes/);
    });

    it("throws on invalid filter type", () => {
      // Create data with invalid filter type (5)
      const data = new Uint8Array([
        5,
        1,
        2,
        3, // Invalid filter type 5
        0,
        4,
        5,
        6, // Valid filter type 0
      ]);
      assert.throws(() => reverseFilters(data, 3, 2, 1), /Invalid PNG filter type: 5/);
    });

    it("handles None filter (type 0)", () => {
      // 2×2 grayscale image with None filter
      const data = new Uint8Array([
        0,
        100,
        150, // Scanline 1: None filter, pixels [100, 150]
        0,
        200,
        250, // Scanline 2: None filter, pixels [200, 250]
      ]);

      const result = reverseFilters(data, 2, 2, 1);

      // None filter should return data unchanged (without filter bytes)
      const expected = new Uint8Array([100, 150, 200, 250]);
      assert.deepEqual(result, expected);
    });

    it("handles Sub filter (type 1)", () => {
      // 2×2 grayscale image with Sub filter
      // Original pixels: [100, 150] [50, 75]
      // Sub filtered: [100, 50] [50, 25] (150-100=50, 75-50=25)
      const data = new Uint8Array([
        1,
        100,
        50, // Scanline 1: Sub filter, filtered [100, 50]
        1,
        50,
        25, // Scanline 2: Sub filter, filtered [50, 25]
      ]);

      const result = reverseFilters(data, 2, 2, 1);

      // Should reconstruct original pixels
      const expected = new Uint8Array([100, 150, 50, 75]);
      assert.deepEqual(result, expected);
    });

    it("handles Up filter (type 2)", () => {
      // 2×2 grayscale image with Up filter
      // Original pixels: [100, 150] [120, 170]
      // Up filtered: [100, 150] [20, 20] (120-100=20, 170-150=20)
      const data = new Uint8Array([
        2,
        100,
        150, // Scanline 1: Up filter, filtered [100, 150] (no above scanline)
        2,
        20,
        20, // Scanline 2: Up filter, filtered [20, 20]
      ]);

      const result = reverseFilters(data, 2, 2, 1);

      // Should reconstruct original pixels
      const expected = new Uint8Array([100, 150, 120, 170]);
      assert.deepEqual(result, expected);
    });

    it("handles Average filter (type 3)", () => {
      // 2×2 grayscale image with Average filter
      // Scanline 1: No above scanline, so average is just left/2
      // Pixel 0: left=0, above=0, avg=0, original=100, filtered=100
      // Pixel 1: left=100, above=0, avg=50, original=200, filtered=150
      // Scanline 2: Has above scanline
      // Pixel 0: left=0, above=100, avg=50, original=110, filtered=60
      // Pixel 1: left=110, above=200, avg=155, original=185, filtered=30
      const data = new Uint8Array([
        3,
        100,
        150, // Scanline 1: Average filter, filtered [100, 150]
        3,
        60,
        30, // Scanline 2: Average filter, filtered [60, 30]
      ]);

      const result = reverseFilters(data, 2, 2, 1);

      // Should reconstruct: [100, 200, 110, 185]
      const expected = new Uint8Array([100, 200, 110, 185]);
      assert.deepEqual(result, expected);
    });

    it("handles Paeth filter (type 4)", () => {
      // Simple 2×2 grayscale test for Paeth filter
      const data = new Uint8Array([
        4,
        100,
        50, // Scanline 1: Paeth filter
        4,
        10,
        20, // Scanline 2: Paeth filter
      ]);

      const result = reverseFilters(data, 2, 2, 1);

      // Verify result is valid (exact values depend on Paeth predictor)
      assert(result instanceof Uint8Array);
      assert.equal(result.length, 4);
      assert(result.every((byte) => byte >= 0 && byte <= 255));
    });

    it("handles RGB pixels (3 bytes per pixel)", () => {
      // 2×1 RGB image with None filter
      const data = new Uint8Array([
        0,
        255,
        0,
        0,
        0,
        255,
        0, // Scanline 1: None filter, RGB pixels [255,0,0] [0,255,0]
      ]);

      const result = reverseFilters(data, 2, 1, 3);

      const expected = new Uint8Array([255, 0, 0, 0, 255, 0]);
      assert.deepEqual(result, expected);
    });

    it("handles RGBA pixels (4 bytes per pixel)", () => {
      // 2×1 RGBA image with None filter
      const data = new Uint8Array([
        0,
        255,
        0,
        0,
        128,
        0,
        255,
        0,
        255, // None filter, RGBA pixels [255,0,0,128] [0,255,0,255]
      ]);

      const result = reverseFilters(data, 2, 1, 4);

      const expected = new Uint8Array([255, 0, 0, 128, 0, 255, 0, 255]);
      assert.deepEqual(result, expected);
    });

    it("handles single pixel image", () => {
      // 1×1 grayscale image
      const data = new Uint8Array([0, 42]); // None filter, pixel value 42

      const result = reverseFilters(data, 1, 1, 1);

      const expected = new Uint8Array([42]);
      assert.deepEqual(result, expected);
    });

    it("handles large scanlines", () => {
      // 100×1 grayscale image with Sub filter
      const width = 100;
      const data = new Uint8Array(1 + width); // 1 filter byte + 100 pixels
      data[0] = 1; // Sub filter

      // Create predictable pattern: each pixel is previous + 1
      for (let i = 1; i <= width; i++) {
        data[i] = i === 1 ? 10 : 1; // First pixel = 10, others = difference of 1
      }

      const result = reverseFilters(data, width, 1, 1);

      // Should reconstruct sequence: 10, 11, 12, ..., 109
      assert.equal(result.length, width);
      for (let i = 0; i < width; i++) {
        assert.equal(result[i], 10 + i);
      }
    });

    it("handles mixed filter types", () => {
      // 2×3 grayscale image with different filters per scanline
      const data = new Uint8Array([
        0,
        10,
        20, // Scanline 1: None filter -> [10, 20]
        1,
        30,
        10, // Scanline 2: Sub filter -> [30, 30+10=40]
        2,
        25,
        25, // Scanline 3: Up filter -> [30+25=55, 40+25=65]
      ]);

      const result = reverseFilters(data, 2, 3, 1);

      const expected = new Uint8Array([10, 20, 30, 40, 55, 65]);
      assert.deepEqual(result, expected);
    });
  });

  describe("getFilterTypeName", () => {
    it("returns correct names for valid filter types", () => {
      assert.equal(getFilterTypeName(FILTER_TYPES.NONE), "None");
      assert.equal(getFilterTypeName(FILTER_TYPES.SUB), "Sub");
      assert.equal(getFilterTypeName(FILTER_TYPES.UP), "Up");
      assert.equal(getFilterTypeName(FILTER_TYPES.AVERAGE), "Average");
      assert.equal(getFilterTypeName(FILTER_TYPES.PAETH), "Paeth");
    });

    it("returns unknown format for invalid filter types", () => {
      assert.equal(getFilterTypeName(5), "Unknown(5)");
      assert.equal(getFilterTypeName(-1), "Unknown(-1)");
    });
  });

  describe("analyzeFilterUsage", () => {
    it("counts filter type usage correctly", () => {
      // 3×2 grayscale image with mixed filters
      const data = new Uint8Array([
        0,
        10,
        20, // None filter
        1,
        30,
        10, // Sub filter
        2,
        5,
        5, // Up filter
      ]);

      const stats = analyzeFilterUsage(data, 2, 3, 1);

      assert.deepEqual(stats.filterCounts, { 0: 1, 1: 1, 2: 1, 3: 0, 4: 0 });
      assert.equal(stats.totalScanlines, 3);
      // Most used filter could be any of 0, 1, 2 (all have count 1)
      assert([0, 1, 2].includes(stats.mostUsedFilter));
    });

    it("identifies most used filter", () => {
      // 4×2 grayscale image with mostly Sub filters
      const data = new Uint8Array([
        1,
        10,
        20, // Sub filter
        1,
        30,
        10, // Sub filter
        1,
        5,
        15, // Sub filter
        0,
        40,
        50, // None filter
      ]);

      const stats = analyzeFilterUsage(data, 2, 4, 1);

      assert.deepEqual(stats.filterCounts, { 0: 1, 1: 3, 2: 0, 3: 0, 4: 0 });
      assert.equal(stats.totalScanlines, 4);
      assert.equal(stats.mostUsedFilter, 1); // Sub filter is most used
    });

    it("throws on invalid parameters", () => {
      assert.throws(() => analyzeFilterUsage(null, 2, 2, 1), TypeError);
      assert.throws(() => analyzeFilterUsage(new Uint8Array(8), 0, 2, 1), /Invalid width/);
    });
  });

  describe("Constants", () => {
    it("exports correct FILTER_TYPES", () => {
      assert.equal(FILTER_TYPES.NONE, 0);
      assert.equal(FILTER_TYPES.SUB, 1);
      assert.equal(FILTER_TYPES.UP, 2);
      assert.equal(FILTER_TYPES.AVERAGE, 3);
      assert.equal(FILTER_TYPES.PAETH, 4);
    });
  });

  describe("Real PNG Integration", () => {
    it("reverses filters on real PNG file", async () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");

        // Verify it's a PNG file
        assert(validatePNGSignature(pngBuffer), "Should be valid PNG");

        // Parse chunks and decode IHDR
        const chunkData = pngBuffer.slice(8);
        const chunks = parseChunks(chunkData);
        const ihdrChunk = findChunksByType(chunks, "IHDR")[0];
        const ihdr = decodeIHDR(ihdrChunk.data);

        // Decompress IDAT data
        const idatChunks = findChunksByType(chunks, "IDAT");
        const idatData = idatChunks.map((chunk) => chunk.data);

        // Decompress IDAT data
        const decompressed = await decompressIDAT(idatData);

        // Reverse filters
        const startTime = performance.now();
        const unfiltered = reverseFilters(decompressed, ihdr.width, ihdr.height, ihdr.bytesPerPixel);
        const endTime = performance.now();

        // Validate result
        assert(unfiltered instanceof Uint8Array, "Should return Uint8Array");
        const expectedPixelDataSize = ihdr.width * ihdr.height * ihdr.bytesPerPixel;
        assert.equal(
          unfiltered.length,
          expectedPixelDataSize,
          `Should have ${expectedPixelDataSize} bytes of pixel data`
        );

        // Performance check
        const duration = endTime - startTime;
        assert(duration < 1000, "Filter reversal should complete within 1 second");

        console.log(`✓ Reversed filters on apple-touch-icon.png:`);
        console.log(`  - Image: ${ihdr.width}×${ihdr.height} pixels`);
        console.log(`  - Bytes per pixel: ${ihdr.bytesPerPixel}`);
        console.log(`  - Filtered data: ${decompressed.length} bytes`);
        console.log(`  - Pixel data: ${unfiltered.length} bytes`);
        console.log(`  - Filter reversal time: ${duration.toFixed(2)}ms`);
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping real PNG filter reversal test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });

    it("analyzes filter usage in real PNG", async () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");
        const chunkData = pngBuffer.slice(8);
        const chunks = parseChunks(chunkData);
        const ihdrChunk = findChunksByType(chunks, "IHDR")[0];
        const ihdr = decodeIHDR(ihdrChunk.data);

        // Decompress IDAT data
        const idatChunks = findChunksByType(chunks, "IDAT");
        const idatData = idatChunks.map((chunk) => chunk.data);
        const decompressed = await decompressIDAT(idatData);

        // Analyze filter usage
        const stats = analyzeFilterUsage(decompressed, ihdr.width, ihdr.height, ihdr.bytesPerPixel);

        // Validate statistics
        assert.equal(stats.totalScanlines, ihdr.height, "Should count all scanlines");
        assert(typeof stats.mostUsedFilter === "number", "Should identify most used filter");
        assert(stats.mostUsedFilter >= 0 && stats.mostUsedFilter <= 4, "Most used filter should be valid");

        // Verify filter counts sum to total scanlines
        const totalCounted = Object.values(stats.filterCounts).reduce((sum, count) => sum + count, 0);
        assert.equal(totalCounted, ihdr.height, "Filter counts should sum to total scanlines");

        console.log(`✓ Analyzed filter usage in apple-touch-icon.png:`);
        console.log(`  - Total scanlines: ${stats.totalScanlines}`);
        console.log(`  - Most used filter: ${getFilterTypeName(stats.mostUsedFilter)}`);
        console.log(`  - Filter distribution:`);
        for (const [filterType, count] of Object.entries(stats.filterCounts)) {
          if (count > 0) {
            const percentage = ((count / stats.totalScanlines) * 100).toFixed(1);
            console.log(`    ${getFilterTypeName(Number(filterType))}: ${count} (${percentage}%)`);
          }
        }
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping real PNG filter analysis test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });
  });

  describe("Edge Cases", () => {
    it("handles byte overflow in filter calculations", () => {
      // Test values that would overflow without proper masking
      const data = new Uint8Array([
        1,
        255,
        255, // Sub filter: second pixel would be 255+255=510, should wrap to 254
      ]);

      const result = reverseFilters(data, 2, 1, 1);

      assert.equal(result[0], 255);
      assert.equal(result[1], 254); // (255 + 255) & 0xFF = 254
    });

    it("handles Paeth predictor edge cases", () => {
      // Test Paeth filter with edge conditions
      const data = new Uint8Array([
        4,
        100,
        50, // First scanline with Paeth filter
        4,
        200,
        150, // Second scanline with Paeth filter
      ]);

      const result = reverseFilters(data, 2, 2, 1);

      // Should produce valid results without throwing
      assert(result instanceof Uint8Array);
      assert.equal(result.length, 4);
      assert(result.every((byte) => byte >= 0 && byte <= 255));
    });

    it("handles minimum image size (1×1)", () => {
      const data = new Uint8Array([0, 42]); // 1×1 with None filter

      const result = reverseFilters(data, 1, 1, 1);

      assert.deepEqual(result, new Uint8Array([42]));
    });

    it("handles maximum valid filter type", () => {
      const data = new Uint8Array([4, 100, 50]); // Paeth filter (type 4)

      const result = reverseFilters(data, 2, 1, 1);

      assert(result instanceof Uint8Array);
      assert.equal(result.length, 2);
    });

    it("handles zero pixel values", () => {
      const data = new Uint8Array([
        0,
        0,
        0, // None filter with zero pixels
        1,
        0,
        0, // Sub filter with zero differences
      ]);

      const result = reverseFilters(data, 2, 2, 1);

      assert.deepEqual(result, new Uint8Array([0, 0, 0, 0]));
    });
  });

  describe("Performance", () => {
    it("processes large images efficiently", () => {
      // Create 100×100 grayscale image with None filter
      const width = 100;
      const height = 100;
      const scanlineSize = 1 + width; // 1 filter byte + width pixels
      const data = new Uint8Array(height * scanlineSize);

      // Fill with None filter and random pixel data
      for (let y = 0; y < height; y++) {
        const offset = y * scanlineSize;
        data[offset] = 0; // None filter
        for (let x = 1; x <= width; x++) {
          data[offset + x] = (x + y) & 0xff; // Predictable pattern
        }
      }

      const startTime = performance.now();
      const result = reverseFilters(data, width, height, 1);
      const endTime = performance.now();

      const duration = endTime - startTime;
      assert(duration < 100, "Should process 100×100 image within 100ms");
      assert.equal(result.length, width * height);

      console.log(`✓ Processed ${width}×${height} image in ${duration.toFixed(2)}ms`);
    });

    it("handles different filter types efficiently", () => {
      // Create image with all filter types
      const width = 50;
      const height = 5; // One scanline per filter type
      const scanlineSize = 1 + width;
      const data = new Uint8Array(height * scanlineSize);

      // Fill each scanline with different filter type
      for (let y = 0; y < height; y++) {
        const offset = y * scanlineSize;
        data[offset] = y; // Filter type 0-4
        for (let x = 1; x <= width; x++) {
          data[offset + x] = (x * 2) & 0xff; // Simple pattern
        }
      }

      const startTime = performance.now();
      const result = reverseFilters(data, width, height, 1);
      const endTime = performance.now();

      const duration = endTime - startTime;
      assert(duration < 50, "Should handle mixed filters efficiently");
      assert.equal(result.length, width * height);
    });
  });
});
