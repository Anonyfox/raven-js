/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Template compilation for tagged template literals
 *
 * Content-agnostic optimization that converts tagged templates to string concatenation.
 */

import { inline } from "./inline.js";

/**
 * Compile function that optimizes tagged template literals
 *
 * @param {Function} templateFunc - Function containing tagged template literal
 * @returns {Function} Optimized template function
 *
 * @example
 * const optimized = compile((data) => tag`template ${data.value}`);
 * const result = optimized(myData); // Faster execution with string concatenation
 */
export function compile(templateFunc) {
	try {
		// Apply template literal optimization - converts tagged templates to string concatenation
		return inline(templateFunc);
	} catch (_error) {
		// Graceful fallback on any compilation error
		return templateFunc;
	}
}
