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
 * Converts tagged templates to string concatenation for V8 optimization.
 */

import { inline } from "./inline.js";

/**
 * **EXPERIMENTAL:** Template function optimization through AST transformation.
 *
 * **Warning:** API unstable, use cautiously in production.
 * **Optimization:** Converts tagged templates to direct string concatenation.
 * **Fallback:** Returns original function on complex cases or errors.
 *
 * @param {Function} templateFunc - Function containing tagged template literal
 * @returns {Function} Optimized or original template function
 *
 * @example
 * const optimized = compile((data) => html`<div>${data.value}</div>`);
 * const result = optimized(myData);
 */
export function compile(templateFunc) {
	// Apply template literal optimization via AST transformation
	// inline() provides error handling and graceful fallback
	return inline(templateFunc);
}
