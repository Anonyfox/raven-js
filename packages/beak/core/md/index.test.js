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
});
