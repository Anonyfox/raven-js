/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Resource name suggestion and transformation utilities.
 *
 * Transforms invalid resource names into valid DNS-safe alternatives.
 */

import { RESERVED_NAMES } from "./reserved-names.js";
import { validate } from "./validate.js";

/**
 * Minimum allowed length for resource names.
 * @type {number}
 */
const MIN_LENGTH = 3;

/**
 * Maximum allowed length for resource names (DNS label limit).
 * @type {number}
 */
const MAX_LENGTH = 63;

/**
 * Suggests a valid resource name based on an invalid input.
 * Attempts to transform the input into a valid format.
 *
 * @param {string} name - Invalid resource name to transform
 * @returns {string} Suggested valid resource name
 *
 * @example
 * ```javascript
 * suggest('My App!'); // 'my-app'
 * suggest('API-Server'); // 'api-server-app'
 * suggest('a'); // 'app-a'
 * ```
 */
export function suggest(name) {
	if (!name || typeof name !== "string") {
		return "my-app";
	}

	// Normalize to lowercase and replace invalid chars with hyphens
	let suggested = name
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "-")
		.replace(/--+/g, "-") // Remove consecutive hyphens
		.replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

	// Handle reserved names first
	if (RESERVED_NAMES.includes(suggested)) {
		suggested = `${suggested}-app`.slice(0, MAX_LENGTH);
	}

	// Ensure minimum length only if result is too short
	if (suggested.length > 0 && suggested.length < MIN_LENGTH) {
		suggested = `app-${suggested}`.slice(0, MAX_LENGTH);
	}

	// Ensure maximum length
	if (suggested.length > MAX_LENGTH) {
		suggested = suggested.slice(0, MAX_LENGTH).replace(/-+$/, "");
	}

	// Ensure it ends with alphanumeric (not hyphen)
	if (suggested.endsWith("-")) {
		suggested = suggested.slice(0, -1) + "1";
	}

	// Final validation - if still invalid, return fallback
	try {
		validate(suggested);
		return suggested;
	} catch {
		return "my-app";
	}
}
