import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeJPEG } from "./decode.js";
import { encodeJPEG } from "./encode.js";

function gradientRGBA(w, h) {
  const a = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      a[i] = Math.floor((255 * x) / (w - 1));
      a[i + 1] = Math.floor((255 * y) / (h - 1));
      a[i + 2] = 128;
      a[i + 3] = 255;
    }
  }
  return a;
}

test("progressive encode decodes and dimensions match", async () => {
  const w = 32,
    h = 32;
  const rgba = gradientRGBA(w, h);
  const jpeg = encodeJPEG(rgba, w, h, { quality: 80, subsampling: "420", progressive: true });
  const dec = await decodeJPEG(jpeg);
  assert.equal(dec.width, w);
  assert.equal(dec.height, h);
});
