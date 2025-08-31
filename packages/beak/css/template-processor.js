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
 * @param {any} value - Value to flatten (primitives, arrays, objects)
 * @returns {string} CSS-formatted flattened representation
 */
export const flattenValue = (value) => {
	if (value == null) return "";

	// Handle arrays recursively with modern JS optimization
	if (Array.isArray(value)) {
		let result = "";
		let needsSpace = false;

		for (let i = 0; i < value.length; i++) {
			if (i in value) {
				// Check if the index exists (handles sparse arrays)
				const item = value[i];
				if (item != null) {
					// Filter out null/undefined
					const flattened = flattenValue(item);
					if (flattened) {
						if (needsSpace) result += " ";
						result += flattened;
						needsSpace = true;
					}
				}
			}
		}
		return result;
	}

	// Handle plain objects by converting to CSS key-value pairs
	if (typeof value === "object" && value.constructor === Object) {
		let result = "";
		let needsSeparator = false;

		for (const [key, val] of Object.entries(value)) {
			if (val != null) {
				// Convert camelCase to kebab-case for CSS properties
				const cssKey = key.replace(
					/[A-Z]/g,
					(letter) => `-${letter.toLowerCase()}`,
				);
				const cssValue = flattenValue(val);

				if (needsSeparator) result += "; ";

				if (cssValue !== "") {
					// Remove trailing semicolon from nested objects to avoid double semicolons
					const cleanValue = cssValue.endsWith(";")
						? cssValue.slice(0, -1)
						: cssValue;
					result += `${cssKey}:${cleanValue}`;
				} else {
					// Handle empty string as valid CSS value
					result += `${cssKey}:`;
				}
				needsSeparator = true;
			}
		}
		// End with semicolon for proper CSS concatenation
		return result ? `${result};` : "";
	}

	// Handle primitives and other objects (Date, RegExp, etc.)
	// Boolean false in CSS context should be empty (for conditional styling)
	if (value === false) return "";
	return String(value);
};

/**
 * Combines template literal parts with interpolated values for CSS processing.
 *
 * @param {TemplateStringsArray} strings - Template static parts (immutable array)
 * @param {...any} values - Interpolated values (primitives, arrays, objects)
 * @returns {string} Combined CSS string ready for normalization
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
