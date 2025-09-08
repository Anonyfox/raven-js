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
import { JPEGImage } from "./jpeg/index.js";
import { PNGImage } from "./png/index.js";
import { WebPImage } from "./webp-image.js";

/**
 * Create minimal valid JPEG file for testing.
 */
function createMinimalJPEG() {
  const buffer = new Uint8Array(1024);
  let offset = 0;

  // SOI marker
  buffer[offset++] = 0xff;
  buffer[offset++] = 0xd8;

  // DQT marker (Define Quantization Table)
  buffer[offset++] = 0xff;
  buffer[offset++] = 0xdb;
  buffer[offset++] = 0x00; // Length high
  buffer[offset++] = 0x43; // Length low (67 bytes)
  buffer[offset++] = 0x00; // Precision/Table ID (8-bit, table 0)

  // Standard luminance quantization table (64 values)
  const quantTable = [
    16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51,
    87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101,
    72, 92, 95, 98, 112, 100, 103, 99,
  ];

  for (let i = 0; i < 64; i++) {
    buffer[offset++] = quantTable[i];
  }

  // DHT marker (Define Huffman Table) - DC Luminance
  buffer[offset++] = 0xff;
  buffer[offset++] = 0xc4;
  buffer[offset++] = 0x00; // Length high
  buffer[offset++] = 0x1f; // Length low (31 bytes)
  buffer[offset++] = 0x00; // Table class/ID (DC, table 0)

  // Code lengths (16 bytes)
  const dcLengths = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 16; i++) {
    buffer[offset++] = dcLengths[i];
  }

  // Symbols (12 bytes)
  const dcSymbols = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  for (let i = 0; i < 12; i++) {
    buffer[offset++] = dcSymbols[i];
  }

  // DHT marker (Define Huffman Table) - AC Luminance
  buffer[offset++] = 0xff;
  buffer[offset++] = 0xc4;
  buffer[offset++] = 0x00; // Length high
  buffer[offset++] = 0xb5; // Length low (181 bytes)
  buffer[offset++] = 0x10; // Table class/ID (AC, table 0)

  // Code lengths (16 bytes) - Standard AC table
  const acLengths = [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125];
  for (let i = 0; i < 16; i++) {
    buffer[offset++] = acLengths[i];
  }

  // Symbols (162 bytes) - Standard AC symbols
  const acSymbols = [
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14,
    0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09,
    0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a,
    0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65,
    0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88,
    0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9,
    0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca,
    0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea,
    0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
  ];
  for (let i = 0; i < acSymbols.length; i++) {
    buffer[offset++] = acSymbols[i];
  }

  // SOF0 marker (Start of Frame - Baseline DCT)
  buffer[offset++] = 0xff;
  buffer[offset++] = 0xc0;
  buffer[offset++] = 0x00; // Length high
  buffer[offset++] = 0x0b; // Length low (11 bytes)
  buffer[offset++] = 0x08; // Precision (8 bits)
  buffer[offset++] = 0x00; // Height high
  buffer[offset++] = 0x08; // Height low
  buffer[offset++] = 0x00; // Width high
  buffer[offset++] = 0x08; // Width low
  buffer[offset++] = 0x01; // Number of components (1 for grayscale)

  // Component 1 (Y - Luminance)
  buffer[offset++] = 0x01; // Component ID
  buffer[offset++] = 0x11; // Sampling factors (1x1)
  buffer[offset++] = 0x00; // Quantization table 0

  // SOS marker (Start of Scan)
  buffer[offset++] = 0xff;
  buffer[offset++] = 0xda;
  buffer[offset++] = 0x00; // Length high
  buffer[offset++] = 0x08; // Length low (8 bytes)
  buffer[offset++] = 0x01; // Number of components in scan

  // Component selectors and Huffman table selectors
  buffer[offset++] = 0x01; // Component 1 (Y)
  buffer[offset++] = 0x00; // DC table 0, AC table 0

  buffer[offset++] = 0x00; // Start of spectral selection
  buffer[offset++] = 0x3f; // End of spectral selection (63)
  buffer[offset++] = 0x00; // Successive approximation

  // Minimal entropy data (just DC coefficients)
  buffer[offset++] = 0x80; // Minimal encoded data
  buffer[offset++] = 0x00;

  // EOI marker
  buffer[offset++] = 0xff;
  buffer[offset++] = 0xd9;

  return buffer.slice(0, offset);
}

describe("Image Factory", () => {
  describe("Format Detection", () => {
    it("creates PNG image for image/png MIME type", () => {
      const buffer = new Uint8Array([137, 80, 78, 71]);
      const image = createImage(buffer, "image/png");

      assert(image instanceof PNGImage);
      assert(image instanceof Image);
    });

    it("creates JPEG image for image/jpeg MIME type", () => {
      const buffer = createMinimalJPEG();
      const image = createImage(buffer, "image/jpeg");

      assert(image instanceof JPEGImage);
      assert(image instanceof Image);
    });

    it("creates JPEG image for image/jpg MIME type", () => {
      const buffer = createMinimalJPEG();
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
