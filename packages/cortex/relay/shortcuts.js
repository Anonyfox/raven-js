/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file One-shot convenience helpers for the Relay module.
 */

import { Chat } from "./chat.js";

/**
 * Generate text from an LLM in a single call.
 *
 * @param {string} userPrompt
 * @param {{ system?: string, model?: string, provider?: "openai"|"anthropic"|"xai", timeoutMs?: number, retries?: number }} [opts]
 * @returns {Promise<string>}
 */
export async function genText(userPrompt, opts) {
  const chat = new Chat(opts?.model);
  if (opts?.system) chat.addSystemMessage(opts.system);
  return chat.generateText(userPrompt, {
    provider: opts?.provider,
    timeoutMs: opts?.timeoutMs,
    retries: opts?.retries,
  });
}

/**
 * Generate structured data from an LLM in a single call (validated via Schema).
 *
 * @param {string} userPrompt
 * @param {import('../structures/schema.js').Schema} schema
 * @param {{ system?: string, model?: string, provider?: "openai"|"anthropic"|"xai", timeoutMs?: number, retries?: number }} [opts]
 * @returns {Promise<import('../structures/schema.js').Schema>}
 */
export async function genData(userPrompt, schema, opts) {
  const chat = new Chat(opts?.model);
  if (opts?.system) chat.addSystemMessage(opts.system);
  return chat.generateData(userPrompt, schema, {
    provider: opts?.provider,
    timeoutMs: opts?.timeoutMs,
    retries: opts?.retries,
  });
}
