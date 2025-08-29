/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { highlightHTML } from "./html.js";

describe("HTML Syntax Highlighter", () => {
	describe("Input Validation", () => {
		it("should throw TypeError for non-string input", () => {
			assert.throws(() => highlightHTML(null), TypeError);
			assert.throws(() => highlightHTML(undefined), TypeError);
			assert.throws(() => highlightHTML(123), TypeError);
			assert.throws(() => highlightHTML({}), TypeError);
		});

		it("should return empty string for empty input", () => {
			assert.strictEqual(highlightHTML(""), "");
			assert.strictEqual(highlightHTML("   "), "");
			assert.strictEqual(highlightHTML("\n\t"), "");
		});
	});

	describe("Basic HTML Tags", () => {
		it("should highlight opening tags", () => {
			const html = "<div>";
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-secondary">&lt;</span>'));
			assert.ok(result.includes('<span class="text-primary">div</span>'));
			assert.ok(result.includes('<span class="text-secondary">&gt;</span>'));
		});

		it("should highlight closing tags", () => {
			const html = "</div>";
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-secondary">&lt;</span>'));
			assert.ok(result.includes('<span class="text-secondary">/</span>'));
			assert.ok(result.includes('<span class="text-primary">div</span>'));
			assert.ok(result.includes('<span class="text-secondary">&gt;</span>'));
		});

		it("should highlight self-closing tags", () => {
			const html = "<br />";
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-secondary">&lt;</span>'));
			assert.ok(result.includes('<span class="text-primary">br</span>'));
			assert.ok(result.includes('<span class="text-secondary">/</span>'));
			assert.ok(result.includes('<span class="text-secondary">&gt;</span>'));
		});

		it("should highlight nested tags", () => {
			const html = "<div><span>text</span></div>";
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-primary">div</span>'));
			assert.ok(result.includes('<span class="text-primary">span</span>'));
		});
	});

	describe("HTML Attributes", () => {
		it("should highlight attribute names", () => {
			const html = '<div class="container">';
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-info">class</span>'));
		});

		it("should highlight double-quoted attribute values", () => {
			const html = '<div class="container">';
			const result = highlightHTML(html);
			assert.ok(
				result.includes(
					'<span class="text-success">&quot;container&quot;</span>',
				),
			);
		});

		it("should highlight single-quoted attribute values", () => {
			const html = "<div class='container'>";
			const result = highlightHTML(html);
			assert.ok(
				result.includes(
					'<span class="text-success">&#39;container&#39;</span>',
				),
			);
		});

		it("should highlight unquoted attribute values", () => {
			const html = "<input type=text>";
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-info">type</span>'));
			assert.ok(result.includes('<span class="text-success">text</span>'));
		});

		it("should highlight multiple attributes", () => {
			const html = '<img src="image.jpg" alt="Description" width="100">';
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-info">src</span>'));
			assert.ok(result.includes('<span class="text-info">alt</span>'));
			assert.ok(result.includes('<span class="text-info">width</span>'));
			assert.ok(
				result.includes(
					'<span class="text-success">&quot;image.jpg&quot;</span>',
				),
			);
		});

		it("should highlight data attributes", () => {
			const html = '<div data-id="123" data-toggle="modal">';
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-info">data-id</span>'));
			assert.ok(result.includes('<span class="text-info">data-toggle</span>'));
		});

		it("should handle attributes with equals and whitespace", () => {
			const html = '<div class = "spaced" >';
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-info">class</span>'));
			assert.ok(result.includes('<span class="text-secondary">=</span>'));
			assert.ok(
				result.includes('<span class="text-success">&quot;spaced&quot;</span>'),
			);
		});
	});

	describe("Text Content", () => {
		it("should handle text content between tags", () => {
			const html = "<p>Hello World</p>";
			const result = highlightHTML(html);
			assert.ok(result.includes("Hello"));
			assert.ok(result.includes("World"));
			// Text should not be wrapped in spans (no highlighting)
			assert.ok(!result.includes('<span class="text-body">Hello</span>'));
		});

		it("should handle mixed content", () => {
			const html = "<h1>Title</h1><p>Paragraph text</p>";
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-primary">h1</span>'));
			assert.ok(result.includes('<span class="text-primary">p</span>'));
			assert.ok(result.includes("Title"));
			assert.ok(result.includes("Paragraph"));
		});
	});

	describe("HTML Comments", () => {
		it("should highlight single-line comments", () => {
			const html = "<!-- This is a comment -->";
			const result = highlightHTML(html);
			assert.ok(
				result.includes(
					'<span class="text-muted">&lt;!-- This is a comment --&gt;</span>',
				),
			);
		});

		it("should highlight multi-line comments", () => {
			const html = `<!--
				Multi-line
				comment
			-->`;
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-muted">'));
			assert.ok(result.includes("Multi-line"));
		});

		it("should not highlight content inside comments", () => {
			const html = "<!-- <div class='test'>ignored</div> -->";
			const result = highlightHTML(html);
			const commentSpan = result.match(
				/<span class="text-muted">[^<]*<\/span>/,
			);
			assert.ok(commentSpan);
			assert.ok(
				!commentSpan[0].includes('<span class="text-primary">div</span>'),
			);
		});
	});

	describe("DOCTYPE Declaration", () => {
		it("should highlight DOCTYPE declaration", () => {
			const html = "<!DOCTYPE html>";
			const result = highlightHTML(html);
			assert.ok(
				result.includes(
					'<span class="text-muted">&lt;!DOCTYPE html&gt;</span>',
				),
			);
		});

		it("should highlight complex DOCTYPE declaration", () => {
			const html =
				'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">';
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-muted">'));
			assert.ok(result.includes("PUBLIC"));
		});
	});

	describe("CDATA Sections", () => {
		it("should highlight CDATA sections", () => {
			const html = "<![CDATA[Some data here]]>";
			const result = highlightHTML(html);
			assert.ok(
				result.includes(
					'<span class="text-muted">&lt;![CDATA[Some data here]]&gt;</span>',
				),
			);
		});

		it("should not highlight content inside CDATA", () => {
			const html = "<![CDATA[<script>alert('test')</script>]]>";
			const result = highlightHTML(html);
			const cdataSpan = result.match(/<span class="text-muted">[^<]*<\/span>/);
			assert.ok(cdataSpan);
			assert.ok(
				!cdataSpan[0].includes('<span class="text-primary">script</span>'),
			);
		});
	});

	describe("HTML Entities", () => {
		it("should highlight named entities", () => {
			const html = "Hello &nbsp; World &amp; More";
			const result = highlightHTML(html);
			assert.ok(
				result.includes('<span class="text-warning">&amp;nbsp;</span>'),
			);
			assert.ok(result.includes('<span class="text-warning">&amp;amp;</span>'));
		});

		it("should highlight numeric entities", () => {
			const html = "Copyright &#169; 2023";
			const result = highlightHTML(html);
			assert.ok(
				result.includes('<span class="text-warning">&amp;#169;</span>'),
			);
		});

		it("should highlight hexadecimal entities", () => {
			const html = "Quote &#x22; end";
			const result = highlightHTML(html);
			assert.ok(
				result.includes('<span class="text-warning">&amp;#x22;</span>'),
			);
		});

		it("should handle entities without semicolons", () => {
			const html = "&lt &gt &amp";
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-warning">&amp;lt</span>'));
			assert.ok(result.includes('<span class="text-warning">&amp;gt</span>'));
			assert.ok(result.includes('<span class="text-warning">&amp;amp</span>'));
		});

		it("should handle entities in attribute values", () => {
			const html = '<div title="Hello &amp; Goodbye">';
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-info">title</span>'));
			// The entity should be in the attribute value, but the attribute value gets escaped
			assert.ok(result.includes("Hello &amp;amp; Goodbye"));
		});
	});

	describe("Complex HTML Examples", () => {
		it("should handle complete HTML document structure", () => {
			const html = `<!DOCTYPE html>
				<html lang="en">
					<head>
						<meta charset="UTF-8">
						<title>Test Page</title>
					</head>
					<body>
						<h1>Welcome</h1>
						<p>Content here</p>
					</body>
				</html>`;
			const result = highlightHTML(html);

			// DOCTYPE
			assert.ok(result.includes('<span class="text-muted">'));

			// Tag names
			assert.ok(result.includes('<span class="text-primary">html</span>'));
			assert.ok(result.includes('<span class="text-primary">head</span>'));
			assert.ok(result.includes('<span class="text-primary">body</span>'));
			assert.ok(result.includes('<span class="text-primary">meta</span>'));

			// Attributes
			assert.ok(result.includes('<span class="text-info">lang</span>'));
			assert.ok(result.includes('<span class="text-info">charset</span>'));

			// Content
			assert.ok(result.includes("Welcome"));
			assert.ok(result.includes("Content here"));
		});

		it("should handle form elements", () => {
			const html = `<form action="/submit" method="post">
				<label for="name">Name:</label>
				<input type="text" id="name" name="name" required>
				<textarea rows="4" cols="50"></textarea>
				<button type="submit">Submit</button>
			</form>`;
			const result = highlightHTML(html);

			assert.ok(result.includes('<span class="text-primary">form</span>'));
			assert.ok(result.includes('<span class="text-primary">input</span>'));
			assert.ok(result.includes('<span class="text-primary">textarea</span>'));
			assert.ok(result.includes('<span class="text-info">action</span>'));
			assert.ok(result.includes('<span class="text-info">method</span>'));
			assert.ok(result.includes('<span class="text-info">required</span>'));
		});

		it("should handle SVG and embedded content", () => {
			const html = `<svg width="100" height="100">
				<circle cx="50" cy="50" r="40" fill="red" />
			</svg>`;
			const result = highlightHTML(html);

			assert.ok(result.includes('<span class="text-primary">svg</span>'));
			assert.ok(result.includes('<span class="text-primary">circle</span>'));
			assert.ok(result.includes('<span class="text-info">width</span>'));
			assert.ok(result.includes('<span class="text-info">fill</span>'));
		});

		it("should handle mixed content with comments and entities", () => {
			const html = `<!-- Page header -->
				<header>
					<h1>Company &amp; Co.</h1>
					<!-- Navigation will go here -->
					<nav class="main-nav">
						<a href="/">Home</a>
						<a href="/about">About &nbsp; Us</a>
					</nav>
				</header>`;
			const result = highlightHTML(html);

			// Comments
			assert.ok(
				result.includes(
					'<span class="text-muted">&lt;!-- Page header --&gt;</span>',
				),
			);

			// Entities
			assert.ok(result.includes('<span class="text-warning">&amp;amp;</span>'));
			assert.ok(
				result.includes('<span class="text-warning">&amp;nbsp;</span>'),
			);

			// Tags and attributes
			assert.ok(result.includes('<span class="text-primary">header</span>'));
			assert.ok(result.includes('<span class="text-primary">nav</span>'));
			assert.ok(result.includes('<span class="text-info">class</span>'));
			assert.ok(result.includes('<span class="text-info">href</span>'));
		});
	});

	describe("Edge Cases", () => {
		it("should handle malformed HTML gracefully", () => {
			const html = "<div class= <p>unclosed <br>";
			const result = highlightHTML(html);
			assert.ok(typeof result === "string");
			assert.ok(result.length > 0);
		});

		it("should preserve whitespace", () => {
			const html = "  <div>  content  </div>  ";
			const result = highlightHTML(html);
			// Should maintain spacing structure
			assert.ok(result.startsWith("  "));
			assert.ok(result.endsWith("  "));
		});

		it("should handle empty attributes", () => {
			const html = '<input type="text" disabled checked="">';
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-info">disabled</span>'));
			assert.ok(result.includes('<span class="text-info">checked</span>'));
		});

		it("should handle unusual but valid tag names", () => {
			const html = "<custom-element data-value='test'></custom-element>";
			const result = highlightHTML(html);
			assert.ok(
				result.includes('<span class="text-primary">custom-element</span>'),
			);
		});

		it("should handle nested quotes in attributes", () => {
			const html = `<div title='He said "Hello" to me'>`;
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-info">title</span>'));
			assert.ok(result.includes('<span class="text-success">'));
		});

		it("should handle incomplete entities", () => {
			const html = "Test &incomplete and &amp; complete";
			const result = highlightHTML(html);
			assert.ok(
				result.includes('<span class="text-warning">&amp;incomplete</span>'),
			);
			assert.ok(result.includes('<span class="text-warning">&amp;amp;</span>'));
		});

		it("should handle script and style tag content", () => {
			const html =
				"<script>var x = 5;</script><style>div { color: red; }</style>";
			const result = highlightHTML(html);
			assert.ok(result.includes('<span class="text-primary">script</span>'));
			assert.ok(result.includes('<span class="text-primary">style</span>'));
			// Content inside should be treated as text (not highlighted)
			assert.ok(result.includes("var x = 5;"));
			assert.ok(result.includes("div { color: red; }"));
		});
	});
});
