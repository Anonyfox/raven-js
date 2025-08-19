/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Recursively flattens arrays and joins elements without separators.
 *
 * **Circular reference protection:** Uses WeakSet to detect cycles and prevent
 * infinite recursion. Circular arrays render as "[Circular]" string.
 *
 * **Performance:** Linear time complexity, single-pass string building.
 * Memory usage scales with nesting depth (WeakSet overhead).
 *
 * @param {any[]} arr - Array to flatten
 * @param {WeakSet<any[]>} [seen] - Circular reference tracker (internal use)
 * @returns {string} Concatenated string of all array elements
 *
 * @example
 * flattenArray([1, [2, 3], 4])
 * // "1234"
 *
 * @example
 * const circular = [1, 2];
 * circular.push(circular);
 * flattenArray(circular)
 * // "12[Circular]"
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
 * Converts values to strings for HTML template interpolation.
 *
 * **Array handling:** Flattens nested arrays and joins without separators.
 * Essential for rendering lists without unwanted commas in output.
 *
 * **Type coercion:** Uses String() constructor for consistent conversion
 * of primitives, objects, null, undefined.
 *
 * @param {*} value - Value to convert to string
 * @returns {string} String representation suitable for HTML interpolation
 *
 * @example
 * stringify([1, 2, 3])
 * // "123" (not "1,2,3")
 *
 * @example
 * stringify([1, [2, 3], 4])
 * // "1234"
 *
 * @example
 * stringify(null)
 * // "null"
 *
 * @example
 * stringify({toString: () => "custom"})
 * // "custom"
 */
export const stringify = (/** @type {*} */ value) => {
	if (Array.isArray(value)) {
		return flattenArray(value);
	}
	return String(value);
};
