/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import * as highlight from "./index.js";
import {
	highlightCSS,
	highlightHTML,
	highlightJS,
	highlightShell,
	highlightSQL,
} from "./index.js";

describe("Highlight Module Exports", () => {
	describe("Named Exports", () => {
		it("should export all highlighter functions", () => {
			assert.strictEqual(typeof highlightCSS, "function");
			assert.strictEqual(typeof highlightHTML, "function");
			assert.strictEqual(typeof highlightJS, "function");
			assert.strictEqual(typeof highlightShell, "function");
			assert.strictEqual(typeof highlightSQL, "function");
		});

		it("should export functions with correct names", () => {
			assert.strictEqual(highlightCSS.name, "highlightCSS");
			assert.strictEqual(highlightHTML.name, "highlightHTML");
			assert.strictEqual(highlightJS.name, "highlightJS");
			assert.strictEqual(highlightShell.name, "highlightShell");
			assert.strictEqual(highlightSQL.name, "highlightSQL");
		});
	});

	describe("Namespace Exports", () => {
		it("should export all functions through namespace import", () => {
			assert.strictEqual(typeof highlight.highlightCSS, "function");
			assert.strictEqual(typeof highlight.highlightHTML, "function");
			assert.strictEqual(typeof highlight.highlightJS, "function");
			assert.strictEqual(typeof highlight.highlightShell, "function");
			assert.strictEqual(typeof highlight.highlightSQL, "function");
		});

		it("should have consistent exports between named and namespace", () => {
			assert.strictEqual(highlight.highlightCSS, highlightCSS);
			assert.strictEqual(highlight.highlightHTML, highlightHTML);
			assert.strictEqual(highlight.highlightJS, highlightJS);
			assert.strictEqual(highlight.highlightShell, highlightShell);
			assert.strictEqual(highlight.highlightSQL, highlightSQL);
		});
	});

	describe("Functional Integration", () => {
		it("should highlight CSS code", () => {
			const css = "body { color: red; }";
			const result = highlightCSS(css);
			assert.ok(typeof result === "string");
			assert.ok(result.length > css.length);
			assert.ok(result.includes('<span class="text-primary">body</span>'));
		});

		it("should highlight HTML code", () => {
			const html = '<div class="container">Hello</div>';
			const result = highlightHTML(html);
			assert.ok(typeof result === "string");
			assert.ok(result.length > html.length);
			assert.ok(result.includes('<span class="text-primary">div</span>'));
		});

		it("should highlight JavaScript code", () => {
			const js = "const greeting = 'Hello World';";
			const result = highlightJS(js);
			assert.ok(typeof result === "string");
			assert.ok(result.length > js.length);
			assert.ok(result.includes('<span class="text-primary">const</span>'));
		});

		it("should highlight Shell/Bash code", () => {
			const shell = "echo 'Hello World'";
			const result = highlightShell(shell);
			assert.ok(typeof result === "string");
			assert.ok(result.length > shell.length);
			assert.ok(result.includes('<span class="text-info">echo</span>'));
		});

		it("should highlight SQL code", () => {
			const sql = "SELECT * FROM users WHERE active = TRUE";
			const result = highlightSQL(sql);
			assert.ok(typeof result === "string");
			assert.ok(result.length > sql.length);
			assert.ok(result.includes('<span class="text-primary">SELECT</span>'));
		});
	});

	describe("Error Handling", () => {
		it("should handle empty strings consistently", () => {
			assert.strictEqual(highlightCSS(""), "");
			assert.strictEqual(highlightHTML(""), "");
			assert.strictEqual(highlightJS(""), "");
			assert.strictEqual(highlightShell(""), "");
			assert.strictEqual(highlightSQL(""), "");
		});

		it("should handle whitespace-only strings consistently", () => {
			const whitespace = "   \n\t   ";
			assert.strictEqual(highlightCSS(whitespace), "");
			assert.strictEqual(highlightHTML(whitespace), "");
			assert.strictEqual(highlightJS(whitespace), "");
			assert.strictEqual(highlightShell(whitespace), "");
			assert.strictEqual(highlightSQL(whitespace), "");
		});

		it("should throw TypeError for non-string input", () => {
			const nonStrings = [null, undefined, 123, {}, []];

			for (const input of nonStrings) {
				assert.throws(() => highlightCSS(input), TypeError);
				assert.throws(() => highlightHTML(input), TypeError);
				assert.throws(() => highlightJS(input), TypeError);
				assert.throws(() => highlightShell(input), TypeError);
				assert.throws(() => highlightSQL(input), TypeError);
			}
		});
	});

	describe("Bootstrap Integration", () => {
		it("should use consistent Bootstrap classes across languages", () => {
			const cssResult = highlightCSS("body { color: red; }");
			const htmlResult = highlightHTML('<div class="test">Content</div>');
			const jsResult = highlightJS("const x = 'test';");
			const shellResult = highlightShell("echo 'test'");
			const sqlResult = highlightSQL("SELECT 'test' as value");

			// Check for consistent use of Bootstrap semantic classes
			const results = [cssResult, htmlResult, jsResult, shellResult, sqlResult];
			const bootstrapClasses = [
				"text-primary",
				"text-success",
				"text-info",
				"text-warning",
				"text-secondary",
				"text-body",
			];

			for (const result of results) {
				assert.ok(
					bootstrapClasses.some((className) => result.includes(className)),
					"Result should contain at least one Bootstrap class",
				);
			}
		});

		it("should properly escape HTML entities", () => {
			const htmlWithEntities = '<script>alert("&<>");</script>';
			const jsWithOperators = "if (x < y && y > z) { return x <= y >= z; }";
			const sqlWithOperators = "WHERE price >= 10 AND quantity <= 100";

			const htmlResult = highlightHTML(htmlWithEntities);
			const jsResult = highlightJS(jsWithOperators);
			const sqlResult = highlightSQL(sqlWithOperators);

			// Should contain HTML-escaped entities
			assert.ok(htmlResult.includes("&lt;") || htmlResult.includes("&gt;"));
			assert.ok(jsResult.includes("&lt;") || jsResult.includes("&gt;"));
			assert.ok(sqlResult.includes("&lt;") || sqlResult.includes("&gt;"));

			// Should not contain unescaped angle brackets in highlighted content
			const spanContent = /<span[^>]*>([^<]*)</g;
			let match = spanContent.exec(htmlResult);

			while (match !== null) {
				const content = match[1];
				if (content && content !== "&lt;" && content !== "&gt;") {
					assert.ok(
						!content.includes("<") && !content.includes(">"),
						`Unescaped angle brackets found in span content: ${content}`,
					);
				}
				match = spanContent.exec(htmlResult);
			}
		});
	});

	describe("Performance", () => {
		it("should handle moderately complex code efficiently", () => {
			const complexCSS = `
				.container {
					display: flex;
					flex-direction: column;
					padding: 1rem 2rem;
					background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
					box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
				}

				@media (max-width: 768px) {
					.container { padding: 0.5rem; }
				}
			`;

			const start = performance.now();
			const result = highlightCSS(complexCSS);
			const end = performance.now();

			assert.ok(typeof result === "string");
			assert.ok(result.length > complexCSS.length);
			assert.ok(end - start < 50, "Should complete within 50ms");
		});

		it("should handle all languages with reasonable performance", () => {
			const samples = {
				css: "body { color: #333; font-family: 'Arial', sans-serif; }",
				html: '<div class="wrapper"><p>Hello <em>world</em>!</p></div>',
				js: "const users = await fetch('/api/users').then(r => r.json());",
				shell:
					"for file in *.txt; do cat $file | grep 'pattern' >> results.log; done",
				sql: "SELECT u.name, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id",
			};

			const start = performance.now();

			const results = {
				css: highlightCSS(samples.css),
				html: highlightHTML(samples.html),
				js: highlightJS(samples.js),
				shell: highlightShell(samples.shell),
				sql: highlightSQL(samples.sql),
			};

			const end = performance.now();

			// All should complete and return valid strings
			for (const [lang, result] of Object.entries(results)) {
				assert.ok(typeof result === "string", `${lang} should return string`);
				assert.ok(
					result.length > samples[lang].length,
					`${lang} should add highlighting markup`,
				);
			}

			// Total time should be reasonable
			assert.ok(
				end - start < 100,
				"All highlighters combined should complete within 100ms",
			);
		});
	});
});
