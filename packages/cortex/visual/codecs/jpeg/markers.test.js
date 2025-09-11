import assert from "node:assert/strict";
import { test } from "node:test";
import { writeAPP0_JFIF, writeDHT, writeDQT, writeDRI, writeEOI, writeSOF0, writeSOI, writeSOS } from "./markers.js";

test("writeSOI/EOI produce correct markers", () => {
  const out = [];
  writeSOI(out);
  writeEOI(out);
  const u = Uint8Array.from(out);
  assert.equal(u[0], 0xff);
  assert.equal(u[1], 0xd8);
  assert.equal(u[2], 0xff);
  assert.equal(u[3], 0xd9);
});

test("writeAPP0_JFIF writes valid length and identifier", () => {
  const out = [];
  writeAPP0_JFIF(out, { units: 1, xDensity: 72, yDensity: 72 });
  const u = Uint8Array.from(out);
  assert.equal(u[0], 0xff);
  assert.equal(u[1], 0xe0);
  const L = (u[2] << 8) | u[3];
  assert.ok(L >= 16);
  // identifier JFIF\0 at bytes 4..8
  assert.equal(u[4], 0x4a);
  assert.equal(u[5], 0x46);
  assert.equal(u[6], 0x49);
  assert.equal(u[7], 0x46);
  assert.equal(u[8], 0x00);
});

test("writeDQT + writeSOF0 basic structure", () => {
  const out = [];
  const q = new Int32Array(64).fill(16);
  writeDQT(out, [{ id: 0, table: q }]);
  writeSOF0(out, { width: 8, height: 8, components: [{ id: 1, h: 1, v: 1, Tq: 0 }] });
  const u = Uint8Array.from(out);
  // DQT marker
  assert.equal(u[0], 0xff);
  assert.equal(u[1], 0xdb);
  // SOF0 marker exists later
  const sofIndex = u.findIndex((v, i) => i < u.length - 1 && v === 0xff && u[i + 1] === 0xc0);
  assert.ok(sofIndex > 0);
});

test("writeDHT and writeSOS structure sanity", () => {
  const out = [];
  const codeLengthCounts = new Uint8Array(16);
  codeLengthCounts[1] = 1; // one code length 2
  codeLengthCounts[2] = 1; // one code length 3
  const symbols = new Uint8Array([0x00, 0x01]);
  writeDHT(out, [{ class: 0, id: 0, codeLengthCounts, symbols }]);
  writeSOS(out, { components: [{ id: 1, Td: 0, Ta: 0 }] });
  const u = Uint8Array.from(out);
  assert.equal(u[0], 0xff);
  assert.equal(u[1], 0xc4);
  const sosIndex = u.findIndex((v, i) => i < u.length - 1 && v === 0xff && u[i + 1] === 0xda);
  assert.ok(sosIndex > 0);
});

test("writeDRI writes when Ri>0", () => {
  const out = [];
  writeDRI(out, 4);
  const u = Uint8Array.from(out);
  assert.equal(u[0], 0xff);
  assert.equal(u[1], 0xdd);
  assert.equal(((u[4] << 8) | u[5]) & 0xffff, 4);
});
