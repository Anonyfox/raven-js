import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeBaselineScan } from "./baseline.js";
import { buildHuffmanTable, createBitReader } from "./huffman.js";

// Minimal synthetic baseline scan test using trivial Huffman:
// DC: one code of len1 with symbol=2 (means receive 2 bits for DC magnitude)
// AC: EOB code only (len1 symbol=0)
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

test("decodeBaselineScan: decodes single MCU with DC-only blocks", () => {
  // Frame: 1 component, 1x1 MCU, 1x1 blocks
  const frame = {
    mcusPerLine: 1,
    mcusPerColumn: 1,
    components: [{ id: 1, h: 1, v: 1, tq: 0, blocksPerLine: 1, blocksPerColumn: 1, blocks: [[new Int16Array(64)]] }],
  };
  const scan = { components: [{ idx: 0, id: 1, td: 0, ta: 0 }] };
  const store = makeSimpleHuffman();
  // Bitstream: DC symbol uses s=2, then 2 bits '10' => value=2 (positive)
  // Pack: first byte provides DC symbol (code '0'), but our reader decodes symbols via Huffman, so we just need provide the 2 bits after symbol.
  // To keep simple, layout bits: [symbol=0 implicit in table with len1], then value bits '10' in next bits.
  // We'll craft bytes where the first receiveSigned(2) reads '10' (binary 2)
  // Bits: 0 (DC symbol with len1) then 10 (value=2)
  const br = createBitReader(new Uint8Array([0b01000000]));
  decodeBaselineScan(br, /** @type {any} */ (frame), scan, /** @type {any} */ (store));
  assert.equal(frame.components[0].blocks[0][0][0], 2);
});
