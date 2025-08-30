/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Exhaustive integration test suite for HTML template engine expectations
 *
 * Comprehensive validation of all features a modern developer expects from a templating engine:
 * - Template interpolation behaviors
 * - Data type handling edge cases
 * - Security and XSS protection
 * - Performance optimization features
 * - Real-world usage patterns
 */

import { ok, strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { escapeHtml, html, safeHtml } from "./html/index.js";

describe("Basic Template Functionality", () => {
	test("empty template produces empty string", () => {
		strictEqual(html``, "");
		strictEqual(safeHtml``, "");
	});

	test("template without interpolation passes through unchanged", () => {
		const template = "<div>Static content</div>";
		strictEqual(html`<div>Static content</div>`, template);
		strictEqual(safeHtml`<div>Static content</div>`, template);
	});

	test("single interpolation in middle of template", () => {
		const value = "test";
		strictEqual(html`<p>${value}</p>`, "<p>test</p>");
		strictEqual(safeHtml`<p>${value}</p>`, "<p>test</p>");
	});

	test("multiple interpolations in sequence", () => {
		const a = "Hello";
		const b = "World";
		strictEqual(html`${a} ${b}!`, "Hello World!");
		strictEqual(safeHtml`${a} ${b}!`, "Hello World!");
	});

	test("interpolation at template boundaries", () => {
		const start = "Begin";
		const end = "End";
		strictEqual(html`${start} content ${end}`, "Begin content End");
		strictEqual(safeHtml`${start} content ${end}`, "Begin content End");
	});

	test("multiline templates preserve whitespace", () => {
		const value = "content";
		const result = html`<div>
			<p>${value}</p>
		</div>`;
		strictEqual(result, "<div>\n\t\t\t<p>content</p>\n\t\t</div>");
	});

	test("templates with complex HTML structure", () => {
		const title = "Page Title";
		const body = "Page Body";
		const result = html`<!DOCTYPE html>
<html>
<head><title>${title}</title></head>
<body><h1>${title}</h1><p>${body}</p></body>
</html>`;
		strictEqual(
			result,
			`<!DOCTYPE html>
<html>
<head><title>Page Title</title></head>
<body><h1>Page Title</h1><p>Page Body</p></body>
</html>`,
		);
	});
});

describe("Data Type Processing", () => {
	describe("String Handling", () => {
		test("regular strings pass through html unchanged", () => {
			strictEqual(html`${"Hello World"}`, "Hello World");
		});

		test("empty strings produce no output", () => {
			strictEqual(html`<p>${""}</p>`, "<p></p>");
			strictEqual(safeHtml`<p>${""}</p>`, "<p></p>");
		});

		test("strings with special characters in html", () => {
			const dangerous = '<script>alert("xss")</script>';
			strictEqual(html`${dangerous}`, dangerous);
		});

		test("strings with unicode characters", () => {
			const unicode = "Hello 🌍 World ñáéíóú";
			strictEqual(html`${unicode}`, unicode);
			strictEqual(safeHtml`${unicode}`, unicode);
		});
	});

	describe("Number Handling", () => {
		test("positive integers", () => {
			strictEqual(html`${42}`, "42");
			strictEqual(safeHtml`${42}`, "42");
		});

		test("negative integers", () => {
			strictEqual(html`${-42}`, "-42");
			strictEqual(safeHtml`${-42}`, "-42");
		});

		test("zero preservation (critical behavioral contract)", () => {
			strictEqual(html`${0}`, "0");
			strictEqual(safeHtml`${0}`, "0");
		});

		test("floating point numbers", () => {
			const pi = Math.PI;
			strictEqual(html`${pi}`, String(Math.PI));
			strictEqual(safeHtml`${pi}`, String(Math.PI));
		});

		test("special numeric values", () => {
			strictEqual(html`${Number.POSITIVE_INFINITY}`, "Infinity");
			strictEqual(html`${Number.NEGATIVE_INFINITY}`, "-Infinity");
			strictEqual(html`${Number.NaN}`, "NaN");
			strictEqual(safeHtml`${Number.POSITIVE_INFINITY}`, "Infinity");
			strictEqual(safeHtml`${Number.NEGATIVE_INFINITY}`, "-Infinity");
			strictEqual(safeHtml`${Number.NaN}`, "NaN");
		});

		test("very large numbers", () => {
			const big = 999999999999999;
			strictEqual(html`${big}`, String(big));
			strictEqual(safeHtml`${big}`, String(big));
		});

		test("scientific notation", () => {
			const scientific = 1.23e-4;
			strictEqual(html`${scientific}`, String(scientific));
			strictEqual(safeHtml`${scientific}`, String(scientific));
		});
	});

	describe("Boolean Handling", () => {
		test("true renders as string", () => {
			strictEqual(html`${true}`, "true");
			strictEqual(safeHtml`${true}`, "true");
		});

		test("false renders as empty string (critical behavioral contract)", () => {
			strictEqual(html`${false}`, "");
			strictEqual(safeHtml`${false}`, "");
		});

		test("boolean in conditional context", () => {
			const showContent = true;
			const hideContent = false;
			strictEqual(html`${showContent && "Visible"}`, "Visible");
			strictEqual(html`${hideContent && "Hidden"}`, "");
		});
	});

	describe("Null and Undefined Handling", () => {
		test("null produces empty output", () => {
			strictEqual(html`${null}`, "");
			strictEqual(safeHtml`${null}`, "");
		});

		test("undefined produces empty output", () => {
			strictEqual(html`${undefined}`, "");
			strictEqual(safeHtml`${undefined}`, "");
		});

		test("null and undefined mixed with content", () => {
			strictEqual(html`<p>${null}content${undefined}</p>`, "<p>content</p>");
			strictEqual(
				safeHtml`<p>${null}content${undefined}</p>`,
				"<p>content</p>",
			);
		});
	});

	describe("Array Handling", () => {
		test("simple array flattening without separators", () => {
			strictEqual(html`${[1, 2, 3]}`, "123");
			strictEqual(safeHtml`${[1, 2, 3]}`, "123");
		});

		test("empty array produces no output", () => {
			strictEqual(html`${[]}`, "");
			strictEqual(safeHtml`${[]}`, "");
		});

		test("array with mixed data types", () => {
			const mixed = ["hello", 42, true, false, null, undefined];
			strictEqual(html`${mixed}`, "hello42true");
			strictEqual(safeHtml`${mixed}`, "hello42true");
		});

		test("nested arrays flatten completely", () => {
			const nested = [
				["a", "b"],
				["c", ["d", "e"]],
			];
			strictEqual(html`${nested}`, "abcde");
			strictEqual(safeHtml`${nested}`, "abcde");
		});

		test("array with HTML content in html", () => {
			const htmlArray = ["<b>Bold</b>", "<i>Italic</i>"];
			strictEqual(html`${htmlArray}`, "<b>Bold</b><i>Italic</i>");
		});

		test("array with HTML content in safeHtml gets escaped", () => {
			const htmlArray = ["<b>Bold</b>", "<i>Italic</i>"];
			strictEqual(
				safeHtml`${htmlArray}`,
				"&lt;b&gt;Bold&lt;/b&gt;&lt;i&gt;Italic&lt;/i&gt;",
			);
		});

		test("sparse arrays handle empty slots", () => {
			const sparse = [1, undefined, undefined, 4];
			// Note: sparse array behavior may vary - testing actual behavior
			const result = html`${sparse}`;
			ok(result.includes("1") && result.includes("4"));
		});
	});

	describe("Object and Complex Type Handling", () => {
		test("plain objects convert to string representation", () => {
			const obj = { name: "test", value: 42 };
			const result = html`${obj}`;
			strictEqual(result, "[object Object]");
		});

		test("objects with toString method use custom representation", () => {
			const obj = {
				name: "test",
				toString() {
					return `Custom: ${this.name}`;
				},
			};
			strictEqual(html`${obj}`, "Custom: test");
			strictEqual(safeHtml`${obj}`, "Custom: test");
		});

		test("Date objects render as date strings", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const result = html`${date}`;
			ok(result.includes("2024"));
		});

		test("functions render as string representation", () => {
			const fn = () => "test";
			const result = html`${fn}`;
			ok(result.includes("function") || result.includes("=>"));
		});

		test("symbols throw or render as string", () => {
			const sym = Symbol("test");
			// Testing actual behavior - may throw or convert to string
			try {
				const result = html`${sym}`;
				ok(typeof result === "string");
			} catch (error) {
				ok(error instanceof TypeError);
			}
		});
	});
});

