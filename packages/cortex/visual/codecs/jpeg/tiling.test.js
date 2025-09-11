import assert from "node:assert/strict";
import { test } from "node:test";
import { downsampleBox, gatherBlockCentered } from "./tiling.js";

test("downsampleBox 4:2:0 on 3x3 clamps edges", () => {
  const srcW = 3,
    srcH = 3;
  const src = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80, 90]);
  const dst = downsampleBox(src, srcW, srcH, 2, 2);
  assert.equal(dst.length, 4);
  // Averaged quadrants roughly around centers
  assert.ok(dst[0] >= 10 && dst[0] <= 50);
  assert.ok(dst[3] >= 50 && dst[3] <= 90);
});

test("gatherBlockCentered replicates edges on small plane", () => {
  const w = 5,
    h = 5;
  const plane = new Uint8Array(w * h).fill(100);
  const out = new Int16Array(64);
  gatherBlockCentered(plane, w, h, 4, 4, out); // bottom-right corner
  for (let i = 0; i < 64; i++) assert.equal(out[i], 100 - 128);
});
