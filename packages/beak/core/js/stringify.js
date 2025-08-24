/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file String conversion with array flattening.
 *
 * Arrays join with empty string, other types use String() constructor.
 *
 * @param {any} value - Value to convert.
 * @returns {string} String representation. Arrays flatten to concatenated elements.
 * @throws {TypeError} When value cannot be converted (null-prototype objects).
 *
 * @example
 * stringify([1, 2, 3])        // "123"
 * stringify({ key: "value" }) // "[object Object]"
 * stringify(() => "test")     // "() => \"test\""
 */
export const stringify = (/** @type {any} */ value) =>
	Array.isArray(value) ? value.join("") : String(value);
