/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc static tag model.
 *
 * Ravens test static member documentation with precision.
 * Verifies static tag parsing, validation, and class-level member indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocStaticTag } from "./jsdoc-static-tag.js";

test("JSDocStaticTag - edge cases", () => {
	// Very long description
	const longTag = new JSDocStaticTag(
		"This is a very comprehensive static method that handles multiple complex operations including data validation, transformation, caching, and error handling for the entire class hierarchy",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long descriptions");

	// Single word description
	const shortTag = new JSDocStaticTag("Singleton");
	strictEqual(
		shortTag.description,
		"Singleton",
		"Should handle single word description",
	);
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Special characters in description
	const specialTag = new JSDocStaticTag(
		"Static utility (v2.0) for JSON/XML processing",
	);
	strictEqual(specialTag.isValid(), true, "Should handle special characters");

	// Technical description
	const techTag = new JSDocStaticTag("Thread-safe singleton instance getter");
	strictEqual(
		techTag.description,
		"Thread-safe singleton instance getter",
		"Should handle technical descriptions",
	);
	strictEqual(techTag.isValid(), true, "Should be valid");
});
