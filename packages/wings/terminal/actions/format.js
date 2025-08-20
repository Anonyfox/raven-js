/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Text formatting functions using ANSI escape codes.
 *
 * **Purpose**: Apply visual styling to terminal text output.
 * Pure functions that wrap text with ANSI formatting codes.
 *
 * **Formatting Types**:
 * - Bold text (ESC[1m)
 * - Italic text (ESC[3m)
 * - Dim/faded text (ESC[2m)
 * - Underlined text (ESC[4m)
 *
 * **Compatibility**: Works on most modern terminals. Italic support varies.
 * Automatic reset codes prevent formatting bleed to subsequent output.
 *
 * **Performance**: Zero overhead string concatenation, no external dependencies.
 */

/**
 * ANSI escape sequences for text formatting.
 *
 * **Standard Codes**: Uses widely-supported ANSI SGR (Select Graphic Rendition).
 * **Reset Handling**: All functions automatically append reset sequence.
 *
 * @type {{
 *   reset: string,
 *   bold: string,
 *   dim: string,
 *   italic: string,
 *   underline: string
 * }}
 */
const format = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	italic: "\x1b[3m",
	underline: "\x1b[4m",
};

/**
 * Wrap text with bold formatting codes.
 *
 * **ANSI Sequence**: ESC[1m...ESC[0m
 * **Compatibility**: Universal terminal support
 *
 * @param {string} text - Text to format
 * @returns {string} Bold-formatted text with reset codes
 * @throws {TypeError} Text parameter must be string
 */
export function bold(text) {
	if (typeof text !== "string") {
		throw new TypeError("Text must be a string");
	}
	return `${format.bold}${text}${format.reset}`;
}

/**
 * Wrap text with italic formatting codes.
 *
 * **ANSI Sequence**: ESC[3m...ESC[0m
 * **Compatibility**: Limited terminal support, graceful fallback
 *
 * @param {string} text - Text to format
 * @returns {string} Italic-formatted text with reset codes
 * @throws {TypeError} Text parameter must be string
 */
export function italic(text) {
	if (typeof text !== "string") {
		throw new TypeError("Text must be a string");
	}
	return `${format.italic}${text}${format.reset}`;
}

/**
 * Wrap text with dim/faded formatting codes.
 *
 * **ANSI Sequence**: ESC[2m...ESC[0m
 * **Purpose**: De-emphasize less important information
 *
 * @param {string} text - Text to format
 * @returns {string} Dim-formatted text with reset codes
 * @throws {TypeError} Text parameter must be string
 */
export function dim(text) {
	if (typeof text !== "string") {
		throw new TypeError("Text must be a string");
	}
	return `${format.dim}${text}${format.reset}`;
}

/**
 * Wrap text with underline formatting codes.
 *
 * **ANSI Sequence**: ESC[4m...ESC[0m
 * **Purpose**: Emphasize text or indicate links/actions
 *
 * @param {string} text - Text to format
 * @returns {string} Underlined text with reset codes
 * @throws {TypeError} Text parameter must be string
 */
export function underline(text) {
	if (typeof text !== "string") {
		throw new TypeError("Text must be a string");
	}
	return `${format.underline}${text}${format.reset}`;
}
