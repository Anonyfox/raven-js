/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocReturnsTag } from "./jsdoc-returns-tag.js";

test("JSDocReturnsTag - typed return with description", () => {
	const tag = new JSDocReturnsTag("{boolean} True if operation succeeded");

	strictEqual(tag.tagType, "returns", "Should have correct tag type");
	strictEqual(tag.type, "boolean", "Should parse type correctly");
	strictEqual(
		tag.description,
		"True if operation succeeded",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid with type and description");
});

test("JSDocReturnsTag - type only, no description", () => {
	const tag = new JSDocReturnsTag("{string}");

	strictEqual(tag.type, "string", "Should parse type correctly");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid with type only");
});

test("JSDocReturnsTag - description only, no type", () => {
	const tag = new JSDocReturnsTag("The processed result");

	strictEqual(tag.type, "", "Should have empty type");
	strictEqual(
		tag.description,
		"The processed result",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid with description only");
});

test("JSDocReturnsTag - complex union type", () => {
	const tag = new JSDocReturnsTag("{(string|number|null)} The converted value");

	strictEqual(
		tag.type,
		"(string|number|null)",
		"Should parse complex type correctly",
	);
	strictEqual(
		tag.description,
		"The converted value",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReturnsTag - array type syntax", () => {
	const tag = new JSDocReturnsTag("{Array.<Object>} List of processed items");

	strictEqual(tag.type, "Array.<Object>", "Should parse array type correctly");
	strictEqual(
		tag.description,
		"List of processed items",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReturnsTag - promise type", () => {
	const tag = new JSDocReturnsTag(
		"{Promise<string>} Resolves to result string",
	);

	strictEqual(
		tag.type,
		"Promise<string>",
		"Should parse promise type correctly",
	);
	strictEqual(
		tag.description,
		"Resolves to result string",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReturnsTag - empty content validation", () => {
	const emptyTag = new JSDocReturnsTag("");
	strictEqual(
		emptyTag.isValid(),
		false,
		"Should be invalid with empty content",
	);

	const whitespaceTag = new JSDocReturnsTag("   ");
	strictEqual(
		whitespaceTag.isValid(),
		false,
		"Should be invalid with whitespace only",
	);
});

test("JSDocReturnsTag - malformed type handling", () => {
	const malformedTag = new JSDocReturnsTag("{string incomplete");

	strictEqual(malformedTag.type, "", "Should handle malformed type gracefully");
	strictEqual(
		malformedTag.description,
		"{string incomplete",
		"Should treat as description",
	);
	strictEqual(
		malformedTag.isValid(),
		true,
		"Should be valid (treated as description)",
	);
});

test("JSDocReturnsTag - only whitespace in braces", () => {
	const tag = new JSDocReturnsTag("{} Some description");

	strictEqual(
		tag.type,
		"",
		"Should have empty type for whitespace-only braces",
	);
	strictEqual(
		tag.description,
		"Some description",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid with description");
});

test("JSDocReturnsTag - serialization", () => {
	const tag = new JSDocReturnsTag("{boolean} Success indicator");
	const json = tag.toJSON();

	deepStrictEqual(
		json,
		{
			__type: "returns",
			__data: {
				tagType: "returns",
				rawContent: "{boolean} Success indicator",
				type: "boolean",
				description: "Success indicator",
			},
		},
		"Should serialize correctly",
	);
});

test("JSDocReturnsTag - HTML output variations", () => {
	// Type and description
	const fullTag = new JSDocReturnsTag("{string} The result");
	strictEqual(
		fullTag.toHTML(),
		'<div class="return-info"><span class="return-type">{string}</span>-The result</div>',
		"Should generate correct HTML for type and description",
	);

	// Type only
	const typeOnlyTag = new JSDocReturnsTag("{boolean}");
	strictEqual(
		typeOnlyTag.toHTML(),
		'<div class="return-info"><span class="return-type">{boolean}</span></div>',
		"Should generate correct HTML for type only",
	);

	// Description only
	const descOnlyTag = new JSDocReturnsTag("Success status");
	strictEqual(
		descOnlyTag.toHTML(),
		'<div class="return-info">Success status</div>',
		"Should generate correct HTML for description only",
	);

	// Empty (should not occur with valid tags, but test defensive code)
	const emptyTag = new JSDocReturnsTag("");
	strictEqual(
		emptyTag.toHTML(),
		'<div class="return-info"></div>',
		"Should handle empty content gracefully",
	);
});

test("JSDocReturnsTag - Markdown output variations", () => {
	// Type and description
	const fullTag = new JSDocReturnsTag("{string} The result");
	strictEqual(
		fullTag.toMarkdown(),
		"**Returns:** {string} - The result",
		"Should generate correct Markdown for type and description",
	);

	// Type only
	const typeOnlyTag = new JSDocReturnsTag("{boolean}");
	strictEqual(
		typeOnlyTag.toMarkdown(),
		"**Returns:** {boolean}",
		"Should generate correct Markdown for type only",
	);

	// Description only
	const descOnlyTag = new JSDocReturnsTag("Success status");
	strictEqual(
		descOnlyTag.toMarkdown(),
		"**Returns:** Success status",
		"Should generate correct Markdown for description only",
	);

	// Empty
	const emptyTag = new JSDocReturnsTag("");
	strictEqual(
		emptyTag.toMarkdown(),
		"**Returns:** ",
		"Should handle empty content gracefully",
	);
});

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
