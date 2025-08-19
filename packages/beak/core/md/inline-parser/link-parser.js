/**
 * @file Link parsing for markdown inline elements
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES } from "../types.js";
import { parseInlineRecursive } from "./recursive-parser.js";

/**
 * Tries to parse a link [text](url)
 * @param {string} text - The text to parse
 * @param {number} start - Starting position
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number} | null}
 */
export const tryParseLink = (text, start) => {
	if (start >= text.length) return null;
	if (text[start] !== "[") return null;

	const endBracket = text.indexOf("]", start);
	if (endBracket === -1) return null;

	const endParen = text.indexOf(")", endBracket);
	if (endParen === -1) return null;

	// Check for proper link syntax: [text](url)
	if (endBracket + 1 >= text.length || text[endBracket + 1] !== "(") {
		return null;
	}

	const linkText = text.slice(start + 1, endBracket);
	const url = text.slice(endBracket + 2, endParen);

	if (linkText.length === 0 || url.length === 0) return null;

	return {
		node: {
			type: NODE_TYPES.LINK,
			content: parseInlineRecursive(linkText), // Parse link text for nested elements
			url,
		},
		start,
		end: endParen + 1,
	};
};
