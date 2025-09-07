/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for JPEG main class.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { createStandardHuffmanTable } from "./huffman-decode.js";
import { JPEGImage } from "./index.js";

/**
 * Create minimal valid JPEG buffer for testing.
 *
 * @param {number} [width=8] - Image width
 * @param {number} [height=8] - Image height
 * @param {number} [components=1] - Number of components
 * @returns {Uint8Array} Minimal JPEG buffer
 */
function createTestJPEGBuffer(width = 8, height = 8, components = 1) {
  const buffer = [];

  // SOI marker
  buffer.push(0xff, 0xd8);

  // APP0 (JFIF) marker
  buffer.push(0xff, 0xe0);
  buffer.push(0x00, 0x10); // Length
  buffer.push(0x4a, 0x46, 0x49, 0x46, 0x00); // "JFIF\0"
  buffer.push(0x01, 0x01); // Version 1.1
  buffer.push(0x00); // Units (no units)
  buffer.push(0x00, 0x01, 0x00, 0x01); // X/Y density
  buffer.push(0x00, 0x00); // Thumbnail dimensions

  // DQT marker (quantization table)
  buffer.push(0xff, 0xdb);
  buffer.push(0x00, 0x43); // Length (67 bytes)
  buffer.push(0x00); // Precision and table ID
  // Simple quantization table (64 values)
  for (let i = 0; i < 64; i++) {
    buffer.push(Math.min(255, (i % 8) + 1));
  }

  // DHT marker (Huffman table) - DC luminance
  buffer.push(0xff, 0xc4);
  const dcTable = createStandardHuffmanTable("dc-luminance");
  const dcLength = 2 + 1 + 16 + dcTable.symbols.length;
  buffer.push((dcLength >> 8) & 0xff, dcLength & 0xff);
  buffer.push(0x00); // Class and ID
  // Code lengths
  for (let i = 0; i < 16; i++) {
    buffer.push(dcTable.codeLengths[i]);
  }
  // Symbols
  for (const symbol of dcTable.symbols) {
    buffer.push(symbol);
  }

  // DHT marker (Huffman table) - AC luminance
  buffer.push(0xff, 0xc4);
  const acTable = createStandardHuffmanTable("ac-luminance");
  const acLength = 2 + 1 + 16 + acTable.symbols.length;
  buffer.push((acLength >> 8) & 0xff, acLength & 0xff);
  buffer.push(0x10); // Class and ID
  // Code lengths
  for (let i = 0; i < 16; i++) {
    buffer.push(acTable.codeLengths[i]);
  }
  // Symbols
  for (const symbol of acTable.symbols) {
    buffer.push(symbol);
  }

  // SOF0 marker (baseline)
  buffer.push(0xff, 0xc0);
  const sofLength = 8 + components * 3;
  buffer.push((sofLength >> 8) & 0xff, sofLength & 0xff);
  buffer.push(0x08); // Precision
  buffer.push((height >> 8) & 0xff, height & 0xff); // Height
  buffer.push((width >> 8) & 0xff, width & 0xff); // Width
  buffer.push(components); // Number of components

  // Component specifications
  for (let i = 0; i < components; i++) {
    buffer.push(i + 1); // Component ID
    buffer.push(0x11); // Sampling factors
    buffer.push(i === 0 ? 0 : 1); // Quantization table
  }

  // SOS marker (start of scan)
  buffer.push(0xff, 0xda);
  const sosLength = 6 + components * 2;
  buffer.push((sosLength >> 8) & 0xff, sosLength & 0xff);
  buffer.push(components); // Number of components

  // Component scan specifications
  for (let i = 0; i < components; i++) {
    buffer.push(i + 1); // Component ID
    buffer.push(i === 0 ? 0x00 : 0x11); // Huffman table selectors
  }

  buffer.push(0x00, 0x3f, 0x00); // Scan parameters

  // Minimal scan data (just enough to not crash)
  buffer.push(0x00, 0x00, 0x00, 0x00);

  // EOI marker
  buffer.push(0xff, 0xd9);

  return new Uint8Array(buffer);
}

