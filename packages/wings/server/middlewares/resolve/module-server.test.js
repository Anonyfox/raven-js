/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive tests for module-server.js.
 *
 * Tests all code paths, edge cases, and error conditions for JavaScript
 * module serving with 100% branch coverage as required by CODEX.md.
 */

import assert from "node:assert";
import { chmod, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { serveModule } from "./module-server.js";

describe("Module Server", () => {
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
			await writeFile(fullPath, content);
		}

		return tempDir;
	}

	// Helper to create mock context
	function createContext() {
		const ctx = {
			responseBody: null,
			responseHeaders: new Map(),
			responseStatusCode: 200,
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

	describe("serveModule", () => {
		it("should serve valid JavaScript file", async () => {
			const testDir = await createTestStructure({
				"test.js": "export default 'hello';",
			});

			const ctx = createContext();
			const result = await serveModule(ctx, "test.js", testDir);

			assert.strictEqual(result, true);
			assert.strictEqual(ctx.responseBody, "export default 'hello';");
			assert.strictEqual(
				ctx.responseHeaders.get("content-type"),
				"application/javascript",
			);

			await cleanup();
		});

		it("should serve .mjs files", async () => {
			const testDir = await createTestStructure({
				"module.mjs": "export const value = 42;",
			});

			const ctx = createContext();
			const result = await serveModule(ctx, "module.mjs", testDir);

			assert.strictEqual(result, true);
			assert.strictEqual(ctx.responseBody, "export const value = 42;");

			await cleanup();
		});

		it("should serve files from subdirectories", async () => {
			const testDir = await createTestStructure({
				"utils/helper.js": "export function help() { return 'helping'; }",
			});

			const ctx = createContext();
			const result = await serveModule(ctx, "utils/helper.js", testDir);

			assert.strictEqual(result, true);
			assert.strictEqual(
				ctx.responseBody,
				"export function help() { return 'helping'; }",
			);

			await cleanup();
		});

		it("should return false for missing files", async () => {
			const testDir = await createTestStructure({});

			const ctx = createContext();
			const result = await serveModule(ctx, "missing.js", testDir);

			assert.strictEqual(result, false);
			assert.strictEqual(ctx.responseBody, null);

			await cleanup();
		});

		it("should throw for invalid file extensions", async () => {
			const testDir = await createTestStructure({
				"test.txt": "not javascript",
			});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, "test.txt", testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should throw for path traversal attempts", async () => {
			const testDir = await createTestStructure({
				"test.js": "export default 'test';",
			});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, "../test.js", testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should throw for complex path traversal attempts", async () => {
			const testDir = await createTestStructure({});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, "../../etc/passwd", testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should throw for absolute paths", async () => {
			const testDir = await createTestStructure({});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, "/etc/passwd", testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should throw for Windows absolute paths", async () => {
			const testDir = await createTestStructure({});

			const ctx = createContext();

			await assert.rejects(
				async () =>
					await serveModule(ctx, "C:\\Windows\\system32\\cmd.exe", testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should throw for hidden files", async () => {
			const testDir = await createTestStructure({
				".hidden.js": "export default 'secret';",
			});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, ".hidden.js", testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should throw for hidden directories", async () => {
			const testDir = await createTestStructure({
				".secret/config.js": "export default 'config';",
			});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, ".secret/config.js", testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should throw for empty file path", async () => {
			const testDir = await createTestStructure({});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, "", testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should throw for null file path", async () => {
			const testDir = await createTestStructure({});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, null, testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should throw for non-string file path", async () => {
			const testDir = await createTestStructure({});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, 123, testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should throw for double slashes in path", async () => {
			const testDir = await createTestStructure({});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, "utils//helper.js", testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should throw for backslash path traversal", async () => {
			const testDir = await createTestStructure({});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, "..\\test.js", testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should handle case insensitive extensions", async () => {
			const testDir = await createTestStructure({
				"test.JS": "export default 'uppercase';",
			});

			const ctx = createContext();
			const result = await serveModule(ctx, "test.JS", testDir);

			assert.strictEqual(result, true);
			assert.strictEqual(ctx.responseBody, "export default 'uppercase';");

			await cleanup();
		});

		it("should handle .MJS extension", async () => {
			const testDir = await createTestStructure({
				"module.MJS": "export const value = 'uppercase';",
			});

			const ctx = createContext();
			const result = await serveModule(ctx, "module.MJS", testDir);

			assert.strictEqual(result, true);
			assert.strictEqual(ctx.responseBody, "export const value = 'uppercase';");

			await cleanup();
		});

		it("should normalize complex valid paths", async () => {
			const testDir = await createTestStructure({
				"utils/helpers/math.js": "export function add(a, b) { return a + b; }",
			});

			const ctx = createContext();
			const result = await serveModule(ctx, "utils/./helpers/math.js", testDir);

			assert.strictEqual(result, true);
			assert.strictEqual(
				ctx.responseBody,
				"export function add(a, b) { return a + b; }",
			);

			await cleanup();
		});

		it("should reject files outside source root", async () => {
			const testDir = await createTestStructure({
				"test.js": "export default 'test';",
			});

			// Create a file outside the source directory
			const outsideFile = join(testDir, "..", "outside.js");
			await writeFile(outsideFile, "export default 'outside';");

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, "../outside.js", testDir),
				/Invalid module path/,
			);

			// Cleanup the outside file
			await rm(outsideFile, { force: true });
			await cleanup();
		});

		it("should handle file read permission errors", async () => {
			const testDir = await createTestStructure({
				"restricted.js": "export default 'restricted';",
			});

			// Make file unreadable (skip on Windows as chmod behaves differently)
			const restrictedFile = join(testDir, "restricted.js");
			if (process.platform !== "win32") {
				await chmod(restrictedFile, 0o000);

				const ctx = createContext();

				await assert.rejects(
					async () => await serveModule(ctx, "restricted.js", testDir),
					/Failed to read module/,
				);

				// Restore permissions for cleanup
				await chmod(restrictedFile, 0o644);
			}

			await cleanup();
		});

		it("should handle UTF-8 content correctly", async () => {
			const content =
				"// UTF-8 content: café, résumé, 文件\nexport default '🎉';";
			const testDir = await createTestStructure({
				"unicode.js": content,
			});

			const ctx = createContext();
			const result = await serveModule(ctx, "unicode.js", testDir);

			assert.strictEqual(result, true);
			assert.strictEqual(ctx.responseBody, content);

			await cleanup();
		});

		it("should reject jsx files", async () => {
			const testDir = await createTestStructure({
				"component.jsx":
					"export default function() { return <div>Hello</div>; }",
			});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, "component.jsx", testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should reject ts files", async () => {
			const testDir = await createTestStructure({
				"types.ts": "export interface User { name: string; }",
			});

			const ctx = createContext();

			await assert.rejects(
				async () => await serveModule(ctx, "types.ts", testDir),
				/Invalid module path/,
			);

			await cleanup();
		});

		it("should handle very long valid paths", async () => {
			const longPath = "a".repeat(50) + "/" + "b".repeat(50) + "/test.js";
			const structure = {};
			structure[longPath] = "export default 'long path';";

			const testDir = await createTestStructure(structure);

			const ctx = createContext();
			const result = await serveModule(ctx, longPath, testDir);

			assert.strictEqual(result, true);
			assert.strictEqual(ctx.responseBody, "export default 'long path';");

			await cleanup();
		});
	});
});
