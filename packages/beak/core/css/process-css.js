/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

// Pre-compiled regex patterns for performance
const WHITESPACE_REGEX = /\s+/g;
const COLON_REGEX = /([a-zA-Z-]+)\s*:\s*/g;
const SEMICOLON_REGEX = /\s+;/g;
const OPEN_BRACE_REGEX = /\s+\{/g;
const CLOSE_BRACE_REGEX = /\s+\}/g;
const SEMICOLON_SPACE_REGEX = /;(?!$|\s)/g;
const CLOSE_BRACE_SPACE_REGEX = /\}(?!$|\s)/g;

/**
 * @packageDocumentation
 *
 * Processes a CSS string to ensure single-line output with minimal whitespace.
 * This function performs the following transformations:
 * - Normalizes all whitespace sequences to single spaces
 * - Removes spaces before and after colons in property declarations
 * - Removes spaces before semicolons
 * - Removes spaces before opening braces
 * - Removes spaces before closing braces
 * - Ensures proper spacing after semicolons and closing braces
 * - Trims leading and trailing whitespace
 * processCSS(`
 * .button {
 * color: white;
 * background: #007bff;
 * }
 * `);
 * // Returns: ".button{ color:white; background:#007bff; }"
 */
export const processCSS = (/** @type {string} */ css) => {
	// Fast path for empty or whitespace-only strings
	if (!css || css.trim() === "") return "";

	// Use a more efficient approach: combine multiple operations
	return css
		.replace(WHITESPACE_REGEX, " ")
		.replace(COLON_REGEX, "$1:")
		.replace(SEMICOLON_REGEX, ";")
		.replace(OPEN_BRACE_REGEX, "{")
		.replace(CLOSE_BRACE_REGEX, "}")
		.replace(SEMICOLON_SPACE_REGEX, "; ")
		.replace(CLOSE_BRACE_SPACE_REGEX, "} ")
		.trim();
};
