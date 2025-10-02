/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Chat abstraction across OpenAI, Anthropic and xAI.
 */

import { Message } from "./message.js";
import {
  ANTHROPIC_ENDPOINT,
  anthropicHeaders,
  buildAnthropicRequest,
  buildAnthropicTools,
  extractAnthropicText,
  parseAnthropicToolUses,
} from "./providers/anthropic.js";
import { activeProviders, assertProviderActive, detectProviderByModel } from "./providers/detect.js";
import {
  buildOpenAIRequest,
  buildOpenAIToolResult,
  buildOpenAITools,
  extractOpenAIText,
  OPENAI_ENDPOINT,
  openAIHeaders,
  parseOpenAIToolCalls,
} from "./providers/openai.js";
import {
  buildXAIRequest,
  buildXAIToolResult,
  buildXAITools,
  extractXAIText,
  parseXAIToolCalls,
  XAI_ENDPOINT,
  xaiHeaders,
} from "./providers/xai.js";
import { Tool } from "./tool.js";
import { postJson, stripCodeFences } from "./transport.js";

/**
 * @typedef {import('../structures/schema.js').Schema} Schema
 */

/**
 * @typedef {"openai"|"anthropic"|"xai"} ProviderKey
 */

/**
 * @typedef {{ provider?: ProviderKey, timeoutMs?: number, retries?: number }} CallOptions
 */

export class Chat {
  /** @type {string} */
  model;
  /** @type {Message[]} */
  messages = [];
  /** @type {Tool[]} */
  tools = [];

  /**
   * Create a new Chat.
   * @param {string} [model]
   */
  constructor(model) {
    if (model && typeof model !== "string") {
      throw new TypeError("model must be a string if provided");
    }
    this.model = model || "gpt-4o-mini";
  }

  /**
   * Add system message.
   * @param {string} content
   * @returns {this}
   */
  addSystemMessage(content) {
    this.messages.push(new Message("system", content));
    return this;
  }

  /**
   * Add user message.
   * @param {string} content
   * @returns {this}
   */
  addUserMessage(content) {
    this.messages.push(new Message("user", content));
    return this;
  }

  /**
   * Add assistant message.
   * @param {string} content
   * @returns {this}
   */
  addAssistantMessage(content) {
    this.messages.push(new Message("assistant", content));
    return this;
  }

  /**
   * Register a tool instance for tool-calling.
   * @param {Tool} tool
   * @returns {this}
   */
  addTool(tool) {
    this.tools.push(tool);
    return this;
  }

  /**
   * One-shot text generation.
   * @param {string} userPrompt
   * @param {string} [systemPrompt]
   * @param {CallOptions} [opts]
   * @returns {Promise<string>}
   */
  static async genText(userPrompt, systemPrompt, opts) {
    const chat = new Chat();
    if (systemPrompt) chat.addSystemMessage(systemPrompt);
    return chat.generateText(userPrompt, opts);
  }

  /**
   * One-shot structured data generation.
   * Input schema is cloned to prevent mutation of the original.
   * @param {string} userPrompt
   * @param {Schema} schema
   * @param {string} [systemPrompt]
   * @param {CallOptions} [opts]
   * @returns {Promise<Schema>}
   */
  static async genData(userPrompt, schema, systemPrompt, opts) {
    const chat = new Chat();
    if (systemPrompt) chat.addSystemMessage(systemPrompt);
    return chat.generateData(userPrompt, schema, opts);
  }

  /**
   * Generate a plain text response and append to history.
   * @param {string} userPrompt
   * @param {CallOptions} [opts]
   * @returns {Promise<string>}
   */
  async generateText(userPrompt, opts) {
    const messages = [...this.messages, new Message("user", userPrompt)];
    const text = await this.#call(messages, false, opts);
    this.addUserMessage(userPrompt).addAssistantMessage(text);
    return text;
  }

