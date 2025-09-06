/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { COLOR_TYPES, decodeIHDR, getColorTypeName, VALID_BIT_DEPTHS } from "./decode-ihdr.js";
import { findChunksByType, parseChunks } from "./parse-chunks.js";
import { validatePNGSignature } from "./validate-signature.js";

describe("PNG IHDR Decoder", () => {
  describe("decodeIHDR", () => {
    it("throws TypeError for invalid buffer types", () => {
      assert.throws(() => decodeIHDR(null), TypeError);
      assert.throws(() => decodeIHDR(undefined), TypeError);
      assert.throws(() => decodeIHDR("invalid"), TypeError);
      assert.throws(() => decodeIHDR(123), TypeError);
    });

    it("throws on incorrect data length", () => {
      assert.throws(() => decodeIHDR(new Uint8Array(12)), /exactly 13 bytes/);
      assert.throws(() => decodeIHDR(new Uint8Array(14)), /exactly 13 bytes/);
      assert.throws(() => decodeIHDR(new Uint8Array(0)), /exactly 13 bytes/);
    });

    it("throws on zero width", () => {
      const invalidIHDR = new Uint8Array([
        0,
        0,
        0,
        0, // width = 0 (invalid)
        0,
        0,
        0,
        100, // height = 100
        8, // bit depth = 8
        2, // color type = RGB
        0, // compression = 0
        0, // filter = 0
        0, // interlace = 0
      ]);

      assert.throws(() => decodeIHDR(invalidIHDR), /Invalid width: 0/);
    });

    it("throws on zero height", () => {
      const invalidIHDR = new Uint8Array([
        0,
        0,
        0,
        100, // width = 100
        0,
        0,
        0,
        0, // height = 0 (invalid)
        8, // bit depth = 8
        2, // color type = RGB
        0, // compression = 0
        0, // filter = 0
        0, // interlace = 0
      ]);

      assert.throws(() => decodeIHDR(invalidIHDR), /Invalid height: 0/);
    });

    it("throws on invalid color type", () => {
      const invalidIHDR = new Uint8Array([
        0,
        0,
        0,
        100, // width = 100
        0,
        0,
        0,
        100, // height = 100
        8, // bit depth = 8
        5, // color type = 5 (invalid)
        0, // compression = 0
        0, // filter = 0
        0, // interlace = 0
      ]);

      assert.throws(() => decodeIHDR(invalidIHDR), /Invalid color type: 5/);
    });

    it("throws on invalid bit depth for color type", () => {
      const invalidIHDR = new Uint8Array([
        0,
        0,
        0,
        100, // width = 100
        0,
        0,
        0,
        100, // height = 100
        4, // bit depth = 4 (invalid for RGB)
        2, // color type = RGB
        0, // compression = 0
        0, // filter = 0
        0, // interlace = 0
      ]);

      assert.throws(() => decodeIHDR(invalidIHDR), /Invalid bit depth 4 for color type RGB/);
    });

    it("throws on invalid compression method", () => {
      const invalidIHDR = new Uint8Array([
        0,
        0,
        0,
        100, // width = 100
        0,
        0,
        0,
        100, // height = 100
        8, // bit depth = 8
        2, // color type = RGB
        1, // compression = 1 (invalid)
        0, // filter = 0
        0, // interlace = 0
      ]);

      assert.throws(() => decodeIHDR(invalidIHDR), /Invalid compression method: 1/);
    });

    it("throws on invalid filter method", () => {
      const invalidIHDR = new Uint8Array([
        0,
        0,
        0,
        100, // width = 100
        0,
        0,
        0,
        100, // height = 100
        8, // bit depth = 8
        2, // color type = RGB
        0, // compression = 0
        1, // filter = 1 (invalid)
        0, // interlace = 0
      ]);

      assert.throws(() => decodeIHDR(invalidIHDR), /Invalid filter method: 1/);
    });

    it("throws on invalid interlace method", () => {
      const invalidIHDR = new Uint8Array([
        0,
        0,
        0,
        100, // width = 100
        0,
        0,
        0,
        100, // height = 100
        8, // bit depth = 8
        2, // color type = RGB
        0, // compression = 0
        0, // filter = 0
        2, // interlace = 2 (invalid)
      ]);

      assert.throws(() => decodeIHDR(invalidIHDR), /Invalid interlace method: 2/);
    });

    it("decodes valid RGB IHDR", () => {
      const validIHDR = new Uint8Array([
        0,
        0,
        1,
        0, // width = 256
        0,
        0,
        0,
        200, // height = 200
        8, // bit depth = 8
        2, // color type = RGB
        0, // compression = 0
        0, // filter = 0
        0, // interlace = 0
      ]);

      const ihdr = decodeIHDR(validIHDR);

      assert.equal(ihdr.width, 256);
      assert.equal(ihdr.height, 200);
      assert.equal(ihdr.bitDepth, 8);
      assert.equal(ihdr.colorType, COLOR_TYPES.RGB);
      assert.equal(ihdr.compressionMethod, 0);
      assert.equal(ihdr.filterMethod, 0);
      assert.equal(ihdr.interlaceMethod, 0);
      assert.equal(ihdr.channels, 3);
      assert.equal(ihdr.hasAlpha, false);
      assert.equal(ihdr.bytesPerPixel, 3);
      assert.equal(ihdr.samplesPerPixel, 3);
    });

    it("decodes valid RGBA IHDR", () => {
      const validIHDR = new Uint8Array([
        0,
        0,
        2,
        0, // width = 512
        0,
        0,
        1,
        44, // height = 300
        16, // bit depth = 16
        6, // color type = RGB_ALPHA
        0, // compression = 0
        0, // filter = 0
        1, // interlace = 1 (Adam7)
      ]);

      const ihdr = decodeIHDR(validIHDR);

      assert.equal(ihdr.width, 512);
      assert.equal(ihdr.height, 300);
      assert.equal(ihdr.bitDepth, 16);
      assert.equal(ihdr.colorType, COLOR_TYPES.RGB_ALPHA);
      assert.equal(ihdr.compressionMethod, 0);
      assert.equal(ihdr.filterMethod, 0);
      assert.equal(ihdr.interlaceMethod, 1);
      assert.equal(ihdr.channels, 4);
      assert.equal(ihdr.hasAlpha, true);
      assert.equal(ihdr.bytesPerPixel, 8); // 4 samples * 16 bits / 8
      assert.equal(ihdr.samplesPerPixel, 4);
    });

    it("decodes valid grayscale IHDR", () => {
      const validIHDR = new Uint8Array([
        0,
        0,
        0,
        50, // width = 50
        0,
        0,
        0,
        50, // height = 50
        1, // bit depth = 1
        0, // color type = GRAYSCALE
        0, // compression = 0
        0, // filter = 0
        0, // interlace = 0
      ]);

      const ihdr = decodeIHDR(validIHDR);

      assert.equal(ihdr.width, 50);
      assert.equal(ihdr.height, 50);
      assert.equal(ihdr.bitDepth, 1);
      assert.equal(ihdr.colorType, COLOR_TYPES.GRAYSCALE);
      assert.equal(ihdr.channels, 1);
      assert.equal(ihdr.hasAlpha, false);
      assert.equal(ihdr.bytesPerPixel, 0.125); // 1 sample * 1 bit / 8
      assert.equal(ihdr.samplesPerPixel, 1);
    });

    it("decodes valid palette IHDR", () => {
      const validIHDR = new Uint8Array([
        0,
        0,
        0,
        100, // width = 100
        0,
        0,
        0,
        100, // height = 100
        4, // bit depth = 4
        3, // color type = PALETTE
        0, // compression = 0
        0, // filter = 0
        0, // interlace = 0
      ]);

      const ihdr = decodeIHDR(validIHDR);

      assert.equal(ihdr.width, 100);
      assert.equal(ihdr.height, 100);
      assert.equal(ihdr.bitDepth, 4);
      assert.equal(ihdr.colorType, COLOR_TYPES.PALETTE);
      assert.equal(ihdr.channels, 1); // Palette index
      assert.equal(ihdr.hasAlpha, false);
      assert.equal(ihdr.bytesPerPixel, 0.5); // 1 sample * 4 bits / 8
      assert.equal(ihdr.samplesPerPixel, 1);
    });

    it("decodes valid grayscale+alpha IHDR", () => {
      const validIHDR = new Uint8Array([
        0,
        0,
        0,
        64, // width = 64
        0,
        0,
        0,
        64, // height = 64
        8, // bit depth = 8
        4, // color type = GRAYSCALE_ALPHA
        0, // compression = 0
        0, // filter = 0
        0, // interlace = 0
      ]);

      const ihdr = decodeIHDR(validIHDR);

      assert.equal(ihdr.width, 64);
      assert.equal(ihdr.height, 64);
      assert.equal(ihdr.bitDepth, 8);
      assert.equal(ihdr.colorType, COLOR_TYPES.GRAYSCALE_ALPHA);
      assert.equal(ihdr.channels, 2);
      assert.equal(ihdr.hasAlpha, true);
      assert.equal(ihdr.bytesPerPixel, 2); // 2 samples * 8 bits / 8
      assert.equal(ihdr.samplesPerPixel, 2);
    });

    it("handles maximum dimensions", () => {
      const maxDimIHDR = new Uint8Array([
        0x7f,
        0xff,
        0xff,
        0xff, // width = 2147483647 (max)
        0x7f,
        0xff,
        0xff,
        0xff, // height = 2147483647 (max)
        8, // bit depth = 8
        2, // color type = RGB
        0, // compression = 0
        0, // filter = 0
        0, // interlace = 0
      ]);

      const ihdr = decodeIHDR(maxDimIHDR);
      assert.equal(ihdr.width, 0x7fffffff);
      assert.equal(ihdr.height, 0x7fffffff);
    });

    it("throws on dimensions exceeding maximum", () => {
      const oversizeIHDR = new Uint8Array([
        0x80,
        0x00,
        0x00,
        0x00, // width = 2147483648 (too large)
        0,
        0,
        0,
        100, // height = 100
        8, // bit depth = 8
        2, // color type = RGB
        0, // compression = 0
        0, // filter = 0
        0, // interlace = 0
      ]);

      assert.throws(() => decodeIHDR(oversizeIHDR), /Invalid width/);
    });
  });

  describe("getColorTypeName", () => {
    it("returns correct names for valid color types", () => {
      assert.equal(getColorTypeName(COLOR_TYPES.GRAYSCALE), "Grayscale");
      assert.equal(getColorTypeName(COLOR_TYPES.RGB), "RGB");
      assert.equal(getColorTypeName(COLOR_TYPES.PALETTE), "Palette");
      assert.equal(getColorTypeName(COLOR_TYPES.GRAYSCALE_ALPHA), "Grayscale+Alpha");
      assert.equal(getColorTypeName(COLOR_TYPES.RGB_ALPHA), "RGB+Alpha");
    });

    it("returns unknown format for invalid color types", () => {
      assert.equal(getColorTypeName(5), "Unknown(5)");
      assert.equal(getColorTypeName(99), "Unknown(99)");
    });
  });

  describe("Constants", () => {
    it("exports correct COLOR_TYPES", () => {
      assert.equal(COLOR_TYPES.GRAYSCALE, 0);
      assert.equal(COLOR_TYPES.RGB, 2);
      assert.equal(COLOR_TYPES.PALETTE, 3);
      assert.equal(COLOR_TYPES.GRAYSCALE_ALPHA, 4);
      assert.equal(COLOR_TYPES.RGB_ALPHA, 6);
    });

    it("exports correct VALID_BIT_DEPTHS", () => {
      assert.deepEqual(VALID_BIT_DEPTHS[COLOR_TYPES.GRAYSCALE], [1, 2, 4, 8, 16]);
      assert.deepEqual(VALID_BIT_DEPTHS[COLOR_TYPES.RGB], [8, 16]);
      assert.deepEqual(VALID_BIT_DEPTHS[COLOR_TYPES.PALETTE], [1, 2, 4, 8]);
      assert.deepEqual(VALID_BIT_DEPTHS[COLOR_TYPES.GRAYSCALE_ALPHA], [8, 16]);
      assert.deepEqual(VALID_BIT_DEPTHS[COLOR_TYPES.RGB_ALPHA], [8, 16]);
    });
  });

  describe("Bit Depth Validation", () => {
    it("validates all bit depths for grayscale", () => {
      const validDepths = [1, 2, 4, 8, 16];

      for (const bitDepth of validDepths) {
        const ihdrData = new Uint8Array([
          0,
          0,
          0,
          100, // width
          0,
          0,
          0,
          100, // height
          bitDepth, // bit depth
          COLOR_TYPES.GRAYSCALE, // color type
          0,
          0,
          0, // compression, filter, interlace
        ]);

        const ihdr = decodeIHDR(ihdrData);
        assert.equal(ihdr.bitDepth, bitDepth);
        assert.equal(ihdr.colorType, COLOR_TYPES.GRAYSCALE);
      }
    });

    it("validates all bit depths for RGB", () => {
      const validDepths = [8, 16];

      for (const bitDepth of validDepths) {
        const ihdrData = new Uint8Array([
          0,
          0,
          0,
          100, // width
          0,
          0,
          0,
          100, // height
          bitDepth, // bit depth
          COLOR_TYPES.RGB, // color type
          0,
          0,
          0, // compression, filter, interlace
        ]);

        const ihdr = decodeIHDR(ihdrData);
        assert.equal(ihdr.bitDepth, bitDepth);
        assert.equal(ihdr.colorType, COLOR_TYPES.RGB);
      }
    });

    it("validates all bit depths for palette", () => {
      const validDepths = [1, 2, 4, 8];

      for (const bitDepth of validDepths) {
        const ihdrData = new Uint8Array([
          0,
          0,
          0,
          100, // width
          0,
          0,
          0,
          100, // height
          bitDepth, // bit depth
          COLOR_TYPES.PALETTE, // color type
          0,
          0,
          0, // compression, filter, interlace
        ]);

        const ihdr = decodeIHDR(ihdrData);
        assert.equal(ihdr.bitDepth, bitDepth);
        assert.equal(ihdr.colorType, COLOR_TYPES.PALETTE);
      }
    });

    it("rejects invalid bit depths", () => {
      // Test invalid bit depth for RGB (only 8, 16 allowed)
      const invalidRGB = new Uint8Array([
        0,
        0,
        0,
        100, // width
        0,
        0,
        0,
        100, // height
        4, // bit depth = 4 (invalid for RGB)
        COLOR_TYPES.RGB, // color type
        0,
        0,
        0, // compression, filter, interlace
      ]);

      assert.throws(() => decodeIHDR(invalidRGB), /Invalid bit depth 4 for color type RGB/);

      // Test invalid bit depth for palette (only 1,2,4,8 allowed)
      const invalidPalette = new Uint8Array([
        0,
        0,
        0,
        100, // width
        0,
        0,
        0,
        100, // height
        16, // bit depth = 16 (invalid for palette)
        COLOR_TYPES.PALETTE, // color type
        0,
        0,
        0, // compression, filter, interlace
      ]);

      assert.throws(() => decodeIHDR(invalidPalette), /Invalid bit depth 16 for color type Palette/);
    });
  });

  describe("Real PNG Integration", () => {
    it("decodes IHDR from real PNG file", () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");

        // Verify it's a PNG file
        assert(validatePNGSignature(pngBuffer), "Should be valid PNG");

        // Parse chunks and find IHDR
        const chunkData = pngBuffer.slice(8);
        const chunks = parseChunks(chunkData);
        const ihdrChunks = findChunksByType(chunks, "IHDR");

        assert.equal(ihdrChunks.length, 1, "Should have exactly one IHDR chunk");

        // Decode IHDR
        const ihdr = decodeIHDR(ihdrChunks[0].data);

        // Validate decoded properties
        assert(typeof ihdr.width === "number" && ihdr.width > 0, "Width should be positive number");
        assert(typeof ihdr.height === "number" && ihdr.height > 0, "Height should be positive number");
        assert([1, 2, 4, 8, 16].includes(ihdr.bitDepth), "Bit depth should be valid");
        assert([0, 2, 3, 4, 6].includes(ihdr.colorType), "Color type should be valid");
        assert.equal(ihdr.compressionMethod, 0, "Compression method should be 0");
        assert.equal(ihdr.filterMethod, 0, "Filter method should be 0");
        assert([0, 1].includes(ihdr.interlaceMethod), "Interlace method should be 0 or 1");

        // Validate derived properties
        assert(typeof ihdr.channels === "number" && ihdr.channels >= 1 && ihdr.channels <= 4, "Channels should be 1-4");
        assert(typeof ihdr.hasAlpha === "boolean", "hasAlpha should be boolean");
        assert(typeof ihdr.bytesPerPixel === "number" && ihdr.bytesPerPixel > 0, "bytesPerPixel should be positive");
        assert(typeof ihdr.samplesPerPixel === "number" && ihdr.samplesPerPixel >= 1, "samplesPerPixel should be >= 1");

        console.log(`✓ Decoded IHDR from apple-touch-icon.png:`);
        console.log(`  - Dimensions: ${ihdr.width}x${ihdr.height}`);
        console.log(`  - Format: ${ihdr.bitDepth}-bit ${getColorTypeName(ihdr.colorType)}`);
        console.log(`  - Channels: ${ihdr.channels} (alpha: ${ihdr.hasAlpha})`);
        console.log(`  - Bytes per pixel: ${ihdr.bytesPerPixel}`);
        console.log(`  - Interlaced: ${ihdr.interlaceMethod === 1 ? "Yes (Adam7)" : "No"}`);
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping real PNG IHDR test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });

    it("validates IHDR structure in real PNG", () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");
        const chunkData = pngBuffer.slice(8);
        const chunks = parseChunks(chunkData);
        const ihdrChunk = findChunksByType(chunks, "IHDR")[0];

        // IHDR should be exactly 13 bytes
        assert.equal(ihdrChunk.data.length, 13, "IHDR chunk should be 13 bytes");

        // Should decode without throwing
        const ihdr = decodeIHDR(ihdrChunk.data);

        // Verify bit depth is valid for color type
        const validDepths = VALID_BIT_DEPTHS[ihdr.colorType];
        assert(
          validDepths.includes(ihdr.bitDepth),
          `Bit depth ${ihdr.bitDepth} should be valid for color type ${ihdr.colorType}`
        );

        // Verify alpha channel detection
        const expectedAlpha =
          ihdr.colorType === COLOR_TYPES.GRAYSCALE_ALPHA || ihdr.colorType === COLOR_TYPES.RGB_ALPHA;
        assert.equal(ihdr.hasAlpha, expectedAlpha, "Alpha channel detection should be correct");
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping real PNG IHDR validation test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });
  });

  describe("Edge Cases", () => {
    it("handles minimum valid dimensions", () => {
      const minDimIHDR = new Uint8Array([
        0,
        0,
        0,
        1, // width = 1 (minimum)
        0,
        0,
        0,
        1, // height = 1 (minimum)
        8, // bit depth = 8
        2, // color type = RGB
        0, // compression = 0
        0, // filter = 0
        0, // interlace = 0
      ]);

      const ihdr = decodeIHDR(minDimIHDR);
      assert.equal(ihdr.width, 1);
      assert.equal(ihdr.height, 1);
    });

    it("calculates correct bytes per pixel for sub-byte depths", () => {
      // 1-bit grayscale: 1 sample * 1 bit / 8 = 0.125 bytes per pixel
      const oneBitIHDR = new Uint8Array([0, 0, 0, 8, 0, 0, 0, 8, 1, COLOR_TYPES.GRAYSCALE, 0, 0, 0]);
      const ihdr1 = decodeIHDR(oneBitIHDR);
      assert.equal(ihdr1.bytesPerPixel, 0.125);

      // 2-bit grayscale: 1 sample * 2 bits / 8 = 0.25 bytes per pixel
      const twoBitIHDR = new Uint8Array([0, 0, 0, 8, 0, 0, 0, 8, 2, COLOR_TYPES.GRAYSCALE, 0, 0, 0]);
      const ihdr2 = decodeIHDR(twoBitIHDR);
      assert.equal(ihdr2.bytesPerPixel, 0.25);

      // 4-bit palette: 1 sample * 4 bits / 8 = 0.5 bytes per pixel
      const fourBitIHDR = new Uint8Array([0, 0, 0, 8, 0, 0, 0, 8, 4, COLOR_TYPES.PALETTE, 0, 0, 0]);
      const ihdr4 = decodeIHDR(fourBitIHDR);
      assert.equal(ihdr4.bytesPerPixel, 0.5);
    });

    it("calculates correct bytes per pixel for high bit depths", () => {
      // 16-bit RGB: 3 samples * 16 bits / 8 = 6 bytes per pixel
      const rgb16IHDR = new Uint8Array([0, 0, 0, 8, 0, 0, 0, 8, 16, COLOR_TYPES.RGB, 0, 0, 0]);
      const ihdrRGB16 = decodeIHDR(rgb16IHDR);
      assert.equal(ihdrRGB16.bytesPerPixel, 6);

      // 16-bit RGBA: 4 samples * 16 bits / 8 = 8 bytes per pixel
      const rgba16IHDR = new Uint8Array([0, 0, 0, 8, 0, 0, 0, 8, 16, COLOR_TYPES.RGB_ALPHA, 0, 0, 0]);
      const ihdrRGBA16 = decodeIHDR(rgba16IHDR);
      assert.equal(ihdrRGBA16.bytesPerPixel, 8);
    });
  });
});
