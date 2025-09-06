/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for main crop functionality.
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { cropPixels, cropPixelsExplicit, getCropInfo } from "./index.js";

describe("Crop Main Functions", () => {
  describe("cropPixels", () => {
    let testPixels;

    beforeEach(() => {
      // Create 4x3 test image with distinct colored pixels
      testPixels = new Uint8Array([
        // Row 0: Red, Green, Blue, Yellow
        255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255,
        // Row 1: Cyan, Magenta, White, Black
        0, 255, 255, 255, 255, 0, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255,
        // Row 2: Gray, Orange, Purple, Brown
        128, 128, 128, 255, 255, 165, 0, 255, 128, 0, 128, 255, 165, 42, 42, 255,
      ]);
    });

    it("crops basic rectangular region", () => {
      // Crop 2x2 region starting at (1,1)
      const result = cropPixels(testPixels, 4, 3, 1, 1, 2, 2);

      // Should contain: Magenta, White, Orange, Purple
      const expected = new Uint8Array([
        255,
        0,
        255,
        255,
        255,
        255,
        255,
        255, // Row 1: Magenta, White
        255,
        165,
        0,
        255,
        128,
        0,
        128,
        255, // Row 2: Orange, Purple
      ]);

      assert.deepEqual(result, expected);
    });

    it("handles identity crop (returns copy)", () => {
      const result = cropPixels(testPixels, 4, 3, 0, 0, 4, 3);
      assert.deepEqual(result, testPixels);
      assert.notEqual(result, testPixels); // Should be a copy, not same reference
    });

    it("crops single pixel", () => {
      // Crop just the blue pixel at (2,0)
      const result = cropPixels(testPixels, 4, 3, 2, 0, 1, 1);
      const expected = new Uint8Array([0, 0, 255, 255]); // Blue pixel
      assert.deepEqual(result, expected);
    });

    it("crops entire row", () => {
      // Crop entire middle row (row 1)
      const result = cropPixels(testPixels, 4, 3, 0, 1, 4, 1);
      const expected = new Uint8Array([0, 255, 255, 255, 255, 0, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255]);
      assert.deepEqual(result, expected);
    });

    it("crops entire column", () => {
      // Crop rightmost column (column 3)
      const result = cropPixels(testPixels, 4, 3, 3, 0, 1, 3);
      const expected = new Uint8Array([
        255,
        255,
        0,
        255, // Yellow
        0,
        0,
        0,
        255, // Black
        165,
        42,
        42,
        255, // Brown
      ]);
      assert.deepEqual(result, expected);
    });

    it("handles out-of-bounds crop with clamping", () => {
      // Try to crop beyond image boundaries
      const result = cropPixels(testPixels, 4, 3, 2, 1, 5, 5);

      // Should be clamped to available region (2x2 from (2,1) to (3,2))
      const expected = new Uint8Array([
        255,
        255,
        255,
        255,
        0,
        0,
        0,
        255, // White, Black
        128,
        0,
        128,
        255,
        165,
        42,
        42,
        255, // Purple, Brown
      ]);
      assert.deepEqual(result, expected);
    });

    it("handles negative coordinates with clamping", () => {
      // Start crop at negative coordinates
      const result = cropPixels(testPixels, 4, 3, -1, -1, 3, 3);

      // Should be clamped to (0,0) with reduced size (2x2)
      const expected = new Uint8Array([
        255,
        0,
        0,
        255,
        0,
        255,
        0,
        255, // Red, Green
        0,
        255,
        255,
        255,
        255,
        0,
        255,
        255, // Cyan, Magenta
      ]);
      assert.deepEqual(result, expected);
    });

    it("throws error for completely out-of-bounds crop", () => {
      assert.throws(() => cropPixels(testPixels, 4, 3, 10, 10, 2, 2), /Crop region.*is entirely outside image bounds/);
    });

    it("throws error for invalid parameters", () => {
      assert.throws(() => cropPixels(testPixels, 4, 3, 0, 0, 0, 2), /Invalid crop width.*Must be positive integer/);
    });

    it("handles edge case: crop at image boundary", () => {
      // Crop bottom-right corner
      const result = cropPixels(testPixels, 4, 3, 3, 2, 1, 1);
      const expected = new Uint8Array([165, 42, 42, 255]); // Brown pixel
      assert.deepEqual(result, expected);
    });
  });

  describe("cropPixelsExplicit", () => {
    let testPixels;

    beforeEach(() => {
      // Simple 2x2 test image
      testPixels = new Uint8Array([
        255,
        0,
        0,
        255,
        0,
        255,
        0,
        255, // Red, Green
        0,
        0,
        255,
        255,
        255,
        255,
        0,
        255, // Blue, Yellow
      ]);
    });

    it("produces same result as optimized version", () => {
      const optimized = cropPixels(testPixels, 2, 2, 0, 0, 1, 2);
      const explicit = cropPixelsExplicit(testPixels, 2, 2, 0, 0, 1, 2);
      assert.deepEqual(optimized, explicit);
    });

    it("handles single pixel crop", () => {
      const result = cropPixelsExplicit(testPixels, 2, 2, 1, 1, 1, 1);
      const expected = new Uint8Array([255, 255, 0, 255]); // Yellow pixel
      assert.deepEqual(result, expected);
    });

    it("handles identity crop", () => {
      const result = cropPixelsExplicit(testPixels, 2, 2, 0, 0, 2, 2);
      assert.deepEqual(result, testPixels);
      assert.notEqual(result, testPixels); // Should be copy
    });
  });

  describe("getCropInfo", () => {
    it("returns valid info for normal crop", () => {
      const info = getCropInfo(800, 600, 100, 50, 200, 150);
      assert.equal(info.isValid, true);
      assert.equal(info.isIdentity, false);
      assert.deepEqual(info.effectiveBounds, { x: 100, y: 50, width: 200, height: 150 });
      assert.equal(info.outputSize, 200 * 150 * 4);
    });

    it("detects identity crop", () => {
      const info = getCropInfo(800, 600, 0, 0, 800, 600);
      assert.equal(info.isValid, true);
      assert.equal(info.isIdentity, true);
      assert.deepEqual(info.effectiveBounds, { x: 0, y: 0, width: 800, height: 600 });
      assert.equal(info.outputSize, 800 * 600 * 4);
    });

    it("handles out-of-bounds crop", () => {
      const info = getCropInfo(800, 600, 700, 500, 200, 200);
      assert.equal(info.isValid, true);
      assert.equal(info.isIdentity, false);
      assert.deepEqual(info.effectiveBounds, { x: 700, y: 500, width: 100, height: 100 });
      assert.equal(info.outputSize, 100 * 100 * 4);
    });

    it("detects completely invalid crop", () => {
      const info = getCropInfo(800, 600, 900, 700, 100, 100);
      assert.equal(info.isValid, false);
      assert.equal(info.isIdentity, false);
      assert.equal(info.effectiveBounds, null);
      assert.equal(info.outputSize, 0);
    });

    it("handles invalid parameters gracefully", () => {
      const info = getCropInfo(-1, 600, 0, 0, 100, 100);
      assert.equal(info.isValid, false);
      assert.equal(info.isIdentity, false);
      assert.equal(info.effectiveBounds, null);
      assert.equal(info.outputSize, 0);
    });

    it("handles zero dimensions", () => {
      const info = getCropInfo(800, 600, 0, 0, 0, 100);
      assert.equal(info.isValid, false);
    });

    it("handles negative coordinates with intersection", () => {
      const info = getCropInfo(800, 600, -50, -30, 100, 80);
      assert.equal(info.isValid, true);
      assert.deepEqual(info.effectiveBounds, { x: 0, y: 0, width: 50, height: 50 });
      assert.equal(info.outputSize, 50 * 50 * 4);
    });
  });

  describe("Performance", () => {
    it("handles medium images efficiently", () => {
      // Create 200x200 test image (much smaller to avoid hanging)
      const mediumPixels = new Uint8Array(200 * 200 * 4);

      // Fill with simple pattern
      mediumPixels.fill(128);

      const result = cropPixels(mediumPixels, 200, 200, 50, 50, 100, 100);

      // Just verify correctness, no timing
      assert.equal(result.length, 100 * 100 * 4);
    });

    it("optimized version works correctly", () => {
      // Create small test image
      const pixels = new Uint8Array(100 * 100 * 4);
      pixels.fill(200);

      const result1 = cropPixels(pixels, 100, 100, 25, 25, 50, 50);
      const result2 = cropPixelsExplicit(pixels, 100, 100, 25, 25, 50, 50);

      // Results should be identical
      assert.deepEqual(result1, result2);
    });
  });
});
