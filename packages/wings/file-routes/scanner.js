/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file File-based route scanner - discovers routes from filesystem structure
 */

import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { FileRoute } from "./file-route.js";

/**
 * Scanner configuration options
 * @typedef {Object} ScanOptions
 * @property {string} indexFile - Index file name (default: "index.js")
 * @property {boolean} includeNested - Include nested index files (default: true)
 * @property {string} baseDir - Base directory for resolving paths (default: process.cwd())
 */

/**
 * Scan filesystem for file-based routes
 *
 * @param {string|Partial<ScanOptions>} pagesDir - Directory to scan, or full options object
 * @param {Partial<ScanOptions>} [options] - Additional options (when first param is string)
 * @returns {Promise<FileRoute[]>} Array of discovered routes
 *
 * @example
 * // Simple usage
 * const routes = await scanRoutes("src/pages");
 *
 * @example
 * // With options
 * const routes = await scanRoutes("src/pages", {
 *   indexFile: "page.js",
 *   includeNested: false
 * });
 *
 * @example
 * // Full options object
 * const routes = await scanRoutes({
 *   pagesDir: "src/pages",
 *   indexFile: "index.js",
 *   includeNested: true,
 *   baseDir: process.cwd()
 * });
 */
export async function scanRoutes(pagesDir, options = {}) {
	// Handle both string and object first parameter
	let config;
	if (typeof pagesDir === "string") {
		config = {
			pagesDir,
			indexFile: "index.js",
			includeNested: true,
			baseDir: process.cwd(),
			...options,
		};
	} else {
		config = {
			pagesDir: "src/pages",
			indexFile: "index.js",
			includeNested: true,
			baseDir: process.cwd(),
			...pagesDir,
		};
	}

	try {
		/** @type {FileRoute[]} */
		const routes = [];
		const resolvedPagesDir = resolve(config.baseDir, config.pagesDir);
		await scanDirectory(resolvedPagesDir, "", routes, config);

		// Sort routes by priority and specificity
		routes.sort((a, b) => a.compareTo(b));

		return routes;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Failed to scan routes in "${config.pagesDir}": ${errorMessage}`,
		);
	}
}

/**
 * Recursively scan directory for page modules
 * @param {string} dirPath - Current directory path
 * @param {string} urlPath - Current URL path being built
 * @param {FileRoute[]} routes - Routes array to populate
 * @param {ScanOptions & {pagesDir: string}} config - Scanner configuration
 * @private
 */
async function scanDirectory(dirPath, urlPath, routes, config) {
	let entries;

	try {
		entries = await readdir(dirPath);
	} catch (error) {
		// For the root pages directory, this is an error
		// For subdirectories, we can silently ignore
		if (urlPath === "") {
			// This is the root pages directory - should exist
			throw error;
		}
		// Subdirectory doesn't exist - not an error, just skip
		return;
	}

	for (const entry of entries) {
		const fullPath = join(dirPath, entry);
		const stats = await stat(fullPath);

		if (stats.isFile() && entry === config.indexFile) {
			// Found an index file - create route
			const route = createRouteFromPath(urlPath || "/", fullPath);
			routes.push(route);
		} else if (stats.isDirectory() && config.includeNested) {
			// Recursively scan subdirectory
			const newUrlPath = urlPath ? `${urlPath}/${entry}` : entry;
			await scanDirectory(fullPath, newUrlPath, routes, config);
		}
	}
}

/**
 * Create a FileRoute from URL path and file path
 * @param {string} urlPath - URL path pattern
 * @param {string} filePath - Absolute file path
 * @returns {FileRoute} Created route
 * @private
 */
function createRouteFromPath(urlPath, filePath) {
	const segments = urlPath.split("/").filter(Boolean);
	/** @type {string[]} */ const params = [];
	let catchAll = false;

	// Convert filesystem patterns to URL patterns
	const patternSegments = segments.map((segment) => {
		if (segment.startsWith("[") && segment.endsWith("]")) {
			const paramName = segment.slice(1, -1);

			if (paramName.startsWith("...")) {
				// Catch-all route: [...path] -> * (Wings wildcard)
				// Wings captures this in ctx.pathParams["*path"]
				catchAll = true;
				const cleanParam = paramName.slice(3);
				params.push(`*${cleanParam}`);
				return "*";
			} else {
				// Dynamic segment: [slug] -> :slug
				params.push(paramName);
				return `:${paramName}`;
			}
		}
		return segment; // Static segment
	});

	const pattern = `/${patternSegments.join("/")}`;
	return new FileRoute(pattern, filePath, params, catchAll);
}
