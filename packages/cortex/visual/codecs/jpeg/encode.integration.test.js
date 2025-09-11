import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeJPEG } from "./decode.js";
import { encodeJPEG } from "./encode.js";

function checkerRGBA(w, h) {
  const a = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = (x >> 3) ^ (y >> 3) ? 255 : 0;
      const i = (y * w + x) * 4;
      a[i] = v;
      a[i + 1] = v;
      a[i + 2] = v;
      a[i + 3] = 255;
    }
  }
  return a;
}

test("determinism: same input/options yields identical bytes", () => {
  const w = 16,
    h = 16;
  const rgba = checkerRGBA(w, h);
  const a = encodeJPEG(rgba, w, h, { quality: 80, subsampling: "420" });
  const b = encodeJPEG(rgba, w, h, { quality: 80, subsampling: "420" });
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++) assert.equal(a[i], b[i]);
});

test("roundtrip decodes with bounded error for different qualities", async () => {
  const w = 32,
    h = 32;
  const rgba = checkerRGBA(w, h);
  for (const q of [50, 80, 95]) {
    const jpeg = encodeJPEG(rgba, w, h, { quality: q, subsampling: "420" });
    const dec = await decodeJPEG(jpeg);
    assert.equal(dec.width, w);
    assert.equal(dec.height, h);
    // allow error tolerance due to quantization
    let maxErr = 0;
    for (let i = 0; i < rgba.length; i += 4) {
      const r = dec.pixels[i];
      const g = dec.pixels[i + 1];
      const b = dec.pixels[i + 2];
      maxErr = Math.max(maxErr, Math.abs(r - rgba[i]));
      maxErr = Math.max(maxErr, Math.abs(g - rgba[i + 1]));
      maxErr = Math.max(maxErr, Math.abs(b - rgba[i + 2]));
    }
    assert.ok(maxErr <= 40);
  }
});
