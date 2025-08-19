/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { transformInlineNodes } from "./inline-transformers.js";

/**
 * @packageDocumentation
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
		case "horizontalRule":
			return transformHorizontalRule(node);
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
	const langAttr = language ? ` class="language-${language}"` : "";
	return `<pre><code${langAttr}>${content}</code></pre>`;
};

/**
 * Transforms a horizontal rule node
 * @param {import('../types.js').BlockNode} _node - The horizontal rule node
 * @returns {string} - The HTML horizontal rule
 */
const transformHorizontalRule = (_node) => {
	return "<hr>";
};
