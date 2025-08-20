/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc memberof tag model.
 *
 * Ravens test membership relationship documentation with hierarchical precision.
 * Verifies parent-child symbol relationships, ownership parsing, and inheritance structure.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocMemberofTag } from "./jsdoc-memberof-tag.js";

test("JSDocMemberofTag - simple class membership", () => {
	const tag = new JSDocMemberofTag("MyClass");

	strictEqual(tag.parent, "MyClass", "Should parse simple class name");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocMemberofTag - class with description", () => {
	const tag = new JSDocMemberofTag(
		"UserService Helper belongs to user service class",
	);

	strictEqual(tag.parent, "UserService", "Should parse class name");
	strictEqual(
		tag.description,
		"Helper belongs to user service class",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocMemberofTag - nested namespace membership", () => {
	const tag = new JSDocMemberofTag("MyApp.Utils.StringHelpers");

	strictEqual(
		tag.parent,
		"MyApp.Utils.StringHelpers",
		"Should parse nested namespace",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocMemberofTag - instance member notation", () => {
	const tag = new JSDocMemberofTag("MyClass#");

	strictEqual(tag.parent, "MyClass#", "Should parse instance member notation");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocMemberofTag - static member notation", () => {
	const tag = new JSDocMemberofTag("MyClass.");

	strictEqual(tag.parent, "MyClass.", "Should parse static member notation");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocMemberofTag - module-style parent", () => {
	const tag = new JSDocMemberofTag("@company/utils");

	strictEqual(tag.parent, "@company/utils", "Should parse module-style parent");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocMemberofTag - global parent", () => {
	const tag = new JSDocMemberofTag("window.MyLibrary");

	strictEqual(tag.parent, "window.MyLibrary", "Should parse global parent");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocMemberofTag - empty content", () => {
	const tag = new JSDocMemberofTag("");

	strictEqual(tag.parent, "", "Should handle empty content");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), false, "Should be invalid without parent");
});

test("JSDocMemberofTag - whitespace handling", () => {
	const spacedTag = new JSDocMemberofTag(
		"   DatabaseManager   Connection utility method   ",
	);

	strictEqual(spacedTag.parent, "DatabaseManager", "Should trim parent name");
	strictEqual(
		spacedTag.description,
		"Connection utility method",
		"Should trim description",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocMemberofTag - only whitespace", () => {
	const tag = new JSDocMemberofTag("   \n\t  ");

	strictEqual(tag.parent, "", "Should handle whitespace-only content");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), false, "Should be invalid with whitespace only");
});

test("JSDocMemberofTag - complex parent with description", () => {
	const tag = new JSDocMemberofTag(
		"Company.Products.WebApp.Services.AuthService# Instance authentication methods",
	);

	strictEqual(
		tag.parent,
		"Company.Products.WebApp.Services.AuthService#",
		"Should parse complex parent",
	);
	strictEqual(
		tag.description,
		"Instance authentication methods",
		"Should parse multi-word description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocMemberofTag - special characters in parent", () => {
	const tag = new JSDocMemberofTag("my-library/core-utils");

	strictEqual(
		tag.parent,
		"my-library/core-utils",
		"Should handle special characters",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocMemberofTag - serialization", () => {
	const tag = new JSDocMemberofTag(
		"EventEmitter Utility method for event handling",
	);
	const json = tag.toJSON();

	strictEqual(json.__type, "memberof", "Should have correct type");
	strictEqual(json.__data.parent, "EventEmitter", "Should serialize parent");
	strictEqual(
		json.__data.description,
		"Utility method for event handling",
		"Should serialize description",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocMemberofTag - HTML output", () => {
	const withDescription = new JSDocMemberofTag(
		"APIClient HTTP client utility methods",
	);

	strictEqual(
		withDescription.toHTML(),
		'<div class="memberof-info"><strong class="memberof-label">Member of:</strong><code class="memberof-parent">APIClient</code> - HTTP client utility methods</div>',
		"Should generate correct HTML with description",
	);

	const withoutDescription = new JSDocMemberofTag("ConfigManager");

	strictEqual(
		withoutDescription.toHTML(),
		'<div class="memberof-info"><strong class="memberof-label">Member of:</strong><code class="memberof-parent">ConfigManager</code></div>',
		"Should generate correct HTML without description",
	);
});

test("JSDocMemberofTag - Markdown output", () => {
	const withDescription = new JSDocMemberofTag(
		"Logger Logging utility functions",
	);

	strictEqual(
		withDescription.toMarkdown(),
		"**Member of:** `Logger` - Logging utility functions",
		"Should generate correct Markdown with description",
	);

	const withoutDescription = new JSDocMemberofTag("Validator");

	strictEqual(
		withoutDescription.toMarkdown(),
		"**Member of:** `Validator`",
		"Should generate correct Markdown without description",
	);
});

test("JSDocMemberofTag - complex parent structures", () => {
	// jQuery-style parent
	const jqueryTag = new JSDocMemberofTag("$.fn.myPlugin");
	strictEqual(
		jqueryTag.parent,
		"$.fn.myPlugin",
		"Should handle jQuery-style parents",
	);
	strictEqual(jqueryTag.isValid(), true, "Should be valid");

	// Prototype chain
	const prototypeTag = new JSDocMemberofTag("MyClass.prototype");
	strictEqual(
		prototypeTag.parent,
		"MyClass.prototype",
		"Should handle prototype chain",
	);
	strictEqual(prototypeTag.isValid(), true, "Should be valid");

	// Deep nesting with hash
	const deepTag = new JSDocMemberofTag("Company.Module.SubModule.ClassName#");
	strictEqual(
		deepTag.parent,
		"Company.Module.SubModule.ClassName#",
		"Should handle deep nesting with instance notation",
	);
	strictEqual(deepTag.isValid(), true, "Should be valid");
});

test("JSDocMemberofTag - edge cases", () => {
	// Very long parent name
	const longTag = new JSDocMemberofTag(
		"VeryLongCompanyName.ExtensiveProductLine.ComplexWebApplication.CoreServices.DatabaseConnectionManager",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long parent names");

	// Single character parent
	const shortTag = new JSDocMemberofTag("$");
	strictEqual(shortTag.parent, "$", "Should handle single character parent");
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Parent with numbers
	const numberedTag = new JSDocMemberofTag("APIv2.endpoints");
	strictEqual(
		numberedTag.parent,
		"APIv2.endpoints",
		"Should handle numbers in parent",
	);
	strictEqual(numberedTag.isValid(), true, "Should be valid");

	// Parent with underscores
	const underscoreTag = new JSDocMemberofTag("MY_APP.CONSTANTS");
	strictEqual(
		underscoreTag.parent,
		"MY_APP.CONSTANTS",
		"Should handle underscores",
	);
	strictEqual(underscoreTag.isValid(), true, "Should be valid");
});
