import { Feather } from "./feather.js";
import { Trie } from "./trie.js";

/**
 * Represents a Wings instance, part of the RavenJS framework.
 *
 * Wings is a lean and fast Router that can be used to handle HTTP requests,
 * and works in tandem with the Current class for lifecycle management.
 *
 * Works similar to ExpressJS, but is more lightweight and focused, and most of
 * of all: is isomorphic, meaning it can be used in the browser as well.
 *
 * Uses a modified Trie data structure under the hood, this means for performance:
 * it should be one of the fastest routers you can find in the JS ecosystem, both
 * in (a) terms of adding routes and (b) finding the correct handler for a request,
 * in exchange for a bit more memory usage (mostly less than 1 kb), and exploiting
 * the fact that most routes have only 1-5 segments in reality.
 * (iE: `/users/:id` == `2` segments)
 *
 * (a) Adding a new route is O(n) with n being the length of the path segments.
 *
 * (b) Finding the correct handler is O(m) with m being the number of segments in the path.
 *
 * In both cases the total number of routes actually is irrelevant. Put simply,
 * matching an incoming route is O(1) and building up the Router completely is O(n)
 * when the number of segments is negligible.
 *
 * Most naive implementations trade one for the other. Since Wings is designed for
 * usage _outside_ of a specific server environment, the performance of (a) is also
 * important, and the memory overhead is negligible in most cases. For example think
 * of a serverless function that is cold-started on every request, or a browser
 * environment where you want to handle routing in a SPA - in both cases, the
 * buildup of the router AND the matching has to be waited for before the actual
 * code can be executed. Bonus: the Wings code (especially when minified) is also tiny
 * and has zero dependencies, **and** is written in an imperative way that minimizes
 * memory allocations in general and shortcircuiting where possible with early returns.
 *
 * Bonus features:
 *
 * - order of route declaration does NOT matter, as the router will find the best match
 *   (best meaning the most specific one) for a given request.
 * - wildcards are supported
 * - possible overlapping routes throw an error at build time directly
 *   (so during development/testing, anytime the code is run, no matter where and how)
 * - every route handler and middleware is async by default, no callback hell
 *
 * **Note**: The important detail is that Wings contains pure JS classes without any
 * assumption of a specific http server implementation, or any server code, at all.
 * If you can _somehow_ map your "request" to a Current instance, you can use Wings,
 * and call it from any runtime environment you can imagine, from nodejs to
 * serverless functions, to the browser, ... and so on.
 *
 * Tradeoffs:
 *
 * - no web socket support.
 * - only modern JS environments are supported.
 * - ESM only, no CommonJS support.
 */
export class Wings {
	/**
	 * the registered feathers (aka routes).
	 *
	 * the list is append-only, so its safe to use positional indices as IDs.
	 *
	 * @type {import('./feather.js').Feather[]}
	 */
	#feathers = [];

	/**
	 * tries for fast route matching of requests, dedicated for each http method.
	 *
	 * @type {Object<string, Trie>}
	 */
	#tries = {};

	/**
	 * the registered coverts (= middlewares).
	 *
	 * @type {import('./middleware.js').Handler[]}
	 */
	#coverts = [];

	/**
	 * Creates a new Wings instance with all HTTP method tries pre-initialized.
	 */
	constructor() {
		// Initialize all HTTP method tries upfront for better performance
		this.#tries.GET = new Trie();
		this.#tries.POST = new Trie();
		this.#tries.PUT = new Trie();
		this.#tries.DELETE = new Trie();
		this.#tries.PATCH = new Trie();
		this.#tries.HEAD = new Trie();
		this.#tries.OPTIONS = new Trie();
	}

	/**
	 * Add a new Feather (=Route) instance to the server.
	 *
	 * @param {string} path - the path of the route, iE: `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Wings} The Wings instance for chaining.
	 */
	get(path, handler) {
		this.#tries.GET.register(
			this.#normalizePath(path).split("/"),
			this.#feathers.length,
		);

		const feather = Feather.GET(path, handler);
		this.#feathers.push(feather);

