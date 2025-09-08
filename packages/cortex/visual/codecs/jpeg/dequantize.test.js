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
  clampDCTCoefficient,
  dequantizeBlock,
  dequantizeBlockMatrix,
  dequantizeBlocks,
  getDequantizationSummary,
  MAX_DCT_COEFFICIENT,
  MIN_DCT_COEFFICIENT,
  matrixToZigzag,
  ProgressiveDequantizer,
  ZIGZAG_ORDER,
  zigzagToMatrix,
} from "./dequantize.js";

describe("JPEG Coefficient Dequantization", () => {
  describe("Constants and Utilities", () => {
    it("defines correct block size", () => {
      assert.equal(BLOCK_SIZE, 64);
    });

    it("defines correct DCT coefficient bounds", () => {
      assert.equal(MAX_DCT_COEFFICIENT, 2047);
      assert.equal(MIN_DCT_COEFFICIENT, -2048);
    });

    it("defines correct zigzag order", () => {
      assert.equal(ZIGZAG_ORDER.length, 64);
      assert.equal(ZIGZAG_ORDER[0], 0); // DC coefficient
      assert.equal(ZIGZAG_ORDER[1], 1); // First AC coefficient

      // Verify all indices 0-63 are present exactly once
      const sorted = [...ZIGZAG_ORDER].sort((a, b) => a - b);
      for (let i = 0; i < 64; i++) {
        assert.equal(sorted[i], i);
      }
    });

    it("clamps DCT coefficients correctly", () => {
      assert.equal(clampDCTCoefficient(0), 0);
      assert.equal(clampDCTCoefficient(1000), 1000);
      assert.equal(clampDCTCoefficient(-1000), -1000);

      // Test overflow
      assert.equal(clampDCTCoefficient(3000), MAX_DCT_COEFFICIENT);
      assert.equal(clampDCTCoefficient(-3000), MIN_DCT_COEFFICIENT);

      // Test boundary values
      assert.equal(clampDCTCoefficient(MAX_DCT_COEFFICIENT), MAX_DCT_COEFFICIENT);
      assert.equal(clampDCTCoefficient(MIN_DCT_COEFFICIENT), MIN_DCT_COEFFICIENT);
      assert.equal(clampDCTCoefficient(MAX_DCT_COEFFICIENT + 1), MAX_DCT_COEFFICIENT);
      assert.equal(clampDCTCoefficient(MIN_DCT_COEFFICIENT - 1), MIN_DCT_COEFFICIENT);
    });
  });

  describe("Zigzag Conversion", () => {
    it("converts zigzag to 8x8 matrix", () => {
      const zigzagArray = new Array(64).fill(0).map((_, i) => i);
      const matrix = zigzagToMatrix(zigzagArray);

      assert.equal(matrix.length, 8);
      assert.equal(matrix[0].length, 8);

      // Check specific positions
      assert.equal(matrix[0][0], 0); // DC coefficient
      assert.equal(matrix[0][1], 1); // First AC
      assert.equal(matrix[1][0], 2); // Zigzag pattern (zigzagArray[2] -> natural index 8)
      assert.equal(matrix[7][7], 63); // Last coefficient
    });

    it("converts 8x8 matrix to zigzag", () => {
      const matrix = Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => row * 8 + col));

      const zigzagArray = matrixToZigzag(matrix);

      assert.equal(zigzagArray.length, 64);
      assert.equal(zigzagArray[0], 0); // DC coefficient
      assert.equal(zigzagArray[1], 1); // First AC
      assert.equal(zigzagArray[2], 8); // Zigzag pattern
    });

    it("zigzag conversion is reversible", () => {
      const originalArray = new Array(64).fill(0).map((_, i) => i + 1);
      const matrix = zigzagToMatrix(originalArray);
      const convertedBack = matrixToZigzag(matrix);

      assert.deepEqual(convertedBack, originalArray);
    });

    it("throws on invalid zigzag array", () => {
      assert.throws(() => {
        zigzagToMatrix([1, 2, 3]); // Wrong size
      }, /Expected 64-element zigzag table/);

      assert.throws(() => {
        zigzagToMatrix("not array");
      }, /Expected 64-element zigzag table/);
    });

    it("throws on invalid matrix", () => {
      assert.throws(() => {
        matrixToZigzag([
          [1, 2],
          [3, 4],
        ]); // Wrong size
      }, /Expected 8x8 matrix/);

      assert.throws(() => {
        matrixToZigzag("not array");
      }, /Expected 8x8 matrix/);

      assert.throws(() => {
        matrixToZigzag([1, 2, 3, 4, 5, 6, 7, 8]); // Not 2D
      }, /Expected 8x8 matrix/);
    });
  });

  describe("Single Block Dequantization", () => {
    it("dequantizes block correctly", () => {
      const quantizedBlock = [10, 5, 0, 2, 0, 0, 0, 0, ...new Array(56).fill(0)];
      const quantizationTable = [16, 11, 10, 16, 24, 40, 51, 61, ...new Array(56).fill(1)];

      const result = dequantizeBlock(quantizedBlock, quantizationTable, 0, 63, false);

      assert.equal(result[0], 160); // 10 * 16
      assert.equal(result[1], 55); // 5 * 11
      assert.equal(result[2], 0); // 0 * 10
      assert.equal(result[3], 32); // 2 * 16
      assert.equal(result[4], 0); // 0 * 24

      // Original block should be unchanged
      assert.equal(quantizedBlock[0], 10);
    });

    it("dequantizes block in-place", () => {
      const quantizedBlock = [10, 5, 0, 2, ...new Array(60).fill(0)];
      const quantizationTable = [16, 11, 10, 16, ...new Array(60).fill(1)];

      const result = dequantizeBlock(quantizedBlock, quantizationTable, 0, 63, true);

      // Should return same array reference
      assert.equal(result, quantizedBlock);
      assert.equal(quantizedBlock[0], 160); // Modified in-place
      assert.equal(quantizedBlock[1], 55);
    });

    it("handles partial coefficient ranges", () => {
      const quantizedBlock = new Array(64).fill(0).map((_, i) => i + 1);
      const quantizationTable = new Array(64).fill(2);

      const result = dequantizeBlock(quantizedBlock, quantizationTable, 10, 20, false);

      // Only coefficients 10-20 should be dequantized
      for (let i = 0; i < 10; i++) {
        assert.equal(result[i], i + 1); // Unchanged
      }
      for (let i = 10; i <= 20; i++) {
        assert.equal(result[i], (i + 1) * 2); // Dequantized
      }
      for (let i = 21; i < 64; i++) {
        assert.equal(result[i], i + 1); // Unchanged
      }
    });

    it("handles coefficient overflow", () => {
      const quantizedBlock = [1000, -1000, ...new Array(62).fill(0)];
      const quantizationTable = [10, 10, ...new Array(62).fill(1)];

      const result = dequantizeBlock(quantizedBlock, quantizationTable);

      // Should clamp to valid DCT range
      assert.equal(result[0], MAX_DCT_COEFFICIENT); // 10000 clamped to 2047
      assert.equal(result[1], MIN_DCT_COEFFICIENT); // -10000 clamped to -2048
    });

    it("skips zero coefficients efficiently", () => {
      const quantizedBlock = [10, 0, 0, 0, 5, ...new Array(59).fill(0)];
      const quantizationTable = [16, 11, 10, 16, 24, ...new Array(59).fill(1)];

      const result = dequantizeBlock(quantizedBlock, quantizationTable);

      assert.equal(result[0], 160); // 10 * 16
      assert.equal(result[1], 0); // 0 * 11 = 0
      assert.equal(result[2], 0); // 0 * 10 = 0
      assert.equal(result[3], 0); // 0 * 16 = 0
      assert.equal(result[4], 120); // 5 * 24
    });

    it("throws on invalid block", () => {
      const quantizationTable = new Array(64).fill(1);

      assert.throws(() => {
        dequantizeBlock([1, 2, 3], quantizationTable); // Wrong size
      }, /Expected 64-element quantized coefficient block/);

      assert.throws(() => {
        dequantizeBlock("not array", quantizationTable);
      }, /Expected 64-element quantized coefficient block/);
    });

    it("throws on invalid quantization table", () => {
      const quantizedBlock = new Array(64).fill(0);

      assert.throws(() => {
        dequantizeBlock(quantizedBlock, [1, 2, 3]); // Wrong size
      }, /Expected 64-element quantization table/);

      assert.throws(() => {
        dequantizeBlock(quantizedBlock, "not array");
      }, /Expected 64-element quantization table/);
    });

    it("throws on invalid coefficient range", () => {
      const quantizedBlock = new Array(64).fill(0);
      const quantizationTable = new Array(64).fill(1);

      assert.throws(() => {
        dequantizeBlock(quantizedBlock, quantizationTable, -1, 63);
      }, /Invalid coefficient range/);

      assert.throws(() => {
        dequantizeBlock(quantizedBlock, quantizationTable, 0, 64);
      }, /Invalid coefficient range/);

      assert.throws(() => {
        dequantizeBlock(quantizedBlock, quantizationTable, 10, 5);
      }, /Invalid coefficient range/);
    });

    it("throws on invalid quantization values", () => {
      const quantizedBlock = [10, 5, ...new Array(62).fill(0)];
      const quantizationTable = [16, 0, ...new Array(62).fill(1)]; // Zero at index 1

      assert.throws(() => {
        dequantizeBlock(quantizedBlock, quantizationTable);
      }, /Invalid quantization value 0 at index 1/);
    });
  });

  describe("Multiple Block Dequantization", () => {
    it("dequantizes multiple blocks", () => {
      const quantizedBlocks = [
        [10, 5, ...new Array(62).fill(0)],
        [20, 10, ...new Array(62).fill(0)],
        [30, 15, ...new Array(62).fill(0)],
      ];
      const quantizationTable = [16, 11, ...new Array(62).fill(1)];

      const result = dequantizeBlocks(quantizedBlocks, quantizationTable, 0, 63, false);

      assert.equal(result.length, 3);
      assert.equal(result[0][0], 160); // 10 * 16
      assert.equal(result[0][1], 55); // 5 * 11
      assert.equal(result[1][0], 320); // 20 * 16
      assert.equal(result[1][1], 110); // 10 * 11
      assert.equal(result[2][0], 480); // 30 * 16
      assert.equal(result[2][1], 165); // 15 * 11

      // Original blocks should be unchanged
      assert.equal(quantizedBlocks[0][0], 10);
    });

    it("dequantizes multiple blocks in-place", () => {
      const quantizedBlocks = [
        [10, 5, ...new Array(62).fill(0)],
        [20, 10, ...new Array(62).fill(0)],
      ];
      const quantizationTable = [16, 11, ...new Array(62).fill(1)];

      const result = dequantizeBlocks(quantizedBlocks, quantizationTable, 0, 63, true);

      // Should return same array reference
      assert.equal(result, quantizedBlocks);
      assert.equal(quantizedBlocks[0][0], 160); // Modified in-place
      assert.equal(quantizedBlocks[1][0], 320);
    });

    it("handles empty block array", () => {
      const quantizationTable = new Array(64).fill(1);
      const result = dequantizeBlocks([], quantizationTable);

      assert.deepEqual(result, []);
    });

    it("handles partial coefficient ranges for multiple blocks", () => {
      const quantizedBlocks = [
        new Array(64).fill(0).map((_, i) => i + 1),
        new Array(64).fill(0).map((_, i) => (i + 1) * 2),
      ];
      const quantizationTable = new Array(64).fill(2);

      const result = dequantizeBlocks(quantizedBlocks, quantizationTable, 5, 10, false);

      // Only coefficients 5-10 should be dequantized
      for (let blockIndex = 0; blockIndex < 2; blockIndex++) {
        for (let i = 0; i < 5; i++) {
          assert.equal(result[blockIndex][i], quantizedBlocks[blockIndex][i]); // Unchanged
        }
        for (let i = 5; i <= 10; i++) {
          assert.equal(result[blockIndex][i], quantizedBlocks[blockIndex][i] * 2); // Dequantized
        }
        for (let i = 11; i < 64; i++) {
          assert.equal(result[blockIndex][i], quantizedBlocks[blockIndex][i]); // Unchanged
        }
      }
    });

    it("throws on invalid blocks array", () => {
      const quantizationTable = new Array(64).fill(1);

      assert.throws(() => {
        dequantizeBlocks("not array", quantizationTable);
      }, /Expected array of quantized blocks/);
    });

    it("throws on invalid quantization table", () => {
      const quantizedBlocks = [[...new Array(64).fill(0)]];

      assert.throws(() => {
        dequantizeBlocks(quantizedBlocks, [1, 2, 3]); // Wrong size
      }, /Expected 64-element quantization table/);
    });
  });

  describe("Matrix-based Dequantization", () => {
    it("dequantizes with 2D quantization matrix", () => {
      const quantizedBlock = [10, 5, 0, 2, ...new Array(60).fill(0)];
      const quantizationMatrix = Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => row * 8 + col + 1)
      );

      const result = dequantizeBlockMatrix(quantizedBlock, quantizationMatrix, 0, 63, false);

      // Should match regular dequantization with converted table
      const expectedTable = matrixToZigzag(quantizationMatrix);
      const expected = dequantizeBlock(quantizedBlock, expectedTable, 0, 63, false);

      assert.deepEqual(result, expected);
    });

    it("throws on invalid quantization matrix", () => {
      const quantizedBlock = new Array(64).fill(0);

      assert.throws(() => {
        dequantizeBlockMatrix(quantizedBlock, [
          [1, 2],
          [3, 4],
        ]); // Wrong size
      }, /Expected 8x8 matrix/);
    });
  });

  describe("Progressive Dequantization", () => {
    const createTestTable = () => new Array(64).fill(0).map((_, i) => (i % 16) + 1);

    it("creates progressive dequantizer", () => {
      const table = createTestTable();
      const dequantizer = new ProgressiveDequantizer(table, 0, 63, 0, 0);

      assert.equal(dequantizer.spectralStart, 0);
      assert.equal(dequantizer.spectralEnd, 63);
      assert.equal(dequantizer.approximationHigh, 0);
      assert.equal(dequantizer.approximationLow, 0);
      assert.equal(dequantizer.isFirstScan, true);
      assert.equal(dequantizer.isRefinementScan, false);
    });

    it("handles first scan dequantization", () => {
      const table = createTestTable();
      const dequantizer = new ProgressiveDequantizer(table, 0, 10, 0, 2);

      const quantizedBlock = [10, 5, 0, 2, ...new Array(60).fill(0)];
      const result = dequantizer.dequantizeProgressiveBlock(quantizedBlock, false);

      // Should dequantize and apply bit shift
      assert.equal(result[0], (10 * table[0]) << 2); // Shifted by Al=2
      assert.equal(result[1], (5 * table[1]) << 2);
      assert.equal(result[3], (2 * table[3]) << 2);

      // Coefficients outside range should be unchanged
      assert.equal(result[11], 0);
    });

    it("handles refinement scan dequantization", () => {
      const table = createTestTable();
      const dequantizer = new ProgressiveDequantizer(table, 1, 10, 2, 1);

      // In refinement scan, block contains refinement bits (0, 1, -1)
      const quantizedBlock = [0, 1, 0, -1, 1, ...new Array(59).fill(0)];
      const result = dequantizer.dequantizeProgressiveBlock(quantizedBlock, false);

      // Should add refinement bits at bit position Al=1
      assert.equal(result[0], 0); // Outside range
      assert.equal(result[1], 1 << 1); // Refinement bit 1 at position Al=1 = 2
      assert.equal(result[2], 0);
      assert.equal(result[3], -1 << 1); // Refinement bit -1 at position Al=1 = -2
      assert.equal(result[4], 1 << 1); // Refinement bit 1 at position Al=1 = 2
    });

    it("handles DC-only progressive scan", () => {
      const table = createTestTable();
      const dequantizer = new ProgressiveDequantizer(table, 0, 0, 0, 0);

      const quantizedBlock = [50, ...new Array(63).fill(0)];
      const result = dequantizer.dequantizeProgressiveBlock(quantizedBlock, false);

      assert.equal(result[0], 50 * table[0]); // DC dequantized
      for (let i = 1; i < 64; i++) {
        assert.equal(result[i], 0); // AC unchanged
      }
    });

    it("handles AC-only progressive scan", () => {
      const table = createTestTable();
      const dequantizer = new ProgressiveDequantizer(table, 1, 63, 0, 0);

      const quantizedBlock = [100, 10, 5, 0, 2, ...new Array(59).fill(0)];
      const result = dequantizer.dequantizeProgressiveBlock(quantizedBlock, false);

      assert.equal(result[0], 100); // DC unchanged
      assert.equal(result[1], 10 * table[1]); // AC dequantized
      assert.equal(result[2], 5 * table[2]);
      assert.equal(result[4], 2 * table[4]);
    });

    it("generates progressive summary", () => {
      const table = createTestTable();
      const dequantizer = new ProgressiveDequantizer(table, 1, 10, 2, 1);

      const summary = dequantizer.getSummary();

      assert.equal(summary.spectralRange, "1-10");
      assert.equal(summary.approximationBits, "Ah=2, Al=1");
      assert.equal(summary.scanType, "refinement");
      assert.equal(summary.coefficientCount, 10);
      assert(summary.description.includes("Progressive dequantizer"));
    });

    it("throws on invalid parameters", () => {
      const table = createTestTable();

      assert.throws(() => {
        new ProgressiveDequantizer([1, 2, 3], 0, 63, 0, 0); // Wrong table size
      }, /Expected 64-element quantization table/);

      assert.throws(() => {
        new ProgressiveDequantizer(table, -1, 63, 0, 0); // Invalid spectral range
      }, /Invalid spectral range/);

      assert.throws(() => {
        new ProgressiveDequantizer(table, 0, 63, -1, 0); // Invalid approximation
      }, /Invalid approximation bits/);

      assert.throws(() => {
        new ProgressiveDequantizer(table, 0, 63, 0, 14); // Invalid approximation
      }, /Invalid approximation bits/);
    });
  });

  describe("Dequantization Summary", () => {
    it("generates summary information", () => {
      const quantizationTable = [16, 11, 10, 16, 24, 40, 51, 61, ...new Array(56).fill(1)];
      const summary = getDequantizationSummary(quantizationTable, 5, 0, 63);

      assert.equal(summary.blockCount, 5);
      assert.equal(summary.coefficientRange, "0-63");
      assert.equal(summary.coefficientCount, 64);
      assert.equal(summary.totalCoefficients, 320); // 5 * 64

      assert.equal(summary.quantizationStats.minValue, 1);
      assert.equal(summary.quantizationStats.maxValue, 61);
      assert.equal(summary.quantizationStats.nonZeroCount, 64);
      assert(summary.description.includes("5 blocks"));
    });

    it("handles partial coefficient range in summary", () => {
      const quantizationTable = new Array(64).fill(10);
      const summary = getDequantizationSummary(quantizationTable, 3, 10, 20);

      assert.equal(summary.coefficientRange, "10-20");
      assert.equal(summary.coefficientCount, 11); // 20 - 10 + 1
      assert.equal(summary.totalCoefficients, 33); // 3 * 11
    });

    it("throws on invalid quantization table", () => {
      assert.throws(() => {
        getDequantizationSummary([1, 2, 3], 1); // Wrong size
      }, TypeError);

      assert.throws(() => {
        getDequantizationSummary("not array", 1);
      }, TypeError);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles maximum coefficient values", () => {
      const quantizedBlock = [MAX_DCT_COEFFICIENT, MIN_DCT_COEFFICIENT, ...new Array(62).fill(0)];
      const quantizationTable = [1, 1, ...new Array(62).fill(1)];

      const result = dequantizeBlock(quantizedBlock, quantizationTable);

      assert.equal(result[0], MAX_DCT_COEFFICIENT);
      assert.equal(result[1], MIN_DCT_COEFFICIENT);
    });

    it("handles large quantization values", () => {
      const quantizedBlock = [1, -1, ...new Array(62).fill(0)];
      const quantizationTable = [255, 255, ...new Array(62).fill(1)];

      const result = dequantizeBlock(quantizedBlock, quantizationTable);

      assert.equal(result[0], 255); // 1 * 255
      assert.equal(result[1], -255); // -1 * 255
    });

    it("handles boundary coefficient ranges", () => {
      const quantizedBlock = new Array(64).fill(1);
      const quantizationTable = new Array(64).fill(2);

      // Test single coefficient
      const result1 = dequantizeBlock(quantizedBlock, quantizationTable, 63, 63, false);
      assert.equal(result1[63], 2);
      for (let i = 0; i < 63; i++) {
        assert.equal(result1[i], 1); // Unchanged
      }

      // Test full range
      const result2 = dequantizeBlock(quantizedBlock, quantizationTable, 0, 63, false);
      for (let i = 0; i < 64; i++) {
        assert.equal(result2[i], 2); // All dequantized
      }
    });

    it("preserves coefficient precision", () => {
      const quantizedBlock = [1, 2, 3, 4, 5, ...new Array(59).fill(0)];
      const quantizationTable = [10, 20, 30, 40, 50, ...new Array(59).fill(1)];

      const result = dequantizeBlock(quantizedBlock, quantizationTable);

      assert.equal(result[0], 10); // 1 * 10
      assert.equal(result[1], 40); // 2 * 20
      assert.equal(result[2], 90); // 3 * 30
      assert.equal(result[3], 160); // 4 * 40
      assert.equal(result[4], 250); // 5 * 50
    });
  });
});
