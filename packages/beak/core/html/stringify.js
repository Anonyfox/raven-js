/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 *
 * Recursively flattens an array and joins all elements with empty string.
 * Uses a WeakSet to detect circular references and prevent infinite recursion.
 */
const flattenArray = (/** @type {any[]} */ arr, seen = new WeakSet()) => {
	// Prevent circular references
	if (seen.has(arr)) {
		return "[Circular]";
	}
	seen.add(arr);

	let result = "";
	for (let i = 0; i < arr.length; i++) {
		const item = arr[i];
		if (Array.isArray(item)) {
			result += flattenArray(item, seen);
		} else {
			result += String(item);
		}
	}
	return result;
};

/**
 * Converts a value to a string for HTML template interpolation.
 * Arrays are flattened and joined without separators.
 *
 * @param {*} value - The value to stringify.
 * @returns {string} The stringified value.
 *
 * @example
 * stringify("hello") // "hello"
 * stringify([1, 2, 3]) // "123"
 * stringify([1, [2, 3], 4]) // "1234"
 * stringify(null) // "null"
 * stringify(undefined) // "undefined"
 * stringify(42) // "42"
 */
export const stringify = (value) => {
	if (Array.isArray(value)) {
		return flattenArray(value);
	}
	return String(value);
};
