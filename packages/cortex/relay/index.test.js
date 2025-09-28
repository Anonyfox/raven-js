import assert from "node:assert";
import { describe, it } from "node:test";
import { Chat, Message } from "./index.js";

describe("relay/index", () => {
  it("exports Chat and Message", () => {
    assert.ok(typeof Chat === "function");
    assert.ok(typeof Message === "function");
  });
});
