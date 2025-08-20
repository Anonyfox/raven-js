/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc readonly tag model.
 *
 * Ravens test readonly property documentation with precision.
 * Verifies readonly tag parsing, validation, and immutability indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocReadonlyTag } from "./jsdoc-readonly-tag.js";

test("JSDocReadonlyTag - standalone readonly tag", () => {
	const tag = new JSDocReadonlyTag("");

	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReadonlyTag - readonly with description", () => {
	const tag = new JSDocReadonlyTag(
		"Property set during initialization and never changed",
	);

	strictEqual(
		tag.description,
		"Property set during initialization and never changed",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReadonlyTag - identifier property description", () => {
	const tag = new JSDocReadonlyTag("Unique identifier assigned at creation");

	strictEqual(
		tag.description,
		"Unique identifier assigned at creation",
		"Should parse identifier description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReadonlyTag - configuration constant description", () => {
	const tag = new JSDocReadonlyTag(
		"Configuration value that should not be modified",
	);

	strictEqual(
		tag.description,
		"Configuration value that should not be modified",
		"Should parse configuration description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReadonlyTag - computed property description", () => {
	const tag = new JSDocReadonlyTag("Computed value based on other properties");

	strictEqual(
		tag.description,
		"Computed value based on other properties",
		"Should parse computed property description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReadonlyTag - instance constant description", () => {
	const tag = new JSDocReadonlyTag("Instance constant set during construction");

	strictEqual(
		tag.description,
		"Instance constant set during construction",
		"Should parse instance constant description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReadonlyTag - whitespace handling", () => {
	const spacedTag = new JSDocReadonlyTag(
		"   Immutable reference to external resource   ",
	);

	strictEqual(
		spacedTag.description,
		"Immutable reference to external resource",
		"Should trim description whitespace",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocReadonlyTag - only whitespace", () => {
	const tag = new JSDocReadonlyTag("   \n\t  ");

	strictEqual(tag.description, "", "Should handle whitespace-only content");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReadonlyTag - complex readonly description", () => {
	const tag = new JSDocReadonlyTag(
		"Readonly property containing metadata that should never be modified after object initialization",
	);

	strictEqual(
		tag.description,
		"Readonly property containing metadata that should never be modified after object initialization",
		"Should parse complex description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReadonlyTag - API constant description", () => {
	const tag = new JSDocReadonlyTag("API endpoint URL that remains constant");

	strictEqual(
		tag.description,
		"API endpoint URL that remains constant",
		"Should parse API constant description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReadonlyTag - thread safety description", () => {
	const tag = new JSDocReadonlyTag(
		"Thread-safe readonly property for concurrent access",
	);

	strictEqual(
		tag.description,
		"Thread-safe readonly property for concurrent access",
		"Should parse thread safety description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocReadonlyTag - serialization", () => {
	const tag = new JSDocReadonlyTag("Immutable object reference");
	const json = tag.toJSON();

	strictEqual(json.__type, "readonly", "Should have correct type");
	strictEqual(
		json.__data.description,
		"Immutable object reference",
		"Should serialize description",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocReadonlyTag - serialization without description", () => {
	const tag = new JSDocReadonlyTag("");
	const json = tag.toJSON();

	strictEqual(json.__type, "readonly", "Should have correct type");
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

test("JSDocReadonlyTag - HTML output", () => {
	const withDescription = new JSDocReadonlyTag(
		"Property that maintains referential integrity",
	);

	strictEqual(
		withDescription.toHTML(),
		'<div class="readonly-info"><strong class="readonly-label">Read-only:</strong> Property that maintains referential integrity</div>',
		"Should generate correct HTML with description",
	);

	const withoutDescription = new JSDocReadonlyTag("");

	strictEqual(
		withoutDescription.toHTML(),
		'<div class="readonly-info"><strong class="readonly-label">Read-only property</strong></div>',
		"Should generate correct HTML without description",
	);
});

test("JSDocReadonlyTag - Markdown output", () => {
	const withDescription = new JSDocReadonlyTag(
		"Constant value set at initialization time",
	);

	strictEqual(
		withDescription.toMarkdown(),
		"**Read-only:** Constant value set at initialization time",
		"Should generate correct Markdown with description",
	);

	const withoutDescription = new JSDocReadonlyTag("");

	strictEqual(
		withoutDescription.toMarkdown(),
		"**Read-only property**",
		"Should generate correct Markdown without description",
	);
});

test("JSDocReadonlyTag - common readonly patterns", () => {
	// Object identifiers
	const idTag = new JSDocReadonlyTag("Unique object identifier");
	strictEqual(
		idTag.description,
		"Unique object identifier",
		"Should handle identifier patterns",
	);
	strictEqual(idTag.isValid(), true, "Should be valid");

	// Configuration constants
	const configTag = new JSDocReadonlyTag("Application configuration constant");
	strictEqual(
		configTag.description,
		"Application configuration constant",
		"Should handle config patterns",
	);
	strictEqual(configTag.isValid(), true, "Should be valid");

	// Computed properties
	const computedTag = new JSDocReadonlyTag("Computed readonly value");
	strictEqual(
		computedTag.description,
		"Computed readonly value",
		"Should handle computed patterns",
	);
	strictEqual(computedTag.isValid(), true, "Should be valid");
});

test("JSDocReadonlyTag - edge cases", () => {
	// Very long description
	const longTag = new JSDocReadonlyTag(
		"This is a very comprehensive readonly property that contains critical system information and should never be modified during the entire lifecycle of the object to maintain data integrity and system consistency",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long descriptions");

	// Single word description
	const shortTag = new JSDocReadonlyTag("Immutable");
	strictEqual(
		shortTag.description,
		"Immutable",
		"Should handle single word description",
	);
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Technical description with jargon
	const techTag = new JSDocReadonlyTag(
		"Thread-safe immutable reference with copy-on-write semantics",
	);
	strictEqual(
		techTag.description,
		"Thread-safe immutable reference with copy-on-write semantics",
		"Should handle technical descriptions",
	);
	strictEqual(techTag.isValid(), true, "Should be valid");

	// Special characters in description
	const specialTag = new JSDocReadonlyTag(
		"Readonly constant (v1.0) for API endpoints & configuration",
	);
	strictEqual(specialTag.isValid(), true, "Should handle special characters");
});
