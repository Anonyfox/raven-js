/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for 90° rotation functions.
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { rotate0, rotate90Clockwise, rotate90CounterClockwise, rotate180, rotateQuadrant } from "./rotate-90.js";

describe("90° Rotations", () => {
  let testPixels;

  beforeEach(() => {
    // Create 2x3 test image with distinct colors
    testPixels = new Uint8Array([
      // Row 0: Red, Green
      255, 0, 0, 255, 0, 255, 0, 255,
      // Row 1: Blue, Yellow
      0, 0, 255, 255, 255, 255, 0, 255,
      // Row 2: Cyan, Magenta
      0, 255, 255, 255, 255, 0, 255, 255,
    ]);
  });

  describe("rotate90Clockwise", () => {
    it("rotates 2x3 image to 3x2", () => {
      const result = rotate90Clockwise(testPixels, 2, 3);

      assert.equal(result.width, 3);
      assert.equal(result.height, 2);
      assert.equal(result.pixels.length, 3 * 2 * 4);
    });

    it("rotates pixels correctly", () => {
      const result = rotate90Clockwise(testPixels, 2, 3);

      // Check specific pixel positions
      // Original (0,0) Red -> (2,0)
      const redIndex = (0 * 3 + 2) * 4;
      assert.deepEqual(Array.from(result.pixels.slice(redIndex, redIndex + 4)), [255, 0, 0, 255]);

      // Original (1,0) Green -> (2,1)
      const greenIndex = (1 * 3 + 2) * 4;
      assert.deepEqual(Array.from(result.pixels.slice(greenIndex, greenIndex + 4)), [0, 255, 0, 255]);
    });
  });

  describe("rotate90CounterClockwise", () => {
    it("rotates 2x3 image to 3x2", () => {
      const result = rotate90CounterClockwise(testPixels, 2, 3);

      assert.equal(result.width, 3);
      assert.equal(result.height, 2);
    });

    it("rotates pixels correctly", () => {
      const result = rotate90CounterClockwise(testPixels, 2, 3);

      // Original (0,0) Red -> (0,1)
      const redIndex = (1 * 3 + 0) * 4;
      assert.deepEqual(Array.from(result.pixels.slice(redIndex, redIndex + 4)), [255, 0, 0, 255]);
    });
  });

  describe("rotate180", () => {
    it("maintains dimensions", () => {
      const result = rotate180(testPixels, 2, 3);

      assert.equal(result.width, 2);
      assert.equal(result.height, 3);
    });

    it("rotates pixels correctly", () => {
      const result = rotate180(testPixels, 2, 3);

      // Original (0,0) Red -> (1,2)
      const redIndex = (2 * 2 + 1) * 4;
      assert.deepEqual(Array.from(result.pixels.slice(redIndex, redIndex + 4)), [255, 0, 0, 255]);

      // Original (1,2) Magenta -> (0,0)
      const magentaIndex = (0 * 2 + 0) * 4;
      assert.deepEqual(Array.from(result.pixels.slice(magentaIndex, magentaIndex + 4)), [255, 0, 255, 255]);
    });
  });

  describe("rotate0", () => {
    it("returns copy with same dimensions", () => {
      const result = rotate0(testPixels, 2, 3);

      assert.equal(result.width, 2);
      assert.equal(result.height, 3);
      assert.deepEqual(result.pixels, testPixels);
      assert.notEqual(result.pixels, testPixels); // Should be copy
    });
  });

  describe("rotateQuadrant", () => {
    it("dispatches to correct rotation function", () => {
      const result0 = rotateQuadrant(testPixels, 2, 3, 0);
      const result90 = rotateQuadrant(testPixels, 2, 3, 90);
      const result180 = rotateQuadrant(testPixels, 2, 3, 180);
      const result270 = rotateQuadrant(testPixels, 2, 3, 270);

      assert.equal(result0.width, 2);
      assert.equal(result0.height, 3);
      assert.equal(result90.width, 3);
      assert.equal(result90.height, 2);
      assert.equal(result180.width, 2);
      assert.equal(result180.height, 3);
      assert.equal(result270.width, 3);
      assert.equal(result270.height, 2);
    });

    it("throws error for invalid angles", () => {
      assert.throws(() => rotateQuadrant(testPixels, 2, 3, 45), /Invalid quadrant angle: 45/);
    });
  });

  describe("Performance", () => {
    it("handles medium images efficiently", () => {
      const mediumPixels = new Uint8Array(200 * 200 * 4);
      mediumPixels.fill(128);

      const result = rotate90Clockwise(mediumPixels, 200, 200);
      assert.equal(result.width, 200);
      assert.equal(result.height, 200);
      assert.equal(result.pixels.length, 200 * 200 * 4);
    });
  });
});
