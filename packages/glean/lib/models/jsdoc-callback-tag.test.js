/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc callback tag model.
 *
 * Ravens test callback function type documentation with precision.
 * Verifies callback name parsing, validation, and reusable function signature definition.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocCallbackTag } from "./jsdoc-callback-tag.js";

test("JSDocCallbackTag - simple callback name", () => {
	const tag = new JSDocCallbackTag("requestCallback");

	strictEqual(tag.name, "requestCallback", "Should parse simple callback name");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocCallbackTag - callback with description", () => {
	const tag = new JSDocCallbackTag(
		"responseHandler Function called when response is received",
	);

	strictEqual(tag.name, "responseHandler", "Should parse callback name");
	strictEqual(
		tag.description,
		"Function called when response is received",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocCallbackTag - event callback", () => {
	const tag = new JSDocCallbackTag("onSuccess");

	strictEqual(tag.name, "onSuccess", "Should parse event callback name");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocCallbackTag - error callback with description", () => {
	const tag = new JSDocCallbackTag(
		"errorCallback Called when an error occurs during processing",
	);

	strictEqual(tag.name, "errorCallback", "Should parse error callback name");
	strictEqual(
		tag.description,
		"Called when an error occurs during processing",
		"Should parse error description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocCallbackTag - functional programming callback", () => {
	const tag = new JSDocCallbackTag("iteratorCallback");

	strictEqual(
		tag.name,
		"iteratorCallback",
		"Should parse functional callback name",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocCallbackTag - async completion callback", () => {
	const tag = new JSDocCallbackTag(
		"completionHandler Function executed when async operation completes",
	);

	strictEqual(
		tag.name,
		"completionHandler",
		"Should parse completion callback name",
	);
	strictEqual(
		tag.description,
		"Function executed when async operation completes",
		"Should parse completion description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocCallbackTag - empty content", () => {
	const tag = new JSDocCallbackTag("");

	strictEqual(tag.name, "", "Should handle empty content");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), false, "Should be invalid without name");
});

test("JSDocCallbackTag - whitespace handling", () => {
	const spacedTag = new JSDocCallbackTag(
		"   validationCallback   Function for validating input data   ",
	);

	strictEqual(
		spacedTag.name,
		"validationCallback",
		"Should trim callback name",
	);
	strictEqual(
		spacedTag.description,
		"Function for validating input data",
		"Should trim description",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocCallbackTag - only whitespace", () => {
	const tag = new JSDocCallbackTag("   \n\t  ");

	strictEqual(tag.name, "", "Should handle whitespace-only content");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), false, "Should be invalid with whitespace only");
});

test("JSDocCallbackTag - complex callback with detailed description", () => {
	const tag = new JSDocCallbackTag(
		"transformFunction User-defined function that transforms input data into desired output format",
	);

	strictEqual(
		tag.name,
		"transformFunction",
		"Should parse complex callback name",
	);
	strictEqual(
		tag.description,
		"User-defined function that transforms input data into desired output format",
		"Should parse detailed description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocCallbackTag - plugin callback", () => {
	const tag = new JSDocCallbackTag("pluginInitializer");

	strictEqual(
		tag.name,
		"pluginInitializer",
		"Should parse plugin callback name",
	);
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocCallbackTag - serialization", () => {
	const tag = new JSDocCallbackTag(
		"authCallback Callback function for authentication flow",
	);
	const json = tag.toJSON();

	strictEqual(json.__type, "callback", "Should have correct type");
	strictEqual(json.__data.name, "authCallback", "Should serialize name");
	strictEqual(
		json.__data.description,
		"Callback function for authentication flow",
		"Should serialize description",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocCallbackTag - HTML output", () => {
	const withDescription = new JSDocCallbackTag(
		"dataProcessor Function that processes incoming data",
	);

	strictEqual(
		withDescription.toHTML(),
		'<div class="callback-info"><strong class="callback-label">Callback:</strong><code class="callback-name">dataProcessor</code> - Function that processes incoming data</div>',
		"Should generate correct HTML with description",
	);

	const withoutDescription = new JSDocCallbackTag("onClick");

	strictEqual(
		withoutDescription.toHTML(),
		'<div class="callback-info"><strong class="callback-label">Callback:</strong><code class="callback-name">onClick</code></div>',
		"Should generate correct HTML without description",
	);
});

test("JSDocCallbackTag - Markdown output", () => {
	const withDescription = new JSDocCallbackTag(
		"filterFunction Function used to filter array elements",
	);

	strictEqual(
		withDescription.toMarkdown(),
		"**Callback:** `filterFunction` - Function used to filter array elements",
		"Should generate correct Markdown with description",
	);

	const withoutDescription = new JSDocCallbackTag("onComplete");

	strictEqual(
		withoutDescription.toMarkdown(),
		"**Callback:** `onComplete`",
		"Should generate correct Markdown without description",
	);
});

test("JSDocCallbackTag - common callback patterns", () => {
	// Event handler callbacks
	const eventTag = new JSDocCallbackTag("onStateChange");
	strictEqual(
		eventTag.name,
		"onStateChange",
		"Should handle event callback patterns",
	);
	strictEqual(eventTag.isValid(), true, "Should be valid");

	// Async operation callbacks
	const asyncTag = new JSDocCallbackTag("promiseResolver");
	strictEqual(
		asyncTag.name,
		"promiseResolver",
		"Should handle async callback patterns",
	);
	strictEqual(asyncTag.isValid(), true, "Should be valid");

	// Functional programming callbacks
	const functionalTag = new JSDocCallbackTag("mapperFunction");
	strictEqual(
		functionalTag.name,
		"mapperFunction",
		"Should handle functional callback patterns",
	);
	strictEqual(functionalTag.isValid(), true, "Should be valid");
});

test("JSDocCallbackTag - edge cases", () => {
	// Very long callback name
	const longTag = new JSDocCallbackTag(
		"veryLongCallbackFunctionNameThatDescribesComplexAsyncOperationWithErrorHandling",
	);
	strictEqual(
		longTag.isValid(),
		true,
		"Should handle very long callback names",
	);

	// Single character callback
	const shortTag = new JSDocCallbackTag("f");
	strictEqual(shortTag.name, "f", "Should handle single character callback");
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Callback with special naming
	const specialTag = new JSDocCallbackTag("$callback");
	strictEqual(
		specialTag.name,
		"$callback",
		"Should handle special character naming",
	);
	strictEqual(specialTag.isValid(), true, "Should be valid");

	// CamelCase and snake_case
	const camelTag = new JSDocCallbackTag("onUserActionComplete");
	strictEqual(camelTag.name, "onUserActionComplete", "Should handle camelCase");
	strictEqual(camelTag.isValid(), true, "Should be valid");

	const snakeTag = new JSDocCallbackTag("error_handler_callback");
	strictEqual(
		snakeTag.name,
		"error_handler_callback",
		"Should handle snake_case",
	);
	strictEqual(snakeTag.isValid(), true, "Should be valid");
});
