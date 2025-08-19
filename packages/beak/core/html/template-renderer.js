/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { escapeSpecialCharacters } from "./escape-special-characters.js";
import { stringify } from "./stringify.js";

/**
 * @packageDocumentation
 *
 * Checks if a value should be included in the output.
 */
export const isValidValue = (/** @type {any} */ value) =>
	value === 0 || Boolean(value);

// Pre-compiled regex patterns for whitespace normalization
const WHITESPACE_BETWEEN_TAGS = />\s+</g;
const NEWLINES_AND_SPACES = /\n\s*/g;

// Cache for common string operations
const STRING_CACHE = new Map();

/**
 * Fast string normalization with caching for repeated patterns
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
export const fastNormalize = (/** @type {string} */ str) => {
	// Check cache first
	if (STRING_CACHE.has(str)) {
		return STRING_CACHE.get(str);
	}

	// Perform normalization
	const normalized = str
		.trim()
		.replace(WHITESPACE_BETWEEN_TAGS, "><")
		.replace(NEWLINES_AND_SPACES, "");

	// Cache result for future use (only cache reasonable sized strings)
	if (str.length < 1000) {
		STRING_CACHE.set(str, normalized);
	}

	return normalized;
};

/**
 * Private template rendering function that handles the core logic.
 * Optimized for performance using modern JavaScript features.
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {Array<*>} values - The dynamic values to be interpolated.
 * @param {Function} [escapeFn] - Optional function to escape values.
 * @returns {string} The rendered template as a string.
 */
export const _renderTemplate = (strings, values, escapeFn = undefined) => {
	// Fast path for common case: no values
	if (values.length === 0) {
		return fastNormalize(strings[0]);
	}

	// Fast path for single value case (very common)
	if (values.length === 1) {
		const value = values[0];
		if (!isValidValue(value)) {
			return fastNormalize(strings[0] + strings[1]);
		}
		const stringified = stringify(value);
		const processed = escapeFn ? escapeFn(stringified) : stringified;
		return fastNormalize(strings[0] + processed + strings[1]);
	}

	// Pre-allocate array for better performance than string concatenation
	const parts = new Array(strings.length + values.length);
	let partIndex = 0;

	// Add first static part
	parts[partIndex++] = strings[0];

	// Process values and static parts
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		if (isValidValue(value)) {
			const stringified = stringify(value);
			parts[partIndex++] = escapeFn ? escapeFn(stringified) : stringified;
		}
		parts[partIndex++] = strings[i + 1];
	}

	// Join all parts at once (much faster than string concatenation)
	const result = parts.join("");

	// Normalize whitespace using cached function
	return fastNormalize(result);
};

/**
 * Fast path for html function with common optimizations
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {Array<*>} values - The dynamic values to be interpolated.
 * @returns {string} The rendered HTML as a string.
 */
export const _renderHtmlFast = (strings, values) => {
	// Fast path for common case: no values
	if (values.length === 0) {
		return fastNormalize(strings[0]);
	}

	// Fast path for single value case (very common)
	if (values.length === 1) {
		const value = values[0];
		if (!isValidValue(value)) {
			return fastNormalize(strings[0] + strings[1]);
		}
		const stringified = stringify(value);
		return fastNormalize(strings[0] + stringified + strings[1]);
	}

	// General case
	return _renderTemplate(strings, values);
};

/**
 * Fast path for safeHtml function with common optimizations
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {Array<*>} values - The dynamic values to be interpolated.
 * @returns {string} The rendered HTML as a string with escaped content.
 */
export const _renderSafeHtmlFast = (strings, values) => {
	// Fast path for common case: no values
	if (values.length === 0) {
		return fastNormalize(strings[0]);
	}

	// Fast path for single value case (very common)
	if (values.length === 1) {
		const value = values[0];
		if (!isValidValue(value)) {
			return fastNormalize(strings[0] + strings[1]);
		}
		const stringified = stringify(value);
		const escaped = escapeSpecialCharacters(stringified);
		return fastNormalize(strings[0] + escaped + strings[1]);
	}

	// General case
	return _renderTemplate(strings, values, escapeSpecialCharacters);
};
