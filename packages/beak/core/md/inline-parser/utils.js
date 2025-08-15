import { NODE_TYPES } from "../types.js";

/**
 * Handles text content between inline elements
 * @param {string} text - The text to process
 * @param {number} current - Current position
 * @param {number} nodeStart - Start position of the node
 * @param {Array<import('../types.js').InlineNode>} ast - The AST to append to
 */
export const handleTextContent = (text, current, nodeStart, ast) => {
	if (nodeStart > current) {
		const textContent = text.slice(current, nodeStart);
		if (textContent.length > 0) {
			ast.push({ type: NODE_TYPES.TEXT, content: textContent });
		}
	}
};

/**
 * Handles the case when no special characters are found
 * @param {string} text - The text to process
 * @param {number} current - Current position
 * @param {Array<import('../types.js').InlineNode>} ast - The AST to append to
 * @returns {number} - New position
 */
export const handleNoSpecialChars = (text, current, ast) => {
	const textContent = text.slice(current, text.length);
	if (textContent.length > 0) {
		ast.push({ type: NODE_TYPES.TEXT, content: textContent });
	}
	return text.length;
};

/**
 * Ensures the parser always advances to prevent infinite loops
 * @param {number} current - Current position
 * @param {number} startPosition - Starting position
 * @returns {number} - New position (guaranteed to be > startPosition)
 */
export const ensureInlineParserAdvances = (current, startPosition) => {
	if (current <= startPosition) {
		return startPosition + 1;
	}
	return current;
};

/**
 * Finds the next special character that could start an inline element
 * @param {string} text - The text to search
 * @param {number} start - Starting position
 * @returns {number} - Position of next special character or -1 if not found
 */
export const findNextSpecialChar = (text, start) => {
	for (let i = start; i < text.length; i++) {
		const char = text[i];
		if (char === "*" || char === "`" || char === "[" || char === "!") {
			return i;
		}
	}
	return -1;
};
