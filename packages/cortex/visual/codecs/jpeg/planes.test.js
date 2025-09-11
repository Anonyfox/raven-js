import assert from "node:assert/strict";
import { test } from "node:test";
import { reconstructComponentPlane } from "./planes.js";

test("reconstructComponentPlane: stitches 1 block into 8x8 plane", () => {
  const frame = {
    width: 8,
    height: 8,
    Hmax: 1,
    Vmax: 1,
    qtables: [new Int32Array(64).fill(1)],
    components: [{ id: 1, h: 1, v: 1, tq: 0, blocksPerLine: 1, blocksPerColumn: 1, blocks: [[new Int16Array(64)]] }],
  };
  // Set DC=128 so after IDCT +128 bias we get near 160; but since quant=1 and our IDCT uses exact formula, pick DC accordingly.
  frame.components[0].blocks[0][0][0] = 100;
  const { plane, width, height } = reconstructComponentPlane(/** @type {any} */ (frame), 0);
  assert.equal(width, 8);
  assert.equal(height, 8);
  // All pixels equal (DC-only)
  const first = plane[0];
  for (let i = 1; i < plane.length; i++) assert.equal(plane[i], first);
});