		return this;
	}

	/**
	 * Add a new Feather (=Route) instance to the server for POST requests.
	 *
	 * @param {string} path - the path of the route, i.e., `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Wings} The Wings instance for chaining.
	 */
	post(path, handler) {
		this.#tries.POST.register(
			this.#normalizePath(path).split("/"),
			this.#feathers.length,
		);

		const feather = Feather.POST(path, handler);
		this.#feathers.push(feather);

		return this;
	}

	/**
	 * Add a new Feather (=Route) instance to the server for PUT requests.
	 *
	 * @param {string} path - the path of the route, i.e., `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Wings} The Wings instance for chaining.
	 */
	put(path, handler) {
		this.#tries.PUT.register(
			this.#normalizePath(path).split("/"),
			this.#feathers.length,
		);

		const feather = Feather.PUT(path, handler);
		this.#feathers.push(feather);

		return this;
	}

	/**
	 * Add a new Feather (=Route) instance to the server for DELETE requests.
	 *
	 * @param {string} path - the path of the route, i.e., `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Wings} The Wings instance for chaining.
	 */
	delete(path, handler) {
		this.#tries.DELETE.register(
			this.#normalizePath(path).split("/"),
			this.#feathers.length,
		);

		const feather = Feather.DELETE(path, handler);
		this.#feathers.push(feather);

		return this;
	}

	/**
	 * Add a new Feather (=Route) instance to the server for PATCH requests.
	 *
	 * @param {string} path - the path of the route, i.e., `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Wings} The Wings instance for chaining.
	 */
	patch(path, handler) {
		this.#tries.PATCH.register(
			this.#normalizePath(path).split("/"),
			this.#feathers.length,
		);

		const feather = Feather.PATCH(path, handler);
		this.#feathers.push(feather);

		return this;
	}

	/**
	 * Add a new Feather (=Route) instance to the server for HEAD requests.
	 *
	 * @param {string} path - the path of the route, i.e., `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Wings} The Wings instance for chaining.
	 */
	head(path, handler) {
		this.#tries.HEAD.register(
			this.#normalizePath(path).split("/"),
			this.#feathers.length,
		);

		const feather = Feather.HEAD(path, handler);
		this.#feathers.push(feather);

		return this;
	}

	/**
	 * Add a new Feather (=Route) instance to the server for OPTIONS requests.
	 *
	 * @param {string} path - the path of the route, i.e., `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Wings} The Wings instance for chaining.
	 */
	options(path, handler) {
		this.#tries.OPTIONS.register(
			this.#normalizePath(path).split("/"),
			this.#feathers.length,
		);

		const feather = Feather.OPTIONS(path, handler);
		this.#feathers.push(feather);

		return this;
	}

	/**
	 * Add a new Feather (=Route) instance to the server.
	 * This is a more flexible way to add a route, as it allows for any HTTP method.
	 *
	 * @param {import('./feather.js').Feather} feather - the Feather instance to add
	 * @returns {Wings} The Wings instance for chaining.
	 */
	addFeather(feather) {
		const method = feather.method;
		// For custom methods, create trie if it doesn't exist
		if (!this.#tries[method]) this.#tries[method] = new Trie();
		this.#tries[method].register(
			this.#normalizePath(feather.path).split("/"),
			this.#feathers.length,
		);
		this.#feathers.push(feather);

		return this;
	}

	/**
	 * Appends a covert callback function to the Wings instance. (push to the array)
	 *
	 * These will run *before* the actual handler is called, in order.
	 *
	 * @param {import('./middleware.js').Handler} callback - The covert function to add.
	 * @returns {Wings} The Wings instance for chaining.
	 */
	use(callback) {
		// functions with an identifier are considered unique middlewares
		if (Object.keys(callback).includes("identifier")) {
			const value = /** @type {any} */ (callback).identifier;
			const exists = this.#coverts.some(
				(/** @type {any} */ c) => c.identifier === value,
			);
			if (exists) return this;
		}

		this.#coverts.push(callback);
		return this;
	}

	/**
	 * Prepends a covert callback function to the Wings instance. (unshift to the array)
	 *
	 * These will run *before* the actual handler is called, in order.
	 *
	 * @param {import('./middleware.js').Handler} callback - The covert function to add.
	 * @returns {Wings} The Wings instance for chaining.
	 */
	useEarly(callback) {
		// functions with an identifier are considered unique middlewares
		if (Object.keys(callback).includes("identifier")) {
			const identifier = /** @type {any} */ (callback).identifier;
			const exists = this.#coverts.some(
				(/** @type {any} */ c) => c.identifier === identifier,
			);
			if (exists) return this;
		}

		this.#coverts.unshift(callback);
		return this;
	}

	/**
	 * @param {string} method
	 * @param {string} requestPath
	 * @returns {{feather: import('./feather.js').Feather | undefined, params: Object<string, string>}}
	 */
	#match(method, requestPath) {
		const path = this.#normalizePath(requestPath);
		const pathSegments = path.split("/");

		// security check to prevent CPU exhaustion attacks here
		// this scenario should never happen in a real-world application with
		// reasonable path lengths
		if (pathSegments.length > 100) throw new Error("Path too long");

		const trie = this.#tries[method];
		if (!trie) return { feather: undefined, params: {} };

		const { id, params } = this.#tries[method].match(pathSegments);
		if (id < 0) return { feather: undefined, params };

		return { feather: this.#feathers[id], params };
	}

	/**
	 * @param {string} path
	 * @returns {string}
	 */
	#normalizePath(path) {
		let p = path;
		p = p.replace(/^\/|\/$/g, "");
		return p;
	}

	/**
	 * Handle an incoming request, including all middlewares and the actual handler.
	 *
	 * This will mutate the given `Current` instance (and return it for convenience).
	 *
	 * @param {import('./current.js').Current} current - The current http lifecycle
	 * @returns {Promise<import('./current.js').Current>} The modified current instance
	 */
	async handleRequest(current) {
		try {
			// run all before hooks first on the current instance
			for (const middleware of this.#coverts) {
				current.addBeforeCallback(middleware);
			}
			await current.runBeforeCallbacks();
			if (current.responseEnded) return current;

			// try to find a feather that matches the request
			const { feather, params } = this.#match(current.method, current.path);
			if (!feather) {
				current.responseStatusCode = 404;
				current.responseBody = "Not Found";
				return current;
			}

			// run the handler with the extracted pathParams
			current.pathParams = params;
			await feather.handler(current);
			if (current.responseEnded) return current;

			// run all after hooks
			await current.runAfterCallbacks();
		} catch (error) {
			console.error("Handler error:", error);
			if (!current.responseEnded) {
				current.responseStatusCode = 500;
				current.responseBody = "Internal Server Error";
				return current;
			}
		}
		return current;
	}

	/**
	 * List all registered paths.
	 *
	 * @param {string} [method] - optional HTTP method to filter for.
	 * @returns {import('./feather.js').Feather[]}
	 */
	listFeathers(method) {
		if (method) return this.#feathers.filter((p) => p.method === method);
		return this.#feathers;
	}
}
