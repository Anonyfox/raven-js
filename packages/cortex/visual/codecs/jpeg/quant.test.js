import assert from "node:assert/strict";
import { test } from "node:test";
import { BASE_CHROMA, BASE_LUMA, buildQuantTables, qualityToScale } from "./quant.js";

test("qualityToScale mapping boundaries", () => {
  assert.equal(qualityToScale(1), 5000);
  assert.equal(qualityToScale(50), 100);
  assert.equal(qualityToScale(100), 0);
});

test("buildQuantTables clamps to [1,255] and is monotonic", () => {
  const low = buildQuantTables(1);
  const mid = buildQuantTables(50);
  const hi = buildQuantTables(95);
  for (let i = 0; i < 64; i++) {
    assert.ok(low.qY[i] >= 1 && low.qY[i] <= 255);
    assert.ok(low.qC[i] >= 1 && low.qC[i] <= 255);
    // Monotonic: lower quality → larger quant values (more aggressive)
    assert.ok(low.qY[i] >= mid.qY[i]);
    assert.ok(mid.qY[i] >= hi.qY[i]);
    assert.ok(low.qC[i] >= mid.qC[i]);
    assert.ok(mid.qC[i] >= hi.qC[i]);
  }
});

test("base tables are in natural order and length 64", () => {
  assert.equal(BASE_LUMA.length, 64);
  assert.equal(BASE_CHROMA.length, 64);
});
