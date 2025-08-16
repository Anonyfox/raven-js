/**
 * @typedef {Object} FeatherOptions
 * @property {import('./middleware.js').Handler[]} [middleware] - Route-specific middleware functions
 * @property {Object.<string, any>} [constraints] - Parameter constraints for validation
 * @property {string} [description] - Route description for documentation
 */

/**
 * Represents a route in the Wings system.
 * @class
 */
export class Feather {
	/**
	 * shortcut for creating a new default Feather instance with the GET method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {FeatherOptions} [options] - Optional route configuration
	 * @returns {Feather}
	 */
	static GET(path, handler, options = {}) {
		const feather = new Feather();
		feather.method = "GET";
		feather.path = path;
		feather.handler = handler;
		feather.middleware = options.middleware || [];
		feather.constraints = options.constraints || {};
		feather.description = options.description || "";
		return feather;
	}

	/**
	 * shortcut for creating a new default Feather instance with the POST method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {FeatherOptions} [options] - Optional route configuration
	 * @returns {Feather}
	 */
	static POST(path, handler, options = {}) {
		const feather = new Feather();
		feather.method = "POST";
		feather.path = path;
		feather.handler = handler;
		feather.middleware = options.middleware || [];
		feather.constraints = options.constraints || {};
		feather.description = options.description || "";
		return feather;
	}

	/**
	 * shortcut for creating a new default Feather instance with the PUT method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {FeatherOptions} [options] - Optional route configuration
	 * @returns {Feather}
	 */
	static PUT(path, handler, options = {}) {
		const feather = new Feather();
		feather.method = "PUT";
		feather.path = path;
		feather.handler = handler;
		feather.middleware = options.middleware || [];
		feather.constraints = options.constraints || {};
		feather.description = options.description || "";
		return feather;
	}

	/**
	 * shortcut for creating a new default Feather instance with the DELETE method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {FeatherOptions} [options] - Optional route configuration
	 * @returns {Feather}
	 */
	static DELETE(path, handler, options = {}) {
		const feather = new Feather();
		feather.method = "DELETE";
		feather.path = path;
		feather.handler = handler;
		feather.middleware = options.middleware || [];
		feather.constraints = options.constraints || {};
		feather.description = options.description || "";
		return feather;
	}

	/**
	 * shortcut for creating a new default Feather instance with the PATCH method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {FeatherOptions} [options] - Optional route configuration
	 * @returns {Feather}
	 */
	static PATCH(path, handler, options = {}) {
		const feather = new Feather();
		feather.method = "PATCH";
		feather.path = path;
		feather.handler = handler;
		feather.middleware = options.middleware || [];
		feather.constraints = options.constraints || {};
		feather.description = options.description || "";
		return feather;
	}

	/**
	 * shortcut for creating a new default Feather instance with the HEAD method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {FeatherOptions} [options] - Optional route configuration
	 * @returns {Feather}
	 */
	static HEAD(path, handler, options = {}) {
		const feather = new Feather();
		feather.method = "HEAD";
		feather.path = path;
		feather.handler = handler;
		feather.middleware = options.middleware || [];
		feather.constraints = options.constraints || {};
		feather.description = options.description || "";
		return feather;
	}

	/**
	 * shortcut for creating a new default Feather instance with the OPTIONS method
	 *
	 * @param {string} path
	 * @param {import('./middleware.js').Handler} handler
	 * @param {FeatherOptions} [options] - Optional route configuration
	 * @returns {Feather}
	 */
	static OPTIONS(path, handler, options = {}) {
		const feather = new Feather();
		feather.method = "OPTIONS";
		feather.path = path;
		feather.handler = handler;
		feather.middleware = options.middleware || [];
		feather.constraints = options.constraints || {};
		feather.description = options.description || "";
		return feather;
	}

	/**
	 * HTTP Method
	 *
	 * @type {string}
	 */
	method = "GET";

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
	middleware = [];

	/**
	 * Parameter constraints for validation
	 *
	 * @type {Object.<string, any>}
	 */
	constraints = {};

	/**
	 * Route description for documentation
	 *
	 * @type {string}
	 */
	description = "";
}
