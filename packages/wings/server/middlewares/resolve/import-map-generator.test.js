/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive tests for import-map-generator.js.
 *
 * Tests all code paths, edge cases, and error conditions for import map
 * generation with 100% branch coverage as required by CODEX.md.
 */

import assert from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { generateImportMap } from "./import-map-generator.js";

describe("Import Map Generator", () => {
	let tempDir;

	// Helper to create expected import map with proper null prototype
	function createExpectedImportMap(imports = {}) {
		const expected = Object.create(null);
		expected.imports = Object.create(null);
		Object.assign(expected.imports, imports);
		return expected;
	}

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

	// Cleanup after each test
	async function cleanup() {
		if (tempDir) {
			await rm(tempDir, { recursive: true, force: true });
		}
	}

	describe("generateImportMap", () => {
		it("should generate import map for simple dependencies", async () => {
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
				"node_modules/test-package/index.js": "export default 'test';",
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap({
				"test-package": "/node_modules/test-package/index.js",
			});

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should handle package with exports field", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"esm-package": "1.0.0",
					},
				},
				"node_modules/esm-package/package.json": {
					name: "esm-package",
					exports: "./lib/index.js",
				},
				"node_modules/esm-package/lib/index.js": "export default 'esm';",
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap({
				"esm-package": "/node_modules/esm-package/lib/index.js",
			});

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should handle conditional exports with import condition", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"conditional-package": "1.0.0",
					},
				},
				"node_modules/conditional-package/package.json": {
					name: "conditional-package",
					exports: {
						".": {
							import: "./esm/index.js",
							require: "./cjs/index.js",
						},
					},
				},
				"node_modules/conditional-package/esm/index.js":
					"export default 'esm';",
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap({
				"conditional-package": "/node_modules/conditional-package/esm/index.js",
			});

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should handle packages with subpath exports", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"@test/beak": "1.0.0",
					},
				},
				"node_modules/@test/beak/package.json": {
					name: "@test/beak",
					exports: {
						".": {
							import: "./index.js",
						},
						"./html": {
							import: "./html/index.js",
						},
						"./css": {
							import: "./css/index.js",
						},
						"./js": {
							import: "./js/index.js",
						},
					},
				},
				"node_modules/@test/beak/index.js": "export const beak = 'main';",
				"node_modules/@test/beak/html/index.js":
					"export const html = 'template';",
				"node_modules/@test/beak/css/index.js": "export const css = 'styles';",
				"node_modules/@test/beak/js/index.js": "export const js = 'scripts';",
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap({
				"@test/beak": "/node_modules/@test/beak/index.js",
				"@test/beak/html": "/node_modules/@test/beak/html/index.js",
				"@test/beak/css": "/node_modules/@test/beak/css/index.js",
				"@test/beak/js": "/node_modules/@test/beak/js/index.js",
			});

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should handle module field fallback", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"module-package": "1.0.0",
					},
				},
				"node_modules/module-package/package.json": {
					name: "module-package",
					module: "./esm.js",
					main: "./cjs.js",
				},
				"node_modules/module-package/esm.js": "export default 'esm';",
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap({
				"module-package": "/node_modules/module-package/esm.js",
			});

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should include devDependencies", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"prod-package": "1.0.0",
					},
					devDependencies: {
						"dev-package": "1.0.0",
					},
				},
				"node_modules/prod-package/package.json": {
					name: "prod-package",
					main: "./index.js",
				},
				"node_modules/dev-package/package.json": {
					name: "dev-package",
					main: "./index.js",
				},
			});

			const result = await generateImportMap(testDir);

			assert.strictEqual(Object.keys(result.imports).length, 2);
			assert.ok(result.imports["prod-package"]);
			assert.ok(result.imports["dev-package"]);

			await cleanup();
		});

		it("should handle hoisted dependencies", async () => {
			const testDir = await createTestStructure({
				"nested/package.json": {
					dependencies: {
						"hoisted-package": "1.0.0",
					},
				},
				"node_modules/hoisted-package/package.json": {
					name: "hoisted-package",
					main: "./index.js",
				},
			});

			const result = await generateImportMap(join(testDir, "nested"));

			const expected = createExpectedImportMap({
				"hoisted-package": "/node_modules/hoisted-package/index.js",
			});

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should return empty import map for missing package.json", async () => {
			const testDir = await createTestStructure({});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap();

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should return empty import map for malformed package.json", async () => {
			const testDir = await createTestStructure({
				"package.json": "invalid json",
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap();

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should skip missing packages", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"missing-package": "1.0.0",
						"existing-package": "1.0.0",
					},
				},
				"node_modules/existing-package/package.json": {
					name: "existing-package",
					main: "./index.js",
				},
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap({
				"existing-package": "/node_modules/existing-package/index.js",
			});

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should skip packages without valid package.json", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"invalid-package": "1.0.0",
					},
				},
				"node_modules/invalid-package/not-package.json": "{}",
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap();

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should handle package with default export fallback", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"default-package": "1.0.0",
					},
				},
				"node_modules/default-package/package.json": {
					name: "default-package",
					// No main, module, or exports - should fallback to index.js
				},
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap({
				"default-package": "/node_modules/default-package/index.js",
			});

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should handle complex exports with nested conditions", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"complex-package": "1.0.0",
					},
				},
				"node_modules/complex-package/package.json": {
					name: "complex-package",
					exports: {
						".": {
							browser: {
								import: "./browser/index.js",
								default: "./browser/index.cjs",
							},
							import: "./lib/index.js",
							default: "./lib/index.cjs",
						},
					},
				},
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap({
				"complex-package": "/node_modules/complex-package/lib/index.js",
			});

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should handle exports with null target", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"null-package": "1.0.0",
					},
				},
				"node_modules/null-package/package.json": {
					name: "null-package",
					exports: {
						".": null,
					},
					main: "./fallback.js",
				},
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap({
				"null-package": "/node_modules/null-package/fallback.js",
			});

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should normalize paths correctly", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {
						"path-package": "1.0.0",
					},
				},
				"node_modules/path-package/package.json": {
					name: "path-package",
					main: "index.js", // No leading ./
				},
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap({
				"path-package": "/node_modules/path-package/index.js",
			});

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should handle empty dependencies", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					dependencies: {},
					devDependencies: {},
				},
			});

			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap();

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});

		it("should handle non-existent directory gracefully", async () => {
			const result = await generateImportMap("/non/existent/path");

			const expected = createExpectedImportMap();

			assert.deepStrictEqual(result, expected);
		});

		it("should generate import map when called with project root", async () => {
			const testDir = await createTestStructure({
				"package.json": {
					name: "test-project",
					dependencies: {
						"test-pkg": "1.0.0",
					},
				},
				"node_modules/test-pkg/package.json": {
					name: "test-pkg",
					main: "index.js",
				},
				"node_modules/test-pkg/index.js": "export default 'test';",
				"src/client/app.js": "// client code",
				"src/shared/lib.js": "// shared code",
			});

			// Call generateImportMap with the project root (as the middleware constructor would)
			const result = await generateImportMap(testDir);

			const expected = createExpectedImportMap({
				"test-pkg": "/node_modules/test-pkg/index.js",
			});

			assert.deepStrictEqual(result, expected);

			await cleanup();
		});
	});
});
