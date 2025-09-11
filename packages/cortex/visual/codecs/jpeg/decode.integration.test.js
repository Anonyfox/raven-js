import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { decodeJPEG } from "./decode.js";

function bytes(arr) {
  return new Uint8Array(arr);
}

test("decodeJPEG: missing SOI → ERR_MARKER", async () => {
  const buf = bytes([0x00, 0x00]);
  await assert.rejects(() => decodeJPEG(buf), /ERR_MARKER/);
});

test("decodeJPEG: invalid segment length → ERR_SEGMENT_LENGTH", async () => {
  // SOI, then DQT with length=0001 (invalid <2)
  const buf = bytes([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x01]);
  await assert.rejects(() => decodeJPEG(buf), /ERR_SEGMENT_LENGTH/);
});

test("decodeJPEG: SOS without frame → ERR_SOS_NO_FRAME", async () => {
  // SOI, minimal DHT and DQT to get past parsers, then SOS without SOF
  // We'll include a valid empty DQT table segment with 64 ones and id=0
  const dqt = (() => {
    const arr = [];
    arr.push(0xff, 0xdb);
    const len = 2 + 1 + 64;
    arr.push((len >> 8) & 0xff, len & 0xff);
    arr.push(0x00); // Pq=0, Tq=0
    for (let i = 0; i < 64; i++) arr.push(1);
    return arr;
  })();
  // Minimal DHT: one code of length 1
  const dht = (() => {
    const arr = [];
    arr.push(0xff, 0xc4);
    const symbols = [0x00];
    const L = 2 + 1 + 16 + symbols.length;
    arr.push((L >> 8) & 0xff, L & 0xff);
    arr.push(0x00); // Tc=0, Th=0
    const counts = new Array(16).fill(0);
    counts[0] = 1;
    arr.push(...counts);
    arr.push(...symbols);
    return arr;
  })();
  const sos = (() => {
    const arr = [];
    arr.push(0xff, 0xda);
    const L = 2 + 1 + 2 * 1 + 3;
    arr.push((L >> 8) & 0xff, L & 0xff);
    arr.push(1); // Ns
    arr.push(1, 0x00); // Cs=1, Td|Ta=0
    arr.push(0, 63, 0); // Ss=0 Se=63 AhAl=0
    return arr;
  })();
  const buf = bytes([0xff, 0xd8, ...dqt, ...dht, ...sos]);
  await assert.rejects(() => decodeJPEG(buf), /ERR_SOS_NO_FRAME/);
});

test("decodeJPEG: real image cortex/media/test.jpg decodes to RGBA", async () => {
  const p = join(process.cwd(), "media", "test.jpg");
  const buf = await readFile(p);
  const { pixels, width, height, metadata } = await decodeJPEG(new Uint8Array(buf));
  assert.equal(pixels.length, width * height * 4);
  // Alpha is opaque
  for (let i = 3; i < pixels.length; i += 4) assert.equal(pixels[i], 255);
  // Should have some non-gray variance
  const first = pixels[0] + pixels[1] + pixels[2];
  let diff = 0;
  for (let i = 0; i < 100 && i * 4 + 2 < pixels.length; i++) {
    diff |= pixels[i * 4] + pixels[i * 4 + 1] + pixels[i * 4 + 2] !== first ? 1 : 0;
  }
  assert.ok(diff === 1);
  // Deterministic
  const again = await decodeJPEG(new Uint8Array(buf));
  assert.equal(Buffer.compare(Buffer.from(pixels), Buffer.from(again.pixels)), 0);
  // Metadata is optional but should be an object
  assert.equal(typeof metadata, "object");
});
