/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file CLI command execution runtime for Wings routing system.
 *
 * Executes CLI commands through HTTP-like Context abstractions, enabling route reuse
 * between web requests and terminal commands. Transforms CLI args to URL patterns
 * and routes through the Wings middleware pipeline.
 */

import { Context } from "../core/index.js";
import { ArgsToUrl } from "./transform-pattern.js";

/**
 * Process abstraction layer for testability.
 *
 * @type {{
 *   stdin: {
 *     readonly isTTY: boolean,
 *     on: (event: string, handler: (...args: any[]) => void) => void
 *   },
 *   stdout: {
 *     write: (data: string | Buffer) => void
 *   },
 *   exit: (code: number) => void,
 *   error: (message: string) => void
 * }}
 *
 * @example
 * // Standard usage
 * processProvider.stdout.write('Hello World!\n');
 * processProvider.exit(0);
 *
 * @example
 * // Test mocking
 * processProvider.stdout.write = mockWrite;
 * processProvider.exit = mockExit;
 */
export const processProvider = {
	stdin: {
		get isTTY() {
			return process.stdin.isTTY;
		},
		/** @param {string} event @param {(...args: any[]) => void} handler */
		on: (event, handler) => process.stdin.on(event, handler),
	},
	stdout: {
		/** @param {string | Buffer} data */
		write: (data) => process.stdout.write(data),
	},
	/** @param {number} code */
	exit: (code) => process.exit(code),
	/** @param {string} message */
	error: (message) => console.error(message),
};

/**
 * CLI command execution runtime using Wings routing system.
 *
 * @example
 * // Basic Terminal usage
 * const router = new Router();
 * router.cmd('build', async (ctx) => ctx.text('Built successfully!'));
 * const terminal = new Terminal(router);
 * await terminal.handleRequest(['build']);
 *
 * @example
 * // Terminal with parameters
 * router.cmd('deploy :env', async (ctx) => {
 *   const env = ctx.params.env;
 *   ctx.text(`Deployed to ${env}`);
 * });
 * await terminal.handleRequest(['deploy', 'production']);
 */
export class Terminal {
	/**
	 * Wings router instance.
	 * @type {import('../core/router.js').Router}
	 * @readonly
	 */
	#router;

	/**
	 * Create Terminal runtime with Wings router.
	 *
	 * @param {import('../core/router.js').Router} router - Wings router for command handling
	 * @throws {TypeError} Router missing or invalid (no handleRequest method)
	 */
	constructor(router) {
		if (!router || typeof router.handleRequest !== "function") {
			throw new TypeError("Router must be a valid Wings Router instance");
		}
		this.#router = router;
	}

	/**
	 * Execute CLI command through Wings router.
	 *
	 * **Flow**: CLI args → URL → Context → Router → stdout + exit code.
	 * Detects stdin pipe data, routes through middleware, maps HTTP status to exit codes.
	 *
	 * **Exit Codes**: 200-299 → 0 (success), others → 1 (error).
	 * **Stdin**: Reads piped data when !isTTY, null otherwise.
	 * **Error Handling**: Unexpected errors → stderr + exit(1).
	 *
	 * @param {string[]} args - Command line arguments
	 * @returns {Promise<void>} Resolves after execution, process.exit() called
	 */
	async run(args) {
		try {
			// Transform CLI args to URL
			const url = ArgsToUrl(args);
			const urlObj = new URL(url, "file://localhost");

			// Detect stdin input
			const stdinData = processProvider.stdin.isTTY
				? null
				: await this.#readStdin();

			// Create Context for COMMAND method
			const context = new Context("COMMAND", urlObj, new Headers(), stdinData);

			// Route through Wings router
			await this.#router.handleRequest(context);

			// Output to terminal
			if (context.responseBody) {
				processProvider.stdout.write(context.responseBody);
			}

			// Set exit code based on HTTP status
			const exitCode =
				context.responseStatusCode >= 200 && context.responseStatusCode < 300
					? 0
					: 1;
			processProvider.exit(exitCode);
		} catch (error) {
			// Handle unexpected errors
			processProvider.error(`Error: ${error.message}`);
			processProvider.exit(1);
		}
	}

	/**
	 * Read stdin for Unix pipe support.
	 *
	 * **Purpose**: Collect piped data for commands like `echo "data" | myapp process`.
	 * **Behavior**: Accumulate chunks until 'end' event, handle errors gracefully.
	 *
	 * @returns {Promise<Buffer|null>} Concatenated stdin data or null if empty
	 */
	async #readStdin() {
		return new Promise((resolve) => {
			/** @type {Buffer[]} */
			const chunks = [];

			processProvider.stdin.on(
				"data",
				/** @param {Buffer} chunk */ (chunk) => {
					chunks.push(chunk);
				},
			);

			processProvider.stdin.on("end", () => {
				resolve(chunks.length > 0 ? Buffer.concat(chunks) : null);
			});

			// Handle cases where stdin is immediately available
			processProvider.stdin.on("error", () => {
				resolve(null);
			});
		});
	}

	/**
	 * Wings router instance for route inspection or modification.
	 *
	 * @returns {import('../core/router.js').Router} Current router instance
	 * @readonly
	 */
	get router() {
		return this.#router;
	}
}
