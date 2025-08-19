/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com} **Middleware** - Request processing pipeline component. The Middleware class encapsulates a function that can be executed during the request processing pipeline. Middleware can be used for authentication, logging, request/response transformation, error handling, and other cross-cutting concerns. ## Key Features - **Flexible Execution**: Supports both synchronous and asynchronous handlers - **Context Modification**: Can modify the request/response context directly - **Identifier System**: Optional identifiers for duplicate prevention - **Error Propagation**: Errors in middleware are properly propagated - **Type Safety**: Strong typing with JSDoc for better development experience ## Design Philosophy Middleware follows the "chain of responsibility" pattern where each middleware can process the request, modify the context, and optionally pass control to the next middleware in the chain. This allows for modular, reusable request processing logic. **Note**: Middleware handlers receive the context object and can modify it directly. This mutable approach is chosen for performance over immutability.
 */

/**
 *
 * Type definition for middleware handler functions.
 * A middleware handler is a function that receives a Context object and can
 * optionally return a Promise. The handler can modify the context directly
 * or perform side effects like logging, authentication, etc.
 * **Handler Responsibilities**:
 * - Process the request context
 * - Modify context properties as needed
 * - Set responseEnded flag to short-circuit processing
 * - Handle errors appropriately
 */

/**
 * @typedef {function(import('./context.js').Context): (void|Promise<void>)} Handler
 * Middleware handler function that processes requests
 */
export class Middleware {
	/**
	 * The middleware handler function.
	 *
	 * This private field stores the actual function that will be executed
	 * when the middleware runs. The handler receives a Context object and
	 * can modify it directly or perform side effects.
	 *
	 * @type {Handler}
	 */
	#handler;

	/**
	 * Optional identifier for the middleware.
	 *
	 * This identifier can be used to prevent duplicate middleware registration
	 * or to identify specific middleware instances. If null, the middleware
	 * has no identifier and cannot be used for duplicate detection.
	 *
	 * **Use Cases**:
	 * - Preventing duplicate middleware registration
	 * - Identifying middleware for removal or replacement
	 * - Debugging and logging purposes
	 *
	 * @type {string|null}
	 */
	#identifier;

	/**
	 * Creates a new Middleware instance.
	 *
	 * The constructor validates the handler function and normalizes the identifier.
	 * Non-string identifiers are converted to strings, while null remains null.
	 *
	 * **Validation**: The handler must be a function, otherwise an Error is thrown.
	 *
	 * @param {Handler} handler - The middleware handler function
	 * @param {string|null} [identifier=null] - Optional identifier for the middleware
	 *
	 * @throws {Error} When handler is not a function
	 *
	 * @example
	 * ```javascript
	 * // Basic middleware without identifier
	 * const loggingMiddleware = new Middleware((ctx) => {
	 *   console.log(`${ctx.method} ${ctx.path}`);
	 * });
	 *
	 * // Middleware with string identifier
	 * const authMiddleware = new Middleware(async (ctx) => {
	 *   // Authentication logic
	 * }, 'authentication');
	 *
	 * // Middleware with non-string identifier (converted to string)
	 * const rateLimitMiddleware = new Middleware((ctx) => {
	 *   // Rate limiting logic
	 * }, 123); // identifier becomes "123"
	 *
	 * // Error case - invalid handler
	 * try {
	 *   new Middleware('not a function');
	 * } catch (error) {
	 *   console.error(error.message); // "Handler must be a function"
	 * }
	 * ```
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
	 * Returns the function that will be executed when the middleware runs.
	 * This getter provides read-only access to the handler function.
	 *
	 * @returns {Handler} The handler function
	 *
	 * @example
	 * ```javascript
	 * const middleware = new Middleware((ctx) => {
	 *   console.log('Processing request');
	 * });
	 *
	 * const handler = middleware.handler;
	 * console.log(typeof handler); // 'function'
	 *
	 * // Can be used for testing or introspection
	 * if (handler.toString().includes('console.log')) {
	 *   console.log('This middleware includes logging');
	 * }
	 * ```
	 */
	get handler() {
		return this.#handler;
	}

	/**
	 * Gets the middleware identifier.
	 *
	 * Returns the identifier string or null if no identifier was set.
	 * This getter provides read-only access to the identifier.
	 *
	 * @returns {string|null} The identifier or null if not set
	 *
	 * @example
	 * ```javascript
	 * // Middleware with identifier
	 * const authMiddleware = new Middleware((ctx) => {}, 'auth');
	 * console.log(authMiddleware.identifier); // 'auth'
	 *
	 * // Middleware without identifier
	 * const loggingMiddleware = new Middleware((ctx) => {});
	 * console.log(loggingMiddleware.identifier); // null
	 *
	 * // Use identifier for conditional logic
	 * if (middleware.identifier === 'authentication') {
	 *   console.log('This is an authentication middleware');
	 * }
	 * ```
	 */
	get identifier() {
		return this.#identifier;
	}

