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
 * @file Asset request orchestration and pipeline coordination.
 *
 * Main entry point for asset serving with comprehensive error handling
 * and mode-agnostic request processing. Critical middleware boundary.
 */

/**
 * Handle an asset request using the current mode.
 *
 * Orchestrates complete asset serving pipeline with defense-in-depth
 * validation and graceful error collection. Central coordination point
 * that delegates to mode-specific handlers while maintaining consistent
 * security and error handling across all modes.
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context to process
 * @param {AssetConfig} assetConfig - Asset configuration object with mode and paths
 *
 * @typedef {Object} AssetConfig
 * @property {'sea'|'global'|'filesystem'|'uninitialized'} mode - Asset serving mode
 * @property {string[]} assetsList - Cached list of available assets
 * @property {string|null} assetsPath - Full path to assets directory (filesystem mode only)
 *
 * @example Pipeline Execution
 * ```javascript
 * const config = {
 *   mode: 'filesystem',
 *   assetsList: ['/css/style.css', '/js/app.js'],
 *   assetsPath: '/path/to/public'
 * };
 *
 * await handleAssetRequest(ctx, config);
 * // → Path decoded and validated
 * // → Asset existence checked
 * // → Mode-specific handler invoked
 * // → Response finalized or graceful fallthrough
 * ```
 *
 * @example Error Collection
 * ```javascript
 * // Errors collected in ctx.errors without breaking pipeline
 * await handleAssetRequest(ctx, config);
 * if (ctx.errors.length > 0) {
 *   ctx.errors.forEach(err => {
 *     console.log(`Asset Error: ${err.message}`);
 *     console.log(`Mode: ${err.mode}, Path: ${err.path}`);
 *   });
 * }
 * ```
 *
 * @example Graceful Fallthrough
 * ```javascript
 * // When asset not found or mode uninitialized
 * await handleAssetRequest(ctx, config);
 * // → ctx.responseEnded remains false
 * // → Other middleware can handle the request
 * // → No exceptions thrown, pipeline continues
 * ```
 */
export async function handleAssetRequest(ctx, assetConfig) {
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
 * Performs mode-specific existence checking with filesystem fallback handling.
 * Critical for preventing unnecessary mode-specific handler invocation while
 * maintaining filesystem mode's lazy loading capability.
 *
 * @param {string} assetPath - Decoded asset path to verify
 * @param {AssetConfig} assetConfig - Asset configuration for mode-specific checking
 * @returns {boolean} True when asset exists or filesystem mode allows discovery
 *
 * @example Definitive Asset Lists
 * ```javascript
 * // SEA and Global modes have complete asset lists
 * const globalConfig = {
 *   mode: 'global',
 *   assetsList: ['/css/style.css', '/js/app.js'],
 *   assetsPath: null
 * };
 *
 * hasAsset('/css/style.css', globalConfig); // → true (found in list)
 * hasAsset('/missing.css', globalConfig);   // → false (not in list)
 * ```
 *
 * @example Filesystem Lazy Loading
 * ```javascript
 * // Filesystem mode allows discovery when list not loaded
 * const fsConfig = {
 *   mode: 'filesystem',
 *   assetsList: [], // Empty during async loading
 *   assetsPath: '/path/to/public'
 * };
 *
 * hasAsset('/unknown.css', fsConfig); // → true (let fs handler decide)
 * // Prevents blocking during asset list generation
 * ```
 *
 * @example Performance Optimization
 * ```javascript
 * // Avoids expensive handler calls for missing assets
 * if (hasAsset(path, config)) {
 *   await serveAssetHandler(ctx, path, config); // Only called when needed
 * }
 * // Reduces I/O and processing overhead
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
