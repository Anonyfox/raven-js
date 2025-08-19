/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com} Pure functions for gathering user input in terminal applications. Uses Node.js built-in readline module for cross-platform compatibility.
 */

import readline from "node:readline";

/**
 *
 * Ask user for text input with a prompt.
 * This function creates a readline interface, displays a prompt,
 * and waits for user input. It automatically handles cleanup
 * and returns the trimmed input as a string.
 * **Pure Function**: No side effects except terminal I/O.
 * **Platform**: Works on all platforms supported by Node.js.
 * ```javascript
 * import { ask } from '@raven-js/wings/terminal';
 * const name = await ask('What is your name? ');
 * console.log(`Hello, ${name}!`);
 * const email = await ask('Enter your email: ');
 * if (!email.includes('@')) {
 * console.log('Invalid email format');
 * }
 * ```
 */
export async function ask(/** @type {string} */ question) {
	if (typeof question !== "string") {
		throw new TypeError("Question must be a string");
	}

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});
}

/**
 * Ask user for yes/no confirmation.
 *
 * This function prompts the user with a yes/no question and
 * returns a boolean based on their response. Accepts various
 * forms of yes/no input (y/n, yes/no, case insensitive).
 *
 * **Default**: If user just presses enter, returns the defaultValue.
 * **Validation**: Keeps asking until valid input is received.
 *
 * @param {string} question - The confirmation prompt to display
 * @param {boolean} [defaultValue=false] - Default value if user presses enter
 * @returns {Promise<boolean>} true for yes, false for no
 *
 * @example
 * ```javascript
 * import { confirm } from '@raven-js/wings/terminal';
 *
 * const shouldDeploy = await confirm('Deploy to production? ');
 * if (shouldDeploy) {
 *   console.log('Deploying...');
 * } else {
 *   console.log('Deployment cancelled');
 * }
 *
 * // With default value
 * const shouldContinue = await confirm('Continue? ', true);
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
