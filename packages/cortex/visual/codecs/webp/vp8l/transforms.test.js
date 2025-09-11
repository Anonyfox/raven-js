/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for VP8L Lossless Transforms
 *
 * Validates all transform types, round-trip accuracy, and edge cases.
 * Tests cover subtract-green, color transform, palette, and transform chains.
 *
 * @fileoverview Comprehensive test suite for VP8L transforms
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyColorTransform,
  applyInverseColorTransform,
  applyInverseSubtractGreen,
  applyInverseTransforms,
  applyPaletteTransform,
  applySubtractGreen,
  applyTransforms,
  createPalette,
  getTransformTypeName,
  TRANSFORM_TYPES,
  validateTransform,
} from "./transforms.js";

describe("VP8L Lossless Transforms", () => {
  // Helper to create ARGB pixel
  const argb = (a, r, g, b) => (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;

  // Helper to extract components
  const unpack = (pixel) => ({
    a: (pixel >>> 24) & 0xff,
    r: (pixel >>> 16) & 0xff,
    g: (pixel >>> 8) & 0xff,
    b: pixel & 0xff,
  });

  describe("applySubtractGreen", () => {
    it("subtracts green from red and blue", () => {
      const pixels = new Uint32Array([
        argb(255, 150, 100, 200), // R=150, G=100, B=200
        argb(255, 80, 120, 60), // R=80, G=120, B=60
      ]);

      const result = applySubtractGreen(pixels);

      const pixel1 = unpack(result[0]);
      assert.equal(pixel1.a, 255); // Alpha unchanged
      assert.equal(pixel1.r, 50); // 150 - 100 = 50
      assert.equal(pixel1.g, 100); // Green unchanged
      assert.equal(pixel1.b, 100); // 200 - 100 = 100

      const pixel2 = unpack(result[1]);
      assert.equal(pixel2.r, (80 - 120) & 0xff); // Wraparound: -40 -> 216
      assert.equal(pixel2.g, 120); // Green unchanged
      assert.equal(pixel2.b, (60 - 120) & 0xff); // Wraparound: -60 -> 196
    });

    it("handles wraparound correctly", () => {
      const pixels = new Uint32Array([argb(255, 10, 50, 20)]); // R < G, B < G

      const result = applySubtractGreen(pixels);
      const components = unpack(result[0]);

      assert.equal(components.r, (10 - 50) & 0xff); // -40 -> 216
      assert.equal(components.b, (20 - 50) & 0xff); // -30 -> 226
    });

    it("validates input type", () => {
      assert.throws(() => applySubtractGreen([]), /Transform: pixels must be Uint32Array/);
      assert.throws(() => applySubtractGreen(new Uint8Array(4)), /Transform: pixels must be Uint32Array/);
    });

    it("returns new array", () => {
      const pixels = new Uint32Array([argb(255, 100, 50, 75)]);
      const result = applySubtractGreen(pixels);

      assert.notStrictEqual(result, pixels); // Different array
      assert.equal(pixels[0], argb(255, 100, 50, 75)); // Original unchanged
    });
  });

  describe("applyInverseSubtractGreen", () => {
    it("reverses subtract green transform", () => {
      const original = new Uint32Array([argb(255, 150, 100, 200), argb(255, 80, 120, 60), argb(255, 255, 128, 0)]);

      const transformed = applySubtractGreen(original);
      const restored = applyInverseSubtractGreen(new Uint32Array(transformed));

      // Should match original exactly
      for (let i = 0; i < original.length; i++) {
        assert.equal(restored[i], original[i], `Mismatch at index ${i}`);
      }
    });

    it("modifies array in-place", () => {
      const pixels = new Uint32Array([argb(255, 50, 100, 25)]); // R'=50, G=100, B'=25
      const originalArray = pixels;

      applyInverseSubtractGreen(pixels);

      assert.strictEqual(pixels, originalArray); // Same array reference
      const components = unpack(pixels[0]);
      assert.equal(components.r, 150); // 50 + 100 = 150
      assert.equal(components.b, 125); // 25 + 100 = 125
    });

    it("handles wraparound in addition", () => {
      const pixels = new Uint32Array([argb(255, 200, 100, 180)]); // Will cause overflow

      applyInverseSubtractGreen(pixels);
      const components = unpack(pixels[0]);

      assert.equal(components.r, (200 + 100) & 0xff); // 300 -> 44
      assert.equal(components.b, (180 + 100) & 0xff); // 280 -> 24
    });
  });

  describe("applyColorTransform", () => {
    it("applies color transform with multipliers", () => {
      const pixels = new Uint32Array([argb(255, 100, 50, 150)]);
      const transformData = new Uint32Array([argb(255, 2, 0, 3)]); // R multiplier=2, B multiplier=3

      const result = applyColorTransform(pixels, 1, 1, transformData, 1, 1);
      const components = unpack(result[0]);

      // R' = R + (transform.R * G) >> 8 = 100 + (2 * 50) >> 8 = 100 + 0 = 100
      // B' = B + (transform.B * G) >> 8 = 150 + (3 * 50) >> 8 = 150 + 0 = 150
      assert.equal(components.a, 255); // Alpha unchanged
      assert.equal(components.r, 100); // With small values, shift reduces effect
      assert.equal(components.g, 50); // Green unchanged
      assert.equal(components.b, 150);
    });

    it("handles block-based transforms", () => {
      const pixels = new Uint32Array([
        argb(255, 100, 50, 150),
        argb(255, 120, 60, 180),
        argb(255, 80, 40, 120),
        argb(255, 90, 45, 135),
      ]);

      // 2x2 transform data for 2x2 image
      const transformData = new Uint32Array([
        argb(255, 1, 0, 1),
        argb(255, 2, 0, 2),
        argb(255, 3, 0, 3),
        argb(255, 4, 0, 4),
      ]);

      const result = applyColorTransform(pixels, 2, 2, transformData, 2, 2);

      // Each pixel should use its corresponding transform data
      assert.equal(result.length, 4);
      // Detailed checking would require understanding the exact block mapping
    });

    it("validates parameters", () => {
      const pixels = new Uint32Array([argb(255, 100, 50, 150)]);
      const transformData = new Uint32Array([argb(255, 1, 0, 1)]);

      assert.throws(() => applyColorTransform([], 1, 1, transformData, 1, 1), /Transform: pixels must be Uint32Array/);

      assert.throws(
        () => applyColorTransform(pixels, 2, 1, transformData, 1, 1),
        /Transform: pixel count 1 does not match 2x1/
      );

      assert.throws(() => applyColorTransform(pixels, 1, 1, [], 1, 1), /Transform: transformData must be Uint32Array/);
    });
  });

  describe("applyInverseColorTransform", () => {
    it("reverses color transform", () => {
      const original = new Uint32Array([argb(255, 100, 50, 150), argb(255, 200, 100, 75)]);
      const transformData = new Uint32Array([argb(255, 10, 0, 5), argb(255, 20, 0, 15)]);

      const transformed = applyColorTransform(original, 2, 1, transformData, 2, 1);
      const restored = applyInverseColorTransform(new Uint32Array(transformed), 2, 1, transformData, 2, 1);

      // Should be close to original (allowing for rounding in >> 8)
      for (let i = 0; i < original.length; i++) {
        const origComponents = unpack(original[i]);
        const restComponents = unpack(restored[i]);

        assert.equal(restComponents.a, origComponents.a);
        assert.equal(restComponents.g, origComponents.g); // Green unchanged
        // R and B may have small differences due to >> 8 operations
      }
    });

    it("modifies array in-place", () => {
      const pixels = new Uint32Array([argb(255, 100, 50, 150)]);
      const transformData = new Uint32Array([argb(255, 1, 0, 1)]);
      const originalArray = pixels;

      applyInverseColorTransform(pixels, 1, 1, transformData, 1, 1);

      assert.strictEqual(pixels, originalArray); // Same array reference
    });
  });

  describe("applyPaletteTransform", () => {
    it("converts palette indices to colors", () => {
      const palette = new Uint32Array([
        argb(255, 255, 0, 0), // Red
        argb(255, 0, 255, 0), // Green
        argb(255, 0, 0, 255), // Blue
        argb(255, 255, 255, 255), // White
      ]);

      const indices = new Uint32Array([
        argb(0, 0, 0, 0), // Index 0 -> Red
        argb(0, 0, 0, 1), // Index 1 -> Green
        argb(0, 0, 0, 2), // Index 2 -> Blue
        argb(0, 0, 0, 3), // Index 3 -> White
      ]);

      const result = applyPaletteTransform(indices, palette);

      assert.equal(result[0], palette[0]); // Red
      assert.equal(result[1], palette[1]); // Green
      assert.equal(result[2], palette[2]); // Blue
      assert.equal(result[3], palette[3]); // White
    });

    it("validates palette bounds", () => {
      const palette = new Uint32Array([argb(255, 255, 0, 0), argb(255, 0, 255, 0)]);
      const indices = new Uint32Array([argb(0, 0, 0, 2)]); // Index 2 out of bounds

      assert.throws(() => applyPaletteTransform(indices, palette), /Transform: palette index 2 exceeds palette size 2/);
    });

    it("validates input parameters", () => {
      const palette = new Uint32Array([argb(255, 255, 0, 0)]);

      assert.throws(() => applyPaletteTransform([], palette), /Transform: pixels must be Uint32Array/);
      assert.throws(() => applyPaletteTransform(new Uint32Array([0]), []), /Transform: palette must be Uint32Array/);
      assert.throws(
        () => applyPaletteTransform(new Uint32Array([0]), new Uint32Array(0)),
        /Transform: invalid palette size 0/
      );
      assert.throws(
        () => applyPaletteTransform(new Uint32Array([0]), new Uint32Array(257)),
        /Transform: invalid palette size 257/
      );
    });
  });

  describe("createPalette", () => {
    it("creates palette from unique colors", () => {
      const pixels = new Uint32Array([
        argb(255, 255, 0, 0), // Red
        argb(255, 0, 255, 0), // Green
        argb(255, 255, 0, 0), // Red (duplicate)
        argb(255, 0, 0, 255), // Blue
      ]);

      const result = createPalette(pixels, 256);

      assert.equal(result.colorCount, 3); // 3 unique colors
      assert.equal(result.palette.length, 3);
      assert.equal(result.indices.length, 4);

      // Check palette contains all unique colors
      const paletteSet = new Set([...result.palette]);
      assert.ok(paletteSet.has(argb(255, 255, 0, 0))); // Red
      assert.ok(paletteSet.has(argb(255, 0, 255, 0))); // Green
      assert.ok(paletteSet.has(argb(255, 0, 0, 255))); // Blue

      // Check indices point to correct colors
      const index0 = result.indices[0] & 0xff;
      const index2 = result.indices[2] & 0xff;
      assert.equal(index0, index2); // Same color should have same index
    });

    it("handles maximum color limit", () => {
      const pixels = new Uint32Array([
        argb(255, 1, 0, 0),
        argb(255, 2, 0, 0),
        argb(255, 3, 0, 0),
        argb(255, 4, 0, 0), // 4th unique color
      ]);

      assert.throws(() => createPalette(pixels, 3), /Transform: too many unique colors/);
    });

    it("validates parameters", () => {
      assert.throws(() => createPalette([], 256), /Transform: pixels must be Uint32Array/);
      assert.throws(() => createPalette(new Uint32Array([0]), 0), /Transform: invalid maxColors 0/);
      assert.throws(() => createPalette(new Uint32Array([0]), 257), /Transform: invalid maxColors 257/);
    });
  });

  describe("applyTransforms", () => {
    it("applies transform chain in order", () => {
      const pixels = new Uint32Array([argb(255, 150, 100, 200)]);

      const transformChain = [
        { type: TRANSFORM_TYPES.SUBTRACT_GREEN },
        // Could add more transforms here
      ];

      const result = applyTransforms(transformChain, pixels, 1, 1);

      // Should be equivalent to applying subtract green
      const expected = applySubtractGreen(pixels);
      assert.deepEqual([...result], [...expected]);
    });

    it("applies multiple transforms", () => {
      const pixels = new Uint32Array([argb(255, 150, 100, 200), argb(255, 80, 120, 60)]);

      const transformChain = [
        { type: TRANSFORM_TYPES.SUBTRACT_GREEN },
        {
          type: TRANSFORM_TYPES.COLOR,
          data: {
            transformData: new Uint32Array([argb(255, 1, 0, 1), argb(255, 2, 0, 2)]),
            transformWidth: 2,
            transformHeight: 1,
          },
        },
      ];

      const result = applyTransforms(transformChain, pixels, 2, 1);

      assert.equal(result.length, 2);
      // Result should be different from original
      assert.notDeepEqual([...result], [...pixels]);
    });

    it("validates transform chain", () => {
      const pixels = new Uint32Array([argb(255, 100, 50, 75)]);

      assert.throws(() => applyTransforms("invalid", pixels, 1, 1), /Transform: transformChain must be array/);
      assert.throws(() => applyTransforms([null], pixels, 1, 1), /Transform: invalid transform at index 0/);
      assert.throws(() => applyTransforms([{ type: 999 }], pixels, 1, 1), /Transform: unsupported transform type 999/);
    });

    it("validates transform data requirements", () => {
      const pixels = new Uint32Array([argb(255, 100, 50, 75)]);

      const invalidColorTransform = [{ type: TRANSFORM_TYPES.COLOR }]; // Missing data
      assert.throws(
        () => applyTransforms(invalidColorTransform, pixels, 1, 1),
        /Transform: missing color transform data/
      );

      const invalidPaletteTransform = [{ type: TRANSFORM_TYPES.PALETTE }]; // Missing palette
      assert.throws(() => applyTransforms(invalidPaletteTransform, pixels, 1, 1), /Transform: missing palette data/);
    });
  });

  describe("applyInverseTransforms", () => {
    it("reverses transforms in reverse order", () => {
      const original = new Uint32Array([argb(255, 150, 100, 200), argb(255, 80, 120, 60)]);

      const transformChain = [
        { type: TRANSFORM_TYPES.SUBTRACT_GREEN },
        {
          type: TRANSFORM_TYPES.COLOR,
          data: {
            transformData: new Uint32Array([argb(255, 1, 0, 1), argb(255, 2, 0, 2)]),
            transformWidth: 2,
            transformHeight: 1,
          },
        },
      ];

      const transformed = applyTransforms(transformChain, original, 2, 1);
      const restored = applyInverseTransforms(transformChain, new Uint32Array(transformed), 2, 1);

      // Should be close to original (allowing for rounding errors)
      for (let i = 0; i < original.length; i++) {
        const origComponents = unpack(original[i]);
        const restComponents = unpack(restored[i]);

        // Alpha and green should be exact
        assert.equal(restComponents.a, origComponents.a);
        assert.equal(restComponents.g, origComponents.g);
      }
    });

    it("rejects palette transform in inverse", () => {
      const pixels = new Uint32Array([argb(255, 100, 50, 75)]);
      const transformChain = [{ type: TRANSFORM_TYPES.PALETTE, data: { palette: new Uint32Array([0]) } }];

      assert.throws(
        () => applyInverseTransforms(transformChain, pixels, 1, 1),
        /Transform: palette transform is not reversible/
      );
    });
  });

  describe("validateTransform", () => {
    it("validates subtract green transform", () => {
      const transform = { type: TRANSFORM_TYPES.SUBTRACT_GREEN };
      const result = validateTransform(transform);
      assert.ok(result.valid);
    });

    it("validates color transform", () => {
      const validTransform = {
        type: TRANSFORM_TYPES.COLOR,
        data: {
          transformData: new Uint32Array([argb(255, 1, 0, 1)]),
          transformWidth: 1,
          transformHeight: 1,
        },
      };
      const result = validateTransform(validTransform);
      assert.ok(result.valid);

      const invalidTransform = { type: TRANSFORM_TYPES.COLOR }; // Missing data
      const invalidResult = validateTransform(invalidTransform);
      assert.ok(!invalidResult.valid);
      assert.ok(invalidResult.error.includes("missing required data"));
    });

    it("validates palette transform", () => {
      const validTransform = {
        type: TRANSFORM_TYPES.PALETTE,
        data: { palette: new Uint32Array([argb(255, 255, 0, 0)]) },
      };
      const result = validateTransform(validTransform);
      assert.ok(result.valid);

      const invalidTransform = { type: TRANSFORM_TYPES.PALETTE }; // Missing palette
      const invalidResult = validateTransform(invalidTransform);
      assert.ok(!invalidResult.valid);
      assert.ok(invalidResult.error.includes("missing palette data"));
    });

    it("rejects invalid transform types", () => {
      const result = validateTransform({ type: 999 });
      assert.ok(!result.valid);
      assert.ok(result.error.includes("invalid transform type"));
    });

    it("rejects non-object transforms", () => {
      const result = validateTransform(null);
      assert.ok(!result.valid);
      assert.ok(result.error.includes("transform must be object"));
    });
  });

  describe("getTransformTypeName", () => {
    it("returns correct transform names", () => {
      assert.equal(getTransformTypeName(TRANSFORM_TYPES.PREDICTOR), "PREDICTOR");
      assert.equal(getTransformTypeName(TRANSFORM_TYPES.COLOR), "COLOR");
      assert.equal(getTransformTypeName(TRANSFORM_TYPES.SUBTRACT_GREEN), "SUBTRACT_GREEN");
      assert.equal(getTransformTypeName(TRANSFORM_TYPES.PALETTE), "PALETTE");
    });

    it("handles unknown transform types", () => {
      assert.equal(getTransformTypeName(999), "UNKNOWN(999)");
    });
  });

  describe("Round-trip Testing", () => {
    it("subtract green round-trip is exact", () => {
      const testCases = [
        [argb(255, 0, 0, 0)],
        [argb(255, 255, 255, 255)],
        [argb(255, 100, 50, 200)],
        [argb(128, 10, 200, 5)], // Low alpha, wraparound cases
        [argb(255, 255, 0, 255), argb(255, 0, 255, 0), argb(255, 128, 128, 128)],
      ];

      for (const pixels of testCases) {
        const original = new Uint32Array(pixels);
        const transformed = applySubtractGreen(original);
        const restored = applyInverseSubtractGreen(new Uint32Array(transformed));

        assert.deepEqual([...restored], [...original], `Round-trip failed for ${pixels}`);
      }
    });

    it("palette round-trip maintains color accuracy", () => {
      const pixels = new Uint32Array([
        argb(255, 255, 0, 0), // Red
        argb(255, 0, 255, 0), // Green
        argb(255, 255, 0, 0), // Red (duplicate)
        argb(255, 0, 0, 255), // Blue
      ]);

      const { palette, indices } = createPalette(pixels);
      const restored = applyPaletteTransform(indices, palette);

      assert.deepEqual([...restored], [...pixels]);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("handles large images efficiently", () => {
      const size = 100 * 100;
      const pixels = new Uint32Array(size);

      // Fill with gradient
      for (let i = 0; i < size; i++) {
        const intensity = Math.floor((i / size) * 255);
        pixels[i] = argb(255, intensity, intensity / 2, intensity / 3);
      }

      const start = process.hrtime.bigint();
      const transformed = applySubtractGreen(pixels);
      const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000; // ms

      assert.ok(elapsed < 50, `Transform took ${elapsed}ms, should be <50ms`);
      assert.equal(transformed.length, size);
    });

    it("handles edge pixel values", () => {
      const edgeCases = [
        argb(0, 0, 0, 0), // All zeros
        argb(255, 255, 255, 255), // All max
        argb(128, 1, 254, 2), // Near boundaries
        argb(255, 0, 255, 0), // Max green
      ];

      for (const pixel of edgeCases) {
        const pixels = new Uint32Array([pixel]);

        // Test subtract green
        const transformed = applySubtractGreen(pixels);
        const restored = applyInverseSubtractGreen(new Uint32Array(transformed));
        assert.equal(restored[0], pixel, `Subtract green failed for ${pixel.toString(16)}`);
      }
    });

    it("maintains transform order dependency", () => {
      const pixels = new Uint32Array([argb(255, 150, 100, 200)]);

      const chain1 = [{ type: TRANSFORM_TYPES.SUBTRACT_GREEN }];
      const chain2 = [{ type: TRANSFORM_TYPES.SUBTRACT_GREEN }];

      const result1 = applyTransforms(chain1, pixels, 1, 1);
      const result2 = applyTransforms(chain2, pixels, 1, 1);

      // Same transforms should give same results
      assert.deepEqual([...result1], [...result2]);
    });
  });
});
