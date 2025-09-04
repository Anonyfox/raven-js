/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for targets module exports.
 *
 * Tests the public API of the targets module, ensuring only the correct
 * classes and functions are exported and that they work correctly.
 */

import { strict as assert } from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import * as targets from "./index.js";
import { selectTarget } from "./select.js";

// Store original environment
const originalEnv = process.env;

describe("targets module", () => {
	beforeEach(() => {
		process.env = { ...originalEnv };
		process.env.CF_API_TOKEN = "test-token-12345";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("exports", () => {
		it("should export CloudflareWorkers class", () => {
			assert.ok(typeof targets.CloudflareWorkers === "function");
		});

		it("should export selectTarget function", () => {
			assert.ok(typeof targets.selectTarget === "function");
			assert.strictEqual(targets.selectTarget, selectTarget);
		});

		it("should not export provider-level classes", () => {
			// Provider classes should be internal abstractions
			assert.strictEqual(targets.Cloudflare, undefined);
			assert.strictEqual(targets.DigitalOcean, undefined);
			assert.strictEqual(targets.Base, undefined);
		});

		it("should have expected number of exports", () => {
			const exportNames = Object.keys(targets);

			// Should only export concrete product classes and utility functions
			assert.deepStrictEqual(exportNames.sort(), [
				"CloudflareWorkers",
				"selectTarget",
			]);
		});
	});

	describe("selectTarget export", () => {
		it("should create CloudflareWorkers via selectTarget", () => {
			// Set up environment for this test
			const originalEnv = { ...process.env };
			process.env.CF_API_TOKEN = "test-token-12345";
			process.env.CF_ACCOUNT_ID = "test-account-12345";

			const config = {
				name: "cloudflare-workers",
				scriptName: "test-script",
			};

			const target = targets.selectTarget(config);

			assert.ok(target.constructor.name === "CloudflareWorkers");

			// Restore environment
			process.env = originalEnv;
		});

		it("should throw error for unsupported targets", () => {
			assert.throws(
				() => targets.selectTarget({ name: "unsupported-target" }),
				{
					name: "Error",
					message: "Unsupported target: unsupported-target",
				},
			);
		});
	});

	describe("integration", () => {
		it("should work together - selectTarget creates instances of exported classes", () => {
			// Set up environment for this test
			const originalEnv = { ...process.env };
			process.env.CF_API_TOKEN = "test-token-12345";
			process.env.CF_ACCOUNT_ID = "test-account-12345";

			const config = {
				name: "cloudflare-workers",
				scriptName: "integration-test",
			};

			// Use selectTarget to create instance
			const selectedTarget = targets.selectTarget(config);

			// Create instance directly from exported class
			const directTarget = new targets.CloudflareWorkers(config);

			// Both should be instances of the same class
			assert.ok(selectedTarget instanceof targets.CloudflareWorkers);
			assert.ok(directTarget instanceof targets.CloudflareWorkers);

			// Both should have same constructor
			assert.strictEqual(
				selectedTarget.constructor.name,
				directTarget.constructor.name,
			);

			// Restore environment
			process.env = originalEnv;
		});

		it("should validate instances created through both methods", () => {
			// Set up environment for this test
			const originalEnv = { ...process.env };
			process.env.CF_API_TOKEN = "test-token-12345";
			process.env.CF_ACCOUNT_ID = "test-account-12345";

			const config = {
				name: "cloudflare-workers",
				scriptName: "validation-test",
			};

			const selectedTarget = targets.selectTarget(config);
			const directTarget = new targets.CloudflareWorkers(config);

			// Both should validate successfully
			const selectedErrors = selectedTarget.validate();
			const directErrors = directTarget.validate();

			assert.strictEqual(selectedErrors.length, 0);
			assert.strictEqual(directErrors.length, 0);

			// Restore environment
			process.env = originalEnv;
		});
	});

	describe("future compatibility", () => {
		it("should maintain stable API surface", () => {
			// This test documents the current API and will catch breaking changes
			const expectedExports = ["CloudflareWorkers", "selectTarget"];

			const actualExports = Object.keys(targets).sort();

			assert.deepStrictEqual(
				actualExports,
				expectedExports.sort(),
				"API surface changed - review for breaking changes",
			);
		});

		it("should maintain CloudflareWorkers interface", () => {
			// Set up environment for this test
			const originalEnv = { ...process.env };
			process.env.CF_API_TOKEN = "test-token-12345";
			process.env.CF_ACCOUNT_ID = "test-account-12345";

			const config = {
				name: "cloudflare-workers",
				scriptName: "interface-test",
			};

			const workers = new targets.CloudflareWorkers(config);

			// Document expected instance methods
			const expectedInstanceMethods = [
				"validate",
				"getCredentials",
				"deploy",
				"getSupportedArtifactTypes",
				"getSupportedTransports",
			];

			for (const method of expectedInstanceMethods) {
				assert.ok(
					typeof workers[method] === "function",
					`Expected instance method ${method} not found`,
				);
			}

			// Restore environment
			process.env = originalEnv;
		});
	});
});
