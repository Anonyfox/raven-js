/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @packageDocumentation
 *
 * Splits text into lines for block parsing
 */
export const splitIntoLines = (/** @type {string} */ text) => {
	if (typeof text !== "string") return [];
	return text.split(/\r?\n/);
};
