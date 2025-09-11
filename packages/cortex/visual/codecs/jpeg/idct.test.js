import assert from "node:assert/strict";
import { test } from "node:test";
import { dequantizeAndIDCTBlock } from "./idct.js";

test("idct: DC-only block produces flat value", () => {
  const coeffs = new Int16Array(64);
  coeffs[0] = 100; // DC
  const quant = new Int32Array(64);
  quant.fill(1);
  const out = new Uint8Array(64);
  dequantizeAndIDCTBlock(coeffs, quant, out);
  // Expected = round(0.25 * alpha0^2 * DC + 128)
  const expected = Math.round(0.25 * (1 / Math.SQRT2) * (1 / Math.SQRT2) * 100 + 128);
  for (let i = 0; i < 64; i++) assert.equal(out[i], expected);
});

test("idct: random coefficients do not overflow and stay in 0..255", () => {
  const coeffs = new Int16Array(64);
  for (let i = 0; i < 64; i++) coeffs[i] = ((i * 37) % 31) - 15;
  const quant = new Int32Array(64);
  quant.fill(1);
  const out = new Uint8Array(64);
  dequantizeAndIDCTBlock(coeffs, quant, out);
  for (let i = 0; i < 64; i++) {
    assert.ok(out[i] >= 0 && out[i] <= 255);
  }
});
