/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com} **MIME Utils** - File extension to MIME type mapping utilities. This module provides utilities for determining the appropriate MIME type based on file extensions. It includes a comprehensive mapping of common file extensions to their corresponding MIME types, with proper fallback handling for unknown extensions. ## Supported File Types ### Web Files - HTML, JavaScript, CSS, JSON, XML ### Images - PNG, JPEG, GIF, SVG, ICO, WebP, AVIF ### Media - Audio: WAV, MP3 - Video: MP4, WebM ### Fonts - WOFF, TTF, EOT, OTF ### Documents - PDF, TXT, Markdown, CSV ### Archives - ZIP, GZ ### Other - WebAssembly (WASM) ## Design Philosophy This module prioritizes simplicity and reliability over completeness. It covers the most common file types used in web applications while providing a sensible default for unknown extensions. **Note**: The mapping is case-insensitive and handles edge cases like files with multiple dots, leading dots, and various special characters.
 */

import { MATH_CONSTANTS, MIME_TYPES } from "./string-pool.js";

/**
 * Cache for extension extraction results to avoid repeated string operations.
 *
 * This Map caches the result of extension extraction and MIME type lookup
 * to eliminate repeated string manipulation for commonly requested filenames.
 *
 * **Performance**: O(1) lookup vs O(n) string operations for repeated filenames.
 * **Memory**: LRU cache with 200 entry limit to prevent memory leaks.
 *
 * @type {Map<string, string>}
 */
const mimeTypeCache = new Map();

/**
 * Internal mapping of file extensions to MIME types.
 * This object contains the complete mapping of supported file extensions
 * to their corresponding MIME types. Extensions are stored with leading
 * dots (e.g., '.html') for efficient lookup.
 * **Coverage**: Includes the most commonly used file types in web applications,
 * covering web files, images, media, fonts, documents, and archives.
 */
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
 * This function extracts the file extension from the filename and looks up
 * the corresponding MIME type. It handles various edge cases and provides
 * a sensible default for unknown extensions.
 *
 * **Processing Steps**:
 * 1. Validates input (must be a non-empty string)
 * 2. Trims whitespace from the filename
 * 3. Extracts the last extension (handles multiple dots)
 * 4. Converts extension to lowercase for case-insensitive matching
 * 5. Returns the corresponding MIME type or default
 *
 * **Edge Case Handling**:
 * - Empty or null/undefined input → `application/octet-stream`
 * - Files without extensions → `application/octet-stream`
 * - Files with only dots → `application/octet-stream`
 * - Files with multiple dots → uses last extension
 * - Case-insensitive matching
 * - Unicode characters in filenames
 *
 * @param {string} filename - The filename to analyze
 * @returns {string} The MIME type for the file extension, or "application/octet-stream" if not found
 *
 * @example
 * ```javascript
 * // Common file types
 * getMimeType('index.html');           // 'text/html'
 * getMimeType('styles.css');           // 'text/css'
 * getMimeType('script.js');            // 'text/javascript'
 * getMimeType('data.json');            // 'application/json'
 * getMimeType('image.png');            // 'image/png'
 * getMimeType('photo.jpg');            // 'image/jpeg'
 * getMimeType('document.pdf');         // 'application/pdf'
 *
 * // Case insensitive
 * getMimeType('file.HTML');            // 'text/html'
 * getMimeType('file.Html');            // 'text/html'
 * getMimeType('file.html');            // 'text/html'
 *
 * // Files with multiple dots
 * getMimeType('file.name.txt');        // 'text/plain'
 * getMimeType('archive.backup.zip');   // 'application/zip'
 * getMimeType('image.compressed.jpg'); // 'image/jpeg'
 *
 * // Files with leading dots (hidden files)
 * getMimeType('.htaccess');            // 'application/octet-stream'
 * getMimeType('.env');                 // 'application/octet-stream'
 *
 * // Files with only dots
 * getMimeType('.');                    // 'application/octet-stream'
 * getMimeType('..');                   // 'application/octet-stream'
 * getMimeType('...');                  // 'application/octet-stream'
 *
 * // Files without extensions
 * getMimeType('filename');             // 'application/octet-stream'
 * getMimeType('file.');                // 'application/octet-stream'
 *
 * // Unknown extensions
 * getMimeType('file.unknown');         // 'application/octet-stream'
 * getMimeType('file.xyz');             // 'application/octet-stream'
 * getMimeType('file.123');             // 'application/octet-stream'
 *
 * // Unicode filenames
 * getMimeType('café.txt');             // 'text/plain'
 * getMimeType('résumé.pdf');           // 'application/pdf'
 * getMimeType('文件.txt');              // 'text/plain'
 *
 * // Edge cases
 * getMimeType('');                     // 'application/octet-stream'
 * getMimeType(null);                   // 'application/octet-stream'
 * getMimeType(undefined);              // 'application/octet-stream'
 * getMimeType(123);                    // 'application/octet-stream'
 * getMimeType('   ');                  // 'application/octet-stream'
 * getMimeType('file.txt ');            // 'text/plain'
 * getMimeType(' file.txt');            // 'text/plain'
 *
 * // Use in HTTP responses
 * function serveFile(filename) {
 *   const mimeType = getMimeType(filename);
 *   return {
 *     contentType: mimeType,
 *     body: readFile(filename)
 *   };
 * }
 *
 * // Use in content negotiation
 * function getPreferredMimeType(filename, acceptHeader) {
 *   const mimeType = getMimeType(filename);
 *   if (acceptHeader.includes(mimeType)) {
 *     return mimeType;
 *   }
 *   return 'application/octet-stream';
 * }
 * ```
 */

/**
 * @param {string} filename - The filename to analyze
 * @returns {string} The MIME type for the file extension, or "application/octet-stream" if not found
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
 * Caches MIME type result with LRU eviction to prevent memory leaks.
 *
 * This function implements a simple LRU cache by removing the oldest
 * entry when the cache size limit is reached.
 *
 * **Performance**: O(1) cache management with bounded memory usage.
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
