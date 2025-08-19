/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { parseIndentedCodeBlock } from "./indented-code-block-parser.js";

describe("Indented Code Block Parser", () => {
	it("should parse simple indented code block with 4 spaces", () => {
		const lines = [
			"    function hello() {",
			"        console.log('Hello!');",
			"    }",
		];
		const result = parseIndentedCodeBlock(lines, 0);

		assert.ok(result);
		assert.equal(result.node.type, NODE_TYPES.CODE_BLOCK);
		assert.equal(result.node.language, "");
		assert.equal(
			result.node.content,
			"function hello() {\n    console.log('Hello!');\n}",
		);
		assert.equal(result.start, 0);
		assert.equal(result.end, 3);
	});

	it("should parse indented code block with tabs", () => {
		const lines = ["\tconst x = 42;", "\tconsole.log(x);"];
		const result = parseIndentedCodeBlock(lines, 0);

		assert.ok(result);
		assert.equal(result.node.type, NODE_TYPES.CODE_BLOCK);
		assert.equal(result.node.content, "const x = 42;\nconsole.log(x);");
		assert.equal(result.end, 2);
	});

	it("should handle empty lines within code block", () => {
		const lines = [
			"    function test() {",
			"",
			"        return true;",
			"    }",
		];
		const result = parseIndentedCodeBlock(lines, 0);

		assert.ok(result);
		assert.equal(
			result.node.content,
			"function test() {\n\n    return true;\n}",
		);
	});

	it("should remove trailing empty lines", () => {
		const lines = ["    console.log('test');", "", "", "Not indented"];
		const result = parseIndentedCodeBlock(lines, 0);

		assert.ok(result);
		assert.equal(result.node.content, "console.log('test');");
		assert.equal(result.end, 3); // Stops at "Not indented"
	});

	it("should stop at non-indented line", () => {
		const lines = [
			"    indented line 1",
			"    indented line 2",
			"not indented",
			"    this won't be included",
		];
		const result = parseIndentedCodeBlock(lines, 0);

		assert.ok(result);
		assert.equal(result.node.content, "indented line 1\nindented line 2");
		assert.equal(result.end, 2);
	});

	it("should reject non-indented first line", () => {
		const lines = ["not indented", "    indented"];
		const result = parseIndentedCodeBlock(lines, 0);

		assert.equal(result, null);
	});

	it("should reject insufficient indentation (less than 4 spaces)", () => {
		const lines = ["   only 3 spaces", "   not enough"];
		const result = parseIndentedCodeBlock(lines, 0);

		assert.equal(result, null);
	});

	it("should handle mixed spaces and tabs correctly", () => {
		const lines = ["    four spaces", "\tone tab", "        eight spaces"];
		const result = parseIndentedCodeBlock(lines, 0);

		assert.ok(result);
		assert.equal(result.node.content, "four spaces\none tab\n    eight spaces");
	});

	it("should handle code block at end of document", () => {
		const lines = ["    final code block", "    last line"];
		const result = parseIndentedCodeBlock(lines, 0);

		assert.ok(result);
		assert.equal(result.node.content, "final code block\nlast line");
		assert.equal(result.end, 2);
	});

	it("should reject empty code block", () => {
		const lines = ["", ""];
		const result = parseIndentedCodeBlock(lines, 0);

		assert.equal(result, null);
	});

	it("should reject code block with only empty lines", () => {
		const lines = ["", "    ", "", "not indented"];
		const result = parseIndentedCodeBlock(lines, 0);

		assert.equal(result, null);
	});

	it("should parse from different start positions", () => {
		const lines = ["Regular paragraph", "    code line 1", "    code line 2"];
		const result = parseIndentedCodeBlock(lines, 1);

		assert.ok(result);
		assert.equal(result.node.content, "code line 1\ncode line 2");
		assert.equal(result.start, 1);
		assert.equal(result.end, 3);
	});

	it("should handle complex real-world example", () => {
		const lines = [
			"    def fibonacci(n):",
			"        if n <= 1:",
			"            return n",
			"        else:",
			"            return fibonacci(n-1) + fibonacci(n-2)",
			"",
			"    print(fibonacci(10))",
		];
		const result = parseIndentedCodeBlock(lines, 0);

		assert.ok(result);
		const expected =
			"def fibonacci(n):\n    if n <= 1:\n        return n\n    else:\n        return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))";
		assert.equal(result.node.content, expected);
	});
});
