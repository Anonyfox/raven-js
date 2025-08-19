/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { parseBlocks } from "../block-parser/index.js";
import { splitIntoLines } from "../block-parser/utils.js";
import { transformToHTML } from "./index.js";

/**
 *
 * Transforms markdown text directly to HTML
 * This is a convenience function that combines parsing and transformation
 */
export const markdownToHTML = (/** @type {string} */ markdown) => {
	if (typeof markdown !== "string") {
		return "";
	}

	const lines = splitIntoLines(markdown);
	const ast = parseBlocks(lines);
	return transformToHTML(ast);
};
