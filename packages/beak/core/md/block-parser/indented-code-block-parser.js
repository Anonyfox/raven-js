/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES } from "../types.js";

/**
 * Parses indented code block elements (4+ spaces or 1+ tabs)
 *
 * @param {string[]} lines - Array of markdown lines
 * @param {number} start - Starting line index
 * @returns {{node: import('../types.js').BlockNode, start: number, end: number}|null} - Parsed node result or null if no match
 */
export const parseIndentedCodeBlock = (
	/** @type {string[]} */ lines,
	/** @type {number} */ start,
) => {
	if (start >= lines.length) return null;

	const firstLine = lines[start];

	// Must start with 4+ spaces or 1+ tabs
	if (!isIndentedCodeLine(firstLine)) return null;

	const contentLines = [];
	let end = start;

	// Collect all consecutive indented or empty lines
	while (end < lines.length) {
		const currentLine = lines[end];

		// Include indented lines and empty lines
		if (isIndentedCodeLine(currentLine) || isEmptyLine(currentLine)) {
			// Remove exactly 4 spaces or 1 tab from indented lines
			const processedLine = isIndentedCodeLine(currentLine)
				? removeIndentation(currentLine)
				: currentLine; // Keep empty lines as-is
			contentLines.push(processedLine);
			end++;
		} else {
			// Non-indented, non-empty line - end of code block
			break;
		}
	}

	// Remove trailing empty lines for cleaner output
	while (
		contentLines.length > 0 &&
		isEmptyLine(contentLines[contentLines.length - 1])
	) {
		contentLines.pop();
	}

	// Must have actual content after removing trailing empty lines
	if (contentLines.length === 0) return null;

	return {
		node: {
			type: NODE_TYPES.CODE_BLOCK,
			language: "", // Indented code blocks don't specify language
			content: contentLines.join("\n"),
		},
		start,
		end,
	};
};

/**
 * Checks if a line qualifies as an indented code line (4+ spaces or 1+ tabs)
 *
 * @param {string} line - Line to check
 * @returns {boolean} - True if line is indented code
 */
const isIndentedCodeLine = (line) => {
	// Match 4+ spaces or 1+ tabs at start of line
	return /^( {4}|\t)/.test(line);
};

/**
 * Checks if a line is empty or contains only whitespace
 *
 * @param {string} line - Line to check
 * @returns {boolean} - True if line is empty
 */
const isEmptyLine = (line) => {
	return /^\s*$/.test(line);
};

/**
 * Removes exactly one level of indentation (4 spaces or 1 tab)
 *
 * @param {string} line - Indented line
 * @returns {string} - Line with indentation removed
 */
const removeIndentation = (line) => {
	if (line.startsWith("\t")) {
		return line.slice(1); // Remove 1 tab
	}
	// If not a tab, it must be 4+ spaces (guaranteed by isIndentedCodeLine)
	return line.slice(4); // Remove 4 spaces
};