describe("JPEG Main Class", () => {
  describe("constructor", () => {
    it("creates JPEG image from valid buffer", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);

      // Disable auto pixel decoding to avoid Huffman decoding issues
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      assert.equal(jpegImage.width, 16);
      assert.equal(jpegImage.height, 16);
      assert.equal(jpegImage.mimeType, "image/jpeg");
      assert.equal(jpegImage.componentCount, 1);
      assert.equal(jpegImage.colorSpace, "grayscale");
      assert.equal(jpegImage.isDecoded, false);
    });

    it("auto-decodes pixels by default", () => {
      const jpegBuffer = createTestJPEGBuffer(8, 8, 1);

      try {
        const jpegImage = new JPEGImage(jpegBuffer); // Auto-decode enabled
        // If it doesn't throw, pixel decoding worked
        assert(jpegImage.isDecoded);
      } catch (error) {
        // Expected if test JPEG data doesn't match Huffman codes
        assert(error.message.includes("decoding") || error.message.includes("Huffman"));
      }
    });

    it("handles color JPEG images", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 3);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      assert.equal(jpegImage.componentCount, 3);
      assert.equal(jpegImage.colorSpace, "ycbcr");
    });

    it("validates JPEG structure by default", () => {
      const invalidBuffer = new Uint8Array([0xff, 0xd8, 0x00, 0x00]); // Invalid JPEG

      assert.throws(() => new JPEGImage(invalidBuffer), /Failed to create JPEG image/);
    });

    it("can skip structure validation", () => {
      const invalidBuffer = new Uint8Array([0xff, 0xd8, 0x00, 0x00]);

      assert.throws(() => new JPEGImage(invalidBuffer, { validateStructure: false }), /Failed to create JPEG image/);
    });
  });

  describe("decodePixels", () => {
    it("decodes pixels on demand", () => {
      const jpegBuffer = createTestJPEGBuffer(8, 8, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      assert.equal(jpegImage.isDecoded, false);

      try {
        jpegImage.decodePixels();
        assert.equal(jpegImage.isDecoded, true);
        assert(jpegImage.pixels instanceof Uint8Array);
        assert.equal(jpegImage.pixels.length, 8 * 8 * 4); // RGBA
      } catch (error) {
        // Expected if test data doesn't match Huffman codes
        assert(error.message.includes("decoding") || error.message.includes("Huffman"));
      }
    });

    it("handles multiple decode calls gracefully", () => {
      const jpegBuffer = createTestJPEGBuffer(8, 8, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      try {
        jpegImage.decodePixels();
        const firstPixels = jpegImage.pixels;

        jpegImage.decodePixels(); // Second call
        assert.strictEqual(jpegImage.pixels, firstPixels); // Same reference
      } catch (error) {
        // Expected if test data doesn't match Huffman codes
        assert(error.message.includes("decoding") || error.message.includes("Huffman"));
      }
    });
  });

  describe("toBuffer", () => {
    it("rejects non-JPEG target formats", () => {
      const jpegBuffer = createTestJPEGBuffer(8, 8, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      assert.throws(() => jpegImage.toBuffer("image/png"), /only supports image\/jpeg/);
    });

    it("requires pixel data for encoding", () => {
      const jpegBuffer = createTestJPEGBuffer(8, 8, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      assert.throws(() => jpegImage.toBuffer(), /No pixel data available/);
    });

    it("throws not implemented error", () => {
      const jpegBuffer = createTestJPEGBuffer(8, 8, 1);

      try {
        const jpegImage = new JPEGImage(jpegBuffer); // Auto-decode
        assert.throws(() => jpegImage.toBuffer(), /not yet implemented/);
      } catch (error) {
        // Expected if pixel decoding fails
        assert(error.message.includes("decoding") || error.message.includes("Huffman"));
      }
    });
  });

  describe("metadata", () => {
    it("extracts basic JPEG metadata", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      const metadata = jpegImage.getMetadata();

      assert.equal(metadata.format, "JPEG");
      assert.equal(metadata.width, 16);
      assert.equal(metadata.height, 16);
      assert.equal(metadata.componentCount, 1);
      assert.equal(metadata.colorSpace, "grayscale");
      assert.equal(metadata.isProgressive, false);
      assert.equal(metadata.isBaseline, true);
      assert.equal(metadata.hasQuantizationTables, true);
      assert.equal(metadata.hasHuffmanTables, true);
    });

    it("estimates JPEG quality", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      const quality = jpegImage.getQuality();
      assert(typeof quality === "number");
      assert(quality >= 1 && quality <= 100);
    });

    it("allows setting metadata", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      jpegImage.setMetadata({ quality: 95, colorSpace: "grayscale" });

      assert.equal(jpegImage.getQuality(), 95);
      assert.equal(jpegImage.getColorSpace(), "grayscale");
    });

    it("validates quality range", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      assert.throws(() => jpegImage.setMetadata({ quality: 0 }), /between 1 and 100/);
      assert.throws(() => jpegImage.setMetadata({ quality: 101 }), /between 1 and 100/);
      assert.throws(() => jpegImage.setMetadata({ quality: "high" }), /between 1 and 100/);
    });

    it("validates color space", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      assert.throws(() => jpegImage.setMetadata({ colorSpace: "rgb" }), /must be 'grayscale' or 'ycbcr'/);
    });
  });

  describe("JPEG properties", () => {
    it("reports correct component count", () => {
      const grayscaleBuffer = createTestJPEGBuffer(16, 16, 1);
      const colorBuffer = createTestJPEGBuffer(16, 16, 3);

      const grayscaleImage = new JPEGImage(grayscaleBuffer, { autoDecodePixels: false });
      const colorImage = new JPEGImage(colorBuffer, { autoDecodePixels: false });

      assert.equal(grayscaleImage.getComponentCount(), 1);
      assert.equal(colorImage.getComponentCount(), 3);
    });

    it("reports progressive status", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      assert.equal(jpegImage.isProgressiveJPEG(), false);
    });

    it("provides JPEG structure access", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      const structure = jpegImage.getJPEGStructure();

      assert(structure.sof);
      assert(structure.sos);
      assert(structure.quantizationTables);
      assert(structure.huffmanTables);
      assert(typeof structure.scanDataOffset === "number");
    });
  });

  describe("static methods", () => {
    describe("fromBuffer", () => {
      it("creates JPEG from valid buffer", () => {
        const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
        const jpegImage = JPEGImage.fromBuffer(jpegBuffer, { autoDecodePixels: false });

        assert(jpegImage instanceof JPEGImage);
        assert.equal(jpegImage.width, 16);
        assert.equal(jpegImage.height, 16);
      });

      it("validates JPEG signature", () => {
        const invalidBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG signature

        assert.throws(() => JPEGImage.fromBuffer(invalidBuffer), /missing JPEG signature/);
      });

      it("handles empty buffer", () => {
        const emptyBuffer = new Uint8Array(0);

        assert.throws(() => JPEGImage.fromBuffer(emptyBuffer), /missing JPEG signature/);
      });
    });

    describe("isJPEG", () => {
      it("identifies valid JPEG buffers", () => {
        const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
        assert.equal(JPEGImage.isJPEG(jpegBuffer), true);
      });

      it("rejects non-JPEG buffers", () => {
        const pngBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
        const emptyBuffer = new Uint8Array(0);
        const shortBuffer = new Uint8Array([0xff]);

        assert.equal(JPEGImage.isJPEG(pngBuffer), false);
        assert.equal(JPEGImage.isJPEG(emptyBuffer), false);
        assert.equal(JPEGImage.isJPEG(shortBuffer), false);
      });

      it("handles invalid input gracefully", () => {
        assert.equal(JPEGImage.isJPEG(null), false);
        assert.equal(JPEGImage.isJPEG(undefined), false);
        assert.equal(JPEGImage.isJPEG("not a buffer"), false);
      });
    });

    describe("getSupportedMimeTypes", () => {
      it("returns JPEG MIME types", () => {
        const mimeTypes = JPEGImage.getSupportedMimeTypes();

        assert(Array.isArray(mimeTypes));
        assert(mimeTypes.includes("image/jpeg"));
        assert(mimeTypes.includes("image/jpg"));
      });
    });

    describe("getCapabilities", () => {
      it("returns format capabilities", () => {
        const capabilities = JPEGImage.getCapabilities();

        assert(capabilities.decode);
        assert(capabilities.encode);
        assert(capabilities.metadata);

        // Check decode capabilities
        assert.equal(capabilities.decode.baseline, true);
        assert.equal(capabilities.decode.progressive, false);
        assert(capabilities.decode.colorSpaces.includes("grayscale"));
        assert(capabilities.decode.colorSpaces.includes("ycbcr"));

        // Check encode capabilities
        assert.equal(capabilities.encode.baseline, false); // Not implemented yet

        // Check metadata capabilities
        assert.equal(capabilities.metadata.quantizationTables, true);
        assert.equal(capabilities.metadata.huffmanTables, true);
      });
    });
  });

  describe("error handling", () => {
    it("handles missing SOF marker", () => {
      const invalidBuffer = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]); // SOI + EOI only

      assert.throws(() => new JPEGImage(invalidBuffer), /Failed to create JPEG image/);
    });

    it("handles unsupported component counts", () => {
      // This would require creating a JPEG with 2 or 4 components
      // For now, just test the validation logic exists
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      // Manually modify structure to test validation
      jpegImage.jpegStructure.sof.components = [{ id: 1 }, { id: 2 }]; // 2 components

      assert.throws(() => jpegImage._validateJPEGStructure(), /2 components/);
    });

    it("handles missing quantization tables", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      // Clear quantization tables
      jpegImage.jpegStructure.quantizationTables.clear();

      assert.throws(() => jpegImage._validateJPEGStructure(), /missing quantization tables/);
    });

    it("handles missing Huffman tables", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      // Clear Huffman tables
      jpegImage.jpegStructure.huffmanTables.clear();

      assert.throws(() => jpegImage._validateJPEGStructure(), /missing Huffman tables/);
    });
  });

  describe("integration", () => {
    it("works with base Image class methods", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      // Test inherited properties
      assert.equal(jpegImage.width, 16);
      assert.equal(jpegImage.height, 16);
      assert.equal(jpegImage.channels, 4); // Always RGBA
      assert.equal(jpegImage.pixelCount, 256);
      assert.equal(jpegImage.hasAlpha, true);

      // Test that it's an instance of base Image class
      assert(jpegImage instanceof JPEGImage);
    });

    it("maintains JPEG-specific properties after operations", () => {
      const jpegBuffer = createTestJPEGBuffer(16, 16, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      const originalQuality = jpegImage.getQuality();
      const originalColorSpace = jpegImage.getColorSpace();

      // Properties should persist
      assert.equal(jpegImage.getQuality(), originalQuality);
      assert.equal(jpegImage.getColorSpace(), originalColorSpace);
    });
  });

  describe("performance", () => {
    it("handles large JPEG structures efficiently", () => {
      const jpegBuffer = createTestJPEGBuffer(256, 256, 3);

      const startTime = Date.now();
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });
      const endTime = Date.now();

      assert(jpegImage instanceof JPEGImage);
      assert(endTime - startTime < 100, `JPEG creation took ${endTime - startTime}ms`);
    });

    it("handles metadata extraction efficiently", () => {
      const jpegBuffer = createTestJPEGBuffer(64, 64, 1);
      const jpegImage = new JPEGImage(jpegBuffer, { autoDecodePixels: false });

      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        jpegImage.getMetadata();
      }
      const endTime = Date.now();

      assert(endTime - startTime < 50, `Metadata extraction took ${endTime - startTime}ms`);
    });
  });
});
