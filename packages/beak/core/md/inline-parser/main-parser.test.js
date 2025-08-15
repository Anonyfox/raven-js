import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { parseInline } from "./main-parser.js";

describe("Main Inline Parser", () => {
	describe("basic functionality", () => {
		it("should handle empty string", () => {
			const result = parseInline("");
			assert.deepEqual(result, []);
		});

		it("should handle plain text", () => {
			const result = parseInline("Hello world");
			assert.deepEqual(result, [
				{ type: NODE_TYPES.TEXT, content: "Hello world" },
			]);
		});

		it("should handle non-string input", () => {
			const result = parseInline(123);
			assert.deepEqual(result, [{ type: NODE_TYPES.TEXT, content: "123" }]);
		});

		it("should handle null/undefined input", () => {
			const result1 = parseInline(null);
			assert.deepEqual(result1, [{ type: NODE_TYPES.TEXT, content: "null" }]);

			const result2 = parseInline(undefined);
			assert.deepEqual(result2, [
				{ type: NODE_TYPES.TEXT, content: "undefined" },
			]);
		});
	});

	describe("element parsing", () => {
		it("should parse bold text", () => {
			const result = parseInline("**bold**");
			assert.deepEqual(result, [
				{
					type: NODE_TYPES.BOLD,
					content: [{ type: NODE_TYPES.TEXT, content: "bold" }],
				},
			]);
		});

		it("should parse italic text", () => {
			const result = parseInline("*italic*");
			assert.deepEqual(result, [
				{
					type: NODE_TYPES.ITALIC,
					content: [{ type: NODE_TYPES.TEXT, content: "italic" }],
				},
			]);
		});

		it("should parse inline code", () => {
			const result = parseInline("`code`");
			assert.deepEqual(result, [{ type: NODE_TYPES.CODE, content: "code" }]);
		});

		it("should parse links", () => {
			const result = parseInline("[text](url)");
			assert.deepEqual(result, [
				{
					type: NODE_TYPES.LINK,
					content: [{ type: NODE_TYPES.TEXT, content: "text" }],
					url: "url",
				},
			]);
		});

		it("should parse images", () => {
			const result = parseInline("![alt](url)");
			assert.deepEqual(result, [
				{ type: NODE_TYPES.IMAGE, alt: "alt", url: "url" },
			]);
		});
	});

	describe("mixed content", () => {
		it("should parse mixed elements", () => {
			const result = parseInline("**Bold** and *italic* with `code`");
			assert.deepEqual(result, [
				{
					type: NODE_TYPES.BOLD,
					content: [{ type: NODE_TYPES.TEXT, content: "Bold" }],
				},
				{ type: NODE_TYPES.TEXT, content: " and " },
				{
					type: NODE_TYPES.ITALIC,
					content: [{ type: NODE_TYPES.TEXT, content: "italic" }],
				},
				{ type: NODE_TYPES.TEXT, content: " with " },
				{ type: NODE_TYPES.CODE, content: "code" },
			]);
		});

		it("should parse nested elements", () => {
			const result = parseInline("**bold *italic* text**");
			assert.deepEqual(result, [
				{
					type: NODE_TYPES.BOLD,
					content: [
						{ type: NODE_TYPES.TEXT, content: "bold " },
						{
							type: NODE_TYPES.ITALIC,
							content: [{ type: NODE_TYPES.TEXT, content: "italic" }],
						},
						{ type: NODE_TYPES.TEXT, content: " text" },
					],
				},
			]);
		});
	});

	describe("edge cases", () => {
		it("should handle incomplete elements", () => {
			const result = parseInline("**incomplete");
			assert.deepEqual(result, [
				{ type: NODE_TYPES.TEXT, content: "incomplete" },
			]);
		});

		it("should handle empty elements", () => {
			const result = parseInline("****");
			assert.deepEqual(result, []);
		});

		it("should handle text with no special characters", () => {
			const result = parseInline("plain text with no special characters");
			assert.deepEqual(result, [
				{
					type: NODE_TYPES.TEXT,
					content: "plain text with no special characters",
				},
			]);
		});

		it("should handle single characters", () => {
			const result = parseInline("a");
			assert.deepEqual(result, [{ type: NODE_TYPES.TEXT, content: "a" }]);
		});

		it("should handle single special characters", () => {
			const result = parseInline("*");
			assert.deepEqual(result, []);
		});
	});

	describe("deterministic behavior", () => {
		it("should handle very long text without hanging", () => {
			const longText = "a".repeat(10000);
			const startTime = Date.now();
			const result = parseInline(longText);
			const endTime = Date.now();

			assert.ok(endTime - startTime < 5000, "Should complete within 5 seconds");
			assert.deepEqual(result, [{ type: NODE_TYPES.TEXT, content: longText }]);
		});

		it("should handle text with many potential matches", () => {
			const text = "*".repeat(1000);
			const startTime = Date.now();
			const result = parseInline(text);
			const endTime = Date.now();

			assert.ok(endTime - startTime < 5000, "Should complete within 5 seconds");
			assert.deepEqual(result, []);
		});
	});
});
