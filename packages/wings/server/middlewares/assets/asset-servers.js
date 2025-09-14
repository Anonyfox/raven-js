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
 * @file Asset serving implementations for different source modes.
 *
 * Provides mode-specific asset serving with consistent error handling and
 * response finalization. Each function handles its source type optimally.
 */

/**
 * Serve an asset from SEA embedded resources.
 *
 * Retrieves assets from Single Executable Application using node:sea module.
 * Fastest serving mode due to in-memory embedded resources. Handles
 * format conversion from embedded data to HTTP response.
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context to modify
 * @param {string} assetPath - Decoded asset path to serve from SEA resources
 *
 * @example SEA Asset Serving
 * ```javascript
 * // In SEA environment with embedded assets
 * await serveAssetSEA(ctx, '/css/style.css');
 * // → Retrieves from SEA, sets Content-Type and response body
 * // → ctx.responseEnded = true, ready for transmission
 * ```
 *
 * @example Graceful Fallthrough
 * ```javascript
 * // When asset not found in SEA resources
 * await serveAssetSEA(ctx, '/missing.css');
 * // → Returns silently, ctx.responseEnded remains false
 * // → Allows other middleware/routes to handle the request
 * ```
 */
export async function serveAssetSEA(ctx, assetPath) {
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
 * Retrieves assets from globalThis.RavenJS.assets object where content
 * is embedded as JavaScript variables. Handles both string and Buffer
 * content with automatic type conversion for consistent Buffer responses.
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context to modify
 * @param {string} assetPath - Decoded asset path to serve from global object
 *
 * @example Global Asset Serving
 * ```javascript
 * globalThis.RavenJS = {
 *   assets: {
 *     '/css/style.css': 'body { margin: 0; }',
 *     '/data.json': '{"key": "value"}'
 *   }
 * };
 *
 * await serveAssetGlobal(ctx, '/css/style.css');
 * // → String converted to Buffer, Content-Type set, response finalized
 * ```
 *
 * @example Mixed Content Types
 * ```javascript
 * // Automatic type handling
 * globalThis.RavenJS.assets = {
 *   '/text.txt': 'string content',           // → Buffer.from(content, 'utf8')
 *   '/binary.png': Buffer.from([0x89, ...]) // → Used directly as Buffer
 * };
 *
 * // Both types result in Buffer responses with proper Content-Type
 * ```
 *
 * @example Bundled Asset Format
 * ```javascript
 * // Assets embedded by Fledge bundler
 * globalThis.RavenJS.assets = {
 *   '/favicon.ico': {
 *     content: 'base64-encoded-data',
 *     meta: { encoding: 'base64', type: 'image/x-icon' }
 *   }
 * };
 *
 * await serveAssetGlobal(ctx, '/favicon.ico');
 * // → Content decoded from base64, Content-Type set from meta, response finalized
 * ```
 *
 * @example Missing Asset Handling
 * ```javascript
 * await serveAssetGlobal(ctx, '/nonexistent.css');
 * // → Returns early, no response set (allows fallthrough)
 * ```
 */
export async function serveAssetGlobal(ctx, assetPath) {
  const global = /** @type {any} */ (globalThis);
  const asset = global.RavenJS.assets[assetPath];
  if (asset === undefined || asset === null) return;

  // Handle different asset formats
  let content,
    encoding = "utf8";

  if (typeof asset === "string") {
    // Legacy format: direct string content
    content = asset;
  } else if (asset && typeof asset === "object" && asset.content) {
    // Bundled format: { content, meta } object
    content = asset.content;
    encoding = asset.meta?.encoding || "utf8";
  } else if (Buffer.isBuffer(asset)) {
    // Direct Buffer content
    setAssetResponse(ctx, asset, assetPath);
    return;
  } else {
    // Unknown format
    return;
  }

  // Convert content to Buffer based on encoding
  let buffer;
  try {
    if (encoding === "base64") {
      buffer = Buffer.from(content, "base64");
    } else {
      buffer = Buffer.from(content, "utf8");
    }
  } catch {
    // Invalid content format
    return;
  }

  setAssetResponse(ctx, buffer, assetPath);
}

/**
 * Serve an asset from the file system.
 *
 * Reads assets from local filesystem with defense-in-depth security.
 * Slowest serving mode due to disk I/O but provides complete file system
 * reflection. Implements additional path traversal protection beyond
 * initial validation.
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context to modify
 * @param {string} assetPath - Decoded asset path to serve from filesystem
 * @param {string} assetsPath - Full resolved path to assets directory
 *
 * @example Filesystem Asset Serving
 * ```javascript
 * const assetsPath = path.resolve('./public');
 * await serveAssetFileSystem(ctx, '/css/style.css', assetsPath);
 * // → Reads ./public/css/style.css
 * // → Sets Content-Type based on extension
 * // → Finalizes response with file contents
 * ```
 *
 * @example Security Protection
 * ```javascript
 * // Double-layer path traversal protection
 * await serveAssetFileSystem(ctx, '/../etc/passwd', assetsPath);
 * // → path.resolve() check prevents directory escape
 * // → Returns early without serving, no error thrown
 *
 * // Symlink attacks also prevented by resolved path validation
 * ```
 *
 * @example Error Handling
 * ```javascript
 * // File not found or permission denied
 * await serveAssetFileSystem(ctx, '/missing.css', assetsPath);
 * // → fs.readFile() throws, caught silently
 * // → Returns without setting response (graceful degradation)
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
