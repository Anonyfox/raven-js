import { NODE_TYPES } from "../types.js";
import { parseInlineRecursive } from "./recursive-parser.js";

/**
 * Tries to parse bold text (**text**)
 * @param {string} text - The text to parse
 * @param {number} start - Starting position
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number} | null}
 */
export const tryParseBold = (text, start) => {
	if (start + 2 >= text.length) return null;
	if (text.slice(start, start + 2) !== "**") return null;

	const end = text.indexOf("**", start + 2);
	if (end === -1) return null;

	const content = text.slice(start + 2, end);
	if (content.length === 0) return null;

	return {
		node: {
			type: NODE_TYPES.BOLD,
			content: parseInlineRecursive(content), // Recursive parsing for nested elements
		},
		start,
		end: end + 2,
	};
};