describe("Security and XSS Protection", () => {
	describe("HTML Escaping in safeHtml", () => {
		test("basic HTML tags are escaped", () => {
			const dangerous = "<script>alert('xss')</script>";
			strictEqual(
				safeHtml`${dangerous}`,
				"&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;",
			);
		});

		test("all HTML entities are escaped", () => {
			const entities = "&<>\"'";
			strictEqual(safeHtml`${entities}`, "&amp;&lt;&gt;&quot;&#x27;");
		});

		test("mixed content with HTML", () => {
			const mixed = 'Hello <b>World</b> & "Friends"';
			strictEqual(
				safeHtml`${mixed}`,
				"Hello &lt;b&gt;World&lt;/b&gt; &amp; &quot;Friends&quot;",
			);
		});

		test("script injection attempts", () => {
			const attacks = [
				"<script>alert(1)</script>",
				"javascript:alert(1)",
				"<img src=x onerror=alert(1)>",
				"<svg onload=alert(1)>",
				'" onclick="alert(1)"',
			];

			attacks.forEach((attack) => {
				const result = safeHtml`<div>${attack}</div>`;
				ok(!result.includes("script>"));
				ok(!result.includes("onerror="));
				ok(!result.includes("onload="));
				ok(!result.includes("onclick="));
				ok(!result.includes("javascript:"));
			});
		});

		test("attribute injection protection", () => {
			const malicious = '" onmouseover="alert(1)" other="';
			const result = safeHtml`<input value="${malicious}">`;
			ok(!result.includes("onmouseover="));
		});
	});

	describe("No Escaping in html", () => {
		test("HTML passes through unchanged", () => {
			const htmlContent = "<b>Bold</b> & <i>Italic</i>";
			strictEqual(html`${htmlContent}`, htmlContent);
		});

		test("dangerous content passes through unchanged", () => {
			const dangerous = '<script>alert("xss")</script>';
			strictEqual(html`${dangerous}`, dangerous);
		});
	});

	describe("escapeHtml Function", () => {
		test("escapes all required HTML entities", () => {
			strictEqual(escapeHtml("&"), "&amp;");
			strictEqual(escapeHtml("<"), "&lt;");
			strictEqual(escapeHtml(">"), "&gt;");
			strictEqual(escapeHtml('"'), "&quot;");
			strictEqual(escapeHtml("'"), "&#x27;");
		});

		test("handles empty and null inputs", () => {
			strictEqual(escapeHtml(""), "");
			strictEqual(escapeHtml(null), "null");
			strictEqual(escapeHtml(undefined), "undefined");
		});

		test("preserves safe content", () => {
			const safe = "Hello World 123";
			strictEqual(escapeHtml(safe), safe);
		});

		test("handles numeric inputs", () => {
			strictEqual(escapeHtml(42), "42");
			strictEqual(escapeHtml(0), "0");
		});
	});
});

