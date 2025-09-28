/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file HTTP transport utilities for provider-agnostic requests.
 */

/**
 * POST JSON helper with timeout and retries.
 *
 * @param {string} url
 * @param {Record<string, string>} headers
 * @param {unknown} body
 * @param {{ timeoutMs?: number, retries?: number }} [opts]
 * @returns {Promise<any>}
 */
export async function postJson(url, headers, body, opts = {}) {
  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 120_000;
  const retries = typeof opts.retries === "number" ? opts.retries : 3;

  /** @type {any} */
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const text = await res.text();
        if (!res.ok) {
          throw new Error(text || `HTTP ${res.status}`);
        }
        return text.length ? JSON.parse(text) : {};
      } finally {
        clearTimeout(t);
      }
    } catch (error) {
      lastError = error;
      if (attempt === retries - 1) break;
    }
  }
  throw lastError;
}

/**
 * Strip markdown code fences from JSON-like responses.
 * @param {string} text
 * @returns {string}
 */
export function stripCodeFences(text) {
  if (text.startsWith("```")) {
    // common variants: ```json\n...\n``` or ```\n...\n```
    const lines = text.split(/\r?\n/);
    if (lines[0].startsWith("```") && lines[lines.length - 1] === "```") {
      return lines.slice(1, -1).join("\n");
    }
  }
  return text;
}
