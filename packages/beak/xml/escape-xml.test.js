/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { escapeCdata, escapeXml } from "./escape-xml.js";

describe("XML escaping engine", () => {
	describe("escapeXml", () => {
		it("handles clean content fast path", () => {
			assert.equal(escapeXml("clean content"), "clean content");
			assert.equal(escapeXml(""), "");
			assert.equal(escapeXml("NoEntitiesHere123"), "NoEntitiesHere123");
		});

		it("escapes all five XML entities", () => {
			assert.equal(escapeXml("&"), "&amp;");
			assert.equal(escapeXml("<"), "&lt;");
			assert.equal(escapeXml(">"), "&gt;");
			assert.equal(escapeXml('"'), "&quot;");
			assert.equal(escapeXml("'"), "&apos;");
		});

		it("escapes multiple entities in single string", () => {
			assert.equal(
				escapeXml(`<tag attr="value's & content">`),
				"&lt;tag attr=&quot;value&apos;s &amp; content&quot;&gt;",
			);
		});

		it("handles mixed clean and entity content", () => {
			assert.equal(escapeXml("before & after"), "before &amp; after");
			assert.equal(escapeXml("start<middle>end"), "start&lt;middle&gt;end");
		});

		it("handles edge cases", () => {
			assert.equal(escapeXml("&amp;"), "&amp;amp;"); // Double escaping
			assert.equal(escapeXml("&<>\"'"), "&amp;&lt;&gt;&quot;&apos;");
			assert.equal(escapeXml("only at end &"), "only at end &amp;");
			assert.equal(escapeXml("& only at start"), "&amp; only at start");
		});

		it("converts non-strings correctly", () => {
			assert.equal(escapeXml(123), "123");
			assert.equal(escapeXml(true), "true");
			assert.equal(escapeXml(null), "null");
			assert.equal(escapeXml(undefined), "undefined");
			assert.equal(
				escapeXml({ toString: () => "test & value" }),
				"test &amp; value",
			);
		});

		it("handles string ending with entity (branch coverage)", () => {
			// This hits the edge case where last >= stringValue.length (string ends with escaped char)
			assert.equal(escapeXml("test&"), "test&amp;");
			assert.equal(escapeXml("hello'"), "hello&apos;");
			assert.equal(escapeXml("data<"), "data&lt;");

			// Edge case: consecutive entities where last === i (no slice needed)
			assert.equal(escapeXml("&&"), "&amp;&amp;"); // Consecutive ampersands
			assert.equal(escapeXml("''"), "&apos;&apos;"); // Consecutive apostrophes
		});

		it("surgical branch coverage for ternary return conditions", () => {
			// Test last === 0 branch (line 75-76): no replacements made, return original
			assert.equal(escapeXml("clean"), "clean");

			// Test last < stringValue.length branch (line 77-78): has trailing content after last replacement
			assert.equal(escapeXml("&clean"), "&amp;clean");
			assert.equal(escapeXml("start&middle"), "start&amp;middle");

			// Test final else branch (line 79): string ends with replacement, no trailing content
			assert.equal(escapeXml("content&"), "content&amp;");
			assert.equal(escapeXml("prefix<"), "prefix&lt;");
		});

		it("surgical branch coverage for slice conditions", () => {
			// Test last !== i branch in line 69: content between replacements
			assert.equal(escapeXml("a&b&c"), "a&amp;b&amp;c");

			// Test adjacent entities: last === i case (no content slice needed)
			assert.equal(escapeXml("&<"), "&amp;&lt;");
			assert.equal(escapeXml(">'"), "&gt;&apos;");
		});

		it("surgical branch coverage for all character code paths", () => {
			// Test each character code branch explicitly
			// ch === 38 (&): covered above
			// ch === 60 (<): covered above
			// ch === 62 (>): covered above
			// ch === 34 ("): covered above
			// ch === 39 ('): covered above

			// Test with string that triggers regex match but has non-escapable chars
			// This should hit the character checks but not match any escape conditions
			assert.equal(escapeXml("test&normal"), "test&amp;normal");

			// Ensure all character codes are tested in different positions
			assert.equal(escapeXml('prefix"suffix'), "prefix&quot;suffix");
			assert.equal(escapeXml("before>after"), "before&gt;after");

			// Test early termination conditions more precisely
			assert.equal(escapeXml("X&"), "X&amp;"); // Test exact string ending condition
		});

		it("surgical coverage for return ternary edge cases", () => {
			// Trying to hit the specific ternary branches more precisely

			// Case 1: last === 0 - This may be impossible given the logic, but test edge cases
			// Since if regex matches, we will find a replacement. But let's try empty cases.
			assert.equal(escapeXml(""), ""); // Empty string (fast path)

			// Case 2: last < stringValue.length - content after last replacement
			assert.equal(escapeXml("&xyz"), "&amp;xyz");
			assert.equal(escapeXml("<text"), "&lt;text");

			// Case 3: last >= stringValue.length - string ends with replacement
			assert.equal(escapeXml("word&"), "word&amp;");
			assert.equal(escapeXml("text'"), "text&apos;");

			// Test exact boundary case: single character that needs escaping
			assert.equal(escapeXml("&"), "&amp;");
		});
	});

	describe("escapeCdata", () => {
		it("handles clean content fast path", () => {
			assert.equal(escapeCdata("clean content"), "clean content");
			assert.equal(escapeCdata(""), "");
			assert.equal(
				escapeCdata("no problematic sequences"),
				"no problematic sequences",
			);
		});

		it("escapes CDATA termination sequence", () => {
			assert.equal(
				escapeCdata("content with ]]> terminator"),
				"content with ]]]]><![CDATA[> terminator",
			);
		});

		it("handles multiple CDATA terminators", () => {
			assert.equal(
				escapeCdata("]]>middle]]>"),
				"]]]]><![CDATA[>middle]]]]><![CDATA[>",
			);
		});

		it("handles edge cases", () => {
			assert.equal(escapeCdata("]]>"), "]]]]><![CDATA[>");
			assert.equal(escapeCdata("start]]>"), "start]]]]><![CDATA[>");
			assert.equal(escapeCdata("]]>end"), "]]]]><![CDATA[>end");
		});

		it("leaves other content untouched", () => {
			assert.equal(
				escapeCdata("<script>alert('test');</script>"),
				"<script>alert('test');</script>",
			);
			assert.equal(escapeCdata("&amp;&lt;&gt;"), "&amp;&lt;&gt;");
		});

		it("converts non-strings correctly", () => {
			assert.equal(escapeCdata(123), "123");
			assert.equal(escapeCdata(null), "null");
			assert.equal(escapeCdata(undefined), "undefined");
			assert.equal(escapeCdata({ toString: () => "]]>" }), "]]]]><![CDATA[>");
		});
	});
});
