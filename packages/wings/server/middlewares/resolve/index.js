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

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Middleware } from "../../../core/middleware.js";
import { injectImportMap } from "./html-injector.js";
import { generateImportMap } from "./import-map-generator.js";
import { serveModule } from "./module-server.js";

/**
 * Configuration options for the Resolve middleware.
 *
 * @typedef {Object} ResolveConfig
 * @property {string} sourceFolder - Directory to mount at "/" for serving JS modules (e.g., "src" serves src/client/app.js at /client/app.js)
 * @property {string} [projectRoot] - Project root directory (auto-detected from sourceFolder)
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
 * ## Path Mounting
 * The `sourceFolder` is mounted at the root "/" of your application:
 * - `sourceFolder: "src"` serves `src/client/app.js` at `/client/app.js`
 * - `sourceFolder: "dist"` serves `dist/utils/helpers.js` at `/utils/helpers.js`
 * - Node.js packages are served separately at `/node_modules/` paths
 *
 * ## Usage
 * ```javascript
 * import { Resolve } from '@wings/server/middlewares/resolve';
 *
 * // Mount src/ folder at root
 * router.use(new Resolve({
 *   sourceFolder: 'src'  // src/client/app.js → /client/app.js
 * }));
 *
 * // Mount current directory
 * router.use(new Resolve({
 *   sourceFolder: '.',   // ./utils/math.js → /utils/math.js
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
	 * The constructor automatically resolves relative paths and determines the project root
	 * for package.json resolution. The sourceFolder is mounted at "/" in your application,
	 * while node_modules paths are served separately.
	 *
	 * @param {ResolveConfig} config - Configuration options
	 * @throws {Error} When sourceFolder is missing or invalid
	 *
	 * @example
	 * // Mount src/ directory at root
	 * new Resolve({ sourceFolder: "src" })
	 * // src/client/app.js → http://localhost:3000/client/app.js
	 * // src/utils/math.js → http://localhost:3000/utils/math.js
	 */
	constructor(config) {
		// Validate configuration
		if (!config?.sourceFolder || typeof config.sourceFolder !== "string") {
			throw new Error("sourceFolder configuration is required");
		}

		// Resolve relative paths to absolute paths
		const absoluteSourceFolder = resolve(config.sourceFolder);

		// Find project root (where package.json is located) - do this once in constructor
		const projectRoot = findProjectRoot(absoluteSourceFolder);

		// Set defaults with determined paths
		const resolvedConfig = {
			sourceFolder: absoluteSourceFolder,
			projectRoot,
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
	 * 1. Import map serving at configured path (e.g., /importmap.json)
	 * 2. JavaScript module serving (.js/.mjs files):
	 *    - /node_modules/* paths → served from projectRoot
	 *    - All other JS paths → served from sourceFolder (mounted at /)
	 * 3. After-handler registration for HTML injection
	 *
	 * @param {import('../../../core/context.js').Context} ctx - Wings context
	 */
	async #handleRequest(ctx) {
		const pathname = ctx.path;
		const { sourceFolder, projectRoot, importMapPath } = this.#config;

		// Serve import map
		if (pathname === importMapPath) {
			const importMap = await generateImportMap(projectRoot);
			ctx.json(importMap);
			ctx.responseEnded = true; // Stop further middleware processing
			return;
		}

		// Serve JavaScript modules
		if (pathname.endsWith(".js") || pathname.endsWith(".mjs")) {
			// Remove leading slash to get relative path
			const relativePath = pathname.slice(1);

			// Determine base directory: node_modules from project root, everything else from source folder
			const baseDirectory = relativePath.startsWith("node_modules/")
				? projectRoot
				: sourceFolder;

			const served = await serveModule(ctx, relativePath, baseDirectory);
			if (served) {
				ctx.responseEnded = true; // Stop further middleware processing
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

/**
 * Finds the project root directory by traversing up from a given directory.
 *
 * Searches for package.json starting from the given path and moving up the
 * directory tree until found, similar to Node.js module resolution.
 *
 * @param {string} startPath - Directory to start searching from
 * @returns {string} Absolute path to project root, or startPath if no package.json found
 */
function findProjectRoot(startPath) {
	let currentPath = startPath;

	// Traverse up directory tree until root
	while (currentPath !== dirname(currentPath)) {
		const packageJsonPath = resolve(currentPath, "package.json");
		if (existsSync(packageJsonPath)) {
			return currentPath;
		}

		// Move up one directory level
		currentPath = dirname(currentPath);
	}

	// If no package.json found, return the original path as fallback
	// This ensures compatibility with test environments and edge cases
	return startPath;
}
