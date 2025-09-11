import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { decodeJPEG } from "./decode.js";

test("4:2:0 image: fancy upsampling changes output compared to nearest", async () => {
  const p = join(process.cwd(), "media", "integration-example-small.jpeg");
  const buf = new Uint8Array(await readFile(p));
  const a = await decodeJPEG(buf, { fancyUpsampling: false });
  const b = await decodeJPEG(buf, { fancyUpsampling: true });
  assert.equal(a.width, b.width);
  assert.equal(a.height, b.height);
  assert.equal(a.pixels.length, b.pixels.length);
  // Expect at least some difference
  let diff = 0;
  for (let i = 0; i < a.pixels.length; i += Math.max(1, (a.pixels.length / 257) | 0)) {
    if (a.pixels[i] !== b.pixels[i]) {
      diff = 1;
      break;
    }
  }
  assert.equal(diff, 1);
  // Alpha opaque
  for (let i = 3; i < a.pixels.length; i += 4) {
    assert.equal(a.pixels[i], 255);
    assert.equal(b.pixels[i], 255);
  }
});
