import { parseInline } from "../inline-parser/index.js";
import { NODE_TYPES, REGEX_PATTERNS } from "../types.js";

/**
 * Parses heading elements
 * @param {string[]} lines - Array of lines
 * @param {number} start - Starting line index
 * @returns {{node: import('../types.js').BlockNode, start: number, end: number} | null}
 */
export const parseHeading = (lines, start) => {
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
