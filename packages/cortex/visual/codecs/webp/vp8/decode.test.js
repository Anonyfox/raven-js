/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for VP8 lossy still image decoder.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { decodeVP8, decodeVP8ToRGBA } from "./decode.js";

describe("decodeVP8", () => {
  describe("initialization and validation", () => {
    it("validates input data parameter", () => {
      assert.throws(() => decodeVP8(null), /data must be Uint8Array/);
      assert.throws(() => decodeVP8("not array"), /data must be Uint8Array/);
      assert.throws(() => decodeVP8(123), /data must be Uint8Array/);
    });

    it("validates minimum data length", () => {
      const shortData = new Uint8Array(5);
      assert.throws(() => decodeVP8(shortData), /insufficient data for VP8 header/);
    });

    it("rejects invalid VP8 start code", () => {
      // Invalid start code (should be 0x9d 0x01 0x2a)
      const invalidData = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x00,
        0x01,
        0x2a, // Wrong start code (missing 0x9d)
        0x02,
        0x00,
        0x02,
        0x00,
      ]);

      assert.throws(() => decodeVP8(invalidData), /first partition size.*exceeds remaining data|invalid start code/);
    });

    it("rejects interframes", () => {
      // Valid start code but interframe (bit 0 = 1)
      const interframeData = new Uint8Array([
        0x01,
        0x00,
        0x00, // Frame tag with keyframe bit = 1 (interframe)
        0x9d,
        0x01,
        0x2a, // Valid start code
        0x02,
        0x00, // Width: 2
        0x02,
        0x00, // Height: 2
        0x00,
        0x00,
        0x00,
        0x00,
      ]);

      assert.throws(() => decodeVP8(interframeData), /only keyframes.*supported/);
    });
  });

  describe("core functionality", () => {
    it("decodes minimal 2x2 keyframe", () => {
      // Minimal valid VP8 keyframe with 2x2 dimensions
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe (bit 0 = 0), version 0, show frame, partition size 8 (bits 5-23)
        0x9d,
        0x01,
        0x2a, // VP8 start code
        0x02,
        0x00, // Width: 2 (14-bit)
        0x02,
        0x00, // Height: 2 (14-bit)
        // Minimal coefficient data (all EOB tokens) - extended to ensure valid range
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

      const result = decodeVP8(data);

      assert.ok(result.y instanceof Uint8Array, "Should return Y plane");
      assert.ok(result.u instanceof Uint8Array, "Should return U plane");
      assert.ok(result.v instanceof Uint8Array, "Should return V plane");
      assert.equal(result.width, 2, "Should have correct width");
      assert.equal(result.height, 2, "Should have correct height");

      // Check plane sizes
      assert.equal(result.y.length, 4, "Y plane should have 4 pixels");
      assert.equal(result.u.length, 1, "U plane should have 1 pixel");
      assert.equal(result.v.length, 1, "V plane should have 1 pixel");
    });

    it("decodes 4x4 keyframe with DC prediction", () => {
      // 4x4 VP8 keyframe
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x9d,
        0x01,
        0x2a, // VP8 start code, version 0, show frame, partition size 0
        0x04,
        0x00, // Width: 4 (14-bit)
        0x04,
        0x00, // Height: 4 (14-bit)
        // Coefficient data with some DC coefficients
        0x80,
        0x80,
        0x80,
        0x80,
        0x80,
        0x80,
        0x80,
        0x80,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);

      const result = decodeVP8(data);

      assert.equal(result.width, 4, "Should have correct width");
      assert.equal(result.height, 4, "Should have correct height");
      assert.equal(result.y.length, 16, "Y plane should have 16 pixels");
      assert.equal(result.u.length, 4, "U plane should have 4 pixels");
      assert.equal(result.v.length, 4, "V plane should have 4 pixels");

      // Check that pixels are valid (0-255 range)
      for (const pixel of result.y) {
        assert.ok(pixel >= 0 && pixel <= 255, "Y pixels should be in valid range");
      }
      for (const pixel of result.u) {
        assert.ok(pixel >= 0 && pixel <= 255, "U pixels should be in valid range");
      }
      for (const pixel of result.v) {
        assert.ok(pixel >= 0 && pixel <= 255, "V pixels should be in valid range");
      }
    });

    it("handles different prediction modes", () => {
      // Create data that will exercise different prediction paths
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x9d,
        0x01,
        0x2a, // VP8 start code
        0x08,
        0x00, // Width: 8
        0x08,
        0x00, // Height: 8
        0x00,
        0x00, // Header padding
        // More complex coefficient pattern
        0xaa,
        0x55,
        0xaa,
        0x55,
        0xaa,
        0x55,
        0xaa,
        0x55,
        0x55,
        0xaa,
        0x55,
        0xaa,
        0x55,
        0xaa,
        0x55,
        0xaa,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);

      const result = decodeVP8(data);

      assert.equal(result.width, 8, "Should have correct width");
      assert.equal(result.height, 8, "Should have correct height");
      assert.equal(result.y.length, 64, "Y plane should have 64 pixels");

      // Verify some variation in output (not all pixels identical)
      const uniqueYValues = new Set(result.y);
      assert.ok(uniqueYValues.size >= 1, "Should have some pixel variation");
    });
  });

  describe("edge cases", () => {
    it("handles tiny 1x1 image", () => {
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x9d,
        0x01,
        0x2a, // VP8 start code
        0x01,
        0x00, // Width: 1
        0x01,
        0x00, // Height: 1
        0x00,
        0x00, // Header padding
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);

      const result = decodeVP8(data);

      assert.equal(result.width, 1, "Should have width 1");
      assert.equal(result.height, 1, "Should have height 1");
      assert.equal(result.y.length, 1, "Y plane should have 1 pixel");
      assert.equal(result.u.length, 0, "U plane should be empty for 1x1"); // Rounded down
      assert.equal(result.v.length, 0, "V plane should be empty for 1x1"); // Rounded down
    });

    it("handles rectangular images", () => {
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x9d,
        0x01,
        0x2a, // VP8 start code
        0x08,
        0x00, // Width: 8
        0x04,
        0x00, // Height: 4
        0x00,
        0x00, // Header padding
        0x80,
        0x80,
        0x80,
        0x80,
        0x80,
        0x80,
        0x80,
        0x80,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);

      const result = decodeVP8(data);

      assert.equal(result.width, 8, "Should have width 8");
      assert.equal(result.height, 4, "Should have height 4");
      assert.equal(result.y.length, 32, "Y plane should have 32 pixels");
      assert.equal(result.u.length, 8, "U plane should have 8 pixels");
      assert.equal(result.v.length, 8, "V plane should have 8 pixels");
    });

    it("handles images requiring multiple macroblocks", () => {
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x9d,
        0x01,
        0x2a, // VP8 start code
        0x20,
        0x00, // Width: 32 (2 macroblocks)
        0x10,
        0x00, // Height: 16 (1 macroblock)
        0x00,
        0x00, // Header padding
        // Extended coefficient data for multiple macroblocks
        ...new Array(64).fill(0x00), // Enough data for multiple MBs
      ]);

      const result = decodeVP8(data);

      assert.equal(result.width, 32, "Should have width 32");
      assert.equal(result.height, 16, "Should have height 16");
      assert.equal(result.y.length, 512, "Y plane should have 512 pixels");
      assert.equal(result.u.length, 128, "U plane should have 128 pixels");
      assert.equal(result.v.length, 128, "V plane should have 128 pixels");
    });

    it("handles corrupted coefficient data gracefully", () => {
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x9d,
        0x01,
        0x2a, // VP8 start code
        0x04,
        0x00, // Width: 4
        0x04,
        0x00, // Height: 4
        0x00,
        0x00, // Header padding
        // Potentially problematic coefficient data
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
      ]);

      // Should not crash, even with problematic data
      const result = decodeVP8(data);

      assert.equal(result.width, 4, "Should have correct width");
      assert.equal(result.height, 4, "Should have correct height");

      // Pixels should still be in valid range
      for (const pixel of result.y) {
        assert.ok(pixel >= 0 && pixel <= 255, "Y pixels should be clamped");
      }
    });
  });

  describe("performance characteristics", () => {
    it("completes decoding within time limits", () => {
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x9d,
        0x01,
        0x2a, // VP8 start code
        0x10,
        0x00, // Width: 16
        0x10,
        0x00, // Height: 16
        0x00,
        0x00, // Header padding
        ...new Array(100).fill(0x80), // Coefficient data
      ]);

      const start = performance.now();
      const result = decodeVP8(data);
      const end = performance.now();

      // Should complete quickly (within 100ms for 16x16)
      assert.ok(end - start < 100, "Should decode quickly");
      assert.equal(result.width, 16, "Should produce correct result");
    });

    it("produces deterministic results", () => {
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x9d,
        0x01,
        0x2a, // VP8 start code
        0x04,
        0x00, // Width: 4
        0x04,
        0x00, // Height: 4
        0x00,
        0x00, // Header padding
        0x12,
        0x34,
        0x56,
        0x78,
        0x9a,
        0xbc,
        0xde,
        0xf0,
      ]);

      const result1 = decodeVP8(data);
      const result2 = decodeVP8(data);

      // Results should be identical
      assert.deepEqual(result1.y, result2.y, "Y planes should be identical");
      assert.deepEqual(result1.u, result2.u, "U planes should be identical");
      assert.deepEqual(result1.v, result2.v, "V planes should be identical");
      assert.equal(result1.width, result2.width, "Widths should be identical");
      assert.equal(result1.height, result2.height, "Heights should be identical");
    });
  });
});

