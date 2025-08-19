/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { escapeHTML } from "./escape-html.js";

/**
 * @packageDocumentation
 *
 * Transforms an array of inline nodes into HTML
 */
export const transformInlineNodes = (/** @type {any} */ nodes) => {
	if (!Array.isArray(nodes)) {
		return "";
	}

	return nodes.map((node) => transformInlineNode(node)).join("");
};

/**
 * Transforms a single inline node into HTML
 * @param {import('../types.js').InlineNode} node - The inline node to transform
 * @returns {string} - The HTML representation
 */
export const transformInlineNode = (node) => {
	if (!node || typeof node !== "object" || !node.type) {
		return "";
	}

	switch (node.type) {
		case "text":
			// Text nodes always have string content
			return escapeHTML(typeof node.content === "string" ? node.content : "");
		case "bold":
			return transformBold(node);
		case "italic":
			return transformItalic(node);
		case "code":
			return transformInlineCode(node);
		case "link":
			return transformLink(node);
		case "image":
			return transformImage(node);
		default:
			return "";
	}
};

/**
 * Transforms a bold node
 * @param {import('../types.js').InlineNode} node - The bold node
 * @returns {string} - The HTML bold element
 */
const transformBold = (node) => {
	const content = transformInlineNodes(
		Array.isArray(node.content) ? node.content : [],
	);
	return `<strong>${content}</strong>`;
};

/**
 * Transforms an italic node
 * @param {import('../types.js').InlineNode} node - The italic node
 * @returns {string} - The HTML italic element
 */
const transformItalic = (node) => {
	const content = transformInlineNodes(
		Array.isArray(node.content) ? node.content : [],
	);
	return `<em>${content}</em>`;
};

/**
 * Transforms an inline code node
 * @param {import('../types.js').InlineNode} node - The inline code node
 * @returns {string} - The HTML inline code element
 */
const transformInlineCode = (node) => {
	// Inline code nodes always have string content
	const content = escapeHTML(
		typeof node.content === "string" ? node.content : "",
	);
	return `<code>${content}</code>`;
};

/**
 * Transforms a link node
 * @param {import('../types.js').InlineNode} node - The link node
 * @returns {string} - The HTML link element
 */
const transformLink = (node) => {
	const content = transformInlineNodes(
		Array.isArray(node.content) ? node.content : [],
	);
	const url = escapeHTML(node.url || "#");
	return `<a href="${url}">${content}</a>`;
};

/**
 * Transforms an image node
 * @param {import('../types.js').InlineNode} node - The image node
 * @returns {string} - The HTML image element
 */
const transformImage = (node) => {
	const alt = escapeHTML(node.alt || "");
	const url = escapeHTML(node.url || "");
	return `<img src="${url}" alt="${alt}">`;
};