  /**
   * Generate structured data and populate schema instance.
   * Input schema is cloned to prevent mutation of the original.
   * @param {string} userPrompt
   * @param {Schema} schema
   * @param {CallOptions} [opts]
   * @returns {Promise<Schema>}
   */
  async generateData(userPrompt, schema, opts) {
    const instance = schema.clone();
    const prompt = (
      `${userPrompt}\n\n` +
      `Answer with json data that matches this schema:\n` +
      `${instance.toJSON()}`
    ).trim();

    const messages = [...this.messages, new Message("user", prompt)];
    const text = await this.#call(messages, true, opts);

    const stripped = stripCodeFences(text);
    if (!instance.validate(stripped)) {
      throw new Error(`Invalid response data: ${stripped}`);
    }
    instance.fromJSON(stripped);
    this.addUserMessage(prompt).addAssistantMessage(stripped);
    return instance;
  }

  /**
   * Serialize chat.
   * @returns {string}
   */
  toJSON() {
    return JSON.stringify({ model: this.model, messages: this.messages.map((m) => m.toJSON()) });
  }

  /**
   * Deserialize into this instance, replacing current state.
   * @param {string|object} json
   */
  fromJSON(json) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    if (!data || typeof data !== "object") throw new TypeError("Invalid chat JSON");
    const model = /** @type {any} */ (data).model;
    const messages = /** @type {any} */ (data).messages;
    if (typeof model !== "string") throw new TypeError("Invalid data: model should be a string.");
    if (!Array.isArray(messages)) throw new TypeError("Invalid data: messages should be an array.");
    /** @type {Message[]} */
    const restored = messages.map((m) => Message.fromJSON(m));
    this.model = model;
    this.messages = restored;
  }

  /**
   * Select a provider based on override or model detection.
   * @param {ProviderKey|undefined} override
   * @returns {ProviderKey}
   */
  #selectProvider(override) {
    if (override) {
      assertProviderActive(override);
      return override;
    }
    const detected = detectProviderByModel(this.model);
    if (!detected) throw new Error(`Unsupported model: ${this.model}`);
    assertProviderActive(detected);
    return detected;
  }

  /**
   * Provider round-robin hook. Subclasses can override to mix providers.
   * @param {{ callIndex: number, lastProvider: ProviderKey|null, active: ProviderKey[] }} _ctx
   * @returns {ProviderKey|null}
   */
  selectProviderStrategy(_ctx) {
    return null;
  }

  /** @type {number} */
  #callIndex = 0;
  /** @type {ProviderKey|null} */
  #lastProvider = null;

  /**
   * Internal call.
   * @param {Message[]} messages
   * @param {boolean} forceJson
   * @param {CallOptions} [opts]
   * @returns {Promise<string>}
   */
  async #call(messages, forceJson, opts) {
    const active = activeProviders();
    const strategy = this.selectProviderStrategy({
      callIndex: this.#callIndex,
      lastProvider: this.#lastProvider,
      active,
    });
    const provider = strategy || this.#selectProvider(opts?.provider);

    let endpoint = "";
    /** @type {Record<string, string>} */
    let headers = {};
    /** @type {any} */
    let body;

    const usingTools = this.tools.length > 0;
    /** @type {string|undefined} */
    let anthropicSystem;
    if (provider === "openai") {
      endpoint = OPENAI_ENDPOINT;
      headers = openAIHeaders();
      body = buildOpenAIRequest({ model: this.model, messages: messages.map((m) => m.toJSON()), forceJson });
      if (usingTools) body.tools = buildOpenAITools(this.tools);
    } else if (provider === "xai") {
      endpoint = XAI_ENDPOINT;
      headers = xaiHeaders();
      body = buildXAIRequest({ model: this.model, messages: messages.map((m) => m.toJSON()), forceJson });
      if (usingTools) body.tools = buildXAITools(this.tools);
    } else if (provider === "anthropic") {
      endpoint = ANTHROPIC_ENDPOINT;
      headers = anthropicHeaders();
      body = buildAnthropicRequest({ model: this.model, messages: messages.map((m) => m.toJSON()), forceJson });
      if (usingTools) body.tools = buildAnthropicTools(this.tools);
      // Preserve top-level system prompt and ensure it's not echoed in messages
      anthropicSystem = body.system;
    } else {
      throw new Error("Unsupported provider");
    }

    // Tool-aware loop
    let step = 0;
    /** @type {any[]} */
    const localMessages = messages.map((m) => m.toJSON());
    while (true) {
      const json = await postJson(endpoint, headers, body, { timeoutMs: opts?.timeoutMs, retries: opts?.retries });
      this.#lastProvider = provider;
      this.#callIndex++;

      // Parse tool calls
      const calls =
        provider === "anthropic"
          ? parseAnthropicToolUses(json)
          : provider === "openai"
            ? parseOpenAIToolCalls(json)
            : parseXAIToolCalls(json);
      if (!usingTools || calls.length === 0) {
        // Final content path
        let text;
        if (provider === "anthropic") text = extractAnthropicText(json);
        else if (provider === "openai") text = extractOpenAIText(json);
        else text = extractXAIText(json);
        return text;
      }

      // Execute tools sequentially
      /** @type {any[]} */
      const toolResults = [];
      for (const call of calls) {
        const tool = this.tools.find((t) => t.name === call.name);
        if (!tool) {
          toolResults.push({ id: call.id, result: { error: `Unknown tool: ${call.name}` } });
          continue;
        }
        // Validate args
        if (!tool.parameters.validate(call.args)) {
          const msg = `Invalid arguments for ${tool.name}`;
          toolResults.push({ id: call.id, result: { error: msg } });
          continue;
        }
        // Execute with timeout
        const exec = tool.execute({ args: call.args, ctx: { model: this.model } });
        const result = await withTimeout(exec, tool.options.timeoutMs).catch((e) => ({
          error: String(e?.message || e),
        }));
        // Validate result if schema present
        if (tool.resultSchema && !tool.resultSchema.validate(result)) {
          toolResults.push({ id: call.id, result: { error: `Invalid result for ${tool.name}` } });
        } else {
          toolResults.push({ id: call.id, result });
        }
      }

      // Append assistant tool_calls message when required, then tool results
      if (provider === "anthropic") {
        // Include the assistant message containing tool_use blocks
        const assistantContent = json?.content;
        if (Array.isArray(assistantContent)) {
          // Preserve full content array without stringifying
          localMessages.push({ role: "assistant", content: assistantContent });
        }

        // Build a single user message containing all tool_result blocks
        const resultBlocks = toolResults.map((tr) => ({
          type: "tool_result",
          tool_use_id: tr.id,
          content: typeof tr.result === "string" ? tr.result : JSON.stringify(tr.result),
        }));
        localMessages.push({ role: "user", content: resultBlocks });

        // Ensure system prompt stays top-level and is not inside messages
        if (anthropicSystem) body.system = anthropicSystem;
        body.messages = localMessages.filter((m) => m.role !== "system");
      } else if (provider === "openai") {
        // Include the assistant message containing tool_calls
        const assistant = json?.choices?.[0]?.message;
        if (assistant) localMessages.push(assistant);
        const toolMsgs = toolResults.map((tr) => buildOpenAIToolResult(tr.id, tr.result));
        localMessages.push(...toolMsgs);
        body.messages = localMessages;
      } else {
        // xAI follows OpenAI shape: include assistant tool_calls first
        const assistant = json?.choices?.[0]?.message;
        if (assistant) localMessages.push(assistant);
        const toolMsgs = toolResults.map((tr) => buildXAIToolResult(tr.id, tr.result));
        localMessages.push(...toolMsgs);
        body.messages = localMessages;
      }

      step++;
      if (step >= 4) return ""; // graceful stop if model keeps looping
    }
  }
}

/**
 * @param {Promise<any>} promise
 * @param {number} ms
 */
async function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Tool timed out")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}
