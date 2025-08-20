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

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocTypedefTag } from "./jsdoc-typedef-tag.js";

test("JSDocTypedefTag - basic object typedef", () => {
	const tag = new JSDocTypedefTag("{Object} Config Configuration object");

	strictEqual(tag.tagType, "typedef", "Should have correct tag type");
	strictEqual(tag.baseType, "Object", "Should parse base type correctly");
	strictEqual(tag.name, "Config", "Should parse name correctly");
	strictEqual(
		tag.description,
		"Configuration object",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid with name");
});

test("JSDocTypedefTag - function typedef", () => {
	const tag = new JSDocTypedefTag(
		"{function(string, number): boolean} Validator Function that validates input",
	);

	strictEqual(
		tag.baseType,
		"function(string, number): boolean",
		"Should parse function type correctly",
	);
	strictEqual(tag.name, "Validator", "Should parse name correctly");
	strictEqual(
		tag.description,
		"Function that validates input",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypedefTag - generic object typedef", () => {
	const tag = new JSDocTypedefTag(
		"{Object.<string, number>} StringNumberMap Map with string keys and number values",
	);

	strictEqual(
		tag.baseType,
		"Object.<string, number>",
		"Should parse generic object type correctly",
	);
	strictEqual(tag.name, "StringNumberMap", "Should parse name correctly");
	strictEqual(
		tag.description,
		"Map with string keys and number values",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypedefTag - array typedef", () => {
	const tag = new JSDocTypedefTag(
		"{Array.<User>} UserList List of user objects",
	);

	strictEqual(
		tag.baseType,
		"Array.<User>",
		"Should parse array type correctly",
	);
	strictEqual(tag.name, "UserList", "Should parse name correctly");
	strictEqual(
		tag.description,
		"List of user objects",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypedefTag - union type typedef", () => {
	const tag = new JSDocTypedefTag(
		"{(string|number|null)} ID Identifier that can be string, number, or null",
	);

	strictEqual(
		tag.baseType,
		"(string|number|null)",
		"Should parse union type correctly",
	);
	strictEqual(tag.name, "ID", "Should parse name correctly");
	strictEqual(
		tag.description,
		"Identifier that can be string, number, or null",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypedefTag - promise typedef", () => {
	const tag = new JSDocTypedefTag(
		"{Promise<Response>} APICall Async API call that returns response",
	);

	strictEqual(
		tag.baseType,
		"Promise<Response>",
		"Should parse promise type correctly",
	);
	strictEqual(tag.name, "APICall", "Should parse name correctly");
	strictEqual(
		tag.description,
		"Async API call that returns response",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypedefTag - typedef without description", () => {
	const tag = new JSDocTypedefTag("{Object} Config");

	strictEqual(tag.baseType, "Object", "Should parse base type correctly");
	strictEqual(tag.name, "Config", "Should parse name correctly");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid without description");
});

test("JSDocTypedefTag - typedef without base type", () => {
	const tag = new JSDocTypedefTag("Config Configuration object");

	strictEqual(tag.baseType, "", "Should have empty base type");
	strictEqual(tag.name, "Config", "Should parse name correctly");
	strictEqual(
		tag.description,
		"Configuration object",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid without base type");
});

test("JSDocTypedefTag - name only typedef", () => {
	const tag = new JSDocTypedefTag("Config");

	strictEqual(tag.baseType, "", "Should have empty base type");
	strictEqual(tag.name, "Config", "Should parse name correctly");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid with name only");
});

test("JSDocTypedefTag - empty content validation", () => {
	const emptyTag = new JSDocTypedefTag("");
	strictEqual(
		emptyTag.isValid(),
		false,
		"Should be invalid with empty content",
	);

	const whitespaceTag = new JSDocTypedefTag("   ");
	strictEqual(
		whitespaceTag.isValid(),
		false,
		"Should be invalid with whitespace only",
	);
});

test("JSDocTypedefTag - malformed content handling", () => {
	const malformedTag = new JSDocTypedefTag("{Object incomplete");

	strictEqual(
		malformedTag.baseType,
		"",
		"Should handle malformed type gracefully",
	);
	strictEqual(malformedTag.name, "", "Should handle malformed name gracefully");
	strictEqual(
		malformedTag.description,
		"{Object incomplete",
		"Should use content as description",
	);
	strictEqual(
		malformedTag.isValid(),
		false,
		"Should be invalid without proper name",
	);
});

test("JSDocTypedefTag - whitespace handling", () => {
	const spacedTag = new JSDocTypedefTag(
		"  {  Object  }   Config   Configuration object  ",
	);

	strictEqual(spacedTag.baseType, "Object", "Should trim base type whitespace");
	strictEqual(spacedTag.name, "Config", "Should trim name whitespace");
	strictEqual(
		spacedTag.description,
		"Configuration object",
		"Should trim description whitespace",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocTypedefTag - serialization", () => {
	const tag = new JSDocTypedefTag("{Object} Config Configuration object");
	const json = tag.toJSON();

	deepStrictEqual(
		json,
		{
			__type: "typedef",
			__data: {
				tagType: "typedef",
				rawContent: "{Object} Config Configuration object",
				baseType: "Object",
				name: "Config",
				description: "Configuration object",
			},
		},
		"Should serialize correctly",
	);
});

test("JSDocTypedefTag - HTML output", () => {
	const fullTypedef = new JSDocTypedefTag(
		"{Object} Config Configuration object",
	);
	strictEqual(
		fullTypedef.toHTML(),
		'<div class="typedef-info"><span class="typedef-base">{Object}</span><strong class="typedef-name">Config</strong>- Configuration object</div>',
		"Should generate correct HTML for full typedef",
	);

	const nameOnlyTypedef = new JSDocTypedefTag("Config");
	strictEqual(
		nameOnlyTypedef.toHTML(),
		'<div class="typedef-info"><strong class="typedef-name">Config</strong></div>',
		"Should generate correct HTML for name-only typedef",
	);

	const noDescTypedef = new JSDocTypedefTag("{Object} Config");
	strictEqual(
		noDescTypedef.toHTML(),
		'<div class="typedef-info"><span class="typedef-base">{Object}</span><strong class="typedef-name">Config</strong></div>',
		"Should generate correct HTML for typedef without description",
	);
});

test("JSDocTypedefTag - Markdown output", () => {
	const fullTypedef = new JSDocTypedefTag(
		"{Object} Config Configuration object",
	);
	strictEqual(
		fullTypedef.toMarkdown(),
		"{Object} **Config** - Configuration object",
		"Should generate correct Markdown for full typedef",
	);

	const nameOnlyTypedef = new JSDocTypedefTag("Config");
	strictEqual(
		nameOnlyTypedef.toMarkdown(),
		"**Config**",
		"Should generate correct Markdown for name-only typedef",
	);

	const noDescTypedef = new JSDocTypedefTag("{Object} Config");
	strictEqual(
		noDescTypedef.toMarkdown(),
		"{Object} **Config**",
		"Should generate correct Markdown for typedef without description",
	);
});

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
