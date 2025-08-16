/**
 * @typedef {((ctx: import('./context.js').Context) => void | Promise<void>)} Handler
 */

/**
 * Represents a middleware function with optional identifier.
 *
 * Middleware functions are executed before the actual route handler
 * and can modify the request/response context or perform side effects.
 */
export class Middleware {
	/**
	 * The middleware handler function.
	 *
	 * @type {Handler}
	 */
	#handler;

	/**
	 * Optional identifier for the middleware.
	 * Used to prevent duplicate middleware registration.
	 *
	 * @type {string|null}
	 */
	#identifier;

	/**
	 * Creates a new Middleware instance.
	 *
	 * @param {Handler} handler - The middleware handler function
	 * @param {string|null} [identifier=null] - Optional identifier for the middleware
	 */
	constructor(handler, identifier = null) {
		if (typeof handler !== "function") {
			throw new Error("Handler must be a function");
		}

		this.#handler = handler;
		// Convert non-string identifiers to strings, but keep null as null
		this.#identifier = identifier !== null ? String(identifier) : null;
	}

	/**
	 * Gets the middleware handler function.
	 *
	 * @returns {Handler} The handler function
	 */
	get handler() {
		return this.#handler;
	}

	/**
	 * Gets the middleware identifier.
	 *
	 * @returns {string|null} The identifier or null if not set
	 */
	get identifier() {
		return this.#identifier;
	}

	/**
	 * Checks if this middleware has the same identifier as another middleware.
	 *
	 * @param {Middleware} other - The other middleware to compare with
	 * @returns {boolean} True if both middlewares have the same non-null identifier
	 */
	hasSameIdentifier(other) {
		// Validate that other is a Middleware instance
		if (!other || typeof other !== "object" || !(other instanceof Middleware)) {
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
	 * @param {import('./context.js').Context} ctx - The request/response context
	 * @returns {Promise<void>} Promise that resolves when the handler completes
	 */
	async execute(ctx) {
		// Validate that ctx is a Context instance
		if (!ctx || typeof ctx !== "object" || ctx.constructor.name !== "Context") {
			throw new Error("Context must be a Context instance");
		}

		return await this.#handler(ctx);
	}
}
