/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * **String Pool** - Interned string constants for GC pressure reduction.
 *
 * This module provides pre-allocated string constants that are frequently used
 * across the Wings framework. By interning these strings, we eliminate repeated
 * string allocations and reduce garbage collection pressure.
 *
 * **Performance Impact**: Eliminates repeated string allocations for hot paths
 * containing repeated MIME types, header names, and content types.
 *
 * **Memory Strategy**: All strings are allocated once at module load time and
 * reused throughout the application lifecycle.
 */

/**
 * Frequently used MIME type strings to eliminate repeated allocations.
 *
 * These constants are used extensively in Context response methods and
 * MIME type detection. String internment reduces GC pressure in hot paths.
 *
 * @type {Object<string, string>}
 */
export const MIME_TYPES = {
	// Web content types (highest frequency)
	TEXT_PLAIN: "text/plain",
	TEXT_HTML: "text/html",
	APPLICATION_JSON: "application/json",
	APPLICATION_JAVASCRIPT: "application/javascript",
	APPLICATION_XML: "application/xml",

	// Default fallback (extremely high frequency)
	APPLICATION_OCTET_STREAM: "application/octet-stream",

	// Form data types
	APPLICATION_FORM_URLENCODED: "application/x-www-form-urlencoded",

	// Additional content types
	TEXT_CSS: "text/css",
	TEXT_JAVASCRIPT: "text/javascript",
};

/**
 * Frequently used HTTP header names to eliminate repeated allocations.
 *
 * These constants are used in Context request/response header operations.
 * String internment provides consistent header key references.
 *
 * @type {Object<string, string>}
 */
export const HEADER_NAMES = {
	CONTENT_TYPE: "content-type",
	CONTENT_LENGTH: "Content-Length",
	AUTHORIZATION: "authorization",
	LOCATION: "Location",
	ACCESS_CONTROL_ALLOW_ORIGIN: "access-control-allow-origin",
	ACCESS_CONTROL_ALLOW_METHODS: "access-control-allow-methods",
	ACCESS_CONTROL_ALLOW_HEADERS: "access-control-allow-headers",
	ACCESS_CONTROL_MAX_AGE: "access-control-max-age",
	CACHE_CONTROL: "cache-control",
	RETRY_AFTER: "retry-after",
};

/**
 * Frequently used error and status messages to eliminate repeated allocations.
 *
 * These constants are used in Context error response methods and
 * provide consistent messaging across the framework.
 *
 * @type {Object<string, string>}
 */
export const MESSAGES = {
	NOT_FOUND: "Not Found",
	INTERNAL_SERVER_ERROR: "Internal Server Error",
	CONTEXT_REQUIRED: "Context must be a Context instance",
	HANDLER_REQUIRED: "Handler must be a function",
};

/**
 * Frequently used HTTP status codes to eliminate magic numbers.
 *
 * These constants provide semantic meaning to status codes and eliminate
 * repeated numeric literals throughout the codebase.
 *
 * **Performance**: Eliminates repeated status code lookups and improves readability.
 * **Maintenance**: Centralized status code definitions for consistency.
 *
 * @type {Object<string, number>}
 */
export const STATUS_CODES = {
	// Success codes
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,

	// Redirection codes
	MOVED_PERMANENTLY: 301,
	FOUND: 302,

	// Client error codes
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_ALLOWED: 405,
	UNPROCESSABLE_ENTITY: 422,

	// Server error codes
	INTERNAL_SERVER_ERROR: 500,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
};

/**
 * Mathematical constants for performance optimizations.
 *
 * These constants eliminate repeated calculations and magic numbers
 * throughout the framework for better performance and readability.
 *
 * **Performance**: Precomputed values vs runtime calculations.
 *
 * @type {Object<string, number>}
 */
export const MATH_CONSTANTS = {
	// Cache size limits
	MIME_CACHE_LIMIT: 200,
	STRING_CACHE_LIMIT: 500,
	PATH_CACHE_LIMIT: 100,

	// Path processing limits
	MAX_PATH_SEGMENTS: 100,

	// Status code ranges for fast classification
	STATUS_CODE_MIN_VALID: 100,
	STATUS_CODE_MAX_VALID: 599,
	STATUS_CODE_DIVISOR: 100, // For Math.floor(statusCode / 100)
};

/**
 * Performance-optimized string internment cache for dynamic strings.
 *
 * This Map provides O(1) lookup for dynamically generated strings that
 * may be repeated during request processing (e.g., computed MIME types,
 * dynamic header values).
 *
 * **Memory Management**: Limited to 500 entries with LRU eviction to prevent
 * memory leaks during long-running applications.
 *
 * @type {Map<string, string>}
 */
const dynamicStringCache = new Map();

/**
 * Interns a string to reduce allocation overhead for repeated usage.
 *
 * This function implements string internment by caching frequently used
 * strings and returning the same reference for identical string values.
 *
 * **Use Cases**:
 * - MIME type strings computed at runtime
 * - Dynamic header values used multiple times
 * - Computed error messages with variable content
 *
 * **Performance**: O(1) lookup with bounded memory usage via LRU eviction.
 *
 * @param {string} str - The string to intern
 * @returns {string} The interned string reference
 *
 * @example
 * ```javascript
 * // Intern dynamic content type
 * const contentType = internString(`application/json; charset=${encoding}`);
 *
 * // Intern computed file extension
 * const mimeType = internString(`application/${computedType}`);
 *
 * // Subsequent calls return the same reference
 * const sameRef = internString(`application/json; charset=${encoding}`);
 * console.log(contentType === sameRef); // true (same reference)
 * ```
 */
export function internString(str) {
	// Return cached reference if already interned
	if (dynamicStringCache.has(str)) {
		return dynamicStringCache.get(str);
	}

	// Simple LRU: delete oldest when limit reached
	if (dynamicStringCache.size >= MATH_CONSTANTS.STRING_CACHE_LIMIT) {
		const firstKey = dynamicStringCache.keys().next().value;
		dynamicStringCache.delete(firstKey);
	}

	// Cache and return the string
	dynamicStringCache.set(str, str);
	return str;
}

/**
 * Clears the dynamic string cache to free memory.
 *
 * This function should typically only be used in testing scenarios
 * or during application shutdown to ensure clean memory state.
 *
 * **Warning**: Clearing the cache will eliminate the performance benefits
 * of string internment until the cache is rebuilt through usage.
 *
 * @example
 * ```javascript
 * // Clear cache during test cleanup
 * clearStringCache();
 *
 * // Or clear during graceful shutdown
 * process.on('SIGTERM', () => {
 *   clearStringCache();
 *   process.exit(0);
 * });
 * ```
 */
export function clearStringCache() {
	dynamicStringCache.clear();
}
