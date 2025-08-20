/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc private tag model.
 *
 * Ravens test private member documentation with precision.
 * Verifies private tag parsing, validation, and internal API indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocPrivateTag } from "./jsdoc-private-tag.js";

test("JSDocPrivateTag - standalone private tag", () => {
	const tag = new JSDocPrivateTag("");

	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPrivateTag - private with description", () => {
	const tag = new JSDocPrivateTag(
		"Internal helper function not meant for external use",
	);

	strictEqual(
		tag.description,
		"Internal helper function not meant for external use",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPrivateTag - helper function description", () => {
	const tag = new JSDocPrivateTag(
		"Utility function for internal data processing",
	);

	strictEqual(
		tag.description,
		"Utility function for internal data processing",
		"Should parse helper function description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPrivateTag - implementation detail description", () => {
	const tag = new JSDocPrivateTag(
		"Implementation detail that supports public API",
	);

	strictEqual(
		tag.description,
		"Implementation detail that supports public API",
		"Should parse implementation description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPrivateTag - internal state description", () => {
	const tag = new JSDocPrivateTag("Internal state management property");

	strictEqual(
		tag.description,
		"Internal state management property",
		"Should parse internal state description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPrivateTag - debug utility description", () => {
	const tag = new JSDocPrivateTag(
		"Debug utility function for development only",
	);

	strictEqual(
		tag.description,
		"Debug utility function for development only",
		"Should parse debug utility description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPrivateTag - legacy code description", () => {
	const tag = new JSDocPrivateTag(
		"Legacy internal function maintained for compatibility",
	);

	strictEqual(
		tag.description,
		"Legacy internal function maintained for compatibility",
		"Should parse legacy code description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPrivateTag - whitespace handling", () => {
	const spacedTag = new JSDocPrivateTag(
		"   Internal caching mechanism for performance   ",
	);

	strictEqual(
		spacedTag.description,
		"Internal caching mechanism for performance",
		"Should trim description whitespace",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocPrivateTag - only whitespace", () => {
	const tag = new JSDocPrivateTag("   \n\t  ");

	strictEqual(tag.description, "", "Should handle whitespace-only content");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPrivateTag - complex private description", () => {
	const tag = new JSDocPrivateTag(
		"Internal method that handles complex business logic validation and should not be called directly by external code",
	);

	strictEqual(
		tag.description,
		"Internal method that handles complex business logic validation and should not be called directly by external code",
		"Should parse complex description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPrivateTag - framework internal description", () => {
	const tag = new JSDocPrivateTag(
		"Framework internal API not for end-user consumption",
	);

	strictEqual(
		tag.description,
		"Framework internal API not for end-user consumption",
		"Should parse framework internal description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocPrivateTag - serialization", () => {
	const tag = new JSDocPrivateTag("Internal configuration manager");
	const json = tag.toJSON();

	strictEqual(json.__type, "private", "Should have correct type");
	strictEqual(
		json.__data.description,
		"Internal configuration manager",
		"Should serialize description",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocPrivateTag - serialization without description", () => {
	const tag = new JSDocPrivateTag("");
	const json = tag.toJSON();

	strictEqual(json.__type, "private", "Should have correct type");
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

test("JSDocPrivateTag - HTML output", () => {
	const withDescription = new JSDocPrivateTag(
		"Internal helper for data transformation",
	);

	strictEqual(
		withDescription.toHTML(),
		'<div class="private-info"><strong class="private-label">Private:</strong> Internal helper for data transformation</div>',
		"Should generate correct HTML with description",
	);

	const withoutDescription = new JSDocPrivateTag("");

	strictEqual(
		withoutDescription.toHTML(),
		'<div class="private-info"><strong class="private-label">Private member</strong></div>',
		"Should generate correct HTML without description",
	);
});

test("JSDocPrivateTag - Markdown output", () => {
	const withDescription = new JSDocPrivateTag(
		"Implementation detail for caching mechanism",
	);

	strictEqual(
		withDescription.toMarkdown(),
		"**Private:** Implementation detail for caching mechanism",
		"Should generate correct Markdown with description",
	);

	const withoutDescription = new JSDocPrivateTag("");

	strictEqual(
		withoutDescription.toMarkdown(),
		"**Private member**",
		"Should generate correct Markdown without description",
	);
});

test("JSDocPrivateTag - common private patterns", () => {
	// Helper functions
	const helperTag = new JSDocPrivateTag("Internal helper function");
	strictEqual(
		helperTag.description,
		"Internal helper function",
		"Should handle helper patterns",
	);
	strictEqual(helperTag.isValid(), true, "Should be valid");

	// Implementation details
	const implTag = new JSDocPrivateTag("Implementation detail");
	strictEqual(
		implTag.description,
		"Implementation detail",
		"Should handle implementation patterns",
	);
	strictEqual(implTag.isValid(), true, "Should be valid");

	// Internal state
	const stateTag = new JSDocPrivateTag("Internal state property");
	strictEqual(
		stateTag.description,
		"Internal state property",
		"Should handle state patterns",
	);
	strictEqual(stateTag.isValid(), true, "Should be valid");
});

test("JSDocPrivateTag - edge cases", () => {
	// Very long description
	const longTag = new JSDocPrivateTag(
		"This is a very comprehensive private method that handles multiple complex internal operations including state management, data validation, caching, and error handling that should never be accessed directly by external consumers",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long descriptions");

	// Single word description
	const shortTag = new JSDocPrivateTag("Internal");
	strictEqual(
		shortTag.description,
		"Internal",
		"Should handle single word description",
	);
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Technical description with underscores
	const techTag = new JSDocPrivateTag(
		"_internalHelper for implementation details",
	);
	strictEqual(
		techTag.description,
		"_internalHelper for implementation details",
		"Should handle technical descriptions",
	);
	strictEqual(techTag.isValid(), true, "Should be valid");

	// Special characters in description
	const specialTag = new JSDocPrivateTag(
		"Private utility (internal v2.0) for data processing & validation",
	);
	strictEqual(specialTag.isValid(), true, "Should handle special characters");
});
