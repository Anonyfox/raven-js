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
 * Escapes HTML special characters
 */
export const escapeHTML = (/** @type {string} */ text) => {
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
