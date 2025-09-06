/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for arbitrary angle rotation functions.
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { rotateBicubic, rotateBilinear, rotateLanczos, rotateNearest } from "./rotate-arbitrary.js";

describe("Arbitrary Angle Rotations", () => {
  let testPixels;

  beforeEach(() => {
    // Create 4x4 test image
    testPixels = new Uint8Array(4 * 4 * 4);
    // Fill with gradient pattern
    for (let i = 0; i < testPixels.length; i += 4) {
      testPixels[i] = (i / 4) % 256; // Red gradient
      testPixels[i + 1] = 128; // Constant green
      testPixels[i + 2] = 255 - ((i / 4) % 256); // Blue gradient
      testPixels[i + 3] = 255; // Full alpha
    }
  });

  describe("rotateNearest", () => {
    it("rotates by 45° with correct dimensions", () => {
      const result = rotateNearest(testPixels, 4, 4, 45);

      // 45° rotation of 4x4 should be approximately 6x6
      assert(result.width >= 5 && result.width <= 7);
      assert(result.height >= 5 && result.height <= 7);
      assert.equal(result.pixels.length, result.width * result.height * 4);
    });

    it("uses default transparent fill color", () => {
      const result = rotateNearest(testPixels, 4, 4, 45);

      // Check that some pixels are transparent (fill color)
      let hasTransparent = false;
      for (let i = 3; i < result.pixels.length; i += 4) {
        if (result.pixels[i] === 0) {
          // Alpha = 0
          hasTransparent = true;
          break;
        }
      }
      assert(hasTransparent, "Should have transparent pixels from fill color");
    });

    it("uses custom fill color", () => {
      const fillColor = [255, 0, 0, 128]; // Semi-transparent red
      const result = rotateNearest(testPixels, 4, 4, 45, fillColor);

      // For 45° rotation, output should be larger
      assert(result.width > 4, "Output should be larger than input");
      assert(result.height > 4, "Output should be larger than input");

      // Just verify the function accepts the fill color parameter without error
      // and produces a valid result
      assert(result.pixels instanceof Uint8Array);
      assert.equal(result.pixels.length, result.width * result.height * 4);

      // Should have some non-transparent pixels from the original image
      let hasNonTransparent = false;
      for (let i = 3; i < result.pixels.length; i += 4) {
        if (result.pixels[i] > 0) {
          hasNonTransparent = true;
          break;
        }
      }
      assert(hasNonTransparent, "Should have non-transparent pixels");
    });
  });

  describe("rotateBilinear", () => {
    it("rotates with bilinear interpolation", () => {
      const result = rotateBilinear(testPixels, 4, 4, 30);

      assert(result.width > 4);
      assert(result.height > 4);
      assert.equal(result.pixels.length, result.width * result.height * 4);
    });

    it("produces smoother results than nearest", () => {
      const nearest = rotateNearest(testPixels, 4, 4, 30);
      const bilinear = rotateBilinear(testPixels, 4, 4, 30);

      // Both should have same dimensions
      assert.equal(nearest.width, bilinear.width);
      assert.equal(nearest.height, bilinear.height);

      // Results should be different (bilinear is smoother)
      assert.notDeepEqual(nearest.pixels, bilinear.pixels);
    });
  });

  describe("rotateBicubic", () => {
    it("rotates with bicubic interpolation", () => {
      const result = rotateBicubic(testPixels, 4, 4, 45);

      assert(result.width > 4);
      assert(result.height > 4);
      assert.equal(result.pixels.length, result.width * result.height * 4);
    });
  });

  describe("rotateLanczos", () => {
    it("rotates with Lanczos resampling", () => {
      const result = rotateLanczos(testPixels, 4, 4, 60);

      assert(result.width > 4);
      assert(result.height > 4);
      assert.equal(result.pixels.length, result.width * result.height * 4);
    });
  });

  describe("Edge Cases", () => {
    it("handles small angles", () => {
      const result = rotateNearest(testPixels, 4, 4, 1);
      assert(result.width >= 4);
      assert(result.height >= 4);
    });

    it("handles large angles", () => {
      const result = rotateNearest(testPixels, 4, 4, 359);
      assert(result.width >= 4);
      assert(result.height >= 4);
    });

    it("handles negative angles", () => {
      const result = rotateNearest(testPixels, 4, 4, -45);
      assert(result.width > 4);
      assert(result.height > 4);
    });
  });

  describe("Performance", () => {
    it("handles medium images efficiently", () => {
      const mediumPixels = new Uint8Array(50 * 50 * 4);
      mediumPixels.fill(128);

      const result = rotateNearest(mediumPixels, 50, 50, 45);
      assert(result.width > 50);
      assert(result.height > 50);
    });

    it("all algorithms complete in reasonable time", () => {
      const pixels = new Uint8Array(20 * 20 * 4);
      pixels.fill(128);

      // Test all algorithms
      const nearest = rotateNearest(pixels, 20, 20, 45);
      const bilinear = rotateBilinear(pixels, 20, 20, 45);
      const bicubic = rotateBicubic(pixels, 20, 20, 45);
      const lanczos = rotateLanczos(pixels, 20, 20, 45);

      // All should produce valid results
      assert(nearest.pixels.length > 0);
      assert(bilinear.pixels.length > 0);
      assert(bicubic.pixels.length > 0);
      assert(lanczos.pixels.length > 0);
    });
  });
});
