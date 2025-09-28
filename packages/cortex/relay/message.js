/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Message entity for LLM chat interactions.
 *
 * Provides a lean runtime class with validation and simple
 * serialization helpers. Used by the Chat abstraction.
 */

/**
 * @typedef {"system"|"user"|"assistant"} MessageRole
 */

export class Message {
  /** @type {MessageRole} */
  role;
  /** @type {string} */
  content;

  /**
   * Create a new message.
   * @param {MessageRole} role
   * @param {string} content
   */
  constructor(role, content) {
    if (role !== "system" && role !== "user" && role !== "assistant") {
      throw new TypeError("Invalid role: must be 'system' | 'user' | 'assistant'");
    }
    if (typeof content !== "string" || content.length === 0) {
      throw new TypeError("Invalid content: must be a non-empty string");
    }
    this.role = role;
    this.content = content;
  }

  /**
   * Serialize to plain JSON object.
   * @returns {{ role: MessageRole, content: string }}
   */
  toJSON() {
    return { role: this.role, content: this.content };
  }

  /**
   * Construct a Message from plain object.
   * @param {unknown} json
   * @returns {Message}
   */
  static fromJSON(json) {
    if (!json || typeof json !== "object" || !("role" in json) || !("content" in json)) {
      throw new TypeError("Invalid message JSON");
    }
    const obj = /** @type {{ role: MessageRole, content: string }} */ (json);
    return new Message(obj.role, obj.content);
  }
}
