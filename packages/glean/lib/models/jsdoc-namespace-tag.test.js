/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc namespace tag model.
 *
 * Ravens test namespace territorial organization with methodical precision.
 * Verifies namespace parsing, validation, and hierarchical structure documentation.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocNamespaceTag } from "./jsdoc-namespace-tag.js";

test("JSDocNamespaceTag - simple namespace", () => {
	const tag = new JSDocNamespaceTag("Utils");

	strictEqual(tag.name, "Utils", "Should parse simple namespace name");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocNamespaceTag - namespace with description", () => {
	const tag = new JSDocNamespaceTag(
		"MyApp.Utils Utility functions for the application",
	);

	strictEqual(
		tag.name,
		"MyApp.Utils",
		"Should parse hierarchical namespace name",
	);
	strictEqual(
		tag.description,
		"Utility functions for the application",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocNamespaceTag - nested namespace", () => {
	const tag = new JSDocNamespaceTag("Company.Product.Core");

	strictEqual(
		tag.name,
		"Company.Product.Core",
		"Should parse nested namespace",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocNamespaceTag - global namespace", () => {
	const tag = new JSDocNamespaceTag(
		"window.MyLibrary Global library namespace",
	);

	strictEqual(tag.name, "window.MyLibrary", "Should parse global namespace");
	strictEqual(
		tag.description,
		"Global library namespace",
		"Should parse description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocNamespaceTag - module-style namespace", () => {
	const tag = new JSDocNamespaceTag("@company/utils");

	strictEqual(
		tag.name,
		"@company/utils",
		"Should parse module-style namespace",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocNamespaceTag - empty content", () => {
	const tag = new JSDocNamespaceTag("");

	strictEqual(tag.name, "", "Should handle empty content");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), false, "Should be invalid without name");
});

test("JSDocNamespaceTag - whitespace handling", () => {
	const spacedTag = new JSDocNamespaceTag(
		"   API.Constants   Core application constants   ",
	);

	strictEqual(spacedTag.name, "API.Constants", "Should trim namespace name");
	strictEqual(
		spacedTag.description,
		"Core application constants",
		"Should trim description",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocNamespaceTag - only whitespace", () => {
	const tag = new JSDocNamespaceTag("   \n\t  ");

	strictEqual(tag.name, "", "Should handle whitespace-only content");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), false, "Should be invalid with whitespace only");
});

test("JSDocNamespaceTag - single word with spaces", () => {
	const tag = new JSDocNamespaceTag(
		"ConfigurationHelpers Helper functions for configuration management",
	);

	strictEqual(
		tag.name,
		"ConfigurationHelpers",
		"Should parse single word namespace",
	);
	strictEqual(
		tag.description,
		"Helper functions for configuration management",
		"Should parse multi-word description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocNamespaceTag - special characters in name", () => {
	const tag = new JSDocNamespaceTag("my-library/utils-v2");

	strictEqual(
		tag.name,
		"my-library/utils-v2",
		"Should handle special characters",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocNamespaceTag - serialization", () => {
	const tag = new JSDocNamespaceTag("App.Database Database access utilities");
	const json = tag.toJSON();

	strictEqual(json.__type, "namespace", "Should have correct type");
	strictEqual(json.__data.name, "App.Database", "Should serialize name");
	strictEqual(
		json.__data.description,
		"Database access utilities",
		"Should serialize description",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocNamespaceTag - HTML output", () => {
	const withDescription = new JSDocNamespaceTag(
		"UI.Components User interface components",
	);

	strictEqual(
		withDescription.toHTML(),
		'<div class="namespace-info"><strong class="namespace-label">Namespace:</strong><code class="namespace-name">UI.Components</code> - User interface components</div>',
		"Should generate correct HTML with description",
	);

	const withoutDescription = new JSDocNamespaceTag("Constants");

	strictEqual(
		withoutDescription.toHTML(),
		'<div class="namespace-info"><strong class="namespace-label">Namespace:</strong><code class="namespace-name">Constants</code></div>',
		"Should generate correct HTML without description",
	);
});

test("JSDocNamespaceTag - Markdown output", () => {
	const withDescription = new JSDocNamespaceTag(
		"API.Auth Authentication utilities",
	);

	strictEqual(
		withDescription.toMarkdown(),
		"**Namespace:** `API.Auth` - Authentication utilities",
		"Should generate correct Markdown with description",
	);

	const withoutDescription = new JSDocNamespaceTag("Helpers");

	strictEqual(
		withoutDescription.toMarkdown(),
		"**Namespace:** `Helpers`",
		"Should generate correct Markdown without description",
	);
});

test("JSDocNamespaceTag - complex namespace structures", () => {
	// Deep nesting
	const deepTag = new JSDocNamespaceTag("Company.Products.WebApp.Utils.String");
	strictEqual(
		deepTag.name,
		"Company.Products.WebApp.Utils.String",
		"Should handle deep nesting",
	);
	strictEqual(deepTag.isValid(), true, "Should be valid");

	// Numbers and underscores
	const numberedTag = new JSDocNamespaceTag("API_v2.endpoints");
	strictEqual(
		numberedTag.name,
		"API_v2.endpoints",
		"Should handle numbers and underscores",
	);
	strictEqual(numberedTag.isValid(), true, "Should be valid");

	// jQuery-style
	const jqueryTag = new JSDocNamespaceTag("$.myPlugin");
	strictEqual(
		jqueryTag.name,
		"$.myPlugin",
		"Should handle jQuery-style namespaces",
	);
	strictEqual(jqueryTag.isValid(), true, "Should be valid");
});

test("JSDocNamespaceTag - edge cases", () => {
	// Very long namespace
	const longTag = new JSDocNamespaceTag(
		"VeryLongCompanyName.ExtensiveProductLine.ComplexWebApplication.CoreUtilities.StringManipulation.AdvancedFunctions",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long namespaces");

	// Single character
	const shortTag = new JSDocNamespaceTag("$");
	strictEqual(shortTag.name, "$", "Should handle single character namespace");
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// With dots but no description
	const dotsTag = new JSDocNamespaceTag("a.b.c");
	strictEqual(dotsTag.name, "a.b.c", "Should handle minimal dotted namespace");
	strictEqual(dotsTag.isValid(), true, "Should be valid");
});
