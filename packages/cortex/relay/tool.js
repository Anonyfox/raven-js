/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tool base class for agentic tool-calling.
 */

/**
 * @typedef {import('../structures/schema.js').Schema} Schema
 */

export class Tool {
  /** @type {string} */
  name = "";
  /** @type {string} */
  description = "";
  /** @type {Schema} */
  parameters;
  /** @type {Schema|undefined} */
  resultSchema;
  /** @type {{ timeoutMs: number, retries: number, errorStrategy: "respond"|"throw" }} */
  options = { timeoutMs: 10_000, retries: 0, errorStrategy: "respond" };

  /**
   * Execute the tool.
   * @param {{ args: any, ctx?: any }} _input
   * @returns {Promise<any>}
   */
  async execute(_input) {
    throw new Error("Tool.execute must be implemented by subclasses");
  }
}

/**
 * @param {Schema} schema
 * @returns {any}
 */
export function schemaToJsonObject(schema) {
  return JSON.parse(schema.toJSON());
}
