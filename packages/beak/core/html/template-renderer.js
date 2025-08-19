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
 * Determines if a value should be included in template output.
 *
 * **Falsy filtering:** Excludes null, undefined, false, empty string, NaN.
 * **Zero preservation:** Includes 0 as valid output (common requirement).
 *
 * @param {*} value - Value to test for inclusion
 * @returns {boolean} true if value should be rendered, false to skip
 *
 * @example
 * isValidValue(0)        // true  (zero is valid)
 * isValidValue("")       // false (empty string excluded)
 * isValidValue(null)     // false (null excluded)
 * isValidValue("text")   // true  (non-empty string included)
 */
export const isValidValue = (/** @type {any} */ value) =>
	value === 0 || Boolean(value);

// Pre-compiled regex patterns for whitespace normalization
const WHITESPACE_BETWEEN_TAGS = />\s+</g;
const NEWLINES_AND_SPACES = /\n\s*/g;

// Cache for common string operations
const STRING_CACHE = new Map();

/**
 * Normalizes HTML whitespace with performance caching.
 *
 * **Optimizations:**
 * - Trims leading/trailing whitespace
 * - Collapses whitespace between tags: `> <` → `><`
 * - Removes newlines and indentation
 * - Caches results for strings < 1000 chars (prevents memory bloat)
 *
 * **Performance:** Cache hit avoids regex operations. Pre-compiled patterns
 * ensure consistent execution time.
 *
 * @param {string} str - HTML string to normalize
 * @returns {string} Minimized HTML without formatting whitespace
 *
 * @example
 * fastNormalize(`
 *   <div>
 *     <span>content</span>
 *   </div>
 * `)
 * // "<div><span>content</span></div>"
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
 * Core template rendering with performance optimizations.
 *
 * **Performance paths:**
 * - No values: Direct normalization of static string
 * - Single value: Avoids array allocation and iteration
 * - Multiple values: Pre-allocated array prevents string concatenation overhead
 *
 * **Memory optimization:** Single string join instead of incremental concatenation
 * prevents intermediate string allocations.
 *
 * @param {TemplateStringsArray} strings - Static template parts
 * @param {Array<*>} values - Dynamic values for interpolation
 * @param {((str: string) => string)} [escapeFn] - Optional escaping function
 * @returns {string} Rendered and normalized HTML string
 */
export const _renderTemplate = (
	/** @type {TemplateStringsArray} */ strings,
	/** @type {Array<*>} */ values,
	/** @type {((str: string) => string)|undefined} */ escapeFn = undefined,
) => {
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
 * Optimized renderer for trusted HTML content (no escaping).
 *
 * **Fast paths:** Handles zero-value and single-value cases without function call
 * overhead. Avoids escape function allocation for performance.
 *
 * **Use for:** Static content, pre-sanitized HTML, trusted template literals.
 * **Avoid for:** User input, API responses, untrusted content.
 *
 * @param {TemplateStringsArray} strings - Static template parts
 * @param {Array<*>} values - Dynamic values for interpolation
 * @returns {string} Rendered HTML without escaping
 */
export const _renderHtmlFast = (
	/** @type {TemplateStringsArray} */ strings,
	/** @type {Array<*>} */ values,
) => {
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
 * Optimized renderer for untrusted content with XSS protection.
 *
 * **Fast paths:** Handles zero-value and single-value cases with direct escaping.
 * Avoids function call overhead for common template patterns.
 *
 * **Security:** All dynamic values escaped using escapeSpecialCharacters.
 * **Use for:** User input, form data, API responses, untrusted content.
 *
 * @param {TemplateStringsArray} strings - Static template parts
 * @param {Array<*>} values - Dynamic values for interpolation and escaping
 * @returns {string} Rendered HTML with all dynamic content escaped
 */
export const _renderSafeHtmlFast = (
	/** @type {TemplateStringsArray} */ strings,
	/** @type {Array<*>} */ values,
) => {
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
