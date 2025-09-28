/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Anthropic adapter.
 */

import { PROVIDERS } from "./detect.js";

export const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/**
 * Build request body for Anthropic.
 * Moves first system message (if present) to top-level `system`.
 * Adds a conservative max_tokens default if unspecified.
 *
 * @param {{ model: string, messages: Array<{role: string, content: string}>, forceJson?: boolean }} input
 */
export function buildAnthropicRequest(input) {
  const messages = [...input.messages];
  /** @type {string|undefined} */
  let system;
  if (messages[0]?.role === "system") {
    system = messages[0].content;
    messages.shift();
  }
  /** @type {{ model: string, messages: Array<{role: string, content: string}>, max_tokens: number, system?: string }} */
  const body = {
    model: input.model,
    messages,
    max_tokens: 7000,
  };
  if (system) body.system = system;
  // Anthropic does not support response_format json_object; leave as-is
  return body;
}

/**
 * Headers for Anthropic.
 */
export function anthropicHeaders() {
  const envKey = PROVIDERS.anthropic.envKey;
  const apiKey = process.env[envKey];
  if (!apiKey) throw new Error(`${PROVIDERS.anthropic.name} is not active (missing ${envKey})`);
  return {
    "x-api-key": apiKey,
    "anthropic-version": ANTHROPIC_VERSION,
  };
}

/**
 * Extract text from Anthropic response JSON.
 * @param {any} json
 * @returns {string}
 */
export function extractAnthropicText(json) {
  const content = json?.content;
  if (!Array.isArray(content) || content.length === 0) {
    throw new Error("No content in response");
  }
  const first = content[0];
  const text = first?.text;
  if (typeof text !== "string" || text.length === 0) {
    throw new Error("Empty response content");
  }
  return text.trim();
}
