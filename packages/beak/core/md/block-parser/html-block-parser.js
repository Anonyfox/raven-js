/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES, REGEX_PATTERNS } from "../types.js";

/**
 * Parses HTML block elements (raw HTML embedding)
 * Supports opening tags, self-closing tags, comments, and multi-line HTML
 *
 * @param {string[]} lines - Array of markdown lines
 * @param {number} start - Starting line index
 * @returns {{node: import('../types.js').BlockNode, start: number, end: number}|null} - Parsed HTML block or null
 */
export const parseHTMLBlock = (
	/** @type {string[]} */ lines,
	/** @type {number} */ start,
) => {
	if (start >= lines.length) return null;

	const firstLine = lines[start];

	// Check if line starts with HTML
	if (!isHTMLBlockStart(firstLine)) return null;

	const htmlContent = [];
	let end = start;
	let expectingClose = null; // Track what closing tag we're looking for

	// Determine the type of HTML block and what we're expecting
	if (REGEX_PATTERNS.HTML_COMMENT.test(firstLine)) {
		// HTML comment - look for closing -->
		expectingClose = "comment";
	} else if (REGEX_PATTERNS.HTML_BLOCK_SELF_CLOSING.test(firstLine)) {
		// Self-closing tag - single line only
		expectingClose = null;
	} else {
		// Regular opening tag - look for matching closing tag
		const openMatch = firstLine.match(REGEX_PATTERNS.HTML_BLOCK_OPEN);
		if (openMatch) {
			expectingClose = openMatch[1].toLowerCase(); // Tag name to close
		}
	}

	// Collect HTML content
	while (end < lines.length) {
		const currentLine = lines[end];
		htmlContent.push(currentLine);

		// Check if this line completes the HTML block
		if (expectingClose === "comment") {
			// Look for comment end
			if (REGEX_PATTERNS.HTML_COMMENT_END.test(currentLine)) {
				end++;
				break;
			}
		} else if (expectingClose) {
			// Look for matching closing tag
			const closePattern = new RegExp(`<\\/${expectingClose}\\s*>`, "i");
			if (closePattern.test(currentLine)) {
				end++;
				break;
			}
		} else {
			// Self-closing or single-line HTML
			end++;
			break;
		}

		end++;

		// Safety check: don't consume too many lines without finding a close
		if (end - start > 50) {
			// If we've gone too far, treat as single line
			htmlContent.length = 1;
			end = start + 1;
			break;
		}
	}

	// Must have some content
	if (htmlContent.length === 0) return null;

	return {
		node: {
			type: NODE_TYPES.HTML_BLOCK,
			html: htmlContent.join("\n"),
		},
		start,
		end,
	};
};

/**
 * Checks if a line starts an HTML block
 *
 * @param {string} line - Line to check
 * @returns {boolean} - True if line starts HTML block
 */
const isHTMLBlockStart = (line) => {
	const trimmed = line.trim();

	// Must start with < and not be empty
	if (!trimmed.startsWith("<") || trimmed.length < 2) return false;

	// Check for various HTML block patterns
	return (
		REGEX_PATTERNS.HTML_BLOCK_OPEN.test(trimmed) ||
		REGEX_PATTERNS.HTML_BLOCK_SELF_CLOSING.test(trimmed) ||
		REGEX_PATTERNS.HTML_COMMENT.test(trimmed)
	);
};

/**
 * Common HTML block-level elements that should be treated as blocks
 * Based on HTML5 specification and common usage
 */
const BLOCK_LEVEL_ELEMENTS = new Set([
	"address",
	"article",
	"aside",
	"blockquote",
	"details",
	"dialog",
	"dd",
	"div",
	"dl",
	"dt",
	"fieldset",
	"figcaption",
	"figure",
	"footer",
	"form",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"header",
	"hgroup",
	"hr",
	"li",
	"main",
	"nav",
	"ol",
	"p",
	"pre",
	"section",
	"table",
	"ul",
	"script",
	"style",
	"noscript",
	"canvas",
	"video",
	"audio",
	"iframe",
	"object",
	"embed",
	"param",
	"source",
	"track",
]);

/**
 * Checks if a tag name represents a block-level element
 *
 * @param {string} tagName - HTML tag name (lowercase)
 * @returns {boolean} - True if block-level element
 */
export const isBlockLevelElement = (tagName) => {
	return BLOCK_LEVEL_ELEMENTS.has(tagName.toLowerCase());
};
