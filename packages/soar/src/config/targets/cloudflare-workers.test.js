/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for CloudflareWorkers class.
 */

import assert from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { StaticArtifact } from "../artifacts/static.js";
import { CloudflareWorkers } from "./cloudflare-workers.js";

describe("CloudflareWorkers", () => {
	let originalEnv;
	let originalFetch;
	let tempDir;

	beforeEach(() => {
		// Save original environment and fetch
		originalEnv = { ...process.env };
		originalFetch = globalThis.fetch;

		// Set up test environment
		process.env.CF_API_TOKEN = "test-api-token";
		process.env.CF_ACCOUNT_ID = "test-account-id";

		// Create temporary directory for test files
		tempDir = mkdtempSync(join(tmpdir(), "soar-test-"));

		// Mock global fetch
		globalThis.fetch = mock.fn();
	});

	afterEach(() => {
		// Restore environment and fetch
		process.env = originalEnv;
		globalThis.fetch = originalFetch;

		// Clean up temporary directory
		if (tempDir) {
			rmSync(tempDir, { recursive: true, force: true });
		}

		mock.restoreAll();
	});

	/**
	 * Helper function to create test files and return StaticArtifact
	 * @param {Record<string, string>} files - Object with filepath -> content mapping
	 * @returns {StaticArtifact} StaticArtifact instance
	 */
	function createTestArtifact(files) {
		for (const [filePath, content] of Object.entries(files)) {
			const fullPath = join(tempDir, filePath);

			// Create directory if needed
			const dir = dirname(fullPath);
			if (dir !== tempDir) {
				mkdirSync(dir, { recursive: true });
			}

			writeFileSync(fullPath, content, "utf8");
		}

		return new StaticArtifact({
			type: "static",
			path: tempDir,
		});
	}

	describe("constructor", () => {
		it("should create instance with valid config", () => {
			const config = {
				name: "cloudflare-workers",
				scriptName: "my-site",
			};

			const workers = new CloudflareWorkers(config);
			assert.strictEqual(workers instanceof CloudflareWorkers, true);
		});

		it("should create instance with optional dispatch namespace", () => {
			const config = {
				name: "cloudflare-workers",
				scriptName: "my-site",
				dispatchNamespace: "my-namespace",
			};

			const workers = new CloudflareWorkers(config);
			assert.strictEqual(workers instanceof CloudflareWorkers, true);
		});

		it("should create instance with custom compatibility date", () => {
			const config = {
				name: "cloudflare-workers",
				scriptName: "my-site",
				compatibilityDate: "2024-01-01",
			};

			const workers = new CloudflareWorkers(config);
			assert.strictEqual(workers instanceof CloudflareWorkers, true);
		});

		it("should throw error for invalid target name", () => {
			const config = {
				name: "invalid-target",
				scriptName: "my-site",
			};

			assert.throws(
				() => new CloudflareWorkers(config),
				/Target name must be 'cloudflare-workers'/,
			);
		});

		it("should throw error for missing script name", () => {
			const config = {
				name: "cloudflare-workers",
			};

			assert.throws(
				() => new CloudflareWorkers(config),
				/Worker script name is required and must be a string/,
			);
		});

		it("should throw error for invalid script name type", () => {
			const config = {
				name: "cloudflare-workers",
				scriptName: 123,
			};

			assert.throws(
				() => new CloudflareWorkers(config),
				/Worker script name is required and must be a string/,
			);
		});

		it("should throw error for missing CF_API_TOKEN", () => {
			delete process.env.CF_API_TOKEN;

			const config = {
				name: "cloudflare-workers",
				scriptName: "my-site",
			};

			assert.throws(
				() => new CloudflareWorkers(config),
				/CF_API_TOKEN environment variable is required/,
			);
		});

		it("should throw error for missing CF_ACCOUNT_ID", () => {
			delete process.env.CF_ACCOUNT_ID;

			const config = {
				name: "cloudflare-workers",
				scriptName: "my-site",
			};

			assert.throws(
				() => new CloudflareWorkers(config),
				/CF_ACCOUNT_ID environment variable is required/,
			);
		});
	});

	describe("validate", () => {
		it("should return no errors for valid config", () => {
			const config = {
				name: "cloudflare-workers",
				scriptName: "my-site",
			};

			const workers = new CloudflareWorkers(config);
			const errors = workers.validate();
			assert.deepStrictEqual(errors, []);
		});

		it("should return errors for invalid script name", () => {
			const config = {
				name: "cloudflare-workers",
				scriptName: "My_Invalid_Name!",
			};

			const workers = new CloudflareWorkers(config);
			const errors = workers.validate();
			assert.ok(errors.length > 0);
			assert.ok(errors[0].message.includes("Invalid script name"));
		});

		it("should return errors for invalid compatibility date", () => {
			const config = {
				name: "cloudflare-workers",
				scriptName: "my-site",
				compatibilityDate: "invalid-date",
			};

			const workers = new CloudflareWorkers(config);
			const errors = workers.validate();
			assert.ok(errors.length > 0);
			assert.ok(
				errors[0].message.includes(
					"Compatibility date must be in YYYY-MM-DD format",
				),
			);
		});
	});

	describe("getCredentials", () => {
		it("should return credentials", async () => {
			const config = {
				name: "cloudflare-workers",
				scriptName: "my-site",
			};

			const workers = new CloudflareWorkers(config);
			const credentials = await workers.getCredentials();

			assert.deepStrictEqual(credentials, {
				apiToken: "test-api-token",
				accountId: "test-account-id",
			});
		});
	});

	describe("getSupportedArtifactTypes", () => {
		it("should return static artifact type", () => {
			const config = {
				name: "cloudflare-workers",
				scriptName: "my-site",
			};

			const workers = new CloudflareWorkers(config);
			const types = workers.getSupportedArtifactTypes();
			assert.deepStrictEqual(types, ["static"]);
		});
	});

	describe("getSupportedTransports", () => {
		it("should return http transport", () => {
			const config = {
				name: "cloudflare-workers",
				scriptName: "my-site",
			};

			const workers = new CloudflareWorkers(config);
			const transports = workers.getSupportedTransports();
			assert.deepStrictEqual(transports, ["http"]);
		});
	});

	describe("deploy", () => {
		let workers;

		beforeEach(() => {
			const config = {
				name: "cloudflare-workers",
				scriptName: "my-site",
			};
			workers = new CloudflareWorkers(config);
		});

		it("should deploy successfully with no files to upload", async () => {
			// Create test artifact
			const staticArtifact = createTestArtifact({
				"index.html": "<html><body>Hello World</body></html>",
				"style.css": "body { margin: 0; }",
			});

			// Mock fetch responses
			const fetchMock = /** @type {any} */ (globalThis.fetch);

			fetchMock.mock.mockImplementation(async (url, _options) => {
				if (url.includes("/assets-upload-session")) {
					return {
						ok: true,
						status: 200,
						json: async () => ({
							success: true,
							result: {
								jwt: "completion-token-123",
								buckets: [],
							},
						}),
					};
				} else if (url.includes("/scripts/")) {
					return {
						ok: true,
						status: 200,
						json: async () => ({
							success: true,
							result: {},
						}),
					};
				} else {
					throw new Error(`Unexpected URL: ${url}`);
				}
			});

			const result = await workers.deploy(staticArtifact);

			assert.strictEqual(result.success, true);
			assert.strictEqual(result.scriptName, "my-site");
			assert.strictEqual(result.filesUploaded, 0);
			assert.ok(result.url.includes("my-site"));
			assert.ok(result.deployedAt);

			// Verify API calls
			assert.strictEqual(fetchMock.mock.callCount(), 2);

			// Check upload session call
			const [uploadUrl, uploadOptions] = fetchMock.mock.calls[0].arguments;
			assert.ok(uploadUrl.includes("/assets-upload-session"));
			assert.strictEqual(uploadOptions.method, "POST");

			// Check worker deployment call
			const [deployUrl, deployOptions] = fetchMock.mock.calls[1].arguments;
			assert.ok(deployUrl.includes("/scripts/my-site"));
			assert.strictEqual(deployOptions.method, "PUT");
		});

		it("should deploy successfully with files to upload", async () => {
			// Create test artifact
			const staticArtifact = createTestArtifact({
				"index.html": "<html><body>Hello World</body></html>",
				"assets/style.css": "body { margin: 0; }",
			});

			// Mock fetch responses
			const fetchMock = /** @type {any} */ (globalThis.fetch);

			fetchMock.mock.mockImplementation(async (url, _options) => {
				if (url.includes("/assets-upload-session")) {
					return {
						ok: true,
						status: 200,
						json: async () => ({
							success: true,
							result: {
								jwt: "upload-token-123",
								buckets: [], // Empty buckets = no files need uploading
							},
						}),
					};
				} else if (url.includes("/assets/upload")) {
					return {
						ok: true,
						status: 200,
						json: async () => ({
							success: true,
							result: {
								jwt: "completion-token-456",
							},
						}),
					};
				} else if (url.includes("/scripts/")) {
					return {
						ok: true,
						status: 200,
						json: async () => ({
							success: true,
							result: {},
						}),
					};
				} else {
					throw new Error(`Unexpected URL: ${url}`);
				}
			});

			const result = await workers.deploy(staticArtifact);

			assert.strictEqual(result.success, true);
			assert.strictEqual(result.filesUploaded, 0);

			// Verify 2 API calls were made (no file upload needed)
			assert.strictEqual(fetchMock.mock.callCount(), 2);
		});

		it("should deploy with dispatch namespace", async () => {
			const config = {
				name: "cloudflare-workers",
				scriptName: "my-site",
				dispatchNamespace: "my-namespace",
			};
			workers = new CloudflareWorkers(config);

			// Create test artifact
			const staticArtifact = createTestArtifact({
				"index.html": "<html><body>Hello World</body></html>",
			});

			// Mock fetch responses
			const fetchMock = /** @type {any} */ (globalThis.fetch);

			fetchMock.mock.mockImplementation(async (url, _options) => {
				if (url.includes("/assets-upload-session")) {
					return {
						ok: true,
						status: 200,
						json: async () => ({
							success: true,
							result: {
								jwt: "completion-token-123",
								buckets: [],
							},
						}),
					};
				} else if (url.includes("/scripts/")) {
					return {
						ok: true,
						status: 200,
						json: async () => ({
							success: true,
							result: {},
						}),
					};
				} else {
					throw new Error(`Unexpected URL: ${url}`);
				}
			});

			await workers.deploy(staticArtifact);

			// Check that dispatch namespace is used in URLs
			const [uploadUrl] = fetchMock.mock.calls[0].arguments;
			const [deployUrl] = fetchMock.mock.calls[1].arguments;

			assert.ok(uploadUrl.includes("/dispatch/namespaces/my-namespace/"));
			assert.ok(deployUrl.includes("/dispatch/namespaces/my-namespace/"));
		});

		it("should throw error on deployment failure", async () => {
			// Create test artifact
			const staticArtifact = createTestArtifact({
				"index.html": "<html><body>Hello World</body></html>",
			});

			// Mock fetch to return error response
			const fetchMock = /** @type {any} */ (globalThis.fetch);
			fetchMock.mock.mockImplementation(async (_url, _options) => {
				return {
					ok: false,
					status: 400,
					json: async () => ({
						success: false,
						errors: [{ code: 1000, message: "Bad request" }],
					}),
				};
			});

			await assert.rejects(
				() => workers.deploy(staticArtifact),
				/Cloudflare Workers deployment failed/,
			);
		});
	});
});
