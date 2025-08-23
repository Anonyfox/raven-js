/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Function analyzer tests - isolated module validation
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
	analyzeFunctionSource,
	extractTemplatePatterns,
	extractVariableDependencies,
} from "./function-analyzer.js";

describe("extractTemplatePatterns", () => {
	it("should extract simple template pattern", () => {
		const source = "html3`<div>${name}</div>`";
		const patterns = extractTemplatePatterns(source);

		assert.strictEqual(patterns.length, 1);
		assert.strictEqual(patterns[0].content, "<div>${name}</div>");
		assert.deepStrictEqual(patterns[0].parts, ["<div>", "</div>"]);
		assert.deepStrictEqual(patterns[0].expressions, ["name"]);
	});

	it("should extract multiple template patterns", () => {
		const source = "html3`<h1>${title}</h1>` + html3`<p>${content}</p>`";
		const patterns = extractTemplatePatterns(source);

		assert.strictEqual(patterns.length, 2);
		assert.strictEqual(patterns[0].content, "<h1>${title}</h1>");
		assert.strictEqual(patterns[1].content, "<p>${content}</p>");
	});

	it("should handle template with multiple expressions", () => {
		const source = "html3`<div>${name} is ${age} years old</div>`";
		const patterns = extractTemplatePatterns(source);

		assert.strictEqual(patterns.length, 1);
		assert.deepStrictEqual(patterns[0].parts, [
			"<div>",
			" is ",
			" years old</div>",
		]);
		assert.deepStrictEqual(patterns[0].expressions, ["name", "age"]);
	});

	it("should handle complex expressions with braces", () => {
		const source = 'html3`<div>${user.premium ? "premium" : "basic"}</div>`';
		const patterns = extractTemplatePatterns(source);

		assert.strictEqual(patterns.length, 1);
		assert.deepStrictEqual(patterns[0].expressions, [
			'user.premium ? "premium" : "basic"',
		]);
	});

	it("should handle templates with no expressions", () => {
		const source = "html3`<div>static content</div>`";
		const patterns = extractTemplatePatterns(source);

		assert.strictEqual(patterns.length, 1);
		assert.deepStrictEqual(patterns[0].parts, ["<div>static content</div>"]);
		assert.deepStrictEqual(patterns[0].expressions, []);
	});

	it("should ignore non-html3 templates", () => {
		const source = "`<div>${name}</div>` + html`<span>${age}</span>`";
		const patterns = extractTemplatePatterns(source);

		assert.strictEqual(patterns.length, 0);
	});
});

describe("analyzeFunctionSource", () => {
	it("should analyze simple function", () => {
		function testFunc(data) {
			return html3`<div>${data.name}</div>`;
		}

		const analysis = analyzeFunctionSource(testFunc);

		assert.strictEqual(analysis.name, "testFunc");
		assert.deepStrictEqual(analysis.parameters, ["data"]);
		assert.strictEqual(analysis.templates.length, 1);
		assert.strictEqual(analysis.hasArrayMethods, false);
		assert.strictEqual(analysis.isCompilable, true);
	});

	it("should analyze anonymous function", () => {
		const testFunc = (data) => html3`<div>${data.name}</div>`;

		const analysis = analyzeFunctionSource(testFunc);

		assert.strictEqual(analysis.name, "");
		assert.deepStrictEqual(analysis.parameters, ["data"]);
		assert.strictEqual(analysis.templates.length, 1);
	});

	it("should analyze arrow function", () => {
		const testFunc = (data) => html3`<div>${data.name}</div>`;

		const analysis = analyzeFunctionSource(testFunc);

		assert.strictEqual(analysis.name, "testFunc");
		assert.deepStrictEqual(analysis.parameters, ["data"]);
		assert.strictEqual(analysis.templates.length, 1);
	});

	it("should detect array methods", () => {
		function testFunc(data) {
			return data.items.map((item) => html3`<li>${item}</li>`);
		}

		const analysis = analyzeFunctionSource(testFunc);

		assert.strictEqual(analysis.hasArrayMethods, true);
		assert.strictEqual(analysis.templates.length, 1);
	});

	it("should identify non-compilable function", () => {
		function testFunc(data) {
			eval("const dynamic = 'test';");
			return html3`<div>${data.name}</div>`;
		}

		const analysis = analyzeFunctionSource(testFunc);

		assert.strictEqual(analysis.isCompilable, false);
	});

	it("should handle function with multiple parameters", () => {
		function testFunc(data, options, callback) {
			return html3`<div>${data.name}</div>`;
		}

		const analysis = analyzeFunctionSource(testFunc);

		assert.deepStrictEqual(analysis.parameters, [
			"data",
			"options",
			"callback",
		]);
	});

	it("should handle function with no parameters", () => {
		function testFunc() {
			return html3`<div>static</div>`;
		}

		const analysis = analyzeFunctionSource(testFunc);

		assert.deepStrictEqual(analysis.parameters, []);
		assert.strictEqual(analysis.templates.length, 1);
	});
});

