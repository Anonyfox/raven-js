/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Test suite for md module index exports
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { code, markdownToHTML, md, ref, table } from "./index.js";

test("index.js exports all expected functions", () => {
	assert.equal(typeof md, "function");
	assert.equal(typeof markdownToHTML, "function");
	assert.equal(typeof ref, "function");
	assert.equal(typeof code, "function");
	assert.equal(typeof table, "function");
});

test("md() tagged template works", () => {
	const result = md`# Hello World`;
	assert.equal(result, "# Hello World\n");
});

test("markdownToHTML() converts markdown to HTML", () => {
	const result = markdownToHTML("# Hello World");
	assert.equal(result, "<h1>Hello World</h1>");
});

test("ref() creates reference link objects", () => {
	const link = ref("Test", "test");
	assert.deepEqual(link, { type: "reference", text: "Test", ref: "test" });
});

test("code() creates code block objects", () => {
	const codeBlock = code("console.log('test')", "javascript");
	assert.deepEqual(codeBlock, {
		type: "code",
		code: "console.log('test')",
		language: "javascript",
	});
});

test("table() creates table objects", () => {
	const tableObj = table(
		["A", "B"],
		[
			["1", "2"],
			["3", "4"],
		],
	);
	assert.deepEqual(tableObj, {
		type: "table",
		headers: ["A", "B"],
		rows: [
			["1", "2"],
			["3", "4"],
		],
	});
});

test("integration: md() with helpers", () => {
	const testCode = code("npm install", "bash");
	const testRef = ref("docs", "documentation");

	const result = md`# Installation

${testCode}

See ${testRef} for more info.`;

	assert.ok(result.includes("# Installation"));
	assert.ok(result.includes("```bash"));
	assert.ok(result.includes("npm install"));
	assert.ok(result.includes("[docs][documentation]"));
});
