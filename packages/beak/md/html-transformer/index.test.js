import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { markdownToHTML, transformToHTML } from "./index.js";

describe("HTML Transformer Index", () => {
	it("should transform AST to HTML", () => {
		const ast = [
			{
				type: "heading",
				level: 1,
				content: [{ type: "text", content: "Title" }],
			},
			{
				type: "paragraph",
				content: [{ type: "text", content: "Paragraph text" }],
			},
		];

		const result = transformToHTML(ast);
		assert.ok(result.includes("<h1>Title</h1>"));
		assert.ok(result.includes("<p>Paragraph text</p>"));
	});

	it("should handle edge cases", () => {
		assert.equal(transformToHTML([]), "");
		assert.equal(transformToHTML(null), "");
		assert.equal(transformToHTML(undefined), "");
		// @ts-expect-error - Testing invalid input
		assert.equal(transformToHTML("not an array"), "");
	});

	it("should export markdownToHTML function", () => {
		assert.equal(typeof markdownToHTML, "function");
		const result = markdownToHTML("# Test\n\nContent");
		assert.ok(result.includes("<h1>Test</h1>"));
		assert.ok(result.includes("<p>Content</p>"));
	});
});
