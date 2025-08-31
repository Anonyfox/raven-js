/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Asset processing module - extraction, registry, and serving
 *
 * Complete asset processing pipeline for local images in markdown content.
 * Provides extraction, content-addressable storage, path rewriting, and
 * HTTP serving with zero external dependencies.
 */

export { extractImageAssets, isLocalImagePath } from "./extractor.js";
export { AssetRegistry } from "./registry.js";
export { createAssetMiddleware, serveAsset } from "./server.js";
