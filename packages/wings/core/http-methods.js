/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com} **HTTP Methods** - Standard HTTP method constants and validation utilities. This module provides a centralized source of truth for all supported HTTP methods in the Wings framework. It includes constants, type definitions, validation functions, and utility methods for working with HTTP methods. ## Supported Methods - **GET**: Retrieve a resource - **POST**: Create a new resource - **PUT**: Replace an entire resource - **DELETE**: Remove a resource - **PATCH**: Partially update a resource - **HEAD**: Get headers only (no body) - **OPTIONS**: Get allowed methods for a resource ## Design Philosophy This module follows the principle of "explicit over implicit" by providing a finite set of well-defined HTTP methods rather than accepting any string. This prevents typos, ensures consistency, and makes the codebase more maintainable. **Note**: Only the most commonly used HTTP methods are included. Less common methods like TRACE, CONNECT, COPY, etc. are not supported to keep the API focused and prevent misuse.
 */

/**
 * @packageDocumentation
 *
 * Type definition for valid HTTP methods and CLI commands.
 * This typedef ensures type safety when working with HTTP methods and CLI commands
 * throughout the codebase. It restricts the allowed values to only the supported methods.
 */

/**
 * @typedef {'GET'|'POST'|'PUT'|'DELETE'|'PATCH'|'HEAD'|'OPTIONS'|'COMMAND'} HttpMethod
 * Standard HTTP methods supported by Wings framework
 */

/**
 * Object containing all supported HTTP methods as key-value pairs.
 *
 * Each property name is the HTTP method name, and each value is the same
 * string. This provides both a constant reference and a way to iterate
 * over all supported methods.
 *
 * **Usage**: Use these constants instead of string literals to prevent
 * typos and ensure consistency across your codebase.
 *
 * @type {Object<string, HttpMethod>}
 *
 * @example
 * ```javascript
 * // ✅ Good - use constants
 * if (method === HTTP_METHODS.GET) {
 *   // Handle GET request
 * }
 *
 * // ❌ Bad - string literals can have typos
 * if (method === 'GET') {
 *   // Handle GET request
 * }
 *
 * // Iterate over all methods
 * for (const [name, value] of Object.entries(HTTP_METHODS)) {
 *   console.log(`${name}: ${value}`);
 * }
 * ```
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
 * Array containing all supported HTTP methods.
 *
 * This is a convenience array derived from the HTTP_METHODS object values.
 * It provides easy access to all supported methods as an array for iteration,
 * validation, and other array-based operations.
 *
 * **Note**: This array is created once at module load time and should not
 * be modified. Use `getHttpMethods()` if you need a mutable copy.
 *
 * @type {HttpMethod[]}
 *
 * @example
 * ```javascript
 * // Check if method is supported
 * if (HTTP_METHODS_LIST.includes(method)) {
 *   // Method is valid
 * }
 *
 * // Iterate over all methods
 * HTTP_METHODS_LIST.forEach(method => {
 *   console.log(`Supported method: ${method}`);
 * });
 *
 * // Use in validation
 * const isValid = HTTP_METHODS_LIST.includes(userInput);
 * ```
 */
export const HTTP_METHODS_LIST = Object.values(HTTP_METHODS);

/**
 * Validates whether a value is a supported HTTP method.
 *
 * This function performs strict validation to ensure the input is exactly
 * one of the supported HTTP methods. It's case-sensitive and requires
 * exact string matches.
 *
 * **Validation Rules**:
 * - Input must be a string
 * - Input must exactly match one of the supported methods
 * - Case-sensitive comparison (GET is valid, get is not)
 * - No whitespace or special characters allowed
 *
 * **Type Guard**: This function acts as a TypeScript type guard, narrowing
 * the type from `unknown` to `HttpMethod` when it returns `true`.
 *
 * @param {unknown} method - The value to validate
 * @returns {method is HttpMethod} `true` if the method is valid, `false` otherwise
 *
 * @example
 * ```javascript
 * // Valid methods
 * isValidHttpMethod('GET');     // true
 * isValidHttpMethod('POST');    // true
 * isValidHttpMethod('PUT');     // true
 * isValidHttpMethod('DELETE');  // true
 * isValidHttpMethod('PATCH');   // true
 * isValidHttpMethod('HEAD');    // true
 * isValidHttpMethod('OPTIONS'); // true
 *
 * // Invalid methods
 * isValidHttpMethod('get');     // false (case sensitive)
 * isValidHttpMethod('GETS');    // false (typo)
 * isValidHttpMethod('');        // false (empty string)
 * isValidHttpMethod(null);      // false (not a string)
 * isValidHttpMethod(123);       // false (not a string)
 * isValidHttpMethod('TRACE');   // false (not supported)
 *
 * // Usage in validation
 * function handleRequest(method) {
 *   if (!isValidHttpMethod(method)) {
 *     throw new Error(`Invalid HTTP method: ${method}`);
 *   }
 *   // method is now typed as HttpMethod
 *   console.log(`Processing ${method} request`);
 * }
 *
 * // Type guard usage
 * function processMethod(input) {
 *   if (isValidHttpMethod(input)) {
 *     // input is now typed as HttpMethod
 *     return `Valid method: ${input}`;
 *   } else {
 *     // input is still unknown
 *     return `Invalid method: ${input}`;
 *   }
 * }
 * ```
 */
export function isValidHttpMethod(method) {
	return (
		typeof method === "string" &&
		HTTP_METHODS_LIST.includes(/** @type {HttpMethod} */ (method))
	);
}

/**
 * Returns a copy of all supported HTTP methods as an array.
 *
 * This function returns a new array containing all supported HTTP methods.
 * The returned array is a shallow copy, so modifications to it won't affect
 * the original HTTP_METHODS_LIST.
 *
 * **Use Cases**:
 * - When you need a mutable array of methods
 * - When you want to add/remove methods for specific use cases
 * - When you need to pass methods to functions that might modify the array
 *
 * **Performance Note**: This creates a new array on each call. For high-performance
 * scenarios where you need the methods frequently, consider caching the result
 * or using HTTP_METHODS_LIST directly if you don't need a copy.
 *
 * @returns {HttpMethod[]} A new array containing all supported HTTP methods
 *
 * @example
 * ```javascript
 * // Get methods for modification
 * const methods = getHttpMethods();
 * methods.push('CUSTOM'); // Safe to modify
 * console.log(methods); // ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'CUSTOM']
 *
 * // Original list is unchanged
 * console.log(HTTP_METHODS_LIST); // ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
 *
 * // Use in API responses
 * function getSupportedMethods() {
 *   return {
 *     methods: getHttpMethods(),
 *     count: HTTP_METHODS_LIST.length
 *   };
 * }
 *
 * // Filter methods for specific use case
 * function getReadMethods() {
 *   const allMethods = getHttpMethods();
 *   return allMethods.filter(method => ['GET', 'HEAD', 'OPTIONS'].includes(method));
 * }
 *
 * // Pass to functions that might modify the array
 * function processMethods(methods) {
 *   methods.sort(); // Safe because we passed a copy
 *   return methods;
 * }
 *
 * const sortedMethods = processMethods(getHttpMethods());
 * ```
 */
export function getHttpMethods() {
	return [...HTTP_METHODS_LIST];
}
