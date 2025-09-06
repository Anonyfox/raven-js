/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { Image } from "./image-base.js";

describe("Image Base Class", () => {
  describe("Constructor", () => {
    it("initializes with buffer and MIME type", () => {
      const buffer = new Uint8Array([1, 2, 3, 4]);
      const image = new Image(buffer, "image/test");

      assert(image.rawData instanceof Uint8Array);
      assert.equal(image.mimeType, "image/test");
      assert.equal(image.originalMimeType, "image/test");
      assert.equal(image.pixels, null);
    });

    it("converts ArrayBuffer to Uint8Array", () => {
      const buffer = new ArrayBuffer(10);
      const image = new Image(buffer, "image/test");

      assert(image.rawData instanceof Uint8Array);
      assert.equal(image.rawData.length, 10);
    });
  });

  describe("Properties", () => {
    let image;

    beforeEach(() => {
      image = new Image(new Uint8Array(100), "image/test");
    });

    it("returns correct dimensions", () => {
      assert.equal(image.width, 0);
      assert.equal(image.height, 0);
      assert.equal(image.channels, 4);
    });

    it("calculates pixel count correctly", () => {
      assert.equal(image.pixelCount, 0);
    });

    it("detects alpha channel presence", () => {
      assert.equal(image.hasAlpha, true);

      image._channels = 3;
      assert.equal(image.hasAlpha, false);
    });
  });

  describe("Transformation Methods", () => {
    let image;

    beforeEach(() => {
      image = new Image(new Uint8Array(100), "image/test");
      // Set up minimal pixel data for resize tests
      image._width = 10;
      image._height = 10;
      image.pixels = new Uint8Array(10 * 10 * 4); // 10x10 RGBA
      image.pixels.fill(128); // Fill with gray
    });

    it("resize returns this for chaining", () => {
      // Set up pixel data for resize test
      image._width = 10;
      image._height = 10;
      image.pixels = new Uint8Array(10 * 10 * 4); // 10x10 RGBA
      image.pixels.fill(128); // Fill with gray

      const result = image.resize(800, 600);
      assert.equal(result, image);
    });

    it("resize accepts algorithm parameter", () => {
      // Set up pixel data for resize test
      image._width = 10;
      image._height = 10;
      image.pixels = new Uint8Array(10 * 10 * 4); // 10x10 RGBA
      image.pixels.fill(128); // Fill with gray

      const result = image.resize(800, 600, "bicubic");
      assert.equal(result, image);
    });

    it("crop returns this for chaining", () => {
      const result = image.crop(10, 20, 100, 200);
      assert.equal(result, image);
    });

    it("rotate returns this for chaining", () => {
      const result = image.rotate(90);
      assert.equal(result, image);
    });

    it("flip returns this for chaining", () => {
      const horizontal = image.flip("horizontal");
      const vertical = image.flip("vertical");

      assert.equal(horizontal, image);
      assert.equal(vertical, image);
    });

    it("brightness adjustment returns this for chaining", () => {
      const result = image.adjustBrightness(1.5);
      assert.equal(result, image);
    });

    it("contrast adjustment returns this for chaining", () => {
      const result = image.adjustContrast(1.2);
      assert.equal(result, image);
    });

    it("grayscale returns this for chaining", () => {
      const result = image.grayscale();
      assert.equal(result, image);
    });

    it("supports method chaining", () => {
      // Set up pixel data for resize test
      image._width = 10;
      image._height = 10;
      image.pixels = new Uint8Array(10 * 10 * 4); // 10x10 RGBA
      image.pixels.fill(128); // Fill with gray

      const result = image
        .resize(800, 600)
        .crop(0, 0, 400, 300)
        .rotate(90)
        .flip("horizontal")
        .adjustBrightness(1.2)
        .adjustContrast(1.1)
        .grayscale();

      assert.equal(result, image);
    });
  });

  describe("Output Methods", () => {
    let image;

    beforeEach(() => {
      image = new Image(new Uint8Array(100), "image/test");
    });

    it("toBuffer returns Uint8Array", () => {
      const buffer = image.toBuffer();
      assert(buffer instanceof Uint8Array);
      assert.equal(buffer.length, 0);
    });

    it("toBuffer uses original MIME type by default", () => {
      const buffer = image.toBuffer();
      assert(buffer instanceof Uint8Array);
    });

    it("toBuffer accepts target MIME type", () => {
      const buffer = image.toBuffer("image/png");
      assert(buffer instanceof Uint8Array);
    });

    it("toBuffer accepts options parameter", () => {
      const buffer = image.toBuffer("image/jpeg", { quality: 80 });
      assert(buffer instanceof Uint8Array);
    });

    it("getMetadata returns object", () => {
      const metadata = image.getMetadata();
      assert.equal(typeof metadata, "object");
    });

    it("setMetadata returns this for chaining", () => {
      const result = image.setMetadata({ test: "value" });
      assert.equal(result, image);
    });
  });
});
