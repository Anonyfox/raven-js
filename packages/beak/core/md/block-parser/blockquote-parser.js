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
 * Parses blockquote elements
 */
export const parseBlockquote = (/** @type {string[]} */ lines, /** @type {number} */ start) => {
	if (start >= lines.length) return null;

	const line = lines[start];
	const match = line.match(REGEX_PATTERNS.BLOCKQUOTE);
	if (!match) return null;

	const contentLines = [match[1]];
	let end = start + 1;

	while (end < lines.length) {
		const nextMatch = lines[end].match(REGEX_PATTERNS.BLOCKQUOTE);
		if (!nextMatch) break;
		contentLines.push(nextMatch[1]);
		end++;
	}

	return {
		node: {
			type: NODE_TYPES.BLOCKQUOTE,
			content: parseInline(contentLines.join("\n")),
		},
		start,
		end,
	};
};
