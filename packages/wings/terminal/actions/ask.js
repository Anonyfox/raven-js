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
 * **Purpose**: Collect user input through platform-native readline interface.
 * Pure functions with controlled side effects (terminal I/O only).
 *
 * **Key Features**:
 * - Text input with trimmed responses
 * - Yes/no confirmation with flexible input formats
 * - Default value support for confirmations
 * - Input validation and retry loops
 * - Automatic readline cleanup
 *
 * **Performance**: Async operations block until user input received.
 * Uses Node.js built-in readline for cross-platform compatibility.
 *
 * **Testing**: Provider abstraction enables readline mocking in tests.
 */

/**
 * Readline module provider for test mocking.
 *
 * **Purpose**: Enable deterministic testing while preserving source simplicity.
 * Replace getReadline function in tests to mock user input behavior.
 *
 * @type {{ getReadline: () => Promise<typeof import('node:readline')> }}
 */
export const readlineProvider = {
	getReadline: async () => await import("node:readline"),
};

/**
 * Prompt user for text input with automatic cleanup.
 *
 * **Behavior**: Create readline interface, display prompt, await input,
 * trim whitespace, cleanup interface. Blocks until user responds.
 *
 * **Error Handling**: Throws TypeError for non-string prompts.
 * Readline errors propagated to caller.
 *
 * @param {string} question - Prompt text displayed to user
 * @returns {Promise<string>} Trimmed user input
 * @throws {TypeError} Question parameter must be string
 *
 * @example
 * ```javascript
 * const name = await ask('Name: ');
 * const email = await ask('Email: ');
 * if (!email.includes('@')) throw new Error('Invalid email');
 * ```
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
 * **Behavior**: Display question with [Y/n] or [y/N] suffix based on default.
 * Accept y/yes/n/no (case insensitive), empty input uses default.
 * Retry loop until valid input received.
 *
 * **Validation**: Rejects invalid input with instruction message.
 * Empty input resolves to defaultValue immediately.
 *
 * @param {string} question - Confirmation prompt text
 * @param {boolean} [defaultValue=false] - Value returned for empty input
 * @returns {Promise<boolean>} User's boolean choice
 * @throws {TypeError} Question parameter must be string
 *
 * @example
 * ```javascript
 * const deploy = await confirm('Deploy? '); // [y/N]
 * const force = await confirm('Force? ', true); // [Y/n]
 * if (deploy && !force) console.log('Safe deployment');
 * ```
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
