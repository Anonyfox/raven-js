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

test("encode with DRI=1 inserts restart markers and decodes", async () => {
  const w = 16,
    h = 16;
  const rgba = solidRGBA(w, h, 180, 90, 30);
  const jpeg = encodeJPEG(rgba, w, h, { quality: 80, subsampling: "420", restartIntervalMCU: 1 });
  // Search for RST markers 0xFFD0..0xFFD7
  let hasRST = false;
  for (let i = 0; i < jpeg.length - 1; i++) {
    if (jpeg[i] === 0xff && jpeg[i + 1] >= 0xd0 && jpeg[i + 1] <= 0xd7) {
      hasRST = true;
      break;
    }
  }
  assert.ok(hasRST, "Should contain RST markers");
  const dec = await decodeJPEG(jpeg);
  assert.equal(dec.width, w);
  assert.equal(dec.height, h);
});
