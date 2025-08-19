/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { parseInline } from "../inline-parser/index.js";
import { NODE_TYPES, REGEX_PATTERNS } from "../types.js";

/**
 * @packageDocumentation
 *
 * Parses heading elements
 */
export const parseHeading = (/** @type {string[]} */ lines, /** @type {number} */ start) => {
	if (!lines || start >= lines.length) return null;

	const line = lines[start];
	const match = line.match(REGEX_PATTERNS.HEADING);
	if (!match) return null;

	const level = match[1].length;

	return {
		node: {
			type: NODE_TYPES.HEADING,
			level,
			content: parseInline(match[2]),
		},
		start,
		end: start + 1,
	};
};
