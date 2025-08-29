/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { highlightCSS } from "./css.js";

describe("CSS Syntax Highlighter", () => {
	describe("Input Validation", () => {
		it("should throw TypeError for non-string input", () => {
			assert.throws(() => highlightCSS(null), TypeError);
			assert.throws(() => highlightCSS(undefined), TypeError);
			assert.throws(() => highlightCSS(123), TypeError);
			assert.throws(() => highlightCSS({}), TypeError);
		});

		it("should return empty string for empty input", () => {
			assert.strictEqual(highlightCSS(""), "");
			assert.strictEqual(highlightCSS("   "), "");
			assert.strictEqual(highlightCSS("\n\t"), "");
		});
	});

	describe("Basic Syntax Highlighting", () => {
		it("should highlight CSS properties with text-info", () => {
			const css = "color: red;";
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-info">color</span>'));
		});

		it("should highlight CSS values with appropriate classes", () => {
			const css = "color: red; font-size: 16px;";
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-warning">red</span>'));
			assert.ok(result.includes('<span class="text-warning">16px</span>'));
		});

		it("should highlight structural characters with text-secondary", () => {
			const css = "body { color: red; }";
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-secondary">{</span>'));
			assert.ok(result.includes('<span class="text-secondary">}</span>'));
			assert.ok(result.includes('<span class="text-secondary">:</span>'));
			assert.ok(result.includes('<span class="text-secondary">;</span>'));
		});
	});

	describe("Selectors", () => {
		it("should highlight element selectors", () => {
			const css = "body { color: red; }";
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-primary">body</span>'));
		});

		it("should highlight class selectors", () => {
			const css = ".container { width: 100%; }";
			const result = highlightCSS(css);
			assert.ok(
				result.includes('<span class="text-primary">.container</span>'),
			);
		});

		it("should highlight id selectors", () => {
			const css = "#header { height: 50px; }";
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-primary">#header</span>'));
		});

		it("should highlight pseudo selectors", () => {
			const css = "a:hover { color: blue; }";
			const result = highlightCSS(css);
			// Pseudo-selectors are highlighted as complete selector tokens
			assert.ok(result.includes('<span class="text-primary">a:hover</span>'));
		});

		it("should highlight complex selectors", () => {
			const css = 'div.container > .item + p::before { content: ""; }';
			const result = highlightCSS(css);
			assert.ok(result.includes("text-primary"));
		});
	});

	describe("At-Rules", () => {
		it("should highlight @media rules", () => {
			const css =
				"@media screen and (max-width: 768px) { body { font-size: 14px; } }";
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-primary">@media</span>'));
		});

		it("should highlight @import rules", () => {
			const css = '@import url("style.css");';
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-primary">@import</span>'));
		});

		it("should highlight @keyframes rules", () => {
			const css =
				"@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }";
			const result = highlightCSS(css);
			assert.ok(
				result.includes('<span class="text-primary">@keyframes</span>'),
			);
		});
	});

	describe("Comments", () => {
		it("should highlight single-line comments", () => {
			const css = "/* This is a comment */";
			const result = highlightCSS(css);
			assert.ok(
				result.includes(
					'<span class="text-muted">/* This is a comment */</span>',
				),
			);
		});

		it("should highlight multi-line comments", () => {
			const css = `/*
        Multi-line
        comment
      */`;
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-muted">'));
			assert.ok(result.includes("Multi-line"));
		});

		it("should not highlight inside comments", () => {
			const css = "/* color: red; */";
			const result = highlightCSS(css);
			const commentSpan = result.match(
				/<span class="text-muted">[^<]*<\/span>/,
			);
			assert.ok(commentSpan);
			assert.ok(
				!commentSpan[0].includes('<span class="text-info">color</span>'),
			);
		});
	});

	describe("Values and Units", () => {
		it("should highlight numeric values with units", () => {
			const css = "margin: 10px 20em 30% 40vh;";
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-warning">10px</span>'));
			assert.ok(result.includes('<span class="text-warning">20em</span>'));
			assert.ok(result.includes('<span class="text-warning">30%</span>'));
			assert.ok(result.includes('<span class="text-warning">40vh</span>'));
		});

		it("should highlight color values", () => {
			const css =
				"color: #ff0000; background: rgb(255, 0, 0); border: 1px solid red;";
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-warning">#ff0000</span>'));
			// rgb is highlighted as a function, not as a single color token
			assert.ok(result.includes('<span class="text-info">rgb</span>'));
			assert.ok(result.includes('<span class="text-warning">red</span>'));
		});

		it("should highlight string values", () => {
			const css = "content: \"Hello World\"; font-family: 'Arial';";
			const result = highlightCSS(css);
			// Strings are HTML-escaped for security
			assert.ok(
				result.includes(
					'<span class="text-success">&quot;Hello World&quot;</span>',
				),
			);
			assert.ok(
				result.includes('<span class="text-success">&#39;Arial&#39;</span>'),
			);
		});

		it("should highlight !important declarations", () => {
			const css = "color: red !important;";
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-danger">!important</span>'));
		});
	});

	describe("CSS Functions", () => {
		it("should highlight CSS functions", () => {
			const css = "transform: translateX(10px) rotate(45deg);";
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-info">translateX</span>'));
			assert.ok(result.includes('<span class="text-info">rotate</span>'));
		});

		it("should highlight calc function", () => {
			const css = "width: calc(100% - 20px);";
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-info">calc</span>'));
		});
	});

	describe("HTML Escaping", () => {
		it("should escape HTML special characters", () => {
			const css = 'content: "<div>Hello & goodbye</div>";';
			const result = highlightCSS(css);
			assert.ok(result.includes("&lt;div&gt;"));
			assert.ok(result.includes("&amp;"));
		});

		it("should escape quotes in content", () => {
			const css = 'content: "He said \\"Hello\\"";';
			const result = highlightCSS(css);
			assert.ok(result.includes("&quot;"));
		});
	});

	describe("Complex CSS Examples", () => {
		it("should handle complete CSS ruleset", () => {
			const css = `
        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
      `;
			const result = highlightCSS(css);

			// Verify selector highlighting
			assert.ok(
				result.includes('<span class="text-primary">.container</span>'),
			);

			// Verify property highlighting
			assert.ok(result.includes('<span class="text-info">width</span>'));
			assert.ok(result.includes('<span class="text-info">max-width</span>'));
			assert.ok(
				result.includes('<span class="text-info">background-color</span>'),
			);

			// Verify value highlighting
			assert.ok(result.includes('<span class="text-warning">100%</span>'));
			assert.ok(result.includes('<span class="text-warning">1200px</span>'));
			assert.ok(result.includes('<span class="text-warning">#f8f9fa</span>'));
		});

		it("should handle media queries", () => {
			const css = `
        @media screen and (max-width: 768px) {
          .container {
            padding: 10px;
          }
        }
      `;
			const result = highlightCSS(css);

			assert.ok(result.includes('<span class="text-primary">@media</span>'));
			assert.ok(
				result.includes('<span class="text-primary">.container</span>'),
			);
			assert.ok(result.includes('<span class="text-info">padding</span>'));
		});

		it("should handle CSS with comments and multiple rules", () => {
			const css = `
        /* Base styles */
        body {
          font-family: 'Helvetica', sans-serif;
          color: #333;
        }

        /* Layout */
        .header {
          position: fixed;
          top: 0;
          z-index: 1000;
        }
      `;
			const result = highlightCSS(css);

			// Comments
			assert.ok(
				result.includes('<span class="text-muted">/* Base styles */</span>'),
			);
			assert.ok(
				result.includes('<span class="text-muted">/* Layout */</span>'),
			);

			// Multiple selectors
			assert.ok(result.includes('<span class="text-primary">body</span>'));
			assert.ok(result.includes('<span class="text-primary">.header</span>'));
		});
	});

	describe("Edge Cases", () => {
		it("should handle malformed CSS gracefully", () => {
			const css = "color red; width }";
			const result = highlightCSS(css);
			assert.ok(typeof result === "string");
			assert.ok(result.length > 0);
		});

		it("should preserve whitespace", () => {
			const css = "  body  {  color:  red;  }  ";
			const result = highlightCSS(css);
			// Should maintain leading/trailing spaces
			assert.ok(result.startsWith("  "));
			assert.ok(result.endsWith("  "));
		});

		it("should handle empty rules", () => {
			const css = ".empty { }";
			const result = highlightCSS(css);
			assert.ok(result.includes('<span class="text-primary">.empty</span>'));
			assert.ok(result.includes('<span class="text-secondary">{</span>'));
			assert.ok(result.includes('<span class="text-secondary">}</span>'));
		});
	});
});
