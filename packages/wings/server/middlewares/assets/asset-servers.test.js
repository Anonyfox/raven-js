/**
 * @file Asset Servers Tests - Comprehensive test suite for mode-specific asset serving
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
import {
	serveAssetFileSystem,
	serveAssetGlobal,
	serveAssetSEA,
} from "./asset-servers.js";

// Mock context for testing
function createMockContext() {
	return {
		responseHeaders: new Map(),
		responseStatusCode: 0,
		responseBody: null,
		responseEnded: false,
	};
}

test("serveAssetSEA", async (t) => {
	await t.test("serves asset from SEA when available", async () => {
		const ctx = createMockContext();
		const assetPath = "/css/style.css";
		const content = "body { color: red; }";

		// Mock the require function to simulate SEA environment
		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return {
					getAsset: (path) => {
						if (path === assetPath) {
							return content;
						}
						throw new Error("Asset not found");
					},
				};
			}
			return originalRequire(moduleName);
		};

		await serveAssetSEA(ctx, assetPath);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/css");
		assert.strictEqual(ctx.responseBody.toString(), content);
		assert.strictEqual(ctx.responseEnded, true);

		// Restore original require
		global.require = originalRequire;
	});

	await t.test(
		"returns without setting response when SEA asset not found",
		async () => {
			const ctx = createMockContext();
			const assetPath = "/nonexistent.css";

			const originalRequire = global.require;
			global.require = (moduleName) => {
				if (moduleName === "node:sea") {
					return {
						getAsset: () => {
							throw new Error("Asset not found");
						},
					};
				}
				return originalRequire(moduleName);
			};

			await serveAssetSEA(ctx, assetPath);

			// Should not set response when asset not found
			assert.strictEqual(ctx.responseStatusCode, 0);
			assert.strictEqual(ctx.responseBody, null);
			assert.strictEqual(ctx.responseEnded, false);

			global.require = originalRequire;
		},
	);

	await t.test(
		"returns without setting response when SEA module unavailable",
		async () => {
			const ctx = createMockContext();
			const assetPath = "/css/style.css";

			const originalRequire = global.require;
			global.require = () => {
				throw new Error("Module not found");
			};

			await serveAssetSEA(ctx, assetPath);

			// Should not set response when SEA unavailable
			assert.strictEqual(ctx.responseStatusCode, 0);
			assert.strictEqual(ctx.responseBody, null);
			assert.strictEqual(ctx.responseEnded, false);

			global.require = originalRequire;
		},
	);

	await t.test("handles binary content correctly", async () => {
		const ctx = createMockContext();
		const assetPath = "/images/logo.png";
		const binaryContent = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG signature

		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return {
					getAsset: (path) => {
						if (path === assetPath) {
							return binaryContent;
						}
						throw new Error("Asset not found");
					},
				};
			}
			return originalRequire(moduleName);
		};

		await serveAssetSEA(ctx, assetPath);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseHeaders.get("content-type"), "image/png");
		assert.deepStrictEqual(ctx.responseBody, Buffer.from(binaryContent));
		assert.strictEqual(ctx.responseEnded, true);

		global.require = originalRequire;
	});
});

test("serveAssetGlobal", async (t) => {
	await t.test("serves string asset from global variables", async () => {
		const ctx = createMockContext();
		const assetPath = "/css/style.css";
		const content = "body { color: blue; }";

		const original = globalThis.RavenJS;
		globalThis.RavenJS = {
			assets: {
				[assetPath]: content,
			},
		};

		await serveAssetGlobal(ctx, assetPath);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/css");
		assert.strictEqual(ctx.responseBody.toString(), content);
		assert.strictEqual(ctx.responseEnded, true);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("serves Buffer asset from global variables", async () => {
		const ctx = createMockContext();
		const assetPath = "/images/logo.png";
		const content = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

		const original = globalThis.RavenJS;
		globalThis.RavenJS = {
			assets: {
				[assetPath]: content,
			},
		};

		await serveAssetGlobal(ctx, assetPath);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseHeaders.get("content-type"), "image/png");
		assert.deepStrictEqual(ctx.responseBody, content);
		assert.strictEqual(ctx.responseEnded, true);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test(
		"returns without setting response when asset not found",
		async () => {
			const ctx = createMockContext();
			const assetPath = "/nonexistent.css";

			const original = globalThis.RavenJS;
			globalThis.RavenJS = {
				assets: {
					"/other.css": "content",
				},
			};

			await serveAssetGlobal(ctx, assetPath);

			// Should not set response when asset not found
			assert.strictEqual(ctx.responseStatusCode, 0);
			assert.strictEqual(ctx.responseBody, null);
			assert.strictEqual(ctx.responseEnded, false);

			// Restore
			if (original) globalThis.RavenJS = original;
			else delete globalThis.RavenJS;
		},
	);

	await t.test(
		"returns without setting response when content is null or undefined",
		async () => {
			const ctx1 = createMockContext();
			const ctx2 = createMockContext();
			const assetPath1 = "/null.css";
			const assetPath2 = "/undefined.css";

			const original = globalThis.RavenJS;
			globalThis.RavenJS = {
				assets: {
					[assetPath1]: null,
					// assetPath2 intentionally not defined (undefined)
				},
			};

			await serveAssetGlobal(ctx1, assetPath1);
			await serveAssetGlobal(ctx2, assetPath2);

			// Should not set response when content is null
			assert.strictEqual(ctx1.responseStatusCode, 0);
			assert.strictEqual(ctx1.responseBody, null);
			assert.strictEqual(ctx1.responseEnded, false);

			// Should not set response when content is undefined
			assert.strictEqual(ctx2.responseStatusCode, 0);
			assert.strictEqual(ctx2.responseBody, null);
			assert.strictEqual(ctx2.responseEnded, false);

			// Restore
			if (original) globalThis.RavenJS = original;
			else delete globalThis.RavenJS;
		},
	);

	await t.test("handles empty string content", async () => {
		const ctx = createMockContext();
		const assetPath = "/empty.txt";

		const original = globalThis.RavenJS;
		globalThis.RavenJS = {
			assets: {
				[assetPath]: "",
			},
		};

		await serveAssetGlobal(ctx, assetPath);

		// Empty string is truthy, so should serve
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/plain");
		assert.strictEqual(ctx.responseBody.toString(), "");
		assert.strictEqual(ctx.responseEnded, true);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("handles various content types", async () => {
		const ctx1 = createMockContext();
		const ctx2 = createMockContext();
		const ctx3 = createMockContext();

		const original = globalThis.RavenJS;
		globalThis.RavenJS = {
			assets: {
				"/text.txt": "string content",
				"/data.json": '{"key": "value"}',
				"/buffer.bin": Buffer.from("binary data"),
			},
		};

		await serveAssetGlobal(ctx1, "/text.txt");
		await serveAssetGlobal(ctx2, "/data.json");
		await serveAssetGlobal(ctx3, "/buffer.bin");

		// Text file
		assert.strictEqual(ctx1.responseStatusCode, 200);
		assert.strictEqual(ctx1.responseHeaders.get("content-type"), "text/plain");
		assert.strictEqual(ctx1.responseBody.toString(), "string content");

		// JSON file
		assert.strictEqual(ctx2.responseStatusCode, 200);
		assert.strictEqual(
			ctx2.responseHeaders.get("content-type"),
			"application/json",
		);
		assert.strictEqual(ctx2.responseBody.toString(), '{"key": "value"}');

		// Binary file
		assert.strictEqual(ctx3.responseStatusCode, 200);
		assert.strictEqual(
			ctx3.responseHeaders.get("content-type"),
			"application/octet-stream",
		);
		assert.strictEqual(ctx3.responseBody.toString(), "binary data");

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});
});

test("serveAssetFileSystem", async (t) => {
	const testDir = path.join(process.cwd(), "test-asset-servers");

	async function createTestStructure() {
		await fs.mkdir(testDir, { recursive: true });
		await fs.writeFile(
			path.join(testDir, "style.css"),
			"body { color: green; }",
		);
		await fs.writeFile(path.join(testDir, "app.js"), "console.log('app');");

		// Create subdirectory
		await fs.mkdir(path.join(testDir, "images"), { recursive: true });
		await fs.writeFile(
			path.join(testDir, "images", "logo.png"),
			"fake png data",
		);
	}

	async function cleanupTestStructure() {
		try {
			await fs.rm(testDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	}

	await t.test("serves file from file system", async () => {
		await createTestStructure();

		const ctx = createMockContext();
		const assetPath = "/style.css";

		await serveAssetFileSystem(ctx, assetPath, testDir);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/css");
		assert.strictEqual(ctx.responseBody.toString(), "body { color: green; }");
		assert.strictEqual(ctx.responseEnded, true);

		await cleanupTestStructure();
	});

	await t.test("serves file from subdirectory", async () => {
		await createTestStructure();

		const ctx = createMockContext();
		const assetPath = "/images/logo.png";

		await serveAssetFileSystem(ctx, assetPath, testDir);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseHeaders.get("content-type"), "image/png");
		assert.strictEqual(ctx.responseBody.toString(), "fake png data");
		assert.strictEqual(ctx.responseEnded, true);

		await cleanupTestStructure();
	});

	await t.test(
		"returns without setting response when file not found",
		async () => {
			await createTestStructure();

			const ctx = createMockContext();
			const assetPath = "/nonexistent.css";

			await serveAssetFileSystem(ctx, assetPath, testDir);

			// Should not set response when file not found
			assert.strictEqual(ctx.responseStatusCode, 0);
			assert.strictEqual(ctx.responseBody, null);
			assert.strictEqual(ctx.responseEnded, false);

			await cleanupTestStructure();
		},
	);

	await t.test("prevents path traversal attacks", async () => {
		await createTestStructure();

		// Create a file outside the assets directory
		const outsideFile = path.join(process.cwd(), "secret.txt");
		await fs.writeFile(outsideFile, "secret content");

		const ctx = createMockContext();
		const assetPath = "/../secret.txt";

		await serveAssetFileSystem(ctx, assetPath, testDir);

		// Should not serve file outside assets directory
		assert.strictEqual(ctx.responseStatusCode, 0);
		assert.strictEqual(ctx.responseBody, null);
		assert.strictEqual(ctx.responseEnded, false);

		// Cleanup
		await cleanupTestStructure();
		await fs.unlink(outsideFile);
	});

	await t.test("prevents complex path traversal attempts", async () => {
		await createTestStructure();

		const ctx = createMockContext();
		const assetPath = "/images/../../secret.txt";

		await serveAssetFileSystem(ctx, assetPath, testDir);

		// Should not serve file outside assets directory
		assert.strictEqual(ctx.responseStatusCode, 0);
		assert.strictEqual(ctx.responseBody, null);
		assert.strictEqual(ctx.responseEnded, false);

		await cleanupTestStructure();
	});

	await t.test(
		"returns without setting response when directory doesn't exist",
		async () => {
			const ctx = createMockContext();
			const assetPath = "/style.css";
			const nonExistentDir = "/non/existent/directory";

			await serveAssetFileSystem(ctx, assetPath, nonExistentDir);

			// Should not set response when directory doesn't exist
			assert.strictEqual(ctx.responseStatusCode, 0);
			assert.strictEqual(ctx.responseBody, null);
			assert.strictEqual(ctx.responseEnded, false);
		},
	);

	await t.test("handles symbolic links within assets directory", async () => {
		await createTestStructure();

		const ctx = createMockContext();
		const assetPath = "/link.css";

		try {
			// Create a symbolic link to the CSS file
			await fs.symlink(
				path.join(testDir, "style.css"),
				path.join(testDir, "link.css"),
			);

			await serveAssetFileSystem(ctx, assetPath, testDir);

			// Should serve the linked file if symlink creation succeeded
			assert.strictEqual(ctx.responseStatusCode, 200);
			assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/css");
			assert.strictEqual(ctx.responseBody.toString(), "body { color: green; }");
			assert.strictEqual(ctx.responseEnded, true);
		} catch {
			// Symlink creation failed (permissions, OS support, etc.)
			// In this case, the file doesn't exist, so no response should be set
			assert.strictEqual(ctx.responseStatusCode, 0);
			assert.strictEqual(ctx.responseBody, null);
			assert.strictEqual(ctx.responseEnded, false);
		}

		await cleanupTestStructure();
	});

	await t.test("handles large files efficiently", async () => {
		const largeDir = path.join(process.cwd(), "test-large-asset");
		await fs.mkdir(largeDir, { recursive: true });

		// Create a 1MB file
		const largeContent = "x".repeat(1024 * 1024);
		await fs.writeFile(path.join(largeDir, "large.txt"), largeContent);

		const ctx = createMockContext();
		const assetPath = "/large.txt";

		await serveAssetFileSystem(ctx, assetPath, largeDir);

		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/plain");
		assert.strictEqual(
			ctx.responseHeaders.get("content-length"),
			(1024 * 1024).toString(),
		);
		assert.strictEqual(ctx.responseBody.length, 1024 * 1024);
		assert.strictEqual(ctx.responseEnded, true);

		await fs.rm(largeDir, { recursive: true, force: true });
	});
});
