/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES } from "../types.js";

/**
 * @packageDocumentation
 *
 * Flattens nested inline nodes into a single string
 */
/**
 * @param {any[]} nodes - Array of inline nodes to flatten
 * @returns {string} Flattened string content
 */
export const flattenInlineNodes = (/** @type {any[]} */ nodes) => {
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
