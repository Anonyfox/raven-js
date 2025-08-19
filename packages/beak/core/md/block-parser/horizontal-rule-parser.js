/**
 * @file Horizontal rule parsing functionality for markdown syntax
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES, REGEX_PATTERNS } from "../types.js";

/**
 * Parses horizontal rule elements
 * @param {string[]} lines - Array of lines
 * @param {number} start - Starting line index
 * @returns {{node: import('../types.js').BlockNode, start: number, end: number} | null}
 */
export const parseHorizontalRule = (lines, start) => {
	if (start >= lines.length) return null;

	const line = lines[start];
	const match = line.match(REGEX_PATTERNS.HORIZONTAL_RULE);
	if (!match) return null;

	return {
		node: {
			type: NODE_TYPES.HORIZONTAL_RULE,
		},
		start,
		end: start + 1,
	};
};
