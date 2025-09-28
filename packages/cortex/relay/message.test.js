import assert from "node:assert";
import { describe, it } from "node:test";
import { Message } from "./message.js";

describe("relay/Message", () => {
  it("constructs and serializes", () => {
    const m = new Message("user", "hello");
    const j = m.toJSON();
    assert.equal(j.role, "user");
    assert.equal(j.content, "hello");
  });

  it("deserializes and validates", () => {
    const m = Message.fromJSON({ role: "assistant", content: "ok" });
    assert.equal(m.role, "assistant");
  });

  it("rejects invalid json", () => {
    assert.throws(() => Message.fromJSON({}));
  });
});
