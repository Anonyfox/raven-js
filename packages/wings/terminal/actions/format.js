/**
 * @file Text formatting functions for terminal interfaces
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *
 * Pure functions for formatting text with ANSI escape codes.
 * These functions wrap text with appropriate formatting codes.
 */

/**
 * ANSI formatting codes for terminal text styling.
 * @private
 */
const format = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	italic: "\x1b[3m",
	underline: "\x1b[4m",
};

/**
 * Apply bold formatting to text.
 *
 * This function wraps text with ANSI bold codes to make it
 * appear bold in terminal output. Works on most modern terminals.
 *
 * **Pure Function**: No side effects, just returns formatted string.
 * **ANSI Code**: ESC[1m for bold, ESC[0m for reset.
 *
 * @param {string} text - Text to make bold
 * @returns {string} Text wrapped with bold formatting codes
 *
 * @example
 * ```javascript
 * import { bold } from '@raven-js/wings/terminal';
 *
 * console.log(bold('Important message'));
 * console.log(`This is ${bold('bold')} text`);
 * console.log(bold('Error:') + ' Something went wrong');
 * ```
 */
export function bold(text) {
	if (typeof text !== "string") {
		throw new TypeError("Text must be a string");
	}
	return `${format.bold}${text}${format.reset}`;
}

/**
 * Apply italic formatting to text.
 *
 * This function wraps text with ANSI italic codes to make it
 * appear italic in terminal output. Support varies by terminal.
 *
 * **Pure Function**: No side effects, just returns formatted string.
 * **ANSI Code**: ESC[3m for italic, ESC[0m for reset.
 * **Note**: Not all terminals support italic text.
 *
 * @param {string} text - Text to make italic
 * @returns {string} Text wrapped with italic formatting codes
 *
 * @example
 * ```javascript
 * import { italic } from '@raven-js/wings/terminal';
 *
 * console.log(italic('This is emphasized'));
 * console.log(`Quote: ${italic('"Hello, world!"')}`);
 * ```
 */
export function italic(text) {
	if (typeof text !== "string") {
		throw new TypeError("Text must be a string");
	}
	return `${format.italic}${text}${format.reset}`;
}

/**
 * Apply dim formatting to text.
 *
 * This function wraps text with ANSI dim codes to make it
 * appear dimmed/faded in terminal output. Useful for less
 * important information.
 *
 * **Pure Function**: No side effects, just returns formatted string.
 * **ANSI Code**: ESC[2m for dim, ESC[0m for reset.
 *
 * @param {string} text - Text to make dim
 * @returns {string} Text wrapped with dim formatting codes
 *
 * @example
 * ```javascript
 * import { dim } from '@raven-js/wings/terminal';
 *
 * console.log('Important message');
 * console.log(dim('Less important details'));
 * console.log(`File: important.txt ${dim('(modified 2 hours ago)')}`);
 * ```
 */
export function dim(text) {
	if (typeof text !== "string") {
		throw new TypeError("Text must be a string");
	}
	return `${format.dim}${text}${format.reset}`;
}

/**
 * Apply underline formatting to text.
 *
 * This function wraps text with ANSI underline codes to make it
 * appear underlined in terminal output. Good for emphasis.
 *
 * **Pure Function**: No side effects, just returns formatted string.
 * **ANSI Code**: ESC[4m for underline, ESC[0m for reset.
 *
 * @param {string} text - Text to underline
 * @returns {string} Text wrapped with underline formatting codes
 *
 * @example
 * ```javascript
 * import { underline } from '@raven-js/wings/terminal';
 *
 * console.log(underline('Important Notice'));
 * console.log(`Visit ${underline('https://example.com')} for more info`);
 * ```
 */
export function underline(text) {
	if (typeof text !== "string") {
		throw new TypeError("Text must be a string");
	}
	return `${format.underline}${text}${format.reset}`;
}
