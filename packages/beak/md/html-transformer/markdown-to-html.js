/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { parseBlocks } from "../block-parser/index.js";
import { collectReferences } from "../block-parser/reference-parser.js";
import { splitIntoLines } from "../block-parser/utils.js";
import { transformToHTML } from "./index.js";

/**
 * Transforms markdown text directly to HTML
 * This is a convenience function that combines parsing and transformation
 * Uses two-pass parsing: first collects references, then parses with reference resolution
 *
 * @param {string} markdown - Markdown text to convert
 * @returns {string} - HTML output
 */
export const markdownToHTML = (/** @type {string} */ markdown) => {
	if (typeof markdown !== "string") {
		return "";
	}

	const lines = splitIntoLines(markdown);

	// First pass: collect all reference definitions
	const references = collectReferences(lines);

	// Second pass: parse blocks with reference context
	const ast = parseBlocks(lines, references);

	return transformToHTML(ast);
};
