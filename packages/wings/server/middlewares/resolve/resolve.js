/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main resolve middleware orchestration.
 *
 * Orchestrates import map generation, HTML injection, and JavaScript module
 * serving for zero-build ESM development. Exports Wings Middleware instances
 * with proper configuration handling and URL routing logic.
 */

import { Middleware } from "../../../core/middleware.js";
import { injectImportMap } from "./html-injector.js";
import { generateImportMap } from "./import-map-generator.js";
import { serveModule } from "./module-server.js";

/**
 * Creates resolve middleware with configuration.
 *
 * Handles three main functions: import map generation/serving, HTML injection,
 * and JavaScript module serving. Processes requests in order of specificity.
 *
 * @param {Object} config - Configuration options
 * @param {string} config.sourceFolder - Root folder to serve JS modules from
 * @param {string} [config.importMapPath="/importmap.json"] - URL path for import map
 * @returns {Middleware} Wings middleware instance
 */
export function createResolveMiddleware(config) {
	const { sourceFolder, importMapPath = "/importmap.json" } = config;

	if (!sourceFolder || typeof sourceFolder !== "string") {
		throw new Error("sourceFolder configuration is required");
	}

	return new Middleware(async (ctx) => {
		const pathname = ctx.path;

		// Serve import map
		if (pathname === importMapPath) {
			const importMap = await generateImportMap(sourceFolder);
			ctx.json(importMap);
			return;
		}

		// Serve JavaScript modules from source folder
		if (pathname.endsWith(".js") || pathname.endsWith(".mjs")) {
			// Remove leading slash to get relative path
			const relativePath = pathname.slice(1);
			const served = await serveModule(ctx, relativePath, sourceFolder);
			if (served) {
				return; // Module was served successfully
			}
			// If not served, continue to next middleware (likely 404)
		}

		// HTML injection happens in after-middleware
	}, "resolve");
}

/**
 * After-middleware for HTML import map injection.
 *
 * Processes responses after route handling to inject import map script tags
 * into HTML responses. Separate from main middleware to ensure proper ordering.
 *
 * @param {string} [importMapPath="/importmap.json"] - URL path for import map
 * @returns {Middleware} Wings after-middleware instance
 */
export function createResolveAfterMiddleware(
	importMapPath = "/importmap.json",
) {
	return new Middleware(async (ctx) => {
		// Only inject if response was successful and is HTML
		if (ctx.responseStatusCode >= 200 && ctx.responseStatusCode < 300) {
			injectImportMap(ctx, importMapPath);
		}
	}, "resolve-after");
}

/**
 * Default resolve middleware with standard configuration.
 *
 * Convenience export for common use case with current working directory
 * as source folder and standard import map path.
 */
export const resolveMiddleware = createResolveMiddleware({
	sourceFolder: process.cwd(),
});

/**
 * Default after-middleware for HTML injection.
 *
 * Convenience export matching the default resolve middleware configuration.
 */
export const resolveAfterMiddleware = createResolveAfterMiddleware();
