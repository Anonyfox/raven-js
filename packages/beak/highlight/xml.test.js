/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for XML syntax highlighter
 *
 * Comprehensive test coverage for XML tokenization, syntax highlighting,
 * Bootstrap class mapping, and edge cases with 100% branch coverage.
 */

import { strictEqual, throws } from "node:assert";
import { describe, test } from "node:test";
import { highlightXML } from "./xml.js";

// Helper to create expected span with class
const span = (className, content) =>
	`<span class="${className}">${content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")}</span>`;

// Helper to create expected output without escaping
const spanRaw = (className, content) =>
	`<span class="${className}">${content}</span>`;

describe("XML Syntax Highlighter", () => {
	describe("Input Validation", () => {
		test("throws TypeError for non-string input", () => {
			throws(() => highlightXML(null), {
				name: "TypeError",
				message: "XML source must be a string",
			});
			throws(() => highlightXML(42), {
				name: "TypeError",
				message: "XML source must be a string",
			});
			throws(() => highlightXML({}), {
				name: "TypeError",
				message: "XML source must be a string",
			});
		});

		test("returns empty string for empty/whitespace input", () => {
			strictEqual(highlightXML(""), "");
			strictEqual(highlightXML("   "), "");
			strictEqual(highlightXML("\n\t\r"), "");
		});
	});

	describe("Basic XML Elements", () => {
		test("simple opening and closing tags", () => {
			const xml = `<root>content</root>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "root") +
				spanRaw("text-secondary", "&gt;") +
				"content" +
				spanRaw("text-secondary", "&lt;") +
				spanRaw("text-secondary", "/") +
				span("text-primary", "root") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});

		test("self-closing tags", () => {
			const xml = `<empty/>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "empty") +
				spanRaw("text-secondary", "/") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});

		test("nested elements", () => {
			const xml = `<parent><child>text</child></parent>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "parent") +
				spanRaw("text-secondary", "&gt;") +
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "child") +
				spanRaw("text-secondary", "&gt;") +
				"text" +
				spanRaw("text-secondary", "&lt;") +
				spanRaw("text-secondary", "/") +
				span("text-primary", "child") +
				spanRaw("text-secondary", "&gt;") +
				spanRaw("text-secondary", "&lt;") +
				spanRaw("text-secondary", "/") +
				span("text-primary", "parent") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});

		test("elements with namespaces", () => {
			const xml = `<ns:element xmlns:ns="uri"/>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "ns:element") +
				" " +
				span("text-info", "xmlns:ns") +
				spanRaw("text-secondary", "=") +
				span("text-success", '"uri"') +
				spanRaw("text-secondary", "/") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});
	});

	describe("Attributes", () => {
		test("simple attributes", () => {
			const xml = `<tag attr="value"/>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "tag") +
				" " +
				span("text-info", "attr") +
				spanRaw("text-secondary", "=") +
				span("text-success", '"value"') +
				spanRaw("text-secondary", "/") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});

		test("multiple attributes", () => {
			const xml = `<tag id="123" class="test" enabled="true"/>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "tag") +
				" " +
				span("text-info", "id") +
				spanRaw("text-secondary", "=") +
				span("text-success", '"123"') +
				" " +
				span("text-info", "class") +
				spanRaw("text-secondary", "=") +
				span("text-success", '"test"') +
				" " +
				span("text-info", "enabled") +
				spanRaw("text-secondary", "=") +
				span("text-success", '"true"') +
				spanRaw("text-secondary", "/") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});

		test("attributes with single quotes", () => {
			const xml = `<tag attr='single'/>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "tag") +
				" " +
				span("text-info", "attr") +
				spanRaw("text-secondary", "=") +
				span("text-success", "'single'") +
				spanRaw("text-secondary", "/") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});

		test("attributes with whitespace", () => {
			const xml = `<tag  attr  =  "value"  />`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "tag") +
				"  " +
				span("text-info", "attr") +
				"  " +
				spanRaw("text-secondary", "=") +
				"  " +
				span("text-success", '"value"') +
				"  " +
				spanRaw("text-secondary", "/") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});
	});

	describe("XML Comments", () => {
		test("simple comments", () => {
			const xml = `<!-- This is a comment -->`;
			const expected = span("text-muted", "<!-- This is a comment -->");
			strictEqual(highlightXML(xml), expected);
		});

		test("multiline comments", () => {
			const xml = `<!-- This is a\nmultiline comment -->`;
			const expected = span(
				"text-muted",
				"<!-- This is a\nmultiline comment -->",
			);
			strictEqual(highlightXML(xml), expected);
		});

		test("comments with special characters", () => {
			const xml = `<!-- Comment with <tags> & "quotes" -->`;
			const expected = span(
				"text-muted",
				'<!-- Comment with <tags> & "quotes" -->',
			);
			strictEqual(highlightXML(xml), expected);
		});

		test("comments mixed with elements", () => {
			const xml = `<root><!-- comment --><child/></root>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "root") +
				spanRaw("text-secondary", "&gt;") +
				span("text-muted", "<!-- comment -->") +
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "child") +
				spanRaw("text-secondary", "/") +
				spanRaw("text-secondary", "&gt;") +
				spanRaw("text-secondary", "&lt;") +
				spanRaw("text-secondary", "/") +
				span("text-primary", "root") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});
	});

	describe("Processing Instructions", () => {
		test("XML declaration", () => {
			const xml = `<?xml version="1.0" encoding="UTF-8"?>`;
			const expected = span(
				"text-warning",
				'<?xml version="1.0" encoding="UTF-8"?>',
			);
			strictEqual(highlightXML(xml), expected);
		});

		test("stylesheet processing instruction", () => {
			const xml = `<?xml-stylesheet type="text/xsl" href="style.xsl"?>`;
			const expected = span(
				"text-warning",
				'<?xml-stylesheet type="text/xsl" href="style.xsl"?>',
			);
			strictEqual(highlightXML(xml), expected);
		});

		test("custom processing instruction", () => {
			const xml = `<?target instruction data?>`;
			const expected = span("text-warning", "<?target instruction data?>");
			strictEqual(highlightXML(xml), expected);
		});
	});

	describe("CDATA Sections", () => {
		test("simple CDATA", () => {
			const xml = `<![CDATA[raw text data]]>`;
			const expected = span("text-warning", "<![CDATA[raw text data]]>");
			strictEqual(highlightXML(xml), expected);
		});

		test("CDATA with special characters", () => {
			const xml = `<![CDATA[<script>alert("xss")</script>]]>`;
			const expected = span(
				"text-warning",
				'<![CDATA[<script>alert("xss")</script>]]>',
			);
			strictEqual(highlightXML(xml), expected);
		});

		test("CDATA with newlines", () => {
			const xml = `<![CDATA[
				multiline
				data
			]]>`;
			const expected = span(
				"text-warning",
				"<![CDATA[\n\t\t\t\tmultiline\n\t\t\t\tdata\n\t\t\t]]>",
			);
			strictEqual(highlightXML(xml), expected);
		});

		test("CDATA mixed with elements", () => {
			const xml = `<root><![CDATA[data]]><child/></root>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "root") +
				spanRaw("text-secondary", "&gt;") +
				span("text-warning", "<![CDATA[data]]>") +
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "child") +
				spanRaw("text-secondary", "/") +
				spanRaw("text-secondary", "&gt;") +
				spanRaw("text-secondary", "&lt;") +
				spanRaw("text-secondary", "/") +
				span("text-primary", "root") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});
	});

	describe("DOCTYPE Declarations", () => {
		test("simple DOCTYPE", () => {
			const xml = `<!DOCTYPE root>`;
			const expected = span("text-muted", "<!DOCTYPE root>");
			strictEqual(highlightXML(xml), expected);
		});

		test("DOCTYPE with PUBLIC identifier", () => {
			const xml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">`;
			const expected = span(
				"text-muted",
				'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
			);
			strictEqual(highlightXML(xml), expected);
		});

		test("DOCTYPE with SYSTEM identifier", () => {
			const xml = `<!DOCTYPE root SYSTEM "external.dtd">`;
			const expected = span(
				"text-muted",
				'<!DOCTYPE root SYSTEM "external.dtd">',
			);
			strictEqual(highlightXML(xml), expected);
		});
	});

	describe("XML Entities", () => {
		test("named entities", () => {
			const xml = `<text>&lt;&gt;&amp;&quot;&apos;</text>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "text") +
				spanRaw("text-secondary", "&gt;") +
				span("text-warning", "&lt;") +
				span("text-warning", "&gt;") +
				span("text-warning", "&amp;") +
				span("text-warning", "&quot;") +
				span("text-warning", "&apos;") +
				spanRaw("text-secondary", "&lt;") +
				spanRaw("text-secondary", "/") +
				span("text-primary", "text") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});

		test("numeric entities", () => {
			const xml = `<text>&#65;&#x41;</text>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "text") +
				spanRaw("text-secondary", "&gt;") +
				span("text-warning", "&#65;") +
				span("text-warning", "&#x41;") +
				spanRaw("text-secondary", "&lt;") +
				spanRaw("text-secondary", "/") +
				span("text-primary", "text") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});

		test("custom entities", () => {
			const xml = `<text>&custom;&nbsp;</text>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "text") +
				spanRaw("text-secondary", "&gt;") +
				span("text-warning", "&custom;") +
				span("text-warning", "&nbsp;") +
				spanRaw("text-secondary", "&lt;") +
				spanRaw("text-secondary", "/") +
				span("text-primary", "text") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});
	});

	describe("Text Content", () => {
		test("simple text content", () => {
			const xml = `<text>Hello World</text>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "text") +
				spanRaw("text-secondary", "&gt;") +
				"Hello" +
				" " +
				"World" +
				spanRaw("text-secondary", "&lt;") +
				spanRaw("text-secondary", "/") +
				span("text-primary", "text") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});

		test("mixed content", () => {
			const xml = `<root>Text <child>nested</child> more text</root>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "root") +
				spanRaw("text-secondary", "&gt;") +
				"Text" +
				" " +
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "child") +
				spanRaw("text-secondary", "&gt;") +
				"nested" +
				spanRaw("text-secondary", "&lt;") +
				spanRaw("text-secondary", "/") +
				span("text-primary", "child") +
				spanRaw("text-secondary", "&gt;") +
				" " +
				"more" +
				" " +
				"text" +
				spanRaw("text-secondary", "&lt;") +
				spanRaw("text-secondary", "/") +
				span("text-primary", "root") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});

		test("whitespace handling", () => {
			const xml = `<root>\n  <child/>\n</root>`;
			const expected =
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "root") +
				spanRaw("text-secondary", "&gt;") +
				"\n  " +
				spanRaw("text-secondary", "&lt;") +
				span("text-primary", "child") +
				spanRaw("text-secondary", "/") +
				spanRaw("text-secondary", "&gt;") +
				"\n" +
				spanRaw("text-secondary", "&lt;") +
				spanRaw("text-secondary", "/") +
				span("text-primary", "root") +
				spanRaw("text-secondary", "&gt;");
			strictEqual(highlightXML(xml), expected);
		});
	});

	describe("Complex XML Documents", () => {
		test("complete XML document with declaration", () => {
			const xml = `<?xml version="1.0"?>
<root xmlns="default" xmlns:ns="uri">
  <!-- Root element -->
  <ns:child attr="value">Text &amp; entities</ns:child>
  <empty/>
</root>`;
			const result = highlightXML(xml);

			// Verify that all major components are highlighted
			strictEqual(result.includes('class="text-warning"'), true); // Processing instruction
			strictEqual(result.includes('class="text-primary"'), true); // Tag names
			strictEqual(result.includes('class="text-info"'), true); // Attribute names
			strictEqual(result.includes('class="text-success"'), true); // Attribute values
			strictEqual(result.includes('class="text-muted"'), true); // Comments
			strictEqual(result.includes('class="text-secondary"'), true); // Punctuation
		});

		test("malformed XML handling", () => {
			const xml = `<unclosed><nested>content</unclosed>`;
			const result = highlightXML(xml);

			// Should still highlight what it can parse
			strictEqual(result.includes('class="text-primary"'), true);
			strictEqual(result.includes('class="text-secondary"'), true);
		});
	});

	describe("Edge Cases", () => {
		test("empty tags", () => {
			const xml = `<></>`;
			const result = highlightXML(xml);
			strictEqual(result.includes('class="text-secondary"'), true);
		});

		test("special characters in content", () => {
			const xml = `<test>&lt;script&gt;alert("xss")&lt;/script&gt;</test>`;
			const result = highlightXML(xml);
			// Should contain highlighted entities
			strictEqual(result.includes('class="text-warning"'), true);
		});

		test("deeply nested structures", () => {
			const xml = `<a><b><c><d><e>deep</e></d></c></b></a>`;
			const result = highlightXML(xml);

			// Should contain properly highlighted nested structure
			strictEqual(result.includes('class="text-primary"'), true); // Tag names
			strictEqual(result.includes('class="text-secondary"'), true); // Punctuation
			strictEqual(result.includes("deep"), true); // Text content
		});
	});
});
