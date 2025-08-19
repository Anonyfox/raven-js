/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { parseInlineRecursive } from "./recursive-parser.js";

/**
 * Parses inline markdown elements from text
 *
 * @param {string} text - Text to parse
 * @param {Object<string, {url: string, title?: string}>} [references={}] - Reference definitions
 * @returns {Array<import('../types.js').InlineNode>} - Array of parsed inline nodes
 */
export const parseInline = (
	/** @type {string} */ text,
	/** @type {Object<string, {url: string, title?: string}>} */ references = {},
) => {
	return parseInlineRecursive(text, references);
};
