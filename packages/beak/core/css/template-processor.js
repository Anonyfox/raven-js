/**
 * Processes CSS template literals by combining static strings and interpolated values.
 *
 * This function handles:
 * - Template literal string interpolation
 * - Array value flattening (joined with spaces)
 * - Null/undefined value filtering
 * - String concatenation for the final CSS
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...any} values - The interpolated values.
 * @returns {string} The combined CSS string before processing.
 *
 * @example
 * const result = processCSSTemplate`color: ${'red'}; background: ${['blue', 'solid']};`;
 * // Returns: "color: red; background: blue solid;"
 */

/**
 * Recursively flattens an array and filters out null/undefined values.
 * @param {any} value - The value to flatten
 * @returns {string} The flattened and filtered string representation
 */
export const flattenValue = (value) => {
	if (value == null) return "";
	if (!Array.isArray(value)) return String(value);

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
};

/**
 * Processes CSS template literals by combining static strings and interpolated values.
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...any} values - The interpolated values.
 * @returns {string} The combined CSS string before processing.
 */
export const processCSSTemplate = (strings, ...values) => {
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		if (value != null) {
			result += flattenValue(value);
		}
		result += strings[i + 1];
	}
	return result;
};
