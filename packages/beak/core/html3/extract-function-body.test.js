/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for function body extraction module
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { extractFunctionBody } from "./extract-function-body.js";

describe("extractFunctionBody", () => {
	describe("regular functions", () => {
		it("should extract body from regular function", () => {
			function testFn() {
				return "hello world";
			}

			const result = extractFunctionBody(testFn);
			assert.strictEqual(result, 'return "hello world";');
		});

		it("should extract body from function with multiple statements", () => {
			function testFn() {
				const x = 42;
				const y = x * 2;
				return y;
			}

			const result = extractFunctionBody(testFn);
			// Check content exists, tolerating whitespace differences
			assert.ok(result.includes("const x = 42;"));
			assert.ok(result.includes("const y = x * 2;"));
			assert.ok(result.includes("return y;"));
		});

		it("should extract body from function with parameters", () => {
			function testFn(a, b, c) {
				return a + b + c;
			}

			const result = extractFunctionBody(testFn);
			assert.strictEqual(result, "return a + b + c;");
		});

		it("should handle empty function body", () => {
			function testFn() {}

			const result = extractFunctionBody(testFn);
			assert.strictEqual(result, "");
		});
	});

	describe("arrow functions", () => {
		it("should extract body from arrow function with braces", () => {
			const testFn = () => {
				return "arrow test";
			};

			const result = extractFunctionBody(testFn);
			assert.strictEqual(result, 'return "arrow test";');
		});

		it("should handle single expression arrow function", () => {
			const testFn = () => "single expression";

			const result = extractFunctionBody(testFn);
			assert.strictEqual(result, 'return "single expression"');
		});

		it("should handle arrow function with parameters", () => {
			const testFn = (x, y) => x * y;

			const result = extractFunctionBody(testFn);
			assert.strictEqual(result, "return x * y");
		});

		it("should handle arrow function with single parameter", () => {
			const testFn = (x) => x * 2;

			const result = extractFunctionBody(testFn);
			assert.strictEqual(result, "return x * 2");
		});

		it("should handle complex single expression", () => {
			const testFn = (data) => data.map((item) => item.value).filter(Boolean);

			const result = extractFunctionBody(testFn);
			assert.strictEqual(
				result,
				"return data.map(item => item.value).filter(Boolean)",
			);
		});
	});

	describe("async functions", () => {
		it("should extract body from async function", () => {
			async function testFn() {
				return await Promise.resolve("async");
			}

			const result = extractFunctionBody(testFn);
			assert.strictEqual(result, 'return await Promise.resolve("async");');
		});

		it("should extract body from async arrow function", () => {
			const testFn = async () => {
				const result = await fetch("/api");
				return result.json();
			};

			const body = extractFunctionBody(testFn);
			assert.ok(body.includes("await fetch"));
			assert.ok(body.includes("return result.json()"));
		});

		it("should handle async arrow function single expression", () => {
			const testFn = async (url) => await fetch(url);

			const result = extractFunctionBody(testFn);
			assert.strictEqual(result, "return await fetch(url)");
		});
	});

	describe("generator functions", () => {
		it("should extract body from generator function", () => {
			function* testFn() {
				yield 1;
				yield 2;
				return 3;
			}

			const result = extractFunctionBody(testFn);
			assert.ok(result.includes("yield 1"));
			assert.ok(result.includes("yield 2"));
			assert.ok(result.includes("return 3"));
		});
	});

	describe("method functions", () => {
		it("should extract body from object method", () => {
			const obj = {
				testMethod() {
					return "method result";
				},
			};

			const result = extractFunctionBody(obj.testMethod);
			assert.strictEqual(result, 'return "method result";');
		});

		it("should extract body from class method", () => {
			class TestClass {
				testMethod() {
					return "class method";
				}
			}

			const instance = new TestClass();
			const result = extractFunctionBody(instance.testMethod);
			assert.strictEqual(result, 'return "class method";');
		});
	});

	describe("nested braces handling", () => {
		it("should handle nested objects in function body", () => {
			function testFn() {
				const obj = { a: 1, b: { c: 2 } };
				return obj;
			}

			const result = extractFunctionBody(testFn);
			assert.ok(result.includes("{ a: 1, b: { c: 2 } }"));
		});

		it("should handle nested functions", () => {
			function testFn() {
				function inner() {
					return "inner";
				}
				return inner();
			}

			const result = extractFunctionBody(testFn);
			assert.ok(result.includes("function inner()"));
			assert.ok(result.includes('return "inner"'));
			assert.ok(result.includes("return inner()"));
		});

		it("should handle arrow functions in body", () => {
			function testFn() {
				const mapped = [1, 2, 3].map((x) => x * 2);
				return mapped;
			}

			const result = extractFunctionBody(testFn);
			assert.ok(result.includes("x => x * 2"));
		});
	});

	describe("edge cases", () => {
		it("should return empty string for non-function input", () => {
			assert.strictEqual(extractFunctionBody(null), "");
			assert.strictEqual(extractFunctionBody(undefined), "");
			assert.strictEqual(extractFunctionBody("string"), "");
			assert.strictEqual(extractFunctionBody(123), "");
			assert.strictEqual(extractFunctionBody({}), "");
		});

		it("should handle functions with comments", () => {
			function testFn() {
				// This is a comment
				/* Block comment */
				return "with comments";
			}

			const result = extractFunctionBody(testFn);
			assert.ok(result.includes("// This is a comment"));
			assert.ok(result.includes("/* Block comment */"));
			assert.ok(result.includes('return "with comments"'));
		});

		it("should handle functions with string literals containing braces", () => {
			function testFn() {
				const str = "This {has} {braces} in it";
				return str;
			}

			const result = extractFunctionBody(testFn);
			assert.ok(result.includes('"This {has} {braces} in it"'));
		});

		it("should handle malformed function gracefully", () => {
			// Create a function with modified toString
			const fn = () => "test";
			fn.toString = () => "invalid function string";

			const result = extractFunctionBody(fn);
			assert.strictEqual(result, "");
		});
	});

	describe("template function scenarios", () => {
		it("should extract body from tagged template function", () => {
			function templateFn(strings, ...values) {
				return strings.reduce((result, str, i) => {
					return result + str + (values[i] || "");
				}, "");
			}

			const result = extractFunctionBody(templateFn);
			assert.ok(result.includes("strings.reduce"));
			assert.ok(result.includes("values[i]"));
		});

		it("should extract body from template function with complex logic", () => {
			function htmlTemplate(strings, ...values) {
				const processedValues = values.map((v) => {
					if (typeof v === "string") {
						return escapeHtml(v);
					}
					return String(v);
				});

				return strings.reduce((html, str, i) => {
					return html + str + (processedValues[i] || "");
				}, "");
			}

			const result = extractFunctionBody(htmlTemplate);
			assert.ok(result.includes("processedValues"));
			assert.ok(result.includes("escapeHtml"));
			assert.ok(result.includes("strings.reduce"));
		});
	});
});
