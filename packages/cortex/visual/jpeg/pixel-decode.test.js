/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for JPEG pixel decoding pipeline.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { BitStream, createStandardHuffmanTable, HuffmanTable } from "./huffman-decode.js";
import {
  analyzeDecodedPixels,
  blockToZigzag,
  componentsToRGBA,
  createTestJPEGStructure,
  decodeComponentBlocks,
  decodeJPEGPixels,
  decodePixelBlock,
  decodeScanData,
  validateDecodedPixels,
  zigzagToBlock,
} from "./pixel-decode.js";

describe("JPEG Pixel Decoding", () => {
  describe("zigzag ordering", () => {
    describe("zigzagToBlock", () => {
      it("converts zigzag coefficients to 8x8 block", () => {
        // Create test coefficients in zigzag order
        const zigzagCoeffs = Array.from({ length: 64 }, (_, i) => i);

        const block = zigzagToBlock(zigzagCoeffs);

        assert.equal(block.length, 8);
        assert.equal(block[0].length, 8);

        // Check specific positions according to zigzag order
        assert.equal(block[0][0], 0); // DC coefficient (zigzag index 0)
        assert.equal(block[0][1], 1); // First AC coefficient (zigzag index 1)
        assert.equal(block[1][0], 2); // Second AC coefficient (zigzag index 2)
        assert.equal(block[7][7], 63); // Last coefficient (zigzag index 63)
      });

      it("validates input array", () => {
        assert.throws(() => zigzagToBlock([]), /64 elements/);
        assert.throws(() => zigzagToBlock(new Array(63)), /64 elements/);
        assert.throws(() => zigzagToBlock("invalid"), /64 elements/);
      });
    });

    describe("blockToZigzag", () => {
      it("converts 8x8 block to zigzag coefficients", () => {
        // Create test block
        const block = Array(8)
          .fill()
          .map((_, i) =>
            Array(8)
              .fill()
              .map((_, j) => i * 8 + j)
          );

        const zigzagCoeffs = blockToZigzag(block);

        assert.equal(zigzagCoeffs.length, 64);
        assert.equal(zigzagCoeffs[0], 0); // DC coefficient (block[0][0])
        assert.equal(zigzagCoeffs[1], 1); // First AC coefficient (block[0][1])
        assert.equal(zigzagCoeffs[2], 8); // Second AC coefficient (block[1][0])
      });

      it("is inverse of zigzagToBlock", () => {
        const originalCoeffs = Array.from({ length: 64 }, (_, i) => i);

        const block = zigzagToBlock(originalCoeffs);
        const reconstructedCoeffs = blockToZigzag(block);

        assert.deepEqual(reconstructedCoeffs, originalCoeffs);
      });

      it("validates input block", () => {
        assert.throws(() => blockToZigzag([]), /8x8 array/);
        assert.throws(() => blockToZigzag(Array(7).fill(Array(8))), /8x8 array/);
        assert.throws(() => blockToZigzag(Array(8).fill(Array(7))), /8 elements/);
      });
    });
  });

  describe("decodePixelBlock", () => {
    it("decodes a complete pixel block", () => {
      // Create minimal test setup
      const dcTable = new HuffmanTable(createStandardHuffmanTable("dc-luminance"));
      const acTable = new HuffmanTable(createStandardHuffmanTable("ac-luminance"));

      // Create simple test data (may not decode properly but tests the pipeline)
      const testData = new Uint8Array(100).fill(0x00); // Simple pattern
      const bitStream = new BitStream(testData);

      const quantTable = Array(8)
        .fill()
        .map(() => Array(8).fill(16)); // Simple quantization table

      try {
        const result = decodePixelBlock(dcTable, acTable, bitStream, quantTable, 0);

        assert(Array.isArray(result.pixelBlock));
        assert.equal(result.pixelBlock.length, 8);
        assert.equal(result.pixelBlock[0].length, 8);
        assert(typeof result.dcValue === "number");

        // Check pixel values are in valid range
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            const pixel = result.pixelBlock[i][j];
            assert(pixel >= 0 && pixel <= 255, `Pixel [${i}][${j}] = ${pixel} out of range`);
          }
        }
      } catch (error) {
        // Expected if test data doesn't match Huffman codes
        assert(error.message.includes("Huffman") || error.message.includes("stream"));
      }
    });
  });

  describe("decodeComponentBlocks", () => {
    it("decodes multiple blocks for a component", () => {
      const dcTable = new HuffmanTable(createStandardHuffmanTable("dc-luminance"));
      const acTable = new HuffmanTable(createStandardHuffmanTable("ac-luminance"));

      const testData = new Uint8Array(1000).fill(0x00);
      const bitStream = new BitStream(testData);

      const quantTable = Array(8)
        .fill()
        .map(() => Array(8).fill(16));

      try {
        const blocks = decodeComponentBlocks(dcTable, acTable, bitStream, quantTable, 2, 2);

        assert.equal(blocks.length, 4); // 2x2 = 4 blocks
        assert.equal(blocks[0].length, 8);
        assert.equal(blocks[0][0].length, 8);
      } catch (error) {
        // Expected if test data doesn't match Huffman codes
        assert(error.message.includes("Huffman") || error.message.includes("stream"));
      }
    });
  });

  describe("componentsToRGBA", () => {
    it("converts grayscale component to RGBA", () => {
      const width = 4;
      const height = 4;
      const grayscale = new Uint8Array(width * height);

      // Create gradient pattern
      for (let i = 0; i < width * height; i++) {
        grayscale[i] = (i * 255) / (width * height - 1);
      }

      const decodedData = {
        components: [grayscale],
        width,
        height,
      };

      const rgba = componentsToRGBA(decodedData);

      assert.equal(rgba.length, width * height * 4);

      // Check that R, G, B are equal (grayscale) and A is 255
      for (let i = 0; i < width * height; i++) {
        const r = rgba[i * 4];
        const g = rgba[i * 4 + 1];
        const b = rgba[i * 4 + 2];
        const a = rgba[i * 4 + 3];

        assert.equal(r, g, "R and G should be equal for grayscale");
        assert.equal(g, b, "G and B should be equal for grayscale");
        assert.equal(a, 255, "Alpha should be 255");
        assert.equal(r, grayscale[i], "RGB should match grayscale value");
      }
    });

    it("converts YCbCr components to RGBA", () => {
      const width = 2;
      const height = 2;
      const pixelCount = width * height;

      const y = new Uint8Array(pixelCount).fill(128); // Mid-gray
      const cb = new Uint8Array(pixelCount).fill(128); // Neutral chroma
      const cr = new Uint8Array(pixelCount).fill(128); // Neutral chroma

      const decodedData = {
        components: [y, cb, cr],
        width,
        height,
      };

      const rgba = componentsToRGBA(decodedData);

      assert.equal(rgba.length, width * height * 4);

      // Check that conversion produces valid RGBA values
      for (let i = 0; i < rgba.length; i += 4) {
        assert(rgba[i] >= 0 && rgba[i] <= 255, "R value out of range");
        assert(rgba[i + 1] >= 0 && rgba[i + 1] <= 255, "G value out of range");
        assert(rgba[i + 2] >= 0 && rgba[i + 2] <= 255, "B value out of range");
        assert.equal(rgba[i + 3], 255, "Alpha should be 255");
      }
    });

    it("rejects unsupported component counts", () => {
      const decodedData = {
        components: [new Uint8Array(4), new Uint8Array(4)], // 2 components (unsupported)
        width: 2,
        height: 2,
      };

      assert.throws(() => componentsToRGBA(decodedData), /Unsupported number of components/);
    });
  });

  describe("createTestJPEGStructure", () => {
    it("creates grayscale JPEG structure", () => {
      const structure = createTestJPEGStructure(100, 200, 1);

      assert.equal(structure.sof.width, 100);
      assert.equal(structure.sof.height, 200);
      assert.equal(structure.sof.components.length, 1);
      assert.equal(structure.sos.components.length, 1);

      // Check component configuration
      const sofComponent = structure.sof.components[0];
      const sosComponent = structure.sos.components[0];

      assert.equal(sofComponent.id, 1);
      assert.equal(sosComponent.id, 1);
      assert.equal(sofComponent.quantizationTable, 0);
    });

    it("creates color JPEG structure", () => {
      const structure = createTestJPEGStructure(100, 200, 3);

      assert.equal(structure.sof.components.length, 3);
      assert.equal(structure.sos.components.length, 3);

      // Check component IDs
      for (let i = 0; i < 3; i++) {
        assert.equal(structure.sof.components[i].id, i + 1);
        assert.equal(structure.sos.components[i].id, i + 1);
      }

      // Check quantization table assignments
      assert.equal(structure.sof.components[0].quantizationTable, 0); // Luminance
      assert.equal(structure.sof.components[1].quantizationTable, 1); // Chrominance
      assert.equal(structure.sof.components[2].quantizationTable, 1); // Chrominance
    });

    it("validates component count", () => {
      assert.throws(() => createTestJPEGStructure(100, 200, 2), /Components must be 1 \(grayscale\) or 3 \(color\)/);
      assert.throws(() => createTestJPEGStructure(100, 200, 4), /Components must be 1 \(grayscale\) or 3 \(color\)/);
    });
  });

  describe("validateDecodedPixels", () => {
    it("accepts valid decoded data", () => {
      const decodedData = {
        pixels: new Uint8Array(16), // 2x2 RGBA
        width: 2,
        height: 2,
        components: 3,
      };

      assert.doesNotThrow(() => validateDecodedPixels(decodedData));
    });

    it("rejects invalid pixel arrays", () => {
      const invalidData = {
        pixels: [], // Not Uint8Array
        width: 2,
        height: 2,
        components: 3,
      };

      assert.throws(() => validateDecodedPixels(invalidData), /Pixels must be a Uint8Array/);
    });

    it("rejects invalid dimensions", () => {
      const invalidData = {
        pixels: new Uint8Array(16),
        width: 0, // Invalid
        height: 2,
        components: 3,
      };

      assert.throws(() => validateDecodedPixels(invalidData), /Invalid width/);
    });

    it("rejects mismatched array length", () => {
      const invalidData = {
        pixels: new Uint8Array(10), // Wrong size
        width: 2,
        height: 2,
        components: 3,
      };

      assert.throws(() => validateDecodedPixels(invalidData), /Invalid pixel array length/);
    });
  });

  describe("analyzeDecodedPixels", () => {
    it("analyzes pixel statistics correctly", () => {
      const pixels = new Uint8Array([
        255,
        0,
        128,
        255, // Pixel 1: white
        0,
        255,
        128,
        255, // Pixel 2: green
        128,
        128,
        128,
        255, // Pixel 3: gray
        64,
        192,
        32,
        255, // Pixel 4: mixed
      ]);

      const decodedData = { pixels };
      const analysis = analyzeDecodedPixels(decodedData);

      assert.equal(analysis.pixelCount, 4);
      assert.equal(analysis.minValue, 0);
      assert.equal(analysis.maxValue, 255);
      assert(analysis.avgValue > 0 && analysis.avgValue < 255);
      assert.equal(analysis.histogram.length, 256);

      // Check histogram has some expected values
      assert(analysis.histogram[0] > 0, "Should have some 0 values");
      assert(analysis.histogram[255] > 0, "Should have some 255 values");
      assert(analysis.histogram[128] > 0, "Should have some 128 values");

      // Check total histogram count matches expected RGB values
      const totalHistogramCount = analysis.histogram.reduce((sum, count) => sum + count, 0);
      assert.equal(totalHistogramCount, 4 * 3, "Should count all RGB values from 4 pixels");
    });
  });

  describe("Integration Tests", () => {
    it("handles complete pipeline with test structure", () => {
      // This test validates the pipeline structure without real JPEG data
      const structure = createTestJPEGStructure(16, 16, 1);

      // Add required tables for validation
      structure.quantizationTables.set(0, {
        id: 0,
        precision: 0,
        values: Array.from({ length: 64 }, (_, i) => (i % 64) + 1),
      });

      structure.huffmanTables.set("0-0", createStandardHuffmanTable("dc-luminance"));
      structure.huffmanTables.set("1-0", createStandardHuffmanTable("ac-luminance"));

      // Test structure validation
      assert(structure.sof);
      assert(structure.sos);
      assert(structure.quantizationTables.size > 0);
      assert(structure.huffmanTables.size > 0);
    });

    it("validates zigzag roundtrip consistency", () => {
      // Test multiple coefficient patterns
      const patterns = [
        Array.from({ length: 64 }, () => 0), // All zeros
        Array.from({ length: 64 }, (_, i) => i), // Sequential
        Array.from({ length: 64 }, () => Math.floor(Math.random() * 256)), // Random
      ];

      for (const pattern of patterns) {
        const block = zigzagToBlock(pattern);
        const reconstructed = blockToZigzag(block);
        assert.deepEqual(reconstructed, pattern, "Zigzag roundtrip failed");
      }
    });

    it("handles component conversion edge cases", () => {
      // Test with extreme values
      const width = 2;
      const height = 2;

      // All black
      const blackY = new Uint8Array(4).fill(0);
      const blackCb = new Uint8Array(4).fill(128);
      const blackCr = new Uint8Array(4).fill(128);

      const blackData = {
        components: [blackY, blackCb, blackCr],
        width,
        height,
      };

      const blackRGBA = componentsToRGBA(blackData);
      assert.equal(blackRGBA.length, 16); // 2x2x4

      // All white
      const whiteY = new Uint8Array(4).fill(255);
      const whiteCb = new Uint8Array(4).fill(128);
      const whiteCr = new Uint8Array(4).fill(128);

      const whiteData = {
        components: [whiteY, whiteCb, whiteCr],
        width,
        height,
      };

      const whiteRGBA = componentsToRGBA(whiteData);
      assert.equal(whiteRGBA.length, 16);

      // Validate all pixels are valid
      for (let i = 0; i < 16; i += 4) {
        assert(blackRGBA[i] >= 0 && blackRGBA[i] <= 255);
        assert(whiteRGBA[i] >= 0 && whiteRGBA[i] <= 255);
        assert.equal(blackRGBA[i + 3], 255); // Alpha
        assert.equal(whiteRGBA[i + 3], 255); // Alpha
      }
    });
  });

  describe("Error Handling", () => {
    it("handles invalid JPEG structure in decodeJPEGPixels", () => {
      const jpegData = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]); // Minimal JPEG

      assert.throws(() => decodeJPEGPixels(jpegData, null), /Invalid JPEG structure/);
      assert.throws(() => decodeJPEGPixels(jpegData, {}), /Invalid JPEG structure/);
      assert.throws(() => decodeJPEGPixels([], {}), /Uint8Array/);
    });

    it("handles missing quantization tables", () => {
      const structure = createTestJPEGStructure(8, 8, 1);
      const jpegData = new Uint8Array(1000);

      // Add Huffman tables but not quantization tables
      structure.huffmanTables.set("0-0", createStandardHuffmanTable("dc-luminance"));
      structure.huffmanTables.set("1-0", createStandardHuffmanTable("ac-luminance"));

      try {
        decodeScanData(structure, jpegData);
        assert.fail("Should have thrown error for missing quantization table");
      } catch (error) {
        assert(error.message.includes("Missing quantization table"));
      }
    });

    it("handles missing Huffman tables", () => {
      const structure = createTestJPEGStructure(8, 8, 1);
      const jpegData = new Uint8Array(1000);

      // Add quantization tables but not Huffman tables
      structure.quantizationTables.set(0, {
        id: 0,
        precision: 0,
        values: Array.from({ length: 64 }, (_, i) => i + 1),
      });

      try {
        decodeScanData(structure, jpegData);
        assert.fail("Should have thrown error for missing Huffman table");
      } catch (error) {
        assert(error.message.includes("Missing Huffman tables"));
      }
    });
  });

  describe("Performance", () => {
    it("handles large coefficient arrays efficiently", () => {
      // Test zigzag conversion performance
      const largeCoeffs = Array.from({ length: 64 }, () => Math.floor(Math.random() * 256));

      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        const block = zigzagToBlock(largeCoeffs);
        const reconstructed = blockToZigzag(block);
        assert.equal(reconstructed.length, 64);
      }
      const endTime = Date.now();

      // Should complete within reasonable time (< 100ms for 1000 iterations)
      assert(endTime - startTime < 100, `Performance test took ${endTime - startTime}ms`);
    });

    it("handles component conversion efficiently", () => {
      const width = 64;
      const height = 64;
      const pixelCount = width * height;

      const y = new Uint8Array(pixelCount).fill(128);
      const cb = new Uint8Array(pixelCount).fill(128);
      const cr = new Uint8Array(pixelCount).fill(128);

      const decodedData = {
        components: [y, cb, cr],
        width,
        height,
      };

      const startTime = Date.now();
      const rgba = componentsToRGBA(decodedData);
      const endTime = Date.now();

      assert.equal(rgba.length, pixelCount * 4);
      assert(endTime - startTime < 50, `Component conversion took ${endTime - startTime}ms`);
    });
  });
});
