import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeJPEG } from "./decode.js";
import { encodeJPEG } from "./encode.js";

function solidRGBA(w, h, r, g, b) {
  const a = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    a[i * 4] = r;
    a[i * 4 + 1] = g;
    a[i * 4 + 2] = b;
    a[i * 4 + 3] = 255;
  }
  return a;
}

test("encode baseline solid gray 8x8 decodes back near-identical", async () => {
  const w = 8,
    h = 8;
  const rgba = solidRGBA(w, h, 128, 128, 128);
  const jpeg = encodeJPEG(rgba, w, h, { quality: 90, subsampling: "444" });
  assert.ok(jpeg.length > 100);
  const dec = await decodeJPEG(jpeg);
  assert.equal(dec.width, w);
  assert.equal(dec.height, h);
  // spot check center pixel within ±2 due to quantization
  const mid = ((h >> 1) * w + (w >> 1)) * 4;
  assert.ok(Math.abs(dec.pixels[mid] - 128) <= 2);
  assert.ok(Math.abs(dec.pixels[mid + 1] - 128) <= 2);
  assert.ok(Math.abs(dec.pixels[mid + 2] - 128) <= 2);
});

test("encode 16x16 baseline 4:2:0 is structurally valid and decodes", async () => {
  const w = 16,
    h = 16;
  const rgba = solidRGBA(w, h, 200, 100, 50);
  const jpeg = encodeJPEG(rgba, w, h, { quality: 75, subsampling: "420" });
  const dec = await decodeJPEG(jpeg);
  assert.equal(dec.width, w);
  assert.equal(dec.height, h);
});
