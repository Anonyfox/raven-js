/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc memberof tag model.
 *
 * Ravens test membership relationship documentation with hierarchical precision.
 * Verifies parent-child symbol relationships, ownership parsing, and inheritance structure.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocMemberofTag } from "./jsdoc-memberof-tag.js";

test("JSDocMemberofTag - edge cases", () => {
	// Very long parent name
	const longTag = new JSDocMemberofTag(
		"VeryLongCompanyName.ExtensiveProductLine.ComplexWebApplication.CoreServices.DatabaseConnectionManager",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long parent names");

	// Single character parent
	const shortTag = new JSDocMemberofTag("$");
	strictEqual(shortTag.parent, "$", "Should handle single character parent");
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Parent with numbers
	const numberedTag = new JSDocMemberofTag("APIv2.endpoints");
	strictEqual(
		numberedTag.parent,
		"APIv2.endpoints",
		"Should handle numbers in parent",
	);
	strictEqual(numberedTag.isValid(), true, "Should be valid");

	// Parent with underscores
	const underscoreTag = new JSDocMemberofTag("MY_APP.CONSTANTS");
	strictEqual(
		underscoreTag.parent,
		"MY_APP.CONSTANTS",
		"Should handle underscores",
	);
	strictEqual(underscoreTag.isValid(), true, "Should be valid");
});
