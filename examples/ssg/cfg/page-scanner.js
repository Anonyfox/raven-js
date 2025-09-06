/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Page scanner - automatic route discovery from filesystem
 *
 * Scans pages directory and generates route definitions with support for:
 * - Static routes: pages/about/index.js → /about
 * - Dynamic routes: pages/blog/[slug]/index.js → /blog/:slug
 * - Nested dynamics: pages/shop/[category]/[item]/index.js → /shop/:category/:item
 * - Catch-all routes: pages/docs/[...path]/index.js → /docs/*path
 */

import { readdir, stat } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

/**
 * Scanner configuration options
 * @typedef {Object} ScannerOptions
 * @property {string} pagesDir - Directory to scan for pages (default: "../src/pages")
 * @property {string} indexFile - Index file name (default: "index.js")
 * @property {boolean} includeNested - Include nested index files (default: true)
 * @property {string} [baseDir] - Base directory for resolving absolute paths (default: process.cwd())
 */

/**
 * Route definition object
 * @typedef {Object} RouteDefinition
 * @property {string} path - URL path pattern (e.g., "/blog/:slug")
 * @property {string} page - Relative path to page module
 * @property {string[]} params - Dynamic parameter names
 * @property {boolean} catchAll - Whether this is a catch-all route
 */

/**
 * Scan filesystem for page modules and generate route definitions
 *
 * @param {ScannerOptions} [options={}] - Scanner configuration
 * @returns {Promise<RouteDefinition[]>} Array of route definitions
 *
 * @example
 * // Basic usage
 * const routes = await scanPages();
 * // Returns: [
 * //   { path: "/", page: "../src/pages/index.js", params: [], catchAll: false },
 * //   { path: "/about", page: "../src/pages/about/index.js", params: [], catchAll: false }
 * // ]
 *
 * @example
 * // With dynamic routes
 * // File: pages/blog/[slug]/index.js
 * // Returns: { path: "/blog/:slug", page: "../src/pages/blog/[slug]/index.js", params: ["slug"], catchAll: false }
 */
export async function scanPages(options = {}) {
	const {
		pagesDir = "../src/pages",
		indexFile = "index.js",
		includeNested = true,
		baseDir = process.cwd(),
	} = options;

	try {
		const routes = [];
		const resolvedPagesDir = resolve(baseDir, pagesDir);
		await scanDirectory(resolvedPagesDir, "", routes, {
			indexFile,
			includeNested,
			baseDir,
		});

		// Sort routes by specificity (static routes first, then dynamic, catch-all last)
		routes.sort(compareRouteSpecificity);

		return routes;
	} catch (error) {
		throw new Error(
			`Failed to scan pages directory "${pagesDir}": ${error.message}`,
		);
	}
}

/**
 * Recursively scan directory for page modules
 *
 * @param {string} dirPath - Current directory path
 * @param {string} urlPath - Current URL path being built
 * @param {RouteDefinition[]} routes - Routes array to populate
 * @param {Object} options - Scanner options
 */
async function scanDirectory(dirPath, urlPath, routes, options) {
	let entries;

	try {
		entries = await readdir(dirPath);
	} catch (error) {
		// Directory doesn't exist or can't be read - not an error for optional directories
		return;
	}

	for (const entry of entries) {
		const fullPath = join(dirPath, entry);
		const stats = await stat(fullPath);

		if (stats.isFile() && entry === options.indexFile) {
			// Found an index file - create route with absolute path
			const absolutePath = resolve(fullPath);
			const route = createRouteFromPath(urlPath, absolutePath);
			routes.push(route);
		} else if (stats.isDirectory() && options.includeNested) {
			// Recurse into subdirectory
			const newUrlPath = urlPath === "" ? entry : `${urlPath}/${entry}`;
			await scanDirectory(fullPath, newUrlPath, routes, options);
		}
	}
}

/**
 * Create route definition from URL path and file path
 *
 * @param {string} urlPath - URL path (e.g., "blog/[slug]")
 * @param {string} filePath - File system path
 * @returns {RouteDefinition} Route definition object
 */
