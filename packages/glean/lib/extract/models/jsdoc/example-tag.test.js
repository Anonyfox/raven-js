/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { JSDocExampleTag } from "./example-tag.js";

describe("JSDocExampleTag functionality", () => {
	it("should inherit from JSDocTagBase", () => {
		const tag = new JSDocExampleTag("test");
		assert.strictEqual(tag.tagType, "example");
		assert.strictEqual(tag.rawContent, "test");
	});

	it("should handle code only", () => {
		const testCases = [
			["console.log('hello')", "", "console.log('hello')"],
			["function test() { return 42; }", "", "function test() { return 42; }"],
			["const x = { a: 1, b: 2 };", "", "const x = { a: 1, b: 2 };"],
		];

		testCases.forEach(([input, expectedCaption, expectedCode]) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.caption, expectedCaption);
			assert.strictEqual(tag.code, expectedCode);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle caption with code", () => {
		const testCases = [
			["<caption>Basic usage</caption> console.log('hello')", "Basic usage", "console.log('hello')"],
			["<caption>Function example</caption> function test() { return 42; }", "Function example", "function test() { return 42; }"],
			["<caption>Object creation</caption> const obj = {};", "Object creation", "const obj = {};"],
		];

		testCases.forEach(([input, expectedCaption, expectedCode]) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.caption, expectedCaption);
			assert.strictEqual(tag.code, expectedCode);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle caption only", () => {
		const testCases = [
			["<caption>Just a description</caption>", "Just a description", ""],
			["<caption>No code follows</caption>   ", "No code follows", ""],
		];

		testCases.forEach(([input, expectedCaption, expectedCode]) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.caption, expectedCaption);
			assert.strictEqual(tag.code, expectedCode);
			assert.strictEqual(tag.isValidated, false); // No code = invalid
		});
	});

	it("should handle empty content", () => {
		const testCases = ["", "   ", "\t", "\n"];

		testCases.forEach((input) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.caption, "");
			assert.strictEqual(tag.code, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle undefined/null content", () => {
		const testCases = [undefined, null];

		testCases.forEach((input) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.caption, "");
			assert.strictEqual(tag.code, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle malformed caption tags", () => {
		const testCases = [
			["<caption>No closing console.log('test')", "", "<caption>No closing console.log('test')"],
			["No opening</caption> console.log('test')", "", "No opening</caption> console.log('test')"],
			["<Caption>Wrong case</Caption> console.log('test')", "", "<Caption>Wrong case</Caption> console.log('test')"],
			["<caption>Missing close tag code here", "", "<caption>Missing close tag code here"],
		];

		testCases.forEach(([input, expectedCaption, expectedCode]) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.caption, expectedCaption);
			assert.strictEqual(tag.code, expectedCode);
			assert.strictEqual(tag.isValidated, true); // Has code content
		});
	});

	it("should handle empty caption", () => {
		const testCases = [
			["<caption></caption> console.log('hello')", "", "console.log('hello')"],
			["<caption>   </caption> const x = 1;", "", "const x = 1;"],
		];

		testCases.forEach(([input, expectedCaption, expectedCode]) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.caption, expectedCaption);
			assert.strictEqual(tag.code, expectedCode);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle nested tags in caption", () => {
		const testCases = [
			["<caption>Use <code>func</code> here</caption> func()", "Use <code>func</code> here", "func()"],
			["<caption>See <em>documentation</em></caption> doSomething()", "See <em>documentation</em>", "doSomething()"],
		];

		testCases.forEach(([input, expectedCaption, expectedCode]) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.caption, expectedCaption);
			assert.strictEqual(tag.code, expectedCode);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle multiline code", () => {
		const input = `<caption>Complex function</caption> function example() {
	const x = 1;
	const y = 2;
	return x + y;
}`;
		const tag = new JSDocExampleTag(input);
		assert.strictEqual(tag.caption, "Complex function");
		assert.strictEqual(tag.code, `function example() {
	const x = 1;
	const y = 2;
	return x + y;
}`);
		assert.strictEqual(tag.isValidated, true);
	});

	it("should handle whitespace correctly", () => {
		const testCases = [
			["  <caption>  Test  </caption>  const x = 1;  ", "Test", "const x = 1;"],
			["\t<caption>\tSpaced\t</caption>\tcode()\t", "Spaced", "code()"],
			// Newlines in caption content don't match the regex pattern, content gets trimmed
			["\n<caption>\nNewlines\n</caption>\nfunc()\n", "", "<caption>\nNewlines\n</caption>\nfunc()"],
		];

		testCases.forEach(([input, expectedCaption, expectedCode]) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.caption, expectedCaption);
			assert.strictEqual(tag.code, expectedCode);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle Unicode content", () => {
		const testCases = [
			["<caption>测试用例</caption> console.log('你好')", "测试用例", "console.log('你好')"],
			["const π = 3.14159;", "", "const π = 3.14159;"],
			["<caption>Función ejemplo</caption> función()", "Función ejemplo", "función()"],
		];

		testCases.forEach(([input, expectedCaption, expectedCode]) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.caption, expectedCaption);
			assert.strictEqual(tag.code, expectedCode);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle complex code examples", () => {
		const testCases = [
			[
				"const api = { get: (url) => fetch(url), post: (url, data) => fetch(url, { method: 'POST', body: data }) };",
				"",
				"const api = { get: (url) => fetch(url), post: (url, data) => fetch(url, { method: 'POST', body: data }) };"
			],
			[
				"async function processData(items) { return await Promise.all(items.map(async item => await transform(item))); }",
				"",
				"async function processData(items) { return await Promise.all(items.map(async item => await transform(item))); }"
			],
		];

		testCases.forEach(([input, expectedCaption, expectedCode]) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.caption, expectedCaption);
			assert.strictEqual(tag.code, expectedCode);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle JSDoc in examples", () => {
		const input = `/**
 * @param {string} name
 * @returns {string}
 */
function greet(name) { return 'Hello ' + name; }`;
		const tag = new JSDocExampleTag(input);
		assert.strictEqual(tag.caption, "");
		assert.strictEqual(tag.code, input);
		assert.strictEqual(tag.isValidated, true);
	});

	it("should validate correctly based on code content", () => {
		const validCases = [
			"console.log('test')",
			"<caption>Example</caption> func()",
			"const x = 1;",
			"// Just a comment",
			" \t code() \t ", // Whitespace around code
		];

		const invalidCases = [
			"",
			"   ",
			"<caption>Only caption</caption>",
			"<caption>Another caption</caption>   ",
		];

		validCases.forEach((input) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.isValidated, true, `Should be valid: "${input}"`);
		});

		invalidCases.forEach((input) => {
			const tag = new JSDocExampleTag(input);
			assert.strictEqual(tag.isValidated, false, `Should be invalid: "${input}"`);
		});
	});
});
