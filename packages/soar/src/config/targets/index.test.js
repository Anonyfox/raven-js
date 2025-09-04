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
import { CloudflarePages } from "./cloudflare-pages.js";
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
		it("should export CloudflarePages class", () => {
			assert.ok(typeof targets.CloudflarePages === "function");
			assert.strictEqual(targets.CloudflarePages, CloudflarePages);
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
				"CloudflarePages",
				"selectTarget",
			]);
		});
	});

	describe("CloudflarePages export", () => {
		it("should create working CloudflarePages instances", () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "test-project",
			};

			const pages = new targets.CloudflarePages(config);

			assert.ok(pages instanceof CloudflarePages);
			assert.strictEqual(pages.getName(), "cloudflare-pages");
			assert.strictEqual(pages.getProjectName(), "test-project");
		});

		it("should have static methods available", () => {
			assert.deepStrictEqual(
				targets.CloudflarePages.getSupportedArtifactTypes(),
				["static"],
			);

			assert.deepStrictEqual(targets.CloudflarePages.getSupportedTransports(), [
				"http",
			]);
		});
	});

	describe("selectTarget export", () => {
		it("should create CloudflarePages via selectTarget", () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "test-project",
			};

			const target = targets.selectTarget(config);

			assert.ok(target instanceof CloudflarePages);
			assert.strictEqual(target.getName(), "cloudflare-pages");
			assert.strictEqual(target.getProjectName(), "test-project");
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
			const config = {
				name: "cloudflare-pages",
				projectName: "integration-test",
				region: "us-east-1",
				environment: "testing",
			};

			// Use selectTarget to create instance
			const selectedTarget = targets.selectTarget(config);

			// Create instance directly from exported class
			const directTarget = new targets.CloudflarePages(config);

			// Both should be instances of the same class
			assert.ok(selectedTarget instanceof targets.CloudflarePages);
			assert.ok(directTarget instanceof targets.CloudflarePages);

			// Both should have same configuration
			assert.strictEqual(selectedTarget.getName(), directTarget.getName());
			assert.strictEqual(
				selectedTarget.getProjectName(),
				directTarget.getProjectName(),
			);
			assert.strictEqual(selectedTarget.getRegion(), directTarget.getRegion());
			assert.strictEqual(
				selectedTarget.getEnvironment(),
				directTarget.getEnvironment(),
			);
		});

		it("should validate instances created through both methods", () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "validation-test",
			};

			const selectedTarget = targets.selectTarget(config);
			const directTarget = new targets.CloudflarePages(config);

			// Both should validate successfully
			const selectedErrors = selectedTarget.validate();
			const directErrors = directTarget.validate();

			assert.strictEqual(selectedErrors.length, 0);
			assert.strictEqual(directErrors.length, 0);
		});
	});

	describe("future compatibility", () => {
		it("should maintain stable API surface", () => {
			// This test documents the current API and will catch breaking changes
			const expectedExports = ["CloudflarePages", "selectTarget"];

			const actualExports = Object.keys(targets).sort();

			assert.deepStrictEqual(
				actualExports,
				expectedExports.sort(),
				"API surface changed - review for breaking changes",
			);
		});

		it("should maintain CloudflarePages interface", () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "interface-test",
			};

			const pages = new targets.CloudflarePages(config);

			// Document expected instance methods
			const expectedInstanceMethods = [
				"getName",
				"getProjectName",
				"getRegion",
				"getEnvironment",
				"getApiToken",
				"getAccountId",
				"getZoneId",
				"validate",
				"getCredentials",
				"deploy",
			];

			for (const method of expectedInstanceMethods) {
				assert.ok(
					typeof pages[method] === "function",
					`Expected instance method ${method} not found`,
				);
			}

			// Document expected static methods
			const expectedStaticMethods = [
				"getSupportedArtifactTypes",
				"getSupportedTransports",
			];

			for (const method of expectedStaticMethods) {
				assert.ok(
					typeof targets.CloudflarePages[method] === "function",
					`Expected static method ${method} not found`,
				);
			}
		});
	});
});
