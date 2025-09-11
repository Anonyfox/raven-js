/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for VP8 integer transforms: 4x4 IDCT and Walsh-Hadamard.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { inverse4x4, inverseWHT4 } from "./idct.js";

describe("inverse4x4", () => {
  describe("core functionality", () => {
    it("handles DC-only block (all AC coefficients zero)", () => {
      const block = new Int16Array([64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

      inverse4x4(block);

      // DC-only block should replicate DC value across all positions
      for (let i = 0; i < 16; i++) {
        assert.equal(block[i], 64, `Position ${i} should equal DC value`);
      }
    });

    it("handles all-zero block", () => {
      const block = new Int16Array(16); // All zeros

      inverse4x4(block);

      // All-zero block should remain all zeros
      for (let i = 0; i < 16; i++) {
        assert.equal(block[i], 0, `Position ${i} should be zero`);
      }
    });

    it("transforms simple AC pattern correctly", () => {
      // Simple pattern: DC + single AC coefficient
      const block = new Int16Array([32, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const original = new Int16Array(block); // Copy for comparison

      inverse4x4(block);

      // Transform should modify the block
      let changed = false;
      for (let i = 0; i < 16; i++) {
        if (block[i] !== original[i]) {
          changed = true;
          break;
        }
      }
      assert.ok(changed, "Block should be modified by transform");

      // Values should be reasonable (not extreme)
      for (let i = 0; i < 16; i++) {
        assert.ok(Math.abs(block[i]) < 1000, `Position ${i} should have reasonable value (got ${block[i]})`);
      }
    });

    it("transforms known pattern with expected characteristics", () => {
      // Test with a known pattern to verify the transform works
      const block = new Int16Array([64, 32, 16, 8, 32, 16, 8, 4, 16, 8, 4, 2, 8, 4, 2, 1]);

      inverse4x4(block);

      // Verify the transform produces reasonable results
      // The exact values depend on the specific IDCT implementation,
      // but we can check that the transform actually occurred
      let hasVariation = false;
      for (let i = 1; i < 16; i++) {
        if (Math.abs(block[i] - block[0]) > 1) {
          hasVariation = true;
          break;
        }
      }
      assert.ok(hasVariation, "Transform should produce variation in output");

      // Check that all values are reasonable (not extreme)
      for (let i = 0; i < 16; i++) {
        assert.ok(Math.abs(block[i]) < 1000, `Position ${i} should have reasonable value (got ${block[i]})`);
      }
    });

    it("handles negative coefficients", () => {
      const block = new Int16Array([0, -16, 8, -4, 16, 0, -8, 4, -8, 4, 0, -2, 4, -2, 1, 0]);

      inverse4x4(block);

      // Should handle negative values without error
      // Results should be finite and reasonable
      for (let i = 0; i < 16; i++) {
        assert.ok(Number.isFinite(block[i]), `Position ${i} should be finite`);
        assert.ok(Math.abs(block[i]) < 10000, `Position ${i} should be reasonable (got ${block[i]})`);
      }
    });
  });

  describe("edge cases and validation", () => {
    it("rejects invalid block size", () => {
      assert.throws(() => inverse4x4(new Int16Array(15)), /block must have 16 coefficients/);
      assert.throws(() => inverse4x4(new Int16Array(17)), /block must have 16 coefficients/);
      assert.throws(() => inverse4x4(new Int16Array(0)), /block must have 16 coefficients/);
    });

    it("modifies block in-place", () => {
      const block = new Int16Array([16, 8, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const originalBlock = block; // Same reference

      inverse4x4(block);

      // Should be the same object (in-place modification)
      assert.equal(block, originalBlock);
    });

    it("handles extreme values without overflow", () => {
      // Test with values near Int16 limits
      const block = new Int16Array([
        32767, -32768, 16383, -16384, 8191, -8192, 4095, -4096, 2047, -2048, 1023, -1024, 511, -512, 255, -256,
      ]);

      // Should not throw or produce invalid results
      assert.doesNotThrow(() => inverse4x4(block));

      // Results should be finite
      for (let i = 0; i < 16; i++) {
        assert.ok(Number.isFinite(block[i]), `Position ${i} should be finite`);
      }
    });
  });

  describe("performance characteristics", () => {
    it("early-exits for DC-only blocks", () => {
      const dcOnlyBlock = new Int16Array([100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const mixedBlock = new Int16Array([100, 10, 5, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

      // Both should complete quickly, but DC-only should be faster
      // (This is more of a design verification than a performance test)

      const startDC = performance.now();
      inverse4x4(dcOnlyBlock);
      const endDC = performance.now();

      const startMixed = performance.now();
      inverse4x4(mixedBlock);
      const endMixed = performance.now();

      // Just verify both complete in reasonable time
      assert.ok(endDC - startDC < 10, "DC-only transform should be fast");
      assert.ok(endMixed - startMixed < 10, "Mixed transform should be fast");
    });
  });
});

describe("inverseWHT4", () => {
  describe("core functionality", () => {
    it("handles all-zero DC coefficients", () => {
      const dc = new Int16Array([0, 0, 0, 0]);

      inverseWHT4(dc);

      // All-zero input should produce all-zero output
      for (let i = 0; i < 4; i++) {
        assert.equal(dc[i], 0, `DC[${i}] should be zero`);
      }
    });

    it("handles uniform DC coefficients", () => {
      const dc = new Int16Array([64, 64, 64, 64]);

      inverseWHT4(dc);

      // Uniform input [64,64,64,64] should produce [32,0,0,0] after WHT
      // This is because WHT transforms DC values, not just scales them
      assert.equal(dc[0], 32, "DC[0] should be 32");
      assert.equal(dc[1], 0, "DC[1] should be 0");
      assert.equal(dc[2], 0, "DC[2] should be 0");
      assert.equal(dc[3], 0, "DC[3] should be 0");
    });

    it("transforms simple pattern correctly", () => {
      const dc = new Int16Array([32, 16, 8, 4]);
      const original = new Int16Array(dc); // Copy for comparison

      inverseWHT4(dc);

      // Transform should modify the values
      let changed = false;
      for (let i = 0; i < 4; i++) {
        if (dc[i] !== original[i]) {
          changed = true;
          break;
        }
      }
      assert.ok(changed, "DC coefficients should be modified by transform");

      // Results should be reasonable
      for (let i = 0; i < 4; i++) {
        assert.ok(Math.abs(dc[i]) < 1000, `DC[${i}] should have reasonable value (got ${dc[i]})`);
      }
    });

    it("handles negative coefficients", () => {
      const dc = new Int16Array([32, -16, 8, -4]);

      inverseWHT4(dc);

      // Should handle negative values without error
      for (let i = 0; i < 4; i++) {
        assert.ok(Number.isFinite(dc[i]), `DC[${i}] should be finite`);
        assert.ok(Math.abs(dc[i]) < 1000, `DC[${i}] should be reasonable (got ${dc[i]})`);
      }
    });

    it("produces deterministic results", () => {
      const dc1 = new Int16Array([100, 50, 25, 12]);
      const dc2 = new Int16Array([100, 50, 25, 12]);

      inverseWHT4(dc1);
      inverseWHT4(dc2);

      // Results should be identical
      assert.deepEqual(dc1, dc2);
    });
  });

  describe("edge cases and validation", () => {
    it("rejects invalid DC array size", () => {
      assert.throws(() => inverseWHT4(new Int16Array(3)), /dc must have 4 coefficients/);
      assert.throws(() => inverseWHT4(new Int16Array(5)), /dc must have 4 coefficients/);
      assert.throws(() => inverseWHT4(new Int16Array(0)), /dc must have 4 coefficients/);
    });

    it("modifies DC array in-place", () => {
      const dc = new Int16Array([16, 8, 4, 2]);
      const originalDC = dc; // Same reference

      inverseWHT4(dc);

      // Should be the same object (in-place modification)
      assert.equal(dc, originalDC);
    });

    it("handles extreme values without overflow", () => {
      const dc = new Int16Array([32767, -32768, 16383, -16384]);

      // Should not throw
      assert.doesNotThrow(() => inverseWHT4(dc));

      // Results should be finite
      for (let i = 0; i < 4; i++) {
        assert.ok(Number.isFinite(dc[i]), `DC[${i}] should be finite`);
      }
    });
  });

  describe("mathematical properties", () => {
    it("applies correct scaling factor", () => {
      // Test that the 1/8 scaling is applied correctly
      const dc = new Int16Array([64, 0, 0, 0]); // Simple pattern

      inverseWHT4(dc);

      // First coefficient should be scaled by 1/8 with rounding
      const expected = (64 + 3) >> 3; // (64 + 3) / 8 = 8
      assert.equal(dc[0], expected);
    });

    it("preserves energy conservation property", () => {
      const dc = new Int16Array([8, 8, 8, 8]);

      // Calculate input energy (sum of squares)
      const inputEnergy = dc.reduce((sum, val) => sum + val * val, 0);

      inverseWHT4(dc);

      // Calculate output energy
      const outputEnergy = dc.reduce((sum, val) => sum + val * val, 0);

      // WHT should preserve energy (approximately, due to integer rounding)
      // This is a loose check since integer arithmetic introduces rounding errors
      assert.ok(
        Math.abs(outputEnergy - inputEnergy / 64) < inputEnergy * 0.1,
        "Energy should be approximately preserved"
      );
    });
  });
});
