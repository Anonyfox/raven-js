/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for DigitalOcean provider class.
 *
 * Tests the abstract DigitalOcean provider class that serves as base
 * for all DigitalOcean services like Droplets, Functions, etc.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Base } from "./base.js";
import { DigitalOcean } from "./digitalocean.js";

describe("DigitalOcean", () => {
	describe("constructor", () => {
		it("should create instance successfully", () => {
			const digitalocean = new DigitalOcean();
			assert.ok(digitalocean instanceof DigitalOcean);
			assert.ok(digitalocean instanceof Base);
		});
	});

	describe("validate", () => {
		it("should return empty array for base provider", () => {
			const digitalocean = new DigitalOcean();
			const errors = digitalocean.validate();

			assert.ok(Array.isArray(errors));
			assert.strictEqual(errors.length, 0);
		});

		it("should call super.validate", () => {
			const digitalocean = new DigitalOcean();
			const errors = digitalocean.validate();

			// Should inherit base behavior
			assert.ok(Array.isArray(errors));
			assert.strictEqual(errors.length, 0);
		});
	});

	describe("getCredentials", () => {
		it("should throw error indicating method must be implemented by product classes", async () => {
			const digitalocean = new DigitalOcean();

			await assert.rejects(() => digitalocean.getCredentials(), {
				name: "Error",
				message:
					"getCredentials() must be implemented by concrete product classes",
			});
		});
	});

	describe("inheritance", () => {
		it("should inherit Base methods that throw errors", async () => {
			const digitalocean = new DigitalOcean();

			// Should inherit deploy method from Base
			await assert.rejects(() => digitalocean.deploy({ path: "./dist" }), {
				name: "Error",
				message: "deploy() must be implemented by subclasses",
			});
		});

		it("should inherit Base static methods that throw errors", () => {
			// Should inherit static methods from Base
			assert.throws(() => DigitalOcean.getSupportedArtifactTypes(), {
				name: "Error",
				message:
					"getSupportedArtifactTypes() must be implemented by subclasses",
			});

			assert.throws(() => DigitalOcean.getSupportedTransports(), {
				name: "Error",
				message: "getSupportedTransports() must be implemented by subclasses",
			});
		});
	});
});
