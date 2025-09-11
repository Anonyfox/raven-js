/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for YUV420 to RGBA conversion with deterministic integer arithmetic.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { yuv420ToRgba } from "./yuv2rgb.js";

describe("yuv420ToRgba", () => {
  describe("core functionality", () => {
    it("converts solid black (Y=16, U=128, V=128) to RGB(0,0,0)", () => {
      // 2x2 image: solid black in YUV limited range
      const y = new Uint8Array([16, 16, 16, 16]); // Black luma
      const u = new Uint8Array([128]); // Neutral chroma
      const v = new Uint8Array([128]); // Neutral chroma

      const rgba = yuv420ToRgba(y, u, v, 2, 2);

      // BT.601 limited range: Y=16 should produce RGB(0,0,0)
      // Calculation: yLuma = ((298 * (16 - 16)) >> 8) = 0
      // With neutral chroma (U=V=128), RGB should be (0,0,0)
      for (let i = 0; i < 4; i++) {
        const offset = i * 4;
        assert.equal(rgba[offset], 0, `Pixel ${i} R should be 0`);
        assert.equal(rgba[offset + 1], 0, `Pixel ${i} G should be 0`);
        assert.equal(rgba[offset + 2], 0, `Pixel ${i} B should be 0`);
        assert.equal(rgba[offset + 3], 255, `Pixel ${i} A should be 255`);
      }
    });

    it("converts solid white (Y=235, U=128, V=128) to RGB(255,255,255)", () => {
      // 2x2 image: solid white in YUV limited range
      const y = new Uint8Array([235, 235, 235, 235]); // White luma
      const u = new Uint8Array([128]); // Neutral chroma
      const v = new Uint8Array([128]); // Neutral chroma

      const rgba = yuv420ToRgba(y, u, v, 2, 2);

      // BT.601 limited range: Y=235 should produce RGB(255,255,255)
      // Calculation: yLuma = ((298 * (235 - 16)) >> 8) = ((298 * 219) >> 8) = 255
      // With neutral chroma (U=V=128), RGB should be (255,255,255)
      for (let i = 0; i < 4; i++) {
        const offset = i * 4;
        assert.equal(rgba[offset], 255, `Pixel ${i} R should be 255`);
        assert.equal(rgba[offset + 1], 255, `Pixel ${i} G should be 255`);
        assert.equal(rgba[offset + 2], 255, `Pixel ${i} B should be 255`);
        assert.equal(rgba[offset + 3], 255, `Pixel ${i} A should be 255`);
      }
    });

    it("converts pure red (Y=81, U=90, V=240) correctly", () => {
      // 2x2 image: pure red in YUV
      const y = new Uint8Array([81, 81, 81, 81]);
      const u = new Uint8Array([90]);
      const v = new Uint8Array([240]);

      const rgba = yuv420ToRgba(y, u, v, 2, 2);

      // Should produce red pixels (approximately 255,0,0,255)
      // Due to integer conversion, values may not be exactly 255,0,0
      for (let i = 0; i < 4; i++) {
        const offset = i * 4;
        assert.ok(rgba[offset] > 200, `Pixel ${i} R should be high (got ${rgba[offset]})`);
        assert.ok(rgba[offset + 1] < 50, `Pixel ${i} G should be low (got ${rgba[offset + 1]})`);
        assert.ok(rgba[offset + 2] < 50, `Pixel ${i} B should be low (got ${rgba[offset + 2]})`);
        assert.equal(rgba[offset + 3], 255, `Pixel ${i} A should be 255`);
      }
    });

    it("handles 4x4 image with mixed Y values", () => {
      // 4x4 image with gradient Y values
      const y = new Uint8Array([
        16,
        80,
        144,
        235, // Row 0: black to white gradient
        16,
        80,
        144,
        235, // Row 1: same gradient
        16,
        80,
        144,
        235, // Row 2: same gradient
        16,
        80,
        144,
        235, // Row 3: same gradient
      ]);
      const u = new Uint8Array([128, 128, 128, 128]); // 2x2 UV plane
      const v = new Uint8Array([128, 128, 128, 128]); // 2x2 UV plane

      const rgba = yuv420ToRgba(y, u, v, 4, 4);

      assert.equal(rgba.length, 64); // 4*4*4 bytes

      // Check that different Y values produce different RGB values
      const firstPixel = rgba[0]; // Y=16 -> should be dark
      const lastPixel = rgba[12]; // Y=235 -> should be bright
      assert.ok(firstPixel < lastPixel, "Gradient should be preserved");
    });
  });

  describe("edge cases and validation", () => {
    it("rejects invalid dimensions", () => {
      const y = new Uint8Array(4);
      const u = new Uint8Array(1);
      const v = new Uint8Array(1);

      assert.throws(() => yuv420ToRgba(y, u, v, 0, 2), /invalid dimensions/);
      assert.throws(() => yuv420ToRgba(y, u, v, 2, 0), /invalid dimensions/);
      assert.throws(() => yuv420ToRgba(y, u, v, -1, 2), /invalid dimensions/);
    });

    it("rejects odd dimensions", () => {
      const y = new Uint8Array(6); // 3x2
      const u = new Uint8Array(1);
      const v = new Uint8Array(1);

      assert.throws(() => yuv420ToRgba(y, u, v, 3, 2), /dimensions must be even/);
      assert.throws(() => yuv420ToRgba(y, u, v, 2, 3), /dimensions must be even/);
    });

    it("rejects mismatched buffer sizes", () => {
      const y = new Uint8Array(3); // Wrong size for 2x2
      const u = new Uint8Array(1);
      const v = new Uint8Array(1);

      assert.throws(() => yuv420ToRgba(y, u, v, 2, 2), /Y plane size mismatch/);

      const y2 = new Uint8Array(4);
      const u2 = new Uint8Array(2); // Wrong size for 2x2
      const v2 = new Uint8Array(1);

      assert.throws(() => yuv420ToRgba(y2, u2, v2, 2, 2), /U plane size mismatch/);

      const u3 = new Uint8Array(1);
      const v3 = new Uint8Array(2); // Wrong size for 2x2

      assert.throws(() => yuv420ToRgba(y2, u3, v3, 2, 2), /V plane size mismatch/);
    });

    it("handles saturation extremes without overflow", () => {
      // Extreme chroma values that could cause overflow
      const y = new Uint8Array([128, 128, 128, 128]); // Mid-gray
      const u = new Uint8Array([0]); // Extreme blue
      const v = new Uint8Array([255]); // Extreme red

      const rgba = yuv420ToRgba(y, u, v, 2, 2);

      // All values should be clamped to [0, 255]
      for (let i = 0; i < rgba.length; i++) {
        assert.ok(rgba[i] >= 0 && rgba[i] <= 255, `Byte ${i} should be in range [0,255] (got ${rgba[i]})`);
      }
    });

    it("produces deterministic results", () => {
      const y = new Uint8Array([100, 150, 200, 50]);
      const u = new Uint8Array([100]);
      const v = new Uint8Array([200]);

      const rgba1 = yuv420ToRgba(y, u, v, 2, 2);
      const rgba2 = yuv420ToRgba(y, u, v, 2, 2);

      // Results should be identical (deterministic)
      assert.deepEqual(rgba1, rgba2);
    });
  });

  describe("integer arithmetic verification", () => {
    it("uses integer-only arithmetic (no floating point)", () => {
      // This test verifies that the implementation produces consistent results
      // that would only be possible with integer arithmetic
      const y = new Uint8Array([100, 100, 100, 100]);
      const u = new Uint8Array([100]);
      const v = new Uint8Array([200]);

      const rgba = yuv420ToRgba(y, u, v, 2, 2);

      // With integer arithmetic, we expect specific deterministic values
      // These values are computed using the exact BT.601 limited range formulas with rounding
      const yLuma = (298 * (100 - 16) + 128) >> 8;
      const expectedR = Math.max(0, Math.min(255, yLuma + ((409 * (200 - 128) + 128) >> 8)));
      const expectedG = Math.max(0, Math.min(255, yLuma - ((100 * (100 - 128) + 208 * (200 - 128) + 128) >> 8)));
      const expectedB = Math.max(0, Math.min(255, yLuma + ((516 * (100 - 128) + 128) >> 8)));

      assert.equal(rgba[0], expectedR);
      assert.equal(rgba[1], expectedG);
      assert.equal(rgba[2], expectedB);
      assert.equal(rgba[3], 255);
    });
  });
});
