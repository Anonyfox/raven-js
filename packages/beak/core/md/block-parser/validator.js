/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { NODE_TYPES, VALIDATORS } from "../types.js";

// Validation rules for each node type
const VALIDATION_RULES = {
	[NODE_TYPES.PARAGRAPH]: (
		/**
 *
 */ /** @type {any} */ node,
	) => Array.isArray(node.content) && node.content.length > 0,
	[NODE_TYPES.BLOCKQUOTE]: (
		/** @type {import('../types.js').BlockNode} */ node,
	) => Array.isArray(node.content) && node.content.length > 0,
	[NODE_TYPES.HEADING]: (/** @type {import('../types.js').BlockNode} */ node) =>
		VALIDATORS.isValidHeadingLevel(node.level) &&
		Array.isArray(node.content) &&
		node.content.length > 0,
	[NODE_TYPES.LIST]: (/** @type {import('../types.js').BlockNode} */ node) =>
		typeof node.ordered === "boolean" &&
		Array.isArray(node.items) &&
		node.items.length > 0,
	[NODE_TYPES.LIST_ITEM]: (
		/** @type {import('../types.js').BlockNode} */ node,
	) => Array.isArray(node.content) && node.content.length > 0,
	[NODE_TYPES.CODE_BLOCK]: (
		/** @type {import('../types.js').BlockNode} */ node,
	) => typeof node.language === "string" && typeof node.content === "string",
	[NODE_TYPES.HORIZONTAL_RULE]: () => true,
};

/**
 * Validates a block node
 * @param {import('../types.js').BlockNode} node - The node to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateBlockNode = (node) => {
	if (!node || typeof node !== "object") return false;
	if (!VALIDATORS.isValidNodeType(node.type)) return false;

	const validator = VALIDATION_RULES[node.type];
	return validator ? validator(node) : false;
};
