/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { HTTP_METHODS } from "./http-methods.js";

/**
 *
 * **Route** - HTTP route definition and configuration.
 * The Route class represents a single HTTP route in the Wings framework.
 * It encapsulates the HTTP method, path, handler function, and optional
 * configuration like middleware, parameter constraints, and documentation.
 * ## Key Features
 * - **Static Factory Methods**: Convenient methods for creating routes with specific HTTP methods
 * - **Flexible Configuration**: Support for middleware, constraints, and descriptions
 * - **Type Safety**: Strong typing with JSDoc for better development experience
 * - **Validation**: Built-in handling of edge cases and invalid inputs
 * - **Extensibility**: Easy to extend with additional properties and methods
 * ## Design Philosophy
 * Routes are designed to be declarative and self-contained. Each route
 * contains all the information needed to handle a specific HTTP request,
 * including validation rules and documentation.
 * **Note**: The Route class uses a mutable design for flexibility, allowing
 * properties to be modified after creation. This enables dynamic route
 * configuration and middleware injection.
 * ```javascript
 * import { Route } from './route.js';
 * // Basic route creation
 * const userRoute = Route.GET('/users/:id', (ctx) => {
 * const userId = ctx.pathParams.id;
 * ctx.json({ id: userId, name: 'John Doe' });
 * });
 * // Route with middleware and constraints
 * const protectedRoute = Route.POST('/users', async (ctx) => {
 * const userData = ctx.requestBody();
 * // Create user logic
 * }, {
 * middleware: [authMiddleware, validationMiddleware],
 * constraints: { id: '\\d+' },
 * description: 'Create a new user'
 * });
 * // Route with all options
 * const complexRoute = Route.PUT('/users/:id/posts/:postId', (ctx) => {
 * // Update post logic
 * }, {
 * middleware: [authMiddleware, rateLimitMiddleware],
 * constraints: {
 * id: '\\d+',
 * postId: '\\d+'
 * },
 * description: 'Update a specific post for a user'
 * });
 * ```
 */

/**
 * Configuration options for route creation.
 *
 * @typedef {Object} RouteOptions
 * @property {import('./middleware.js').Handler[]} [middleware] - Route-specific middleware functions
 * @property {Object.<string, any>} [constraints] - Parameter constraints for validation
 * @property {string} [description] - Route description for documentation
 */
