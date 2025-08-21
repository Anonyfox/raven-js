/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc namespace tag model.
 *
 * Ravens test namespace territorial organization with methodical precision.
 * Verifies namespace parsing, validation, and hierarchical structure documentation.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocNamespaceTag } from "./jsdoc-namespace-tag.js";

test("JSDocNamespaceTag - edge cases", () => {
	// Very long namespace
	const longTag = new JSDocNamespaceTag(
		"VeryLongCompanyName.ExtensiveProductLine.ComplexWebApplication.CoreUtilities.StringManipulation.AdvancedFunctions",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long namespaces");

	// Single character
	const shortTag = new JSDocNamespaceTag("$");
	strictEqual(shortTag.name, "$", "Should handle single character namespace");
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// With dots but no description
	const dotsTag = new JSDocNamespaceTag("a.b.c");
	strictEqual(dotsTag.name, "a.b.c", "Should handle minimal dotted namespace");
	strictEqual(dotsTag.isValid(), true, "Should be valid");
});
