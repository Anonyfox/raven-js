/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { transformBlockNode } from "./block-transformers.js";

/**
 * @packageDocumentation
 *
 * Transforms a markdown AST into HTML
 * This function recursively processes both block and inline nodes,
 * converting them into properly formatted HTML with appropriate escaping.
 */
export const transformToHTML = (/** @type {any} */ ast) => {
	if (!Array.isArray(ast)) {
		return "";
	}

	return ast.map((node) => transformBlockNode(node)).join("\n");
};

// Re-export convenience function
export { markdownToHTML } from "./markdown-to-html.js";
