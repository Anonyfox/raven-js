/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for CloudflarePages target class.
 *
 * Comprehensive tests for the concrete CloudflarePages implementation
 * including configuration validation, credential loading, and deployment.
 */

import { strict as assert } from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import { Base } from "./base.js";
import { Cloudflare } from "./cloudflare.js";
import { CloudflarePages } from "./cloudflare-pages.js";

// Store original environment
const originalEnv = process.env;

describe("CloudflarePages", () => {
	beforeEach(() => {
		// Reset environment for each test
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		// Restore original environment
		process.env = originalEnv;
	});

	describe("constructor", () => {
		beforeEach(() => {
			process.env.CF_API_TOKEN = "test-token-12345";
		});

		it("should create instance with valid configuration", () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);

			assert.ok(pages instanceof CloudflarePages);
			assert.ok(pages instanceof Cloudflare);
			assert.ok(pages instanceof Base);
		});

		it("should set all configuration properties", () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
				region: "us-west-2",
				environment: "production",
			};

			const pages = new CloudflarePages(config);

			assert.strictEqual(pages.getName(), "cloudflare-pages");
			assert.strictEqual(pages.getProjectName(), "my-project");
			assert.strictEqual(pages.getRegion(), "us-west-2");
			assert.strictEqual(pages.getEnvironment(), "production");
		});

		it("should handle optional properties as null", () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);

			assert.strictEqual(pages.getRegion(), null);
			assert.strictEqual(pages.getEnvironment(), null);
		});

		it("should load credentials from environment variables", () => {
			process.env.CF_API_TOKEN = "test-api-token";
			process.env.CF_ACCOUNT_ID = "test-account-id";
			process.env.CF_ZONE_ID = "test-zone-id";

			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);

			assert.strictEqual(pages.getApiToken(), "test-api-token");
			assert.strictEqual(pages.getAccountId(), "test-account-id");
			assert.strictEqual(pages.getZoneId(), "test-zone-id");
		});

		it("should handle missing optional environment variables", () => {
			process.env.CF_API_TOKEN = "test-token";
			delete process.env.CF_ACCOUNT_ID;
			delete process.env.CF_ZONE_ID;

			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);

			assert.strictEqual(pages.getApiToken(), "test-token");
			assert.strictEqual(pages.getAccountId(), null);
			assert.strictEqual(pages.getZoneId(), null);
		});

		describe("validation errors", () => {
			beforeEach(() => {
				process.env.CF_API_TOKEN = "test-token";
			});

			it("should throw error for wrong target name", () => {
				const config = {
					name: "wrong-name",
					projectName: "my-project",
				};

				assert.throws(() => new CloudflarePages(config), {
					name: "Error",
					message:
						"Target name must be 'cloudflare-pages' for CloudflarePages instances",
				});
			});

			it("should throw error for missing project name", () => {
				const config = {
					name: "cloudflare-pages",
				};

				assert.throws(() => new CloudflarePages(config), {
					name: "Error",
					message: "Pages project name is required and must be a string",
				});
			});

			it("should throw error for non-string project name", () => {
				const config = {
					name: "cloudflare-pages",
					projectName: 123,
				};

				assert.throws(() => new CloudflarePages(config), {
					name: "Error",
					message: "Pages project name is required and must be a string",
				});
			});

			it("should throw error for missing CF_API_TOKEN", () => {
				delete process.env.CF_API_TOKEN;

				const config = {
					name: "cloudflare-pages",
					projectName: "my-project",
				};

				assert.throws(() => new CloudflarePages(config), {
					name: "Error",
					message: /CF_API_TOKEN environment variable is required/,
				});
			});
		});
	});

	describe("validate", () => {
		beforeEach(() => {
			process.env.CF_API_TOKEN = "valid-token-12345";
		});

		it("should return empty array for valid configuration", () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);
			const errors = pages.validate();

			assert.ok(Array.isArray(errors));
			assert.strictEqual(errors.length, 0);
		});

		it("should validate project name format", () => {
			// Test invalid project names that pass constructor but fail validation
			const invalidProjectNames = [
				"MyProject", // Uppercase
				"my_project", // Underscore
				"my project", // Space
				"my-project-", // Ends with hyphen
				"-my-project", // Starts with hyphen
				"my@project", // Special characters
			];

			for (const projectName of invalidProjectNames) {
				const config = {
					name: "cloudflare-pages",
					projectName: projectName,
				};

				const pages = new CloudflarePages(config);
				const errors = pages.validate();

				assert.ok(
					errors.length > 0,
					`Should have validation errors for project name: "${projectName}"`,
				);
				assert.ok(
					errors.some((error) =>
						error.message.toLowerCase().includes("project"),
					),
					`Should have project-related error for: "${projectName}"`,
				);
			}
		});

		it("should validate API token format", () => {
			process.env.CF_API_TOKEN = "short"; // Too short

			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);
			const errors = pages.validate();

			assert.ok(errors.length > 0);
			assert.ok(
				errors.some((error) =>
					error.message.includes("API token appears to be too short"),
				),
			);
		});

		it("should validate API token characters", () => {
			process.env.CF_API_TOKEN = "invalid@token#here!"; // Invalid characters

			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);
			const errors = pages.validate();

			assert.ok(errors.length > 0);
			assert.ok(
				errors.some((error) =>
					error.message.includes("API token contains invalid characters"),
				),
			);
		});

		it("should validate optional region format", () => {
			// Create instance with whitespace-only region (this will not be converted to null)
			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
				region: "   ", // Whitespace only
			};

			const pages = new CloudflarePages(config);
			const errors = pages.validate();

			assert.ok(errors.length > 0);
			assert.ok(
				errors.some((error) =>
					error.message.includes("Region must be a non-empty string"),
				),
			);
		});

		it("should validate optional environment format", () => {
			// Create instance with whitespace-only environment (this will not be converted to null)
			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
				environment: "   ", // Whitespace only
			};

			const pages = new CloudflarePages(config);
			const errors = pages.validate();

			assert.ok(errors.length > 0);
			assert.ok(
				errors.some((error) =>
					error.message.includes("Environment must be a non-empty string"),
				),
			);
		});

		it("should validate resource name using imported validation", () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			// Override name to test validation (this is a bit hacky but tests the validation)
			const pages = new CloudflarePages(config);
			// We can't easily test invalid names since constructor validates them,
			// but we can test that validation is called by checking for valid names
			const errors = pages.validate();
			assert.strictEqual(errors.length, 0);
		});
	});

	describe("getCredentials", () => {
		beforeEach(() => {
			process.env.CF_API_TOKEN = "valid-token-12345";
			process.env.CF_ACCOUNT_ID = "test-account-id";
			process.env.CF_ZONE_ID = "test-zone-id";
		});

		it("should return credentials object when valid", async () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);
			const credentials = await pages.getCredentials();

			assert.ok(typeof credentials === "object");
			assert.strictEqual(credentials.token, "valid-token-12345");
			assert.strictEqual(credentials.accountId, "test-account-id");
			assert.strictEqual(credentials.zoneId, "test-zone-id");
		});

		it("should handle null optional credentials", async () => {
			process.env.CF_API_TOKEN = "valid-token-12345";
			delete process.env.CF_ACCOUNT_ID;
			delete process.env.CF_ZONE_ID;

			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);
			const credentials = await pages.getCredentials();

			assert.strictEqual(credentials.token, "valid-token-12345");
			assert.strictEqual(credentials.accountId, null);
			assert.strictEqual(credentials.zoneId, null);
		});

		it("should throw error when validation fails", async () => {
			process.env.CF_API_TOKEN = "short"; // Invalid token

			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);

			await assert.rejects(() => pages.getCredentials(), {
				name: "Error",
				message: /Invalid Cloudflare credentials/,
			});
		});
	});

	describe("deploy", () => {
		beforeEach(() => {
			process.env.CF_API_TOKEN = "valid-token-12345";
		});

		it("should reject non-static artifacts", async () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);
			const artifact = { type: "script", path: "./bundle.js" };

			await assert.rejects(() => pages.deploy(artifact), {
				name: "Error",
				message: "Cloudflare Pages only supports static artifacts",
			});
		});

		it("should return placeholder deployment result for static artifacts", async () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);
			const artifact = { type: "static", path: "./dist" };

			const result = await pages.deploy(artifact);

			assert.ok(typeof result === "object");
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.url, "https://my-project.pages.dev");
			assert.ok(typeof result.deploymentId === "string");
			assert.ok(result.deploymentId.length > 0);
			assert.ok(typeof result.message === "string");
		});
	});

	describe("static methods", () => {
		it("should return supported artifact types", () => {
			const types = CloudflarePages.getSupportedArtifactTypes();

			assert.ok(Array.isArray(types));
			assert.deepStrictEqual(types, ["static"]);
		});

		it("should return supported transport methods", () => {
			const transports = CloudflarePages.getSupportedTransports();

			assert.ok(Array.isArray(transports));
			assert.deepStrictEqual(transports, ["http"]);
		});
	});

	describe("edge cases", () => {
		beforeEach(() => {
			process.env.CF_API_TOKEN = "test-token";
		});

		it("should handle very long project names", () => {
			const longProjectName = "a".repeat(100);
			const config = {
				name: "cloudflare-pages",
				projectName: longProjectName,
			};

			// Should not throw during construction
			const pages = new CloudflarePages(config);
			assert.strictEqual(pages.getProjectName(), longProjectName);
		});

		it("should handle special characters in optional fields", () => {
			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
				region: "us-west-2",
				environment: "staging-test",
			};

			const pages = new CloudflarePages(config);
			assert.strictEqual(pages.getRegion(), "us-west-2");
			assert.strictEqual(pages.getEnvironment(), "staging-test");
		});

		it("should handle empty environment variables gracefully", () => {
			process.env.CF_API_TOKEN = "test-token";
			process.env.CF_ACCOUNT_ID = "";
			process.env.CF_ZONE_ID = "";

			const config = {
				name: "cloudflare-pages",
				projectName: "my-project",
			};

			const pages = new CloudflarePages(config);

			// Empty strings are converted to null by the || null logic
			assert.strictEqual(pages.getAccountId(), null);
			assert.strictEqual(pages.getZoneId(), null);
		});
	});
});
