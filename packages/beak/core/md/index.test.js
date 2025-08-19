import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { md } from "./index.js";

describe("Markdown Parser", () => {
	it("parses headings correctly", () => {
		const markdown = md`# Heading 1\n## Heading 2\n### Heading 3`;
		assert.equal(
			markdown,
			"<h1>Heading 1</h1>\n<h2>Heading 2</h2>\n<h3>Heading 3</h3>",
		);
	});

	it("parses paragraphs correctly", () => {
		const markdown = md`This is a paragraph.\n\nThis is another paragraph.`;
		assert.equal(
			markdown,
			"<p>This is a paragraph.</p>\n<p>This is another paragraph.</p>",
		);
	});

	it("parses bold text correctly", () => {
		const markdown = md`This is **bold** text.`;
		assert.equal(markdown, "<p>This is <strong>bold</strong> text.</p>");
	});

	it("parses italic text correctly", () => {
		const markdown = md`This is *italic* text.`;
		assert.equal(markdown, "<p>This is <em>italic</em> text.</p>");
	});

	it("parses inline code correctly", () => {
		const markdown = md`This is \`inline code\`.`;
		assert.equal(markdown, "<p>This is <code>inline code</code>.</p>");
	});

	it("parses strikethrough text correctly", () => {
		const markdown = md`This is ~~strikethrough~~ text.`;
		assert.equal(markdown, "<p>This is <del>strikethrough</del> text.</p>");
	});

	it("parses links correctly", () => {
		const markdown = md`This is a [link](https://example.com).`;
		assert.equal(
			markdown,
			'<p>This is a <a href="https://example.com">link</a>.</p>',
		);
	});

	it("parses images correctly", () => {
		const markdown = md`This is an ![image](https://example.com/image.png).`;
		assert.equal(
			markdown,
			'<p>This is an <img src="https://example.com/image.png" alt="image">.</p>',
		);
	});

	it("parses blockquotes correctly", () => {
		const markdown = md`> This is a blockquote.`;
		assert.equal(
			markdown,
			"<blockquote><p>This is a blockquote.</p></blockquote>",
		);
	});

	it("parses code blocks correctly", () => {
		const markdown = md`\`\`\`javascript\nconsole.log("Hello, world!");\n\`\`\``;
		assert.equal(
			markdown,
			'<pre><code class="language-javascript">console.log("Hello, world!");</code></pre>',
		);
	});

	it("parses indented code blocks correctly", () => {
		const markdown = md`    function hello() {\n        console.log("Hello!");\n    }`;
		assert.equal(
			markdown,
			'<pre><code>function hello() {\n    console.log("Hello!");\n}</code></pre>',
		);
	});

	it("parses indented code blocks with tabs", () => {
		const markdown = md`\tconst x = 42;\n\tconsole.log(x);`;
		assert.equal(
			markdown,
			"<pre><code>const x = 42;\nconsole.log(x);</code></pre>",
		);
	});

	it("handles mixed fenced and indented code blocks", () => {
		const markdown = md`\`\`\`js\nfenced();\n\`\`\`\n\n    indented();`;
		assert.equal(
			markdown,
			'<pre><code class="language-js">fenced();</code></pre>\n<pre><code>indented();</code></pre>',
		);
	});

	it("parses unordered lists correctly", () => {
		const markdown = md`- Item 1\n- Item 2\n- Item 3`;
		assert.equal(
			markdown,
			"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
		);
	});

	it("parses ordered lists correctly", () => {
		const markdown = md`1. Item 1\n2. Item 2\n3. Item 3`;
		assert.equal(
			markdown,
			"<ol><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol>",
		);
	});

	it("parses task lists correctly", () => {
		const markdown = md`- [x] Completed task\n- [ ] Pending task`;
		assert.equal(
			markdown,
			'<ul><li><input type="checkbox" checked disabled> Completed task</li><li><input type="checkbox" disabled> Pending task</li></ul>',
		);
	});

	it("parses autolinks correctly", () => {
		const markdown = md`Visit https://example.com for more info.`;
		assert.equal(
			markdown,
			'<p>Visit <a href="https://example.com">https://example.com</a> for more info.</p>',
		);
	});

	it("parses tables correctly", () => {
		const markdown = md`| Name | Age |\n|------|-----|\n| Alice | 25 |\n| Bob | 30 |`;
		assert.equal(
			markdown,
			"<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>Alice</td><td>25</td></tr><tr><td>Bob</td><td>30</td></tr></tbody></table>",
		);
	});

	it("parses simple lists correctly", () => {
		const markdown = md`- Item 1\n- Item 2\n- Item 3`;
		assert.equal(
			markdown,
			"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
		);
	});

	it("parses horizontal rules correctly", () => {
		const markdown = md`---`;
		assert.equal(markdown, "<hr>");
	});

	it("parses mixed content correctly", () => {
		const markdown = md`# Heading
This is a **bold** text and this is an *italic* text.
Here is a [link](https://example.com).
\`\`\`javascript
console.log("Hello, world!");
\`\`\`
- Item 1
- Item 2
- Item 3
> This is a blockquote.
![image](https://example.com/image.png)
---`;
		assert.equal(
			markdown,
			`<h1>Heading</h1>
<p>This is a <strong>bold</strong> text and this is an <em>italic</em> text.
Here is a <a href="https://example.com">link</a>.</p>
<pre><code class="language-javascript">console.log("Hello, world!");</code></pre>
<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>
<blockquote><p>This is a blockquote.</p></blockquote>
<p><img src="https://example.com/image.png" alt="image"></p>
<hr>`,
		);
	});

	it("handles template literal with values", () => {
		const title = "Dynamic Title";
		const items = ["Apple", "Banana", "Cherry"];
		const markdown = md`# ${title}

Here are some fruits:
${items.map((item) => `- ${item}`).join("\n")}

Visit our [website](https://example.com) for more info.`;
		assert.equal(
			markdown,
			`<h1>Dynamic Title</h1>
<p>Here are some fruits:</p>
<ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul>
<p>Visit our <a href="https://example.com">website</a> for more info.</p>`,
		);
	});

	it("parses reference-style links correctly", () => {
		const markdown = md`Check out [Google][search] and [GitHub][code].

[search]: https://google.com "Search Engine"
[code]: https://github.com`;
		assert.equal(
			markdown,
			'<p>Check out <a href="https://google.com" title="Search Engine">Google</a> and <a href="https://github.com">GitHub</a>.</p>',
		);
	});

	it("parses HTML blocks correctly", () => {
		const markdown = md`<div class="container">
  <p>This is raw HTML</p>
  <span>It should be preserved</span>
</div>`;
		assert.equal(
			markdown,
			'<div class="container">\n  <p>This is raw HTML</p>\n  <span>It should be preserved</span>\n</div>',
		);
	});

	it("parses self-closing HTML tags", () => {
		const markdown = md`<hr/>
<br />
<img src="test.jpg" alt="test" />`;
		assert.equal(markdown, '<hr/>\n<br />\n<img src="test.jpg" alt="test" />');
	});

	it("parses HTML comments", () => {
		const markdown = md`<!-- This is a comment -->
Some text after the comment`;
		assert.equal(
			markdown,
			"<!-- This is a comment -->\n<p>Some text after the comment</p>",
		);
	});

	it("handles mixed HTML and Markdown", () => {
		const markdown = md`# Heading

<div class="special">
  This is HTML content
</div>

This is a **markdown** paragraph.

<section>
  <p>More HTML</p>
</section>`;
		assert.equal(
			markdown,
			'<h1>Heading</h1>\n<div class="special">\n  This is HTML content\n</div>\n<p>This is a <strong>markdown</strong> paragraph.</p>\n<section>\n  <p>More HTML</p>\n</section>',
		);
	});

	it("preserves HTML attributes and special characters", () => {
		const markdown = md`<div data-value="test" class='container' id="main">
  Content with special chars: < > & "quotes"
</div>`;
		assert.equal(
			markdown,
			'<div data-value="test" class=\'container\' id="main">\n  Content with special chars: < > & "quotes"\n</div>',
		);
	});

	it("parses inline HTML correctly", () => {
		const markdown = md`This has <strong>inline HTML</strong> and <em>emphasis</em> tags.`;
		assert.equal(
			markdown,
			"<p>This has <strong>inline HTML</strong> and <em>emphasis</em> tags.</p>",
		);
	});

	it("parses self-closing inline HTML tags", () => {
		const markdown = md`Line break: <br/> and image: <img src="test.jpg" alt="test"/>.`;
		assert.equal(
			markdown,
			'<p>Line break: <br/> and image: <img src="test.jpg" alt="test"/>.</p>',
		);
	});

	it("handles mixed inline HTML and markdown", () => {
		const markdown = md`This has **bold markdown** and <strong>HTML bold</strong> together.`;
		assert.equal(
			markdown,
			"<p>This has <strong>bold markdown</strong> and <strong>HTML bold</strong> together.</p>",
		);
	});

	it("handles inline HTML with attributes", () => {
		const markdown = md`Click <a href="https://example.com" target="_blank">this link</a> to visit.`;
		assert.equal(
			markdown,
			'<p>Click <a href="https://example.com" target="_blank">this link</a> to visit.</p>',
		);
	});

	it("handles nested inline HTML elements", () => {
		const markdown = md`This has <span class="highlight">highlighted <em>italic</em> text</span>.`;
		assert.equal(
			markdown,
			'<p>This has <span class="highlight">highlighted <em>italic</em> text</span>.</p>',
		);
	});

	it("handles inline HTML mixed with other inline elements", () => {
		const markdown = md`Text with **bold**, *italic*, \`code\`, [link](url), and <strong>HTML</strong>.`;
		assert.equal(
			markdown,
			'<p>Text with <strong>bold</strong>, <em>italic</em>, <code>code</code>, <a href="url">link</a>, and <strong>HTML</strong>.</p>',
		);
	});
});
