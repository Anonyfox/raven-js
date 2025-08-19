/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { parseBlockquote } from "./blockquote-parser.js";
import { parseCodeBlock } from "./code-block-parser.js";
import { parseHeading } from "./heading-parser.js";
import { parseHorizontalRule } from "./horizontal-rule-parser.js";
import { parseList } from "./list-parser.js";
import { parseParagraph } from "./paragraph-parser.js";

/**
 *
 * Parses block-level markdown elements from an array of lines
 */
export const parseBlocks = (/** @type {string[]} */ lines) => {
	// Input validation
	if (!Array.isArray(lines) || lines.length === 0) {
		return [];
	}

	/** @type {Array<import('../types.js').BlockNode>} */
	const ast = [];
	let current = 0;
	const maxIterations = lines.length; // Prevent infinite loops
	let iterations = 0;

	// Deterministic parsing with bounded iteration
	while (current < lines.length && iterations < maxIterations) {
		iterations++;

		// Try to match each block element type in order of precedence
		const node =
			parseHeading(lines, current) ||
			parseHorizontalRule(lines, current) ||
			parseCodeBlock(lines, current) ||
			parseBlockquote(lines, current) ||
			parseList(lines, current) ||
			parseParagraph(lines, current);

		if (node) {
			ast.push(node.node);
			current = node.end;
		} else {
			// No block element found, advance by one line
			current++;
		}
	}

	return ast;
};
