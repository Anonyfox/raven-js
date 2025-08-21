/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for JSDoc typedef tag model
 *
 * Ravens validate type definition precision with predatory focus.
 * Comprehensive test coverage for typedef parsing, validation, and output.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocTypedefTag } from "./jsdoc-typedef-tag.js";

test("JSDocTypedefTag - complex nested types", () => {
	// Nested object type
	const nestedTag = new JSDocTypedefTag(
		"{{name: string, age: number}} Person Person data structure",
	);
	strictEqual(
		nestedTag.baseType,
		"{name: string, age: number}",
		"Should parse nested object type correctly",
	);
	strictEqual(nestedTag.name, "Person", "Should parse name correctly");
	strictEqual(nestedTag.isValid(), true, "Should be valid");

	// Complex generic type
	const complexTag = new JSDocTypedefTag(
		"{Map<string, Array<number>>} DataMap Complex nested data structure",
	);
	strictEqual(
		complexTag.baseType,
		"Map<string, Array<number>>",
		"Should parse complex generic correctly",
	);
	strictEqual(complexTag.name, "DataMap", "Should parse name correctly");
	strictEqual(complexTag.isValid(), true, "Should be valid");
});
