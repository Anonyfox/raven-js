/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for JSDoc throws tag model
 *
 * Ravens validate exception precision with predatory focus.
 * Comprehensive test coverage for throws parsing, validation, and output.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocThrowsTag } from "./jsdoc-throws-tag.js";

test("JSDocThrowsTag - basic error with description", () => {
	const tag = new JSDocThrowsTag("{TypeError} If input is not a string");

	strictEqual(tag.tagType, "throws", "Should have correct tag type");
	strictEqual(tag.errorType, "TypeError", "Should parse error type correctly");
	strictEqual(
		tag.description,
		"If input is not a string",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid with type and description");
});

test("JSDocThrowsTag - error type only", () => {
	const tag = new JSDocThrowsTag("{Error}");

	strictEqual(tag.errorType, "Error", "Should parse error type correctly");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid with error type only");
});

test("JSDocThrowsTag - description only", () => {
	const tag = new JSDocThrowsTag("When validation fails");

	strictEqual(tag.errorType, "", "Should have empty error type");
	strictEqual(
		tag.description,
		"When validation fails",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid with description only");
});

test("JSDocThrowsTag - custom error types", () => {
	const tag = new JSDocThrowsTag(
		"{ValidationError} When input validation fails",
	);

	strictEqual(
		tag.errorType,
		"ValidationError",
		"Should parse custom error type correctly",
	);
	strictEqual(
		tag.description,
		"When input validation fails",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocThrowsTag - built-in error types", () => {
	const syntaxTag = new JSDocThrowsTag("{SyntaxError} Invalid JSON format");
	strictEqual(
		syntaxTag.errorType,
		"SyntaxError",
		"Should parse SyntaxError correctly",
	);

	const rangeTag = new JSDocThrowsTag("{RangeError} Index out of bounds");
	strictEqual(
		rangeTag.errorType,
		"RangeError",
		"Should parse RangeError correctly",
	);

	const refTag = new JSDocThrowsTag("{ReferenceError} Variable not defined");
	strictEqual(
		refTag.errorType,
		"ReferenceError",
		"Should parse ReferenceError correctly",
	);
});

test("JSDocThrowsTag - async error types", () => {
	const tag = new JSDocThrowsTag(
		"{Promise<Error>} Rejects when network request fails",
	);

	strictEqual(
		tag.errorType,
		"Promise<Error>",
		"Should parse promise error type correctly",
	);
	strictEqual(
		tag.description,
		"Rejects when network request fails",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocThrowsTag - union error types", () => {
	const tag = new JSDocThrowsTag(
		"{(TypeError|ValidationError)} Type or validation error",
	);

	strictEqual(
		tag.errorType,
		"(TypeError|ValidationError)",
		"Should parse union error type correctly",
	);
	strictEqual(
		tag.description,
		"Type or validation error",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocThrowsTag - detailed error conditions", () => {
	const tag = new JSDocThrowsTag(
		"{Error} When file cannot be read due to permission issues or file not found",
	);

	strictEqual(tag.errorType, "Error", "Should parse error type correctly");
	strictEqual(
		tag.description,
		"When file cannot be read due to permission issues or file not found",
		"Should parse long description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocThrowsTag - empty content validation", () => {
	const emptyTag = new JSDocThrowsTag("");
	strictEqual(
		emptyTag.isValid(),
		false,
		"Should be invalid with empty content",
	);

	const whitespaceTag = new JSDocThrowsTag("   ");
	strictEqual(
		whitespaceTag.isValid(),
		false,
		"Should be invalid with whitespace only",
	);
});

test("JSDocThrowsTag - malformed content handling", () => {
	const malformedTag = new JSDocThrowsTag("{Error incomplete");

	strictEqual(
		malformedTag.errorType,
		"",
		"Should handle malformed type gracefully",
	);
	strictEqual(
		malformedTag.description,
		"{Error incomplete",
		"Should treat as description",
	);
	strictEqual(
		malformedTag.isValid(),
		true,
		"Should be valid (treated as description)",
	);
});

test("JSDocThrowsTag - whitespace handling", () => {
	const spacedTag = new JSDocThrowsTag(
		"  {  TypeError  }   Invalid input provided  ",
	);

	strictEqual(
		spacedTag.errorType,
		"TypeError",
		"Should trim error type whitespace",
	);
	strictEqual(
		spacedTag.description,
		"Invalid input provided",
		"Should trim description whitespace",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocThrowsTag - serialization", () => {
	const tag = new JSDocThrowsTag("{TypeError} Invalid input type");
	const json = tag.toJSON();

	deepStrictEqual(
		json,
		{
			__type: "throws",
			__data: {
				tagType: "throws",
				rawContent: "{TypeError} Invalid input type",
				errorType: "TypeError",
				description: "Invalid input type",
			},
		},
		"Should serialize correctly",
	);
});

test("JSDocThrowsTag - HTML output", () => {
	const fullThrows = new JSDocThrowsTag("{TypeError} Invalid input type");
	strictEqual(
		fullThrows.toHTML(),
		'<div class="throws-info"><span class="error-type">{TypeError}</span>-Invalid input type</div>',
		"Should generate correct HTML for type and description",
	);

	const typeOnlyThrows = new JSDocThrowsTag("{Error}");
	strictEqual(
		typeOnlyThrows.toHTML(),
		'<div class="throws-info"><span class="error-type">{Error}</span></div>',
		"Should generate correct HTML for type only",
	);

	const descOnlyThrows = new JSDocThrowsTag("When operation fails");
	strictEqual(
		descOnlyThrows.toHTML(),
		'<div class="throws-info">When operation fails</div>',
		"Should generate correct HTML for description only",
	);

	const emptyThrows = new JSDocThrowsTag("");
	strictEqual(
		emptyThrows.toHTML(),
		'<div class="throws-info"></div>',
		"Should handle empty content gracefully",
	);
});

test("JSDocThrowsTag - Markdown output", () => {
	const fullThrows = new JSDocThrowsTag("{TypeError} Invalid input type");
	strictEqual(
		fullThrows.toMarkdown(),
		"**Throws:** {TypeError} - Invalid input type",
		"Should generate correct Markdown for type and description",
	);

	const typeOnlyThrows = new JSDocThrowsTag("{Error}");
	strictEqual(
		typeOnlyThrows.toMarkdown(),
		"**Throws:** {Error}",
		"Should generate correct Markdown for type only",
	);

	const descOnlyThrows = new JSDocThrowsTag("When operation fails");
	strictEqual(
		descOnlyThrows.toMarkdown(),
		"**Throws:** When operation fails",
		"Should generate correct Markdown for description only",
	);

	const emptyThrows = new JSDocThrowsTag("");
	strictEqual(
		emptyThrows.toMarkdown(),
		"**Throws:** ",
		"Should handle empty content gracefully",
	);
});

test("JSDocThrowsTag - complex error scenarios", () => {
	// Network error with nested details
	const networkTag = new JSDocThrowsTag(
		"{NetworkError} Connection timeout after 30 seconds or server unreachable",
	);
	strictEqual(
		networkTag.errorType,
		"NetworkError",
		"Should parse network error correctly",
	);
	strictEqual(networkTag.isValid(), true, "Should be valid");

	// Multiple conditions in one throws
	const multiTag = new JSDocThrowsTag(
		"{Error} File system error: permission denied, disk full, or path not found",
	);
	strictEqual(multiTag.errorType, "Error", "Should parse error type correctly");
	strictEqual(multiTag.isValid(), true, "Should be valid");

	// Async rejection
	const asyncTag = new JSDocThrowsTag(
		"Promise rejects with network timeout or parsing error",
	);
	strictEqual(asyncTag.errorType, "", "Should have empty error type");
	strictEqual(asyncTag.isValid(), true, "Should be valid with description");
});
