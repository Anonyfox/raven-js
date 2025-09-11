/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for VP8 loop filter.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { applyLoopFilter } from "./loop-filter.js";

describe("applyLoopFilter", () => {
  it("skips filtering when level is 0", () => {
    const yPlane = new Uint8Array(256).fill(100);
    const uPlane = new Uint8Array(64).fill(128);
    const vPlane = new Uint8Array(64).fill(128);
    const originalY = new Uint8Array(yPlane);

    applyLoopFilter(yPlane, uPlane, vPlane, 16, 16, { level: 0 });

    assert.deepEqual(yPlane, originalY, "Should not modify planes when level is 0");
  });

  it("applies filtering when level > 0", () => {
    const yPlane = new Uint8Array(256);
    const uPlane = new Uint8Array(64).fill(128);
    const vPlane = new Uint8Array(64).fill(128);

    // Create sharp edges at macroblock boundaries
    yPlane.fill(50);
    for (let y = 0; y < 16; y++) {
      for (let x = 8; x < 16; x++) {
        // Right half
        yPlane[y * 16 + x] = 200;
      }
    }

    const originalY = new Uint8Array(yPlane);

    applyLoopFilter(yPlane, uPlane, vPlane, 16, 16, { level: 16 });

    // Should modify the Y plane
    let hasChanged = false;
    for (let i = 0; i < yPlane.length; i++) {
      if (yPlane[i] !== originalY[i]) {
        hasChanged = true;
        break;
      }
    }
    assert.ok(hasChanged, "Should modify Y plane when filtering is applied");
  });

  it("handles different filter strengths", () => {
    const yPlane1 = new Uint8Array(256);
    const yPlane2 = new Uint8Array(256);
    const uPlane = new Uint8Array(64).fill(128);
    const vPlane = new Uint8Array(64).fill(128);

    // Set up identical sharp edges
    [yPlane1, yPlane2].forEach((plane) => {
      plane.fill(0);
      for (let y = 0; y < 16; y++) {
        for (let x = 8; x < 16; x++) {
          plane[y * 16 + x] = 255;
        }
      }
    });

    applyLoopFilter(yPlane1, new Uint8Array(uPlane), new Uint8Array(vPlane), 16, 16, { level: 4 });
    applyLoopFilter(yPlane2, new Uint8Array(uPlane), new Uint8Array(vPlane), 16, 16, { level: 32 });

    // Different strengths should produce different results
    let isDifferent = false;
    for (let i = 0; i < yPlane1.length; i++) {
      if (yPlane1[i] !== yPlane2[i]) {
        isDifferent = true;
        break;
      }
    }
    assert.ok(isDifferent, "Different filter strengths should produce different results");
  });

  it("maintains pixel value bounds", () => {
    const yPlane = new Uint8Array(256);
    const uPlane = new Uint8Array(64);
    const vPlane = new Uint8Array(64);

    // Fill with extreme values
    yPlane.fill(255);
    uPlane.fill(0);
    vPlane.fill(255);

    applyLoopFilter(yPlane, uPlane, vPlane, 16, 16, { level: 63 }); // Max strength

    // All pixels should remain in valid range
    for (const pixel of yPlane) {
      assert.ok(pixel >= 0 && pixel <= 255, "Y pixels should remain in valid range");
    }
    for (const pixel of uPlane) {
      assert.ok(pixel >= 0 && pixel <= 255, "U pixels should remain in valid range");
    }
    for (const pixel of vPlane) {
      assert.ok(pixel >= 0 && pixel <= 255, "V pixels should remain in valid range");
    }
  });

  it("handles edge case dimensions", () => {
    // Very small image
    const yPlane = new Uint8Array(4).fill(100); // 2x2
    const uPlane = new Uint8Array(1).fill(128); // 1x1
    const vPlane = new Uint8Array(1).fill(128); // 1x1

    // Should not crash
    assert.doesNotThrow(() => {
      applyLoopFilter(yPlane, uPlane, vPlane, 2, 2, { level: 16 });
    });
  });

  it("processes rectangular images", () => {
    const yPlane = new Uint8Array(128); // 16x8
    const uPlane = new Uint8Array(32); // 8x4
    const vPlane = new Uint8Array(32); // 8x4

    yPlane.fill(50);
    uPlane.fill(128);
    vPlane.fill(128);

    // Should handle non-square dimensions
    assert.doesNotThrow(() => {
      applyLoopFilter(yPlane, uPlane, vPlane, 16, 8, { level: 8 });
    });

    // Verify pixels are still in valid range
    for (const pixel of yPlane) {
      assert.ok(pixel >= 0 && pixel <= 255, "Y pixels should be valid");
    }
  });

  it("handles missing or invalid filter config", () => {
    const yPlane = new Uint8Array(64).fill(100);
    const uPlane = new Uint8Array(16).fill(128);
    const vPlane = new Uint8Array(16).fill(128);
    const originalY = new Uint8Array(yPlane);

    // Test with null config
    applyLoopFilter(yPlane, uPlane, vPlane, 8, 8, null);
    assert.deepEqual(yPlane, originalY, "Should handle null config gracefully");

    // Test with undefined config
    applyLoopFilter(yPlane, uPlane, vPlane, 8, 8, undefined);
    assert.deepEqual(yPlane, originalY, "Should handle undefined config gracefully");
  });

  it("produces deterministic results", () => {
    const createPlanes = () => ({
      y: new Uint8Array(64).fill(75),
      u: new Uint8Array(16).fill(100),
      v: new Uint8Array(16).fill(150),
    });

    const planes1 = createPlanes();
    const planes2 = createPlanes();

    const filterConfig = { level: 12 };

    applyLoopFilter(planes1.y, planes1.u, planes1.v, 8, 8, filterConfig);
    applyLoopFilter(planes2.y, planes2.u, planes2.v, 8, 8, filterConfig);

    // Should produce identical results
    assert.deepEqual(planes1.y, planes2.y, "Y planes should be identical");
    assert.deepEqual(planes1.u, planes2.u, "U planes should be identical");
    assert.deepEqual(planes1.v, planes2.v, "V planes should be identical");
  });
});
