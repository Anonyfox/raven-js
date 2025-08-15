import { stringify } from "./stringify.js";

/**
 * Checks if a value should be included in the output.
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value should be included, false otherwise.
 */
const isValidValue = (value) => value === 0 || Boolean(value);

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
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		if (isValidValue(value)) {
			result += stringify(value);
		}
		result += strings[i + 1];
	}
	return result.trim();
};
