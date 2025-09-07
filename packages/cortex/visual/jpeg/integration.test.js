/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file JPEG integration tests for complete encode/decode cycles.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { parseJPEGHeaders } from "./header-parsing.js";
import { JPEGImage } from "./index.js";
import { analyzeDecodedPixels, } from "./pixel-decode.js";
import { analyzeEncodedJPEG, createTestPixelData, encodeJPEGPixels } from "./pixel-encode.js";

describe("JPEG Integration Tests", () => {
  describe("Complete Encode/Decode Cycle", () => {
    it("preserves image content through encode/decode cycle", () => {
      // Create test image
      const width = 64;
      const height = 64;
      const originalPixels = createTestPixelData(width, height, "gradient");

      // Encode to JPEG
      const jpegData = encodeJPEGPixels(originalPixels, width, height, { quality: 95 });

      // Decode back to pixels using JPEGImage class
      const jpegImage = new JPEGImage(jpegData);
      const decodedPixels = jpegImage.pixels;

      // Validate dimensions
      assert.equal(decodedPixels.length, originalPixels.length);

      // Analyze quality (should be high with quality 95)
      const analysis = analyzeDecodedPixels(decodedPixels, width, height);
      assert(analysis.averageValue > 0);
      assert(analysis.histogram instanceof Map);
      assert(analysis.channelStats.length === 4); // RGBA

      // Check that images are reasonably similar (allowing for JPEG compression)
      let totalDifference = 0;
      for (let i = 0; i < originalPixels.length; i += 4) {
        // Compare RGB channels (skip alpha)
        for (let c = 0; c < 3; c++) {
          const diff = Math.abs(originalPixels[i + c] - decodedPixels[i + c]);
          totalDifference += diff;
        }
      }

      const averageDifference = totalDifference / (width * height * 3);
      assert(averageDifference < 10, `Average difference too high: ${averageDifference}`);
    });

    it("handles grayscale images correctly", () => {
      const width = 32;
      const height = 32;
      const originalPixels = createTestPixelData(width, height, "solid", { r: 128, g: 128, b: 128 });

      // Encode as grayscale JPEG
      const jpegData = encodeJPEGPixels(originalPixels, width, height, {
        quality: 90,
        colorSpace: "grayscale",
      });

      // Decode back using JPEGImage class
      const jpegImageGray = new JPEGImage(jpegData);
      const decodedPixels = jpegImageGray.pixels;

      // Should maintain grayscale nature (R=G=B for all pixels)
      for (let i = 0; i < decodedPixels.length; i += 4) {
        const r = decodedPixels[i];
        const g = decodedPixels[i + 1];
        const b = decodedPixels[i + 2];

        // Allow small differences due to compression
        assert(Math.abs(r - g) <= 2, `R-G difference too large: ${Math.abs(r - g)}`);
        assert(Math.abs(g - b) <= 2, `G-B difference too large: ${Math.abs(g - b)}`);
      }
    });

    it("handles different quality levels appropriately", () => {
      const width = 48;
      const height = 48;
      const originalPixels = createTestPixelData(width, height, "checkerboard", { size: 8 });

      const qualities = [10, 50, 95];
      const results = [];

      for (const quality of qualities) {
        const jpegData = encodeJPEGPixels(originalPixels, width, height, { quality });
        const jpegImageQual = new JPEGImage(jpegData);
        const decodedPixels = jpegImageQual.pixels;

        // Calculate compression ratio and quality
        const compressionRatio = originalPixels.length / jpegData.length;

        let totalDifference = 0;
        for (let i = 0; i < originalPixels.length; i += 4) {
          for (let c = 0; c < 3; c++) {
            totalDifference += Math.abs(originalPixels[i + c] - decodedPixels[i + c]);
          }
        }
        const averageDifference = totalDifference / (width * height * 3);

        results.push({
          quality,
          compressionRatio,
          averageDifference,
          fileSize: jpegData.length,
        });
      }

      // Verify quality trends
      assert(results[0].compressionRatio > results[1].compressionRatio, "Lower quality should compress more");
      assert(results[1].compressionRatio > results[2].compressionRatio, "Higher quality should compress less");

      assert(results[0].averageDifference > results[1].averageDifference, "Lower quality should have more artifacts");
      assert(results[1].averageDifference > results[2].averageDifference, "Higher quality should have fewer artifacts");
    });

    it("preserves alpha channel correctly", () => {
      const width = 16;
      const height = 16;

      // Create image with varying alpha
      const originalPixels = new Uint8Array(width * height * 4);
      for (let i = 0; i < width * height; i++) {
        originalPixels[i * 4] = 255; // R
        originalPixels[i * 4 + 1] = 0; // G
        originalPixels[i * 4 + 2] = 0; // B
        originalPixels[i * 4 + 3] = i % 256; // Varying alpha
      }

      const jpegData = encodeJPEGPixels(originalPixels, width, height, { quality: 85 });
      const jpegImageAlpha = new JPEGImage(jpegData);
      const decodedPixels = jpegImageAlpha.pixels;

      // Alpha should be preserved as 255 (JPEG doesn't support transparency)
      for (let i = 0; i < decodedPixels.length; i += 4) {
        assert.equal(decodedPixels[i + 3], 255, "Alpha should be 255 in JPEG");
      }
    });
  });

  describe("JPEGImage Class Integration", () => {
    it("creates JPEG from encoded data", () => {
      const width = 32;
      const height = 32;
      const originalPixels = createTestPixelData(width, height, "gradient");

      // Encode to JPEG buffer
      const jpegBuffer = encodeJPEGPixels(originalPixels, width, height, { quality: 80 });

      // Create JPEGImage from buffer
      const jpegImage = new JPEGImage(jpegBuffer);

      assert.equal(jpegImage.width, width);
      assert.equal(jpegImage.height, height);
      assert.equal(jpegImage.channels, 4); // Always RGBA output
      assert(jpegImage.pixels instanceof Uint8Array);
      assert.equal(jpegImage.pixels.length, width * height * 4);
    });

    it("handles static factory methods", () => {
      const width = 24;
      const height = 24;
      const originalPixels = createTestPixelData(width, height, "solid");
      const jpegBuffer = encodeJPEGPixels(originalPixels, width, height, { quality: 75 });

      // Test isJPEG
      assert.equal(JPEGImage.isJPEG(jpegBuffer), true);
      assert.equal(JPEGImage.isJPEG(new Uint8Array([1, 2, 3, 4])), false);

      // Test fromBuffer
      const jpegImage = JPEGImage.fromBuffer(jpegBuffer);
      assert(jpegImage instanceof JPEGImage);
      assert.equal(jpegImage.width, width);
      assert.equal(jpegImage.height, height);

      // Test capabilities
      const capabilities = JPEGImage.getCapabilities();
      assert(capabilities.canRead);
      assert(capabilities.canWrite === false); // Not implemented yet
      assert(Array.isArray(capabilities.supportedColorSpaces));
    });

    it("provides JPEG-specific metadata", () => {
      const width = 40;
      const height = 40;
      const originalPixels = createTestPixelData(width, height, "noise");
      const jpegBuffer = encodeJPEGPixels(originalPixels, width, height, {
        quality: 60,
        colorSpace: "ycbcr",
      });

      const jpegImage = new JPEGImage(jpegBuffer);

      assert(typeof jpegImage.quality === "number");
      assert(jpegImage.quality > 0 && jpegImage.quality <= 100);
      assert.equal(jpegImage.colorSpace, "ycbcr");
      assert.equal(jpegImage.componentCount, 3); // Y, Cb, Cr
      assert(jpegImage.jpegStructure !== null);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles non-multiple-of-8 dimensions", () => {
      const testSizes = [
        [7, 7], // Smaller than 8x8
        [15, 15], // Not multiple of 8
        [17, 23], // Odd dimensions
        [100, 75], // Larger non-multiples
      ];

      for (const [width, height] of testSizes) {
        const originalPixels = createTestPixelData(width, height, "gradient");

        // Should encode without errors
        const jpegData = encodeJPEGPixels(originalPixels, width, height, { quality: 85 });
        assert(jpegData.length > 0);

        // Should decode without errors
        const jpegImageDecode = new JPEGImage(jpegData);
        const decodedPixels = jpegImageDecode.pixels;

        // Should maintain correct dimensions
        assert.equal(decodedPixels.length, width * height * 4);

        // Should create valid JPEGImage
        assert.equal(jpegImageDecode.width, width);
        assert.equal(jpegImageDecode.height, height);
      }
    });

    it("handles extreme quality values", () => {
      const width = 32;
      const height = 32;
      const originalPixels = createTestPixelData(width, height, "checkerboard");

      // Test minimum quality
      const lowQualityJPEG = encodeJPEGPixels(originalPixels, width, height, { quality: 1 });
      const lowQualityImage = new JPEGImage(lowQualityJPEG);
      const lowQualityPixels = lowQualityImage.pixels;
      assert.equal(lowQualityPixels.length, width * height * 4);

      // Test maximum quality
      const highQualityJPEG = encodeJPEGPixels(originalPixels, width, height, { quality: 100 });
      const highQualityImage = new JPEGImage(highQualityJPEG);
      const highQualityPixels = highQualityImage.pixels;
      assert.equal(highQualityPixels.length, width * height * 4);

      // High quality should be larger file
      assert(highQualityJPEG.length > lowQualityJPEG.length);
    });

    it("handles corrupted JPEG data gracefully", () => {
      const width = 16;
      const height = 16;
      const originalPixels = createTestPixelData(width, height, "solid");
      const validJPEG = encodeJPEGPixels(originalPixels, width, height, { quality: 85 });

      // Test various corruption scenarios
      const corruptedData1 = validJPEG.slice(0, validJPEG.length - 10); // Truncated
      const corruptedData2 = new Uint8Array(validJPEG);
      corruptedData2[10] = 0xff; // Corrupt header

      const corruptedData3 = new Uint8Array(validJPEG);
      corruptedData3[0] = 0x00; // Wrong SOI marker

      // Should throw appropriate errors
      assert.throws(() => new JPEGImage(corruptedData1), /Failed to create JPEG image/);
      assert.throws(() => new JPEGImage(corruptedData2), /Failed to create JPEG image/);
      assert.throws(() => new JPEGImage(corruptedData3), /Failed to create JPEG image/);

      // isJPEG should return false
      assert.equal(JPEGImage.isJPEG(corruptedData1), false);
      assert.equal(JPEGImage.isJPEG(corruptedData3), false);
    });
  });

  describe("Format Validation", () => {
    it("creates valid JPEG file structure", () => {
      const width = 48;
      const height = 48;
      const originalPixels = createTestPixelData(width, height, "gradient");
      const jpegData = encodeJPEGPixels(originalPixels, width, height, { quality: 85 });

      // Analyze JPEG structure
      const analysis = analyzeEncodedJPEG(jpegData);

      assert.equal(analysis.hasValidMarkers, true);
      assert(analysis.fileSize > 0);
      assert(analysis.markers.length > 0);

      // Check for required markers
      const markerSet = new Set(analysis.markers);
      assert(markerSet.has(0xffd8), "Missing SOI marker");
      assert(markerSet.has(0xffd9), "Missing EOI marker");
      assert(markerSet.has(0xffc0), "Missing SOF0 marker");
      assert(markerSet.has(0xffda), "Missing SOS marker");
      assert(markerSet.has(0xffdb), "Missing DQT marker");
      assert(markerSet.has(0xffc4), "Missing DHT marker");
    });

    it("maintains JPEG standard compliance", () => {
      const testCases = [
        { width: 8, height: 8, colorSpace: "grayscale" },
        { width: 16, height: 16, colorSpace: "ycbcr" },
        { width: 64, height: 48, colorSpace: "ycbcr" },
        { width: 100, height: 75, colorSpace: "grayscale" },
      ];

      for (const testCase of testCases) {
        const { width, height, colorSpace } = testCase;
        const originalPixels = createTestPixelData(width, height, "gradient");

        const jpegData = encodeJPEGPixels(originalPixels, width, height, {
          quality: 85,
          colorSpace,
        });

        // Should parse without errors
        const jpegStructure = parseJPEGHeaders(jpegData, true); // Strict validation

        // Verify structure compliance
        assert(jpegStructure.soi !== undefined, "Missing SOI");
        assert(jpegStructure.sof !== undefined, "Missing SOF");
        assert(jpegStructure.sos !== undefined, "Missing SOS");
        assert(Array.isArray(jpegStructure.quantizationTables), "Missing quantization tables");
        assert(Array.isArray(jpegStructure.huffmanTables), "Missing Huffman tables");

        // Verify dimensions
        assert.equal(jpegStructure.sof.width, width);
        assert.equal(jpegStructure.sof.height, height);

        // Verify component count
        const expectedComponents = colorSpace === "grayscale" ? 1 : 3;
        assert.equal(jpegStructure.sof.components.length, expectedComponents);
      }
    });
  });

  describe("Performance Integration", () => {
    it("handles reasonable image sizes efficiently", () => {
      const testSizes = [
        [64, 64],
        [128, 96],
        [256, 192],
      ];

      for (const [width, height] of testSizes) {
        const originalPixels = createTestPixelData(width, height, "noise");

        const startTime = Date.now();

        // Encode
        const jpegData = encodeJPEGPixels(originalPixels, width, height, { quality: 85 });

        // Decode
        const jpegImagePerf = new JPEGImage(jpegData);
        const decodedPixels = jpegImagePerf.pixels;

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should complete in reasonable time (adjust threshold as needed)
        const pixelCount = width * height;
        const timePerPixel = duration / pixelCount;

        assert(timePerPixel < 0.01, `Processing too slow: ${timePerPixel}ms per pixel for ${width}x${height}`);
        assert.equal(decodedPixels.length, originalPixels.length);
      }
    });

    it("maintains quality consistency across multiple cycles", () => {
      const width = 32;
      const height = 32;
      let currentPixels = createTestPixelData(width, height, "gradient");

      // Perform multiple encode/decode cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        const jpegData = encodeJPEGPixels(currentPixels, width, height, { quality: 90 });
        const jpegImageCycle = new JPEGImage(jpegData);
        currentPixels = jpegImageCycle.pixels;
      }

      // Should still be valid after multiple cycles
      assert.equal(currentPixels.length, width * height * 4);

      // Quality should degrade gracefully (not catastrophically)
      const analysis = analyzeDecodedPixels(currentPixels, width, height);
      assert(analysis.averageValue > 0);
      assert(analysis.channelStats.length === 4);
    });
  });

  describe("Cross-Component Integration", () => {
    it("integrates all JPEG components correctly", () => {
      const width = 56;
      const height = 56;
      const originalPixels = createTestPixelData(width, height, "gradient");

      // This test exercises the entire pipeline:
      // 1. Color conversion (RGB → YCbCr)
      // 2. MCU processing (8x8 block extraction)
      // 3. DCT transform
      // 4. Quantization
      // 5. Huffman encoding
      // 6. Header creation
      // 7. File assembly
      // 8. Header parsing
      // 9. Huffman decoding
      // 10. Dequantization
      // 11. Inverse DCT
      // 12. MCU reconstruction
      // 13. Color conversion (YCbCr → RGB)

      const jpegData = encodeJPEGPixels(originalPixels, width, height, {
        quality: 75,
        colorSpace: "ycbcr",
      });

      // Verify intermediate structure
      const jpegStructure = parseJPEGHeaders(jpegData);
      assert.equal(jpegStructure.sof.components.length, 3); // Y, Cb, Cr
      assert(jpegStructure.quantizationTables.length >= 2); // Luma + Chroma
      assert(jpegStructure.huffmanTables.length >= 4); // DC/AC for Luma/Chroma

      // Decode and verify
      const jpegImageDecode = new JPEGImage(jpegData);
      const decodedPixels = jpegImageDecode.pixels;
      assert.equal(decodedPixels.length, originalPixels.length);

      // Create JPEGImage and verify all properties
      assert.equal(jpegImageDecode.width, width);
      assert.equal(jpegImageDecode.height, height);
      assert.equal(jpegImageDecode.colorSpace, "ycbcr");
      assert.equal(jpegImageDecode.componentCount, 3);
      assert(jpegImageDecode.quality > 0);
    });
  });
});
