/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { escapeHTML } from "./escape-html.js";
import { transformInlineNodes } from "./inline-transformers.js";

/**
 *
 * Transforms a single block node into HTML
 */
export const transformBlockNode = (/** @type {any} */ node) => {
	if (!node || typeof node !== "object" || !node.type) {
		return "";
	}

	switch (node.type) {
		case "paragraph":
			return transformParagraph(node);
		case "heading":
			return transformHeading(node);
		case "list":
			return transformList(node);
		case "listItem":
			return transformListItem(node);
		case "blockquote":
			return transformBlockquote(node);
		case "codeBlock":
			return transformCodeBlock(node);
		case "htmlBlock":
			return transformHTMLBlock(node);
		case "horizontalRule":
			return transformHorizontalRule(node);
		case "table":
			return transformTable(node);
		case "tableRow":
			return transformTableRow(node);
		case "tableCell":
			return transformTableCell(node);
		default:
			return "";
	}
};

/**
 * Transforms a paragraph node
 * @param {import('../types.js').BlockNode} node - The paragraph node
 * @returns {string} - The HTML paragraph
 */
const transformParagraph = (node) => {
	const content = Array.isArray(node.content)
		? transformInlineNodes(node.content)
		: "";
	return `<p>${content}</p>`;
};

/**
 * Transforms a heading node
 * @param {import('../types.js').BlockNode} node - The heading node
 * @returns {string} - The HTML heading
 */
const transformHeading = (node) => {
	const level = node.level || 1;
	const content = Array.isArray(node.content)
		? transformInlineNodes(node.content)
		: "";
	return `<h${level}>${content}</h${level}>`;
};

/**
 * Transforms a list node
 * @param {import('../types.js').BlockNode} node - The list node
 * @returns {string} - The HTML list
 */
const transformList = (node) => {
	const tag = node.ordered ? "ol" : "ul";
	const items = (node.items || [])
		.map((item) => transformListItem(item))
		.join("");
	return `<${tag}>${items}</${tag}>`;
};

/**
 * Transforms a list item node
 * @param {import('../types.js').BlockNode} node - The list item node
 * @returns {string} - The HTML list item
 */
const transformListItem = (node) => {
	const content = Array.isArray(node.content)
		? transformInlineNodes(node.content)
		: "";

	// Handle task list items
	if (typeof node.checked === "boolean") {
		const checked = node.checked ? " checked" : "";
		return `<li><input type="checkbox"${checked} disabled> ${content}</li>`;
	}

	return `<li>${content}</li>`;
};

/**
 * Transforms a blockquote node
 * @param {import('../types.js').BlockNode} node - The blockquote node
 * @returns {string} - The HTML blockquote
 */
const transformBlockquote = (node) => {
	const content = Array.isArray(node.content)
		? transformInlineNodes(node.content)
		: "";
	return `<blockquote><p>${content}</p></blockquote>`;
};

/**
 * Transforms a code block node
 * @param {import('../types.js').BlockNode} node - The code block node
 * @returns {string} - The HTML code block
 */
const transformCodeBlock = (node) => {
	const language = node.language || "";
	const content = typeof node.content === "string" ? node.content : "";
	const escapedContent = escapeHTML(content);
	const langAttr = language ? ` class="language-${language}"` : "";
	return `<pre><code${langAttr}>${escapedContent}</code></pre>`;
};

/**
 * Transforms an HTML block node (raw HTML pass-through)
 * @param {import('../types.js').BlockNode} node - The HTML block node
 * @returns {string} - The raw HTML content
 */
const transformHTMLBlock = (node) => {
	return typeof node.html === "string" ? node.html : "";
};

/**
 * Transforms a horizontal rule node
 * @param {import('../types.js').BlockNode} _node - The horizontal rule node
 * @returns {string} - The HTML horizontal rule
 */
const transformHorizontalRule = (_node) => {
	return "<hr>";
};

/**
 * Transforms a table node
 * @param {import('../types.js').BlockNode} node - The table node
 * @returns {string} - The HTML table
 */
const transformTable = (node) => {
	if (!Array.isArray(node.rows)) return "";

	const [headerRow, ...dataRows] = node.rows;

	let html = "<table>";

	// Header
	if (headerRow) {
		html += "<thead>";
		html += transformTableRow(headerRow, true);
		html += "</thead>";
	}

	// Body
	if (dataRows.length > 0) {
		html += "<tbody>";
		html += dataRows.map((row) => transformTableRow(row, false)).join("");
		html += "</tbody>";
	}

	html += "</table>";
	return html;
};

/**
 * Transforms a table row node
 * @param {import('../types.js').BlockNode} node - The table row node
 * @param {boolean} isHeader - Whether this is a header row
 * @returns {string} - The HTML table row
 */
const transformTableRow = (node, isHeader = false) => {
	if (!Array.isArray(node.cells)) return "";

	const cells = node.cells
		.map((cell) => transformTableCell(cell, isHeader))
		.join("");
	return `<tr>${cells}</tr>`;
};

/**
 * Transforms a table cell node
 * @param {import('../types.js').BlockNode} node - The table cell node
 * @param {boolean} isHeader - Whether this is a header cell
 * @returns {string} - The HTML table cell
 */
const transformTableCell = (node, isHeader = false) => {
	const content = Array.isArray(node.content)
		? transformInlineNodes(node.content)
		: "";
	const tag = isHeader ? "th" : "td";
	return `<${tag}>${content}</${tag}>`;
};