export class Route {
	/**
	 * Creates a new GET route with the specified path and handler.
	 *
	 * This is a convenience factory method for creating GET routes.
	 * It automatically sets the HTTP method to GET and configures
	 * the route with the provided options.
	 *
	 * **GET Method**: Used for retrieving resources. GET requests should
	 * be idempotent and safe, meaning they should not modify server state.
	 *
	 * @param {string} path - The URL path pattern (e.g., '/users/:id')
	 * @param {import('./middleware.js').Handler} handler - The function to handle the request
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} A new Route instance configured for GET requests
	 *
	 * @example
	 * ```javascript
	 * // Basic GET route
	 * const userRoute = Route.GET('/users/:id', (ctx) => {
	 *   const userId = ctx.pathParams.id;
	 *   const user = await getUserById(userId);
	 *   ctx.json(user);
	 * });
	 *
	 * // GET route with middleware
	 * const protectedRoute = Route.GET('/profile', (ctx) => {
	 *   ctx.json(ctx.data.user);
	 * }, {
	 *   middleware: [authMiddleware]
	 * });
	 *
	 * // GET route with constraints
	 * const validatedRoute = Route.GET('/users/:id', (ctx) => {
	 *   // Handler logic
	 * }, {
	 *   constraints: { id: '\\d+' },
	 *   description: 'Get user by ID'
	 * });
	 * ```
	 */
	static GET(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.GET;
		route.path = path;
		route.handler = handler;
		route.middleware = (options?.middleware || []).filter(Boolean);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new POST route with the specified path and handler.
	 *
	 * This is a convenience factory method for creating POST routes.
	 * It automatically sets the HTTP method to POST and configures
	 * the route with the provided options.
	 *
	 * **POST Method**: Used for creating new resources. POST requests
	 * typically include a request body with the data to create.
	 *
	 * @param {string} path - The URL path pattern (e.g., '/users')
	 * @param {import('./middleware.js').Handler} handler - The function to handle the request
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} A new Route instance configured for POST requests
	 *
	 * @example
	 * ```javascript
	 * // Basic POST route
	 * const createUserRoute = Route.POST('/users', async (ctx) => {
	 *   const userData = ctx.requestBody();
	 *   const newUser = await createUser(userData);
	 *   ctx.json(newUser);
	 * });
	 *
	 * // POST route with validation middleware
	 * const validatedRoute = Route.POST('/users', (ctx) => {
	 *   // Handler logic
	 * }, {
	 *   middleware: [validationMiddleware],
	 *   description: 'Create a new user'
	 * });
	 *
	 * // POST route with authentication
	 * const protectedRoute = Route.POST('/posts', (ctx) => {
	 *   // Create post logic
	 * }, {
	 *   middleware: [authMiddleware, rateLimitMiddleware]
	 * });
	 * ```
	 */
	static POST(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.POST;
		route.path = path;
		route.handler = handler;
		route.middleware = (options?.middleware || []).filter(Boolean);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new PUT route with the specified path and handler.
	 *
	 * This is a convenience factory method for creating PUT routes.
	 * It automatically sets the HTTP method to PUT and configures
	 * the route with the provided options.
	 *
	 * **PUT Method**: Used for replacing entire resources. PUT requests
	 * should be idempotent and typically include a complete resource
	 * representation in the request body.
	 *
	 * @param {string} path - The URL path pattern (e.g., '/users/:id')
	 * @param {import('./middleware.js').Handler} handler - The function to handle the request
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} A new Route instance configured for PUT requests
	 *
	 * @example
	 * ```javascript
	 * // Basic PUT route
	 * const updateUserRoute = Route.PUT('/users/:id', async (ctx) => {
	 *   const userId = ctx.pathParams.id;
	 *   const userData = ctx.requestBody();
	 *   const updatedUser = await updateUser(userId, userData);
	 *   ctx.json(updatedUser);
	 * });
	 *
	 * // PUT route with validation
	 * const validatedRoute = Route.PUT('/users/:id', (ctx) => {
	 *   // Update logic
	 * }, {
	 *   constraints: { id: '\\d+' },
	 *   middleware: [validationMiddleware]
	 * });
	 * ```
	 */
	static PUT(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.PUT;
		route.path = path;
		route.handler = handler;
		route.middleware = (options?.middleware || []).filter(Boolean);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new DELETE route with the specified path and handler.
	 *
	 * This is a convenience factory method for creating DELETE routes.
	 * It automatically sets the HTTP method to DELETE and configures
	 * the route with the provided options.
	 *
	 * **DELETE Method**: Used for removing resources. DELETE requests
	 * should be idempotent and typically don't include a request body.
	 *
	 * @param {string} path - The URL path pattern (e.g., '/users/:id')
	 * @param {import('./middleware.js').Handler} handler - The function to handle the request
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} A new Route instance configured for DELETE requests
	 *
	 * @example
	 * ```javascript
	 * // Basic DELETE route
	 * const deleteUserRoute = Route.DELETE('/users/:id', async (ctx) => {
	 *   const userId = ctx.pathParams.id;
	 *   await deleteUser(userId);
	 *   ctx.responseStatusCode = 204; // No Content
	 * });
	 *
	 * // DELETE route with confirmation
	 * const confirmedDeleteRoute = Route.DELETE('/users/:id', (ctx) => {
	 *   // Delete logic with confirmation
	 * }, {
	 *   middleware: [authMiddleware],
	 *   constraints: { id: '\\d+' }
	 * });
	 * ```
	 */
	static DELETE(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.DELETE;
		route.path = path;
		route.handler = handler;
		route.middleware = (options?.middleware || []).filter(Boolean);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new PATCH route with the specified path and handler.
	 *
	 * This is a convenience factory method for creating PATCH routes.
	 * It automatically sets the HTTP method to PATCH and configures
	 * the route with the provided options.
	 *
	 * **PATCH Method**: Used for partially updating resources. PATCH requests
	 * should be idempotent and typically include only the fields to update
	 * in the request body.
	 *
	 * @param {string} path - The URL path pattern (e.g., '/users/:id')
	 * @param {import('./middleware.js').Handler} handler - The function to handle the request
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} A new Route instance configured for PATCH requests
	 *
	 * @example
	 * ```javascript
	 * // Basic PATCH route
	 * const updateUserRoute = Route.PATCH('/users/:id', async (ctx) => {
	 *   const userId = ctx.pathParams.id;
	 *   const updates = ctx.requestBody();
	 *   const updatedUser = await updateUserPartial(userId, updates);
	 *   ctx.json(updatedUser);
	 * });
	 *
	 * // PATCH route with validation
	 * const validatedRoute = Route.PATCH('/users/:id', (ctx) => {
	 *   // Partial update logic
	 * }, {
	 *   middleware: [validationMiddleware],
	 *   constraints: { id: '\\d+' }
	 * });
	 * ```
	 */
	static PATCH(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.PATCH;
		route.path = path;
		route.handler = handler;
		route.middleware = (options?.middleware || []).filter(Boolean);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new HEAD route with the specified path and handler.
	 *
	 * This is a convenience factory method for creating HEAD routes.
	 * It automatically sets the HTTP method to HEAD and configures
	 * the route with the provided options.
	 *
	 * **HEAD Method**: Used for retrieving headers only, without the response body.
	 * HEAD requests are useful for checking if a resource exists or getting
	 * metadata without transferring the full content.
	 *
	 * @param {string} path - The URL path pattern (e.g., '/users/:id')
	 * @param {import('./middleware.js').Handler} handler - The function to handle the request
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} A new Route instance configured for HEAD requests
	 *
	 * @example
	 * ```javascript
	 * // Basic HEAD route
	 * const checkUserRoute = Route.HEAD('/users/:id', async (ctx) => {
	 *   const userId = ctx.pathParams.id;
	 *   const exists = await userExists(userId);
	 *   if (!exists) {
	 *     ctx.responseStatusCode = 404;
	 *   }
	 *   // No response body for HEAD requests
	 * });
	 *
	 * // HEAD route for file metadata
	 * const fileInfoRoute = Route.HEAD('/files/:id', (ctx) => {
	 *   const fileId = ctx.pathParams.id;
	 *   const fileInfo = getFileInfo(fileId);
	 *   ctx.responseHeaders.set('content-length', fileInfo.size);
	 *   ctx.responseHeaders.set('last-modified', fileInfo.modified);
	 * });
	 * ```
	 */
	static HEAD(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.HEAD;
		route.path = path;
		route.handler = handler;
		route.middleware = (options?.middleware || []).filter(Boolean);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new OPTIONS route with the specified path and handler.
	 *
	 * This is a convenience factory method for creating OPTIONS routes.
	 * It automatically sets the HTTP method to OPTIONS and configures
	 * the route with the provided options.
	 *
	 * **OPTIONS Method**: Used for discovering the allowed HTTP methods
	 * and other capabilities of a resource. OPTIONS requests are commonly
	 * used for CORS preflight requests.
	 *
	 * @param {string} path - The URL path pattern (e.g., '/users')
	 * @param {import('./middleware.js').Handler} handler - The function to handle the request
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} A new Route instance configured for OPTIONS requests
	 *
	 * @example
	 * ```javascript
	 * // Basic OPTIONS route
	 * const corsRoute = Route.OPTIONS('/users', (ctx) => {
	 *   ctx.responseHeaders.set('access-control-allow-methods', 'GET, POST, PUT, DELETE');
	 *   ctx.responseHeaders.set('access-control-allow-headers', 'Content-Type, Authorization');
	 *   ctx.responseHeaders.set('access-control-max-age', '86400');
	 *   ctx.responseStatusCode = 204;
	 * });
	 *
	 * // OPTIONS route with dynamic methods
	 * const dynamicOptionsRoute = Route.OPTIONS('/users/:id', (ctx) => {
	 *   const allowedMethods = ['GET', 'PUT', 'DELETE'];
	 *   ctx.responseHeaders.set('access-control-allow-methods', allowedMethods.join(', '));
	 *   ctx.responseStatusCode = 204;
	 * });
	 * ```
	 */
	static OPTIONS(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.OPTIONS;
		route.path = path;
		route.handler = handler;
		route.middleware = (options?.middleware || []).filter(Boolean);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new COMMAND route with the specified path and handler.
	 *
	 * This is a convenience factory method for creating COMMAND routes.
	 * It automatically sets the HTTP method to COMMAND and configures
	 * the route with the provided options.
	 *
	 * **COMMAND Method**: Used for CLI command execution. COMMAND routes
	 * handle terminal commands through the Wings routing system, enabling
	 * unified handling of both HTTP requests and CLI operations.
	 *
	 * @param {string} path - The command path pattern (e.g., '/git/commit')
	 * @param {import('./middleware.js').Handler} handler - The function to handle the command
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} A new Route instance configured for COMMAND execution
	 *
	 * @example
	 * ```javascript
	 * // Basic COMMAND route
	 * const gitCommitRoute = Route.COMMAND('/git/commit', async (ctx) => {
	 *   const message = ctx.queryParams.get('message') || 'Default commit message';
	 *   await executeGitCommit(message);
	 *   ctx.text('✅ Committed successfully');
	 * });
	 *
	 * // COMMAND route with interactive input
	 * const interactiveRoute = Route.COMMAND('/user/create', async (ctx) => {
	 *   let name = ctx.queryParams.get('name');
	 *   if (!name) {
	 *     name = await readline.question('Enter username: ');
	 *   }
	 *   const user = await createUser(name);
	 *   ctx.json(user);
	 * });
	 *
	 * // COMMAND route with validation
	 * const validatedRoute = Route.COMMAND('/deploy/:environment', (ctx) => {
	 *   const env = ctx.pathParams.environment;
	 *   console.log(`Deploying to ${env}...`);
	 *   ctx.text(`✅ Deployed to ${env}`);
	 * }, {
	 *   constraints: { environment: 'staging|production' },
	 *   description: 'Deploy application to specified environment'
	 * });
	 * ```
	 */
	static COMMAND(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.COMMAND;
		route.path = path;
		route.handler = handler;
		route.middleware = (options?.middleware || []).filter(Boolean);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * The HTTP method for this route.
	 *
	 * This property specifies which HTTP method this route handles.
	 * It defaults to GET but can be modified after route creation.
	 *
	 * **Valid Values**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
	 *
	 * @type {import('./http-methods.js').HttpMethod}
	 *
	 * @example
	 * ```javascript
	 * const route = new Route();
	 * console.log(route.method); // 'GET'
	 *
	 * route.method = HTTP_METHODS.POST;
	 * console.log(route.method); // 'POST'
	 *
	 * // Or use factory methods
	 * const postRoute = Route.POST('/users', handler);
	 * console.log(postRoute.method); // 'POST'
	 * ```
	 */
	method = HTTP_METHODS.GET;

	/**
	 * The URL path pattern for this route.
	 *
	 * This property defines the URL pattern that this route matches.
	 * It can include path parameters (e.g., ':id') and supports
	 * various path patterns for flexible routing.
	 *
	 * **Path Patterns**:
	 * - Static paths: '/users', '/api/v1/users'
	 * - Path parameters: '/users/:id', '/posts/:postId/comments/:commentId'
	 * - Optional segments: '/users/:id?', '/posts/:postId?/comments'
	 *
	 * @type {string}
	 *
	 * @example
	 * ```javascript
	 * const route = new Route();
	 * console.log(route.path); // ''
	 *
	 * route.path = '/users/:id';
	 * console.log(route.path); // '/users/:id'
	 *
	 * // Or use factory methods
	 * const userRoute = Route.GET('/users/:id', handler);
	 * console.log(userRoute.path); // '/users/:id'
	 *
	 * // Complex path patterns
	 * const complexRoute = Route.GET('/api/v1/users/:userId/posts/:postId', handler);
	 * console.log(complexRoute.path); // '/api/v1/users/:userId/posts/:postId'
	 * ```
	 */
	path = "";

	/**
	 * The function that handles HTTP requests for this route.
	 *
	 * This property contains the function that will be executed when
	 * a request matches this route. The handler receives a Context
	 * object and can be synchronous or asynchronous.
	 *
	 * **Handler Function Signature**: `(ctx: Context) => void | Promise<void>`
	 *
	 * **Default Behavior**: The default handler is an empty function
	 * that does nothing. You should always set a proper handler.
	 *
	 * @type {import('./middleware.js').Handler}
	 *
	 * @example
	 * ```javascript
	 * const route = new Route();
	 * console.log(typeof route.handler); // 'function'
	 *
	 * // Set a custom handler
	 * route.handler = (ctx) => {
	 *   ctx.json({ message: 'Hello World' });
	 * };
	 *
	 * // Async handler
	 * route.handler = async (ctx) => {
	 *   const data = await fetchData();
	 *   ctx.json(data);
	 * };
	 *
	 * // Or use factory methods
	 * const userRoute = Route.GET('/users/:id', (ctx) => {
	 *   const userId = ctx.pathParams.id;
	 *   ctx.json({ id: userId, name: 'John Doe' });
	 * });
	 * ```
	 */
	handler = () => {};

	/**
	 * Internal storage for route-specific middleware functions.
	 *
	 * This private field stores the array of middleware functions
	 * that will be executed for this specific route.
	 *
	 * @type {import('./middleware.js').Handler[]}
	 */
	_middleware = [];

	/**
	 * Internal storage for parameter constraints.
	 *
	 * This private field stores the constraints object used for
	 * validating path parameters.
	 *
	 * @type {Object.<string, any>}
	 */
	_constraints = {};

	/**
	 * Internal storage for route description.
	 *
	 * This private field stores the description string used for
	 * documentation purposes.
	 *
	 * @type {string}
	 */
	_description = "";

	/**
	 * Sets the middleware functions for this route.
	 *
	 * This setter automatically filters out null/undefined values
	 * and ensures the middleware is always an array. If a non-array
	 * value is provided, it defaults to an empty array.
	 *
	 * **Validation**: Only arrays are accepted. Non-array values
	 * result in an empty middleware array.
	 *
	 * @param {import('./middleware.js').Handler[]} value - Array of middleware functions
	 *
	 * @example
	 * ```javascript
	 * const route = new Route();
	 *
	 * // Set middleware array
	 * route.middleware = [authMiddleware, validationMiddleware];
	 * console.log(route.middleware.length); // 2
	 *
	 * // Filter out null/undefined values
	 * route.middleware = [authMiddleware, null, validationMiddleware, undefined];
	 * console.log(route.middleware.length); // 2
	 *
	 * // Non-array values result in empty array
	 * route.middleware = 'not an array';
	 * console.log(route.middleware.length); // 0
	 *
	 * route.middleware = null;
	 * console.log(route.middleware.length); // 0
	 * ```
	 */
	set middleware(value) {
		this._middleware = Array.isArray(value) ? value.filter(Boolean) : [];
	}

	/**
	 * Gets the middleware functions for this route.
	 *
	 * This getter returns the array of middleware functions.
	 * If no middleware is set, it returns an empty array.
	 *
	 * @returns {import('./middleware.js').Handler[]} Array of middleware functions
	 *
	 * @example
	 * ```javascript
	 * const route = new Route();
	 * console.log(route.middleware); // []
	 *
	 * route.middleware = [authMiddleware];
	 * console.log(route.middleware.length); // 1
	 * console.log(route.middleware[0]); // authMiddleware function
	 *
	 * // Iterate over middleware
	 * route.middleware.forEach(middleware => {
	 *   console.log('Middleware:', middleware.name);
	 * });
	 * ```
	 */
	get middleware() {
		return this._middleware || [];
	}

	/**
	 * Sets the parameter constraints for this route.
	 *
	 * This setter validates that the value is an object and sets
	 * the constraints for path parameter validation. If a non-object
	 * value is provided, it defaults to an empty object.
	 *
	 * **Validation**: Only objects are accepted. Non-object values
	 * result in an empty constraints object.
	 *
	 * @param {Object.<string, any>} value - Object containing parameter constraints
	 *
	 * @example
	 * ```javascript
	 * const route = new Route();
	 *
	 * // Set constraints object
	 * route.constraints = { id: '\\d+', name: '[a-zA-Z]+' };
	 * console.log(Object.keys(route.constraints).length); // 2
	 *
	 * // Non-object values result in empty object
	 * route.constraints = 'not an object';
	 * console.log(Object.keys(route.constraints).length); // 0
	 *
	 * route.constraints = null;
	 * console.log(Object.keys(route.constraints).length); // 0
	 *
	 * // Arrays are objects, so they're accepted
	 * route.constraints = ['id', 'name'];
	 * console.log(Array.isArray(route.constraints)); // true
	 * ```
	 */
	set constraints(value) {
		this._constraints = value && typeof value === "object" ? value : {};
	}

	/**
	 * Gets the parameter constraints for this route.
	 *
	 * This getter returns the constraints object used for validating
	 * path parameters. If no constraints are set, it returns an empty object.
	 *
	 * @returns {Object.<string, any>} Object containing parameter constraints
	 *
	 * @example
	 * ```javascript
	 * const route = new Route();
	 * console.log(route.constraints); // {}
	 *
	 * route.constraints = { id: '\\d+', name: '[a-zA-Z]+' };
	 * console.log(route.constraints.id); // '\\d+'
	 * console.log(route.constraints.name); // '[a-zA-Z]+'
	 *
	 * // Check if constraint exists
	 * if (route.constraints.id) {
	 *   console.log('ID constraint:', route.constraints.id);
	 * }
	 *
	 * // Iterate over constraints
	 * Object.entries(route.constraints).forEach(([param, pattern]) => {
	 *   console.log(`Parameter ${param} must match: ${pattern}`);
	 * });
	 * ```
	 */
	get constraints() {
		return this._constraints || {};
	}

	/**
	 * Sets the description for this route.
	 *
	 * This setter validates that the value is a string and sets
	 * the description for documentation purposes. If a non-string
	 * value is provided, it defaults to an empty string.
	 *
	 * **Validation**: Only strings are accepted. Non-string values
	 * result in an empty description.
	 *
	 * @param {string} value - Description string for the route
	 *
	 * @example
	 * ```javascript
	 * const route = new Route();
	 *
	 * // Set description string
	 * route.description = 'Get user by ID';
	 * console.log(route.description); // 'Get user by ID'
	 *
	 * // Non-string values result in empty string
	 * route.description = 123;
	 * console.log(route.description); // ''
	 *
	 * route.description = null;
	 * console.log(route.description); // ''
	 *
	 * route.description = {};
	 * console.log(route.description); // ''
	 *
	 * // Empty string is valid
	 * route.description = '';
	 * console.log(route.description); // ''
	 * ```
	 */
	set description(value) {
		this._description = typeof value === "string" ? value : "";
	}

	/**
	 * Gets the description for this route.
	 *
	 * This getter returns the description string used for documentation.
	 * If no description is set, it returns an empty string.
	 *
	 * @returns {string} Description string for the route
	 *
	 * @example
	 * ```javascript
	 * const route = new Route();
	 * console.log(route.description); // ''
	 *
	 * route.description = 'Create a new user';
	 * console.log(route.description); // 'Create a new user'
	 *
	 * // Check if description exists
	 * if (route.description) {
	 *   console.log('Route description:', route.description);
	 * }
	 *
	 * // Use in documentation generation
	 * function generateRouteDocs(routes) {
	 *   return routes.map(route => ({
	 *     method: route.method,
	 *     path: route.path,
	 *     description: route.description || 'No description available'
	 *   }));
	 * }
	 * ```
	 */
	get description() {
		return this._description || "";
	}
}
