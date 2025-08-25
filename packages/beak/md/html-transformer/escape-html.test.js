import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { escapeHTML } from "./escape-html.js";

describe("HTML Escape Utility", () => {
	it("should escape HTML special characters", () => {
		assert.equal(escapeHTML("&"), "&amp;");
		assert.equal(escapeHTML("<"), "&lt;");
		assert.equal(escapeHTML(">"), "&gt;");
		assert.equal(escapeHTML('"'), "&quot;");
		assert.equal(escapeHTML("'"), "&#39;");
		assert.equal(
			escapeHTML("<script>alert('xss')</script>"),
			"&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
		);
		assert.equal(escapeHTML('He said "Hello"'), "He said &quot;Hello&quot;");
	});

	it("should handle non-string inputs and edge cases", () => {
		assert.equal(escapeHTML(null), "null");
		assert.equal(escapeHTML(undefined), "undefined");
		assert.equal(escapeHTML(123), "123");
		assert.equal(escapeHTML(true), "true");
		assert.equal(escapeHTML(""), "");
		assert.equal(escapeHTML("Hello World"), "Hello World");
		assert.equal(escapeHTML("Hello & World"), "Hello &amp; World");
	});
});
