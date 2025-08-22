/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { escapeSpecialCharacters } from "./escape-special-characters.js";

// Pre-compiled regex patterns for whitespace normalization
const WHITESPACE_BETWEEN_TAGS = />\s+</g;
const NEWLINES_AND_SPACES = /\n\s*/g;

/**
 * Core template rendering with zero-overhead implementation.
 *
 * **Ravens hunt efficiently:** Eliminates all conditional branching, direct string building.
 * Single execution path optimized for V8 monomorphic behavior.
 *
 * @param {TemplateStringsArray} strings - Static template parts
 * @param {Array<*>} values - Dynamic values for interpolation
 * @param {((str: string) => string)} [escapeFn] - Optional escaping function
 * @returns {string} Rendered and normalized HTML string
 */
/**
 * Determines if a value should be included in template output.
 * Re-exported for testing compatibility.
 */
export const isValidValue = (/** @type {any} */ value) =>
	value === 0 || Boolean(value);

/**
 * Normalizes HTML whitespace.
 * Re-exported for testing compatibility.
 */
export const fastNormalize = (/** @type {string} */ str) => {
	return str
		.trim()
		.replace(WHITESPACE_BETWEEN_TAGS, "><")
		.replace(NEWLINES_AND_SPACES, "");
};

/**
 * Flattens arrays recursively with zero allocation overhead.
 * Handles nested arrays without circular reference protection for speed.
 */
const flattenArrayFast = (/** @type {any[]} */ arr) => {
	let result = "";
	for (let i = 0; i < arr.length; i++) {
		const item = arr[i];
		result += Array.isArray(item) ? flattenArrayFast(item) : String(item);
	}
	return result;
};

export const _renderTemplate = (
	/** @type {TemplateStringsArray} */ strings,
	/** @type {Array<*>} */ values,
	/** @type {((str: string) => string)|undefined} */ escapeFn = undefined,
) => {
	let result = strings[0];

	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		if (value === 0 || Boolean(value)) {
			// Inline array flattening for maximum speed
			let stringified;
			if (Array.isArray(value)) {
				stringified = "";
				for (let j = 0; j < value.length; j++) {
					const item = value[j];
					stringified += Array.isArray(item)
						? flattenArrayFast(item)
						: String(item);
				}
			} else {
				stringified = String(value);
			}
			result += escapeFn ? escapeFn(stringified) : stringified;
		}
		result += strings[i + 1];
	}

	// Normalize only the final result
	return result
		.trim()
		.replace(WHITESPACE_BETWEEN_TAGS, "><")
		.replace(NEWLINES_AND_SPACES, "");
};

/**
 * Renderer for trusted HTML content (no escaping).
 *
 * **Ravens strike direct:** Zero conditional overhead, immediate execution.
 *
 * @param {TemplateStringsArray} strings - Static template parts
 * @param {Array<*>} values - Dynamic values for interpolation
 * @returns {string} Rendered HTML without escaping
 */
export const _renderHtmlFast = (
	/** @type {TemplateStringsArray} */ strings,
	/** @type {Array<*>} */ values,
) => _renderTemplate(strings, values);

/**
 * Renderer for untrusted content with XSS protection.
 *
 * **Ravens secure swiftly:** Direct escaping path, zero branching overhead.
 *
 * @param {TemplateStringsArray} strings - Static template parts
 * @param {Array<*>} values - Dynamic values for interpolation and escaping
 * @returns {string} Rendered HTML with all dynamic content escaped
 */
export const _renderSafeHtmlFast = (
	/** @type {TemplateStringsArray} */ strings,
	/** @type {Array<*>} */ values,
) => _renderTemplate(strings, values, escapeSpecialCharacters);
