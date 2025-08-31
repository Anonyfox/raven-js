/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file HTTP method constants, validation functions, and utilities for supported web and CLI methods.
 *
 * Provides constants for standard HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
 * plus CLI command support. Includes validation functions using both Set-based and bit flag approaches.
 */

import { HTTP_METHOD_FLAGS, isMethodAllowed } from "./bit-flags.js";

/**
 * @typedef {'GET'|'POST'|'PUT'|'DELETE'|'PATCH'|'HEAD'|'OPTIONS'|'COMMAND'} HttpMethod
 * Standard HTTP methods supported by Wings framework
 */

/**
 * HTTP method constants as key-value pairs for consistent string references.
 *
 * @type {Object<string, HttpMethod>}
 *
 * @example
 * // Using HTTP method constants
 * const method = HTTP_METHODS.GET; // 'GET'
 * const postMethod = HTTP_METHODS.POST; // 'POST'
 *
 * @example
 * // Setting request method
 * ctx.method = HTTP_METHODS.DELETE;
 */
export const HTTP_METHODS = {
	GET: "GET",
	POST: "POST",
	PUT: "PUT",
	DELETE: "DELETE",
	PATCH: "PATCH",
	HEAD: "HEAD",
	OPTIONS: "OPTIONS",
	COMMAND: "COMMAND",
};

/**
 * Array of all supported HTTP methods for iteration and validation.
 *
 * @type {HttpMethod[]}
 *
 * @example
 * // Iterate over all methods
 * HTTP_METHODS_LIST.forEach(method => console.log(method));
 *
 * @example
 * // Check array length
 * const count = HTTP_METHODS_LIST.length; // 8
 */
export const HTTP_METHODS_LIST = Object.values(HTTP_METHODS);

/**
 * Set of supported HTTP methods for validation lookups.
 *
 * @type {Set<HttpMethod>}
 */
const HTTP_METHODS_SET = new Set(HTTP_METHODS_LIST);

/**
 * Validates whether a value is a supported HTTP method with strict case-sensitive matching.
 *
 * @param {unknown} method - The value to validate
 * @returns {method is HttpMethod} `true` if the method is valid, `false` otherwise
 *
 * @example
 * // Valid methods
 * isValidHttpMethod('GET'); // true
 * isValidHttpMethod('POST'); // true
 *
 * @example
 * // Invalid inputs
 * isValidHttpMethod('get'); // false (case sensitive)
 * isValidHttpMethod('UNKNOWN'); // false
 * isValidHttpMethod(null); // false
 */
export function isValidHttpMethod(method) {
	return (
		typeof method === "string" &&
		HTTP_METHODS_SET.has(/** @type {HttpMethod} */ (method))
	);
}

/**
 * HTTP method validation using bit flag operations from the bit-flags module.
 *
 * @param {string} method - The HTTP method to validate
 * @returns {boolean} True if method is valid, false otherwise
 *
 * @example
 * // Valid method validation
 * isValidHttpMethodFast('GET'); // true
 * isValidHttpMethodFast('POST'); // true
 *
 * @example
 * // Invalid method validation
 * isValidHttpMethodFast('INVALID'); // false
 * isValidHttpMethodFast('get'); // false (case sensitive)
 */
export function isValidHttpMethodFast(method) {
	// Create wings-supported methods mask (excluding TRACE which isn't in HTTP_METHODS)
	const WINGS_SUPPORTED_METHODS =
		HTTP_METHOD_FLAGS.GET |
		HTTP_METHOD_FLAGS.POST |
		HTTP_METHOD_FLAGS.PUT |
		HTTP_METHOD_FLAGS.DELETE |
		HTTP_METHOD_FLAGS.PATCH |
		HTTP_METHOD_FLAGS.HEAD |
		HTTP_METHOD_FLAGS.OPTIONS |
		HTTP_METHOD_FLAGS.COMMAND;

	return (
		typeof method === "string" &&
		isMethodAllowed(method, WINGS_SUPPORTED_METHODS)
	);
}

/**
 * Returns a new array containing all supported HTTP methods.
 *
 * @returns {HttpMethod[]} A new array containing all supported HTTP methods
 *
 * @example
 * // Get all methods
 * const methods = getHttpMethods();
 * // ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'COMMAND']
 *
 * @example
 * // Safe to modify returned array
 * const customMethods = getHttpMethods();
 * customMethods.push('CUSTOM'); // Original list unchanged
 */
export function getHttpMethods() {
	return [...HTTP_METHODS_LIST];
}
