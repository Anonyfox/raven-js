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
 * **EXPERIMENTAL:** Compile function that optimizes tagged template literals
 *
 * **Status:** Experimental - API may change, use with caution in production.
 * **Benefits:** Converts templates to string concatenation for V8 optimization.
 * **Limitations:** Simple functions only, gracefully falls back on complex cases.
 *
 * @param {Function} templateFunc - Function containing tagged template literal
 * @returns {Function} Optimized template function
 *
 * @example
 * const optimized = compile((data) => html`<div>${data.value}</div>`);
 * const result = optimized(myData); // Faster execution when optimization succeeds
 */
export function compile(templateFunc) {
	// Apply template literal optimization - converts tagged templates to string concatenation
	// inline() function provides comprehensive error handling and never throws
	return inline(templateFunc);
}
