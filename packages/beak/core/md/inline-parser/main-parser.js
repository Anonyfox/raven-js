/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { parseInlineRecursive } from "./recursive-parser.js";

/**
 * @packageDocumentation
 *
 * Parses inline markdown elements from text
 */
export const parseInline = (/** @type {string} */ text) => {
	return parseInlineRecursive(text);
};
