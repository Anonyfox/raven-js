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
 *
 * Parses paragraph elements
 */
export const parseParagraph = (
	/** @type {string[]} */ lines,
	/** @type {number} */ start,
	/** @type {Object<string, {url: string, title?: string}>} */ references = {},
) => {
	if (!lines || start >= lines.length) return null;

	const line = lines[start];

	// Check if line matches other block patterns
	if (REGEX_PATTERNS.WHITESPACE.test(line)) return null;
	if (REGEX_PATTERNS.HEADING.test(line)) return null;
	if (REGEX_PATTERNS.HORIZONTAL_RULE.test(line)) return null;
	if (REGEX_PATTERNS.CODE_BLOCK_START.test(line)) return null;
	if (REGEX_PATTERNS.BLOCKQUOTE.test(line)) return null;
	if (REGEX_PATTERNS.UNORDERED_LIST.test(line)) return null;
	if (REGEX_PATTERNS.ORDERED_LIST.test(line)) return null;

	const contentLines = [line];
	let end = start + 1;

	while (end < lines.length) {
		const nextLine = lines[end];
		if (
			REGEX_PATTERNS.WHITESPACE.test(nextLine) ||
			REGEX_PATTERNS.HEADING.test(nextLine) ||
			REGEX_PATTERNS.HORIZONTAL_RULE.test(nextLine) ||
			REGEX_PATTERNS.CODE_BLOCK_START.test(nextLine) ||
			REGEX_PATTERNS.BLOCKQUOTE.test(nextLine) ||
			REGEX_PATTERNS.UNORDERED_LIST.test(nextLine) ||
			REGEX_PATTERNS.ORDERED_LIST.test(nextLine)
		) {
			break;
		}
		contentLines.push(nextLine);
		end++;
	}

	return {
		node: {
			type: NODE_TYPES.PARAGRAPH,
			content: parseInline(contentLines.join("\n"), references),
		},
		start,
		end,
	};
};
