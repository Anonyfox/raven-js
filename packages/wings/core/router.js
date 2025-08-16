import { Route } from "./route.js";
import { Trie } from "./trie.js";

/**
 * Represents a Router instance, part of the RavenJS framework.
 *
 * Router is a lean and fast HTTP router that can be used to handle HTTP requests,
 * and works in tandem with the Context class for lifecycle management.
 *
 * Works similar to ExpressJS, but is more lightweight and focused, and most of
 * all: is isomorphic, meaning it can be used in the browser as well.
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
 * Most naive implementations trade one for the other. Since Router is designed for
 * usage _outside_ of a specific server environment, the performance of (a) is also
 * important, and the memory overhead is negligible in most cases. For example think
 * of a serverless function that is cold-started on every request, or a browser
 * environment where you want to handle routing in a SPA - in both cases, the
 * buildup of the router AND the matching has to be waited for before the actual
 * code can be executed. Bonus: the Router code (especially when minified) is also tiny
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
 * **Note**: The important detail is that Router contains pure JS classes without any
 * assumption of a specific http server implementation, or any server code, at all.
 * If you can _somehow_ map your "request" to a Context instance, you can use Router,
 * and call it from any runtime environment you can imagine, from nodejs to
 * serverless functions, to the browser, ... and so on.
 *
 * Tradeoffs:
 *
 * - no web socket support.
 * - only modern JS environments are supported.
 * - ESM only, no CommonJS support.
 */
