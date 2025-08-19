/**
 * @file Inline code parsing for markdown elements
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES } from "../types.js";

/**
 * Tries to parse inline code (`code`)
 * @param {string} text - The text to parse
 * @param {number} start - Starting position
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number} | null}
 */
export const tryParseInlineCode = (text, start) => {
	if (start >= text.length) return null;
	if (text[start] !== "`") return null;

	const end = text.indexOf("`", start + 1);
	if (end === -1) return null;

	const content = text.slice(start + 1, end);
	// Inline code can be empty
	return {
		node: {
			type: NODE_TYPES.CODE,
			content,
		},
		start,
		end: end + 1,
	};
};
