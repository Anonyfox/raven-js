import { stringify } from "./stringify.js";

/**
 * Processes JavaScript template literals by combining static strings and interpolated values.
 *
 * This function handles:
 * - Template literal string interpolation
 * - Value validation (falsy values except 0 are filtered out)
 * - Array value flattening (joined with empty string)
 * - String concatenation for the final JavaScript snippet
 * - Automatic trimming of the result
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...any} values - The interpolated values.
 * @returns {string} The combined JavaScript snippet as a string.
 *
 * @example
 * processJSTemplate`let ${'count'} = ${10};`  // "let count = 10;"
 * processJSTemplate`${['a', 'b', 'c']}`       // "abc"
 * processJSTemplate`${null}${'valid'}`        // "valid"
 * processJSTemplate`${0}${false}`             // "0"
 */
export const processJSTemplate = (strings, ...values) => {
	const stringsLength = strings.length;
	const valuesLength = values.length;

	// Fast path: no values
	if (valuesLength === 0) {
		return strings[0].trim();
	}

	// Fast path: single value
	if (valuesLength === 1) {
		const value = values[0];
		// Optimized validation check: value === 0 || Boolean(value)
		if (value !== 0 && !value) {
			return strings[0].concat(strings[1]).trim();
		}
		// Use concat for better performance than string concatenation
		return strings[0].concat(stringify(value), strings[1]).trim();
	}

	// Fast path: small number of values (use StringBuilder pattern)
	if (valuesLength <= 3) {
		const builder = [strings[0]];
		for (let i = 0; i < valuesLength; i++) {
			const value = values[i];
			// Optimized validation check: value === 0 || Boolean(value)
			if (value === 0 || value) {
				builder.push(stringify(value));
			}
			builder.push(strings[i + 1]);
		}
		return builder.join("").trim();
	}

	// Count valid values to pre-allocate exact array size
	let validCount = 0;
	for (let i = 0; i < valuesLength; i++) {
		// Optimized validation check: value === 0 || Boolean(value)
		if (values[i] === 0 || values[i]) {
			validCount++;
		}
	}

	// Pre-allocate array with exact size for maximum performance
	// Total size = strings.length + valid values count
	const totalSize = stringsLength + validCount;
	const parts = new Array(totalSize);
	let partsIndex = 0;
	parts[partsIndex++] = strings[0];

	for (let i = 0; i < valuesLength; i++) {
		const value = values[i];
		// Optimized validation check: value === 0 || Boolean(value)
		if (value === 0 || value) {
			parts[partsIndex++] = stringify(value);
		}
		parts[partsIndex++] = strings[i + 1];
	}

	return parts.join("").trim();
};
