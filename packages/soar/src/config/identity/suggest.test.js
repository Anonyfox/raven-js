/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for resource name suggestion and transformation.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { isValid } from "./is-valid.js";
import { suggest } from "./suggest.js";

describe("suggest", () => {
	it("should return fallback for null/undefined/empty inputs", () => {
		assert.strictEqual(suggest(null), "my-app");
		assert.strictEqual(suggest(undefined), "my-app");
		assert.strictEqual(suggest(""), "my-app");
		assert.strictEqual(suggest(123), "my-app");
	});

	it("should normalize case and special characters", () => {
		assert.strictEqual(suggest("My App"), "my-app");
		assert.strictEqual(suggest("API_Server"), "api-server");
		assert.strictEqual(suggest("user@service.com"), "user-service-com");
		assert.strictEqual(suggest("file/path/name"), "file-path-name");
	});

	it("should handle consecutive special characters", () => {
		assert.strictEqual(suggest("my___app"), "my-app");
		assert.strictEqual(suggest("test...name"), "test-name");
		assert.strictEqual(suggest("app!!!server"), "app-server");
	});

	it("should handle leading/trailing special characters", () => {
		assert.strictEqual(suggest("_myapp_"), "myapp");
		assert.strictEqual(suggest("---test---"), "test-app"); // Reserved names get -app suffix
		assert.strictEqual(suggest("...application..."), "application"); // Long enough names don't
	});

	it("should ensure minimum length", () => {
		assert.strictEqual(suggest("a"), "app-a");
		assert.strictEqual(suggest("ab"), "app-ab");

		// Should be valid after transformation
		assert.strictEqual(isValid(suggest("a")), true);
		assert.strictEqual(isValid(suggest("ab")), true);
	});

	it("should handle maximum length", () => {
		const longName = "a".repeat(100);
		const suggested = suggest(longName);

		assert.strictEqual(suggested.length <= 63, true);
		assert.strictEqual(isValid(suggested), true);
	});

	it("should handle reserved names by appending suffix", () => {
		assert.strictEqual(suggest("api"), "api-app");
		assert.strictEqual(suggest("www"), "www-app");
		assert.strictEqual(suggest("admin"), "admin-app");

		// Results should be valid
		assert.strictEqual(isValid(suggest("api")), true);
		assert.strictEqual(isValid(suggest("www")), true);
	});

	it("should handle names ending with hyphen", () => {
		// After normalization, if it ends with hyphen, should add '1'
		const result = suggest("test-");
		assert.strictEqual(result.endsWith("-"), false);
		assert.strictEqual(isValid(result), true);
	});

	it("should always return valid names", () => {
		const testInputs = [
			"My Complex App Name!!!",
			"API_SERVER_2023",
			"user@domain.com",
			"file/path/to/app",
			"a",
			"a".repeat(100),
			"api",
			"www",
			"test---name",
			"---invalid---",
			"UPPERCASE_NAME",
		];

		for (const input of testInputs) {
			const suggested = suggest(input);
			assert.strictEqual(
				isValid(suggested),
				true,
				`Expected suggestion for '${input}' to be valid, got '${suggested}'`,
			);
		}
	});

	it("should return fallback for completely invalid transformations", () => {
		// Edge case: if transformation fails completely, return fallback
		const result = suggest("!!!@@@###");
		assert.strictEqual(isValid(result), true);
	});
});
