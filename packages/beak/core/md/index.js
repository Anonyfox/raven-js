/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Template literal function for parsing markdown into HTML.
 *
 * Converts markdown text to HTML with deterministic O(n) parsing.
 * Supports standard markdown + GitHub flavored extensions.
 * Never throws exceptions - gracefully handles malformed input.
 */
import { markdownToHTML } from "./html-transformer/index.js";

/**
 * @param {TemplateStringsArray} strings - Template literal string segments
 * @param {...any} values - Interpolated values (stringified during processing)
 * @returns {string} HTML string output
 */
export const md = (strings, ...values) => {
	// Raven-fast template literal joining - O(n) with pre-allocated array
	if (values.length === 0) {
		return markdownToHTML(strings[0]);
	}

	// Pre-allocate array for optimal memory usage
	const parts = new Array(strings.length + values.length);
	let index = 0;

	// Interleave strings and values efficiently
	for (let i = 0; i < strings.length; i++) {
		parts[index++] = strings[i];
		if (i < values.length) {
			parts[index++] = values[i];
		}
	}

	// Single join operation for maximum performance
	const markdown = parts.join("");
	return markdownToHTML(markdown);
};
