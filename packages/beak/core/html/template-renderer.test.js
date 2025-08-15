import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
	_renderHtmlFast,
	_renderSafeHtmlFast,
	_renderTemplate,
	fastNormalize,
	isValidValue,
} from "./template-renderer.js";

describe("isValidValue", () => {
	it("should return true for truthy values", () => {
		assert.ok(isValidValue("hello"));
		assert.ok(isValidValue(42));
		assert.ok(isValidValue(true));
		assert.ok(isValidValue({}));
		assert.ok(isValidValue([]));
		assert.ok(isValidValue(() => {}));
	});

	it("should return true for zero", () => {
		assert.ok(isValidValue(0));
	});

	it("should return false for falsy values except zero", () => {
		assert.ok(!isValidValue(null));
		assert.ok(!isValidValue(undefined));
		assert.ok(!isValidValue(false));
		assert.ok(!isValidValue(""));
		assert.ok(!isValidValue(NaN));
	});
});

describe("fastNormalize", () => {
	it("should normalize basic whitespace", () => {
		assert.equal(fastNormalize("  <div>  </div>  "), "<div></div>");
	});

	it("should collapse whitespace between tags", () => {
		assert.equal(
			fastNormalize("<div>  <span>  </span>  </div>"),
			"<div><span></span></div>",
		);
	});

	it("should remove newlines and leading spaces", () => {
		assert.equal(
			fastNormalize("\n  <div>\n    <span>\n  </span>\n</div>"),
			"<div><span></span></div>",
		);
	});

	it("should handle complex whitespace patterns", () => {
		assert.equal(
			fastNormalize("  <div>\n\t<span>\n  </span>\n\t</div>  "),
			"<div><span></span></div>",
		);
	});

	it("should cache results for repeated strings", () => {
		const input = "  <div>  </div>  ";
		const result1 = fastNormalize(input);
		const result2 = fastNormalize(input);
		assert.equal(result1, result2);
		assert.equal(result1, "<div></div>");
	});

	it("should not cache very long strings", () => {
		const longString = `  ${"a".repeat(1000)}  `;
		const result = fastNormalize(longString);
		assert.equal(result, "a".repeat(1000));
	});

	it("should handle empty strings", () => {
		assert.equal(fastNormalize(""), "");
		assert.equal(fastNormalize("   "), "");
	});

	it("should handle strings with no whitespace", () => {
		assert.equal(fastNormalize("<div></div>"), "<div></div>");
	});
});

