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
import { parseHTMLBlock } from "./html-block-parser.js";
import { parseIndentedCodeBlock } from "./indented-code-block-parser.js";

import { parseList } from "./list-parser.js";
import { parseParagraph } from "./paragraph-parser.js";
import { parseReferences } from "./reference-parser.js";
import { parseTable } from "./table-parser.js";

// Raven-fast first-character dispatch table for O(1) parser selection
/** @type {Map<string, any>|null} */
let BLOCK_PARSER_DISPATCH = null;

/**
 * Initialize dispatch table lazily to avoid module loading order issues
 * @returns {Map<string, any>}
 */
const getBlockDispatchTable = () => {
	if (!BLOCK_PARSER_DISPATCH) {
		BLOCK_PARSER_DISPATCH = new Map();
		BLOCK_PARSER_DISPATCH.set("#", parseHeading);
		BLOCK_PARSER_DISPATCH.set(">", parseBlockquote);
		BLOCK_PARSER_DISPATCH.set("-", parseList);
		BLOCK_PARSER_DISPATCH.set("*", parseList);
		BLOCK_PARSER_DISPATCH.set("`", parseCodeBlock);
		BLOCK_PARSER_DISPATCH.set("|", parseTable);
		BLOCK_PARSER_DISPATCH.set("<", parseHTMLBlock);
	}
	return BLOCK_PARSER_DISPATCH;
};

// Digit characters for ordered lists (1-9)
const DIGIT_CHARS = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);

// Special line patterns that need regex checking
const SPECIAL_LINE_CHECKERS = [
	{
		check: (/** @type {string} */ line) =>
			/^\s{4,}/.test(line) || /^\t/.test(line),
		parser: parseIndentedCodeBlock,
	},
];

/**
 * Parses block-level markdown elements using raven-fast first-character dispatch
 * **Performance:** O(1) parser selection instead of O(p) sequential attempts
 */
export const parseBlocks = (
	/** @type {string[]} */ lines,
	/** @type {Object<string, {url: string, title?: string}>} */ references = {},
) => {
	// Input validation
	if (!Array.isArray(lines) || lines.length === 0) {
		return [];
	}

	/** @type {Array<import('../types.js').BlockNode>} */
	const ast = [];
	let current = 0;
	const maxIterations = lines.length; // Prevent infinite loops
	let iterations = 0;

	// Raven-fast dispatch table - cache once to eliminate function call overhead
	const dispatch = getBlockDispatchTable();

	// Deterministic parsing with bounded iteration
	while (current < lines.length && iterations < maxIterations) {
		iterations++;
		const line = lines[current];

		// Skip empty lines
		if (!line || /^\s*$/.test(line)) {
			current++;
			continue;
		}

		// Check for reference definitions first (they should be consumed but not rendered)
		const referenceResult = parseReferences(lines, current);
		if (referenceResult) {
			current = referenceResult.end;
			continue;
		}

		let node = null;
		const firstChar = line[0];

		// O(1) first-character dispatch with conflict resolution
		if (dispatch.has(firstChar)) {
			const parser = dispatch.get(firstChar);

			// Special handling for '-' character - could be horizontal rule or list
			if (firstChar === "-") {
				// Try horizontal rule first (more specific pattern)
				node = parseHorizontalRule(lines, current);
				if (!node) {
					// Fall back to list parsing
					node = parseList(lines, current);
				}
			} else {
				node = parser(lines, current);
			}
		} else if (DIGIT_CHARS.has(firstChar)) {
			// Check for ordered list
			node = parseList(lines, current);
		} else {
			// Check special patterns that need regex validation
			for (const { check, parser } of SPECIAL_LINE_CHECKERS) {
				if (check(line)) {
					node = parser(lines, current);
					break;
				}
			}
		}

		// Fallback to paragraph if no specific block type matches
		if (!node) {
			node = parseParagraph(lines, current, references);
		}

		// All lines should be handled by parsers
		ast.push(node.node);
		current = node.end;
	}

	return ast;
};
