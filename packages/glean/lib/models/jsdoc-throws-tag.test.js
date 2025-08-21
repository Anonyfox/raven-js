/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for JSDoc throws tag model
 *
 * Ravens validate exception precision with predatory focus.
 * Comprehensive test coverage for throws parsing, validation, and output.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocThrowsTag } from "./jsdoc-throws-tag.js";

test("JSDocThrowsTag - complex error scenarios", () => {
	// Network error with nested details
	const networkTag = new JSDocThrowsTag(
		"{NetworkError} Connection timeout after 30 seconds or server unreachable",
	);
	strictEqual(
		networkTag.errorType,
		"NetworkError",
		"Should parse network error correctly",
	);
	strictEqual(networkTag.isValid(), true, "Should be valid");

	// Multiple conditions in one throws
	const multiTag = new JSDocThrowsTag(
		"{Error} File system error: permission denied, disk full, or path not found",
	);
	strictEqual(multiTag.errorType, "Error", "Should parse error type correctly");
	strictEqual(multiTag.isValid(), true, "Should be valid");

	// Async rejection
	const asyncTag = new JSDocThrowsTag(
		"Promise rejects with network timeout or parsing error",
	);
	strictEqual(asyncTag.errorType, "", "Should have empty error type");
	strictEqual(asyncTag.isValid(), true, "Should be valid with description");
});