describe("_renderTemplate", () => {
	it("should handle no values (fast path)", () => {
		const result = _renderTemplate(["<div>Hello</div>"], []);
		assert.equal(result, "<div>Hello</div>");
	});

	it("should handle single value with truthy value (fast path)", () => {
		const result = _renderTemplate(["<div>Hello ", "</div>"], ["World"]);
		assert.equal(result, "<div>Hello World</div>");
	});

	it("should handle single value with falsy value (fast path)", () => {
		const result = _renderTemplate(["<div>Hello ", "</div>"], [null]);
		assert.equal(result, "<div>Hello </div>");
	});

	it("should handle single value with zero (fast path)", () => {
		const result = _renderTemplate(["<div>Count: ", "</div>"], [0]);
		assert.equal(result, "<div>Count: 0</div>");
	});

	it("should handle single value with escaping (fast path)", () => {
		const escapeFn = (str) => str.toUpperCase();
		const result = _renderTemplate(
			["<div>Hello ", "</div>"],
			["World"],
			escapeFn,
		);
		assert.equal(result, "<div>Hello WORLD</div>");
	});

	it("should handle multiple values (general case)", () => {
		const result = _renderTemplate(
			["<div>", " ", "</div>"],
			["Hello", "World"],
		);
		assert.equal(result, "<div>Hello World</div>");
	});

	it("should handle multiple values with escaping (general case)", () => {
		const escapeFn = (str) => str.toUpperCase();
		const result = _renderTemplate(
			["<div>", " ", " ", "</div>"],
			["Hello", "World", "Test"],
			escapeFn,
		);
		assert.equal(result, "<div>HELLO WORLD TEST</div>");
	});

	it("should handle multiple values with mixed escaping (general case)", () => {
		const escapeFn = (str) => str.replace(/o/g, "0");
		const result = _renderTemplate(
			["<div>", " ", " ", "</div>"],
			["Hello", "World", "Test"],
			escapeFn,
		);
		assert.equal(result, "<div>Hell0 W0rld Test</div>");
	});

	it("should handle many values (general case)", () => {
		const result = _renderTemplate(
			["<div>", " ", " ", " ", " ", "</div>"],
			["A", "B", "C", "D", "E"],
		);
		assert.equal(result, "<div>A B C D E</div>");
	});

	it("should handle multiple values with falsy values", () => {
		const result = _renderTemplate(
			["<div>", " ", " ", "</div>"],
			[null, "World", undefined],
		);
		assert.equal(result, "<div> World </div>");
	});

	it("should handle multiple values with escaping", () => {
		const escapeFn = (str) => str.toUpperCase();
		const result = _renderTemplate(
			["<div>", " ", "</div>"],
			["Hello", "World"],
			escapeFn,
		);
		assert.equal(result, "<div>HELLO WORLD</div>");
	});

	it("should handle complex template with mixed content", () => {
		const result = _renderTemplate(
			["<div>", " ", " ", " ", "</div>"],
			["Hello", null, "World", undefined],
		);
		assert.equal(result, "<div>Hello  World </div>");
	});

	it("should handle whitespace normalization", () => {
		const result = _renderTemplate(
			["  <div>\n    ", "\n    ", "\n  </div>  "],
			["Hello", "World"],
		);
		assert.equal(result, "<div>HelloWorld</div>");
	});

	it("should handle array values", () => {
		const result = _renderTemplate(["<div>", "</div>"], [["Hello", "World"]]);
		assert.equal(result, "<div>HelloWorld</div>");
	});

	it("should handle nested arrays", () => {
		const result = _renderTemplate(
			["<div>", "</div>"],
			[["Hello", [" ", "World"]]],
		);
		assert.equal(result, "<div>Hello World</div>");
	});

	it("should handle objects", () => {
		const result = _renderTemplate(["<div>", "</div>"], [{ name: "John" }]);
		assert.equal(result, "<div>[object Object]</div>");
	});

	it("should handle functions", () => {
		const func = () => "Hello";
		const result = _renderTemplate(["<div>", "</div>"], [func]);
		assert.ok(result.length > 0);
		assert.ok(typeof result === "string");
	});

	it("should handle numbers", () => {
		const result = _renderTemplate(["<div>Count: ", "</div>"], [42]);
		assert.equal(result, "<div>Count: 42</div>");
	});

	it("should handle booleans", () => {
		const result = _renderTemplate(["<div>Flag: ", "</div>"], [true]);
		assert.equal(result, "<div>Flag: true</div>");
	});

	it("should handle zero as valid value", () => {
		const result = _renderTemplate(["<div>Count: ", "</div>"], [0]);
		assert.equal(result, "<div>Count: 0</div>");
	});

	it("should handle empty strings as invalid", () => {
		const result = _renderTemplate(["<div>Text: ", "</div>"], [""]);
		assert.equal(result, "<div>Text: </div>");
	});

	it("should handle null as invalid", () => {
		const result = _renderTemplate(["<div>Text: ", "</div>"], [null]);
		assert.equal(result, "<div>Text: </div>");
	});

	it("should handle undefined as invalid", () => {
		const result = _renderTemplate(["<div>Text: ", "</div>"], [undefined]);
		assert.equal(result, "<div>Text: </div>");
	});

	it("should handle false as invalid", () => {
		const result = _renderTemplate(["<div>Flag: ", "</div>"], [false]);
		assert.equal(result, "<div>Flag: </div>");
	});

	it("should handle NaN as invalid", () => {
		const result = _renderTemplate(["<div>Number: ", "</div>"], [NaN]);
		assert.equal(result, "<div>Number: </div>");
	});
});

