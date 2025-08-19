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
import { isInlineElement, tryParseInlineHTML } from "./inline-html-parser.js";

describe("Inline HTML Parser", () => {
	describe("tryParseInlineHTML", () => {
		it("should parse self-closing tags", () => {
			const tests = [
				{ input: "<br/>", expected: "<br/>" },
				{ input: "<hr />", expected: "<hr />" },
				{
					input: '<img src="test.jpg" alt="test" />',
					expected: '<img src="test.jpg" alt="test" />',
				},
				{ input: "<input type='text'/>", expected: "<input type='text'/>" },
			];

			for (const { input, expected } of tests) {
				const result = tryParseInlineHTML(input, 0);
				assert.ok(result, `Should parse ${input}`);
				assert.equal(result.node.type, NODE_TYPES.INLINE_HTML);
				assert.equal(result.node.html, expected);
				assert.equal(result.start, 0);
				assert.equal(result.end, input.length);
			}
		});

		it("should parse paired tags with content", () => {
			const tests = [
				{ input: "<strong>bold</strong>", expected: "<strong>bold</strong>" },
				{ input: "<em>italic</em>", expected: "<em>italic</em>" },
				{ input: "<span>text</span>", expected: "<span>text</span>" },
				{ input: '<a href="url">link</a>', expected: '<a href="url">link</a>' },
				{ input: "<code>code</code>", expected: "<code>code</code>" },
			];

			for (const { input, expected } of tests) {
				const result = tryParseInlineHTML(input, 0);
				assert.ok(result, `Should parse ${input}`);
				assert.equal(result.node.type, NODE_TYPES.INLINE_HTML);
				assert.equal(result.node.html, expected);
				assert.equal(result.start, 0);
				assert.equal(result.end, input.length);
			}
		});

		it("should parse tags with attributes", () => {
			const tests = [
				{
					input: '<span class="highlight">text</span>',
					expected: '<span class="highlight">text</span>',
				},
				{
					input: '<a href="https://example.com" target="_blank">link</a>',
					expected: '<a href="https://example.com" target="_blank">link</a>',
				},
				{
					input: '<div id="test" data-value="123">content</div>',
					expected: '<div id="test" data-value="123">content</div>',
				},
			];

			for (const { input, expected } of tests) {
				const result = tryParseInlineHTML(input, 0);
				assert.ok(result, `Should parse ${input}`);
				assert.equal(result.node.html, expected);
			}
		});

		it("should handle case-insensitive tag matching", () => {
			const result = tryParseInlineHTML("<STRONG>text</strong>", 0);
			assert.ok(result);
			assert.equal(result.node.html, "<STRONG>text</strong>");
		});

		it("should parse from different start positions", () => {
			const text = "Hello <strong>world</strong> there";
			const result = tryParseInlineHTML(text, 6);

			assert.ok(result);
			assert.equal(result.node.html, "<strong>world</strong>");
			assert.equal(result.start, 6);
			assert.equal(result.end, 28); // 6 + 22 characters in "<strong>world</strong>"
		});

		it("should return null for unclosed tags", () => {
			const tests = [
				"<strong>unclosed",
				"<em>no closing tag",
				"<span>missing end",
			];

			for (const test of tests) {
				const result = tryParseInlineHTML(test, 0);
				assert.equal(result, null, `Should not parse ${test}`);
			}
		});

		it("should return null for malformed tags", () => {
			const tests = [
				"< strong>space before tag name",
				"<>empty tag",
				"<123>numeric tag",
				"not html",
				"just text",
			];

			for (const test of tests) {
				const result = tryParseInlineHTML(test, 0);
				assert.equal(result, null, `Should not parse ${test}`);
			}
		});

		it("should return null when not starting with <", () => {
			const result = tryParseInlineHTML("text <strong>bold</strong>", 0);
			assert.equal(result, null);
		});

		it("should handle empty content in paired tags", () => {
			const result = tryParseInlineHTML("<strong></strong>", 0);
			assert.ok(result);
			assert.equal(result.node.html, "<strong></strong>");
		});

		it("should handle nested quotes in attributes", () => {
			const input = '<a href="url" title="Link \\"with\\" quotes">text</a>';
			const result = tryParseInlineHTML(input, 0);
			assert.ok(result);
			assert.equal(result.node.html, input);
		});

		it("should handle special characters in content", () => {
			const input = "<em>content with & < > symbols</em>";
			const result = tryParseInlineHTML(input, 0);
			assert.ok(result);
			assert.equal(result.node.html, input);
		});

		it("should handle multiple attributes", () => {
			const input =
				'<span class="test" id="span1" data-value="123" title="tooltip">content</span>';
			const result = tryParseInlineHTML(input, 0);
			assert.ok(result);
			assert.equal(result.node.html, input);
		});

		it("should parse tags with dashes and numbers", () => {
			const tests = [
				"<custom-element>content</custom-element>",
				"<h1>heading</h1>",
				"<data-123>content</data-123>",
			];

			for (const test of tests) {
				const result = tryParseInlineHTML(test, 0);
				assert.ok(result, `Should parse ${test}`);
				assert.equal(result.node.html, test);
			}
		});
	});

	describe("isInlineElement", () => {
		it("should identify inline elements correctly", () => {
			const inlineElements = [
				"span",
				"a",
				"em",
				"strong",
				"code",
				"small",
				"b",
				"i",
				"u",
				"s",
				"mark",
				"del",
				"ins",
				"sub",
				"sup",
				"q",
				"cite",
				"abbr",
				"time",
				"kbd",
				"samp",
				"var",
				"dfn",
				"bdi",
				"bdo",
				"ruby",
				"rt",
				"rp",
			];

			for (const element of inlineElements) {
				assert.ok(isInlineElement(element), `${element} should be inline`);
			}
		});

		it("should handle case-insensitive tag names", () => {
			assert.ok(isInlineElement("SPAN"));
			assert.ok(isInlineElement("Strong"));
			assert.ok(isInlineElement("EM"));
		});

		it("should reject block elements", () => {
			const blockElements = [
				"div",
				"p",
				"section",
				"article",
				"header",
				"footer",
			];

			for (const element of blockElements) {
				assert.ok(!isInlineElement(element), `${element} should not be inline`);
			}
		});

		it("should reject unknown elements", () => {
			const unknownElements = ["unknown", "custom", "notreal"];

			for (const element of unknownElements) {
				assert.ok(!isInlineElement(element), `${element} should not be inline`);
			}
		});
	});
});
