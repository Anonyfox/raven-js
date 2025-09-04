/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for simplified SoarConfig class.
 */

import assert from "node:assert";
import { unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { SoarConfig } from "./soar-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testConfigPath = join(__dirname, "../../test-config.js");

describe("SoarConfig", () => {
	const validConfig = {
		artifact: { path: "./dist" },
		target: { name: "cloudflare-pages", projectName: "my-app" },
	};

	describe("constructor", () => {
		it("should create instance with valid config", () => {
			const config = new SoarConfig(validConfig);
			assert.strictEqual(config instanceof SoarConfig, true);
		});

		it("should handle empty config", () => {
			const config = new SoarConfig({});
			assert.strictEqual(config instanceof SoarConfig, true);
		});

		it("should handle null/undefined config", () => {
			const nullConfig = new SoarConfig(null);
			const undefinedConfig = new SoarConfig(undefined);

			assert.strictEqual(nullConfig instanceof SoarConfig, true);
			assert.strictEqual(undefinedConfig instanceof SoarConfig, true);
		});
	});

	describe("direct property access", () => {
		it("should have direct access to artifact", () => {
			const config = new SoarConfig(validConfig);
			assert.deepStrictEqual(config.artifact, { path: "./dist" });
		});

		it("should have direct access to target", () => {
			const config = new SoarConfig(validConfig);
			assert.deepStrictEqual(config.target, {
				name: "cloudflare-pages",
				projectName: "my-app",
			});
		});
	});

	describe("getter methods", () => {
		it("should return artifact via getter", () => {
			const config = new SoarConfig(validConfig);
			assert.deepStrictEqual(config.getArtifact(), { path: "./dist" });
		});

		it("should return target via getter", () => {
			const config = new SoarConfig(validConfig);
			assert.deepStrictEqual(config.getTarget(), {
				name: "cloudflare-pages",
				projectName: "my-app",
			});
		});

		it("should return undefined for missing properties", () => {
			const config = new SoarConfig({});
			assert.strictEqual(config.getArtifact(), undefined);
			assert.strictEqual(config.getTarget(), undefined);
		});
	});

	describe("validation", () => {
		it("should validate successfully with valid config", () => {
			// Set required environment variables for CloudflareWorkers
			process.env.CF_API_TOKEN = "test-token";
			process.env.CF_ACCOUNT_ID = "test-account";

			const config = new SoarConfig({
				artifact: { type: "static", path: "./dist" },
				target: { name: "cloudflare-workers", scriptName: "test-app" },
			});

			const errors = config.validate();
			assert.deepStrictEqual(errors, []);

			// Clean up
			delete process.env.CF_API_TOKEN;
			delete process.env.CF_ACCOUNT_ID;
		});

		it("should return errors for missing artifact", () => {
			const config = new SoarConfig({
				target: { name: "cloudflare-pages", projectName: "test-app" },
			});

			const errors = config.validate();
			assert.ok(errors.length >= 1);
			assert.ok(
				errors.some((err) => err === "Artifact configuration is required"),
			);
		});

		it("should return errors for missing target", () => {
			const config = new SoarConfig({
				artifact: { type: "static", path: "./dist" },
			});

			const errors = config.validate();
			assert.ok(errors.length >= 1);
			assert.ok(
				errors.some((err) => err === "Target configuration is required"),
			);
		});

		it("should return errors for invalid artifact", () => {
			const config = new SoarConfig({
				artifact: { type: "invalid-type", path: "./dist" },
				target: { name: "cloudflare-pages", projectName: "test-app" },
			});

			const errors = config.validate();
			assert.ok(errors.length > 0);
			assert.ok(errors[0].startsWith("Artifact:"));
		});

		it("should return errors for invalid target", () => {
			const config = new SoarConfig({
				artifact: { type: "static", path: "./dist" },
				target: { name: "invalid-target" },
			});

			const errors = config.validate();
			assert.ok(errors.length > 0);
			assert.ok(errors.some((err) => err.startsWith("Target:")));
		});

		it("should format validation errors nicely", () => {
			const config = new SoarConfig({});

			const formatted = config.validateAndFormat();
			assert.ok(formatted !== null);
			assert.ok(formatted.includes("Configuration validation failed:"));
			assert.ok(formatted.includes("Artifact configuration is required"));
			assert.ok(formatted.includes("Target configuration is required"));
		});

		it("should return null for valid config formatting", () => {
			// Set required environment variables for CloudflareWorkers
			process.env.CF_API_TOKEN = "test-token";
			process.env.CF_ACCOUNT_ID = "test-account";

			const config = new SoarConfig({
				artifact: { type: "static", path: "./dist" },
				target: { name: "cloudflare-workers", scriptName: "test-app" },
			});

			const formatted = config.validateAndFormat();
			assert.strictEqual(formatted, null);

			// Clean up
			delete process.env.CF_API_TOKEN;
			delete process.env.CF_ACCOUNT_ID;
		});
	});

	describe("fromString", () => {
		it("should create instance from JavaScript code with default export", async () => {
			const jsCode = `
				export default {
					artifact: { path: "./dist" },
					target: { name: "cloudflare-pages", projectName: "test-app" }
				};
			`;

			const config = await SoarConfig.fromString(jsCode);

			assert.strictEqual(config instanceof SoarConfig, true);
			assert.deepStrictEqual(config.artifact, { path: "./dist" });
			assert.deepStrictEqual(config.target, {
				name: "cloudflare-pages",
				projectName: "test-app",
			});
		});

		it("should create instance from JavaScript code with specific named export", async () => {
			const jsCode = `
				export const prodConfig = {
					artifact: { path: "./build" },
					target: { name: "cloudflare-pages", projectName: "prod-app" }
				};
				export const devConfig = {
					artifact: { path: "./dev-dist" },
					target: { name: "cloudflare-pages", projectName: "dev-app" }
				};
			`;

			const config = await SoarConfig.fromString(jsCode, "prodConfig");

			assert.strictEqual(config instanceof SoarConfig, true);
			assert.deepStrictEqual(config.artifact, { path: "./build" });
			assert.deepStrictEqual(config.target, {
				name: "cloudflare-pages",
				projectName: "prod-app",
			});
		});

		it("should throw error for non-existent named export", async () => {
			const jsCode = `
				export default {
					artifact: { path: "./dist" },
					target: { name: "cloudflare-pages", projectName: "test-app" }
				};
			`;

			await assert.rejects(
				() => SoarConfig.fromString(jsCode, "nonExistentExport"),
				/Export 'nonExistentExport' not found/,
			);
		});

		it("should throw for invalid JavaScript input", async () => {
			await assert.rejects(
				() => SoarConfig.fromString(123),
				/Configuration string cannot be empty/,
			);

			await assert.rejects(
				() => SoarConfig.fromString("invalid javascript code {{{"),
				/Failed to parse configuration string/,
			);
		});
	});

	describe("fromFile", () => {
		before(async () => {
			// Create test config file with both default and named exports
			const testConfigContent = `export default {
	artifact: { path: "./test-dist" },
	target: { name: "cloudflare-pages", projectName: "test-from-file" }
};

export const staging = {
	artifact: { path: "./staging-dist" },
	target: { name: "cloudflare-pages", projectName: "staging-app" }
};`;
			await writeFile(testConfigPath, testConfigContent);
		});

		after(async () => {
			// Clean up test config file
			try {
				await unlink(testConfigPath);
			} catch {
				// Ignore if file doesn't exist
			}
		});

		it("should create instance from JavaScript file", async () => {
			// Use the resolved path to the test config file
			const config = await SoarConfig.fromFile(testConfigPath);

			assert.strictEqual(config instanceof SoarConfig, true);
			assert.deepStrictEqual(config.artifact, { path: "./test-dist" });
			assert.deepStrictEqual(config.target, {
				name: "cloudflare-pages",
				projectName: "test-from-file",
			});
		});

		it("should create instance from JavaScript file with named export", async () => {
			const config = await SoarConfig.fromFile(testConfigPath, "staging");

			assert.strictEqual(config instanceof SoarConfig, true);
			assert.deepStrictEqual(config.artifact, { path: "./staging-dist" });
			assert.deepStrictEqual(config.target, {
				name: "cloudflare-pages",
				projectName: "staging-app",
			});
		});

		it("should throw for non-existent file", async () => {
			await assert.rejects(
				() => SoarConfig.fromFile("./non-existent-config.js"),
				/Configuration file not found/,
			);
		});

		it("should throw for non-existent named export in file", async () => {
			await assert.rejects(
				() => SoarConfig.fromFile(testConfigPath, "nonExistentExport"),
				/Export 'nonExistentExport' not found/,
			);
		});
	});

	describe("edge cases", () => {
		it("should handle partial config", () => {
			const partialConfig = {
				artifact: { path: "./build" },
			};

			const config = new SoarConfig(partialConfig);
			assert.deepStrictEqual(config.artifact, { path: "./build" });
			assert.strictEqual(config.target, undefined);
		});

		it("should handle complex target configurations", () => {
			const complexConfig = {
				artifact: { path: "./dist", type: "static" },
				target: {
					name: "cloudflare-pages",
					projectName: "my-complex-app",
					region: "us-west-2",
					environment: "production",
					customProperty: "custom-value",
				},
			};

			const config = new SoarConfig(complexConfig);
			assert.strictEqual(config.target.name, "cloudflare-pages");
			assert.strictEqual(config.target.customProperty, "custom-value");
		});

		it("should not mutate original config object", () => {
			const originalConfig = { ...validConfig };
			const config = new SoarConfig(originalConfig);

			// Modify the config instance
			config.artifact = { path: "./modified" };

			// Original should be unchanged
			assert.deepStrictEqual(originalConfig.artifact, { path: "./dist" });
		});
	});
});
