/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 *
 * HTTP request/response context and lifecycle management
 */

import { isValidHttpMethod } from "./http-methods.js";

/**
 * **Context** - The core HTTP request/response lifecycle abstraction.
 *
 * This class provides a unified interface for handling HTTP requests and responses
 * in an isomorphic manner - working both on the server and in the browser. It
 * encapsulates all request data (headers, body, query params, path params) and
 * provides convenient methods for building responses.
 *
 * ## Key Features
 * - **Isomorphic**: Works in both Node.js and browser environments
 * - **Middleware Support**: Before/after callback system for request processing
 * - **Type Safety**: Private fields with controlled access via getters/methods
 * - **Automatic Parsing**: JSON and form data parsing based on content-type
 * - **Response Helpers**: Convenient methods for common response types
 * - **Method Chaining**: Fluent API for building responses
 *
 * ## Design Philosophy
 * The Context class follows a mutable-by-design approach for performance reasons.
 * Instead of creating new instances for each middleware step, the same context
 * object is passed through the entire request lifecycle. This reduces memory
 * allocation and garbage collection pressure in high-throughput scenarios.
 *
 * ## Security Considerations
 * - Path length is limited to 2048 characters to prevent DoS attacks
 * - Path segments are limited to 100 to prevent CPU exhaustion
 * - All header keys are normalized to lowercase for consistency
 * - Input validation occurs at construction time
 *
 * @example
 * ```javascript
 * // Create a context from a request
 * const url = new URL('https://api.example.com/users/123?page=1');
 * const headers = new Headers({ 'content-type': 'application/json' });
 * const body = Buffer.from('{"name":"John"}');
 * const ctx = new Context('POST', url, headers, body);
 *
 * // Access request data
 * console.log(ctx.method); // 'POST'
 * console.log(ctx.path); // '/users/123'
 * console.log(ctx.requestBody()); // { name: 'John' }
 * console.log(ctx.queryParams.get('page')); // '1'
 *
 * // Build a response
 * ctx.json({ success: true, user: ctx.requestBody() });
 * ```
 *
 * @example
 * ```javascript
 * // Using middleware callbacks
 * const authMiddleware = new Middleware(async (ctx) => {
 *   const token = ctx.requestHeaders.get('authorization');
 *   if (!token) {
 *     ctx.notFound('Unauthorized');
 *     return;
 *   }
 *   ctx.data.user = await validateToken(token);
 * });
 *
 * ctx.addBeforeCallback(authMiddleware);
 * await ctx.runBeforeCallbacks();
 *
 * // Handler logic here...
 *
 * await ctx.runAfterCallbacks();
 * ```
 */
export class Context {
	#requestHeaders = new Headers();

	/**
	 * HTTP Headers of the request.
	 *
	 * Returns the complete Headers object containing all request headers.
	 * All header keys are normalized to lowercase for consistent access.
	 *
	 * **Note**: While the Headers object is returned directly, modifications
	 * to request headers after construction are generally discouraged as they
	 * may affect middleware behavior and request integrity.
	 *
	 * @returns {Headers} The request headers object
	 *
	 * @example
	 * ```javascript
	 * // Access request headers
	 * const contentType = ctx.requestHeaders.get('content-type');
	 * const authToken = ctx.requestHeaders.get('authorization');
	 *
	 * // Check if header exists
	 * if (ctx.requestHeaders.has('x-api-key')) {
	 *   // Handle API key authentication
	 * }
	 *
	 * // Iterate over all headers
	 * for (const [key, value] of ctx.requestHeaders.entries()) {
	 *   console.log(`${key}: ${value}`);
	 * }
	 * ```
	 */
	get requestHeaders() {
		return this.#requestHeaders;
	}

	/**
	 * The unparsed body of the request, if existing.
	 *
	 * Note: All keys are lowercased to make working with it easier.
	 *
	 * @type {Buffer|null}
	 */
	#requestBody = null;

