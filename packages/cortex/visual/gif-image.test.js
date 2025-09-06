/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { GIFImage } from "./gif-image.js";
import { Image } from "./image-base.js";

describe("GIF Image", () => {
  describe("Constructor", () => {
    it("extends base Image class", () => {
      const buffer = new Uint8Array([71, 73, 70, 56, 57, 97]);
      const image = new GIFImage(buffer, "image/gif");

      assert(image instanceof Image);
      assert(image instanceof GIFImage);
    });

    it("initializes GIF-specific properties", () => {
      const buffer = new Uint8Array([71, 73, 70, 56, 57, 97]);
      const image = new GIFImage(buffer, "image/gif");

      assert.equal(typeof image.version, "string");
      assert(Array.isArray(image.globalColorTable));
      assert.equal(typeof image.backgroundColorIndex, "number");
      assert.equal(typeof image.pixelAspectRatio, "number");
      assert(Array.isArray(image.frames));
      assert.equal(typeof image.loopCount, "number");
      assert.equal(typeof image.hasGlobalColorTable, "boolean");
      assert.equal(typeof image.colorResolution, "number");
    });

    it("sets default version to GIF89a", () => {
      const buffer = new Uint8Array([71, 73, 70, 56, 57, 97]);
      const image = new GIFImage(buffer, "image/gif");

      assert.equal(image.version, "GIF89a");
    });

    it("calls decode during construction", () => {
      const buffer = new Uint8Array([71, 73, 70, 56, 57, 97]);
      const image = new GIFImage(buffer, "image/gif");

      // Verify decode was called (stub sets dimensions to 0)
      assert.equal(image.width, 0);
      assert.equal(image.height, 0);
      assert(image.pixels instanceof Uint8Array);
    });
  });

  describe("Animation Properties", () => {
    let gifImage;

    beforeEach(() => {
      const buffer = new Uint8Array([71, 73, 70, 56, 57, 97]);
      gifImage = new GIFImage(buffer, "image/gif");
    });

    it("provides isAnimated getter", () => {
      assert.equal(typeof gifImage.isAnimated, "boolean");
      assert.equal(gifImage.isAnimated, false); // No frames in stub
    });

    it("provides frameCount getter", () => {
      assert.equal(typeof gifImage.frameCount, "number");
      assert.equal(gifImage.frameCount, 0); // Empty frames array in stub
    });

    it("provides duration getter", () => {
      assert.equal(typeof gifImage.duration, "number");
      assert.equal(gifImage.duration, 0); // Stub returns 0
    });

    it("isAnimated depends on frame count", () => {
      // Stub implementation should return false for empty frames
      assert.equal(gifImage.isAnimated, false);
    });
  });

  describe("Frame Operations", () => {
    let gifImage;

    beforeEach(() => {
      const buffer = new Uint8Array([71, 73, 70, 56, 57, 97]);
      gifImage = new GIFImage(buffer, "image/gif");
    });

    it("provides getFrame method", () => {
      assert.equal(typeof gifImage.getFrame, "function");
    });

    it("returns frame data structure", () => {
      const frame = gifImage.getFrame(0);

      assert.equal(typeof frame, "object");
      assert(frame.pixels instanceof Uint8Array);
      assert.equal(typeof frame.delay, "number");
      assert.equal(typeof frame.disposal, "number");
      assert.equal(typeof frame.left, "number");
      assert.equal(typeof frame.top, "number");
      assert.equal(typeof frame.width, "number");
      assert.equal(typeof frame.height, "number");
    });

    it("handles frame index parameter", () => {
      const frame1 = gifImage.getFrame(0);
      const frame2 = gifImage.getFrame(1);

      // Both should return valid frame structures
      assert.equal(typeof frame1, "object");
      assert.equal(typeof frame2, "object");
    });
  });

  describe("Metadata", () => {
    let gifImage;

    beforeEach(() => {
      const buffer = new Uint8Array([71, 73, 70, 56, 57, 97]);
      gifImage = new GIFImage(buffer, "image/gif");
    });

    it("returns GIF-specific metadata", () => {
      const metadata = gifImage.getMetadata();

      assert.equal(metadata.format, "GIF");
      assert.equal(typeof metadata.version, "string");
      assert.equal(typeof metadata.animated, "boolean");
      assert.equal(typeof metadata.frameCount, "number");
      assert.equal(typeof metadata.loopCount, "number");
    });

    it("includes GIF format properties", () => {
      const metadata = gifImage.getMetadata();

      assert("globalColorTable" in metadata);
      assert("colorResolution" in metadata);
      assert("backgroundColorIndex" in metadata);
      assert("pixelAspectRatio" in metadata);
      assert(Array.isArray(metadata.comments));
    });

    it("sets version from property", () => {
      const metadata = gifImage.getMetadata();
      assert.equal(metadata.version, gifImage.version);
    });
  });

  describe("Encoding", () => {
    let gifImage;

    beforeEach(() => {
      const buffer = new Uint8Array([71, 73, 70, 56, 57, 97]);
      gifImage = new GIFImage(buffer, "image/gif");
    });

    it("encodes to GIF format by default", () => {
      const buffer = gifImage.toBuffer();
      assert(buffer instanceof Uint8Array);
    });

    it("encodes to GIF format explicitly", () => {
      const buffer = gifImage.toBuffer("image/gif");
      assert(buffer instanceof Uint8Array);
    });

    it("accepts GIF encoding options", () => {
      const options = {
        palette: [
          [255, 0, 0],
          [0, 255, 0],
          [0, 0, 255],
        ],
        transparentIndex: 0,
        delay: 100,
        loopCount: 0,
      };
      const buffer = gifImage.toBuffer("image/gif", options);
      assert(buffer instanceof Uint8Array);
    });

    it("delegates to parent for other formats", () => {
      const buffer = gifImage.toBuffer("image/png");
      assert(buffer instanceof Uint8Array);
      assert.equal(buffer.length, 0); // Parent stub returns empty buffer
    });
  });

  describe("Inheritance", () => {
    let gifImage;

    beforeEach(() => {
      const buffer = new Uint8Array([71, 73, 70, 56, 57, 97]);
      gifImage = new GIFImage(buffer, "image/gif");
    });

    it("inherits transformation methods", () => {
      assert.equal(typeof gifImage.resize, "function");
      assert.equal(typeof gifImage.crop, "function");
      assert.equal(typeof gifImage.rotate, "function");
      assert.equal(typeof gifImage.flip, "function");
    });

    it("inherits adjustment methods", () => {
      assert.equal(typeof gifImage.adjustBrightness, "function");
      assert.equal(typeof gifImage.adjustContrast, "function");
      assert.equal(typeof gifImage.grayscale, "function");
    });

    it("supports method chaining from base class", () => {
      // Set up pixel data for resize test
      gifImage._width = 10;
      gifImage._height = 10;
      gifImage.pixels = new Uint8Array(10 * 10 * 4); // 10x10 RGBA
      gifImage.pixels.fill(128); // Fill with gray

      const result = gifImage.resize(800, 600).crop(0, 0, 400, 300).rotate(90);

      assert.equal(result, gifImage);
    });

    it("inherits property getters", () => {
      assert.equal(typeof gifImage.width, "number");
      assert.equal(typeof gifImage.height, "number");
      assert.equal(typeof gifImage.channels, "number");
      assert.equal(typeof gifImage.pixelCount, "number");
      assert.equal(typeof gifImage.hasAlpha, "boolean");
    });
  });
});
