/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import path from "node:path";
import { Middleware } from "../../../core/middleware.js";
import {
	loadFileSystemAssetsList,
	loadGlobalAssetsList,
	loadSEAAssetsList,
} from "./asset-list-loader.js";
import {
	isGlobalAssetsAvailable,
	isSEAEnvironment,
} from "./environment-detection.js";
import { handleAssetRequest } from "./request-handler.js";

/**
 * @packageDocumentation
 *
 * Assets - Static file serving middleware with transparent multi-source support
 * This middleware automatically detects the best available asset source and serves
 * static files transparently. It supports modern deployment patterns while maintaining
 * backwards compatibility with traditional file-based serving.
 * The middleware operates in three modes with automatic priority-based selection:
 * 1. SEA mode: Serves from Single Executable Application embedded resources
 * 2. Global mode: Serves from JavaScript variables in globalThis.RavenJS.assets
 * 3. FileSystem mode: Serves from local file system (traditional approach)
 * Mode selection is completely transparent - the same public API works regardless
 * of the deployment method. This allows applications to be developed with file
 * system assets and deployed as bundled or executable applications without changes.
 * ## Security Model
 * All modes enforce the same security model:
 * - Only assets with paths starting with '/' are served (public assets)
 * - Path traversal attacks are prevented through validation
 * - Internal/private files are never exposed to the web
 * - Mode isolation prevents cross-contamination
 * ## Error Handling
 * The middleware follows Wings' error collection pattern:
 * - Asset serving errors are collected in ctx.errors for logging
 * - Missing assets return early (allowing router to handle 404s)
 * - Mode initialization failures fall back gracefully
 * - No unhandled exceptions break the request pipeline
 * ```javascript
 * // Directory structure:
 * // public/
 * //   ├── css/styles.css
 * //   ├── js/app.js
 * //   └── images/logo.png
 * const assets = new Assets({ assetsDir: 'public' });
 * router.use(assets);
 * // GET /css/styles.css -> serves public/css/styles.css
 * // GET /js/app.js -> serves public/js/app.js
 * // GET /images/logo.png -> serves public/images/logo.png
 * ```
 * ```javascript
 * // Same code works in SEA mode:
 * const assets = new Assets(); // assetsDir ignored in SEA mode
 * router.use(assets);
 * // Assets served from embedded SEA resources automatically
 * // No code changes required!
 * ```
 * ```javascript
 * // Assets embedded as JavaScript:
 * globalThis.RavenJS = {
 * assets: {
 * '/css/styles.css': 'body { color: red; }',
 * '/js/app.js': 'console.log("Hello");',
 * '/images/logo.png': Buffer.from([...])
 * }
 * };
 * const assets = new Assets();
 * router.use(assets);
 * // Same public API, different source - completely transparent
 * ```
 */
export class Assets extends Middleware {
	/**
	 * Create a new Assets middleware instance.
	 *
	 * The middleware automatically detects the best available asset source
	 * without requiring configuration. The assetsDir option only affects
	 * file system mode and is ignored in SEA or global variable modes.
	 *
	 * @param {Object} [options={}] - Configuration options
	 * @param {string} [options.assetsDir='public'] - Directory for file system mode (ignored in other modes)
	 * @param {string} [options.identifier='@raven-js/wings/assets'] - Middleware identifier
	 *
	 * @throws {Error} When invalid configuration is provided
	 *
	 * @example Basic Usage
	 * ```javascript
	 * // Use defaults (public directory, auto-detection)
	 * const assets = new Assets();
	 * router.use(assets);
	 * ```
	 *
	 * @example Custom Directory
	 * ```javascript
	 * // Custom directory for file system mode
	 * const assets = new Assets({ assetsDir: 'static' });
	 * router.use(assets);
	 * ```
	 */
	constructor(options = {}) {
		const { assetsDir = "public", identifier = "@raven-js/wings/assets" } =
			options;

		// Validate configuration
		if (typeof assetsDir !== "string" || assetsDir.trim() === "") {
			throw new Error("Assets: assetsDir must be a non-empty string");
		}

		super(async (/** @type {any} */ ctx) => {
			// Handle asset request directly in the middleware chain
			// This runs before routing, so assets take priority over routes
			await handleAssetRequest(ctx, this.#getAssetConfig());
		}, identifier);

		// Store configuration
		this.assetsDir = assetsDir.trim();

		// Initialize asset source (mode detection happens here)
		this.#initializeAssetSource();
	}

	/**
	 * Current asset serving mode.
	 * @type {'sea'|'global'|'filesystem'|'uninitialized'}
	 */
	mode = "uninitialized";

	/**
	 * Cached list of available assets.
	 * @type {string[]}
	 */
	assetsList = [];

	/**
	 * Full path to assets directory (filesystem mode only).
	 * @type {string|null}
	 */
	assetsPath = null;

	/**
	 * Get the current asset configuration for request handling.
	 *
	 * @returns {{ mode: string, assetsList: string[], assetsPath: string | null }} Asset configuration object
	 */
	#getAssetConfig() {
		return {
			mode: this.mode,
			assetsList: this.assetsList,
			assetsPath: this.assetsPath,
		};
	}

	/**
	 * Initialize the asset source based on environment detection.
	 * Implements the priority system: SEA > Global > FileSystem.
	 *
	 * This method is called during construction and sets up the appropriate
	 * mode for asset serving. Mode detection is based on environment capabilities
	 * rather than configuration, ensuring transparent operation.
	 */
	#initializeAssetSource() {
		try {
			// Priority 1: SEA mode (highest priority)
			if (isSEAEnvironment()) {
				this.mode = "sea";
				this.assetsList = loadSEAAssetsList();
				return;
			}

			// Priority 2: Global variables mode
			if (isGlobalAssetsAvailable()) {
				this.mode = "global";
				this.assetsList = loadGlobalAssetsList();
				return;
			}

			// Priority 3: File system mode (default fallback)
			this.mode = "filesystem";
			this.assetsPath = path.resolve(process.cwd(), this.assetsDir);
			this.#loadFileSystemAssetsList();
		} catch {
			// Asset source initialization failed - continue without assets
			// This ensures the middleware doesn't break the application
			this.mode = "uninitialized";
			this.assetsList = [];
		}
	}

	/**
	 * Load asset list from file system.
	 * Scans the configured directory and builds a list of available files.
	 * This method is async and sets assetsList when complete.
	 */
	#loadFileSystemAssetsList() {
		// Load file system assets asynchronously
		// We don't await this to avoid blocking the constructor
		loadFileSystemAssetsList(this.assetsPath)
			.then((files) => {
				this.assetsList = files;
			})
			.catch(() => {
				// Directory doesn't exist or can't be read
				this.assetsList = [];
			});
	}
}
