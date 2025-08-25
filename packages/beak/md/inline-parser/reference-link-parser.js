/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES } from "../types.js";
import { parseInlineRecursive } from "./recursive-parser.js";

/**
 * Tries to parse reference-style links: [text][ref] or [ref][]
 * Falls back to regular link parsing if no reference context provided
 *
 * @param {string} text - Text to parse
 * @param {number} start - Starting position
 * @param {Object<string, {url: string, title?: string}>} [references={}] - Reference definitions
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number}|null} - Parsed link or null
 */
export const tryParseReferenceLink = (
	/** @type {string} */ text,
	/** @type {number} */ start,
	/** @type {Object<string, {url: string, title?: string}>} */ references = {},
) => {
	if (start >= text.length) return null;
	if (text[start] !== "[") return null;

	// First, try regular link syntax: [text](url)
	const regularResult = tryParseRegularLink(text, start, references);
	if (regularResult) return regularResult;

	// Try reference link syntax: [text][ref] or [ref][]
	const referenceResult = tryParseReferenceSyntax(text, start, references);
	if (referenceResult) return referenceResult;

	return null;
};

/**
 * Parses regular link syntax: [text](url)
 * This is the same logic as the original link parser
 *
 * @param {string} text - Text to parse
 * @param {number} start - Starting position
 * @param {Object<string, {url: string, title?: string}>} references - Reference definitions (for recursive parsing)
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number}|null} - Parsed link or null
 */
const tryParseRegularLink = (text, start, references) => {
	const endBracket = text.indexOf("]", start);
	if (endBracket === -1) return null;

	const endParen = text.indexOf(")", endBracket);
	if (endParen === -1) return null;

	// Check for proper link syntax: [text](url)
	if (endBracket + 1 >= text.length || text[endBracket + 1] !== "(") {
		return null;
	}

	const linkText = text.slice(start + 1, endBracket);
	const url = text.slice(endBracket + 2, endParen);

	if (linkText.length === 0 || url.length === 0) return null;

	return {
		node: {
			type: NODE_TYPES.LINK,
			content: parseInlineRecursive(linkText, references),
			url,
		},
		start,
		end: endParen + 1,
	};
};

/**
 * Parses reference link syntax: [text][ref] or [ref][]
 *
 * @param {string} text - Text to parse
 * @param {number} start - Starting position
 * @param {Object<string, {url: string, title?: string}>} references - Reference definitions
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number}|null} - Parsed link or null
 */
const tryParseReferenceSyntax = (text, start, references) => {
	const firstCloseBracket = text.indexOf("]", start);
	if (firstCloseBracket === -1) return null;

	const linkText = text.slice(start + 1, firstCloseBracket);
	if (linkText.length === 0) return null;

	// Check for second bracket pair: [text][ref]
	if (
		firstCloseBracket + 1 < text.length &&
		text[firstCloseBracket + 1] === "["
	) {
		const secondCloseBracket = text.indexOf("]", firstCloseBracket + 2);
		if (secondCloseBracket === -1) return null;

		const refId = text.slice(firstCloseBracket + 2, secondCloseBracket);

		// Handle [text][] (empty reference) - use link text as reference ID
		const referenceKey =
			refId.length === 0 ? linkText.toLowerCase() : refId.toLowerCase();

		const reference = references[referenceKey];
		if (!reference) return null;

		return {
			node: {
				type: NODE_TYPES.LINK,
				content: parseInlineRecursive(linkText, references),
				url: reference.url,
				title: reference.title,
			},
			start,
			end: secondCloseBracket + 1,
		};
	}

	// Check for shorthand reference: [ref] (single bracket pair)
	// This only works if the text exactly matches a reference ID
	const referenceKey = linkText.toLowerCase();
	const reference = references[referenceKey];
	if (reference) {
		return {
			node: {
				type: NODE_TYPES.LINK,
				content: parseInlineRecursive(linkText, references),
				url: reference.url,
				title: reference.title,
			},
			start,
			end: firstCloseBracket + 1,
		};
	}

	return null;
};
