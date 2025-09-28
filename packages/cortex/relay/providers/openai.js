/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file OpenAI-compatible adapter (also used for xAI due to API shape).
 */

import { PROVIDERS } from "./detect.js";

export const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

/**
 * Build request body for OpenAI-like providers.
 * @param {{ model: string, messages: Array<{role: string, content: string}>, forceJson?: boolean }} input
 */
export function buildOpenAIRequest(input) {
  /** @type {{ model: string, messages: Array<{role: string, content: string}>, response_format?: { type: string } }} */
  const body = {
    model: input.model,
    messages: input.messages,
  };
  if (input.forceJson) {
    // OpenAI supports response_format json_object
    // xAI currently follows the same
    body.response_format = { type: "json_object" };
  }
  return body;
}

/**
 * Headers for OpenAI-like providers.
 * @returns {Record<string, string>}
 */
export function openAIHeaders() {
  const envKey = PROVIDERS.openai.envKey;
  const apiKey = process.env[envKey];
  if (!apiKey) throw new Error(`${PROVIDERS.openai.name} is not active (missing ${envKey})`);
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * Extract text from OpenAI-like response JSON.
 * @param {any} json
 * @returns {string}
 */
export function extractOpenAIText(json) {
  if (!json || !Array.isArray(json.choices) || json.choices.length === 0) {
    throw new Error("No choices in response");
  }
  const msg = json.choices[0]?.message;
  const content = msg?.content;
  if (typeof content !== "string" || content.length === 0) {
    throw new Error("Empty response content");
  }
  return content.trim();
}
