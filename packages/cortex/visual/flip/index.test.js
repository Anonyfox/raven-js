/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for main flip functionality.
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { flipHorizontal, flipPixels, flipVertical, getFlipInfo } from "./index.js";

describe("Main Flip Functions", () => {
  let testPixels;

  beforeEach(() => {
    // Create 3x2 test image with distinct colors
    testPixels = new Uint8Array([
      // Row 0: Red, Green, Blue
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255,
      // Row 1: Yellow, Cyan, Magenta
      255, 255, 0, 255, 0, 255, 255, 255, 255, 0, 255, 255,
    ]);
  });

  describe("flipPixels", () => {
    it("flips horizontally", () => {
      const result = flipPixels(testPixels, 3, 2, "horizontal", false);

      assert.equal(result.width, 3);
      assert.equal(result.height, 2);
      assert.equal(result.pixels.length, 3 * 2 * 4);

      // Check that pixels are horizontally flipped
      // Original row 0: Red, Green, Blue -> Blue, Green, Red
      const row0 = Array.from(result.pixels.slice(0, 12));
      assert.deepEqual(row0, [
        0,
        0,
        255,
        255, // Blue (was at position 2)
        0,
        255,
        0,
        255, // Green (stays in middle)
        255,
        0,
        0,
        255, // Red (was at position 0)
      ]);
    });

    it("flips vertically", () => {
      const result = flipPixels(testPixels, 3, 2, "vertical", false);

      assert.equal(result.width, 3);
      assert.equal(result.height, 2);

      // Check that rows are vertically flipped
      // Original row 0 should now be row 1
      const row0 = Array.from(result.pixels.slice(0, 12));
      const row1 = Array.from(result.pixels.slice(12, 24));

      // Row 0 should be original row 1 (Yellow, Cyan, Magenta)
      assert.deepEqual(row0, [255, 255, 0, 255, 0, 255, 255, 255, 255, 0, 255, 255]);

      // Row 1 should be original row 0 (Red, Green, Blue)
      assert.deepEqual(row1, [255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);
    });

    it("supports in-place modification", () => {
      const original = new Uint8Array(testPixels);
      const result = flipPixels(testPixels, 3, 2, "horizontal", true);

      // Should return the same array reference
      assert.equal(result.pixels, testPixels);

      // Original array should be modified
      assert.notDeepEqual(testPixels, original);
    });

    it("supports creating new array", () => {
      const original = new Uint8Array(testPixels);
      const result = flipPixels(testPixels, 3, 2, "horizontal", false);

      // Should return a different array reference
      assert.notEqual(result.pixels, testPixels);

      // Original array should be unchanged
      assert.deepEqual(testPixels, original);
    });

    it("validates parameters", () => {
      assert.throws(() => flipPixels([], 3, 2, "horizontal"), /Pixels must be a Uint8Array/);

      assert.throws(
        () => flipPixels(testPixels, 3, 2, "diagonal"),
        /Invalid flip direction.*Must be "horizontal" or "vertical"/
      );

      assert.throws(() => flipPixels(testPixels, -1, 2, "horizontal"), /Invalid width.*Must be positive integer/);
    });
  });

  describe("flipHorizontal", () => {
    it("mirrors image left-to-right", () => {
      const result = flipHorizontal(testPixels, 3, 2, false);

      // Check specific pixel positions
      // Original (0,0) Red should be at (2,0)
      const pixel_2_0 = Array.from(result.pixels.slice(8, 12));
      assert.deepEqual(pixel_2_0, [255, 0, 0, 255]); // Red

      // Original (2,0) Blue should be at (0,0)
      const pixel_0_0 = Array.from(result.pixels.slice(0, 4));
      assert.deepEqual(pixel_0_0, [0, 0, 255, 255]); // Blue

      // Middle pixel should stay in place
      const pixel_1_0 = Array.from(result.pixels.slice(4, 8));
      assert.deepEqual(pixel_1_0, [0, 255, 0, 255]); // Green
    });

    it("handles odd width correctly", () => {
      // Create 3x1 image (odd width)
      const oddPixels = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);

      const result = flipHorizontal(oddPixels, 3, 1, false);

      // Should be: Blue, Green, Red
      assert.deepEqual(Array.from(result.pixels), [0, 0, 255, 255, 0, 255, 0, 255, 255, 0, 0, 255]);
    });

    it("handles even width correctly", () => {
      // Create 2x1 image (even width)
      const evenPixels = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);

      const result = flipHorizontal(evenPixels, 2, 1, false);

      // Should be: Green, Red
      assert.deepEqual(Array.from(result.pixels), [0, 255, 0, 255, 255, 0, 0, 255]);
    });
  });

  describe("flipVertical", () => {
    it("mirrors image top-to-bottom", () => {
      const result = flipVertical(testPixels, 3, 2, false);

      // Row 0 should be original row 1
      const row0 = Array.from(result.pixels.slice(0, 12));
      assert.deepEqual(row0, [255, 255, 0, 255, 0, 255, 255, 255, 255, 0, 255, 255]);

      // Row 1 should be original row 0
      const row1 = Array.from(result.pixels.slice(12, 24));
      assert.deepEqual(row1, [255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);
    });

    it("handles odd height correctly", () => {
      // Create 2x3 image (odd height)
      const oddPixels = new Uint8Array([
        // Row 0: Red, Green
        255, 0, 0, 255, 0, 255, 0, 255,
        // Row 1: Blue, Yellow
        0, 0, 255, 255, 255, 255, 0, 255,
        // Row 2: Cyan, Magenta
        0, 255, 255, 255, 255, 0, 255, 255,
      ]);

      const result = flipVertical(oddPixels, 2, 3, false);

      // Should be: Row 2, Row 1, Row 0
      const expectedRows = [
        // Row 0: Cyan, Magenta (was row 2)
        0, 255, 255, 255, 255, 0, 255, 255,
        // Row 1: Blue, Yellow (unchanged - middle row)
        0, 0, 255, 255, 255, 255, 0, 255,
        // Row 2: Red, Green (was row 0)
        255, 0, 0, 255, 0, 255, 0, 255,
      ];

      assert.deepEqual(Array.from(result.pixels), expectedRows);
    });

    it("handles even height correctly", () => {
      // testPixels is 3x2 (even height)
      const result = flipVertical(testPixels, 3, 2, false);

      // Row 0 should be original row 1
      // Row 1 should be original row 0
      const expectedRows = [
        // Row 0: Yellow, Cyan, Magenta (was row 1)
        255, 255, 0, 255, 0, 255, 255, 255, 255, 0, 255, 255,
        // Row 1: Red, Green, Blue (was row 0)
        255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255,
      ];

      assert.deepEqual(Array.from(result.pixels), expectedRows);
    });
  });

  describe("getFlipInfo", () => {
    it("returns correct info for horizontal flip", () => {
      const info = getFlipInfo(800, 600, "horizontal");

      assert.equal(info.direction, "horizontal");
      assert.equal(info.isLossless, true);
      assert.equal(info.isValid, true);
      assert.deepEqual(info.outputDimensions, { width: 800, height: 600 });
      assert.equal(info.outputSize, 800 * 600 * 4);
    });

    it("returns correct info for vertical flip", () => {
      const info = getFlipInfo(800, 600, "vertical");

      assert.equal(info.direction, "vertical");
      assert.equal(info.isLossless, true);
      assert.equal(info.isValid, true);
      assert.deepEqual(info.outputDimensions, { width: 800, height: 600 });
      assert.equal(info.outputSize, 800 * 600 * 4);
    });

    it("handles invalid parameters gracefully", () => {
      const info = getFlipInfo(-1, 600, "horizontal");

      assert.equal(info.direction, "horizontal");
      assert.equal(info.isLossless, true);
      assert.equal(info.isValid, false);
      assert.deepEqual(info.outputDimensions, { width: 0, height: 0 });
      assert.equal(info.outputSize, 0);
    });

    it("handles invalid direction gracefully", () => {
      const info = getFlipInfo(800, 600, "diagonal");

      assert.equal(info.isValid, false);
    });
  });

  describe("Integration", () => {
    it("double horizontal flip returns to original", () => {
      const step1 = flipPixels(testPixels, 3, 2, "horizontal", false);
      const step2 = flipPixels(step1.pixels, step1.width, step1.height, "horizontal", false);

      assert.deepEqual(step2.pixels, testPixels);
    });

    it("double vertical flip returns to original", () => {
      const step1 = flipPixels(testPixels, 3, 2, "vertical", false);
      const step2 = flipPixels(step1.pixels, step1.width, step1.height, "vertical", false);

      assert.deepEqual(step2.pixels, testPixels);
    });

    it("horizontal then vertical equals 180° rotation", () => {
      const horizontal = flipPixels(testPixels, 3, 2, "horizontal", false);
      const both = flipPixels(horizontal.pixels, horizontal.width, horizontal.height, "vertical", false);

      // This should be equivalent to rotating 180°
      // Original: Red,Green,Blue / Yellow,Cyan,Magenta
      // Expected: Magenta,Cyan,Yellow / Blue,Green,Red

      const expectedResult = [
        // Row 0: Magenta, Cyan, Yellow (bottom row reversed)
        255, 0, 255, 255, 0, 255, 255, 255, 255, 255, 0, 255,
        // Row 1: Blue, Green, Red (top row reversed)
        0, 0, 255, 255, 0, 255, 0, 255, 255, 0, 0, 255,
      ];

      assert.deepEqual(Array.from(both.pixels), expectedResult);
    });

    it("supports method chaining pattern", () => {
      // Simulate chaining by using result of one flip as input to next
      const step1 = flipPixels(testPixels, 3, 2, "horizontal", false);
      const step2 = flipPixels(step1.pixels, step1.width, step1.height, "vertical", false);

      // Should have valid dimensions
      assert.equal(step2.width, 3);
      assert.equal(step2.height, 2);
      assert.equal(step2.pixels.length, 3 * 2 * 4);
    });
  });

  describe("Performance", () => {
    it("handles medium images efficiently", () => {
      const mediumPixels = new Uint8Array(200 * 200 * 4);
      mediumPixels.fill(128);

      const horizontal = flipPixels(mediumPixels, 200, 200, "horizontal", false);
      const vertical = flipPixels(mediumPixels, 200, 200, "vertical", false);

      assert.equal(horizontal.width, 200);
      assert.equal(horizontal.height, 200);
      assert.equal(vertical.width, 200);
      assert.equal(vertical.height, 200);
    });

    it("in-place operations are efficient", () => {
      const pixels = new Uint8Array(100 * 100 * 4);
      pixels.fill(128);

      const result = flipPixels(pixels, 100, 100, "horizontal", true);

      // Should return same array reference (no allocation)
      assert.equal(result.pixels, pixels);
      assert.equal(result.width, 100);
      assert.equal(result.height, 100);
    });
  });
});
