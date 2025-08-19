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
 * @file Multi-source static asset serving middleware.
 *
 * Provides transparent asset serving across deployment environments with
 * automatic source detection and consistent security model. Core middleware
 * for Wings applications requiring static file delivery.
 */

/**
 * @typedef {Object} AssetConfig
 * @property {'sea'|'global'|'filesystem'|'uninitialized'} mode - Asset serving mode
 * @property {string[]} assetsList - Cached list of available assets
 * @property {string|null} assetsPath - Full path to assets directory (filesystem mode only)
 */

/**
 * Assets - Multi-source static file serving middleware.
 *
 * Implements transparent asset serving with automatic source detection across
 * three deployment modes: SEA embedded resources, JavaScript variables, and
 * traditional filesystem. Zero-configuration operation with consistent security
 * model and performance characteristics.
 *
 * **Priority-Based Mode Selection:**
 * 1. SEA mode: Single Executable Application embedded resources (fastest)
 * 2. Global mode: JavaScript variables in globalThis.RavenJS.assets (fast)
 * 3. FileSystem mode: Traditional file system serving (flexible)
 *
 * **Security Model:**
 * - Only paths starting with '/' are served (public assets)
 * - Path traversal prevention across all modes
 * - Mode isolation prevents cross-contamination
 * - Internal files never exposed
 *
 * **Error Handling:**
 * - Errors collected in ctx.errors for observability
 * - Graceful fallthrough for missing assets
 * - No pipeline disruption on failures
 *
 * @extends {Middleware}
 *
 * @example Basic Usage
 * ```javascript
 * import { Assets } from '@raven-js/wings/server/middlewares/assets';
 *
 * // Zero-config transparent operation
 * const assets = new Assets();
 * router.use(assets);
 *
 * // Works identically across all deployment modes:
 * // • Development: serves from ./public/
 * // • SEA bundle: serves from embedded resources
 * // • JS bundle: serves from globalThis.RavenJS.assets
 * ```
 *
 * @example Custom Directory
 * ```javascript
 * // Custom assets directory (filesystem mode only)
 * const assets = new Assets({ assetsDir: 'static' });
 * router.use(assets);
 *
 * // Directory structure:
 * // static/
 * //   ├── css/app.css     → GET /css/app.css
 * //   ├── js/bundle.js    → GET /js/bundle.js
 * //   └── images/logo.png → GET /images/logo.png
 * ```
 *
 * @example SEA Deployment
 * ```javascript
 * // SEA mode (automatic detection)
 * const assets = new Assets(); // assetsDir ignored
 * router.use(assets);
 *
 * // Assets served from embedded SEA resources
 * // Fastest mode: in-memory access, no I/O
 * // Manifest: @raven-js/assets.json lists public assets
 * ```
 *
 * @example Global Variables Mode
 * ```javascript
 * // JavaScript-embedded assets
 * globalThis.RavenJS = {
 *   assets: {
 *     '/css/app.css': 'body { margin: 0; }',
 *     '/js/app.js': 'console.log("loaded");',
 *     '/api/data.json': '{"version": "1.0"}'
 *   }
 * };
 *
 * const assets = new Assets();
 * router.use(assets);
 * // Fast mode: direct memory access, automatic type handling
 * ```
 */
export class Assets extends Middleware {
	/**
	 * Create Assets middleware with automatic source detection.
	 *
	 * Performs environment probing to determine optimal asset serving mode.
	 * Configuration applies only to filesystem mode - other modes ignore
	 * options and operate based on environment capabilities.
	 *
	 * @param {AssetsOptions} [options] - Configuration options
	 *
	 * @typedef {Object} AssetsOptions
	 * @property {string} [assetsDir='public'] - Filesystem assets directory (ignored in SEA/global modes)
	 * @property {string} [identifier='@raven-js/wings/assets'] - Middleware identifier for debugging
	 *
	 * @throws {Error} When assetsDir is invalid (non-string or empty)
	 *
	 * @example Zero Configuration
	 * ```javascript
	 * // Automatic mode detection with sensible defaults
	 * const assets = new Assets();
	 * router.use(assets);
	 * // → Uses 'public' directory in filesystem mode
	 * // → Auto-detects SEA/global modes when available
	 * ```
	 *
	 * @example Custom Configuration
	 * ```javascript
	 * // Custom assets directory and identifier
	 * const assets = new Assets({
	 *   assetsDir: 'static',
	 *   identifier: 'my-app/assets'
	 * });
	 * router.use(assets);
	 * ```
	 *
	 * @example Mode Independence
	 * ```javascript
	 * // Same constructor works across deployment modes
	 * const assets = new Assets({ assetsDir: 'custom' });
	 *
	 * // Development:  serves from ./custom/
	 * // SEA bundle:   ignores assetsDir, uses embedded assets
	 * // JS bundle:    ignores assetsDir, uses globalThis.RavenJS.assets
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
	 *
	 * Reflects the detected and active asset source. Set during initialization
	 * based on environment capabilities and available sources.
	 *
	 * @type {'sea'|'global'|'filesystem'|'uninitialized'}
	 */
	mode = "uninitialized";

	/**
	 * Cached list of available assets.
	 *
	 * Contains web-normalized paths (starting with '/') of all discoverable
	 * assets. Population strategy varies by mode: immediate for SEA/global,
	 * asynchronous for filesystem.
	 *
	 * @type {string[]}
	 */
	assetsList = [];

	/**
	 * Full resolved path to assets directory.
	 *
	 * Only used in filesystem mode for file operations. Null in SEA/global
	 * modes where assets are served from memory sources.
	 *
	 * @type {string|null}
	 */
	assetsPath = null;

	/**
	 * Get current asset configuration for request handling.
	 *
	 * Provides immutable snapshot of asset serving state for use by
	 * request handlers. Contains all information needed for mode-specific
	 * asset serving operations.
	 *
	 * @returns {AssetConfig} Current asset configuration
	 */
	#getAssetConfig() {
		return {
			mode: this.mode,
			assetsList: this.assetsList,
			assetsPath: this.assetsPath,
		};
	}

	/**
	 * Initialize asset source using priority-based environment detection.
	 *
	 * Implements capability-based mode selection with graceful fallback.
	 * Called during construction to establish serving mode and populate
	 * initial asset inventory. Failure-resistant design ensures middleware
	 * remains functional even when asset sources are unavailable.
	 *
	 * **Detection Priority:**
	 * 1. SEA embedded resources (highest performance)
	 * 2. Global JavaScript variables (fast memory access)
	 * 3. Filesystem directory (maximum flexibility)
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
	 * Load filesystem asset list asynchronously.
	 *
	 * Initiates background directory scan without blocking constructor.
	 * Updates assetsList when scan completes. Allows middleware to begin
	 * serving immediately with lazy asset discovery.
	 */
	#loadFileSystemAssetsList() {
		// Load file system assets asynchronously
		// We don't await this to avoid blocking the constructor
		loadFileSystemAssetsList(this.assetsPath).then((files) => {
			this.assetsList = files;
		});
	}
}
