/**
 * @file Assets Tests - Comprehensive test suite for the main Assets class
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
import { Assets } from "./assets.js";

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

test("Assets constructor", async (t) => {
	await t.test("creates instance with default options", () => {
		const assets = new Assets();

		assert.strictEqual(assets.assetsDir, "public");
		assert.strictEqual(typeof assets.mode, "string");
		assert.strictEqual(Array.isArray(assets.assetsList), true);
	});

	await t.test("creates instance with custom options", () => {
		const assets = new Assets({
			assetsDir: "static",
			identifier: "custom-assets",
		});

		assert.strictEqual(assets.assetsDir, "static");
	});

	await t.test("throws error for invalid assetsDir", () => {
		assert.throws(() => {
			new Assets({ assetsDir: "" });
		}, /assetsDir must be a non-empty string/);

		assert.throws(() => {
			new Assets({ assetsDir: "   " });
		}, /assetsDir must be a non-empty string/);

		assert.throws(() => {
			new Assets({ assetsDir: 42 });
		}, /assetsDir must be a non-empty string/);
	});

	await t.test("trims whitespace from assetsDir", () => {
		const assets = new Assets({ assetsDir: "  static  " });
		assert.strictEqual(assets.assetsDir, "static");
	});
});

test("Assets mode detection", async (t) => {
	await t.test("detects SEA mode when available", () => {
		// Mock SEA environment
		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return {
					isSea: () => true,
					getAsset: (path) => {
						if (path === "@raven-js/assets.json") {
							return JSON.stringify(["/css/style.css", "/js/app.js"]);
						}
						throw new Error("Asset not found");
					},
				};
			}
			return originalRequire(moduleName);
		};

		const assets = new Assets();

		assert.strictEqual(assets.mode, "sea");
		assert.deepStrictEqual(assets.assetsList, ["/css/style.css", "/js/app.js"]);

		global.require = originalRequire;
	});

	await t.test(
		"detects global mode when SEA unavailable but global assets available",
		() => {
			// Ensure SEA is not available
			const originalRequire = global.require;
			global.require = () => {
				throw new Error("Module not found");
			};

			// Setup global assets
			const original = globalThis.RavenJS;
			globalThis.RavenJS = {
				assets: {
					"/css/global.css": "body { color: red; }",
					"/js/global.js": "console.log('global');",
				},
			};

			const assets = new Assets();

			assert.strictEqual(assets.mode, "global");
			assert.strictEqual(assets.assetsList.includes("/css/global.css"), true);
			assert.strictEqual(assets.assetsList.includes("/js/global.js"), true);

			// Restore
			global.require = originalRequire;
			if (original) globalThis.RavenJS = original;
			else delete globalThis.RavenJS;
		},
	);

	await t.test(
		"falls back to filesystem mode when other modes unavailable",
		async () => {
			// Ensure SEA is not available
			const originalRequire = global.require;
			global.require = () => {
				throw new Error("Module not found");
			};

			// Ensure global assets are not available
			const original = globalThis.RavenJS;
			delete globalThis.RavenJS;

			const assets = new Assets({ assetsDir: "public" });

			assert.strictEqual(assets.mode, "filesystem");
			assert.strictEqual(typeof assets.assetsPath, "string");
			assert.strictEqual(assets.assetsPath.endsWith("public"), true);

			// Restore
			global.require = originalRequire;
			if (original) globalThis.RavenJS = original;
		},
	);

	await t.test("handles initialization errors gracefully", () => {
		// Mock environment detection to throw an error
		const originalRequire = global.require;
		global.require = () => {
			throw new Error("Critical environment error");
		};

		// Mock globalThis to not be available (delete RavenJS)
		const original = globalThis.RavenJS;
		delete globalThis.RavenJS;

		// Mock path.resolve to throw an error to simulate filesystem initialization failure
		const originalResolve = path.resolve;
		path.resolve = () => {
			throw new Error("Path resolution error");
		};

		const assets = new Assets();

		// Should fall back to uninitialized mode when all initialization fails
		assert.strictEqual(assets.mode, "uninitialized");
		assert.deepStrictEqual(assets.assetsList, []);

		// Restore
		global.require = originalRequire;
		path.resolve = originalResolve;
		if (original) globalThis.RavenJS = original;
	});
});

test("Assets request handling", async (t) => {
	await t.test("serves assets in SEA mode", async () => {
		// Mock SEA environment
		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return {
					isSea: () => true,
					getAsset: (path) => {
						if (path === "@raven-js/assets.json") {
							return JSON.stringify(["/css/style.css"]);
						}
						if (path === "/css/style.css") {
							return "body { color: blue; }";
						}
						throw new Error("Asset not found");
					},
				};
			}
			return originalRequire(moduleName);
		};

		const assets = new Assets();
		const ctx = createMockContext("/css/style.css");

		await assets.handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody.toString(), "body { color: blue; }");

		global.require = originalRequire;
	});

	await t.test("serves assets in global mode", async () => {
		// Ensure SEA is not available
		const originalRequire = global.require;
		global.require = () => {
			throw new Error("Module not found");
		};

		// Setup global assets
		const original = globalThis.RavenJS;
		globalThis.RavenJS = {
			assets: {
				"/css/style.css": "body { color: green; }",
			},
		};

		const assets = new Assets();
		const ctx = createMockContext("/css/style.css");

		await assets.handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody.toString(), "body { color: green; }");

		// Restore
		global.require = originalRequire;
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("serves assets in filesystem mode", async () => {
		const testDir = path.join(process.cwd(), "test-assets-class");
		await fs.mkdir(testDir, { recursive: true });
		await fs.writeFile(
			path.join(testDir, "style.css"),
			"body { color: purple; }",
		);

		// Ensure other modes are not available
		const originalRequire = global.require;
		global.require = () => {
			throw new Error("Module not found");
		};

		const original = globalThis.RavenJS;
		delete globalThis.RavenJS;

		const assets = new Assets({ assetsDir: testDir });
		const ctx = createMockContext("/style.css");

		// Wait a bit for filesystem scanning to complete
		await new Promise((resolve) => setTimeout(resolve, 100));

		await assets.handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody.toString(), "body { color: purple; }");

		// Cleanup
		await fs.rm(testDir, { recursive: true, force: true });
		global.require = originalRequire;
		if (original) globalThis.RavenJS = original;
	});

	await t.test("skips processing for non-asset requests", async () => {
		const assets = new Assets();
		const ctx = createMockContext("/api/data");

		await assets.handler(ctx);

		// Should not set response for non-asset paths
		assert.strictEqual(ctx.responseStatusCode, 0);
		assert.strictEqual(ctx.responseBody, null);
	});

	await t.test("skips processing when response already ended", async () => {
		const assets = new Assets();
		const ctx = createMockContext("/css/style.css");
		ctx.responseEnded = true;

		await assets.handler(ctx);

		// Should not modify response when already ended
		assert.strictEqual(ctx.responseStatusCode, 0);
		assert.strictEqual(ctx.responseBody, null);
	});

	await t.test("handles invalid asset paths securely", async () => {
		const assets = new Assets();
		const invalidPaths = [
			"/../secret.txt",
			"/css/../../../etc/passwd",
			"/css\\..\\config",
			"/file.txt\0",
		];

		for (const invalidPath of invalidPaths) {
			const ctx = createMockContext(invalidPath);
			await assets.handler(ctx);

			// Should not serve invalid paths
			assert.strictEqual(
				ctx.responseStatusCode,
				0,
				`Failed for: ${invalidPath}`,
			);
			assert.strictEqual(ctx.responseBody, null, `Failed for: ${invalidPath}`);
		}
	});

	await t.test("handles URL encoded paths correctly", async () => {
		// Setup global assets
		const originalRequire = global.require;
		global.require = () => {
			throw new Error("Module not found");
		};

		const original = globalThis.RavenJS;
		globalThis.RavenJS = {
			assets: {
				"/css/my file.css": "body { color: red; }",
			},
		};

		const assets = new Assets();
		const ctx = createMockContext("/css/my%20file.css");

		await assets.handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody.toString(), "body { color: red; }");

		// Restore
		global.require = originalRequire;
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("collects errors during request processing", async () => {
		// Create an assets instance in global mode with assets
		const originalRequire = global.require;
		global.require = () => {
			throw new Error("Module not found");
		};

		const original = globalThis.RavenJS;
		globalThis.RavenJS = {
			assets: {
				"/css/style.css": "body { color: red; }",
			},
		};

		const assets = new Assets();

		// Create a context where path access will cause an error
		const ctx = {
			get path() {
				throw new Error("Path access error");
			},
			responseHeaders: new Map(),
			responseStatusCode: 0,
			responseBody: null,
			responseEnded: false,
			errors: [],
		};

		await assets.handler(ctx);

		// Should collect error without breaking
		assert.strictEqual(ctx.errors.length, 1);
		assert.strictEqual(ctx.errors[0].name, "AssetError");
		assert.strictEqual(
			ctx.errors[0].message.includes("Asset serving failed"),
			true,
		);
		assert.strictEqual(ctx.errors[0].path, "unknown");

		// Restore
		global.require = originalRequire;
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});
});

test("Assets filesystem mode", async (t) => {
	await t.test(
		"loads asset list asynchronously in filesystem mode",
		async () => {
			const testDir = path.join(process.cwd(), "test-fs-async");
			await fs.mkdir(testDir, { recursive: true });
			await fs.writeFile(path.join(testDir, "file1.css"), "content1");
			await fs.writeFile(path.join(testDir, "file2.js"), "content2");

			// Ensure filesystem mode
			const originalRequire = global.require;
			global.require = () => {
				throw new Error("Module not found");
			};

			const original = globalThis.RavenJS;
			delete globalThis.RavenJS;

			const assets = new Assets({ assetsDir: testDir });

			// Initially assets list might be empty
			assert.strictEqual(assets.mode, "filesystem");

			// Wait for async loading to complete
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Now assets should be loaded
			assert.strictEqual(assets.assetsList.length, 2);
			assert.strictEqual(assets.assetsList.includes("/file1.css"), true);
			assert.strictEqual(assets.assetsList.includes("/file2.js"), true);

			// Cleanup
			await fs.rm(testDir, { recursive: true, force: true });
			global.require = originalRequire;
			if (original) globalThis.RavenJS = original;
		},
	);

	await t.test("handles filesystem loading errors gracefully", async () => {
		// Ensure filesystem mode
		const originalRequire = global.require;
		global.require = () => {
			throw new Error("Module not found");
		};

		const original = globalThis.RavenJS;
		delete globalThis.RavenJS;

		// Use a non-existent directory
		const assets = new Assets({ assetsDir: "/non/existent/directory" });

		assert.strictEqual(assets.mode, "filesystem");

		// Wait for async loading attempt
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Should handle error gracefully
		assert.deepStrictEqual(assets.assetsList, []);

		// Restore
		global.require = originalRequire;
		if (original) globalThis.RavenJS = original;
	});
});

test("Assets integration scenarios", async (t) => {
	await t.test("maintains consistent behavior across modes", async () => {
		const testCases = [
			{
				name: "SEA mode",
				setup: () => {
					const originalRequire = global.require;
					global.require = (moduleName) => {
						if (moduleName === "node:sea") {
							return {
								isSea: () => true,
								getAsset: (path) => {
									if (path === "@raven-js/assets.json") {
										return JSON.stringify(["/shared.css"]);
									}
									if (path === "/shared.css") {
										return "/* SEA content */";
									}
									throw new Error("Asset not found");
								},
							};
						}
						return originalRequire(moduleName);
					};
					return () => {
						global.require = originalRequire;
					};
				},
			},
			{
				name: "Global mode",
				setup: () => {
					const originalRequire = global.require;
					global.require = () => {
						throw new Error("Module not found");
					};

					const original = globalThis.RavenJS;
					globalThis.RavenJS = {
						assets: {
							"/shared.css": "/* Global content */",
						},
					};

					return () => {
						global.require = originalRequire;
						if (original) globalThis.RavenJS = original;
						else delete globalThis.RavenJS;
					};
				},
			},
		];

		for (const testCase of testCases) {
			const cleanup = testCase.setup();

			const assets = new Assets();
			const ctx = createMockContext("/shared.css");

			await assets.handler(ctx);

			// All modes should serve the asset
			assert.strictEqual(
				ctx.responseStatusCode,
				200,
				`Failed for ${testCase.name}`,
			);
			assert.strictEqual(
				ctx.responseHeaders.get("content-type"),
				"text/css",
				`Failed for ${testCase.name}`,
			);
			assert.strictEqual(
				ctx.responseEnded,
				true,
				`Failed for ${testCase.name}`,
			);

			cleanup();
		}
	});
});
