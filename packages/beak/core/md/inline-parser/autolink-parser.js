/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES } from "../types.js";

/**
 *
 * Tries to parse autolinks (automatic URL detection)
 */
export const tryParseAutolink = (
	/** @type {string} */ text,
	/** @type {number} */ start,
) => {
	// Only check if we're at the start of "http"
	if (!text.slice(start).startsWith("http")) return null;

	// Create a fresh regex without global flag to avoid state issues
	const autolinkRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/;

	// Look for URLs starting at current position
	const remainingText = text.slice(start);
	const match = remainingText.match(autolinkRegex);

	if (!match || match.index !== 0) return null;

	const url = match[0]; // Use match[0] to get the full match

	return {
		node: {
			type: NODE_TYPES.LINK,
			url: url,
			content: [{ type: NODE_TYPES.TEXT, content: url }],
		},
		start,
		end: start + url.length,
	};
};
