/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES } from "../types.js";

/**
 * @packageDocumentation
 *
 * Tries to parse an image ![alt](url)
 */
export const tryParseImage = (/** @type {string} */ text, /** @type {number} */ start) => {
	if (start + 1 >= text.length) return null;
	if (text.slice(start, start + 2) !== "![") return null;

	const endBracket = text.indexOf("]", start + 2);
	if (endBracket === -1) return null;

	const endParen = text.indexOf(")", endBracket);
	if (endParen === -1) return null;

	// Check for proper image syntax: ![alt](url)
	if (endBracket + 1 >= text.length || text[endBracket + 1] !== "(") {
		return null;
	}

	const alt = text.slice(start + 2, endBracket);
	const url = text.slice(endBracket + 2, endParen);

	if (url.length === 0) return null;

	return {
		node: {
			type: NODE_TYPES.IMAGE,
			alt,
			url,
		},
		start,
		end: endParen + 1,
	};
};
