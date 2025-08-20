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
 * **Purpose**: Display semantic messages with colors and symbols.
 * Pure functions using ANSI escape codes for cross-platform color support.
 *
 * **Message Types**:
 * - Plain text output (stdout)
 * - Success messages (green + ✅)
 * - Error messages (red + ❌, stderr)
 * - Warning messages (yellow + ⚠️)
 * - Info messages (blue + ℹ️)
 *
 * **Performance**: Synchronous stdout/stderr writes, minimal overhead.
 * Uses platform-native ANSI codes, no external dependencies.
 *
 * **Color Support**: Works on most modern terminals. Graceful fallback
 * to text-only on unsupported terminals (symbols remain visible).
 */

/**
 * ANSI color codes and reset sequences.
 *
 * **Standard Colors**: Basic 16-color palette for maximum compatibility.
 * **Formatting**: Bright/dim modifiers, reset sequence for cleanup.
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
 * **Cross-Platform**: UTF-8 emoji symbols with universal support.
 * **Visual Distinction**: Clear semantic meaning at a glance.
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
 * **Base Function**: Foundation for all other output functions.
 * **Behavior**: Direct stdout write with newline appended.
 *
 * @param {string} message - Text to output
 * @throws {TypeError} Message parameter must be string
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
 * **Format**: ✅ {message} in green
 * **Target**: stdout
 *
 * @param {string} message - Success message text
 * @throws {TypeError} Message parameter must be string
 */
export function success(message) {
	if (typeof message !== "string") {
		throw new TypeError("Message must be a string");
	}
	const formatted = `${colors.green}${symbols.success} ${message}${colors.reset}`;
	process.stdout.write(`${formatted}\n`);
}

/**
 * Output error message with red color and X symbol.
 *
 * **Format**: ❌ {message} in red
 * **Target**: stderr (proper error stream)
 *
 * @param {string} message - Error message text
 * @throws {TypeError} Message parameter must be string
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
 * **Format**: ⚠️ {message} in yellow
 * **Target**: stdout
 *
 * @param {string} message - Warning message text
 * @throws {TypeError} Message parameter must be string
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
 * **Format**: ℹ️ {message} in blue
 * **Target**: stdout
 *
 * @param {string} message - Info message text
 * @throws {TypeError} Message parameter must be string
 */
export function info(message) {
	if (typeof message !== "string") {
		throw new TypeError("Message must be a string");
	}
	const formatted = `${colors.blue}${symbols.info} ${message}${colors.reset}`;
	process.stdout.write(`${formatted}\n`);
}
