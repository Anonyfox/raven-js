import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeJPEG } from "./decode.js";

// Construct a tiny 8x8 baseline grayscale JPEG (Y only, 1 component) with uniform mid-gray.
// This is a hand-rolled minimal JFIF-like JPEG sufficient for our decoder.
function tinyGrayscaleJPEG() {
  const parts = [];
  const push = (...a) => parts.push(...a);
  // SOI
  push(0xff, 0xd8);
  // DQT: table 0, all ones
  {
    const L = 2 + 1 + 64;
    push(0xff, 0xdb, (L >> 8) & 0xff, L & 0xff, 0x00);
    for (let i = 0; i < 64; i++) push(1);
  }
  // SOF0: 8-bit, 8x8, 1 component (id=1, h=1 v=1, tq=0)
  {
    const L = 2 + 6 + 3 * 1;
    push(0xff, 0xc0, (L >> 8) & 0xff, L & 0xff);
    push(8, 0x00, 0x08, 0x00, 0x08, 1);
    push(1, 0x11, 0x00);
  }
  // DHT: DC table 0 with one code len1 symbol=2 (s=2)
  {
    const symbols = [2];
    const counts = new Array(16).fill(0);
    counts[0] = 1;
    const L = 2 + 1 + 16 + symbols.length;
    push(0xff, 0xc4, (L >> 8) & 0xff, L & 0xff);
    push(0x00); // Tc=0,Th=0
    push(...counts);
    push(...symbols);
  }
  // DHT: AC table 0 with one code len1 symbol=0 (EOB)
  {
    const symbols = [0];
    const counts = new Array(16).fill(0);
    counts[0] = 1;
    const L = 2 + 1 + 16 + symbols.length;
    push(0xff, 0xc4, (L >> 8) & 0xff, L & 0xff);
    push(0x10); // Tc=1,Th=0
    push(...counts);
    push(...symbols);
  }
  // SOS: 1 component, uses Td=0,Ta=0
  {
    const L = 2 + 1 + 2 * 1 + 3;
    push(0xff, 0xda, (L >> 8) & 0xff, L & 0xff);
    push(1, 1, 0x00, 0, 63, 0);
  }
  // Entropy data: DC symbol (code '0'), then 2 bits value '10' => DC=2; AC EOB (code '0')
  // Emit one byte 0b01000000 (symbol '0' then '10'), then next byte 0b00000000 for EOB symbol.
  push(0b01000000, 0b00000000);
  // EOI
  push(0xff, 0xd9);
  return new Uint8Array(parts);
}

test("decodeJPEG: tiny 8x8 grayscale baseline decodes flat image", async () => {
  const buf = tinyGrayscaleJPEG();
  const { pixels, width, height } = await decodeJPEG(buf);
  assert.equal(width, 8);
  assert.equal(height, 8);
  // All pixels equal and alpha=255
  const r0 = pixels[0],
    g0 = pixels[1],
    b0 = pixels[2];
  for (let i = 0; i < pixels.length; i += 4) {
    assert.equal(pixels[i], r0);
    assert.equal(pixels[i + 1], g0);
    assert.equal(pixels[i + 2], b0);
    assert.equal(pixels[i + 3], 255);
  }
});
