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
 * Parses list elements
 */
export const parseList = (/** @type {string[]} */ lines, /** @type {number} */ start) => {
	if (start >= lines.length) return null;

	const line = lines[start];
	const unordered = line.match(REGEX_PATTERNS.UNORDERED_LIST);
	const ordered = line.match(REGEX_PATTERNS.ORDERED_LIST);

	if (!unordered && !ordered) return null;

	const isOrdered = !!ordered;
	const items = [];
	let end = start;

	while (end < lines.length) {
		const currentLine = lines[end];
		const currentMatch = isOrdered
			? currentLine.match(REGEX_PATTERNS.ORDERED_LIST)
			: currentLine.match(REGEX_PATTERNS.UNORDERED_LIST);

		if (currentMatch) {
			items.push({
				type: NODE_TYPES.LIST_ITEM,
				content: parseInline(isOrdered ? currentMatch[2] : currentMatch[1]),
			});
		} else if (REGEX_PATTERNS.WHITESPACE.test(currentLine)) {
			end++;
			continue;
		} else {
			break;
		}
		end++;
	}

	return {
		node: {
			type: NODE_TYPES.LIST,
			ordered: isOrdered,
			items,
		},
		start,
		end,
	};
};
