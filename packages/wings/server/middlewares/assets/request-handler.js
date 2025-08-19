/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import {
	serveAssetFileSystem,
	serveAssetGlobal,
	serveAssetSEA,
} from "./asset-servers.js";
import { isValidAssetPath } from "./path-validation.js";

/**
 *
 * Handle an asset request using the current mode.
 * This is the main entry point for asset serving.
 * This function orchestrates the entire asset serving pipeline:
 * 1. Validates that a response hasn't already been sent
 * 2. Decodes the URL path to handle unicode characters
 * 3. Validates the request path for security
 * 4. Checks if the asset exists in the current mode
 * 5. Serves the asset using the appropriate mode-specific handler
 * 6. Handles errors gracefully without breaking the request pipeline
 * ```javascript
 * import { handleAssetRequest } from './request-handler.js';
 * const config = {
 * mode: 'filesystem',
 * assetsList: ['/css/style.css', '/js/app.js'],
 * assetsPath: '/path/to/assets'
 * };
 * await handleAssetRequest(ctx, config);
 * ```
 * ```javascript
 * // Errors are collected in ctx.errors for logging
 * await handleAssetRequest(ctx, config);
 * if (ctx.errors.length > 0) {
 * console.log('Asset serving errors:', ctx.errors);
 * }
 * ```
 */
export async function handleAssetRequest(/** @type {any} */ ctx, /** @type {any} */ assetConfig) {
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
		if (!hasAsset(decodedPath, assetConfig)) return;

		// Serve asset based on current mode
		switch (assetConfig.mode) {
			case "sea":
				await serveAssetSEA(ctx, decodedPath);
				break;
			case "global":
				await serveAssetGlobal(ctx, decodedPath);
				break;
			case "filesystem":
				await serveAssetFileSystem(ctx, decodedPath, assetConfig.assetsPath);
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

		// Safely access config properties that might throw
		try {
			/** @type {any} */ (assetError).mode = assetConfig.mode;
		} catch {
			/** @type {any} */ (assetError).mode = "unknown";
		}

		// Safely access ctx.path that might throw
		try {
			/** @type {any} */ (assetError).path = ctx.path;
		} catch {
			/** @type {any} */ (assetError).path = "unknown";
		}
		ctx.errors.push(assetError);
	}
}

/**
 * Check if an asset exists in the current mode.
 *
 * This function determines whether an asset is available based on the current
 * serving mode. For filesystem mode, it may return true even if the asset list
 * isn't loaded yet, allowing the file system to make the final determination.
 *
 * @param {string} assetPath - The asset path to check
 * @param {Object} assetConfig - Asset configuration object
 * @param {string} assetConfig.mode - Current asset serving mode
 * @param {string[]} assetConfig.assetsList - Cached list of available assets
 * @returns {boolean} True if the asset exists or might exist
 *
 * @example
 * ```javascript
 * const config = {
 *   mode: 'global',
 *   assetsList: ['/css/style.css', '/js/app.js'],
 *   assetsPath: null
 * };
 *
 * hasAsset('/css/style.css', config);  // → true
 * hasAsset('/missing.css', config);    // → false
 * ```
 *
 * @example Filesystem Fallback
 * ```javascript
 * const config = {
 *   mode: 'filesystem',
 *   assetsList: [],  // Not loaded yet
 *   assetsPath: '/path/to/assets'
 * };
 *
 * hasAsset('/style.css', config);  // → true (let filesystem decide)
 * ```
 */
export function hasAsset(assetPath, assetConfig) {
	// For filesystem mode, we might not have loaded the list yet
	// In that case, we'll try to serve and let the file system determine existence
	if (
		assetConfig.mode === "filesystem" &&
		assetConfig.assetsList.length === 0
	) {
		return true; // Let the file system check handle it
	}

	return assetConfig.assetsList.includes(assetPath);
}
