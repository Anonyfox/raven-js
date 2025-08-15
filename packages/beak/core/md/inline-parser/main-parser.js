import { parseInlineRecursive } from "./recursive-parser.js";

/**
 * Parses inline markdown elements from text
 * @param {string | number | boolean | null | undefined | any} text - The text to parse for inline elements
 * @returns {Array<import('../types.js').InlineNode>} - Array of parsed inline nodes
 */
export const parseInline = (text) => {
	return parseInlineRecursive(text);
};
