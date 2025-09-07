/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for DCT (Discrete Cosine Transform) mathematics.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  analyzeDCTEnergy,
  compareBlocks,
  createDCTTables,
  createTestBlock,
  forwardDCT,
  inverseDCT,
  validateDCTBlock,
} from "./dct-transform.js";

describe("DCT Transform Mathematics", () => {
  describe("createDCTTables", () => {
    it("creates correct cosine lookup tables", () => {
      const tables = createDCTTables();

      assert(tables.forward);
      assert(tables.inverse);
      assert.equal(tables.forward.length, 8);
      assert.equal(tables.inverse.length, 8);

      // Check table dimensions
      for (let i = 0; i < 8; i++) {
        assert.equal(tables.forward[i].length, 8);
        assert.equal(tables.inverse[i].length, 8);
      }

      // Verify specific known values
      // cos(0) = 1
      assert(Math.abs(tables.forward[0][0] - 1.0) < 0.0001);
      // cos((2*0 + 1) * 4 * π / 16) = cos(π/4) ≈ 0.707
      assert(Math.abs(tables.forward[4][0] - Math.cos(Math.PI / 4)) < 0.0001);
    });

    it("creates Float32Array for performance", () => {
      const tables = createDCTTables();

      for (let i = 0; i < 8; i++) {
        assert(tables.forward[i] instanceof Float32Array);
        assert(tables.inverse[i] instanceof Float32Array);
      }
    });
  });

  describe("validateDCTBlock", () => {
    it("accepts valid 8x8 blocks", () => {
      const validBlock = Array(8)
        .fill()
        .map(() => Array(8).fill(0));

      assert.doesNotThrow(() => validateDCTBlock(validBlock));
    });

    it("rejects non-8x8 blocks", () => {
      assert.throws(() => validateDCTBlock([]), /8x8 array/);
      assert.throws(
        () =>
          validateDCTBlock(
            Array(7)
              .fill()
              .map(() => Array(8).fill(0))
          ),
        /8x8 array/
      );
      assert.throws(
        () =>
          validateDCTBlock(
            Array(8)
              .fill()
              .map(() => Array(7).fill(0))
          ),
        /8 elements/
      );
    });

    it("rejects blocks with invalid values", () => {
      const invalidBlock = Array(8)
        .fill()
        .map(() => Array(8).fill(0));
      invalidBlock[0][0] = NaN;

      assert.throws(() => validateDCTBlock(invalidBlock), /valid number/);

      invalidBlock[0][0] = "invalid";
      assert.throws(() => validateDCTBlock(invalidBlock), /valid number/);
    });

    it("includes operation name in error messages", () => {
      try {
        validateDCTBlock([], "Test Operation");
        assert.fail("Should have thrown");
      } catch (error) {
        assert(error.message.includes("Test Operation"));
      }
    });
  });

  describe("forwardDCT", () => {
    it("transforms constant block correctly", () => {
      const constantBlock = createTestBlock("constant");
      const dctBlock = forwardDCT(constantBlock);

      // Constant block should have only DC component
      // DC coefficient = average * 8 (due to DCT normalization)
      assert(Math.abs(dctBlock[0][0] - 1024) < 0.01); // DC = 128 * 8

      // All AC coefficients should be near zero
      for (let u = 0; u < 8; u++) {
        for (let v = 0; v < 8; v++) {
          if (u !== 0 || v !== 0) {
            assert(Math.abs(dctBlock[u][v]) < 0.01, `AC coefficient [${u}][${v}] should be near zero`);
          }
        }
      }
    });

    it("transforms impulse correctly", () => {
      const impulseBlock = createTestBlock("impulse");
      const dctBlock = forwardDCT(impulseBlock);

      // Impulse should spread energy across all frequencies
      // DC coefficient should be 255 * 0.25 * (1/√2) * (1/√2) = 31.875
      const expectedDC = 255 * 0.25 * (1 / Math.sqrt(2)) * (1 / Math.sqrt(2));
      assert(
        Math.abs(dctBlock[0][0] - expectedDC) < 0.01,
        `DC coefficient: expected ${expectedDC}, got ${dctBlock[0][0]}`
      );

      // All AC coefficients should be non-zero (energy spread across frequencies)
      let nonZeroCount = 0;
      for (let u = 0; u < 8; u++) {
        for (let v = 0; v < 8; v++) {
          if (u !== 0 || v !== 0) {
            if (Math.abs(dctBlock[u][v]) > 0.01) {
              nonZeroCount++;
            }
          }
        }
      }

      // Most coefficients should have energy (impulse spreads across frequencies)
      assert(nonZeroCount > 50, `Expected most AC coefficients to be non-zero, got ${nonZeroCount}/63`);

      // Check specific known coefficients
      assert(Math.abs(dctBlock[0][1] - 44.212) < 0.01, "AC coefficient [0][1] should match expected value");
      assert(Math.abs(dctBlock[1][1] - 61.324) < 0.01, "AC coefficient [1][1] should match expected value");
    });

    it("concentrates energy in low frequencies for smooth blocks", () => {
      const gradientBlock = createTestBlock("gradient");
      const dctBlock = forwardDCT(gradientBlock);
      const energy = analyzeDCTEnergy(dctBlock);

      // Smooth gradient should have most energy in low frequencies
      assert(energy.lowFreqEnergy > energy.highFreqEnergy, "Low frequency energy should dominate for smooth blocks");

      // DC component should be significant
      assert(energy.dcEnergy > 0, "DC component should have energy");
    });

    it("handles checkerboard pattern", () => {
      const checkerboardBlock = createTestBlock("checkerboard");
      const dctBlock = forwardDCT(checkerboardBlock);
      const energy = analyzeDCTEnergy(dctBlock);

      // High-frequency pattern should have energy in high frequencies
      assert(energy.highFreqEnergy > 0, "High frequency pattern should have high-frequency energy");
    });

    it("validates input block", () => {
      assert.throws(() => forwardDCT([]), /Forward DCT/);
      assert.throws(() => forwardDCT(null), /Forward DCT/);
    });
  });

  describe("inverseDCT", () => {
    it("reconstructs constant block correctly", () => {
      const constantBlock = createTestBlock("constant");
      const dctBlock = forwardDCT(constantBlock);
      const reconstructed = inverseDCT(dctBlock);

      // Should reconstruct original within floating-point precision
      assert(compareBlocks(constantBlock, reconstructed, 0.01), "Constant block should be perfectly reconstructed");
    });

    it("reconstructs gradient block correctly", () => {
      const gradientBlock = createTestBlock("gradient");
      const dctBlock = forwardDCT(gradientBlock);
      const reconstructed = inverseDCT(dctBlock);

      // Should reconstruct original within floating-point precision
      assert(compareBlocks(gradientBlock, reconstructed, 0.01), "Gradient block should be accurately reconstructed");
    });

    it("reconstructs impulse block correctly", () => {
      const impulseBlock = createTestBlock("impulse");
      const dctBlock = forwardDCT(impulseBlock);
      const reconstructed = inverseDCT(dctBlock);

      // Should reconstruct original within floating-point precision
      assert(compareBlocks(impulseBlock, reconstructed, 0.01), "Impulse block should be accurately reconstructed");
    });

    it("validates input block", () => {
      assert.throws(() => inverseDCT([]), /Inverse DCT/);
      assert.throws(() => inverseDCT(null), /Inverse DCT/);
    });
  });

  describe("DCT Roundtrip (Forward + Inverse)", () => {
    it("is reversible for all test block types", () => {
      const testTypes = ["constant", "gradient", "checkerboard", "impulse"];

      for (const type of testTypes) {
        const originalBlock = createTestBlock(type);
        const dctBlock = forwardDCT(originalBlock);
        const reconstructed = inverseDCT(dctBlock);

        assert(
          compareBlocks(originalBlock, reconstructed, 0.01),
          `${type} block should be reversible through DCT roundtrip`
        );
      }
    });

    it("preserves energy (Parseval's theorem)", () => {
      const originalBlock = createTestBlock("gradient");
      const dctBlock = forwardDCT(originalBlock);

      // Calculate energy in both domains
      let spatialEnergy = 0;
      let frequencyEnergy = 0;

      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          spatialEnergy += originalBlock[i][j] * originalBlock[i][j];
          frequencyEnergy += dctBlock[i][j] * dctBlock[i][j];
        }
      }

      // Energy should be preserved (within numerical precision)
      // The DCT normalization means frequency domain energy is scaled
      // For our implementation, the ratio should be close to 1
      const energyRatio = frequencyEnergy / spatialEnergy;
      assert(
        Math.abs(energyRatio - 1) < 0.01, // Allow small numerical errors
        `Energy should be preserved: spatial=${spatialEnergy}, frequency=${frequencyEnergy}, ratio=${energyRatio}`
      );
    });

    it("handles random blocks correctly", () => {
      // Create random 8x8 block
      const randomBlock = Array(8)
        .fill()
        .map(() =>
          Array(8)
            .fill()
            .map(() => Math.floor(Math.random() * 256))
        );

      const dctBlock = forwardDCT(randomBlock);
      const reconstructed = inverseDCT(dctBlock);

      assert(
        compareBlocks(randomBlock, reconstructed, 0.01),
        "Random block should be reversible through DCT roundtrip"
      );
    });
  });

  describe("createTestBlock", () => {
    it("creates gradient test block", () => {
      const block = createTestBlock("gradient");

      assert.equal(block.length, 8);
      assert.equal(block[0].length, 8);

      // Should be a smooth gradient
      assert.equal(block[0][0], 0);
      assert.equal(block[0][1], 1);
      assert.equal(block[7][7], 63);
    });

    it("creates constant test block", () => {
      const block = createTestBlock("constant");

      // All values should be 128
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          assert.equal(block[i][j], 128);
        }
      }
    });

    it("creates checkerboard test block", () => {
      const block = createTestBlock("checkerboard");

      // Should alternate between 0 and 255
      assert.equal(block[0][0], 0);
      assert.equal(block[0][1], 255);
      assert.equal(block[1][0], 255);
      assert.equal(block[1][1], 0);
    });

    it("creates impulse test block", () => {
      const block = createTestBlock("impulse");

      // Should have single impulse at [0][0]
      assert.equal(block[0][0], 255);

      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (i !== 0 || j !== 0) {
            assert.equal(block[i][j], 0);
          }
        }
      }
    });

    it("rejects unknown test block types", () => {
      assert.throws(() => createTestBlock("unknown"), /Unknown test block type/);
    });
  });

  describe("compareBlocks", () => {
    it("compares identical blocks correctly", () => {
      const block1 = createTestBlock("constant");
      const block2 = createTestBlock("constant");

      assert(compareBlocks(block1, block2));
    });

    it("compares different blocks correctly", () => {
      const block1 = createTestBlock("constant");
      const block2 = createTestBlock("gradient");

      assert(!compareBlocks(block1, block2));
    });

    it("handles tolerance correctly", () => {
      // Create 8x8 blocks for proper comparison
      const block1 = Array(8)
        .fill()
        .map(() => Array(8).fill(1.0));
      const block2 = Array(8)
        .fill()
        .map(() => Array(8).fill(1.005));

      // Should pass with tolerance 0.01
      assert(compareBlocks(block1, block2, 0.01));

      // Should fail with tolerance 0.001
      assert(!compareBlocks(block1, block2, 0.001));
    });

    it("handles invalid inputs gracefully", () => {
      assert(!compareBlocks(null, null));
      assert(!compareBlocks([], []));
      assert(!compareBlocks([[1, 2]], [[1, 2, 3]]));
    });
  });

  describe("analyzeDCTEnergy", () => {
    it("analyzes constant block energy correctly", () => {
      const constantBlock = createTestBlock("constant");
      const dctBlock = forwardDCT(constantBlock);
      const energy = analyzeDCTEnergy(dctBlock);

      // Constant block should have only DC energy
      assert(energy.dcEnergy > 0, "DC energy should be positive");
      assert(energy.acEnergy < 0.01, "AC energy should be near zero");
      assert.equal(energy.totalEnergy, energy.dcEnergy + energy.acEnergy);
    });

    it("analyzes gradient block energy correctly", () => {
      const gradientBlock = createTestBlock("gradient");
      const dctBlock = forwardDCT(gradientBlock);
      const energy = analyzeDCTEnergy(dctBlock);

      // Gradient should have both DC and AC energy
      assert(energy.dcEnergy > 0, "DC energy should be positive");
      assert(energy.acEnergy > 0, "AC energy should be positive");
      assert(energy.lowFreqEnergy > energy.highFreqEnergy, "Low frequencies should dominate");
    });

    it("calculates total energy correctly", () => {
      const testBlock = createTestBlock("checkerboard");
      const dctBlock = forwardDCT(testBlock);
      const energy = analyzeDCTEnergy(dctBlock);

      // Total should equal sum of components
      const calculatedTotal = energy.dcEnergy + energy.acEnergy;
      assert(
        Math.abs(energy.totalEnergy - calculatedTotal) < 0.01,
        "Total energy should equal sum of DC and AC components"
      );

      const calculatedAC = energy.lowFreqEnergy + energy.highFreqEnergy;
      assert(
        Math.abs(energy.acEnergy - calculatedAC) < 0.01,
        "AC energy should equal sum of low and high frequency components"
      );
    });

    it("validates input block", () => {
      assert.throws(() => analyzeDCTEnergy([]), /DCT energy analysis/);
    });
  });

  describe("Performance", () => {
    it("handles multiple DCT operations efficiently", () => {
      const testBlocks = [];

      // Create multiple test blocks
      for (let i = 0; i < 100; i++) {
        testBlocks.push(
          Array(8)
            .fill()
            .map(() =>
              Array(8)
                .fill()
                .map(() => Math.floor(Math.random() * 256))
            )
        );
      }

      // Should complete all operations without timeout
      for (const block of testBlocks) {
        const dctBlock = forwardDCT(block);
        const reconstructed = inverseDCT(dctBlock);

        // Verify correctness
        assert(compareBlocks(block, reconstructed, 0.01));
      }
    });

    it("reuses cosine tables efficiently", () => {
      // Multiple calls should reuse pre-computed tables
      const block1 = createTestBlock("gradient");
      const block2 = createTestBlock("checkerboard");

      const dct1 = forwardDCT(block1);
      const dct2 = forwardDCT(block2);

      // Should complete without errors (table reuse is internal)
      assert(dct1);
      assert(dct2);
    });
  });
});
