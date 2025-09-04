/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for target selection function.
 *
 * Tests the pure function that selects and instantiates the correct
 * target class based on configuration name property.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Base } from "./base.js";
import { selectTarget } from "./select.js";

// Store original environment for tests
const originalEnv = process.env;

describe("selectTarget", () => {
	describe("input validation", () => {
		it("should throw error when config is not an object", () => {
			assert.throws(() => selectTarget(null), {
				name: "Error",
				message: "Target config must be an object",
			});

			assert.throws(() => selectTarget(undefined), {
				name: "Error",
				message: "Target config must be an object",
			});

			assert.throws(() => selectTarget("string"), {
				name: "Error",
				message: "Target config must be an object",
			});

			assert.throws(() => selectTarget(123), {
				name: "Error",
				message: "Target config must be an object",
			});
		});

		it("should throw error when name property is missing", () => {
			assert.throws(() => selectTarget({}), {
				name: "Error",
				message: 'Target config must have a "name" property',
			});

			assert.throws(() => selectTarget({ projectName: "test" }), {
				name: "Error",
				message: 'Target config must have a "name" property',
			});
		});

		it("should throw error when name property is not a string", () => {
			assert.throws(() => selectTarget({ name: 123 }), {
				name: "Error",
				message: 'Target config must have a "name" property',
			});

			assert.throws(() => selectTarget({ name: null }), {
				name: "Error",
				message: 'Target config must have a "name" property',
			});

			assert.throws(() => selectTarget({ name: {} }), {
				name: "Error",
				message: 'Target config must have a "name" property',
			});
		});
	});

	describe("target selection", () => {
		it("should create CloudflareWorkers instance for cloudflare-workers", () => {
			// Set up environment for this test
			process.env = { ...originalEnv };
			process.env.CF_API_TOKEN = "test-token-12345";
			process.env.CF_ACCOUNT_ID = "test-account-12345";

			const config = {
				name: "cloudflare-workers",
				scriptName: "test-script",
			};

			const target = selectTarget(config);

			assert.ok(target.constructor.name === "CloudflareWorkers");
			assert.ok(target instanceof Base);

			// Restore environment
			process.env = originalEnv;
		});

		it("should throw error for unsupported target names", () => {
			const unsupportedTargets = [
				"unknown-target",
				"digitalocean-droplet", // TODO: Not implemented yet
				"digitalocean-functions", // TODO: Not implemented yet
				"aws-s3",
				"vercel",
			];

			for (const targetName of unsupportedTargets) {
				assert.throws(
					() => selectTarget({ name: targetName, projectName: "test" }),
					{
						name: "Error",
						message: `Unsupported target: ${targetName}`,
					},
					`Should throw error for unsupported target: ${targetName}`,
				);
			}
		});
	});

	describe("error propagation", () => {
		it("should propagate validation errors from target constructors", () => {
			// Set up environment to trigger validation error
			process.env = { ...originalEnv };
			delete process.env.CF_API_TOKEN;
			const config = {
				name: "cloudflare-workers",
				scriptName: "test-script",
			};

			// CloudflareWorkers should throw error due to missing CF_API_TOKEN
			assert.throws(() => selectTarget(config), {
				name: "Error",
				message: /CF_API_TOKEN environment variable is required/,
			});

			// Restore environment
			process.env = originalEnv;
		});
	});

	describe("edge cases", () => {
		it("should handle empty string name", () => {
			assert.throws(() => selectTarget({ name: "" }), {
				name: "Error",
				message: 'Target config must have a "name" property',
			});
		});

		it("should handle whitespace-only name", () => {
			assert.throws(() => selectTarget({ name: "   " }), {
				name: "Error",
				message: "Unsupported target:    ",
			});
		});

		it("should be case-sensitive for target names", () => {
			assert.throws(() => selectTarget({ name: "CLOUDFLARE-PAGES" }), {
				name: "Error",
				message: "Unsupported target: CLOUDFLARE-PAGES",
			});

			assert.throws(() => selectTarget({ name: "Cloudflare-Pages" }), {
				name: "Error",
				message: "Unsupported target: Cloudflare-Pages",
			});
		});
	});
});
