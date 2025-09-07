/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for JPEG pixel encoding pipeline.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { createStandardHuffmanEncoder } from "./huffman-encode.js";
import {
  analyzeEncodedJPEG,
  batchEncode,
  convertRGBAToGrayscale,
  createTestPixelData,
  encodeChannel,
  encodeJPEGPixels,
  encodeScanData,
  estimateEncodingParameters,
  optimizeEncoding,
  validateEncodeParameters,
} from "./pixel-encode.js";

describe("JPEG Pixel Encoding", () => {
  describe("validateEncodeParameters", () => {
    it("accepts valid parameters", () => {
      const pixels = new Uint8Array(64 * 64 * 4); // 64x64 RGBA
      assert.doesNotThrow(() => validateEncodeParameters(pixels, 64, 64, {}));
    });

    it("validates pixel data type", () => {
      assert.throws(() => validateEncodeParameters([], 64, 64, {}), /Pixels must be a Uint8Array/);
      assert.throws(() => validateEncodeParameters("not array", 64, 64, {}), /Pixels must be a Uint8Array/);
    });

    it("validates dimensions", () => {
      const pixels = new Uint8Array(64 * 64 * 4);

      assert.throws(() => validateEncodeParameters(pixels, 0, 64, {}), /Invalid width/);
      assert.throws(() => validateEncodeParameters(pixels, 65536, 64, {}), /Invalid width/);
      assert.throws(() => validateEncodeParameters(pixels, 64, 0, {}), /Invalid height/);
      assert.throws(() => validateEncodeParameters(pixels, 64, 65536, {}), /Invalid height/);
    });

    it("validates pixel array length", () => {
      const pixels = new Uint8Array(100); // Wrong size
      assert.throws(() => validateEncodeParameters(pixels, 64, 64, {}), /Invalid pixel array length/);
    });

    it("validates quality option", () => {
      const pixels = new Uint8Array(64 * 64 * 4);

      assert.throws(() => validateEncodeParameters(pixels, 64, 64, { quality: 0 }), /Invalid quality/);
      assert.throws(() => validateEncodeParameters(pixels, 64, 64, { quality: 101 }), /Invalid quality/);
      assert.throws(() => validateEncodeParameters(pixels, 64, 64, { quality: "high" }), /Invalid quality/);
    });

    it("validates color space option", () => {
      const pixels = new Uint8Array(64 * 64 * 4);

      assert.throws(() => validateEncodeParameters(pixels, 64, 64, { colorSpace: "rgb" }), /Invalid color space/);
      assert.throws(() => validateEncodeParameters(pixels, 64, 64, { colorSpace: "cmyk" }), /Invalid color space/);
    });
  });

  describe("convertRGBAToGrayscale", () => {
    it("converts RGBA to grayscale correctly", () => {
      const pixels = new Uint8Array([
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
        128,
        128,
        128,
        255, // Gray pixel
      ]);

      const grayscale = convertRGBAToGrayscale(pixels, 2, 2);

      assert.equal(grayscale.length, 8); // 2x2 GA format

      // Check ITU-R BT.709 luminance conversion
      assert.equal(grayscale[0], Math.round(0.2126 * 255)); // Red
      assert.equal(grayscale[1], 255); // Alpha

      assert.equal(grayscale[2], Math.round(0.7152 * 255)); // Green
      assert.equal(grayscale[3], 255); // Alpha

      assert.equal(grayscale[4], Math.round(0.0722 * 255)); // Blue
      assert.equal(grayscale[5], 255); // Alpha

      assert.equal(grayscale[6], 128); // Gray
      assert.equal(grayscale[7], 255); // Alpha
    });

    it("preserves alpha channel", () => {
      const pixels = new Uint8Array([255, 255, 255, 128]); // White with 50% alpha

      const grayscale = convertRGBAToGrayscale(pixels, 1, 1);

      assert.equal(grayscale[0], 255); // White
      assert.equal(grayscale[1], 128); // Preserved alpha
    });
  });

  describe("createTestPixelData", () => {
    it("creates solid color pattern", () => {
      const pixels = createTestPixelData(4, 4, "solid", { r: 255, g: 0, b: 0, a: 255 });

      assert.equal(pixels.length, 64); // 4x4x4

      // All pixels should be red
      for (let i = 0; i < 16; i++) {
        assert.equal(pixels[i * 4], 255); // R
        assert.equal(pixels[i * 4 + 1], 0); // G
        assert.equal(pixels[i * 4 + 2], 0); // B
        assert.equal(pixels[i * 4 + 3], 255); // A
      }
    });

    it("creates gradient pattern", () => {
      const pixels = createTestPixelData(4, 4, "gradient");

      assert.equal(pixels.length, 64);

      // Check first pixel (top-left)
      assert.equal(pixels[0], 0); // R = 0
      assert.equal(pixels[1], 0); // G = 0
      assert.equal(pixels[2], 128); // B = 128
      assert.equal(pixels[3], 255); // A = 255

      // Check last pixel (bottom-right)
      const lastPixel = 15 * 4;
      assert.equal(pixels[lastPixel], 255); // R = 255
      assert.equal(pixels[lastPixel + 1], 255); // G = 255
      assert.equal(pixels[lastPixel + 2], 128); // B = 128
      assert.equal(pixels[lastPixel + 3], 255); // A = 255
    });

    it("creates checkerboard pattern", () => {
      const pixels = createTestPixelData(4, 4, "checkerboard", { size: 2 });

      assert.equal(pixels.length, 64);

      // Check pattern: 2x2 blocks alternating between black and white
      assert.equal(pixels[0], 255); // Top-left block: white
      assert.equal(pixels[4 * 2], 0); // Top-right block: black
      assert.equal(pixels[4 * 8], 0); // Bottom-left block: black
      assert.equal(pixels[4 * 10], 255); // Bottom-right block: white
    });

    it("creates noise pattern", () => {
      const pixels = createTestPixelData(4, 4, "noise");

      assert.equal(pixels.length, 64);

      // Check that pixels have random values (not all the same)
      const firstPixel = [pixels[0], pixels[1], pixels[2]];
      let hasVariation = false;

      for (let i = 1; i < 16; i++) {
        const currentPixel = [pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2]];
        if (
          currentPixel[0] !== firstPixel[0] ||
          currentPixel[1] !== firstPixel[1] ||
          currentPixel[2] !== firstPixel[2]
        ) {
          hasVariation = true;
          break;
        }
      }

      assert(hasVariation, "Noise pattern should have variation");

      // All alpha values should be 255
      for (let i = 0; i < 16; i++) {
        assert.equal(pixels[i * 4 + 3], 255);
      }
    });

    it("rejects unknown patterns", () => {
      assert.throws(() => createTestPixelData(4, 4, "unknown"), /Unknown pattern/);
    });
  });

  describe("encodeChannel", () => {
    it("encodes single channel data", () => {
      // Create a single 8x8 block
      const channelBlocks = [
        Array(8)
          .fill()
          .map(() => Array(8).fill(128)), // Mid-gray block
      ];

      const quantTable = {
        values: Array.from({ length: 64 }, () => 16), // Simple quantization
      };

      const encodedBlocks = encodeChannel(channelBlocks, quantTable);

      assert.equal(encodedBlocks.length, 1); // One block
      assert.equal(encodedBlocks[0].length, 64); // Zigzag coefficients

      // Check that encoding produces reasonable values
      const dcCoeff = encodedBlocks[0][0]; // DC coefficient is first in zigzag order
      assert(typeof dcCoeff === "number");
    });

    it("handles multiple blocks", () => {
      // Create four 8x8 blocks (2x2 grid)
      const channelBlocks = [
        Array(8)
          .fill()
          .map(() => Array(8).fill(64)),
        Array(8)
          .fill()
          .map(() => Array(8).fill(64)),
        Array(8)
          .fill()
          .map(() => Array(8).fill(64)),
        Array(8)
          .fill()
          .map(() => Array(8).fill(64)),
      ];

      const quantTable = {
        values: Array.from({ length: 64 }, () => 8),
      };

      const encodedBlocks = encodeChannel(channelBlocks, quantTable);

      assert.equal(encodedBlocks.length, 4); // 2x2 = 4 blocks
    });
  });

  describe("encodeScanData", () => {
    it("encodes scan data with Huffman encoding", () => {
      // Create simple test blocks (zigzag coefficients)
      const encodedChannels = [
        [
          // Single channel with one block (64 zigzag coefficients)
          new Array(64).fill(0),
        ],
      ];

      // Set DC coefficient (first element in zigzag order)
      encodedChannels[0][0][0] = 64;

      const dcEncoders = [createStandardHuffmanEncoder("dc-luminance")];
      const acEncoders = [createStandardHuffmanEncoder("ac-luminance")];

      const scanData = encodeScanData(encodedChannels, dcEncoders, acEncoders);

      assert(scanData instanceof Uint8Array);
      assert(scanData.length > 0);
    });

    it("handles multiple channels", () => {
      const encodedChannels = [
        [
          new Array(64).fill(0), // Y channel block (zigzag coefficients)
        ],
        [
          new Array(64).fill(0), // Cb channel block (zigzag coefficients)
        ],
        [
          new Array(64).fill(0), // Cr channel block (zigzag coefficients)
        ],
      ];

      const dcEncoders = [
        createStandardHuffmanEncoder("dc-luminance"),
        createStandardHuffmanEncoder("dc-chrominance"),
        createStandardHuffmanEncoder("dc-chrominance"),
      ];

      const acEncoders = [
        createStandardHuffmanEncoder("ac-luminance"),
        createStandardHuffmanEncoder("ac-chrominance"),
        createStandardHuffmanEncoder("ac-chrominance"),
      ];

      const scanData = encodeScanData(encodedChannels, dcEncoders, acEncoders);

      assert(scanData instanceof Uint8Array);
      assert(scanData.length > 0);
    });
  });

  describe("encodeJPEGPixels", () => {
    it("encodes grayscale image", () => {
      const pixels = createTestPixelData(8, 8, "solid", { r: 128, g: 128, b: 128 });

      const jpegData = encodeJPEGPixels(pixels, 8, 8, { quality: 85, colorSpace: "grayscale" });

      assert(jpegData instanceof Uint8Array);
      assert(jpegData.length > 0);

      // Check JPEG markers
      assert.equal(jpegData[0], 0xff);
      assert.equal(jpegData[1], 0xd8); // SOI

      // Should end with EOI
      assert.equal(jpegData[jpegData.length - 2], 0xff);
      assert.equal(jpegData[jpegData.length - 1], 0xd9); // EOI
    });

    it("encodes color image", () => {
      const pixels = createTestPixelData(16, 16, "gradient");

      const jpegData = encodeJPEGPixels(pixels, 16, 16, { quality: 75, colorSpace: "ycbcr" });

      assert(jpegData instanceof Uint8Array);
      assert(jpegData.length > 0);

      // Should be larger than grayscale due to more data
      const grayscaleData = encodeJPEGPixels(createTestPixelData(16, 16, "solid"), 16, 16, {
        quality: 75,
        colorSpace: "grayscale",
      });

      assert(jpegData.length >= grayscaleData.length);
    });

    it("respects quality settings", () => {
      const pixels = createTestPixelData(32, 32, "gradient");

      const lowQuality = encodeJPEGPixels(pixels, 32, 32, { quality: 10 });
      const highQuality = encodeJPEGPixels(pixels, 32, 32, { quality: 95 });

      // High quality should generally be larger
      assert(highQuality.length >= lowQuality.length);
    });

    it("validates input parameters", () => {
      const pixels = createTestPixelData(8, 8, "solid");

      assert.throws(() => encodeJPEGPixels([], 8, 8), /Pixels must be a Uint8Array/);
      assert.throws(() => encodeJPEGPixels(pixels, 0, 8), /Invalid width/);
      assert.throws(() => encodeJPEGPixels(pixels, 8, 0), /Invalid height/);
    });
  });

  describe("analyzeEncodedJPEG", () => {
    it("analyzes JPEG structure correctly", () => {
      const pixels = createTestPixelData(16, 16, "solid");
      const jpegData = encodeJPEGPixels(pixels, 16, 16, { quality: 85 });

      const analysis = analyzeEncodedJPEG(jpegData);

      assert.equal(analysis.fileSize, jpegData.length);
      assert.equal(analysis.hasValidMarkers, true);
      assert(analysis.markers.length > 0);

      // Check for required markers
      assert(analysis.markers.includes(0xffd8)); // SOI
      assert(analysis.markers.includes(0xffd9)); // EOI
      assert(analysis.markers.some((m) => m >= 0xffc0 && m <= 0xffc3)); // SOF
      assert(analysis.markers.includes(0xffda)); // SOS
    });

    it("detects invalid JPEG data", () => {
      const invalidData = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

      const analysis = analyzeEncodedJPEG(invalidData);

      assert.equal(analysis.hasValidMarkers, false);
      assert.equal(analysis.markers.length, 0);
    });
  });

  describe("estimateEncodingParameters", () => {
    it("estimates parameters for target size", () => {
      const estimate = estimateEncodingParameters(640, 480, 50, "ycbcr"); // 50KB target

      assert(typeof estimate.estimatedQuality === "number");
      assert(estimate.estimatedQuality >= 1 && estimate.estimatedQuality <= 100);
      assert(typeof estimate.estimatedSize === "number");
      assert(typeof estimate.compressionRatio === "number");
      assert(estimate.compressionRatio > 0);
    });

    it("adjusts quality based on compression ratio", () => {
      const smallTarget = estimateEncodingParameters(640, 480, 10, "ycbcr"); // 10KB - high compression
      const largeTarget = estimateEncodingParameters(640, 480, 200, "ycbcr"); // 200KB - low compression

      // Smaller target should suggest lower quality
      assert(smallTarget.estimatedQuality <= largeTarget.estimatedQuality);
    });

    it("handles different color spaces", () => {
      const colorEstimate = estimateEncodingParameters(100, 100, 20, "ycbcr");
      const grayscaleEstimate = estimateEncodingParameters(100, 100, 20, "grayscale");

      // Grayscale should have different compression characteristics
      assert(typeof colorEstimate.compressionRatio === "number");
      assert(typeof grayscaleEstimate.compressionRatio === "number");
    });
  });

  describe("optimizeEncoding", () => {
    it("finds optimal quality within size constraints", () => {
      const pixels = createTestPixelData(32, 32, "gradient");
      const maxSizeKB = 5;

      const result = optimizeEncoding(pixels, 32, 32, maxSizeKB);

      assert(result.jpegData instanceof Uint8Array);
      assert(result.jpegData.length <= maxSizeKB * 1024);
      assert(typeof result.quality === "number");
      assert(result.quality >= 1 && result.quality <= 100);
      assert(typeof result.fileSize === "number");
      assert(typeof result.compressionRatio === "number");
    });

    it("respects quality bounds", () => {
      const pixels = createTestPixelData(16, 16, "solid");

      const result = optimizeEncoding(pixels, 16, 16, 10, {
        minQuality: 50,
        maxQuality: 80,
      });

      assert(result.quality >= 50 && result.quality <= 80);
    });

    it("handles impossible size constraints", () => {
      const pixels = createTestPixelData(64, 64, "noise");

      // Very small size constraint
      const result = optimizeEncoding(pixels, 64, 64, 0.5, { minQuality: 1 });

      // Should still produce a result with minimum quality
      assert(result.jpegData instanceof Uint8Array);
      assert.equal(result.quality, 1);
    });
  });

  describe("batchEncode", () => {
    it("encodes multiple images", () => {
      const images = [
        {
          pixels: createTestPixelData(8, 8, "solid"),
          width: 8,
          height: 8,
        },
        {
          pixels: createTestPixelData(16, 16, "gradient"),
          width: 16,
          height: 16,
        },
        {
          pixels: createTestPixelData(8, 8, "checkerboard"),
          width: 8,
          height: 8,
        },
      ];

      const results = batchEncode(images, { quality: 85 });

      assert.equal(results.length, 3);

      for (const result of results) {
        assert(result instanceof Uint8Array);
        assert(result.length > 0);

        // Check JPEG markers
        assert.equal(result[0], 0xff);
        assert.equal(result[1], 0xd8); // SOI
      }
    });

    it("handles encoding errors gracefully", () => {
      const images = [
        {
          pixels: new Uint8Array(10), // Invalid size
          width: 8,
          height: 8,
        },
      ];

      assert.throws(() => batchEncode(images), /Failed to encode image/);
    });

    it("uses consistent settings across images", () => {
      const images = [
        {
          pixels: createTestPixelData(8, 8, "solid"),
          width: 8,
          height: 8,
        },
        {
          pixels: createTestPixelData(8, 8, "solid"),
          width: 8,
          height: 8,
        },
      ];

      const results = batchEncode(images, { quality: 50, colorSpace: "grayscale" });

      // Results should be similar for identical input
      assert(Math.abs(results[0].length - results[1].length) < 100);
    });
  });

  describe("Integration Tests", () => {
    it("creates valid JPEG files", () => {
      const pixels = createTestPixelData(64, 64, "gradient");
      const jpegData = encodeJPEGPixels(pixels, 64, 64, { quality: 85 });

      const analysis = analyzeEncodedJPEG(jpegData);

      assert.equal(analysis.hasValidMarkers, true);
      assert(analysis.fileSize > 0);

      // Should contain all required JPEG segments
      const markerTypes = new Set(analysis.markers);
      assert(markerTypes.has(0xffd8)); // SOI
      assert(markerTypes.has(0xffe0)); // APP0
      assert(markerTypes.has(0xffdb)); // DQT
      assert(markerTypes.has(0xffc0)); // SOF0
      assert(markerTypes.has(0xffc4)); // DHT
      assert(markerTypes.has(0xffda)); // SOS
      assert(markerTypes.has(0xffd9)); // EOI
    });

    it("handles different image sizes", () => {
      const sizes = [
        [8, 8],
        [16, 16],
        [32, 32],
        [64, 48], // Non-square
        [100, 75], // Non-multiple of 8
      ];

      for (const [width, height] of sizes) {
        const pixels = createTestPixelData(width, height, "solid");
        const jpegData = encodeJPEGPixels(pixels, width, height);

        assert(jpegData instanceof Uint8Array);
        assert(jpegData.length > 0);

        const analysis = analyzeEncodedJPEG(jpegData);
        assert.equal(analysis.hasValidMarkers, true);
      }
    });

    it("produces different results for different content", () => {
      const solidPixels = createTestPixelData(32, 32, "solid");
      const noisePixels = createTestPixelData(32, 32, "noise");

      const solidJPEG = encodeJPEGPixels(solidPixels, 32, 32, { quality: 85 });
      const noiseJPEG = encodeJPEGPixels(noisePixels, 32, 32, { quality: 85 });

      // Noise should generally compress less efficiently
      assert(noiseJPEG.length >= solidJPEG.length);
    });
  });

  describe("Performance", () => {
    it("encodes images efficiently", () => {
      const pixels = createTestPixelData(128, 128, "gradient");

      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        encodeJPEGPixels(pixels, 128, 128, { quality: 85 });
      }

      const endTime = Date.now();

      assert(endTime - startTime < 1000, `Encoding took ${endTime - startTime}ms`);
    });

    it("handles batch encoding efficiently", () => {
      const images = Array.from({ length: 20 }, () => ({
        pixels: createTestPixelData(32, 32, "solid"),
        width: 32,
        height: 32,
      }));

      const startTime = Date.now();
      const results = batchEncode(images, { quality: 75 });
      const endTime = Date.now();

      assert.equal(results.length, 20);
      assert(endTime - startTime < 2000, `Batch encoding took ${endTime - startTime}ms`);
    });

    it("optimizes encoding efficiently", () => {
      const pixels = createTestPixelData(64, 64, "gradient");

      const startTime = Date.now();
      const result = optimizeEncoding(pixels, 64, 64, 10);
      const endTime = Date.now();

      assert(result.jpegData instanceof Uint8Array);
      assert(endTime - startTime < 500, `Optimization took ${endTime - startTime}ms`);
    });
  });
});
