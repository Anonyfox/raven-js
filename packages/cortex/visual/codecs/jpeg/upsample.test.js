import assert from "node:assert/strict";
import { test } from "node:test";
import { upsampleLinear, upsampleNearest } from "./upsample.js";

test("upsampleNearest: 2x2 → 4x4 replicates pixels", () => {
  const src = new Uint8Array([1, 2, 3, 4]);
  const { data, width, height } = upsampleNearest(src, 2, 2, 2, 2);
  assert.equal(width, 4);
  assert.equal(height, 4);
  // Expect 2x2 blocks replicated
  assert.deepEqual(Array.from(data.slice(0, 4)), [1, 1, 2, 2]);
  assert.deepEqual(Array.from(data.slice(4, 8)), [1, 1, 2, 2]);
});

test("upsampleLinear: 1x2 vertical interpolation", () => {
  const src = new Uint8Array([10, 20]);
  const { data, width, height } = upsampleLinear(src, 1, 2, 1, 2);
  assert.equal(width, 1);
  assert.equal(height, 4);
  // Values should interpolate between 10 and 20
  assert.ok(data[0] >= 10 && data[3] <= 20);
});

test("upsampleLinear: horizontal midpoint equals average of neighbors", () => {
  const src = new Uint8Array([0, 100]); // width=2, horizontal ramp
  const { data, width, height } = upsampleLinear(src, 2, 1, 2, 1);
  assert.equal(width, 4);
  assert.equal(height, 1);
  // Expected: [0, 50, 100, 100] approximately; midpoint index=1 ~ 50
  assert.equal(data[1], 50);
});
