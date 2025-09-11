import assert from "node:assert/strict";
import { test } from "node:test";
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

test("EXIF APP1 passthrough appears after SOI", () => {
  const w = 8,
    h = 8;
  const rgba = solidRGBA(w, h, 10, 20, 30);
  const exif = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x01, 0x02]); // "Exif\0\0" + dummy
  const jpeg = encodeJPEG(rgba, w, h, { quality: 70, subsampling: "444", exif });
  // Find APP1 marker
  let idx = -1;
  for (let i = 0; i < jpeg.length - 1; i++)
    if (jpeg[i] === 0xff && jpeg[i + 1] === 0xe1) {
      idx = i;
      break;
    }
  assert.ok(idx > 0);
});

test("ICC APP2 segments appear when provided", () => {
  const w = 8,
    h = 8;
  const rgba = solidRGBA(w, h, 10, 20, 30);
  const icc = new Uint8Array(100);
  const jpeg = encodeJPEG(rgba, w, h, { quality: 70, subsampling: "444", icc });
  let found = false;
  for (let i = 0; i < jpeg.length - 11; i++) {
    if (
      jpeg[i] === 0xff &&
      jpeg[i + 1] === 0xe2 &&
      jpeg[i + 4] === 0x49 &&
      jpeg[i + 5] === 0x43 &&
      jpeg[i + 6] === 0x43
    ) {
      found = true;
      break;
    }
  }
  assert.ok(found);
});
