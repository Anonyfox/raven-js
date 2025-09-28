/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file xAI adapter (OpenAI-compatible surface but distinct env/endpoint).
 */

import { PROVIDERS } from "./detect.js";

export const XAI_ENDPOINT = "https://api.x.ai/v1/chat/completions";

/**
 * Build request body for xAI.
 * @param {{ model: string, messages: Array<{role: string, content: string}>, forceJson?: boolean }} input
 */
export function buildXAIRequest(input) {
  /** @type {{ model: string, messages: Array<{role: string, content: string}>, response_format?: { type: string } }} */
  const body = {
    model: input.model,
    messages: input.messages,
  };
  if (input.forceJson) {
    body.response_format = { type: "json_object" };
  }
  return body;
}

/**
 * Headers for xAI.
 * @returns {Record<string, string>}
 */
export function xaiHeaders() {
  const envKey = PROVIDERS.xai.envKey;
  const apiKey = process.env[envKey];
  if (!apiKey) throw new Error(`${PROVIDERS.xai.name} is not active (missing ${envKey})`);
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * Extract text from xAI response JSON.
 * @param {any} json
 * @returns {string}
 */
export function extractXAIText(json) {
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
