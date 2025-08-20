/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for types module - type definition validation.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";

test("types module exports only type definitions", async () => {
	// This module only contains type definitions, no runtime code
	// Verify that importing it doesn't throw and doesn't export anything
	const types = await import("./types.js");

	// Types module should not export any runtime values
	const exportedKeys = Object.keys(types);
	assert.equal(
		exportedKeys.length,
		0,
		"Types module should not export runtime values",
	);
});
