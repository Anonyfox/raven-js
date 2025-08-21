/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocParamTag } from "./jsdoc-param-tag.js";

test("JSDocParamTag - edge cases", () => {
	// Parameter with spaces in default value
	const spacedDefault = new JSDocParamTag(
		"{string} [message=Hello World] The message",
	);
	strictEqual(spacedDefault.name, "message", "Should parse name correctly");
	strictEqual(
		spacedDefault.defaultValue,
		"Hello World",
		"Should handle spaced default values",
	);

	// Parameter with complex type and no description
	const complexType = new JSDocParamTag("{Array.<string>} items");
	strictEqual(
		complexType.type,
		"Array.<string>",
		"Should parse complex type syntax",
	);
	strictEqual(complexType.name, "items", "Should parse name correctly");
	strictEqual(complexType.description, "", "Should handle missing description");

	// Only type, no name
	const typeOnly = new JSDocParamTag("{Function}");
	strictEqual(typeOnly.type, "Function", "Should parse type");
	strictEqual(typeOnly.name, "", "Should have empty name");
	strictEqual(typeOnly.isValid(), false, "Should be invalid without name");
});
