/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com} Terminal runtime that enables CLI command execution through the Wings routing system. This creates a unified interface where the same routes and middleware can handle both HTTP requests and CLI commands.
 */

import { Context } from "../core/index.js";
import { ArgsToUrl } from "./transform-pattern.js";

/**
 * @packageDocumentation
 *
 * **Terminal** - CLI command execution runtime for Wings.
 * The Terminal class provides a lean, fast runtime that executes CLI commands
 * through the Wings routing system. It transforms command-line arguments into
 * HTTP-like Context objects, routes them through the same middleware pipeline,
 * and interprets the results for terminal output.
 * ## Key Features
 * - **Unified Routing**: Same routes and middleware for HTTP and CLI
 * - **Context Reuse**: Leverages existing Context abstraction
 * - **Platform Primitives**: Uses Node.js built-ins for stdin/stdout
 * - **Zero Dependencies**: Pure JavaScript with no external dependencies
 * - **Async Support**: Full support for interactive CLI commands
 * ## Design Philosophy
 * The Terminal runtime follows the Raven principle of "platform mastery over
 * abstraction layers" by reusing the existing HTTP abstractions but interpreting
 * them through CLI platform primitives.
 * **Context Mapping**:
 * - `responseBody` → stdout content
 * - `responseStatusCode` → exit code (200-299 = 0, others = 1)
 * - `responseHeaders` → ignored (CLI doesn't need headers)
 * - `requestBody` → stdin input (if piped)
 * ```javascript
 * import { Router } from '@raven-js/wings/core';
 * import { Terminal } from '@raven-js/wings/terminal';
 * // Create router with command routes
 * const router = new Router();
 * router.cmd('/git/status', (ctx) => {
 * ctx.text('On branch main\nnothing to commit, working tree clean');
 * });
 * router.cmd('/git/commit', async (ctx) => {
 * const message = ctx.queryParams.get('message');
 * if (!message) {
 * ctx.responseStatusCode = 400;
 * ctx.text('Error: commit message required');
 * return;
 * }
 * await performCommit(message);
 * ctx.text('✅ Committed successfully');
 * });
 * // Create and run terminal
 * const terminal = new Terminal(router);
 * await terminal.run(process.argv.slice(2));
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
	 * Create a new Terminal runtime instance.
	 *
	 * @param {import('../core/router.js').Router} router - Wings router to handle commands
	 * @throws {TypeError} When router is invalid
	 *
	 * @example
	 * ```javascript
	 * import { Router } from '@raven-js/wings/core';
	 * import { Terminal } from '@raven-js/wings/terminal';
	 *
	 * const router = new Router();
	 * router.cmd('/hello', (ctx) => ctx.text('Hello World!'));
	 *
	 * const terminal = new Terminal(router);
	 * ```
	 */
	constructor(router) {
		if (!router || typeof router.handleRequest !== "function") {
			throw new TypeError("Router must be a valid Wings Router instance");
		}
		this.#router = router;
	}

	/**
	 * Execute a CLI command through the router.
	 *
	 * This method transforms CLI arguments into a Context object, routes it
	 * through the Wings router, and interprets the results for terminal output.
	 * It handles stdout/stderr output and sets appropriate exit codes.
	 *
	 * **Process Flow**:
	 * 1. Transform CLI args to URL using ArgsToUrl
	 * 2. Detect stdin input (if piped)
	 * 3. Create Context with COMMAND method
	 * 4. Route through Wings router with middleware
	 * 5. Write responseBody to stdout
	 * 6. Set exit code based on responseStatusCode
	 *
	 * **Exit Code Mapping**:
	 * - HTTP 200-299 → exit code 0 (success)
	 * - HTTP 400+ → exit code 1 (error)
	 *
	 * @param {string[]} args - Command line arguments
	 * @returns {Promise<void>} Resolves when command execution completes
	 *
	 * @example
	 * ```javascript
	 * // Execute: myapp git commit --message "Initial commit"
	 * const args = ['git', 'commit', '--message', 'Initial commit'];
	 * await terminal.run(args);
	 * ```
	 */
	async run(args) {
		try {
			// Transform CLI args to URL
			const url = ArgsToUrl(args);
			const urlObj = new URL(url, "file://localhost");

			// Detect stdin input
			const stdinData = process.stdin.isTTY ? null : await this.#readStdin();

			// Create Context for COMMAND method
			const context = new Context("COMMAND", urlObj, new Headers(), stdinData);

			// Route through Wings router
			await this.#router.handleRequest(context);

			// Output to terminal
			if (context.responseBody) {
				process.stdout.write(context.responseBody);
			}

			// Set exit code based on HTTP status
			const exitCode =
				context.responseStatusCode >= 200 && context.responseStatusCode < 300
					? 0
					: 1;
			process.exit(exitCode);
		} catch (error) {
			// Handle unexpected errors
			console.error(`Error: ${error.message}`);
			process.exit(1);
		}
	}

	/**
	 * Read stdin input for piped data.
	 *
	 * This method reads all data from stdin when it's available (not a TTY).
	 * It's used to support Unix pipe patterns like `echo "data" | myapp process`.
	 *
	 * @returns {Promise<Buffer|null>} stdin data or null if TTY

	 */
	async #readStdin() {
		return new Promise((resolve) => {
			/** @type {Buffer[]} */
			const chunks = [];

			process.stdin.on("data", (chunk) => {
				chunks.push(chunk);
			});

			process.stdin.on("end", () => {
				resolve(chunks.length > 0 ? Buffer.concat(chunks) : null);
			});

			// Handle cases where stdin is immediately available
			process.stdin.on("error", () => {
				resolve(null);
			});
		});
	}

	/**
	 * Get the Wings router instance.
	 *
	 * @returns {import('../core/router.js').Router} Wings router
	 */
	get router() {
		return this.#router;
	}
}
