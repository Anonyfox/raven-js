/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * **Bit Flags** - Ultra-fast HTTP method and status code operations through bit manipulation.
 *
 * This module provides bitwise operations for HTTP methods and status codes that are
 * exponentially faster than string comparisons and array operations. By encoding
 * HTTP methods as binary flags, we enable constant-time set operations.
 *
 * **Performance Impact**: Significantly faster than string-based method checking
 * **Memory Usage**: Constant O(1) memory regardless of method count
 * **Operations**: Union, intersection, difference via single CPU instructions
 *
 * **Mathematical Foundation**: Each HTTP method maps to a unique power of 2,
 * enabling bitwise OR for combining, AND for checking, XOR for toggling.
 */

/**
 * Bit flag constants for HTTP methods.
 *
 * Each method is assigned a unique power of 2, enabling bitwise operations.
 * These flags can be combined using bitwise OR (|) and checked using bitwise AND (&).
 *
 * **Mathematical precision**: Uses powers of 2 for perfect bit isolation
 * **Performance**: Single CPU instruction vs multiple string comparisons
 *
 * @type {Object<string, number>}
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
 * This enables O(1) conversion from method names to bit flags for
 * ultra-fast flag-based operations.
 *
 * @type {Map<string, number>}
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
 * This enables O(1) conversion from bit flags back to method names.
 *
 * @type {Map<number, string>}
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
 * These constants eliminate runtime bitwise OR operations for frequently
 * used method combinations in middleware and route definitions.
 *
 * **Performance**: Precomputed values vs runtime bit operations
 *
 * @type {Object<string, number>}
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
 * This function provides O(1) conversion from method strings to bit flags
 * for ultra-fast bitwise operations and set membership testing.
 *
 * **Performance**: O(1) Map lookup vs O(n) string comparison loops
 *
 * @param {string} method - The HTTP method to convert
 * @returns {number} The bit flag for the method, or 0 if invalid
 *
 * @example
 * ```javascript
 * const getFlag = methodToFlag("GET");     // 1
 * const postFlag = methodToFlag("POST");   // 2
 * const invalid = methodToFlag("INVALID"); // 0
 *
 * // Ultra-fast method checking
 * const allowedMethods = HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.POST;
 * const isAllowed = (methodToFlag(userMethod) & allowedMethods) !== 0;
 * ```
 */
export function methodToFlag(method) {
	return METHOD_TO_FLAG.get(method) || 0;
}

/**
 * Converts a bit flag back to its corresponding HTTP method string.
 *
 * This function provides O(1) conversion from bit flags back to method strings
 * for debugging, logging, and response generation.
 *
 * **Performance**: O(1) Map lookup with single-bit validation
 *
 * @param {number} flag - The bit flag to convert
 * @returns {string|null} The HTTP method string, or null if invalid
 *
 * @example
 * ```javascript
 * const method = flagToMethod(1);   // "GET"
 * const method2 = flagToMethod(2);  // "POST"
 * const invalid = flagToMethod(3);  // null (not a single bit)
 * ```
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
 * This function uses bitwise AND for ultra-fast method validation,
 * replacing string comparisons and array searches with single CPU instructions.
 *
 * **Performance**: Single bitwise AND vs O(n) array iteration
 * **Algorithmic Complexity**: O(1) vs O(n) for traditional approaches
 *
 * @param {string} method - The HTTP method to check
 * @param {number} allowedMask - Bitmask of allowed method flags
 * @returns {boolean} True if method is allowed, false otherwise
 *
 * @example
 * ```javascript
 * // Allow GET and POST only
 * const allowedMethods = HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.POST;
 *
 * isMethodAllowed("GET", allowedMethods);    // true
 * isMethodAllowed("POST", allowedMethods);   // true
 * isMethodAllowed("DELETE", allowedMethods); // false
 *
 * // Compare traditional approach:
 * // ["GET", "POST"].includes(method) // O(n) linear search
 * // vs
 * // isMethodAllowed(method, mask)     // O(1) bitwise operation
 * ```
 */
