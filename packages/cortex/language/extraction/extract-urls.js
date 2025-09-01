/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file URL extraction from text using regex pattern matching.
 *
 * Identifies and extracts HTTP/HTTPS URLs from text content with support for
 * complex URLs including ports, paths, query parameters, and fragments.
 * Uses optimized regex patterns for performance.
 */

// Pre-compiled regex pattern for performance
const URL_PATTERN =
	/https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.-])*)?(?:\?(?:[\w&=%.-])*)?(?:#(?:[\w.-])*)?(?=\s|$|[^\w.-])/gi;

/**
 * Extracts HTTP/HTTPS URLs from text.
 *
 * Identifies URLs using regex pattern matching, supporting various URL formats
 * including those with ports, paths, query strings, and fragments. Does not
 * validate URL accessibility, only pattern matching.
 *
 * @param {string} text - The text to extract URLs from
 * @param {boolean} usePlaceholders - Return text with <URL> placeholders instead of extracted URLs
 * @returns {string[]|string} Array of extracted URLs or text with placeholders
 *
 * @example
 * // Basic URL extraction
 * extractUrls('Visit https://example.com for more info'); // ['https://example.com']
 *
 * @example
 * // Complex URLs with parameters
 * extractUrls('API: https://api.example.com:8080/v1/users?page=1&limit=10#results');
 * // ['https://api.example.com:8080/v1/users?page=1&limit=10#results']
 *
 * @example
 * // Placeholder replacement
 * extractUrls('Check https://example.com and https://test.org', true);
 * // 'Check <URL> and <URL>'
 */
export function extractUrls(text, usePlaceholders = false) {
	if (usePlaceholders) {
		return text.replace(URL_PATTERN, "<URL>");
	}

	return text.match(URL_PATTERN) || [];
}
