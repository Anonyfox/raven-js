/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc see tag model.
 *
 * Ravens test cross-reference documentation with precision.
 * Verifies see tag parsing, validation, and reference linking.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocSeeTag } from "./jsdoc-see-tag.js";

test("JSDocSeeTag - simple symbol reference", () => {
	const tag = new JSDocSeeTag("MyFunction");

	strictEqual(tag.referenceType, "symbol", "Should be symbol reference");
	strictEqual(tag.reference, "MyFunction", "Should parse symbol reference");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.url, "", "Should have empty URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - namespaced symbol reference", () => {
	const tag = new JSDocSeeTag("Namespace.ClassName.methodName");

	strictEqual(tag.referenceType, "symbol", "Should be symbol reference");
	strictEqual(
		tag.reference,
		"Namespace.ClassName.methodName",
		"Should parse namespaced reference",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.url, "", "Should have empty URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - URL reference", () => {
	const tag = new JSDocSeeTag("https://example.com/docs");

	strictEqual(tag.referenceType, "url", "Should be URL reference");
	strictEqual(tag.reference, "https://example.com/docs", "Should parse URL");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.url, "https://example.com/docs", "Should set URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - HTTP URL reference", () => {
	const tag = new JSDocSeeTag("http://legacy.example.com/api");

	strictEqual(tag.referenceType, "url", "Should be URL reference");
	strictEqual(
		tag.reference,
		"http://legacy.example.com/api",
		"Should parse HTTP URL",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.url, "http://legacy.example.com/api", "Should set URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - link syntax without description", () => {
	const tag = new JSDocSeeTag("{@link https://github.com/user/repo}");

	strictEqual(tag.referenceType, "link", "Should be link reference");
	strictEqual(
		tag.reference,
		"https://github.com/user/repo",
		"Should parse link URL",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.url, "https://github.com/user/repo", "Should set URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - link syntax with description", () => {
	const tag = new JSDocSeeTag(
		"{@link https://ravenjs.dev|RavenJS Documentation}",
	);

	strictEqual(tag.referenceType, "link", "Should be link reference");
	strictEqual(tag.reference, "https://ravenjs.dev", "Should parse link URL");
	strictEqual(
		tag.description,
		"RavenJS Documentation",
		"Should parse description",
	);
	strictEqual(tag.url, "https://ravenjs.dev", "Should set URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - link syntax with symbol reference", () => {
	const tag = new JSDocSeeTag("{@link MyClass|Custom Description}");

	strictEqual(tag.referenceType, "link", "Should be link reference");
	strictEqual(tag.reference, "MyClass", "Should parse symbol reference");
	strictEqual(
		tag.description,
		"Custom Description",
		"Should parse description",
	);
	strictEqual(tag.url, "", "Should have empty URL for symbol");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - link syntax without @ prefix", () => {
	const tag = new JSDocSeeTag("{link https://example.com|Example Site}");

	strictEqual(tag.referenceType, "link", "Should be link reference");
	strictEqual(tag.reference, "https://example.com", "Should parse URL");
	strictEqual(tag.description, "Example Site", "Should parse description");
	strictEqual(tag.url, "https://example.com", "Should set URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - module reference", () => {
	const tag = new JSDocSeeTag("module:fs");

	strictEqual(tag.referenceType, "module", "Should be module reference");
	strictEqual(tag.reference, "module:fs", "Should parse module reference");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.url, "", "Should have empty URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - complex module reference", () => {
	const tag = new JSDocSeeTag("module:@raven-js/beak");

	strictEqual(tag.referenceType, "module", "Should be module reference");
	strictEqual(
		tag.reference,
		"module:@raven-js/beak",
		"Should parse scoped module",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.url, "", "Should have empty URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - quoted text reference", () => {
	const tag = new JSDocSeeTag('"Related concepts in the user manual"');

	strictEqual(tag.referenceType, "text", "Should be text reference");
	strictEqual(
		tag.reference,
		"Related concepts in the user manual",
		"Should parse text content",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.url, "", "Should have empty URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - single quoted text reference", () => {
	const tag = new JSDocSeeTag("'API Reference Guide'");

	strictEqual(tag.referenceType, "text", "Should be text reference");
	strictEqual(
		tag.reference,
		"API Reference Guide",
		"Should parse text content",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.url, "", "Should have empty URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - whitespace handling", () => {
	const spacedTag = new JSDocSeeTag("   MyUtilFunction   ");

	strictEqual(spacedTag.referenceType, "symbol", "Should be symbol reference");
	strictEqual(
		spacedTag.reference,
		"MyUtilFunction",
		"Should trim reference whitespace",
	);
	strictEqual(spacedTag.description, "", "Should have empty description");
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - link with whitespace", () => {
	const linkTag = new JSDocSeeTag(
		"  {@link https://example.com | Example Documentation }  ",
	);

	strictEqual(linkTag.referenceType, "link", "Should be link reference");
	strictEqual(linkTag.reference, "https://example.com", "Should trim URL");
	strictEqual(
		linkTag.description,
		"Example Documentation",
		"Should trim description",
	);
	strictEqual(linkTag.url, "https://example.com", "Should set URL");
	strictEqual(linkTag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - empty content", () => {
	const tag = new JSDocSeeTag("");

	strictEqual(tag.referenceType, "empty", "Should be empty reference");
	strictEqual(tag.reference, "", "Should have empty reference");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.url, "", "Should have empty URL");
	strictEqual(tag.isValid(), false, "Should be invalid without content");
});

test("JSDocSeeTag - only whitespace", () => {
	const tag = new JSDocSeeTag("   \n\t  ");

	strictEqual(tag.referenceType, "empty", "Should be empty reference");
	strictEqual(tag.reference, "", "Should handle whitespace-only content");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.url, "", "Should have empty URL");
	strictEqual(tag.isValid(), false, "Should be invalid");
});

test("JSDocSeeTag - malformed link syntax", () => {
	const tag = new JSDocSeeTag("{@link incomplete");

	strictEqual(tag.referenceType, "symbol", "Should fallback to symbol");
	strictEqual(tag.reference, "{@link incomplete", "Should treat as symbol");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.url, "", "Should have empty URL");
	strictEqual(tag.isValid(), true, "Should be valid as symbol");
});

test("JSDocSeeTag - serialization", () => {
	const tag = new JSDocSeeTag("{@link https://ravenjs.dev|RavenJS}");
	const json = tag.toJSON();

	strictEqual(json.__type, "see", "Should have correct type");
	strictEqual(json.__data.referenceType, "link", "Should serialize type");
	strictEqual(
		json.__data.reference,
		"https://ravenjs.dev",
		"Should serialize reference",
	);
	strictEqual(
		json.__data.description,
		"RavenJS",
		"Should serialize description",
	);
	strictEqual(json.__data.url, "https://ravenjs.dev", "Should serialize URL");
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocSeeTag - serialization symbol reference", () => {
	const tag = new JSDocSeeTag("MyClass.method");
	const json = tag.toJSON();

	strictEqual(json.__type, "see", "Should have correct type");
	strictEqual(json.__data.referenceType, "symbol", "Should serialize type");
	strictEqual(
		json.__data.reference,
		"MyClass.method",
		"Should serialize reference",
	);
	strictEqual(
		json.__data.description,
		"",
		"Should serialize empty description",
	);
	strictEqual(json.__data.url, "", "Should serialize empty URL");
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocSeeTag - HTML output with URL", () => {
	const urlTag = new JSDocSeeTag("https://github.com/user/repo");

	strictEqual(
		urlTag.toHTML(),
		'<div class="see-info"><strong class="see-label">See:</strong><a href="https://github.com/user/repo" class="see-link">https://github.com/user/repo</a></div>',
		"Should generate correct HTML for URL",
	);
});

test("JSDocSeeTag - HTML output with link and description", () => {
	const linkTag = new JSDocSeeTag("{@link https://ravenjs.dev|Documentation}");

	strictEqual(
		linkTag.toHTML(),
		'<div class="see-info"><strong class="see-label">See:</strong><a href="https://ravenjs.dev" class="see-link">Documentation</a></div>',
		"Should generate correct HTML for link with description",
	);
});

test("JSDocSeeTag - HTML output with symbol reference", () => {
	const symbolTag = new JSDocSeeTag("MyFunction");

	strictEqual(
		symbolTag.toHTML(),
		'<div class="see-info"><strong class="see-label">See:</strong><code class="see-reference">MyFunction</code></div>',
		"Should generate correct HTML for symbol",
	);
});

test("JSDocSeeTag - Markdown output with URL", () => {
	const urlTag = new JSDocSeeTag("https://example.com/api");

	strictEqual(
		urlTag.toMarkdown(),
		"**See:** [https://example.com/api](https://example.com/api)",
		"Should generate correct Markdown for URL",
	);
});

test("JSDocSeeTag - Markdown output with link and description", () => {
	const linkTag = new JSDocSeeTag("{@link https://docs.com|API Docs}");

	strictEqual(
		linkTag.toMarkdown(),
		"**See:** [API Docs](https://docs.com)",
		"Should generate correct Markdown for link with description",
	);
});

test("JSDocSeeTag - Markdown output with symbol reference", () => {
	const symbolTag = new JSDocSeeTag("Namespace.ClassName");

	strictEqual(
		symbolTag.toMarkdown(),
		"**See:** `Namespace.ClassName`",
		"Should generate correct Markdown for symbol",
	);
});

test("JSDocSeeTag - common reference patterns", () => {
	// Function references
	const funcTag = new JSDocSeeTag("calculateTotal");
	strictEqual(
		funcTag.referenceType,
		"symbol",
		"Should handle function patterns",
	);
	strictEqual(funcTag.isValid(), true, "Should be valid");

	// Class references
	const classTag = new JSDocSeeTag("User.prototype.getName");
	strictEqual(classTag.referenceType, "symbol", "Should handle class patterns");
	strictEqual(classTag.isValid(), true, "Should be valid");

	// API references
	const apiTag = new JSDocSeeTag("{@link https://api.example.com/v1|API v1}");
	strictEqual(apiTag.referenceType, "link", "Should handle API patterns");
	strictEqual(apiTag.isValid(), true, "Should be valid");
});

test("JSDocSeeTag - edge cases", () => {
	// Very long URL
	const longTag = new JSDocSeeTag(
		"https://very.long.domain.name.example.com/extremely/long/path/to/documentation/with/many/segments/and/parameters?param1=value1&param2=value2#section",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long URLs");

	// Complex module reference
	const moduleTag = new JSDocSeeTag(
		"module:@organization/package-name/submodule",
	);
	strictEqual(
		moduleTag.referenceType,
		"module",
		"Should handle complex module references",
	);
	strictEqual(moduleTag.isValid(), true, "Should be valid");

	// Special characters in reference
	const specialTag = new JSDocSeeTag("MyClass.$staticMethod");
	strictEqual(
		specialTag.reference,
		"MyClass.$staticMethod",
		"Should handle special characters",
	);
	strictEqual(specialTag.isValid(), true, "Should be valid");

	// Unicode in description
	const unicodeTag = new JSDocSeeTag(
		"{@link https://example.com|Dökümäntäşyön Güidé}",
	);
	strictEqual(
		unicodeTag.description,
		"Dökümäntäşyön Güidé",
		"Should handle unicode in description",
	);
	strictEqual(unicodeTag.isValid(), true, "Should be valid");
});
