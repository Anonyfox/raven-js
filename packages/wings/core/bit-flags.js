/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Bitwise operations for HTTP methods and status codes with Map-based lookups and precomputed combinations.
 *
 * Provides bit flag constants, conversion functions, and method validation using bitwise operations
 * instead of string comparisons. Includes precomputed method combinations for common use cases.
 */

/**
 * Bit flag constants for HTTP methods.
 *
 * Each method is assigned a unique power of 2, enabling bitwise operations.
 * These flags can be combined using bitwise OR (|) and checked using bitwise AND (&).
 *
 * @type {Object<string, number>}
 *
 * @example
 * // Individual flags
 * const getFlag = HTTP_METHOD_FLAGS.GET; // 1
 * const postFlag = HTTP_METHOD_FLAGS.POST; // 2
 *
 * @example
 * // Combining flags
 * const readMethods = HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.HEAD; // 33
 */
export const HTTP_METHOD_FLAGS = {
	GET: 1, // 2^0 = 0b00000001
	POST: 2, // 2^1 = 0b00000010
	PUT: 4, // 2^2 = 0b00000100
	DELETE: 8, // 2^3 = 0b00001000
	PATCH: 16, // 2^4 = 0b00010000
	HEAD: 32, // 2^5 = 0b00100000
	OPTIONS: 64, // 2^6 = 0b01000000
	TRACE: 128, // 2^7 = 0b10000000
	COMMAND: 256, // 2^8 = CLI method flag
};

/**
 * Reverse mapping from HTTP method strings to bit flags.
 *
 * @type {Map<string, number>}
 *
 * @example
 * // Get flag for method
 * const getFlag = METHOD_TO_FLAG.get('GET'); // 1
 * const postFlag = METHOD_TO_FLAG.get('POST'); // 2
 *
 * @example
 * // Check if method exists
 * const hasMethod = METHOD_TO_FLAG.has('PUT'); // true
 */
export const METHOD_TO_FLAG = new Map([
	["GET", HTTP_METHOD_FLAGS.GET],
	["POST", HTTP_METHOD_FLAGS.POST],
	["PUT", HTTP_METHOD_FLAGS.PUT],
	["DELETE", HTTP_METHOD_FLAGS.DELETE],
	["PATCH", HTTP_METHOD_FLAGS.PATCH],
	["HEAD", HTTP_METHOD_FLAGS.HEAD],
	["OPTIONS", HTTP_METHOD_FLAGS.OPTIONS],
	["TRACE", HTTP_METHOD_FLAGS.TRACE],
	["COMMAND", HTTP_METHOD_FLAGS.COMMAND],
]);

/**
 * Reverse mapping from bit flags to HTTP method strings.
 *
 * @type {Map<number, string>}
 *
 * @example
 * // Get method for flag
 * const getMethod = FLAG_TO_METHOD.get(1); // 'GET'
 * const postMethod = FLAG_TO_METHOD.get(2); // 'POST'
 *
 * @example
 * // Check if flag exists
 * const hasFlag = FLAG_TO_METHOD.has(4); // true (PUT)
 */
export const FLAG_TO_METHOD = new Map([
	[HTTP_METHOD_FLAGS.GET, "GET"],
	[HTTP_METHOD_FLAGS.POST, "POST"],
	[HTTP_METHOD_FLAGS.PUT, "PUT"],
	[HTTP_METHOD_FLAGS.DELETE, "DELETE"],
	[HTTP_METHOD_FLAGS.PATCH, "PATCH"],
	[HTTP_METHOD_FLAGS.HEAD, "HEAD"],
	[HTTP_METHOD_FLAGS.OPTIONS, "OPTIONS"],
	[HTTP_METHOD_FLAGS.TRACE, "TRACE"],
	[HTTP_METHOD_FLAGS.COMMAND, "COMMAND"],
]);

