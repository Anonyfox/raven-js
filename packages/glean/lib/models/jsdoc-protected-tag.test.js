/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc protected tag model.
 *
 * Ravens test protected member documentation with precision.
 * Verifies protected tag parsing, validation, and subclass access indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocProtectedTag } from "./jsdoc-protected-tag.js";

test("JSDocProtectedTag - edge cases", () => {
	// Very long description
	const longTag = new JSDocProtectedTag(
		"This is a very comprehensive protected method that provides extensive functionality for subclasses including state management, validation, event handling, and lifecycle management while maintaining proper encapsulation from external consumers",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long descriptions");

	// Single word description
	const shortTag = new JSDocProtectedTag("Extensible");
	strictEqual(
		shortTag.description,
		"Extensible",
		"Should handle single word description",
	);
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Technical inheritance description
	const techTag = new JSDocProtectedTag(
		"Virtual method with polymorphic dispatch for subclass override",
	);
	strictEqual(
		techTag.description,
		"Virtual method with polymorphic dispatch for subclass override",
		"Should handle technical descriptions",
	);
	strictEqual(techTag.isValid(), true, "Should be valid");

	// Special characters in description
	const specialTag = new JSDocProtectedTag(
		"Protected utility (base v1.0) for subclass extension & customization",
	);
	strictEqual(specialTag.isValid(), true, "Should handle special characters");
});
