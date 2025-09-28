/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file LLM Relay – provider-agnostic chat abstraction for OpenAI-compatible APIs.
 *
 * Provides a lean zero-dependency interface to converse with LLMs across
 * providers (OpenAI, Anthropic, xAI). Supports per-call provider overrides,
 * structured JSON responses validated via `Schema`, and trivial
 * serialization/deserialization for state persistence.
 */

export { Chat } from "./chat.js";
export { Message } from "./message.js";
export { genData, genText } from "./shortcuts.js";
