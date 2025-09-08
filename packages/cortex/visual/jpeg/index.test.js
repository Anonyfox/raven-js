/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { beforeEach, describe, it } from "node:test";
import { Image } from "../image-base.js";
import { JPEGImage } from "./index.js";

/**
 * Create minimal valid JPEG file for testing.
 * Contains SOI, minimal SOF0, DQT, DHT, SOS markers and EOI.
 */
function createMinimalJPEG(width = 8, height = 8) {
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
  buffer[offset++] = 0x11; // Length low (17 bytes)
  buffer[offset++] = 0x08; // Precision (8 bits)
  buffer[offset++] = (height >> 8) & 0xff; // Height high
  buffer[offset++] = height & 0xff; // Height low
  buffer[offset++] = (width >> 8) & 0xff; // Width high
  buffer[offset++] = width & 0xff; // Width low
  buffer[offset++] = 0x03; // Number of components (3 for YCbCr)

  // Component 1 (Y - Luminance)
  buffer[offset++] = 0x01; // Component ID
  buffer[offset++] = 0x22; // Sampling factors (2x2)
  buffer[offset++] = 0x00; // Quantization table 0

  // Component 2 (Cb - Chrominance)
  buffer[offset++] = 0x02; // Component ID
  buffer[offset++] = 0x11; // Sampling factors (1x1)
  buffer[offset++] = 0x00; // Quantization table 0

  // Component 3 (Cr - Chrominance)
  buffer[offset++] = 0x03; // Component ID
  buffer[offset++] = 0x11; // Sampling factors (1x1)
  buffer[offset++] = 0x00; // Quantization table 0

  // SOS marker (Start of Scan)
  buffer[offset++] = 0xff;
  buffer[offset++] = 0xda;
  buffer[offset++] = 0x00; // Length high
  buffer[offset++] = 0x0c; // Length low (12 bytes)
  buffer[offset++] = 0x03; // Number of components in scan

  // Component selectors and Huffman table selectors
  buffer[offset++] = 0x01; // Component 1 (Y)
  buffer[offset++] = 0x00; // DC table 0, AC table 0
  buffer[offset++] = 0x02; // Component 2 (Cb)
  buffer[offset++] = 0x00; // DC table 0, AC table 0
  buffer[offset++] = 0x03; // Component 3 (Cr)
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

/**
 * Create test RGBA pixel data.
 */
function createTestPixels(width, height) {
  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 255; // R
    pixels[i + 1] = 128; // G
    pixels[i + 2] = 64; // B
    pixels[i + 3] = 255; // A
  }
  return pixels;
}

