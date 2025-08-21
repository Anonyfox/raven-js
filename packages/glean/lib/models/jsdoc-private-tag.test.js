/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc private tag model.
 *
 * Ravens test private member documentation with precision.
 * Verifies private tag parsing, validation, and internal API indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocPrivateTag } from "./jsdoc-private-tag.js";

test("JSDocPrivateTag - edge cases", () => {
	// Very long description
	const longTag = new JSDocPrivateTag(
		"This is a very comprehensive private method that handles multiple complex internal operations including state management, data validation, caching, and error handling that should never be accessed directly by external consumers",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long descriptions");

	// Single word description
	const shortTag = new JSDocPrivateTag("Internal");
	strictEqual(
		shortTag.description,
		"Internal",
		"Should handle single word description",
	);
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Technical description with underscores
	const techTag = new JSDocPrivateTag(
		"_internalHelper for implementation details",
	);
	strictEqual(
		techTag.description,
		"_internalHelper for implementation details",
		"Should handle technical descriptions",
	);
	strictEqual(techTag.isValid(), true, "Should be valid");

	// Special characters in description
	const specialTag = new JSDocPrivateTag(
		"Private utility (internal v2.0) for data processing & validation",
	);
	strictEqual(specialTag.isValid(), true, "Should handle special characters");
});
