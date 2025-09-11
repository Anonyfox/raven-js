import assert from "node:assert/strict";
import { test } from "node:test";
import { buildHuffmanTable, createBitReader } from "./huffman.js";
import { decodeProgressiveScanWithDRI } from "./progressive.js";

function makeTables(symDC = [2], symAC = [0]) {
  const L = new Uint8Array(16);
  L[0] = 1;
  return {
    dc: [buildHuffmanTable(L, new Uint8Array(symDC), 9), null, null, null],
    ac: [buildHuffmanTable(L, new Uint8Array(symAC), 9), null, null, null],
  };
}

test("progressive DC first then refine modifies DC at correct plane", () => {
  const frame = {
    mcusPerLine: 1,
    mcusPerColumn: 1,
    components: [{ id: 1, h: 1, v: 1, tq: 0, blocksPerLine: 1, blocksPerColumn: 1, blocks: [[new Int16Array(64)]] }],
  };
  const store = makeTables([1], [0]); // DC symbol=1 (s=1)
  const predictors = new Int32Array(1);
  // DC first (Ah=0, Al=1): s=1, value bit '1' => diff=1<<1 = 2
  let br = createBitReader(new Uint8Array([0b01000000])); // symbol '0', then bit '1'
  decodeProgressiveScanWithDRI(
    br,
    /** @type {any} */ (frame),
    { components: [{ idx: 0, id: 1, td: 0, ta: 0 }], Ss: 0, Se: 0, Ah: 0, Al: 1 },
    /** @type {any} */ (store),
    0,
    predictors
  );
  assert.equal(frame.components[0].blocks[0][0][0], 2);
  // DC refine (Ah>0, Al=0): append one bit '1' at LSB
  br = createBitReader(new Uint8Array([0b10000000]));
  decodeProgressiveScanWithDRI(
    br,
    /** @type {any} */ (frame),
    { components: [{ idx: 0, id: 1, td: 0, ta: 0 }], Ss: 0, Se: 0, Ah: 1, Al: 0 },
    /** @type {any} */ (store),
    0,
    predictors
  );
  assert.equal(frame.components[0].blocks[0][0][0] & 1, 1);
});

test("progressive AC first with simple insertion", () => {
  const frame = {
    mcusPerLine: 1,
    mcusPerColumn: 1,
    components: [{ id: 1, h: 1, v: 1, tq: 0, blocksPerLine: 1, blocksPerColumn: 1, blocks: [[new Int16Array(64)]] }],
  };
  // AC first: symbol RS to place one value in band Ss=1..Se=1; we simulate symbol and one signed bit
  const store = makeTables([0], [0x01]); // r=0,s=1
  const predictors = new Int32Array(1);
  // symbol '0' then signed bit '1' => +1 at k=1
  const br = createBitReader(new Uint8Array([0b01000000]));
  decodeProgressiveScanWithDRI(
    br,
    /** @type {any} */ (frame),
    { components: [{ idx: 0, id: 1, td: 0, ta: 0 }], Ss: 1, Se: 1, Ah: 0, Al: 0 },
    /** @type {any} */ (store),
    0,
    predictors
  );
  assert.notEqual(frame.components[0].blocks[0][0][1], 0);
});

test("progressive AC first with EOBRUN spans MCUs and skips coefficients", () => {
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
  // AC first: RS value 0x20 => r=2, s=0 (EOBRUN with rbits=2). Bits '10' => val=2; eobrun = 2 + (1<<2)-1 = 5
  const L = new Uint8Array(16);
  L[0] = 1;
  const store = {
    dc: [buildHuffmanTable(L, new Uint8Array([0]), 9)],
    ac: [buildHuffmanTable(L, new Uint8Array([0x20]), 9)],
  };
  const predictors = new Int32Array(1);
  // symbol '0' then rbits '10'
  const br = createBitReader(new Uint8Array([0b01000000]));
  decodeProgressiveScanWithDRI(
    br,
    /** @type {any} */ (frame),
    { components: [{ idx: 0, id: 1, td: 0, ta: 0 }], Ss: 1, Se: 5, Ah: 0, Al: 0 },
    /** @type {any} */ (store),
    0,
    predictors
  );
  // Both MCUs should remain zero in band after skipping
  const b0 = frame.components[0].blocks[0][0];
  const b1 = frame.components[0].blocks[0][1];
  for (let k = 1; k <= 5; k++) {
    if (b0[k] !== 0 || b1[k] !== 0) {
      assert.fail("EOBRUN did not skip band coefficients");
    }
  }
});
