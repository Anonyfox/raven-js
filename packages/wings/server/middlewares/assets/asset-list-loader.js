/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { listFilesRecursive } from "./file-operations.js";

/**
 *
 * Magic filename for SEA asset manifests.
 * This file should contain a JSON array of public asset paths.
 * Convention: Only paths starting with '/' are served as public assets.
 */
export const SEA_ASSETS_MANIFEST = "@raven-js/assets.json";

/**
 * Load asset list from SEA embedded manifest.
 * Reads the magic file containing the list of public assets.
 *
 * This function attempts to load the asset manifest from a Single Executable
 * Application using the node:sea module. It validates the manifest format
 * and filters assets to only include public assets (those starting with '/').
 *
 * @returns {string[]} Array of asset paths from SEA manifest
 *
 * @example
 * ```javascript
 * // In SEA environment with manifest:
 * const assets = loadSEAAssetsList();
 * console.log(assets); // ['/css/style.css', '/js/app.js']
 * ```
 *
 * @example Error Handling
 * ```javascript
 * // When SEA is not available or manifest is invalid:
 * const assets = loadSEAAssetsList();
 * console.log(assets); // [] (empty array)
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
 * Extracts paths from the globalThis.RavenJS.assets object.
 *
 * This function reads asset paths from the global JavaScript object where
 * assets are embedded as key-value pairs. It validates the structure and
 * filters to only include public assets for security.
 *
 * @returns {string[]} Array of asset paths from global variables
 *
 * @example
 * ```javascript
 * // With global assets defined:
 * globalThis.RavenJS = {
 *   assets: {
 *     '/css/style.css': 'body { color: red; }',
 *     '/js/app.js': 'console.log("app");',
 *     'private.txt': 'secret'  // This will be filtered out
 *   }
 * };
 *
 * const assets = loadGlobalAssetsList();
 * console.log(assets); // ['/css/style.css', '/js/app.js']
 * ```
 *
 * @example Error Handling
 * ```javascript
 * // When global assets are not available:
 * const assets = loadGlobalAssetsList();
 * console.log(assets); // [] (empty array)
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
 * Scans the configured directory and builds a list of available files.
 *
 * This function performs an asynchronous scan of the file system directory
 * to build a comprehensive list of available assets. It handles errors
 * gracefully and returns an empty array if the directory cannot be accessed.
 *
 * @param {string} assetsPath - Full path to the assets directory
 * @returns {Promise<string[]>} Promise resolving to array of asset paths
 *
 * @example
 * ```javascript
 * // Scan a directory for assets:
 * const assets = await loadFileSystemAssetsList('./public');
 * console.log(assets); // ['/css/style.css', '/js/app.js', '/images/logo.png']
 * ```
 *
 * @example Error Handling
 * ```javascript
 * // When directory doesn't exist:
 * const assets = await loadFileSystemAssetsList('./nonexistent');
 * console.log(assets); // [] (empty array, no error thrown)
 * ```
 */
export async function loadFileSystemAssetsList(assetsPath) {
	try {
		return await listFilesRecursive(assetsPath);
	} catch {
		// Directory doesn't exist or can't be read
		return [];
	}
}
