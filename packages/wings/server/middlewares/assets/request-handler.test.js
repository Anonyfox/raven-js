/**
 * @file Request Handler Tests - Comprehensive test suite for main request handling logic
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { handleAssetRequest, hasAsset } from "./request-handler.js";

// Mock context for testing
function createMockContext(requestPath = "/test.css") {
	return {
		path: requestPath,
		responseHeaders: new Map(),
		responseStatusCode: 0,
		responseBody: null,
		responseEnded: false,
		errors: [],
	};
}

test("hasAsset", async (t) => {
	await t.test("returns true when asset exists in list", () => {
		const config = {
			mode: "global",
			assetsList: ["/css/style.css", "/js/app.js", "/images/logo.png"],
			assetsPath: null,
		};

		assert.strictEqual(hasAsset("/css/style.css", config), true);
		assert.strictEqual(hasAsset("/js/app.js", config), true);
		assert.strictEqual(hasAsset("/images/logo.png", config), true);
	});

	await t.test("returns false when asset doesn't exist in list", () => {
		const config = {
			mode: "global",
			assetsList: ["/css/style.css", "/js/app.js"],
			assetsPath: null,
		};

		assert.strictEqual(hasAsset("/missing.css", config), false);
		assert.strictEqual(hasAsset("/nonexistent.js", config), false);
	});

	await t.test("returns true for filesystem mode with empty asset list", () => {
		const config = {
			mode: "filesystem",
			assetsList: [], // Empty list (not loaded yet)
			assetsPath: "/path/to/assets",
		};

		// Should return true to let filesystem determine existence
		assert.strictEqual(hasAsset("/any/file.css", config), true);
		assert.strictEqual(hasAsset("/another/file.js", config), true);
	});

	await t.test(
		"returns based on list for filesystem mode with loaded assets",
		() => {
			const config = {
				mode: "filesystem",
				assetsList: ["/css/style.css", "/js/app.js"],
				assetsPath: "/path/to/assets",
			};

			assert.strictEqual(hasAsset("/css/style.css", config), true);
			assert.strictEqual(hasAsset("/missing.css", config), false);
		},
	);

	await t.test("handles empty asset list for non-filesystem modes", () => {
		const config = {
			mode: "global",
			assetsList: [],
			assetsPath: null,
		};

		assert.strictEqual(hasAsset("/any/file.css", config), false);
	});
});

test("handleAssetRequest", async (t) => {
	await t.test("skips processing when response already ended", async () => {
		const ctx = createMockContext();
		ctx.responseEnded = true;

		const config = {
			mode: "global",
			assetsList: ["/test.css"],
			assetsPath: null,
		};

		await handleAssetRequest(ctx, config);

		// Should not modify context when response already ended
		assert.strictEqual(ctx.responseStatusCode, 0);
		assert.strictEqual(ctx.responseBody, null);
	});

	await t.test("handles URL decoding correctly", async () => {
		// Test with encoded unicode characters
		const ctx = createMockContext("/css/style%20file.css");

		const config = {
			mode: "global",
			assetsList: ["/css/style file.css"],
			assetsPath: null,
		};

		// Setup global assets
		const original = globalThis.RavenJS;
		globalThis.RavenJS = {
			assets: {
				"/css/style file.css": "body { color: red; }",
			},
		};

		await handleAssetRequest(ctx, config);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody.toString(), "body { color: red; }");

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("handles URL decoding failures gracefully", async () => {
		// Test with malformed URL encoding
		const ctx = createMockContext("/css/style%ZZ.css");

		const config = {
			mode: "global",
			assetsList: ["/css/style%ZZ.css"], // Use original path
			assetsPath: null,
		};

		// Setup global assets with the original (non-decoded) path
		const original = globalThis.RavenJS;
		globalThis.RavenJS = {
			assets: {
				"/css/style%ZZ.css": "body { color: red; }",
			},
		};

		await handleAssetRequest(ctx, config);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody.toString(), "body { color: red; }");

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("skips processing for invalid asset paths", async () => {
		const invalidPaths = [
			"css/style.css", // No leading slash
			"/../secret.txt", // Path traversal
			"/css/../config", // Path traversal
			"/css\\style.css", // Backslash
			"/css/style.css\0", // Null byte
			"/", // Root path
		];

		for (const invalidPath of invalidPaths) {
			const ctx = createMockContext(invalidPath);
			const config = {
				mode: "global",
				assetsList: [invalidPath],
				assetsPath: null,
			};

			await handleAssetRequest(ctx, config);

			// Should not set response for invalid paths
			assert.strictEqual(
				ctx.responseStatusCode,
				0,
				`Failed for path: ${invalidPath}`,
			);
			assert.strictEqual(
				ctx.responseBody,
				null,
				`Failed for path: ${invalidPath}`,
			);
		}
	});

	await t.test("skips processing when asset doesn't exist", async () => {
		const ctx = createMockContext("/missing.css");

		const config = {
			mode: "global",
			assetsList: ["/existing.css"],
			assetsPath: null,
		};

		await handleAssetRequest(ctx, config);

		// Should not set response when asset doesn't exist
		assert.strictEqual(ctx.responseStatusCode, 0);
		assert.strictEqual(ctx.responseBody, null);
	});

	await t.test("serves asset in SEA mode", async () => {
		const ctx = createMockContext("/css/style.css");

		const config = {
			mode: "sea",
			assetsList: ["/css/style.css"],
			assetsPath: null,
		};

		// Mock SEA environment
		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return {
					getAsset: (path) => {
						if (path === "/css/style.css") {
							return "body { color: blue; }";
						}
						throw new Error("Asset not found");
					},
				};
			}
			return originalRequire(moduleName);
		};

		await handleAssetRequest(ctx, config);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody.toString(), "body { color: blue; }");

		global.require = originalRequire;
	});

	await t.test("serves asset in global mode", async () => {
		const ctx = createMockContext("/css/style.css");

		const config = {
			mode: "global",
			assetsList: ["/css/style.css"],
			assetsPath: null,
		};

		// Setup global assets
		const original = globalThis.RavenJS;
		globalThis.RavenJS = {
			assets: {
				"/css/style.css": "body { color: green; }",
			},
		};

		await handleAssetRequest(ctx, config);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody.toString(), "body { color: green; }");

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("serves asset in filesystem mode", async () => {
		const testDir = path.join(process.cwd(), "test-request-handler");
		await fs.mkdir(testDir, { recursive: true });
		await fs.writeFile(
			path.join(testDir, "style.css"),
			"body { color: purple; }",
		);

		const ctx = createMockContext("/style.css");

		const config = {
			mode: "filesystem",
			assetsList: ["/style.css"],
			assetsPath: testDir,
		};

		await handleAssetRequest(ctx, config);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody.toString(), "body { color: purple; }");

		// Cleanup
		await fs.rm(testDir, { recursive: true, force: true });
	});

	await t.test("skips processing for uninitialized mode", async () => {
		const ctx = createMockContext("/css/style.css");

		const config = {
			mode: "uninitialized",
			assetsList: ["/css/style.css"],
			assetsPath: null,
		};

		await handleAssetRequest(ctx, config);

		// Should not set response for uninitialized mode
		assert.strictEqual(ctx.responseStatusCode, 0);
		assert.strictEqual(ctx.responseBody, null);
	});

	await t.test("skips processing for unknown mode", async () => {
		const ctx = createMockContext("/css/style.css");

		const config = {
			mode: "unknown",
			assetsList: ["/css/style.css"],
			assetsPath: null,
		};

		await handleAssetRequest(ctx, config);

		// Should not set response for unknown mode
		assert.strictEqual(ctx.responseStatusCode, 0);
		assert.strictEqual(ctx.responseBody, null);
	});

	await t.test("collects errors without breaking request", async () => {
		const ctx = createMockContext("/css/style.css");

		// Create a config object that will cause an error when accessed
		const config = {
			get mode() {
				throw new Error("Config access error");
			},
			assetsList: ["/css/style.css"],
			assetsPath: null,
		};

		await handleAssetRequest(ctx, config);

		// Should not set response when error occurs
		assert.strictEqual(ctx.responseStatusCode, 0);
		assert.strictEqual(ctx.responseBody, null);

		// Should collect error information
		assert.strictEqual(ctx.errors.length, 1);
		assert.strictEqual(ctx.errors[0].name, "AssetError");
		assert.strictEqual(
			ctx.errors[0].message.includes("Asset serving failed"),
			true,
		);
		assert.strictEqual(ctx.errors[0].mode, "unknown");
		assert.strictEqual(ctx.errors[0].path, "/css/style.css");
		assert.strictEqual(typeof ctx.errors[0].originalError, "object");
	});

	await t.test("handles filesystem mode with empty asset list", async () => {
		const testDir = path.join(process.cwd(), "test-request-handler-empty");
		await fs.mkdir(testDir, { recursive: true });
		await fs.writeFile(
			path.join(testDir, "style.css"),
			"body { color: orange; }",
		);

		const ctx = createMockContext("/style.css");

		const config = {
			mode: "filesystem",
			assetsList: [], // Empty list - let filesystem decide
			assetsPath: testDir,
		};

		await handleAssetRequest(ctx, config);

		// Should serve the file even with empty asset list
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody.toString(), "body { color: orange; }");

		// Cleanup
		await fs.rm(testDir, { recursive: true, force: true });
	});

	await t.test(
		"handles complex error scenarios with detailed error info",
		async () => {
			const ctx = createMockContext("/complex/path/asset.css");

			const config = {
				mode: "global",
				assetsList: ["/complex/path/asset.css"],
				assetsPath: null,
			};

			// Setup global assets that will cause an error when accessed
			const original = globalThis.RavenJS;
			Object.defineProperty(globalThis, "RavenJS", {
				get() {
					throw new Error("Global access error");
				},
				configurable: true,
			});

			await handleAssetRequest(ctx, config);

			// Should collect detailed error information
			assert.strictEqual(ctx.errors.length, 1);
			const error = ctx.errors[0];
			assert.strictEqual(error.name, "AssetError");
			assert.strictEqual(error.mode, "global");
			assert.strictEqual(error.path, "/complex/path/asset.css");
			assert.strictEqual(typeof error.originalError, "object");

			// Restore
			Object.defineProperty(globalThis, "RavenJS", {
				value: original,
				configurable: true,
			});
		},
	);
});