/**
 * Common HTTP method combinations as precomputed bit flags.
 *
 * @type {Object<string, number>}
 *
 * @example
 * // Safe methods check
 * const isSafe = (methodFlag & METHOD_COMBINATIONS.SAFE_METHODS) !== 0;
 *
 * @example
 * // Read methods validation
 * const allowsRead = (methodFlag & METHOD_COMBINATIONS.READ_METHODS) !== 0;
 */
export const METHOD_COMBINATIONS = {
	// Safe methods (idempotent, cacheable)
	SAFE_METHODS:
		HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.HEAD | HTTP_METHOD_FLAGS.OPTIONS,

	// Mutation methods (change server state)
	MUTATION_METHODS:
		HTTP_METHOD_FLAGS.POST |
		HTTP_METHOD_FLAGS.PUT |
		HTTP_METHOD_FLAGS.DELETE |
		HTTP_METHOD_FLAGS.PATCH,

	// RESTful CRUD operations
	CRUD_METHODS:
		HTTP_METHOD_FLAGS.GET |
		HTTP_METHOD_FLAGS.POST |
		HTTP_METHOD_FLAGS.PUT |
		HTTP_METHOD_FLAGS.DELETE,

	// All standard HTTP methods
	ALL_HTTP_METHODS:
		HTTP_METHOD_FLAGS.GET |
		HTTP_METHOD_FLAGS.POST |
		HTTP_METHOD_FLAGS.PUT |
		HTTP_METHOD_FLAGS.DELETE |
		HTTP_METHOD_FLAGS.PATCH |
		HTTP_METHOD_FLAGS.HEAD |
		HTTP_METHOD_FLAGS.OPTIONS |
		HTTP_METHOD_FLAGS.TRACE,

	// All methods including CLI
	ALL_METHODS:
		HTTP_METHOD_FLAGS.GET |
		HTTP_METHOD_FLAGS.POST |
		HTTP_METHOD_FLAGS.PUT |
		HTTP_METHOD_FLAGS.DELETE |
		HTTP_METHOD_FLAGS.PATCH |
		HTTP_METHOD_FLAGS.HEAD |
		HTTP_METHOD_FLAGS.OPTIONS |
		HTTP_METHOD_FLAGS.TRACE |
		HTTP_METHOD_FLAGS.COMMAND,
};

/**
 * Converts an HTTP method string to its corresponding bit flag.
 *
 * Converts HTTP method strings to bit flags using Map lookup for bitwise operations.
 *
 * @param {string} method - The HTTP method to convert
 * @returns {number} The bit flag for the method, or 0 if invalid
 *
 * @example
 * // Basic usage
 * const getFlag = methodToFlag("GET");     // 1
 * const postFlag = methodToFlag("POST");   // 2
 * const invalid = methodToFlag("INVALID"); // 0
 *
 * @example
 * // Method validation with bitmasks
 * const allowedMethods = HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.POST;
 * const isAllowed = (methodToFlag(userMethod) & allowedMethods) !== 0;
 */
export function methodToFlag(method) {
	return METHOD_TO_FLAG.get(method) || 0;
}

/**
 * Converts a bit flag back to its corresponding HTTP method string.
 *
 * Converts bit flags back to HTTP method strings with single-bit validation.
 *
 * @param {number} flag - The bit flag to convert
 * @returns {string|null} The HTTP method string, or null if invalid
 *
 * @example
 * // Basic usage
 * const method = flagToMethod(1);   // "GET"
 * const method2 = flagToMethod(2);  // "POST"
 * const invalid = flagToMethod(3);  // null (not a single bit)
 */
export function flagToMethod(flag) {
	// Ensure flag represents exactly one bit (power of 2)
	if (flag <= 0 || (flag & (flag - 1)) !== 0) {
		return null;
	}
	return FLAG_TO_METHOD.get(flag) || null;
}

/**
 * Checks if a method is allowed against a bitmask of permitted methods.
 *
 * Validates HTTP methods against a bitmask using bitwise AND operations.
 *
 * @param {string} method - The HTTP method to check
 * @param {number} allowedMask - Bitmask of allowed method flags
 * @returns {boolean} True if method is allowed, false otherwise
 *
 * @example
 * // Basic validation
 * const allowedMethods = HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.POST;
 * isMethodAllowed("GET", allowedMethods);    // true
 * isMethodAllowed("POST", allowedMethods);   // true
 * isMethodAllowed("DELETE", allowedMethods); // false
 */
