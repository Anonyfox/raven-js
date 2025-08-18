/**
 * @fileoverview Wings Assets Middleware - Static file serving with transparent multi-source support
 *
 * This middleware provides seamless static file serving with intelligent source detection.
 * It automatically chooses the best available asset source without requiring configuration,
 * supporting modern deployment patterns like Single Executable Applications (SEA) and
 * bundled deployments while falling back gracefully to traditional file system serving.
 *
 * Built with zero dependencies and following Wings' philosophy of working reliably
 * out of the box with sensible defaults.
 *
 * ## Asset Source Priority System (Transparent)
 *
 * The middleware automatically detects and uses asset sources in this priority order:
 *
 * ### 1. SEA (Single Executable Applications) - Highest Priority
 * When running as a Node.js Single Executable Application, assets are served from
 * embedded resources using the native `sea.getAsset()` API. Asset listings are
 * read from the magic file `@raven-js/assets.json` which should contain an array
 * of public asset paths.
 *
 * **Use Case**: Production deployments as single executable files
 * **Security**: Only assets listed in the manifest and starting with '/' are served
 *
 * ### 2. Global Variables - Medium Priority
 * When `globalThis.RavenJS.assets` exists, assets are served directly from this
 * object where keys are file paths and values are file contents (string or Buffer).
 * This enables bundled deployments where assets are embedded as JavaScript variables.
 *
 * **Use Case**: Bundled applications with assets embedded as JS objects
 * **Security**: Only keys starting with '/' are served as public assets
 *
 * ### 3. File System - Default Fallback
 * Serves files from the configured assets directory on the local file system.
 * This is the traditional approach for development and simple deployments.
 *
 * **Use Case**: Development and traditional file-based deployments
 * **Security**: Only files within the configured directory are served
 *
 * ## Security & Privacy Features
 *
 * - **Public Asset Enforcement**: Only files with paths starting with '/' are served
 * - **Path Traversal Prevention**: Validates all paths to prevent directory escapes
 * - **Private File Protection**: Internal/sensitive files are never exposed
 * - **Mode Isolation**: Each source mode has isolated security validation
 * - **Graceful Degradation**: Security failures don't crash the application
 *
 * ## Performance Optimizations
 *
 * - **Asset List Caching**: File listings are cached at startup for all modes
 * - **Fast Path Validation**: Quick rejection of invalid requests
 * - **Mode-Specific Serving**: Optimized code paths for each asset source
 * - **Memory Efficient**: No unnecessary copying of file contents
 * - **Pre-Routing Integration**: Serves assets before route matching for optimal performance
 *
 * @example Basic Usage
 * ```javascript
 * import { Assets } from '@raven-js/wings/server';
 * import { Router } from '@raven-js/wings/core';
 *
 * const router = new Router();
 * const assets = new Assets();
 *
 * // Enable asset serving - runs before routing
 * router.use(assets);
 *
 * router.get('/api/data', (ctx) => {
 *   ctx.json({ message: 'API response' });
 * });
 *
 * // Static files are automatically served:
 * // GET /style.css -> serves from assets
 * // GET /app.js -> serves from assets
 * // GET /images/logo.png -> serves from assets
 * // GET /api/data -> handled by route handler
 * ```
 *
 * @example Custom Configuration
 * ```javascript
 * const assets = new Assets({
 *   assetsDir: 'static'  // Only affects filesystem mode
 * });
 * router.use(assets);
 * ```
 *
 * @author RavenJS Team
 * @since 0.2.8
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { Middleware } from "../core/middleware.js";
import { getMimeType } from "../core/mime-utils.js";

/**
 * Magic filename for SEA asset manifests.
 * This file should contain a JSON array of public asset paths.
 * Convention: Only paths starting with '/' are served as public assets.
 *
 * @type {string}
 */
const SEA_ASSETS_MANIFEST = "@raven-js/assets.json";

