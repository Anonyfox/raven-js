/**
 * @file HTML character escaping utilities for markdown to HTML transformation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Escapes HTML special characters
 * @param {any} text - The text to escape (will be converted to string if not already)
 * @returns {string} - The escaped text
 */
export const escapeHTML = (text) => {
	if (typeof text !== "string") {
		text = String(text);
	}

	const escapeMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	};

	return text.replace(
		/[&<>"']/g,
		(/** @type {string} */ char) =>
			escapeMap[/** @type {keyof typeof escapeMap} */ (char)],
	);
};
