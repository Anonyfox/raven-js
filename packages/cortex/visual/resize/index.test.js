/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for resize module orchestrator.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { getResizeAlgorithms, RESIZE_ALGORITHMS, recommendAlgorithm, resizePixels } from "./index.js";

describe("Resize Module", () => {
  // Create test RGBA pixel data (2x2 red square)
  const testPixels = new Uint8Array([
    255,
    0,
    0,
    255, // Red pixel
    255,
    0,
    0,
    255, // Red pixel
    255,
    0,
    0,
    255, // Red pixel
    255,
    0,
    0,
    255, // Red pixel
  ]);

  describe("resizePixels", () => {
    it("validates input parameters", () => {
      assert.throws(() => resizePixels(null, 2, 2, 4, 4), /pixels must be a Uint8Array/);
      assert.throws(() => resizePixels(testPixels, 0, 2, 4, 4), /Invalid source width/);
      assert.throws(() => resizePixels(testPixels, 2, 0, 4, 4), /Invalid source height/);
      assert.throws(() => resizePixels(testPixels, 2, 2, 0, 4), /Invalid target width/);
      assert.throws(() => resizePixels(testPixels, 2, 2, 4, 0), /Invalid target height/);
      assert.throws(() => resizePixels(testPixels, 2, 2, 4, 4, "invalid"), /Unknown resize algorithm/);
    });

    it("returns copy for no-op resize", () => {
      const result = resizePixels(testPixels, 2, 2, 2, 2, "nearest");
      assert(result instanceof Uint8Array);
      assert.equal(result.length, testPixels.length);
      assert.notStrictEqual(result, testPixels); // Should be a copy
      assert.deepEqual(Array.from(result), Array.from(testPixels));
    });

    it("dispatches to nearest neighbor algorithm", () => {
      const result = resizePixels(testPixels, 2, 2, 4, 4, "nearest");
      assert(result instanceof Uint8Array);
      assert.equal(result.length, 4 * 4 * 4); // 4x4 RGBA
    });

    it("dispatches to bilinear algorithm", () => {
      const result = resizePixels(testPixels, 2, 2, 4, 4, "bilinear");
      assert(result instanceof Uint8Array);
      assert.equal(result.length, 4 * 4 * 4); // 4x4 RGBA
    });

    it("dispatches to bicubic algorithm", () => {
      const result = resizePixels(testPixels, 2, 2, 4, 4, "bicubic");
      assert(result instanceof Uint8Array);
      assert.equal(result.length, 4 * 4 * 4); // 4x4 RGBA
    });

    it("dispatches to lanczos algorithm", () => {
      const result = resizePixels(testPixels, 2, 2, 4, 4, "lanczos");
      assert(result instanceof Uint8Array);
      assert.equal(result.length, 4 * 4 * 4); // 4x4 RGBA
    });

    it("uses bilinear as default algorithm", () => {
      const result1 = resizePixels(testPixels, 2, 2, 4, 4);
      const result2 = resizePixels(testPixels, 2, 2, 4, 4, "bilinear");
      assert.deepEqual(Array.from(result1), Array.from(result2));
    });
  });

  describe("getResizeAlgorithms", () => {
    it("returns algorithm information", () => {
      const algorithms = getResizeAlgorithms();
      assert.equal(typeof algorithms, "object");
      assert("nearest" in algorithms);
      assert("bilinear" in algorithms);
      assert("bicubic" in algorithms);
      assert("lanczos" in algorithms);
    });

    it("includes algorithm metadata", () => {
      const algorithms = getResizeAlgorithms();
      const nearest = algorithms.nearest;
      assert.equal(typeof nearest.name, "string");
      assert.equal(typeof nearest.description, "string");
      assert.equal(typeof nearest.quality, "string");
      assert.equal(typeof nearest.performance, "string");
    });

    it("returns copy of algorithms object", () => {
      const algorithms1 = getResizeAlgorithms();
      const algorithms2 = getResizeAlgorithms();
      assert.notStrictEqual(algorithms1, algorithms2);
      assert.notStrictEqual(algorithms1, RESIZE_ALGORITHMS);
    });
  });

  describe("recommendAlgorithm", () => {
    it("recommends nearest for minimal resize", () => {
      const algorithm = recommendAlgorithm(100, 100, 101, 101, "balanced");
      assert.equal(algorithm, "nearest");
    });

    it("recommends speed-optimized algorithms", () => {
      const upscale = recommendAlgorithm(100, 100, 200, 200, "speed");
      const downscale = recommendAlgorithm(200, 200, 100, 100, "speed");
      assert(["nearest", "bilinear"].includes(upscale));
      assert(["nearest", "bilinear"].includes(downscale));
    });

    it("recommends quality-optimized algorithms", () => {
      const upscale = recommendAlgorithm(100, 100, 200, 200, "quality");
      const downscale = recommendAlgorithm(200, 200, 100, 100, "quality");
      assert(["bicubic", "lanczos"].includes(upscale));
      assert(["bicubic", "lanczos"].includes(downscale));
    });

    it("provides balanced recommendations", () => {
      const smallUpscale = recommendAlgorithm(100, 100, 150, 150, "balanced");
      const largeUpscale = recommendAlgorithm(100, 100, 300, 300, "balanced");
      const smallDownscale = recommendAlgorithm(200, 200, 150, 150, "balanced");
      const largeDownscale = recommendAlgorithm(200, 200, 50, 50, "balanced");

      assert.equal(typeof smallUpscale, "string");
      assert.equal(typeof largeUpscale, "string");
      assert.equal(typeof smallDownscale, "string");
      assert.equal(typeof largeDownscale, "string");
    });

    it("uses balanced as default priority", () => {
      const result1 = recommendAlgorithm(100, 100, 200, 200);
      const result2 = recommendAlgorithm(100, 100, 200, 200, "balanced");
      assert.equal(result1, result2);
    });
  });

  describe("Algorithm Integration", () => {
    it("all algorithms produce valid output", () => {
      const algorithms = ["nearest", "bilinear", "bicubic", "lanczos"];

      for (const algorithm of algorithms) {
        const result = resizePixels(testPixels, 2, 2, 3, 3, algorithm);
        assert(result instanceof Uint8Array, `${algorithm} should return Uint8Array`);
        assert.equal(result.length, 3 * 3 * 4, `${algorithm} should return correct size`);

        // Check that all values are in valid range
        for (let i = 0; i < result.length; i++) {
          assert(result[i] >= 0 && result[i] <= 255, `${algorithm} pixel values should be 0-255`);
        }
      }
    });

    it("handles upscaling consistently", () => {
      const algorithms = ["nearest", "bilinear", "bicubic", "lanczos"];

      for (const algorithm of algorithms) {
        const result = resizePixels(testPixels, 2, 2, 8, 8, algorithm);
        assert.equal(result.length, 8 * 8 * 4, `${algorithm} upscaling should work`);
      }
    });

    it("handles downscaling consistently", () => {
      // Create larger test image (4x4)
      const largePixels = new Uint8Array(4 * 4 * 4);
      largePixels.fill(128); // Gray pixels

      const algorithms = ["nearest", "bilinear", "bicubic", "lanczos"];

      for (const algorithm of algorithms) {
        const result = resizePixels(largePixels, 4, 4, 2, 2, algorithm);
        assert.equal(result.length, 2 * 2 * 4, `${algorithm} downscaling should work`);
      }
    });
  });

  describe("Performance Characteristics", () => {
    it("processes resize operations efficiently", () => {
      const largePixels = new Uint8Array(100 * 100 * 4);
      largePixels.fill(64);

      const start = performance.now();
      const result = resizePixels(largePixels, 100, 100, 50, 50, "bilinear");
      const duration = performance.now() - start;

      assert(result instanceof Uint8Array);
      assert.equal(result.length, 50 * 50 * 4);
      assert(duration < 100, "Should complete within 100ms for 100x100→50x50");
    });
  });
});
