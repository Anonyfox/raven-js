import { NODE_TYPES, REGEX_PATTERNS } from "../types.js";

/**
 * Parses code block elements
 * @param {string[]} lines - Array of lines
 * @param {number} start - Starting line index
 * @returns {{node: import('../types.js').BlockNode, start: number, end: number} | null}
 */
export const parseCodeBlock = (lines, start) => {
	if (start >= lines.length) return null;

	const line = lines[start];
	const match = line.match(REGEX_PATTERNS.CODE_BLOCK_START);
	if (!match) return null;

	const language = match[1] || "";
	const contentLines = [];
	let end = start + 1;

	while (end < lines.length) {
		if (REGEX_PATTERNS.CODE_BLOCK_END.test(lines[end])) {
			end++;
			break;
		}
		contentLines.push(lines[end]);
		end++;
	}

	// Must have content if no closing delimiter
	if (contentLines.length === 0 && end >= lines.length) return null;

	return {
		node: {
			type: NODE_TYPES.CODE_BLOCK,
			language,
			content: contentLines.join("\n"),
		},
		start,
		end,
	};
};
