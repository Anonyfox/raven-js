/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Zero-build ESM development middleware.
 *
 * Enables seamless ES module development with automatic import map generation,
 * HTML injection, and JavaScript module serving without bundling or compilation.
 * Perfect for rapid development workflows with npm package support.
 */

import { Middleware } from "../../../core/middleware.js";
import { injectImportMap } from "./html-injector.js";
import { generateImportMap } from "./import-map-generator.js";
import { serveModule } from "./module-server.js";

/**
 * Configuration options for the Resolve middleware.
 *
 * @typedef {Object} ResolveConfig
 * @property {string} sourceFolder - Root folder to serve JS modules from
 * @property {string} [importMapPath="/importmap.json"] - URL path for import map endpoint
 */

/**
 * **Resolve** - Zero-build ES module development middleware.
 *
 * Orchestrates import map generation, HTML injection, and JavaScript module
 * serving for seamless ESM development without bundling. Automatically handles:
 * - Import map generation from package.json dependencies
 * - HTML script tag injection for import maps
 * - JavaScript module serving with security validation
 *
 * ## Key Features
 * - **Zero Build Step**: Native ES modules in development
 * - **Auto Import Maps**: Generated from package.json exports
 * - **Security First**: Path traversal and access validation
 * - **Wings Integration**: Proper middleware and after-handler patterns
 *
 * ## Usage
 * ```javascript
 * import { Resolve } from '@wings/server/middlewares/resolve';
 *
 * // Basic usage with current directory
 * router.use(new Resolve({
 *   sourceFolder: process.cwd()
 * }));
 *
 * // Custom configuration
 * router.use(new Resolve({
 *   sourceFolder: './src',
 *   importMapPath: '/my-imports.json'
 * }));
 * ```
 *
 * @extends Middleware
 */
export class Resolve extends Middleware {
	/**
	 * Configuration for this middleware instance.
	 * @type {ResolveConfig}
	 */
	#config;

	/**
	 * Creates a new Resolve middleware instance.
	 *
	 * @param {ResolveConfig} config - Configuration options
	 * @throws {Error} When sourceFolder is missing or invalid
	 */
	constructor(config) {
		// Validate configuration
		if (!config?.sourceFolder || typeof config.sourceFolder !== "string") {
			throw new Error("sourceFolder configuration is required");
		}

		// Set defaults
		const resolvedConfig = {
			importMapPath: "/importmap.json",
			...config,
		};

		// Call parent constructor with handler
		super(async (ctx) => {
			await this.#handleRequest(ctx);
		}, "resolve");

		this.#config = resolvedConfig;
	}

	/**
	 * Main request handler for the resolve middleware.
	 *
	 * Processes requests in order of specificity:
	 * 1. Import map serving at configured path
	 * 2. JavaScript module serving (.js/.mjs files)
	 * 3. After-handler registration for HTML injection
	 *
	 * @param {import('../../../core/context.js').Context} ctx - Wings context
	 * @private
	 */
	async #handleRequest(ctx) {
		const pathname = ctx.path;
		const { sourceFolder, importMapPath } = this.#config;

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

		// Register after-handler for HTML injection
		// This runs after all middlewares complete to inject import map scripts
		ctx.addAfterCallback(
			new Middleware(async (ctx) => {
				// Only inject if response was successful and is HTML
				if (ctx.responseStatusCode >= 200 && ctx.responseStatusCode < 300) {
					injectImportMap(ctx, importMapPath);
				}
			}, "resolve-after"),
		);
	}
}
