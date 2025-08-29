/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { highlightJS } from "./js.js";

describe("JavaScript Syntax Highlighter", () => {
	describe("Input Validation", () => {
		it("should throw TypeError for non-string input", () => {
			assert.throws(() => highlightJS(null), TypeError);
			assert.throws(() => highlightJS(undefined), TypeError);
			assert.throws(() => highlightJS(123), TypeError);
			assert.throws(() => highlightJS({}), TypeError);
		});

		it("should return empty string for empty input", () => {
			assert.strictEqual(highlightJS(""), "");
			assert.strictEqual(highlightJS("   "), "");
			assert.strictEqual(highlightJS("\n\t"), "");
		});
	});

	describe("Keywords and Identifiers", () => {
		it("should highlight JavaScript keywords", () => {
			const js = "function test() { const x = 42; return x; }";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-primary">function</span>'));
			assert.ok(result.includes('<span class="text-primary">const</span>'));
			assert.ok(result.includes('<span class="text-primary">return</span>'));
		});

		it("should highlight built-in objects", () => {
			const js = "console.log(JSON.stringify(Array.from([1, 2, 3])));";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-info">console</span>'));
			assert.ok(result.includes('<span class="text-info">JSON</span>'));
			assert.ok(result.includes('<span class="text-info">Array</span>'));
		});

		it("should highlight identifiers with text-body", () => {
			const js = "const myVariable = getValue();";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-body">myVariable</span>'));
			assert.ok(result.includes('<span class="text-body">getValue</span>'));
		});

		it("should highlight boolean literals", () => {
			const js = "const isTrue = true; const isFalse = false;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-warning">true</span>'));
			assert.ok(result.includes('<span class="text-warning">false</span>'));
		});

		it("should highlight null and undefined", () => {
			const js = "const empty = null; const notDefined = undefined;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-warning">null</span>'));
			assert.ok(result.includes('<span class="text-warning">undefined</span>'));
		});
	});

	describe("String Literals", () => {
		it("should highlight single-quoted strings", () => {
			const js = "const str = 'Hello World';";
			const result = highlightJS(js);
			assert.ok(
				result.includes(
					'<span class="text-success">&#39;Hello World&#39;</span>',
				),
			);
		});

		it("should highlight double-quoted strings", () => {
			const js = 'const str = "Hello World";';
			const result = highlightJS(js);
			assert.ok(
				result.includes(
					'<span class="text-success">&quot;Hello World&quot;</span>',
				),
			);
		});

		it("should handle escaped characters in strings", () => {
			const js = 'const str = "He said \\"Hello\\"";';
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-success">'));
			assert.ok(result.includes("Hello"));
		});
	});

	describe("Template Literals", () => {
		it("should highlight template literals", () => {
			const js = "const str = `Hello " + "${" + "name}!`;";
			const result = highlightJS(js);
			assert.ok(
				result.includes(
					'<span class="text-success">`Hello ' + "${" + "name}!`</span>",
				),
			);
		});

		it("should handle complex template literal interpolation", () => {
			const js = "const msg = `Result: " + "${" + "calculate(a + b)} items`;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-success">'));
			assert.ok(result.includes("Result:"));
		});

		it("should handle nested braces in template literals", () => {
			const js =
				"const obj = `Config: " + "${" + "JSON.stringify({key: value})}`;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-success">'));
			assert.ok(result.includes("Config:"));
		});
	});

	describe("Regular Expressions", () => {
		it("should highlight regex literals after assignment", () => {
			const js = "const pattern = /[a-z]+/gi;";
			const result = highlightJS(js);
			assert.ok(
				result.includes('<span class="text-success">/[a-z]+/gi</span>'),
			);
		});

		it("should highlight regex literals after return", () => {
			const js = "return /\\d{3}-\\d{2}-\\d{4}/;";
			const result = highlightJS(js);
			assert.ok(
				result.includes(
					'<span class="text-success">/\\d{3}-\\d{2}-\\d{4}/</span>',
				),
			);
		});

		it("should not confuse division with regex", () => {
			const js = "const result = a / b / c;";
			const result = highlightJS(js);
			// Should not highlight as regex
			assert.ok(!result.includes('text-success">/'));
			assert.ok(result.includes('<span class="text-secondary">/</span>'));
		});

		it("should handle regex with flags", () => {
			const js = "const pattern = /test/gimsuy;";
			const result = highlightJS(js);
			assert.ok(
				result.includes('<span class="text-success">/test/gimsuy</span>'),
			);
		});
	});

	describe("Numbers", () => {
		it("should highlight decimal numbers", () => {
			const js = "const x = 42; const y = 3.14;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-warning">42</span>'));
			assert.ok(result.includes('<span class="text-warning">3.14</span>'));
		});

		it("should highlight hexadecimal numbers", () => {
			const js = "const hex = 0xFF; const HEX = 0x1A2B;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-warning">0xFF</span>'));
			assert.ok(result.includes('<span class="text-warning">0x1A2B</span>'));
		});

		it("should highlight binary numbers", () => {
			const js = "const bin = 0b1010; const BIN = 0B1111;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-warning">0b1010</span>'));
			assert.ok(result.includes('<span class="text-warning">0B1111</span>'));
		});

		it("should highlight octal numbers", () => {
			const js = "const oct = 0o755; const OCT = 0O644;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-warning">0o755</span>'));
			assert.ok(result.includes('<span class="text-warning">0O644</span>'));
		});

		it("should highlight scientific notation", () => {
			const js = "const sci = 1.23e-4; const SCI = 5E+10;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-warning">1.23e-4</span>'));
			assert.ok(result.includes('<span class="text-warning">5E+10</span>'));
		});

		it("should highlight BigInt literals", () => {
			const js = "const big = 123n; const bigHex = 0xFFn;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-warning">123n</span>'));
			assert.ok(result.includes('<span class="text-warning">0xFFn</span>'));
		});
	});

	describe("Comments", () => {
		it("should highlight single-line comments", () => {
			const js = "// This is a comment\nconst x = 42;";
			const result = highlightJS(js);
			assert.ok(
				result.includes('<span class="text-muted">// This is a comment</span>'),
			);
		});

		it("should highlight multi-line comments", () => {
			const js = "/* This is a\nmulti-line comment */";
			const result = highlightJS(js);
			assert.ok(
				result.includes(
					'<span class="text-muted">/* This is a\nmulti-line comment */</span>',
				),
			);
		});

		it("should not highlight inside comments", () => {
			const js = "/* const x = function() {} */";
			const result = highlightJS(js);
			const commentSpan = result.match(
				/<span class="text-muted">[^<]*<\/span>/,
			);
			assert.ok(commentSpan);
			assert.ok(
				!commentSpan[0].includes('<span class="text-primary">const</span>'),
			);
		});
	});

	describe("Operators and Punctuation", () => {
		it("should highlight arithmetic operators", () => {
			const js = "const result = a + b - c * d / e % f;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-secondary">+</span>'));
			assert.ok(result.includes('<span class="text-secondary">-</span>'));
			assert.ok(result.includes('<span class="text-secondary">*</span>'));
			assert.ok(result.includes('<span class="text-secondary">/</span>'));
			assert.ok(result.includes('<span class="text-secondary">%</span>'));
		});

		it("should highlight comparison operators", () => {
			const js = "if (a === b && c !== d && e <= f && g >= h) {}";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-secondary">===</span>'));
			assert.ok(result.includes('<span class="text-secondary">!==</span>'));
			assert.ok(result.includes('<span class="text-secondary">&lt;=</span>'));
			assert.ok(result.includes('<span class="text-secondary">&gt;=</span>'));
			assert.ok(
				result.includes('<span class="text-secondary">&amp;&amp;</span>'),
			);
		});

		it("should highlight assignment operators", () => {
			const js = "x += 1; y -= 2; z *= 3; a /= 4;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-secondary">+=</span>'));
			assert.ok(result.includes('<span class="text-secondary">-=</span>'));
			assert.ok(result.includes('<span class="text-secondary">*=</span>'));
			assert.ok(result.includes('<span class="text-secondary">/=</span>'));
		});

		it("should highlight punctuation", () => {
			const js = "const obj = { key: value, arr: [1, 2, 3] };";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-secondary">{</span>'));
			assert.ok(result.includes('<span class="text-secondary">}</span>'));
			assert.ok(result.includes('<span class="text-secondary">[</span>'));
			assert.ok(result.includes('<span class="text-secondary">]</span>'));
			assert.ok(result.includes('<span class="text-secondary">:</span>'));
			assert.ok(result.includes('<span class="text-secondary">,</span>'));
		});

		it("should highlight arrow functions", () => {
			const js = "const fn = (x) => x * 2;";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-secondary">=&gt;</span>'));
		});

		it("should highlight spread operator", () => {
			const js = "const arr = [...items, ...more];";
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-secondary">...</span>'));
		});
	});

	describe("HTML Escaping", () => {
		it("should escape HTML special characters", () => {
			const js = 'const html = "<div>Hello & goodbye</div>";';
			const result = highlightJS(js);
			assert.ok(result.includes("&lt;div&gt;"));
			assert.ok(result.includes("&amp;"));
		});

		it("should escape quotes in strings", () => {
			const js = 'const str = "He said \\"Hello\\"";';
			const result = highlightJS(js);
			assert.ok(result.includes("&quot;"));
		});
	});

	describe("Complex JavaScript Examples", () => {
		it("should handle function declarations", () => {
			const js = `
				function calculateSum(a, b) {
					return a + b;
				}
			`;
			const result = highlightJS(js);

			assert.ok(result.includes('<span class="text-primary">function</span>'));
			assert.ok(result.includes('<span class="text-body">calculateSum</span>'));
			assert.ok(result.includes('<span class="text-primary">return</span>'));
		});

		it("should handle class definitions", () => {
			const js = `
				class MyClass extends BaseClass {
					constructor(value) {
						super(value);
						this.value = value;
					}
				}
			`;
			const result = highlightJS(js);

			assert.ok(result.includes('<span class="text-primary">class</span>'));
			assert.ok(result.includes('<span class="text-primary">extends</span>'));
			assert.ok(
				result.includes('<span class="text-primary">constructor</span>'),
			);
			assert.ok(result.includes('<span class="text-primary">super</span>'));
			assert.ok(result.includes('<span class="text-primary">this</span>'));
		});

		it("should handle async/await", () => {
			const js = `
				async function fetchData() {
					try {
						const response = await fetch('/api/data');
						const data = await response.json();
						return data;
					} catch (error) {
						console.error('Failed to fetch:', error);
					}
				}
			`;
			const result = highlightJS(js);

			assert.ok(result.includes('<span class="text-primary">async</span>'));
			assert.ok(result.includes('<span class="text-primary">await</span>'));
			assert.ok(result.includes('<span class="text-primary">try</span>'));
			assert.ok(result.includes('<span class="text-primary">catch</span>'));
		});

		it("should handle destructuring and template literals", () => {
			const js = `
				const { name, age } = user;
				const message = \`User \${name} is \${age} years old\`;
				const [first, ...rest] = items;
			`;
			const result = highlightJS(js);

			assert.ok(result.includes('<span class="text-primary">const</span>'));
			assert.ok(result.includes('<span class="text-body">name</span>'));
			assert.ok(result.includes('<span class="text-body">age</span>'));
			assert.ok(result.includes('<span class="text-success">'));
			assert.ok(result.includes('<span class="text-secondary">...</span>'));
		});

		it("should handle module imports and exports", () => {
			const js = `
				import { Component } from 'react';
				import defaultExport from './module';
				export const myFunction = () => {};
				export default class MyClass {}
			`;
			const result = highlightJS(js);

			assert.ok(result.includes('<span class="text-primary">import</span>'));
			assert.ok(result.includes('<span class="text-primary">from</span>'));
			assert.ok(result.includes('<span class="text-primary">export</span>'));
			assert.ok(result.includes('<span class="text-primary">default</span>'));
		});
	});

	describe("Edge Cases", () => {
		it("should handle malformed JavaScript gracefully", () => {
			const js = "const x =; function {";
			const result = highlightJS(js);
			assert.ok(typeof result === "string");
			assert.ok(result.length > 0);
		});

		it("should preserve whitespace", () => {
			const js = "  const   x   =   42  ;  ";
			const result = highlightJS(js);
			// Should maintain spacing structure
			assert.ok(result.startsWith("  "));
			assert.ok(result.endsWith("  "));
		});

		it("should handle mixed quotes and escapes", () => {
			const js = `const mixed = 'He said "Hello" to me'; const escaped = "She's here";`;
			const result = highlightJS(js);
			assert.ok(result.includes('<span class="text-success">'));
			assert.ok(typeof result === "string");
		});

		it("should handle complex regex patterns", () => {
			const js =
				"const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;";
			const result = highlightJS(js);
			assert.ok(
				result.includes(
					'<span class="text-success">/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/</span>',
				),
			);
		});

		it("should handle division in different contexts", () => {
			const js = `
				const a = x / y;
				const b = (x + y) / z;
				arr[0] / arr[1];
				const regex = /pattern/;
			`;
			const result = highlightJS(js);

			// Should have division operators
			assert.ok(result.includes('<span class="text-secondary">/</span>'));
			// Should have regex
			assert.ok(result.includes('<span class="text-success">/pattern/</span>'));
		});
	});
});
