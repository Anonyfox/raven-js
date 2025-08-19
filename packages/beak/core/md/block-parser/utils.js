/**
 * @file Utility functions for markdown block parsing operations
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Splits text into lines for block parsing
 * @param {string} text - The text to split
 * @returns {string[]} - Array of lines
 */
export const splitIntoLines = (text) => {
	if (typeof text !== "string") return [];
	return text.split(/\r?\n/);
};
