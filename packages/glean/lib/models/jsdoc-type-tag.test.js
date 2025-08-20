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

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocTypeTag } from "./jsdoc-type-tag.js";

test("JSDocTypeTag - basic string type", () => {
	const tag = new JSDocTypeTag("{string}");

	strictEqual(tag.tagType, "type", "Should have correct tag type");
	strictEqual(tag.type, "string", "Should parse simple type correctly");
	strictEqual(tag.isValid(), true, "Should be valid with type");
});

test("JSDocTypeTag - basic number type", () => {
	const tag = new JSDocTypeTag("{number}");

	strictEqual(tag.type, "number", "Should parse number type correctly");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - basic boolean type", () => {
	const tag = new JSDocTypeTag("{boolean}");

	strictEqual(tag.type, "boolean", "Should parse boolean type correctly");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - complex union type", () => {
	const tag = new JSDocTypeTag("{(string|number|null)}");

	strictEqual(
		tag.type,
		"(string|number|null)",
		"Should parse union type correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - array type with generics", () => {
	const tag = new JSDocTypeTag("{Array.<string>}");

	strictEqual(tag.type, "Array.<string>", "Should parse array type correctly");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - array type with shorthand", () => {
	const tag = new JSDocTypeTag("{string[]}");

	strictEqual(tag.type, "string[]", "Should parse array shorthand correctly");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - object type", () => {
	const tag = new JSDocTypeTag("{Object.<string, number>}");

	strictEqual(
		tag.type,
		"Object.<string, number>",
		"Should parse object type correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - promise type", () => {
	const tag = new JSDocTypeTag("{Promise<string>}");

	strictEqual(
		tag.type,
		"Promise<string>",
		"Should parse promise type correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - nullable type", () => {
	const tag = new JSDocTypeTag("{?string}");

	strictEqual(tag.type, "?string", "Should parse nullable type correctly");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - non-nullable type", () => {
	const tag = new JSDocTypeTag("{!Object}");

	strictEqual(tag.type, "!Object", "Should parse non-nullable type correctly");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - any type", () => {
	const tag = new JSDocTypeTag("{*}");

	strictEqual(tag.type, "*", "Should parse any type correctly");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - unknown type", () => {
	const tag = new JSDocTypeTag("{?}");

	strictEqual(tag.type, "?", "Should parse unknown type correctly");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - function type", () => {
	const tag = new JSDocTypeTag("{function(string, boolean): number}");

	strictEqual(
		tag.type,
		"function(string, boolean): number",
		"Should parse function type correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - class reference type", () => {
	const tag = new JSDocTypeTag("{HTMLElement}");

	strictEqual(tag.type, "HTMLElement", "Should parse class type correctly");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - namespaced type", () => {
	const tag = new JSDocTypeTag("{MyNamespace.MyClass}");

	strictEqual(
		tag.type,
		"MyNamespace.MyClass",
		"Should parse namespaced type correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - empty content validation", () => {
	const emptyTag = new JSDocTypeTag("");
	strictEqual(
		emptyTag.isValid(),
		false,
		"Should be invalid with empty content",
	);

	const whitespaceTag = new JSDocTypeTag("   ");
	strictEqual(
		whitespaceTag.isValid(),
		false,
		"Should be invalid with whitespace only",
	);
});

test("JSDocTypeTag - malformed content handling", () => {
	const malformedTag = new JSDocTypeTag("{string incomplete");

	strictEqual(
		malformedTag.type,
		"{string incomplete",
		"Should handle malformed type gracefully",
	);
	strictEqual(
		malformedTag.isValid(),
		true,
		"Should be valid (treats as raw type)",
	);
});

test("JSDocTypeTag - missing braces handling", () => {
	const noBracesTag = new JSDocTypeTag("string");

	strictEqual(
		noBracesTag.type,
		"string",
		"Should handle missing braces gracefully",
	);
	strictEqual(noBracesTag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - whitespace handling", () => {
	const spacedTag = new JSDocTypeTag("  {  string  }  ");

	strictEqual(spacedTag.type, "string", "Should trim whitespace correctly");
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocTypeTag - serialization", () => {
	const tag = new JSDocTypeTag("{HTMLElement}");
	const json = tag.toJSON();

	deepStrictEqual(
		json,
		{
			__type: "type",
			__data: {
				tagType: "type",
				rawContent: "{HTMLElement}",
				type: "HTMLElement",
			},
		},
		"Should serialize correctly",
	);
});

test("JSDocTypeTag - HTML output", () => {
	const typeTag = new JSDocTypeTag("{string}");
	strictEqual(
		typeTag.toHTML(),
		'<div class="type-info"><span class="type-annotation">{string}</span></div>',
		"Should generate correct HTML for type",
	);

	const emptyTag = new JSDocTypeTag("");
	strictEqual(
		emptyTag.toHTML(),
		'<div class="type-info"></div>',
		"Should handle empty content gracefully",
	);
});

test("JSDocTypeTag - Markdown output", () => {
	const typeTag = new JSDocTypeTag("{string}");
	strictEqual(
		typeTag.toMarkdown(),
		"**Type:** {string}",
		"Should generate correct Markdown for type",
	);

	const emptyTag = new JSDocTypeTag("");
	strictEqual(
		emptyTag.toMarkdown(),
		"**Type:** ",
		"Should handle empty content gracefully",
	);
});

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
