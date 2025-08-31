/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * String conversion with array flattening for JavaScript template processing.
 *
 * @param {any} value - Value to convert.
 * @returns {string} String representation. Arrays flatten to concatenated elements.
 */
export const stringify = (/** @type {any} */ value) =>
	Array.isArray(value) ? value.join("") : String(value);
