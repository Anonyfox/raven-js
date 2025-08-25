/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES } from "../types.js";
import { parseInlineRecursive } from "./recursive-parser.js";

/**
 * Tries to parse bold text (**text**)
 *
 * @param {string} text - Text to parse
 * @param {number} start - Starting position
 * @param {Object<string, {url: string, title?: string}>} [references={}] - Reference definitions
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number}|null} - Parsed node or null
 */
export const tryParseBold = (
	/** @type {string} */ text,
	/** @type {number} */ start,
	/** @type {Object<string, {url: string, title?: string}>} */ references = {},
) => {
	if (start + 2 >= text.length) return null;
	if (text.slice(start, start + 2) !== "**") return null;

	const end = text.indexOf("**", start + 2);
	if (end === -1) return null;

	const content = text.slice(start + 2, end);
	if (content.length === 0) return null;

	return {
		node: {
			type: NODE_TYPES.BOLD,
			content: parseInlineRecursive(content, references), // Recursive parsing for nested elements
		},
		start,
		end: end + 2,
	};
};
