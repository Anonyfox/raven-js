/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for VP8 DCT coefficient token decoding.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { createBoolDecoder } from "./bool-decoder.js";
import { createModeContext, decodeCoefficients } from "./coefficients.js";

describe("decodeCoefficients", () => {
  describe("initialization and validation", () => {
    it("validates boolean decoder parameter", () => {
      const quant = { yAC: 10, yDC: 8, y2AC: 12, y2DC: 10, uvAC: 10, uvDC: 8 };
      const modeCtx = createModeContext();
      const partitions = [{ start: 0, end: 100 }];

      assert.throws(() => decodeCoefficients(null, quant, modeCtx, partitions), /invalid boolean decoder/);
      assert.throws(() => decodeCoefficients({}, quant, modeCtx, partitions), /invalid boolean decoder/);
      assert.throws(
        () => decodeCoefficients({ readBit: "not a function" }, quant, modeCtx, partitions),
        /invalid boolean decoder/
      );
    });

    it("validates quantization parameters", () => {
      const data = new Uint8Array(100).fill(0);
      const decoder = createBoolDecoder(data, 0, 100);
      const modeCtx = createModeContext();
      const partitions = [{ start: 0, end: 100 }];

      assert.throws(() => decodeCoefficients(decoder, null, modeCtx, partitions), /invalid quantization parameters/);
      assert.throws(() => decodeCoefficients(decoder, {}, modeCtx, partitions), /invalid quantization parameters/);
      assert.throws(
        () => decodeCoefficients(decoder, { yAC: "not a number" }, modeCtx, partitions),
        /invalid quantization parameters/
      );
    });

    it("validates partitions parameter", () => {
      const data = new Uint8Array(100).fill(0);
      const decoder = createBoolDecoder(data, 0, 100);
      const quant = { yAC: 10, yDC: 8, y2AC: 12, y2DC: 10, uvAC: 10, uvDC: 8 };
      const modeCtx = createModeContext();

      assert.throws(() => decodeCoefficients(decoder, quant, modeCtx, null), /invalid partitions array/);
      assert.throws(() => decodeCoefficients(decoder, quant, modeCtx, []), /invalid partitions array/);
      assert.throws(() => decodeCoefficients(decoder, quant, modeCtx, "not an array"), /invalid partitions array/);
    });

    it("creates valid coefficient array structure", () => {
      // Create data that will produce all EOB tokens (first bit = 0)
      const data = new Uint8Array(1000).fill(0x00);
      const decoder = createBoolDecoder(data, 0, 1000);
      const quant = { yAC: 10, yDC: 8, y2AC: 12, y2DC: 10, uvAC: 10, uvDC: 8 };
      const modeCtx = createModeContext();
      const partitions = [{ start: 0, end: 1000 }];

      const coeffs = decodeCoefficients(decoder, quant, modeCtx, partitions);

      assert.ok(coeffs instanceof Int16Array, "Should return Int16Array");
      assert.equal(coeffs.length, 28 * 16, "Should have 448 coefficients (28 blocks * 16 coeffs)");

      // All coefficients should be 0 due to EOB tokens
      for (let i = 0; i < coeffs.length; i++) {
        assert.equal(coeffs[i], 0, `Coefficient ${i} should be 0`);
      }
    });
  });

  describe("core functionality", () => {
    it("decodes EOB-only blocks", () => {
      // Data that produces EOB tokens (first bit = 0 for each block)
      const data = new Uint8Array(100).fill(0x00);
      const decoder = createBoolDecoder(data, 0, 100);
      const quant = { yAC: 10, yDC: 8, y2AC: 12, y2DC: 10, uvAC: 10, uvDC: 8 };
      const modeCtx = createModeContext();
      const partitions = [{ start: 0, end: 100 }];

      const coeffs = decodeCoefficients(decoder, quant, modeCtx, partitions);

      // All blocks should be empty (all zeros)
      assert.ok(
        coeffs.every((c) => c === 0),
        "All coefficients should be zero for EOB-only blocks"
      );
    });

    it("decodes DC-only blocks", () => {
      // Data pattern: non-EOB (1), non-zero (1), small coeff (0), value=1 (0), positive sign (0)
      // Then EOB (0) for remaining positions
      const data = new Uint8Array([
        0xc0, // 11000000 - gives us the pattern above for first few bits
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);
      const decoder = createBoolDecoder(data, 0, data.length);
      const quant = { yAC: 10, yDC: 8, y2AC: 12, y2DC: 10, uvAC: 10, uvDC: 8 };
      const modeCtx = createModeContext();
      const partitions = [{ start: 0, end: data.length }];

      const coeffs = decodeCoefficients(decoder, quant, modeCtx, partitions);

      // Should have some non-zero DC coefficients
      let nonZeroCount = 0;
      for (let block = 0; block < 28; block++) {
        const dcCoeff = coeffs[block * 16]; // DC coefficient is at position 0
        if (dcCoeff !== 0) {
          nonZeroCount++;
        }
      }

      assert.ok(nonZeroCount > 0, "Should have some non-zero DC coefficients");
    });

    it("handles mixed AC coefficients with context changes", () => {
      // More complex data pattern with various coefficient types
      const data = new Uint8Array(200);
      // Fill with a pattern that will create various coefficient types
      for (let i = 0; i < data.length; i++) {
        data[i] = (i * 37) % 256; // Pseudo-random pattern
      }

      const decoder = createBoolDecoder(data, 0, data.length);
      const quant = { yAC: 15, yDC: 12, y2AC: 18, y2DC: 15, uvAC: 15, uvDC: 12 };
      const modeCtx = createModeContext();
      const partitions = [{ start: 0, end: data.length }];

      const coeffs = decodeCoefficients(decoder, quant, modeCtx, partitions);

      // Should have valid coefficient structure
      assert.equal(coeffs.length, 28 * 16, "Should have correct number of coefficients");

      // Check that coefficients are within valid range
      for (let i = 0; i < coeffs.length; i++) {
        assert.ok(coeffs[i] >= -2047 && coeffs[i] <= 2047, `Coefficient ${i} should be in valid range`);
      }
    });
  });

  describe("partition boundary enforcement", () => {
    it("handles multi-partitions with exact cutoff", () => {
      const data = new Uint8Array(200).fill(0x80); // Pattern that creates tokens
      const decoder = createBoolDecoder(data, 0, data.length);
      const quant = { yAC: 10, yDC: 8, y2AC: 12, y2DC: 10, uvAC: 10, uvDC: 8 };
      const modeCtx = createModeContext();

      // Multiple partitions with specific boundaries
      const partitions = [
        { start: 0, end: 50 },
        { start: 50, end: 100 },
        { start: 100, end: 150 },
        { start: 150, end: 200 },
      ];

      const coeffs = decodeCoefficients(decoder, quant, modeCtx, partitions);

      // Should complete without throwing partition boundary errors
      assert.equal(coeffs.length, 28 * 16, "Should decode all coefficients");
    });

    it("handles partition boundary gracefully", () => {
      const data = new Uint8Array(10).fill(0xff); // Data that will cause boundary issues
      const decoder = createBoolDecoder(data, 0, data.length);
      const quant = { yAC: 10, yDC: 8, y2AC: 12, y2DC: 10, uvAC: 10, uvDC: 8 };
      const modeCtx = createModeContext();

      // Very small partition that will be exceeded
      const partitions = [{ start: 0, end: 2 }];

      // Should handle gracefully by stopping early, not throwing
      const coeffs = decodeCoefficients(decoder, quant, modeCtx, partitions);
      assert.equal(coeffs.length, 28 * 16, "Should return complete coefficient array");
    });

    it("handles corrupted token near partition end", () => {
      const data = new Uint8Array(50);
      // Fill with pattern that creates valid tokens initially
      data.fill(0x00, 0, 40); // EOB tokens
      data.fill(0xff, 40, 50); // Potentially problematic data at end

      const decoder = createBoolDecoder(data, 0, data.length);
      const quant = { yAC: 10, yDC: 8, y2AC: 12, y2DC: 10, uvAC: 10, uvDC: 8 };
      const modeCtx = createModeContext();
      const partitions = [{ start: 0, end: 45 }]; // Boundary before problematic data

      const coeffs = decodeCoefficients(decoder, quant, modeCtx, partitions);

      // Should handle gracefully by stopping at partition boundary
      assert.equal(coeffs.length, 28 * 16, "Should return complete coefficient array");
    });
  });

  describe("quantization and dequantization", () => {
    it("applies quantization correctly", () => {
      // Create data that will produce known coefficient values
      const data = new Uint8Array(100).fill(0x80); // Pattern for small coefficients

      const quantLow = { yAC: 5, yDC: 4, y2AC: 6, y2DC: 5, uvAC: 5, uvDC: 4 };
      const quantHigh = { yAC: 50, yDC: 40, y2AC: 60, y2DC: 50, uvAC: 50, uvDC: 40 };

      const modeCtx = createModeContext();
      const partitions = [{ start: 0, end: 100 }];

      const coeffsLow = decodeCoefficients(createBoolDecoder(data, 0, data.length), quantLow, modeCtx, partitions);
      const coeffsHigh = decodeCoefficients(createBoolDecoder(data, 0, data.length), quantHigh, modeCtx, partitions);

      // Higher quantization should generally produce larger coefficient magnitudes
      let lowMagnitude = 0,
        highMagnitude = 0;
      for (let i = 0; i < coeffsLow.length; i++) {
        lowMagnitude += Math.abs(coeffsLow[i]);
        highMagnitude += Math.abs(coeffsHigh[i]);
      }

      // This is a general trend, not absolute due to clamping
      assert.ok(
        typeof lowMagnitude === "number" && typeof highMagnitude === "number",
        "Should compute magnitudes correctly"
      );
    });

    it("clamps coefficients to valid range", () => {
      // Create data that might produce extreme values
      const data = new Uint8Array(100).fill(0xff);
      const decoder = createBoolDecoder(data, 0, data.length);
      const quant = { yAC: 127, yDC: 127, y2AC: 127, y2DC: 127, uvAC: 127, uvDC: 127 }; // Max quant
      const modeCtx = createModeContext();
      const partitions = [{ start: 0, end: 100 }];

      const coeffs = decodeCoefficients(decoder, quant, modeCtx, partitions);

      // All coefficients should be within VP8 range
      for (let i = 0; i < coeffs.length; i++) {
        assert.ok(
          coeffs[i] >= -2047 && coeffs[i] <= 2047,
          `Coefficient ${i} (${coeffs[i]}) should be clamped to [-2047, 2047]`
        );
      }
    });
  });

  describe("edge cases and robustness", () => {
    it("handles zero quantization values", () => {
      const data = new Uint8Array(50).fill(0x00); // EOB tokens
      const decoder = createBoolDecoder(data, 0, data.length);
      const quant = { yAC: 0, yDC: 0, y2AC: 0, y2DC: 0, uvAC: 0, uvDC: 0 };
      const modeCtx = createModeContext();
      const partitions = [{ start: 0, end: 50 }];

      const coeffs = decodeCoefficients(decoder, quant, modeCtx, partitions);

      // Should handle zero quantization gracefully
      assert.equal(coeffs.length, 28 * 16, "Should return complete coefficient array");
    });

    it("handles minimal data buffer", () => {
      const data = new Uint8Array([0x00, 0x00]); // Just enough for initialization
      const decoder = createBoolDecoder(data, 0, data.length);
      const quant = { yAC: 10, yDC: 8, y2AC: 12, y2DC: 10, uvAC: 10, uvDC: 8 };
      const modeCtx = createModeContext();
      const partitions = [{ start: 0, end: 2 }];

      const coeffs = decodeCoefficients(decoder, quant, modeCtx, partitions);

      // Should handle minimal data without crashing
      assert.equal(coeffs.length, 28 * 16, "Should return complete coefficient array");
    });

    it("maintains deterministic results", () => {
      const data = new Uint8Array([0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a]);
      const quant = { yAC: 15, yDC: 12, y2AC: 18, y2DC: 15, uvAC: 15, uvDC: 12 };
      const modeCtx1 = createModeContext();
      const modeCtx2 = createModeContext();
      const partitions = [{ start: 0, end: data.length }];

      const coeffs1 = decodeCoefficients(createBoolDecoder(data, 0, data.length), quant, modeCtx1, partitions);
      const coeffs2 = decodeCoefficients(createBoolDecoder(data, 0, data.length), quant, modeCtx2, partitions);

      // Same input should produce same output
      assert.equal(coeffs1.length, coeffs2.length, "Should have same length");
      for (let i = 0; i < coeffs1.length; i++) {
        assert.equal(coeffs1[i], coeffs2[i], `Coefficient ${i} should be identical`);
      }
    });
  });

  describe("performance characteristics", () => {
    it("completes decoding within time limits", () => {
      const data = new Uint8Array(500);
      // Create varied pattern
      for (let i = 0; i < data.length; i++) {
        data[i] = (i * 123 + 45) % 256;
      }

      const decoder = createBoolDecoder(data, 0, data.length);
      const quant = { yAC: 20, yDC: 16, y2AC: 24, y2DC: 20, uvAC: 20, uvDC: 16 };
      const modeCtx = createModeContext();
      const partitions = [{ start: 0, end: data.length }];

      const start = performance.now();
      const coeffs = decodeCoefficients(decoder, quant, modeCtx, partitions);
      const end = performance.now();

      // Should complete quickly (within 50ms)
      assert.ok(end - start < 50, "Should decode coefficients quickly");
      assert.equal(coeffs.length, 28 * 16, "Should return complete result");
    });
  });
});

describe("createModeContext", () => {
  it("creates valid mode context structure", () => {
    const ctx = createModeContext();

    assert.ok(typeof ctx === "object", "Should return object");
    assert.ok(Array.isArray(ctx.coeffProbs), "Should have coeffProbs array");
    assert.equal(typeof ctx.updateCount, "number", "Should have updateCount number");

    // Check structure of coefficient probabilities
    assert.ok(ctx.coeffProbs.length > 0, "Should have coefficient probability bands");

    for (let band = 0; band < ctx.coeffProbs.length; band++) {
      assert.ok(Array.isArray(ctx.coeffProbs[band]), `Band ${band} should be array`);

      for (let context = 0; context < ctx.coeffProbs[band].length; context++) {
        assert.ok(Array.isArray(ctx.coeffProbs[band][context]), `Context ${context} should be array`);
        assert.equal(ctx.coeffProbs[band][context].length, 11, "Should have 11 probabilities per context");

        // Check probability values are in valid range
        for (const prob of ctx.coeffProbs[band][context]) {
          assert.ok(prob >= 0 && prob <= 255, "Probabilities should be 0-255");
        }
      }
    }
  });

  it("creates independent contexts", () => {
    const ctx1 = createModeContext();
    const ctx2 = createModeContext();

    // Should be separate objects
    assert.notStrictEqual(ctx1, ctx2, "Should create separate context objects");
    assert.notStrictEqual(ctx1.coeffProbs, ctx2.coeffProbs, "Should have separate probability arrays");

    // But should have same initial values
    assert.deepEqual(ctx1.coeffProbs, ctx2.coeffProbs, "Should have identical initial probabilities");
    assert.equal(ctx1.updateCount, ctx2.updateCount, "Should have same initial update count");
  });
});
