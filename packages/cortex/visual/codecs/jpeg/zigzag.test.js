import assert from "node:assert/strict";
import { test } from "node:test";
import { zigZagToNatural } from "./zigzag.js";

test("zigZagToNatural: length 64, bijective 0..63", () => {
  assert.equal(zigZagToNatural.length, 64);
  const seen = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    const v = zigZagToNatural[i];
    assert.ok(v >= 0 && v < 64);
    seen[v]++;
  }
  for (let v = 0; v < 64; v++) assert.equal(seen[v], 1);
});

test("zigZagToNatural: spot checks match ITU T.81 order", () => {
  // DC
  assert.equal(zigZagToNatural[0], 0);
  // Early entries
  assert.equal(zigZagToNatural[1], 1);
  assert.equal(zigZagToNatural[2], 8);
  assert.equal(zigZagToNatural[3], 16);
  assert.equal(zigZagToNatural[4], 9);
  // Tail
  assert.equal(zigZagToNatural[63], 63);
});
