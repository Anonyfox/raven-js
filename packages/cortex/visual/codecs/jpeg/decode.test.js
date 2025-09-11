import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeJPEG } from "./decode.js";

test("decodeJPEG API exists and throws until implemented", async () => {
  assert.equal(typeof decodeJPEG, "function");
  await assert.rejects(() => decodeJPEG(new Uint8Array([0xff, 0xd8, 0xff])), /ERR_MARKER|ERR_SEGMENT|ERR_NO_FRAME/);
});
