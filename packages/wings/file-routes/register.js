/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Router registration utilities for file-based routes
 */

import { scanRoutes } from "./scanner.js";

/**
 * Route handler function type
 * @typedef {function(import("../core/context.js").Context, import("./file-route.js").FileRoute): Promise<void>} RouteHandler
 */

/**
 * Scanner options (from scanner.js)
 * @typedef {Object} ScanOptions
 * @property {string} indexFile - Index file name (default: "index.js")
 * @property {boolean} includeNested - Include nested index files (default: true)
 * @property {string} baseDir - Base directory for resolving absolute paths
 */

/**
 * Registration options
 * @typedef {Object} RegisterOptions
 * @property {RouteHandler} [handler] - Custom route handler function
 * @property {string} [method] - HTTP method to register (default: "GET")
 */

/**
 * Register file-based routes with a Wings router
 *
 * @param {import("../core/router.js").Router} router - Wings router instance
 * @param {string|object} pagesDir - Pages directory or scan options
 * @param {Partial<RegisterOptions & ScanOptions>} [options] - Registration and scan options
 * @returns {Promise<import("./file-route.js").FileRoute[]>} Array of registered routes
 *
 * @example
 * // Basic registration with default handler
 * const routes = await registerFileRoutes(router, "src/pages");
 *
 * @example
 * // Custom handler
 * const routes = await registerFileRoutes(router, "src/pages", {
 *   handler: async (ctx, route) => {
 *     const pageModule = await import(route.module);
 *     // Custom page handling logic
 *     ctx.html(pageModule.render());
 *   }
 * });
 *
 * @example
 * // Different HTTP method
 * const routes = await registerFileRoutes(router, "src/api", {
 *   method: "POST",
 *   handler: async (ctx, route) => {
 *     const apiModule = await import(route.module);
 *     const result = await apiModule.handler(ctx);
 *     ctx.json(result);
 *   }
 * });
 */
export async function registerFileRoutes(router, pagesDir, options = {}) {
	const {
		handler = defaultRouteHandler,
		method = "GET",
		indexFile = "index.js",
		includeNested = true,
		baseDir = process.cwd(),
		...otherOptions
	} = options;

	/** @type {ScanOptions} */
	const scanOptions = { indexFile, includeNested, baseDir, ...otherOptions };

	// Scan for routes
	const routes = await scanRoutes(pagesDir, scanOptions);

	// Register each route with the router
	for (const route of routes) {
		const routeHandler = async (
			/** @type {import("../core/context.js").Context} */ ctx,
		) => {
			// For catch-all routes, manually extract the wildcard path
			if (route.catchAll && route.params.length > 0) {
				const wildcardParam = route.params[0]; // e.g., "*path"

				// Extract the wildcard path from the URL
				const routePrefix = route.pattern.replace("/*", "");
				const wildcardPath = ctx.path.startsWith(`${routePrefix}/`)
					? ctx.path.slice(routePrefix.length + 1)
					: ctx.path.slice(routePrefix.length);

				// Add the wildcard path to pathParams
				ctx.pathParams = { ...ctx.pathParams, [wildcardParam]: wildcardPath };
			}

			await handler(ctx, route);
		};

		// Register with specified HTTP method
		switch (method.toUpperCase()) {
			case "GET":
				router.get(route.pattern, routeHandler);
				break;
			case "POST":
				router.post(route.pattern, routeHandler);
				break;
			case "PUT":
				router.put(route.pattern, routeHandler);
				break;
			case "DELETE":
				router.delete(route.pattern, routeHandler);
				break;
			case "PATCH":
				router.patch(route.pattern, routeHandler);
				break;
			case "HEAD":
				router.head(route.pattern, routeHandler);
				break;
			case "OPTIONS":
				router.options(route.pattern, routeHandler);
				break;
			default:
				throw new Error(`Unsupported HTTP method: ${method}`);
		}
	}

	return routes;
}

/**
 * Default route handler - imports module and calls default export
 * @param {import("../core/context.js").Context} ctx - Request context
 * @param {import("./file-route.js").FileRoute} route - Route information
 * @private
 */
async function defaultRouteHandler(ctx, route) {
	try {
		const module = await import(route.module);

		if (typeof module.default === "function") {
			// Call default export as handler function
			await module.default(ctx);
		} else {
			// No default handler - send basic response
			ctx.text(`Route: ${route.pattern}\nModule: ${route.module}`);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Error handling route ${route.pattern}:`, errorMessage);
		await ctx.text("Internal Server Error");
		ctx.responseStatusCode = 500; // Set status AFTER text() to override its 200 status
	}
}
