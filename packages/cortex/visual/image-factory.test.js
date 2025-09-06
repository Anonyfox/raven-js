/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { GIFImage } from "./gif-image.js";
import { Image } from "./image-base.js";
import { createImage } from "./image-factory.js";
import { JPEGImage } from "./jpeg-image.js";
import { PNGImage } from "./png/index.js";
import { WebPImage } from "./webp-image.js";

describe("Image Factory", () => {
  describe("Format Detection", () => {
    it("creates PNG image for image/png MIME type", () => {
      const buffer = new Uint8Array([137, 80, 78, 71]);
      const image = createImage(buffer, "image/png");

      assert(image instanceof PNGImage);
      assert(image instanceof Image);
    });

    it("creates JPEG image for image/jpeg MIME type", () => {
      const buffer = new Uint8Array([255, 216, 255]);
      const image = createImage(buffer, "image/jpeg");

      assert(image instanceof JPEGImage);
      assert(image instanceof Image);
    });

    it("creates JPEG image for image/jpg MIME type", () => {
      const buffer = new Uint8Array([255, 216, 255]);
      const image = createImage(buffer, "image/jpg");

      assert(image instanceof JPEGImage);
      assert(image instanceof Image);
    });

    it("creates WebP image for image/webp MIME type", () => {
      const buffer = new Uint8Array([82, 73, 70, 70]);
      const image = createImage(buffer, "image/webp");

      assert(image instanceof WebPImage);
      assert(image instanceof Image);
    });

    it("creates GIF image for image/gif MIME type", () => {
      const buffer = new Uint8Array([71, 73, 70, 56]);
      const image = createImage(buffer, "image/gif");

      assert(image instanceof GIFImage);
      assert(image instanceof Image);
    });
  });

  describe("Case Sensitivity", () => {
    it("handles uppercase MIME types", () => {
      const buffer = new Uint8Array(10);
      const image = createImage(buffer, "IMAGE/PNG");

      assert(image instanceof PNGImage);
    });

    it("handles mixed case MIME types", () => {
      const buffer = new Uint8Array(10);
      const image = createImage(buffer, "Image/WebP");

      assert(image instanceof WebPImage);
    });
  });

  describe("Input Validation", () => {
    it("throws TypeError for null buffer", () => {
      assert.throws(() => createImage(null, "image/png"), TypeError, "Expected buffer to be ArrayBuffer or Uint8Array");
    });

    it("throws TypeError for undefined buffer", () => {
      assert.throws(
        () => createImage(undefined, "image/png"),
        TypeError,
        "Expected buffer to be ArrayBuffer or Uint8Array"
      );
    });

    it("throws TypeError for string buffer", () => {
      assert.throws(
        () => createImage("invalid", "image/png"),
        TypeError,
        "Expected buffer to be ArrayBuffer or Uint8Array"
      );
    });

    it("throws TypeError for number buffer", () => {
      assert.throws(() => createImage(123, "image/png"), TypeError, "Expected buffer to be ArrayBuffer or Uint8Array");
    });

    it("throws TypeError for null MIME type", () => {
      const buffer = new Uint8Array(10);
      assert.throws(() => createImage(buffer, null), TypeError, "Expected mimeType to be string");
    });

    it("throws TypeError for undefined MIME type", () => {
      const buffer = new Uint8Array(10);
      assert.throws(() => createImage(buffer, undefined), TypeError, "Expected mimeType to be string");
    });

    it("throws TypeError for number MIME type", () => {
      const buffer = new Uint8Array(10);
      assert.throws(() => createImage(buffer, 123), TypeError, "Expected mimeType to be string");
    });
  });

  describe("Unsupported Formats", () => {
    it("throws Error for unsupported MIME type", () => {
      const buffer = new Uint8Array(10);
      assert.throws(() => createImage(buffer, "image/bmp"), Error, "Unsupported MIME type: image/bmp");
    });

    it("throws Error for invalid MIME type", () => {
      const buffer = new Uint8Array(10);
      assert.throws(() => createImage(buffer, "text/plain"), Error, "Unsupported MIME type: text/plain");
    });

    it("throws Error for empty MIME type", () => {
      const buffer = new Uint8Array(10);
      assert.throws(() => createImage(buffer, ""), Error, "Unsupported MIME type: ");
    });
  });

  describe("Buffer Types", () => {
    it("accepts Uint8Array buffer", () => {
      const buffer = new Uint8Array([1, 2, 3, 4]);
      const image = createImage(buffer, "image/png");

      assert(image instanceof PNGImage);
      assert.equal(image.rawData.length, 4);
    });

    it("accepts ArrayBuffer", () => {
      const buffer = new ArrayBuffer(10);
      const image = createImage(buffer, "image/png");

      assert(image instanceof PNGImage);
      assert.equal(image.rawData.length, 10);
    });

    it("preserves buffer data integrity", () => {
      const buffer = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const image = createImage(buffer, "image/png");

      assert.deepEqual(Array.from(image.rawData), [137, 80, 78, 71, 13, 10, 26, 10]);
    });
  });
});
