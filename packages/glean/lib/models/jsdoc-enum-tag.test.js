/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc enum tag model.
 *
 * Ravens test enumeration type documentation with precision.
 * Verifies enum tag parsing, validation, and constant collection indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocEnumTag } from "./jsdoc-enum-tag.js";

test("JSDocEnumTag - edge cases", () => {
	// Very long description
	const longTag = new JSDocEnumTag(
		"{string} This is a very comprehensive enumeration that contains critical application constants including status codes, configuration options, error messages, and system identifiers used throughout the entire application lifecycle",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long descriptions");

	// Single word description
	const shortTag = new JSDocEnumTag("{number} Codes");
	strictEqual(
		shortTag.description,
		"Codes",
		"Should handle single word description",
	);
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Technical description with special formatting
	const techTag = new JSDocEnumTag(
		"{(string|number|boolean)} Multi-type enumeration with union types",
	);
	strictEqual(
		techTag.description,
		"Multi-type enumeration with union types",
		"Should handle technical descriptions",
	);
	strictEqual(techTag.isValid(), true, "Should be valid");

	// Special characters in description
	const specialTag = new JSDocEnumTag(
		"{string} MIME types & file extensions (v2.0) for upload validation",
	);
	strictEqual(specialTag.isValid(), true, "Should handle special characters");
});
