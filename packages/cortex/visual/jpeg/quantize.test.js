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
  analyzeQuantizationTable,
  applyQuantizationRounding,
  batchQuantizeBlocks,
  COMPONENT_TYPES,
  calculateQualityScale,
  DEFAULT_QUANTIZATION_OPTIONS,
  estimateCompressionRatio,
  getStandardQuantizationTable,
  QUALITY_MODES,
  QUANTIZATION_PRECISION,
  QUANTIZATION_ROUNDING,
  QuantizationMetrics,
  quantizeBlock,
  quantizeCoefficient,
  STANDARD_CHROMINANCE_TABLE,
  STANDARD_LUMINANCE_TABLE,
  scaleQuantizationTable,
  validateQuantizedBlock,
} from "./quantize.js";

describe("Coefficient Quantization with Quality Scaling", () => {
  describe("Constants and Definitions", () => {
    it("defines quantization precision modes", () => {
      assert.equal(QUANTIZATION_PRECISION.PRECISION_8BIT, "8bit");
      assert.equal(QUANTIZATION_PRECISION.PRECISION_16BIT, "16bit");
    });

    it("defines quality modes", () => {
      assert.equal(QUALITY_MODES.STANDARD, "standard");
      assert.equal(QUALITY_MODES.LINEAR, "linear");
      assert.equal(QUALITY_MODES.CUSTOM, "custom");
      assert.equal(QUALITY_MODES.PERCEPTUAL, "perceptual");
    });

    it("defines rounding modes", () => {
      assert.equal(QUANTIZATION_ROUNDING.NEAREST, "nearest");
      assert.equal(QUANTIZATION_ROUNDING.TRUNCATE, "truncate");
      assert.equal(QUANTIZATION_ROUNDING.FLOOR, "floor");
      assert.equal(QUANTIZATION_ROUNDING.CEILING, "ceiling");
      assert.equal(QUANTIZATION_ROUNDING.AWAY_FROM_ZERO, "away_from_zero");
    });

    it("defines component types", () => {
      assert.equal(COMPONENT_TYPES.LUMINANCE, "luminance");
      assert.equal(COMPONENT_TYPES.CHROMINANCE, "chrominance");
    });

    it("defines default options", () => {
      assert.equal(DEFAULT_QUANTIZATION_OPTIONS.precision, QUANTIZATION_PRECISION.PRECISION_8BIT);
      assert.equal(DEFAULT_QUANTIZATION_OPTIONS.qualityMode, QUALITY_MODES.STANDARD);
      assert.equal(DEFAULT_QUANTIZATION_OPTIONS.roundingMode, QUANTIZATION_ROUNDING.NEAREST);
      assert.equal(DEFAULT_QUANTIZATION_OPTIONS.validateInput, true);
      assert.equal(DEFAULT_QUANTIZATION_OPTIONS.validateOutput, true);
      assert.equal(DEFAULT_QUANTIZATION_OPTIONS.trackMetrics, true);
    });

    it("defines standard quantization tables", () => {
      assert(STANDARD_LUMINANCE_TABLE instanceof Uint8Array);
      assert.equal(STANDARD_LUMINANCE_TABLE.length, 64);
      assert.equal(STANDARD_LUMINANCE_TABLE[0], 16); // First value

      assert(STANDARD_CHROMINANCE_TABLE instanceof Uint8Array);
      assert.equal(STANDARD_CHROMINANCE_TABLE.length, 64);
      assert.equal(STANDARD_CHROMINANCE_TABLE[0], 17); // First value
    });
  });

  describe("Quality Scaling", () => {
    it("calculates standard quality scaling", () => {
      // High quality (Q >= 50)
      assert.equal(calculateQualityScale(100, QUALITY_MODES.STANDARD), 0); // (100-100)/50 = 0
      assert.equal(calculateQualityScale(75, QUALITY_MODES.STANDARD), 0.5); // (100-75)/50 = 0.5
      assert.equal(calculateQualityScale(50, QUALITY_MODES.STANDARD), 1); // (100-50)/50 = 1

      // Low quality (Q < 50)
      assert.equal(calculateQualityScale(25, QUALITY_MODES.STANDARD), 2); // 50/25 = 2
      assert.equal(calculateQualityScale(10, QUALITY_MODES.STANDARD), 5); // 50/10 = 5
      assert.equal(calculateQualityScale(1, QUALITY_MODES.STANDARD), 50); // 50/1 = 50
    });

    it("calculates linear quality scaling", () => {
      assert.equal(calculateQualityScale(100, QUALITY_MODES.LINEAR), 0); // (100-100)/100 = 0
      assert.equal(calculateQualityScale(75, QUALITY_MODES.LINEAR), 0.25); // (100-75)/100 = 0.25
      assert.equal(calculateQualityScale(50, QUALITY_MODES.LINEAR), 0.5); // (100-50)/100 = 0.5
      assert.equal(calculateQualityScale(1, QUALITY_MODES.LINEAR), 0.99); // (100-1)/100 = 0.99
    });

    it("calculates perceptual quality scaling", () => {
      const scale100 = calculateQualityScale(100, QUALITY_MODES.PERCEPTUAL);
      const scale75 = calculateQualityScale(75, QUALITY_MODES.PERCEPTUAL);
      const scale50 = calculateQualityScale(50, QUALITY_MODES.PERCEPTUAL);
      const scale1 = calculateQualityScale(1, QUALITY_MODES.PERCEPTUAL);

      assert.equal(scale100, 0); // Perfect quality
      assert(scale75 < scale50); // Higher quality = lower scale
      assert(scale50 < scale1); // Lower quality = higher scale
      assert(scale1 > 0.8); // Very low quality should have high scale
    });

    it("validates quality input parameters", () => {
      assert.throws(() => {
        calculateQualityScale(0, QUALITY_MODES.STANDARD);
      }, /Quality must be integer between 1 and 100/);

      assert.throws(() => {
        calculateQualityScale(101, QUALITY_MODES.STANDARD);
      }, /Quality must be integer between 1 and 100/);

      assert.throws(() => {
        calculateQualityScale(50.5, QUALITY_MODES.STANDARD);
      }, /Quality must be integer between 1 and 100/);

      assert.throws(() => {
        calculateQualityScale(50, "invalid-mode");
      }, /Unknown quality mode/);
    });
  });

  describe("Quantization Table Scaling", () => {
    it("scales quantization table with quality", () => {
      const baseTable = new Uint8Array(64).fill(10);
      const scaledTable = scaleQuantizationTable(baseTable, 50, QUALITY_MODES.STANDARD);

      assert(scaledTable instanceof Uint8Array);
      assert.equal(scaledTable.length, 64);

      // Quality 50 should give scale factor of 1, so values should be 10
      for (let i = 0; i < 64; i++) {
        assert.equal(scaledTable[i], 10);
      }
    });

    it("applies minimum quantization value of 1", () => {
      const baseTable = new Uint8Array(64).fill(1);
      const scaledTable = scaleQuantizationTable(baseTable, 100, QUALITY_MODES.STANDARD); // Scale = 0

      assert(scaledTable instanceof Uint8Array);
      // Even with scale 0, minimum value should be 1
      for (let i = 0; i < 64; i++) {
        assert.equal(scaledTable[i], 1);
      }
    });

    it("clamps values to maximum precision", () => {
      const baseTable = new Uint8Array(64).fill(200);
      const scaledTable8 = scaleQuantizationTable(
        baseTable,
        1,
        QUALITY_MODES.STANDARD,
        QUANTIZATION_PRECISION.PRECISION_8BIT
      );
      const scaledTable16 = scaleQuantizationTable(
        baseTable,
        1,
        QUALITY_MODES.STANDARD,
        QUANTIZATION_PRECISION.PRECISION_16BIT
      );

      // Check 8-bit clamping
      for (let i = 0; i < 64; i++) {
        assert(scaledTable8[i] <= 255);
      }

      // 16-bit should allow larger values
      assert(scaledTable16 instanceof Uint16Array);
      for (let i = 0; i < 64; i++) {
        assert(scaledTable16[i] <= 65535);
      }
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        scaleQuantizationTable("not-array", 50);
      }, /Base table must be Uint8Array or Uint16Array/);

      assert.throws(() => {
        scaleQuantizationTable(new Uint8Array(63), 50);
      }, /Quantization table must contain exactly 64 values/);
    });
  });

  describe("Standard Quantization Tables", () => {
    it("gets standard luminance table", () => {
      const table = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 75);

      assert(table instanceof Uint8Array);
      assert.equal(table.length, 64);

      // Should be scaled version of standard table
      const expectedScale = calculateQualityScale(75, QUALITY_MODES.STANDARD);
      const expectedValue = Math.max(1, Math.round(STANDARD_LUMINANCE_TABLE[0] * expectedScale));
      assert.equal(table[0], expectedValue);
    });

    it("gets standard chrominance table", () => {
      const table = getStandardQuantizationTable(COMPONENT_TYPES.CHROMINANCE, 75);

      assert(table instanceof Uint8Array);
      assert.equal(table.length, 64);

      // Should be scaled version of standard chrominance table
      const expectedScale = calculateQualityScale(75, QUALITY_MODES.STANDARD);
      const expectedValue = Math.max(1, Math.round(STANDARD_CHROMINANCE_TABLE[0] * expectedScale));
      assert.equal(table[0], expectedValue);
    });

    it("supports different quality values", () => {
      const highQuality = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 90);
      const lowQuality = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 10);

      // High quality should have smaller quantization values
      assert(highQuality[0] < lowQuality[0]);
    });

    it("supports different precision modes", () => {
      const table8 = getStandardQuantizationTable(
        COMPONENT_TYPES.LUMINANCE,
        75,
        QUALITY_MODES.STANDARD,
        QUANTIZATION_PRECISION.PRECISION_8BIT
      );
      const table16 = getStandardQuantizationTable(
        COMPONENT_TYPES.LUMINANCE,
        75,
        QUALITY_MODES.STANDARD,
        QUANTIZATION_PRECISION.PRECISION_16BIT
      );

      assert(table8 instanceof Uint8Array);
      assert(table16 instanceof Uint16Array);
      assert.equal(table8.length, 64);
      assert.equal(table16.length, 64);
    });

    it("throws on unknown component type", () => {
      assert.throws(() => {
        getStandardQuantizationTable("invalid-component", 75);
      }, /Unknown component type/);
    });
  });

  describe("Quantization Rounding", () => {
    it("applies nearest rounding", () => {
      assert.equal(applyQuantizationRounding(2.3, QUANTIZATION_ROUNDING.NEAREST), 2);
      assert.equal(applyQuantizationRounding(2.7, QUANTIZATION_ROUNDING.NEAREST), 3);
      assert.equal(applyQuantizationRounding(-2.3, QUANTIZATION_ROUNDING.NEAREST), -2);
      assert.equal(applyQuantizationRounding(-2.7, QUANTIZATION_ROUNDING.NEAREST), -3);
    });

    it("applies truncate rounding", () => {
      assert.equal(applyQuantizationRounding(2.7, QUANTIZATION_ROUNDING.TRUNCATE), 2);
      assert.equal(applyQuantizationRounding(-2.7, QUANTIZATION_ROUNDING.TRUNCATE), -2);
    });

    it("applies floor rounding", () => {
      assert.equal(applyQuantizationRounding(2.3, QUANTIZATION_ROUNDING.FLOOR), 2);
      assert.equal(applyQuantizationRounding(-2.3, QUANTIZATION_ROUNDING.FLOOR), -3);
    });

    it("applies ceiling rounding", () => {
      assert.equal(applyQuantizationRounding(2.3, QUANTIZATION_ROUNDING.CEILING), 3);
      assert.equal(applyQuantizationRounding(-2.3, QUANTIZATION_ROUNDING.CEILING), -2);
    });

    it("applies away from zero rounding", () => {
      assert.equal(applyQuantizationRounding(2.3, QUANTIZATION_ROUNDING.AWAY_FROM_ZERO), 3);
      assert.equal(applyQuantizationRounding(-2.3, QUANTIZATION_ROUNDING.AWAY_FROM_ZERO), -3);
    });

    it("throws on unknown rounding mode", () => {
      assert.throws(() => {
        applyQuantizationRounding(2.5, "invalid-mode");
      }, /Unknown rounding mode/);
    });
  });

  describe("Single Coefficient Quantization", () => {
    it("quantizes positive coefficient", () => {
      assert.equal(quantizeCoefficient(100, 10), 10); // 100/10 = 10
      assert.equal(quantizeCoefficient(105, 10), 11); // 105/10 = 10.5 → 11 (nearest)
      assert.equal(quantizeCoefficient(104, 10), 10); // 104/10 = 10.4 → 10 (nearest)
    });

    it("quantizes negative coefficient", () => {
      assert.equal(quantizeCoefficient(-100, 10), -10); // -100/10 = -10
      assert.equal(quantizeCoefficient(-105, 10), -10); // -105/10 = -10.5 → -10 (nearest)
      assert.equal(quantizeCoefficient(-104, 10), -10); // -104/10 = -10.4 → -10 (nearest)
    });

    it("quantizes small coefficients to zero", () => {
      assert.equal(quantizeCoefficient(4, 10), 0); // 4/10 = 0.4 → 0 (nearest)
      assert.equal(quantizeCoefficient(-4, 10), -0); // -4/10 = -0.4 → -0 (nearest)
    });

    it("uses different rounding modes", () => {
      assert.equal(quantizeCoefficient(105, 10, QUANTIZATION_ROUNDING.NEAREST), 11);
      assert.equal(quantizeCoefficient(105, 10, QUANTIZATION_ROUNDING.TRUNCATE), 10);
      assert.equal(quantizeCoefficient(105, 10, QUANTIZATION_ROUNDING.FLOOR), 10);
      assert.equal(quantizeCoefficient(105, 10, QUANTIZATION_ROUNDING.CEILING), 11);
    });

    it("throws on zero quantization value", () => {
      assert.throws(() => {
        quantizeCoefficient(100, 0);
      }, /Quantization value cannot be zero/);
    });
  });

  describe("Block Quantization", () => {
    /**
     * Create test DCT coefficient block.
     * @returns {Int16Array} Test coefficient block
     */
    function createTestCoefficients() {
      const coeffs = new Int16Array(64);
      // Create realistic DCT coefficient pattern
      coeffs[0] = 1000; // Large DC coefficient
      coeffs[1] = 200; // Some AC coefficients
      coeffs[2] = 150;
      coeffs[8] = 100;
      coeffs[9] = 80;
      // Rest are smaller or zero (typical DCT pattern)
      for (let i = 10; i < 64; i++) {
        coeffs[i] = Math.floor(Math.random() * 50) - 25; // Random small values
      }
      return coeffs;
    }

    /**
     * Create test quantization table.
     * @returns {Uint8Array} Test quantization table
     */
    function createTestQuantTable() {
      const table = new Uint8Array(64);
      // Create typical quantization pattern (smaller for low frequencies)
      for (let i = 0; i < 64; i++) {
        const row = Math.floor(i / 8);
        const col = i % 8;
        table[i] = Math.max(1, (row + col + 1) * 5); // Increasing with frequency
      }
      return table;
    }

    it("quantizes coefficient block", () => {
      const coeffs = createTestCoefficients();
      const quantTable = createTestQuantTable();
      const quantized = quantizeBlock(coeffs, quantTable);

      assert(quantized instanceof Int16Array);
      assert.equal(quantized.length, 64);

      // DC coefficient should be quantized but still significant
      assert(Math.abs(quantized[0]) > 0);

      // Check that quantization reduces coefficient magnitudes
      assert(Math.abs(quantized[0]) <= Math.abs(coeffs[0]));

      // Verify metadata is attached
      assert(quantized.metadata);
      assert(typeof quantized.metadata.zeroCount === "number");
      assert(typeof quantized.metadata.sparsity === "number");
    });

    it("handles all-zero coefficients", () => {
      const coeffs = new Int16Array(64); // All zeros
      const quantTable = createTestQuantTable();
      const quantized = quantizeBlock(coeffs, quantTable);

      assert(quantized instanceof Int16Array);
      assert.equal(quantized.length, 64);

      // All coefficients should remain zero
      for (let i = 0; i < 64; i++) {
        assert.equal(quantized[i], 0);
      }

      assert.equal(quantized.metadata.zeroCount, 64);
      assert.equal(quantized.metadata.sparsity, 100);
    });

    it("uses different rounding modes", () => {
      const coeffs = new Int16Array(64);
      coeffs[0] = 105; // Will be affected by rounding
      const quantTable = new Uint8Array(64).fill(10);

      const nearestResult = quantizeBlock(coeffs, quantTable, { roundingMode: QUANTIZATION_ROUNDING.NEAREST });
      const truncateResult = quantizeBlock(coeffs, quantTable, { roundingMode: QUANTIZATION_ROUNDING.TRUNCATE });

      assert.equal(nearestResult[0], 11); // 105/10 = 10.5 → 11
      assert.equal(truncateResult[0], 10); // 105/10 = 10.5 → 10
    });

    it("validates input parameters", () => {
      const coeffs = createTestCoefficients();
      const quantTable = createTestQuantTable();

      // Invalid coefficients
      assert.throws(() => {
        quantizeBlock("not-array", quantTable);
      }, /Coefficients must be Int16Array with 64 values/);

      assert.throws(() => {
        quantizeBlock(new Int16Array(63), quantTable);
      }, /Coefficients must be Int16Array with 64 values/);

      // Invalid quantization table
      assert.throws(() => {
        quantizeBlock(coeffs, "not-array");
      }, /Quantization table must be Uint8Array or Uint16Array/);

      assert.throws(() => {
        quantizeBlock(coeffs, new Uint8Array(63));
      }, /Quantization table must contain exactly 64 values/);

      // Zero in quantization table
      const badQuantTable = createTestQuantTable();
      badQuantTable[5] = 0;
      assert.throws(() => {
        quantizeBlock(coeffs, badQuantTable);
      }, /Quantization table contains zero value at position 5/);
    });

    it("disables validation when requested", () => {
      const coeffs = createTestCoefficients();
      const quantTable = createTestQuantTable();

      const result = quantizeBlock(coeffs, quantTable, {
        validateInput: false,
        validateOutput: false,
        trackMetrics: false,
      });

      assert(result instanceof Int16Array);
      assert.equal(result.length, 64);
      // Metadata should not be attached when tracking disabled
      assert.equal(result.metadata, undefined);
    });
  });

  describe("Block Validation", () => {
    it("validates correct quantized block", () => {
      const coeffs = new Int16Array(64);
      coeffs[0] = 100; // DC coefficient
      coeffs[1] = 50; // Some AC coefficients
      coeffs[2] = -30;
      coeffs[10] = 0; // Some zeros

      const result = validateQuantizedBlock(coeffs);

      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
      assert.equal(result.statistics.minValue, -30);
      assert.equal(result.statistics.maxValue, 100);
      assert.equal(result.statistics.zeroCount, 61); // 64 - 3 non-zero
      assert.equal(result.statistics.nonZeroCount, 3);
      assert(result.statistics.sparsity > 90); // High sparsity
    });

    it("detects invalid coefficient types", () => {
      const result = validateQuantizedBlock("not-array");
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("must be Int16Array")));
    });

    it("detects incorrect coefficient count", () => {
      const result = validateQuantizedBlock(new Int16Array(63));
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("exactly 64 values")));
    });

    it("detects out-of-range coefficients", () => {
      const coeffs = new Int16Array(64);
      coeffs[0] = 5000; // Very large coefficient (unusual for quantized)

      const result = validateQuantizedBlock(coeffs);
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("out of reasonable range")));
    });

    it("calculates sparsity correctly", () => {
      const coeffs = new Int16Array(64);
      coeffs[0] = 100;
      coeffs[1] = 50;
      // 62 zeros, 2 non-zeros

      const result = validateQuantizedBlock(coeffs);
      assert.equal(result.isValid, true);
      assert.equal(result.statistics.zeroCount, 62);
      assert.equal(result.statistics.nonZeroCount, 2);
      assert.equal(result.statistics.sparsity, 96.88); // (62/64)*100
    });
  });

  describe("Compression Ratio Estimation", () => {
    it("estimates compression ratio for sparse block", () => {
      const coeffs = new Int16Array(64);
      coeffs[0] = 100; // One significant coefficient
      coeffs[1] = 1; // One small coefficient
      // Rest are zeros

      const ratio = estimateCompressionRatio(coeffs);
      assert(typeof ratio === "number");
      assert(ratio > 8); // Should be high due to sparsity
    });

    it("estimates compression ratio for dense block", () => {
      const coeffs = new Int16Array(64);
      for (let i = 0; i < 64; i++) {
        coeffs[i] = Math.floor(Math.random() * 200) - 100; // Random non-zero values
      }

      const ratio = estimateCompressionRatio(coeffs);
      assert(typeof ratio === "number");
      assert(ratio >= 8); // Should be lower due to density
    });

    it("handles all-zero block", () => {
      const coeffs = new Int16Array(64); // All zeros

      const ratio = estimateCompressionRatio(coeffs);
      assert(typeof ratio === "number");
      assert(ratio > 10); // Should be very high for all zeros
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        estimateCompressionRatio("not-array");
      }, /Coefficients must be Int16Array with 64 values/);

      assert.throws(() => {
        estimateCompressionRatio(new Int16Array(63));
      }, /Coefficients must be Int16Array with 64 values/);
    });
  });

  describe("Batch Quantization", () => {
    /**
     * Create multiple test coefficient blocks.
     * @param {number} count - Number of blocks to create
     * @returns {Int16Array[]} Array of coefficient blocks
     */
    function createTestBlocks(count) {
      const blocks = [];
      for (let i = 0; i < count; i++) {
        const block = new Int16Array(64);
        block[0] = 1000 + i * 100; // Varying DC coefficients
        for (let j = 1; j < 64; j++) {
          block[j] = Math.floor(Math.random() * 100) - 50;
        }
        blocks.push(block);
      }
      return blocks;
    }

    it("quantizes multiple blocks", () => {
      const blocks = createTestBlocks(3);
      const quantTable = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 75);
      const result = batchQuantizeBlocks(blocks, quantTable);

      assert(Array.isArray(result.quantizedBlocks));
      assert.equal(result.quantizedBlocks.length, 3);

      // Check each block result
      for (let i = 0; i < 3; i++) {
        assert(result.quantizedBlocks[i] instanceof Int16Array);
        assert.equal(result.quantizedBlocks[i].length, 64);
      }

      // Check metadata
      assert.equal(result.metadata.blocksProcessed, 3);
      assert(typeof result.metadata.totalZeroCoefficients === "number");
      assert(typeof result.metadata.averageSparsity === "number");
      assert(typeof result.metadata.averageCompressionRatio === "number");
      assert(typeof result.metadata.processingTime === "number");
    });

    it("handles empty block array", () => {
      const quantTable = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 75);
      const result = batchQuantizeBlocks([], quantTable);

      assert.equal(result.quantizedBlocks.length, 0);
      assert.equal(result.metadata.blocksProcessed, 0);
      assert.equal(result.metadata.averageSparsity, 0);
      assert.equal(result.metadata.averageCompressionRatio, 0);
    });

    it("uses batch options", () => {
      const blocks = createTestBlocks(2);
      const quantTable = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 75);
      const result = batchQuantizeBlocks(blocks, quantTable, {
        roundingMode: QUANTIZATION_ROUNDING.TRUNCATE,
        trackMetrics: false,
      });

      assert.equal(result.quantizedBlocks.length, 2);
      assert.equal(result.metadata.blocksProcessed, 2);
    });

    it("validates input parameters", () => {
      const quantTable = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 75);

      assert.throws(() => {
        batchQuantizeBlocks("not-array", quantTable);
      }, /Coefficient blocks must be an array/);
    });

    it("measures processing performance", () => {
      const blocks = createTestBlocks(5);
      const quantTable = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 75);
      const result = batchQuantizeBlocks(blocks, quantTable);

      assert(result.metadata.processingTime > 0);
      assert(result.metadata.processingTime < 1000); // Should be reasonably fast
    });
  });

  describe("Quantization Metrics", () => {
    it("creates metrics analyzer", () => {
      const metrics = new QuantizationMetrics();

      assert.equal(metrics.quantizationsPerformed, 0);
      assert.equal(metrics.blocksProcessed, 0);
      assert.equal(metrics.totalProcessingTime, 0);
      assert.equal(metrics.totalZeroCoefficients, 0);
      assert.equal(metrics.totalQuantizationError, 0);
      assert.deepEqual(metrics.qualityModeUsage, {});
      assert.deepEqual(metrics.precisionModeUsage, {});
      assert.deepEqual(metrics.sparsityValues, []);
      assert.deepEqual(metrics.compressionRatios, []);
      assert.deepEqual(metrics.errors, []);
    });

    it("records quantization operations", () => {
      const metrics = new QuantizationMetrics();

      const metadata = {
        blocksProcessed: 3,
        totalZeroCoefficients: 150,
        averageSparsity: 75.5,
        averageCompressionRatio: 12.3,
        totalQuantizationError: 45.6,
        processingTime: 10.5,
        qualityMode: QUALITY_MODES.STANDARD,
        precision: QUANTIZATION_PRECISION.PRECISION_8BIT,
      };

      metrics.recordQuantization(metadata);

      assert.equal(metrics.quantizationsPerformed, 1);
      assert.equal(metrics.blocksProcessed, 3);
      assert.equal(metrics.totalProcessingTime, 10.5);
      assert.equal(metrics.totalZeroCoefficients, 150);
      assert.equal(metrics.totalQuantizationError, 45.6);
      assert.equal(metrics.qualityModeUsage[QUALITY_MODES.STANDARD], 1);
      assert.equal(metrics.precisionModeUsage[QUANTIZATION_PRECISION.PRECISION_8BIT], 1);
      assert.equal(metrics.sparsityValues[0], 75.5);
      assert.equal(metrics.compressionRatios[0], 12.3);
    });

    it("records errors", () => {
      const metrics = new QuantizationMetrics();

      metrics.recordError("Test error 1");
      metrics.recordError("Test error 2");

      assert.equal(metrics.errors.length, 2);
      assert.equal(metrics.errors[0], "Test error 1");
      assert.equal(metrics.errors[1], "Test error 2");
    });

    it("generates summary statistics", () => {
      const metrics = new QuantizationMetrics();

      metrics.recordQuantization({
        blocksProcessed: 2,
        totalZeroCoefficients: 80,
        averageSparsity: 70,
        averageCompressionRatio: 10,
        totalQuantizationError: 20,
        processingTime: 8,
        qualityMode: QUALITY_MODES.STANDARD,
        precision: QUANTIZATION_PRECISION.PRECISION_8BIT,
      });

      metrics.recordQuantization({
        blocksProcessed: 3,
        totalZeroCoefficients: 120,
        averageSparsity: 80,
        averageCompressionRatio: 12,
        totalQuantizationError: 30,
        processingTime: 12,
        qualityMode: QUALITY_MODES.LINEAR,
        precision: QUANTIZATION_PRECISION.PRECISION_16BIT,
      });

      metrics.recordError("Test error");

      const summary = metrics.getSummary();

      assert.equal(summary.quantizationsPerformed, 2);
      assert.equal(summary.blocksProcessed, 5);
      assert.equal(summary.averageBlocksPerQuantization, 3); // Round(5/2)
      assert.equal(summary.coefficientSparsity, 75); // (70+80)/2
      assert.equal(summary.averageCompressionRatio, 11); // (10+12)/2
      assert.equal(summary.averageQuantizationError, 25); // (20+30)/2
      assert.equal(summary.averageProcessingTime, 10); // (8+12)/2
      assert.equal(summary.errorCount, 1);
      assert(summary.description.includes("2 operations"));
    });

    it("handles empty metrics", () => {
      const metrics = new QuantizationMetrics();
      const summary = metrics.getSummary();

      assert.equal(summary.quantizationsPerformed, 0);
      assert.equal(summary.averageBlocksPerQuantization, 0);
      assert.equal(summary.coefficientSparsity, 0);
      assert.equal(summary.averageCompressionRatio, 0);
      assert.equal(summary.averageQuantizationError, 0);
      assert.equal(summary.blocksPerSecond, 0);
    });

    it("resets metrics", () => {
      const metrics = new QuantizationMetrics();

      metrics.recordQuantization({
        blocksProcessed: 1,
        totalZeroCoefficients: 50,
        averageSparsity: 60,
        averageCompressionRatio: 8,
        totalQuantizationError: 10,
        processingTime: 5,
        qualityMode: QUALITY_MODES.STANDARD,
        precision: QUANTIZATION_PRECISION.PRECISION_8BIT,
      });

      metrics.recordError("Test error");

      assert.equal(metrics.quantizationsPerformed, 1);
      assert.equal(metrics.errors.length, 1);

      metrics.reset();

      assert.equal(metrics.quantizationsPerformed, 0);
      assert.equal(metrics.blocksProcessed, 0);
      assert.equal(metrics.errors.length, 0);
      assert.deepEqual(metrics.qualityModeUsage, {});
    });
  });

  describe("Quantization Table Analysis", () => {
    it("analyzes standard luminance table", () => {
      const analysis = analyzeQuantizationTable(STANDARD_LUMINANCE_TABLE);

      assert(typeof analysis.minValue === "number");
      assert(typeof analysis.maxValue === "number");
      assert(typeof analysis.averageValue === "number");
      assert(typeof analysis.dynamicRange === "number");
      assert(typeof analysis.lowFrequencyAverage === "number");
      assert(typeof analysis.highFrequencyAverage === "number");
      assert(typeof analysis.compressionAggressiveness === "number");

      // Luminance table characteristics
      assert(analysis.minValue >= 1);
      assert(analysis.maxValue <= 255);
      assert(analysis.lowFrequencyAverage < analysis.highFrequencyAverage); // More aggressive at high freq
      assert(analysis.compressionAggressiveness > 1); // Should be aggressive
      assert.equal(analysis.tableType, "luminance");
    });

    it("analyzes standard chrominance table", () => {
      const analysis = analyzeQuantizationTable(STANDARD_CHROMINANCE_TABLE);

      assert(typeof analysis.minValue === "number");
      assert(typeof analysis.maxValue === "number");
      assert(analysis.compressionAggressiveness > 1);
      assert.equal(analysis.tableType, "chrominance");
    });

    it("analyzes custom table", () => {
      const customTable = new Uint8Array(64).fill(25); // Uniform table
      const analysis = analyzeQuantizationTable(customTable);

      assert.equal(analysis.minValue, 25);
      assert.equal(analysis.maxValue, 25);
      assert.equal(analysis.averageValue, 25);
      assert.equal(analysis.dynamicRange, 0);
      assert.equal(analysis.compressionAggressiveness, 1); // No frequency bias
      assert.equal(analysis.tableType, "custom");
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        analyzeQuantizationTable("not-array");
      }, /Quantization table must be Uint8Array or Uint16Array/);

      assert.throws(() => {
        analyzeQuantizationTable(new Uint8Array(63));
      }, /Quantization table must contain exactly 64 values/);
    });
  });

  describe("Integration and Edge Cases", () => {
    it("handles extreme quality values", () => {
      const table1 = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 1); // Lowest quality
      const table100 = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 100); // Highest quality

      // Quality 1 should have much larger quantization values
      assert(table1[0] > table100[0]);

      // Quality 100 should have minimal quantization (close to 1)
      assert(table100[0] >= 1);
    });

    it("maintains quantization consistency", () => {
      const coeffs = new Int16Array(64);
      coeffs[0] = 1000;
      coeffs[1] = 500;
      coeffs[2] = -300;

      const quantTable = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 75);

      const result1 = quantizeBlock(coeffs, quantTable);
      const result2 = quantizeBlock(coeffs, quantTable); // Same input

      // Results should be identical (deterministic)
      for (let i = 0; i < 64; i++) {
        assert.equal(result1[i], result2[i]);
      }
    });

    it("works with different precision modes", () => {
      const coeffs = new Int16Array(64);
      coeffs[0] = 1000;

      const table8 = getStandardQuantizationTable(
        COMPONENT_TYPES.LUMINANCE,
        50,
        QUALITY_MODES.STANDARD,
        QUANTIZATION_PRECISION.PRECISION_8BIT
      );
      const table16 = getStandardQuantizationTable(
        COMPONENT_TYPES.LUMINANCE,
        50,
        QUALITY_MODES.STANDARD,
        QUANTIZATION_PRECISION.PRECISION_16BIT
      );

      const result8 = quantizeBlock(coeffs, table8);
      const result16 = quantizeBlock(coeffs, table16);

      // Results should be similar (same quality, different precision)
      assert(Math.abs(result8[0] - result16[0]) <= 1);
    });

    it("processes real-world coefficient patterns", () => {
      // Simulate realistic DCT coefficient distribution
      const coeffs = new Int16Array(64);
      coeffs[0] = 1200; // Large DC
      coeffs[1] = -300; // Significant low-frequency AC
      coeffs[8] = 150;
      coeffs[9] = -80;

      // High-frequency coefficients (smaller, many zeros)
      for (let i = 20; i < 64; i++) {
        coeffs[i] = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 20) - 10;
      }

      const quantTable = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 75);
      const result = quantizeBlock(coeffs, quantTable);

      assert(result instanceof Int16Array);
      assert(result.metadata.sparsity > 50); // Should be fairly sparse
      assert(result.metadata.compressionRatio > 8); // Should compress well
    });

    it("handles edge cases gracefully", () => {
      // All maximum positive coefficients
      const maxCoeffs = new Int16Array(64).fill(32767);
      const quantTable = getStandardQuantizationTable(COMPONENT_TYPES.LUMINANCE, 1); // Lowest quality

      const result = quantizeBlock(maxCoeffs, quantTable, { validateOutput: false });
      assert(result instanceof Int16Array);

      // All minimum negative coefficients
      const minCoeffs = new Int16Array(64).fill(-32768);
      const result2 = quantizeBlock(minCoeffs, quantTable, { validateOutput: false });
      assert(result2 instanceof Int16Array);
    });
  });
});
