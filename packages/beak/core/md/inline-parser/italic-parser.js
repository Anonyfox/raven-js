/**
 * @file Italic text parsing for markdown inline elements
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES } from "../types.js";
import { parseInlineRecursive } from "./recursive-parser.js";

/**
 * Tries to parse italic text (*text*)
 * @param {string} text - The text to parse
 * @param {number} start - Starting position
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number} | null}
 */
export const tryParseItalic = (text, start) => {
	if (start >= text.length) return null;
	if (text[start] !== "*") return null;

	const end = text.indexOf("*", start + 1);
	if (end === -1) return null;

	const content = text.slice(start + 1, end);
	if (content.length === 0) return null;

	// Check if this might be bold (don't parse single * as italic if ** follows)
	if (end + 1 < text.length && text[end + 1] === "*") {
		return null;
	}

	return {
		node: {
			type: NODE_TYPES.ITALIC,
			content: parseInlineRecursive(content), // Recursive parsing for nested elements
		},
		start,
		end: end + 1,
	};
};
