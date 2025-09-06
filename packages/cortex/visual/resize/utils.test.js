/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for resize utilities.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
  bilinearInterpolate,
  clamp,
  clampCoord,
  cubicKernel,
  getPixel,
  lanczosKernel,
  lerp,
  normalizeWeights,
  setPixel,
  validateResizeParameters,
} from "./utils.js";

describe("Resize Utils", () => {
  describe("validateResizeParameters", () => {
    const validPixels = new Uint8Array(2 * 2 * 4); // 2x2 RGBA

    it("validates pixel data type", () => {
      assert.throws(() => validateResizeParameters(null, 2, 2, 4, 4, "bilinear"), /pixels must be a Uint8Array/);
      assert.throws(() => validateResizeParameters([], 2, 2, 4, 4, "bilinear"), /pixels must be a Uint8Array/);
    });

    it("validates dimensions", () => {
      assert.throws(() => validateResizeParameters(validPixels, 0, 2, 4, 4, "bilinear"), /Invalid source width/);
      assert.throws(() => validateResizeParameters(validPixels, -1, 2, 4, 4, "bilinear"), /Invalid source width/);
      assert.throws(() => validateResizeParameters(validPixels, 2.5, 2, 4, 4, "bilinear"), /Invalid source width/);

      assert.throws(() => validateResizeParameters(validPixels, 2, 0, 4, 4, "bilinear"), /Invalid source height/);
      assert.throws(() => validateResizeParameters(validPixels, 2, 2, 0, 4, "bilinear"), /Invalid target width/);
      assert.throws(() => validateResizeParameters(validPixels, 2, 2, 4, 0, "bilinear"), /Invalid target height/);
    });

    it("validates pixel data size", () => {
      const wrongSize = new Uint8Array(10); // Wrong size
      assert.throws(() => validateResizeParameters(wrongSize, 2, 2, 4, 4, "bilinear"), /Invalid pixel data size/);
    });

    it("validates algorithm type", () => {
      assert.throws(() => validateResizeParameters(validPixels, 2, 2, 4, 4, null), /Algorithm must be string/);
      assert.throws(() => validateResizeParameters(validPixels, 2, 2, 4, 4, 123), /Algorithm must be string/);
    });

    it("validates maximum dimensions", () => {
      assert.throws(
        () => validateResizeParameters(validPixels, 2, 2, 50000, 4, "bilinear"),
        /Target dimensions too large/
      );
      assert.throws(
        () => validateResizeParameters(validPixels, 2, 2, 4, 50000, "bilinear"),
        /Target dimensions too large/
      );
    });

    it("accepts valid parameters", () => {
      assert.doesNotThrow(() => validateResizeParameters(validPixels, 2, 2, 4, 4, "bilinear"));
    });
  });

  describe("clamp", () => {
    it("clamps values to range", () => {
      assert.equal(clamp(-5, 0, 10), 0);
      assert.equal(clamp(15, 0, 10), 10);
      assert.equal(clamp(5, 0, 10), 5);
    });

    it("handles edge cases", () => {
      assert.equal(clamp(0, 0, 10), 0);
      assert.equal(clamp(10, 0, 10), 10);
      assert.equal(clamp(5, 5, 5), 5);
    });
  });

  describe("clampCoord", () => {
    it("clamps coordinates to image bounds", () => {
      assert.equal(clampCoord(-1, 10), 0);
      assert.equal(clampCoord(10, 10), 9);
      assert.equal(clampCoord(5, 10), 5);
    });

    it("handles edge coordinates", () => {
      assert.equal(clampCoord(0, 10), 0);
      assert.equal(clampCoord(9, 10), 9);
    });
  });

  describe("getPixel", () => {
    const pixels = new Uint8Array([
      255,
      0,
      0,
      255, // (0,0) Red
      0,
      255,
      0,
      255, // (1,0) Green
      0,
      0,
      255,
      255, // (0,1) Blue
      255,
      255,
      0,
      255, // (1,1) Yellow
    ]);

    it("gets pixels at valid coordinates", () => {
      const red = getPixel(pixels, 0, 0, 2, 2);
      assert.deepEqual(red, [255, 0, 0, 255]);

      const green = getPixel(pixels, 1, 0, 2, 2);
      assert.deepEqual(green, [0, 255, 0, 255]);

      const blue = getPixel(pixels, 0, 1, 2, 2);
      assert.deepEqual(blue, [0, 0, 255, 255]);

      const yellow = getPixel(pixels, 1, 1, 2, 2);
      assert.deepEqual(yellow, [255, 255, 0, 255]);
    });

    it("clamps out-of-bounds coordinates", () => {
      const clamped1 = getPixel(pixels, -1, 0, 2, 2);
      assert.deepEqual(clamped1, [255, 0, 0, 255]); // Should clamp to (0,0)

      const clamped2 = getPixel(pixels, 2, 1, 2, 2);
      assert.deepEqual(clamped2, [255, 255, 0, 255]); // Should clamp to (1,1)
    });
  });

  describe("setPixel", () => {
    it("sets pixels at coordinates", () => {
      const pixels = new Uint8Array(2 * 2 * 4);
      setPixel(pixels, 0, 0, 2, [255, 0, 0, 255]);
      setPixel(pixels, 1, 1, 2, [0, 255, 0, 255]);

      assert.equal(pixels[0], 255); // Red at (0,0)
      assert.equal(pixels[1], 0);
      assert.equal(pixels[2], 0);
      assert.equal(pixels[3], 255);

      assert.equal(pixels[12], 0); // Green at (1,1)
      assert.equal(pixels[13], 255);
      assert.equal(pixels[14], 0);
      assert.equal(pixels[15], 255);
    });
  });

  describe("lerp", () => {
    it("interpolates between values", () => {
      assert.equal(lerp(0, 10, 0), 0);
      assert.equal(lerp(0, 10, 1), 10);
      assert.equal(lerp(0, 10, 0.5), 5);
      assert.equal(lerp(10, 20, 0.3), 13);
    });

    it("handles edge cases", () => {
      assert.equal(lerp(5, 5, 0.5), 5);
      assert.equal(lerp(-10, 10, 0.5), 0);
    });
  });

  describe("bilinearInterpolate", () => {
    it("interpolates between four RGBA values", () => {
      const tl = [255, 0, 0, 255]; // Red
      const tr = [0, 255, 0, 255]; // Green
      const bl = [0, 0, 255, 255]; // Blue
      const br = [255, 255, 0, 255]; // Yellow

      // Center interpolation
      const center = bilinearInterpolate(tl, tr, bl, br, 0.5, 0.5);
      assert.equal(center.length, 4);
      assert(center.every((c) => c >= 0 && c <= 255));

      // Corner cases
      const topLeft = bilinearInterpolate(tl, tr, bl, br, 0, 0);
      assert.deepEqual(topLeft, [255, 0, 0, 255]);

      const bottomRight = bilinearInterpolate(tl, tr, bl, br, 1, 1);
      assert.deepEqual(bottomRight, [255, 255, 0, 255]);
    });
  });

  describe("cubicKernel", () => {
    it("evaluates cubic kernel function", () => {
      assert.equal(cubicKernel(0), 1); // Peak at center
      assert.equal(cubicKernel(3), 0); // Zero beyond support
      assert.equal(cubicKernel(-3), 0); // Symmetric

      // Should be continuous
      const val1 = cubicKernel(0.9);
      const val2 = cubicKernel(1.1);
      assert(Math.abs(val1 - val2) < 1); // Reasonable continuity
    });

    it("has correct support range", () => {
      assert.equal(cubicKernel(2), 0);
      assert.equal(cubicKernel(-2), 0);
      assert(Math.abs(cubicKernel(1.5)) > 0);
    });
  });

  describe("lanczosKernel", () => {
    it("evaluates Lanczos kernel function", () => {
      assert.equal(lanczosKernel(0), 1); // Peak at center
      assert.equal(lanczosKernel(3), 0); // Zero at boundary (a=3)
      assert.equal(lanczosKernel(-3), 0); // Symmetric
      assert.equal(lanczosKernel(4), 0); // Zero beyond support
    });

    it("supports different parameter values", () => {
      assert.equal(lanczosKernel(2, 2), 0); // a=2, zero at boundary
      assert(Math.abs(lanczosKernel(1, 2)) > 0); // Non-zero within support
    });

    it("handles edge cases", () => {
      assert.equal(lanczosKernel(0, 1), 1);
      assert.equal(lanczosKernel(0, 5), 1);
    });
  });

  describe("normalizeWeights", () => {
    it("normalizes weights to sum to 1", () => {
      const weights = [1, 2, 3, 4];
      const normalized = normalizeWeights(weights);
      const sum = normalized.reduce((acc, w) => acc + w, 0);
      assert(Math.abs(sum - 1) < 1e-10);
    });

    it("handles zero sum weights", () => {
      const weights = [0, 0, 0];
      const normalized = normalizeWeights(weights);
      assert.deepEqual(normalized, [0, 0, 0]);
    });

    it("preserves single weight", () => {
      const weights = [5];
      const normalized = normalizeWeights(weights);
      assert.deepEqual(normalized, [1]);
    });

    it("handles negative weights", () => {
      const weights = [-1, 2, -1];
      const normalized = normalizeWeights(weights);
      const _sum = normalized.reduce((acc, w) => acc + w, 0);
      // Sum is 0, so normalization should return original weights
      assert.deepEqual(normalized, [-1, 2, -1]);
    });
  });
});
