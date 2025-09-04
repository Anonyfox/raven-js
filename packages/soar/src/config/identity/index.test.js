/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for identity module exports.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import * as identity from "./index.js";

describe("identity module exports", () => {
	it("should export all expected functions and constants", () => {
		const expectedExports = [
			"RESERVED_NAMES",
			"validate",
			"isValid",
			"suggest",
		];

		for (const exportName of expectedExports) {
			assert.strictEqual(
				exportName in identity,
				true,
				`Expected '${exportName}' to be exported`,
			);
		}
	});

	it("should export RESERVED_NAMES as frozen array", () => {
		assert.strictEqual(Array.isArray(identity.RESERVED_NAMES), true);
		assert.strictEqual(Object.isFrozen(identity.RESERVED_NAMES), true);
	});

	it("should export functions with correct types", () => {
		assert.strictEqual(typeof identity.validate, "function");
		assert.strictEqual(typeof identity.isValid, "function");
		assert.strictEqual(typeof identity.suggest, "function");
	});

	it("should have working function integration", () => {
		// Test that functions work together correctly
		const validName = "my-app-prod";
		const invalidName = "My Invalid Name!";

		// validate should pass for valid names
		assert.strictEqual(identity.validate(validName), true);

		// isValid should return true for valid names
		assert.strictEqual(identity.isValid(validName), true);

		// isValid should return false for invalid names
		assert.strictEqual(identity.isValid(invalidName), false);

		// suggest should transform invalid names to valid ones
		const suggested = identity.suggest(invalidName);
		assert.strictEqual(identity.isValid(suggested), true);
	});
});
