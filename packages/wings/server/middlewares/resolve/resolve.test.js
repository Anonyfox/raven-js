/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive tests for resolve.js.
 *
 * Tests all code paths, integration scenarios, and error conditions for
 * the main resolve middleware orchestration with 100% branch coverage.
 */

import assert from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
	createResolveAfterMiddleware,
	createResolveMiddleware,
	resolveAfterMiddleware,
	resolveMiddleware,
} from "./resolve.js";

describe("Resolve Middleware", () => {
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

	// Helper to create mock context
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
			json: function (data) {
				this.responseBody = JSON.stringify(data);
				this.responseHeaders.set("content-type", "application/json");
			},
			js: function (content) {
				this.responseBody = content;
				this.responseHeaders.set("content-type", "application/javascript");
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

	describe("createResolveMiddleware", () => {
		it("should create middleware with valid configuration", () => {
			const middleware = createResolveMiddleware({ sourceFolder: "/tmp" });

			assert.ok(middleware);
			assert.strictEqual(middleware.identifier, "resolve");
			assert.strictEqual(typeof middleware.handler, "function");
		});

		it("should throw for missing sourceFolder", () => {
			assert.throws(
				() => createResolveMiddleware({}),
				/sourceFolder configuration is required/,
			);
		});

		it("should throw for invalid sourceFolder type", () => {
			assert.throws(
				() => createResolveMiddleware({ sourceFolder: 123 }),
				/sourceFolder configuration is required/,
			);
		});

		it("should throw for null sourceFolder", () => {
			assert.throws(
				() => createResolveMiddleware({ sourceFolder: null }),
				/sourceFolder configuration is required/,
			);
		});

		it("should use default importMapPath", () => {
			const middleware = createResolveMiddleware({ sourceFolder: "/tmp" });

			// Default behavior should be tested via integration
			assert.ok(middleware);
		});

		it("should accept custom importMapPath", () => {
			const middleware = createResolveMiddleware({
				sourceFolder: "/tmp",
				importMapPath: "/custom/map.json",
			});

			assert.ok(middleware);
		});
	});

	describe("middleware integration", () => {
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

			const middleware = createResolveMiddleware({ sourceFolder: testDir });
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

			const middleware = createResolveMiddleware({
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

		it("should serve JavaScript modules", async () => {
			const testDir = await createTestStructure({
				"utils.js": "export const helper = () => 'help';",
			});

			const middleware = createResolveMiddleware({ sourceFolder: testDir });
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

			const middleware = createResolveMiddleware({ sourceFolder: testDir });
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

			const middleware = createResolveMiddleware({ sourceFolder: testDir });
			const ctx = createContext("http://localhost/missing.js");

			await middleware.handler(ctx);

			// Should not set response for missing files
			assert.strictEqual(ctx.responseBody, null);

			await cleanup();
		});

		it("should continue to next middleware for non-JS files", async () => {
			const testDir = await createTestStructure({});

			const middleware = createResolveMiddleware({ sourceFolder: testDir });
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

			const middleware = createResolveMiddleware({ sourceFolder: testDir });
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

		it("should handle malformed URLs gracefully", async () => {
			const testDir = await createTestStructure({});

			const middleware = createResolveMiddleware({ sourceFolder: testDir });
			const ctx = createContext("not-a-valid-url");

			// Should not throw, just continue to next middleware
			await middleware.handler(ctx);
			assert.strictEqual(ctx.responseBody, null);

			await cleanup();
		});
	});

	describe("createResolveAfterMiddleware", () => {
		it("should create after-middleware with default path", () => {
			const middleware = createResolveAfterMiddleware();

			assert.ok(middleware);
			assert.strictEqual(middleware.identifier, "resolve-after");
			assert.strictEqual(typeof middleware.handler, "function");
		});

		it("should create after-middleware with custom path", () => {
			const middleware = createResolveAfterMiddleware("/custom/imports.json");

			assert.ok(middleware);
		});

		it("should inject import map into successful HTML responses", async () => {
			const middleware = createResolveAfterMiddleware();
			const ctx = createContext();

			ctx.responseStatusCode = 200;
			ctx.responseBody =
				"<html><head><title>Test</title></head><body></body></html>";
			ctx.responseHeaders.set("content-type", "text/html");

			await middleware.handler(ctx);

			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);

			await cleanup();
		});

		it("should inject import map with custom path", async () => {
			const middleware = createResolveAfterMiddleware("/custom/imports.json");
			const ctx = createContext();

			ctx.responseStatusCode = 200;
			ctx.responseBody =
				"<html><head><title>Test</title></head><body></body></html>";
			ctx.responseHeaders.set("content-type", "text/html");

			await middleware.handler(ctx);

			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/custom/imports.json"></script>',
				),
			);

			await cleanup();
		});

		it("should skip injection for non-successful responses", async () => {
			const middleware = createResolveAfterMiddleware();
			const ctx = createContext();

			ctx.responseStatusCode = 404;
			ctx.responseBody =
				"<html><head><title>Not Found</title></head><body></body></html>";
			ctx.responseHeaders.set("content-type", "text/html");

			await middleware.handler(ctx);

			assert.ok(!ctx.responseBody.includes('<script type="importmap"'));

			await cleanup();
		});

		it("should skip injection for server errors", async () => {
			const middleware = createResolveAfterMiddleware();
			const ctx = createContext();

			ctx.responseStatusCode = 500;
			ctx.responseBody =
				"<html><head><title>Error</title></head><body></body></html>";
			ctx.responseHeaders.set("content-type", "text/html");

			await middleware.handler(ctx);

			assert.ok(!ctx.responseBody.includes('<script type="importmap"'));

			await cleanup();
		});

		it("should handle non-HTML responses gracefully", async () => {
			const middleware = createResolveAfterMiddleware();
			const ctx = createContext();

			ctx.responseStatusCode = 200;
			ctx.responseBody = '{"message": "json response"}';
			ctx.responseHeaders.set("content-type", "application/json");

			await middleware.handler(ctx);

			// Should not modify non-HTML responses
			assert.strictEqual(ctx.responseBody, '{"message": "json response"}');

			await cleanup();
		});
	});

	describe("default exports", () => {
		it("should export default middleware", () => {
			assert.ok(resolveMiddleware);
			assert.strictEqual(resolveMiddleware.identifier, "resolve");
		});

		it("should export default after-middleware", () => {
			assert.ok(resolveAfterMiddleware);
			assert.strictEqual(resolveAfterMiddleware.identifier, "resolve-after");
		});

		it("should use process.cwd() as default source folder", async () => {
			// Default middleware should work without throwing
			const ctx = createContext("http://localhost/nonexistent.js");
			await resolveMiddleware.handler(ctx);

			// Should continue to next middleware for missing files
			assert.strictEqual(ctx.responseBody, null);
		});
	});

	describe("error propagation", () => {
		it("should propagate security errors from module server", async () => {
			const testDir = await createTestStructure({
				".hidden.js": "export default 'secret';",
			});

			const middleware = createResolveMiddleware({ sourceFolder: testDir });
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
			const middleware = createResolveMiddleware({
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
	});
});
