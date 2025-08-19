/**
 * @file AST flattening utilities for markdown processing
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES } from "../types.js";

/**
 * Flattens nested inline nodes into a single string
 * @param {Array<import('../types.js').InlineNode> | null | undefined | any} nodes - Array of inline nodes or invalid input
 * @returns {string} - Flattened text content
 */
export const flattenInlineNodes = (nodes) => {
	if (!Array.isArray(nodes)) return "";

	return nodes
		.map((node) => {
			if (node.type === NODE_TYPES.TEXT) {
				return node.content;
			}
			if (Array.isArray(node.content)) {
				return flattenInlineNodes(node.content);
			}
			return "";
		})
		.join("");
};
