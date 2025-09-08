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
  applyLevelShift,
  applyRounding,
  batchForwardDct,
  coefficientsToZigzag,
  DC_LEVEL_SHIFT,
  DCT_BLOCK_SIZE,
  DCT_COSINE_COEFFICIENTS,
  DCT_IMPLEMENTATION_MODES,
  DCT_PRECISION_MODES,
  DCT_ROUNDING_MODES,
  DEFAULT_FORWARD_DCT_OPTIONS,
  dct1d,
  ForwardDctMetrics,
  forwardDct2d,
  validateDctInput,
  validateDctOutput,
} from "./forward-dct.js";

describe("Fast 8×8 Forward DCT for JPEG Encoding", () => {
  describe("Constants and Definitions", () => {
    it("defines DCT block size", () => {
      assert.equal(DCT_BLOCK_SIZE, 8);
    });

    it("defines DC level shift", () => {
      assert.equal(DC_LEVEL_SHIFT, 128);
    });

    it("defines precision modes", () => {
      assert.equal(DCT_PRECISION_MODES.HIGH, "high");
      assert.equal(DCT_PRECISION_MODES.MEDIUM, "medium");
      assert.equal(DCT_PRECISION_MODES.FAST, "fast");
    });

    it("defines implementation modes", () => {
      assert.equal(DCT_IMPLEMENTATION_MODES.CHEN_WANG, "chen_wang");
      assert.equal(DCT_IMPLEMENTATION_MODES.SEPARABLE, "separable");
      assert.equal(DCT_IMPLEMENTATION_MODES.REFERENCE, "reference");
      assert.equal(DCT_IMPLEMENTATION_MODES.SCALED, "scaled");
    });

    it("defines rounding modes", () => {
      assert.equal(DCT_ROUNDING_MODES.NEAREST, "nearest");
      assert.equal(DCT_ROUNDING_MODES.TRUNCATE, "truncate");
      assert.equal(DCT_ROUNDING_MODES.FLOOR, "floor");
      assert.equal(DCT_ROUNDING_MODES.CEILING, "ceiling");
    });

    it("defines default options", () => {
      assert.equal(DEFAULT_FORWARD_DCT_OPTIONS.precisionMode, DCT_PRECISION_MODES.MEDIUM);
      assert.equal(DEFAULT_FORWARD_DCT_OPTIONS.implementationMode, DCT_IMPLEMENTATION_MODES.CHEN_WANG);
      assert.equal(DEFAULT_FORWARD_DCT_OPTIONS.roundingMode, DCT_ROUNDING_MODES.NEAREST);
      assert.equal(DEFAULT_FORWARD_DCT_OPTIONS.levelShift, true);
      assert.equal(DEFAULT_FORWARD_DCT_OPTIONS.validateInput, true);
      assert.equal(DEFAULT_FORWARD_DCT_OPTIONS.validateOutput, true);
    });

    it("defines cosine coefficients", () => {
      assert(typeof DCT_COSINE_COEFFICIENTS.C1 === "number");
      assert(typeof DCT_COSINE_COEFFICIENTS.C2 === "number");
      assert(typeof DCT_COSINE_COEFFICIENTS.C3 === "number");
      assert(typeof DCT_COSINE_COEFFICIENTS.C4 === "number");
      assert(typeof DCT_COSINE_COEFFICIENTS.NORM_1 === "number");
      assert(typeof DCT_COSINE_COEFFICIENTS.NORM_2 === "number");
      assert.equal(DCT_COSINE_COEFFICIENTS.SCALE_SHIFT, 13);
    });
  });

  describe("Level Shifting", () => {
    it("applies level shift to 8×8 block", () => {
      const block = new Uint8Array(64).fill(128); // All pixels at middle gray
      const shifted = applyLevelShift(block);

      assert(shifted instanceof Int16Array);
      assert.equal(shifted.length, 64);

      // All values should be 0 (128 - 128)
      for (let i = 0; i < 64; i++) {
        assert.equal(shifted[i], 0);
      }
    });

    it("handles edge pixel values", () => {
      const block = new Uint8Array(64);
      block[0] = 0; // Black pixel
      block[1] = 255; // White pixel
      block[2] = 128; // Middle gray

      const shifted = applyLevelShift(block);

      assert.equal(shifted[0], -128); // 0 - 128
      assert.equal(shifted[1], 127); // 255 - 128
      assert.equal(shifted[2], 0); // 128 - 128
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        applyLevelShift("not-array");
      }, /Block must be Uint8Array/);

      assert.throws(() => {
        applyLevelShift(new Uint8Array(63));
      }, /Block must contain exactly 64 values/);
    });
  });

  describe("Input Validation", () => {
    it("validates correct Uint8Array input", () => {
      const block = new Uint8Array(64).fill(100);
      const result = validateDctInput(block);

      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
      assert.equal(result.statistics.minValue, 100);
      assert.equal(result.statistics.maxValue, 100);
      assert.equal(result.statistics.meanValue, 100);
      assert.equal(result.statistics.range, 0);
    });

    it("validates correct Int16Array input", () => {
      const block = new Int16Array(64).fill(-50);
      const result = validateDctInput(block);

      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
      assert.equal(result.statistics.minValue, -50);
      assert.equal(result.statistics.maxValue, -50);
      assert.equal(result.statistics.meanValue, -50);
    });

    it("detects invalid input types", () => {
      const result1 = validateDctInput("not-array");
      assert.equal(result1.isValid, false);
      assert(result1.errors.some((err) => err.includes("must be Uint8Array or Int16Array")));

      const result2 = validateDctInput(new Float32Array(64));
      assert.equal(result2.isValid, false);
    });

    it("detects incorrect block size", () => {
      const result = validateDctInput(new Uint8Array(63));
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("exactly 64 values")));
    });

    it("detects out-of-range values", () => {
      // Note: Uint8Array automatically clamps values, so we test Int16Array
      const block16 = new Int16Array(64);
      block16[0] = -200; // Out of expected range for level-shifted values

      const result = validateDctInput(block16);
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("out of range")));
    });

    it("provides comprehensive statistics", () => {
      const block = new Uint8Array(64);
      for (let i = 0; i < 64; i++) {
        block[i] = i % 256;
      }

      const result = validateDctInput(block);
      assert.equal(result.isValid, true);
      assert(result.statistics.minValue >= 0);
      assert(result.statistics.maxValue <= 255);
      assert(result.statistics.meanValue > 0);
      assert(result.statistics.range >= 0);
    });
  });

  describe("Rounding Functions", () => {
    it("applies nearest rounding", () => {
      assert.equal(applyRounding(2.3, DCT_ROUNDING_MODES.NEAREST), 2);
      assert.equal(applyRounding(2.7, DCT_ROUNDING_MODES.NEAREST), 3);
      assert.equal(applyRounding(-2.3, DCT_ROUNDING_MODES.NEAREST), -2);
      assert.equal(applyRounding(-2.7, DCT_ROUNDING_MODES.NEAREST), -3);
    });

    it("applies truncate rounding", () => {
      assert.equal(applyRounding(2.7, DCT_ROUNDING_MODES.TRUNCATE), 2);
      assert.equal(applyRounding(-2.7, DCT_ROUNDING_MODES.TRUNCATE), -2);
    });

    it("applies floor rounding", () => {
      assert.equal(applyRounding(2.3, DCT_ROUNDING_MODES.FLOOR), 2);
      assert.equal(applyRounding(-2.3, DCT_ROUNDING_MODES.FLOOR), -3);
    });

    it("applies ceiling rounding", () => {
      assert.equal(applyRounding(2.3, DCT_ROUNDING_MODES.CEILING), 3);
      assert.equal(applyRounding(-2.3, DCT_ROUNDING_MODES.CEILING), -2);
    });

    it("throws on unknown rounding mode", () => {
      assert.throws(() => {
        applyRounding(2.5, "invalid-mode");
      }, /Unknown rounding mode/);
    });
  });

  describe("1D DCT Implementation", () => {
    it("performs 1D DCT on constant signal", () => {
      const input = new Int16Array(8).fill(64); // Constant signal
      const output = dct1d(input, DCT_PRECISION_MODES.HIGH);

      assert(output instanceof Int16Array);
      assert.equal(output.length, 8);

      // For constant input, DC should be non-zero, AC should be ~0
      assert(Math.abs(output[0]) > 0); // DC coefficient
      for (let i = 1; i < 8; i++) {
        assert(Math.abs(output[i]) < 5); // AC coefficients should be small
      }
    });

    it("performs 1D DCT on impulse signal", () => {
      const input = new Int16Array(8);
      input[0] = 64; // Impulse at start
      const output = dct1d(input, DCT_PRECISION_MODES.HIGH);

      assert(output instanceof Int16Array);
      assert.equal(output.length, 8);

      // DC coefficient should be significant, most AC coefficients should be non-zero
      assert(Math.abs(output[0]) > 0); // DC should be non-zero

      // Check that at least half the AC coefficients are non-zero
      let nonZeroCount = 0;
      for (let i = 1; i < 8; i++) {
        if (Math.abs(output[i]) > 0) {
          nonZeroCount++;
        }
      }
      assert(nonZeroCount >= 3); // At least half the AC coefficients should be non-zero
    });

    it("handles different precision modes", () => {
      const input = new Int16Array([64, 32, 16, 8, 4, 2, 1, 0]);

      const highOutput = dct1d(input, DCT_PRECISION_MODES.HIGH);
      const mediumOutput = dct1d(input, DCT_PRECISION_MODES.MEDIUM);

      assert(highOutput instanceof Int16Array);
      assert(mediumOutput instanceof Int16Array);

      // Results should be similar but not identical due to precision differences
      assert(Math.abs(highOutput[0] - mediumOutput[0]) < 50);
    });

    it("handles different rounding modes", () => {
      const input = new Int16Array([64, 32, 16, 8, 4, 2, 1, 0]);

      const nearestOutput = dct1d(input, DCT_PRECISION_MODES.HIGH, DCT_ROUNDING_MODES.NEAREST);
      const truncateOutput = dct1d(input, DCT_PRECISION_MODES.HIGH, DCT_ROUNDING_MODES.TRUNCATE);

      assert(nearestOutput instanceof Int16Array);
      assert(truncateOutput instanceof Int16Array);

      // Results may differ due to rounding
      // Just ensure they're both valid outputs
      assert.equal(nearestOutput.length, 8);
      assert.equal(truncateOutput.length, 8);
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        dct1d(new Int16Array(7)); // Wrong size
      }, /Input must contain exactly 8 values/);

      assert.throws(() => {
        dct1d(null);
      }, /Input must contain exactly 8 values/);
    });
  });

  describe("2D Forward DCT", () => {
    /**
     * Create test 8×8 block with known pattern.
     * @returns {Uint8Array} Test block
     */
    function createTestBlock() {
      const block = new Uint8Array(64);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          block[y * 8 + x] = 128 + Math.sin((x * Math.PI) / 8) * 64;
        }
      }
      return block;
    }

    it("performs 2D DCT on 8×8 block", () => {
      const block = createTestBlock();
      const coefficients = forwardDct2d(block);

      assert(coefficients instanceof Int16Array);
      assert.equal(coefficients.length, 64);

      // DC coefficient should be significant
      assert(Math.abs(coefficients[0]) > 0);

      // Validate coefficient ranges
      const validation = validateDctOutput(coefficients);
      assert.equal(validation.isValid, true);
    });

    it("handles constant blocks", () => {
      const block = new Uint8Array(64).fill(100);
      const coefficients = forwardDct2d(block);

      assert(coefficients instanceof Int16Array);
      assert.equal(coefficients.length, 64);

      // For constant block, only DC should be significant
      assert(Math.abs(coefficients[0]) > 0);

      // Most AC coefficients should be zero or very small
      let smallAcCount = 0;
      for (let i = 1; i < 64; i++) {
        if (Math.abs(coefficients[i]) < 5) {
          smallAcCount++;
        }
      }
      assert(smallAcCount > 50); // Most AC coefficients should be small
    });

    it("handles checkerboard pattern", () => {
      const block = new Uint8Array(64);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          block[y * 8 + x] = ((x + y) % 2) * 255; // Checkerboard
        }
      }

      const coefficients = forwardDct2d(block);
      assert(coefficients instanceof Int16Array);
      assert.equal(coefficients.length, 64);

      // High-frequency pattern should have significant high-frequency coefficients
      assert(Math.abs(coefficients[63]) > 10); // Highest frequency coefficient
    });

    it("uses different options", () => {
      const block = createTestBlock();

      const defaultCoeffs = forwardDct2d(block);
      const noValidationCoeffs = forwardDct2d(block, { validateInput: false, validateOutput: false });
      const noLevelShiftCoeffs = forwardDct2d(applyLevelShift(block), { levelShift: false });

      assert.equal(defaultCoeffs.length, 64);
      assert.equal(noValidationCoeffs.length, 64);
      assert.equal(noLevelShiftCoeffs.length, 64);

      // Results should be similar
      assert(Math.abs(defaultCoeffs[0] - noLevelShiftCoeffs[0]) < 10);
    });

    it("validates input when requested", () => {
      const invalidBlock = new Uint8Array(63); // Wrong size

      assert.throws(() => {
        forwardDct2d(invalidBlock, { validateInput: true });
      }, /Invalid DCT input/);
    });

    it("validates output when requested", () => {
      const block = new Uint8Array(64).fill(128);

      // This should not throw with normal input
      const coefficients = forwardDct2d(block, { validateOutput: true });
      assert(coefficients instanceof Int16Array);
      assert.equal(coefficients.length, 64);
    });
  });

  describe("DCT Output Validation", () => {
    it("validates correct DCT coefficients", () => {
      const coefficients = new Int16Array(64);
      coefficients[0] = 500; // Valid DC
      coefficients[1] = 100; // Valid AC
      coefficients[63] = -200; // Valid AC

      const result = validateDctOutput(coefficients);

      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
      assert.equal(result.statistics.dcValue, 500);
      assert(result.statistics.acRange.min <= -200);
      assert(result.statistics.acRange.max >= 100);
    });

    it("detects invalid coefficient types", () => {
      const result = validateDctOutput("not-array");
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("must be Int16Array")));
    });

    it("detects incorrect coefficient count", () => {
      const result = validateDctOutput(new Int16Array(63));
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("exactly 64 values")));
    });

    it("detects out-of-range DC coefficient", () => {
      const coefficients = new Int16Array(64);
      coefficients[0] = 10000; // Out of range DC (beyond ±8192)

      const result = validateDctOutput(coefficients);
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("DC coefficient out of range")));
    });

    it("detects out-of-range AC coefficients", () => {
      const coefficients = new Int16Array(64);
      coefficients[0] = 500; // Valid DC
      coefficients[1] = 10000; // Out of range AC (beyond ±8192)

      const result = validateDctOutput(coefficients);
      assert.equal(result.isValid, false);
      assert(result.errors.some((err) => err.includes("AC coefficient out of range")));
    });

    it("calculates energy concentration", () => {
      const coefficients = new Int16Array(64);
      coefficients[0] = 1000; // Large DC
      coefficients[1] = 100; // Some AC
      coefficients[8] = 50; // Low frequency
      coefficients[63] = 10; // High frequency

      const result = validateDctOutput(coefficients);
      assert.equal(result.isValid, true);
      assert(result.statistics.energyConcentration > 0);
      assert(result.statistics.energyConcentration <= 100);
    });

    it("counts zero coefficients", () => {
      const coefficients = new Int16Array(64);
      coefficients[0] = 500; // DC
      coefficients[1] = 100; // AC
      // Rest are zero

      const result = validateDctOutput(coefficients);
      assert.equal(result.isValid, true);
      assert.equal(result.statistics.zeroCount, 62); // 64 - 2 non-zero
    });
  });

  describe("Zigzag Ordering", () => {
    it("converts coefficients to zigzag order", () => {
      const coefficients = new Int16Array(64);
      for (let i = 0; i < 64; i++) {
        coefficients[i] = i; // Sequential values
      }

      const zigzag = coefficientsToZigzag(coefficients);

      assert(zigzag instanceof Int16Array);
      assert.equal(zigzag.length, 64);

      // Check specific zigzag positions
      assert.equal(zigzag[0], 0); // DC coefficient (0,0)
      assert.equal(zigzag[1], 1); // (0,1)
      assert.equal(zigzag[2], 8); // (1,0)
      assert.equal(zigzag[3], 16); // (2,0)
    });

    it("preserves coefficient values", () => {
      const coefficients = new Int16Array(64);
      for (let i = 0; i < 64; i++) {
        coefficients[i] = Math.random() * 1000 - 500; // Random values
      }

      const zigzag = coefficientsToZigzag(coefficients);

      // Sum should be preserved
      const originalSum = coefficients.reduce((sum, val) => sum + val, 0);
      const zigzagSum = zigzag.reduce((sum, val) => sum + val, 0);
      assert.equal(originalSum, zigzagSum);
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        coefficientsToZigzag("not-array");
      }, /Coefficients must be Int16Array with 64 values/);

      assert.throws(() => {
        coefficientsToZigzag(new Int16Array(63));
      }, /Coefficients must be Int16Array with 64 values/);
    });
  });

  describe("Batch Processing", () => {
    /**
     * Create multiple test blocks.
     * @param {number} count - Number of blocks to create
     * @returns {Uint8Array[]} Array of test blocks
     */
    function createTestBlocks(count) {
      const blocks = [];
      for (let i = 0; i < count; i++) {
        const block = new Uint8Array(64);
        for (let j = 0; j < 64; j++) {
          block[j] = (i * 10 + j) % 256;
        }
        blocks.push(block);
      }
      return blocks;
    }

    it("processes multiple blocks", () => {
      const blocks = createTestBlocks(3);
      const result = batchForwardDct(blocks);

      assert(Array.isArray(result.coefficients));
      assert(Array.isArray(result.zigzagCoefficients));
      assert.equal(result.coefficients.length, 3);
      assert.equal(result.zigzagCoefficients.length, 3);

      // Check each block result
      for (let i = 0; i < 3; i++) {
        assert(result.coefficients[i] instanceof Int16Array);
        assert(result.zigzagCoefficients[i] instanceof Int16Array);
        assert.equal(result.coefficients[i].length, 64);
        assert.equal(result.zigzagCoefficients[i].length, 64);
      }

      // Check metadata
      assert.equal(result.metadata.blocksProcessed, 3);
      assert(typeof result.metadata.averageDcValue === "number");
      assert(typeof result.metadata.totalZeroCoefficients === "number");
      assert(typeof result.metadata.averageEnergyConcentration === "number");
      assert(typeof result.metadata.processingTime === "number");
    });

    it("handles empty block array", () => {
      const result = batchForwardDct([]);

      assert.equal(result.coefficients.length, 0);
      assert.equal(result.zigzagCoefficients.length, 0);
      assert.equal(result.metadata.blocksProcessed, 0);
      assert.equal(result.metadata.averageDcValue, 0);
      assert.equal(result.metadata.averageEnergyConcentration, 0);
    });

    it("uses batch options", () => {
      const blocks = createTestBlocks(2);
      const result = batchForwardDct(blocks, {
        precisionMode: DCT_PRECISION_MODES.HIGH,
        validateInput: false,
        validateOutput: false,
      });

      assert.equal(result.coefficients.length, 2);
      assert.equal(result.metadata.blocksProcessed, 2);
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        batchForwardDct("not-array");
      }, /Blocks must be an array/);
    });

    it("measures processing performance", () => {
      const blocks = createTestBlocks(5);
      const result = batchForwardDct(blocks);

      assert(result.metadata.processingTime > 0);
      assert(result.metadata.processingTime < 1000); // Should be reasonably fast
    });
  });

  describe("Forward DCT Metrics", () => {
    it("creates metrics analyzer", () => {
      const metrics = new ForwardDctMetrics();

      assert.equal(metrics.transformsPerformed, 0);
      assert.equal(metrics.blocksProcessed, 0);
      assert.equal(metrics.totalProcessingTime, 0);
      assert.equal(metrics.totalCoefficients, 0);
      assert.equal(metrics.totalZeroCoefficients, 0);
      assert.deepEqual(metrics.precisionModeUsage, {});
      assert.deepEqual(metrics.implementationModeUsage, {});
      assert.deepEqual(metrics.dcValues, []);
      assert.deepEqual(metrics.energyConcentrations, []);
      assert.deepEqual(metrics.errors, []);
    });

    it("records DCT operations", () => {
      const metrics = new ForwardDctMetrics();

      const metadata = {
        blocksProcessed: 3,
        averageDcValue: 500,
        totalZeroCoefficients: 150,
        averageEnergyConcentration: 75.5,
        processingTime: 10.5,
        precisionMode: DCT_PRECISION_MODES.HIGH,
        implementationMode: DCT_IMPLEMENTATION_MODES.CHEN_WANG,
      };

      metrics.recordTransform(metadata);

      assert.equal(metrics.transformsPerformed, 1);
      assert.equal(metrics.blocksProcessed, 3);
      assert.equal(metrics.totalProcessingTime, 10.5);
      assert.equal(metrics.totalCoefficients, 192); // 3 * 64
      assert.equal(metrics.totalZeroCoefficients, 150);
      assert.equal(metrics.precisionModeUsage[DCT_PRECISION_MODES.HIGH], 1);
      assert.equal(metrics.implementationModeUsage[DCT_IMPLEMENTATION_MODES.CHEN_WANG], 1);
      assert.equal(metrics.dcValues[0], 500);
      assert.equal(metrics.energyConcentrations[0], 75.5);
    });

    it("records errors", () => {
      const metrics = new ForwardDctMetrics();

      metrics.recordError("Test error 1");
      metrics.recordError("Test error 2");

      assert.equal(metrics.errors.length, 2);
      assert.equal(metrics.errors[0], "Test error 1");
      assert.equal(metrics.errors[1], "Test error 2");
    });

    it("generates summary statistics", () => {
      const metrics = new ForwardDctMetrics();

      metrics.recordTransform({
        blocksProcessed: 2,
        averageDcValue: 400,
        totalZeroCoefficients: 80,
        averageEnergyConcentration: 70,
        processingTime: 8,
        precisionMode: DCT_PRECISION_MODES.MEDIUM,
        implementationMode: DCT_IMPLEMENTATION_MODES.CHEN_WANG,
      });

      metrics.recordTransform({
        blocksProcessed: 3,
        averageDcValue: 600,
        totalZeroCoefficients: 120,
        averageEnergyConcentration: 80,
        processingTime: 12,
        precisionMode: DCT_PRECISION_MODES.HIGH,
        implementationMode: DCT_IMPLEMENTATION_MODES.SEPARABLE,
      });

      metrics.recordError("Test error");

      const summary = metrics.getSummary();

      assert.equal(summary.transformsPerformed, 2);
      assert.equal(summary.blocksProcessed, 5);
      assert.equal(summary.averageBlocksPerTransform, 3); // Round(5/2)
      assert.equal(summary.coefficientSparsity, 62.5); // (200/(5*64))*100
      assert.equal(summary.averageProcessingTime, 10); // (8+12)/2
      assert.equal(summary.averageDcValue, 500); // (400+600)/2
      assert.equal(summary.averageEnergyConcentration, 75); // (70+80)/2
      assert.equal(summary.errorCount, 1);
      assert(summary.description.includes("2 transforms"));
    });

    it("handles empty metrics", () => {
      const metrics = new ForwardDctMetrics();
      const summary = metrics.getSummary();

      assert.equal(summary.transformsPerformed, 0);
      assert.equal(summary.averageBlocksPerTransform, 0);
      assert.equal(summary.coefficientSparsity, 0);
      assert.equal(summary.averageProcessingTime, 0);
      assert.equal(summary.blocksPerSecond, 0);
      assert.equal(summary.averageDcValue, 0);
      assert.equal(summary.averageEnergyConcentration, 0);
    });

    it("resets metrics", () => {
      const metrics = new ForwardDctMetrics();

      metrics.recordTransform({
        blocksProcessed: 1,
        averageDcValue: 100,
        totalZeroCoefficients: 50,
        averageEnergyConcentration: 60,
        processingTime: 5,
        precisionMode: DCT_PRECISION_MODES.MEDIUM,
        implementationMode: DCT_IMPLEMENTATION_MODES.CHEN_WANG,
      });

      metrics.recordError("Test error");

      assert.equal(metrics.transformsPerformed, 1);
      assert.equal(metrics.errors.length, 1);

      metrics.reset();

      assert.equal(metrics.transformsPerformed, 0);
      assert.equal(metrics.blocksProcessed, 0);
      assert.equal(metrics.errors.length, 0);
      assert.deepEqual(metrics.precisionModeUsage, {});
    });
  });

  describe("Integration and Edge Cases", () => {
    it("handles extreme pixel values", () => {
      const block = new Uint8Array(64);
      block.fill(0); // All black
      block[0] = 255; // One white pixel

      const coefficients = forwardDct2d(block);
      assert(coefficients instanceof Int16Array);
      assert.equal(coefficients.length, 64);

      const validation = validateDctOutput(coefficients);
      assert.equal(validation.isValid, true);
    });

    it("maintains coefficient precision", () => {
      const block = new Uint8Array(64);
      for (let i = 0; i < 64; i++) {
        block[i] = Math.floor(Math.sin((i * Math.PI) / 32) * 127 + 128);
      }

      const coefficients1 = forwardDct2d(block);
      const coefficients2 = forwardDct2d(block); // Same input

      // Results should be identical (deterministic)
      for (let i = 0; i < 64; i++) {
        assert.equal(coefficients1[i], coefficients2[i]);
      }
    });

    it("handles all-zero input", () => {
      const block = new Uint8Array(64).fill(0);
      const coefficients = forwardDct2d(block);

      assert(coefficients instanceof Int16Array);
      assert.equal(coefficients.length, 64);

      // DC should be negative (due to level shift), AC should be ~0
      assert(coefficients[0] < 0);
      for (let i = 1; i < 64; i++) {
        assert(Math.abs(coefficients[i]) < 5);
      }
    });

    it("handles all-white input", () => {
      const block = new Uint8Array(64).fill(255);
      const coefficients = forwardDct2d(block);

      assert(coefficients instanceof Int16Array);
      assert.equal(coefficients.length, 64);

      // DC should be positive (255-128=127), AC should be ~0
      assert(coefficients[0] > 0);
      for (let i = 1; i < 64; i++) {
        assert(Math.abs(coefficients[i]) < 5);
      }
    });

    it("processes real-world patterns efficiently", () => {
      // Simulate gradient pattern (common in images)
      const block = new Uint8Array(64);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          block[y * 8 + x] = Math.floor(((x + y) * 255) / 14); // Diagonal gradient
        }
      }

      const startTime = performance.now();
      const coefficients = forwardDct2d(block);
      const endTime = performance.now();

      assert(coefficients instanceof Int16Array);
      assert(endTime - startTime < 10); // Should be fast

      const validation = validateDctOutput(coefficients);
      assert.equal(validation.isValid, true);
      assert(validation.statistics.energyConcentration > 50); // Should concentrate in low frequencies
    });

    it("works with different input formats", () => {
      const uint8Block = new Uint8Array(64).fill(128);
      const int16Block = applyLevelShift(uint8Block);

      const coeffs1 = forwardDct2d(uint8Block, { levelShift: true });
      const coeffs2 = forwardDct2d(int16Block, { levelShift: false });

      // Results should be very similar
      assert(Math.abs(coeffs1[0] - coeffs2[0]) < 2);
    });
  });
});
