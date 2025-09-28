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

import { schemaToJsonObject } from "../tool.js";
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

/**
 * @param {import("../tool.js").Tool[]} tools
 */
export function buildXAITools(tools) {
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: schemaToJsonObject(t.parameters),
    },
  }));
}

/**
 * @param {any} json
 */
export function parseXAIToolCalls(json) {
  const choice = json?.choices?.[0];
  const callList = choice?.message?.tool_calls;
  if (!Array.isArray(callList) || callList.length === 0) return [];
  return callList.map((c) => ({
    id: String(c.id),
    name: c.function?.name,
    args: safeParse(c.function?.arguments),
  }));
}

/**
 * @param {any} s
 */
function safeParse(s) {
  if (typeof s !== "string") return {};
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/**
 * @param {string} toolCallId
 * @param {any} result
 */
export function buildXAIToolResult(toolCallId, result) {
  return {
    role: "tool",
    tool_call_id: toolCallId,
    content: typeof result === "string" ? result : JSON.stringify(result),
  };
}