describe("Performance Features", () => {
	describe("Large Data Handling", () => {
		test("handles large arrays efficiently", () => {
			const large = Array(1000)
				.fill()
				.map((_, i) => i);
			const result = html`<div>${large}</div>`;
			ok(result.startsWith("<div>") && result.endsWith("</div>"));
			ok(result.includes("999")); // Last element
		});

		test("handles large strings", () => {
			const large = "x".repeat(10000);
			const result = html`<p>${large}</p>`;
			strictEqual(result, `<p>${large}</p>`);
		});

		test("handles deeply nested data", () => {
			const deep = Array(100)
				.fill()
				.reduce((acc) => [acc], "deep");
			const result = html`${deep}`;
			strictEqual(result, "deep");
		});
	});
});

describe("Edge Cases and Error Handling", () => {
	test("extremely long templates", () => {
		const longTemplate = "a".repeat(1000);
		const result = html`${longTemplate}`;
		strictEqual(result, longTemplate);
	});

	test("templates with only whitespace", () => {
		strictEqual(html`   `, "");
		strictEqual(html`\n\t\r`, "");
	});

	test("templates with special unicode characters", () => {
		const special = "🚀 ñáéíóú 中文 العربية русский";
		strictEqual(html`${special}`, special);
		strictEqual(safeHtml`${special}`, special);
	});

	test("control characters and escape sequences", () => {
		const control = "\n\t\r\0\b\f\v";
		const result = html`${control}`;
		strictEqual(result, "\0\b"); // trim() removes \n\t\r\f\v whitespace
	});

	test("circular reference protection", () => {
		const circular = {};
		circular.self = circular;

		// Should not cause stack overflow
		const result = html`${circular}`;
		ok(typeof result === "string");
	});

	test("very deeply nested arrays", () => {
		let nested = "base";
		for (let i = 0; i < 100; i++) {
			nested = [nested];
		}
		const result = html`${nested}`;
		strictEqual(result, "base");
	});
});

