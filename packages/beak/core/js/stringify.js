/**
 * @file Value stringification utilities for JavaScript template interpolation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Converts a value to a string, joining arrays if necessary.
 *
 * This function handles:
 * - Arrays: joins all elements with empty string (no separators)
 * - All other types: converts to string using String() constructor
 * - Null/undefined: converts to "null"/"undefined" strings
 * - Objects: converts to "[object Object]" or custom toString() result
 * - Functions: converts to function source code
 *
 * @param {*} value - The value to stringify.
 * @returns {string} The stringified value.
 *
 * @example
 * stringify("hello")           // "hello"
 * stringify(42)               // "42"
 * stringify([1, 2, 3])        // "123"
 * stringify(["a", "b", "c"])  // "abc"
 * stringify(null)             // "null"
 * stringify(undefined)        // "undefined"
 * stringify({ key: "value" }) // "[object Object]"
 * stringify(() => "test")     // "() => \"test\""
 */
export const stringify = (value) =>
	Array.isArray(value) ? value.join("") : String(value);
