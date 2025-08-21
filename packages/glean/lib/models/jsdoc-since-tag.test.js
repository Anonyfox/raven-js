/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc since tag model.
 *
 * Ravens test version tracking documentation with precision.
 * Verifies since tag parsing, validation, and temporal indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocSinceTag } from "./jsdoc-since-tag.js";

test("JSDocSinceTag - edge cases", () => {
	// Very long version string
	const longTag = new JSDocSinceTag(
		"1.0.0-alpha.beta.gamma.delta.epsilon+build.20240315.123456789",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long versions");

	// Unicode in description
	const unicodeTag = new JSDocSinceTag(
		"1.0.0 Añadido soporte für spëcial characters",
	);
	strictEqual(
		unicodeTag.description,
		"Añadido soporte für spëcial characters",
		"Should handle unicode in description",
	);
	strictEqual(unicodeTag.isValid(), true, "Should be valid");

	// Special characters in version
	const specialTag = new JSDocSinceTag("v2.0.0_RC1");
	strictEqual(
		specialTag.version,
		"v2.0.0_RC1",
		"Should handle special characters in version",
	);
	strictEqual(specialTag.isValid(), true, "Should be valid");

	// Mixed format description
	const mixedTag = new JSDocSinceTag(
		"1.5.0 Bug fixes & performance improvements (50% faster)",
	);
	strictEqual(
		mixedTag.description,
		"Bug fixes & performance improvements (50% faster)",
		"Should handle mixed format descriptions",
	);
	strictEqual(mixedTag.isValid(), true, "Should be valid");
});
