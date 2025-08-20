/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for reconstructed rendering API - verifies identical public interface.
 */

import { strict as assert } from "node:assert";
import { readFile, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
	generateAssets,
	generateEntityDetails,
	generateEntityList,
	generateEntityPage,
	generateIndexPage,
	generateJSDocSection,
	generateModulePage,
	generateReadmeSection,
	generateStaticSite,
} from "./index.js";

test("reconstructed API exports all original functions", () => {
	// Verify all functions are exported and callable
	assert.ok(typeof generateStaticSite === "function");
	assert.ok(typeof generateIndexPage === "function");
	assert.ok(typeof generateModulePage === "function");
	assert.ok(typeof generateEntityPage === "function");
	assert.ok(typeof generateEntityList === "function");
	assert.ok(typeof generateEntityDetails === "function");
	assert.ok(typeof generateJSDocSection === "function");
	assert.ok(typeof generateReadmeSection === "function");
	assert.ok(typeof generateAssets === "function");
});

test("reconstructed API maintains identical behavior", async () => {
	const tempDir = join(tmpdir(), `api-reconstruction-${Date.now()}`);

	try {
		// Test complete workflow using public API
		const mockGraph = {
			package: {
				name: "api-test",
				version: "2.0.0",
				description: "API test package",
			},
			modules: {
				core: {
					path: "core.js",
					exports: ["main"],
					imports: [],
				},
			},
			entities: {
				"core/main": {
					id: "core/main",
					name: "main",
					type: "function",
					moduleId: "core",
					location: { file: "core.js", line: 10 },
					exports: ["default"],
					jsdoc: {
						description: "Main entry point",
						tags: {
							param: [
								{
									name: "config",
									type: "object",
									description: "Configuration",
								},
							],
							returns: {
								type: "Promise<void>",
								description: "Completion promise",
							},
						},
					},
					source: "async function main(config) { /* implementation */ }",
				},
			},
			readmes: {
				root: {
					content: "# API Test\n\nThis **tests** the `API` reconstruction.",
				},
			},
			assets: {},
		};

		// Test complete site generation
		await generateStaticSite(mockGraph, tempDir);

		// Verify all expected files created
		const indexContent = await readFile(join(tempDir, "index.html"), "utf-8");
		const moduleContent = await readFile(
			join(tempDir, "modules", "core.html"),
			"utf-8",
		);
		const entityContent = await readFile(
			join(tempDir, "entities", "core-main.html"),
			"utf-8",
		);
		const cssContent = await readFile(
			join(tempDir, "assets", "styles.css"),
			"utf-8",
		);

		// Verify content matches expected behavior
		assert.ok(indexContent.includes("api-test"));
		assert.ok(indexContent.includes("API Test"));
		assert.ok(indexContent.includes("tests"));
		assert.ok(indexContent.includes("<strong>tests</strong>"));

		assert.ok(moduleContent.includes("core"));
		assert.ok(moduleContent.includes("main"));

		assert.ok(entityContent.includes("main"));
		assert.ok(entityContent.includes("Main entry point"));
		assert.ok(entityContent.includes("config"));
		assert.ok(entityContent.includes("object"));
		assert.ok(entityContent.includes("Promise"));

		assert.ok(cssContent.includes("/* Glean Documentation Styles */"));

		// Test individual function outputs match expected format
		const entityList = generateEntityList([mockGraph.entities["core/main"]]);
		assert.ok(entityList.includes('class="entity-grid"'));
		assert.ok(entityList.includes("main"));

		const jsdocSection = generateJSDocSection(
			mockGraph.entities["core/main"].jsdoc,
		);
		assert.ok(jsdocSection.includes("Main entry point"));
		assert.ok(jsdocSection.includes("config"));
		assert.ok(jsdocSection.includes("Promise"));

		const readmeSection = generateReadmeSection(mockGraph.readmes.root);
		assert.ok(readmeSection.includes("<h2>API Test</h2>"));
		assert.ok(readmeSection.includes("<strong>tests</strong>"));
		assert.ok(readmeSection.includes("<code>API</code>"));
	} finally {
		try {
			await rmdir(tempDir, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	}
});

test("individual exported functions maintain original signatures", async () => {
	const tempDir = join(tmpdir(), `signatures-test-${Date.now()}`);

	try {
		// Test that each function can be called independently with correct signatures
		const mockGraph = {
			package: { name: "test", version: "1.0.0" },
			modules: { test: { path: "test.js", exports: [], imports: [] } },
			entities: {},
			readmes: {},
		};

		// Test individual page generation functions
		await generateIndexPage(mockGraph, tempDir);
		await generateModulePage(
			mockGraph,
			"test",
			mockGraph.modules.test,
			tempDir,
		);

		const mockEntity = {
			id: "test/func",
			name: "func",
			type: "function",
			moduleId: "test",
			location: { file: "test.js", line: 1 },
			exports: [],
			jsdoc: null,
			source: "function func() {}",
		};
		await generateEntityPage(mockGraph, "test/func", mockEntity, tempDir);

		// Test asset generation
		await generateAssets(tempDir);

		// Verify all files created successfully
		assert.ok(await readFile(join(tempDir, "index.html"), "utf-8"));
		assert.ok(await readFile(join(tempDir, "modules", "test.html"), "utf-8"));
		assert.ok(
			await readFile(join(tempDir, "entities", "test-func.html"), "utf-8"),
		);
		assert.ok(await readFile(join(tempDir, "assets", "styles.css"), "utf-8"));
	} finally {
		try {
			await rmdir(tempDir, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	}
});
