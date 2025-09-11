/**
 * JPEG Huffman + Bitreader unit tests (lean, deterministic)
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildHuffmanTable, createBitReader, decodeHuffmanSymbol } from "./huffman.js";

test("bitreader: unstuff 0xFF00 as literal 0xFF", () => {
  const bytes = new Uint8Array([0xab, 0xff, 0x00, 0xcd]);
  const br = createBitReader(bytes);
  assert.equal(br.receive(8), 0xab);
  assert.equal(br.receive(8), 0xff);
  assert.equal(br.receive(8), 0xcd);
});

test("bitreader: detect marker and expose via getMarker", () => {
  const bytes = new Uint8Array([0x12, 0x34, 0xff, 0xd0, 0x00]); // RST0 after two bytes
  const br = createBitReader(bytes);
  assert.equal(br.receive(8), 0x12);
  assert.equal(br.receive(8), 0x34);
  try {
    // reading next bit should encounter marker
    br.readBit();
    assert.fail("expected marker error");
  } catch (err) {
    assert.equal(err?.code, "ERR_MARKER");
  }
  const m = br.getMarker();
  assert.equal(m, 0xffd0);
  assert.equal(br.hasMarker(), false);
});

test("bitreader: receiveSigned matches JPEG sign extension", () => {
  // craft stream with 3-bit value 0b011 (which represents -4)
  const bytes = new Uint8Array([0b01100000]);
  const br = createBitReader(bytes);
  assert.equal(br.receiveSigned(3), -4);
});

test("huffman: build canonical table and decode fast/slow paths", () => {
  // lengths: 1 code of len1 (symbol 0xA), 2 codes of len2 (symbols 0xB, 0xC)
  const L = new Uint8Array(16);
  L[0] = 1; // len 1
  L[1] = 2; // len 2
  const V = new Uint8Array([0xa, 0xb, 0xc]);
  const tab = buildHuffmanTable(L, V, 9);

  // codes: len1 -> 0, len2 -> 10, 11
  // Fast path: supply at least 9 bits starting with 10...
  const brFast = createBitReader(new Uint8Array([0b10000000, 0b00000000]));
  const symFast = decodeHuffmanSymbol(brFast, tab);
  assert.equal(symFast, 0xb);

  // Slow path: only 1 bit available, expect symbol 0xA
  const brSlow = createBitReader(new Uint8Array([0b00000000]));
  const symSlow = decodeHuffmanSymbol(brSlow, tab);
  assert.equal(symSlow, 0xa);
});
