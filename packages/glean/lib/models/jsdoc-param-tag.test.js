/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocParamTag } from "./jsdoc-param-tag.js";

test("JSDocParamTag - basic required parameter", () => {
	const tag = new JSDocParamTag("{string} name The user's name");

	strictEqual(tag.tagType, "param", "Should have correct tag type");
	strictEqual(tag.type, "string", "Should parse type correctly");
	strictEqual(tag.name, "name", "Should parse name correctly");
	strictEqual(tag.optional, false, "Should not be optional");
	strictEqual(tag.defaultValue, "", "Should have no default value");
	strictEqual(
		tag.description,
		"The user's name",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid with name");
});

test("JSDocParamTag - optional parameter without default", () => {
	const tag = new JSDocParamTag("{number} [count] Number of iterations");

	strictEqual(tag.type, "number", "Should parse type correctly");
	strictEqual(tag.name, "count", "Should parse bracketed name correctly");
	strictEqual(tag.optional, true, "Should be optional");
	strictEqual(tag.defaultValue, "", "Should have no default value");
	strictEqual(
		tag.description,
		"Number of iterations",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocParamTag - optional parameter with default value", () => {
	const tag = new JSDocParamTag(
		"{boolean} [enabled=true] Whether feature is enabled",
	);

	strictEqual(tag.type, "boolean", "Should parse type correctly");
	strictEqual(tag.name, "enabled", "Should parse name correctly");
	strictEqual(tag.optional, true, "Should be optional");
	strictEqual(tag.defaultValue, "true", "Should parse default value");
	strictEqual(
		tag.description,
		"Whether feature is enabled",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocParamTag - complex union type", () => {
	const tag = new JSDocParamTag("{(string|number|null)} value The input value");

	strictEqual(
		tag.type,
		"(string|number|null)",
		"Should parse complex type correctly",
	);
	strictEqual(tag.name, "value", "Should parse name correctly");
	strictEqual(tag.optional, false, "Should not be optional");
	strictEqual(
		tag.description,
		"The input value",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocParamTag - parameter without type", () => {
	const tag = new JSDocParamTag("callback The callback function");

	strictEqual(tag.type, "", "Should have empty type");
	strictEqual(tag.name, "callback", "Should parse name correctly");
	strictEqual(tag.optional, false, "Should not be optional");
	strictEqual(
		tag.description,
		"The callback function",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid with name only");
});

test("JSDocParamTag - parameter without description", () => {
	const tag = new JSDocParamTag("{Array} items");

	strictEqual(tag.type, "Array", "Should parse type correctly");
	strictEqual(tag.name, "items", "Should parse name correctly");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocParamTag - empty content validation", () => {
	const emptyTag = new JSDocParamTag("");
	strictEqual(
		emptyTag.isValid(),
		false,
		"Should be invalid with empty content",
	);

	const whitespaceTag = new JSDocParamTag("   ");
	strictEqual(
		whitespaceTag.isValid(),
		false,
		"Should be invalid with whitespace only",
	);
});

test("JSDocParamTag - malformed content handling", () => {
	const malformedTag = new JSDocParamTag("{string");

	strictEqual(malformedTag.type, "", "Should handle malformed type gracefully");
	strictEqual(malformedTag.name, "", "Should handle malformed name gracefully");
	strictEqual(malformedTag.isValid(), false, "Should be invalid");
});

test("JSDocParamTag - serialization", () => {
	const tag = new JSDocParamTag(
		"{string} [name=defaultName] The parameter name",
	);
	const json = tag.toJSON();

	deepStrictEqual(
		json,
		{
			__type: "param",
			__data: {
				tagType: "param",
				rawContent: "{string} [name=defaultName] The parameter name",
				type: "string",
				name: "name",
				optional: true,
				defaultValue: "defaultName",
				description: "The parameter name",
			},
		},
		"Should serialize correctly",
	);
});

test("JSDocParamTag - HTML output", () => {
	const requiredTag = new JSDocParamTag("{string} name User name");
	strictEqual(
		requiredTag.toHTML(),
		'<li class="param-item"><span class="param-type">{string}</span><code class="param-name">name</code>- User name</li>',
		"Should generate correct HTML for required parameter",
	);

	const optionalTag = new JSDocParamTag("{number} [count=5] Iteration count");
	strictEqual(
		optionalTag.toHTML(),
		'<li class="param-item"><span class="param-type">{number}</span><code class="param-name">count</code><em>(optional)</em><span class="param-default">= 5</span>- Iteration count</li>',
		"Should generate correct HTML for optional parameter with default",
	);

	const minimalTag = new JSDocParamTag("callback");
	strictEqual(
		minimalTag.toHTML(),
		'<li class="param-item"><code class="param-name">callback</code></li>',
		"Should generate correct HTML for minimal parameter",
	);
});

test("JSDocParamTag - Markdown output", () => {
	const requiredTag = new JSDocParamTag("{string} name User name");
	strictEqual(
		requiredTag.toMarkdown(),
		"- {string} `name` - User name",
		"Should generate correct Markdown for required parameter",
	);

	const optionalTag = new JSDocParamTag("{number} [count=5] Iteration count");
	strictEqual(
		optionalTag.toMarkdown(),
		"- {number} `count` *(optional)* = 5 - Iteration count",
		"Should generate correct Markdown for optional parameter with default",
	);

	const minimalTag = new JSDocParamTag("callback");
	strictEqual(
		minimalTag.toMarkdown(),
		"- `callback`",
		"Should generate correct Markdown for minimal parameter",
	);
});

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
