/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc enum tag model.
 *
 * Ravens test enumeration type documentation with precision.
 * Verifies enum tag parsing, validation, and constant collection indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocEnumTag } from "./jsdoc-enum-tag.js";

test("JSDocEnumTag - type only", () => {
	const tag = new JSDocEnumTag("{string}");

	strictEqual(tag.type, "string", "Should parse type correctly");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocEnumTag - type with description", () => {
	const tag = new JSDocEnumTag("{number} Status codes for HTTP responses");

	strictEqual(tag.type, "number", "Should parse type correctly");
	strictEqual(
		tag.description,
		"Status codes for HTTP responses",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocEnumTag - string enumeration", () => {
	const tag = new JSDocEnumTag("{string} Application state constants");

	strictEqual(tag.type, "string", "Should parse string type");
	strictEqual(
		tag.description,
		"Application state constants",
		"Should parse string enum description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocEnumTag - numeric enumeration", () => {
	const tag = new JSDocEnumTag("{number} Error code enumeration");

	strictEqual(tag.type, "number", "Should parse number type");
	strictEqual(
		tag.description,
		"Error code enumeration",
		"Should parse numeric enum description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocEnumTag - object enumeration", () => {
	const tag = new JSDocEnumTag("{Object} Configuration option objects");

	strictEqual(tag.type, "Object", "Should parse Object type");
	strictEqual(
		tag.description,
		"Configuration option objects",
		"Should parse object enum description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocEnumTag - mixed type enumeration", () => {
	const tag = new JSDocEnumTag("{*} Mixed type constant collection");

	strictEqual(tag.type, "*", "Should parse wildcard type");
	strictEqual(
		tag.description,
		"Mixed type constant collection",
		"Should parse mixed enum description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocEnumTag - complex type enumeration", () => {
	const tag = new JSDocEnumTag(
		"{(string|number)} Union type enumeration values",
	);

	strictEqual(tag.type, "(string|number)", "Should parse complex type");
	strictEqual(
		tag.description,
		"Union type enumeration values",
		"Should parse complex enum description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocEnumTag - nested object type", () => {
	const tag = new JSDocEnumTag(
		"{{name: string, value: number}} Structured enumeration entries",
	);

	strictEqual(
		tag.type,
		"{name: string, value: number}",
		"Should parse nested object type",
	);
	strictEqual(
		tag.description,
		"Structured enumeration entries",
		"Should parse nested object description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocEnumTag - whitespace handling", () => {
	const spacedTag = new JSDocEnumTag(
		"   {string}   Status enumeration constants   ",
	);

	strictEqual(spacedTag.type, "string", "Should trim type whitespace");
	strictEqual(
		spacedTag.description,
		"Status enumeration constants",
		"Should trim description whitespace",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocEnumTag - empty content", () => {
	const tag = new JSDocEnumTag("");

	strictEqual(tag.type, "", "Should have empty type");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), false, "Should be invalid without type");
});

test("JSDocEnumTag - only whitespace", () => {
	const tag = new JSDocEnumTag("   \n\t  ");

	strictEqual(tag.type, "", "Should handle whitespace-only content");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), false, "Should be invalid");
});

test("JSDocEnumTag - description without type", () => {
	const tag = new JSDocEnumTag("Configuration constants");

	strictEqual(tag.type, "", "Should have empty type");
	strictEqual(
		tag.description,
		"Configuration constants",
		"Should parse description",
	);
	strictEqual(tag.isValid(), false, "Should be invalid without type");
});

test("JSDocEnumTag - malformed type braces", () => {
	const tag = new JSDocEnumTag("{string Missing closing brace");

	strictEqual(tag.type, "", "Should handle malformed type");
	strictEqual(
		tag.description,
		"{string Missing closing brace",
		"Should treat as description",
	);
	strictEqual(tag.isValid(), false, "Should be invalid");
});

test("JSDocEnumTag - serialization", () => {
	const tag = new JSDocEnumTag("{string} HTTP method constants");
	const json = tag.toJSON();

	strictEqual(json.__type, "enum", "Should have correct type");
	strictEqual(json.__data.type, "string", "Should serialize type");
	strictEqual(
		json.__data.description,
		"HTTP method constants",
		"Should serialize description",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocEnumTag - serialization without description", () => {
	const tag = new JSDocEnumTag("{number}");
	const json = tag.toJSON();

	strictEqual(json.__type, "enum", "Should have correct type");
	strictEqual(json.__data.type, "number", "Should serialize type");
	strictEqual(
		json.__data.description,
		"",
		"Should serialize empty description",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocEnumTag - HTML output", () => {
	const withDescription = new JSDocEnumTag(
		"{string} Application status constants",
	);

	strictEqual(
		withDescription.toHTML(),
		'<div class="enum-info"><strong class="enum-label">Enum:</strong><code class="enum-type">{string}</code> - Application status constants</div>',
		"Should generate correct HTML with description",
	);

	const withoutDescription = new JSDocEnumTag("{number}");

	strictEqual(
		withoutDescription.toHTML(),
		'<div class="enum-info"><strong class="enum-label">Enum:</strong><code class="enum-type">{number}</code></div>',
		"Should generate correct HTML without description",
	);
});

test("JSDocEnumTag - Markdown output", () => {
	const withDescription = new JSDocEnumTag("{Object} Configuration objects");

	strictEqual(
		withDescription.toMarkdown(),
		"**Enum:** `{Object}` - Configuration objects",
		"Should generate correct Markdown with description",
	);

	const withoutDescription = new JSDocEnumTag("{boolean}");

	strictEqual(
		withoutDescription.toMarkdown(),
		"**Enum:** `{boolean}`",
		"Should generate correct Markdown without description",
	);
});

test("JSDocEnumTag - common enumeration patterns", () => {
	// Status enumerations
	const statusTag = new JSDocEnumTag("{string} HTTP status categories");
	strictEqual(
		statusTag.description,
		"HTTP status categories",
		"Should handle status patterns",
	);
	strictEqual(statusTag.isValid(), true, "Should be valid");

	// Configuration enumerations
	const configTag = new JSDocEnumTag("{Object} Application settings");
	strictEqual(
		configTag.description,
		"Application settings",
		"Should handle config patterns",
	);
	strictEqual(configTag.isValid(), true, "Should be valid");

	// Error code enumerations
	const errorTag = new JSDocEnumTag("{number} System error codes");
	strictEqual(
		errorTag.description,
		"System error codes",
		"Should handle error patterns",
	);
	strictEqual(errorTag.isValid(), true, "Should be valid");
});

test("JSDocEnumTag - edge cases", () => {
	// Very long description
	const longTag = new JSDocEnumTag(
		"{string} This is a very comprehensive enumeration that contains critical application constants including status codes, configuration options, error messages, and system identifiers used throughout the entire application lifecycle",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long descriptions");

	// Single word description
	const shortTag = new JSDocEnumTag("{number} Codes");
	strictEqual(
		shortTag.description,
		"Codes",
		"Should handle single word description",
	);
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Technical description with special formatting
	const techTag = new JSDocEnumTag(
		"{(string|number|boolean)} Multi-type enumeration with union types",
	);
	strictEqual(
		techTag.description,
		"Multi-type enumeration with union types",
		"Should handle technical descriptions",
	);
	strictEqual(techTag.isValid(), true, "Should be valid");

	// Special characters in description
	const specialTag = new JSDocEnumTag(
		"{string} MIME types & file extensions (v2.0) for upload validation",
	);
	strictEqual(specialTag.isValid(), true, "Should handle special characters");
});
