/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Test suite for markdown tagged template literal
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { code, md, ref, table } from "./md.js";

test("md() - basic string concatenation", () => {
	const result = md`Hello World`;
	assert.equal(result, "Hello World");
});

test("md() - simple interpolation", () => {
	const name = "RavenJS";
	const result = md`# ${name}`;
	assert.equal(result, "# RavenJS\n");
});

test("md() - multiple interpolations", () => {
	const title = "Getting Started";
	const content = "This is the content.";
	const result = md`# ${title}

${content}`;
	assert.equal(result, "# Getting Started\n\nThis is the content.\n");
});

test("md() - array joining with default context", () => {
	const items = ["First", "Second", "Third"];
	const result = md`${items}`;
	assert.equal(result, "First\n\nSecond\n\nThird\n");
});

test("md() - array joining in list context", () => {
	const items = ["Item 1", "Item 2", "Item 3"];
	const result = md`
- ${items.map((item) => `${item}\n- `)}`;
	assert.ok(result.includes("Item 1"));
	assert.ok(result.includes("Item 2"));
	assert.ok(result.includes("Item 3"));
});

test("md() - whitespace normalization", () => {
	const result = md`


Too many blank lines


Should be normalized


`;
	// Should remove excessive blank lines and normalize
	assert.ok(!result.includes("\n\n\n"));
	assert.ok(result.trim() === "Too many blank lines\n\nShould be normalized");
});

test("md() - object to definition list", () => {
	const config = {
		name: "RavenJS",
		version: "1.0.0",
		type: "toolkit",
	};
	const result = md`${config}`;
	assert.ok(result.includes("**name**: RavenJS"));
	assert.ok(result.includes("**version**: 1.0.0"));
	assert.ok(result.includes("**type**: toolkit"));
});

test("md() - nested md() calls", () => {
	const title = "Features";
	const features = ["Fast", "Lean", "Clean"];
	const section = md`## ${title}

${features.map((f) => md`- ${f}`)}`;

	assert.ok(section.includes("## Features"));
	assert.ok(section.includes("- Fast"));
	assert.ok(section.includes("- Lean"));
	assert.ok(section.includes("- Clean"));
});

test("md() - boolean and null handling", () => {
	const result = md`${true} ${false} ${null} ${undefined}`;
	assert.equal(result, "true");
});

test("md() - number interpolation", () => {
	const count = 42;
	const pi = Math.PI;
	const result = md`Count: ${count}, Pi: ${pi.toFixed(5)}`;
	assert.equal(result, "Count: 42, Pi: 3.14159");
});

test("ref() - reference link creation", () => {
	const link = ref("Documentation", "docs");
	const result = md`Check out the ${link}`;
	assert.equal(result, "Check out the [Documentation][docs]");
});

test("code() - code block creation", () => {
	const codeBlock = code('console.log("Hello");', "javascript");
	const result = md`Example:

${codeBlock}`;
	assert.ok(result.includes("```javascript"));
	assert.ok(result.includes('console.log("Hello");'));
	assert.ok(result.includes("```"));
});

test("code() - code block without language", () => {
	const codeBlock = code('echo "test"');
	const result = md`${codeBlock}`;
	assert.ok(result.includes('```\necho "test"\n```'));
});

test("table() - table creation", () => {
	const headers = ["Name", "Age", "City"];
	const rows = [
		["Alice", "25", "New York"],
		["Bob", "30", "London"],
	];
	const tableObj = table(headers, rows);
	const result = md`${tableObj}`;

	assert.ok(result.includes("| Name | Age | City |"));
	assert.ok(result.includes("| --- | --- | --- |"));
	assert.ok(result.includes("| Alice | 25 | New York |"));
	assert.ok(result.includes("| Bob | 30 | London |"));
});

test("md() - complex document composition", () => {
	const title = "RavenJS Toolkit";
	const description = "A swift web development toolkit";
	const features = ["Zero dependencies", "ESM-only", "Performance focused"];
	const quickStart = code(
		`import { html } from '@raven-js/beak';
const page = html\`<h1>Hello World</h1>\`;`,
		"javascript",
	);

	const document = md`# ${title}

${description}

## Features

${features.map((feature) => md`- ${feature}`)}

## Quick Start

${quickStart}

For more information, see the ${ref("documentation", "docs")}.`;

	assert.ok(document.includes("# RavenJS Toolkit"));
	assert.ok(document.includes("A swift web development toolkit"));
	assert.ok(document.includes("- Zero dependencies"));
	assert.ok(document.includes("- ESM-only"));
	assert.ok(document.includes("- Performance focused"));
	assert.ok(document.includes("```javascript"));
	assert.ok(document.includes("import { html }"));
	assert.ok(document.includes("[documentation][docs]"));
});

test("md() - template caching", () => {
	const result1 = md`Hello ${"World"}`;
	const result2 = md`Hello ${"RavenJS"}`;

	// Same template structure should use cached function
	assert.equal(result1, "Hello World");
	assert.equal(result2, "Hello RavenJS");
});

test("md() - empty arrays and objects", () => {
	const emptyArray = [];
	const emptyObject = {};
	const result = md`Array: ${emptyArray}, Object: ${emptyObject}`;
	assert.equal(result, "Array: , Object:");
});

test("md() - context detection for lists", () => {
	const items = ["First", "Second"];
	const result = md`
- Item: ${items[0]}
- Item: ${items[1]}`;

	assert.ok(result.includes("- Item: First"));
	assert.ok(result.includes("- Item: Second"));
});

test("md() - special object types", () => {
	// Test that objects without special type property are handled as definition lists
	const plainObject = { key: "value", number: 42 };
	const result = md`${plainObject}`;
	assert.ok(result.includes("**key**: value"));
	assert.ok(result.includes("**number**: 42"));
});

test("md() - mixed content types", () => {
	const mixed = [
		"Plain text",
		{ name: "Object item", value: 123 },
		code("console.log()", "js"),
		42,
		ref("Link", "ref1"),
	];

	const result = md`${mixed}`;
	assert.ok(result.includes("Plain text"));
	assert.ok(result.includes("**name**: Object item"));
	assert.ok(result.includes("```js"));
	assert.ok(result.includes("42"));
	assert.ok(result.includes("[Link][ref1]"));
});

test("md() - static template optimization", () => {
	// Static templates should be optimized (no interpolation)
	const result = md`# Static Title

This is static content.`;

	assert.equal(result, "# Static Title\n\nThis is static content.\n");
});
