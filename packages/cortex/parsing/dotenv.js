/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Zero-dependency .env parser for loading environment variables.
 *
 * Provides pure string parsing and a convenience loader that applies values
 * to process.env. Covers 95% of real-world use cases with surgical precision—
 * no variable expansion, no multiline values, no escape sequences.
 */

import { readFileSync } from "node:fs";

/**
 * Parse .env file content into a key-value object.
 *
 * Handles:
 * - `KEY=value` → `{ KEY: 'value' }`
 * - `KEY="value"` and `KEY='value'` → strips quotes
 * - `KEY=` → `{ KEY: '' }`
 * - `KEY = value` → trims whitespace
 * - `# comment` → skipped
 * - Empty lines → skipped
 * - Lines without `=` → skipped
 * - Duplicate keys → last wins
 * - Values with embedded `=` preserved: `KEY=a=b=c` → `{ KEY: 'a=b=c' }`
 *
 * @param {string} content The raw .env file content
 * @returns {Record<string, string>} Parsed key-value pairs
 */
export function parseEnv(content) {
  if (typeof content !== "string") {
    throw new TypeError("Expected content to be a string");
  }

  /** @type {Record<string, string>} */
  const result = {};

  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (line.length === 0 || line[0] === "#") {
      continue;
    }

    // Find first equals sign
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) {
      // No equals → skip
      continue;
    }

    const rawKey = line.slice(0, eqIdx).trim();
    if (rawKey.length === 0) {
      // Empty key → skip
      continue;
    }

    let rawValue = line.slice(eqIdx + 1);

    // Strip quotes if they wrap the entire value
    const firstChar = rawValue[0];
    const lastChar = rawValue[rawValue.length - 1];
    if (rawValue.length >= 2 && ((firstChar === '"' && lastChar === '"') || (firstChar === "'" && lastChar === "'"))) {
      rawValue = rawValue.slice(1, -1);
    } else {
      // Trim whitespace only for unquoted values
      rawValue = rawValue.trim();
    }

    result[rawKey] = rawValue;
  }

  return result;
}

/**
 * Load .env file and apply its variables to process.env.
 *
 * Reads the file synchronously, parses it, then mutates process.env with
 * all discovered key-value pairs. Existing keys are overwritten.
 *
 * @param {string} [filepath=".env"] Path to the .env file
 * @returns {Record<string, string>} The parsed object (for inspection/chaining)
 * @throws {Error} If the file cannot be read
 */
export function loadEnv(filepath = ".env") {
  if (typeof filepath !== "string") {
    throw new TypeError("Expected filepath to be a string");
  }

  const content = readFileSync(filepath, "utf-8");
  const parsed = parseEnv(content);

  // Apply to process.env
  for (const key in parsed) {
    process.env[key] = parsed[key];
  }

  return parsed;
}
