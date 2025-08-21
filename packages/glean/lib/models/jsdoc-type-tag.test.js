/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for JSDoc @type tag model
 *
 * Ravens validate type annotation precision with predatory focus.
 * Comprehensive test coverage for type parsing, validation, and output.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocTypeTag } from "./jsdoc-type-tag.js";

test("JSDocTypeTag - complex type expressions", () => {
	// Record type
	const recordTag = new JSDocTypeTag("{{a: number, b: string}}");
	strictEqual(
		recordTag.type,
		"{a: number, b: string}",
		"Should parse record type correctly",
	);
	strictEqual(recordTag.isValid(), true, "Should be valid");

	// Complex generic
	const complexTag = new JSDocTypeTag("{Map<string, Array<number>>}");
	strictEqual(
		complexTag.type,
		"Map<string, Array<number>>",
		"Should parse complex generic correctly",
	);
	strictEqual(complexTag.isValid(), true, "Should be valid");

	// Optional type
	const optionalTag = new JSDocTypeTag("{string=}");
	strictEqual(
		optionalTag.type,
		"string=",
		"Should parse optional type correctly",
	);
	strictEqual(optionalTag.isValid(), true, "Should be valid");
});
