/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc alias tag model.
 *
 * Ravens test alternative naming documentation with precision.
 * Verifies alias tag parsing, validation, and reference indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocAliasTag } from "./jsdoc-alias-tag.js";

test("JSDocAliasTag - edge cases", () => {
	// Very long alias
	const longTag = new JSDocAliasTag(
		"VeryLongNamespaceWithMultipleWordsAndCamelCasing.AnotherLongModuleName.VeryDescriptiveFunctionNameWithManyWords",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long aliases");
	strictEqual(longTag.isNamespaced, true, "Should be namespaced");

	// Unicode characters
	const unicodeTag = new JSDocAliasTag("Módulo.función");
	strictEqual(
		unicodeTag.aliasName,
		"Módulo.función",
		"Should handle unicode characters",
	);
	strictEqual(
		unicodeTag.namespace,
		"Módulo",
		"Should extract unicode namespace",
	);
	strictEqual(unicodeTag.isValid(), true, "Should be valid");

	// Mixed case with numbers
	const mixedTag = new JSDocAliasTag("API_v2.Module123.function_v1");
	strictEqual(
		mixedTag.aliasName,
		"API_v2.Module123.function_v1",
		"Should handle mixed case with numbers",
	);
	strictEqual(
		mixedTag.namespace,
		"API_v2.Module123",
		"Should extract mixed namespace",
	);
	strictEqual(mixedTag.isValid(), true, "Should be valid");

	// Only dots (malformed)
	const dotsTag = new JSDocAliasTag("...");
	strictEqual(dotsTag.aliasName, "...", "Should handle dots-only alias");
	strictEqual(dotsTag.isValid(), true, "Should be valid even if unusual");
});
