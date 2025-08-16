import {
	getHttpMethods,
	HTTP_METHODS,
	isValidHttpMethod,
} from "./http-methods.js";
import { Middleware } from "./middleware.js";
import { Route } from "./route.js";
import { Trie } from "./trie.js";

/**
 * **Router** - High-performance HTTP request router for the Wings framework.
 *
 * The Router class provides a lean, fast, and isomorphic HTTP router that can handle
 * requests in both Node.js and browser environments. It uses a Trie data structure
 * for optimal performance and supports middleware, path parameters, and complex
 * routing patterns.
 *
 * ## Key Features
 * - **High Performance**: O(1) route matching using Trie data structure
 * - **Isomorphic**: Works in Node.js, browser, and serverless environments
 * - **Middleware Support**: Before/after middleware execution pipeline
 * - **Path Parameters**: Dynamic route parameters with validation
 * - **Method Chaining**: Fluent API for building routes
 * - **Error Handling**: Built-in error handling and recovery
 * - **Zero Dependencies**: Pure JavaScript with no external dependencies
 *
 * ## Performance Characteristics
 *
 * **Route Registration**: O(n) where n is the number of path segments
 * **Route Matching**: O(m) where m is the number of segments in the request path
 * **Memory Usage**: Minimal overhead (~1KB for typical applications)
 *
 * The router is optimized for scenarios where both route registration and matching
 * performance matter, such as serverless functions and browser SPAs.
 *
 * ## Design Philosophy
 *
 * The Router prioritizes:
 * - **Speed**: Fast route matching and registration
 * - **Simplicity**: Clean, intuitive API
 * - **Flexibility**: Support for various deployment scenarios
 * - **Reliability**: Robust error handling and edge case management
 *
 * **Note**: This router is designed to be environment-agnostic. As long as you can
 * create a Context instance from your request, you can use this router anywhere.
 *
 * @example
 * ```javascript
 * import { Router } from './router.js';
 * import { Context } from './context.js';
 *
 * // Create router instance
 * const router = new Router();
 *
 * // Add routes with method chaining
 * router
 *   .get('/users', (ctx) => {
 *     ctx.json({ users: [] });
 *   })
 *   .get('/users/:id', (ctx) => {
 *     const userId = ctx.pathParams.id;
 *     ctx.json({ id: userId, name: 'John Doe' });
 *   })
 *   .post('/users', async (ctx) => {
 *     const userData = ctx.requestBody();
 *     const newUser = await createUser(userData);
 *     ctx.json(newUser);
 *   });
 *
 * // Add middleware
 * router.use(authMiddleware);
 *
 * // Handle request
 * const url = new URL('http://localhost/users/123');
 * const ctx = new Context('GET', url, new Headers());
 * await router.handleRequest(ctx);
 * ```
 *
 * ## Performance Trade-offs
 *
 * **Advantages**:
 * - Extremely fast route matching
 * - Minimal memory footprint
 * - No external dependencies
 * - Works in any JavaScript environment
 *
 * **Limitations**:
 * - No WebSocket support
 * - Requires modern JavaScript (ES6+)
 * - ESM-only (no CommonJS support)
 * - Limited to HTTP request/response patterns
 */
export class Router {
	/**
	 * Internal storage for all registered routes.
	 *
	 * This array stores all Route instances in the order they were added.
	 * The array is append-only, making it safe to use positional indices
	 * as unique route IDs for the Trie data structure.
	 *
	 * **Note**: Routes are never removed from this array, only added.
	 * This ensures consistent indexing for the Trie lookup system.
	 *
	 * @type {import('./route.js').Route[]}
	 */
	#routes = [];

	/**
	 * Trie data structures for fast route matching.
	 *
	 * This object contains separate Trie instances for each HTTP method,
	 * enabling O(1) route matching performance. Each Trie is optimized
	 * for the specific patterns and constraints of its HTTP method.
	 *
	 * **Structure**: `{ [method]: Trie }` where method is a valid HTTP method
	 *
	 * @type {Object<string, Trie>}
	 */
	#tries = {};

	/**
	 * Internal storage for registered middleware.
	 *
	 * This array stores all Middleware instances that will be executed
	 * for every request handled by this router. Middleware is executed
	 * in the order it was added.
	 *
	 * **Note**: Middleware with duplicate identifiers are automatically
	 * filtered out to prevent duplicate execution.
	 *
	 * @type {Middleware[]}
	 */
	#middlewares = [];

