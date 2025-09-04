/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for non-throwing resource name validation.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { isValid } from "./is-valid.js";

describe("isValid", () => {
	it("should return true for valid names", () => {
		const validNames = [
			"my-app",
			"app-prod",
			"user-service",
			"abc",
			"a".repeat(63),
		];

		for (const name of validNames) {
			assert.strictEqual(
				isValid(name),
				true,
				`Expected '${name}' to be valid`,
			);
		}
	});

	it("should return false for invalid names", () => {
		const invalidNames = [
			null,
			undefined,
			"",
			"ab", // Too short
			"a".repeat(64), // Too long
			"My-App", // Uppercase
			"my_app", // Underscore
			"-myapp", // Leading hyphen
			"myapp-", // Trailing hyphen
			"my--app", // Consecutive hyphens
			"api", // Reserved
			"xn--test", // Internationalized domain prefix
		];

		for (const name of invalidNames) {
			assert.strictEqual(
				isValid(name),
				false,
				`Expected '${name}' to be invalid`,
			);
		}
	});

	it("should not throw exceptions", () => {
		// These would throw in validate() but should return false here
		const problematicInputs = [null, undefined, 123, {}, []];

		for (const input of problematicInputs) {
			assert.doesNotThrow(() => {
				const result = isValid(input);
				assert.strictEqual(result, false);
			});
		}
	});
});
