/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { stringify } from "./stringify.js";

// Raven-fast value validation - extracted for V8 optimization
const isValidJSValue = (/** @type {any} */ value) =>
	value === 0 || Boolean(value);

/**
 * @file JavaScript template processor with four execution paths.
 *
 * Execution paths: 0 values (direct return), 1 value (concat), 2-3 values (array build), 4+ values (pre-allocated array).
 *
 * @param {TemplateStringsArray} strings - Static template parts.
 * @param {...any} values - Values to interpolate.
 * @returns {string} Processed JavaScript code, trimmed.
 *
 * @filtering
 * Includes: 0, truthy values
 * Excludes: null, undefined, false, empty string
 *
 * @example
 * processJSTemplate`let ${'count'} = ${10};`  // "let count = 10;"
 * processJSTemplate`${null}${'valid'}`        // "valid"
 * processJSTemplate`${0}${false}`             // "0"
 */
export const processJSTemplate = (
	/** @type {TemplateStringsArray} */ strings,
	/** @type {any[]} */ ...values
) => {
	const stringsLength = strings.length;
	const valuesLength = values.length;

	// Fast path: no values
	if (valuesLength === 0) {
		return strings[0].trim();
	}

	// Fast path: single value
	if (valuesLength === 1) {
		const value = values[0];
		// Raven-fast validation with extracted function
		if (!isValidJSValue(value)) {
			return strings[0].concat(strings[1]).trim();
		}
		// Use concat operation
		return strings[0].concat(stringify(value), strings[1]).trim();
	}

	// Fast path: small number of values (use StringBuilder pattern)
	if (valuesLength <= 3) {
		const builder = [strings[0]];
		for (let i = 0; i < valuesLength; i++) {
			const value = values[i];
			// Raven-fast validation with extracted function
			if (isValidJSValue(value)) {
				builder.push(stringify(value));
			}
			builder.push(strings[i + 1]);
		}
		return builder.join("").trim();
	}

	// Count valid values to pre-allocate exact array size
	let validCount = 0;
	for (let i = 0; i < valuesLength; i++) {
		// Raven-fast validation with extracted function
		if (isValidJSValue(values[i])) {
			validCount++;
		}
	}

	// Pre-allocate array with exact size
	// Total size = strings.length + valid values count
	const totalSize = stringsLength + validCount;
	const parts = new Array(totalSize);
	let partsIndex = 0;
	parts[partsIndex++] = strings[0];

	for (let i = 0; i < valuesLength; i++) {
		const value = values[i];
		// Raven-fast validation with extracted function
		if (isValidJSValue(value)) {
			parts[partsIndex++] = stringify(value);
		}
		parts[partsIndex++] = strings[i + 1];
	}

	return parts.join("").trim();
};
