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
import { WebPImage } from "./webp-image.js";

describe("WebP Image", () => {
  describe("Constructor", () => {
    it("extends base Image class", () => {
      const buffer = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]);
      const image = new WebPImage(buffer, "image/webp");

      assert(image instanceof Image);
      assert(image instanceof WebPImage);
    });

    it("initializes WebP-specific properties", () => {
      const buffer = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]);
      const image = new WebPImage(buffer, "image/webp");

      assert.equal(typeof image.format, "string");
      assert.equal(typeof image.hasAlphaChannel, "boolean");
      assert.equal(typeof image.hasAnimation, "boolean");
      assert.equal(typeof image.hasICC, "boolean");
      assert.equal(typeof image.hasEXIF, "boolean");
      assert.equal(typeof image.hasXMP, "boolean");
      assert(Array.isArray(image.frames));
    });

    it("sets default format to VP8", () => {
      const buffer = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]);
      const image = new WebPImage(buffer, "image/webp");

      assert.equal(image.format, "VP8");
    });

    it("calls decode during construction", () => {
      const buffer = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]);
      const image = new WebPImage(buffer, "image/webp");

      // Verify decode was called (stub sets dimensions to 0)
      assert.equal(image.width, 0);
      assert.equal(image.height, 0);
      assert(image.pixels instanceof Uint8Array);
    });
  });

  describe("Animation Properties", () => {
    let webpImage;

    beforeEach(() => {
      const buffer = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]);
      webpImage = new WebPImage(buffer, "image/webp");
    });

    it("provides isAnimated getter", () => {
      assert.equal(typeof webpImage.isAnimated, "boolean");
      assert.equal(webpImage.isAnimated, false); // No frames in stub
    });

    it("provides frameCount getter", () => {
      assert.equal(typeof webpImage.frameCount, "number");
      assert.equal(webpImage.frameCount, 0); // Empty frames array in stub
    });

    it("isAnimated depends on hasAnimation and frame count", () => {
      // Stub implementation should return false for empty frames
      assert.equal(webpImage.isAnimated, false);
    });
  });

  describe("Metadata", () => {
    let webpImage;

    beforeEach(() => {
      const buffer = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]);
      webpImage = new WebPImage(buffer, "image/webp");
    });

    it("returns WebP-specific metadata", () => {
      const metadata = webpImage.getMetadata();

      assert.equal(metadata.format, "WebP");
      assert.equal(typeof metadata.variant, "string");
      assert.equal(typeof metadata.hasAlpha, "boolean");
      assert.equal(typeof metadata.animated, "boolean");
      assert.equal(typeof metadata.frameCount, "number");
    });

    it("includes optional metadata chunks", () => {
      const metadata = webpImage.getMetadata();

      assert("exif" in metadata);
      assert("xmp" in metadata);
      assert("icc" in metadata);
    });

    it("sets variant from format property", () => {
      const metadata = webpImage.getMetadata();
      assert.equal(metadata.variant, webpImage.format);
    });
  });

  describe("Encoding", () => {
    let webpImage;

    beforeEach(() => {
      const buffer = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]);
      webpImage = new WebPImage(buffer, "image/webp");
    });

    it("encodes to WebP format by default", () => {
      const buffer = webpImage.toBuffer();
      assert(buffer instanceof Uint8Array);
    });

    it("encodes to WebP format explicitly", () => {
      const buffer = webpImage.toBuffer("image/webp");
      assert(buffer instanceof Uint8Array);
    });

    it("accepts WebP encoding options", () => {
      const options = {
        quality: 80,
        lossless: false,
        method: 4,
        alpha: true,
      };
      const buffer = webpImage.toBuffer("image/webp", options);
      assert(buffer instanceof Uint8Array);
    });

    it("delegates to parent for other formats", () => {
      const buffer = webpImage.toBuffer("image/png");
      assert(buffer instanceof Uint8Array);
      assert.equal(buffer.length, 0); // Parent stub returns empty buffer
    });
  });

  describe("Inheritance", () => {
    let webpImage;

    beforeEach(() => {
      const buffer = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]);
      webpImage = new WebPImage(buffer, "image/webp");
    });

    it("inherits transformation methods", () => {
      assert.equal(typeof webpImage.resize, "function");
      assert.equal(typeof webpImage.crop, "function");
      assert.equal(typeof webpImage.rotate, "function");
      assert.equal(typeof webpImage.flip, "function");
    });

    it("inherits adjustment methods", () => {
      assert.equal(typeof webpImage.adjustBrightness, "function");
      assert.equal(typeof webpImage.adjustContrast, "function");
      assert.equal(typeof webpImage.grayscale, "function");
    });

    it("supports method chaining from base class", () => {
      const result = webpImage.resize(800, 600).crop(0, 0, 400, 300).grayscale();

      assert.equal(result, webpImage);
    });

    it("inherits property getters", () => {
      assert.equal(typeof webpImage.width, "number");
      assert.equal(typeof webpImage.height, "number");
      assert.equal(typeof webpImage.channels, "number");
      assert.equal(typeof webpImage.pixelCount, "number");
      assert.equal(typeof webpImage.hasAlpha, "boolean");
    });
  });
});
