/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for MCU (Minimum Coded Unit) processing.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  analyzeMCUProcessing,
  calculateMCUGrid,
  combineChannels,
  createMCUTestPattern,
  extractAllBlocks,
  extractBlock,
  placeAllBlocks,
  placeBlock,
  processBlocks,
  separateChannels,
  validateBlockCoordinates,
  validateMCUParameters,
} from "./mcu-processing.js";

describe("MCU Processing", () => {
  describe("validateMCUParameters", () => {
    it("accepts valid parameters", () => {
      const pixels = new Uint8Array(16); // 2x2 image, 4 channels = 2*2*4 = 16 bytes
      assert.doesNotThrow(() => validateMCUParameters(pixels, 2, 2, 4));

      const pixels3ch = new Uint8Array(12); // 2x2 image, 3 channels = 2*2*3 = 12 bytes
      assert.doesNotThrow(() => validateMCUParameters(pixels3ch, 2, 2, 3));
    });

    it("rejects invalid pixel data", () => {
      assert.throws(() => validateMCUParameters([], 2, 2, 4), /Uint8Array/);
      assert.throws(() => validateMCUParameters("invalid", 2, 2, 4), /Uint8Array/);
    });

    it("rejects invalid dimensions", () => {
      const pixels = new Uint8Array(32);
      assert.throws(() => validateMCUParameters(pixels, 0, 2, 4), /positive integer/);
      assert.throws(() => validateMCUParameters(pixels, 2.5, 2, 4), /positive integer/);
      assert.throws(() => validateMCUParameters(pixels, 2, -1, 4), /positive integer/);
      assert.throws(() => validateMCUParameters(pixels, 2, 2.5, 4), /positive integer/);
    });

    it("rejects invalid channel count", () => {
      const pixels = new Uint8Array(32);
      assert.throws(() => validateMCUParameters(pixels, 2, 2, 2), /Channels must be 3 or 4/);
      assert.throws(() => validateMCUParameters(pixels, 2, 2, 5), /Channels must be 3 or 4/);
    });

    it("rejects mismatched pixel array length", () => {
      const pixels = new Uint8Array(30); // Wrong size
      assert.throws(() => validateMCUParameters(pixels, 2, 2, 4), /Expected 16 bytes/);
    });
  });

  describe("validateBlockCoordinates", () => {
    it("accepts valid coordinates", () => {
      assert.doesNotThrow(() => validateBlockCoordinates(0, 0, 16, 16));
      assert.doesNotThrow(() => validateBlockCoordinates(1, 1, 16, 16));
    });

    it("rejects invalid coordinates", () => {
      assert.throws(() => validateBlockCoordinates(-1, 0, 16, 16), /non-negative integer/);
      assert.throws(() => validateBlockCoordinates(0, -1, 16, 16), /non-negative integer/);
      assert.throws(() => validateBlockCoordinates(1.5, 0, 16, 16), /non-negative integer/);
      assert.throws(() => validateBlockCoordinates(0, 1.5, 16, 16), /non-negative integer/);
    });

    it("rejects coordinates outside image bounds", () => {
      // 16x16 image = 2x2 blocks (0,0), (0,1), (1,0), (1,1)
      assert.throws(() => validateBlockCoordinates(2, 0, 16, 16), /exceeds image width/);
      assert.throws(() => validateBlockCoordinates(0, 2, 16, 16), /exceeds image height/);
    });
  });

  describe("calculateMCUGrid", () => {
    it("calculates grid for exact multiples of 8", () => {
      const grid = calculateMCUGrid(16, 24);

      assert.equal(grid.blocksX, 2); // 16/8 = 2
      assert.equal(grid.blocksY, 3); // 24/8 = 3
      assert.equal(grid.totalBlocks, 6); // 2*3 = 6
      assert.equal(grid.paddedWidth, 16); // No padding needed
      assert.equal(grid.paddedHeight, 24); // No padding needed
    });

    it("calculates grid with padding needed", () => {
      const grid = calculateMCUGrid(10, 15);

      assert.equal(grid.blocksX, 2); // ceil(10/8) = 2
      assert.equal(grid.blocksY, 2); // ceil(15/8) = 2
      assert.equal(grid.totalBlocks, 4); // 2*2 = 4
      assert.equal(grid.paddedWidth, 16); // 2*8 = 16 (6 pixels padding)
      assert.equal(grid.paddedHeight, 16); // 2*8 = 16 (1 pixel padding)
    });

    it("handles single block images", () => {
      const grid = calculateMCUGrid(5, 3);

      assert.equal(grid.blocksX, 1); // ceil(5/8) = 1
      assert.equal(grid.blocksY, 1); // ceil(3/8) = 1
      assert.equal(grid.totalBlocks, 1);
      assert.equal(grid.paddedWidth, 8);
      assert.equal(grid.paddedHeight, 8);
    });

    it("validates input parameters", () => {
      assert.throws(() => calculateMCUGrid(0, 10), /Width must be positive/);
      assert.throws(() => calculateMCUGrid(10, 0), /Height must be positive/);
      assert.throws(() => calculateMCUGrid(-5, 10), /Width must be positive/);
    });
  });

  describe("extractBlock", () => {
    it("extracts block from exact 8x8 region", () => {
      // Create 16x16 test image (2x2 blocks)
      const pixels = createMCUTestPattern("gradient", 16, 16, 4);

      // Extract top-left block, red channel
      const block = extractBlock(pixels, 16, 16, 0, 0, 0, 4);

      assert.equal(block.length, 8);
      assert.equal(block[0].length, 8);

      // Check gradient pattern in red channel
      assert.equal(block[0][0], 0); // Top-left should be 0
      assert(block[0][7] > block[0][0]); // Should increase horizontally
      assert.equal(block[7][0], 0); // Left edge should be 0
    });

    it("extracts block with padding when needed", () => {
      // Create 10x10 test image (needs padding)
      const pixels = createMCUTestPattern("solid", 16, 16, 4);
      // Simulate smaller image by using only part of it
      const smallPixels = new Uint8Array(10 * 10 * 4);
      for (let i = 0; i < smallPixels.length; i++) {
        smallPixels[i] = pixels[i];
      }

      // Extract block that extends beyond image (should use fillValue=0)
      const block = extractBlock(smallPixels, 10, 10, 1, 1, 0, 4, 0);

      assert.equal(block.length, 8);
      assert.equal(block[0].length, 8);

      // Check that out-of-bounds areas are filled with 0
      assert.equal(block[7][7], 0); // Bottom-right should be padding
    });

    it("extracts different channels correctly", () => {
      const pixels = createMCUTestPattern("gradient", 16, 16, 4);

      const redBlock = extractBlock(pixels, 16, 16, 0, 0, 0, 4);
      const greenBlock = extractBlock(pixels, 16, 16, 0, 0, 1, 4);
      const blueBlock = extractBlock(pixels, 16, 16, 0, 0, 2, 4);
      const alphaBlock = extractBlock(pixels, 16, 16, 0, 0, 3, 4);

      // Red and green should be different (gradient pattern)
      assert.notEqual(redBlock[0][7], greenBlock[0][7]);

      // Blue should be constant (128 in gradient pattern)
      assert.equal(blueBlock[0][0], 128);
      assert.equal(blueBlock[7][7], 128);

      // Alpha should be constant (255)
      assert.equal(alphaBlock[0][0], 255);
      assert.equal(alphaBlock[7][7], 255);
    });

    it("validates parameters", () => {
      const pixels = new Uint8Array(64); // 4x4 image
      assert.throws(() => extractBlock(pixels, 4, 4, 0, 0, 4, 4), /Channel must be 0-3/);
      assert.throws(() => extractBlock(pixels, 4, 4, 0, 0, -1, 4), /Channel must be 0-3/);
    });
  });

  describe("placeBlock", () => {
    it("places block into exact 8x8 region", () => {
      const pixels = new Uint8Array(16 * 16 * 4); // 16x16 image

      // Create test block
      const testBlock = Array(8)
        .fill()
        .map((_, y) =>
          Array(8)
            .fill()
            .map((_, x) => y * 8 + x)
        );

      // Place block in top-left, red channel
      placeBlock(pixels, 16, 16, 0, 0, 0, testBlock, 4);

      // Verify placement
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const pixelIndex = (y * 16 + x) * 4; // Red channel
          assert.equal(pixels[pixelIndex], testBlock[y][x]);
        }
      }
    });

    it("clips values to valid range [0, 255]", () => {
      const pixels = new Uint8Array(8 * 8 * 4);

      // Create block with out-of-range values
      const testBlock = Array(8)
        .fill()
        .map(() => Array(8).fill(300)); // > 255

      placeBlock(pixels, 8, 8, 0, 0, 0, testBlock, 4);

      // All values should be clamped to 255
      for (let i = 0; i < pixels.length; i += 4) {
        assert.equal(pixels[i], 255); // Red channel
      }
    });

    it("handles negative values", () => {
      const pixels = new Uint8Array(8 * 8 * 4);

      const testBlock = Array(8)
        .fill()
        .map(() => Array(8).fill(-50)); // < 0

      placeBlock(pixels, 8, 8, 0, 0, 0, testBlock, 4);

      // All values should be clamped to 0
      for (let i = 0; i < pixels.length; i += 4) {
        assert.equal(pixels[i], 0); // Red channel
      }
    });

    it("ignores pixels outside image bounds", () => {
      const pixels = new Uint8Array(10 * 10 * 4);

      const testBlock = Array(8)
        .fill()
        .map(() => Array(8).fill(200));

      // Place block that extends beyond image
      placeBlock(pixels, 10, 10, 1, 1, 0, testBlock, 4);

      // Should not throw error and should place what fits
      // Check that some pixels were placed
      const pixelIndex = (8 * 10 + 8) * 4; // Position [8,8]
      assert.equal(pixels[pixelIndex], 200);
    });

    it("validates block format", () => {
      const pixels = new Uint8Array(8 * 8 * 4); // 8x8 image, 4 channels
      const invalidBlock = Array(7).fill(Array(8).fill(0)); // Wrong size

      assert.throws(() => placeBlock(pixels, 8, 8, 0, 0, 0, invalidBlock, 4), /8x8 array/);
    });
  });

  describe("extractAllBlocks and placeAllBlocks", () => {
    it("extracts and places all blocks correctly", () => {
      const originalPixels = createMCUTestPattern("checkerboard", 16, 16, 4);

      // Extract all blocks from red channel
      const extracted = extractAllBlocks(originalPixels, 16, 16, 0, 4);

      assert.equal(extracted.blocks.length, 4); // 2x2 = 4 blocks
      assert.equal(extracted.blocksX, 2);
      assert.equal(extracted.blocksY, 2);

      // Create new pixel array and place blocks back
      const newPixels = new Uint8Array(16 * 16 * 4);
      placeAllBlocks(newPixels, 16, 16, 0, extracted.blocks, extracted.blocksX, 4);

      // Compare red channel values
      for (let i = 0; i < originalPixels.length; i += 4) {
        assert.equal(newPixels[i], originalPixels[i]);
      }
    });

    it("handles non-multiple-of-8 dimensions", () => {
      const pixels = createMCUTestPattern("solid", 24, 24, 4);
      // Simulate 18x18 image
      const smallPixels = new Uint8Array(18 * 18 * 4);
      for (let y = 0; y < 18; y++) {
        for (let x = 0; x < 18; x++) {
          const srcIndex = (y * 24 + x) * 4;
          const dstIndex = (y * 18 + x) * 4;
          for (let c = 0; c < 4; c++) {
            smallPixels[dstIndex + c] = pixels[srcIndex + c];
          }
        }
      }

      const extracted = extractAllBlocks(smallPixels, 18, 18, 0, 4);

      // Should create 3x3 = 9 blocks (ceil(18/8) = 3)
      assert.equal(extracted.blocks.length, 9);
      assert.equal(extracted.blocksX, 3);
      assert.equal(extracted.blocksY, 3);
    });
  });

  describe("separateChannels and combineChannels", () => {
    it("separates and combines channels correctly", () => {
      const originalPixels = createMCUTestPattern("gradient", 16, 16, 4);

      // Separate channels
      const separated = separateChannels(originalPixels, 16, 16, 4);

      assert.equal(separated.channelBlocks.length, 4); // 4 channels
      assert.equal(separated.channelBlocks[0].length, 4); // 4 blocks per channel
      assert.equal(separated.blocksX, 2);
      assert.equal(separated.blocksY, 2);

      // Combine channels back
      const combinedPixels = combineChannels(separated.channelBlocks, 16, 16, separated.blocksX, 4);

      // Should match original
      assert.deepEqual(combinedPixels, originalPixels);
    });

    it("handles 3-channel images", () => {
      const originalPixels = createMCUTestPattern("gradient", 16, 16, 3);

      const separated = separateChannels(originalPixels, 16, 16, 3);
      assert.equal(separated.channelBlocks.length, 3);

      const combinedPixels = combineChannels(separated.channelBlocks, 16, 16, separated.blocksX, 3);
      assert.deepEqual(combinedPixels, originalPixels);
    });

    it("validates channel count consistency", () => {
      const blocks = [[], [], []]; // 3 channels
      assert.throws(() => combineChannels(blocks, 16, 16, 2, 4), /array of 4 channel arrays/);
    });
  });

  describe("processBlocks", () => {
    it("applies function to all blocks", () => {
      const blocks = [
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ];

      // Double all values
      const processed = processBlocks(blocks, (block) => block.map((row) => row.map((val) => val * 2)));

      assert.deepEqual(processed[0], [
        [2, 4],
        [6, 8],
      ]);
      assert.deepEqual(processed[1], [
        [10, 12],
        [14, 16],
      ]);
    });

    it("provides block index to processing function", () => {
      const blocks = [[[1, 2]], [[3, 4]]];

      // Add block index to first element
      const processed = processBlocks(blocks, (block, index) => {
        const newBlock = block.map((row) => [...row]);
        newBlock[0][0] += index * 10;
        return newBlock;
      });

      assert.equal(processed[0][0][0], 1); // 1 + 0*10 = 1
      assert.equal(processed[1][0][0], 13); // 3 + 1*10 = 13
    });

    it("handles processing errors gracefully", () => {
      const blocks = [[[1, 2]], [[3, 4]]];

      assert.throws(
        () =>
          processBlocks(blocks, (block, index) => {
            if (index === 1) throw new Error("Test error");
            return block;
          }),
        /Error processing block 1: Test error/
      );
    });

    it("validates parameters", () => {
      assert.throws(() => processBlocks("not array", () => {}), /Blocks must be an array/);
      assert.throws(() => processBlocks([], "not function"), /ProcessFn must be a function/);
    });
  });

  describe("createMCUTestPattern", () => {
    it("creates gradient pattern", () => {
      const pixels = createMCUTestPattern("gradient", 16, 16, 4);

      assert.equal(pixels.length, 16 * 16 * 4);

      // Check gradient properties
      const topLeft = [pixels[0], pixels[1], pixels[2], pixels[3]];
      const topRight = [pixels[60], pixels[61], pixels[62], pixels[63]]; // Last pixel of first row

      assert.equal(topLeft[0], 0); // Red starts at 0
      assert(topRight[0] > topLeft[0]); // Red increases horizontally
      assert.equal(topLeft[2], 128); // Blue constant
      assert.equal(topLeft[3], 255); // Alpha full
    });

    it("creates checkerboard pattern", () => {
      const pixels = createMCUTestPattern("checkerboard", 16, 16, 4);

      // Check alternating pattern
      const block1 = [pixels[0], pixels[1], pixels[2]]; // Top-left block
      const block2 = [pixels[32], pixels[33], pixels[34]]; // Next block (8 pixels right)

      // Should be different (0 vs 255 or vice versa)
      assert.notEqual(block1[0], block2[0]);
    });

    it("creates solid pattern", () => {
      const pixels = createMCUTestPattern("solid", 16, 16, 4);

      // All pixels should have same values
      for (let i = 0; i < pixels.length; i += 4) {
        assert.equal(pixels[i], 128); // R
        assert.equal(pixels[i + 1], 64); // G
        assert.equal(pixels[i + 2], 192); // B
        assert.equal(pixels[i + 3], 255); // A
      }
    });

    it("validates dimensions are multiples of 8", () => {
      assert.throws(() => createMCUTestPattern("solid", 15, 16, 4), /multiples of 8/);
      assert.throws(() => createMCUTestPattern("solid", 16, 15, 4), /multiples of 8/);
    });

    it("rejects unknown patterns", () => {
      assert.throws(() => createMCUTestPattern("unknown", 16, 16, 4), /Unknown test pattern/);
    });
  });

  describe("analyzeMCUProcessing", () => {
    it("analyzes identical images correctly", () => {
      const pixels = createMCUTestPattern("gradient", 16, 16, 4);
      const analysis = analyzeMCUProcessing(pixels, pixels, 16, 16, 4);

      assert.equal(analysis.maxError, 0);
      assert.equal(analysis.avgError, 0);
      assert.equal(analysis.rmseError, 0);
      assert.deepEqual(analysis.channelErrors, [0, 0, 0, 0]);
    });

    it("analyzes different images correctly", () => {
      const original = createMCUTestPattern("solid", 16, 16, 4);
      const processed = createMCUTestPattern("gradient", 16, 16, 4);

      const analysis = analyzeMCUProcessing(original, processed, 16, 16, 4);

      assert(analysis.maxError > 0);
      assert(analysis.avgError > 0);
      assert(analysis.rmseError > 0);
      assert(analysis.channelErrors.some((error) => error > 0));
    });

    it("calculates channel-specific errors", () => {
      const original = new Uint8Array(16);
      const processed = new Uint8Array(16);

      // Create difference only in red channel
      for (let i = 0; i < 16; i += 4) {
        original[i] = 100; // R
        original[i + 1] = 50; // G
        original[i + 2] = 25; // B
        original[i + 3] = 255; // A

        processed[i] = 150; // R (different)
        processed[i + 1] = 50; // G (same)
        processed[i + 2] = 25; // B (same)
        processed[i + 3] = 255; // A (same)
      }

      const analysis = analyzeMCUProcessing(original, processed, 2, 2, 4);

      assert(analysis.channelErrors[0] > 0); // Red has error
      assert.equal(analysis.channelErrors[1], 0); // Green no error
      assert.equal(analysis.channelErrors[2], 0); // Blue no error
      assert.equal(analysis.channelErrors[3], 0); // Alpha no error
    });
  });

  describe("Integration Tests", () => {
    it("handles complete MCU processing pipeline", () => {
      // Create test image
      const originalPixels = createMCUTestPattern("gradient", 24, 24, 4);

      // Separate into channels
      const separated = separateChannels(originalPixels, 24, 24, 4);

      // Process each channel (identity function for this test)
      const processedChannels = separated.channelBlocks.map((channelBlocks) =>
        processBlocks(channelBlocks, (block) => block)
      );

      // Combine back
      const reconstructedPixels = combineChannels(processedChannels, 24, 24, separated.blocksX, 4);

      // Should be identical to original
      assert.deepEqual(reconstructedPixels, originalPixels);
    });

    it("handles edge cases with small images", () => {
      // 3x3 image (smaller than one block)
      const pixels = new Uint8Array(3 * 3 * 4);
      pixels.fill(128);

      const separated = separateChannels(pixels, 3, 3, 4);

      // Should create 1 block per channel with padding
      assert.equal(separated.channelBlocks.length, 4);
      assert.equal(separated.channelBlocks[0].length, 1);
      assert.equal(separated.blocksX, 1);
      assert.equal(separated.blocksY, 1);

      // Reconstruct
      const reconstructed = combineChannels(separated.channelBlocks, 3, 3, separated.blocksX, 4);

      // Original pixels should be preserved (padding ignored)
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const index = (y * 3 + x) * 4;
          for (let c = 0; c < 4; c++) {
            assert.equal(reconstructed[index + c], pixels[index + c]);
          }
        }
      }
    });
  });

  describe("Performance", () => {
    it("handles large images efficiently", () => {
      // Create large test image
      const width = 128;
      const height = 128;
      const pixels = createMCUTestPattern("gradient", width, height, 4);

      // Should complete separation and combination without timeout
      const separated = separateChannels(pixels, width, height, 4);
      const reconstructed = combineChannels(separated.channelBlocks, width, height, separated.blocksX, 4);

      // Verify correctness
      assert.equal(reconstructed.length, pixels.length);

      // Check that processing completed
      const analysis = analyzeMCUProcessing(pixels, reconstructed, width, height, 4);
      assert.equal(analysis.maxError, 0); // Should be identical
    });

    it("processes many blocks efficiently", () => {
      const blocks = [];

      // Create many test blocks
      for (let i = 0; i < 100; i++) {
        blocks.push(
          Array(8)
            .fill()
            .map(() => Array(8).fill(i % 256))
        );
      }

      // Should process all blocks without timeout
      const processed = processBlocks(blocks, (block) => block.map((row) => row.map((val) => (val + 1) % 256)));

      assert.equal(processed.length, 100);
      assert.equal(processed[0][0][0], 1); // 0 + 1 = 1
      assert.equal(processed[99][0][0], 100); // Original was 99%256=99, so (99+1)%256=100
    });
  });
});
