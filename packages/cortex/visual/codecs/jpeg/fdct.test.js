import assert from "node:assert/strict";
import { test } from "node:test";
import { fdctFloat64, quantizeCoefficients } from "./fdct.js";

test("fdctFloat64 DC-only flat block", () => {
  const block = new Int16Array(64);
  // Centered samples: all zeros → DC=0
  const out = new Float64Array(64);
  fdctFloat64(block, out);
  for (let i = 0; i < 64; i++) assert.equal(out[i], 0);
});

test("fdctFloat64 constant non-zero block yields only DC", () => {
  const block = new Int16Array(64);
  for (let i = 0; i < 64; i++) block[i] = 10; // centered constant
  const out = new Float64Array(64);
  fdctFloat64(block, out);
  // DC = 0.25 * a0^2 * sum(f) with a0=1/sqrt(2)
  const expectedDC = 0.25 * (1 / Math.SQRT2) * (1 / Math.SQRT2) * (10 * 64);
  assert.ok(Math.abs(out[0] - expectedDC) < 1e-9);
  for (let i = 1; i < 64; i++) assert.ok(Math.abs(out[i]) < 1e-9);
});

test("quantizeCoefficients rounds to nearest", () => {
  const coeffs = new Float64Array(64);
  const quant = new Int32Array(64);
  for (let i = 0; i < 64; i++) {
    coeffs[i] = i + 0.49; // near lower integer
    quant[i] = 1;
  }
  const out = new Int16Array(64);
  quantizeCoefficients(coeffs, quant, out);
  // expect rounding to nearest → .49 rounds down
  for (let i = 0; i < 64; i++) assert.equal(out[i], i);
});
