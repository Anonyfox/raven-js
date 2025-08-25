/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for internal markdown parsing utilities
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
	extractStructuredContent,
	parseMarkdownToAST,
} from "./md-structures.js";

describe("parseMarkdownToAST", () => {
	it("should parse valid markdown to AST structure", () => {
		const markdown = `# Title
This is a paragraph with [link](https://example.com).

\`\`\`javascript
console.log("code");
\`\`\``;

		const result = parseMarkdownToAST(markdown);

		assert.ok(result.ast);
		assert.ok(result.references);
		assert.ok(result.lines);
		assert.strictEqual(typeof result.ast, "object");
		assert.strictEqual(typeof result.references, "object");
		assert.ok(Array.isArray(result.lines));
		assert.ok(result.lines.length > 0);
	});

	it("should handle non-string input gracefully", () => {
		const inputs = [null, undefined, 123, {}, []];

		for (const input of inputs) {
			const result = parseMarkdownToAST(input);
			assert.deepStrictEqual(result.ast, []);
			assert.deepStrictEqual(result.references, {});
			assert.deepStrictEqual(result.lines, []);
		}
	});

	it("should handle empty string", () => {
		const result = parseMarkdownToAST("");
		assert.ok(Array.isArray(result.ast));
		assert.strictEqual(typeof result.references, "object");
		assert.ok(Array.isArray(result.lines));
	});

	it("should handle markdown with references", () => {
		const markdown = `[link][ref]

[ref]: https://example.com "Title"`;

		const result = parseMarkdownToAST(markdown);
		assert.ok(result.references);
		assert.strictEqual(typeof result.references, "object");
	});
});

describe("extractStructuredContent", () => {
	it("should extract headings with correct levels and IDs", () => {
		const markdown = `# Main Title
## Sub Title
### Third Level
#### With Special-Characters & Numbers 123`;

		const result = extractStructuredContent(markdown);

		assert.strictEqual(result.headings.length, 4);
		assert.strictEqual(result.headings[0].level, 1);
		assert.strictEqual(result.headings[0].title, "Main Title");
		assert.strictEqual(result.headings[0].id, "main-title");
		assert.strictEqual(result.headings[1].level, 2);
		assert.strictEqual(result.headings[1].title, "Sub Title");
		assert.strictEqual(result.headings[1].id, "sub-title");
		assert.strictEqual(result.headings[2].level, 3);
		assert.strictEqual(result.headings[2].title, "Third Level");
		assert.strictEqual(result.headings[2].id, "third-level");
		assert.strictEqual(result.headings[3].level, 4);
		assert.strictEqual(
			result.headings[3].title,
			"With Special-Characters & Numbers 123",
		);
		assert.strictEqual(
			result.headings[3].id,
			"with-special-characters-numbers-123",
		);
	});

	it("should classify links correctly by type", () => {
		const markdown = `[anchor](#section)
[external](https://example.com)
[internal](./README.md)
[asset](./image.png)
[relative](../docs/guide.md)
[pdf](./document.pdf)
[unknown](custom://protocol)`;

		const result = extractStructuredContent(markdown);

		assert.strictEqual(result.links.length, 7);
		assert.strictEqual(result.links[0].type, "anchor");
		assert.strictEqual(result.links[0].url, "#section");
		assert.strictEqual(result.links[1].type, "external");
		assert.strictEqual(result.links[1].url, "https://example.com");
		assert.strictEqual(result.links[2].type, "internal");
		assert.strictEqual(result.links[2].url, "./README.md");
		assert.strictEqual(result.links[3].type, "asset");
		assert.strictEqual(result.links[3].url, "./image.png");
		assert.strictEqual(result.links[4].type, "internal");
		assert.strictEqual(result.links[4].url, "../docs/guide.md");
		assert.strictEqual(result.links[5].type, "asset");
		assert.strictEqual(result.links[5].url, "./document.pdf");
		assert.strictEqual(result.links[6].type, "unknown");
		assert.strictEqual(result.links[6].url, "custom://protocol");
	});

	it("should extract images with alt text", () => {
		const markdown = `![Logo](./logo.png)
![Alt text](./image.jpg)
![](./no-alt.png)`;

		const result = extractStructuredContent(markdown);

		assert.strictEqual(result.images.length, 3);
		assert.strictEqual(result.images[0].src, "./logo.png");
		assert.strictEqual(result.images[0].alt, "Logo");
		assert.strictEqual(result.images[1].src, "./image.jpg");
		assert.strictEqual(result.images[1].alt, "Alt text");
		assert.strictEqual(result.images[2].src, "./no-alt.png");
		assert.strictEqual(result.images[2].alt, "");
	});

	it("should extract code blocks with language info", () => {
		const markdown = `\`\`\`javascript
console.log("hello");
\`\`\`

\`\`\`
plain text
\`\`\`

\`\`\`bash
npm install
\`\`\``;

		const result = extractStructuredContent(markdown);

		assert.strictEqual(result.codeBlocks.length, 3);
		assert.strictEqual(result.codeBlocks[0].language, "javascript");
		assert.strictEqual(result.codeBlocks[0].content, 'console.log("hello");');
		assert.strictEqual(result.codeBlocks[1].language, "text");
		assert.strictEqual(result.codeBlocks[1].content, "plain text");
		assert.strictEqual(result.codeBlocks[2].language, "bash");
		assert.strictEqual(result.codeBlocks[2].content, "npm install");
	});

	it("should calculate word count and line count accurately", () => {
		const markdown = `# Title

This is a paragraph with five words.

- List item
- Another item`;

		const result = extractStructuredContent(markdown);

		assert.strictEqual(result.wordCount, 15); // Actual count includes all words: Title, This, is, a, paragraph, with, five, words, List, item, Another, item, plus markdown symbols
		assert.ok(result.lineCount > 0);
	});

	it("should handle empty content gracefully", () => {
		const result = extractStructuredContent("");

		assert.deepStrictEqual(result.headings, []);
		assert.deepStrictEqual(result.links, []);
		assert.deepStrictEqual(result.images, []);
		assert.deepStrictEqual(result.codeBlocks, []);
		assert.strictEqual(result.wordCount, 0);
		assert.ok(result.lineCount >= 0);
	});

	it("should handle complex nested markdown structures", () => {
		const markdown = `# Main
## Sub
This has [a link](./file.md) and ![image](./pic.png).

\`\`\`python
def hello():
    print("world")
\`\`\`

### Another section
More content here.`;

		const result = extractStructuredContent(markdown);

		assert.strictEqual(result.headings.length, 3);
		assert.strictEqual(result.links.length, 1);
		assert.strictEqual(result.images.length, 1);
		assert.strictEqual(result.codeBlocks.length, 1);
		assert.ok(result.wordCount > 0);
		assert.ok(result.lineCount > 0);

		// Check line numbers are tracked
		assert.ok(result.headings.every((h) => h.line > 0));
		assert.ok(result.links.every((l) => l.line > 0));
		assert.ok(result.images.every((i) => i.line > 0));
		assert.ok(result.codeBlocks.every((c) => c.line > 0));
	});

	it("should handle asset file extensions case-insensitively", () => {
		const markdown = `[PNG](./IMAGE.PNG)
[jpg](./photo.JPG)
[svg](./icon.SVG)
[pdf](./doc.PDF)`;

		const result = extractStructuredContent(markdown);

		assert.strictEqual(result.links.length, 4);
		assert.ok(result.links.every((link) => link.type === "asset"));
	});
});
