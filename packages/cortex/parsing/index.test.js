import assert from "node:assert";
import { describe, it } from "node:test";
import * as parsing from "./index.js";

describe("parsing module surface", () => {
  it("exports htmlToText function", () => {
    assert.equal(typeof parsing.htmlToText, "function");
  });
});
