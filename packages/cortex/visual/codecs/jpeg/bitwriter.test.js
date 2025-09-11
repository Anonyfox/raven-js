import assert from "node:assert/strict";
import { test } from "node:test";
import { createBitWriter } from "./bitwriter.js";

test("bitwriter packs MSB-first and stuffs 0xFF", () => {
  const bw = createBitWriter();
  // Emit bits to get bytes: 0xFF, 0x00 (stuffed), 0x80
  bw.writeBits(0xff, 8);
  bw.writeBits(0x80, 8);
  bw.align();
  const out = bw.toUint8Array();
  assert.equal(out[0], 0xff);
  assert.equal(out[1], 0x00); // stuffed
  assert.equal(out[2], 0x80);
});

test("bitwriter alignment pads with 1s", () => {
  const bw = createBitWriter();
  // Write 3 bits: 0b101 → expect pad with 1s to 0b10111111 = 0xBF
  bw.writeBits(0b101, 3);
  bw.align();
  const out = bw.toUint8Array();
  assert.equal(out.length, 1);
  assert.equal(out[0], 0xbf);
});
