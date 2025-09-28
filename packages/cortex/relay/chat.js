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
  extractAnthropicText,
} from "./providers/anthropic.js";
import { activeProviders, assertProviderActive, detectProviderByModel } from "./providers/detect.js";
import { buildOpenAIRequest, extractOpenAIText, OPENAI_ENDPOINT, openAIHeaders } from "./providers/openai.js";
import { buildXAIRequest, extractXAIText, XAI_ENDPOINT, xaiHeaders } from "./providers/xai.js";
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
   * @param {string} userPrompt
   * @param {Schema} schema
   * @param {CallOptions} [opts]
   * @returns {Promise<Schema>}
   */
  async generateData(userPrompt, schema, opts) {
    const prompt = (
      `${userPrompt}\n\n` +
      `Answer with json data that matches this schema:\n` +
      `${schema.toJSON()}`
    ).trim();

    const messages = [...this.messages, new Message("user", prompt)];
    const text = await this.#call(messages, true, opts);

    const stripped = stripCodeFences(text);
    if (!schema.validate(stripped)) {
      throw new Error(`Invalid response data: ${stripped}`);
    }
    schema.fromJSON(stripped);
    this.addUserMessage(prompt).addAssistantMessage(stripped);
    return schema;
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

    if (provider === "openai") {
      endpoint = OPENAI_ENDPOINT;
      headers = openAIHeaders();
      body = buildOpenAIRequest({ model: this.model, messages: messages.map((m) => m.toJSON()), forceJson });
    } else if (provider === "xai") {
      endpoint = XAI_ENDPOINT;
      headers = xaiHeaders();
      body = buildXAIRequest({ model: this.model, messages: messages.map((m) => m.toJSON()), forceJson });
    } else if (provider === "anthropic") {
      endpoint = ANTHROPIC_ENDPOINT;
      headers = anthropicHeaders();
      body = buildAnthropicRequest({ model: this.model, messages: messages.map((m) => m.toJSON()), forceJson });
    } else {
      throw new Error("Unsupported provider");
    }

    const json = await postJson(endpoint, headers, body, { timeoutMs: opts?.timeoutMs, retries: opts?.retries });
    let text;
    if (provider === "anthropic") text = extractAnthropicText(json);
    else if (provider === "openai") text = extractOpenAIText(json);
    else text = extractXAIText(json);
    this.#lastProvider = provider;
    this.#callIndex++;
    return text;
  }
}