describe("Real-World Usage Patterns", () => {
	describe("Conditional Rendering", () => {
		test("conditional content with logical AND", () => {
			const showTitle = true;
			const hideTitle = false;
			const title = "Page Title";

			strictEqual(
				html`${showTitle && `<h1>${title}</h1>`}`,
				"<h1>Page Title</h1>",
			);
			strictEqual(html`${hideTitle && `<h1>${title}</h1>`}`, "");
		});

		test("ternary operator conditional", () => {
			const isLoggedIn = true;
			const user = "John";

			const result = html`${isLoggedIn ? `Welcome ${user}` : "Please login"}`;
			strictEqual(result, "Welcome John");
		});

		test("conditional classes and attributes", () => {
			const isActive = true;
			const isDisabled = false;

			const result = html`<button class="${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}">Click</button>`;
			strictEqual(result, '<button class="active ">Click</button>');
		});
	});

	describe("List Rendering", () => {
		test("simple list rendering", () => {
			const items = ["Apple", "Banana", "Cherry"];
			const result = html`<ul>${items.map((item) => html`<li>${item}</li>`)}</ul>`;
			strictEqual(
				result,
				"<ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul>",
			);
		});

		test("list with indexes", () => {
			const items = ["A", "B"];
			const result = html`<ol>${items.map((item, i) => html`<li>${i}: ${item}</li>`)}</ol>`;
			strictEqual(result, "<ol><li>0: A</li><li>1: B</li></ol>");
		});

		test("empty list handling", () => {
			const items = [];
			const result = html`<ul>${items.map((item) => html`<li>${item}</li>`)}</ul>`;
			strictEqual(result, "<ul></ul>");
		});

		test("list with complex objects", () => {
			const users = [
				{ id: 1, name: "Alice", active: true },
				{ id: 2, name: "Bob", active: false },
			];

			const result = html`<div>${users.map(
				(user) =>
					html`<div class="${user.active ? "active" : "inactive"}">${user.name}</div>`,
			)}</div>`;

			strictEqual(
				result,
				'<div><div class="active">Alice</div><div class="inactive">Bob</div></div>',
			);
		});
	});

	describe("Component Composition", () => {
		test("nested template composition", () => {
			const header = (title) => html`<header><h1>${title}</h1></header>`;
			const footer = (text) => html`<footer><p>${text}</p></footer>`;
			const page = (title, content, footerText) => html`
				${header(title)}
				<main>${content}</main>
				${footer(footerText)}
			`;

			const result = page("Home", "Welcome!", "© 2024");
			ok(result.includes("<header><h1>Home</h1></header>"));
			ok(result.includes("<main>Welcome!</main>"));
			ok(result.includes("<footer><p>© 2024</p></footer>"));
		});

		test("reusable component patterns", () => {
			const button = (text, type = "button", disabled = false) => html`
				<button type="${type}" ${disabled ? "disabled" : ""}>${text}</button>
			`;

			strictEqual(
				button("Click me"),
				'<button type="button" >Click me</button>',
			);
			strictEqual(
				button("Submit", "submit", true),
				'<button type="submit" disabled>Submit</button>',
			);
		});
	});

	describe("Data Binding Patterns", () => {
		test("form input binding", () => {
			const formData = {
				name: "John Doe",
				email: "john@example.com",
				message: "Hello & welcome!",
			};

			const form = html`
				<form>
					<input name="name" value="${formData.name}">
					<input name="email" value="${formData.email}">
					<textarea name="message">${formData.message}</textarea>
				</form>
			`;

			ok(form.includes('value="John Doe"'));
			ok(form.includes('value="john@example.com"'));
			ok(form.includes("Hello & welcome!"));
		});

		test("safe form input binding", () => {
			const userInput = '"><script>alert("xss")</script>';
			const safeForm = safeHtml`<input value="${userInput}">`;

			ok(!safeForm.includes("<script>"));
			ok(safeForm.includes("&quot;&gt;&lt;script&gt;"));
		});

		test("dynamic style and class binding", () => {
			const style = {
				color: "red",
				fontSize: "14px",
				display: "block",
			};

			const cssText = Object.entries(style)
				.map(
					([prop, value]) =>
						`${prop.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`,
				)
				.join("; ");

			const result = html`<div style="${cssText}">Styled content</div>`;
			strictEqual(
				result,
				'<div style="color: red; font-size: 14px; display: block">Styled content</div>',
			);
		});
	});

	describe("Advanced Template Patterns", () => {
		test("template with computed values", () => {
			const data = { items: [1, 2, 3, 4, 5] };
			const result = html`
				<div>
					Total: ${data.items.length}
					Sum: ${data.items.reduce((a, b) => a + b, 0)}
					Average: ${data.items.reduce((a, b) => a + b, 0) / data.items.length}
				</div>
			`;

			ok(result.includes("Total: 5"));
			ok(result.includes("Sum: 15"));
			ok(result.includes("Average: 3"));
		});

		test("template with async-ready patterns", () => {
			const asyncData = Promise.resolve("Loaded");
			// Template should handle promise objects gracefully
			const result = html`<div>Status: ${asyncData}</div>`;
			ok(result.includes("[object Promise]"));
		});
	});
});