	/**
	 * Parses and returns the request body based on the content-type header.
	 *
	 * This method automatically handles different content types:
	 * - `application/json`: Parses as JSON object/array
	 * - `application/x-www-form-urlencoded`: Parses as plain object
	 * - Other types: Returns raw Buffer
	 *
	 * **Performance Note**: Parsing occurs on each call. For high-performance
	 * scenarios, consider caching the result if the body is accessed multiple times.
	 *
	 * **Error Handling**: JSON parsing errors are thrown as SyntaxError.
	 * Form data parsing is lenient and handles malformed input gracefully.
	 *
	 * @returns {Object|Array<*>|Buffer|null} The parsed body or null if no body exists
	 *
	 * @throws {SyntaxError} When JSON content-type is specified but body is malformed
	 *
	 * @example
	 * ```javascript
	 * // JSON body
	 * // Content-Type: application/json
	 * // Body: {"name":"John","age":30}
	 * const body = ctx.requestBody();
	 * console.log(body.name); // "John"
	 * console.log(body.age); // 30
	 *
	 * // Form data body
	 * // Content-Type: application/x-www-form-urlencoded
	 * // Body: name=John&age=30&active=true
	 * const formData = ctx.requestBody();
	 * console.log(formData.name); // "John"
	 * console.log(formData.age); // "30" (string)
	 * console.log(formData.active); // "true" (string)
	 *
	 * // Raw body (other content types)
	 * // Content-Type: application/octet-stream
	 * // Body: [binary data]
	 * const rawBody = ctx.requestBody();
	 * console.log(Buffer.isBuffer(rawBody)); // true
	 * console.log(rawBody.toString()); // string representation
	 *
	 * // No body
	 * const emptyBody = ctx.requestBody();
	 * console.log(emptyBody); // null
	 * ```
	 */
	requestBody() {
		if (!this.#requestBody) return null;
		const ct = this.requestHeaders.get("content-type");
		if (!ct) return this.#requestBody;

		const contentType = ct.toLowerCase();
		if (contentType.includes("application/json")) {
			const jsonString = this.#requestBody.toString("utf8");
			return jsonString.trim() === "" ? null : JSON.parse(jsonString);
		}
		if (contentType.includes("application/x-www-form-urlencoded")) {
			const formString = this.#requestBody.toString("utf8");
			return formString.trim() === ""
				? {}
				: Object.fromEntries(new URLSearchParams(formString));
		}
		return this.#requestBody;
	}

	/**
	 * Named path parameters extracted from the URL path.
	 *
	 * This object contains key-value pairs where keys are parameter names
	 * (without the `:` prefix) and values are the actual path segments.
	 * Path parameters are typically set by the router when matching routes
	 * with parameter placeholders.
	 *
	 * **Note**: All values are strings, even if they represent numbers.
	 * Convert to appropriate types as needed in your handlers.
	 *
	 * @type {Object.<string, string>}
	 *
	 * @example
	 * ```javascript
	 * // Route: /users/:id/posts/:postId
	 * // URL: /users/123/posts/456
	 * console.log(ctx.pathParams.id); // "123"
	 * console.log(ctx.pathParams.postId); // "456"
	 *
	 * // Route: /products/:category/:productId
	 * // URL: /products/electronics/laptop-123
	 * console.log(ctx.pathParams.category); // "electronics"
	 * console.log(ctx.pathParams.productId); // "laptop-123"
	 *
	 * // Convert string to number if needed
	 * const userId = parseInt(ctx.pathParams.id, 10);
	 * const postId = Number(ctx.pathParams.postId);
	 * ```
	 */
	pathParams = {};

	#queryParams = new URLSearchParams();

	/**
	 * Query parameters parsed from the URL.
	 *
	 * Returns a URLSearchParams object containing all query string parameters.
	 * This provides a standard interface for accessing and manipulating query
	 * parameters with built-in URL encoding/decoding.
	 *
	 * **Note**: While the URLSearchParams object is returned directly, modifications
	 * to query parameters after construction are generally discouraged as they
	 * may affect middleware behavior and request integrity.
	 *
	 * @type {URLSearchParams}
	 *
	 * @example
	 * ```javascript
	 * // Access query parameters
	 * const page = ctx.queryParams.get('page'); // "1"
	 * const limit = ctx.queryParams.get('limit'); // "10"
	 *
	 * // Check if parameter exists
	 * if (ctx.queryParams.has('search')) {
	 *   const searchTerm = ctx.queryParams.get('search');
	 *   // Handle search functionality
	 * }
	 *
	 * // Get all values for a parameter (if multiple)
	 * const tags = ctx.queryParams.getAll('tag'); // ["js", "api", "web"]
	 *
	 * // Iterate over all parameters
	 * for (const [key, value] of ctx.queryParams.entries()) {
	 *   console.log(`${key}: ${value}`);
	 * }
	 *
	 * // URL: /users?page=1&limit=10&search=john&tag=js&tag=api
	 * // Results in:
	 * // page: "1"
	 * // limit: "10"
	 * // search: "john"
	 * // tag: "js" (first occurrence)
	 * // tag: "api" (second occurrence)
	 * ```
	 */
	get queryParams() {
		return this.#queryParams;
	}

	#method = "";

	/**
	 * The HTTP method of the request in uppercase.
	 *
	 * Returns the normalized HTTP method (GET, POST, PUT, DELETE, etc.)
	 * as a string. The method is validated during construction to ensure
	 * it's a valid HTTP method.
	 *
	 * @type {string}
	 *
	 * @example
	 * ```javascript
	 * // Check request method
	 * if (ctx.method === 'GET') {
	 *   // Handle GET request
	 * } else if (ctx.method === 'POST') {
	 *   // Handle POST request
	 * }
	 *
	 * // Method validation
	 * const allowedMethods = ['GET', 'POST', 'PUT'];
	 * if (!allowedMethods.includes(ctx.method)) {
	 *   ctx.error('Method not allowed');
	 *   return;
	 * }
	 * ```
	 */
	get method() {
		return this.#method;
	}

	#path = "";

	/**
	 * The URL path of the request.
	 *
	 * Returns the normalized path from the request URL. The path is validated
	 * during construction with security limits to prevent DoS attacks:
	 * - Maximum length: 2048 characters
	 * - Maximum segments: 100 segments
	 *
	 * **Note**: Trailing slashes are preserved as they can be significant
	 * for routing purposes.
	 *
	 * @type {string}
	 *
	 * @example
	 * ```javascript
	 * // Access the request path
	 * console.log(ctx.path); // "/users/123/posts"
	 *
	 * // Path-based routing logic
	 * if (ctx.path.startsWith('/api/')) {
	 *   // Handle API routes
	 * } else if (ctx.path.startsWith('/admin/')) {
	 *   // Handle admin routes
	 * }
	 *
	 * // Path validation
	 * if (ctx.path.length > 100) {
	 *   ctx.error('Path too long');
	 *   return;
	 * }
	 * ```
	 */
	get path() {
		return this.#path;
	}

	/**
	 * HTTP Headers to send in the response.
	 *
	 * A mutable Headers object that allows setting response headers.
	 * All header keys are automatically normalized to lowercase for consistency.
	 *
	 * **Common Headers**: Content-Type, Content-Length, Cache-Control,
	 * Set-Cookie, Location (for redirects), etc.
	 *
	 * @type {Headers}
	 *
	 * @example
	 * ```javascript
	 * // Set response headers
	 * ctx.responseHeaders.set('content-type', 'application/json');
	 * ctx.responseHeaders.set('cache-control', 'no-cache');
	 * ctx.responseHeaders.set('x-custom-header', 'value');
	 *
	 * // Set multiple headers
	 * ctx.responseHeaders.set('access-control-allow-origin', '*');
	 * ctx.responseHeaders.set('access-control-allow-methods', 'GET, POST, PUT');
	 *
	 * // Check if header is set
	 * if (!ctx.responseHeaders.has('content-type')) {
	 *   ctx.responseHeaders.set('content-type', 'text/plain');
	 * }
	 * ```
	 */
	responseHeaders = new Headers();

	/**
	 * The body content to return in the HTTP response.
	 *
	 * Can be a string, Buffer, or null. The content type should be set
	 * via the responseHeaders to ensure proper interpretation by the client.
	 *
	 * **Note**: For large responses, consider using streams instead of
	 * setting the entire body in memory.
	 *
	 * @type {string|Buffer|null}
	 *
	 * @example
	 * ```javascript
	 * // Set string response body
	 * ctx.responseBody = "Hello, World!";
	 *
	 * // Set Buffer response body (for binary data)
	 * ctx.responseBody = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header
	 *
	 * // Set JSON response body
	 * ctx.responseBody = JSON.stringify({ success: true, data: [] });
	 *
	 * // Clear response body
	 * ctx.responseBody = null;
	 * ```
	 */
	responseBody = null;

	/**
	 * The HTTP status code to return in the response.
	 *
	 * Defaults to 200 (OK). Common status codes:
	 * - 2xx: Success (200, 201, 204)
	 * - 3xx: Redirection (301, 302, 304)
	 * - 4xx: Client Error (400, 401, 403, 404, 422)
	 * - 5xx: Server Error (500, 502, 503)
	 *
	 * @type {number}
	 *
	 * @example
	 * ```javascript
	 * // Set success status codes
	 * ctx.responseStatusCode = 200; // OK
	 * ctx.responseStatusCode = 201; // Created
	 * ctx.responseStatusCode = 204; // No Content
	 *
	 * // Set error status codes
	 * ctx.responseStatusCode = 400; // Bad Request
	 * ctx.responseStatusCode = 401; // Unauthorized
	 * ctx.responseStatusCode = 404; // Not Found
	 * ctx.responseStatusCode = 500; // Internal Server Error
	 *
	 * // Use with response helpers
	 * ctx.notFound(); // Sets 404
	 * ctx.error(); // Sets 500
	 * ```
	 */
	responseStatusCode = 200;

	/**
	 * Flag indicating whether the response has been finalized.
	 *
	 * When set to `true`, this prevents further processing of the request:
	 * - Stops execution of remaining before callbacks
	 * - Skips the main handler execution
	 * - Still allows after callbacks to run (for cleanup/logging)
	 *
	 * This flag is typically set by middleware that needs to short-circuit
	 * the request processing (e.g., authentication failures, rate limiting).
	 *
	 * @type {boolean}
	 *
	 * @example
	 * ```javascript
	 * // Authentication middleware
	 * const authMiddleware = new Middleware((ctx) => {
	 *   const token = ctx.requestHeaders.get('authorization');
	 *   if (!token) {
	 *     ctx.responseStatusCode = 401;
	 *     ctx.responseBody = 'Unauthorized';
	 *     ctx.responseEnded = true; // Stop processing
	 *     return;
	 *   }
	 *   // Continue processing...
	 * });
	 *
	 * // Rate limiting middleware
	 * const rateLimitMiddleware = new Middleware((ctx) => {
	 *   if (isRateLimited(ctx)) {
	 *     ctx.responseStatusCode = 429;
	 *     ctx.responseBody = 'Too Many Requests';
	 *     ctx.responseEnded = true; // Stop processing
	 *     return;
	 *   }
	 * });
	 * ```
	 */
	responseEnded = false;

	/**
	 * Custom data container for storing request-scoped state.
	 *
	 * This object allows middleware and handlers to share data throughout
	 * the request lifecycle. Common use cases include:
	 * - Storing authenticated user information
	 * - Passing data between middleware
	 * - Caching parsed request data
	 * - Storing request metadata
	 *
	 * **Note**: This data is request-scoped and will be garbage collected
	 * after the request completes.
	 *
	 * @type {Object.<string, any>}
	 *
	 * @example
	 * ```javascript
	 * // Authentication middleware
	 * const authMiddleware = new Middleware(async (ctx) => {
	 *   const token = ctx.requestHeaders.get('authorization');
	 *   if (token) {
	 *     ctx.data.user = await validateToken(token);
	 *     ctx.data.isAuthenticated = true;
	 *   }
	 * });
	 *
	 * // Handler using stored data
	 * const userHandler = (ctx) => {
	 *   if (ctx.data.isAuthenticated) {
	 *     ctx.json({ user: ctx.data.user, message: 'Welcome!' });
	 *   } else {
	 *     ctx.notFound('Please login');
	 *   }
	 * };
	 *
	 * // Caching parsed data
	 * const cacheMiddleware = new Middleware((ctx) => {
	 *   if (!ctx.data.parsedBody) {
	 *     ctx.data.parsedBody = ctx.requestBody();
	 *   }
	 * });
	 *
	 * // Logging middleware
	 * const loggingMiddleware = new Middleware((ctx) => {
	 *   ctx.data.startTime = Date.now();
	 *   ctx.data.requestId = generateRequestId();
	 * });
	 * ```
	 */
	data = {};

	/**
	 * Collection of errors that occurred during the request lifecycle.
	 *
	 * This array stores any errors that occur during middleware execution,
	 * route handler execution, or after-callback execution. Errors are
	 * collected instead of immediately thrown, allowing the complete
	 * request lifecycle (including after callbacks like logging) to run.
	 *
	 * **Error Collection Flow**:
	 * 1. Errors from before callbacks are collected here
	 * 2. Errors from route handlers are collected here
	 * 3. After callbacks always run (for logging, cleanup, etc.)
	 * 4. Middleware (like logger) can consume errors by clearing this array
	 * 5. Any remaining errors are printed to console.error as fallback
	 *
	 * **Use Cases**:
	 * - Logging errors via after-callback middleware
	 * - Collecting multiple validation errors
	 * - Ensuring cleanup code runs even when handlers fail
	 * - Providing detailed error context for debugging
	 *
	 * @type {Error[]}
	 *
	 * @example
	 * ```javascript
	 * // Middleware can check for and consume errors
	 * const loggingMiddleware = new Middleware((ctx) => {
	 *   if (ctx.errors.length > 0) {
	 *     console.error(`Request failed with ${ctx.errors.length} error(s):`);
	 *     ctx.errors.forEach((error, index) => {
	 *       console.error(`Error ${index + 1}:`, error.message);
	 *     });
	 *     // Consume the errors after logging them
	 *     ctx.errors.length = 0;
	 *   }
	 * });
	 *
	 * // Handlers can add custom errors
	 * const validationHandler = (ctx) => {
	 *   const data = ctx.requestBody();
	 *   if (!data.email) {
	 *     ctx.errors.push(new Error('Email is required'));
	 *   }
	 *   if (!data.password) {
	 *     ctx.errors.push(new Error('Password is required'));
	 *   }
	 * };
	 * ```
	 */
	errors = [];

	/**
	 * Checks if the current response represents a "not found" condition.
	 *
	 * This helper method determines if the request resulted in a 404 Not Found
	 * response, which is useful for conditional logic in middleware (like logging)
	 * that needs to handle 404s differently from other responses.
	 *
	 * **Use Cases**:
	 * - Logging middleware formatting 404s differently (e.g., yellow vs red)
	 * - Analytics middleware tracking 404 patterns
	 * - Custom error pages or redirect logic
	 * - Conditional response transformation
	 *
	 * @returns {boolean} True if the response status code is 404
	 *
	 * @example
	 * ```javascript
	 * // In logging middleware
	 * const loggingMiddleware = new Middleware((ctx) => {
	 *   if (ctx.isNotFound()) {
	 *     console.log(`⚠️  404 Not Found: ${ctx.method} ${ctx.path}`);
	 *   } else if (ctx.errors.length > 0) {
	 *     console.log(`❌ Error: ${ctx.method} ${ctx.path}`);
	 *   } else {
	 *     console.log(`✅ Success: ${ctx.method} ${ctx.path}`);
	 *   }
	 * });
	 *
	 * // In analytics middleware
	 * const analyticsMiddleware = new Middleware((ctx) => {
	 *   if (ctx.isNotFound()) {
	 *     trackMissingRoute(ctx.path);
	 *   }
	 * });
	 *
	 * // In custom error page middleware
	 * const errorPageMiddleware = new Middleware((ctx) => {
	 *   if (ctx.isNotFound()) {
	 *     ctx.html('<h1>Page Not Found</h1><p>The requested page does not exist.</p>');
	 *   }
	 * });
	 * ```
	 */
	isNotFound() {
		return this.responseStatusCode === 404;
	}

	/**
	 * Internal list of middleware instances to execute before the main handler.
	 *
	 * These middleware are executed in FIFO order (first added, first executed).
	 * Each middleware receives the current context instance and can modify it directly.
	 *
	 * **Design Note**: Using a mutable context object instead of creating new instances
	 * for each middleware step provides better performance by reducing memory allocation
	 * and garbage collection pressure in high-throughput scenarios.
	 *
	 * @type {import('./middleware.js').Middleware[]}
	 */
	#beforeCallbacks = [];

	/**
	 * Adds a middleware instance to the before-callback queue.
	 *
	 * The middleware will be executed before the main handler in FIFO order.
	 * If the `responseEnded` flag is already set to `true`, the middleware
	 * will not be executed when `runBeforeCallbacks()` is called.
	 *
	 * **Execution Order**: Middleware added first will be executed first.
	 *
	 * @param {import('./middleware.js').Middleware} middleware - The middleware instance to add
	 *
	 * @example
	 * ```javascript
	 * // Add authentication middleware
	 * const authMiddleware = new Middleware(async (ctx) => {
	 *   const token = ctx.requestHeaders.get('authorization');
	 *   if (!token) {
	 *     ctx.notFound('Unauthorized');
	 *     return;
	 *   }
	 *   ctx.data.user = await validateToken(token);
	 * });
	 *
	 * ctx.addBeforeCallback(authMiddleware);
	 *
	 * // Add logging middleware
	 * const loggingMiddleware = new Middleware((ctx) => {
	 *   console.log(`${ctx.method} ${ctx.path} - ${new Date().toISOString()}`);
	 * });
	 *
	 * ctx.addBeforeCallback(loggingMiddleware);
	 *
	 * // Execute all before callbacks
	 * await ctx.runBeforeCallbacks();
	 * ```
	 */
	addBeforeCallback(middleware) {
		this.#beforeCallbacks.push(middleware);
	}

	/**
	 * Adds multiple middleware instances to the before-callback queue.
	 *
	 * Middleware are added in the order provided and will be executed
	 * in FIFO order when `runBeforeCallbacks()` is called.
	 *
	 * **Performance Note**: This is more efficient than calling `addBeforeCallback()`
	 * multiple times as it avoids repeated array operations.
	 *
	 * @param {import('./middleware.js').Middleware[]} middlewares - Array of middleware instances to add
	 *
	 * @example
	 * ```javascript
	 * // Create multiple middleware
	 * const authMiddleware = new Middleware(async (ctx) => {
	 *   // Authentication logic
	 * });
	 *
	 * const loggingMiddleware = new Middleware((ctx) => {
	 *   // Logging logic
	 * });
	 *
	 * const corsMiddleware = new Middleware((ctx) => {
	 *   // CORS logic
	 * });
	 *
	 * // Add all middleware at once
	 * ctx.addBeforeCallbacks([corsMiddleware, loggingMiddleware, authMiddleware]);
	 *
	 * // Execute in order: cors -> logging -> auth
	 * await ctx.runBeforeCallbacks();
	 * ```
	 */
	addBeforeCallbacks(middlewares) {
		for (const middleware of middlewares) {
			this.addBeforeCallback(middleware);
		}
	}

	/**
	 * Executes all before-callbacks in FIFO order.
	 *
	 * This method processes each middleware in the queue sequentially, waiting
	 * for each to complete before proceeding to the next. Middleware are removed
	 * from the queue as they are executed (consumed).
	 *
	 * **Execution Flow**:
	 * 1. Process middleware in order they were added
	 * 2. Wait for each middleware to complete (supports async middleware)
	 * 3. Remove middleware from queue after execution
	 * 4. Stop if `responseEnded` becomes `true`
	 *
	 * **Dynamic Middleware**: Middleware can add more middleware during execution,
	 * enabling complex conditional logic and dynamic request processing.
	 *
	 * **Error Handling**: If any middleware throws an error, execution stops
	 * and the error is propagated to the caller.
	 *
	 * @returns {Promise<void>} Resolves when all before-callbacks complete
	 *
	 * @example
	 * ```javascript
	 * // Basic usage
	 * await ctx.runBeforeCallbacks();
	 *
	 * // With error handling
	 * try {
	 *   await ctx.runBeforeCallbacks();
	 * } catch (error) {
	 *   console.error('Middleware error:', error);
	 *   ctx.error('Internal server error');
	 * }
	 *
	 * // Dynamic middleware example
	 * const conditionalMiddleware = new Middleware((ctx) => {
	 *   if (ctx.requestHeaders.get('x-debug')) {
	 *     // Add debug middleware dynamically
	 *     ctx.addBeforeCallback(new Middleware((ctx) => {
	 *       console.log('Debug info:', ctx.data);
	 *     }));
	 *   }
	 * });
	 *
	 * ctx.addBeforeCallback(conditionalMiddleware);
	 * await ctx.runBeforeCallbacks(); // May execute additional middleware
	 * ```
	 */
	async runBeforeCallbacks() {
		while (this.#beforeCallbacks.length > 0) {
			if (this.responseEnded) break;
			const middleware = this.#beforeCallbacks.shift();
			await middleware.execute(this);
		}
	}

	/**
	 * Internal list of middleware instances to execute after the main handler.
	 *
	 * These middleware are executed in FIFO order (first added, first executed).
	 * Each middleware receives the current context instance and can modify it directly.
	 *
	 * **Use Cases**: After-callbacks are typically used for:
	 * - Response logging and metrics
	 * - Response transformation
	 * - Cleanup operations
	 * - Response caching
	 *
	 * **Design Note**: Using a mutable context object instead of creating new instances
	 * for each middleware step provides better performance by reducing memory allocation
	 * and garbage collection pressure in high-throughput scenarios.
	 *
	 * @type {import('./middleware.js').Middleware[]}
	 */
	#afterCallbacks = [];

	/**
	 * Adds a middleware instance to the after-callback queue.
	 *
	 * The middleware will be executed after the main handler in FIFO order.
	 * After-callbacks are typically used for logging, metrics, response
	 * transformation, and cleanup operations.
	 *
	 * **Execution Order**: Middleware added first will be executed first.
	 *
	 * @param {import('./middleware.js').Middleware} middleware - The middleware instance to add
	 *
	 * @example
	 * ```javascript
	 * // Add response logging middleware
	 * const loggingMiddleware = new Middleware((ctx) => {
	 *   const duration = Date.now() - ctx.data.startTime;
	 *   console.log(`${ctx.method} ${ctx.path} - ${ctx.responseStatusCode} - ${duration}ms`);
	 * });
	 *
	 * ctx.addAfterCallback(loggingMiddleware);
	 *
	 * // Add response transformation middleware
	 * const transformMiddleware = new Middleware((ctx) => {
	 *   if (ctx.responseHeaders.get('content-type')?.includes('application/json')) {
	 *     const body = JSON.parse(ctx.responseBody);
	 *     body.timestamp = new Date().toISOString();
	 *     ctx.responseBody = JSON.stringify(body);
	 *   }
	 * });
	 *
	 * ctx.addAfterCallback(transformMiddleware);
	 *
	 * // Execute all after callbacks
	 * await ctx.runAfterCallbacks();
	 * ```
	 */
	addAfterCallback(middleware) {
		this.#afterCallbacks.push(middleware);
	}

	/**
	 * Adds multiple middleware instances to the after-callback queue.
	 *
	 * Middleware are added in the order provided and will be executed
	 * in FIFO order when `runAfterCallbacks()` is called.
	 *
	 * **Performance Note**: This is more efficient than calling `addAfterCallback()`
	 * multiple times as it avoids repeated array operations.
	 *
	 * @param {import('./middleware.js').Middleware[]} middlewares - Array of middleware instances to add
	 *
	 * @example
	 * ```javascript
	 * // Create multiple after-callbacks
	 * const loggingMiddleware = new Middleware((ctx) => {
	 *   // Logging logic
	 * });
	 *
	 * const metricsMiddleware = new Middleware((ctx) => {
	 *   // Metrics collection
	 * });
	 *
	 * const cleanupMiddleware = new Middleware((ctx) => {
	 *   // Cleanup operations
	 * });
	 *
	 * // Add all after-callbacks at once
	 * ctx.addAfterCallbacks([loggingMiddleware, metricsMiddleware, cleanupMiddleware]);
	 *
	 * // Execute in order: logging -> metrics -> cleanup
	 * await ctx.runAfterCallbacks();
	 * ```
	 */
	addAfterCallbacks(middlewares) {
		for (const middleware of middlewares) {
			this.addAfterCallback(middleware);
		}
	}

	/**
	 * Executes all after-callbacks in FIFO order.
	 *
	 * This method processes each middleware in the queue sequentially, waiting
	 * for each to complete before proceeding to the next. Middleware are removed
	 * from the queue as they are executed (consumed).
	 *
	 * **Execution Flow**:
	 * 1. Process middleware in order they were added
	 * 2. Wait for each middleware to complete (supports async middleware)
	 * 3. Remove middleware from queue after execution
	 * 4. Stop if `responseEnded` becomes `true`
	 *
	 * **Dynamic Middleware**: Middleware can add more middleware during execution,
	 * enabling complex conditional logic and dynamic response processing.
	 *
	 * **Error Handling**: If any middleware throws an error, execution stops
	 * and the error is propagated to the caller.
	 *
	 * @returns {Promise<void>} Resolves when all after-callbacks complete
	 *
	 * @example
	 * ```javascript
	 * // Basic usage
	 * await ctx.runAfterCallbacks();
	 *
	 * // With error handling
	 * try {
	 *   await ctx.runAfterCallbacks();
	 * } catch (error) {
	 *   console.error('After-callback error:', error);
	 *   // Note: Response may already be sent, so error handling is limited
	 * }
	 *
	 * // Dynamic after-callback example
	 * const conditionalMiddleware = new Middleware((ctx) => {
	 *   if (ctx.responseStatusCode >= 400) {
	 *     // Add error logging middleware dynamically
	 *     ctx.addAfterCallback(new Middleware((ctx) => {
	 *       console.error('Error response:', ctx.responseStatusCode, ctx.responseBody);
	 *     }));
	 *   }
	 * });
	 *
	 * ctx.addAfterCallback(conditionalMiddleware);
	 * await ctx.runAfterCallbacks(); // May execute additional middleware
	 * ```
	 */
	async runAfterCallbacks() {
		while (this.#afterCallbacks.length > 0) {
			if (this.responseEnded) break;
			const middleware = this.#afterCallbacks.shift();
			await middleware.execute(this);
		}
	}

	/**
	 * Creates a new Context instance from HTTP request information.
	 *
	 * The constructor validates all input parameters and sets up the context
	 * for request processing. Invalid parameters will throw descriptive errors.
	 *
	 * **Validation Rules**:
	 * - Method must be a valid HTTP method (GET, POST, PUT, DELETE, etc.)
	 * - Path must be a non-empty string with length ≤ 2048 characters
	 * - Path must have ≤ 100 segments to prevent CPU exhaustion attacks
	 * - URL must be a valid URL object with pathname and searchParams
	 *
	 * **Security Features**:
	 * - Path length limits prevent DoS attacks
	 * - Segment count limits prevent CPU exhaustion
	 * - Method validation prevents invalid HTTP methods
	 *
	 * @param {string} method - The HTTP method (GET, POST, PUT, DELETE, etc.)
	 * @param {URL} url - The URL object containing pathname and searchParams
	 * @param {Headers} headers - The request headers
	 * @param {Buffer|undefined} [body] - Optional request body as Buffer
	 *
	 * @throws {Error} When method is empty or invalid
	 * @throws {Error} When path is empty, not a string, or too long
	 * @throws {Error} When path has too many segments
	 *
	 * @example
	 * ```javascript
	 * // Create context from request
	 * const url = new URL('https://api.example.com/users/123?page=1&limit=10');
	 * const headers = new Headers({
	 *   'content-type': 'application/json',
	 *   'authorization': 'Bearer token123'
	 * });
	 * const body = Buffer.from('{"name":"John","age":30}');
	 *
	 * const ctx = new Context('POST', url, headers, body);
	 *
	 * // Access validated properties
	 * console.log(ctx.method); // 'POST'
	 * console.log(ctx.path); // '/users/123'
	 * console.log(ctx.requestBody()); // { name: 'John', age: 30 }
	 * console.log(ctx.queryParams.get('page')); // '1'
	 *
	 * // Error cases
	 * try {
	 *   new Context('INVALID', url, headers); // Throws: Invalid HTTP method
	 * } catch (error) {
	 *   console.error(error.message);
	 * }
	 *
	 * try {
	 *   const longPathUrl = new URL('https://example.com/' + 'a'.repeat(2049));
	 *   new Context('GET', longPathUrl, headers); // Throws: Path too long
	 * } catch (error) {
	 *   console.error(error.message);
	 * }
	 * ```
	 */
	constructor(method, url, headers, body) {
		// validate and set #method properly
		if (!method) throw new Error(`Method is required, got: ${method}`);
		if (!isValidHttpMethod(method)) {
			throw new Error(`Invalid HTTP method: ${method}`);
		}
		this.#method = method;

		// validate and set #path properly
		const path = url.pathname;
		if (!path) throw new Error(`Path is required, got: ${path}`);
		if (typeof path !== "string") throw new Error("Path must be a string");
		if (path.length > 2048) throw new Error("Path too long");

		// security check to prevent CPU exhaustion attacks
		const pathSegments = path.split("/");
		if (pathSegments.length > 100) throw new Error("Path too long");

		this.#path = path;

		// set the query params and headers
		this.#queryParams = url.searchParams;
		this.#requestHeaders = headers;

		// set the body if given
		if (body) this.#requestBody = body;
	}

	/**
	 * Sends a 200 OK response with text/plain content type.
	 *
	 * This is a convenience method for sending plain text responses.
	 * It automatically sets the content-type header and calculates the
	 * content-length for proper HTTP compliance.
	 *
	 * **Note**: Falsy values (null, undefined, 0, false) are converted
	 * to empty strings to ensure consistent behavior.
	 *
	 * @param {string} data - The text content to send
	 * @returns {Context} The Context instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Send simple text response
	 * ctx.text('Hello, World!');
	 * // Result: 200 OK, Content-Type: text/plain, Content-Length: 13
	 *
	 * // Send empty text response
	 * ctx.text('');
	 * // Result: 200 OK, Content-Type: text/plain, Content-Length: 0
	 *
	 * // Handle falsy values
	 * ctx.text(null); // Sends empty string
	 * ctx.text(0); // Sends empty string
	 *
	 * // Method chaining
	 * ctx.text('Success')
	 *   .responseHeaders.set('x-custom', 'value');
	 * ```
	 */
	text(data) {
		this.responseStatusCode = 200;
		this.responseHeaders.set("content-type", "text/plain");
		this.responseBody = data || "";
		this.responseHeaders.set(
			"Content-Length",
			Buffer.byteLength(this.responseBody).toString(),
		);
		return this;
	}

	/**
	 * Sends a 200 OK response with text/html content type.
	 *
	 * This is a convenience method for sending HTML responses.
	 * It automatically sets the content-type header and calculates the
	 * content-length for proper HTTP compliance.
	 *
	 * **Note**: Falsy values (null, undefined, 0, false) are converted
	 * to empty strings to ensure consistent behavior.
	 *
	 * @param {string} data - The HTML content to send
	 * @returns {Context} The Context instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Send HTML response
	 * ctx.html('<h1>Welcome</h1><p>Hello, World!</p>');
	 * // Result: 200 OK, Content-Type: text/html, Content-Length: 35
	 *
	 * // Send empty HTML response
	 * ctx.html('');
	 * // Result: 200 OK, Content-Type: text/html, Content-Length: 0
	 *
	 * // Method chaining with additional headers
	 * ctx.html('<html><body>Success</body></html>')
	 *   .responseHeaders.set('cache-control', 'no-cache');
	 * ```
	 */
	html(data) {
		this.responseStatusCode = 200;
		this.responseHeaders.set("content-type", "text/html");
		this.responseBody = data || "";
		this.responseHeaders.set(
			"Content-Length",
			Buffer.byteLength(this.responseBody).toString(),
		);
		return this;
	}

	/**
	 * Sends a 200 OK response with application/xml content type.
	 *
	 * This is a convenience method for sending XML responses.
	 * It automatically sets the content-type header and calculates the
	 * content-length for proper HTTP compliance.
	 *
	 * **Note**: Falsy values (null, undefined, 0, false) are converted
	 * to empty strings to ensure consistent behavior.
	 *
	 * @param {string} data - The XML content to send
	 * @returns {Context} The Context instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Send XML response
	 * ctx.xml('<root><item>value</item></root>');
	 * // Result: 200 OK, Content-Type: application/xml, Content-Length: 28
	 *
	 * // Send RSS feed
	 * const rss = `<?xml version="1.0"?>
	 * <rss version="2.0">
	 *   <channel>
	 *     <title>My Feed</title>
	 *     <item><title>Article 1</title></item>
	 *   </channel>
	 * </rss>`;
	 * ctx.xml(rss);
	 *
	 * // Method chaining
	 * ctx.xml('<response>success</response>')
	 *   .responseHeaders.set('x-api-version', '1.0');
	 * ```
	 */
	xml(data) {
		this.responseStatusCode = 200;
		this.responseHeaders.set("content-type", "application/xml");
		this.responseBody = data || "";
		this.responseHeaders.set(
			"Content-Length",
			Buffer.byteLength(this.responseBody).toString(),
		);
		return this;
	}

	/**
	 * Sends a 200 OK response with application/json content type.
	 *
	 * This is a convenience method for sending JSON responses.
	 * It automatically serializes the data to JSON, sets the content-type
	 * header, and calculates the content-length for proper HTTP compliance.
	 *
	 * **Error Handling**: If the data contains circular references or
	 * other non-serializable values, JSON.stringify() will throw a TypeError.
	 *
	 * **Note**: Undefined values in objects are omitted from the JSON output
	 * as per JSON specification.
	 *
	 * @param {Object|Array<*>} data - The data to serialize as JSON
	 * @returns {Context} The Context instance for method chaining
	 *
	 * @throws {TypeError} When data contains circular references or non-serializable values
	 *
	 * @example
	 * ```javascript
	 * // Send simple JSON object
	 * ctx.json({ success: true, message: 'Hello World' });
	 * // Result: 200 OK, Content-Type: application/json
	 * // Body: {"success":true,"message":"Hello World"}
	 *
	 * // Send JSON array
	 * ctx.json([1, 2, 3, 4, 5]);
	 * // Result: 200 OK, Content-Type: application/json
	 * // Body: [1,2,3,4,5]
	 *
	 * // Send complex nested object
	 * ctx.json({
	 *   user: {
	 *     id: 123,
	 *     name: 'John Doe',
	 *     email: 'john@example.com'
	 *   },
	 *   metadata: {
	 *     timestamp: new Date().toISOString(),
	 *     version: '1.0.0'
	 *   }
	 * });
	 *
	 * // Handle undefined values (omitted from JSON)
	 * ctx.json({ name: 'John', age: undefined, active: true });
	 * // Result: {"name":"John","active":true}
	 *
	 * // Method chaining
	 * ctx.json({ status: 'success' })
	 *   .responseHeaders.set('x-api-version', '1.0');
	 *
	 * // Error case - circular reference
	 * const obj = { name: 'test' };
	 * obj.self = obj;
	 * try {
	 *   ctx.json(obj); // Throws TypeError
	 * } catch (error) {
	 *   console.error('JSON serialization error:', error.message);
	 * }
	 * ```
	 */
	json(data) {
		this.responseStatusCode = 200;
		this.responseHeaders.set("content-type", "application/json");
		this.responseBody = JSON.stringify(data);
		this.responseHeaders.set(
			"Content-Length",
			Buffer.byteLength(this.responseBody).toString(),
		);
		return this;
	}

	/**
	 * Sends a 200 OK response with application/javascript content type.
	 *
	 * This is a convenience method for sending JavaScript responses.
	 * It automatically sets the content-type header and calculates the
	 * content-length for proper HTTP compliance.
	 *
	 * **Note**: Falsy values (null, undefined, 0, false) are converted
	 * to empty strings to ensure consistent behavior.
	 *
	 * @param {string} data - The JavaScript code to send
	 * @returns {Context} The Context instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Send JavaScript response
	 * ctx.js('console.log("Hello from server!");');
	 * // Result: 200 OK, Content-Type: application/javascript, Content-Length: 32
	 *
	 * // Send JSONP response
	 * const callback = ctx.queryParams.get('callback') || 'callback';
	 * const data = { message: 'Hello World' };
	 * ctx.js(`${callback}(${JSON.stringify(data)});`);
	 *
	 * // Send module response
	 * ctx.js('export const version = "1.0.0";');
	 *
	 * // Method chaining
	 * ctx.js('alert("Success!");')
	 *   .responseHeaders.set('cache-control', 'no-cache');
	 * ```
	 */
	js(data) {
		this.responseStatusCode = 200;
		this.responseHeaders.set("content-type", "application/javascript");
		this.responseBody = data || "";
		this.responseHeaders.set(
			"Content-Length",
			Buffer.byteLength(this.responseBody).toString(),
		);
		return this;
	}

	/**
	 * Redirects the client to a different URL.
	 *
	 * This method sets up an HTTP redirect response by setting the Location
	 * header and an appropriate status code. The client will automatically
	 * follow the redirect to the new URL.
	 *
	 * **Common Status Codes**:
	 * - 301: Permanent redirect (cached by browsers)
	 * - 302: Temporary redirect (default)
	 * - 303: See Other (for POST redirects)
	 * - 307: Temporary redirect (preserves HTTP method)
	 * - 308: Permanent redirect (preserves HTTP method)
	 *
	 * @param {string} url - The URL to redirect to (can be relative or absolute)
	 * @param {number} [status=302] - The HTTP status code for the redirect
	 * @returns {Context} The Context instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Temporary redirect (default)
	 * ctx.redirect('/new-page');
	 * // Result: 302 Found, Location: /new-page
	 *
	 * // Permanent redirect
	 * ctx.redirect('/new-location', 301);
	 * // Result: 301 Moved Permanently, Location: /new-location
	 *
	 * // External redirect
	 * ctx.redirect('https://example.com');
	 * // Result: 302 Found, Location: https://example.com
	 *
	 * // POST redirect (See Other)
	 * if (ctx.method === 'POST') {
	 *   ctx.redirect('/success', 303);
	 *   // Result: 303 See Other, Location: /success
	 * }
	 *
	 * // Method chaining
	 * ctx.redirect('/dashboard')
	 *   .responseHeaders.set('x-redirect-reason', 'authentication');
	 * ```
	 */
	redirect(url, status = 302) {
		this.responseStatusCode = status;
		this.responseHeaders.set("Location", url);
		return this;
	}

	/**
	 * Sends a 404 Not Found response.
	 *
	 * This is a convenience method for sending 404 error responses.
	 * It automatically sets the status code to 404, content-type to text/plain,
	 * and calculates the content-length for proper HTTP compliance.
	 *
	 * **Note**: Falsy values (null, undefined, 0, false) are converted
	 * to empty strings to ensure consistent behavior.
	 *
	 * @param {string} [message="Not Found"] - Optional custom error message
	 * @returns {Context} The Context instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Send default 404 response
	 * ctx.notFound();
	 * // Result: 404 Not Found, Content-Type: text/plain
	 * // Body: "Not Found"
	 *
	 * // Send custom 404 message
	 * ctx.notFound('User not found');
	 * // Result: 404 Not Found, Content-Type: text/plain
	 * // Body: "User not found"
	 *
	 * // Send empty 404 response
	 * ctx.notFound('');
	 * // Result: 404 Not Found, Content-Type: text/plain
	 * // Body: "" (empty string)
	 *
	 * // Method chaining
	 * ctx.notFound('Resource not available')
	 *   .responseHeaders.set('x-error-code', 'RESOURCE_404');
	 *
	 * // Common usage in route handlers
	 * const user = await getUserById(ctx.pathParams.id);
	 * if (!user) {
	 *   return ctx.notFound('User not found');
	 * }
	 * ```
	 */
	notFound(message = "Not Found") {
		this.responseStatusCode = 404;
		this.responseHeaders.set("content-type", "text/plain");
		this.responseBody = message || "";
		this.responseHeaders.set(
			"Content-Length",
			Buffer.byteLength(this.responseBody).toString(),
		);
		return this;
	}

	/**
	 * Sends a 500 Internal Server Error response.
	 *
	 * This is a convenience method for sending 500 error responses.
	 * It automatically sets the status code to 500, content-type to text/plain,
	 * and calculates the content-length for proper HTTP compliance.
	 *
	 * **Note**: Falsy values (null, undefined, 0, false) are converted
	 * to empty strings to ensure consistent behavior.
	 *
	 * @param {string} [message="Internal Server Error"] - Optional custom error message
	 * @returns {Context} The Context instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Send default 500 response
	 * ctx.error();
	 * // Result: 500 Internal Server Error, Content-Type: text/plain
	 * // Body: "Internal Server Error"
	 *
	 * // Send custom 500 message
	 * ctx.error('Database connection failed');
	 * // Result: 500 Internal Server Error, Content-Type: text/plain
	 * // Body: "Database connection failed"
	 *
	 * // Send empty 500 response
	 * ctx.error('');
	 * // Result: 500 Internal Server Error, Content-Type: text/plain
	 * // Body: "" (empty string)
	 *
	 * // Method chaining
	 * ctx.error('Service temporarily unavailable')
	 *   .responseHeaders.set('retry-after', '60');
	 *
	 * // Common usage in error handling
	 * try {
	 *   const result = await riskyOperation();
	 *   ctx.json(result);
	 * } catch (err) {
	 *   console.error('Operation failed:', err);
	 *   return ctx.error('Operation failed');
	 * }
	 *
	 * // In middleware error handling
	 * const errorMiddleware = new Middleware(async (ctx) => {
	 *   try {
	 *     // Some operation that might fail
	 *   } catch (err) {
	 *     ctx.error('Middleware processing failed');
	 *     ctx.responseEnded = true;
	 *   }
	 * });
	 * ```
	 */
	error(message = "Internal Server Error") {
		this.responseStatusCode = 500;
		this.responseHeaders.set("content-type", "text/plain");
		this.responseBody = message || "";
		this.responseHeaders.set(
			"Content-Length",
			Buffer.byteLength(this.responseBody).toString(),
		);
		return this;
	}
}
