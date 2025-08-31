/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file File extension to MIME type mapping with caching and common web file type support.
 *
 * Provides utilities for determining MIME types from file extensions with fallback handling
 * for unknown types. Includes caching for performance and supports web, image, media, font, and document files.
 */

import { MATH_CONSTANTS, MIME_TYPES } from "./string-pool.js";

/**
 * MIME type lookup cache with LRU eviction.
 *
 * @type {Map<string, string>}
 */
const mimeTypeCache = new Map();

/** File extension to MIME type mappings for common web file types. */
const mimeTypes = {
	".html": MIME_TYPES.TEXT_HTML,
	".js": MIME_TYPES.TEXT_JAVASCRIPT,
	".css": MIME_TYPES.TEXT_CSS,
	".json": MIME_TYPES.APPLICATION_JSON,
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg", // Add jpeg extension
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".wav": "audio/wav",
	".mp4": "video/mp4",
	".woff": "application/font-woff",
	".ttf": "application/font-ttf",
	".eot": "application/vnd.ms-fontobject",
	".otf": "application/font-otf",
	".wasm": "application/wasm",
	".txt": MIME_TYPES.TEXT_PLAIN,
	".xml": MIME_TYPES.APPLICATION_XML,
	".ico": "image/x-icon",
	".webp": "image/webp",
	".avif": "image/avif",
	".webm": "video/webm",
	".mp3": "audio/mpeg",
	".pdf": "application/pdf",
	".zip": "application/zip",
	".gz": "application/gzip",
	".md": "text/markdown",
	".csv": "text/csv",
};

/**
 * Determines the MIME type for a file based on its extension.
 *
 * Extracts the file extension and looks up the corresponding MIME type using case-insensitive
 * matching. Returns 'application/octet-stream' for unknown extensions or invalid input.
 * Uses caching to improve performance for repeated lookups.
 *
 * @param {string} filename - The filename to analyze
 * @returns {string} The MIME type or 'application/octet-stream' if not found
 *
 * @example
 * // Basic usage
 * getMimeType('index.html');     // 'text/html'
 * getMimeType('styles.css');     // 'text/css'
 * getMimeType('script.js');      // 'text/javascript'
 * getMimeType('image.png');      // 'image/png'
 *
 * @example
 * // Case insensitive and multiple extensions
 * getMimeType('file.HTML');      // 'text/html'
 * getMimeType('file.name.txt');  // 'text/plain'
 * getMimeType('file.unknown');   // 'application/octet-stream'
 */

export function getMimeType(filename) {
	if (!filename || typeof filename !== "string") {
		return MIME_TYPES.APPLICATION_OCTET_STREAM;
	}

	// Check cache first for O(1) repeated lookups
	if (mimeTypeCache.has(filename)) {
		return mimeTypeCache.get(filename);
	}

	// Trim whitespace from the filename
	const trimmedFilename = filename.trim();

	// Handle edge cases where trimming results in empty string
	if (!trimmedFilename) {
		return MIME_TYPES.APPLICATION_OCTET_STREAM;
	}

	// Optimized extension extraction using lastIndexOf - O(1) operation
	const lastDotIndex = trimmedFilename.lastIndexOf(".");
	if (lastDotIndex === -1 || lastDotIndex === trimmedFilename.length - 1) {
		const result = MIME_TYPES.APPLICATION_OCTET_STREAM;
		cacheResult(filename, result);
		return result;
	}

	// Extract extension efficiently without array creation
	const extension = trimmedFilename.slice(lastDotIndex).toLowerCase();
	const result =
		/** @type {Record<string, string>} */ (mimeTypes)[extension] ||
		MIME_TYPES.APPLICATION_OCTET_STREAM;

	// Cache the result with LRU management
	cacheResult(filename, result);
	return result;
}

/**
 * Caches MIME type results with LRU eviction when cache limit is reached.
 *
 * @param {string} filename - The filename key
 * @param {string} mimeType - The MIME type result
 */
function cacheResult(filename, mimeType) {
	// Simple LRU: delete oldest when limit reached
	if (mimeTypeCache.size >= MATH_CONSTANTS.MIME_CACHE_LIMIT) {
		const firstKey = mimeTypeCache.keys().next().value;
		mimeTypeCache.delete(firstKey);
	}
	mimeTypeCache.set(filename, mimeType);
}
