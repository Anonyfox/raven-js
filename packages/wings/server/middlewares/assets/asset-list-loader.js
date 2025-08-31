/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { listFilesRecursive } from "./file-operations.js";

/**
 * @file Asset list loading strategies for multi-source support.
 *
 * Provides specialized loaders for each asset serving mode with source-specific
 * optimization and security filtering. Critical for transparent mode operation.
 */

/**
 * Magic filename for SEA asset manifests.
 *
 * @constant {string}
 *
 * @example
 * // Standard SEA manifest filename
 * console.log(SEA_ASSETS_MANIFEST); // "@raven-js/assets.json"
 */
export const SEA_ASSETS_MANIFEST = "@raven-js/assets.json";

/**
 * Load asset list from SEA embedded manifest.
 *
 * Extracts asset paths from Single Executable Application manifest using
 * node:sea module. Applies security filtering to prevent exposure of
 * internal files - only public assets (paths starting with '/') are included.
 *
 * @returns {string[]} Array of validated public asset paths
 *
 * @example SEA Manifest Loading
 * ```javascript
 * // With valid SEA manifest:
 * // @raven-js/assets.json: ["/css/style.css", "/js/app.js", "internal.cfg"]
 *
 * const assets = loadSEAAssetsList();
 * console.log(assets); // → ['/css/style.css', '/js/app.js']
 * // Note: 'internal.cfg' filtered out (security)
 * ```
 *
 * @example Error Resilience
 * ```javascript
 * // Graceful handling of missing/invalid manifest
 * const assets = loadSEAAssetsList(); // → [] (never throws)
 *
 * // Invalid JSON in manifest
 * const assets = loadSEAAssetsList(); // → [] (parsing errors caught)
 * ```
 */
export function loadSEAAssetsList() {
	try {
		const sea = require("node:sea");
		const manifestContent = sea.getAsset(SEA_ASSETS_MANIFEST);
		const manifestBuffer = Buffer.from(manifestContent);
		const assetPaths = JSON.parse(manifestBuffer.toString("utf-8"));

		// Filter to only public assets (security requirement)
		return Array.isArray(assetPaths)
			? assetPaths.filter(
					(path) => typeof path === "string" && path.startsWith("/"),
				)
			: [];
	} catch {
		// Manifest not found or invalid - no assets available
		return [];
	}
}

/**
 * Load asset list from global variables.
 *
 * Extracts asset paths from globalThis.RavenJS.assets object used for
 * JavaScript-embedded assets. Applies same security filtering as other
 * modes to maintain consistent access control.
 *
 * @returns {string[]} Array of validated public asset paths from global object
 *
 * @example Global Assets Extraction
 * ```javascript
 * globalThis.RavenJS = {
 *   assets: {
 *     '/css/style.css': 'body { margin: 0; }',
 *     '/js/app.js': 'console.log("loaded");',
 *     'config.json': '{"secret": true}'  // Filtered out
 *   }
 * };
 *
 * const assets = loadGlobalAssetsList();
 * console.log(assets); // → ['/css/style.css', '/js/app.js']
 * ```
 *
 * @example Security Filtering
 * ```javascript
 * // Only public paths (starting with '/') are included
 * globalThis.RavenJS.assets = {
 *   '/public.css': 'content',     // → included
 *   'private.txt': 'secret',      // → filtered out
 *   '../escape.js': 'attack'      // → filtered out
 * };
 * ```
 */
export function loadGlobalAssetsList() {
	try {
		const global = /** @type {any} */ (globalThis);
		const assets = global.RavenJS.assets;
		const paths = Object.keys(assets);

		// Filter to only public assets (security requirement)
		return paths.filter(
			(path) => typeof path === "string" && path.startsWith("/"),
		);
	} catch {
		// Global assets not available or invalid
		return [];
	}
}

/**
 * Load asset list from file system.
 *
 * Performs asynchronous directory scan to build comprehensive asset inventory.
 * Most expensive operation among loading strategies but provides complete
 * file system reflection for development and traditional deployments.
 *
 * @param {string} assetsPath - Full filesystem path to assets directory
 * @returns {Promise<string[]>} Promise resolving to web-normalized asset paths
 *
 * @example Directory Scanning
 * ```javascript
 * // Comprehensive directory scan:
 * const assets = await loadFileSystemAssetsList('./public');
 * console.log(assets);
 * // → ['/css/style.css', '/js/app.js', '/images/logo.png']
 *
 * // All files found recursively and normalized
 * ```
 *
 * @example Performance Characteristics
 * ```javascript
 * // Async operation - does not block initialization
 * const startTime = Date.now();
 * const assets = await loadFileSystemAssetsList('./large-assets');
 * console.log(`Scan completed in ${Date.now() - startTime}ms`);
 *
 * // Large directories may take time but won't block server startup
 * ```
 *
 * @example Error Resilience
 * ```javascript
 * // Missing directory handling
 * const missing = await loadFileSystemAssetsList('./nonexistent');
 * console.log(missing); // → [] (graceful degradation)
 *
 * // Permission errors also return empty array
 * const restricted = await loadFileSystemAssetsList('/root');
 * console.log(restricted); // → [] (no exception)
 * ```
 */
export async function loadFileSystemAssetsList(assetsPath) {
	return await listFilesRecursive(assetsPath);
}
