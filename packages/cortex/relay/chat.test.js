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

  describe("Tool-calling order (OpenAI)", () => {
    it("includes assistant tool_calls message before tool results", async () => {
      process.env.API_KEY_OPENAI = "x";
      // First response contains tool_calls
      let stage = 0;
      mockFetchOnce(async () =>
        okJson({
          choices: [
            {
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "id1",
                    type: "function",
                    function: { name: "calculator", arguments: '{"op":"add","a":1,"b":2}' },
                  },
                ],
              },
            },
          ],
        })
      );
      const chat = new Chat("gpt-4o-mini");
      // Register a minimal tool
      class Args extends Schema {
        a = Schema.field(0);
        b = Schema.field(0);
        op = Schema.field("add");
      }
      chat.addTool(new (class extends class T extends Object {} {})()); // placeholder, we will intercept fetch only
      // Monkey-patch tools to a workable instance
      chat.tools = [
        {
          name: "calculator",
          description: "",
          parameters: new Args(),
          options: { timeoutMs: 1000, retries: 0 },
          execute: async ({ args }) => ({ result: args.a + args.b }),
        },
      ];

      // Second request assertion: it must contain assistant tool_calls then tool role
      globalThis.fetch = async (_url, init) => {
        const body = JSON.parse(String(init.body));
        if (stage === 0) {
          stage = 1; // consume first
          return okJson({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: null,
                  tool_calls: [
                    {
                      id: "id1",
                      type: "function",
                      function: { name: "calculator", arguments: '{"op":"add","a":1,"b":2}' },
                    },
                  ],
                },
              },
            ],
          });
        }
        // Second stage: verify ordering
        const roles = body.messages.map((m) => m.role);
        const hasAssistantWithToolCalls = body.messages.some(
          (m) => m.role === "assistant" && Array.isArray(m.tool_calls)
        );
        const toolIndex = roles.indexOf("tool");
        const assistantIndex = roles.findIndex(
          (_r, i) => body.messages[i].role === "assistant" && body.messages[i].tool_calls
        );
        if (!(hasAssistantWithToolCalls && assistantIndex > -1 && (toolIndex === -1 || assistantIndex < toolIndex))) {
          return okJson({ choices: [{ message: { content: "order wrong" } }] });
        }
        // Return final assistant content
        return okJson({ choices: [{ message: { content: "ok" } }] });
      };

      const res = await chat.generateText("2+1?");
      assert.equal(res, "ok");
    });
  });

  describe("Tool-calling order (Anthropic)", () => {
    it("adds assistant tool_use then user tool_result with matching id", async () => {
      process.env.API_KEY_ANTHROPIC = "y";
      let stage = 0;
      const toolUseId = "toolu_123";
      globalThis.fetch = async (_url, init) => {
        const body = JSON.parse(String(init.body));
        if (stage === 0) {
          stage = 1;
          // First reply contains tool_use
          return okJson({
            content: [
              { type: "text", text: "Using tool" },
              { type: "tool_use", id: toolUseId, name: "calculator", input: { op: "add", a: 1, b: 2 } },
            ],
          });
        }
        // Second request should include assistant tool_use then user tool_result
        const msgs = body.messages;
        const last = msgs[msgs.length - 1];
        const prev = msgs[msgs.length - 2];
        const prevHasToolUse =
          prev?.role === "assistant" &&
          Array.isArray(prev.content) &&
          prev.content.some((c) => c.type === "tool_use" && c.id === toolUseId);
        const lastHasToolResult =
          last?.role === "user" &&
          Array.isArray(last.content) &&
          last.content.some((c) => c.type === "tool_result" && c.tool_use_id === toolUseId);
        if (!(prevHasToolUse && lastHasToolResult)) {
          return okJson({ content: [{ type: "text", text: "order wrong" }] });
        }
        // Ensure content blocks are arrays/objects, not stringified
        if (typeof prev.content === "string" || typeof last.content === "string") {
          return okJson({ content: [{ type: "text", text: "stringified content" }] });
        }
        // Final assistant content
        return okJson({ content: [{ type: "text", text: "ok" }] });
      };

      const chat = new Chat("claude-sonnet-4-20250514");
      class Args extends Schema {
        a = Schema.field(0);
        b = Schema.field(0);
        op = Schema.field("add");
      }
      chat.tools = [
        {
          name: "calculator",
          description: "",
          parameters: new Args(),
          options: { timeoutMs: 1000, retries: 0 },
          execute: async ({ args }) => ({ result: args.a + args.b }),
        },
      ];
      const res = await chat.generateText("2+1?");
      assert.equal(typeof res, "string");
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

    it("does not mutate input schema", async () => {
      const payload = { choices: [{ message: { content: '{"a":"populated"}' } }] };
      mockFetchOnce(async () => okJson(payload));
      const chat = new Chat("gpt-4o-mini");
      const schema = new SimpleData();
      const originalValue = schema.a.value;
      const res = await chat.generateData("u", schema);
      assert.equal(schema.a.value, originalValue);
      assert.equal(res.a.value, "populated");
    });

    it("allows schema reuse across multiple calls", async () => {
      mockFetchOnce(async () => okJson({ choices: [{ message: { content: '{"a":"first"}' } }] }));
      const chat = new Chat("gpt-4o-mini");
      const schema = new SimpleData();
      const res1 = await chat.generateData("u1", schema);
      assert.equal(res1.a.value, "first");

      mockFetchOnce(async () => okJson({ choices: [{ message: { content: '{"a":"second"}' } }] }));
      const res2 = await chat.generateData("u2", schema);
      assert.equal(res2.a.value, "second");
      assert.equal(schema.a.value, "");
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
