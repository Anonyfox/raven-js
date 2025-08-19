/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { setAssetResponse } from "./response-utils.js";

/**
 *
 * Serve an asset from SEA embedded resources.
 * This function retrieves assets from Single Executable Application embedded
 * resources using the node:sea module. It handles the conversion from the
 * embedded format to a Buffer and sets up the appropriate HTTP response.
 * ```javascript
 * import { serveAssetSEA } from './asset-servers.js';
 * // In SEA environment, serve embedded asset
 * await serveAssetSEA(ctx, '/css/style.css');
 * // → Retrieves from SEA resources and sets response
 * ```
 * ```javascript
 * // When asset doesn't exist in SEA
 * await serveAssetSEA(ctx, '/nonexistent.css');
 * // → Returns without setting response (allows fallthrough)
 * ```
 */
export async function serveAssetSEA(/** @type {any} */ ctx, /** @type {string} */ assetPath) {
	try {
		const sea = require("node:sea");
		const content = sea.getAsset(assetPath);
		const buffer = Buffer.from(content);
		setAssetResponse(ctx, buffer, assetPath);
	} catch {
		// Asset not found in SEA - let request continue
		// This allows other middleware or routes to handle the path
		return;
	}
}

/**
 * Serve an asset from global variables.
 *
 * This function retrieves assets from the globalThis.RavenJS.assets object
 * where assets are embedded as JavaScript variables. It handles both string
 * and Buffer content types and sets up the appropriate HTTP response.
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context
 * @param {string} assetPath - Decoded asset path to serve
 *
 * @example
 * ```javascript
 * import { serveAssetGlobal } from './asset-servers.js';
 *
 * // With global assets available
 * globalThis.RavenJS = {
 *   assets: {
 *     '/css/style.css': 'body { color: red; }'
 *   }
 * };
 *
 * await serveAssetGlobal(ctx, '/css/style.css');
 * // → Retrieves from global object and sets response
 * ```
 *
 * @example Different Content Types
 * ```javascript
 * // Handles both strings and Buffers
 * globalThis.RavenJS.assets = {
 *   '/text.txt': 'string content',        // String content
 *   '/image.png': Buffer.from([...])      // Buffer content
 * };
 * ```
 */
export async function serveAssetGlobal(ctx, assetPath) {
	const global = /** @type {any} */ (globalThis);
	const content = global.RavenJS.assets[assetPath];
	if (content === undefined || content === null) return;

	// Convert content to Buffer if it's a string
	const buffer =
		typeof content === "string" ? Buffer.from(content, "utf8") : content;

	setAssetResponse(ctx, buffer, assetPath);
}

/**
 * Serve an asset from the file system.
 *
 * This function reads assets from the local file system using the configured
 * assets directory. It includes additional security checks to prevent path
 * traversal attacks and handles file reading errors gracefully.
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context
 * @param {string} assetPath - Decoded asset path to serve
 * @param {string} assetsPath - Full path to the assets directory
 *
 * @example
 * ```javascript
 * import { serveAssetFileSystem } from './asset-servers.js';
 *
 * // Serve from file system
 * const assetsPath = path.resolve('./public');
 * await serveAssetFileSystem(ctx, '/css/style.css', assetsPath);
 * // → Reads ./public/css/style.css and sets response
 * ```
 *
 * @example Security
 * ```javascript
 * // Path traversal attempts are blocked
 * await serveAssetFileSystem(ctx, '/../secret.txt', assetsPath);
 * // → Returns without serving (security check fails)
 * ```
 */
export async function serveAssetFileSystem(ctx, assetPath, assetsPath) {
	try {
		const fullPath = path.join(assetsPath, assetPath);

		// Additional security check: ensure the resolved path is within assets directory
		const resolvedPath = path.resolve(fullPath);
		const resolvedAssetsPath = path.resolve(assetsPath);

		if (!resolvedPath.startsWith(resolvedAssetsPath)) {
			// Path traversal attempt - reject
			return;
		}

		const content = await fs.readFile(resolvedPath);
		setAssetResponse(ctx, content, assetPath);
	} catch {
		// File not found or can't be read - let request continue
		return;
	}
}
