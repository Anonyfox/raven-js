import { parseBlocks } from "../block-parser/index.js";
import { splitIntoLines } from "../block-parser/utils.js";
import { transformToHTML } from "./index.js";

/**
 * Transforms markdown text directly to HTML
 * This is a convenience function that combines parsing and transformation
 *
 * @param {string} markdown - The markdown text to transform
 * @returns {string} - The generated HTML
 */
export const markdownToHTML = (markdown) => {
	if (typeof markdown !== "string") {
		return "";
	}

	const lines = splitIntoLines(markdown);
	const ast = parseBlocks(lines);
	return transformToHTML(ast);
};