describe("JPEG Image Integration", () => {
  describe("Real JPEG File Processing", () => {
    it("decodes real JPEG file correctly", async () => {
      const jpegBuffer = await readFile("../../media/integration-example-small.jpeg");
      const image = new JPEGImage(jpegBuffer, "image/jpeg");

      assert(image instanceof Image);
      assert(image instanceof JPEGImage);
      assert.equal(image.mimeType, "image/jpeg");
      assert.equal(image.originalMimeType, "image/jpeg");

      // Verify image was decoded
      assert(image.width > 0);
      assert(image.height > 0);
      assert(image.pixels instanceof Uint8Array);
      assert.equal(image.pixels.length, image.width * image.height * 4);
    });

    it("extracts metadata from real JPEG file", async () => {
      const jpegBuffer = await readFile("../../media/integration-example-small.jpeg");
      const image = new JPEGImage(jpegBuffer, "image/jpeg");
      const metadata = image.getMetadata();

      assert.equal(metadata.format, "JPEG");
      assert.equal(typeof metadata.progressive, "boolean");
      assert.equal(typeof metadata.precision, "number");
      assert.equal(typeof metadata.colorSpace, "string");

      // Should have parsed JPEG structure
      assert(Array.isArray(image.quantizationTables));
      assert(Array.isArray(image.huffmanTables));
      assert(Array.isArray(image.components));
      assert(image.quantizationTables.length > 0);
      assert(image.huffmanTables.length > 0);
      assert(image.components.length > 0);
    });
  });

  describe("Class Inheritance", () => {
    it("extends base Image class correctly", () => {
      const buffer = createMinimalJPEG(16, 16);
      const image = new JPEGImage(buffer, "image/jpeg");

      assert(image instanceof Image);
      assert(image instanceof JPEGImage);
      assert.equal(image.mimeType, "image/jpeg");
      assert.equal(image.originalMimeType, "image/jpeg");
    });

    it("initializes JPEG-specific properties", () => {
      const buffer = createMinimalJPEG(16, 16);
      const image = new JPEGImage(buffer, "image/jpeg");

      assert(Array.isArray(image.quantizationTables));
      assert(Array.isArray(image.huffmanTables));
      assert(Array.isArray(image.components));
      assert.equal(typeof image.progressive, "boolean");
      assert.equal(typeof image.precision, "number");
      assert(image.frameInfo !== null);
      assert(image.scanInfo !== null);
    });

    it("inherits all base Image methods", () => {
      const buffer = createMinimalJPEG(16, 16);
      const image = new JPEGImage(buffer, "image/jpeg");

      // Transformation methods
      assert.equal(typeof image.resize, "function");
      assert.equal(typeof image.crop, "function");
      assert.equal(typeof image.rotate, "function");
      assert.equal(typeof image.flip, "function");

      // Adjustment methods
      assert.equal(typeof image.adjustBrightness, "function");
      assert.equal(typeof image.adjustContrast, "function");
      assert.equal(typeof image.grayscale, "function");
      assert.equal(typeof image.invert, "function");
      assert.equal(typeof image.sepia, "function");

      // Filter methods
      assert.equal(typeof image.blur, "function");
      assert.equal(typeof image.sharpen, "function");
      assert.equal(typeof image.detectEdges, "function");
    });
  });

  describe("JPEG Decoding Pipeline", () => {
    it("decodes minimal JPEG structure correctly", () => {
      const buffer = createMinimalJPEG(16, 16);
      const image = new JPEGImage(buffer, "image/jpeg");

      // Verify pipeline executed
      assert.equal(image.width, 16);
      assert.equal(image.height, 16);
      assert(image.pixels instanceof Uint8Array);
      assert.equal(image.channels, 4); // RGBA output
      assert.equal(image.pixelCount, 16 * 16);
      assert.equal(image.hasAlpha, true);
    });

    it("parses JPEG markers correctly", () => {
      const buffer = createMinimalJPEG(32, 24);
      const image = new JPEGImage(buffer, "image/jpeg");

      // Verify frame info was parsed
      assert(image.frameInfo !== null);
      assert.equal(image.frameInfo.width, 32);
      assert.equal(image.frameInfo.height, 24);
      assert.equal(image.frameInfo.componentCount, 3);
      assert.equal(image.frameInfo.precision, 8);
      assert.equal(image.frameInfo.sofType.name, "Baseline DCT");
      assert.equal(image.frameInfo.sofType.progressive, false);

      // Verify quantization tables were loaded
      assert(image.quantizationTables.length > 0);
      assert.equal(image.quantizationTables[0].precision, 0); // 8-bit
      assert.equal(image.quantizationTables[0].values.length, 64);

      // Verify Huffman tables were loaded
      assert(image.huffmanTables.length > 0);
      assert.equal(image.huffmanTables[0].class, 0); // DC table
      assert.equal(image.huffmanTables[0].isDC, true);
    });

    it("extracts component information", () => {
      const buffer = createMinimalJPEG(16, 16);
      const image = new JPEGImage(buffer, "image/jpeg");

      assert.equal(image.components.length, 3);

      // Y component (luminance)
      assert.equal(image.components[0].id, 1);
      assert.equal(image.components[0].horizontalSampling, 2);
      assert.equal(image.components[0].verticalSampling, 2);

      // Cb component (blue chroma)
      assert.equal(image.components[1].id, 2);
      assert.equal(image.components[1].horizontalSampling, 1);
      assert.equal(image.components[1].verticalSampling, 1);

      // Cr component (red chroma)
      assert.equal(image.components[2].id, 3);
      assert.equal(image.components[2].horizontalSampling, 1);
      assert.equal(image.components[2].verticalSampling, 1);
    });

    it("handles different image dimensions", () => {
      const testSizes = [
        [8, 8], // Minimum block size
        [16, 16], // Single MCU
        [24, 32], // Non-square
        [64, 48], // Multiple MCUs
      ];

      for (const [width, height] of testSizes) {
        const buffer = createMinimalJPEG(width, height);
        const image = new JPEGImage(buffer, "image/jpeg");

        assert.equal(image.width, width, `Width mismatch for ${width}x${height}`);
        assert.equal(image.height, height, `Height mismatch for ${width}x${height}`);
        assert.equal(image.pixelCount, width * height, `Pixel count mismatch for ${width}x${height}`);
        assert.equal(image.pixels.length, width * height * 4, `Pixel buffer size mismatch for ${width}x${height}`);
      }
    });

    it("validates JPEG file structure", () => {
      // Test invalid JPEG (missing SOI)
      const invalidBuffer = new Uint8Array([0x00, 0x00, 0xff, 0xd9]);
      assert.throws(() => {
        new JPEGImage(invalidBuffer, "image/jpeg");
      }, /JPEG decode failed/);

      // Test truncated JPEG
      const truncatedBuffer = createMinimalJPEG(16, 16).slice(0, 20);
      assert.throws(() => {
        new JPEGImage(truncatedBuffer, "image/jpeg");
      }, /JPEG decode failed/);
    });
  });

  describe("JPEG Encoding Pipeline", () => {
    let testImage;

    beforeEach(() => {
      // Create image with test pixel data
      const buffer = createMinimalJPEG(16, 16);
      testImage = new JPEGImage(buffer, "image/jpeg");

      // Set up proper pixel data for encoding
      testImage.pixels = createTestPixels(16, 16);
    });

    it("encodes RGBA pixels to JPEG format", () => {
      const encodedBuffer = testImage.toBuffer("image/jpeg");

      assert(encodedBuffer instanceof Uint8Array);
      assert(encodedBuffer.length > 0);

      // Verify JPEG markers are present
      assert.equal(encodedBuffer[0], 0xff); // SOI start
      assert.equal(encodedBuffer[1], 0xd8);
      assert.equal(encodedBuffer[encodedBuffer.length - 2], 0xff); // EOI end
      assert.equal(encodedBuffer[encodedBuffer.length - 1], 0xd9);
    });

    it("accepts quality parameter", () => {
      const lowQuality = testImage.toBuffer("image/jpeg", { quality: 10 });
      const highQuality = testImage.toBuffer("image/jpeg", { quality: 95 });

      assert(lowQuality instanceof Uint8Array);
      assert(highQuality instanceof Uint8Array);
      assert(lowQuality.length > 0);
      assert(highQuality.length > 0);
    });

    it("supports different subsampling modes", () => {
      const modes = ["4:4:4", "4:2:2", "4:2:0", "4:1:1"];

      for (const subsampling of modes) {
        const encoded = testImage.toBuffer("image/jpeg", { subsampling });
        assert(encoded instanceof Uint8Array, `Failed for subsampling ${subsampling}`);
        assert(encoded.length > 0, `Empty buffer for subsampling ${subsampling}`);
      }
    });

    it("handles progressive encoding option", () => {
      const progressive = testImage.toBuffer("image/jpeg", { progressive: true });
      const sequential = testImage.toBuffer("image/jpeg", { progressive: false });

      assert(progressive instanceof Uint8Array);
      assert(sequential instanceof Uint8Array);
      assert(progressive.length > 0);
      assert(sequential.length > 0);
    });

    it("validates pixel data before encoding", () => {
      // Test encoding without pixel data
      const emptyImage = new JPEGImage(createMinimalJPEG(8, 8), "image/jpeg");
      emptyImage.pixels = null;

      assert.throws(() => {
        emptyImage.toBuffer("image/jpeg");
      }, /No pixel data available for encoding/);
    });
  });

  describe("Metadata Extraction", () => {
    it("extracts basic JPEG metadata", () => {
      const buffer = createMinimalJPEG(32, 24);
      const image = new JPEGImage(buffer, "image/jpeg");
      const metadata = image.getMetadata();

      assert.equal(metadata.format, "JPEG");
      assert.equal(metadata.progressive, false);
      assert.equal(metadata.precision, 8);
      assert.equal(metadata.colorSpace, "YCbCr");

      // Metadata containers should exist
      assert(typeof metadata.exif === "object");
      assert(typeof metadata.jfif === "object");
      assert(metadata.adobe === null);
      assert(metadata.comment === null);
    });

    it("handles metadata parsing errors gracefully", () => {
      const buffer = createMinimalJPEG(16, 16);
      const image = new JPEGImage(buffer, "image/jpeg");
      const metadata = image.getMetadata();

      // Should return metadata even if parsing fails
      assert.equal(metadata.format, "JPEG");
      assert(typeof metadata.exif === "object");
      assert(typeof metadata.jfif === "object");
    });

    it("provides metadata for different JPEG variants", () => {
      const buffer = createMinimalJPEG(16, 16);
      const image = new JPEGImage(buffer, "image/jpeg");

      // Verify frame-specific metadata is accessible
      assert.equal(image.progressive, false);
      assert.equal(image.precision, 8);
      assert(Array.isArray(image.components));
      assert(image.frameInfo !== null);
      assert(image.scanInfo !== null);
    });
  });

  describe("Error Handling", () => {
    it("throws descriptive errors for invalid JPEG data", () => {
      const invalidInputs = [
        { data: new Uint8Array([]), desc: "empty buffer" },
        { data: new Uint8Array([0x00, 0x00]), desc: "non-JPEG data" },
        { data: new Uint8Array([0xff, 0xd8]), desc: "incomplete JPEG" },
      ];

      for (const { data, desc } of invalidInputs) {
        assert.throws(
          () => {
            new JPEGImage(data, "image/jpeg");
          },
          /JPEG decode failed/,
          `Should throw for ${desc}`
        );
      }
    });

    it("handles corrupted marker data", () => {
      const corruptedBuffer = createMinimalJPEG(16, 16);
      // Corrupt the SOF marker length
      corruptedBuffer[corruptedBuffer.indexOf(0xc0) + 2] = 0xff;
      corruptedBuffer[corruptedBuffer.indexOf(0xc0) + 3] = 0xff;

      assert.throws(() => {
        new JPEGImage(corruptedBuffer, "image/jpeg");
      }, /JPEG decode failed/);
    });

    it("validates encoding parameters", () => {
      const buffer = createMinimalJPEG(16, 16);
      const image = new JPEGImage(buffer, "image/jpeg");
      image.pixels = createTestPixels(16, 16);

      // Test invalid quality values (should not throw, but clamp internally)
      const invalidQuality = image.toBuffer("image/jpeg", { quality: 150 });
      assert(invalidQuality instanceof Uint8Array);

      const negativeQuality = image.toBuffer("image/jpeg", { quality: -10 });
      assert(negativeQuality instanceof Uint8Array);
    });
  });

  describe("Performance and Memory", () => {
    it("handles reasonably sized images efficiently", () => {
      const sizes = [
        [64, 64], // 4KB pixels
        [128, 128], // 16KB pixels
        [256, 256], // 64KB pixels
      ];

      for (const [width, height] of sizes) {
        const buffer = createMinimalJPEG(width, height);
        const startTime = Date.now();

        const image = new JPEGImage(buffer, "image/jpeg");

        const decodeTime = Date.now() - startTime;

        assert.equal(image.width, width);
        assert.equal(image.height, height);
        assert(image.pixels instanceof Uint8Array);
        assert.equal(image.pixels.length, width * height * 4);

        // Reasonable performance expectation (< 1 second for test sizes)
        assert(decodeTime < 1000, `Decode took ${decodeTime}ms for ${width}x${height}`);
      }
    });

    it("manages memory efficiently during decode/encode cycles", () => {
      const buffer = createMinimalJPEG(32, 32);
      const image = new JPEGImage(buffer, "image/jpeg");

      // Verify pixel data is properly allocated
      assert(image.pixels instanceof Uint8Array);
      assert.equal(image.pixels.length, 32 * 32 * 4);

      // Test encoding doesn't corrupt original pixel data
      const originalPixels = new Uint8Array(image.pixels);
      const encoded = image.toBuffer("image/jpeg");

      assert(encoded instanceof Uint8Array);
      assert.equal(image.pixels.length, originalPixels.length);

      // Verify pixels haven't been corrupted
      for (let i = 0; i < Math.min(100, originalPixels.length); i++) {
        assert.equal(image.pixels[i], originalPixels[i], `Pixel corruption at index ${i}`);
      }
    });
  });

  describe("Integration with Base Image Operations", () => {
    let jpegImage;

    beforeEach(() => {
      const buffer = createMinimalJPEG(32, 32);
      jpegImage = new JPEGImage(buffer, "image/jpeg");

      // Set up proper pixel data for operations
      jpegImage.pixels = createTestPixels(32, 32);
    });

    it("supports chained operations", () => {
      // Test method chaining works with JPEG images
      const result = jpegImage.adjustBrightness(1.1).adjustContrast(1.2).grayscale("luminance");

      assert.equal(result, jpegImage);
      assert(jpegImage.pixels instanceof Uint8Array);
      assert.equal(jpegImage.pixels.length, 32 * 32 * 4);
    });

    it("maintains JPEG-specific properties after operations", () => {
      jpegImage.adjustBrightness(1.1);

      // JPEG-specific properties should remain
      assert.equal(jpegImage.mimeType, "image/jpeg");
      assert.equal(jpegImage.progressive, false);
      assert.equal(jpegImage.precision, 8);
      assert(Array.isArray(jpegImage.quantizationTables));
      assert(Array.isArray(jpegImage.huffmanTables));
    });

    it("can encode to JPEG after image operations", () => {
      // Apply some operations
      jpegImage.adjustBrightness(1.2).adjustContrast(0.9);

      // Should still be able to encode
      const encoded = jpegImage.toBuffer("image/jpeg", { quality: 85 });

      assert(encoded instanceof Uint8Array);
      assert(encoded.length > 0);
      assert.equal(encoded[0], 0xff); // SOI marker
      assert.equal(encoded[1], 0xd8);
    });
  });
});
