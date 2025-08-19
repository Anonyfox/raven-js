/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES, REGEX_PATTERNS } from "../types.js";

/**
 * Tries to parse inline HTML at the given position
 * Supports both self-closing tags (<br/>) and paired tags (<strong>text</strong>)
 *
 * @param {string} text - Text to parse
 * @param {number} start - Starting position
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number}|null} - Parsed inline HTML or null
 */
export const tryParseInlineHTML = (
	/** @type {string} */ text,
	/** @type {number} */ start,
) => {
	if (start >= text.length || text[start] !== "<") return null;

	// Try self-closing tag first
	const selfClosingResult = tryParseSelfClosingTag(text, start);
	if (selfClosingResult) return selfClosingResult;

	// Try paired tag
	const pairedResult = tryParsePairedTag(text, start);
	if (pairedResult) return pairedResult;

	return null;
};

/**
 * Tries to parse a self-closing HTML tag like <br/>, <img src="..."/>
 *
 * @param {string} text - Text to parse
 * @param {number} start - Starting position
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number}|null} - Parsed tag or null
 */
const tryParseSelfClosingTag = (text, start) => {
	const remainingText = text.slice(start);
	const match = remainingText.match(REGEX_PATTERNS.INLINE_HTML_SELF_CLOSING);

	if (!match || match.index !== 0) return null;

	const fullTag = match[0];

	return {
		node: {
			type: NODE_TYPES.INLINE_HTML,
			html: fullTag,
		},
		start,
		end: start + fullTag.length,
	};
};

/**
 * Tries to parse a paired HTML tag like <strong>text</strong>, <em>text</em>
 *
 * @param {string} text - Text to parse
 * @param {number} start - Starting position
 * @returns {{node: import('../types.js').InlineNode, start: number, end: number}|null} - Parsed tag or null
 */
const tryParsePairedTag = (text, start) => {
	const remainingText = text.slice(start);
	const openMatch = remainingText.match(REGEX_PATTERNS.INLINE_HTML_OPEN);

	if (!openMatch || openMatch.index !== 0) return null;

	const tagName = openMatch[1].toLowerCase();
	const openTag = openMatch[0];

	// Look for closing tag
	const closePattern = new RegExp(`<\\/${tagName}\\s*>`, "i");
	const closeMatch = remainingText.slice(openTag.length).match(closePattern);

	if (!closeMatch || closeMatch.index === undefined) {
		// No closing tag found or invalid match, treat as invalid
		return null;
	}

	const contentStart = start + openTag.length;
	const contentEnd = contentStart + closeMatch.index;
	const closeTag = closeMatch[0];
	const tagEnd = contentEnd + closeTag.length;

	// Extract content between tags
	const content = text.slice(contentStart, contentEnd);

	// Build the full HTML
	const fullHTML = openTag + content + closeTag;

	return {
		node: {
			type: NODE_TYPES.INLINE_HTML,
			html: fullHTML,
		},
		start,
		end: tagEnd,
	};
};

/**
 * Common inline HTML elements that should be treated as inline
 * Based on HTML5 specification
 */
const INLINE_ELEMENTS = new Set([
	"a",
	"abbr",
	"acronym",
	"b",
	"bdi",
	"bdo",
	"big",
	"br",
	"button",
	"cite",
	"code",
	"del",
	"dfn",
	"em",
	"i",
	"img",
	"input",
	"ins",
	"kbd",
	"label",
	"map",
	"mark",
	"meter",
	"noscript",
	"object",
	"output",
	"progress",
	"q",
	"ruby",
	"rt",
	"rp",
	"s",
	"samp",
	"script",
	"select",
	"small",
	"span",
	"strong",
	"sub",
	"sup",
	"textarea",
	"time",
	"tt",
	"u",
	"var",
	"wbr",
]);

/**
 * Checks if a tag name represents an inline element
 *
 * @param {string} tagName - HTML tag name (lowercase)
 * @returns {boolean} - True if inline element
 */
export const isInlineElement = (tagName) => {
	return INLINE_ELEMENTS.has(tagName.toLowerCase());
};
