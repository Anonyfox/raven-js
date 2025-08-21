/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc author tag model.
 *
 * Ravens test authorship metadata documentation with precision.
 * Verifies author tag parsing, validation, and attribution indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocAuthorTag } from "./jsdoc-author-tag.js";

test("JSDocAuthorTag - edge cases", () => {
	// Very long author info
	const longTag = new JSDocAuthorTag(
		"Very Long Author Name With Multiple Middle Names And Suffixes Jr. III <very.long.email.address@extremely.long.domain.name.example.com>",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long author info");

	// Special characters in name
	const specialTag = new JSDocAuthorTag(
		"François Müller <françois@münchen.de>",
	);
	strictEqual(
		specialTag.name,
		"François Müller",
		"Should handle special characters",
	);
	strictEqual(
		specialTag.email,
		"françois@münchen.de",
		"Should parse international email",
	);
	strictEqual(specialTag.isValid(), true, "Should be valid");

	// Numbers and symbols
	const symbolTag = new JSDocAuthorTag("User_123 <user+tag@domain.co.uk>");
	strictEqual(symbolTag.name, "User_123", "Should handle numbers and symbols");
	strictEqual(
		symbolTag.email,
		"user+tag@domain.co.uk",
		"Should parse complex email",
	);
	strictEqual(symbolTag.isValid(), true, "Should be valid");
});
