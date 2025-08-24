/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Exhaustive integration test suite for HTML2 template engine expectations
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
import { compile, escapeHtml, html2, safeHtml2 } from "./index.js";

describe("Basic Template Functionality", () => {
	test("empty template produces empty string", () => {
		strictEqual(html2``, "");
		strictEqual(safeHtml2``, "");
	});

	test("template without interpolation passes through unchanged", () => {
		const template = "<div>Static content</div>";
		strictEqual(html2`<div>Static content</div>`, template);
		strictEqual(safeHtml2`<div>Static content</div>`, template);
	});

	test("single interpolation in middle of template", () => {
		const value = "test";
		strictEqual(html2`<p>${value}</p>`, "<p>test</p>");
		strictEqual(safeHtml2`<p>${value}</p>`, "<p>test</p>");
	});

	test("multiple interpolations in sequence", () => {
		const a = "Hello";
		const b = "World";
		strictEqual(html2`${a} ${b}!`, "Hello World!");
		strictEqual(safeHtml2`${a} ${b}!`, "Hello World!");
	});

	test("interpolation at template boundaries", () => {
		const start = "Begin";
		const end = "End";
		strictEqual(html2`${start} content ${end}`, "Begin content End");
		strictEqual(safeHtml2`${start} content ${end}`, "Begin content End");
	});

	test("multiline templates preserve whitespace", () => {
		const value = "content";
		const result = html2`<div>
			<p>${value}</p>
		</div>`;
		strictEqual(result, "<div>\n\t\t\t<p>content</p>\n\t\t</div>");
	});

	test("templates with complex HTML structure", () => {
		const title = "Page Title";
		const body = "Page Body";
		const result = html2`<!DOCTYPE html>
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
		test("regular strings pass through html2 unchanged", () => {
			strictEqual(html2`${"Hello World"}`, "Hello World");
		});

		test("empty strings produce no output", () => {
			strictEqual(html2`<p>${""}</p>`, "<p></p>");
			strictEqual(safeHtml2`<p>${""}</p>`, "<p></p>");
		});

		test("strings with special characters in html2", () => {
			const dangerous = '<script>alert("xss")</script>';
			strictEqual(html2`${dangerous}`, dangerous);
		});

		test("strings with unicode characters", () => {
			const unicode = "Hello 🌍 World ñáéíóú";
			strictEqual(html2`${unicode}`, unicode);
			strictEqual(safeHtml2`${unicode}`, unicode);
		});
	});

	describe("Number Handling", () => {
		test("positive integers", () => {
			strictEqual(html2`${42}`, "42");
			strictEqual(safeHtml2`${42}`, "42");
		});

		test("negative integers", () => {
			strictEqual(html2`${-42}`, "-42");
			strictEqual(safeHtml2`${-42}`, "-42");
		});

		test("zero preservation (critical behavioral contract)", () => {
			strictEqual(html2`${0}`, "0");
			strictEqual(safeHtml2`${0}`, "0");
		});

		test("floating point numbers", () => {
			const pi = Math.PI;
			strictEqual(html2`${pi}`, String(Math.PI));
			strictEqual(safeHtml2`${pi}`, String(Math.PI));
		});

		test("special numeric values", () => {
			strictEqual(html2`${Number.POSITIVE_INFINITY}`, "Infinity");
			strictEqual(html2`${Number.NEGATIVE_INFINITY}`, "-Infinity");
			strictEqual(html2`${Number.NaN}`, "NaN");
			strictEqual(safeHtml2`${Number.POSITIVE_INFINITY}`, "Infinity");
			strictEqual(safeHtml2`${Number.NEGATIVE_INFINITY}`, "-Infinity");
			strictEqual(safeHtml2`${Number.NaN}`, "NaN");
		});

		test("very large numbers", () => {
			const big = 999999999999999;
			strictEqual(html2`${big}`, String(big));
			strictEqual(safeHtml2`${big}`, String(big));
		});

		test("scientific notation", () => {
			const scientific = 1.23e-4;
			strictEqual(html2`${scientific}`, String(scientific));
			strictEqual(safeHtml2`${scientific}`, String(scientific));
		});
	});

	describe("Boolean Handling", () => {
		test("true renders as string", () => {
			strictEqual(html2`${true}`, "true");
			strictEqual(safeHtml2`${true}`, "true");
		});

		test("false renders as empty string (critical behavioral contract)", () => {
			strictEqual(html2`${false}`, "");
			strictEqual(safeHtml2`${false}`, "");
		});

		test("boolean in conditional context", () => {
			const showContent = true;
			const hideContent = false;
			strictEqual(html2`${showContent && "Visible"}`, "Visible");
			strictEqual(html2`${hideContent && "Hidden"}`, "");
		});
	});

	describe("Null and Undefined Handling", () => {
		test("null produces empty output", () => {
			strictEqual(html2`${null}`, "");
			strictEqual(safeHtml2`${null}`, "");
		});

		test("undefined produces empty output", () => {
			strictEqual(html2`${undefined}`, "");
			strictEqual(safeHtml2`${undefined}`, "");
		});

		test("null and undefined mixed with content", () => {
			strictEqual(html2`<p>${null}content${undefined}</p>`, "<p>content</p>");
			strictEqual(
				safeHtml2`<p>${null}content${undefined}</p>`,
				"<p>content</p>",
			);
		});
	});

	describe("Array Handling", () => {
		test("simple array flattening without separators", () => {
			strictEqual(html2`${[1, 2, 3]}`, "123");
			strictEqual(safeHtml2`${[1, 2, 3]}`, "123");
		});

		test("empty array produces no output", () => {
			strictEqual(html2`${[]}`, "");
			strictEqual(safeHtml2`${[]}`, "");
		});

		test("array with mixed data types", () => {
			const mixed = ["hello", 42, true, false, null, undefined];
			strictEqual(html2`${mixed}`, "hello42true");
			strictEqual(safeHtml2`${mixed}`, "hello42true");
		});

		test("nested arrays flatten completely", () => {
			const nested = [
				["a", "b"],
				["c", ["d", "e"]],
			];
			strictEqual(html2`${nested}`, "abcde");
			strictEqual(safeHtml2`${nested}`, "abcde");
		});

		test("array with HTML content in html2", () => {
			const htmlArray = ["<b>Bold</b>", "<i>Italic</i>"];
			strictEqual(html2`${htmlArray}`, "<b>Bold</b><i>Italic</i>");
		});

		test("array with HTML content in safeHtml2 gets escaped", () => {
			const htmlArray = ["<b>Bold</b>", "<i>Italic</i>"];
			strictEqual(
				safeHtml2`${htmlArray}`,
				"&lt;b&gt;Bold&lt;/b&gt;&lt;i&gt;Italic&lt;/i&gt;",
			);
		});

		test("sparse arrays handle empty slots", () => {
			const sparse = [1, undefined, undefined, 4];
			// Note: sparse array behavior may vary - testing actual behavior
			const result = html2`${sparse}`;
			ok(result.includes("1") && result.includes("4"));
		});
	});

	describe("Object and Complex Type Handling", () => {
		test("plain objects convert to string representation", () => {
			const obj = { name: "test", value: 42 };
			const result = html2`${obj}`;
			strictEqual(result, "[object Object]");
		});

		test("objects with toString method use custom representation", () => {
			const obj = {
				name: "test",
				toString() {
					return `Custom: ${this.name}`;
				},
			};
			strictEqual(html2`${obj}`, "Custom: test");
			strictEqual(safeHtml2`${obj}`, "Custom: test");
		});

		test("Date objects render as date strings", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			const result = html2`${date}`;
			ok(result.includes("2024"));
		});

		test("functions render as string representation", () => {
			const fn = () => "test";
			const result = html2`${fn}`;
			ok(result.includes("function") || result.includes("=>"));
		});

		test("symbols throw or render as string", () => {
			const sym = Symbol("test");
			// Testing actual behavior - may throw or convert to string
			try {
				const result = html2`${sym}`;
				ok(typeof result === "string");
			} catch (error) {
				ok(error instanceof TypeError);
			}
		});
	});
});

describe("Security and XSS Protection", () => {
	describe("HTML Escaping in safeHtml2", () => {
		test("basic HTML tags are escaped", () => {
			const dangerous = "<script>alert('xss')</script>";
			strictEqual(
				safeHtml2`${dangerous}`,
				"&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;",
			);
		});

		test("all HTML entities are escaped", () => {
			const entities = "&<>\"'";
			strictEqual(safeHtml2`${entities}`, "&amp;&lt;&gt;&quot;&#x27;");
		});

		test("mixed content with HTML", () => {
			const mixed = 'Hello <b>World</b> & "Friends"';
			strictEqual(
				safeHtml2`${mixed}`,
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
				const result = safeHtml2`<div>${attack}</div>`;
				ok(!result.includes("script>"));
				ok(!result.includes("onerror="));
				ok(!result.includes("onload="));
				ok(!result.includes("onclick="));
				ok(!result.includes("javascript:"));
			});
		});

		test("attribute injection protection", () => {
			const malicious = '" onmouseover="alert(1)" other="';
			const result = safeHtml2`<input value="${malicious}">`;
			ok(!result.includes("onmouseover="));
		});
	});

	describe("No Escaping in html2", () => {
		test("HTML passes through unchanged", () => {
			const html = "<b>Bold</b> & <i>Italic</i>";
			strictEqual(html2`${html}`, html);
		});

		test("dangerous content passes through unchanged", () => {
			const dangerous = '<script>alert("xss")</script>';
			strictEqual(html2`${dangerous}`, dangerous);
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
	describe("Template Compilation", () => {
		test("compile function exists and accepts functions", () => {
			const template = (data) => html2`<p>${data.name}</p>`;
			const compiled = compile(template);
			ok(typeof compiled === "function");
		});

		test("compiled templates produce same output", () => {
			const data = { name: "Test", value: 42 };
			const template = (d) => html2`<div>${d.name}: ${d.value}</div>`;
			const compiled = compile(template);

			strictEqual(template(data), compiled(data));
		});

		test("compile handles template without interpolation", () => {
			const template = () => html2`<div>Static</div>`;
			const compiled = compile(template);
			strictEqual(template(), compiled());
		});

		test("compile gracefully handles non-template functions", () => {
			const nonTemplate = (x) => x * 2;
			const compiled = compile(nonTemplate);
			ok(typeof compiled === "function");
			strictEqual(compiled(5), nonTemplate(5));
		});

		test("compile handles functions with closures", () => {
			const external = "External";
			const template = (data) => html2`<p>${external} ${data}</p>`;
			const compiled = compile(template);

			// Should work whether optimized or not
			const result = compiled("Test");
			ok(result.includes("External") && result.includes("Test"));
		});
	});

	describe("Large Data Handling", () => {
		test("handles large arrays efficiently", () => {
			const large = Array(1000)
				.fill()
				.map((_, i) => i);
			const result = html2`<div>${large}</div>`;
			ok(result.startsWith("<div>") && result.endsWith("</div>"));
			ok(result.includes("999")); // Last element
		});

		test("handles large strings", () => {
			const large = "x".repeat(10000);
			const result = html2`<p>${large}</p>`;
			strictEqual(result, `<p>${large}</p>`);
		});

		test("handles deeply nested data", () => {
			const deep = Array(100)
				.fill()
				.reduce((acc) => [acc], "deep");
			const result = html2`${deep}`;
			strictEqual(result, "deep");
		});
	});
});

describe("Edge Cases and Error Handling", () => {
	test("extremely long templates", () => {
		const longTemplate = "a".repeat(1000);
		const result = html2`${longTemplate}`;
		strictEqual(result, longTemplate);
	});

	test("templates with only whitespace", () => {
		strictEqual(html2`   `, "");
		strictEqual(html2`\n\t\r`, "");
	});

	test("templates with special unicode characters", () => {
		const special = "🚀 ñáéíóú 中文 العربية русский";
		strictEqual(html2`${special}`, special);
		strictEqual(safeHtml2`${special}`, special);
	});

	test("control characters and escape sequences", () => {
		const control = "\n\t\r\0\b\f\v";
		const result = html2`${control}`;
		strictEqual(result, "\0\b"); // trim() removes \n\t\r\f\v whitespace
	});

	test("circular reference protection", () => {
		const circular = {};
		circular.self = circular;

		// Should not cause stack overflow
		const result = html2`${circular}`;
		ok(typeof result === "string");
	});

	test("very deeply nested arrays", () => {
		let nested = "base";
		for (let i = 0; i < 100; i++) {
			nested = [nested];
		}
		const result = html2`${nested}`;
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
				html2`${showTitle && `<h1>${title}</h1>`}`,
				"<h1>Page Title</h1>",
			);
			strictEqual(html2`${hideTitle && `<h1>${title}</h1>`}`, "");
		});

		test("ternary operator conditional", () => {
			const isLoggedIn = true;
			const user = "John";

			const result = html2`${isLoggedIn ? `Welcome ${user}` : "Please login"}`;
			strictEqual(result, "Welcome John");
		});

		test("conditional classes and attributes", () => {
			const isActive = true;
			const isDisabled = false;

			const result = html2`<button class="${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}">Click</button>`;
			strictEqual(result, '<button class="active ">Click</button>');
		});
	});

	describe("List Rendering", () => {
		test("simple list rendering", () => {
			const items = ["Apple", "Banana", "Cherry"];
			const result = html2`<ul>${items.map((item) => html2`<li>${item}</li>`)}</ul>`;
			strictEqual(
				result,
				"<ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul>",
			);
		});

		test("list with indexes", () => {
			const items = ["A", "B"];
			const result = html2`<ol>${items.map((item, i) => html2`<li>${i}: ${item}</li>`)}</ol>`;
			strictEqual(result, "<ol><li>0: A</li><li>1: B</li></ol>");
		});

		test("empty list handling", () => {
			const items = [];
			const result = html2`<ul>${items.map((item) => html2`<li>${item}</li>`)}</ul>`;
			strictEqual(result, "<ul></ul>");
		});

		test("list with complex objects", () => {
			const users = [
				{ id: 1, name: "Alice", active: true },
				{ id: 2, name: "Bob", active: false },
			];

			const result = html2`<div>${users.map(
				(user) =>
					html2`<div class="${user.active ? "active" : "inactive"}">${user.name}</div>`,
			)}</div>`;

			strictEqual(
				result,
				'<div><div class="active">Alice</div><div class="inactive">Bob</div></div>',
			);
		});
	});

	describe("Component Composition", () => {
		test("nested template composition", () => {
			const header = (title) => html2`<header><h1>${title}</h1></header>`;
			const footer = (text) => html2`<footer><p>${text}</p></footer>`;
			const page = (title, content, footerText) => html2`
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
			const button = (text, type = "button", disabled = false) => html2`
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

			const form = html2`
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
			const safeForm = safeHtml2`<input value="${userInput}">`;

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

			const result = html2`<div style="${cssText}">Styled content</div>`;
			strictEqual(
				result,
				'<div style="color: red; font-size: 14px; display: block">Styled content</div>',
			);
		});
	});

	describe("Advanced Template Patterns", () => {
		test("template with computed values", () => {
			const data = { items: [1, 2, 3, 4, 5] };
			const result = html2`
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
			const result = html2`<div>Status: ${asyncData}</div>`;
			ok(result.includes("[object Promise]"));
		});
	});
});
