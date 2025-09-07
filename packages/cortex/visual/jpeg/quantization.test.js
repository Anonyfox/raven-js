/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for JPEG quantization tables and quality control.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  analyzeQuantizationTable,
  createCustomQuantizationTable,
  createQuantizationTables,
  dequantizeBlock,
  quantizeBlock,
  STANDARD_CHROMINANCE_TABLE,
  STANDARD_LUMINANCE_TABLE,
  scaleQuantizationTable,
  validateQuality,
  validateQuantizationTable,
} from "./quantization.js";

describe("JPEG Quantization", () => {
  describe("Standard Tables", () => {
    it("provides valid standard luminance table", () => {
      assert.doesNotThrow(() => validateQuantizationTable(STANDARD_LUMINANCE_TABLE));

      // Check dimensions
      assert.equal(STANDARD_LUMINANCE_TABLE.length, 8);
      assert.equal(STANDARD_LUMINANCE_TABLE[0].length, 8);

      // Check DC coefficient (should be relatively small)
      assert.equal(STANDARD_LUMINANCE_TABLE[0][0], 16);

      // Check that high frequencies have larger values
      assert(STANDARD_LUMINANCE_TABLE[7][7] > STANDARD_LUMINANCE_TABLE[0][1]);
    });

    it("provides valid standard chrominance table", () => {
      assert.doesNotThrow(() => validateQuantizationTable(STANDARD_CHROMINANCE_TABLE));

      // Check dimensions
      assert.equal(STANDARD_CHROMINANCE_TABLE.length, 8);
      assert.equal(STANDARD_CHROMINANCE_TABLE[0].length, 8);

      // Chrominance should generally have larger values than luminance
      // (less sensitive to color than brightness)
      assert(STANDARD_CHROMINANCE_TABLE[0][0] >= STANDARD_LUMINANCE_TABLE[0][0]);
      assert(STANDARD_CHROMINANCE_TABLE[7][7] >= STANDARD_LUMINANCE_TABLE[7][7]);
    });
  });

  describe("validateQuantizationTable", () => {
    it("accepts valid 8x8 tables", () => {
      const validTable = Array(8)
        .fill()
        .map(() => Array(8).fill(16));
      assert.doesNotThrow(() => validateQuantizationTable(validTable));
    });

    it("rejects invalid dimensions", () => {
      assert.throws(() => validateQuantizationTable([]), /8x8 array/);
      assert.throws(
        () =>
          validateQuantizationTable(
            Array(7)
              .fill()
              .map(() => Array(8).fill(16))
          ),
        /8x8 array/
      );
      assert.throws(
        () =>
          validateQuantizationTable(
            Array(8)
              .fill()
              .map(() => Array(7).fill(16))
          ),
        /8 elements/
      );
    });

    it("rejects invalid values", () => {
      const invalidTable = Array(8)
        .fill()
        .map(() => Array(8).fill(16));

      // Zero value
      invalidTable[0][0] = 0;
      assert.throws(() => validateQuantizationTable(invalidTable), /positive number/);

      // Negative value
      invalidTable[0][0] = -1;
      assert.throws(() => validateQuantizationTable(invalidTable), /positive number/);

      // Too large value
      invalidTable[0][0] = 256;
      assert.throws(() => validateQuantizationTable(invalidTable), /≤ 255/);

      // NaN
      invalidTable[0][0] = NaN;
      assert.throws(() => validateQuantizationTable(invalidTable), /positive number/);

      // Non-number
      invalidTable[0][0] = "invalid";
      assert.throws(() => validateQuantizationTable(invalidTable), /positive number/);
    });

    it("includes table name in error messages", () => {
      try {
        validateQuantizationTable([], "Test Table");
        assert.fail("Should have thrown");
      } catch (error) {
        assert(error.message.includes("Test Table"));
      }
    });
  });

  describe("validateQuality", () => {
    it("accepts valid quality values", () => {
      assert.doesNotThrow(() => validateQuality(1));
      assert.doesNotThrow(() => validateQuality(50));
      assert.doesNotThrow(() => validateQuality(100));
    });

    it("rejects invalid quality values", () => {
      assert.throws(() => validateQuality(0), /between 1 and 100/);
      assert.throws(() => validateQuality(101), /between 1 and 100/);
      assert.throws(() => validateQuality(-1), /between 1 and 100/);
      assert.throws(() => validateQuality(NaN), /between 1 and 100/);
      assert.throws(() => validateQuality("50"), /between 1 and 100/);
    });
  });

  describe("scaleQuantizationTable", () => {
    it("scales table for quality 50 (no change)", () => {
      const scaled = scaleQuantizationTable(STANDARD_LUMINANCE_TABLE, 50);

      // Quality 50 should produce minimal changes
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          // Allow small rounding differences
          assert(
            Math.abs(scaled[i][j] - STANDARD_LUMINANCE_TABLE[i][j]) <= 1,
            `Position [${i}][${j}]: expected ~${STANDARD_LUMINANCE_TABLE[i][j]}, got ${scaled[i][j]}`
          );
        }
      }
    });

    it("scales table for high quality (smaller values)", () => {
      const scaled = scaleQuantizationTable(STANDARD_LUMINANCE_TABLE, 90);

      // High quality should produce smaller quantization values
      let smallerCount = 0;
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (scaled[i][j] < STANDARD_LUMINANCE_TABLE[i][j]) {
            smallerCount++;
          }
        }
      }

      assert(smallerCount > 32, "Most values should be smaller for high quality");
    });

    it("scales table for low quality (larger values)", () => {
      const scaled = scaleQuantizationTable(STANDARD_LUMINANCE_TABLE, 10);

      // Low quality should produce larger quantization values
      let largerCount = 0;
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (scaled[i][j] > STANDARD_LUMINANCE_TABLE[i][j]) {
            largerCount++;
          }
        }
      }

      assert(largerCount > 32, "Most values should be larger for low quality");
    });

    it("clamps values to valid range [1, 255]", () => {
      // Test with extreme quality values
      const lowQuality = scaleQuantizationTable(STANDARD_LUMINANCE_TABLE, 1);
      const highQuality = scaleQuantizationTable(STANDARD_LUMINANCE_TABLE, 100);

      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          assert(
            lowQuality[i][j] >= 1 && lowQuality[i][j] <= 255,
            `Low quality value [${i}][${j}] out of range: ${lowQuality[i][j]}`
          );
          assert(
            highQuality[i][j] >= 1 && highQuality[i][j] <= 255,
            `High quality value [${i}][${j}] out of range: ${highQuality[i][j]}`
          );
        }
      }
    });

    it("validates inputs", () => {
      assert.throws(() => scaleQuantizationTable([], 50), /Base quantization table/);
      assert.throws(() => scaleQuantizationTable(STANDARD_LUMINANCE_TABLE, 0), /between 1 and 100/);
    });
  });

  describe("createQuantizationTables", () => {
    it("creates both luminance and chrominance tables", () => {
      const tables = createQuantizationTables(75);

      assert(tables.luminance);
      assert(tables.chrominance);
      assert.doesNotThrow(() => validateQuantizationTable(tables.luminance));
      assert.doesNotThrow(() => validateQuantizationTable(tables.chrominance));
    });

    it("creates different tables for different qualities", () => {
      const lowQuality = createQuantizationTables(25);
      const highQuality = createQuantizationTables(85);

      // Tables should be different
      let differences = 0;
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (lowQuality.luminance[i][j] !== highQuality.luminance[i][j]) {
            differences++;
          }
        }
      }

      assert(differences > 32, "Tables should differ significantly for different qualities");
    });

    it("validates quality input", () => {
      assert.throws(() => createQuantizationTables(0), /between 1 and 100/);
      assert.throws(() => createQuantizationTables(101), /between 1 and 100/);
    });
  });

  describe("quantizeBlock", () => {
    it("quantizes DCT coefficients correctly", () => {
      // Create test DCT block with known values
      const dctBlock = [
        [128, 64, 32, 16, 8, 4, 2, 1],
        [64, 32, 16, 8, 4, 2, 1, 0],
        [32, 16, 8, 4, 2, 1, 0, 0],
        [16, 8, 4, 2, 1, 0, 0, 0],
        [8, 4, 2, 1, 0, 0, 0, 0],
        [4, 2, 1, 0, 0, 0, 0, 0],
        [2, 1, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
      ];

      // Simple quantization table
      const quantTable = Array(8)
        .fill()
        .map(() => Array(8).fill(16));

      const quantized = quantizeBlock(dctBlock, quantTable);

      // Check quantization results
      assert.equal(quantized[0][0], Math.round(128 / 16)); // 8
      assert.equal(quantized[0][1], Math.round(64 / 16)); // 4
      assert.equal(quantized[1][0], Math.round(64 / 16)); // 4

      // Small values should quantize to 0
      assert.equal(quantized[6][6], 0);
      assert.equal(quantized[7][7], 0);
    });

    it("handles zero coefficients", () => {
      const zeroBlock = Array(8)
        .fill()
        .map(() => Array(8).fill(0));
      const quantTable = STANDARD_LUMINANCE_TABLE;

      const quantized = quantizeBlock(zeroBlock, quantTable);

      // All zeros should remain zeros
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          assert.equal(quantized[i][j], 0);
        }
      }
    });

    it("validates inputs", () => {
      const validBlock = Array(8)
        .fill()
        .map(() => Array(8).fill(16));
      const validTable = STANDARD_LUMINANCE_TABLE;

      assert.throws(() => quantizeBlock([], validTable), /DCT block/);
      assert.throws(() => quantizeBlock(validBlock, []), /Quantization table/);
    });
  });

  describe("dequantizeBlock", () => {
    it("dequantizes coefficients correctly", () => {
      // Test with known quantized values
      const quantizedBlock = [
        [8, 4, 2, 1, 0, 0, 0, 0],
        [4, 2, 1, 0, 0, 0, 0, 0],
        [2, 1, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
      ];

      const quantTable = Array(8)
        .fill()
        .map(() => Array(8).fill(16));

      const dequantized = dequantizeBlock(quantizedBlock, quantTable);

      // Check dequantization results
      assert.equal(dequantized[0][0], 8 * 16); // 128
      assert.equal(dequantized[0][1], 4 * 16); // 64
      assert.equal(dequantized[1][0], 4 * 16); // 64

      // Zeros should remain zeros
      assert.equal(dequantized[4][4], 0);
      assert.equal(dequantized[7][7], 0);
    });

    it("validates inputs", () => {
      const validBlock = Array(8)
        .fill()
        .map(() => Array(8).fill(1));
      const validTable = STANDARD_LUMINANCE_TABLE;

      assert.throws(() => dequantizeBlock([], validTable), /Quantized block/);
      assert.throws(() => dequantizeBlock(validBlock, []), /Quantization table/);
    });
  });

  describe("Quantization Roundtrip", () => {
    it("preserves DC coefficient exactly with integer values", () => {
      // Create DCT block with integer DC coefficient
      const dctBlock = Array(8)
        .fill()
        .map(() => Array(8).fill(0));
      dctBlock[0][0] = 160; // Multiple of quantization value

      const quantTable = Array(8)
        .fill()
        .map(() => Array(8).fill(16));
      quantTable[0][0] = 16; // DC quantization

      const quantized = quantizeBlock(dctBlock, quantTable);
      const dequantized = dequantizeBlock(quantized, quantTable);

      // DC should be preserved exactly
      assert.equal(dequantized[0][0], 160);
    });

    it("introduces quantization error for non-multiples", () => {
      const dctBlock = Array(8)
        .fill()
        .map(() => Array(8).fill(0));
      dctBlock[0][0] = 150; // Not a multiple of 16

      const quantTable = Array(8)
        .fill()
        .map(() => Array(8).fill(16));

      const quantized = quantizeBlock(dctBlock, quantTable);
      const dequantized = dequantizeBlock(quantized, quantTable);

      // Should have quantization error
      assert.notEqual(dequantized[0][0], 150);

      // But should be close (within quantization step)
      assert(Math.abs(dequantized[0][0] - 150) <= 16);
    });
  });

  describe("analyzeQuantizationTable", () => {
    it("analyzes standard luminance table correctly", () => {
      const analysis = analyzeQuantizationTable(STANDARD_LUMINANCE_TABLE);

      assert(typeof analysis.averageValue === "number");
      assert(typeof analysis.minValue === "number");
      assert(typeof analysis.maxValue === "number");
      assert(typeof analysis.dcValue === "number");
      assert(typeof analysis.highFreqAverage === "number");
      assert(typeof analysis.compressionRatio === "number");

      // Check specific values
      assert.equal(analysis.dcValue, 16);
      assert(analysis.minValue >= 1);
      assert(analysis.maxValue <= 255);
      assert(analysis.averageValue > analysis.minValue);
      assert(analysis.highFreqAverage > analysis.dcValue); // High freq should be more aggressive
    });

    it("compares different table characteristics", () => {
      const lowQuality = scaleQuantizationTable(STANDARD_LUMINANCE_TABLE, 10);
      const highQuality = scaleQuantizationTable(STANDARD_LUMINANCE_TABLE, 90);

      const lowAnalysis = analyzeQuantizationTable(lowQuality);
      const highAnalysis = analyzeQuantizationTable(highQuality);

      // Low quality should have higher average values
      assert(lowAnalysis.averageValue > highAnalysis.averageValue);
      assert(lowAnalysis.compressionRatio > highAnalysis.compressionRatio);
    });

    it("validates input", () => {
      assert.throws(() => analyzeQuantizationTable([]), /Quantization table/);
    });
  });

  describe("createCustomQuantizationTable", () => {
    it("creates table with default parameters", () => {
      const table = createCustomQuantizationTable();

      assert.doesNotThrow(() => validateQuantizationTable(table));
      assert.equal(table[0][0], 16); // Default DC value
    });

    it("creates table with custom DC value", () => {
      const table = createCustomQuantizationTable({ dcValue: 8 });

      assert.equal(table[0][0], 8);
      assert(table[1][1] >= 16); // AC values should be >= base value
    });

    it("applies perceptual weighting", () => {
      const perceptual = createCustomQuantizationTable({
        perceptual: true,
        baseValue: 16,
        highFreqMultiplier: 4,
      });
      const uniform = createCustomQuantizationTable({
        perceptual: false,
        baseValue: 16,
        highFreqMultiplier: 4,
      });

      // Perceptual should have gradual frequency-based scaling
      // Uniform should have step-based scaling

      // Check that perceptual has different values in middle frequencies
      assert.notEqual(perceptual[2][2], perceptual[4][4], "Perceptual should have gradual scaling");

      // Check that uniform has more uniform values in low-mid frequencies
      assert.equal(uniform[1][1], uniform[2][2], "Uniform should have consistent low-frequency values");

      // High frequencies should be different in both
      assert(perceptual[7][7] > perceptual[1][1], "High frequencies should be larger");
      assert(uniform[7][7] > uniform[1][1], "High frequencies should be larger");
    });

    it("validates parameters", () => {
      assert.throws(() => createCustomQuantizationTable({ dcValue: 0 }), /DC value/);
      assert.throws(() => createCustomQuantizationTable({ dcValue: 256 }), /DC value/);
      assert.throws(() => createCustomQuantizationTable({ baseValue: 0 }), /Base value/);
      assert.throws(() => createCustomQuantizationTable({ highFreqMultiplier: 0 }), /High frequency multiplier/);
      assert.throws(() => createCustomQuantizationTable({ highFreqMultiplier: 11 }), /High frequency multiplier/);
    });

    it("produces values in valid range", () => {
      const table = createCustomQuantizationTable({
        dcValue: 1,
        baseValue: 1,
        highFreqMultiplier: 10,
      });

      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          assert(table[i][j] >= 1 && table[i][j] <= 255, `Value [${i}][${j}] out of range: ${table[i][j]}`);
        }
      }
    });
  });

  describe("Performance", () => {
    it("handles multiple quantization operations efficiently", () => {
      const dctBlocks = [];
      const quantTable = STANDARD_LUMINANCE_TABLE;

      // Create multiple test blocks
      for (let i = 0; i < 100; i++) {
        dctBlocks.push(
          Array(8)
            .fill()
            .map(() =>
              Array(8)
                .fill()
                .map(() => Math.random() * 1000 - 500)
            )
        );
      }

      // Should complete all operations without timeout
      for (const block of dctBlocks) {
        const quantized = quantizeBlock(block, quantTable);
        const dequantized = dequantizeBlock(quantized, quantTable);

        // Verify operations completed
        assert(quantized);
        assert(dequantized);
      }
    });

    it("creates quality tables efficiently", () => {
      // Should handle multiple quality levels quickly
      for (let quality = 1; quality <= 100; quality += 10) {
        const tables = createQuantizationTables(quality);
        assert(tables.luminance);
        assert(tables.chrominance);
      }
    });
  });
});
