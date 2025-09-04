/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Non-throwing resource name validation check.
 *
 * Provides a safe way to check resource name validity without exception handling.
 */

import { validate } from "./validate.js";

/**
 * Checks if a resource name is valid without throwing.
 *
 * @param {string} name - Resource name to check
 * @returns {boolean} True if valid, false otherwise
 *
 * @example
 * ```javascript
 * isValid('my-app-prod'); // true
 * isValid(''); // false
 * isValid('api'); // false
 * ```
 */
export function isValid(name) {
	try {
		validate(name);
		return true;
	} catch {
		return false;
	}
}
