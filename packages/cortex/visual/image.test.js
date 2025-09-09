/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for unified Image class.
 */

import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { Image } from "./image.js";

describe("Unified Image Class", () => {
  describe("Constructor", () => {
    it("initializes with RGBA pixel data", () => {
      const pixels = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]); // 2 pixels
      const image = new Image(pixels, 2, 1, { test: "metadata" });

      assert(image.pixels instanceof Uint8Array, "Should have pixel data");
      assert.equal(image.width, 2, "Should have correct width");
      assert.equal(image.height, 1, "Should have correct height");
      assert.equal(image.channels, 4, "Should have 4 channels (RGBA)");
      assert.deepEqual(image.metadata, { test: "metadata" }, "Should have metadata");
    });

    it("initializes with default metadata", () => {
      const pixels = new Uint8Array(16); // 2x2 RGBA
      const image = new Image(pixels, 2, 2);

      assert.deepEqual(image.metadata, {}, "Should have empty metadata by default");
    });
  });

  describe("Static Constructors", () => {
    it("exports fromPngBuffer method", () => {
      assert.equal(typeof Image.fromPngBuffer, "function", "Should have fromPngBuffer static method");
    });
  });

  describe("Instance Methods", () => {
    let testImage;

    beforeEach(() => {
      // Create a simple 2x2 test image
      const pixels = new Uint8Array([
        255,
        0,
        0,
        255, // Red pixel
        0,
        255,
        0,
        255, // Green pixel
        0,
        0,
        255,
        255, // Blue pixel
        255,
        255,
        0,
        255, // Yellow pixel
      ]);
      testImage = new Image(pixels, 2, 2);
    });

    it("has manipulation methods", () => {
      assert.equal(typeof testImage.resize, "function", "Should have resize method");
      assert.equal(typeof testImage.crop, "function", "Should have crop method");
      assert.equal(typeof testImage.rotate, "function", "Should have rotate method");
      assert.equal(typeof testImage.flip, "function", "Should have flip method");
    });

    it("has color adjustment methods", () => {
      assert.equal(typeof testImage.adjustBrightness, "function", "Should have brightness method");
      assert.equal(typeof testImage.adjustContrast, "function", "Should have contrast method");
      assert.equal(typeof testImage.grayscale, "function", "Should have grayscale method");
      assert.equal(typeof testImage.invert, "function", "Should have invert method");
      assert.equal(typeof testImage.sepia, "function", "Should have sepia method");
    });

    it("has filter methods", () => {
      assert.equal(typeof testImage.blur, "function", "Should have blur method");
      assert.equal(typeof testImage.sharpen, "function", "Should have sharpen method");
      assert.equal(typeof testImage.detectEdges, "function", "Should have detectEdges method");
    });

    it("has output methods", () => {
      assert.equal(typeof testImage.toPngBuffer, "function", "Should have toPngBuffer method");
    });

    it("resize method works", () => {
      const originalPixelCount = testImage.pixelCount;
      testImage.resize(4, 4);

      assert.equal(testImage.width, 4, "Should update width");
      assert.equal(testImage.height, 4, "Should update height");
      assert.equal(testImage.pixelCount, 16, "Should update pixel count");
      assert.notEqual(testImage.pixelCount, originalPixelCount, "Should change pixel count");
    });
  });

  describe("Properties", () => {
    it("provides image dimensions", () => {
      const pixels = new Uint8Array(32); // 4x2 RGBA
      const image = new Image(pixels, 4, 2);

      assert.equal(image.width, 4, "Should return correct width");
      assert.equal(image.height, 2, "Should return correct height");
      assert.equal(image.channels, 4, "Should return 4 channels");
      assert.equal(image.pixelCount, 8, "Should return correct pixel count");
      assert.equal(image.hasAlpha, true, "Should indicate alpha channel present");
    });
  });

  describe("Deprecated Methods", () => {
    it("toBuffer throws deprecation error", () => {
      const pixels = new Uint8Array(16);
      const image = new Image(pixels, 2, 2);

      assert.throws(
        () => {
          image.toBuffer("image/png");
        },
        /deprecated.*toPngBuffer/,
        "Should throw deprecation error"
      );
    });
  });
});
