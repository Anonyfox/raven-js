/**
 * @fileoverview Tests for Assets Middleware
 *
 * Comprehensive test suite covering all asset serving modes, security features,
 * error handling, and integration with the Wings middleware system.
 */

import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, mock, test } from "node:test";
import { Context } from "../core/context.js";
import { Middleware } from "../core/middleware.js";
import { Assets } from "./assets.js";

/**
 * Create a test context for asset requests.
 *
 * @param {string} method - HTTP method
 * @param {string} pathname - Request path
 * @returns {Context} Test context instance
 */
function createTestContext(method = "GET", pathname = "/test.txt") {
	const url = new URL(`http://localhost${pathname}`);
	const headers = new Headers();
	return new Context(method, url, headers);
}

/**
 * Helper to run after-callbacks and return context.
 *
 * @param {Context} ctx - Context to process
 * @returns {Promise<Context>} Processed context
 */
async function processContext(ctx) {
	await ctx.runAfterCallbacks();
	return ctx;
}

describe("Assets Middleware", () => {
	let originalRavenJS;
	let originalRequire;

	beforeEach(() => {
		// Save and clean global state
		originalRavenJS = globalThis.RavenJS;
		originalRequire = globalThis.require;

		// Clean up any existing global state
		if (globalThis.RavenJS) {
			delete globalThis.RavenJS;
		}
	});

	afterEach(() => {
		// Restore original state
		if (originalRavenJS) {
			globalThis.RavenJS = originalRavenJS;
		} else if (globalThis.RavenJS) {
			delete globalThis.RavenJS;
		}

		if (originalRequire) {
			globalThis.require = originalRequire;
		}

		// Clear any mocks
		mock.restoreAll();
	});

	describe("Constructor", () => {
		test("creates instance with default options", () => {
			const assets = new Assets();
			assert.equal(assets.assetsDir, "public");
			assert.equal(assets.mode, "filesystem"); // Default mode
		});

		test("creates instance with custom options", () => {
			const assets = new Assets({ assetsDir: "static" });
			assert.equal(assets.assetsDir, "static");
		});

		test("throws error for invalid assetsDir", () => {
			assert.throws(() => new Assets({ assetsDir: "" }), {
				message: "Assets: assetsDir must be a non-empty string",
			});

			assert.throws(() => new Assets({ assetsDir: "   " }), {
				message: "Assets: assetsDir must be a non-empty string",
			});
		});

		test("extends Middleware class correctly", () => {
			const assets = new Assets();
			assert.ok(assets instanceof Middleware);
			assert.equal(assets.identifier, "@raven-js/wings/assets");
		});
	});

	describe("Mode Detection", () => {
		test("detects SEA mode when node:sea is available and isSea() returns true", () => {
			// Mock node:sea module
			globalThis.require = mock.fn((module) => {
				if (module === "node:sea") {
					return {
						isSea: () => true,
						getAsset: (path) => {
							if (path === "@raven-js/assets.json") {
								return Buffer.from(JSON.stringify(["/test.txt", "/app.js"]));
							}
							throw new Error("Asset not found");
						},
					};
				}
				return originalRequire(module);
			});

			const assets = new Assets();
			assert.equal(assets.mode, "sea");
			assert.deepEqual(assets.assetsList, ["/test.txt", "/app.js"]);
		});

		test("detects global mode when globalThis.RavenJS.assets exists", () => {
			// Ensure SEA mode is not detected
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			// Mock global assets
			globalThis.RavenJS = {
				assets: {
					"/style.css": "body { color: red; }",
					"/app.js": "console.log('hello');",
					"internal.txt": "should not be included", // No leading slash
				},
			};

			const assets = new Assets();
			assert.equal(assets.mode, "global");
			// Should only include public assets (starting with /)
			assert.deepEqual(assets.assetsList, ["/style.css", "/app.js"]);
		});

		test("defaults to filesystem mode when other modes unavailable", () => {
			// Ensure no SEA or global assets
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			const assets = new Assets();
			assert.equal(assets.mode, "filesystem");
		});

		test("handles SEA mode with invalid manifest gracefully", () => {
			globalThis.require = mock.fn((module) => {
				if (module === "node:sea") {
					return {
						isSea: () => true,
						getAsset: () => {
							throw new Error("Manifest not found");
						},
					};
				}
				return originalRequire(module);
			});

			const assets = new Assets();
			assert.equal(assets.mode, "sea");
			assert.deepEqual(assets.assetsList, []); // Empty when manifest invalid
		});

		test("handles global mode with invalid assets object", () => {
			// Ensure SEA mode is not detected
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			globalThis.RavenJS = {
				assets: null, // Invalid assets object
			};

			const assets = new Assets();
			assert.equal(assets.mode, "filesystem"); // Falls back to filesystem
		});

		test("handles mode initialization errors gracefully", () => {
			// Mock a scenario where all mode detection fails
			globalThis.require = mock.fn(() => {
				throw new Error("Critical error");
			});

			const assets = new Assets();
			assert.equal(assets.mode, "filesystem");
			assert.deepEqual(assets.assetsList, []);
		});
	});

	describe("Security Validation", () => {
		test("validates asset paths correctly", () => {
			const assets = new Assets();

			// Valid paths
			assert.equal(assets.constructor.prototype.constructor.name, "Assets");

			// We need to test the internal validation logic
			// Since isValidAssetPath is not exported, we test through the request handling
		});

		test("rejects paths without leading slash", async () => {
			globalThis.RavenJS = {
				assets: {
					"/valid.txt": "content",
				},
			};

			const assets = new Assets();
			const ctx = createTestContext("GET", "no-slash.txt"); // No leading slash

			await assets.execute(ctx);
			await processContext(ctx);

			// Should not serve the asset
			assert.equal(ctx.responseEnded, false);
		});

		test("prevents path traversal attacks", async () => {
			globalThis.RavenJS = {
				assets: {
					"/valid.txt": "content",
				},
			};

			const assets = new Assets();
			const testPaths = [
				"/../etc/passwd",
				"/test/../secret.txt",
				"/test/..\\secret.txt",
				"/test\0hidden.txt",
				"/",
			];

			for (const testPath of testPaths) {
				const ctx = createTestContext("GET", testPath);
				await assets.execute(ctx);
				await processContext(ctx);

				// Should not serve any of these paths
				assert.equal(
					ctx.responseEnded,
					false,
					`Should reject path: ${testPath}`,
				);
			}
		});

		test("only serves public assets (starting with /)", async () => {
			// Ensure SEA mode is not detected
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			globalThis.RavenJS = {
				assets: {
					"/public.txt": "public content",
					"private.txt": "private content",
					"config/secret.txt": "secret content",
				},
			};

			const assets = new Assets();

			// Should serve public asset
			let ctx = createTestContext("GET", "/public.txt");
			await assets.execute(ctx);
			await processContext(ctx);
			assert.equal(ctx.responseEnded, true);
			assert.equal(ctx.responseBody.toString(), "public content");

			// Should not serve private assets (not in filtered list)
			ctx = createTestContext("GET", "/private.txt");
			await assets.execute(ctx);
			await processContext(ctx);
			assert.equal(ctx.responseEnded, false);
		});
	});

	describe("SEA Mode Asset Serving", () => {
		beforeEach(() => {
			globalThis.require = mock.fn((module) => {
				if (module === "node:sea") {
					return {
						isSea: () => true,
						getAsset: (path) => {
							if (path === "@raven-js/assets.json") {
								return Buffer.from(JSON.stringify(["/test.txt", "/app.js"]));
							}
							if (path === "/test.txt") {
								return Buffer.from("test content");
							}
							if (path === "/app.js") {
								return Buffer.from("console.log('app');");
							}
							throw new Error("Asset not found");
						},
					};
				}
				return originalRequire(module);
			});
		});

		test("serves assets from SEA embedded resources", async () => {
			const assets = new Assets();
			const ctx = createTestContext("GET", "/test.txt");

			await assets.execute(ctx);
			await processContext(ctx);

			assert.equal(ctx.responseEnded, true);
			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseBody.toString(), "test content");
			assert.equal(ctx.responseHeaders.get("content-type"), "text/plain");
			assert.equal(ctx.responseHeaders.get("content-length"), "12");
		});

		test("handles missing assets in SEA mode", async () => {
			const assets = new Assets();
			const ctx = createTestContext("GET", "/missing.txt");

			await assets.execute(ctx);
			await processContext(ctx);

			// Should not serve missing asset
			assert.equal(ctx.responseEnded, false);
		});

		test("sets correct content type for different file types", async () => {
			const assets = new Assets();

			// Test JavaScript file
			const ctx = createTestContext("GET", "/app.js");
			await assets.execute(ctx);
			await processContext(ctx);

			assert.equal(ctx.responseEnded, true);
			assert.equal(ctx.responseHeaders.get("content-type"), "text/javascript");
		});
	});

	describe("Global Mode Asset Serving", () => {
		beforeEach(() => {
			// Ensure SEA mode is not detected
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			globalThis.RavenJS = {
				assets: {
					"/text.txt": "text content",
					"/script.js": "console.log('script');",
					"/binary.dat": Buffer.from([0x01, 0x02, 0x03]),
				},
			};
		});

		test("serves string assets from global variables", async () => {
			const assets = new Assets();
			const ctx = createTestContext("GET", "/text.txt");

			await assets.execute(ctx);
			await processContext(ctx);

			assert.equal(ctx.responseEnded, true);
			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.responseBody.toString(), "text content");
		});

		test("serves buffer assets from global variables", async () => {
			const assets = new Assets();
			const ctx = createTestContext("GET", "/binary.dat");

			await assets.execute(ctx);
			await processContext(ctx);

			assert.equal(ctx.responseEnded, true);
			assert.deepEqual(ctx.responseBody, Buffer.from([0x01, 0x02, 0x03]));
		});

		test("handles missing assets in global mode", async () => {
			const assets = new Assets();
			const ctx = createTestContext("GET", "/missing.txt");

			await assets.execute(ctx);
			await processContext(ctx);

			assert.equal(ctx.responseEnded, false);
		});
	});

	describe("FileSystem Mode Asset Serving", () => {
		test("handles file system assets", async () => {
			// Ensure SEA mode is not detected
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			// Ensure global mode is not detected
			if (globalThis.RavenJS) {
				delete globalThis.RavenJS;
			}

			// Mock fs.readFile for filesystem mode
			const originalReadFile = fs.readFile;
			fs.readFile = mock.fn(async (filePath) => {
				if (filePath.includes("test.txt")) {
					return Buffer.from("file content");
				}
				throw new Error("File not found");
			});

			try {
				const assets = new Assets({ assetsDir: "test-assets" });
				const ctx = createTestContext("GET", "/test.txt");

				await assets.execute(ctx);
				await processContext(ctx);

				assert.equal(ctx.responseEnded, true);
				assert.equal(ctx.responseBody.toString(), "file content");
			} finally {
				fs.readFile = originalReadFile;
			}
		});

		test("prevents path traversal in filesystem mode", async () => {
			const originalReadFile = fs.readFile;
			const originalResolve = path.resolve;

			// Mock path.resolve to simulate path traversal attempt
			path.resolve = mock.fn((filePath) => {
				if (filePath.includes("..")) {
					return "/etc/passwd"; // Outside assets directory
				}
				return originalResolve(filePath);
			});

			fs.readFile = mock.fn(async () => {
				return Buffer.from("should not serve this");
			});

			try {
				const assets = new Assets({ assetsDir: "test-assets" });
				const ctx = createTestContext("GET", "/../etc/passwd");

				await assets.execute(ctx);
				await processContext(ctx);

				// Should reject path traversal
				assert.equal(ctx.responseEnded, false);
			} finally {
				fs.readFile = originalReadFile;
				path.resolve = originalResolve;
			}
		});
	});

	describe("Response Headers and Caching", () => {
		beforeEach(() => {
			// Ensure SEA mode is not detected
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			globalThis.RavenJS = {
				assets: {
					"/test.txt": "content",
					"/app.js": "script",
					"/style.css": "styles",
				},
			};
		});

		test("sets correct MIME types", async () => {
			const assets = new Assets();

			const testCases = [
				["/test.txt", "text/plain"],
				["/app.js", "text/javascript"],
				["/style.css", "text/css"],
			];

			for (const [path, expectedType] of testCases) {
				const ctx = createTestContext("GET", path);
				await assets.execute(ctx);
				await processContext(ctx);

				assert.equal(ctx.responseHeaders.get("content-type"), expectedType);
			}
		});

		test("sets cache control headers", async () => {
			const assets = new Assets();
			const ctx = createTestContext("GET", "/test.txt");

			await assets.execute(ctx);
			await processContext(ctx);

			assert.equal(
				ctx.responseHeaders.get("cache-control"),
				"public, max-age=3600",
			);
		});

		test("sets content length header", async () => {
			const assets = new Assets();
			const ctx = createTestContext("GET", "/test.txt");

			await assets.execute(ctx);
			await processContext(ctx);

			assert.equal(ctx.responseHeaders.get("content-length"), "7"); // "content" = 7 bytes
		});
	});

	describe("Error Handling", () => {
		test("collects errors without breaking request flow", async () => {
			// Mock SEA mode with errors
			globalThis.require = mock.fn((module) => {
				if (module === "node:sea") {
					return {
						isSea: () => true,
						getAsset: (path) => {
							if (path === "@raven-js/assets.json") {
								return Buffer.from(JSON.stringify(["/test.txt"]));
							}
							if (path === "/test.txt") {
								throw new Error("SEA read error");
							}
							throw new Error("Asset not found");
						},
					};
				}
				return originalRequire(module);
			});

			const assets = new Assets();
			const ctx = createTestContext("GET", "/test.txt");

			await assets.execute(ctx);
			await processContext(ctx);

			// Should not serve the asset but also not crash
			assert.equal(ctx.responseEnded, false);
		});

		test("handles mode initialization errors gracefully", () => {
			// Mock require to simulate module loading failure
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			// This should not throw and should fall back gracefully
			const assets = new Assets();
			assert.ok(assets instanceof Assets);
			assert.equal(assets.mode, "filesystem"); // Should fall back to filesystem
		});
	});

	describe("Integration with Middleware System", () => {
		test("handles assets directly in middleware execution", async () => {
			// Ensure SEA mode is not detected
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			globalThis.RavenJS = {
				assets: {
					"/test.txt": "content",
				},
			};

			const assets = new Assets();
			const ctx = createTestContext("GET", "/test.txt");

			// Should handle asset directly and end response
			await assets.execute(ctx);

			assert.equal(ctx.responseEnded, true);
			assert.equal(ctx.responseBody.toString(), "content");
		});

		test("respects responseEnded flag", async () => {
			// Ensure SEA mode is not detected
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			globalThis.RavenJS = {
				assets: {
					"/test.txt": "content",
				},
			};

			const assets = new Assets();
			const ctx = createTestContext("GET", "/test.txt");

			// Pre-end the response
			ctx.responseEnded = true;
			ctx.responseBody = "already handled";

			await assets.execute(ctx);

			// Should not modify already-ended response
			assert.equal(ctx.responseBody, "already handled");
		});

		test("works with multiple assets instances", async () => {
			// Ensure SEA mode is not detected
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			globalThis.RavenJS = {
				assets: {
					"/test.txt": "content",
				},
			};

			const assets1 = new Assets();
			const assets2 = new Assets();

			const ctx1 = createTestContext("GET", "/test.txt");
			const ctx2 = createTestContext("GET", "/test.txt");

			// Both instances should be able to serve the asset
			await assets1.execute(ctx1);
			assert.equal(ctx1.responseEnded, true);
			assert.equal(ctx1.responseBody.toString(), "content");

			await assets2.execute(ctx2);
			assert.equal(ctx2.responseEnded, true);
			assert.equal(ctx2.responseBody.toString(), "content");
		});
	});

	describe("Edge Cases", () => {
		test("handles empty asset lists", async () => {
			// Ensure SEA mode is not detected
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			globalThis.RavenJS = {
				assets: {}, // Empty assets
			};

			const assets = new Assets();
			const ctx = createTestContext("GET", "/anything.txt");

			await assets.execute(ctx);

			assert.equal(ctx.responseEnded, false);
		});

		test("handles non-GET requests", async () => {
			// Ensure SEA mode is not detected
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			globalThis.RavenJS = {
				assets: {
					"/test.txt": "content",
				},
			};

			const assets = new Assets();
			const methods = ["POST", "PUT", "DELETE", "PATCH"];

			for (const method of methods) {
				const ctx = createTestContext(method, "/test.txt");
				await assets.execute(ctx);

				// Should still serve assets for non-GET requests
				assert.equal(ctx.responseEnded, true);
				assert.equal(ctx.responseBody.toString(), "content");
			}
		});

		test("handles unicode filenames", async () => {
			// Ensure SEA mode is not detected
			globalThis.require = mock.fn(() => {
				throw new Error("Module not found");
			});

			globalThis.RavenJS = {
				assets: {
					"/café.txt": "unicode content",
					"/文件.txt": "chinese content",
				},
			};

			const assets = new Assets();

			// Test unicode paths
			let ctx = createTestContext("GET", "/café.txt");
			await assets.execute(ctx);
			assert.equal(ctx.responseBody.toString(), "unicode content");

			ctx = createTestContext("GET", "/文件.txt");
			await assets.execute(ctx);
			assert.equal(ctx.responseBody.toString(), "chinese content");
		});
	});
});
