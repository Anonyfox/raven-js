/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Base artifact class.
 *
 * Tests the abstract base class interface and ensures all required methods
 * throw appropriate errors when not implemented by subclasses.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Base } from "./base.js";

describe("Base", () => {
	describe("constructor", () => {
		it("should create instance with valid path", () => {
			const base = new Base("/path/to/artifact");
			assert.ok(base instanceof Base);
			assert.strictEqual(base.getPath(), "/path/to/artifact");
		});

		it("should trim whitespace from path", () => {
			const base = new Base("  /path/to/artifact  ");
			assert.strictEqual(base.getPath(), "/path/to/artifact");
		});

		it("should throw error for missing path", () => {
			assert.throws(() => new Base(), {
				name: "Error",
				message: "Artifact path is required and must be a string",
			});

			assert.throws(() => new Base(null), {
				name: "Error",
				message: "Artifact path is required and must be a string",
			});

			assert.throws(() => new Base(undefined), {
				name: "Error",
				message: "Artifact path is required and must be a string",
			});
		});

		it("should throw error for non-string path", () => {
			assert.throws(() => new Base(123), {
				name: "Error",
				message: "Artifact path is required and must be a string",
			});

			assert.throws(() => new Base({}), {
				name: "Error",
				message: "Artifact path is required and must be a string",
			});

			assert.throws(() => new Base([]), {
				name: "Error",
				message: "Artifact path is required and must be a string",
			});
		});

		it("should throw error for empty path", () => {
			assert.throws(() => new Base(""), {
				name: "Error",
				message: "Artifact path cannot be empty",
			});

			assert.throws(() => new Base("   "), {
				name: "Error",
				message: "Artifact path cannot be empty",
			});
		});
	});

	describe("getPath", () => {
		it("should return the artifact path", () => {
			const base = new Base("/my/artifact/path");
			assert.strictEqual(base.getPath(), "/my/artifact/path");
		});
	});

	describe("validate", () => {
		it("should return empty array by default", () => {
			const base = new Base("/path/to/artifact");
			const errors = base.validate();

			assert.ok(Array.isArray(errors));
			assert.strictEqual(errors.length, 0);
		});
	});

	describe("getType", () => {
		it("should throw error indicating method must be implemented", () => {
			const base = new Base("/path/to/artifact");

			assert.throws(() => base.getType(), {
				name: "Error",
				message: "getType() must be implemented by subclasses",
			});
		});
	});

	describe("prepare", () => {
		it("should throw error indicating method must be implemented", async () => {
			const base = new Base("/path/to/artifact");

			await assert.rejects(() => base.prepare(), {
				name: "Error",
				message: "prepare() must be implemented by subclasses",
			});
		});
	});
});
