/**
 * HTTP method constants for the Wings package.
 *
 * This provides a single source of truth for all supported HTTP methods,
 * ensuring consistency across the codebase and preventing typos.
 */

/**
 * @typedef {'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'} HttpMethod
 */

/**
 * All supported HTTP methods.
 *
 * @type {Object<string, HttpMethod>}
 */
export const HTTP_METHODS = {
	GET: "GET",
	POST: "POST",
	PUT: "PUT",
	DELETE: "DELETE",
	PATCH: "PATCH",
	HEAD: "HEAD",
	OPTIONS: "OPTIONS",
};

/**
 * Array of all supported HTTP method strings.
 *
 * @type {HttpMethod[]}
 */
export const HTTP_METHODS_LIST = Object.values(HTTP_METHODS);

/**
 * Checks if a value is a valid HTTP method.
 *
 * @param {unknown} method - The method to validate
 * @returns {method is HttpMethod} True if the method is valid
 */
export function isValidHttpMethod(method) {
	return (
		typeof method === "string" &&
		HTTP_METHODS_LIST.includes(/** @type {HttpMethod} */ (method))
	);
}

/**
 * Gets all supported HTTP methods as an array.
 *
 * @returns {HttpMethod[]} Array of all supported HTTP methods
 */
export function getHttpMethods() {
	return [...HTTP_METHODS_LIST];
}
