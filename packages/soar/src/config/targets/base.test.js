/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Base target class.
 *
 * Tests the abstract base class interface and ensures all required methods
 * throw appropriate errors when not implemented by subclasses.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Base } from "./base.js";

describe("Base", () => {
	describe("constructor", () => {
		it("should create instance successfully", () => {
			const base = new Base();
			assert.ok(base instanceof Base);
		});
	});

	describe("validate", () => {
		it("should return empty array by default", () => {
			const base = new Base();
			const errors = base.validate();

			assert.ok(Array.isArray(errors));
			assert.strictEqual(errors.length, 0);
		});
	});

	describe("getCredentials", () => {
		it("should throw error indicating method must be implemented", async () => {
			const base = new Base();

			await assert.rejects(() => base.getCredentials(), {
				name: "Error",
				message: "getCredentials() must be implemented by subclasses",
			});
		});
	});

	describe("deploy", () => {
		it("should throw error indicating method must be implemented", async () => {
			const base = new Base();
			const mockArtifact = { path: "./dist" };

			await assert.rejects(() => base.deploy(mockArtifact), {
				name: "Error",
				message: "deploy() must be implemented by subclasses",
			});
		});
	});

	describe("getSupportedArtifactTypes", () => {
		it("should throw error indicating method must be implemented", () => {
			assert.throws(() => Base.getSupportedArtifactTypes(), {
				name: "Error",
				message:
					"getSupportedArtifactTypes() must be implemented by subclasses",
			});
		});
	});

	describe("getSupportedTransports", () => {
		it("should throw error indicating method must be implemented", () => {
			assert.throws(() => Base.getSupportedTransports(), {
				name: "Error",
				message: "getSupportedTransports() must be implemented by subclasses",
			});
		});
	});
});
