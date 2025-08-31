/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file HTTP route definition class with static factory methods for creating routes with specific HTTP methods.
 *
 * Provides the Route class for encapsulating HTTP method, path, handler function, and optional
 * configuration like middleware, parameter constraints, and descriptions. Includes validation and filtering utilities.
 */

import { HTTP_METHODS } from "./http-methods.js";

/**
 * Filters truthy middleware from arrays, removing null, undefined, and false values.
 *
 * @param {Array<import('./middleware.js').Handler|null|undefined|false>} middlewareArray - Array of middleware (may contain falsy values)
 * @returns {Array<import('./middleware.js').Handler>} Array containing only truthy middleware values
 */
function filterTruthyMiddleware(middlewareArray) {
	if (!Array.isArray(middlewareArray) || middlewareArray.length === 0) {
		return [];
	}

	const result = [];
	for (let i = 0; i < middlewareArray.length; i++) {
		const middleware = middlewareArray[i];
		if (middleware) {
			result.push(middleware);
		}
	}
	return result;
}

/**
 * HTTP route definition with method, path, handler, and optional configuration.
 *
 * @example
 * // Create routes using static methods
 * const getRoute = Route.GET('/users', async (ctx) => ctx.json(users));
 * const postRoute = Route.POST('/users', async (ctx) => ctx.json(newUser));
 *
 * @example
 * // Route with middleware and constraints
 * const route = Route.GET('/users/:id', handler, {
 *   middleware: [auth, validate],
 *   constraints: { id: /\d+/ }
 * });
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
	 * Creates a new GET route with specified path and handler.
	 *
	 * @param {string} path - URL path pattern
	 * @param {import('./middleware.js').Handler} handler - Request handler function
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} New Route instance for GET requests
	 *
	 * @example
	 * // Basic GET route
	 * const route = Route.GET('/users', async (ctx) => ctx.json(users));
	 *
	 * @example
	 * // GET route with middleware
	 * const route = Route.GET('/admin', handler, { middleware: [auth] });
	 */
	static GET(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.GET;
		route.path = path;
		route.handler = handler;
		route.middleware = filterTruthyMiddleware(options?.middleware || []);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new POST route with specified path and handler.
	 *
	 * @param {string} path - URL path pattern
	 * @param {import('./middleware.js').Handler} handler - Request handler function
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} New Route instance for POST requests
	 *
	 * @example
	 * // Basic POST route
	 * const route = Route.POST('/users', async (ctx) => ctx.json(newUser));
	 *
	 * @example
	 * // POST route with validation
	 * const route = Route.POST('/users', handler, { middleware: [validate] });
	 */
	static POST(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.POST;
		route.path = path;
		route.handler = handler;
		route.middleware = filterTruthyMiddleware(options?.middleware || []);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new PUT route with specified path and handler.
	 *
	 * @param {string} path - URL path pattern
	 * @param {import('./middleware.js').Handler} handler - Request handler function
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} New Route instance for PUT requests
	 *
	 * @example
	 * // Basic PUT route
	 * const route = Route.PUT('/users/:id', async (ctx) => ctx.json(updated));
	 *
	 * @example
	 * // PUT with constraints
	 * const route = Route.PUT('/users/:id', handler, { constraints: { id: /\d+/ } });
	 */
	static PUT(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.PUT;
		route.path = path;
		route.handler = handler;
		route.middleware = filterTruthyMiddleware(options?.middleware || []);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new DELETE route with specified path and handler.
	 *
	 * @param {string} path - URL path pattern
	 * @param {import('./middleware.js').Handler} handler - Request handler function
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} New Route instance for DELETE requests
	 *
	 * @example
	 * // Basic DELETE route
	 * const route = Route.DELETE('/users/:id', async (ctx) => ctx.status(204));
	 *
	 * @example
	 * // DELETE with authorization
	 * const route = Route.DELETE('/posts/:id', handler, { middleware: [auth] });
	 */
	static DELETE(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.DELETE;
		route.path = path;
		route.handler = handler;
		route.middleware = filterTruthyMiddleware(options?.middleware || []);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new PATCH route with specified path and handler.
	 *
	 * @param {string} path - URL path pattern
	 * @param {import('./middleware.js').Handler} handler - Request handler function
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} New Route instance for PATCH requests
	 *
	 * @example
	 * // Basic PATCH route
	 * const route = Route.PATCH('/users/:id', async (ctx) => ctx.json(patched));
	 *
	 * @example
	 * // PATCH with validation
	 * const route = Route.PATCH('/users/:id', handler, { middleware: [validate] });
	 */
	static PATCH(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.PATCH;
		route.path = path;
		route.handler = handler;
		route.middleware = filterTruthyMiddleware(options?.middleware || []);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new HEAD route with specified path and handler.
	 *
	 * @param {string} path - URL path pattern
	 * @param {import('./middleware.js').Handler} handler - Request handler function
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} New Route instance for HEAD requests
	 *
	 * @example
	 * // Basic HEAD route
	 * const route = Route.HEAD('/api/status', async (ctx) => ctx.status(200));
	 *
	 * @example
	 * // HEAD for resource existence check
	 * const route = Route.HEAD('/files/:id', async (ctx) => ctx.status(200));
	 */
	static HEAD(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.HEAD;
		route.path = path;
		route.handler = handler;
		route.middleware = filterTruthyMiddleware(options?.middleware || []);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new OPTIONS route with specified path and handler.
	 *
	 * @param {string} path - URL path pattern
	 * @param {import('./middleware.js').Handler} handler - Request handler function
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} New Route instance for OPTIONS requests
	 *
	 * @example
	 * // Basic OPTIONS route
	 * const route = Route.OPTIONS('/api/*', async (ctx) => ctx.status(200));
	 *
	 * @example
	 * // CORS preflight handler
	 * const route = Route.OPTIONS('/*', corsHandler);
	 */
	static OPTIONS(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.OPTIONS;
		route.path = path;
		route.handler = handler;
		route.middleware = filterTruthyMiddleware(options?.middleware || []);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * Creates a new COMMAND route with specified path and handler for CLI operations.
	 *
	 * @param {string} path - Command path pattern
	 * @param {import('./middleware.js').Handler} handler - Command handler function
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route} New Route instance for COMMAND execution
	 *
	 * @example
	 * // Basic CLI command
	 * const route = Route.COMMAND('build', async (ctx) => runBuild());
	 *
	 * @example
	 * // Command with parameters
	 * const route = Route.COMMAND('deploy :env', deployHandler);
	 */
	static COMMAND(path, handler, options = {}) {
		const route = new Route();
		route.method = HTTP_METHODS.COMMAND;
		route.path = path;
		route.handler = handler;
		route.middleware = filterTruthyMiddleware(options?.middleware || []);
		route.constraints = options?.constraints || {};
		route.description = options?.description || "";
		return route;
	}

	/**
	 * HTTP method for this route (defaults to GET).
	 *
	 * @type {import('./http-methods.js').HttpMethod}
	 */
	method = HTTP_METHODS.GET;

	/**
	 * URL path pattern for this route, supporting parameters like '/users/:id'.
	 *
	 * @type {string}
	 */
	path = "";

	/**
	 * Function that handles requests for this route.
	 *
	 * @type {import('./middleware.js').Handler}
	 */
	handler = () => {};

	/**
	 * Internal storage for route-specific middleware functions.
	 *
	 * @type {import('./middleware.js').Handler[]}
	 */
	_middleware = [];

	/**
	 * Internal storage for parameter constraints.
	 *
	 * @type {Object.<string, any>}
	 */
	_constraints = {};

	/**
	 * Internal storage for route description.
	 *
	 * @type {string}
	 */
	_description = "";

	/**
	 * Sets middleware functions, filtering out falsy values.
	 *
	 * @param {import('./middleware.js').Handler[]} value - Array of middleware functions
	 */
	set middleware(value) {
		this._middleware = Array.isArray(value)
			? filterTruthyMiddleware(value)
			: [];
	}

	/**
	 * Gets the middleware functions for this route.
	 *
	 * @returns {import('./middleware.js').Handler[]} Array of middleware functions
	 */
	get middleware() {
		return this._middleware || [];
	}

	/**
	 * Sets parameter constraints for path validation.
	 *
	 * @param {Object.<string, any>} value - Parameter constraints object
	 */
	set constraints(value) {
		this._constraints = value && typeof value === "object" ? value : {};
	}

	/**
	 * Gets parameter constraints for this route.
	 *
	 * @returns {Object.<string, any>} Parameter constraints object
	 */
	get constraints() {
		return this._constraints || {};
	}

	/**
	 * Sets description for this route.
	 *
	 * @param {string} value - Description string
	 */
	set description(value) {
		this._description = typeof value === "string" ? value : "";
	}

	/**
	 * Gets description for this route.
	 *
	 * @returns {string} Description string
	 */
	get description() {
		return this._description || "";
	}
}
