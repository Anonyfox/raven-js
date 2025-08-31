/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Request processing middleware class with handler functions and identifier system.
 *
 * Provides the Middleware class for encapsulating request processing functions that can be executed
 * during the request pipeline. Supports both synchronous and asynchronous handlers with optional identifiers.
 */

import { Context } from "./context.js";
import { MESSAGES } from "./string-pool.js";

/**
 * Handler function that processes requests and can modify context.
 */

/**
 * @typedef {function(import('./context.js').Context): (void|Promise<void>)} Handler
 * Middleware handler function that processes requests
 *
 * @example
 * // Basic handler function
 * const handler = (ctx) => {
 *   console.log(`${ctx.method} ${ctx.path}`);
 * };
 *
 * @example
 * // Async handler with context modification
 * const asyncHandler = async (ctx) => {
 *   const user = await authenticate(ctx);
 *   ctx.user = user;
 * };
 */

/**
 * Middleware wrapper for handler functions with optional identifier.
 *
 * @example
 * // Create middleware with handler
 * const logger = new Middleware((ctx) => console.log(ctx.path));
 *
 * @example
 * // Middleware with identifier for deduplication
 * const auth = new Middleware(authHandler, 'auth');
 * router.use(auth);
 */
export class Middleware {
	/**
	 * The middleware handler function.
	 *
	 * @type {Handler}
	 */
	#handler;

	/**
	 * Optional identifier for middleware identification and duplicate prevention.
	 *
	 * @type {string|null}
	 */
	#identifier;

	/**
	 * Creates a new Middleware instance.
	 *
	 * Validates the handler function and normalizes the identifier.
	 * Non-string identifiers are converted to strings.
	 *
	 * @param {Handler} handler - The middleware handler function
	 * @param {string|null} [identifier=null] - Optional identifier for the middleware
	 * @throws {Error} When handler is not a function
	 *
	 * @example
	 * // Basic middleware
	 * const logging = new Middleware((ctx) => console.log(ctx.method));
	 *
	 * @example
	 * // With identifier
	 * const auth = new Middleware(authHandler, 'authentication');
	 */
	constructor(handler, identifier = null) {
		if (typeof handler !== "function") {
			throw new Error(MESSAGES.HANDLER_REQUIRED);
		}

		this.#handler = handler;
		// Convert non-string identifiers to strings, but keep null as null
		this.#identifier = identifier !== null ? String(identifier) : null;
	}

	/**
	 * Gets the middleware handler function.
	 *
	 * @returns {Handler} The handler function
	 *
	 * @example
	 * // Access handler function
	 * const middleware = new Middleware(myHandler);
	 * const handler = middleware.handler;
	 * await handler(ctx);
	 */
	get handler() {
		return this.#handler;
	}

	/**
	 * Gets the middleware identifier.
	 *
	 * @returns {string|null} The identifier or null if not set
	 *
	 * @example
	 * // Check middleware identifier
	 * const auth = new Middleware(authHandler, 'auth');
	 * console.log(auth.identifier); // 'auth'
	 *
	 * @example
	 * // No identifier
	 * const logger = new Middleware(logHandler);
	 * console.log(logger.identifier); // null
	 */
	get identifier() {
		return this.#identifier;
	}

	/**
	 * Checks if this middleware has the same identifier as another middleware.
	 *
	 * Used for duplicate detection. Both must have non-null identifiers that match.
	 * Middleware with null identifiers are never considered equal.
	 *
	 * @param {Middleware} other - The other middleware to compare with
	 * @returns {boolean} True if both middlewares have the same non-null identifier
	 *
	 * @example
	 * // Same identifier
	 * auth1.hasSameIdentifier(auth2); // true if both have same identifier
	 *
	 * @example
	 * // Null identifiers
	 * generic1.hasSameIdentifier(generic2); // false (null identifiers never equal)
	 */
	hasSameIdentifier(other) {
		// Validate middleware type
		if (
			!other ||
			typeof other !== "object" ||
			other.constructor.name !== "Middleware"
		) {
			return false;
		}

		// If either identifier is null, they're not the same
		if (this.#identifier === null || other.identifier === null) {
			return false;
		}

		return this.#identifier === other.identifier;
	}

	/**
	 * Executes the middleware handler with the given context.
	 *
	 * Validates the context and invokes the handler function. Supports both
	 * synchronous and asynchronous handlers, always returning a Promise.
	 *
	 * @param {import('./context.js').Context} ctx - The request/response context
	 * @returns {Promise<void>} Promise that resolves when the handler completes
	 * @throws {Error} When ctx is not a Context instance
	 * @throws {*} Any error thrown by the middleware handler
	 *
	 * @example
	 * // Execute middleware
	 * await middleware.execute(ctx);
	 *
	 * @example
	 * // Error handling
	 * try {
	 *   await middleware.execute(ctx);
	 * } catch (error) {
	 *   console.error('Middleware failed:', error.message);
	 * }
	 */
	async execute(ctx) {
		// Validate context type
		if (!ctx || !(ctx instanceof Context)) {
			throw new Error("Context must be a Context instance");
		}

		return await this.#handler(ctx);
	}
}
