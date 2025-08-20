/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for site orchestration module - complete documentation pipeline.
 */

import { strict as assert } from "node:assert";
import { readFile, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { generateStaticSite } from "./site-orchestration.js";

test("generateStaticSite creates complete documentation site", async () => {
	const tempDir = join(tmpdir(), `site-orchestration-${Date.now()}`);

	try {
		const mockGraph = {
			package: {
				name: "test-package",
				version: "1.0.0",
				description: "Test package",
			},
			modules: {
				"test-module": {
					path: "test.js",
					exports: ["testFunc"],
					imports: [],
				},
				"utils-module": {
					path: "utils.js",
					exports: ["helper"],
					imports: ["dep"],
				},
			},
			entities: {
				"test-module/testFunc": {
					id: "test-module/testFunc",
					name: "testFunc",
					type: "function",
					moduleId: "test-module",
					location: { file: "test.js", line: 1 },
					exports: ["named"],
					jsdoc: { description: "Test function" },
					source: "function testFunc() {}",
				},
				"utils-module/helper": {
					id: "utils-module/helper",
					name: "helper",
					type: "variable",
					moduleId: "utils-module",
					location: { file: "utils.js", line: 5 },
					exports: ["default"],
					jsdoc: null,
					source: "const helper = 42;",
				},
			},
			readmes: {
				root: { content: "# Test Package\n\nThis is a test package." },
			},
			assets: {},
		};

		await generateStaticSite(mockGraph, tempDir);

		// Verify main index page was created
		const indexContent = await readFile(join(tempDir, "index.html"), "utf-8");
		assert.ok(indexContent.includes("test-package"));
		assert.ok(indexContent.includes("Test Package"));
		assert.ok(indexContent.includes("test-module"));
		assert.ok(indexContent.includes("utils-module"));

		// Verify module pages were created
		const testModuleContent = await readFile(
			join(tempDir, "modules", "test-module.html"),
			"utf-8",
		);
		assert.ok(testModuleContent.includes("test-module"));
		assert.ok(testModuleContent.includes("testFunc"));

		const utilsModuleContent = await readFile(
			join(tempDir, "modules", "utils-module.html"),
			"utf-8",
		);
		assert.ok(utilsModuleContent.includes("utils-module"));
		assert.ok(utilsModuleContent.includes("helper"));

		// Verify entity pages were created
		const testFuncContent = await readFile(
			join(tempDir, "entities", "test-module-testFunc.html"),
			"utf-8",
		);
		assert.ok(testFuncContent.includes("testFunc"));
		assert.ok(testFuncContent.includes("Test function"));

		const helperContent = await readFile(
			join(tempDir, "entities", "utils-module-helper.html"),
			"utf-8",
		);
		assert.ok(helperContent.includes("helper"));
		assert.ok(helperContent.includes("const helper = 42;"));

		// Verify assets were created
		const cssContent = await readFile(
			join(tempDir, "assets", "styles.css"),
			"utf-8",
		);
		assert.ok(cssContent.includes("/* Glean Documentation Styles */"));
		assert.ok(cssContent.includes("body {"));
	} finally {
		try {
			await rmdir(tempDir, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	}
});

test("generateStaticSite handles empty modules and entities", async () => {
	const tempDir = join(tmpdir(), `site-empty-${Date.now()}`);

	try {
		const mockGraph = {
			package: { name: "empty-package", version: "0.1.0" },
			modules: {},
			entities: {},
			readmes: {},
			assets: {},
		};

		await generateStaticSite(mockGraph, tempDir);

		// Verify index page still created
		const indexContent = await readFile(join(tempDir, "index.html"), "utf-8");
		assert.ok(indexContent.includes("empty-package"));
		assert.ok(indexContent.includes("0")); // 0 modules

		// Verify assets still created
		const cssContent = await readFile(
			join(tempDir, "assets", "styles.css"),
			"utf-8",
		);
		assert.ok(cssContent.includes("/* Glean Documentation Styles */"));

		// Verify no module or entity directories created
		try {
			await readFile(join(tempDir, "modules", "any.html"), "utf-8");
			assert.fail("Should not have created module files");
		} catch (error) {
			assert.ok(error.code === "ENOENT");
		}

		try {
			await readFile(join(tempDir, "entities", "any.html"), "utf-8");
			assert.fail("Should not have created entity files");
		} catch (error) {
			assert.ok(error.code === "ENOENT");
		}
	} finally {
		try {
			await rmdir(tempDir, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	}
});

test("generateStaticSite creates output directory if it doesn't exist", async () => {
	const tempDir = join(tmpdir(), `site-new-dir-${Date.now()}`);

	try {
		const mockGraph = {
			package: { name: "test-package", version: "1.0.0" },
			modules: {},
			entities: {},
			readmes: {},
			assets: {},
		};

		// Directory doesn't exist yet
		await generateStaticSite(mockGraph, tempDir);

		// Verify directory was created and files exist
		const indexContent = await readFile(join(tempDir, "index.html"), "utf-8");
		assert.ok(indexContent.includes("test-package"));
	} finally {
		try {
			await rmdir(tempDir, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	}
});