describe("extractVariableDependencies", () => {
	it("should identify external dependencies", () => {
		const source =
			"function test(data) { return html3`<div>${data.name} - ${externalVar}</div>`; }";

		const dependencies = extractVariableDependencies(source, ["data"]);

		assert(dependencies.includes("externalVar"));
		assert(!dependencies.includes("data")); // Should exclude parameters
		assert(!dependencies.includes("html3")); // Should exclude known globals
	});

	it("should exclude built-in identifiers", () => {
		const source =
			"function test(data) { return html3`<div>${Math.max(data.count, Array.from([1,2,3]).length)}</div>`; }";

		const dependencies = extractVariableDependencies(source, ["data"]);

		assert(!dependencies.includes("Math"));
		assert(!dependencies.includes("Array"));
		assert(!dependencies.includes("html3"));
	});

	it("should exclude locally declared variables", () => {
		const source =
			"function test(data) { const localVar = data.name; let anotherVar = 'test'; return html3`<div>${localVar} ${anotherVar}</div>`; }";

		const dependencies = extractVariableDependencies(source, ["data"]);

		assert(!dependencies.includes("localVar"));
		assert(!dependencies.includes("anotherVar"));
		assert(!dependencies.includes("data"));
	});
});

describe("compilability analysis", () => {
	it("should mark functions with eval as non-compilable", () => {
		// Create a function string with eval to test detection
		const funcString = `function testFunc(data) {
			eval("const test = 'dynamic';");
			return html3\`<div>\${data.name}</div>\`;
		}`;

		// Create function from string to avoid linter errors
		// biome-ignore lint/security/noGlobalEval: Testing eval detection
		const testFunc = eval(`(${funcString})`);

		const analysis = analyzeFunctionSource(testFunc);
		assert.strictEqual(analysis.isCompilable, false);
	});

	it("should mark functions with new Function as non-compilable", () => {
		function testFunc(_data) {
			const _fn = new Function("return 42");
			return html3`<div>test</div>`;
		}

		const analysis = analyzeFunctionSource(testFunc);
		assert.strictEqual(analysis.isCompilable, false);
	});

	it("should mark functions with with statements as non-compilable", () => {
		// Create a function string with 'with' to test detection
		const funcString = `function testFunc(data) {
			with (data) {
				return html3\`<div>\${name}</div>\`;
			}
		}`;

		// Create function from string to avoid linter errors
		// biome-ignore lint/security/noGlobalEval: Testing with statement detection
		const testFunc = eval(`(${funcString})`);

		const analysis = analyzeFunctionSource(testFunc);
		assert.strictEqual(analysis.isCompilable, false);
	});

	it("should mark simple functions as compilable", () => {
		function testFunc(data) {
			const header = html3`<h1>${data.title}</h1>`;
			const content = html3`<p>${data.content}</p>`;
			return html3`<article>${header}${content}</article>`;
		}

		const analysis = analyzeFunctionSource(testFunc);
		assert.strictEqual(analysis.isCompilable, true);
	});
});
