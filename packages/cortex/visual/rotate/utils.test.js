/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for rotation utility functions.
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import {
  calculateRotatedDimensions,
  clampColor,
  copyPixel,
  degreesToRadians,
  getPixelIndex,
  getPixelSafe,
  isIdentityRotation,
  isQuadrantRotation,
  normalizeAngle,
  setPixel,
  validateRotationParameters,
} from "./utils.js";

describe("Rotation Utilities", () => {
  describe("validateRotationParameters", () => {
    let validPixels;

    beforeEach(() => {
      validPixels = new Uint8Array(800 * 600 * 4); // 800x600 RGBA
    });

    it("accepts valid parameters", () => {
      assert.doesNotThrow(() => {
        validateRotationParameters(validPixels, 800, 600, 90);
      });
    });

    it("rejects non-Uint8Array pixels", () => {
      assert.throws(() => validateRotationParameters([], 800, 600, 90), /Pixels must be a Uint8Array/);
    });

    it("rejects invalid source dimensions", () => {
      assert.throws(
        () => validateRotationParameters(validPixels, 0, 600, 90),
        /Invalid source width.*Must be positive integer/
      );
      assert.throws(
        () => validateRotationParameters(validPixels, 800, -1, 90),
        /Invalid source height.*Must be positive integer/
      );
    });

    it("rejects mismatched pixel data size", () => {
      const wrongSizePixels = new Uint8Array(100);
      assert.throws(
        () => validateRotationParameters(wrongSizePixels, 800, 600, 90),
        /Invalid pixel data size: expected 1920000, got 100/
      );
    });

    it("rejects invalid rotation angles", () => {
      assert.throws(
        () => validateRotationParameters(validPixels, 800, 600, "90"),
        /Invalid rotation angle.*Must be a finite number/
      );
      assert.throws(
        () => validateRotationParameters(validPixels, 800, 600, Number.POSITIVE_INFINITY),
        /Invalid rotation angle.*Must be a finite number/
      );
    });
  });

  describe("normalizeAngle", () => {
    it("handles angles in normal range", () => {
      assert.equal(normalizeAngle(0), 0);
      assert.equal(normalizeAngle(90), 90);
      assert.equal(normalizeAngle(180), 180);
      assert.equal(normalizeAngle(270), 270);
      assert.equal(normalizeAngle(359), 359);
    });

    it("normalizes angles > 360", () => {
      assert.equal(normalizeAngle(360), 0);
      assert.equal(normalizeAngle(450), 90);
      assert.equal(normalizeAngle(720), 0);
      assert.equal(normalizeAngle(810), 90);
    });

    it("normalizes negative angles", () => {
      assert.equal(normalizeAngle(-90), 270);
      assert.equal(normalizeAngle(-180), 180);
      assert.equal(normalizeAngle(-270), 90);
      assert.equal(normalizeAngle(-360), 0);
      assert.equal(normalizeAngle(-450), 270);
    });

    it("handles fractional angles", () => {
      assert.equal(normalizeAngle(90.5), 90.5);
      assert.equal(normalizeAngle(450.5), 90.5);
      assert.equal(normalizeAngle(-90.5), 269.5);
    });
  });

  describe("isQuadrantRotation", () => {
    it("identifies 90° multiples", () => {
      assert.equal(isQuadrantRotation(0), true);
      assert.equal(isQuadrantRotation(90), true);
      assert.equal(isQuadrantRotation(180), true);
      assert.equal(isQuadrantRotation(270), true);
    });

    it("identifies 90° multiples with normalization", () => {
      assert.equal(isQuadrantRotation(360), true);
      assert.equal(isQuadrantRotation(450), true);
      assert.equal(isQuadrantRotation(-90), true);
      assert.equal(isQuadrantRotation(-180), true);
    });

    it("rejects non-90° multiples", () => {
      assert.equal(isQuadrantRotation(45), false);
      assert.equal(isQuadrantRotation(30), false);
      assert.equal(isQuadrantRotation(135), false);
      assert.equal(isQuadrantRotation(89), false);
      assert.equal(isQuadrantRotation(91), false);
    });
  });

  describe("isIdentityRotation", () => {
    it("identifies identity rotations", () => {
      assert.equal(isIdentityRotation(0), true);
      assert.equal(isIdentityRotation(360), true);
      assert.equal(isIdentityRotation(720), true);
      assert.equal(isIdentityRotation(-360), true);
    });

    it("handles floating point precision", () => {
      assert.equal(isIdentityRotation(0.0001), true);
      assert.equal(isIdentityRotation(359.9999), true);
      assert.equal(isIdentityRotation(-0.0001), true);
    });

    it("rejects non-identity rotations", () => {
      assert.equal(isIdentityRotation(90), false);
      assert.equal(isIdentityRotation(1), false);
      assert.equal(isIdentityRotation(359), false);
    });
  });

  describe("calculateRotatedDimensions", () => {
    it("handles 90° rotations (dimensions swap)", () => {
      assert.deepEqual(calculateRotatedDimensions(800, 600, 90), { width: 600, height: 800 });
      assert.deepEqual(calculateRotatedDimensions(800, 600, 270), { width: 600, height: 800 });
      assert.deepEqual(calculateRotatedDimensions(800, 600, -90), { width: 600, height: 800 });
    });

    it("handles 180° rotations (dimensions unchanged)", () => {
      assert.deepEqual(calculateRotatedDimensions(800, 600, 180), { width: 800, height: 600 });
      assert.deepEqual(calculateRotatedDimensions(800, 600, -180), { width: 800, height: 600 });
    });

    it("handles identity rotations", () => {
      assert.deepEqual(calculateRotatedDimensions(800, 600, 0), { width: 800, height: 600 });
      assert.deepEqual(calculateRotatedDimensions(800, 600, 360), { width: 800, height: 600 });
    });

    it("calculates dimensions for arbitrary angles", () => {
      // 45° rotation of 100x100 should be ~141x141
      const result45 = calculateRotatedDimensions(100, 100, 45);
      assert(result45.width >= 141 && result45.width <= 142);
      assert(result45.height >= 141 && result45.height <= 142);

      // 30° rotation increases dimensions
      const result30 = calculateRotatedDimensions(800, 600, 30);
      assert(result30.width > 800);
      assert(result30.height > 600);
    });

    it("handles square images", () => {
      assert.deepEqual(calculateRotatedDimensions(500, 500, 90), { width: 500, height: 500 });

      const result45 = calculateRotatedDimensions(500, 500, 45);
      assert(result45.width === result45.height); // Should remain square
    });
  });

  describe("degreesToRadians", () => {
    it("converts common angles correctly", () => {
      assert.equal(degreesToRadians(0), 0);
      assert.equal(degreesToRadians(90), Math.PI / 2);
      assert.equal(degreesToRadians(180), Math.PI);
      assert.equal(degreesToRadians(270), (3 * Math.PI) / 2);
      assert.equal(degreesToRadians(360), 2 * Math.PI);
    });

    it("handles negative angles", () => {
      assert.equal(degreesToRadians(-90), -Math.PI / 2);
      assert.equal(degreesToRadians(-180), -Math.PI);
    });

    it("handles fractional angles", () => {
      assert.equal(degreesToRadians(45), Math.PI / 4);
      assert.equal(degreesToRadians(30), Math.PI / 6);
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
  });

  describe("getPixelSafe", () => {
    let testPixels;

    beforeEach(() => {
      // Create 2x2 test image
      testPixels = new Uint8Array([
        255,
        0,
        0,
        255, // Red pixel at (0,0)
        0,
        255,
        0,
        255, // Green pixel at (1,0)
        0,
        0,
        255,
        255, // Blue pixel at (0,1)
        255,
        255,
        0,
        255, // Yellow pixel at (1,1)
      ]);
    });

    it("returns correct pixel for valid coordinates", () => {
      assert.deepEqual(getPixelSafe(testPixels, 0, 0, 2, 2), [255, 0, 0, 255]); // Red
      assert.deepEqual(getPixelSafe(testPixels, 1, 0, 2, 2), [0, 255, 0, 255]); // Green
      assert.deepEqual(getPixelSafe(testPixels, 0, 1, 2, 2), [0, 0, 255, 255]); // Blue
      assert.deepEqual(getPixelSafe(testPixels, 1, 1, 2, 2), [255, 255, 0, 255]); // Yellow
    });

    it("returns transparent black for out-of-bounds coordinates", () => {
      assert.deepEqual(getPixelSafe(testPixels, -1, 0, 2, 2), [0, 0, 0, 0]);
      assert.deepEqual(getPixelSafe(testPixels, 2, 0, 2, 2), [0, 0, 0, 0]);
      assert.deepEqual(getPixelSafe(testPixels, 0, -1, 2, 2), [0, 0, 0, 0]);
      assert.deepEqual(getPixelSafe(testPixels, 0, 2, 2, 2), [0, 0, 0, 0]);
    });
  });

  describe("setPixel", () => {
    let testPixels;

    beforeEach(() => {
      testPixels = new Uint8Array(2 * 2 * 4); // 2x2 RGBA
    });

    it("sets pixel correctly", () => {
      setPixel(testPixels, 0, 0, 2, 255, 128, 64, 32);
      assert.deepEqual(Array.from(testPixels.slice(0, 4)), [255, 128, 64, 32]);
    });

    it("sets multiple pixels correctly", () => {
      setPixel(testPixels, 0, 0, 2, 255, 0, 0, 255); // Red
      setPixel(testPixels, 1, 1, 2, 0, 255, 0, 255); // Green

      assert.deepEqual(Array.from(testPixels.slice(0, 4)), [255, 0, 0, 255]);
      assert.deepEqual(Array.from(testPixels.slice(12, 16)), [0, 255, 0, 255]);
    });
  });

  describe("copyPixel", () => {
    it("copies RGBA pixel correctly", () => {
      const src = new Uint8Array([255, 128, 64, 32, 0, 0, 0, 0]);
      const dst = new Uint8Array(8);

      copyPixel(src, dst, 0, 4);
      assert.deepEqual(Array.from(dst), [0, 0, 0, 0, 255, 128, 64, 32]);
    });
  });

  describe("clampColor", () => {
    it("clamps values to 0-255 range", () => {
      assert.equal(clampColor(-10), 0);
      assert.equal(clampColor(0), 0);
      assert.equal(clampColor(128), 128);
      assert.equal(clampColor(255), 255);
      assert.equal(clampColor(300), 255);
    });

    it("rounds fractional values", () => {
      assert.equal(clampColor(127.4), 127);
      assert.equal(clampColor(127.6), 128);
      assert.equal(clampColor(255.9), 255);
    });
  });
});
