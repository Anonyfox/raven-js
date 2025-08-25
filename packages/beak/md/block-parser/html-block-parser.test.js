/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { isBlockLevelElement, parseHTMLBlock } from "./html-block-parser.js";

describe("HTML Block Parser", () => {
	describe("parseHTMLBlock", () => {
		it("should parse simple HTML block", () => {
			const lines = ["<div>Hello World</div>"];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			assert.equal(result.node.type, NODE_TYPES.HTML_BLOCK);
			assert.equal(result.node.html, "<div>Hello World</div>");
			assert.equal(result.start, 0);
			assert.equal(result.end, 1);
		});

		it("should parse multi-line HTML block", () => {
			const lines = [
				"<div class='container'>",
				"  <p>Hello World</p>",
				"  <span>More content</span>",
				"</div>",
			];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			assert.equal(result.node.type, NODE_TYPES.HTML_BLOCK);
			assert.equal(
				result.node.html,
				"<div class='container'>\n  <p>Hello World</p>\n  <span>More content</span>\n</div>",
			);
			assert.equal(result.start, 0);
			assert.equal(result.end, 4);
		});

		it("should parse self-closing HTML tags", () => {
			const lines = ["<br/>", "<hr />", '<img src="test.jpg" alt="test" />'];

			let result = parseHTMLBlock(lines, 0);
			assert.ok(result);
			assert.equal(result.node.html, "<br/>");
			assert.equal(result.end, 1);

			result = parseHTMLBlock(lines, 1);
			assert.ok(result);
			assert.equal(result.node.html, "<hr />");
			assert.equal(result.end, 2);

			result = parseHTMLBlock(lines, 2);
			assert.ok(result);
			assert.equal(result.node.html, '<img src="test.jpg" alt="test" />');
			assert.equal(result.end, 3);
		});

		it("should parse HTML comments", () => {
			const lines = ["<!-- This is a comment -->"];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			assert.equal(result.node.html, "<!-- This is a comment -->");
		});

		it("should parse multi-line HTML comments", () => {
			const lines = ["<!-- This is a", "     multi-line", "     comment -->"];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			assert.equal(
				result.node.html,
				"<!-- This is a\n     multi-line\n     comment -->",
			);
			assert.equal(result.end, 3);
		});

		it("should parse HTML with attributes", () => {
			const lines = [
				'<div class="container" id="main" data-value="test">',
				"  Content here",
				"</div>",
			];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			assert.equal(
				result.node.html,
				'<div class="container" id="main" data-value="test">\n  Content here\n</div>',
			);
		});

		it("should handle nested HTML tags", () => {
			const lines = [
				"<section>",
				"  <article>",
				"    <h2>Title</h2>",
				"    <p>Content</p>",
				"  </article>",
				"</section>",
			];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			assert.equal(
				result.node.html,
				"<section>\n  <article>\n    <h2>Title</h2>\n    <p>Content</p>\n  </article>\n</section>",
			);
		});

		it("should parse HTML5 semantic elements", () => {
			const lines = [
				"<header>",
				"  <nav>Navigation</nav>",
				"</header>",
				"<main>",
				"  <article>Article content</article>",
				"</main>",
				"<footer>Footer content</footer>",
			];

			let result = parseHTMLBlock(lines, 0);
			assert.ok(result);
			assert.equal(
				result.node.html,
				"<header>\n  <nav>Navigation</nav>\n</header>",
			);
			assert.equal(result.end, 3);

			result = parseHTMLBlock(lines, 3);
			assert.ok(result);
			assert.equal(
				result.node.html,
				"<main>\n  <article>Article content</article>\n</main>",
			);
		});

		it("should handle script and style tags", () => {
			const lines = [
				"<script>",
				"  console.log('Hello');",
				"  alert('World');",
				"</script>",
			];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			assert.equal(
				result.node.html,
				"<script>\n  console.log('Hello');\n  alert('World');\n</script>",
			);
		});

		it("should return null for non-HTML content", () => {
			const lines = ["This is regular text", "Not HTML at all"];
			const result = parseHTMLBlock(lines, 0);

			assert.equal(result, null);
		});

		it("should return null for inline HTML-like content", () => {
			const lines = ["This has <span>inline</span> HTML"];
			const result = parseHTMLBlock(lines, 0);

			assert.equal(result, null);
		});

		it("should handle unclosed HTML blocks gracefully", () => {
			const lines = [
				"<div>",
				"  Some content",
				"  More content",
				"# This is a heading",
			];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			// Should consume lines until it finds a reason to stop
			assert.equal(
				result.node.html,
				"<div>\n  Some content\n  More content\n# This is a heading",
			);
		});

		it("should handle case-insensitive tag matching", () => {
			const lines = ["<DIV>", "Content", "</div>"];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			assert.equal(result.node.html, "<DIV>\nContent\n</div>");
		});

		it("should parse from different start positions", () => {
			const lines = [
				"Regular paragraph",
				"<section>",
				"  HTML content",
				"</section>",
				"Another paragraph",
			];
			const result = parseHTMLBlock(lines, 1);

			assert.ok(result);
			assert.equal(result.node.html, "<section>\n  HTML content\n</section>");
			assert.equal(result.start, 1);
			assert.equal(result.end, 4);
		});

		it("should handle HTML with special characters", () => {
			const lines = [
				"<div data-special='&lt;&gt;&amp;'>",
				"  Content with special chars: < > &",
				"</div>",
			];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			assert.equal(
				result.node.html,
				"<div data-special='&lt;&gt;&amp;'>\n  Content with special chars: < > &\n</div>",
			);
		});

		it("should handle malformed HTML gracefully", () => {
			const lines = ["<div>", "Content without closing tag"];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			// Should still parse what it can
			assert.equal(result.node.html, "<div>\nContent without closing tag");
		});

		it("should handle empty HTML tags", () => {
			const lines = ["<div></div>"];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			assert.equal(result.node.html, "<div></div>");
		});

		it("should handle HTML with markdown-like content", () => {
			const lines = [
				"<div>",
				"  This has **bold** and *italic* text",
				"  But it should be preserved as-is",
				"</div>",
			];
			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			assert.equal(
				result.node.html,
				"<div>\n  This has **bold** and *italic* text\n  But it should be preserved as-is\n</div>",
			);
		});

		it("should handle safety check for very long unclosed HTML blocks", () => {
			// Create a test case with more than 50 lines to trigger the safety check
			const lines = ["<div>"];
			// Add 60 lines of content to exceed the 50-line safety limit
			for (let i = 0; i < 60; i++) {
				lines.push(`  Line ${i + 1} of content`);
			}

			const result = parseHTMLBlock(lines, 0);

			assert.ok(result);
			// Should only contain the first line due to safety check
			assert.equal(result.node.html, "<div>");
			assert.equal(result.end, 1);
		});

		it("should return null when start position is beyond array length", () => {
			// Test case for line 23: start >= lines.length
			const lines = ["<div>Some content</div>"];
			const result = parseHTMLBlock(lines, 5);

			assert.equal(result, null);
		});
	});

	describe("isBlockLevelElement", () => {
		it("should identify block-level elements correctly", () => {
			const blockElements = [
				"div",
				"section",
				"article",
				"header",
				"footer",
				"nav",
				"main",
				"h1",
				"h2",
				"h3",
				"h4",
				"h5",
				"h6",
				"p",
				"blockquote",
				"pre",
				"ul",
				"ol",
				"li",
				"table",
				"form",
				"fieldset",
				"address",
			];

			for (const element of blockElements) {
				assert.ok(
					isBlockLevelElement(element),
					`${element} should be block-level`,
				);
			}
		});

		it("should handle case-insensitive tag names", () => {
			assert.ok(isBlockLevelElement("DIV"));
			assert.ok(isBlockLevelElement("Section"));
			assert.ok(isBlockLevelElement("HEADER"));
		});

		it("should reject inline elements", () => {
			const inlineElements = ["span", "a", "em", "strong", "code", "small"];

			for (const element of inlineElements) {
				assert.ok(
					!isBlockLevelElement(element),
					`${element} should not be block-level`,
				);
			}
		});
	});
});
