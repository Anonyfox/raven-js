import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
	escapeMap,
	escapeSpecialCharacters,
} from "./escape-special-characters.js";

describe("escapeMap", () => {
	it("should contain all required HTML special characters", () => {
		assert.deepEqual(escapeMap, {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"'": "&#39;",
			'"': "&quot;",
		});
	});

	it("should have exactly 5 mappings", () => {
		assert.equal(Object.keys(escapeMap).length, 5);
	});

	it("should have characters that can be safely used in regex", () => {
		// All characters in escapeMap should be safe for regex character classes
		const safeChars = Object.keys(escapeMap).every(
			(char) => !/[.*+?^${}()|[\]\\]/.test(char),
		);
		assert.ok(safeChars, "All escapeMap characters should be safe for regex");
	});
});

describe("escapeSpecialCharacters", () => {
	describe("basic HTML special characters", () => {
		it("should escape ampersand", () => {
			assert.equal(escapeSpecialCharacters("&"), "&amp;");
		});

		it("should escape less than", () => {
			assert.equal(escapeSpecialCharacters("<"), "&lt;");
		});

		it("should escape greater than", () => {
			assert.equal(escapeSpecialCharacters(">"), "&gt;");
		});

		it("should escape single quote", () => {
			assert.equal(escapeSpecialCharacters("'"), "&#39;");
		});

		it("should escape double quote", () => {
			assert.equal(escapeSpecialCharacters('"'), "&quot;");
		});
	});

	describe("multiple special characters", () => {
		it("should escape all special characters in a string", () => {
			assert.equal(
				escapeSpecialCharacters('<script>alert("XSS")</script>'),
				"&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;",
			);
		});

		it("should escape mixed content", () => {
			assert.equal(
				escapeSpecialCharacters('Hello & welcome to "RavenJS"!'),
				"Hello &amp; welcome to &quot;RavenJS&quot;!",
			);
		});

		it("should handle consecutive special characters", () => {
			assert.equal(
				escapeSpecialCharacters("<<<>>>"),
				"&lt;&lt;&lt;&gt;&gt;&gt;",
			);
		});
	});

	describe("edge cases", () => {
		it("should handle empty string", () => {
			assert.equal(escapeSpecialCharacters(""), "");
		});

		it("should handle string with no special characters", () => {
			assert.equal(escapeSpecialCharacters("Hello World"), "Hello World");
		});

		it("should handle string with only special characters", () => {
			assert.equal(
				escapeSpecialCharacters("&<>\"'"),
				"&amp;&lt;&gt;&quot;&#39;",
			);
		});

		it("should handle single character strings", () => {
			assert.equal(escapeSpecialCharacters("a"), "a");
			assert.equal(escapeSpecialCharacters("&"), "&amp;");
		});

		it("should handle very long strings", () => {
			const longString = `${"a".repeat(1000)}&${"b".repeat(1000)}`;
			const expected = `${"a".repeat(1000)}&amp;${"b".repeat(1000)}`;
			assert.equal(escapeSpecialCharacters(longString), expected);
		});
	});

	describe("non-string inputs", () => {
		it("should handle null", () => {
			assert.equal(escapeSpecialCharacters(null), "null");
		});

		it("should handle undefined", () => {
			assert.equal(escapeSpecialCharacters(undefined), "undefined");
		});

		it("should handle numbers", () => {
			assert.equal(escapeSpecialCharacters(42), "42");
			assert.equal(escapeSpecialCharacters(0), "0");
			assert.equal(escapeSpecialCharacters(-1), "-1");
		});

		it("should handle boolean values", () => {
			assert.equal(escapeSpecialCharacters(true), "true");
			assert.equal(escapeSpecialCharacters(false), "false");
		});

		it("should handle objects", () => {
			assert.equal(
				escapeSpecialCharacters({ key: "value" }),
				"[object Object]",
			);
		});

		it("should handle arrays", () => {
			assert.equal(escapeSpecialCharacters([1, 2, 3]), "1,2,3");
		});

		it("should handle functions", () => {
			const func = () => {};
			const result = escapeSpecialCharacters(func);
			// Functions get converted to their string representation
			assert.ok(result.length > 0);
			assert.ok(typeof result === "string");
		});
	});

	describe("Unicode and special characters", () => {
		it("should handle Unicode characters", () => {
			assert.equal(escapeSpecialCharacters("🦜"), "🦜");
			assert.equal(escapeSpecialCharacters("café"), "café");
			assert.equal(escapeSpecialCharacters("привет"), "привет");
		});

		it("should handle Unicode with HTML special characters", () => {
			assert.equal(
				escapeSpecialCharacters("🦜 & <script>"),
				"🦜 &amp; &lt;script&gt;",
			);
		});

		it("should handle emojis with special characters", () => {
			assert.equal(escapeSpecialCharacters("🦜 & 🦅"), "🦜 &amp; 🦅");
		});
	});

	describe("real-world XSS scenarios", () => {
		it("should escape script tags", () => {
			assert.equal(
				escapeSpecialCharacters("<script>alert('XSS')</script>"),
				"&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;",
			);
		});

		it("should escape event handlers", () => {
			assert.equal(
				escapeSpecialCharacters("onclick=\"alert('XSS')\""),
				"onclick=&quot;alert(&#39;XSS&#39;)&quot;",
			);
		});

		it("should escape iframe tags", () => {
			assert.equal(
				escapeSpecialCharacters(
					"<iframe src=\"javascript:alert('XSS')\"></iframe>",
				),
				"&lt;iframe src=&quot;javascript:alert(&#39;XSS&#39;)&quot;&gt;&lt;/iframe&gt;",
			);
		});

		it("should escape img tags with javascript", () => {
			assert.equal(
				escapeSpecialCharacters('<img src="x" onerror="alert(\'XSS\')">'),
				"&lt;img src=&quot;x&quot; onerror=&quot;alert(&#39;XSS&#39;)&quot;&gt;",
			);
		});

		it("should escape complex XSS payload", () => {
			const payload =
				'<img src="x" onerror="alert(\'XSS\')" alt="&lt;script&gt;alert(\'XSS\')&lt;/script&gt;">';
			assert.equal(
				escapeSpecialCharacters(payload),
				"&lt;img src=&quot;x&quot; onerror=&quot;alert(&#39;XSS&#39;)&quot; alt=&quot;&amp;lt;script&amp;gt;alert(&#39;XSS&#39;)&amp;lt;/script&amp;gt;&quot;&gt;",
			);
		});
	});

	describe("performance edge cases", () => {
		it("should handle strings with many special characters", () => {
			const manySpecials = "&".repeat(1000);
			const expected = "&amp;".repeat(1000);
			assert.equal(escapeSpecialCharacters(manySpecials), expected);
		});

		it("should handle alternating special and normal characters", () => {
			const alternating = "a&b<c>d\"e'f".repeat(100);
			const expected = "a&amp;b&lt;c&gt;d&quot;e&#39;f".repeat(100);
			assert.equal(escapeSpecialCharacters(alternating), expected);
		});
	});
});
