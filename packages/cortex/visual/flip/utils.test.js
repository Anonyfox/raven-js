/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for flip utility functions.
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { copyPixel, copyRow, getPixelIndex, swapPixels, swapRows, validateFlipParameters } from "./utils.js";

describe("Flip Utilities", () => {
  describe("validateFlipParameters", () => {
    let validPixels;

    beforeEach(() => {
      validPixels = new Uint8Array(800 * 600 * 4); // 800x600 RGBA
    });

    it("accepts valid parameters", () => {
      assert.doesNotThrow(() => {
        validateFlipParameters(validPixels, 800, 600, "horizontal");
      });
      assert.doesNotThrow(() => {
        validateFlipParameters(validPixels, 800, 600, "vertical");
      });
    });

    it("rejects non-Uint8Array pixels", () => {
      assert.throws(() => validateFlipParameters([], 800, 600, "horizontal"), /Pixels must be a Uint8Array/);
    });

    it("rejects invalid dimensions", () => {
      assert.throws(
        () => validateFlipParameters(validPixels, 0, 600, "horizontal"),
        /Invalid width.*Must be positive integer/
      );
      assert.throws(
        () => validateFlipParameters(validPixels, 800, -1, "horizontal"),
        /Invalid height.*Must be positive integer/
      );
    });

    it("rejects mismatched pixel data size", () => {
      const wrongSizePixels = new Uint8Array(100);
      assert.throws(
        () => validateFlipParameters(wrongSizePixels, 800, 600, "horizontal"),
        /Invalid pixel data size: expected 1920000, got 100/
      );
    });

    it("rejects invalid flip directions", () => {
      assert.throws(
        () => validateFlipParameters(validPixels, 800, 600, "diagonal"),
        /Invalid flip direction: diagonal.*Must be "horizontal" or "vertical"/
      );
      assert.throws(
        () => validateFlipParameters(validPixels, 800, 600, ""),
        /Invalid flip direction.*Must be "horizontal" or "vertical"/
      );
    });
  });

  describe("getPixelIndex", () => {
    it("calculates correct index for top-left pixel", () => {
      assert.equal(getPixelIndex(0, 0, 800), 0);
    });

    it("calculates correct index for arbitrary pixel", () => {
      // Pixel at (100, 50) in 800-wide image
      assert.equal(getPixelIndex(100, 50, 800), 160400);
    });

    it("calculates correct index for last pixel in row", () => {
      assert.equal(getPixelIndex(799, 0, 800), 3196);
    });

    it("calculates correct index for bottom-right pixel", () => {
      // Last pixel in 800x600 image: (799, 599) = (599 * 800 + 799) * 4
      assert.equal(getPixelIndex(799, 599, 800), 1919996);
    });
  });

  describe("copyPixel", () => {
    it("copies RGBA pixel correctly", () => {
      const src = new Uint8Array([255, 128, 64, 32, 0, 0, 0, 0]);
      const dst = new Uint8Array(8);

      copyPixel(src, dst, 0, 4);
      assert.deepEqual(Array.from(dst), [0, 0, 0, 0, 255, 128, 64, 32]);
    });

    it("copies multiple pixels correctly", () => {
      const src = new Uint8Array([
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
      ]);
      const dst = new Uint8Array(12);

      copyPixel(src, dst, 0, 8); // Copy red to position 2
      copyPixel(src, dst, 8, 0); // Copy blue to position 0
      copyPixel(src, dst, 4, 4); // Copy green to position 1

      assert.deepEqual(Array.from(dst), [
        0,
        0,
        255,
        255, // Blue at position 0
        0,
        255,
        0,
        255, // Green at position 1
        255,
        0,
        0,
        255, // Red at position 2
      ]);
    });
  });

  describe("swapPixels", () => {
    it("swaps two pixels correctly", () => {
      const pixels = new Uint8Array([
        255,
        0,
        0,
        255, // Red
        0,
        255,
        0,
        255, // Green
      ]);

      swapPixels(pixels, 0, 4);

      assert.deepEqual(Array.from(pixels), [
        0,
        255,
        0,
        255, // Green (was red)
        255,
        0,
        0,
        255, // Red (was green)
      ]);
    });

    it("handles swapping same pixel (no-op)", () => {
      const pixels = new Uint8Array([255, 128, 64, 32]);
      const original = new Uint8Array(pixels);

      swapPixels(pixels, 0, 0);

      assert.deepEqual(pixels, original);
    });
  });

  describe("copyRow", () => {
    it("copies entire row correctly", () => {
      const src = new Uint8Array([
        // Row 0: Red, Green
        255, 0, 0, 255, 0, 255, 0, 255,
        // Row 1: Blue, Yellow
        0, 0, 255, 255, 255, 255, 0, 255,
      ]);
      const dst = new Uint8Array(16);

      copyRow(src, dst, 0, 1, 2); // Copy row 0 to row 1
      copyRow(src, dst, 1, 0, 2); // Copy row 1 to row 0

      assert.deepEqual(
        Array.from(dst),
        [
          // Row 0: Blue, Yellow (was row 1)
          0, 0, 255, 255, 255, 255, 0, 255,
          // Row 1: Red, Green (was row 0)
          255, 0, 0, 255, 0, 255, 0, 255,
        ]
      );
    });

    it("handles single pixel rows", () => {
      const src = new Uint8Array([
        255,
        0,
        0,
        255, // Row 0
        0,
        255,
        0,
        255, // Row 1
      ]);
      const dst = new Uint8Array(8);

      copyRow(src, dst, 1, 0, 1); // Copy row 1 to row 0
      copyRow(src, dst, 0, 1, 1); // Copy row 0 to row 1

      assert.deepEqual(Array.from(dst), [
        0,
        255,
        0,
        255, // Green (was row 1)
        255,
        0,
        0,
        255, // Red (was row 0)
      ]);
    });
  });

  describe("swapRows", () => {
    it("swaps two rows correctly", () => {
      const pixels = new Uint8Array([
        // Row 0: Red, Green
        255, 0, 0, 255, 0, 255, 0, 255,
        // Row 1: Blue, Yellow
        0, 0, 255, 255, 255, 255, 0, 255,
        // Row 2: Cyan, Magenta
        0, 255, 255, 255, 255, 0, 255, 255,
      ]);

      swapRows(pixels, 0, 2, 2); // Swap row 0 and row 2

      assert.deepEqual(
        Array.from(pixels),
        [
          // Row 0: Cyan, Magenta (was row 2)
          0, 255, 255, 255, 255, 0, 255, 255,
          // Row 1: Blue, Yellow (unchanged)
          0, 0, 255, 255, 255, 255, 0, 255,
          // Row 2: Red, Green (was row 0)
          255, 0, 0, 255, 0, 255, 0, 255,
        ]
      );
    });

    it("handles swapping same row (no-op)", () => {
      const pixels = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255]);
      const original = new Uint8Array(pixels);

      swapRows(pixels, 0, 0, 2);

      assert.deepEqual(pixels, original);
    });

    it("handles single pixel rows", () => {
      const pixels = new Uint8Array([
        255,
        0,
        0,
        255, // Row 0: Red
        0,
        255,
        0,
        255, // Row 1: Green
        0,
        0,
        255,
        255, // Row 2: Blue
      ]);

      swapRows(pixels, 0, 2, 1); // Swap row 0 and row 2

      assert.deepEqual(Array.from(pixels), [
        0,
        0,
        255,
        255, // Row 0: Blue (was row 2)
        0,
        255,
        0,
        255, // Row 1: Green (unchanged)
        255,
        0,
        0,
        255, // Row 2: Red (was row 0)
      ]);
    });
  });

  describe("Performance", () => {
    it("handles medium images efficiently", () => {
      const mediumPixels = new Uint8Array(200 * 200 * 4);
      mediumPixels.fill(128);

      // Test all utility functions with medium data
      assert.doesNotThrow(() => {
        validateFlipParameters(mediumPixels, 200, 200, "horizontal");
      });

      const index = getPixelIndex(100, 100, 200);
      assert.equal(index, 80400); // (100 * 200 + 100) * 4

      // Test row operations
      const temp = new Uint8Array(mediumPixels);
      swapRows(temp, 0, 199, 200);
      assert.equal(temp.length, mediumPixels.length);
    });
  });
});
