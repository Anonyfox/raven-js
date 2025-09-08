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
  applyPadding,
  BLOCK_SIZE,
  COMPONENT_TYPES,
  calculateBlockCounts,
  calculatePadding,
  DEFAULT_SEGMENTATION_OPTIONS,
  EXTRACTION_MODES,
  extractBlock,
  extractComponentBlocks,
  optimizeBlockLayout,
  PADDING_MODES,
  SegmentationMetrics,
  SUBSAMPLING_FACTORS,
  segmentYcbcrBlocks,
  validateBlocks,
} from "./segment-blocks.js";

describe("Image Segmentation into 8×8 Blocks", () => {
  describe("Constants and Definitions", () => {
    it("defines block size", () => {
      assert.equal(BLOCK_SIZE, 8);
    });

    it("defines padding modes", () => {
      assert.equal(PADDING_MODES.ZERO, "zero");
      assert.equal(PADDING_MODES.EDGE, "edge");
      assert.equal(PADDING_MODES.REFLECT, "reflect");
      assert.equal(PADDING_MODES.WRAP, "wrap");
      assert.equal(PADDING_MODES.NEUTRAL, "neutral");
    });

    it("defines extraction modes", () => {
      assert.equal(EXTRACTION_MODES.RASTER, "raster");
      assert.equal(EXTRACTION_MODES.INTERLEAVED, "interleaved");
      assert.equal(EXTRACTION_MODES.PROGRESSIVE, "progressive");
      assert.equal(EXTRACTION_MODES.CACHE_OPTIMIZED, "cache_optimized");
    });

    it("defines component types", () => {
      assert.equal(COMPONENT_TYPES.LUMA, "luma");
      assert.equal(COMPONENT_TYPES.CHROMA, "chroma");
    });

    it("defines subsampling factors", () => {
      assert.deepEqual(SUBSAMPLING_FACTORS["4:4:4"], { horizontal: 1, vertical: 1 });
      assert.deepEqual(SUBSAMPLING_FACTORS["4:2:2"], { horizontal: 2, vertical: 1 });
      assert.deepEqual(SUBSAMPLING_FACTORS["4:2:0"], { horizontal: 2, vertical: 2 });
      assert.deepEqual(SUBSAMPLING_FACTORS["4:1:1"], { horizontal: 4, vertical: 1 });
    });

    it("defines default options", () => {
      assert.equal(DEFAULT_SEGMENTATION_OPTIONS.paddingMode, PADDING_MODES.EDGE);
      assert.equal(DEFAULT_SEGMENTATION_OPTIONS.extractionMode, EXTRACTION_MODES.RASTER);
      assert.equal(DEFAULT_SEGMENTATION_OPTIONS.preserveBoundaries, true);
      assert.equal(DEFAULT_SEGMENTATION_OPTIONS.optimizeMemory, true);
      assert.equal(DEFAULT_SEGMENTATION_OPTIONS.validateBlocks, true);
    });
  });

  describe("Padding Calculations", () => {
    it("calculates padding for exact multiples of 8", () => {
      const result = calculatePadding(16, 24);

      assert.equal(result.paddedWidth, 16);
      assert.equal(result.paddedHeight, 24);
      assert.equal(result.horizontalPadding, 0);
      assert.equal(result.verticalPadding, 0);
      assert.equal(result.needsPadding, false);
    });

    it("calculates padding for non-multiples of 8", () => {
      const result = calculatePadding(15, 23);

      assert.equal(result.paddedWidth, 16); // 15 + 1
      assert.equal(result.paddedHeight, 24); // 23 + 1
      assert.equal(result.horizontalPadding, 1);
      assert.equal(result.verticalPadding, 1);
      assert.equal(result.needsPadding, true);
    });

    it("handles edge cases", () => {
      const result1 = calculatePadding(1, 1);
      assert.equal(result1.paddedWidth, 8);
      assert.equal(result1.paddedHeight, 8);
      assert.equal(result1.horizontalPadding, 7);
      assert.equal(result1.verticalPadding, 7);

      const result2 = calculatePadding(7, 7);
      assert.equal(result2.paddedWidth, 8);
      assert.equal(result2.paddedHeight, 8);
      assert.equal(result2.horizontalPadding, 1);
      assert.equal(result2.verticalPadding, 1);
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        calculatePadding(0, 8);
      }, /Width must be positive integer/);

      assert.throws(() => {
        calculatePadding(8, -1);
      }, /Height must be positive integer/);

      assert.throws(() => {
        calculatePadding(8.5, 8);
      }, /Width must be positive integer/);
    });
  });

  describe("Padding Application", () => {
    /**
     * Create test image data.
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {Uint8Array} Test image data
     */
    function createTestData(width, height) {
      const data = new Uint8Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          data[y * width + x] = (x + y * 10) % 256;
        }
      }
      return data;
    }

    it("applies zero padding", () => {
      const data = createTestData(3, 3);
      const padded = applyPadding(data, 3, 3, 8, 8, PADDING_MODES.ZERO, COMPONENT_TYPES.LUMA);

      assert.equal(padded.length, 64);

      // Check original data is preserved
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          assert.equal(padded[y * 8 + x], data[y * 3 + x]);
        }
      }

      // Check padding areas are zero
      for (let y = 0; y < 3; y++) {
        for (let x = 3; x < 8; x++) {
          assert.equal(padded[y * 8 + x], 0);
        }
      }
      for (let y = 3; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          assert.equal(padded[y * 8 + x], 0);
        }
      }
    });

    it("applies neutral padding", () => {
      const data = createTestData(3, 3);

      const lumaPadded = applyPadding(data, 3, 3, 8, 8, PADDING_MODES.NEUTRAL, COMPONENT_TYPES.LUMA);
      const chromaPadded = applyPadding(data, 3, 3, 8, 8, PADDING_MODES.NEUTRAL, COMPONENT_TYPES.CHROMA);

      // Luma should use 0 as neutral
      assert.equal(lumaPadded[3], 0); // First padding pixel

      // Chroma should use 128 as neutral
      assert.equal(chromaPadded[3], 128); // First padding pixel
    });

    it("applies edge padding", () => {
      const data = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80, 90]);

      const padded = applyPadding(data, 3, 3, 5, 5, PADDING_MODES.EDGE, COMPONENT_TYPES.LUMA);

      // Check right edge replication
      assert.equal(padded[3], 30); // Should replicate last pixel of row 0
      assert.equal(padded[4], 30);
      assert.equal(padded[8], 60); // Should replicate last pixel of row 1
      assert.equal(padded[9], 60);

      // Check bottom edge replication
      assert.equal(padded[15], 70); // Should replicate bottom row
      assert.equal(padded[16], 80);
      assert.equal(padded[17], 90);
    });

    it("applies reflection padding", () => {
      const data = new Uint8Array([10, 20, 30, 40]);

      const padded = applyPadding(data, 2, 2, 4, 4, PADDING_MODES.REFLECT, COMPONENT_TYPES.LUMA);

      assert.equal(padded.length, 16);

      // Check horizontal reflection
      assert.equal(padded[2], 20); // Reflect of position 0
      assert.equal(padded[3], 10); // Reflect of position 1

      // Check vertical reflection
      assert.equal(padded[8], 30); // Reflect of row 0
      assert.equal(padded[9], 40);
    });

    it("applies wrap padding", () => {
      const data = new Uint8Array([10, 20, 30, 40]);

      const padded = applyPadding(data, 2, 2, 4, 4, PADDING_MODES.WRAP, COMPONENT_TYPES.LUMA);

      // Check horizontal wrapping
      assert.equal(padded[2], 10); // Wrap to column 0
      assert.equal(padded[3], 20); // Wrap to column 1

      // Check vertical wrapping
      assert.equal(padded[8], 10); // Wrap to row 0
      assert.equal(padded[9], 20);
    });

    it("handles no padding needed", () => {
      const data = createTestData(8, 8);
      const padded = applyPadding(data, 8, 8, 8, 8, PADDING_MODES.EDGE, COMPONENT_TYPES.LUMA);

      assert.equal(padded.length, 64);
      assert.deepEqual(Array.from(padded), Array.from(data));
    });

    it("validates input parameters", () => {
      const data = new Uint8Array([1, 2, 3, 4]);

      assert.throws(() => {
        applyPadding("not-array", 2, 2, 4, 4, PADDING_MODES.EDGE, COMPONENT_TYPES.LUMA);
      }, /Data must be Uint8Array/);

      assert.throws(() => {
        applyPadding(new Uint8Array([1, 2]), 2, 2, 4, 4, PADDING_MODES.EDGE, COMPONENT_TYPES.LUMA);
      }, /Insufficient data for specified dimensions/);

      assert.throws(() => {
        applyPadding(data, 2, 2, 1, 4, PADDING_MODES.EDGE, COMPONENT_TYPES.LUMA);
      }, /Padded dimensions must be >= original dimensions/);

      assert.throws(() => {
        applyPadding(data, 2, 2, 4, 4, "invalid-mode", COMPONENT_TYPES.LUMA);
      }, /Unknown padding mode/);
    });
  });

  describe("Block Extraction", () => {
    /**
     * Create 16×16 test image.
     * @returns {Uint8Array} Test image data
     */
    function create16x16TestImage() {
      const data = new Uint8Array(256);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          data[y * 16 + x] = (x + y * 16) % 256;
        }
      }
      return data;
    }

    it("extracts single 8×8 block", () => {
      const data = create16x16TestImage();
      const block = extractBlock(data, 16, 16, 0, 0);

      assert(block instanceof Uint8Array);
      assert.equal(block.length, 64);

      // Check first few values
      assert.equal(block[0], 0); // (0,0)
      assert.equal(block[1], 1); // (1,0)
      assert.equal(block[8], 16); // (0,1)
      assert.equal(block[9], 17); // (1,1)
    });

    it("extracts block from different positions", () => {
      const data = create16x16TestImage();

      const topLeft = extractBlock(data, 16, 16, 0, 0);
      const topRight = extractBlock(data, 16, 16, 1, 0);
      const bottomLeft = extractBlock(data, 16, 16, 0, 1);
      const bottomRight = extractBlock(data, 16, 16, 1, 1);

      // Check distinctive values
      assert.equal(topLeft[0], 0); // (0,0)
      assert.equal(topRight[0], 8); // (8,0)
      assert.equal(bottomLeft[0], 128); // (0,8)
      assert.equal(bottomRight[0], 136); // (8,8)
    });

    it("validates block extraction parameters", () => {
      const data = create16x16TestImage();

      assert.throws(() => {
        extractBlock("not-array", 16, 16, 0, 0);
      }, /Data must be Uint8Array/);

      assert.throws(() => {
        extractBlock(data, 16, 16, -1, 0);
      }, /Block X must be non-negative integer/);

      assert.throws(() => {
        extractBlock(data, 16, 16, 0, -1);
      }, /Block Y must be non-negative integer/);

      assert.throws(() => {
        extractBlock(data, 16, 16, 2, 0);
      }, /Block extends beyond image boundaries/);

      assert.throws(() => {
        extractBlock(data, 16, 16, 0, 2);
      }, /Block extends beyond image boundaries/);
    });
  });

  describe("Component Block Extraction", () => {
    it("extracts all blocks in raster order", () => {
      const data = new Uint8Array(256).fill(0).map((_, i) => i % 256);
      const result = extractComponentBlocks(data, 16, 16, EXTRACTION_MODES.RASTER);

      assert.equal(result.blocks.length, 4); // 2×2 blocks
      assert.equal(result.blocksHorizontal, 2);
      assert.equal(result.blocksVertical, 2);
      assert.equal(result.totalBlocks, 4);

      // Each block should be 64 values
      for (const block of result.blocks) {
        assert(block instanceof Uint8Array);
        assert.equal(block.length, 64);
      }
    });

    it("extracts blocks in cache-optimized order", () => {
      const data = new Uint8Array(256).fill(0).map((_, i) => i % 256);
      const result = extractComponentBlocks(data, 16, 16, EXTRACTION_MODES.CACHE_OPTIMIZED);

      assert.equal(result.blocks.length, 4);
      assert.equal(result.totalBlocks, 4);

      // All blocks should be valid
      for (const block of result.blocks) {
        assert(block instanceof Uint8Array);
        assert.equal(block.length, 64);
      }
    });

    it("handles different extraction modes", () => {
      const data = new Uint8Array(256).fill(0).map((_, i) => i % 256);

      const rasterResult = extractComponentBlocks(data, 16, 16, EXTRACTION_MODES.RASTER);
      const interleavedResult = extractComponentBlocks(data, 16, 16, EXTRACTION_MODES.INTERLEAVED);
      const progressiveResult = extractComponentBlocks(data, 16, 16, EXTRACTION_MODES.PROGRESSIVE);

      // All should extract same number of blocks
      assert.equal(rasterResult.blocks.length, interleavedResult.blocks.length);
      assert.equal(rasterResult.blocks.length, progressiveResult.blocks.length);
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        extractComponentBlocks("not-array", 16, 16);
      }, /Data must be Uint8Array/);

      assert.throws(() => {
        extractComponentBlocks(new Uint8Array(256), 15, 16);
      }, /Dimensions must be divisible by 8/);

      assert.throws(() => {
        extractComponentBlocks(new Uint8Array(256), 16, 15);
      }, /Dimensions must be divisible by 8/);

      assert.throws(() => {
        extractComponentBlocks(new Uint8Array(256), 16, 16, "invalid-mode");
      }, /Unknown extraction mode/);
    });
  });

  describe("Block Count Calculations", () => {
    it("calculates block counts for 4:4:4 mode", () => {
      const result = calculateBlockCounts(16, 16, "4:4:4");

      assert.equal(result.luma.width, 2); // 16/8 = 2
      assert.equal(result.luma.height, 2);
      assert.equal(result.luma.blocks, 4); // 2×2
      assert.equal(result.chroma.width, 2); // Same as luma for 4:4:4
      assert.equal(result.chroma.height, 2);
      assert.equal(result.chroma.blocks, 4);
      assert.equal(result.totalBlocks, 12); // Y + Cb + Cr = 4 + 4 + 4
    });

    it("calculates block counts for 4:2:2 mode", () => {
      const result = calculateBlockCounts(16, 16, "4:2:2");

      assert.equal(result.luma.blocks, 4); // 2×2
      assert.equal(result.chroma.width, 1); // 16/2/8 = 1
      assert.equal(result.chroma.height, 2); // 16/8 = 2
      assert.equal(result.chroma.blocks, 2); // 1×2
      assert.equal(result.totalBlocks, 8); // Y + Cb + Cr = 4 + 2 + 2
    });

    it("calculates block counts for 4:2:0 mode", () => {
      const result = calculateBlockCounts(16, 16, "4:2:0");

      assert.equal(result.luma.blocks, 4); // 2×2
      assert.equal(result.chroma.width, 1); // 16/2/8 = 1
      assert.equal(result.chroma.height, 1); // 16/2/8 = 1
      assert.equal(result.chroma.blocks, 1); // 1×1
      assert.equal(result.totalBlocks, 6); // Y + Cb + Cr = 4 + 1 + 1
    });

    it("calculates block counts for 4:1:1 mode", () => {
      const result = calculateBlockCounts(32, 16, "4:1:1"); // Use 32×16 for 4:1:1

      assert.equal(result.luma.blocks, 8); // 4×2
      assert.equal(result.chroma.width, 1); // 32/4/8 = 1
      assert.equal(result.chroma.height, 2); // 16/8 = 2
      assert.equal(result.chroma.blocks, 2); // 1×2
      assert.equal(result.totalBlocks, 12); // Y + Cb + Cr = 8 + 2 + 2
    });

    it("handles padding in block calculations", () => {
      const result = calculateBlockCounts(15, 15, "4:2:0");

      // Should pad to 16×16
      assert.equal(result.luma.blocks, 4); // (16/8)×(16/8) = 2×2 = 4
      assert.equal(result.chroma.blocks, 1); // (16/2/8)×(16/2/8) = 1×1 = 1
    });

    it("throws on unknown subsampling mode", () => {
      assert.throws(() => {
        calculateBlockCounts(16, 16, "invalid");
      }, /Unknown subsampling mode/);
    });
  });

  describe("YCbCr Block Segmentation", () => {
    /**
     * Create test YCbCr data.
     * @param {number} yWidth - Y width
     * @param {number} yHeight - Y height
     * @param {number} cbWidth - Cb width
     * @param {number} cbHeight - Cb height
     * @returns {{yData: Uint8Array, cbData: Uint8Array, crData: Uint8Array}} Test data
     */
    function createTestYCbCrData(yWidth, yHeight, cbWidth, cbHeight) {
      const yData = new Uint8Array(yWidth * yHeight).fill(0).map((_, i) => i % 256);
      const cbData = new Uint8Array(cbWidth * cbHeight).fill(128);
      const crData = new Uint8Array(cbWidth * cbHeight).fill(128);

      return { yData, cbData, crData };
    }

    it("segments YCbCr data into blocks", () => {
      const { yData, cbData, crData } = createTestYCbCrData(16, 16, 8, 8);

      const result = segmentYcbcrBlocks(yData, cbData, crData, 16, 16, 8, 8, 8, 8);

      // Check Y blocks
      assert(Array.isArray(result.yBlocks));
      assert.equal(result.yBlocks.length, 4); // 2×2 blocks
      assert.equal(result.yBlocksH, 2);
      assert.equal(result.yBlocksV, 2);

      // Check Cb blocks
      assert(Array.isArray(result.cbBlocks));
      assert.equal(result.cbBlocks.length, 1); // 1×1 block
      assert.equal(result.cbBlocksH, 1);
      assert.equal(result.cbBlocksV, 1);

      // Check Cr blocks
      assert(Array.isArray(result.crBlocks));
      assert.equal(result.crBlocks.length, 1); // 1×1 block
      assert.equal(result.crBlocksH, 1);
      assert.equal(result.crBlocksV, 1);

      // Check metadata
      assert(typeof result.metadata === "object");
      assert(typeof result.metadata.processingTime === "number");
    });

    it("handles padding requirements", () => {
      const { yData, cbData, crData } = createTestYCbCrData(15, 15, 7, 7);

      const result = segmentYcbcrBlocks(yData, cbData, crData, 15, 15, 7, 7, 7, 7);

      // Should pad to 16×16 and 8×8
      assert.equal(result.yBlocks.length, 4); // (16/8)×(16/8) = 4
      assert.equal(result.cbBlocks.length, 1); // (8/8)×(8/8) = 1
      assert.equal(result.crBlocks.length, 1); // (8/8)×(8/8) = 1

      // Check padding metadata
      assert(result.metadata.padding.y.needsPadding);
      assert(result.metadata.padding.cb.needsPadding);
      assert(result.metadata.padding.cr.needsPadding);
    });

    it("uses different padding modes", () => {
      const { yData, cbData, crData } = createTestYCbCrData(7, 7, 7, 7);

      const zeroResult = segmentYcbcrBlocks(yData, cbData, crData, 7, 7, 7, 7, 7, 7, {
        paddingMode: PADDING_MODES.ZERO,
      });

      const edgeResult = segmentYcbcrBlocks(yData, cbData, crData, 7, 7, 7, 7, 7, 7, {
        paddingMode: PADDING_MODES.EDGE,
      });

      assert.equal(zeroResult.metadata.paddingMode, PADDING_MODES.ZERO);
      assert.equal(edgeResult.metadata.paddingMode, PADDING_MODES.EDGE);
    });

    it("validates input parameters", () => {
      const { yData, cbData, crData } = createTestYCbCrData(16, 16, 8, 8);

      assert.throws(() => {
        segmentYcbcrBlocks("not-array", cbData, crData, 16, 16, 8, 8, 8, 8);
      }, /YCbCr data must be Uint8Array instances/);

      assert.throws(() => {
        segmentYcbcrBlocks(yData, cbData, crData, 0, 16, 8, 8, 8, 8);
      }, /Luma dimensions must be positive integers/);

      assert.throws(() => {
        segmentYcbcrBlocks(yData, cbData, crData, 16, 16, 8, 8, 7, 8);
      }, /Cb and Cr dimensions must match/);

      assert.throws(() => {
        segmentYcbcrBlocks(new Uint8Array(100), cbData, crData, 16, 16, 8, 8, 8, 8);
      }, /Insufficient Y data/);

      assert.throws(() => {
        segmentYcbcrBlocks(yData, new Uint8Array(30), crData, 16, 16, 8, 8, 8, 8);
      }, /Insufficient chroma data/);
    });

    it("provides comprehensive metadata", () => {
      const { yData, cbData, crData } = createTestYCbCrData(16, 16, 8, 8);

      const result = segmentYcbcrBlocks(yData, cbData, crData, 16, 16, 8, 8, 8, 8);

      const metadata = result.metadata;
      assert(typeof metadata.paddingMode === "string");
      assert(typeof metadata.extractionMode === "string");
      assert(typeof metadata.originalDimensions === "object");
      assert(typeof metadata.paddedDimensions === "object");
      assert(typeof metadata.blockCounts === "object");
      assert(typeof metadata.memoryUsage === "object");
      assert(typeof metadata.processingTime === "number");

      assert.equal(metadata.blockCounts.y, 4);
      assert.equal(metadata.blockCounts.cb, 1);
      assert.equal(metadata.blockCounts.cr, 1);
      assert.equal(metadata.blockCounts.total, 6);
    });
  });

  describe("Segmentation Metrics", () => {
    it("creates metrics analyzer", () => {
      const metrics = new SegmentationMetrics();

      assert.equal(metrics.operationsPerformed, 0);
      assert.equal(metrics.totalPixelsProcessed, 0);
      assert.equal(metrics.totalBlocksExtracted, 0);
      assert.equal(metrics.totalPaddingApplied, 0);
      assert.equal(metrics.totalProcessingTime, 0);
      assert.deepEqual(metrics.paddingModeUsage, {});
      assert.deepEqual(metrics.extractionModeUsage, {});
      assert.deepEqual(metrics.processingTimes, []);
      assert.deepEqual(metrics.errors, []);
    });

    it("records segmentation operations", () => {
      const metrics = new SegmentationMetrics();

      const metadata = {
        paddingMode: PADDING_MODES.EDGE,
        extractionMode: EXTRACTION_MODES.RASTER,
        originalSize: 256,
        paddedSize: 320,
        blockSize: 320,
        processingTime: 5.5,
        blockCounts: {
          total: 5,
        },
      };

      metrics.recordOperation(metadata);

      assert.equal(metrics.operationsPerformed, 1);
      assert.equal(metrics.totalPixelsProcessed, 256);
      assert.equal(metrics.totalBlocksExtracted, 5);
      assert.equal(metrics.totalPaddingApplied, 64); // 320 - 256
      assert.equal(metrics.totalProcessingTime, 5.5);
      assert.equal(metrics.paddingModeUsage[PADDING_MODES.EDGE], 1);
      assert.equal(metrics.extractionModeUsage[EXTRACTION_MODES.RASTER], 1);
    });

    it("records errors", () => {
      const metrics = new SegmentationMetrics();

      metrics.recordError("Test error 1");
      metrics.recordError("Test error 2");

      assert.equal(metrics.errors.length, 2);
      assert.equal(metrics.errors[0], "Test error 1");
      assert.equal(metrics.errors[1], "Test error 2");
    });

    it("generates summary statistics", () => {
      const metrics = new SegmentationMetrics();

      metrics.recordOperation({
        paddingMode: PADDING_MODES.EDGE,
        extractionMode: EXTRACTION_MODES.RASTER,
        originalSize: 256,
        paddedSize: 320,
        blockSize: 320,
        processingTime: 10,
        blockCounts: { total: 5 },
      });

      metrics.recordOperation({
        paddingMode: PADDING_MODES.ZERO,
        extractionMode: EXTRACTION_MODES.CACHE_OPTIMIZED,
        originalSize: 512,
        paddedSize: 512,
        blockSize: 512,
        processingTime: 15,
        blockCounts: { total: 8 },
      });

      metrics.recordError("Test error");

      const summary = metrics.getSummary();

      assert.equal(summary.operationsPerformed, 2);
      assert.equal(summary.totalPixelsProcessed, 768); // 256 + 512
      assert.equal(summary.totalBlocksExtracted, 13); // 5 + 8
      assert.equal(summary.averageBlocksPerOperation, 7); // Round(13/2)
      assert.equal(summary.paddingRatio, 8.33); // (64/768) * 100
      assert.equal(summary.averageProcessingTime, 12.5); // (10+15)/2
      assert.equal(summary.errorCount, 1);
      assert(summary.description.includes("2 operations"));
    });

    it("resets metrics", () => {
      const metrics = new SegmentationMetrics();

      metrics.recordOperation({
        paddingMode: PADDING_MODES.EDGE,
        extractionMode: EXTRACTION_MODES.RASTER,
        originalSize: 256,
        paddedSize: 320,
        blockSize: 320,
        processingTime: 5,
        blockCounts: { total: 5 },
      });

      metrics.recordError("Test error");

      assert.equal(metrics.operationsPerformed, 1);
      assert.equal(metrics.errors.length, 1);

      metrics.reset();

      assert.equal(metrics.operationsPerformed, 0);
      assert.equal(metrics.errors.length, 0);
      assert.deepEqual(metrics.paddingModeUsage, {});
    });
  });

  describe("Block Validation", () => {
    it("validates correct blocks", () => {
      const blocks = [new Uint8Array(64).fill(100), new Uint8Array(64).fill(200), new Uint8Array(64).fill(50)];

      const result = validateBlocks(blocks, COMPONENT_TYPES.LUMA);

      assert.equal(result.isValid, true);
      assert.equal(result.blockCount, 3);
      assert.equal(result.invalidBlocks.length, 0);
      assert.equal(result.statistics.minValue, 50);
      assert.equal(result.statistics.maxValue, 200);
      assert.equal(result.statistics.meanValue, 116.67);
      assert.equal(result.statistics.valueRange, 150);
    });

    it("detects invalid blocks", () => {
      const blocks = [
        new Uint8Array(64).fill(100), // Valid
        new Uint8Array(63).fill(200), // Invalid size
        "not-array", // Invalid type
      ];

      const result = validateBlocks(blocks, COMPONENT_TYPES.LUMA);

      assert.equal(result.isValid, false);
      assert.equal(result.blockCount, 3);
      assert.equal(result.invalidBlocks.length, 2); // Blocks 1, 2 are invalid
      assert.deepEqual(result.invalidBlocks, [1, 2]);
    });

    it("handles empty block array", () => {
      const result = validateBlocks([], COMPONENT_TYPES.LUMA);

      assert.equal(result.isValid, true);
      assert.equal(result.blockCount, 0);
      assert.equal(result.invalidBlocks.length, 0);
    });

    it("throws on invalid input", () => {
      assert.throws(() => {
        validateBlocks("not-array", COMPONENT_TYPES.LUMA);
      }, /Blocks must be an array/);
    });
  });

  describe("Block Layout Optimization", () => {
    it("optimizes block layout", () => {
      const blocks = [
        new Uint8Array(64).fill(1),
        new Uint8Array(64).fill(2),
        new Uint8Array(64).fill(3),
        new Uint8Array(64).fill(4),
      ];

      const result = optimizeBlockLayout(blocks, 2, 2, "cache");

      assert(Array.isArray(result.optimizedBlocks));
      assert.equal(result.optimizedBlocks.length, 4);
      assert(Array.isArray(result.reorderMap));
      assert.equal(result.reorderMap.length, 4);
      assert(typeof result.cacheEfficiency === "number");
    });

    it("validates optimization parameters", () => {
      assert.throws(() => {
        optimizeBlockLayout("not-array", 2, 2);
      }, /Blocks must be an array/);

      assert.throws(() => {
        optimizeBlockLayout([1, 2, 3], 2, 2);
      }, /Block count mismatch/);
    });
  });

  describe("Integration and Edge Cases", () => {
    it("handles minimum size images", () => {
      const { yData, cbData, crData } = createTestYCbCrData(1, 1, 1, 1);

      const result = segmentYcbcrBlocks(yData, cbData, crData, 1, 1, 1, 1, 1, 1);

      // Should pad to 8×8 and create single blocks
      assert.equal(result.yBlocks.length, 1);
      assert.equal(result.cbBlocks.length, 1);
      assert.equal(result.crBlocks.length, 1);
    });

    it("handles large images efficiently", () => {
      const { yData, cbData, crData } = createTestYCbCrData(64, 64, 32, 32);

      const startTime = performance.now();
      const result = segmentYcbcrBlocks(yData, cbData, crData, 64, 64, 32, 32, 32, 32);
      const endTime = performance.now();

      assert.equal(result.yBlocks.length, 64); // 8×8 blocks
      assert.equal(result.cbBlocks.length, 16); // 4×4 blocks
      assert.equal(result.crBlocks.length, 16); // 4×4 blocks
      assert(endTime - startTime < 100); // Should be fast
    });

    it("maintains data integrity", () => {
      const { yData, cbData, crData } = createTestYCbCrData(16, 16, 8, 8);

      const result = segmentYcbcrBlocks(yData, cbData, crData, 16, 16, 8, 8, 8, 8);

      // Validate all blocks
      const yValidation = validateBlocks(result.yBlocks, COMPONENT_TYPES.LUMA);
      const cbValidation = validateBlocks(result.cbBlocks, COMPONENT_TYPES.CHROMA);
      const crValidation = validateBlocks(result.crBlocks, COMPONENT_TYPES.CHROMA);

      assert(yValidation.isValid);
      assert(cbValidation.isValid);
      assert(crValidation.isValid);
    });

    it("works with all options combinations", () => {
      const { yData, cbData, crData } = createTestYCbCrData(15, 15, 7, 7);

      const options = {
        paddingMode: PADDING_MODES.REFLECT,
        extractionMode: EXTRACTION_MODES.CACHE_OPTIMIZED,
        preserveBoundaries: false,
        optimizeMemory: false,
        validateBlocks: false,
      };

      const result = segmentYcbcrBlocks(yData, cbData, crData, 15, 15, 7, 7, 7, 7, options);

      assert(Array.isArray(result.yBlocks));
      assert(Array.isArray(result.cbBlocks));
      assert(Array.isArray(result.crBlocks));
      assert.equal(result.metadata.paddingMode, PADDING_MODES.REFLECT);
      assert.equal(result.metadata.extractionMode, EXTRACTION_MODES.CACHE_OPTIMIZED);
    });

    /**
     * Create test YCbCr data.
     * @param {number} yWidth - Y width
     * @param {number} yHeight - Y height
     * @param {number} cbWidth - Cb width
     * @param {number} cbHeight - Cb height
     * @returns {{yData: Uint8Array, cbData: Uint8Array, crData: Uint8Array}} Test data
     */
    function createTestYCbCrData(yWidth, yHeight, cbWidth, cbHeight) {
      const yData = new Uint8Array(yWidth * yHeight).fill(0).map((_, i) => i % 256);
      const cbData = new Uint8Array(cbWidth * cbHeight).fill(128);
      const crData = new Uint8Array(cbWidth * cbHeight).fill(128);

      return { yData, cbData, crData };
    }
  });
});
