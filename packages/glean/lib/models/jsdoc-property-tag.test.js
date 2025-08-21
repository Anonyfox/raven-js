/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for JSDoc property tag model
 *
 * Ravens validate object property precision with predatory focus.
 * Comprehensive test coverage for property parsing, validation, and output.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocPropertyTag } from "./jsdoc-property-tag.js";

test("JSDocPropertyTag - complex type expressions", () => {
	// Generic type
	const genericTag = new JSDocPropertyTag(
		"{Promise<Array<string>>} data Async string array",
	);
	strictEqual(
		genericTag.type,
		"Promise<Array<string>>",
		"Should parse generic type correctly",
	);
	strictEqual(genericTag.name, "data", "Should parse name correctly");
	strictEqual(genericTag.isValid(), true, "Should be valid");

	// Record type
	const recordTag = new JSDocPropertyTag(
		"{{x: number, y: number}} position Object position",
	);
	strictEqual(
		recordTag.type,
		"{x: number, y: number}",
		"Should parse record type correctly",
	);
	strictEqual(recordTag.name, "position", "Should parse name correctly");
	strictEqual(recordTag.isValid(), true, "Should be valid");

	// Nullable type
	const nullableTag = new JSDocPropertyTag("{?string} title Optional title");
	strictEqual(
		nullableTag.type,
		"?string",
		"Should parse nullable type correctly",
	);
	strictEqual(nullableTag.name, "title", "Should parse name correctly");
	strictEqual(nullableTag.isValid(), true, "Should be valid");
});
