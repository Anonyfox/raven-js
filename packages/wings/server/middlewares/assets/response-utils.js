/**
 * @file Response Utils - HTTP response utilities for asset serving
 *
 * Provides utilities for setting up HTTP responses when serving assets,
 * including proper headers, MIME type detection, and response configuration.
 * Handles the final step of the asset serving pipeline.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { getMimeType } from "../../../core/mime-utils.js";

/**
 * Set the response for a successfully found asset.
 * Configures all necessary headers and response body for asset serving.
 *
 * This function sets up the complete HTTP response for serving an asset,
 * including proper Content-Type header based on file extension, Content-Length
 * header for the response size, basic caching headers, and the response body.
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context
 * @param {Buffer} buffer - Asset content as Buffer
 * @param {string} assetPath - Asset path for MIME type detection
 *
 * @example
 * ```javascript
 * import { setAssetResponse } from './response-utils.js';
 *
 * // Set response for CSS file
 * const cssContent = Buffer.from('body { color: red; }');
 * setAssetResponse(ctx, cssContent, '/css/style.css');
 * // → Sets Content-Type: text/css, Content-Length, and response body
 * ```
 *
 * @example Image Asset
 * ```javascript
 * // Set response for image file
 * const imageBuffer = await fs.readFile('./logo.png');
 * setAssetResponse(ctx, imageBuffer, '/images/logo.png');
 * // → Sets Content-Type: image/png, Content-Length, and response body
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
