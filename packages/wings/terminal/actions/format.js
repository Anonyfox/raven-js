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
 * Provides bold, italic, dim, and underline text formatting functions
 * with automatic reset codes to prevent formatting bleed.
 */

/**
 * ANSI escape sequences for text formatting.
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
 * @param {string} text - Text to format
 * @returns {string} Bold-formatted text with reset codes
 * @throws {TypeError} Text parameter must be string
 *
 * @example
 * // Bold text output
 * console.log(bold('Important message'));
 * console.log(bold('Header Text'));
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
 * @param {string} text - Text to format
 * @returns {string} Italic-formatted text with reset codes
 * @throws {TypeError} Text parameter must be string
 *
 * @example
 * // Italic text output
 * console.log(italic('Emphasis text'));
 * console.log(italic('Variable name'));
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
 * @param {string} text - Text to format
 * @returns {string} Dim-formatted text with reset codes
 * @throws {TypeError} Text parameter must be string
 *
 * @example
 * // Dimmed text output
 * console.log(dim('Secondary information'));
 * console.log(dim('Metadata'));
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
 * @param {string} text - Text to format
 * @returns {string} Underlined text with reset codes
 * @throws {TypeError} Text parameter must be string
 *
 * @example
 * // Underlined text output
 * console.log(underline('Link text'));
 * console.log(underline('Highlighted term'));
 */
export function underline(text) {
	if (typeof text !== "string") {
		throw new TypeError("Text must be a string");
	}
	return `${format.underline}${text}${format.reset}`;
}
