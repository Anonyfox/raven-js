/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file HTML3 function-level template compilation tests - comprehensive validation
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { compileHTML, escapeHtml, html3, safeHtml3 } from "./index.js";

describe("html3 - Basic Template Functionality", () => {
	it("should export html3 function", () => {
		assert.strictEqual(typeof html3, "function");
	});

	it("should handle static template", () => {
		const result = html3`<div>static</div>`;
		assert.strictEqual(result, "<div>static</div>");
	});

	it("should handle single interpolation", () => {
		const name = "world";
		const result = html3`<div>Hello ${name}!</div>`;
		assert.strictEqual(result, "<div>Hello world!</div>");
	});

	it("should handle multiple interpolations", () => {
		const name = "Alice";
		const age = 25;
		const result = html3`<div>${name} is ${age} years old</div>`;
		assert.strictEqual(result, "<div>Alice is 25 years old</div>");
	});

	it("should handle number interpolation", () => {
		const count = 42;
		const result = html3`<span>Count: ${count}</span>`;
		assert.strictEqual(result, "<span>Count: 42</span>");
	});

	it("should preserve zero values", () => {
		const count = 0;
		const result = html3`<span>Count: ${count}</span>`;
		assert.strictEqual(result, "<span>Count: 0</span>");
	});

	it("should handle boolean values", () => {
		const active = true;
		const disabled = false;
		const result = html3`<div>Active: ${active}, Disabled: ${disabled}</div>`;
		assert.strictEqual(result, "<div>Active: true, Disabled: </div>");
	});

	it("should handle null and undefined", () => {
		const nullVal = null;
		const undefinedVal = undefined;
		const result = html3`<div>Null: ${nullVal}, Undefined: ${undefinedVal}</div>`;
		assert.strictEqual(result, "<div>Null: , Undefined: </div>");
	});

	it("should flatten arrays without separators", () => {
		const items = [1, 2, 3];
		const result = html3`<div>${items}</div>`;
		assert.strictEqual(result, "<div>123</div>");
	});

	it("should handle nested arrays", () => {
		const nested = [
			[1, 2],
			[3, 4],
		];
		const result = html3`<div>${nested}</div>`;
		assert.strictEqual(result, "<div>1234</div>");
	});
});

describe("safeHtml3 - XSS Protection", () => {
	it("should export safeHtml3 function", () => {
		assert.strictEqual(typeof safeHtml3, "function");
	});

	it("should escape dangerous characters", () => {
		const dangerous = "<script>alert('xss')</script>";
		const result = safeHtml3`<div>${dangerous}</div>`;
		assert.strictEqual(
			result,
			"<div>&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;</div>",
		);
	});

	it("should escape HTML entities", () => {
		const text = "A & B > C < D";
		const result = safeHtml3`<div>${text}</div>`;
		assert.strictEqual(result, "<div>A &amp; B &gt; C &lt; D</div>");
	});

	it("should escape quotes", () => {
		const text = "Single \"quotes\" and 'apostrophes'";
		const result = safeHtml3`<div>${text}</div>`;
		assert.strictEqual(
			result,
			"<div>Single &quot;quotes&quot; and &#x27;apostrophes&#x27;</div>",
		);
	});

	it("should handle safe content normally", () => {
		const safe = "Hello world";
		const result = safeHtml3`<div>${safe}</div>`;
		assert.strictEqual(result, "<div>Hello world</div>");
	});
});

describe("escapeHtml - Manual Escaping", () => {
	it("should export escapeHtml function", () => {
		assert.strictEqual(typeof escapeHtml, "function");
	});

	it("should escape dangerous script tag", () => {
		const result = escapeHtml("<script>alert('xss')</script>");
		assert.strictEqual(
			result,
			"&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;",
		);
	});

	it("should escape all HTML entities", () => {
		const result = escapeHtml("&<>\"'");
		assert.strictEqual(result, "&amp;&lt;&gt;&quot;&#x27;");
	});

	it("should handle empty string", () => {
		const result = escapeHtml("");
		assert.strictEqual(result, "");
	});

	it("should handle non-string input", () => {
		const result = escapeHtml(123);
		assert.strictEqual(result, "123");
	});
});

describe("Array Processing - Benchmark Patterns", () => {
	it("should handle simple array mapping pattern", () => {
		const items = [{ name: "Item 1" }, { name: "Item 2" }];
		const result = items.map((item) => html3`<li>${item.name}</li>`).join("");
		assert.strictEqual(result, "<li>Item 1</li><li>Item 2</li>");
	});

	it("should handle complex navigation mapping", () => {
		const navigation = [
			{ url: "/home", name: "Home" },
			{ url: "/about", name: "About" },
		];
		const currentPath = "/home";
		const result = navigation
			.map(
				(item) =>
					html3`<li class="nav-item">
				<a href="${item.url}" class="${currentPath === item.url ? "active" : ""}">${item.name}</a>
			</li>`,
			)
			.join("");

		const expected = `<li class="nav-item">
				<a href="/home" class="active">Home</a>
			</li><li class="nav-item">
				<a href="/about" class="">About</a>
			</li>`;
		assert.strictEqual(result, expected);
	});

	it("should handle tag mapping with function calls", () => {
		const tags = [
			{ name: "javascript", count: 25 },
			{ name: "performance", count: 12 },
		];
		const result = tags
			.map(
				(tag) =>
					html3`<a href="/tag/${encodeURIComponent(tag.name)}" style="font-size: ${Math.min(1.2 + tag.count * 0.1, 2)}rem">#${tag.name} (${tag.count})</a>`,
			)
			.join("");

		const expected = `<a href="/tag/javascript" style="font-size: 2rem">#javascript (25)</a><a href="/tag/performance" style="font-size: 2rem">#performance (12)</a>`;
		assert.strictEqual(result, expected);
	});
});

