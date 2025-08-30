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
