/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file User input gathering functions for interactive CLI applications.
 *
 * Provides text input and yes/no confirmation functions using Node.js readline interface.
 * Includes provider abstraction for testing with deterministic input mocking.
 */

/**
 * Readline module provider for test mocking.
 *
 * @type {{ getReadline: () => Promise<typeof import('node:readline')> }}
 *
 * @example
 * // Access readline module
 * const readline = await readlineProvider.getReadline();
 * const rl = readline.createInterface({ input: process.stdin });
 *
 * @example
 * // Mock for testing
 * readlineProvider.getReadline = () => mockReadline;
 */
export const readlineProvider = {
	getReadline: async () => await import("node:readline"),
};

/**
 * Prompt user for text input with automatic cleanup.
 *
 * Creates readline interface, displays prompt, and returns trimmed input.
 *
 * @param {string} question - Prompt text displayed to user
 * @returns {Promise<string>} Trimmed user input
 * @throws {TypeError} Question parameter must be string
 *
 * @example
 * // Basic usage
 * const name = await ask('Name: ');
 * const email = await ask('Email: ');
 */
export async function ask(/** @type {string} */ question) {
	if (typeof question !== "string") {
		throw new TypeError("Question must be a string");
	}

	const readline = await readlineProvider.getReadline();
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	try {
		const answer = await new Promise((resolve, reject) => {
			rl.question(question, resolve);
			rl.on("error", reject);
		});
		return answer.trim();
	} finally {
		rl.close();
	}
}

/**
 * Prompt user for yes/no confirmation with input validation.
 *
 * Displays question with [Y/n] or [y/N] suffix based on default value.
 * Accepts y/yes/n/no (case insensitive), retries on invalid input.
 *
 * @param {string} question - Confirmation prompt text
 * @param {boolean} [defaultValue=false] - Value returned for empty input
 * @returns {Promise<boolean>} User's boolean choice
 * @throws {TypeError} Question parameter must be string
 *
 * @example
 * // Basic usage
 * const deploy = await confirm('Deploy? '); // [y/N]
 * const force = await confirm('Force? ', true); // [Y/n]
 */
export async function confirm(question, defaultValue = false) {
	if (typeof question !== "string") {
		throw new TypeError("Question must be a string");
	}

	const defaultText = defaultValue ? "[Y/n]" : "[y/N]";
	const fullQuestion = `${question}${defaultText} `;

	while (true) {
		const answer = await ask(fullQuestion);

		// Handle empty input (use default)
		if (answer === "") {
			return defaultValue;
		}

		// Handle yes responses
		if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
			return true;
		}

		// Handle no responses
		if (answer.toLowerCase() === "n" || answer.toLowerCase() === "no") {
			return false;
		}

		// Invalid input - ask again
		console.log("Please enter 'y' for yes or 'n' for no.");
	}
}
