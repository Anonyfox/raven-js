/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc see tag model.
 *
 * Ravens test cross-reference documentation with precision.
 * Verifies see tag parsing, validation, and reference linking.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocSeeTag } from "./jsdoc-see-tag.js";

test("JSDocSeeTag - edge cases", () => {
	// Very long URL
	const longTag = new JSDocSeeTag(
		"https://very.long.domain.name.example.com/extremely/long/path/to/documentation/with/many/segments/and/parameters?param1=value1&param2=value2#section",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long URLs");

	// Complex module reference
	const moduleTag = new JSDocSeeTag(
		"module:@organization/package-name/submodule",
	);
	strictEqual(
		moduleTag.referenceType,
		"module",
		"Should handle complex module references",
	);
	strictEqual(moduleTag.isValid(), true, "Should be valid");

	// Special characters in reference
	const specialTag = new JSDocSeeTag("MyClass.$staticMethod");
	strictEqual(
		specialTag.reference,
		"MyClass.$staticMethod",
		"Should handle special characters",
	);
	strictEqual(specialTag.isValid(), true, "Should be valid");

	// Unicode in description
	const unicodeTag = new JSDocSeeTag(
		"{@link https://example.com|Dökümäntäşyön Güidé}",
	);
	strictEqual(
		unicodeTag.description,
		"Dökümäntäşyön Güidé",
		"Should handle unicode in description",
	);
	strictEqual(unicodeTag.isValid(), true, "Should be valid");
});
