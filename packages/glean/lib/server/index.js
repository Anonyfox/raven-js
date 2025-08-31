/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Documentation server assembly and main entry point.
 *
 * Creates a complete Wings server instance with all documentation routes,
 * static asset serving, and error handling. Loads package data once at
 * initialization for optimal performance.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "@raven-js/wings";
import { Assets, Logger, NodeHttp } from "@raven-js/wings/server";
import { AssetRegistry, createAssetMiddleware } from "../assets/index.js";
import { discover } from "../discover/index.js";
import { extract } from "../extract/index.js";
import { createEntityPageHandler } from "./routes/entity-page.js";
import { createModuleDirectoryHandler } from "./routes/module-directory.js";
import { createModuleOverviewHandler } from "./routes/module-overview.js";
import { createPackageOverviewHandler } from "./routes/package-overview.js";
import { createSitemapHandler } from "./routes/sitemap.js";
import { createUrlBuilder } from "./utils/url-builder.js";

/**
 * Creates documentation server instance with routes, static assets, and middleware.
 *
 * Loads and processes package data once at initialization, then creates Wings server
 * with all documentation routes configured but does not start listening.
 *
 * @param {string} packagePath - Path to package to document
 * @param {Object} options - Configuration options
 * @param {string} [options.domain] - Base domain for canonical URLs (optional)
 * @param {string} [options.basePath] - Base path for URL prefixing (default: "/")
 * @param {boolean} [options.enableLogging] - Enable request logging (default: false)
 * @returns {Object} Wings server instance ready to listen
 *
 * @example
 * // Create documentation server
 * const server = createDocumentationServer('./my-package');
 * server.listen(3000, 'localhost');
 *
 * @example
 * // Create server with custom options
 * const server = createDocumentationServer('./my-package', {
 *   domain: 'docs.mypackage.com',
 *   enableLogging: true
 * });
 */
export function createDocumentationServer(packagePath, options = {}) {
	const { domain, basePath = "/", enableLogging = false } = options;

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

	// Create asset registry and register discovered image assets
	const assetRegistry = new AssetRegistry();

	// Register package-level image assets (from discovery phase)
	if (packageMetadata.imageAssets) {
		for (const asset of packageMetadata.imageAssets) {
			assetRegistry.register(/** @type {any} */ (asset));
		}
	}

	// Register module-level image assets (from discovery phase)
	for (const module of packageMetadata.modules) {
		if (module.imageAssets) {
			for (const asset of module.imageAssets) {
				assetRegistry.register(/** @type {any} */ (asset));
			}
		}
	}

	// Create URL builder with base path
	const urlBuilder = createUrlBuilder(basePath);

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

	// Helper function to prefix routes with base path
	const routePath = (/** @type {string} */ path) =>
		basePath === "/" ? path : `${basePath.replace(/\/+$/, "")}${path}`;

	// Register asset serving route for local image assets
	router.get(
		routePath("/assets/:filename"),
		/** @type {any} */ (createAssetMiddleware(assetRegistry)),
	);

	// Create route handlers with package data and asset registry
	const packageOverviewHandler = createPackageOverviewHandler(
		packageInstance,
		assetRegistry,
		{ urlBuilder },
	);
	const moduleDirectoryHandler = createModuleDirectoryHandler(packageInstance, {
		urlBuilder,
	});
	const moduleOverviewHandler = createModuleOverviewHandler(
		packageInstance,
		assetRegistry,
		{ urlBuilder },
	);
	const entityPageHandler = createEntityPageHandler(packageInstance, {
		urlBuilder,
	});
	const sitemapHandler = createSitemapHandler(packageInstance, {
		baseUrl: domain ? `https://${domain}` : "https://docs.example.com",
		urlBuilder,
	});

	// Register all documentation routes with base path prefix

	// Package overview route (homepage)
	router.get(routePath("/"), /** @type {any} */ (packageOverviewHandler));

	// Module directory route (all modules overview)
	router.get(
		routePath("/modules/"),
		/** @type {any} */ (moduleDirectoryHandler),
	);

	// Module overview route (specific module documentation)
	router.get(
		routePath("/modules/:moduleName/"),
		/** @type {any} */ (moduleOverviewHandler),
	);

	// Entity documentation route (specific API documentation)
	router.get(
		routePath("/modules/:moduleName/:entityName/"),
		/** @type {any} */ (entityPageHandler),
	);

	// Sitemap route (SEO optimization)
	router.get(routePath("/sitemap.xml"), /** @type {any} */ (sitemapHandler));

	// Wings router handles 404s automatically when no routes match

	// Create HTTP server with router
	const server = new NodeHttp(router);

	// Attach package metadata for external access (cast to bypass TypeScript)
	/** @type {any} */ (server).packageInstance = packageInstance;
	/** @type {any} */ (server).assetRegistry = assetRegistry;
	/** @type {any} */ (server).urlBuilder = urlBuilder;
	/** @type {any} */ (server).serverOptions = {
		packagePath,
		domain,
		basePath,
		enableLogging,
	};

	return server;
}

/**
 * Convenience function to create and start documentation server in one step.
 *
 * Creates server instance and starts listening, with logging enabled by default
 * and console output showing package information and server details.
 *
 * @param {string} packagePath - Path to package to document
 * @param {Object} options - Server options
 * @param {number} [options.port=3000] - Port to listen on
 * @param {string} [options.host="localhost"] - Host to bind to
 * @param {string} [options.domain] - Base domain for canonical URLs
 * @param {boolean} [options.enableLogging=true] - Enable request logging
 * @returns {Promise<Object>} Started server instance
 *
 * @example
 * // Start server with defaults (port 3000, localhost)
 * const server = await startDocumentationServer('./my-package');
 *
 * @example
 * // Start server with custom port and domain
 * const server = await startDocumentationServer('./my-package', {
 *   port: 8080,
 *   host: '0.0.0.0',
 *   domain: 'docs.mypackage.com'
 * });
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
				const registry = /** @type {any} */ (server).assetRegistry;
				console.log(
					`📚 Documentation server running on http://${host}:${port}`,
				);
				console.log(`📦 Package: ${pkg.name} v${pkg.version}`);
				console.log(`📄 Modules: ${pkg.modules.length}`);
				console.log(`🔗 Entities: ${pkg.allEntities.length}`);
				if (registry.size > 0) {
					console.log(`🖼️  Assets: ${registry.size} images`);
				}
				resolve(server);
			});
		} catch (error) {
			reject(error);
		}
	});
}