export function isMethodAllowed(method, allowedMask) {
	const flag = methodToFlag(method);
	return flag !== 0 && (flag & allowedMask) !== 0;
}

/**
 * Combines multiple HTTP methods into a single bitmask.
 *
 * Combines multiple HTTP method strings into a single bitmask using bitwise OR operations.
 *
 * @param {string[]} methods - Array of HTTP method strings
 * @returns {number} Combined bitmask representing all methods
 *
 * @example
 * // Creating method combinations
 * const restMethods = combineMethodFlags(["GET", "POST", "PUT", "DELETE"]);
 * const safeMethods = combineMethodFlags(["GET", "HEAD", "OPTIONS"]);
 *
 * @example
 * // Set operations on bitmasks
 * const hasOverlap = (restMethods & safeMethods) !== 0;
 * const isSubset = (safeMethods & restMethods) === safeMethods;
 */
export function combineMethodFlags(methods) {
	let combined = 0;
	for (const method of methods) {
		combined |= methodToFlag(method);
	}
	return combined;
}

/**
 * Extracts individual method strings from a combined bitmask.
 *
 * Decodes a bitmask into an array of HTTP method strings by testing each bit position.
 *
 * @param {number} mask - The combined method bitmask
 * @returns {string[]} Array of HTTP method strings
 *
 * @example
 * // Basic extraction
 * const mask = HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.POST;
 * const methods = extractMethodsFromMask(mask); // ["GET", "POST"]
 *
 * @example
 * // API response headers
 * ctx.responseHeaders.set("Allow", extractMethodsFromMask(allowedMask).join(", "));
 */
export function extractMethodsFromMask(mask) {
	const methods = [];
	for (const [flag, method] of FLAG_TO_METHOD) {
		if ((mask & flag) !== 0) {
			methods.push(method);
		}
	}
	return methods;
}

/**
 * Status code category constants for classification.
 *
 * @type {Object<string, number>}
 *
 * @example
 * // Category constants
 * const success = STATUS_CATEGORIES.SUCCESS; // 2
 * const error = STATUS_CATEGORIES.CLIENT_ERROR; // 4
 *
 * @example
 * // Switch statements
 * switch (category) {
 *   case STATUS_CATEGORIES.SUCCESS: return 'ok';
 *   case STATUS_CATEGORIES.CLIENT_ERROR: return 'bad request';
 * }
 */
export const STATUS_CATEGORIES = {
	INFORMATIONAL: 1, // 1xx
	SUCCESS: 2, // 2xx
	REDIRECT: 3, // 3xx
	CLIENT_ERROR: 4, // 4xx
	SERVER_ERROR: 5, // 5xx
	INVALID: 0, // Invalid codes
};

/**
 * Classifies HTTP status codes into standard categories (1xx, 2xx, etc.).
 *
 * Uses integer division to determine category from the status code's hundreds digit.
 * Returns string category names matching HTTP specification.
 *
 * @param {number} statusCode - The HTTP status code to classify
 * @returns {string} The status code category name
 *
 * @example
 * // Basic classification
 * classifyStatusCode(200); // "success"
 * classifyStatusCode(404); // "client_error"
 * classifyStatusCode(500); // "server_error"
 *
 * @example
 * // Error detection
 * const isError = classifyStatusCode(code).endsWith('_error');
 */
export function classifyStatusCode(statusCode) {
	if (statusCode < 100 || statusCode >= 600) {
		return "invalid";
	}

	const category = Math.floor(statusCode / 100);
	switch (category) {
		case 1:
			return "informational";
		case 2:
			return "success";
		case 3:
			return "redirect";
		case 4:
			return "client_error";
		case 5:
			return "server_error";
		default:
			return "invalid";
	}
}
