/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc readonly tag model.
 *
 * Ravens test readonly property documentation with precision.
 * Verifies readonly tag parsing, validation, and immutability indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocReadonlyTag } from "./jsdoc-readonly-tag.js";

test("JSDocReadonlyTag - edge cases", () => {
	// Very long description
	const longTag = new JSDocReadonlyTag(
		"This is a very comprehensive readonly property that contains critical system information and should never be modified during the entire lifecycle of the object to maintain data integrity and system consistency",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long descriptions");

	// Single word description
	const shortTag = new JSDocReadonlyTag("Immutable");
	strictEqual(
		shortTag.description,
		"Immutable",
		"Should handle single word description",
	);
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Technical description with jargon
	const techTag = new JSDocReadonlyTag(
		"Thread-safe immutable reference with copy-on-write semantics",
	);
	strictEqual(
		techTag.description,
		"Thread-safe immutable reference with copy-on-write semantics",
		"Should handle technical descriptions",
	);
	strictEqual(techTag.isValid(), true, "Should be valid");

	// Special characters in description
	const specialTag = new JSDocReadonlyTag(
		"Readonly constant (v1.0) for API endpoints & configuration",
	);
	strictEqual(specialTag.isValid(), true, "Should handle special characters");
});
