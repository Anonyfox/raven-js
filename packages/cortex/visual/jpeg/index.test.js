/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { Image } from "../image-base.js";
import { JPEGImage } from "./index.js";

describe("JPEG Image", () => {
  describe("Constructor", () => {
    it("extends base Image class", () => {
      const buffer = new Uint8Array([255, 216, 255, 224]);
      const image = new JPEGImage(buffer, "image/jpeg");

      assert(image instanceof Image);
      assert(image instanceof JPEGImage);
    });

    it("initializes JPEG-specific properties", () => {
      const buffer = new Uint8Array([255, 216, 255, 224]);
      const image = new JPEGImage(buffer, "image/jpeg");

      assert(Array.isArray(image.quantizationTables));
      assert(Array.isArray(image.huffmanTables));
      assert(Array.isArray(image.components));
      assert.equal(typeof image.progressive, "boolean");
      assert.equal(typeof image.precision, "number");
    });

    it("calls decode during construction", () => {
      const buffer = new Uint8Array([255, 216, 255, 224]);
      const image = new JPEGImage(buffer, "image/jpeg");

      // Verify decode was called (stub sets dimensions to 0)
      assert.equal(image.width, 0);
      assert.equal(image.height, 0);
      assert(image.pixels instanceof Uint8Array);
    });
  });

  describe("Metadata", () => {
    let jpegImage;

    beforeEach(() => {
      const buffer = new Uint8Array([255, 216, 255, 224]);
      jpegImage = new JPEGImage(buffer, "image/jpeg");
    });

    it("returns JPEG-specific metadata", () => {
      const metadata = jpegImage.getMetadata();

      assert.equal(metadata.format, "JPEG");
      assert.equal(typeof metadata.progressive, "boolean");
      assert.equal(typeof metadata.precision, "number");
      assert.equal(typeof metadata.colorSpace, "string");
    });

    it("includes JPEG format properties", () => {
      const metadata = jpegImage.getMetadata();

      assert("exif" in metadata);
      assert("jfif" in metadata);
      assert("adobe" in metadata);
      assert("comment" in metadata);
    });

    it("sets default color space", () => {
      const metadata = jpegImage.getMetadata();
      assert.equal(metadata.colorSpace, "YCbCr");
    });
  });

  describe("Encoding", () => {
    let jpegImage;

    beforeEach(() => {
      const buffer = new Uint8Array([255, 216, 255, 224]);
      jpegImage = new JPEGImage(buffer, "image/jpeg");
    });

    it("encodes to JPEG format by default", () => {
      const buffer = jpegImage.toBuffer();
      assert(buffer instanceof Uint8Array);
    });

    it("encodes to JPEG format explicitly", () => {
      const buffer = jpegImage.toBuffer("image/jpeg");
      assert(buffer instanceof Uint8Array);
    });

    it("handles image/jpg MIME type", () => {
      const buffer = jpegImage.toBuffer("image/jpg");
      assert(buffer instanceof Uint8Array);
    });

    it("accepts JPEG encoding options", () => {
      const options = {
        quality: 80,
        progressive: true,
        colorSpace: "RGB",
      };
      const buffer = jpegImage.toBuffer("image/jpeg", options);
      assert(buffer instanceof Uint8Array);
    });

    it("delegates to parent for other formats", () => {
      const buffer = jpegImage.toBuffer("image/png");
      assert(buffer instanceof Uint8Array);
      assert.equal(buffer.length, 0); // Parent stub returns empty buffer
    });
  });

  describe("Inheritance", () => {
    let jpegImage;

    beforeEach(() => {
      const buffer = new Uint8Array([255, 216, 255, 224]);
      jpegImage = new JPEGImage(buffer, "image/jpeg");
    });

    it("inherits transformation methods", () => {
      assert.equal(typeof jpegImage.resize, "function");
      assert.equal(typeof jpegImage.crop, "function");
      assert.equal(typeof jpegImage.rotate, "function");
      assert.equal(typeof jpegImage.flip, "function");
    });

    it("inherits adjustment methods", () => {
      assert.equal(typeof jpegImage.adjustBrightness, "function");
      assert.equal(typeof jpegImage.adjustContrast, "function");
      assert.equal(typeof jpegImage.grayscale, "function");
    });

    it("supports method chaining from base class", () => {
      // Set up pixel data for resize test
      jpegImage._width = 10;
      jpegImage._height = 10;
      jpegImage.pixels = new Uint8Array(10 * 10 * 4); // 10x10 RGBA
      jpegImage.pixels.fill(128); // Fill with gray

      const result = jpegImage.resize(800, 600).crop(0, 0, 400, 300).adjustContrast(1.1);

      assert.equal(result, jpegImage);
    });

    it("inherits property getters", () => {
      assert.equal(typeof jpegImage.width, "number");
      assert.equal(typeof jpegImage.height, "number");
      assert.equal(typeof jpegImage.channels, "number");
      assert.equal(typeof jpegImage.pixelCount, "number");
      assert.equal(typeof jpegImage.hasAlpha, "boolean");
    });
  });
});