	/**
	 * Creates a new Router instance with all HTTP method tries pre-initialized.
	 *
	 * The constructor initializes separate Trie data structures for each
	 * supported HTTP method, ensuring optimal performance for route matching.
	 * This upfront initialization prevents runtime overhead during route
	 * registration and request handling.
	 *
	 * **Initialization**: Creates Trie instances for GET, POST, PUT, DELETE,
	 * PATCH, HEAD, and OPTIONS methods.
	 *
	 * @example
	 * ```javascript
	 * // Create a new router instance
	 * const router = new Router();
	 *
	 * // All HTTP method tries are ready for use
	 * router.get('/users', handler);
	 * router.post('/users', handler);
	 * router.put('/users/:id', handler);
	 *
	 * // Router is immediately ready to handle requests
	 * await router.handleRequest(ctx);
	 * ```
	 */
	constructor() {
		// Initialize all HTTP method tries upfront for better performance
		getHttpMethods().forEach((method) => {
			this.#tries[method] = new Trie();
		});
	}

	/**
	 * Private helper method to register a route in the trie and add it to the routes array.
	 *
	 * This method handles the internal registration process by:
	 * 1. Normalizing the path for consistent matching
	 * 2. Registering the route in the appropriate Trie for the HTTP method
	 * 3. Adding the route to the routes array for later retrieval
	 *
	 * **Performance**: This operation is O(n) where n is the number of path segments.
	 *
	 * @param {import('./http-methods.js').HttpMethod} method - The HTTP method
	 * @param {string} path - The path of the route
	 * @param {import('./route.js').Route} route - The route instance to add
	 * @returns {Router} The Router instance for chaining
	 */
	#registerRoute(method, path, route) {
		this.#tries[method].register(
			this.#normalizePath(path).split("/"),
			this.#routes.length,
		);
		this.#routes.push(route);
		return this;
	}

	/**
	 * Private helper method to add a route for a specific HTTP method.
	 *
	 * This method creates a Route instance using the appropriate factory method
	 * and then registers it using the #registerRoute helper. It provides a
	 * consistent interface for all HTTP method route additions.
	 *
	 * @param {import('./http-methods.js').HttpMethod} method - The HTTP method
	 * @param {string} path - The path of the route
	 * @param {import('./middleware.js').Handler} handler - The route handler function
	 * @returns {Router} The Router instance for chaining
	 */
	#addMethodRoute(method, path, handler) {
		const route = Route[method](path, handler);
		return this.#registerRoute(method, path, route);
	}

	/**
	 * Adds a new GET route to the router.
	 *
	 * This method creates and registers a GET route with the specified path
	 * and handler function. GET routes are typically used for retrieving
	 * resources and should be idempotent and safe.
	 *
	 * **GET Method**: Used for retrieving resources. GET requests should not
	 * modify server state and can be cached safely.
	 *
	 * @param {string} path - The path pattern for the route (e.g., '/users/:id')
	 * @param {import('./middleware.js').Handler} handler - The function to handle GET requests
	 * @returns {Router} The Router instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Basic GET route
	 * router.get('/users', (ctx) => {
	 *   ctx.json({ users: getAllUsers() });
	 * });
	 *
	 * // GET route with path parameters
	 * router.get('/users/:id', (ctx) => {
	 *   const userId = ctx.pathParams.id;
	 *   const user = getUserById(userId);
	 *   ctx.json(user);
	 * });
	 *
	 * // Method chaining
	 * router
	 *   .get('/users', listUsers)
	 *   .get('/users/:id', getUser)
	 *   .get('/users/:id/posts', getUserPosts);
	 * ```
	 */
	get(path, handler) {
		return this.#addMethodRoute(HTTP_METHODS.GET, path, handler);
	}

	/**
	 * Adds a new POST route to the router.
	 *
	 * This method creates and registers a POST route with the specified path
	 * and handler function. POST routes are typically used for creating
	 * new resources.
	 *
	 * **POST Method**: Used for creating new resources. POST requests
	 * typically include a request body with the data to create.
	 *
	 * @param {string} path - The path pattern for the route (e.g., '/users')
	 * @param {import('./middleware.js').Handler} handler - The function to handle POST requests
	 * @returns {Router} The Router instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Basic POST route
	 * router.post('/users', async (ctx) => {
	 *   const userData = ctx.requestBody();
	 *   const newUser = await createUser(userData);
	 *   ctx.json(newUser);
	 * });
	 *
	 * // POST route with validation
	 * router.post('/users', async (ctx) => {
	 *   const userData = ctx.requestBody();
	 *   if (!userData.name || !userData.email) {
	 *     ctx.responseStatusCode = 400;
	 *     ctx.json({ error: 'Name and email are required' });
	 *     return;
	 *   }
	 *   const newUser = await createUser(userData);
	 *   ctx.json(newUser);
	 * });
	 * ```
	 */
	post(path, handler) {
		return this.#addMethodRoute(HTTP_METHODS.POST, path, handler);
	}

	/**
	 * Adds a new PUT route to the router.
	 *
	 * This method creates and registers a PUT route with the specified path
	 * and handler function. PUT routes are typically used for replacing
	 * entire resources.
	 *
	 * **PUT Method**: Used for replacing entire resources. PUT requests
	 * should be idempotent and typically include a complete resource
	 * representation in the request body.
	 *
	 * @param {string} path - The path pattern for the route (e.g., '/users/:id')
	 * @param {import('./middleware.js').Handler} handler - The function to handle PUT requests
	 * @returns {Router} The Router instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Basic PUT route
	 * router.put('/users/:id', async (ctx) => {
	 *   const userId = ctx.pathParams.id;
	 *   const userData = ctx.requestBody();
	 *   const updatedUser = await updateUser(userId, userData);
	 *   ctx.json(updatedUser);
	 * });
	 * ```
	 */
	put(path, handler) {
		return this.#addMethodRoute(HTTP_METHODS.PUT, path, handler);
	}

	/**
	 * Adds a new DELETE route to the router.
	 *
	 * This method creates and registers a DELETE route with the specified path
	 * and handler function. DELETE routes are typically used for removing
	 * resources.
	 *
	 * **DELETE Method**: Used for removing resources. DELETE requests
	 * should be idempotent and typically don't include a request body.
	 *
	 * @param {string} path - The path pattern for the route (e.g., '/users/:id')
	 * @param {import('./middleware.js').Handler} handler - The function to handle DELETE requests
	 * @returns {Router} The Router instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Basic DELETE route
	 * router.delete('/users/:id', async (ctx) => {
	 *   const userId = ctx.pathParams.id;
	 *   await deleteUser(userId);
	 *   ctx.responseStatusCode = 204; // No Content
	 * });
	 * ```
	 */
	delete(path, handler) {
		return this.#addMethodRoute(HTTP_METHODS.DELETE, path, handler);
	}

	/**
	 * Adds a new PATCH route to the router.
	 *
	 * This method creates and registers a PATCH route with the specified path
	 * and handler function. PATCH routes are typically used for partially
	 * updating resources.
	 *
	 * **PATCH Method**: Used for partially updating resources. PATCH requests
	 * should be idempotent and typically include only the fields to update
	 * in the request body.
	 *
	 * @param {string} path - The path pattern for the route (e.g., '/users/:id')
	 * @param {import('./middleware.js').Handler} handler - The function to handle PATCH requests
	 * @returns {Router} The Router instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Basic PATCH route
	 * router.patch('/users/:id', async (ctx) => {
	 *   const userId = ctx.pathParams.id;
	 *   const updates = ctx.requestBody();
	 *   const updatedUser = await updateUserPartial(userId, updates);
	 *   ctx.json(updatedUser);
	 * });
	 * ```
	 */
	patch(path, handler) {
		return this.#addMethodRoute(HTTP_METHODS.PATCH, path, handler);
	}

	/**
	 * Adds a new HEAD route to the router.
	 *
	 * This method creates and registers a HEAD route with the specified path
	 * and handler function. HEAD routes are typically used for retrieving
	 * headers only, without the response body.
	 *
	 * **HEAD Method**: Used for retrieving headers only, without the response body.
	 * HEAD requests are useful for checking if a resource exists or getting
	 * metadata without transferring the full content.
	 *
	 * @param {string} path - The path pattern for the route (e.g., '/users/:id')
	 * @param {import('./middleware.js').Handler} handler - The function to handle HEAD requests
	 * @returns {Router} The Router instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Basic HEAD route
	 * router.head('/users/:id', async (ctx) => {
	 *   const userId = ctx.pathParams.id;
	 *   const exists = await userExists(userId);
	 *   if (!exists) {
	 *     ctx.responseStatusCode = 404;
	 *   }
	 *   // No response body for HEAD requests
	 * });
	 * ```
	 */
	head(path, handler) {
		return this.#addMethodRoute(HTTP_METHODS.HEAD, path, handler);
	}

	/**
	 * Adds a new OPTIONS route to the router.
	 *
	 * This method creates and registers an OPTIONS route with the specified path
	 * and handler function. OPTIONS routes are typically used for discovering
	 * the allowed HTTP methods and other capabilities of a resource.
	 *
	 * **OPTIONS Method**: Used for discovering the allowed HTTP methods
	 * and other capabilities of a resource. OPTIONS requests are commonly
	 * used for CORS preflight requests.
	 *
	 * @param {string} path - The path pattern for the route (e.g., '/users')
	 * @param {import('./middleware.js').Handler} handler - The function to handle OPTIONS requests
	 * @returns {Router} The Router instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Basic OPTIONS route
	 * router.options('/users', (ctx) => {
	 *   ctx.responseHeaders.set('access-control-allow-methods', 'GET, POST, PUT, DELETE');
	 *   ctx.responseHeaders.set('access-control-allow-headers', 'Content-Type, Authorization');
	 *   ctx.responseHeaders.set('access-control-max-age', '86400');
	 *   ctx.responseStatusCode = 204;
	 * });
	 * ```
	 */
	options(path, handler) {
		return this.#addMethodRoute(HTTP_METHODS.OPTIONS, path, handler);
	}

	/**
	 * Adds a pre-configured Route instance to the router.
	 *
	 * This method provides a more flexible way to add routes by accepting
	 * a complete Route instance. It's useful when you need to add routes
	 * with custom middleware, constraints, or descriptions that were
	 * created using the Route factory methods.
	 *
	 * **Validation**: The route's HTTP method must be one of the supported
	 * methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS).
	 *
	 * @param {import('./route.js').Route} route - The Route instance to add
	 * @returns {Router} The Router instance for method chaining
	 * @throws {Error} If the route method is not a supported HTTP method
	 *
	 * @example
	 * ```javascript
	 * // Create a route with custom options
	 * const userRoute = Route.GET('/users/:id', (ctx) => {
	 *   ctx.json({ id: ctx.pathParams.id });
	 * }, {
	 *   middleware: [authMiddleware],
	 *   constraints: { id: '\\d+' },
	 *   description: 'Get user by ID'
	 * });
	 *
	 * // Add the pre-configured route
	 * router.addRoute(userRoute);
	 *
	 * // Create multiple routes and add them
	 * const routes = [
	 *   Route.POST('/users', createUserHandler),
	 *   Route.PUT('/users/:id', updateUserHandler),
	 *   Route.DELETE('/users/:id', deleteUserHandler)
	 * ];
	 *
	 * routes.forEach(route => router.addRoute(route));
	 *
	 * // Error case - unsupported method
	 * try {
	 *   const invalidRoute = { method: 'INVALID', path: '/test', handler: () => {} };
	 *   router.addRoute(invalidRoute);
	 * } catch (error) {
	 *   console.error(error.message); // "Unsupported HTTP method: INVALID"
	 * }
	 * ```
	 */
	addRoute(route) {
		const method = route.method;

		// Validate that the method is supported
		if (!isValidHttpMethod(method)) {
			throw new Error(
				`Unsupported HTTP method: ${method}. Supported methods: ${Object.values(HTTP_METHODS).join(", ")}`,
			);
		}

		// Use the helper method for the common logic
		return this.#registerRoute(method, route.path, route);
	}

	/**
	 * Adds middleware to the end of the middleware chain.
	 *
	 * This method appends middleware to the router's middleware array.
	 * Middleware added with this method will be executed before the route
	 * handler in the order they were added.
	 *
	 * **Duplicate Prevention**: Middleware with the same identifier will
	 * not be added multiple times, preventing duplicate execution.
	 *
	 * **Execution Order**: Middleware added with `use()` runs after
	 * middleware added with `useEarly()`.
	 *
	 * @param {import('./middleware.js').Middleware} middleware - The middleware instance to add
	 * @returns {Router} The Router instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Add authentication middleware
	 * const authMiddleware = new Middleware(async (ctx) => {
	 *   const token = ctx.requestHeaders.get('authorization');
	 *   if (!token) {
	 *     ctx.responseStatusCode = 401;
	 *     ctx.responseEnded = true;
	 *     return;
	 *   }
	 *   ctx.data.user = await validateToken(token);
	 * }, 'authentication');
	 *
	 * router.use(authMiddleware);
	 *
	 * // Add logging middleware
	 * const loggingMiddleware = new Middleware((ctx) => {
	 *   console.log(`${ctx.method} ${ctx.path} - ${new Date().toISOString()}`);
	 * }, 'logging');
	 *
	 * router.use(loggingMiddleware);
	 *
	 * // Method chaining
	 * router
	 *   .use(authMiddleware)
	 *   .use(loggingMiddleware)
	 *   .get('/users', userHandler);
	 *
	 * // Duplicate prevention
	 * router.use(authMiddleware); // Won't add duplicate
	 * router.use(authMiddleware); // Won't add duplicate
	 * ```
	 */
	use(middleware) {
		// Check for duplicate identifiers
		if (
			middleware.identifier &&
			this.#middlewares.some((m) => m.hasSameIdentifier(middleware))
		) {
			return this;
		}

		this.#middlewares.push(middleware);
		return this;
	}

	/**
	 * Adds middleware to the beginning of the middleware chain.
	 *
	 * This method prepends middleware to the router's middleware array.
	 * Middleware added with this method will be executed before the route
	 * handler and before middleware added with `use()`.
	 *
	 * **Duplicate Prevention**: Middleware with the same identifier will
	 * not be added multiple times, preventing duplicate execution.
	 *
	 * **Execution Order**: Middleware added with `useEarly()` runs before
	 * middleware added with `use()`.
	 *
	 * @param {import('./middleware.js').Middleware} middleware - The middleware instance to add
	 * @returns {Router} The Router instance for method chaining
	 *
	 * @example
	 * ```javascript
	 * // Add CORS middleware early (should run first)
	 * const corsMiddleware = new Middleware((ctx) => {
	 *   ctx.responseHeaders.set('access-control-allow-origin', '*');
	 *   ctx.responseHeaders.set('access-control-allow-methods', 'GET, POST, PUT, DELETE');
	 * }, 'cors');
	 *
	 * router.useEarly(corsMiddleware);
	 *
	 * // Add authentication middleware (runs after CORS)
	 * const authMiddleware = new Middleware(async (ctx) => {
	 *   // Authentication logic
	 * }, 'authentication');
	 *
	 * router.use(authMiddleware);
	 *
	 * // Execution order: cors -> auth -> handler
	 * router.get('/users', userHandler);
	 *
	 * // Method chaining
	 * router
	 *   .useEarly(corsMiddleware)
	 *   .use(authMiddleware)
	 *   .get('/users', userHandler);
	 * ```
	 */
	useEarly(middleware) {
		// Check for duplicate identifiers
		if (
			middleware.identifier &&
			this.#middlewares.some((m) => m.hasSameIdentifier(middleware))
		) {
			return this;
		}

		this.#middlewares.unshift(middleware);
		return this;
	}

	/**
	 * Private method to match a request against registered routes.
	 *
	 * This method uses the Trie data structure to find the best matching
	 * route for the given HTTP method and request path. It returns both
	 * the matched route and any extracted path parameters.
	 *
	 * **Performance**: O(m) where m is the number of segments in the request path.
	 * The total number of registered routes is irrelevant for matching performance.
	 *
	 * @param {string} method - The HTTP method of the request
	 * @param {string} requestPath - The path of the request
	 * @returns {{route: import('./route.js').Route | undefined, params: Object<string, string>}} Object containing the matched route and path parameters
	 */
	#match(method, requestPath) {
		const path = this.#normalizePath(requestPath);
		const pathSegments = path.split("/");

		const trie = this.#tries[method];
		if (!trie) return { route: undefined, params: {} };

		const { id, params } = this.#tries[method].match(pathSegments);
		if (id < 0) return { route: undefined, params };

		return { route: this.#routes[id], params };
	}

	/**
	 * Private method to normalize path strings for consistent matching.
	 *
	 * This method removes leading and trailing slashes from paths to ensure
	 * consistent route matching regardless of how the path was originally
	 * specified.
	 *
	 * @param {string} path - The path to normalize
	 * @returns {string} The normalized path
	 */
	#normalizePath(path) {
		let p = path;
		p = p.replace(/^\/|\/$/g, "");
		return p;
	}

	/**
	 * Handles an incoming HTTP request through the complete middleware and routing pipeline.
	 *
	 * This method orchestrates the entire request processing flow:
	 * 1. Executes all registered middleware (before callbacks)
	 * 2. Matches the request against registered routes
	 * 3. Executes the matched route handler
	 * 4. Executes any after callbacks
	 * 5. Handles errors gracefully
	 *
	 * **Request Flow**:
	 * - Middleware execution (before)
	 * - Route matching and parameter extraction
	 * - Route handler execution
	 * - Middleware execution (after)
	 * - Error handling (if needed)
	 *
	 * **Error Handling**: If any step throws an error, the method catches it,
	 * logs the error, and returns a 500 Internal Server Error response.
	 *
	 * **Context Mutation**: This method modifies the provided Context instance
	 * directly and returns it for convenience.
	 *
	 * @param {import('./context.js').Context} ctx - The HTTP lifecycle context
	 * @returns {Promise<import('./context.js').Context>} The modified context instance
	 *
	 * @example
	 * ```javascript
	 * // Create router with routes and middleware
	 * const router = new Router();
	 * router.use(authMiddleware);
	 * router.get('/users/:id', async (ctx) => {
	 *   const userId = ctx.pathParams.id;
	 *   const user = await getUserById(userId);
	 *   ctx.json(user);
	 * });
	 *
	 * // Handle a request
	 * const url = new URL('http://localhost/users/123');
	 * const ctx = new Context('GET', url, new Headers());
	 *
	 * const result = await router.handleRequest(ctx);
	 *
	 * // Check the response
	 * console.log(result.responseStatusCode); // 200
	 * console.log(result.responseBody); // JSON string with user data
	 *
	 * // Handle a non-existent route
	 * const notFoundUrl = new URL('http://localhost/nonexistent');
	 * const notFoundCtx = new Context('GET', notFoundUrl, new Headers());
	 *
	 * const notFoundResult = await router.handleRequest(notFoundCtx);
	 * console.log(notFoundResult.responseStatusCode); // 404
	 *
	 * // Handle a request that causes an error
	 * const errorUrl = new URL('http://localhost/users/invalid');
	 * const errorCtx = new Context('GET', errorUrl, new Headers());
	 *
	 * const errorResult = await router.handleRequest(errorCtx);
	 * console.log(errorResult.responseStatusCode); // 500 (if handler throws)
	 * ```
	 */
	async handleRequest(ctx) {
		try {
			// run all before hooks first on the context instance
			ctx.addBeforeCallbacks(this.#middlewares);
			await ctx.runBeforeCallbacks();
			if (ctx.responseEnded) return ctx;

			// try to find a route that matches the request
			const { route, params } = this.#match(ctx.method, ctx.path);
			if (!route) return ctx.notFound();

			// run the handler with the extracted pathParams
			ctx.pathParams = params;
			await route.handler(ctx);
			if (ctx.responseEnded) return ctx;

			// run all after hooks
			await ctx.runAfterCallbacks();
		} catch (error) {
			console.error("Handler error:", error);
			if (!ctx.responseEnded) return ctx.error();
		}
		return ctx;
	}

	/**
	 * Lists all registered routes, optionally filtered by HTTP method.
	 *
	 * This method returns an array of all Route instances that have been
	 * registered with the router. You can optionally filter the results
	 * by specifying an HTTP method.
	 *
	 * **Note**: The returned array is a copy of the internal routes array,
	 * so modifying it won't affect the router's internal state.
	 *
	 * @param {string} [method] - Optional HTTP method to filter routes (e.g., 'GET', 'POST')
	 * @returns {import('./route.js').Route[]} Array of registered routes
	 *
	 * @example
	 * ```javascript
	 * // Get all routes
	 * const allRoutes = router.listRoutes();
	 * console.log(`Total routes: ${allRoutes.length}`);
	 *
	 * // Get routes for specific method
	 * const getRoutes = router.listRoutes('GET');
	 * console.log(`GET routes: ${getRoutes.length}`);
	 *
	 * // Get routes for another method
	 * const postRoutes = router.listRoutes('POST');
	 * console.log(`POST routes: ${postRoutes.length}`);
	 *
	 * // Iterate over routes
	 * router.listRoutes().forEach(route => {
	 *   console.log(`${route.method} ${route.path}`);
	 * });
	 *
	 * // Filter routes by method
	 * const userRoutes = router.listRoutes().filter(route =>
	 *   route.path.startsWith('/users')
	 * );
	 * console.log(`User routes: ${userRoutes.length}`);
	 *
	 * // Get routes with descriptions
	 * const documentedRoutes = router.listRoutes().filter(route =>
	 *   route.description
	 * );
	 * documentedRoutes.forEach(route => {
	 *   console.log(`${route.method} ${route.path}: ${route.description}`);
	 * });
	 * ```
	 */
	listRoutes(method) {
		if (method) return this.#routes.filter((p) => p.method === method);
		return this.#routes;
	}
}
