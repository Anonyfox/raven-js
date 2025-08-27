/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Documentation server assembly and main entry point
 *
 * Creates a complete Wings server instance with all documentation routes,
 * static asset serving, and error handling. Loads package data once at
 * initialization for optimal performance. Follows WEBAPP.md specification
 * for server architecture and route organization.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "@raven-js/wings";
import { Assets, Logger, NodeHttp } from "@raven-js/wings/server";
import { discover } from "../discover/index.js";
import { extract } from "../extract/index.js";
import { createEntityPageHandler } from "./routes/entity-page.js";
import { createModuleDirectoryHandler } from "./routes/module-directory.js";
import { createModuleOverviewHandler } from "./routes/module-overview.js";
import { createPackageOverviewHandler } from "./routes/package-overview.js";
import { createSitemapHandler } from "./routes/sitemap.js";

/**
 * Creates documentation server instance (does not start server)
 * @param {string} packagePath - Path to package to document
 * @param {Object} options - Configuration options
 * @param {string} [options.domain] - Base domain for canonical URLs (optional)
 * @param {boolean} [options.enableLogging] - Enable request logging (default: false)
 * @returns {Object} Wings server instance ready to listen
 */
export function createDocumentationServer(packagePath, options = {}) {
	const { domain, enableLogging = false } = options;

	// Validate required parameters
	if (!packagePath || typeof packagePath !== "string") {
		throw new Error("packagePath is required and must be a string");
	}

	// Load package data once at initialization
	const packageMetadata = discover(packagePath);
	const packageInstance = extract(packageMetadata);

	// Validate extracted package data
	if (!packageInstance || !packageInstance.name) {
		throw new Error(
			`Failed to extract valid package data from: ${packagePath}`,
		);
	}

	// Create Wings router instance
	const router = new Router();

	// Add Wings middlewares

	// Optional request logging middleware
	if (enableLogging) {
		router.useEarly(new Logger());
	}

	// Static assets middleware (serves from glean package static/ directory)
	// Calculate absolute path to static directory within glean package
	const currentFileUrl = import.meta.url;
	const currentFilePath = fileURLToPath(currentFileUrl);
	const currentDir = path.dirname(currentFilePath);
	const staticDir = path.resolve(currentDir, "../../static");

	router.use(new Assets({ assetsDir: staticDir }));

	// Create route handlers with package data
	const packageOverviewHandler = createPackageOverviewHandler(packageInstance);
	const moduleDirectoryHandler = createModuleDirectoryHandler(packageInstance);
	const moduleOverviewHandler = createModuleOverviewHandler(packageInstance);
	const entityPageHandler = createEntityPageHandler(packageInstance);
	const sitemapHandler = createSitemapHandler(packageInstance, {
		baseUrl: domain,
	});

	// Register all documentation routes

	// Package overview route (homepage)
	router.get("/", /** @type {any} */ (packageOverviewHandler));

	// Module directory route (all modules overview)
	router.get("/modules/", /** @type {any} */ (moduleDirectoryHandler));

	// Module overview route (specific module documentation)
	router.get(
		"/modules/:moduleName/",
		/** @type {any} */ (moduleOverviewHandler),
	);

	// Entity documentation route (specific API documentation)
	router.get(
		"/modules/:moduleName/:entityName/",
		/** @type {any} */ (entityPageHandler),
	);

	// Sitemap route (SEO optimization)
	router.get("/sitemap.xml", /** @type {any} */ (sitemapHandler));

	// Wings router handles 404s automatically when no routes match

	// Create HTTP server with router
	const server = new NodeHttp(router);

	// Attach package metadata for external access (cast to bypass TypeScript)
	/** @type {any} */ (server).packageInstance = packageInstance;
	/** @type {any} */ (server).serverOptions = {
		packagePath,
		domain,
		enableLogging,
	};

	return server;
}

/**
 * Convenience function to create and start a documentation server
 * @param {string} packagePath - Path to package to document
 * @param {Object} options - Server options
 * @param {number} [options.port=3000] - Port to listen on
 * @param {string} [options.host="localhost"] - Host to bind to
 * @param {string} [options.domain] - Base domain for canonical URLs
 * @param {boolean} [options.enableLogging=true] - Enable request logging
 * @returns {Promise<Object>} Started server instance
 */
export async function startDocumentationServer(packagePath, options = {}) {
	const { port = 3000, host = "localhost", ...serverOptions } = options;

	// Enable logging by default when starting server
	const finalOptions = { enableLogging: true, ...serverOptions };

	const server = createDocumentationServer(packagePath, finalOptions);

	return new Promise((resolve, reject) => {
		try {
			/** @type {any} */ (server).listen(port, host, () => {
				const pkg = /** @type {any} */ (server).packageInstance;
				console.log(
					`📚 Documentation server running on http://${host}:${port}`,
				);
				console.log(`📦 Package: ${pkg.name} v${pkg.version}`);
				console.log(`📄 Modules: ${pkg.modules.length}`);
				console.log(`🔗 Entities: ${pkg.allEntities.length}`);
				resolve(server);
			});
		} catch (error) {
			reject(error);
		}
	});
}
