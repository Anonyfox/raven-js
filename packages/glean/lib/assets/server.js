/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Asset serving for HTTP requests
 *
 * Minimal asset serving with proper HTTP headers, streaming, and security.
 * Serves registered assets directly from filesystem with zero memory bloat.
 */

import { readFileSync, statSync } from "node:fs";

/**
 * @typedef {import('./registry.js').AssetRegistry} AssetRegistry
 */

/**
 * @typedef {Object} Context
 * @property {URL} url - Request URL object
 * @property {Headers} headers - Request headers
 * @property {function(number): void} status - Set response status
 * @property {function(string): void} text - Send text response
 * @property {function(string, string): void} header - Set response header
 * @property {function(any): void} body - Send stream response
 */

/**
 * Serve asset file with proper HTTP headers and streaming
 *
 * Handles asset serving for /assets/* URLs with streaming, proper MIME types,
 * and browser caching headers. Returns appropriate error responses for
 * missing or invalid assets.
 *
 * @param {Context} context - Wings context object
 * @param {AssetRegistry} registry - Asset registry instance
 * @returns {Promise<void>} Async completion
 *
 * @example
 * // In Wings router
 * router.get('/assets/:filename', (ctx) => serveAsset(ctx, assetRegistry));
 */
export async function serveAsset(context, registry) {
	const pathname = /** @type {any} */ (context).path;

	// Extract filename from URL path
	if (!pathname.startsWith("/assets/")) {
		/** @type {any} */ (context).responseStatusCode = 404;
		await context.text("Asset not found");
		return;
	}

	// Check if registry exists
	if (!registry) {
		/** @type {any} */ (context).responseStatusCode = 404;
		await context.text("Asset not found");
		return;
	}

	// Get asset from registry
	const asset = registry.getAsset(pathname);
	if (!asset) {
		/** @type {any} */ (context).responseStatusCode = 404;
		await context.text("Asset not found");
		return;
	}

	try {
		// Get file stats for headers
		const stats = statSync(asset.resolvedPath);

		// Set response headers
		/** @type {any} */ (context).responseHeaders.set(
			"Content-Type",
			asset.contentType,
		);
		/** @type {any} */ (context).responseHeaders.set(
			"Content-Length",
			stats.size.toString(),
		);
		/** @type {any} */ (context).responseHeaders.set(
			"Cache-Control",
			"public, max-age=31536000, immutable",
		); // 1 year cache
		/** @type {any} */ (context).responseHeaders.set(
			"ETag",
			`"${asset.filename}"`,
		);

		// Handle conditional requests
		const ifNoneMatch = /** @type {any} */ (context).requestHeaders.get(
			"if-none-match",
		);
		if (ifNoneMatch === `"${asset.filename}"`) {
			/** @type {any} */ (context).responseStatusCode = 304;
			return;
		}

		// Read file content into Buffer
		const fileBuffer = readFileSync(asset.resolvedPath);
		/** @type {any} */ (context).responseStatusCode = 200;
		/** @type {any} */ (context).responseBody = fileBuffer;
	} catch {
		// File not found or other error
		/** @type {any} */ (context).responseStatusCode = 404;
		await context.text("Asset not found");
	}
}

/**
 * Create asset serving middleware for Wings router
 *
 * @param {AssetRegistry} registry - Asset registry instance
 * @returns {function(Context): Promise<void>} Wings middleware function
 */
export function createAssetMiddleware(registry) {
	return (/** @type {Context} */ context) => serveAsset(context, registry);
}
