/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for page generation module - complete HTML page creation.
 */

import { strict as assert } from "node:assert";
import { readFile, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
	generateEntityPage,
	generateIndexPage,
	generateModulePage,
} from "./page-generation.js";

test("generateIndexPage creates complete index HTML file", async () => {
	const tempDir = join(tmpdir(), `page-gen-index-${Date.now()}`);

	try {
		const mockGraph = {
			package: {
				name: "test-package",
				version: "1.2.3",
				description: "Test package description",
			},
			modules: {
				module1: { path: "mod1.js" },
				module2: { path: "mod2.js" },
			},
			entities: {
				entity1: { name: "func1" },
				entity2: { name: "func2" },
				entity3: { name: "class1" },
			},
			readmes: {
				root: { content: "# Test Package\n\nThis is a test." },
			},
		};

		await generateIndexPage(mockGraph, tempDir);

		const content = await readFile(join(tempDir, "index.html"), "utf-8");

		// Verify HTML structure
		assert.ok(content.includes("<!DOCTYPE html>"));
		assert.ok(content.includes('<html lang="en">'));
		assert.ok(content.includes("test-package Documentation"));

		// Verify header content
		assert.ok(content.includes("test-package"));
		assert.ok(content.includes("v1.2.3"));
		assert.ok(content.includes("Test package description"));

		// Verify module navigation
		assert.ok(content.includes("module1"));
		assert.ok(content.includes("module2"));
		assert.ok(content.includes("./modules/module1.html"));
		assert.ok(content.includes("./modules/module2.html"));

		// Verify stats
		assert.ok(content.includes("2")); // 2 modules
		assert.ok(content.includes("3")); // 3 entities
		assert.ok(content.includes("1")); // 1 README

		// Verify README section
		assert.ok(content.includes("Test Package"));
		assert.ok(content.includes("This is a test."));

		// Verify CSS link
		assert.ok(content.includes("./assets/styles.css"));
	} finally {
		try {
			await rmdir(tempDir, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	}
});

test("generateIndexPage handles package without description or README", async () => {
	const tempDir = join(tmpdir(), `page-gen-minimal-${Date.now()}`);

	try {
		const mockGraph = {
			package: { name: "minimal-package", version: "0.1.0" }, // No description
			modules: { single: { path: "single.js" } },
			entities: {},
			readmes: {}, // No root README
		};

		await generateIndexPage(mockGraph, tempDir);

		const content = await readFile(join(tempDir, "index.html"), "utf-8");

		// Verify basic structure still works
		assert.ok(content.includes("minimal-package"));
		assert.ok(content.includes("v0.1.0"));

		// Verify no description paragraph (conditional rendering)
		assert.ok(!content.includes('class="description"'));

		// Verify stats work with zero entities
		assert.ok(content.includes("1")); // 1 module
		assert.ok(content.includes("0")); // 0 entities
		assert.ok(content.includes("0")); // 0 READMEs

		// Verify no README section
		assert.ok(!content.includes('class="readme"'));
	} finally {
		try {
			await rmdir(tempDir, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	}
});

test("generateModulePage creates complete module HTML file", async () => {
	const tempDir = join(tmpdir(), `page-gen-module-${Date.now()}`);

	try {
		const mockGraph = {
			package: { name: "test-package", version: "1.0.0" },
			entities: {
				"test-module/func1": {
					id: "test-module/func1",
					name: "func1",
					type: "function",
					moduleId: "test-module",
					jsdoc: { description: "Function 1" },
				},
				"test-module/func2": {
					id: "test-module/func2",
					name: "func2",
					type: "class",
					moduleId: "test-module",
					jsdoc: null,
				},
				"other-module/func3": {
					id: "other-module/func3",
					name: "func3",
					type: "variable",
					moduleId: "other-module",
				},
			},
		};

		const moduleData = {
			path: "src/test-module.js",
			exports: ["func1", "func2"],
			imports: ["dep1", "dep2", "dep3"],
		};

		await generateModulePage(mockGraph, "test-module", moduleData, tempDir);

		const content = await readFile(
			join(tempDir, "modules", "test-module.html"),
			"utf-8",
		);

		// Verify HTML structure
		assert.ok(content.includes("test-module - test-package"));
		assert.ok(content.includes("../assets/styles.css"));

		// Verify header and navigation
		assert.ok(content.includes("test-package"));
		assert.ok(content.includes("test-module"));
		assert.ok(content.includes("../index.html"));

		// Verify module information
		assert.ok(content.includes("src/test-module.js"));
		assert.ok(content.includes("func1, func2"));
		assert.ok(content.includes("3 dependencies"));

		// Verify entities (should only include entities from this module)
		assert.ok(content.includes("func1"));
		assert.ok(content.includes("func2"));
		assert.ok(!content.includes("func3")); // Different module
		assert.ok(content.includes("Function 1"));
	} finally {
		try {
			await rmdir(tempDir, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	}
});

test("generateModulePage handles module with no exports or imports", async () => {
	const tempDir = join(tmpdir(), `page-gen-empty-module-${Date.now()}`);

	try {
		const mockGraph = {
			package: { name: "test-package", version: "1.0.0" },
			entities: {},
		};

		const moduleData = {
			path: "empty.js",
			exports: [],
			imports: [],
		};

		await generateModulePage(mockGraph, "empty-module", moduleData, tempDir);

		const content = await readFile(
			join(tempDir, "modules", "empty-module.html"),
			"utf-8",
		);

		// Verify module path still shown
		assert.ok(content.includes("empty.js"));

		// Verify no exports or imports lines (conditional rendering)
		assert.ok(!content.includes("<strong>Exports:</strong>"));
		assert.ok(!content.includes("<strong>Imports:</strong>"));

		// Verify no entities message
		assert.ok(content.includes("No documented entities found."));
	} finally {
		try {
			await rmdir(tempDir, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	}
});

test("generateEntityPage creates complete entity HTML file", async () => {
	const tempDir = join(tmpdir(), `page-gen-entity-${Date.now()}`);

	try {
		const mockGraph = {
			package: { name: "test-package", version: "1.0.0" },
		};

		const entityData = {
			name: "testFunction",
			type: "function",
			moduleId: "test-module",
			location: { file: "test.js", line: 42 },
			exports: ["named"],
			jsdoc: {
				description: "Test function description",
				tags: {
					param: [
						{ name: "input", type: "string", description: "Input value" },
					],
					returns: { type: "boolean", description: "Success flag" },
				},
			},
			source: "function testFunction(input) { return true; }",
		};

		await generateEntityPage(
			mockGraph,
			"test-module/testFunction",
			entityData,
			tempDir,
		);

		const content = await readFile(
			join(tempDir, "entities", "test-module-testFunction.html"),
			"utf-8",
		);

		// Verify HTML structure
		assert.ok(content.includes("testFunction - test-package"));
		assert.ok(content.includes("../assets/styles.css"));

		// Verify header content
		assert.ok(content.includes("testFunction"));
		assert.ok(content.includes("function"));
		assert.ok(content.includes('class="entity-type"'));

		// Verify navigation links
		assert.ok(content.includes("../index.html"));
		assert.ok(content.includes("../modules/test-module.html"));

		// Verify entity details are included
		assert.ok(content.includes("test.js"));
		assert.ok(content.includes("42"));
		assert.ok(content.includes("Test function description"));
		assert.ok(content.includes("function testFunction"));
	} finally {
		try {
			await rmdir(tempDir, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	}
});

test("generateEntityPage handles complex module ID with slashes", async () => {
	const tempDir = join(tmpdir(), `page-gen-complex-${Date.now()}`);

	try {
		const mockGraph = {
			package: { name: "test-package", version: "1.0.0" },
		};

		const entityData = {
			name: "complexEntity",
			type: "class",
			moduleId: "nested/deep/module",
			location: { file: "nested/deep/module.js", line: 1 },
			exports: [],
			jsdoc: null,
			source: "class complexEntity {}",
		};

		await generateEntityPage(
			mockGraph,
			"nested/deep/module/complexEntity",
			entityData,
			tempDir,
		);

		const content = await readFile(
			join(tempDir, "entities", "nested-deep-module-complexEntity.html"),
			"utf-8",
		);

		// Verify file created with slug conversion
		assert.ok(content.includes("complexEntity"));

		// Verify module link uses slug conversion
		assert.ok(content.includes("../modules/nested-deep-module.html"));
	} finally {
		try {
			await rmdir(tempDir, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	}
});
