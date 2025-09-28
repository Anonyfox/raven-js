import assert from "node:assert";
import { describe, it } from "node:test";
import { postJson, stripCodeFences } from "./transport.js";

function mockFetch(handler) {
  globalThis.fetch = async (_url, _opts) => handler(_url, _opts);
}

function ok(text, status = 200) {
  return new Response(text, { status });
}

describe("relay/transport", () => {
  it("posts json and parses body", async () => {
    mockFetch(async () => ok('{"a":1}'));
    const res = await postJson("http://x", {}, { a: 1 }, { timeoutMs: 50, retries: 1 });
    assert.equal(res.a, 1);
  });

  it("retries on error and throws final", async () => {
    let n = 0;
    mockFetch(async () => {
      n++;
      return ok("boom", 500);
    });
    await assert.rejects(() => postJson("http://x", {}, {}, { retries: 2, timeoutMs: 10 }), /boom/);
    assert.ok(n >= 2);
  });

  it("strips code fences", () => {
    const t = stripCodeFences("```json\n{\n}\n```");
    assert.equal(t.trim(), "{\n}\n".trim());
  });
});
