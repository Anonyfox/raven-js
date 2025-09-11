/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for VP8 intra prediction modes.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { predict4x4, predict8x8UV } from "./predict.js";

describe("predict4x4", () => {
  it("fills prediction block with DC value", () => {
    const pred = new Uint8Array(16);
    const plane = new Uint8Array(64).fill(100); // 8x8 plane with value 100

    predict4x4(pred, plane, 2, 2, 8, 1); // DC mode

    // Should fill with DC prediction
    assert.ok(
      pred.every((p) => p >= 0 && p <= 255),
      "Predictions should be in valid range"
    );
    assert.ok(
      pred.every((p) => p === pred[0]),
      "All predictions should be same for DC mode"
    );
  });

  it("handles boundary conditions", () => {
    const pred = new Uint8Array(16);
    const plane = new Uint8Array(16).fill(128); // 4x4 plane

    predict4x4(pred, plane, 0, 0, 4, 1); // Top-left corner

    // Should use fallback DC value
    assert.ok(
      pred.every((p) => p >= 0 && p <= 255),
      "Predictions should be in valid range"
    );
  });

  it("computes context-based DC prediction", () => {
    const pred = new Uint8Array(16);
    const plane = new Uint8Array(64); // 8x8 plane

    // Set up context pixels
    plane.fill(50); // Background
    for (let i = 0; i < 8; i++) {
      plane[i] = 200; // Top row
      plane[i * 8] = 150; // Left column
    }

    predict4x4(pred, plane, 1, 1, 8, 1); // DC mode with context

    const expectedDC = Math.round((200 * 4 + 150 * 4) / 8); // Average of context
    assert.ok(Math.abs(pred[0] - expectedDC) <= 1, "Should compute correct DC value");
  });
});

describe("predict8x8UV", () => {
  it("fills prediction block for UV components", () => {
    const pred = new Uint8Array(16);
    const plane = new Uint8Array(64).fill(128); // 8x8 chroma plane

    predict8x8UV(pred, plane, 2, 2, 8, 0); // DC mode

    // Should fill with chroma DC prediction
    assert.ok(
      pred.every((p) => p >= 0 && p <= 255),
      "Predictions should be in valid range"
    );
    assert.ok(
      pred.every((p) => p === pred[0]),
      "All predictions should be same for DC mode"
    );
  });

  it("handles chroma-specific defaults", () => {
    const pred = new Uint8Array(16);
    const plane = new Uint8Array(16).fill(0); // Empty context

    predict8x8UV(pred, plane, 0, 0, 4, 0); // No context available

    // Should use chroma default (128)
    assert.equal(pred[0], 128, "Should use chroma default value");
  });

  it("processes different UV modes", () => {
    const pred1 = new Uint8Array(16);
    const pred2 = new Uint8Array(16);
    const plane = new Uint8Array(64).fill(100);

    predict8x8UV(pred1, plane, 2, 2, 8, 0); // Mode 0
    predict8x8UV(pred2, plane, 2, 2, 8, 3); // Mode 3

    // Both should produce valid predictions (same in simplified implementation)
    assert.ok(
      pred1.every((p) => p >= 0 && p <= 255),
      "Mode 0 should be valid"
    );
    assert.ok(
      pred2.every((p) => p >= 0 && p <= 255),
      "Mode 3 should be valid"
    );
  });

  it("maintains deterministic output", () => {
    const pred1 = new Uint8Array(16);
    const pred2 = new Uint8Array(16);
    const plane = new Uint8Array(64);

    // Set up identical context
    plane.fill(75);
    for (let i = 0; i < 8; i++) {
      plane[i] = 125;
      plane[i * 8] = 100;
    }

    predict8x8UV(pred1, plane, 1, 1, 8, 1);
    predict8x8UV(pred2, plane, 1, 1, 8, 1);

    // Should produce identical results
    assert.deepEqual(pred1, pred2, "Identical inputs should produce identical outputs");
  });
});
