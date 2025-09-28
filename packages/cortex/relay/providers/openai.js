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

import { schemaToJsonObject } from "../tool.js";
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

/**
 * Build OpenAI tools array from Tool instances.
 * @param {import("../tool.js").Tool[]} tools
 */
/**
 * @param {import("../tool.js").Tool[]} tools
 */
export function buildOpenAITools(tools) {
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
 * Parse OpenAI tool calls from assistant message JSON.
 * @param {any} json
 * @returns {Array<{ id: string, name: string, args: any }>}
 */
/**
 * @param {any} json
 */
export function parseOpenAIToolCalls(json) {
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
 * Build tool result message for OpenAI tool_call.
 * @param {string} toolCallId
 * @param {any} result
 */
/**
 * @param {string} toolCallId
 * @param {any} result
 */
export function buildOpenAIToolResult(toolCallId, result) {
  return {
    role: "tool",
    tool_call_id: toolCallId,
    content: typeof result === "string" ? result : JSON.stringify(result),
  };
}
