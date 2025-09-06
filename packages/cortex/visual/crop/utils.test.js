/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for crop utility functions.
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import {
  calculateCropBounds,
  clampCropRegion,
  copyPixel,
  getPixelIndex,
  isIdentityCrop,
  validateCropParameters,
} from "./utils.js";

describe("Crop Utilities", () => {
  describe("validateCropParameters", () => {
    let validPixels;

    beforeEach(() => {
      validPixels = new Uint8Array(800 * 600 * 4); // 800x600 RGBA
    });

    it("accepts valid parameters", () => {
      assert.doesNotThrow(() => {
        validateCropParameters(validPixels, 800, 600, 100, 50, 200, 150);
      });
    });

    it("rejects non-Uint8Array pixels", () => {
      assert.throws(() => validateCropParameters([], 800, 600, 0, 0, 100, 100), /Pixels must be a Uint8Array/);
    });

    it("rejects invalid source width", () => {
      assert.throws(
        () => validateCropParameters(validPixels, 0, 600, 0, 0, 100, 100),
        /Invalid source width.*Must be positive integer/
      );
      assert.throws(
        () => validateCropParameters(validPixels, -1, 600, 0, 0, 100, 100),
        /Invalid source width.*Must be positive integer/
      );
      assert.throws(
        () => validateCropParameters(validPixels, 1.5, 600, 0, 0, 100, 100),
        /Invalid source width.*Must be positive integer/
      );
    });

    it("rejects invalid source height", () => {
      assert.throws(
        () => validateCropParameters(validPixels, 800, 0, 0, 0, 100, 100),
        /Invalid source height.*Must be positive integer/
      );
      assert.throws(
        () => validateCropParameters(validPixels, 800, -1, 0, 0, 100, 100),
        /Invalid source height.*Must be positive integer/
      );
    });

    it("rejects mismatched pixel data size", () => {
      const wrongSizePixels = new Uint8Array(100); // Too small
      assert.throws(
        () => validateCropParameters(wrongSizePixels, 800, 600, 0, 0, 100, 100),
        /Invalid pixel data size: expected 1920000, got 100/
      );
    });

    it("rejects non-integer coordinates", () => {
      assert.throws(
        () => validateCropParameters(validPixels, 800, 600, 1.5, 0, 100, 100),
        /Invalid crop X coordinate.*Must be integer/
      );
      assert.throws(
        () => validateCropParameters(validPixels, 800, 600, 0, 1.5, 100, 100),
        /Invalid crop Y coordinate.*Must be integer/
      );
    });

    it("rejects invalid crop dimensions", () => {
      assert.throws(
        () => validateCropParameters(validPixels, 800, 600, 0, 0, 0, 100),
        /Invalid crop width.*Must be positive integer/
      );
      assert.throws(
        () => validateCropParameters(validPixels, 800, 600, 0, 0, -1, 100),
        /Invalid crop width.*Must be positive integer/
      );
      assert.throws(
        () => validateCropParameters(validPixels, 800, 600, 0, 0, 100, 0),
        /Invalid crop height.*Must be positive integer/
      );
    });
  });

  describe("clampCropRegion", () => {
    it("returns unchanged region when within bounds", () => {
      const result = clampCropRegion(800, 600, 100, 50, 200, 150);
      assert.deepEqual(result, { x: 100, y: 50, width: 200, height: 150 });
    });

    it("clamps negative coordinates to zero", () => {
      const result = clampCropRegion(800, 600, -10, -5, 100, 100);
      assert.deepEqual(result, { x: 0, y: 0, width: 100, height: 100 });
    });

    it("clamps oversized dimensions", () => {
      const result = clampCropRegion(800, 600, 700, 500, 200, 200);
      assert.deepEqual(result, { x: 700, y: 500, width: 100, height: 100 });
    });

    it("handles coordinates beyond image bounds", () => {
      const result = clampCropRegion(800, 600, 900, 700, 100, 100);
      assert.deepEqual(result, { x: 799, y: 599, width: 1, height: 1 });
    });

    it("ensures minimum dimensions of 1x1", () => {
      const result = clampCropRegion(800, 600, 799, 599, 10, 10);
      assert.deepEqual(result, { x: 799, y: 599, width: 1, height: 1 });
    });
  });

  describe("calculateCropBounds", () => {
    it("returns unchanged bounds for valid region", () => {
      const result = calculateCropBounds(800, 600, 100, 50, 200, 150);
      assert.deepEqual(result, { x: 100, y: 50, width: 200, height: 150 });
    });

    it("returns null for completely out-of-bounds region", () => {
      assert.equal(calculateCropBounds(800, 600, 900, 700, 100, 100), null);
      assert.equal(calculateCropBounds(800, 600, -200, -100, 100, 50), null);
    });

    it("calculates intersection for partially out-of-bounds region", () => {
      // Crop extends beyond right and bottom edges
      const result = calculateCropBounds(800, 600, 700, 500, 200, 200);
      assert.deepEqual(result, { x: 700, y: 500, width: 100, height: 100 });
    });

    it("calculates intersection for negative coordinates", () => {
      // Crop starts outside image but extends into it
      const result = calculateCropBounds(800, 600, -50, -30, 100, 80);
      assert.deepEqual(result, { x: 0, y: 0, width: 50, height: 50 });
    });

    it("returns null for zero-area intersections", () => {
      assert.equal(calculateCropBounds(800, 600, 800, 0, 100, 100), null);
      assert.equal(calculateCropBounds(800, 600, 0, 600, 100, 100), null);
    });
  });

  describe("isIdentityCrop", () => {
    it("returns true for full image crop", () => {
      assert.equal(isIdentityCrop(800, 600, 0, 0, 800, 600), true);
    });

    it("returns false for partial crops", () => {
      assert.equal(isIdentityCrop(800, 600, 0, 0, 400, 300), false);
      assert.equal(isIdentityCrop(800, 600, 100, 50, 700, 550), false);
      assert.equal(isIdentityCrop(800, 600, 0, 0, 800, 599), false);
    });

    it("returns false for offset crops even if same size", () => {
      assert.equal(isIdentityCrop(800, 600, 1, 0, 800, 600), false);
      assert.equal(isIdentityCrop(800, 600, 0, 1, 800, 600), false);
    });
  });

  describe("getPixelIndex", () => {
    it("calculates correct index for top-left pixel", () => {
      assert.equal(getPixelIndex(0, 0, 800), 0);
    });

    it("calculates correct index for arbitrary pixel", () => {
      // Pixel at (100, 50) in 800-wide image
      // Row 50 * 800 pixels + column 100 = 40100 pixels
      // 40100 pixels * 4 bytes = 160400 bytes
      assert.equal(getPixelIndex(100, 50, 800), 160400);
    });

    it("calculates correct index for last pixel in row", () => {
      // Last pixel in first row (799, 0)
      assert.equal(getPixelIndex(799, 0, 800), 3196);
    });

    it("calculates correct index for first pixel in second row", () => {
      // First pixel in second row (0, 1)
      assert.equal(getPixelIndex(0, 1, 800), 3200);
    });
  });

  describe("copyPixel", () => {
    let srcPixels, dstPixels;

    beforeEach(() => {
      srcPixels = new Uint8Array([255, 128, 64, 32, 0, 0, 0, 0]);
      dstPixels = new Uint8Array(8);
    });

    it("copies RGBA pixel correctly", () => {
      copyPixel(srcPixels, dstPixels, 0, 4);
      assert.deepEqual(Array.from(dstPixels), [0, 0, 0, 0, 255, 128, 64, 32]);
    });

    it("copies pixel to beginning of destination", () => {
      copyPixel(srcPixels, dstPixels, 4, 0);
      assert.deepEqual(Array.from(dstPixels), [0, 0, 0, 0, 0, 0, 0, 0]);
    });

    it("handles multiple pixel copies", () => {
      // Set up source with two distinct pixels
      srcPixels = new Uint8Array([
        255,
        0,
        0,
        255, // Red pixel
        0,
        255,
        0,
        128, // Green pixel with alpha
      ]);
      dstPixels = new Uint8Array(8);

      copyPixel(srcPixels, dstPixels, 0, 0); // Copy red pixel
      copyPixel(srcPixels, dstPixels, 4, 4); // Copy green pixel

      assert.deepEqual(Array.from(dstPixels), [
        255,
        0,
        0,
        255, // Red pixel
        0,
        255,
        0,
        128, // Green pixel
      ]);
    });
  });
});

