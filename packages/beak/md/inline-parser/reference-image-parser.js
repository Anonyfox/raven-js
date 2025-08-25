/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES } from "../types.js";

/**
 * Tries to parse reference-style images: ![alt][ref] or ![ref][]
 * Falls back to regular image parsing if no reference context provided
 *
 * @param {string} text - Text to parse
 * @param {number} start - Starting position
 * @param {Object<string, {url: string, title?: string}>} [references={}] - Reference definitions
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number}|null} - Parsed image or null
 */
export const tryParseReferenceImage = (
	/** @type {string} */ text,
	/** @type {number} */ start,
	/** @type {Object<string, {url: string, title?: string}>} */ references = {},
) => {
	if (start + 1 >= text.length) return null;
	if (text.slice(start, start + 2) !== "![") return null;

	// First, try regular image syntax: ![alt](url)
	const regularResult = tryParseRegularImage(text, start);
	if (regularResult) return regularResult;

	// Try reference image syntax: ![alt][ref] or ![ref][]
	const referenceResult = tryParseReferenceSyntax(text, start, references);
	if (referenceResult) return referenceResult;

	return null;
};

/**
 * Parses regular image syntax: ![alt](url)
 * This is the same logic as the original image parser
 *
 * @param {string} text - Text to parse
 * @param {number} start - Starting position
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number}|null} - Parsed image or null
 */
const tryParseRegularImage = (text, start) => {
	const endBracket = text.indexOf("]", start + 2);
	if (endBracket === -1) return null;

	const endParen = text.indexOf(")", endBracket);
	if (endParen === -1) return null;

	// Check for proper image syntax: ![alt](url)
	if (endBracket + 1 >= text.length || text[endBracket + 1] !== "(") {
		return null;
	}

	const alt = text.slice(start + 2, endBracket);
	const url = text.slice(endBracket + 2, endParen);

	if (url.length === 0) return null;

	return {
		node: {
			type: NODE_TYPES.IMAGE,
			alt,
			url,
		},
		start,
		end: endParen + 1,
	};
};

/**
 * Parses reference image syntax: ![alt][ref] or ![ref][]
 *
 * @param {string} text - Text to parse
 * @param {number} start - Starting position
 * @param {Object<string, {url: string, title?: string}>} references - Reference definitions
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number}|null} - Parsed image or null
 */
const tryParseReferenceSyntax = (text, start, references) => {
	const firstCloseBracket = text.indexOf("]", start + 2);
	if (firstCloseBracket === -1) return null;

	const alt = text.slice(start + 2, firstCloseBracket);
	if (alt.length === 0) return null;

	// Check for second bracket pair: ![alt][ref]
	if (
		firstCloseBracket + 1 < text.length &&
		text[firstCloseBracket + 1] === "["
	) {
		const secondCloseBracket = text.indexOf("]", firstCloseBracket + 2);
		if (secondCloseBracket === -1) return null;

		const refId = text.slice(firstCloseBracket + 2, secondCloseBracket);

		// Handle ![alt][] (empty reference) - use alt text as reference ID
		const referenceKey =
			refId.length === 0 ? alt.toLowerCase() : refId.toLowerCase();

		const reference = references[referenceKey];
		if (!reference) return null;

		return {
			node: {
				type: NODE_TYPES.IMAGE,
				alt,
				url: reference.url,
				title: reference.title,
			},
			start,
			end: secondCloseBracket + 1,
		};
	}

	// Check for shorthand reference: ![ref] (single bracket pair)
	// This only works if the alt text exactly matches a reference ID
	const referenceKey = alt.toLowerCase();
	const reference = references[referenceKey];
	if (reference) {
		return {
			node: {
				type: NODE_TYPES.IMAGE,
				alt,
				url: reference.url,
				title: reference.title,
			},
			start,
			end: firstCloseBracket + 1,
		};
	}

	return null;
};
