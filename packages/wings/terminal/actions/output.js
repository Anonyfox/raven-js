/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Colored message output functions for terminal applications.
 *
 * Provides semantic message functions with ANSI colors and Unicode symbols.
 * Includes plain text, success, error, warning, and info output functions.
 */

/**
 * ANSI color codes and reset sequences.
 *
 * @type {{
 *   reset: string,
 *   bright: string,
 *   dim: string,
 *   red: string,
 *   green: string,
 *   yellow: string,
 *   blue: string,
 *   gray: string
 * }}
 */
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",

	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	gray: "\x1b[90m",
};

/**
 * Unicode symbols for semantic message types.
 *
 * @type {{
 *   success: string,
 *   error: string,
 *   warning: string,
 *   info: string
 * }}
 */
const symbols = {
	success: "✅",
	error: "❌",
	warning: "⚠️",
	info: "ℹ️",
};

/**
 * Output plain text to stdout without formatting.
 *
 * @param {string} message - Text to output
 * @throws {TypeError} Message parameter must be string
 *
 * @example
 * // Basic text output
 * print('Hello, world!');
 * print('Processing complete.');
 */
export function print(message) {
	if (typeof message !== "string") {
		throw new TypeError("Message must be a string");
	}
	process.stdout.write(`${message}\n`);
}

/**
 * Output success message with green color and checkmark symbol.
 *
 * @param {string} message - Success message text
 * @throws {TypeError} Message parameter must be string
 *
 * @example
 * // Success notifications
 * success('Task completed successfully!');
 * success('All tests passed!');
 */
export function success(message) {
	if (typeof message !== "string") {
		throw new TypeError("Message must be a string");
	}
	const formatted = `${colors.green}${symbols.success} ${message}${colors.reset}`;
	process.stdout.write(`${formatted}\n`);
}

/**
 * Output error message with red color and X symbol to stderr.
 *
 * @param {string} message - Error message text
 * @throws {TypeError} Message parameter must be string
 *
 * @example
 * // Error notifications
 * error('Connection failed!');
 * error('Invalid configuration detected.');
 */
export function error(message) {
	if (typeof message !== "string") {
		throw new TypeError("Message must be a string");
	}
	const formatted = `${colors.red}${symbols.error} ${message}${colors.reset}`;
	process.stderr.write(`${formatted}\n`);
}

/**
 * Output warning message with yellow color and warning symbol.
 *
 * @param {string} message - Warning message text
 * @throws {TypeError} Message parameter must be string
 *
 * @example
 * // Warning notifications
 * warning('Deprecated feature in use.');
 * warning('Resource limit approaching.');
 */
export function warning(message) {
	if (typeof message !== "string") {
		throw new TypeError("Message must be a string");
	}
	const formatted = `${colors.yellow}${symbols.warning} ${message}${colors.reset}`;
	process.stdout.write(`${formatted}\n`);
}

/**
 * Output info message with blue color and info symbol.
 *
 * @param {string} message - Info message text
 * @throws {TypeError} Message parameter must be string
 *
 * @example
 * // Information notifications
 * info('Processing 100 files...');
 * info('Server started on port 3000.');
 */
export function info(message) {
	if (typeof message !== "string") {
		throw new TypeError("Message must be a string");
	}
	const formatted = `${colors.blue}${symbols.info} ${message}${colors.reset}`;
	process.stdout.write(`${formatted}\n`);
}
