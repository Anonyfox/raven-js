/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Cloudflare provider class.
 *
 * Tests the abstract Cloudflare provider class that serves as base
 * for all Cloudflare services like Pages, Workers, etc.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Base } from "./base.js";
import { Cloudflare } from "./cloudflare.js";

describe("Cloudflare", () => {
	describe("constructor", () => {
		it("should create instance successfully", () => {
			const cloudflare = new Cloudflare();
			assert.ok(cloudflare instanceof Cloudflare);
			assert.ok(cloudflare instanceof Base);
		});
	});

	describe("validate", () => {
		it("should return empty array for base provider", () => {
			const cloudflare = new Cloudflare();
			const errors = cloudflare.validate();

			assert.ok(Array.isArray(errors));
			assert.strictEqual(errors.length, 0);
		});

		it("should call super.validate", () => {
			const cloudflare = new Cloudflare();
			const errors = cloudflare.validate();

			// Should inherit base behavior
			assert.ok(Array.isArray(errors));
			assert.strictEqual(errors.length, 0);
		});
	});

	describe("getCredentials", () => {
		it("should throw error indicating method must be implemented by product classes", async () => {
			const cloudflare = new Cloudflare();

			await assert.rejects(() => cloudflare.getCredentials(), {
				name: "Error",
				message:
					"getCredentials() must be implemented by concrete product classes",
			});
		});
	});

	describe("fromEnvironment", () => {
		it("should create Cloudflare instance from environment", () => {
			const cloudflare = Cloudflare.fromEnvironment();

			assert.ok(cloudflare instanceof Cloudflare);
			assert.ok(cloudflare instanceof Base);
		});

		it("should return new instance each time", () => {
			const cloudflare1 = Cloudflare.fromEnvironment();
			const cloudflare2 = Cloudflare.fromEnvironment();

			assert.notStrictEqual(cloudflare1, cloudflare2);
		});
	});

	describe("inheritance", () => {
		it("should inherit Base methods that throw errors", async () => {
			const cloudflare = new Cloudflare();

			// Should inherit deploy method from Base
			await assert.rejects(() => cloudflare.deploy({ path: "./dist" }), {
				name: "Error",
				message: "deploy() must be implemented by subclasses",
			});
		});

		it("should inherit Base static methods that throw errors", () => {
			// Should inherit static methods from Base
			assert.throws(() => Cloudflare.getSupportedArtifactTypes(), {
				name: "Error",
				message:
					"getSupportedArtifactTypes() must be implemented by subclasses",
			});

			assert.throws(() => Cloudflare.getSupportedTransports(), {
				name: "Error",
				message: "getSupportedTransports() must be implemented by subclasses",
			});
		});
	});
});
