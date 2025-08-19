/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * HTML special character to entity mapping for XSS protection.
 *
 * Maps dangerous characters to safe HTML entities:
 * - `&` → `&amp;` (must be first to prevent double-escaping)
 * - `<` → `&lt;` (prevents tag injection)
 * - `>` → `&gt;` (prevents tag injection)
 * - `'` → `&#39;` (prevents attribute injection)
 * - `"` → `&quot;` (prevents attribute injection)
 *
 * @type {Record<string, string>}
 */
export const escapeMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"'": "&#39;",
	'"': "&quot;",
};

/**
 * Pre-compiled regex matching all escapable characters.
 *
 * Built dynamically from escapeMap keys with proper regex escaping.
 * Single regex execution is faster than multiple replace() calls.
 *
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
 * Escapes HTML special characters to prevent XSS attacks.
 *
 * Converts input to string first, then replaces dangerous characters
 * with safe HTML entities using pre-compiled regex for performance.
 *
 * **Critical for untrusted input:** User comments, form data, API responses.
 *
 * @param {*} str - Value to escape (converted to string if needed)
 * @returns {string} String with HTML entities replacing special characters
 *
 * @example
 * escapeSpecialCharacters('<script>alert("XSS")</script>')
 * // '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 *
 * @example
 * escapeSpecialCharacters('Normal text')
 * // 'Normal text'
 *
 * @example
 * escapeSpecialCharacters(null)
 * // 'null'
 */
export const escapeSpecialCharacters = (/** @type {*} */ str) => {
	// Convert to string first to handle non-string inputs
	const stringValue = String(str);
	return stringValue.replace(
		escapeRegex,
		(char) => /** @type {Record<string, string>} */ (escapeMap)[char],
	);
};
