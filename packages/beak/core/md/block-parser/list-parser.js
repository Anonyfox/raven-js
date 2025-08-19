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
 * Parses list elements
 */
export const parseList = (
	/** @type {string[]} */ lines,
	/** @type {number} */ start,
) => {
	if (start >= lines.length) return null;

	const line = lines[start];
	const unordered = line.match(REGEX_PATTERNS.UNORDERED_LIST);
	const ordered = line.match(REGEX_PATTERNS.ORDERED_LIST);
	const taskList = line.match(REGEX_PATTERNS.TASK_LIST);

	if (!unordered && !ordered && !taskList) return null;

	const isOrdered = !!ordered;
	const isTaskList = !!taskList;
	const items = [];
	let end = start;

	while (end < lines.length) {
		const currentLine = lines[end];
		let currentMatch = null;
		let content = "";
		let checked;

		if (isTaskList) {
			currentMatch = currentLine.match(REGEX_PATTERNS.TASK_LIST);
			if (currentMatch) {
				checked = currentMatch[1] === "x";
				content = currentMatch[2];
			}
		} else if (isOrdered) {
			currentMatch = currentLine.match(REGEX_PATTERNS.ORDERED_LIST);
			if (currentMatch) {
				content = currentMatch[2];
			}
		} else {
			currentMatch = currentLine.match(REGEX_PATTERNS.UNORDERED_LIST);
			if (currentMatch) {
				content = currentMatch[1];
			}
		}

		if (currentMatch) {
			/** @type {import('../types.js').BlockNode} */
			const listItem = {
				type: NODE_TYPES.LIST_ITEM,
				content: parseInline(content),
			};
			if (checked !== undefined) {
				listItem.checked = checked;
			}
			items.push(listItem);
		} else if (REGEX_PATTERNS.WHITESPACE.test(currentLine)) {
			end++;
			continue;
		} else {
			break;
		}
		end++;
	}

	return {
		node: {
			type: NODE_TYPES.LIST,
			ordered: isOrdered,
			items,
		},
		start,
		end,
	};
};
