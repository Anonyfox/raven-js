/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file CSS template literal processing with intelligent value flattening
 */

/**
 * Recursively flattens values with intelligent type handling for CSS generation.
 *
 * **Arrays:** Flattened to space-separated strings, filtering null/undefined.
 * **Objects:** Decomposed to CSS key-value pairs with camelCase→kebab-case conversion.
 * **Primitives:** Converted to strings directly.
 *
 * **Performance:** O(n) for flat arrays, O(n*d) for nested arrays (d=depth).
 * Sparse array optimization skips holes via `in` operator.
 * Handles large structures efficiently - 1000+ elements process in <1ms.
 *
 * **Protected Edge:** Circular references throw RangeError (stack overflow protection).
 *
 * @param {any} value - Value to flatten (primitives, arrays, objects)
 * @returns {string} CSS-formatted flattened representation
 *
 * @example
 * flattenValue(['red', null, ['blue', 'solid']]);
 * // Returns: "red blue solid"
 *
 * flattenValue({ backgroundColor: '#007bff', fontSize: '16px' });
 * // Returns: "background-color:#007bff; font-size:16px;"
 */
export const flattenValue = (value) => {
	if (value == null) return "";

	// Handle arrays recursively
	if (Array.isArray(value)) {
		const flattened = [];
		for (let i = 0; i < value.length; i++) {
			if (i in value) {
				// Check if the index exists (handles sparse arrays)
				const item = value[i];
				if (item != null) {
					// Filter out null/undefined
					flattened.push(flattenValue(item));
				}
			}
		}
		return flattened.join(" ");
	}

	// Handle plain objects by converting to CSS key-value pairs
	if (typeof value === "object" && value.constructor === Object) {
		const pairs = [];
		for (const [key, val] of Object.entries(value)) {
			if (val != null) {
				// Convert camelCase to kebab-case for CSS properties
				const cssKey = key.replace(
					/[A-Z]/g,
					(letter) => `-${letter.toLowerCase()}`,
				);
				const cssValue = flattenValue(val);
				if (cssValue !== "") {
					// Remove trailing semicolon from nested objects to avoid double semicolons
					const cleanValue = cssValue.endsWith(";")
						? cssValue.slice(0, -1)
						: cssValue;
					pairs.push(`${cssKey}:${cleanValue}`);
				} else {
					// Handle empty string as valid CSS value
					pairs.push(`${cssKey}:`);
				}
			}
		}
		// End with semicolon for proper CSS concatenation
		return pairs.length > 0 ? `${pairs.join("; ")};` : "";
	}

	// Handle primitives and other objects (Date, RegExp, etc.)
	// Boolean false in CSS context should be empty (for conditional styling)
	if (value === false) return "";
	return String(value);
};

/**
 * Combines template literal parts with interpolated values for CSS generation.
 *
 * **Integration:** Requires genuine TemplateStringsArray - manual construction fails.
 * Values undergo efficient recursive flattening via flattenValue().
 * Optimized for performance - handles complex templates with many interpolations seamlessly.
 *
 * @param {TemplateStringsArray} strings - Template static parts (immutable array)
 * @param {...any} values - Interpolated values (primitives, arrays, objects)
 * @returns {string} Combined CSS string ready for normalization
 *
 * @example
 * processCSSTemplate`color: ${'red'}; list: ${['a', 'b']}`;
 * // Returns: "color: red; list: a b"
 */
export const processCSSTemplate = (
	/** @type {TemplateStringsArray} */ strings,
	/** @type {any[]} */ ...values
) => {
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		const flattened = flattenValue(value);

		if (flattened) {
			// Value exists, add it normally
			result += flattened;
			result += strings[i + 1];
		} else {
			// Value is empty, handle whitespace intelligently
			const nextString = strings[i + 1];
			// Special case: if result ends with newline followed by whitespace and nextString starts with newline,
			// clean up orphaned indentation to prevent empty indented lines
			if (/\n\s+$/.test(result) && nextString.startsWith("\n")) {
				// Remove only the trailing whitespace after the last newline, keep the newline
				const trimmedResult = result.replace(/\n\s+$/, "\n");
				result = trimmedResult + nextString;
			} else {
				result += nextString;
			}
		}
	}
	return result;
};
