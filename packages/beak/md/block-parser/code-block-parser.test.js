import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { parseCodeBlock } from "./code-block-parser.js";

describe("Code Block Parser", () => {
	it("should parse simple code block", () => {
		const result = parseCodeBlock(["```", "const x = 1;", "```"], 0);
		assert.ok(result);
		assert.equal(result.node.type, NODE_TYPES.CODE_BLOCK);
		assert.equal(result.node.language, "");
		assert.equal(result.node.content, "const x = 1;");
		assert.equal(result.end, 3);
	});

	it("should parse code block with language", () => {
		const result = parseCodeBlock(["```js", "const x = 1;", "```"], 0);
		assert.ok(result);
		assert.equal(result.node.language, "js");
		assert.equal(result.node.content, "const x = 1;");
	});

	it("should parse code block without closing delimiter", () => {
		const result = parseCodeBlock(["```js", "const x = 1;"], 0);
		assert.ok(result);
		assert.equal(result.node.language, "js");
		assert.equal(result.node.content, "const x = 1;");
		assert.equal(result.end, 2);
	});

	it("should reject code block without content", () => {
		const result = parseCodeBlock(["```js"], 0);
		assert.equal(result, null);
	});

	it("should reject non-code block line", () => {
		const result = parseCodeBlock(["Not a code block"], 0);
		assert.equal(result, null);
	});

	it("should reject when start >= lines.length", () => {
		const result = parseCodeBlock(["```js"], 1);
		assert.equal(result, null);
	});
});