	/**
	 * Checks if this middleware has the same identifier as another middleware.
	 *
	 * This method is used for duplicate detection and middleware comparison.
	 * Two middleware are considered to have the same identifier if:
	 * - Both have non-null identifiers
	 * - Both identifiers are exactly equal (string comparison)
	 *
	 * **Note**: Middleware with null identifiers are never considered equal,
	 * even if both have null identifiers.
	 *
	 * @param {Middleware} other - The other middleware to compare with
	 * @returns {boolean} True if both middlewares have the same non-null identifier
	 *
	 * @example
	 * ```javascript
	 * const auth1 = new Middleware((ctx) => {}, 'authentication');
	 * const auth2 = new Middleware((ctx) => {}, 'authentication');
	 * const logging = new Middleware((ctx) => {}, 'logging');
	 * const generic = new Middleware((ctx) => {});
	 *
	 * // Same identifier
	 * auth1.hasSameIdentifier(auth2); // true
	 * auth2.hasSameIdentifier(auth1); // true
	 *
	 * // Different identifiers
	 * auth1.hasSameIdentifier(logging); // false
	 * logging.hasSameIdentifier(auth1); // false
	 *
	 * // Null identifiers (never equal)
	 * auth1.hasSameIdentifier(generic); // false
	 * generic.hasSameIdentifier(auth1); // false
	 * generic.hasSameIdentifier(new Middleware((ctx) => {})); // false
	 *
	 * // Invalid parameters
	 * auth1.hasSameIdentifier(null); // false
	 * auth1.hasSameIdentifier({}); // false
	 * auth1.hasSameIdentifier('string'); // false
	 *
	 * // Use for duplicate prevention
	 * function addMiddlewareIfNotExists(middlewareList, newMiddleware) {
	 *   const hasDuplicate = middlewareList.some(existing =>
	 *     existing.hasSameIdentifier(newMiddleware)
	 *   );
	 *
	 *   if (!hasDuplicate) {
	 *     middlewareList.push(newMiddleware);
	 *   }
	 * }
	 * ```
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
	 * This method invokes the middleware handler function, passing the context
	 * object as the first argument. The method supports both synchronous and
	 * asynchronous handlers, always returning a Promise.
	 *
	 * **Execution Flow**:
	 * 1. Validates that ctx is a Context instance
	 * 2. Calls the handler function with the context
	 * 3. Returns a Promise that resolves when the handler completes
	 * 4. Propagates any errors thrown by the handler
	 *
	 * **Error Handling**: Any errors thrown by the handler (synchronous or
	 * asynchronous) are propagated to the caller. This allows middleware
	 * errors to be handled by the calling code.
	 *
	 * @param {import('./context.js').Context} ctx - The request/response context
	 * @returns {Promise<void>} Promise that resolves when the handler completes
	 *
	 * @throws {Error} When ctx is not a Context instance
	 * @throws {*} Any error thrown by the middleware handler
	 *
	 * @example
	 * ```javascript
	 * const middleware = new Middleware((ctx) => {
	 *   console.log(`Processing ${ctx.method} request to ${ctx.path}`);
	 *   ctx.data.processedAt = new Date().toISOString();
	 * });
	 *
	 * const url = new URL('http://localhost/api/users');
	 * const ctx = new Context('GET', url, new Headers());
	 *
	 * // Execute middleware
	 * await middleware.execute(ctx);
	 * console.log(ctx.data.processedAt); // ISO timestamp
	 *
	 * // Async middleware
	 * const asyncMiddleware = new Middleware(async (ctx) => {
	 *   await new Promise(resolve => setTimeout(resolve, 100));
	 *   ctx.data.asyncProcessed = true;
	 * });
	 *
	 * await asyncMiddleware.execute(ctx);
	 * console.log(ctx.data.asyncProcessed); // true
	 *
	 * // Error handling
	 * const errorMiddleware = new Middleware((ctx) => {
	 *   throw new Error('Middleware error');
	 * });
	 *
	 * try {
	 *   await errorMiddleware.execute(ctx);
	 * } catch (error) {
	 *   console.error('Middleware failed:', error.message);
	 * }
	 *
	 * // Invalid context
	 * try {
	 *   await middleware.execute(null);
	 * } catch (error) {
	 *   console.error(error.message); // "Context must be a Context instance"
	 * }
	 * ```
	 */
	async execute(ctx) {
		// Validate that ctx is a Context instance
		if (!ctx || typeof ctx !== "object" || ctx.constructor.name !== "Context") {
			throw new Error("Context must be a Context instance");
		}

		return await this.#handler(ctx);
	}
}
