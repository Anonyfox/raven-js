/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { getMimeType } from "../../../core/mime-utils.js";

/**
 * @file HTTP response utilities for asset serving.
 *
 * Provides standardized response setup with proper MIME types and caching headers.
 * Critical for consistent asset delivery across all serving modes.
 */

/**
 * Set the response for a successfully found asset.
 *
 * Configures complete HTTP response with appropriate headers for asset delivery.
 * Handles MIME type detection, content length calculation, and caching directives.
 * Terminal operation that finalizes the response pipeline.
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context to modify
 * @param {Buffer} buffer - Asset content as Buffer
 * @param {string} assetPath - Asset path for MIME type detection
 *
 * @example CSS Asset Response
 * ```javascript
 * const cssContent = Buffer.from('body { margin: 0; }');
 * setAssetResponse(ctx, cssContent, '/css/style.css');
 * // → Content-Type: text/css; charset=utf-8
 * // → Content-Length: 17
 * // → Cache-Control: public, max-age=3600
 * ```
 *
 * @example Binary Asset Response
 * ```javascript
 * const imageBuffer = await fs.readFile('./logo.png');
 * setAssetResponse(ctx, imageBuffer, '/images/logo.png');
 * // → Content-Type: image/png
 * // → Content-Length: [buffer.length]
 * // → Cache-Control: public, max-age=3600
 * ```
 *
 * @example Response Finalization
 * ```javascript
 * // After calling setAssetResponse:
 * console.log(ctx.responseEnded); // → true
 * console.log(ctx.responseStatusCode); // → 200
 * // Response is ready for transmission
 * ```
 */
export function setAssetResponse(ctx, buffer, assetPath) {
	const mimeType = getMimeType(assetPath);

	ctx.responseHeaders.set("content-type", mimeType);
	ctx.responseHeaders.set("content-length", buffer.length.toString());

	// Add basic caching headers (can be overridden by other middleware)
	ctx.responseHeaders.set("cache-control", "public, max-age=3600");

	ctx.responseStatusCode = 200;
	ctx.responseBody = buffer;
	ctx.responseEnded = true;
}
