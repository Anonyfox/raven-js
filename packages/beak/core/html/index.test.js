/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Minimal test suite for HTML template engine - happy paths only for rapid iteration
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { escapeHtml, html, safeHtml } from "./index.js";

test("html - basic string interpolation", () => {
	const result = html`<p>${"Hello World"}</p>`;
	strictEqual(result, "<p>Hello World</p>");
});

test("html - number interpolation with zero preservation", () => {
	const result = html`<span>${0}</span><span>${42}</span>`;
	strictEqual(result, "<span>0</span><span>42</span>");
});

test("html - boolean handling", () => {
	const result = html`<div>${true}${false}</div>`;
	strictEqual(result, "<div>true</div>");
});

test("html - null/undefined filtering", () => {
	const result = html`<div>${null}${undefined}</div>`;
	strictEqual(result, "<div></div>");
});

test("html - array flattening without separators", () => {
	const result = html`<ul>${[1, 2, 3]}</ul>`;
	strictEqual(result, "<ul>123</ul>");
});

test("html - nested arrays", () => {
	const result = html`<div>${[["a", "b"], ["c", "d"]]}</div>`;
	strictEqual(result, "<div>abcd</div>");
});

test("html - complex nested template", () => {
	const items = ["item1", "item2"];
	const result = html`<ul>${items.map((item) => html`<li>${item}</li>`)}</ul>`;
	strictEqual(result, "<ul><li>item1</li><li>item2</li></ul>");
});

test("safeHtml - XSS protection", () => {
	const userInput = '<script>alert("xss")</script>';
	const result = safeHtml`<p>${userInput}</p>`;
	strictEqual(
		result,
		"<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>",
	);
});

test("safeHtml - mixed safe content", () => {
	const result = safeHtml`<div class="safe">${"<b>Bold</b>"}</div>`;
	strictEqual(result, '<div class="safe">&lt;b&gt;Bold&lt;/b&gt;</div>');
});

test("escapeHtml - all escape characters", () => {
	const result = escapeHtml("&<>\"'");
	strictEqual(result, "&amp;&lt;&gt;&quot;&#x27;");
});

test("escapeHtml - mixed content", () => {
	const result = escapeHtml('Hello <b>World</b> & "Friends"');
	strictEqual(
		result,
		"Hello &lt;b&gt;World&lt;/b&gt; &amp; &quot;Friends&quot;",
	);
});

test("safeHtml - circular reference protection", () => {
	const circular = [];
	circular.push(circular);
	const result = safeHtml`<div>${circular}</div>`;
	strictEqual(result, "<div>[Circular]</div>");
});

test("safeHtml - nested circular reference protection", () => {
	const outer = [];
	const inner = [];
	outer.push(inner);
	inner.push(outer);
	const result = safeHtml`<div>${outer}</div>`;
	strictEqual(result, "<div>[Circular]</div>");
});

test("html still fast - no circular protection (verify performance)", () => {
	// This test documents that html remains unsafe but fast
	// It should still crash on circular refs (expected behavior)
	const normalArray = [1, 2, 3];
	const result = html`<div>${normalArray}</div>`;
	strictEqual(result, "<div>123</div>");
	// Note: We don't test circular refs here as they'd crash the test
});

test("html - trims leading/trailing whitespace", () => {
	const result = html`
		<div>Content</div>
	`;
	strictEqual(result, "<div>Content</div>");
});

test("html - preserves internal whitespace", () => {
	const result = html`<span>A</span> <span>B</span>`;
	strictEqual(result, "<span>A</span> <span>B</span>");
});

test("safeHtml - trims leading/trailing whitespace", () => {
	const result = safeHtml`
		<div>Content</div>
	`;
	strictEqual(result, "<div>Content</div>");
});
