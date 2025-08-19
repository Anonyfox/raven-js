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

// Raven-fast first-character dispatch table for O(1) inline parser selection
/** @type {Map<string, any>|null} */
let INLINE_PARSER_DISPATCH = null;

/**
 * Initialize dispatch table lazily to avoid module loading order issues
 * @returns {Map<string, any>}
 */
const getDispatchTable = () => {
	if (!INLINE_PARSER_DISPATCH) {
		INLINE_PARSER_DISPATCH = new Map();
		INLINE_PARSER_DISPATCH.set("*", tryParseBold); // Also handles italic - parser disambiguates
		INLINE_PARSER_DISPATCH.set("~", tryParseStrikethrough);
		INLINE_PARSER_DISPATCH.set("`", tryParseInlineCode);
		INLINE_PARSER_DISPATCH.set("[", tryParseReferenceLink);
		INLINE_PARSER_DISPATCH.set("!", tryParseReferenceImage);
		INLINE_PARSER_DISPATCH.set("<", tryParseInlineHTML);
		INLINE_PARSER_DISPATCH.set("h", tryParseAutolink); // For http/https autolinks
	}
	return INLINE_PARSER_DISPATCH;
};

/**
 * Parses inline markdown elements using raven-fast first-character dispatch
 * **Performance:** O(1) parser selection instead of O(p) sequential attempts
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

	// Raven-fast dispatch table - cache once to eliminate function call overhead
	const dispatch = getDispatchTable();

	// Deterministic parsing with bounded iteration
	while (current < text.length && iterations < maxIterations) {
		iterations++;
		const startPosition = current;
		const char = text[current];

		// O(1) first-character dispatch
		let node = null;
		if (dispatch.has(char)) {
			const parser = dispatch.get(char);

			// Special handling for '*' which can be bold or italic
			if (char === "*") {
				node =
					tryParseBold(text, current, references) ||
					tryParseItalic(text, current, references);
			} else {
				node = parser(text, current, references);
			}
		}

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
