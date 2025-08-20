/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for content rendering module - HTML generation functions.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
	generateEntityDetails,
	generateEntityList,
	generateJSDocSection,
	generateReadmeSection,
} from "./content-rendering.js";

test("generateEntityList creates HTML grid with multiple entities", () => {
	const entities = [
		{
			id: "test/func1",
			name: "func1",
			type: "function",
			jsdoc: { description: "Test function" },
		},
		{
			id: "test/func2",
			name: "func2",
			type: "class",
			jsdoc: null,
		},
		{
			id: "module/complex-name",
			name: "complexName",
			type: "variable",
			jsdoc: { description: "Variable with description" },
		},
	];

	const html = generateEntityList(entities);

	// Verify grid structure
	assert.ok(html.includes('class="entity-grid"'));
	assert.ok(html.includes('class="entity-card"'));

	// Verify all entities present
	assert.ok(html.includes("func1"));
	assert.ok(html.includes("func2"));
	assert.ok(html.includes("complexName"));

	// Verify types
	assert.ok(html.includes("function"));
	assert.ok(html.includes("class"));
	assert.ok(html.includes("variable"));

	// Verify descriptions (conditional rendering)
	assert.ok(html.includes("Test function"));
	assert.ok(html.includes("Variable with description"));

	// Verify ID slug conversion
	assert.ok(html.includes("test-func1.html"));
	assert.ok(html.includes("module-complex-name.html"));
});

test("generateEntityList handles empty entities array", () => {
	const html = generateEntityList([]);

	assert.ok(html.includes('class="entity-grid"'));
	assert.ok(!html.includes('class="entity-card"'));
});

test("generateEntityDetails renders complete entity information", () => {
	const entityData = {
		location: { file: "test.js", line: 42 },
		exports: ["named", "default"],
		jsdoc: {
			description: "Test entity description",
			tags: {
				param: [{ name: "input", type: "string", description: "Input param" }],
				returns: { type: "boolean", description: "Success result" },
			},
		},
		source: "function test() { return true; }",
	};

	const html = generateEntityDetails(entityData);

	// Verify meta information
	assert.ok(html.includes("test.js"));
	assert.ok(html.includes("42"));
	assert.ok(html.includes("named, default"));

	// Verify JSDoc section included
	assert.ok(html.includes("Test entity description"));
	assert.ok(html.includes("input"));
	assert.ok(html.includes("string"));
	assert.ok(html.includes("boolean"));

	// Verify source code section
	assert.ok(html.includes("Source Code"));
	assert.ok(html.includes("function test() { return true; }"));
});

test("generateEntityDetails handles entity without JSDoc", () => {
	const entityData = {
		location: { file: "simple.js", line: 1 },
		exports: [],
		jsdoc: null,
		source: "const x = 1;",
	};

	const html = generateEntityDetails(entityData);

	// Verify meta information
	assert.ok(html.includes("simple.js"));
	assert.ok(html.includes("1"));

	// Verify no export line when empty
	assert.ok(!html.includes("<strong>Export:</strong>"));

	// Verify source still included
	assert.ok(html.includes("const x = 1;"));

	// Verify no JSDoc section
	assert.ok(!html.includes('class="jsdoc"'));
});

test("generateJSDocSection renders complete documentation", () => {
	const jsdoc = {
		description: "Comprehensive function documentation",
		tags: {
			param: [
				{ name: "first", type: "string", description: "First parameter" },
				{ name: "second", type: "number", description: "Second parameter" },
				{ name: "third", type: "boolean", description: "" }, // No description
			],
			returns: { type: "Promise<void>", description: "Async completion" },
		},
	};

	const html = generateJSDocSection(jsdoc);

	// Verify description
	assert.ok(html.includes("Comprehensive function documentation"));

	// Verify parameters section
	assert.ok(html.includes("Parameters"));
	assert.ok(html.includes("first"));
	assert.ok(html.includes("string"));
	assert.ok(html.includes("First parameter"));
	assert.ok(html.includes("second"));
	assert.ok(html.includes("number"));
	assert.ok(html.includes("third"));
	assert.ok(html.includes("boolean"));

	// Verify returns section
	assert.ok(html.includes("Returns"));
	assert.ok(html.includes("Promise<void>"));
	assert.ok(html.includes("Async completion"));
});

test("generateJSDocSection handles minimal JSDoc data", () => {
	const jsdoc = {
		description: "Simple description",
		tags: {},
	};

	const html = generateJSDocSection(jsdoc);

	// Verify description included
	assert.ok(html.includes("Simple description"));

	// Verify no parameters or returns sections
	assert.ok(!html.includes("Parameters"));
	assert.ok(!html.includes("Returns"));
});

test("generateJSDocSection handles JSDoc without description", () => {
	const jsdoc = {
		description: null,
		tags: {
			returns: { type: "void", description: "Nothing returned" },
		},
	};

	const html = generateJSDocSection(jsdoc);

	// Verify returns section included
	assert.ok(html.includes("Returns"));
	assert.ok(html.includes("void"));

	// Verify no description paragraph
	assert.ok(!html.includes('class="description"'));
});

test("generateReadmeSection converts markdown to HTML", () => {
	const readmeData = {
		content: `# Main Title

## Secondary Title

### Third Level

Some **bold text** and *italic text* with \`inline code\`.

Multiple paragraphs with proper spacing.

More content here.`,
	};

	const html = generateReadmeSection(readmeData);

	// Verify section structure
	assert.ok(html.includes('class="readme"'));
	assert.ok(html.includes("<h2>README</h2>"));

	// Verify markdown conversion
	assert.ok(html.includes("<h2>Main Title</h2>"));
	assert.ok(html.includes("<h3>Secondary Title</h3>"));
	assert.ok(html.includes("<h4>Third Level</h4>"));
	assert.ok(html.includes("<strong>bold text</strong>"));
	assert.ok(html.includes("<em>italic text</em>"));
	assert.ok(html.includes("<code>inline code</code>"));

	// Verify paragraph handling
	assert.ok(html.includes("<p>"));
	assert.ok(html.includes("Multiple paragraphs"));
	assert.ok(html.includes("More content"));
});

test("generateReadmeSection handles simple markdown", () => {
	const readmeData = {
		content: "Simple text without formatting.",
	};

	const html = generateReadmeSection(readmeData);

	assert.ok(html.includes('class="readme"'));
	assert.ok(html.includes("Simple text without formatting."));
});
