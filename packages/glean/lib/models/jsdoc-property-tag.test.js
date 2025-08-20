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

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocPropertyTag } from "./jsdoc-property-tag.js";

test("JSDocPropertyTag - basic string property", () => {
	const tag = new JSDocPropertyTag("{string} name The user's name");

	strictEqual(tag.tagType, "property", "Should have correct tag type");
	strictEqual(tag.type, "string", "Should parse type correctly");
	strictEqual(tag.name, "name", "Should parse name correctly");
	strictEqual(
		tag.description,
		"The user's name",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid with name");
});

test("JSDocPropertyTag - number property", () => {
	const tag = new JSDocPropertyTag("{number} age User's age in years");

	strictEqual(tag.type, "number", "Should parse type correctly");
	strictEqual(tag.name, "age", "Should parse name correctly");
	strictEqual(
		tag.description,
		"User's age in years",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPropertyTag - boolean property", () => {
	const tag = new JSDocPropertyTag("{boolean} active Whether user is active");

	strictEqual(tag.type, "boolean", "Should parse type correctly");
	strictEqual(tag.name, "active", "Should parse name correctly");
	strictEqual(
		tag.description,
		"Whether user is active",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPropertyTag - complex union type", () => {
	const tag = new JSDocPropertyTag(
		"{(string|number|null)} value The input value",
	);

	strictEqual(
		tag.type,
		"(string|number|null)",
		"Should parse complex type correctly",
	);
	strictEqual(tag.name, "value", "Should parse name correctly");
	strictEqual(
		tag.description,
		"The input value",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPropertyTag - array type", () => {
	const tag = new JSDocPropertyTag("{string[]} items List of item names");

	strictEqual(tag.type, "string[]", "Should parse array type correctly");
	strictEqual(tag.name, "items", "Should parse name correctly");
	strictEqual(
		tag.description,
		"List of item names",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPropertyTag - object type", () => {
	const tag = new JSDocPropertyTag(
		"{Object.<string, number>} map String to number mapping",
	);

	strictEqual(
		tag.type,
		"Object.<string, number>",
		"Should parse object type correctly",
	);
	strictEqual(tag.name, "map", "Should parse name correctly");
	strictEqual(
		tag.description,
		"String to number mapping",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPropertyTag - function property", () => {
	const tag = new JSDocPropertyTag(
		"{function(string): boolean} validate Validation function",
	);

	strictEqual(
		tag.type,
		"function(string): boolean",
		"Should parse function type correctly",
	);
	strictEqual(tag.name, "validate", "Should parse name correctly");
	strictEqual(
		tag.description,
		"Validation function",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPropertyTag - property without type", () => {
	const tag = new JSDocPropertyTag("callback The callback function");

	strictEqual(tag.type, "", "Should have empty type");
	strictEqual(tag.name, "callback", "Should parse name correctly");
	strictEqual(
		tag.description,
		"The callback function",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid with name only");
});

test("JSDocPropertyTag - property without description", () => {
	const tag = new JSDocPropertyTag("{Array} items");

	strictEqual(tag.type, "Array", "Should parse type correctly");
	strictEqual(tag.name, "items", "Should parse name correctly");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid without description");
});

test("JSDocPropertyTag - empty content validation", () => {
	const emptyTag = new JSDocPropertyTag("");
	strictEqual(
		emptyTag.isValid(),
		false,
		"Should be invalid with empty content",
	);

	const whitespaceTag = new JSDocPropertyTag("   ");
	strictEqual(
		whitespaceTag.isValid(),
		false,
		"Should be invalid with whitespace only",
	);
});

test("JSDocPropertyTag - malformed content handling", () => {
	const malformedTag = new JSDocPropertyTag("{string incomplete");

	strictEqual(malformedTag.type, "", "Should handle malformed type gracefully");
	strictEqual(malformedTag.name, "", "Should handle malformed name gracefully");
	strictEqual(
		malformedTag.description,
		"{string incomplete",
		"Should use content as description",
	);
	strictEqual(
		malformedTag.isValid(),
		false,
		"Should be invalid without proper name",
	);
});

test("JSDocPropertyTag - property name only", () => {
	const nameOnlyTag = new JSDocPropertyTag("url");

	strictEqual(nameOnlyTag.type, "", "Should have empty type");
	strictEqual(nameOnlyTag.name, "url", "Should parse name correctly");
	strictEqual(nameOnlyTag.description, "", "Should have empty description");
	strictEqual(nameOnlyTag.isValid(), true, "Should be valid with name only");
});

test("JSDocPropertyTag - whitespace handling", () => {
	const spacedTag = new JSDocPropertyTag(
		"  {  string  }   name   The user name  ",
	);

	strictEqual(spacedTag.type, "string", "Should trim type whitespace");
	strictEqual(spacedTag.name, "name", "Should trim name whitespace");
	strictEqual(
		spacedTag.description,
		"The user name",
		"Should trim description whitespace",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocPropertyTag - serialization", () => {
	const tag = new JSDocPropertyTag("{string} name The property name");
	const json = tag.toJSON();

	deepStrictEqual(
		json,
		{
			__type: "property",
			__data: {
				tagType: "property",
				rawContent: "{string} name The property name",
				type: "string",
				name: "name",
				description: "The property name",
			},
		},
		"Should serialize correctly",
	);
});

test("JSDocPropertyTag - HTML output", () => {
	const typedProperty = new JSDocPropertyTag("{string} name User name");
	strictEqual(
		typedProperty.toHTML(),
		'<li class="property-item"><span class="property-type">{string}</span><code class="property-name">name</code>- User name</li>',
		"Should generate correct HTML for typed property",
	);

	const untypedProperty = new JSDocPropertyTag("callback");
	strictEqual(
		untypedProperty.toHTML(),
		'<li class="property-item"><code class="property-name">callback</code></li>',
		"Should generate correct HTML for untyped property",
	);

	const noDescProperty = new JSDocPropertyTag("{number} count");
	strictEqual(
		noDescProperty.toHTML(),
		'<li class="property-item"><span class="property-type">{number}</span><code class="property-name">count</code></li>',
		"Should generate correct HTML for property without description",
	);
});

test("JSDocPropertyTag - Markdown output", () => {
	const typedProperty = new JSDocPropertyTag("{string} name User name");
	strictEqual(
		typedProperty.toMarkdown(),
		"- {string} `name` - User name",
		"Should generate correct Markdown for typed property",
	);

	const untypedProperty = new JSDocPropertyTag("callback");
	strictEqual(
		untypedProperty.toMarkdown(),
		"- `callback`",
		"Should generate correct Markdown for untyped property",
	);

	const noDescProperty = new JSDocPropertyTag("{number} count");
	strictEqual(
		noDescProperty.toMarkdown(),
		"- {number} `count`",
		"Should generate correct Markdown for property without description",
	);
});

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
