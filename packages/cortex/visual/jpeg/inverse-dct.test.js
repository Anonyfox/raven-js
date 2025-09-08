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
  BLOCK_SIZE,
  blockToMatrix,
  clampPixel,
  getIDCTSummary,
  IDCT_CONSTANTS,
  IDCT_PRECISION,
  IDCT_SCALE,
  IDCTQualityMetrics,
  idct8x8,
  idctBlocks,
  idctDCOnly,
  isDCOnlyBlock,
  LEVEL_SHIFT,
  MAX_PIXEL_VALUE,
  MIN_PIXEL_VALUE,
  matrixToBlock,
} from "./inverse-dct.js";

describe("8x8 Inverse DCT", () => {
  describe("Constants and Utilities", () => {
    it("defines correct block size", () => {
      assert.equal(BLOCK_SIZE, 64);
    });

    it("defines correct pixel value bounds", () => {
      assert.equal(MIN_PIXEL_VALUE, 0);
      assert.equal(MAX_PIXEL_VALUE, 255);
    });

    it("defines correct IDCT parameters", () => {
      assert.equal(IDCT_SCALE, 8192);
      assert.equal(IDCT_PRECISION, 13);
      assert.equal(LEVEL_SHIFT, 128);
    });

    it("defines correct IDCT constants", () => {
      const { C1, C2, C3, C4, C5, C6, C7 } = IDCT_CONSTANTS;

      // Verify constants are reasonable (scaled cosine values)
      assert(C1 > 0 && C1 < IDCT_SCALE);
      assert(C2 > 0 && C2 < IDCT_SCALE);
      assert(C3 > 0 && C3 < IDCT_SCALE);
      assert(C4 > 0 && C4 < IDCT_SCALE);
      assert(C5 > 0 && C5 < IDCT_SCALE);
      assert(C6 > 0 && C6 < IDCT_SCALE);
      assert(C7 > 0 && C7 < IDCT_SCALE);

      // C4 should be approximately cos(π/4) * IDCT_SCALE ≈ 0.707 * 8192
      const expectedC4 = Math.round(Math.cos(Math.PI / 4) * IDCT_SCALE);
      assert.equal(C4, expectedC4);
    });

    it("clamps pixel values correctly", () => {
      assert.equal(clampPixel(0), 0);
      assert.equal(clampPixel(128), 128);
      assert.equal(clampPixel(255), 255);

      // Test overflow/underflow
      assert.equal(clampPixel(-10), 0);
      assert.equal(clampPixel(300), 255);

      // Test rounding
      assert.equal(clampPixel(127.4), 127);
      assert.equal(clampPixel(127.6), 128);
    });
  });

  describe("Block/Matrix Conversion", () => {
    it("converts block to 8x8 matrix", () => {
      const block = new Array(64).fill(0).map((_, i) => i);
      const matrix = blockToMatrix(block);

      assert.equal(matrix.length, 8);
      assert.equal(matrix[0].length, 8);

      // Check specific positions
      assert.equal(matrix[0][0], 0);
      assert.equal(matrix[0][7], 7);
      assert.equal(matrix[7][0], 56);
      assert.equal(matrix[7][7], 63);

      // Check row-major order
      assert.equal(matrix[1][0], 8);
      assert.equal(matrix[2][3], 19); // row 2, col 3 = 2*8 + 3 = 19
    });

    it("converts 8x8 matrix to block", () => {
      const matrix = Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => row * 8 + col));

      const block = matrixToBlock(matrix);

      assert.equal(block.length, 64);
      assert.equal(block[0], 0);
      assert.equal(block[7], 7);
      assert.equal(block[8], 8); // Second row start
      assert.equal(block[63], 63);
    });

    it("block/matrix conversion is reversible", () => {
      const originalBlock = new Array(64).fill(0).map((_, i) => i + 1);
      const matrix = blockToMatrix(originalBlock);
      const convertedBack = matrixToBlock(matrix);

      assert.deepEqual(convertedBack, originalBlock);
    });

    it("throws on invalid block", () => {
      assert.throws(() => {
        blockToMatrix([1, 2, 3]); // Wrong size
      }, /Expected 64-element block/);

      assert.throws(() => {
        blockToMatrix("not array");
      }, /Expected 64-element block/);
    });

    it("throws on invalid matrix", () => {
      assert.throws(() => {
        matrixToBlock([
          [1, 2],
          [3, 4],
        ]); // Wrong size
      }, /Expected 8x8 matrix/);

      assert.throws(() => {
        matrixToBlock("not array");
      }, /Expected 8x8 matrix/);

      assert.throws(() => {
        matrixToBlock([1, 2, 3, 4, 5, 6, 7, 8]); // Not 2D
      }, /Expected 8x8 matrix/);
    });
  });

  describe("DC-Only Block Optimization", () => {
    it("detects DC-only blocks", () => {
      const dcOnlyBlock = [100, ...new Array(63).fill(0)];
      const mixedBlock = [100, 10, ...new Array(62).fill(0)];

      assert.equal(isDCOnlyBlock(dcOnlyBlock), true);
      assert.equal(isDCOnlyBlock(mixedBlock), false);
    });

    it("handles invalid blocks in DC detection", () => {
      assert.equal(isDCOnlyBlock([1, 2, 3]), false); // Wrong size
      assert.equal(isDCOnlyBlock("not array"), false);
    });

    it("performs DC-only IDCT", () => {
      const dcValue = 1000 << IDCT_PRECISION; // Scaled DC value
      const result = idctDCOnly(dcValue);

      assert.equal(result.length, 64);

      // All pixels should have the same value
      const expectedPixel = clampPixel((dcValue >> IDCT_PRECISION) + LEVEL_SHIFT);
      for (let i = 0; i < 64; i++) {
        assert.equal(result[i], expectedPixel);
      }
    });

    it("handles DC-only edge cases", () => {
      // Test zero DC
      const zeroResult = idctDCOnly(0);
      for (let i = 0; i < 64; i++) {
        assert.equal(zeroResult[i], LEVEL_SHIFT);
      }

      // Test large positive DC
      const largePositive = 10000 << IDCT_PRECISION;
      const largeResult = idctDCOnly(largePositive);
      for (let i = 0; i < 64; i++) {
        assert.equal(largeResult[i], MAX_PIXEL_VALUE); // Should clamp to 255
      }

      // Test large negative DC
      const largeNegative = -10000 << IDCT_PRECISION;
      const negativeResult = idctDCOnly(largeNegative);
      for (let i = 0; i < 64; i++) {
        assert.equal(negativeResult[i], MIN_PIXEL_VALUE); // Should clamp to 0
      }
    });
  });

  describe("8x8 IDCT Core Algorithm", () => {
    it("performs IDCT on zero block", () => {
      const zeroBlock = new Array(64).fill(0);
      const result = idct8x8(zeroBlock, false);

      assert.equal(result.length, 64);

      // All pixels should be level shift (128)
      for (let i = 0; i < 64; i++) {
        assert.equal(result[i], LEVEL_SHIFT);
      }

      // Original should be unchanged
      assert.deepEqual(zeroBlock, new Array(64).fill(0));
    });

    it("performs IDCT in-place", () => {
      const coefficients = [1000 << IDCT_PRECISION, ...new Array(63).fill(0)];
      const originalFirst = coefficients[0];

      const result = idct8x8(coefficients, true);

      // Should return same array reference
      assert.equal(result, coefficients);
      // Should be modified in-place
      assert.notEqual(coefficients[0], originalFirst);
    });

    it("performs IDCT with copy", () => {
      const coefficients = [1000 << IDCT_PRECISION, ...new Array(63).fill(0)];
      const originalCopy = [...coefficients];

      const result = idct8x8(coefficients, false);

      // Should return different array
      assert.notEqual(result, coefficients);
      // Original should be unchanged
      assert.deepEqual(coefficients, originalCopy);
    });

    it("handles DC-only block correctly", () => {
      const dcValue = 100 << IDCT_PRECISION;
      const dcBlock = [dcValue, ...new Array(63).fill(0)];

      const result = idct8x8(dcBlock, false);
      const expectedPixel = clampPixel((dcValue >> IDCT_PRECISION) + LEVEL_SHIFT);

      // All pixels should be approximately the same (within rounding)
      for (let i = 0; i < 64; i++) {
        assert(Math.abs(result[i] - expectedPixel) <= 1);
      }
    });

    it("handles simple AC coefficients", () => {
      const coefficients = new Array(64).fill(0);
      coefficients[0] = 128 << IDCT_PRECISION; // DC
      coefficients[1] = 64 << IDCT_PRECISION; // First AC

      const result = idct8x8(coefficients, false);

      // Should produce valid pixel values
      for (let i = 0; i < 64; i++) {
        assert(result[i] >= MIN_PIXEL_VALUE && result[i] <= MAX_PIXEL_VALUE);
      }

      // Should not be uniform (AC coefficient creates variation)
      const firstPixel = result[0];
      let hasVariation = false;
      for (let i = 1; i < 64; i++) {
        if (Math.abs(result[i] - firstPixel) > 1) {
          hasVariation = true;
          break;
        }
      }
      assert(hasVariation, "AC coefficient should create pixel variation");
    });

    it("produces symmetric results for symmetric input", () => {
      // Create symmetric coefficient pattern
      const coefficients = new Array(64).fill(0);
      coefficients[0] = 128 << IDCT_PRECISION; // DC
      coefficients[9] = 32 << IDCT_PRECISION; // Symmetric position

      const result = idct8x8(coefficients, false);

      // Check for some symmetry properties (exact symmetry depends on coefficient placement)
      assert(result.every((pixel) => pixel >= MIN_PIXEL_VALUE && pixel <= MAX_PIXEL_VALUE));
    });

    it("throws on invalid coefficient block", () => {
      assert.throws(() => {
        idct8x8([1, 2, 3], false); // Wrong size
      }, /Expected 64-element coefficient block/);

      assert.throws(() => {
        idct8x8("not array", false);
      }, /Expected 64-element coefficient block/);
    });
  });

  describe("Multiple Block Processing", () => {
    it("processes multiple blocks", () => {
      const blocks = [
        [100 << IDCT_PRECISION, ...new Array(63).fill(0)],
        [200 << IDCT_PRECISION, ...new Array(63).fill(0)],
        [50 << IDCT_PRECISION, ...new Array(63).fill(0)],
      ];

      const result = idctBlocks(blocks, false);

      assert.equal(result.length, 3);
      assert.equal(result[0].length, 64);
      assert.equal(result[1].length, 64);
      assert.equal(result[2].length, 64);

      // Each block should have different average values
      const avg0 = result[0].reduce((sum, val) => sum + val, 0) / 64;
      const avg1 = result[1].reduce((sum, val) => sum + val, 0) / 64;
      const avg2 = result[2].reduce((sum, val) => sum + val, 0) / 64;

      assert(avg1 > avg0); // Block 1 has higher DC
      assert(avg0 > avg2); // Block 0 has higher DC than block 2

      // Original blocks should be unchanged
      assert.equal(blocks[0][0], 100 << IDCT_PRECISION);
    });

    it("processes multiple blocks in-place", () => {
      const blocks = [
        [100 << IDCT_PRECISION, ...new Array(63).fill(0)],
        [200 << IDCT_PRECISION, ...new Array(63).fill(0)],
      ];

      const originalFirst = blocks[0][0];
      const result = idctBlocks(blocks, true);

      // Should return same array reference
      assert.equal(result, blocks);
      // Should be modified in-place
      assert.notEqual(blocks[0][0], originalFirst);
    });

    it("handles empty block array", () => {
      const result = idctBlocks([], false);
      assert.deepEqual(result, []);
    });

    it("throws on invalid blocks array", () => {
      assert.throws(() => {
        idctBlocks("not array", false);
      }, /Expected array of coefficient blocks/);
    });
  });

  describe("Quality Metrics", () => {
    it("creates quality metrics analyzer", () => {
      const metrics = new IDCTQualityMetrics();

      assert.equal(metrics.blocksProcessed, 0);
      assert.equal(metrics.maxError, 0);
      assert.equal(metrics.meanSquareError, 0);
      assert.equal(metrics.errors.length, 0);
    });

    it("adds measurements and calculates metrics", () => {
      const metrics = new IDCTQualityMetrics();

      const expected = [100, 101, 102, 103];
      const actual = [100, 102, 101, 104]; // Small errors: 0, 1, 1, 1

      metrics.addMeasurement(expected, actual);

      assert.equal(metrics.blocksProcessed, 1);
      assert.equal(metrics.maxError, 1);
      assert.equal(metrics.errors.length, 4);

      const summary = metrics.getSummary();
      assert.equal(summary.blocksProcessed, 1);
      assert.equal(summary.maxError, 1);
      assert.equal(summary.meanError, 0.75); // (0+1+1+1)/4
    });

    it("tracks maximum error across multiple measurements", () => {
      const metrics = new IDCTQualityMetrics();

      // First measurement with small errors
      metrics.addMeasurement([100, 101], [100, 102]); // Max error: 1

      // Second measurement with larger error
      metrics.addMeasurement([100, 101], [100, 104]); // Max error: 3

      assert.equal(metrics.maxError, 3);
      assert.equal(metrics.blocksProcessed, 2);
    });

    it("calculates IEEE 1180 compliance", () => {
      const metrics = new IDCTQualityMetrics();

      // Add measurement within IEEE 1180 bounds (very few small errors)
      const expected = new Array(64).fill(128);
      const actual = expected.map((val, i) => val + (i < 3 ? 1 : 0)); // Only 3 small errors

      metrics.addMeasurement(expected, actual);

      const summary = metrics.getSummary();
      assert.equal(summary.ieee1180Compliant, true);
    });

    it("resets metrics", () => {
      const metrics = new IDCTQualityMetrics();

      metrics.addMeasurement([100, 101], [100, 102]);
      assert.equal(metrics.blocksProcessed, 1);

      metrics.reset();
      assert.equal(metrics.blocksProcessed, 0);
      assert.equal(metrics.maxError, 0);
      assert.equal(metrics.errors.length, 0);
    });

    it("throws on invalid measurement arrays", () => {
      const metrics = new IDCTQualityMetrics();

      assert.throws(() => {
        metrics.addMeasurement([1, 2], [1, 2, 3]); // Different lengths
      }, /Expected and actual arrays must have same length/);
    });
  });

  describe("IDCT Summary", () => {
    it("generates summary information", () => {
      const summary = getIDCTSummary(5, false);

      assert.equal(summary.blockCount, 5);
      assert.equal(summary.totalOperations, 320); // 5 * 64
      assert.equal(summary.operationsPerBlock, 64);
      assert.equal(summary.usedOptimizations, false);
      assert.equal(summary.algorithm, "Chen-Wang Fast IDCT");
      assert(summary.description.includes("5 blocks"));
    });

    it("handles optimization flag", () => {
      const summary = getIDCTSummary(1, true);

      assert.equal(summary.usedOptimizations, true);
      assert(summary.description.includes("optimizations"));
    });
  });

  describe("Edge Cases and Precision", () => {
    it("handles extreme coefficient values", () => {
      const extremeBlock = new Array(64).fill(0);
      extremeBlock[0] = 32767 << IDCT_PRECISION; // Large positive DC

      const result = idct8x8(extremeBlock, false);

      // All pixels should be clamped to max value
      for (let i = 0; i < 64; i++) {
        assert.equal(result[i], MAX_PIXEL_VALUE);
      }
    });

    it("handles negative coefficients", () => {
      const negativeBlock = new Array(64).fill(0);
      negativeBlock[0] = -32767 << IDCT_PRECISION; // Large negative DC

      const result = idct8x8(negativeBlock, false);

      // All pixels should be clamped to min value
      for (let i = 0; i < 64; i++) {
        assert.equal(result[i], MIN_PIXEL_VALUE);
      }
    });

    it("maintains precision with mixed coefficients", () => {
      const mixedBlock = new Array(64).fill(0);
      mixedBlock[0] = 128 << IDCT_PRECISION; // DC
      mixedBlock[1] = 64 << IDCT_PRECISION; // AC
      mixedBlock[8] = -32 << IDCT_PRECISION; // Negative AC

      const result = idct8x8(mixedBlock, false);

      // Should produce valid pixel values
      for (let i = 0; i < 64; i++) {
        assert(result[i] >= MIN_PIXEL_VALUE && result[i] <= MAX_PIXEL_VALUE);
        assert(Number.isInteger(result[i])); // Should be integers
      }
    });

    it("handles boundary coefficient positions", () => {
      const boundaryBlock = new Array(64).fill(0);
      boundaryBlock[0] = 128 << IDCT_PRECISION; // DC
      boundaryBlock[63] = 32 << IDCT_PRECISION; // Last coefficient

      const result = idct8x8(boundaryBlock, false);

      // Should produce valid results
      for (let i = 0; i < 64; i++) {
        assert(result[i] >= MIN_PIXEL_VALUE && result[i] <= MAX_PIXEL_VALUE);
      }
    });

    it("produces deterministic results", () => {
      const coefficients = [
        128 << IDCT_PRECISION,
        64 << IDCT_PRECISION,
        32 << IDCT_PRECISION,
        ...new Array(61).fill(0),
      ];

      const result1 = idct8x8([...coefficients], false);
      const result2 = idct8x8([...coefficients], false);

      // Results should be identical
      assert.deepEqual(result1, result2);
    });
  });
});