export class Router {
	/**
	 * the registered routes.
	 *
	 * the list is append-only, so its safe to use positional indices as IDs.
	 *
	 * @type {import('./route.js').Route[]}
	 */
	#routes = [];

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
	 * Creates a new Router instance with all HTTP method tries pre-initialized.
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
	 * Add a new Route instance to the server.
	 *
	 * @param {string} path - the path of the route, iE: `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Router} The Router instance for chaining.
	 */
	get(path, handler) {
		this.#tries.GET.register(
			this.#normalizePath(path).split("/"),
			this.#routes.length,
		);

		const route = Route.GET(path, handler);
		this.#routes.push(route);

		return this;
	}

	/**
	 * Add a new Route instance to the server for POST requests.
	 *
	 * @param {string} path - the path of the route, i.e., `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Router} The Router instance for chaining.
	 */
	post(path, handler) {
		this.#tries.POST.register(
			this.#normalizePath(path).split("/"),
			this.#routes.length,
		);

		const route = Route.POST(path, handler);
		this.#routes.push(route);

		return this;
	}

	/**
	 * Add a new Route instance to the server for PUT requests.
	 *
	 * @param {string} path - the path of the route, i.e., `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Router} The Router instance for chaining.
	 */
	put(path, handler) {
		this.#tries.PUT.register(
			this.#normalizePath(path).split("/"),
			this.#routes.length,
		);

		const route = Route.PUT(path, handler);
		this.#routes.push(route);

		return this;
	}

	/**
	 * Add a new Route instance to the server for DELETE requests.
	 *
	 * @param {string} path - the path of the route, i.e., `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Router} The Router instance for chaining.
	 */
	delete(path, handler) {
		this.#tries.DELETE.register(
			this.#normalizePath(path).split("/"),
			this.#routes.length,
		);

		const route = Route.DELETE(path, handler);
		this.#routes.push(route);

		return this;
	}

	/**
	 * Add a new Route instance to the server for PATCH requests.
	 *
	 * @param {string} path - the path of the route, i.e., `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Router} The Router instance for chaining.
	 */
	patch(path, handler) {
		this.#tries.PATCH.register(
			this.#normalizePath(path).split("/"),
			this.#routes.length,
		);

		const route = Route.PATCH(path, handler);
		this.#routes.push(route);

		return this;
	}

	/**
	 * Add a new Route instance to the server for HEAD requests.
	 *
	 * @param {string} path - the path of the route, i.e., `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Router} The Router instance for chaining.
	 */
	head(path, handler) {
		this.#tries.HEAD.register(
			this.#normalizePath(path).split("/"),
			this.#routes.length,
		);

		const route = Route.HEAD(path, handler);
		this.#routes.push(route);

		return this;
	}

	/**
	 * Add a new Route instance to the server for OPTIONS requests.
	 *
	 * @param {string} path - the path of the route, i.e., `/users/:id`
	 * @param {import('./middleware.js').Handler} handler - the route handler function
	 * @returns {Router} The Router instance for chaining.
	 */
	options(path, handler) {
		this.#tries.OPTIONS.register(
			this.#normalizePath(path).split("/"),
			this.#routes.length,
		);

		const route = Route.OPTIONS(path, handler);
		this.#routes.push(route);

		return this;
	}

	/**
	 * Add a new Route instance to the server.
	 * This is a more flexible way to add a route, as it allows for any HTTP method.
	 *
	 * @param {import('./route.js').Route} route - the Route instance to add
	 * @returns {Router} The Router instance for chaining.
	 */
	addRoute(route) {
		const method = route.method;
		// For custom methods, create trie if it doesn't exist
		if (!this.#tries[method]) this.#tries[method] = new Trie();
		this.#tries[method].register(
			this.#normalizePath(route.path).split("/"),
			this.#routes.length,
		);
		this.#routes.push(route);

		return this;
	}

	/**
	 * Appends a middleware callback function to the Router instance. (push to the array)
	 *
	 * These will run *before* the actual handler is called, in order.
	 *
	 * @param {import('./middleware.js').Handler} callback - The middleware function to add.
	 * @returns {Router} The Router instance for chaining.
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
	 * Prepends a middleware callback function to the Router instance. (unshift to the array)
	 *
	 * These will run *before* the actual handler is called, in order.
	 *
	 * @param {import('./middleware.js').Handler} callback - The middleware function to add.
	 * @returns {Router} The Router instance for chaining.
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
	 * @returns {{route: import('./route.js').Route | undefined, params: Object<string, string>}}
	 */
	#match(method, requestPath) {
		const path = this.#normalizePath(requestPath);
		const pathSegments = path.split("/");

		// security check to prevent CPU exhaustion attacks here
		// this scenario should never happen in a real-world application with
		// reasonable path lengths
		if (pathSegments.length > 100) throw new Error("Path too long");

		const trie = this.#tries[method];
		if (!trie) return { route: undefined, params: {} };

		const { id, params } = this.#tries[method].match(pathSegments);
		if (id < 0) return { route: undefined, params };

		return { route: this.#routes[id], params };
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
	 * This will mutate the given `Context` instance (and return it for convenience).
	 *
	 * @param {import('./context.js').Context} ctx - The http lifecycle context
	 * @returns {Promise<import('./context.js').Context>} The modified context instance
	 */
	async handleRequest(ctx) {
		try {
			// run all before hooks first on the context instance
			for (const middleware of this.#coverts) {
				ctx.addBeforeCallback(middleware);
			}
			await ctx.runBeforeCallbacks();
			if (ctx.responseEnded) return ctx;

			// try to find a route that matches the request
			const { route, params } = this.#match(ctx.method, ctx.path);
			if (!route) {
				ctx.responseStatusCode = 404;
				ctx.responseBody = "Not Found";
				return ctx;
			}

			// run the handler with the extracted pathParams
			ctx.pathParams = params;
			await route.handler(ctx);
			if (ctx.responseEnded) return ctx;

			// run all after hooks
			await ctx.runAfterCallbacks();
		} catch (error) {
			console.error("Handler error:", error);
			if (!ctx.responseEnded) {
				ctx.responseStatusCode = 500;
				ctx.responseBody = "Internal Server Error";
				return ctx;
			}
		}
		return ctx;
	}

	/**
	 * List all registered paths.
	 *
	 * @param {string} [method] - optional HTTP method to filter for.
	 * @returns {import('./route.js').Route[]}
	 */
	listRoutes(method) {
		if (method) return this.#routes.filter((p) => p.method === method);
		return this.#routes;
	}
}
