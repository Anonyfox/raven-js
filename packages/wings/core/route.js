import { HTTP_METHODS } from "./http-methods.js";

/**
 * @typedef {Object} RouteOptions
 * @property {import('./middleware.js').Handler[]} [middleware] - Route-specific middleware functions
 * @property {Object.<string, any>} [constraints] - Parameter constraints for validation
 * @property {string} [description] - Route description for documentation
 */

/**
 * Represents a route in the Wings system.
 * @class
 */
export class Route {
	/**
	 * shortcut for creating a new default Route instance with the GET method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route}
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
	 * shortcut for creating a new default Route instance with the POST method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route}
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
	 * shortcut for creating a new default Route instance with the PUT method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route}
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
	 * shortcut for creating a new default Route instance with the DELETE method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route}
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
	 * shortcut for creating a new default Route instance with the PATCH method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route}
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
	 * shortcut for creating a new default Route instance with the HEAD method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route}
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
	 * shortcut for creating a new default Route instance with the OPTIONS method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {RouteOptions} [options] - Optional route configuration
	 * @returns {Route}
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
	 * HTTP Method
	 *
	 * @type {import('./http-methods.js').HttpMethod}
	 */
	method = HTTP_METHODS.GET;

	/**
	 * URL path
	 *
	 * @type {string}
	 */
	path = "";

	/**
	 * function to handle the http request
	 *
	 * @type {import('./middleware.js').Handler}
	 */
	handler = () => {};

	/**
	 * Route-specific middleware functions
	 *
	 * @type {import('./middleware.js').Handler[]}
	 */
	_middleware = [];

	/**
	 * Parameter constraints for validation
	 *
	 * @type {Object.<string, any>}
	 */
	_constraints = {};

	/**
	 * Route description for documentation
	 *
	 * @type {string}
	 */
	_description = "";

	/**
	 * Setter for middleware that filters out null/undefined values
	 *
	 * @param {import('./middleware.js').Handler[]} value
	 */
	set middleware(value) {
		this._middleware = Array.isArray(value) ? value.filter(Boolean) : [];
	}

	/**
	 * Getter for middleware
	 *
	 * @returns {import('./middleware.js').Handler[]}
	 */
	get middleware() {
		return this._middleware || [];
	}

	/**
	 * Setter for constraints that handles null/undefined
	 *
	 * @param {Object.<string, any>} value
	 */
	set constraints(value) {
		this._constraints = value && typeof value === "object" ? value : {};
	}

	/**
	 * Getter for constraints
	 *
	 * @returns {Object.<string, any>}
	 */
	get constraints() {
		return this._constraints || {};
	}

	/**
	 * Setter for description that handles null/undefined
	 *
	 * @param {string} value
	 */
	set description(value) {
		this._description = typeof value === "string" ? value : "";
	}

	/**
	 * Getter for description
	 *
	 * @returns {string}
	 */
	get description() {
		return this._description || "";
	}
}
