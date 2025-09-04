/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Resource name validation for universal compatibility.
 *
 * Validates resource names to ensure DNS-safe naming across all cloud providers.
 */

import { RESERVED_NAMES } from "./reserved-names.js";

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
 * Validates a resource name for universal compatibility.
 *
 * Rules enforced:
 * - Required string between 3-63 characters
 * - Lowercase alphanumeric with hyphens only
 * - No leading/trailing hyphens
 * - No consecutive hyphens
 * - Not in reserved names list
 * - DNS-safe (RFC 1123 compliant)
 *
 * @param {string} name - Resource name to validate
 * @throws {Error} When validation fails with specific reason
 * @returns {true} When validation succeeds
 *
 * @example
 * ```javascript
 * validate('my-app-prod'); // true
 * validate(''); // throws "Resource name is required"
 * validate('ab'); // throws "Resource name must be 3-63 characters"
 * validate('My-App'); // throws "Resource name must be lowercase..."
 * ```
 */
export function validate(name) {
	// 1. Required and string type
	if (!name || typeof name !== "string") {
		throw new Error("Resource name is required and must be a string");
	}

	// 2. Length constraints (DNS label limits)
	if (name.length < MIN_LENGTH || name.length > MAX_LENGTH) {
		throw new Error(
			`Resource name must be ${MIN_LENGTH}-${MAX_LENGTH} characters, got ${name.length}`,
		);
	}

	// 3. Additional safety patterns (check before general pattern)
	if (name.startsWith("xn--")) {
		throw new Error(
			'Resource name cannot start with "xn--" (reserved for internationalized domains)',
		);
	}

	// 4. Character constraints (DNS-safe, RFC 1123)
	if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name)) {
		throw new Error(
			"Resource name must be lowercase alphanumeric with hyphens (no leading/trailing hyphens, no consecutive hyphens)",
		);
	}

	// 5. No consecutive hyphens (additional DNS safety)
	if (name.includes("--")) {
		throw new Error("Resource name cannot contain consecutive hyphens");
	}

	// 6. Reserved name prevention
	if (RESERVED_NAMES.includes(name)) {
		throw new Error(
			`Resource name '${name}' is reserved. Choose a different name.`,
		);
	}

	return true;
}
