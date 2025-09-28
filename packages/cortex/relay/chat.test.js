/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
// Minimal schema stub by importing the real one
import { Schema } from "../structures/schema.js";
import { Chat } from "./chat.js";
import { Message } from "./message.js";

class SimpleData extends Schema {
  a = Schema.field("", { description: "a" });
}

function mockFetchOnce(handler) {
  globalThis.fetch = async (_url, _opts) => handler(_url, _opts);
}

function okJson(json) {
  return new Response(JSON.stringify(json), { status: 200 });
}

function errJson(json, status = 400) {
  return new Response(JSON.stringify(json), { status });
}

describe("relay/Chat", () => {
  const env = process.env;
  beforeEach(() => {
    process.env = { ...env };
    process.env.API_KEY_OPENAI = "x";
    process.env.API_KEY_ANTHROPIC = "y";
    process.env.API_KEY_XAI = "z";
  });

  describe("Message", () => {
    it("validates role and content", () => {
      assert.throws(() => new Message("nope", "x"), /Invalid role/);
      assert.throws(() => new Message("user", ""), /Invalid content/);
      const m = new Message("user", "ok");
      assert.equal(m.toJSON().content, "ok");
      const back = Message.fromJSON({ role: "user", content: "ok" });
      assert.equal(back.content, "ok");
    });
  });

  describe("Text generation", () => {
    it("calls OpenAI-compatible and extracts text", async () => {
      mockFetchOnce(async () => okJson({ choices: [{ message: { content: " hi " } }] }));
      const chat = new Chat("gpt-4o-mini");
      chat.addSystemMessage("sys");
      const res = await chat.generateText("hello");
      assert.equal(res, "hi");
    });

    it("calls Anthropic and extracts text", async () => {
      mockFetchOnce(async () => okJson({ content: [{ text: " hi " }] }));
      const chat = new Chat("claude-3-5");
      chat.addSystemMessage("sys");
      const res = await chat.generateText("hello");
      assert.equal(res, "hi");
    });

    it("supports per-call provider override", async () => {
      mockFetchOnce(async (_u, opts) => {
        const h = /** @type {any} */ (opts).headers;
        assert.ok(h.Authorization?.startsWith("Bearer "));
        return okJson({ choices: [{ message: { content: "over" } }] });
      });
      const chat = new Chat("claude-3-5");
      const res = await chat.generateText("hello", { provider: "openai" });
      assert.equal(res, "over");
    });

    it("errors when provider inactive", async () => {
      delete process.env.API_KEY_OPENAI;
      const chat = new Chat("gpt-4o");
      await assert.rejects(() => chat.generateText("x"), /not active/);
    });

    it("surfaces non-2xx error bodies", async () => {
      mockFetchOnce(async () => errJson({ error: "boom" }, 500));
      const chat = new Chat("gpt-4o");
      await assert.rejects(() => chat.generateText("x"), /boom/);
    });
  });

  describe("Data generation with Schema", () => {
    it("enforces json mode where supported and validates schema", async () => {
      const payload = { choices: [{ message: { content: '```json\n{\n "a": "v"\n}\n```' } }] };
      mockFetchOnce(async () => okJson(payload));
      const chat = new Chat("gpt-4o-mini");
      const schema = new SimpleData();
      const res = await chat.generateData("u", schema);
      assert.equal(res.a.value, "v");
    });

    it("rejects invalid json against schema", async () => {
      mockFetchOnce(async () => okJson({ choices: [{ message: { content: "{}" } }] }));
      const chat = new Chat("gpt-4o-mini");
      const schema = new SimpleData();
      await assert.rejects(() => chat.generateData("u", schema), /Invalid response data/);
    });
  });

  describe("Serialization", () => {
    it("round-trips Chat and validates messages", () => {
      const chat = new Chat("gpt-4o");
      chat.addSystemMessage("a").addUserMessage("b");
      const json = chat.toJSON();
      const other = new Chat();
      other.fromJSON(json);
      assert.equal(other.model, "gpt-4o");
      assert.equal(other.messages.length, 2);
    });
  });
});
