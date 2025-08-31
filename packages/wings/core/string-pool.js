/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Interned string constants and caching for MIME types, HTTP headers, status codes, and mathematical constants.
 *
 * Provides pre-allocated string constants used across Wings to reduce repeated allocations.
 * Includes dynamic string caching with LRU eviction for runtime-generated strings.
 */

/**
 * MIME type constants for Content-Type headers and response generation.
 *
 * @type {Object<string, string>}
 *
 * @example
 * // Common MIME types
 * const htmlType = MIME_TYPES.TEXT_HTML; // 'text/html'
 * const jsonType = MIME_TYPES.APPLICATION_JSON; // 'application/json'
 *
 * @example
 * // Setting response headers
 * ctx.responseHeaders.set('Content-Type', MIME_TYPES.TEXT_PLAIN);
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
 * HTTP header name constants for request/response header operations.
 *
 * @type {Object<string, string>}
 *
 * @example
 * // Common header names
 * const contentType = HEADER_NAMES.CONTENT_TYPE; // 'content-type'
 * const auth = HEADER_NAMES.AUTHORIZATION; // 'authorization'
 *
 * @example
 * // Using with headers
 * const value = ctx.requestHeaders.get(HEADER_NAMES.CONTENT_TYPE);
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
 * Standard error and status message constants for consistent responses.
 *
 * @type {Object<string, string>}
 *
 * @example
 * // Error messages
 * const notFoundMsg = MESSAGES.NOT_FOUND; // 'Not Found'
 * const serverErrorMsg = MESSAGES.INTERNAL_SERVER_ERROR;
 *
 * @example
 * // Using in error responses
 * ctx.text(MESSAGES.NOT_FOUND);
 */
export const MESSAGES = {
	NOT_FOUND: "Not Found",
	INTERNAL_SERVER_ERROR: "Internal Server Error",
	CONTEXT_REQUIRED: "Context must be a Context instance",
	HANDLER_REQUIRED: "Handler must be a function",
};

/**
 * HTTP status code constants providing semantic names for numeric codes.
 *
 * @type {Object<string, number>}
 *
 * @example
 * // Common status codes
 * const ok = STATUS_CODES.OK; // 200
 * const notFound = STATUS_CODES.NOT_FOUND; // 404
 *
 * @example
 * // Setting response status
 * ctx.responseStatusCode = STATUS_CODES.CREATED; // 201
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
 * Numerical constants for cache limits, path processing, and status code validation.
 *
 * @type {Object<string, number>}
 *
 * @example
 * // Cache limits
 * const maxMime = MATH_CONSTANTS.MIME_CACHE_LIMIT; // 200
 * const maxString = MATH_CONSTANTS.STRING_CACHE_LIMIT; // 500
 *
 * @example
 * // Path processing
 * if (segments.length > MATH_CONSTANTS.MAX_PATH_SEGMENTS) {
 *   throw new Error('Path too complex');
 * }
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
 * String internment cache for dynamically generated strings with LRU eviction.
 *
 * @type {Map<string, string>}
 */
const dynamicStringCache = new Map();

/**
 * Caches strings to return the same reference for identical values, reducing allocation overhead.
 *
 * Uses Map-based caching with LRU eviction when the cache reaches its size limit.
 * Useful for MIME types, header values, and error messages computed at runtime.
 *
 * @param {string} str - The string to intern
 * @returns {string} The interned string reference
 *
 * @example
 * // Dynamic content type caching
 * const contentType = internString(`application/json; charset=${encoding}`);
 * const sameRef = internString(`application/json; charset=${encoding}`);
 * console.log(contentType === sameRef); // true (same reference)
 *
 * @example
 * // MIME type computation
 * const mimeType = internString(`application/${computedType}`);
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
 * Clears the dynamic string cache, primarily for testing and shutdown scenarios.
 *
 * @example
 * // Test cleanup
 * clearStringCache();
 *
 * @example
 * // Graceful shutdown
 * process.on('SIGTERM', () => { clearStringCache(); process.exit(0); });
 */
export function clearStringCache() {
	dynamicStringCache.clear();
}
