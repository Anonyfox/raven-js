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
import { decodeIHDR } from "./decode-ihdr.js";
import { decompressIDAT } from "./decompress-idat.js";
import { findChunksByType, parseChunks } from "./parse-chunks.js";
import {
  analyzePixelData,
  applyTransparency,
  convertBitDepth,
  convertGrayscaleToRGBA,
  convertPaletteToRGBA,
  convertRGBToRGBA,
  deinterlaceAdam7,
  getExpectedPixelDataSize,
  reconstructPixels,
  validateReconstructionParameters,
} from "./reconstruct-pixels.js";
import { reverseFilters } from "./reverse-filters.js";
import { validatePNGSignature } from "./validate-signature.js";

describe("PNG Pixel Reconstruction", () => {
  describe("reconstructPixels", () => {
    it("throws TypeError for invalid buffer types", () => {
      const mockIHDR = { width: 10, height: 10, colorType: 2, bitDepth: 8 };
      assert.throws(() => reconstructPixels(null, mockIHDR), TypeError);
      assert.throws(() => reconstructPixels(undefined, mockIHDR), TypeError);
      assert.throws(() => reconstructPixels("invalid", mockIHDR), TypeError);
      assert.throws(() => reconstructPixels(123, mockIHDR), TypeError);
    });

    it("throws on invalid IHDR object", () => {
      const validData = new Uint8Array(100);
      assert.throws(() => reconstructPixels(validData, null), TypeError);
      assert.throws(() => reconstructPixels(validData, undefined), TypeError);
      assert.throws(() => reconstructPixels(validData, "invalid"), TypeError);
    });

    it("reconstructs RGB pixels correctly", () => {
      // RGB data: 2x2 image, 3 bytes per pixel = 12 bytes
      const unfilteredData = new Uint8Array([
        255,
        0,
        0, // Red pixel
        0,
        255,
        0, // Green pixel
        0,
        0,
        255, // Blue pixel
        255,
        255,
        0, // Yellow pixel
      ]);
      const ihdr = { width: 2, height: 2, colorType: 2, bitDepth: 8 };
      const result = reconstructPixels(unfilteredData, ihdr);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(result.length, 16, "Should return RGBA data (2x2x4 = 16 bytes)");

      // Check first pixel (red -> red with alpha)
      assert.equal(result[0], 255, "Red component");
      assert.equal(result[1], 0, "Green component");
      assert.equal(result[2], 0, "Blue component");
      assert.equal(result[3], 255, "Alpha component");
    });

    it("accepts optional palette parameter", () => {
      const unfilteredData = new Uint8Array(100);
      const ihdr = { width: 10, height: 10, colorType: 3, bitDepth: 8 };
      const palette = new Uint8Array(768); // 256 colors * 3 bytes
      const result = reconstructPixels(unfilteredData, ihdr, palette);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
    });

    it("accepts optional transparency parameter", () => {
      const unfilteredData = new Uint8Array(100);
      const ihdr = { width: 10, height: 10, colorType: 3, bitDepth: 8 };
      const palette = new Uint8Array(768);
      const transparency = new Uint8Array(256);
      const result = reconstructPixels(unfilteredData, ihdr, palette, transparency);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
    });
  });

  describe("convertBitDepth", () => {
    it("throws TypeError for invalid data types", () => {
      assert.throws(() => convertBitDepth(null, 8, 1), TypeError);
      assert.throws(() => convertBitDepth(undefined, 8, 1), TypeError);
      assert.throws(() => convertBitDepth("invalid", 8, 1), TypeError);
      assert.throws(() => convertBitDepth(123, 8, 1), TypeError);
    });

    it("throws on invalid bit depth", () => {
      const data = new Uint8Array(4);
      assert.throws(() => convertBitDepth(data, 0, 1), /Invalid bit depth/);
      assert.throws(() => convertBitDepth(data, 3, 1), /Invalid bit depth/);
      assert.throws(() => convertBitDepth(data, 32, 1), /Invalid bit depth/);
    });

    it("throws on invalid samples per pixel", () => {
      const data = new Uint8Array(4);
      assert.throws(() => convertBitDepth(data, 8, 0), /Invalid samplesPerPixel/);
      assert.throws(() => convertBitDepth(data, 8, 5), /Invalid samplesPerPixel/);
    });

    it("returns copy for 8-bit data", () => {
      const data = new Uint8Array([128, 64, 192, 255]);
      const result = convertBitDepth(data, 8, 1);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(result.length, 4, "Should preserve length");
      assert.deepEqual(Array.from(result), [128, 64, 192, 255], "Should preserve values");
      assert.notStrictEqual(result, data, "Should return new array");
    });

    it("converts 16-bit to 8-bit", () => {
      // 16-bit data: high byte, low byte pairs
      const data = new Uint8Array([0xff, 0x00, 0x80, 0x40, 0x00, 0xff]);
      const result = convertBitDepth(data, 16, 1);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(result.length, 3, "Should halve the length");
      assert.deepEqual(Array.from(result), [0xff, 0x80, 0x00], "Should take high bytes");
    });

    it("converts 1-bit to 8-bit", () => {
      // 1-bit: 8 pixels per byte
      const data = new Uint8Array([0b10110100]); // 1,0,1,1,0,1,0,0
      const result = convertBitDepth(data, 1, 1);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(result.length, 8, "Should expand to 8 pixels");
      assert.deepEqual(Array.from(result), [255, 0, 255, 255, 0, 255, 0, 0], "Should scale 0->0, 1->255");
    });

    it("converts 2-bit to 8-bit", () => {
      // 2-bit: 4 pixels per byte, values 0-3
      const data = new Uint8Array([0b11100100]); // 3,2,1,0
      const result = convertBitDepth(data, 2, 1);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(result.length, 4, "Should expand to 4 pixels");
      // Scale: 0->0, 1->85, 2->170, 3->255
      assert.deepEqual(Array.from(result), [255, 170, 85, 0], "Should scale 2-bit values");
    });

    it("converts 4-bit to 8-bit", () => {
      // 4-bit: 2 pixels per byte, values 0-15
      const data = new Uint8Array([0xf0, 0x8a]); // 15,0 then 8,10
      const result = convertBitDepth(data, 4, 1);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(result.length, 4, "Should expand to 4 pixels");
      // Scale: 0->0, 8->136, 10->170, 15->255
      assert.deepEqual(Array.from(result), [255, 0, 136, 170], "Should scale 4-bit values");
    });

    it("handles multiple samples per pixel", () => {
      // 16-bit RGB data: R=0xFF00, G=0x8000, B=0x4000 (3 samples, 6 bytes total)
      const data = new Uint8Array([0xff, 0x00, 0x80, 0x00, 0x40, 0x00]);
      const result = convertBitDepth(data, 16, 3); // RGB

      assert(result instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(result.length, 3, "Should have 3 samples for 1 pixel");
      assert.deepEqual(Array.from(result), [0xff, 0x80, 0x40], "Should convert each 16-bit sample to 8-bit");
    });

    it("handles edge case values", () => {
      // Test minimum and maximum values
      const data1bit = new Uint8Array([0x00, 0xff]); // All 0s, all 1s
      const result1bit = convertBitDepth(data1bit, 1, 1);

      assert.equal(result1bit.length, 16, "Should expand 2 bytes to 16 pixels");
      // First 8 should be 0, next 8 should be 255
      for (let i = 0; i < 8; i++) {
        assert.equal(result1bit[i], 0, `Pixel ${i} should be 0`);
        assert.equal(result1bit[i + 8], 255, `Pixel ${i + 8} should be 255`);
      }
    });
  });

  describe("convertGrayscaleToRGBA", () => {
    it("converts grayscale to RGBA correctly", () => {
      const grayscaleData = new Uint8Array([128, 64, 192, 255]);
      const result = convertGrayscaleToRGBA(grayscaleData, 2, 2, false);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(result.length, 16, "Should return RGBA data (4 pixels * 4 bytes)");

      // Check first pixel conversion
      assert.equal(result[0], 128, "Red should match grayscale");
      assert.equal(result[1], 128, "Green should match grayscale");
      assert.equal(result[2], 128, "Blue should match grayscale");
      assert.equal(result[3], 255, "Alpha should be opaque");
    });

    it("handles grayscale with and without alpha", () => {
      const data = new Uint8Array(10);

      const resultNoAlpha = convertGrayscaleToRGBA(data, 5, 2, false);
      const resultWithAlpha = convertGrayscaleToRGBA(data, 5, 1, true);

      assert(resultNoAlpha instanceof Uint8Array, "Should handle grayscale without alpha");
      assert(resultWithAlpha instanceof Uint8Array, "Should handle grayscale with alpha");
    });
  });

  describe("convertRGBToRGBA", () => {
    it("converts RGB to RGBA correctly", () => {
      const rgbData = new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255]);
      const result = convertRGBToRGBA(rgbData, 3, 1);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(result.length, 12, "Should return RGBA data (3 pixels * 4 bytes)");

      // Check first pixel conversion (red)
      assert.equal(result[0], 255, "Red component");
      assert.equal(result[1], 0, "Green component");
      assert.equal(result[2], 0, "Blue component");
      assert.equal(result[3], 255, "Alpha should be opaque");
    });

    it("handles RGB data conversion", () => {
      const rgbData = new Uint8Array(30); // 10 pixels * 3 bytes
      const result = convertRGBToRGBA(rgbData, 5, 2);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
    });
  });

  describe("convertPaletteToRGBA", () => {
    it("converts palette indices to RGBA correctly", () => {
      const indexData = new Uint8Array([0, 1, 2, 3]);
      const palette = new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255, 128, 128, 128]);
      const result = convertPaletteToRGBA(indexData, 2, 2, palette);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(result.length, 16, "Should return RGBA data (4 pixels * 4 bytes)");

      // Check first pixel (palette index 0 -> red)
      assert.equal(result[0], 255, "Red from palette");
      assert.equal(result[1], 0, "Green from palette");
      assert.equal(result[2], 0, "Blue from palette");
      assert.equal(result[3], 255, "Alpha should be opaque");
    });

    it("handles palette with transparency", () => {
      const indexData = new Uint8Array(4);
      const palette = new Uint8Array(12);
      const transparency = new Uint8Array([255, 128, 64, 0]);
      const result = convertPaletteToRGBA(indexData, 2, 2, palette, transparency);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
    });
  });

  describe("deinterlaceAdam7", () => {
    it("deinterlaces Adam7 data correctly", () => {
      // Create test data for 10x10 RGB image (300 bytes)
      const interlacedData = new Uint8Array(300);
      interlacedData.fill(128); // Fill with gray
      const ihdr = { width: 10, height: 10, colorType: 2, bitDepth: 8, interlaceMethod: 1 };
      const result = deinterlaceAdam7(interlacedData, ihdr);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(result.length, 300, "Should return deinterlaced data (10x10x3 = 300 bytes)");
    });

    it("handles interlaced image data", () => {
      const data = new Uint8Array(50);
      const ihdr = { width: 8, height: 8, colorType: 2, bitDepth: 8, interlaceMethod: 1 };
      const result = deinterlaceAdam7(data, ihdr);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
    });
  });

  describe("applyTransparency", () => {
    it("applies transparency correctly", () => {
      const rgbaData = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
      const transparency = new Uint8Array([255, 0, 0, 0, 0, 0]); // RGB transparency (6 bytes)
      const result = applyTransparency(rgbaData, transparency, 2);

      assert(result instanceof Uint8Array, "Should return Uint8Array");
      assert.equal(result.length, 8, "Should return same length data");
    });

    it("handles different color types", () => {
      const rgbaData = new Uint8Array(16);
      const transparencyRGB = new Uint8Array(6); // RGB needs 6 bytes
      const transparencyGray = new Uint8Array(2); // Grayscale needs 2 bytes

      // Test RGB and grayscale color types
      const resultRGB = applyTransparency(rgbaData, transparencyRGB, 2);
      const resultGray = applyTransparency(rgbaData, transparencyGray, 0);

      assert(resultRGB instanceof Uint8Array, "Should handle RGB transparency");
      assert(resultGray instanceof Uint8Array, "Should handle grayscale transparency");
    });
  });

  describe("validateReconstructionParameters", () => {
    it("validates reconstruction parameters correctly", () => {
      const unfilteredData = new Uint8Array(100);
      const ihdr = { width: 10, height: 10, colorType: 2, bitDepth: 8 };
      const result = validateReconstructionParameters(unfilteredData, ihdr);

      assert.equal(typeof result, "boolean", "Should return boolean");
      assert.equal(result, true, "Valid parameters should return true");
    });

    it("handles parameter validation", () => {
      const validData = new Uint8Array(100);
      const validIHDR = { width: 10, height: 10, colorType: 2, bitDepth: 8 };
      const invalidData = null;
      const invalidIHDR = null;

      const validResult = validateReconstructionParameters(validData, validIHDR);
      const invalidResult1 = validateReconstructionParameters(invalidData, validIHDR);
      const invalidResult2 = validateReconstructionParameters(validData, invalidIHDR);

      assert.equal(typeof validResult, "boolean", "Should return boolean for valid params");
      assert.equal(typeof invalidResult1, "boolean", "Should return boolean for invalid data");
      assert.equal(typeof invalidResult2, "boolean", "Should return boolean for invalid IHDR");
    });
  });

  describe("getExpectedPixelDataSize", () => {
    it("calculates expected pixel data size correctly", () => {
      const result = getExpectedPixelDataSize(100, 100, 2, 8);

      assert.equal(typeof result, "number", "Should return number");
      assert.equal(result, 30100, "Should calculate correct size (100x100x3 + 100 filter bytes)");
    });

    it("handles different image parameters", () => {
      // Test various combinations
      const result1 = getExpectedPixelDataSize(10, 10, 2, 8); // RGB 8-bit
      const result2 = getExpectedPixelDataSize(20, 20, 6, 16); // RGBA 16-bit
      const result3 = getExpectedPixelDataSize(5, 5, 0, 1); // Grayscale 1-bit

      assert.equal(typeof result1, "number", "Should handle RGB 8-bit");
      assert.equal(typeof result2, "number", "Should handle RGBA 16-bit");
      assert.equal(typeof result3, "number", "Should handle grayscale 1-bit");
    });
  });

  describe("analyzePixelData", () => {
    it("analyzes pixel data correctly", () => {
      const pixelData = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
      const result = analyzePixelData(pixelData, 2, 1);

      assert.equal(typeof result, "object", "Should return object");
      assert.equal(typeof result.totalPixels, "number", "Should have totalPixels");
      assert.equal(typeof result.averageRed, "number", "Should have averageRed");
      assert.equal(typeof result.averageGreen, "number", "Should have averageGreen");
      assert.equal(typeof result.averageBlue, "number", "Should have averageBlue");
      assert.equal(typeof result.averageAlpha, "number", "Should have averageAlpha");
      assert.equal(typeof result.hasTransparency, "boolean", "Should have hasTransparency");
      assert.equal(typeof result.colorRange, "object", "Should have colorRange");

      // Check that we get reasonable values
      assert(result.totalPixels >= 0, "totalPixels should be non-negative");
      assert(result.averageRed >= 0, "averageRed should be non-negative");
      assert(typeof result.hasTransparency === "boolean", "hasTransparency should be boolean");
    });

    it("handles pixel data analysis", () => {
      const rgbaData = new Uint8Array(16); // 4 pixels
      const result = analyzePixelData(rgbaData, 2, 2);

      assert.equal(typeof result, "object", "Should return analysis object");
      assert("colorRange" in result, "Should have colorRange property");
      assert("min" in result.colorRange, "Should have colorRange.min");
      assert("max" in result.colorRange, "Should have colorRange.max");
    });
  });

  describe("Real PNG Integration", () => {
    it("processes pixel reconstruction pipeline on real PNG", async () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");

        // Verify PNG and parse structure
        assert(validatePNGSignature(pngBuffer), "Should be valid PNG");

        const chunkData = pngBuffer.slice(8);
        const chunks = parseChunks(chunkData);
        const ihdrChunk = findChunksByType(chunks, "IHDR")[0];
        const ihdr = decodeIHDR(ihdrChunk.data);

        // Process through the full pipeline
        const idatChunks = findChunksByType(chunks, "IDAT");
        const idatData = idatChunks.map((chunk) => chunk.data);
        const decompressed = await decompressIDAT(idatData);
        const unfiltered = reverseFilters(decompressed, ihdr.width, ihdr.height, ihdr.bytesPerPixel);

        // Test pixel reconstruction (working implementation)
        const pixels = reconstructPixels(unfiltered, ihdr);

        // Validate working behavior
        assert(pixels instanceof Uint8Array, "Should return Uint8Array");
        assert.equal(pixels.length, 129600, "Should return actual pixel data (180x180x4)");

        console.log(`✓ Pixel reconstruction pipeline ready for apple-touch-icon.png:`);
        console.log(`  - Image: ${ihdr.width}×${ihdr.height} pixels`);
        console.log(`  - Color type: ${ihdr.colorType} (${ihdr.channels} channels)`);
        console.log(`  - Unfiltered data: ${unfiltered.length} bytes`);
        console.log(`  - Ready for pixel reconstruction implementation`);
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping real PNG pixel reconstruction test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });

    it("validates reconstruction parameters with real PNG data", async () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");
        const chunkData = pngBuffer.slice(8);
        const chunks = parseChunks(chunkData);
        const ihdrChunk = findChunksByType(chunks, "IHDR")[0];
        const ihdr = decodeIHDR(ihdrChunk.data);

        const idatChunks = findChunksByType(chunks, "IDAT");
        const idatData = idatChunks.map((chunk) => chunk.data);
        const decompressed = await decompressIDAT(idatData);
        const unfiltered = reverseFilters(decompressed, ihdr.width, ihdr.height, ihdr.bytesPerPixel);

        // Test parameter validation (stub)
        const isValid = validateReconstructionParameters(unfiltered, ihdr);
        assert.equal(typeof isValid, "boolean", "Should return boolean");
        assert.equal(isValid, true, "Valid parameters should return true");

        // Test expected size calculation (working implementation)
        const expectedSize = getExpectedPixelDataSize(ihdr.width, ihdr.height, ihdr.colorType, ihdr.bitDepth);
        assert.equal(typeof expectedSize, "number", "Should return number");
        assert(expectedSize > 0, "Should return positive size");
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping real PNG parameter validation test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });
  });

  describe("Edge Cases", () => {
    it("handles minimum image size (1×1)", () => {
      const unfilteredData = new Uint8Array(4); // 1 pixel RGBA
      const ihdr = { width: 1, height: 1, colorType: 6, bitDepth: 8 };
      const result = reconstructPixels(unfilteredData, ihdr);

      assert(result instanceof Uint8Array, "Should handle 1×1 image");
    });

    it("handles large image dimensions", () => {
      // For 100x100 RGB image, we need 100*100*3 = 30,000 bytes
      const unfilteredData = new Uint8Array(30000);
      unfilteredData.fill(128); // Fill with gray
      const ihdr = { width: 100, height: 100, colorType: 2, bitDepth: 8 };
      const result = reconstructPixels(unfilteredData, ihdr);

      assert(result instanceof Uint8Array, "Should handle large images");
      assert.equal(result.length, 40000, "Should return RGBA data (100x100x4)");
    });

    it("handles all PNG color types", () => {
      const colorTypes = [0, 2, 3, 4, 6]; // All valid PNG color types

      for (const colorType of colorTypes) {
        // Calculate correct data size for each color type
        let dataSize;
        switch (colorType) {
          case 0:
            dataSize = 100;
            break; // Grayscale: 10x10x1 = 100
          case 2:
            dataSize = 300;
            break; // RGB: 10x10x3 = 300
          case 3:
            dataSize = 100;
            break; // Palette: 10x10x1 = 100
          case 4:
            dataSize = 200;
            break; // Grayscale+Alpha: 10x10x2 = 200
          case 6:
            dataSize = 400;
            break; // RGBA: 10x10x4 = 400
        }

        const data = new Uint8Array(dataSize);
        // For palette images, use valid palette indices (0, 1, 2)
        data.fill(colorType === 3 ? 0 : 128);
        const ihdr = { width: 10, height: 10, colorType, bitDepth: 8 };

        // Palette images need a palette
        const palette = colorType === 3 ? new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255]) : undefined;
        const result = reconstructPixels(data, ihdr, palette);

        assert(result instanceof Uint8Array, `Should handle color type ${colorType}`);
      }
    });

    it("handles all PNG bit depths", () => {
      const bitDepths = [1, 2, 4, 8, 16]; // All valid PNG bit depths

      for (const bitDepth of bitDepths) {
        // Use 8x8 image to avoid bit packing edge cases (64 pixels works well for all bit depths)
        const width = 8,
          height = 8;
        const totalPixels = width * height; // 64 pixels
        let inputSize;

        switch (bitDepth) {
          case 1:
            inputSize = Math.ceil(totalPixels / 8);
            break; // 8 bytes for 64 pixels
          case 2:
            inputSize = Math.ceil(totalPixels / 4);
            break; // 16 bytes for 64 pixels
          case 4:
            inputSize = Math.ceil(totalPixels / 2);
            break; // 32 bytes for 64 pixels
          case 8:
            inputSize = totalPixels;
            break; // 64 bytes for 64 pixels
          case 16:
            inputSize = totalPixels * 2;
            break; // 128 bytes for 64 pixels
        }

        const data = new Uint8Array(inputSize);
        data.fill(128);
        const ihdr = { width, height, colorType: 0, bitDepth };
        const result = reconstructPixels(data, ihdr);
        assert(result instanceof Uint8Array, `Should handle bit depth ${bitDepth}`);
        assert.equal(result.length, totalPixels * 4, `Should return RGBA data for bit depth ${bitDepth}`);
      }
    });
  });

  describe("Performance", () => {
    it("processes pixel reconstruction efficiently", () => {
      const largeData = new Uint8Array(10000); // Simulate large image
      const ihdr = { width: 100, height: 25, colorType: 6, bitDepth: 8 };

      const startTime = performance.now();
      const result = reconstructPixels(largeData, ihdr);
      const endTime = performance.now();

      const duration = endTime - startTime;
      assert(duration < 100, "Should process large data quickly (stub)");
      assert(result instanceof Uint8Array, "Should return valid result");

      console.log(`✓ Processed ${largeData.length} bytes in ${duration.toFixed(2)}ms`);
    });
  });
});