/**
 * Check if we're running in a Single Executable Application.
 * Uses dynamic import to avoid errors in environments where node:sea is not available.
 *
 * @returns {boolean} True if running in SEA mode
 */
function isSEAEnvironment() {
	try {
		// Dynamic import to handle environments where node:sea might not be available
		const sea = require("node:sea");
		return sea && typeof sea.isSea === "function" && sea.isSea();
	} catch {
		return false;
	}
}

/**
 * Check if global asset variables are available.
 * Validates the structure to ensure it's a proper asset object.
 *
 * @returns {boolean} True if global assets are available
 */
function isGlobalAssetsAvailable() {
	try {
		const global = /** @type {any} */ (globalThis);
		const ravenJS = global.RavenJS;
		return (
			ravenJS &&
			typeof ravenJS.assets === "object" &&
			ravenJS.assets !== null &&
			!Array.isArray(ravenJS.assets)
		);
	} catch {
		return false;
	}
}

/**
 * Validate that a request path is safe for asset serving.
 * Implements security checks to prevent path traversal and unauthorized access.
 *
 * @param {string} requestPath - The request path to validate
 * @returns {boolean} True if the path is safe to serve
 */
function isValidAssetPath(requestPath) {
	// Must be a string
	if (typeof requestPath !== "string") return false;

	// Must start with / for public access (security requirement)
	if (!requestPath.startsWith("/")) return false;

	// Prevent path traversal attacks
	if (requestPath.includes("..")) return false;
	if (requestPath.includes("\\")) return false;

	// Prevent null bytes and other control characters
	if (requestPath.includes("\0")) return false;

	// Must not be just a slash (root path)
	if (requestPath === "/") return false;

	return true;
}

/**
 * Recursively list all files in a directory with relative paths.
 * Returns paths in web format (forward slashes, starting with /).
 *
 * @param {string} dirPath - The directory to scan
 * @param {string} [basePath=""] - The base path for recursion
 * @returns {Promise<string[]>} Array of relative file paths
 */
async function listFilesRecursive(dirPath, basePath = "") {
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true });
		const files = [];

		for (const entry of entries) {
			const fullPath = path.join(dirPath, entry.name);
			const relativePath = path.join(basePath, entry.name);

			if (entry.isDirectory()) {
				// Recurse into subdirectories
				const subFiles = await listFilesRecursive(fullPath, relativePath);
				files.push(...subFiles);
			} else {
				// Convert to web path format (forward slashes, leading /)
				const webPath = `/${relativePath.split(path.sep).join("/")}`;
				files.push(webPath);
			}
		}

		return files;
	} catch {
		// Directory doesn't exist or can't be read - return empty array
		return [];
	}
}

