import assert from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { parseInlineRecursive } from "./recursive-parser.js";

describe("core/md/inline-parser/recursive-parser.js", () => {
	it("should handle non-string input", () => {
		const result = parseInlineRecursive(123);
		assert.deepStrictEqual(result, [{ type: NODE_TYPES.TEXT, content: "123" }]);
	});

	it("should handle empty string", () => {
		const result = parseInlineRecursive("");
		assert.deepStrictEqual(result, []);
	});

	it("should parse plain text", () => {
		const result = parseInlineRecursive("Hello world");
		assert.deepStrictEqual(result, [
			{ type: NODE_TYPES.TEXT, content: "Hello world" },
		]);
	});

	it("should parse bold text", () => {
		const result = parseInlineRecursive("**bold**");
		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0].type, NODE_TYPES.BOLD);
	});

	it("should parse italic text", () => {
		const result = parseInlineRecursive("*italic*");
		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0].type, NODE_TYPES.ITALIC);
	});

	it("should parse inline code", () => {
		const result = parseInlineRecursive("`code`");
		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0].type, NODE_TYPES.CODE);
	});

	it("should parse links", () => {
		const result = parseInlineRecursive("[text](url)");
		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0].type, NODE_TYPES.LINK);
	});

	it("should parse images", () => {
		const result = parseInlineRecursive("![alt](url)");
		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0].type, NODE_TYPES.IMAGE);
	});

	it("should handle mixed content", () => {
		const result = parseInlineRecursive("Text **bold** and *italic*");
		assert(result.length > 1);
		assert(result.some((node) => node.type === NODE_TYPES.TEXT));
		assert(result.some((node) => node.type === NODE_TYPES.BOLD));
		assert(result.some((node) => node.type === NODE_TYPES.ITALIC));
	});

	it("should prevent infinite loops with bounded iterations", () => {
		// Test with a large input to ensure termination
		const longText = "a".repeat(1000);
		const result = parseInlineRecursive(longText);
		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0].type, NODE_TYPES.TEXT);
		assert.strictEqual(result[0].content, longText);
	});
});
