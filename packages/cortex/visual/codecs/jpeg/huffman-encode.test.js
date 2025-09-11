import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCanonicalCodes, createHistograms, magnitudeCategory } from "./huffman-encode.js";

test("magnitudeCategory basic cases", () => {
  assert.equal(magnitudeCategory(0), 0);
  assert.equal(magnitudeCategory(1), 1);
  assert.equal(magnitudeCategory(-1), 1);
  assert.equal(magnitudeCategory(2), 2);
  assert.equal(magnitudeCategory(3), 2);
  assert.equal(magnitudeCategory(4), 3);
});

test("buildCanonicalCodes produces code lengths <= 16 and deterministic", () => {
  const freq = new Uint32Array(10);
  // Create some frequencies with ties
  for (let i = 0; i < freq.length; i++) freq[i] = (i % 3) + 1;
  const { lengths } = buildCanonicalCodes(freq);
  let maxLen = 0;
  for (let i = 0; i < lengths.length; i++) if (lengths[i] > maxLen) maxLen = lengths[i];
  assert.ok(maxLen <= 16);
  // Determinism: running twice yields same lengths
  const { lengths: lengths2 } = buildCanonicalCodes(freq);
  assert.deepEqual(Array.from(lengths), Array.from(lengths2));
});

test("createHistograms yields correct shapes", () => {
  const h = createHistograms();
  assert.equal(h.dcY.length, 12);
  assert.equal(h.acY.length, 256);
  assert.equal(h.dcC.length, 12);
  assert.equal(h.acC.length, 256);
});
