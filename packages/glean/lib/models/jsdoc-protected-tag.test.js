/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc protected tag model.
 *
 * Ravens test protected member documentation with precision.
 * Verifies protected tag parsing, validation, and subclass access indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocProtectedTag } from "./jsdoc-protected-tag.js";

test("JSDocProtectedTag - standalone protected tag", () => {
	const tag = new JSDocProtectedTag("");

	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocProtectedTag - protected with description", () => {
	const tag = new JSDocProtectedTag(
		"Method available to subclasses for extension and customization",
	);

	strictEqual(
		tag.description,
		"Method available to subclasses for extension and customization",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocProtectedTag - template method description", () => {
	const tag = new JSDocProtectedTag(
		"Template method intended to be overridden by subclasses",
	);

	strictEqual(
		tag.description,
		"Template method intended to be overridden by subclasses",
		"Should parse template method description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocProtectedTag - helper method description", () => {
	const tag = new JSDocProtectedTag(
		"Helper method shared between class and subclasses",
	);

	strictEqual(
		tag.description,
		"Helper method shared between class and subclasses",
		"Should parse helper method description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocProtectedTag - hook method description", () => {
	const tag = new JSDocProtectedTag(
		"Hook method for subclass customization of behavior",
	);

	strictEqual(
		tag.description,
		"Hook method for subclass customization of behavior",
		"Should parse hook method description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocProtectedTag - framework extension description", () => {
	const tag = new JSDocProtectedTag(
		"Framework extension point for advanced subclass functionality",
	);

	strictEqual(
		tag.description,
		"Framework extension point for advanced subclass functionality",
		"Should parse framework extension description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocProtectedTag - internal state description", () => {
	const tag = new JSDocProtectedTag(
		"Internal state property accessible to subclasses",
	);

	strictEqual(
		tag.description,
		"Internal state property accessible to subclasses",
		"Should parse internal state description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocProtectedTag - whitespace handling", () => {
	const spacedTag = new JSDocProtectedTag(
		"   Abstract method implementation for subclass completion   ",
	);

	strictEqual(
		spacedTag.description,
		"Abstract method implementation for subclass completion",
		"Should trim description whitespace",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocProtectedTag - only whitespace", () => {
	const tag = new JSDocProtectedTag("   \n\t  ");

	strictEqual(tag.description, "", "Should handle whitespace-only content");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocProtectedTag - complex protected description", () => {
	const tag = new JSDocProtectedTag(
		"Protected method that provides extensible functionality for subclasses while maintaining encapsulation from external consumers",
	);

	strictEqual(
		tag.description,
		"Protected method that provides extensible functionality for subclasses while maintaining encapsulation from external consumers",
		"Should parse complex description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocProtectedTag - inheritance contract description", () => {
	const tag = new JSDocProtectedTag(
		"Method defining inheritance contract for subclass implementation",
	);

	strictEqual(
		tag.description,
		"Method defining inheritance contract for subclass implementation",
		"Should parse inheritance contract description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocProtectedTag - serialization", () => {
	const tag = new JSDocProtectedTag("Base class utility for subclasses");
	const json = tag.toJSON();

	strictEqual(json.__type, "protected", "Should have correct type");
	strictEqual(
		json.__data.description,
		"Base class utility for subclasses",
		"Should serialize description",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocProtectedTag - serialization without description", () => {
	const tag = new JSDocProtectedTag("");
	const json = tag.toJSON();

	strictEqual(json.__type, "protected", "Should have correct type");
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

test("JSDocProtectedTag - HTML output", () => {
	const withDescription = new JSDocProtectedTag(
		"Extension point for subclass customization",
	);

	strictEqual(
		withDescription.toHTML(),
		'<div class="protected-info"><strong class="protected-label">Protected:</strong> Extension point for subclass customization</div>',
		"Should generate correct HTML with description",
	);

	const withoutDescription = new JSDocProtectedTag("");

	strictEqual(
		withoutDescription.toHTML(),
		'<div class="protected-info"><strong class="protected-label">Protected member</strong></div>',
		"Should generate correct HTML without description",
	);
});

test("JSDocProtectedTag - Markdown output", () => {
	const withDescription = new JSDocProtectedTag(
		"Template method for subclass implementation",
	);

	strictEqual(
		withDescription.toMarkdown(),
		"**Protected:** Template method for subclass implementation",
		"Should generate correct Markdown with description",
	);

	const withoutDescription = new JSDocProtectedTag("");

	strictEqual(
		withoutDescription.toMarkdown(),
		"**Protected member**",
		"Should generate correct Markdown without description",
	);
});

test("JSDocProtectedTag - common protected patterns", () => {
	// Template methods
	const templateTag = new JSDocProtectedTag("Template method pattern");
	strictEqual(
		templateTag.description,
		"Template method pattern",
		"Should handle template patterns",
	);
	strictEqual(templateTag.isValid(), true, "Should be valid");

	// Extension points
	const extensionTag = new JSDocProtectedTag("Framework extension point");
	strictEqual(
		extensionTag.description,
		"Framework extension point",
		"Should handle extension patterns",
	);
	strictEqual(extensionTag.isValid(), true, "Should be valid");

	// Hook methods
	const hookTag = new JSDocProtectedTag("Subclass hook method");
	strictEqual(
		hookTag.description,
		"Subclass hook method",
		"Should handle hook patterns",
	);
	strictEqual(hookTag.isValid(), true, "Should be valid");
});

test("JSDocProtectedTag - edge cases", () => {
	// Very long description
	const longTag = new JSDocProtectedTag(
		"This is a very comprehensive protected method that provides extensive functionality for subclasses including state management, validation, event handling, and lifecycle management while maintaining proper encapsulation from external consumers",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long descriptions");

	// Single word description
	const shortTag = new JSDocProtectedTag("Extensible");
	strictEqual(
		shortTag.description,
		"Extensible",
		"Should handle single word description",
	);
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Technical inheritance description
	const techTag = new JSDocProtectedTag(
		"Virtual method with polymorphic dispatch for subclass override",
	);
	strictEqual(
		techTag.description,
		"Virtual method with polymorphic dispatch for subclass override",
		"Should handle technical descriptions",
	);
	strictEqual(techTag.isValid(), true, "Should be valid");

	// Special characters in description
	const specialTag = new JSDocProtectedTag(
		"Protected utility (base v1.0) for subclass extension & customization",
	);
	strictEqual(specialTag.isValid(), true, "Should handle special characters");
});
