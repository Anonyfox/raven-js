/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc static tag model.
 *
 * Ravens test static member documentation with precision.
 * Verifies static tag parsing, validation, and class-level member indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocStaticTag } from "./jsdoc-static-tag.js";

test("JSDocStaticTag - standalone static tag", () => {
	const tag = new JSDocStaticTag("");

	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocStaticTag - static with description", () => {
	const tag = new JSDocStaticTag("Class utility method for validation");

	strictEqual(
		tag.description,
		"Class utility method for validation",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocStaticTag - static method description", () => {
	const tag = new JSDocStaticTag("Factory method for creating instances");

	strictEqual(
		tag.description,
		"Factory method for creating instances",
		"Should parse factory method description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocStaticTag - static property description", () => {
	const tag = new JSDocStaticTag("Configuration constants for the class");

	strictEqual(
		tag.description,
		"Configuration constants for the class",
		"Should parse property description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocStaticTag - static constant description", () => {
	const tag = new JSDocStaticTag("Default values for class initialization");

	strictEqual(
		tag.description,
		"Default values for class initialization",
		"Should parse constant description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocStaticTag - whitespace handling", () => {
	const spacedTag = new JSDocStaticTag(
		"   Helper function for data processing   ",
	);

	strictEqual(
		spacedTag.description,
		"Helper function for data processing",
		"Should trim description whitespace",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocStaticTag - only whitespace", () => {
	const tag = new JSDocStaticTag("   \n\t  ");

	strictEqual(tag.description, "", "Should handle whitespace-only content");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocStaticTag - complex static description", () => {
	const tag = new JSDocStaticTag(
		"Static factory method that creates and configures new instances with default settings",
	);

	strictEqual(
		tag.description,
		"Static factory method that creates and configures new instances with default settings",
		"Should parse complex description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocStaticTag - utility method description", () => {
	const tag = new JSDocStaticTag("Utility function for type checking");

	strictEqual(
		tag.description,
		"Utility function for type checking",
		"Should parse utility description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocStaticTag - validation method description", () => {
	const tag = new JSDocStaticTag(
		"Validates input parameters before processing",
	);

	strictEqual(
		tag.description,
		"Validates input parameters before processing",
		"Should parse validation description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocStaticTag - serialization", () => {
	const tag = new JSDocStaticTag("Shared configuration object");
	const json = tag.toJSON();

	strictEqual(json.__type, "static", "Should have correct type");
	strictEqual(
		json.__data.description,
		"Shared configuration object",
		"Should serialize description",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocStaticTag - serialization without description", () => {
	const tag = new JSDocStaticTag("");
	const json = tag.toJSON();

	strictEqual(json.__type, "static", "Should have correct type");
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

test("JSDocStaticTag - HTML output", () => {
	const withDescription = new JSDocStaticTag(
		"Class-level utility for data transformation",
	);

	strictEqual(
		withDescription.toHTML(),
		'<div class="static-info"><strong class="static-label">Static:</strong> Class-level utility for data transformation</div>',
		"Should generate correct HTML with description",
	);

	const withoutDescription = new JSDocStaticTag("");

	strictEqual(
		withoutDescription.toHTML(),
		'<div class="static-info"><strong class="static-label">Static member</strong></div>',
		"Should generate correct HTML without description",
	);
});

test("JSDocStaticTag - Markdown output", () => {
	const withDescription = new JSDocStaticTag(
		"Factory method for creating configured instances",
	);

	strictEqual(
		withDescription.toMarkdown(),
		"**Static:** Factory method for creating configured instances",
		"Should generate correct Markdown with description",
	);

	const withoutDescription = new JSDocStaticTag("");

	strictEqual(
		withoutDescription.toMarkdown(),
		"**Static member**",
		"Should generate correct Markdown without description",
	);
});

test("JSDocStaticTag - common static patterns", () => {
	// Static factory methods
	const factoryTag = new JSDocStaticTag("Factory method");
	strictEqual(
		factoryTag.description,
		"Factory method",
		"Should handle factory patterns",
	);
	strictEqual(factoryTag.isValid(), true, "Should be valid");

	// Static constants
	const constantTag = new JSDocStaticTag("Class constant value");
	strictEqual(
		constantTag.description,
		"Class constant value",
		"Should handle constant patterns",
	);
	strictEqual(constantTag.isValid(), true, "Should be valid");

	// Static utilities
	const utilityTag = new JSDocStaticTag("Utility helper function");
	strictEqual(
		utilityTag.description,
		"Utility helper function",
		"Should handle utility patterns",
	);
	strictEqual(utilityTag.isValid(), true, "Should be valid");
});

test("JSDocStaticTag - edge cases", () => {
	// Very long description
	const longTag = new JSDocStaticTag(
		"This is a very comprehensive static method that handles multiple complex operations including data validation, transformation, caching, and error handling for the entire class hierarchy",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long descriptions");

	// Single word description
	const shortTag = new JSDocStaticTag("Singleton");
	strictEqual(
		shortTag.description,
		"Singleton",
		"Should handle single word description",
	);
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Special characters in description
	const specialTag = new JSDocStaticTag(
		"Static utility (v2.0) for JSON/XML processing",
	);
	strictEqual(specialTag.isValid(), true, "Should handle special characters");

	// Technical description
	const techTag = new JSDocStaticTag("Thread-safe singleton instance getter");
	strictEqual(
		techTag.description,
		"Thread-safe singleton instance getter",
		"Should handle technical descriptions",
	);
	strictEqual(techTag.isValid(), true, "Should be valid");
});
