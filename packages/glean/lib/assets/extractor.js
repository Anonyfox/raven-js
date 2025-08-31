/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Asset extraction from markdown content
 *
 * Surgical extraction of local image references from markdown content.
 * Identifies relative paths that need asset processing while preserving
 * external URLs and ensuring zero false positives.
 */

import { existsSync } from "node:fs";
import path, { extname, isAbsolute, join, resolve } from "node:path";

/**
 * @typedef {Object} ImageAsset
 * @property {string} originalPath - Original path in markdown (e.g., "./images/logo.png")
 * @property {string} resolvedPath - Full filesystem path to asset
 * @property {string} basePath - Base directory for path resolution
 * @property {string} contentType - MIME type based on file extension
 * @property {string} altText - Alt text for SEO-friendly naming (e.g., "Beak Logo")
 */

/**
 * Supported image file extensions for asset processing
 * @type {Set<string>}
 */
const IMAGE_EXTENSIONS = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".svg",
	".webp",
	".avif",
	".bmp",
	".tiff",
	".ico",
	".apng",
]);

/**
 * MIME type mapping for image extensions
 * @type {Record<string, string>}
 */
const MIME_TYPES = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".webp": "image/webp",
	".avif": "image/avif",
	".bmp": "image/bmp",
	".tiff": "image/tiff",
	".ico": "image/x-icon",
	".apng": "image/apng",
};

/**
 * Extract local image assets from markdown content
 *
 * Scans markdown for image references using both inline and reference syntax,
 * resolves relative paths, validates file existence, and returns asset metadata
 * for further processing. Only processes local files - skips HTTP URLs.
 *
 * @param {string} markdown - Markdown content to scan
 * @param {string} basePath - Base directory for resolving relative paths
 * @returns {ImageAsset[]} Array of discovered image assets
 *
 * @example
 * // Basic extraction
 * const assets = extractImageAssets('![Logo](./images/logo.png)', '/my/project');
 * // → [{ originalPath: './images/logo.png', resolvedPath: '/my/project/images/logo.png', ... }]
 *
 * @example
 * // Mixed content with external URLs (skipped)
 * extractImageAssets('![Local](./logo.png) ![Remote](https://example.com/logo.png)', '/base');
 * // → Only processes ./logo.png, skips https://example.com/logo.png
 */
export function extractImageAssets(markdown, basePath) {
	if (!markdown || typeof markdown !== "string") {
		return [];
	}

	if (!basePath || typeof basePath !== "string") {
		return [];
	}

	const assets = [];
	const seenPaths = new Set(); // Prevent duplicates

	// Match inline images: ![alt](src "title")
	const inlineRegex = /!\[([^\]]*)\]\(([^)]+?)(?:\s+"[^"]*")?\)/g;
	let match;

	match = inlineRegex.exec(markdown);
	while (match !== null) {
		const [, altText, src] = match;
		const asset = processImageSrc(src.trim(), basePath, altText.trim());
		if (asset && !seenPaths.has(asset.resolvedPath)) {
			assets.push(asset);
			seenPaths.add(asset.resolvedPath);
		}
		match = inlineRegex.exec(markdown);
	}

	// Match HTML img tags: <img src="..." alt="..." />
	const htmlImgRegex = /<img[^>]*\s+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
	match = htmlImgRegex.exec(markdown);
	while (match !== null) {
		const [fullMatch, src] = match;
		// Extract alt attribute from the full match
		const altMatch = fullMatch.match(/\s+alt\s*=\s*["']([^"']*)["']/i);
		const altText = altMatch ? altMatch[1].trim() : "";
		const asset = processImageSrc(src.trim(), basePath, altText);
		if (asset && !seenPaths.has(asset.resolvedPath)) {
			assets.push(asset);
			seenPaths.add(asset.resolvedPath);
		}
		match = htmlImgRegex.exec(markdown);
	}

	// Match reference images: ![alt][ref]
	// Note: This would require parsing reference definitions, but for now
	// we focus on inline images which cover 90% of use cases
	// Reference images can be added in future iteration if needed

	return assets;
}

/**
 * Process a single image source URL and create asset metadata
 * @param {string} src - Image source URL from markdown
 * @param {string} basePath - Base directory for path resolution
 * @param {string} altText - Alt text for SEO-friendly naming
 * @returns {ImageAsset|null} Asset metadata or null if not processable
 */
function processImageSrc(src, basePath, altText = "") {
	// Skip empty sources
	if (!src) {
		return null;
	}

	// Skip external URLs (http/https/ftp/mailto)
	if (/^[a-z][a-z0-9+.-]*:/i.test(src)) {
		return null;
	}

	// Skip absolute paths (security - don't allow access outside package)
	if (isAbsolute(src)) {
		return null;
	}

	// Skip data URLs
	if (src.startsWith("data:")) {
		return null;
	}

	// Check if it's an image file by extension
	const extension = extname(src).toLowerCase();
	if (!IMAGE_EXTENSIONS.has(extension)) {
		return null;
	}

	// Resolve relative path
	const resolvedPath = resolve(join(basePath, src));

	// Security check: prevent access to sensitive system directories
	const resolvedPathNormalized = resolvedPath.toLowerCase();
	const forbiddenPaths = [
		"/etc/",
		"/usr/",
		"/var/",
		"/sys/",
		"/proc/",
		"/boot/",
		"/root/",
	];
	if (
		forbiddenPaths.some((forbidden) =>
			resolvedPathNormalized.startsWith(forbidden),
		)
	) {
		return null;
	}

	// Additional check: prevent going too far up (more than 10 levels up from base)
	const relativePath = path.relative(basePath, resolvedPath);
	const upLevels = (relativePath.match(/\.\./g) || []).length;
	if (upLevels > 10) {
		return null;
	}

	// Check if file exists
	if (!existsSync(resolvedPath)) {
		// Try checking parent directory (common pattern for submodule READMEs referencing package assets)
		const parentDirPath = resolve(join(basePath, "..", src));
		if (existsSync(parentDirPath)) {
			// Use parent directory asset instead
			return {
				originalPath: src,
				resolvedPath: parentDirPath,
				basePath,
				contentType:
					MIME_TYPES[extname(src).toLowerCase()] || "application/octet-stream",
				altText,
			};
		}
		return null;
	}

	// Get content type
	const contentType = MIME_TYPES[extension] || "application/octet-stream";

	return {
		originalPath: src,
		resolvedPath,
		basePath,
		contentType,
		altText,
	};
}

/**
 * Check if a path is a local image reference that should be processed
 * @param {string} path - Path to check
 * @returns {boolean} True if path should be processed as local image asset
 */
export function isLocalImagePath(path) {
	if (!path || typeof path !== "string") {
		return false;
	}

	// Skip external URLs
	if (/^[a-z][a-z0-9+.-]*:/i.test(path)) {
		return false;
	}

	// Skip data URLs
	if (path.startsWith("data:")) {
		return false;
	}

	// Skip absolute paths
	if (isAbsolute(path)) {
		return false;
	}

	// Check image extension
	const extension = extname(path).toLowerCase();
	return IMAGE_EXTENSIONS.has(extension);
}
