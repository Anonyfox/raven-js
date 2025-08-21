/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocReturnsTag } from "./jsdoc-returns-tag.js";

test("JSDocReturnsTag - edge cases with spacing", () => {
	// Extra whitespace handling
	const spacedTag = new JSDocReturnsTag("  {  string  }   The spaced result  ");
	strictEqual(spacedTag.type, "string", "Should trim type whitespace");
	strictEqual(
		spacedTag.description,
		"The spaced result",
		"Should trim description whitespace",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");

	// Multiple spaces in description
	const multiSpaceTag = new JSDocReturnsTag(
		"{number} The   multi   spaced   description",
	);
	strictEqual(
		multiSpaceTag.description,
		"The   multi   spaced   description",
		"Should preserve internal spacing",
	);
});
