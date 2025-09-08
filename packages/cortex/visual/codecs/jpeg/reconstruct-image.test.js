/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  ASSEMBLY_MODES,
  BLOCK_SIZE,
  COMPONENT_TYPES,
  calculateBlockDimensions,
  calculateBlockGrid,
  copyBlockToImage,
  extractRegion,
  getReconstructionSummary,
  IMAGE_LAYOUTS,
  MAX_IMAGE_DIMENSION,
  ReconstructionMetrics,
  reconstructColorImage,
  reconstructFromComponentBlocks,
  reconstructGrayscaleImage,
} from "./reconstruct-image.js";

describe("JPEG Image Block Reconstruction", () => {
  describe("Constants and Configuration", () => {
    it("defines correct constants", () => {
      assert.equal(BLOCK_SIZE, 8);
      assert.equal(MAX_IMAGE_DIMENSION, 65535);
    });

    it("defines component types", () => {
      assert.equal(COMPONENT_TYPES.Y, "Y");
      assert.equal(COMPONENT_TYPES.CB, "Cb");
      assert.equal(COMPONENT_TYPES.CR, "Cr");
      assert.equal(COMPONENT_TYPES.C, "C");
      assert.equal(COMPONENT_TYPES.M, "M");
      assert.equal(COMPONENT_TYPES.YK, "Yk");
      assert.equal(COMPONENT_TYPES.K, "K");
    });

    it("defines image layouts", () => {
      assert.equal(IMAGE_LAYOUTS.GRAYSCALE, "grayscale");
      assert.equal(IMAGE_LAYOUTS.YCBCR, "ycbcr");
      assert.equal(IMAGE_LAYOUTS.RGB, "rgb");
      assert.equal(IMAGE_LAYOUTS.CMYK, "cmyk");
    });

    it("defines assembly modes", () => {
      assert.equal(ASSEMBLY_MODES.SEQUENTIAL, "sequential");
      assert.equal(ASSEMBLY_MODES.INTERLEAVED, "interleaved");
      assert.equal(ASSEMBLY_MODES.PROGRESSIVE, "progressive");
    });
  });

  describe("Block Grid Calculations", () => {
    it("calculates block grid for exact multiples", () => {
      const grid = calculateBlockGrid(16, 24);

      assert.equal(grid.blocksWide, 2); // 16/8 = 2
      assert.equal(grid.blocksHigh, 3); // 24/8 = 3
      assert.equal(grid.totalBlocks, 6); // 2*3 = 6
    });

    it("calculates block grid with partial blocks", () => {
      const grid = calculateBlockGrid(10, 12);

      assert.equal(grid.blocksWide, 2); // ceil(10/8) = 2
      assert.equal(grid.blocksHigh, 2); // ceil(12/8) = 2
      assert.equal(grid.totalBlocks, 4);
    });

    it("handles single block images", () => {
      const grid = calculateBlockGrid(5, 3);

      assert.equal(grid.blocksWide, 1);
      assert.equal(grid.blocksHigh, 1);
      assert.equal(grid.totalBlocks, 1);
    });

    it("handles large images", () => {
      const grid = calculateBlockGrid(1920, 1080);

      assert.equal(grid.blocksWide, 240); // ceil(1920/8) = 240
      assert.equal(grid.blocksHigh, 135); // ceil(1080/8) = 135
      assert.equal(grid.totalBlocks, 32400);
    });

    it("throws on invalid dimensions", () => {
      assert.throws(() => {
        calculateBlockGrid(-1, 100);
      }, /Width and height must be positive/);

      assert.throws(() => {
        calculateBlockGrid(100, 0);
      }, /Width and height must be positive/);

      assert.throws(() => {
        calculateBlockGrid("100", 100);
      }, /Width and height must be numbers/);

      assert.throws(() => {
        calculateBlockGrid(100000, 100000);
      }, /Image dimensions exceed maximum/);
    });
  });

  describe("Block Dimension Calculations", () => {
    it("calculates full block dimensions", () => {
      const dims = calculateBlockDimensions(0, 0, 16, 16);

      assert.equal(dims.width, 8);
      assert.equal(dims.height, 8);
      assert.equal(dims.paddedWidth, 8);
      assert.equal(dims.paddedHeight, 8);
    });

    it("calculates partial block dimensions", () => {
      // Block at (1,1) in 10x12 image
      const dims = calculateBlockDimensions(1, 1, 10, 12);

      assert.equal(dims.width, 2); // 10 - 8 = 2 pixels remaining
      assert.equal(dims.height, 4); // 12 - 8 = 4 pixels remaining
      assert.equal(dims.paddedWidth, 8);
      assert.equal(dims.paddedHeight, 8);
    });

    it("handles edge blocks", () => {
      const dims = calculateBlockDimensions(0, 1, 8, 12);

      assert.equal(dims.width, 8); // Full width
      assert.equal(dims.height, 4); // 12 - 8 = 4 pixels remaining
    });
  });

  describe("Block Copying", () => {
    it("copies full block to image", () => {
      const blockData = new Uint8Array(64);
      for (let i = 0; i < 64; i++) {
        blockData[i] = i; // Fill with test pattern
      }

      const imageBuffer = new Uint8Array(16 * 16);
      copyBlockToImage(blockData, imageBuffer, 0, 0, 16, 16);

      // Check first row of block
      for (let x = 0; x < 8; x++) {
        assert.equal(imageBuffer[x], x);
      }

      // Check second row of block
      for (let x = 0; x < 8; x++) {
        assert.equal(imageBuffer[16 + x], 8 + x);
      }
    });

    it("copies partial block to image", () => {
      const blockData = new Uint8Array(64).fill(255);
      const imageBuffer = new Uint8Array(10 * 12);

      // Copy to position (1,1) - should be partial
      copyBlockToImage(blockData, imageBuffer, 1, 1, 10, 12);

      // Check that only the valid region was copied
      // Block starts at (8,8), image is 10x12, so only 2x4 region should be copied
      assert.equal(imageBuffer[8 * 10 + 8], 255); // (8,8)
      assert.equal(imageBuffer[8 * 10 + 9], 255); // (8,9)
      assert.equal(imageBuffer[9 * 10 + 8], 255); // (9,8)
      assert.equal(imageBuffer[11 * 10 + 9], 255); // (11,9)

      // Check that areas outside the partial block are unchanged
      assert.equal(imageBuffer[0], 0); // Should still be 0
    });

    it("throws on invalid block data", () => {
      const imageBuffer = new Uint8Array(64);

      assert.throws(() => {
        copyBlockToImage(new Uint8Array(63), imageBuffer, 0, 0, 8, 8);
      }, /Block data must be 64-element Uint8Array/);

      assert.throws(() => {
        copyBlockToImage([1, 2, 3], imageBuffer, 0, 0, 8, 8);
      }, /Block data must be 64-element Uint8Array/);
    });

    it("throws on invalid image buffer", () => {
      const blockData = new Uint8Array(64);

      assert.throws(() => {
        copyBlockToImage(blockData, [1, 2, 3], 0, 0, 8, 8);
      }, /Image buffer must be Uint8Array/);

      assert.throws(() => {
        copyBlockToImage(blockData, new Uint8Array(63), 0, 0, 8, 8);
      }, /Image buffer size doesn't match dimensions/);
    });

    it("throws on invalid coordinates", () => {
      const blockData = new Uint8Array(64);
      const imageBuffer = new Uint8Array(64);

      assert.throws(() => {
        copyBlockToImage(blockData, imageBuffer, -1, 0, 8, 8);
      }, /Block coordinates must be non-negative/);
    });
  });

  describe("Grayscale Image Reconstruction", () => {
    it("reconstructs single block grayscale image", () => {
      const blockData = new Uint8Array(64);
      for (let i = 0; i < 64; i++) {
        blockData[i] = i;
      }

      const result = reconstructGrayscaleImage([blockData], 8, 8);

      assert.equal(result.length, 64);
      for (let i = 0; i < 64; i++) {
        assert.equal(result[i], i);
      }
    });

    it("reconstructs multi-block grayscale image", () => {
      // Create 2x2 block grid (16x16 image)
      const block1 = new Uint8Array(64).fill(100);
      const block2 = new Uint8Array(64).fill(150);
      const block3 = new Uint8Array(64).fill(200);
      const block4 = new Uint8Array(64).fill(250);

      const result = reconstructGrayscaleImage([block1, block2, block3, block4], 16, 16);

      assert.equal(result.length, 256);

      // Check block boundaries
      assert.equal(result[0], 100); // Top-left block
      assert.equal(result[8], 150); // Top-right block
      assert.equal(result[16 * 8], 200); // Bottom-left block
      assert.equal(result[16 * 8 + 8], 250); // Bottom-right block
    });

    it("handles partial blocks in grayscale", () => {
      const blockData = new Uint8Array(64).fill(128);
      const result = reconstructGrayscaleImage([blockData], 5, 3);

      assert.equal(result.length, 15); // 5x3 image
      for (let i = 0; i < 15; i++) {
        assert.equal(result[i], 128);
      }
    });

    it("throws on invalid grayscale inputs", () => {
      assert.throws(() => {
        reconstructGrayscaleImage("not array", 8, 8);
      }, /Blocks must be an array/);

      assert.throws(() => {
        reconstructGrayscaleImage([], 0, 8);
      }, /Image dimensions must be positive/);

      // Test should pass for correct block count - remove this test
      // assert.throws(() => {
      //   reconstructGrayscaleImage([new Uint8Array(64)], 8, 8);
      // }, /Expected 1 blocks, got 1/);

      // Create proper test for block count mismatch
      assert.throws(() => {
        reconstructGrayscaleImage([new Uint8Array(64)], 16, 16);
      }, /Expected 4 blocks, got 1/);
    });
  });

  describe("Color Image Reconstruction", () => {
    it("reconstructs color image from planes", () => {
      const yPlane = new Uint8Array([100, 120, 140, 160]);
      const cbPlane = new Uint8Array([110, 130, 150, 170]);
      const crPlane = new Uint8Array([105, 125, 145, 165]);

      const result = reconstructColorImage(yPlane, cbPlane, crPlane, 2, 2, "ycbcr");

      assert.equal(result.length, 12); // 4 pixels * 3 components

      // Check interleaved format
      assert.equal(result[0], 100); // Y
      assert.equal(result[1], 110); // Cb
      assert.equal(result[2], 105); // Cr
      assert.equal(result[3], 120); // Y
      assert.equal(result[4], 130); // Cb
      assert.equal(result[5], 125); // Cr
    });

    it("handles RGB output format", () => {
      const yPlane = new Uint8Array([128]);
      const cbPlane = new Uint8Array([128]);
      const crPlane = new Uint8Array([128]);

      const result = reconstructColorImage(yPlane, cbPlane, crPlane, 1, 1, "rgb");

      assert.equal(result.length, 3);
      // Note: This is a passthrough for now, actual RGB conversion happens elsewhere
      assert.equal(result[0], 128);
      assert.equal(result[1], 128);
      assert.equal(result[2], 128);
    });

    it("throws on mismatched plane sizes", () => {
      const yPlane = new Uint8Array([100, 120]);
      const cbPlane = new Uint8Array([110]);
      const crPlane = new Uint8Array([105, 125]);

      assert.throws(() => {
        reconstructColorImage(yPlane, cbPlane, crPlane, 2, 1);
      }, /All planes must match image dimensions/);
    });

    it("throws on invalid plane types", () => {
      assert.throws(() => {
        reconstructColorImage([100], new Uint8Array([110]), new Uint8Array([105]), 1, 1);
      }, /All planes must be Uint8Array/);
    });

    it("throws on invalid output format", () => {
      const plane = new Uint8Array([128]);

      assert.throws(() => {
        reconstructColorImage(plane, plane, plane, 1, 1, "invalid");
      }, /Output format must be 'rgb' or 'ycbcr'/);
    });
  });

  describe("Component Block Reconstruction", () => {
    it("reconstructs grayscale from component blocks", () => {
      const yBlocks = [new Uint8Array(64).fill(128)];
      const componentBlocks = { Y: yBlocks };

      const result = reconstructFromComponentBlocks(componentBlocks, 8, 8, {
        layout: IMAGE_LAYOUTS.GRAYSCALE,
      });

      assert.equal(result.length, 64);
      for (let i = 0; i < 64; i++) {
        assert.equal(result[i], 128);
      }
    });

    it("reconstructs YCbCr from component blocks", () => {
      const yBlocks = [new Uint8Array(64).fill(100)];
      const cbBlocks = [new Uint8Array(64).fill(110)];
      const crBlocks = [new Uint8Array(64).fill(120)];

      const componentBlocks = { Y: yBlocks, Cb: cbBlocks, Cr: crBlocks };

      const result = reconstructFromComponentBlocks(componentBlocks, 8, 8, {
        layout: IMAGE_LAYOUTS.YCBCR,
        outputFormat: "ycbcr",
      });

      assert.equal(result.length, 192); // 64 pixels * 3 components

      // Check first pixel
      assert.equal(result[0], 100); // Y
      assert.equal(result[1], 110); // Cb
      assert.equal(result[2], 120); // Cr
    });

    it("reconstructs RGB from component blocks", () => {
      const rBlocks = [new Uint8Array(64).fill(255)];
      const gBlocks = [new Uint8Array(64).fill(128)];
      const bBlocks = [new Uint8Array(64).fill(64)];

      const componentBlocks = { R: rBlocks, G: gBlocks, B: bBlocks };

      const result = reconstructFromComponentBlocks(componentBlocks, 8, 8, {
        layout: IMAGE_LAYOUTS.RGB,
      });

      assert.equal(result.length, 192); // 64 pixels * 3 components

      // Check first pixel
      assert.equal(result[0], 255); // R
      assert.equal(result[1], 128); // G
      assert.equal(result[2], 64); // B
    });

    it("reconstructs CMYK from component blocks", () => {
      const cBlocks = [new Uint8Array(64).fill(100)];
      const mBlocks = [new Uint8Array(64).fill(110)];
      const yBlocks = [new Uint8Array(64).fill(120)];
      const kBlocks = [new Uint8Array(64).fill(130)];

      const componentBlocks = { C: cBlocks, M: mBlocks, Y: yBlocks, K: kBlocks };

      const result = reconstructFromComponentBlocks(componentBlocks, 8, 8, {
        layout: IMAGE_LAYOUTS.CMYK,
      });

      assert.equal(result.length, 256); // 64 pixels * 4 components

      // Check first pixel
      assert.equal(result[0], 100); // C
      assert.equal(result[1], 110); // M
      assert.equal(result[2], 120); // Y
      assert.equal(result[3], 130); // K
    });

    it("throws on missing components", () => {
      assert.throws(() => {
        reconstructFromComponentBlocks({}, 8, 8, { layout: IMAGE_LAYOUTS.GRAYSCALE });
      }, /Grayscale layout requires Y component/);

      assert.throws(() => {
        reconstructFromComponentBlocks({ Y: [] }, 8, 8, { layout: IMAGE_LAYOUTS.YCBCR });
      }, /YCbCr layout requires Y, Cb, and Cr components/);

      assert.throws(() => {
        reconstructFromComponentBlocks({ R: [], G: [] }, 8, 8, { layout: IMAGE_LAYOUTS.RGB });
      }, /RGB layout requires R, G, and B components/);
    });

    it("throws on unknown layout", () => {
      assert.throws(() => {
        reconstructFromComponentBlocks({}, 8, 8, { layout: "unknown" });
      }, /Unknown layout: unknown/);
    });
  });

  describe("Region Extraction", () => {
    it("extracts full image region", () => {
      const imageData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      const result = extractRegion(imageData, 3, 3, 0, 0, 3, 3, 1);

      assert.deepEqual(result, imageData);
    });

    it("extracts partial region", () => {
      const imageData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      const result = extractRegion(imageData, 3, 3, 1, 1, 2, 2, 1);

      assert.equal(result.length, 4);
      assert.equal(result[0], 5); // (1,1)
      assert.equal(result[1], 6); // (1,2)
      assert.equal(result[2], 8); // (2,1)
      assert.equal(result[3], 9); // (2,2)
    });

    it("extracts RGB region", () => {
      // 2x2 RGB image
      const imageData = new Uint8Array([
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
        255, // White pixel
      ]);

      const result = extractRegion(imageData, 2, 2, 0, 0, 1, 1, 3);

      assert.equal(result.length, 3);
      assert.equal(result[0], 255); // R
      assert.equal(result[1], 0); // G
      assert.equal(result[2], 0); // B
    });

    it("throws on invalid region parameters", () => {
      const imageData = new Uint8Array([1, 2, 3, 4]);

      assert.throws(() => {
        extractRegion(imageData, 2, 2, -1, 0, 1, 1, 1);
      }, /ROI coordinates must be non-negative/);

      assert.throws(() => {
        extractRegion(imageData, 2, 2, 0, 0, 3, 1, 1);
      }, /ROI extends beyond image boundaries/);

      assert.throws(() => {
        extractRegion(imageData, 2, 2, 0, 0, 1, 1, 2);
      }, /Bytes per pixel must be 1, 3, or 4/);
    });
  });

  describe("Reconstruction Metrics", () => {
    it("creates metrics analyzer", () => {
      const metrics = new ReconstructionMetrics();

      assert.equal(metrics.blocksProcessed, 0);
      assert.equal(metrics.pixelsProcessed, 0);
      assert.equal(metrics.partialBlocks, 0);
      assert.deepEqual(metrics.componentCounts, {});
      assert.deepEqual(metrics.layoutUsage, {});
    });

    it("records processing operations", () => {
      const metrics = new ReconstructionMetrics();

      metrics.recordProcessing(10, 640, 2, IMAGE_LAYOUTS.YCBCR);
      metrics.recordComponent(COMPONENT_TYPES.Y, 10);
      metrics.recordTime(15.5);

      assert.equal(metrics.blocksProcessed, 10);
      assert.equal(metrics.pixelsProcessed, 640);
      assert.equal(metrics.partialBlocks, 2);
      assert.equal(metrics.componentCounts.Y, 10);
      assert.equal(metrics.layoutUsage.ycbcr, 1);
      assert.equal(metrics.totalReconstructionTime, 15.5);
    });

    it("generates summary statistics", () => {
      const metrics = new ReconstructionMetrics();

      metrics.recordProcessing(20, 1280, 4, IMAGE_LAYOUTS.RGB);
      metrics.recordProcessing(15, 960, 3, IMAGE_LAYOUTS.GRAYSCALE);

      const summary = metrics.getSummary();

      assert.equal(summary.blocksProcessed, 35);
      assert.equal(summary.pixelsProcessed, 2240);
      assert.equal(summary.partialBlocks, 7);
      assert.equal(summary.partialBlockRatio, 0.2); // 7/35 = 0.2
    });

    it("resets metrics", () => {
      const metrics = new ReconstructionMetrics();

      metrics.recordProcessing(10, 640, 2, IMAGE_LAYOUTS.YCBCR);
      assert.equal(metrics.blocksProcessed, 10);

      metrics.reset();
      assert.equal(metrics.blocksProcessed, 0);
      assert.deepEqual(metrics.componentCounts, {});
    });
  });

  describe("Summary Generation", () => {
    it("generates reconstruction summary", () => {
      const summary = getReconstructionSummary(16, 12, 4, IMAGE_LAYOUTS.YCBCR, {
        assemblyMode: ASSEMBLY_MODES.SEQUENTIAL,
        outputFormat: "rgb",
      });

      assert.equal(summary.imageWidth, 16);
      assert.equal(summary.imageHeight, 12);
      assert.equal(summary.pixelCount, 192);
      assert.equal(summary.blockCount, 4);
      assert.equal(summary.expectedBlocks, 4); // ceil(16/8) * ceil(12/8) = 2 * 2 = 4
      assert.equal(summary.blocksWide, 2);
      assert.equal(summary.blocksHigh, 2);
      assert.equal(summary.layout, IMAGE_LAYOUTS.YCBCR);
      assert.equal(summary.assemblyMode, ASSEMBLY_MODES.SEQUENTIAL);
    });

    it("calculates partial blocks correctly", () => {
      const summary = getReconstructionSummary(10, 12, 4, IMAGE_LAYOUTS.GRAYSCALE);

      assert.equal(summary.blocksWide, 2); // ceil(10/8) = 2
      assert.equal(summary.blocksHigh, 2); // ceil(12/8) = 2
      assert.equal(summary.expectedBlocks, 4);

      // Partial blocks = total blocks - full blocks
      // Full blocks = floor(10/8) * floor(12/8) = 1 * 1 = 1
      // So partial blocks = 4 - 1 = 3
      assert.equal(summary.partialBlocks, 3);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles single pixel images", () => {
      const blockData = new Uint8Array(64).fill(200);
      const result = reconstructGrayscaleImage([blockData], 1, 1);

      assert.equal(result.length, 1);
      assert.equal(result[0], 200);
    });

    it("handles maximum dimension images", () => {
      // Test that we can at least calculate grid for max dimensions
      const grid = calculateBlockGrid(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION);

      assert(grid.blocksWide > 0);
      assert(grid.blocksHigh > 0);
      assert(grid.totalBlocks > 0);
    });

    it("handles empty component blocks gracefully", () => {
      assert.throws(() => {
        reconstructFromComponentBlocks(null, 8, 8);
      }, /Component blocks must be an object/);

      assert.throws(() => {
        reconstructFromComponentBlocks({}, 0, 8);
      }, /Image dimensions must be positive/);
    });

    it("validates region extraction bounds", () => {
      const imageData = new Uint8Array([1, 2, 3, 4]);

      assert.throws(() => {
        extractRegion(imageData, 2, 2, 1, 1, 2, 2, 1);
      }, /ROI extends beyond image boundaries/);
    });

    it("handles large block arrays efficiently", () => {
      // Create a moderately large block array
      const blocks = [];
      for (let i = 0; i < 100; i++) {
        blocks.push(new Uint8Array(64).fill(i % 256));
      }

      // This should represent a 80x80 image (10x10 blocks)
      const result = reconstructGrayscaleImage(blocks, 80, 80);

      assert.equal(result.length, 6400); // 80*80
      assert.equal(result[0], 0); // First block
      assert.equal(result[640], 10); // Block at position (0,1) -> index 10
    });
  });
});
