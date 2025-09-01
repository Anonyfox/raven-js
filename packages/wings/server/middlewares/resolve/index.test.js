/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive tests for Resolve middleware class.
 *
 * Tests the public class interface, configuration validation, and integration
 * scenarios with 100% branch coverage as required by CODEX.md.
 */

import assert from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { Resolve } from "./index.js";

describe("Resolve Middleware Class", () => {
	let tempDir;

	// Helper to create temporary test structure
	async function createTestStructure(structure) {
		tempDir = join(
			tmpdir(),
			`test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		await mkdir(tempDir, { recursive: true });

		for (const [path, content] of Object.entries(structure)) {
			const fullPath = join(tempDir, path);
			await mkdir(join(fullPath, ".."), { recursive: true });

			if (typeof content === "object") {
				await writeFile(fullPath, JSON.stringify(content, null, 2));
			} else {
				await writeFile(fullPath, content);
			}
		}

		return tempDir;
	}

	// Helper to create mock context with after-callback support
	function createContext(url = "http://localhost/", method = "GET") {
		let pathname;
		try {
			const urlObj = new URL(url);
			pathname = urlObj.pathname;
		} catch {
			// For malformed URLs, just use the string as-is for testing
			pathname = url;
		}

		const ctx = {
			path: pathname,
			method,
			responseBody: null,
			responseHeaders: new Map(),
			responseStatusCode: 200,
			afterCallbacks: [],
			json: function (data) {
				this.responseBody = JSON.stringify(data);
				this.responseHeaders.set("content-type", "application/json");
			},
			js: function (content) {
				this.responseBody = content;
				this.responseHeaders.set("content-type", "application/javascript");
			},
			addAfterCallback: function (middleware) {
				this.afterCallbacks.push(middleware);
			},
			async runAfterCallbacks() {
				for (const middleware of this.afterCallbacks) {
					await middleware.handler(this);
				}
			},
		};

		return ctx;
	}

	// Cleanup after each test
	async function cleanup() {
		if (tempDir) {
			await rm(tempDir, { recursive: true, force: true });
		}
	}

	describe("constructor", () => {
		it("should create middleware with valid configuration", () => {
			const middleware = new Resolve({ sourceFolder: "/tmp" });

			assert.ok(middleware);
			assert.strictEqual(middleware.identifier, "resolve");
			assert.strictEqual(typeof middleware.handler, "function");
		});

		it("should throw for missing sourceFolder", () => {
			assert.throws(
				() => new Resolve({}),
				/sourceFolder configuration is required/,
			);
		});

		it("should throw for invalid sourceFolder type", () => {
			assert.throws(
				() => new Resolve({ sourceFolder: 123 }),
				/sourceFolder configuration is required/,
			);
		});

		it("should throw for null sourceFolder", () => {
			assert.throws(
				() => new Resolve({ sourceFolder: null }),
				/sourceFolder configuration is required/,
			);
		});

		it("should resolve relative paths to absolute paths", () => {
			const resolve = new Resolve({ sourceFolder: "src" });

			// Should not throw and should work with relative paths
			assert.ok(resolve instanceof Resolve);
		});

		it("should throw for missing config object", () => {
			assert.throws(
				() => new Resolve(),
				/sourceFolder configuration is required/,
			);
		});

		it("should use default importMapPath", () => {
			const middleware = new Resolve({ sourceFolder: "/tmp" });

			// Default behavior should be tested via integration
			assert.ok(middleware);
		});

		it("should accept custom importMapPath", () => {
			const middleware = new Resolve({
				sourceFolder: "/tmp",
				importMapPath: "/custom/map.json",
			});

			assert.ok(middleware);
		});
	});

	describe("import map serving", () => {
		it("should serve import map at configured path", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"test-package": "1.0.0",
					},
				},
				"node_modules/test-package/package.json": {
					name: "test-package",
					main: "./index.js",
				},
			});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/importmap.json");

			await middleware.handler(ctx);

			assert.strictEqual(
				ctx.responseHeaders.get("content-type"),
				"application/json",
			);
			const importMap = JSON.parse(ctx.responseBody);
			assert.ok(importMap.imports);
			assert.ok(importMap.imports["test-package"]);

			await cleanup();
		});

		it("should serve import map at custom path", async () => {
			const testDir = await createTestStructure({
				"package.json": {},
			});

			const middleware = new Resolve({
				sourceFolder: testDir,
				importMapPath: "/custom/imports.json",
			});
			const ctx = createContext("http://localhost/custom/imports.json");

			await middleware.handler(ctx);

			assert.strictEqual(
				ctx.responseHeaders.get("content-type"),
				"application/json",
			);
			const importMap = JSON.parse(ctx.responseBody);
			assert.ok(importMap.imports);

			await cleanup();
		});
	});

	describe("JavaScript module serving", () => {
		it("should serve JavaScript modules", async () => {
			const testDir = await createTestStructure({
				"utils.js": "export const helper = () => 'help';",
			});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/utils.js");

			await middleware.handler(ctx);

			assert.strictEqual(
				ctx.responseHeaders.get("content-type"),
				"application/javascript",
			);
			assert.strictEqual(
				ctx.responseBody,
				"export const helper = () => 'help';",
			);

			await cleanup();
		});

		it("should serve .mjs modules", async () => {
			const testDir = await createTestStructure({
				"module.mjs": "export default 'mjs module';",
			});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/module.mjs");

			await middleware.handler(ctx);

			assert.strictEqual(
				ctx.responseHeaders.get("content-type"),
				"application/javascript",
			);
			assert.strictEqual(ctx.responseBody, "export default 'mjs module';");

			await cleanup();
		});

		it("should continue to next middleware for missing modules", async () => {
			const testDir = await createTestStructure({});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/missing.js");

			await middleware.handler(ctx);

			// Should not set response for missing files
			assert.strictEqual(ctx.responseBody, null);

			await cleanup();
		});

		it("should continue to next middleware for non-JS files", async () => {
			const testDir = await createTestStructure({});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/style.css");

			await middleware.handler(ctx);

			// Should not process non-JS files
			assert.strictEqual(ctx.responseBody, null);

			await cleanup();
		});

		it("should handle modules in subdirectories", async () => {
			const testDir = await createTestStructure({
				"lib/helper.js": "export function help() { return 'helping'; }",
			});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/lib/helper.js");

			await middleware.handler(ctx);

			assert.strictEqual(
				ctx.responseHeaders.get("content-type"),
				"application/javascript",
			);
			assert.strictEqual(
				ctx.responseBody,
				"export function help() { return 'helping'; }",
			);

			await cleanup();
		});
	});

	describe("after-handler registration", () => {
		it("should register after-handler for HTML injection", async () => {
			const testDir = await createTestStructure({});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/style.css");

			await middleware.handler(ctx);

			// Should have registered one after-callback
			assert.strictEqual(ctx.afterCallbacks.length, 1);
			assert.strictEqual(ctx.afterCallbacks[0].identifier, "resolve-after");

			await cleanup();
		});

		it("should inject import map into successful HTML responses", async () => {
			const testDir = await createTestStructure({});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/page.html");

			ctx.responseStatusCode = 200;
			ctx.responseBody =
				"<html><head><title>Test</title></head><body></body></html>";
			ctx.responseHeaders.set("content-type", "text/html");

			await middleware.handler(ctx);
			await ctx.runAfterCallbacks();

			assert.ok(
				ctx.responseBody.includes('<script type="importmap">'),
				"Should contain inline import map",
			);

			await cleanup();
		});

		it("should inject import map with custom path", async () => {
			const testDir = await createTestStructure({});

			const middleware = new Resolve({
				sourceFolder: testDir,
				importMapPath: "/custom/imports.json",
			});
			const ctx = createContext("http://localhost/page.html");

			ctx.responseStatusCode = 200;
			ctx.responseBody =
				"<html><head><title>Test</title></head><body></body></html>";
			ctx.responseHeaders.set("content-type", "text/html");

			await middleware.handler(ctx);
			await ctx.runAfterCallbacks();

			assert.ok(
				ctx.responseBody.includes('<script type="importmap">'),
				"Should contain inline import map",
			);

			await cleanup();
		});

		it("should skip injection for non-successful responses", async () => {
			const testDir = await createTestStructure({});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/page.html");

			ctx.responseStatusCode = 404;
			ctx.responseBody =
				"<html><head><title>Not Found</title></head><body></body></html>";
			ctx.responseHeaders.set("content-type", "text/html");

			await middleware.handler(ctx);
			await ctx.runAfterCallbacks();

			assert.ok(!ctx.responseBody.includes('<script type="importmap"'));

			await cleanup();
		});

		it("should skip injection for server errors", async () => {
			const testDir = await createTestStructure({});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/page.html");

			ctx.responseStatusCode = 500;
			ctx.responseBody =
				"<html><head><title>Error</title></head><body></body></html>";
			ctx.responseHeaders.set("content-type", "text/html");

			await middleware.handler(ctx);
			await ctx.runAfterCallbacks();

			assert.ok(!ctx.responseBody.includes('<script type="importmap"'));

			await cleanup();
		});

		it("should handle non-HTML responses gracefully", async () => {
			const testDir = await createTestStructure({});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/api/data");

			ctx.responseStatusCode = 200;
			ctx.responseBody = '{"message": "json response"}';
			ctx.responseHeaders.set("content-type", "application/json");

			await middleware.handler(ctx);
			await ctx.runAfterCallbacks();

			// Should not modify non-HTML responses
			assert.strictEqual(ctx.responseBody, '{"message": "json response"}');

			await cleanup();
		});
	});

	describe("error propagation", () => {
		it("should propagate security errors from module server", async () => {
			const testDir = await createTestStructure({
				".hidden.js": "export default 'secret';",
			});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/.hidden.js");

			// Should throw for hidden file access attempt
			await assert.rejects(
				async () => await middleware.handler(ctx),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should handle import map generation errors gracefully", async () => {
			// Test with non-existent source folder
			const middleware = new Resolve({
				sourceFolder: "/nonexistent",
			});
			const ctx = createContext("http://localhost/importmap.json");

			// Should not throw, just return empty import map
			await middleware.handler(ctx);

			assert.strictEqual(
				ctx.responseHeaders.get("content-type"),
				"application/json",
			);
			const importMap = JSON.parse(ctx.responseBody);
			assert.ok(importMap.imports);

			await cleanup();
		});

		it("should handle malformed URLs gracefully", async () => {
			const testDir = await createTestStructure({});

			const middleware = new Resolve({ sourceFolder: testDir });
			const ctx = createContext("not-a-valid-url");

			// Should not throw, just continue to next middleware
			await middleware.handler(ctx);
			assert.strictEqual(ctx.responseBody, null);

			await cleanup();
		});
	});

	describe("integration scenarios", () => {
		it("should handle complete workflow with real packages", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"test-lib": "1.0.0",
					},
				},
				"node_modules/test-lib/package.json": {
					name: "test-lib",
					exports: {
						".": {
							import: "./esm/index.js",
							require: "./cjs/index.js",
						},
					},
				},
				"node_modules/test-lib/esm/index.js": "export const test = 'lib';",
				"app.js": "import { test } from 'test-lib'; export default test;",
				"index.html":
					"<html><head><title>App</title></head><body></body></html>",
			});

			const middleware = new Resolve({ sourceFolder: testDir });

			// 1. Serve import map
			const importMapCtx = createContext("http://localhost/importmap.json");
			await middleware.handler(importMapCtx);

			assert.strictEqual(
				importMapCtx.responseHeaders.get("content-type"),
				"application/json",
			);
			const importMap = JSON.parse(importMapCtx.responseBody);
			assert.strictEqual(
				importMap.imports["test-lib"],
				"/node_modules/test-lib/esm/index.js",
			);

			// 2. Serve application module
			const moduleCtx = createContext("http://localhost/app.js");
			await middleware.handler(moduleCtx);

			assert.strictEqual(
				moduleCtx.responseHeaders.get("content-type"),
				"application/javascript",
			);
			assert.ok(
				moduleCtx.responseBody.includes("import { test } from 'test-lib'"),
			);

			// 3. Process HTML with injection
			const htmlCtx = createContext("http://localhost/");
			htmlCtx.responseStatusCode = 200;
			htmlCtx.responseBody =
				"<html><head><title>App</title></head><body></body></html>";
			htmlCtx.responseHeaders.set("content-type", "text/html");

			await middleware.handler(htmlCtx);
			await htmlCtx.runAfterCallbacks();

			assert.ok(
				htmlCtx.responseBody.includes('<script type="importmap">'),
				"Should contain inline import map",
			);

			await cleanup();
		});
	});
});
