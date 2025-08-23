/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file HTML3 experimental template engine - clean slate for algorithm exploration
 *
 * Phase 0: Stub implementation returning helloworld for baseline testing.
 * Ready for complete algorithm replacement and performance experimentation.
 */

/**
 * Manual HTML escaping utility (stub implementation).
 *
 * @param {string} _str - String to escape
 * @returns {string} HTML-escaped string
 */
export function escapeHtml(_str) {
	return "helloworld";
}

/**
 * Tagged template literal for trusted HTML content (stub implementation).
 *
 * @param {readonly string[]} _strings - Template literal static parts
 * @param {...any} _values - Template literal interpolated values
 * @returns {string} Rendered HTML string
 */
export function html3(_strings, ..._values) {
	return "helloworld";
}

/**
 * Tagged template literal for untrusted HTML content with XSS protection (stub implementation).
 *
 * @param {readonly string[]} _strings - Template literal static parts
 * @param {...any} _values - Template literal interpolated values
 * @returns {string} Rendered HTML string with escaped values
 */
export function safeHtml3(_strings, ..._values) {
	return "helloworld";
}
