/** JPEG DHT parser tests */

import assert from "node:assert/strict";
import { test } from "node:test";
import { createHuffmanStore, parseDHTSegment, parseDQTSegment, parseSOFSegment, parseSOSSegment } from "./parse.js";

function makeDHTPayload(tables) {
  // tables: array of { tc, th, L(16), V(Uint8Array) }
  // returns Uint8Array payload (without length)
  let total = 0;
  for (const t of tables) total += 1 + 16 + t.V.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const t of tables) {
    out[o++] = ((t.tc & 1) << 4) | (t.th & 0x0f);
    out.set(t.L, o);
    o += 16;
    out.set(t.V, o);
    o += t.V.length;
  }
  return out;
}

test("parseDHTSegment: single DC table builds canonical structures", () => {
  const L = new Uint8Array(16);
  L[0] = 1; // one code of length 1
  L[1] = 2; // two codes of length 2
  const V = new Uint8Array([0x10, 0x11, 0x12]);
  const payload = makeDHTPayload([{ tc: 0, th: 1, L, V }]);
  const bytes = payload; // parsing function expects raw payload area
  const store = createHuffmanStore();
  const newOff = parseDHTSegment(bytes, 0, bytes.length, store, 9);
  assert.equal(newOff, bytes.length);
  assert.ok(store.dc[1]);
  assert.equal(store.ac[1], null);
  // Fast table should decode first code quickly: len1 -> symbol 0x10
  const fast = store.dc[1].fast;
  // For any prefix starting with 0 (len1), table should reflect symbol 0x10
  for (let i = 0; i < fast.length; i++) {
    const entry = fast[i];
    // Only entries with len==1 come from this symbol
    if (entry >>> 8 === 1) {
      assert.equal(entry & 0xff, 0x10);
      break;
    }
  }
});

test("parseDHTSegment: two tables (DC+AC) stored separately", () => {
  const Ld = new Uint8Array(16);
  Ld[0] = 1;
  const Vd = new Uint8Array([0x01]);
  const La = new Uint8Array(16);
  La[1] = 1;
  const Va = new Uint8Array([0x02]);
  const payload = makeDHTPayload([
    { tc: 0, th: 0, L: Ld, V: Vd },
    { tc: 1, th: 2, L: La, V: Va },
  ]);
  const store = createHuffmanStore();
  const off = parseDHTSegment(payload, 0, payload.length, store, 8);
  assert.equal(off, payload.length);
  assert.ok(store.dc[0]);
  assert.ok(store.ac[2]);
});

test("parseDHTSegment: rejects invalid class/id/lengths", () => {
  const L = new Uint8Array(16);
  L[0] = 0; // will cause empty
  const V = new Uint8Array([]);
  const badClass = new Uint8Array([0xf0, ...new Uint8Array(16), 0]); // tc=15 invalid
  const store = createHuffmanStore();
  assert.throws(() => parseDHTSegment(badClass, 0, badClass.length, store), /ERR_DHT_CLASS/);

  const payloadEmpty = makeDHTPayload([{ tc: 0, th: 0, L, V }]);
  const store2 = createHuffmanStore();
  assert.throws(() => parseDHTSegment(payloadEmpty, 0, payloadEmpty.length, store2), /ERR_DHT_EMPTY/);
});

test("parseDQTSegment: parses 8-bit table and de-zigzags into natural order", () => {
  // Construct 8-bit entries as incremental 0..63 in zig-zag order
  const bytes = new Uint8Array(1 + 64);
  bytes[0] = 0x00; // pq=0, tq=0
  for (let i = 0; i < 64; i++) bytes[1 + i] = i;
  const qtables = [null, null, null, null];
  const off = parseDQTSegment(bytes, 0, bytes.length, qtables);
  assert.equal(off, bytes.length);
  const q = qtables[0];
  assert.ok(q);
  // Natural index 0 (DC) equals zigzag[0] = 0
  assert.equal(q[0], 0);
  // Natural index 1 is position (0,1) which is zigzag index 1 -> value 1
  assert.equal(q[1], 1);
});

test("parseDQTSegment: parses 16-bit table and enforces length", () => {
  const header = new Uint8Array([0x10]); // pq=1, tq=0
  const entries = new Uint8Array(128);
  for (let i = 0; i < 64; i++) {
    const val = 300 + i; // >255 to ensure 16-bit path
    entries[i * 2] = (val >> 8) & 0xff;
    entries[i * 2 + 1] = val & 0xff;
  }
  const bytes = new Uint8Array(header.length + entries.length);
  bytes.set(header, 0);
  bytes.set(entries, 1);
  const qtables = [null, null, null, null];
  const end = parseDQTSegment(bytes, 0, bytes.length, qtables);
  assert.equal(end, bytes.length);
  assert.equal(qtables[0][0], 300);
});

test("parseDQTSegment: rejects invalid precision/id and short payload", () => {
  const bad = new Uint8Array([0x20]); // pq=2 invalid
  const qtables = [null, null, null, null];
  assert.throws(() => parseDQTSegment(bad, 0, bad.length, qtables), /ERR_DQT_PRECISION/);

  const short = new Uint8Array([0x00, 1, 2, 3]); // too short for 64 entries
  assert.throws(() => parseDQTSegment(short, 0, short.length, [null, null, null, null]), /ERR_DQT_LENGTH/);
});