describe("_renderHtmlFast", () => {
	it("should handle no values (fast path)", () => {
		const result = _renderHtmlFast(["<div>Hello</div>"], []);
		assert.equal(result, "<div>Hello</div>");
	});

	it("should handle single value with truthy value (fast path)", () => {
		const result = _renderHtmlFast(["<div>Hello ", "</div>"], ["World"]);
		assert.equal(result, "<div>Hello World</div>");
	});

	it("should handle single value with falsy value (fast path)", () => {
		const result = _renderHtmlFast(["<div>Hello ", "</div>"], [null]);
		assert.equal(result, "<div>Hello </div>");
	});

	it("should handle single value with zero (fast path)", () => {
		const result = _renderHtmlFast(["<div>Count: ", "</div>"], [0]);
		assert.equal(result, "<div>Count: 0</div>");
	});

	it("should handle multiple values (general case)", () => {
		const result = _renderHtmlFast(
			["<div>", " ", "</div>"],
			["Hello", "World"],
		);
		assert.equal(result, "<div>Hello World</div>");
	});

	it("should handle many values (general case)", () => {
		const result = _renderHtmlFast(
			["<div>", " ", " ", " ", " ", "</div>"],
			["A", "B", "C", "D", "E"],
		);
		assert.equal(result, "<div>A B C D E</div>");
	});

	it("should handle complex general case", () => {
		const result = _renderHtmlFast(
			["<div>", " ", " ", " ", "</div>"],
			["Hello", "World", "Test", "123"],
		);
		assert.equal(result, "<div>Hello World Test 123</div>");
	});

	it("should handle multiple values with falsy values", () => {
		const result = _renderHtmlFast(
			["<div>", " ", " ", "</div>"],
			[null, "World", undefined],
		);
		assert.equal(result, "<div> World </div>");
	});

	it("should handle complex template with mixed content", () => {
		const result = _renderHtmlFast(
			["<div>", " ", " ", " ", "</div>"],
			["Hello", null, "World", undefined],
		);
		assert.equal(result, "<div>Hello  World </div>");
	});

	it("should handle whitespace normalization", () => {
		const result = _renderHtmlFast(
			["  <div>\n    ", "\n    ", "\n  </div>  "],
			["Hello", "World"],
		);
		assert.equal(result, "<div>HelloWorld</div>");
	});

	it("should handle array values", () => {
		const result = _renderHtmlFast(["<div>", "</div>"], [["Hello", "World"]]);
		assert.equal(result, "<div>HelloWorld</div>");
	});

	it("should handle nested arrays", () => {
		const result = _renderHtmlFast(
			["<div>", "</div>"],
			[["Hello", [" ", "World"]]],
		);
		assert.equal(result, "<div>Hello World</div>");
	});

	it("should handle objects", () => {
		const result = _renderHtmlFast(["<div>", "</div>"], [{ name: "John" }]);
		assert.equal(result, "<div>[object Object]</div>");
	});

	it("should handle functions", () => {
		const func = () => "Hello";
		const result = _renderHtmlFast(["<div>", "</div>"], [func]);
		assert.ok(result.length > 0);
		assert.ok(typeof result === "string");
	});

	it("should handle numbers", () => {
		const result = _renderHtmlFast(["<div>Count: ", "</div>"], [42]);
		assert.equal(result, "<div>Count: 42</div>");
	});

	it("should handle booleans", () => {
		const result = _renderHtmlFast(["<div>Flag: ", "</div>"], [true]);
		assert.equal(result, "<div>Flag: true</div>");
	});

	it("should handle zero as valid value", () => {
		const result = _renderHtmlFast(["<div>Count: ", "</div>"], [0]);
		assert.equal(result, "<div>Count: 0</div>");
	});

	it("should handle empty strings as invalid", () => {
		const result = _renderHtmlFast(["<div>Text: ", "</div>"], [""]);
		assert.equal(result, "<div>Text: </div>");
	});

	it("should handle null as invalid", () => {
		const result = _renderHtmlFast(["<div>Text: ", "</div>"], [null]);
		assert.equal(result, "<div>Text: </div>");
	});

	it("should handle undefined as invalid", () => {
		const result = _renderHtmlFast(["<div>Text: ", "</div>"], [undefined]);
		assert.equal(result, "<div>Text: </div>");
	});

	it("should handle false as invalid", () => {
		const result = _renderHtmlFast(["<div>Flag: ", "</div>"], [false]);
		assert.equal(result, "<div>Flag: </div>");
	});

	it("should handle NaN as invalid", () => {
		const result = _renderHtmlFast(["<div>Number: ", "</div>"], [NaN]);
		assert.equal(result, "<div>Number: </div>");
	});
});