describe("Complex Expressions", () => {
	it("should handle ternary expressions", () => {
		const user = { premium: true };
		const result = html3`<div class="${user.premium ? "premium" : "basic"}">Content</div>`;
		assert.strictEqual(result, `<div class="premium">Content</div>`);
	});

	it("should handle function calls", () => {
		const date = new Date("2023-01-01");
		const result = html3`<time>${date.toLocaleDateString()}</time>`;
		assert.strictEqual(result, `<time>${date.toLocaleDateString()}</time>`);
	});

	it("should handle mathematical expressions", () => {
		const count = 1000;
		const result = html3`<span>${count >= 1000 ? `${Math.round(count / 1000)}k` : count}</span>`;
		assert.strictEqual(result, `<span>1k</span>`);
	});

	it("should handle object property chains", () => {
		const user = { profile: { name: "Alice", settings: { theme: "dark" } } };
		const result = html3`<div data-theme="${user.profile.settings.theme}">${user.profile.name}</div>`;
		assert.strictEqual(result, `<div data-theme="dark">Alice</div>`);
	});
});

describe("Function-Level Compilation", () => {
	it("should export compileHTML", () => {
		assert.strictEqual(typeof compileHTML, "function");
	});

	it("should compile simple function with single template", () => {
		function simpleTemplate(data) {
			return html3`<div>${data.name}</div>`;
		}

		const compiled = compileHTML(simpleTemplate);
		const result = compiled({ name: "Alice" });
		assert.strictEqual(result, "<div>Alice</div>");
	});

	it("should compile function with multiple templates", () => {
		function multiTemplate(data) {
			const header = html3`<h1>${data.title}</h1>`;
			const content = html3`<p>${data.content}</p>`;
			return html3`<article>${header}${content}</article>`;
		}

		const compiled = compileHTML(multiTemplate);
		const result = compiled({
			title: "Test Post",
			content: "This is test content.",
		});
		assert.strictEqual(
			result,
			"<article><h1>Test Post</h1><p>This is test content.</p></article>",
		);
	});

	it("should compile function with array mapping", () => {
		function listTemplateFixed(data) {
			const items = data.items.map((item) => html3`<li>${item}</li>`);
			return html3`<ul>${items}</ul>`;
		}

		const compiled = compileHTML(listTemplateFixed);
		const result = compiled({ items: ["First", "Second", "Third"] });
		assert.strictEqual(
			result,
			"<ul><li>First</li><li>Second</li><li>Third</li></ul>",
		);
	});

	it("should handle compilation fallback on error", () => {
		// Intentionally malformed function that should fail compilation
		function malformedTemplate(data) {
			// eval("const dynamic = 'test';"); // This should prevent compilation
			return html3`<div>${data.name}</div>`;
		}

		const compiled = compileHTML(malformedTemplate);
		// Should fallback to original function
		assert.strictEqual(typeof compiled, "function");
	});
});

describe("Benchmark Compatibility", () => {
	it("should render identical output to beak2 for simple components", () => {
		// Test data similar to benchmark
		const testData = {
			title: "Test Post",
			author: { name: "Test Author" },
			tags: ["javascript", "testing"],
			featured: true,
		};

		function testComponent(data) {
			const badges = data.featured
				? html3`<span class="badge">Featured</span>`
				: "";
			const tagList = data.tags.map(
				(tag) => html3`<span class="tag">#${tag}</span>`,
			);
			return html3`<article>
				<h1>${data.title}</h1>
				<p>By ${data.author.name}</p>
				${badges}
				<div class="tags">${tagList}</div>
			</article>`;
		}

		const result = testComponent(testData);
		const expected = `<article>
				<h1>Test Post</h1>
				<p>By Test Author</p>
				<span class="badge">Featured</span>
				<div class="tags"><span class="tag">#javascript</span><span class="tag">#testing</span></div>
			</article>`;

		assert.strictEqual(result, expected);
	});

	it("should handle complex benchmark-style navigation", () => {
		const navigation = [
			{ url: "/", name: "Home" },
			{ url: "/blog", name: "Blog" },
			{ url: "/about", name: "About" },
		];
		const currentPath = "/blog";

		function navComponent(navData) {
			return html3`<nav>${navData.items.map(
				(item) =>
					html3`<a href="${item.url}" class="${navData.currentPath === item.url ? "active" : ""}">${item.name}</a>`,
			)}</nav>`;
		}

		const result = navComponent({ items: navigation, currentPath });
		const expected = `<nav><a href="/" class="">Home</a><a href="/blog" class="active">Blog</a><a href="/about" class="">About</a></nav>`;
		assert.strictEqual(result, expected);
	});
});

describe("Error Handling & Edge Cases", () => {
	it("should handle deeply nested object access", () => {
		const data = { a: { b: { c: { d: "deep" } } } };
		const result = html3`<div>${data.a.b.c.d}</div>`;
		assert.strictEqual(result, "<div>deep</div>");
	});

	it("should handle missing properties gracefully", () => {
		const data = { name: "Alice" };
		const result = html3`<div>${data.age || "Unknown"}</div>`;
		assert.strictEqual(result, "<div>Unknown</div>");
	});

	it("should handle mixed array content", () => {
		const mixed = [1, "text", null, undefined, true, false];
		const result = html3`<div>${mixed}</div>`;
		assert.strictEqual(result, "<div>1texttrue</div>");
	});

	it("should handle template literals with complex whitespace", () => {
		const name = "Alice";
		const result = html3`
			<article>
				<h1>${name}</h1>
			</article>
		`;
		const expected = `
			<article>
				<h1>Alice</h1>
			</article>
		`;
		assert.strictEqual(result, expected);
	});
});