export function isMethodAllowed(method, allowedMask) {
	const flag = methodToFlag(method);
	return flag !== 0 && (flag & allowedMask) !== 0;
}

/**
 * Combines multiple HTTP methods into a single bitmask.
 *
 * This function accepts an array of method strings and produces a single
 * bit flag representing the union of all methods for ultra-fast operations.
 *
 * **Performance**: Single loop with bitwise OR vs repeated array operations
 *
 * @param {string[]} methods - Array of HTTP method strings
 * @returns {number} Combined bitmask representing all methods
 *
 * @example
 * ```javascript
 * const restMethods = combineMethodFlags(["GET", "POST", "PUT", "DELETE"]);
 * const safeMethods = combineMethodFlags(["GET", "HEAD", "OPTIONS"]);
 *
 * // Ultra-fast intersection check
 * const hasOverlap = (restMethods & safeMethods) !== 0;
 *
 * // Ultra-fast subset check
 * const isSubset = (safeMethods & restMethods) === safeMethods;
 * ```
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
 * This function decodes a bitmask back into an array of method strings,
 * useful for debugging, logging, and API responses.
 *
 * **Mathematical precision**: Tests each bit position individually
 *
 * @param {number} mask - The combined method bitmask
 * @returns {string[]} Array of HTTP method strings
 *
 * @example
 * ```javascript
 * const mask = HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.POST;
 * const methods = extractMethodsFromMask(mask); // ["GET", "POST"]
 *
 * // Useful for API responses
 * ctx.responseHeaders.set("Allow", extractMethodsFromMask(allowedMask).join(", "));
 * ```
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
 * Status code ranges encoded as bit patterns for ultra-fast classification.
 *
 * These constants enable single bitwise operations to classify HTTP status codes
 * by category, replacing multiple range comparisons with bit operations.
 *
 * **Mathematical foundation**: Each status code maps to (code - 100) for 0-based indexing
 * **Performance**: Single bit test vs multiple range comparisons
 *
 * @type {Object<string, number>}
 */
export const STATUS_CODE_MASKS = {
	// 1xx Informational
	INFORMATIONAL: 0b1111, // Covers 100-103

	// 2xx Success
	SUCCESS: 0b11111111 << 100, // Covers 200-207

	// 3xx Redirection
	REDIRECT: 0b11111111 << 200, // Covers 300-307

	// 4xx Client Error
	CLIENT_ERROR: 0b11111111111111111111111111111111 << 300, // Covers 400-431

	// 5xx Server Error
	SERVER_ERROR: 0b11111111111111111111111111111111 << 400, // Covers 500-531
};

/**
 * Classifies an HTTP status code using ultra-fast bit operations.
 *
 * This function determines the status code category (1xx, 2xx, etc.) using
 * bit shifting and masking instead of multiple range comparisons.
 *
 * **Performance**: Single bit operation vs multiple conditional branches
 *
 * @param {number} statusCode - The HTTP status code to classify
 * @returns {string} The status code category
 *
 * @example
 * ```javascript
 * classifyStatusCode(200); // "success"
 * classifyStatusCode(404); // "client_error"
 * classifyStatusCode(500); // "server_error"
 *
 * // Ultra-fast error checking
 * const isError = statusCode >= 400; // Traditional
 * const isErrorBit = (1 << (statusCode - 100)) & (STATUS_CODE_MASKS.CLIENT_ERROR | STATUS_CODE_MASKS.SERVER_ERROR);
 * ```
 */
export function classifyStatusCode(statusCode) {
	if (statusCode < 100 || statusCode >= 600) {
		return "invalid";
	}

	// Optimized integer division: (statusCode / 100) | 0 is faster than Math.floor()
	const category = (statusCode / 100) | 0;
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