describe("_renderSafeHtmlFast", () => {
	it("should handle no values (fast path)", () => {
		const result = _renderSafeHtmlFast(["<div>Hello</div>"], []);
		assert.equal(result, "<div>Hello</div>");
	});

	it("should handle single value with truthy value (fast path)", () => {
		const result = _renderSafeHtmlFast(["<div>Hello ", "</div>"], ["World"]);
		assert.equal(result, "<div>Hello World</div>");
	});

	it("should handle single value with falsy value (fast path)", () => {
		const result = _renderSafeHtmlFast(["<div>Hello ", "</div>"], [null]);
		assert.equal(result, "<div>Hello </div>");
	});

	it("should handle single value with zero (fast path)", () => {
		const result = _renderSafeHtmlFast(["<div>Count: ", "</div>"], [0]);
		assert.equal(result, "<div>Count: 0</div>");
	});

	it("should handle single value with HTML special characters (fast path)", () => {
		const result = _renderSafeHtmlFast(
			["<div>Hello ", "</div>"],
			["<script>alert('XSS')</script>"],
		);
		assert.equal(
			result,
			"<div>Hello &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;</div>",
		);
	});

	it("should handle multiple values (general case)", () => {
		const result = _renderSafeHtmlFast(
			["<div>", " ", "</div>"],
			["Hello", "World"],
		);
		assert.equal(result, "<div>Hello World</div>");
	});

	it("should handle many values (general case)", () => {
		const result = _renderSafeHtmlFast(
			["<div>", " ", " ", " ", " ", "</div>"],
			["A", "B", "C", "D", "E"],
		);
		assert.equal(result, "<div>A B C D E</div>");
	});

	it("should handle complex general case with escaping", () => {
		const result = _renderSafeHtmlFast(
			["<div>", " ", " ", " ", "</div>"],
			["Hello", "<script>alert('XSS')</script>", "World", "Test"],
		);
		assert.equal(
			result,
			"<div>Hello &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt; World Test</div>",
		);
	});

	it("should handle multiple values with falsy values", () => {
		const result = _renderSafeHtmlFast(
			["<div>", " ", " ", "</div>"],
			[null, "World", undefined],
		);
		assert.equal(result, "<div> World </div>");
	});

	it("should handle multiple values with escaping", () => {
		const result = _renderSafeHtmlFast(
			["<div>", " ", "</div>"],
			["Hello", "<script>alert('XSS')</script>"],
		);
		assert.equal(
			result,
			"<div>Hello &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;</div>",
		);
	});

	it("should handle complex template with mixed content", () => {
		const result = _renderSafeHtmlFast(
			["<div>", " ", " ", " ", "</div>"],
			["Hello", null, "<script>alert('XSS')</script>", undefined],
		);
		assert.equal(
			result,
			"<div>Hello  &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt; </div>",
		);
	});

	it("should handle whitespace normalization", () => {
		const result = _renderSafeHtmlFast(
			["  <div>\n    ", "\n    ", "\n  </div>  "],
			["Hello", "World"],
		);
		assert.equal(result, "<div>HelloWorld</div>");
	});

	it("should handle array values", () => {
		const result = _renderSafeHtmlFast(
			["<div>", "</div>"],
			[["Hello", "World"]],
		);
		assert.equal(result, "<div>HelloWorld</div>");
	});

	it("should handle nested arrays", () => {
		const result = _renderSafeHtmlFast(
			["<div>", "</div>"],
			[["Hello", [" ", "World"]]],
		);
		assert.equal(result, "<div>Hello World</div>");
	});

	it("should handle objects", () => {
		const result = _renderSafeHtmlFast(["<div>", "</div>"], [{ name: "John" }]);
		assert.equal(result, "<div>[object Object]</div>");
	});

	it("should handle functions", () => {
		const func = () => "Hello";
		const result = _renderSafeHtmlFast(["<div>", "</div>"], [func]);
		assert.ok(result.length > 0);
		assert.ok(typeof result === "string");
	});

	it("should handle numbers", () => {
		const result = _renderSafeHtmlFast(["<div>Count: ", "</div>"], [42]);
		assert.equal(result, "<div>Count: 42</div>");
	});

	it("should handle booleans", () => {
		const result = _renderSafeHtmlFast(["<div>Flag: ", "</div>"], [true]);
		assert.equal(result, "<div>Flag: true</div>");
	});

	it("should handle zero as valid value", () => {
		const result = _renderSafeHtmlFast(["<div>Count: ", "</div>"], [0]);
		assert.equal(result, "<div>Count: 0</div>");
	});

	it("should handle empty strings as invalid", () => {
		const result = _renderSafeHtmlFast(["<div>Text: ", "</div>"], [""]);
		assert.equal(result, "<div>Text: </div>");
	});

	it("should handle null as invalid", () => {
		const result = _renderSafeHtmlFast(["<div>Text: ", "</div>"], [null]);
		assert.equal(result, "<div>Text: </div>");
	});

	it("should handle undefined as invalid", () => {
		const result = _renderSafeHtmlFast(["<div>Text: ", "</div>"], [undefined]);
		assert.equal(result, "<div>Text: </div>");
	});

	it("should handle false as invalid", () => {
		const result = _renderSafeHtmlFast(["<div>Flag: ", "</div>"], [false]);
		assert.equal(result, "<div>Flag: </div>");
	});

	it("should handle NaN as invalid", () => {
		const result = _renderSafeHtmlFast(["<div>Number: ", "</div>"], [NaN]);
		assert.equal(result, "<div>Number: </div>");
	});

	it("should escape HTML special characters in arrays", () => {
		const result = _renderSafeHtmlFast(
			["<div>", "</div>"],
			[["<script>alert('XSS')</script>"]],
		);
		assert.equal(
			result,
			"<div>&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;</div>",
		);
	});

	it("should escape HTML special characters in nested arrays", () => {
		const result = _renderSafeHtmlFast(
			["<div>", "</div>"],
			[["Hello", [" ", "<script>alert('XSS')</script>"]]],
		);
		assert.equal(
			result,
			"<div>Hello &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;</div>",
		);
	});

	it("should handle multiple values with all falsy values", () => {
		const result = _renderSafeHtmlFast(
			["<div>", " ", " ", " ", "</div>"],
			[null, undefined, false, ""],
		);
		assert.equal(result, "<div></div>");
	});

	it("should handle multiple values with mixed truthy and falsy", () => {
		const result = _renderSafeHtmlFast(
			["<div>", " ", " ", " ", "</div>"],
			["Hello", null, "World", undefined],
		);
		assert.equal(result, "<div>Hello  World </div>");
	});

	it("should handle multiple values with zero and falsy", () => {
		const result = _renderSafeHtmlFast(
			["<div>", " ", " ", " ", "</div>"],
			[0, null, "Test", undefined],
		);
		assert.equal(result, "<div>0  Test </div>");
	});

	it("should handle edge case with many falsy values", () => {
		const result = _renderSafeHtmlFast(
			["<div>", " ", " ", " ", " ", " ", "</div>"],
			[null, undefined, false, "", null, undefined],
		);
		assert.equal(result, "<div></div>");
	});

	it("should handle edge case with alternating truthy and falsy", () => {
		const result = _renderSafeHtmlFast(
			["<div>", " ", " ", " ", " ", " ", "</div>"],
			["A", null, "B", undefined, "C", false],
		);
		assert.equal(result, "<div>A  B  C </div>");
	});
});
