/**
 * @file Tests for JPEG codec module exports.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { decodeJPEG, encodeJPEG } from "./index.js";

describe("JPEG codec module", () => {
  it("exports decodeJPEG function", () => {
    assert.equal(typeof decodeJPEG, "function");
  });

  it("exports encodeJPEG function", () => {
    assert.equal(typeof encodeJPEG, "function");
  });
});
