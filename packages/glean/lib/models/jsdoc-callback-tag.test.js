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
