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
 * **Purpose**: Execute CLI commands through unified HTTP-like abstractions.
 * Transform command-line arguments into Context objects, route through Wings
 * middleware pipeline, interpret results for terminal output.
 *
 * **Key Architecture**: Reuses HTTP Context/Router abstractions for CLI.
 * - CLI args → URL patterns via ArgsToUrl transformation
 * - COMMAND method enables route reuse between HTTP/CLI
 * - responseBody → stdout, responseStatusCode → exit code
 * - stdin pipe support for Unix-style data processing
 *
 * **Integration**: Same routes handle web requests and terminal commands.
 * Middleware pipeline works identically. Zero external dependencies.
 *
 * **Performance**: Minimal overhead—direct Node.js primitives for I/O.
 * Async operations support interactive CLI patterns without blocking.
 */

import { Context } from "../core/index.js";
import { ArgsToUrl } from "./transform-pattern.js";

/**
 * Process abstraction layer for testability.
 *
 * **Purpose**: Enable test mocking while preserving source simplicity.
 * Replace entire object in tests for deterministic I/O behavior.
 *
 * **Platform Integration**: Direct Node.js process bindings.
 * - stdin: TTY detection and event handling
 * - stdout: Direct write operations
 * - exit: Process termination with codes
 * - error: stderr output for failures
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
 * **Architecture**: Transform CLI args → Context → Router → terminal output.
 * Same routes handle HTTP requests and CLI commands through unified abstractions.
 *
 * **Context Mapping**:
 * - CLI args → URL via ArgsToUrl transformation
 * - stdin data → requestBody (Unix pipe support)
 * - responseBody → stdout content
 * - responseStatusCode → exit code (200-299=0, else=1)
 * - COMMAND method enables route reuse
 *
 * **Performance**: Zero overhead abstraction—direct Node.js I/O primitives.
 * Async stdin reading supports interactive patterns without blocking.
 *
 * @example
 * ```javascript
 * import { Router } from '@raven-js/wings/core';
 * import { Terminal } from '@raven-js/wings/terminal';
 *
 * const router = new Router();
 * router.cmd('/git/status', (ctx) => ctx.text('Clean working tree'));
 * router.cmd('/git/commit', async (ctx) => {
 *   const msg = ctx.queryParams.get('message');
 *   if (!msg) return ctx.status(400).text('Missing message');
 *   await performCommit(msg);
 *   ctx.text('✅ Committed');
 * });
 *
 * await new Terminal(router).run(process.argv.slice(2));
 * ```
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
