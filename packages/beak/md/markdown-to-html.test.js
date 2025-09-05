import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { markdownToHTML } from "./markdown-to-html.js";

describe("markdownToHTML", () => {
	it("converts headings", () => {
		assert.equal(markdownToHTML("# Hello"), "<h1>Hello</h1>");
		assert.equal(markdownToHTML("## World"), "<h2>World</h2>");
		assert.equal(markdownToHTML("### Level 3"), "<h3>Level 3</h3>");
		assert.equal(markdownToHTML("Title\n==="), "<h1>Title</h1>");
		assert.equal(markdownToHTML("Subtitle\n---"), "<h2>Subtitle</h2>");
	});

	it("converts paragraphs with formatting", () => {
		assert.equal(
			markdownToHTML("**bold** text"),
			"<p><strong>bold</strong> text</p>",
		);
		assert.equal(
			markdownToHTML("*italic* text"),
			"<p><em>italic</em> text</p>",
		);
		assert.equal(
			markdownToHTML("~~strike~~ text"),
			"<p><del>strike</del> text</p>",
		);
		assert.equal(
			markdownToHTML("`code` text"),
			"<p><code>code</code> text</p>",
		);
	});

	it("converts lists", () => {
		assert.equal(
			markdownToHTML("- Item 1\n- Item 2"),
			"<ul>\n<li>Item 1</li>\n<li>Item 2</li>\n</ul>",
		);
		assert.equal(
			markdownToHTML("1. First\n2. Second"),
			"<ol>\n<li>First</li>\n<li>Second</li>\n</ol>",
		);
	});

	it("converts code blocks", () => {
		assert.equal(
			markdownToHTML("```js\nconsole.log('hi');\n```"),
			'<pre><code class="language-js">console.log(&#39;hi&#39;);</code></pre>',
		);
		assert.equal(
			markdownToHTML("```\nplain code\n```"),
			"<pre><code>plain code</code></pre>",
		);
	});

	it("converts blockquotes", () => {
		assert.equal(
			markdownToHTML("> Quote text"),
			"<blockquote>\n<p>Quote text</p>\n</blockquote>",
		);
	});

	it("converts tables", () => {
		const table = "| Header | Second |\n| --- | --- |\n| Cell | Data |";
		const expected =
			"<table>\n<thead>\n<tr><th>Header</th><th>Second</th></tr>\n</thead>\n<tbody>\n<tr><td>Cell</td><td>Data</td></tr>\n</tbody>\n</table>";
		assert.equal(markdownToHTML(table), expected);
	});

	it("handles horizontal rules", () => {
		assert.equal(markdownToHTML("---"), "<hr>");
		assert.equal(markdownToHTML("***"), "<hr>");
		assert.equal(markdownToHTML("___"), "<hr>");
	});

	it("converts links", () => {
		assert.equal(
			markdownToHTML("[text](url)"),
			'<p><a href="url">text</a></p>',
		);
		assert.equal(
			markdownToHTML("<http://example.com>"),
			'<p><a href="http://example.com">http://example.com</a></p>',
		);
	});

	it("converts images", () => {
		assert.equal(
			markdownToHTML("![alt](url)"),
			'<p><img src="url" alt="alt"></p>',
		);
		assert.equal(
			markdownToHTML('![alt](url "title")'),
			'<p><img src="url" alt="alt" title="title"></p>',
		);
	});

	it("handles empty and edge cases", () => {
		assert.equal(markdownToHTML(""), "");
		assert.equal(markdownToHTML(" "), "");
		assert.equal(markdownToHTML("\n\n"), "");
	});

	it("preserves HTML by default, escapes when opt-in", () => {
		assert.equal(markdownToHTML("< & >"), "<p>< & ></p>");
		assert.equal(
			markdownToHTML("< & >", { escapeHtml: true }),
			"<p>&lt; &amp; &gt;</p>",
		);
	});

	it("handles reference links", () => {
		const md = "[link][ref]\n\n[ref]: url";
		assert.equal(markdownToHTML(md), '<p><a href="url">link</a></p>');
	});

	it("processes emphasis combinations", () => {
		assert.equal(
			markdownToHTML("***bold italic***"),
			"<p><em><strong>bold italic</strong></em></p>",
		);
		assert.equal(
			markdownToHTML("**bold** and *italic*"),
			"<p><strong>bold</strong> and <em>italic</em></p>",
		);
	});

	it("handles table alignments", () => {
		const table =
			"| Left | Center | Right |\n| :--- | :---: | ---: |\n| L | C | R |";
		const result = markdownToHTML(table);
		assert(result.includes('style="text-align:center"'));
		assert(result.includes('style="text-align:right"'));
	});

	it("treats indented content as paragraphs (indented code blocks disabled)", () => {
		const code = "    console.log('indented');";
		assert.equal(markdownToHTML(code), "<p>    console.log('indented');</p>");
	});

	it("preserves indented HTML components as HTML blocks", () => {
		const htmlComponent = `<div class="hero">
      <h1>Title</h1>
      <p>Content</p>
    </div>`;
		const result = markdownToHTML(htmlComponent);
		assert(result.includes('<div class="hero">'));
		assert(result.includes("<h1>Title</h1>"));
		assert(result.includes("<p>Content</p>"));
		assert(result.includes("</div>"));
		assert(!result.includes("<pre><code>"));
	});

	it("processes nested blockquotes", () => {
		const quote = "> Level 1\n>> Level 2";
		const result = markdownToHTML(quote);
		assert(result.includes("<blockquote>"));
		assert(result.includes("Level 1"));
		assert(result.includes("Level 2"));
	});
});
