/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for resource name validation.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { validate } from "./validate.js";

describe("validate", () => {
	describe("valid names", () => {
		it("should accept valid resource names", () => {
			const validNames = [
				"my-app",
				"app-prod",
				"user-service",
				"api-gateway",
				"web-server",
				"db-cluster",
				"cache-redis",
				"queue-worker",
				"auth-service",
				"file-storage",
				"a1b",
				"app123",
				"test-env-01",
			];

			for (const name of validNames) {
				assert.strictEqual(
					validate(name),
					true,
					`Expected '${name}' to be valid`,
				);
			}
		});

		it("should accept names at boundary lengths", () => {
			assert.strictEqual(validate("abc"), true); // Minimum length (3)
			assert.strictEqual(validate("a".repeat(63)), true); // Maximum length (63)
		});
	});

	describe("invalid names - type and presence", () => {
		it("should reject null and undefined", () => {
			assert.throws(() => validate(null), /required and must be a string/);
			assert.throws(() => validate(undefined), /required and must be a string/);
		});

		it("should reject non-string types", () => {
			assert.throws(() => validate(123), /required and must be a string/);
			assert.throws(() => validate({}), /required and must be a string/);
			assert.throws(() => validate([]), /required and must be a string/);
		});

		it("should reject empty string", () => {
			assert.throws(() => validate(""), /required and must be a string/);
		});
	});

	describe("invalid names - length constraints", () => {
		it("should reject names too short", () => {
			assert.throws(() => validate("ab"), /must be 3-63 characters, got 2/);
			assert.throws(() => validate("a"), /must be 3-63 characters, got 1/);
		});

		it("should reject names too long", () => {
			const longName = "a".repeat(64);
			assert.throws(
				() => validate(longName),
				/must be 3-63 characters, got 64/,
			);
		});
	});

	describe("invalid names - character constraints", () => {
		it("should reject uppercase characters", () => {
			assert.throws(() => validate("My-App"), /must be lowercase alphanumeric/);
			assert.throws(
				() => validate("API-SERVER"),
				/must be lowercase alphanumeric/,
			);
		});

		it("should reject special characters", () => {
			const invalidChars = [
				"my_app",
				"my.app",
				"my@app",
				"my app",
				"my+app",
				"my/app",
			];

			for (const name of invalidChars) {
				assert.throws(
					() => validate(name),
					/must be lowercase alphanumeric/,
					`Expected '${name}' to be rejected`,
				);
			}
		});

		it("should reject leading hyphens", () => {
			assert.throws(() => validate("-myapp"), /must be lowercase alphanumeric/);
		});

		it("should reject trailing hyphens", () => {
			assert.throws(() => validate("myapp-"), /must be lowercase alphanumeric/);
		});

		it("should reject consecutive hyphens", () => {
			assert.throws(
				() => validate("my--app"),
				/cannot contain consecutive hyphens/,
			);
			assert.throws(
				() => validate("my---app"),
				/cannot contain consecutive hyphens/,
			);
		});
	});

	describe("invalid names - reserved names", () => {
		it("should reject common reserved names", () => {
			const reservedNames = [
				"api",
				"www",
				"admin",
				"root",
				"localhost",
				"production",
				"staging",
				"test",
			];

			for (const name of reservedNames) {
				assert.throws(
					() => validate(name),
					new RegExp(`Resource name '${name}' is reserved`),
					`Expected '${name}' to be rejected as reserved`,
				);
			}
		});
	});

	describe("invalid names - internationalized domains", () => {
		it("should reject xn-- prefix", () => {
			assert.throws(() => validate("xn--example"), /cannot start with "xn--"/);
		});
	});
});
