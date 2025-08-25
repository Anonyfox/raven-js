import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { markdownToHTML } from "./markdown-to-html.js";

describe("Markdown to HTML", () => {
	it("should transform markdown to HTML", () => {
		const markdown = "# Heading\n\nParagraph text";
		const result = markdownToHTML(markdown);
		assert.ok(result.includes("<h1>Heading</h1>"));
		assert.ok(result.includes("<p>Paragraph text</p>"));

		const complexMarkdown =
			"# Title\n\nThis is a **bold** paragraph with *italic* text.\n\n- List item 1\n- List item 2";
		const complexResult = markdownToHTML(complexMarkdown);
		assert.ok(complexResult.includes("<h1>Title</h1>"));
		assert.ok(
			complexResult.includes(
				"<p>This is a <strong>bold</strong> paragraph with <em>italic</em> text.</p>",
			),
		);
		assert.ok(complexResult.includes("<ul>"));
	});

	it("should handle edge cases", () => {
		assert.equal(markdownToHTML(""), "");
		assert.equal(markdownToHTML(null), "");
		assert.equal(markdownToHTML(undefined), "");
		// @ts-expect-error - Testing invalid input
		assert.equal(markdownToHTML(123), "");
		// @ts-expect-error - Testing invalid input
		assert.equal(markdownToHTML(true), "");
	});
});
