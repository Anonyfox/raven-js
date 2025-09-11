import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeJPEG } from "./decode.js";

function bytes(arr) {
  return new Uint8Array(arr);
}

function dqtAllOnes() {
  const arr = [];
  const L = 2 + 1 + 64;
  arr.push(0xff, 0xdb, (L >> 8) & 0xff, L & 0xff, 0x00);
  for (let i = 0; i < 64; i++) arr.push(1);
  return arr;
}

function dhtDC(symbols) {
  const arr = [];
  arr.push(0xff, 0xc4);
  const counts = new Array(16).fill(0);
  counts[0] = symbols.length;
  const L = 2 + 1 + 16 + symbols.length;
  arr.push((L >> 8) & 0xff, L & 0xff);
  arr.push(0x00);
  arr.push(...counts);
  arr.push(...symbols);
  return arr;
}

function dhtAC(symbols) {
  const arr = [];
  arr.push(0xff, 0xc4);
  const counts = new Array(16).fill(0);
  counts[0] = symbols.length;
  const L = 2 + 1 + 16 + symbols.length;
  arr.push((L >> 8) & 0xff, L & 0xff);
  arr.push(0x10);
  arr.push(...counts);
  arr.push(...symbols);
  return arr;
}

function baselineTinyGray(dcSymbolBitsByte) {
  const parts = [];
  parts.push(0xff, 0xd8);
  parts.push(...dqtAllOnes());
  // SOF0 8x8, 1 comp
  {
    const L = 2 + 6 + 3;
    parts.push(0xff, 0xc0, (L >> 8) & 0xff, L & 0xff, 8, 0, 8, 0, 8, 1, 1, 0x11, 0);
  }
  parts.push(...dhtDC([1])); // s=1
  parts.push(...dhtAC([0])); // EOB only
  // SOS baseline
  {
    const L = 2 + 1 + 2 + 3;
    parts.push(0xff, 0xda, (L >> 8) & 0xff, L & 0xff, 1, 1, 0x00, 0, 63, 0);
  }
  // entropy: symbol '0' then 1 bit => byte 0b01000000 or supplied
  parts.push(dcSymbolBitsByte, 0x00);
  parts.push(0xff, 0xd9);
  return bytes(parts);
}

function progressiveTinyGray(dcBit = 1) {
  const parts = [];
  parts.push(0xff, 0xd8);
  parts.push(...dqtAllOnes());
  // SOF2 8x8, 1 comp
  {
    const L = 2 + 6 + 3;
    parts.push(0xff, 0xc2, (L >> 8) & 0xff, L & 0xff, 8, 0, 8, 0, 8, 1, 1, 0x11, 0);
  }
  parts.push(...dhtDC([1]));
  // DC first scan
  {
    const L = 2 + 1 + 2 + 3;
    parts.push(0xff, 0xda, (L >> 8) & 0xff, L & 0xff, 1, 1, 0x00, 0, 0, 0);
  }
  // symbol then dcBit
  parts.push(dcBit ? 0b01000000 : 0b00000000);
  // end with EOI
  parts.push(0xff, 0xd9);
  return bytes(parts);
}

test("progressive tiny grayscale equals baseline within exact match for DC-only", async () => {
  const base = baselineTinyGray(0b01000000);
  const prog = progressiveTinyGray(1);
  const a = await decodeJPEG(base);
  const b = await decodeJPEG(prog);
  assert.equal(a.width, b.width);
  assert.equal(a.height, b.height);
  // Exact equality for DC-only images
  assert.equal(Buffer.compare(Buffer.from(a.pixels), Buffer.from(b.pixels)), 0);
});
