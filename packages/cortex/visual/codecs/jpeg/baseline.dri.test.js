import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeBaselineScanWithDRI } from "./baseline.js";
import { buildHuffmanTable, createBitReader } from "./huffman.js";

function makeSimpleHuffman() {
  const L = new Uint8Array(16);
  L[0] = 1; // one code length 1
  const Vdc = new Uint8Array([2]);
  const Vac = new Uint8Array([0]);
  return {
    dc: [buildHuffmanTable(L, Vdc, 9), null, null, null],
    ac: [buildHuffmanTable(L, Vac, 9), null, null, null],
  };
}

test("decodeBaselineScanWithDRI: resets DC predictors at RST boundaries (Ri=1)", () => {
  // Frame: 1 component, 2 MCUs in a row
  const frame = {
    mcusPerLine: 2,
    mcusPerColumn: 1,
    components: [
      {
        id: 1,
        h: 1,
        v: 1,
        tq: 0,
        blocksPerLine: 2,
        blocksPerColumn: 1,
        blocks: [[new Int16Array(64), new Int16Array(64)]],
      },
    ],
  };
  const scan = { components: [{ idx: 0, id: 1, td: 0, ta: 0 }] };
  const store = makeSimpleHuffman();
  // Build entropy stream:
  // MCU#1: DC symbol '0', value s=2 '10' (diff=2), AC EOB '0' -> bits '0 10 0' => byte 0b01000000
  // Then align (already padded) and emit RST0 (0xFF 0xD0)
  // MCU#2: DC symbol '0', value s=2 '10', AC EOB '0' -> byte 0b01000000
  // End with EOI marker so that getMarker can be followed by something reasonable; not strictly required
  const bytes = new Uint8Array([0b01000000, 0xff, 0xd0, 0b01000000, 0xff, 0xd9]);
  const br = createBitReader(bytes);
  decodeBaselineScanWithDRI(br, /** @type {any} */ (frame), scan, /** @type {any} */ (store), 1);
  const b0 = frame.components[0].blocks[0][0];
  const b1 = frame.components[0].blocks[0][1];
  assert.equal(b0[0], 2);
  // Predictor should reset, so second block DC should be exactly diff=2, not 4
  assert.equal(b1[0], 2);
});
