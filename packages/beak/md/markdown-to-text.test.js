import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { markdownToText } from "./markdown-to-text.js";

describe("markdownToText", () => {
	it("converts headings", () => {
		assert.equal(markdownToText("# Hello"), "Hello");
		assert.equal(markdownToText("## World"), "World");
		assert.equal(markdownToText("### Level 3"), "Level 3");
		assert.equal(markdownToText("Title\n==="), "Title");
		assert.equal(markdownToText("Subtitle\n---"), "Subtitle");
	});

	it("converts paragraphs and strips formatting", () => {
		assert.equal(markdownToText("**bold** and *italic*"), "bold and italic");
		assert.equal(markdownToText("~~strikethrough~~"), "strikethrough");
		assert.equal(markdownToText("`inline code`"), "inline code");
		assert.equal(markdownToText("Simple paragraph"), "Simple paragraph");
		assert.equal(markdownToText("Line one\nLine two"), "Line one Line two");
	});

	it("converts lists", () => {
		assert.equal(markdownToText("- Item 1\n- Item 2"), "- Item 1\n- Item 2");
		assert.equal(markdownToText("1. First\n2. Second"), "- First\n- Second");
		assert.equal(markdownToText("* Bullet\n+ Mixed"), "- Bullet\n- Mixed");
	});

	it("converts code blocks", () => {
		assert.equal(
			markdownToText("```js\nconsole.log('hi');\n```"),
			"console.log('hi');",
		);
		assert.equal(markdownToText("```\nplain code\n```"), "plain code");
	});

	it("converts blockquotes", () => {
		assert.equal(markdownToText("> Quote text"), "Quote text");
		assert.equal(markdownToText("> Level 1\n>> Level 2"), "Level 1 Level 2");
	});

	it("converts tables", () => {
		const table = "| Header |\n| --- |\n| Cell |";
		assert.equal(markdownToText(table), "Header: Cell");
	});

	it("handles horizontal rules", () => {
		assert.equal(markdownToText("---"), "---");
		assert.equal(markdownToText("***"), "---");
		assert.equal(markdownToText("___"), "---");
	});

	it("strips links and keeps text", () => {
		assert.equal(markdownToText("[text](url)"), "text");
		assert.equal(markdownToText("<http://example.com>"), "http://example.com");
		assert.equal(markdownToText("[ref link][ref]"), "ref link");
	});

	it("handles empty and edge cases", () => {
		assert.equal(markdownToText(""), "");
		assert.equal(markdownToText(" "), "");
		assert.equal(markdownToText("\n\n"), "");
		assert.equal(markdownToText(null), "");
		assert.equal(markdownToText(undefined), "");
	});

	it("strips HTML tags", () => {
		assert.equal(markdownToText("<strong>bold</strong>"), "bold");
		assert.equal(markdownToText("<em>italic</em>"), "italic");
	});

	it("handles escaped characters", () => {
		assert.equal(markdownToText("\\*not italic\\*"), "*not italic*");
		assert.equal(markdownToText("\\[not a link\\]"), "[not a link]");
	});

	it("handles complex mixed content", () => {
		const complex = `# Title

This has **bold** and *italic* text.

- List item
- Another item

> A quote with [link](url)

\`\`\`js
code here
\`\`\``;
		const result = markdownToText(complex);
		assert(result.includes("Title"));
		assert(result.includes("bold and italic"));
		assert(result.includes("- List item"));
		assert(result.includes("code here"));
		assert(result.includes("A quote with link"));
	});
});
