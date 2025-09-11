import assert from "node:assert/strict";
import { test } from "node:test";
import { cmykToRgba, rgbaToYCbCr, ycbcrToRgba, ycckToRgba } from "./color.js";

test("rgbaToYCbCr and back around gray is stable-ish", () => {
  const w = 2,
    h = 2;
  const rgba = new Uint8Array([128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255]);
  const { Y, Cb, Cr } = rgbaToYCbCr(rgba, w, h);
  for (let i = 0; i < w * h; i++) {
    assert.ok(Y[i] >= 127 && Y[i] <= 129);
    assert.ok(Cb[i] >= 127 && Cb[i] <= 129);
    assert.ok(Cr[i] >= 127 && Cr[i] <= 129);
  }
  const round = ycbcrToRgba(Y, Cb, Cr, w, h);
  for (let i = 0; i < rgba.length; i += 4) {
    assert.ok(Math.abs(round[i] - 128) <= 1);
    assert.ok(Math.abs(round[i + 1] - 128) <= 1);
    assert.ok(Math.abs(round[i + 2] - 128) <= 1);
    assert.equal(round[i + 3], 255);
  }
});

// (duplicate imports removed)

test("ycbcrToRgba: grayscale Y maps to equal RGB", () => {
  const Y = new Uint8Array([0, 128, 255]);
  const Cb = new Uint8Array([128, 128, 128]);
  const Cr = new Uint8Array([128, 128, 128]);
  const out = ycbcrToRgba(Y, Cb, Cr, 3, 1);
  for (let i = 0; i < 3; i++) {
    const r = out[i * 4];
    const g = out[i * 4 + 1];
    const b = out[i * 4 + 2];
    assert.equal(r, Y[i]);
    assert.equal(g, Y[i]);
    assert.equal(b, Y[i]);
    assert.equal(out[i * 4 + 3], 255);
  }
});

test("cmykToRgba: pure black and pure white", () => {
  const w = 2,
    h = 1;
  const C = new Uint8Array([0, 0]);
  const M = new Uint8Array([0, 0]);
  const Y = new Uint8Array([0, 0]);
  const K = new Uint8Array([0, 255]);
  const out = cmykToRgba(C, M, Y, K, w, h);
  // First pixel: CMYK(0,0,0,0) -> white
  assert.equal(out[0], 255);
  assert.equal(out[1], 255);
  assert.equal(out[2], 255);
  assert.equal(out[3], 255);
  // Second pixel: CMYK(0,0,0,255) -> black
  assert.equal(out[4], 0);
  assert.equal(out[5], 0);
  assert.equal(out[6], 0);
  assert.equal(out[7], 255);
});

test("ycckToRgba: K channel dominates to black", () => {
  const w = 1,
    h = 1;
  const Yp = new Uint8Array([128]);
  const Cb = new Uint8Array([128]);
  const Cr = new Uint8Array([128]);
  const K = new Uint8Array([255]);
  const out = ycckToRgba(Yp, Cb, Cr, K, w, h);
  assert.equal(out[0], 0);
  assert.equal(out[1], 0);
  assert.equal(out[2], 0);
  assert.equal(out[3], 255);
});
