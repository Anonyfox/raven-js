/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES, VALIDATORS } from "../types.js";

/**
 *
 * Validates an inline node
 */
export const validateInlineNode = (/** @type {any} */ node) => {
	if (!node || typeof node !== "object") return false;
	if (!VALIDATORS.isValidNodeType(node.type)) return false;

	switch (node.type) {
		case NODE_TYPES.TEXT:
			return typeof node.content === "string";
		case NODE_TYPES.BOLD:
		case NODE_TYPES.ITALIC:
			return Array.isArray(node.content) && node.content.length > 0;
		case NODE_TYPES.CODE:
			return typeof node.content === "string";
		case NODE_TYPES.LINK:
			return (
				Array.isArray(node.content) &&
				node.content.length > 0 &&
				VALIDATORS.isValidUrl(node.url)
			);
		case NODE_TYPES.IMAGE:
			return VALIDATORS.isValidUrl(node.url);
		default:
			return false;
	}
};