function buildSOFPayload({ P = 8, X, Y, comps }) {
  const Nf = comps.length;
  const buf = new Uint8Array(6 + Nf * 3);
  let o = 0;
  buf[o++] = P;
  buf[o++] = (Y >> 8) & 0xff;
  buf[o++] = Y & 0xff;
  buf[o++] = (X >> 8) & 0xff;
  buf[o++] = X & 0xff;
  buf[o++] = Nf;
  for (const c of comps) {
    buf[o++] = c.id;
    buf[o++] = ((c.h & 0x0f) << 4) | (c.v & 0x0f);
    buf[o++] = c.tq;
  }
  return buf;
}

test("parseSOFSegment: computes geometry for 4:2:0 correctly", () => {
  const payload = buildSOFPayload({
    X: 16,
    Y: 16,
    comps: [
      { id: 1, h: 2, v: 2, tq: 0 }, // Y
      { id: 2, h: 1, v: 1, tq: 1 }, // Cb
      { id: 3, h: 1, v: 1, tq: 1 }, // Cr
    ],
  });
  const frame = parseSOFSegment(payload, 0, payload.length, false, [null, null, null, null]);
  assert.equal(frame.Hmax, 2);
  assert.equal(frame.Vmax, 2);
  assert.equal(frame.mcusPerLine, 1);
  assert.equal(frame.mcusPerColumn, 1);
  const y = frame.components[0];
  const cb = frame.components[1];
  assert.equal(y.blocksPerLine, 2);
  assert.equal(y.blocksPerColumn, 2);
  assert.equal(cb.blocksPerLine, 1);
  assert.equal(cb.blocksPerColumn, 1);
});

test("parseSOFSegment: odd dimensions and 4:2:2 sampling", () => {
  const payload = buildSOFPayload({
    X: 13,
    Y: 17,
    comps: [
      { id: 1, h: 2, v: 1, tq: 0 },
      { id: 2, h: 1, v: 1, tq: 1 },
      { id: 3, h: 1, v: 1, tq: 1 },
    ],
  });
  const f = parseSOFSegment(payload, 0, payload.length, false, [null, null, null, null]);
  assert.equal(f.Hmax, 2);
  assert.equal(f.Vmax, 1);
  assert.equal(f.mcusPerLine, Math.ceil(13 / (8 * 2)));
  assert.equal(f.mcusPerColumn, Math.ceil(17 / (8 * 1)));
  const y = f.components[0];
  assert.equal(y.blocksPerLine, Math.ceil((Math.ceil(13 / 8) * 2) / 2));
  assert.equal(y.blocksPerColumn, Math.ceil((Math.ceil(17 / 8) * 1) / 1));
});

test("parseSOFSegment: rejects unsupported precision and invalid sampling", () => {
  const badP = buildSOFPayload({ P: 12, X: 8, Y: 8, comps: [{ id: 1, h: 1, v: 1, tq: 0 }] });
  assert.throws(() => parseSOFSegment(badP, 0, badP.length, false, [null, null, null, null]), /ERR_SOF_PRECISION/);
  const badSamp = buildSOFPayload({ P: 8, X: 8, Y: 8, comps: [{ id: 1, h: 0, v: 1, tq: 0 }] });
  assert.throws(() => parseSOFSegment(badSamp, 0, badSamp.length, false, [null, null, null, null]), /ERR_SOF_SAMPLING/);
});

test("parseSOSSegment: baseline params and component mapping", () => {
  const frame = parseSOFSegment(
    buildSOFPayload({
      X: 8,
      Y: 8,
      comps: [
        { id: 1, h: 1, v: 1, tq: 0 },
        { id: 2, h: 1, v: 1, tq: 1 },
        { id: 3, h: 1, v: 1, tq: 1 },
      ],
    }),
    0,
    6 + 3 * 3,
    false,
    [null, null, null, null]
  );
  // Build baseline SOS: Ns=3, [Cs, td|ta]*3, Ss=0 Se=63 AhAl=0
  const sos = new Uint8Array(1 + 3 * 2 + 3);
  let o = 0;
  sos[o++] = 3;
  sos[o++] = 1;
  sos[o++] = 0x00;
  sos[o++] = 2;
  sos[o++] = 0x11;
  sos[o++] = 3;
  sos[o++] = 0x11;
  sos[o++] = 0;
  sos[o++] = 63;
  sos[o++] = 0;
  const desc = parseSOSSegment(sos, 0, sos.length, frame);
  // Components mapped
  assert.equal(desc.components.length, 3);
  assert.equal(desc.components[0].id, 1);
  assert.equal(desc.components[1].td, 1);
  assert.equal(desc.components[1].ta, 1);
});

test("parseSOSSegment: rejects non-baseline spectral/approx params", () => {
  const frame = parseSOFSegment(buildSOFPayload({ X: 8, Y: 8, comps: [{ id: 1, h: 1, v: 1, tq: 0 }] }), 0, 9, false, [
    null,
    null,
    null,
    null,
  ]);
  const sos = new Uint8Array([1, 1, 0x00, 1, 1, 1]); // Ns=1, td=0 ta=0, Ss=1 Se=1 AhAl=1 -> invalid for baseline
  assert.throws(() => parseSOSSegment(sos, 0, sos.length, frame), /ERR_SOS_BASELINE/);
});
