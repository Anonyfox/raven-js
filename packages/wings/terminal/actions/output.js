/**
 * @file Colored output functions for terminal interfaces
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *
 * Pure functions for displaying colored messages in terminal applications.
 * Uses ANSI escape codes for cross-platform color support.
 */

/**
 * ANSI color codes for terminal output.
 * @private
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
 * Unicode symbols for different message types.
 * @private
 */
const symbols = {
	success: "✅",
	error: "❌",
	warning: "⚠️",
	info: "ℹ️",
};

/**
 * Print plain message to stdout.
 *
 * This function outputs a message without any formatting or colors.
 * It's the base function for all other output functions.
 *
 * **Pure Function**: No side effects except stdout write.
 * **Synchronous**: Returns immediately after writing.
 *
 * @param {string} message - Message to print
 *
 * @example
 * ```javascript
 * import { print } from '@raven-js/wings/terminal';
 *
 * print('Hello, world!');
 * print('Processing file: data.json');
 * ```
 */
export function print(message) {
	if (typeof message !== "string") {
		throw new TypeError("Message must be a string");
	}
	process.stdout.write(`${message}\n`);
}

/**
 * Print success message in green with checkmark.
 *
 * This function displays a success message with green color
 * and a checkmark symbol for positive feedback.
 *
 * **Color**: Green text
 * **Symbol**: ✅ checkmark
 *
 * @param {string} message - Success message to display
 *
 * @example
 * ```javascript
 * import { success } from '@raven-js/wings/terminal';
 *
 * success('File uploaded successfully!');
 * success('All tests passed');
 * success('Deployment completed');
 * ```
 */
export function success(message) {
	if (typeof message !== "string") {
		throw new TypeError("Message must be a string");
	}
	const formatted = `${colors.green}${symbols.success} ${message}${colors.reset}`;
	process.stdout.write(`${formatted}\n`);
}

/**
 * Print error message in red with X mark.
 *
 * This function displays an error message with red color
 * and an X symbol for negative feedback.
 *
 * **Color**: Red text
 * **Symbol**: ❌ X mark
 * **Output**: stderr (standard error stream)
 *
 * @param {string} message - Error message to display
 *
 * @example
 * ```javascript
 * import { error } from '@raven-js/wings/terminal';
 *
 * error('File not found');
 * error('Network connection failed');
 * error('Invalid configuration');
 * ```
 */
export function error(message) {
	if (typeof message !== "string") {
		throw new TypeError("Message must be a string");
	}
	const formatted = `${colors.red}${symbols.error} ${message}${colors.reset}`;
	process.stderr.write(`${formatted}\n`);
}

/**
 * Print warning message in yellow with warning symbol.
 *
 * This function displays a warning message with yellow color
 * and a warning triangle symbol for cautionary feedback.
 *
 * **Color**: Yellow text
 * **Symbol**: ⚠️ warning triangle
 *
 * @param {string} message - Warning message to display
 *
 * @example
 * ```javascript
 * import { warning } from '@raven-js/wings/terminal';
 *
 * warning('Deprecated feature used');
 * warning('Low disk space');
 * warning('API rate limit approaching');
 * ```
 */
export function warning(message) {
	if (typeof message !== "string") {
		throw new TypeError("Message must be a string");
	}
	const formatted = `${colors.yellow}${symbols.warning} ${message}${colors.reset}`;
	process.stdout.write(`${formatted}\n`);
}

/**
 * Print info message in blue with info symbol.
 *
 * This function displays an informational message with blue color
 * and an info symbol for neutral information.
 *
 * **Color**: Blue text
 * **Symbol**: ℹ️ info circle
 *
 * @param {string} message - Info message to display
 *
 * @example
 * ```javascript
 * import { info } from '@raven-js/wings/terminal';
 *
 * info('Starting server on port 3000');
 * info('Found 15 files to process');
 * info('Using configuration from .env file');
 * ```
 */
export function info(message) {
	if (typeof message !== "string") {
		throw new TypeError("Message must be a string");
	}
	const formatted = `${colors.blue}${symbols.info} ${message}${colors.reset}`;
	process.stdout.write(`${formatted}\n`);
}