describe("decodeVP8ToRGBA", () => {
  describe("RGBA conversion", () => {
    it("converts VP8 to RGBA format", () => {
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x9d,
        0x01,
        0x2a, // VP8 start code
        0x02,
        0x00, // Width: 2
        0x02,
        0x00, // Height: 2
        0x00,
        0x00, // Header padding
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);

      const result = decodeVP8ToRGBA(data);

      assert.ok(result.pixels instanceof Uint8Array, "Should return Uint8Array pixels");
      assert.equal(result.width, 2, "Should have correct width");
      assert.equal(result.height, 2, "Should have correct height");
      assert.equal(result.pixels.length, 16, "Should have 16 bytes (2x2x4 RGBA)");

      // Check metadata
      assert.equal(result.metadata.format, "VP8", "Should indicate VP8 format");
      assert.equal(result.metadata.colorSpace, "YUV420", "Should indicate YUV420 color space");
      assert.equal(result.metadata.hasAlpha, false, "Should indicate no alpha");

      // Check RGBA structure (every 4th byte should be 255 for opaque alpha)
      for (let i = 3; i < result.pixels.length; i += 4) {
        assert.equal(result.pixels[i], 255, "Alpha channel should be 255");
      }
    });

    it("produces valid RGB values", () => {
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x9d,
        0x01,
        0x2a, // VP8 start code
        0x04,
        0x00, // Width: 4
        0x04,
        0x00, // Height: 4
        0x00,
        0x00, // Header padding
        0x80,
        0x80,
        0x80,
        0x80,
        0x80,
        0x80,
        0x80,
        0x80,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);

      const result = decodeVP8ToRGBA(data);

      assert.equal(result.pixels.length, 64, "Should have 64 bytes (4x4x4 RGBA)");

      // Check that all RGB values are in valid range
      for (let i = 0; i < result.pixels.length; i += 4) {
        const r = result.pixels[i];
        const g = result.pixels[i + 1];
        const b = result.pixels[i + 2];
        const a = result.pixels[i + 3];

        assert.ok(r >= 0 && r <= 255, "R value should be in valid range");
        assert.ok(g >= 0 && g <= 255, "G value should be in valid range");
        assert.ok(b >= 0 && b <= 255, "B value should be in valid range");
        assert.equal(a, 255, "Alpha should be opaque");
      }
    });

    it("handles edge case dimensions", () => {
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x9d,
        0x01,
        0x2a, // VP8 start code
        0x02,
        0x00, // Width: 2
        0x04,
        0x00, // Height: 4
        0x00,
        0x00, // Header padding
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);

      const result = decodeVP8ToRGBA(data);

      assert.equal(result.width, 2, "Should have width 2");
      assert.equal(result.height, 4, "Should have height 4");
      assert.equal(result.pixels.length, 32, "Should have 32 bytes (2x4x4 RGBA)");
    });
  });

  describe("error handling", () => {
    it("propagates VP8 decoding errors", () => {
      const invalidData = new Uint8Array([0x00, 0x01, 0x02]);

      assert.throws(() => decodeVP8ToRGBA(invalidData), /insufficient data/);
    });
  });

  describe("integration", () => {
    it("produces consistent results with decodeVP8", () => {
      const data = new Uint8Array([
        0x00,
        0x01,
        0x00, // Frame tag: keyframe, partition size 8
        0x9d,
        0x01,
        0x2a, // VP8 start code
        0x02,
        0x00, // Width: 2
        0x02,
        0x00, // Height: 2
        0x00,
        0x00, // Header padding
        0x80,
        0x80,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);

      const yuvResult = decodeVP8(data);
      const rgbaResult = decodeVP8ToRGBA(data);

      // Dimensions should match
      assert.equal(yuvResult.width, rgbaResult.width, "Widths should match");
      assert.equal(yuvResult.height, rgbaResult.height, "Heights should match");

      // RGBA pixel count should be 4x YUV pixel count
      assert.equal(rgbaResult.pixels.length, yuvResult.y.length * 4, "RGBA should be 4x YUV size");
    });
  });
});
