/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Minimal test suite for HTML2 template engine - happy paths only for rapid iteration
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { escapeHtml, html2, safeHtml2 } from "./index.js";

test("html2 - basic string interpolation", () => {
	const result = html2`<p>${"Hello World"}</p>`;
	strictEqual(result, "<p>Hello World</p>");
});

test("html2 - number interpolation with zero preservation", () => {
	const result = html2`<span>${0}</span><span>${42}</span>`;
	strictEqual(result, "<span>0</span><span>42</span>");
});

test("html2 - boolean handling", () => {
	const result = html2`<div>${true}${false}</div>`;
	strictEqual(result, "<div>true</div>");
});

test("html2 - null/undefined filtering", () => {
	const result = html2`<div>${null}${undefined}</div>`;
	strictEqual(result, "<div></div>");
});

test("html2 - array flattening without separators", () => {
	const result = html2`<ul>${[1, 2, 3]}</ul>`;
	strictEqual(result, "<ul>123</ul>");
});

test("html2 - nested arrays", () => {
	const result = html2`<div>${[["a", "b"], ["c", "d"]]}</div>`;
	strictEqual(result, "<div>abcd</div>");
});

test("html2 - complex nested template", () => {
	const items = ["item1", "item2"];
	const result = html2`<ul>${items.map((item) => html2`<li>${item}</li>`)}</ul>`;
	strictEqual(result, "<ul><li>item1</li><li>item2</li></ul>");
});

test("safeHtml2 - XSS protection", () => {
	const userInput = '<script>alert("xss")</script>';
	const result = safeHtml2`<p>${userInput}</p>`;
	strictEqual(
		result,
		"<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>",
	);
});

test("safeHtml2 - mixed safe content", () => {
	const result = safeHtml2`<div class="safe">${"<b>Bold</b>"}</div>`;
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
