import { parseInline } from "../inline-parser/index.js";
import { NODE_TYPES, REGEX_PATTERNS } from "../types.js";

/**
 * Parses list elements
 * @param {string[]} lines - Array of lines
 * @param {number} start - Starting line index
 * @returns {{node: import('../types.js').BlockNode, start: number, end: number} | null}
 */
export const parseList = (lines, start) => {
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
