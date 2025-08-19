/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 *
 * A mapping of HTML special characters to their escaped counterparts.
 */
export const escapeMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"'": "&#39;",
	'"': "&quot;",
};

/**
 * Regex pattern built dynamically from the escapeMap keys.
 * This ensures the regex always matches exactly what we can escape.
 * @type {RegExp}
 */
const escapeRegex = new RegExp(
	`[${Object.keys(escapeMap)
		.map((char) =>
			// Escape special regex characters
			char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
		)
		.join("")}]`,
	"g",
);

/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 * @param {*} str - The value to escape (will be converted to string).
 * @returns {string} The escaped string.
 */
export const escapeSpecialCharacters = (str) => {
	// Convert to string first to handle non-string inputs
	const stringValue = String(str);
	return stringValue.replace(
		escapeRegex,
		(char) => /** @type {Record<string, string>} */ (escapeMap)[char],
	);
};
