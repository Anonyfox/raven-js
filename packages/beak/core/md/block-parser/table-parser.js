/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { parseInline } from "../inline-parser/index.js";
import { NODE_TYPES, REGEX_PATTERNS } from "../types.js";

/**
 *
 * Parses table elements
 */
export const parseTable = (
	/** @type {string[]} */ lines,
	/** @type {number} */ start,
) => {
	if (start >= lines.length) return null;

	const firstLine = lines[start];
	const secondLine = lines[start + 1];

	// Check if this looks like a table (first line has | and second line is separator)
	if (!REGEX_PATTERNS.TABLE_ROW.test(firstLine)) return null;
	if (!secondLine || !REGEX_PATTERNS.TABLE_SEPARATOR.test(secondLine))
		return null;

	const rows = [];
	let end = start;

	// Parse header row
	const headerCells = parseTableRow(firstLine);
	if (headerCells.length === 0) return null;

	rows.push({
		type: NODE_TYPES.TABLE_ROW,
		cells: headerCells,
	});

	// Skip separator row
	end += 2;

	// Parse data rows
	while (end < lines.length) {
		const currentLine = lines[end];

		if (!REGEX_PATTERNS.TABLE_ROW.test(currentLine)) {
			break;
		}

		const cells = parseTableRow(currentLine);
		if (cells.length === 0) break;

		rows.push({
			type: NODE_TYPES.TABLE_ROW,
			cells: cells,
		});

		end++;
	}

	return {
		node: {
			type: NODE_TYPES.TABLE,
			rows: rows,
		},
		start,
		end,
	};
};

/**
 * Parses a single table row
 * @param {string} line - The line to parse
 * @returns {Array<import('../types.js').BlockNode>} - Array of table cells
 */
const parseTableRow = (line) => {
	// Remove leading and trailing |
	const content = line.slice(1, -1);
	const cellStrings = content.split("|");

	return cellStrings.map((cellText) => ({
		type: NODE_TYPES.TABLE_CELL,
		content: parseInline(cellText.trim()),
	}));
};