function createRouteFromPath(urlPath, filePath) {
	// Handle root index file
	if (urlPath === "") {
		return {
			path: "/",
			page: filePath,
			params: [],
			catchAll: false,
		};
	}

	// Split path into segments and process each one
	const segments = urlPath.split("/");
	const pathSegments = [];
	const params = [];
	let catchAll = false;

	for (const segment of segments) {
		if (segment.startsWith("[") && segment.endsWith("]")) {
			// Dynamic segment
			const paramName = segment.slice(1, -1);

			if (paramName.startsWith("...")) {
				// Catch-all route: [...path]
				const catchAllParam = paramName.slice(3);
				pathSegments.push(`*${catchAllParam}`);
				params.push(catchAllParam);
				catchAll = true;
				break; // Catch-all must be last segment
			} else {
				// Regular dynamic route: [slug]
				pathSegments.push(`:${paramName}`);
				params.push(paramName);
			}
		} else {
			// Static segment
			pathSegments.push(segment);
		}
	}

	return {
		path: "/" + pathSegments.join("/"),
		page: filePath,
		params,
		catchAll,
	};
}

/**
 * Compare route specificity for sorting
 * Static routes come first, then dynamic, then catch-all
 *
 * @param {RouteDefinition} a - First route
 * @param {RouteDefinition} b - Second route
 * @returns {number} Sort comparison result
 */
function compareRouteSpecificity(a, b) {
	// Catch-all routes go last
	if (a.catchAll && !b.catchAll) return 1;
	if (!a.catchAll && b.catchAll) return -1;

	// Routes with fewer parameters are more specific
	if (a.params.length !== b.params.length) {
		return a.params.length - b.params.length;
	}

	// Routes with more static segments are more specific
	const aStaticSegments = a.path
		.split("/")
		.filter((s) => !s.startsWith(":") && !s.startsWith("*")).length;
	const bStaticSegments = b.path
		.split("/")
		.filter((s) => !s.startsWith(":") && !s.startsWith("*")).length;

	if (aStaticSegments !== bStaticSegments) {
		return bStaticSegments - aStaticSegments;
	}

	// Lexicographic order for same specificity
	return a.path.localeCompare(b.path);
}

/**
 * Validate that a route definition is well-formed
 *
 * @param {RouteDefinition} route - Route to validate
 * @throws {Error} If route is invalid
 */
export function validateRoute(route) {
	if (!route || typeof route !== "object") {
		throw new Error("Route must be an object");
	}

	if (typeof route.path !== "string" || !route.path.startsWith("/")) {
		throw new Error(
			`Route path must be a string starting with "/", got: ${route.path}`,
		);
	}

	if (typeof route.page !== "string") {
		throw new Error(`Route page must be a string, got: ${route.page}`);
	}

	if (!Array.isArray(route.params)) {
		throw new Error(`Route params must be an array, got: ${route.params}`);
	}

	if (typeof route.catchAll !== "boolean") {
		throw new Error(`Route catchAll must be a boolean, got: ${route.catchAll}`);
	}

	// Validate parameter names
	for (const param of route.params) {
		if (typeof param !== "string" || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param)) {
			throw new Error(`Invalid parameter name: ${param}`);
		}
	}
}

/**
 * Get route information for debugging
 *
 * @param {RouteDefinition[]} routes - Routes to analyze
 * @returns {Object} Route statistics and information
 */
export function getRouteInfo(routes) {
	const staticRoutes = routes.filter((r) => r.params.length === 0);
	const dynamicRoutes = routes.filter(
		(r) => r.params.length > 0 && !r.catchAll,
	);
	const catchAllRoutes = routes.filter((r) => r.catchAll);

	return {
		total: routes.length,
		static: staticRoutes.length,
		dynamic: dynamicRoutes.length,
		catchAll: catchAllRoutes.length,
		routes: routes.map((r) => ({
			path: r.path,
			params: r.params,
			catchAll: r.catchAll,
		})),
	};
}
