/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for rendering module - brief validation of HTML generation.
 */

import { strict as assert } from "node:assert";
import { readFile, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
	generateEntityList,
	generateJSDocSection,
	generateReadmeSection,
	generateStaticSite,
} from "./rendering.js";

test("generateEntityList creates HTML grid", () => {
	const entities = [
		{
			id: "test/func1",
			name: "func1",
			type: "function",
			jsdoc: { description: "Test function" },
		},
		{ id: "test/func2", name: "func2", type: "class", jsdoc: null },
	];

	const html = generateEntityList(entities);

	assert.ok(html.includes("entity-grid"));
	assert.ok(html.includes("func1"));
	assert.ok(html.includes("func2"));
	assert.ok(html.includes("Test function"));
});

test("generateJSDocSection creates documentation HTML", () => {
	const jsdoc = {
		description: "Test description",
		tags: {
			param: [{ name: "input", type: "string", description: "Input param" }],
			returns: { type: "boolean", description: "Result" },
		},
	};

	const html = generateJSDocSection(jsdoc);

	assert.ok(html.includes("Test description"));
	assert.ok(html.includes("input"));
	assert.ok(html.includes("string"));
	assert.ok(html.includes("boolean"));
});

test("generateReadmeSection converts markdown", () => {
	const readmeData = {
		content: "# Title\n\n## Subtitle\n\nSome **bold** text with `code`.",
	};

	const html = generateReadmeSection(readmeData);

	assert.ok(html.includes("<h2>Title</h2>"));
	assert.ok(html.includes("<h3>Subtitle</h3>"));
	assert.ok(html.includes("<strong>bold</strong>"));
	assert.ok(html.includes("<code>code</code>"));
});

test("generateStaticSite creates complete documentation", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);

	try {
		const mockGraph = {
			package: { name: "test-package", version: "1.0.0", description: "Test" },
			modules: {
				"test-module": {
					path: "test.js",
					exports: ["testFunc"],
					imports: [],
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
			},
			readmes: {
				root: { content: "# Test Package\n\nTest content." },
			},
			assets: {},
		};

		await generateStaticSite(mockGraph, tempDir);

		// Verify files were created
		const indexContent = await readFile(join(tempDir, "index.html"), "utf-8");
		assert.ok(indexContent.includes("test-package"));
		assert.ok(indexContent.includes("Test Package"));

		const stylesContent = await readFile(
			join(tempDir, "assets", "styles.css"),
			"utf-8",
		);
		assert.ok(stylesContent.includes("font-family"));
	} finally {
		await rmdir(tempDir, { recursive: true });
	}
});