/**
 * Assets - Static file serving middleware with transparent multi-source support
 *
 * This middleware automatically detects the best available asset source and serves
 * static files transparently. It supports modern deployment patterns while maintaining
 * backwards compatibility with traditional file-based serving.
 *
 * The middleware operates in three modes with automatic priority-based selection:
 * 1. SEA mode: Serves from Single Executable Application embedded resources
 * 2. Global mode: Serves from JavaScript variables in globalThis.RavenJS.assets
 * 3. FileSystem mode: Serves from local file system (traditional approach)
 *
 * Mode selection is completely transparent - the same public API works regardless
 * of the deployment method. This allows applications to be developed with file
 * system assets and deployed as bundled or executable applications without changes.
 *
 * ## Security Model
 *
 * All modes enforce the same security model:
 * - Only assets with paths starting with '/' are served (public assets)
 * - Path traversal attacks are prevented through validation
 * - Internal/private files are never exposed to the web
 * - Mode isolation prevents cross-contamination
 *
 * ## Error Handling
 *
 * The middleware follows Wings' error collection pattern:
 * - Asset serving errors are collected in ctx.errors for logging
 * - Missing assets return early (allowing router to handle 404s)
 * - Mode initialization failures fall back gracefully
 * - No unhandled exceptions break the request pipeline
 *
 * @example Development Setup (File System Mode)
 * ```javascript
 * // Directory structure:
 * // public/
 * //   ├── css/styles.css
 * //   ├── js/app.js
 * //   └── images/logo.png
 *
 * const assets = new Assets({ assetsDir: 'public' });
 * router.use(assets);
 *
 * // GET /css/styles.css -> serves public/css/styles.css
 * // GET /js/app.js -> serves public/js/app.js
 * // GET /images/logo.png -> serves public/images/logo.png
 * ```
 *
 * @example Production SEA Deployment
 * ```javascript
 * // Same code works in SEA mode:
 * const assets = new Assets(); // assetsDir ignored in SEA mode
 * router.use(assets);
 *
 * // Assets served from embedded SEA resources automatically
 * // No code changes required!
 * ```
 *
 * @example Bundled Deployment with Global Assets
 * ```javascript
 * // Assets embedded as JavaScript:
 * globalThis.RavenJS = {
 *   assets: {
 *     '/css/styles.css': 'body { color: red; }',
 *     '/js/app.js': 'console.log("Hello");',
 *     '/images/logo.png': Buffer.from([...])
 *   }
 * };
 *
 * const assets = new Assets();
 * router.use(assets);
 *
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

		super(async (ctx) => {
			// Handle asset request directly in the middleware chain
			// This runs before routing, so assets take priority over routes
			await this.#handleAssetRequest(ctx);
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
				this.assetsList = this.#loadSEAAssetsList();
				return;
			}

			// Priority 2: Global variables mode
			if (isGlobalAssetsAvailable()) {
				this.mode = "global";
				this.assetsList = this.#loadGlobalAssetsList();
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
	 * Load asset list from SEA embedded manifest.
	 * Reads the magic file containing the list of public assets.
	 *
	 * @returns {string[]} Array of asset paths
	 */
	#loadSEAAssetsList() {
		try {
			const sea = require("node:sea");
			const manifestContent = sea.getAsset(SEA_ASSETS_MANIFEST);
			const manifestBuffer = Buffer.from(manifestContent);
			const assetPaths = JSON.parse(manifestBuffer.toString("utf-8"));

			// Filter to only public assets (security requirement)
			return Array.isArray(assetPaths)
				? assetPaths.filter((path) => path.startsWith("/"))
				: [];
		} catch {
			// Manifest not found or invalid - no assets available
			return [];
		}
	}

	/**
	 * Load asset list from global variables.
	 * Extracts paths from the globalThis.RavenJS.assets object.
	 *
	 * @returns {string[]} Array of asset paths
	 */
	#loadGlobalAssetsList() {
		try {
			const global = /** @type {any} */ (globalThis);
			const assets = global.RavenJS.assets;
			const paths = Object.keys(assets);

			// Filter to only public assets (security requirement)
			return paths.filter((path) => path.startsWith("/"));
		} catch {
			// Global assets not available or invalid
			return [];
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
		listFilesRecursive(this.assetsPath)
			.then((files) => {
				this.assetsList = files;
			})
			.catch(() => {
				// Directory doesn't exist or can't be read
				this.assetsList = [];
			});
	}

	/**
	 * Check if an asset exists in the current mode.
	 *
	 * @param {string} assetPath - The asset path to check
	 * @returns {boolean} True if the asset exists
	 */
	#hasAsset(assetPath) {
		// For filesystem mode, we might not have loaded the list yet
		// In that case, we'll try to serve and let the file system determine existence
		if (this.mode === "filesystem" && this.assetsList.length === 0) {
			return true; // Let the file system check handle it
		}

		return this.assetsList.includes(assetPath);
	}

	/**
	 * Handle an asset request using the current mode.
	 * This is the main entry point for asset serving.
	 *
	 * @param {import('../core/context.js').Context} ctx - Request context
	 */
	async #handleAssetRequest(ctx) {
		try {
			// Skip if response already handled or no response body expected
			if (ctx.responseEnded) return;

			// Decode the URL path to handle unicode characters
			let decodedPath;
			try {
				decodedPath = decodeURIComponent(ctx.path);
			} catch {
				// If decoding fails, use original path
				decodedPath = ctx.path;
			}

			// Validate the request path for security
			if (!isValidAssetPath(decodedPath)) return;

			// Check if asset exists (mode-specific) using decoded path
			if (!this.#hasAsset(decodedPath)) return;

			// Serve asset based on current mode
			switch (this.mode) {
				case "sea":
					await this.#serveAssetSEA(ctx, decodedPath);
					break;
				case "global":
					await this.#serveAssetGlobal(ctx, decodedPath);
					break;
				case "filesystem":
					await this.#serveAssetFileSystem(ctx, decodedPath);
					break;
				default:
					// Mode not initialized - skip asset serving
					return;
			}
		} catch (error) {
			// Collect error but don't break the request
			const assetError = new Error(`Asset serving failed: ${error.message}`);
			assetError.name = "AssetError";
			/** @type {any} */ (assetError).originalError = error;
			/** @type {any} */ (assetError).mode = this.mode;
			/** @type {any} */ (assetError).path = ctx.path;
			ctx.errors.push(assetError);
		}
	}

	/**
	 * Serve an asset from SEA embedded resources.
	 *
	 * @param {import('../core/context.js').Context} ctx - Request context
	 * @param {string} assetPath - Decoded asset path to serve
	 */
	async #serveAssetSEA(ctx, assetPath) {
		try {
			const sea = require("node:sea");
			const content = sea.getAsset(assetPath);
			const buffer = Buffer.from(content);
			this.#setAssetResponse(ctx, buffer, assetPath);
		} catch {
			// Asset not found in SEA - let request continue
			// This allows other middleware or routes to handle the path
			return;
		}
	}

	/**
	 * Serve an asset from global variables.
	 *
	 * @param {import('../core/context.js').Context} ctx - Request context
	 * @param {string} assetPath - Decoded asset path to serve
	 */
	async #serveAssetGlobal(ctx, assetPath) {
		const global = /** @type {any} */ (globalThis);
		const content = global.RavenJS.assets[assetPath];
		if (!content) return;

		// Convert content to Buffer if it's a string
		const buffer =
			typeof content === "string" ? Buffer.from(content, "utf8") : content;

		this.#setAssetResponse(ctx, buffer, assetPath);
	}

	/**
	 * Serve an asset from the file system.
	 *
	 * @param {import('../core/context.js').Context} ctx - Request context
	 * @param {string} assetPath - Decoded asset path to serve
	 */
	async #serveAssetFileSystem(ctx, assetPath) {
		try {
			const fullPath = path.join(this.assetsPath, assetPath);

			// Additional security check: ensure the resolved path is within assets directory
			const resolvedPath = path.resolve(fullPath);
			const resolvedAssetsPath = path.resolve(this.assetsPath);

			if (!resolvedPath.startsWith(resolvedAssetsPath)) {
				// Path traversal attempt - reject
				return;
			}

			const content = await fs.readFile(resolvedPath);
			this.#setAssetResponse(ctx, content, assetPath);
		} catch {
			// File not found or can't be read - let request continue
			return;
		}
	}

	/**
	 * Set the response for a successfully found asset.
	 * Configures all necessary headers and response body.
	 *
	 * @param {import('../core/context.js').Context} ctx - Request context
	 * @param {Buffer} buffer - Asset content as Buffer
	 * @param {string} assetPath - Decoded asset path for MIME type detection
	 */
	#setAssetResponse(ctx, buffer, assetPath) {
		const mimeType = getMimeType(assetPath);

		ctx.responseHeaders.set("content-type", mimeType);
		ctx.responseHeaders.set("content-length", buffer.length.toString());

		// Add basic caching headers (can be overridden by other middleware)
		ctx.responseHeaders.set("cache-control", "public, max-age=3600");

		ctx.responseStatusCode = 200;
		ctx.responseBody = buffer;
		ctx.responseEnded = true;
	}
}
