/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc deprecated tag model.
 *
 * Ravens test deprecation notice documentation with precision.
 * Verifies deprecated tag parsing, validation, and warning indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocDeprecatedTag } from "./jsdoc-deprecated-tag.js";

test("JSDocDeprecatedTag - edge cases", () => {
	// Very long deprecation notice
	const longTag = new JSDocDeprecatedTag(
		"This function has been deprecated due to performance issues and security vulnerabilities. Please migrate to the new implementation available in the security module which provides better error handling, improved performance, and enhanced security features",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long reasons");
	strictEqual(
		longTag.hasMigrationGuidance,
		true,
		"Should detect migration in long text",
	);

	// Multiple version references
	const multiVersionTag = new JSDocDeprecatedTag(
		"Deprecated since version 1.0.0, will be removed in version 2.0.0",
	);
	strictEqual(
		multiVersionTag.deprecatedSince,
		"1.0.0",
		"Should extract first version reference",
	);
	strictEqual(multiVersionTag.isValid(), true, "Should be valid");

	// Special characters
	const specialTag = new JSDocDeprecatedTag(
		"Use newMethod() & modernAPI() instead of this legacy implementation",
	);
	strictEqual(
		specialTag.hasMigrationGuidance,
		true,
		"Should handle special characters",
	);
	strictEqual(specialTag.isValid(), true, "Should be valid");

	// Unicode characters
	const unicodeTag = new JSDocDeprecatedTag(
		"Dépréciée - Utilisez la nouvelle implémentation",
	);
	strictEqual(
		unicodeTag.reason,
		"Dépréciée - Utilisez la nouvelle implémentation",
		"Should handle unicode characters",
	);
	strictEqual(unicodeTag.isValid(), true, "Should be valid");
});
