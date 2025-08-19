/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES } from "../types.js";
import { tryParseAutolink } from "./autolink-parser.js";
import { tryParseBold } from "./bold-parser.js";
import { tryParseInlineCode } from "./code-parser.js";
import { tryParseInlineHTML } from "./inline-html-parser.js";
import { tryParseItalic } from "./italic-parser.js";
import { tryParseReferenceImage } from "./reference-image-parser.js";
import { tryParseReferenceLink } from "./reference-link-parser.js";
import { tryParseStrikethrough } from "./strikethrough-parser.js";
import {
	ensureInlineParserAdvances,
	findNextSpecialChar,
	handleTextContent,
} from "./utils.js";

/**
 * Parses inline markdown elements from text (recursive version)
 *
 * @param {string} text - Text to parse
 * @param {Object<string, {url: string, title?: string}>} [references={}] - Reference definitions
 * @returns {Array<import('../types.js').InlineNode>} - Array of parsed inline nodes
 */
export const parseInlineRecursive = (
	/** @type {string} */ text,
	/** @type {Object<string, {url: string, title?: string}>} */ references = {},
) => {
	// Input validation
	if (typeof text !== "string") {
		return [{ type: NODE_TYPES.TEXT, content: String(text) }];
	}

	if (text.length === 0) {
		return [];
	}

	/** @type {Array<import('../types.js').InlineNode>} */
	const ast = [];
	let current = 0;
	const maxIterations = text.length; // Prevent infinite loops
	let iterations = 0;

	// Deterministic parsing with bounded iteration
	while (current < text.length && iterations < maxIterations) {
		iterations++;
		const startPosition = current;

		// Try to match each inline element type in order of precedence
		const node =
			tryParseBold(text, current, references) ||
			tryParseItalic(text, current, references) ||
			tryParseStrikethrough(text, current, references) ||
			tryParseInlineCode(text, current) ||
			tryParseReferenceLink(text, current, references) ||
			tryParseReferenceImage(text, current, references) ||
			tryParseAutolink(text, current) ||
			tryParseInlineHTML(text, current);

		if (node) {
			// Add any text before the matched element
			handleTextContent(text, current, node.start, ast);

			// Add the parsed node
			ast.push(node.node);
			current = node.end;
		} else {
			// No inline element found, collect text until next potential match
			const nextSpecial = findNextSpecialChar(text, current);
			const end = nextSpecial === -1 ? text.length : nextSpecial;
			const textContent = text.slice(current, end);

			if (textContent.length > 0) {
				ast.push({ type: NODE_TYPES.TEXT, content: textContent });
			}
			current = end;
		}

		// Safety check: ensure we always advance
		current = ensureInlineParserAdvances(current, startPosition);
	}

	return ast;
};
