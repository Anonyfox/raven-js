/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES, REGEX_PATTERNS } from "../types.js";

/**
 * @packageDocumentation
 *
 * Parses horizontal rule elements
 */
export const parseHorizontalRule = (/** @type {string[]} */ lines, /** @type {number} */ start) => {
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
