import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { Schema } from "../structures/schema.js";
import { genData, genText } from "./shortcuts.js";

class Demo extends Schema {
  value = Schema.field("", { description: "v" });
}

function mockFetchOnce(handler) {
  globalThis.fetch = async (u, o) => handler(u, o);
}
function okJson(json) {
  return new Response(JSON.stringify(json), { status: 200 });
}

describe("relay/shortcuts", () => {
  const env = process.env;
  beforeEach(() => {
    process.env = { ...env, API_KEY_OPENAI: "x" };
  });

  it("genText works with system/model/provider opts", async () => {
    mockFetchOnce(async () => okJson({ choices: [{ message: { content: "ok" } }] }));
    const text = await genText("u", { system: "s", model: "gpt-4o-mini", provider: "openai" });
    assert.equal(text, "ok");
  });

  it("genData validates schema", async () => {
    const payload = { choices: [{ message: { content: '{"value":"x"}' } }] };
    mockFetchOnce(async () => okJson(payload));
    const schema = new Demo();
    const res = await genData("u", schema, { model: "gpt-4o-mini" });
    assert.equal(res.value.value, "x");
  });
});
