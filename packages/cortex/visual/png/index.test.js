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
import { PNGImage } from "./index.js";

describe("PNG Image", () => {
  describe("Constructor", () => {
    it("extends base Image class", () => {
      const buffer = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const image = new PNGImage(buffer, "image/png");

      assert(image instanceof Image);
      assert(image instanceof PNGImage);
    });

    it("initializes PNG-specific properties", () => {
      const buffer = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const image = new PNGImage(buffer, "image/png");

      assert(Array.isArray(image.chunks));
      assert.equal(typeof image.colorType, "number");
      assert.equal(typeof image.bitDepth, "number");
      assert.equal(typeof image.compressionMethod, "number");
      assert.equal(typeof image.filterMethod, "number");
      assert.equal(typeof image.interlaceMethod, "number");
    });

    it("calls decode during construction", () => {
      const buffer = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const image = new PNGImage(buffer, "image/png");

      // Verify decode was called (stub sets dimensions to 0)
      assert.equal(image.width, 0);
      assert.equal(image.height, 0);
      assert(image.pixels instanceof Uint8Array);
    });
  });

  describe("Metadata", () => {
    let pngImage;

    beforeEach(() => {
      const buffer = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      pngImage = new PNGImage(buffer, "image/png");
    });

    it("returns PNG-specific metadata", () => {
      const metadata = pngImage.getMetadata();

      assert.equal(metadata.format, "PNG");
      assert.equal(typeof metadata.colorType, "number");
      assert.equal(typeof metadata.bitDepth, "number");
      assert.equal(typeof metadata.interlaced, "boolean");
      assert.equal(typeof metadata.text, "object");
    });

    it("includes PNG format properties", () => {
      const metadata = pngImage.getMetadata();

      assert("gamma" in metadata);
      assert("chromaticity" in metadata);
      assert("timestamp" in metadata);
    });
  });

  describe("Encoding", () => {
    let pngImage;

    beforeEach(() => {
      // Create a minimal test PNG with actual pixel data for encoding tests
      pngImage = new PNGImage(new ArrayBuffer(0), "image/png");

      // Set up minimal image properties for encoding
      pngImage._width = 2;
      pngImage._height = 2;
      pngImage._bitDepth = 8;
      pngImage._colorType = 6; // RGBA
      pngImage._channels = 4;

      // Create test pixel data (2x2 RGBA = 16 bytes)
      pngImage.pixels = new Uint8Array([
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

      pngImage.metadata = {
        text: { Title: "Test Image" },
      };
    });

    it("encodes to PNG format by default", async () => {
      const buffer = await pngImage.toBuffer();
      assert(buffer instanceof Uint8Array);
      assert(buffer.length > 0, "Should produce non-empty PNG data");
    });

    it("encodes to PNG format explicitly", async () => {
      const buffer = await pngImage.toBuffer("image/png");
      assert(buffer instanceof Uint8Array);
      assert(buffer.length > 0, "Should produce non-empty PNG data");
    });

    it("accepts PNG encoding options", async () => {
      const options = {
        compressionLevel: 6,
        interlace: false,
      };
      const buffer = await pngImage.toBuffer("image/png", options);
      assert(buffer instanceof Uint8Array);
      assert(buffer.length > 0, "Should produce non-empty PNG data");
    });

    it("delegates to parent for other formats", async () => {
      const buffer = await pngImage.toBuffer("image/jpeg");
      assert(buffer instanceof Uint8Array);
      assert.equal(buffer.length, 0); // Parent stub returns empty buffer
    });
  });

  describe("Inheritance", () => {
    let pngImage;

    beforeEach(() => {
      const buffer = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      pngImage = new PNGImage(buffer, "image/png");
    });

    it("inherits transformation methods", () => {
      assert.equal(typeof pngImage.resize, "function");
      assert.equal(typeof pngImage.crop, "function");
      assert.equal(typeof pngImage.rotate, "function");
      assert.equal(typeof pngImage.flip, "function");
    });

    it("inherits adjustment methods", () => {
      assert.equal(typeof pngImage.adjustBrightness, "function");
      assert.equal(typeof pngImage.adjustContrast, "function");
      assert.equal(typeof pngImage.grayscale, "function");
    });

    it("supports method chaining from base class", () => {
      const result = pngImage.resize(800, 600).crop(0, 0, 400, 300).adjustBrightness(1.2);

      assert.equal(result, pngImage);
    });

    it("inherits property getters", () => {
      assert.equal(typeof pngImage.width, "number");
      assert.equal(typeof pngImage.height, "number");
      assert.equal(typeof pngImage.channels, "number");
      assert.equal(typeof pngImage.pixelCount, "number");
      assert.equal(typeof pngImage.hasAlpha, "boolean");
    });
  });
});
