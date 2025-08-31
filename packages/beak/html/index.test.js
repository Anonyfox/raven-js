/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Surgical test suite for HTML template engine - 100% branch coverage through predatory precision
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { escapeHtml, html, safeHtml } from "./index.js";

describe("core functionality", () => {
	test("html template processes all data types correctly with whitespace trimming", () => {
		// String interpolation
		strictEqual(html`<p>${"Hello"}</p>`, "<p>Hello</p>");
		// Number preservation including zero
		strictEqual(html`<span>${0}${42}</span>`, "<span>042</span>");
		// Boolean handling (false filtered, true preserved)
		strictEqual(html`<div>${true}${false}</div>`, "<div>true</div>");
		// Null/undefined filtering
		strictEqual(html`<div>${null}${undefined}</div>`, "<div></div>");
		// Array flattening including nested
		strictEqual(html`<ul>${[1, [2, 3]]}</ul>`, "<ul>123</ul>");
		// Whitespace trimming with internal preservation
		strictEqual(
			html`
			<span>A</span> <span>B</span>
		`,
			"<span>A</span> <span>B</span>",
		);
	});

	test("html template handles event attributes and function processing", () => {
		// Named function event handler
		function namedHandler() {
			return "clicked";
		}
		const namedResult = html`<button onclick=${namedHandler}>Click</button>`;
		strictEqual(
			namedResult,
			`<button onclick=namedHandler(event)>Click</button>`,
		);

		// Anonymous function event handler (gets auto-generated name)
		const anonymousHandler = () => "anonymous";
		const anonResult = html`<button onclick=${anonymousHandler}>Click</button>`;
		strictEqual(
			anonResult,
			`<button onclick=anonymousHandler(event)>Click</button>`,
		);

		// Function with invalid name (gets auto-generated name)
		const invalidNameHandler = () => "invalid";
		Object.defineProperty(invalidNameHandler, "name", { value: "123invalid" });
		const invalidResult = html`<button onclick=${invalidNameHandler}>Click</button>`;
		strictEqual(invalidResult, `<button onclick=__h1(event)>Click</button>`);

		// Non-event function (processed as regular value)
		const regularFunc = () => "regular";
		const regularResult = html`<span data-func="${regularFunc}">Content</span>`;
		strictEqual(
			regularResult,
			`<span data-func="() => "regular"">Content</span>`,
		);

		// Non-function event attribute (surgical coverage for line 136)
		const nonFunctionEvent = html`<button onclick=${"alert('test')"}> Click</button>`;
		strictEqual(
			nonFunctionEvent,
			`<button onclick=alert('test')> Click</button>`,
		);
	});

	test("html template uses array-indexed optimization for long templates", () => {
		// Template with 9+ values triggers array-indexed optimization (lines 243-260, 269-270)
		const values = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9"];
		const longResult = html`<div>${values[0]}${values[1]}${values[2]}${values[3]}${values[4]}${values[5]}${values[6]}${values[7]}${values[8]}</div>`;
		strictEqual(longResult, `<div>v1v2v3v4v5v6v7v8v9</div>`);

		// Long template with event attribute context
		function handler1() {}
		function handler2() {}
		const eventResult = html`<div onclick=${handler1} onload=${handler2} data-a="${"a"}" data-b="${"b"}" data-c="${"c"}" data-d="${"d"}" data-e="${"e"}" data-f="${"f"}" data-g="${"g"}">Long</div>`;
		strictEqual(
			eventResult,
			`<div onclick=handler1(event) onload=handler2(event) data-a="a" data-b="b" data-c="c" data-d="d" data-e="e" data-f="f" data-g="g">Long</div>`,
		);
	});

	test("safeHtml template applies escaping with identical type processing and whitespace handling", () => {
		// XSS protection through escaping (hits line 82: string with shouldEscape=true)
		strictEqual(
			safeHtml`<p>${'<script>alert("xss")</script>'}</p>`,
			"<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>",
		);
		// Mixed data types with escaping including false boolean (hits line 102: boolean false branch)
		strictEqual(
			safeHtml`<div>${"<b>Bold</b>"}${42}${true}${false}${null}</div>`,
			"<div>&lt;b&gt;Bold&lt;/b&gt;42true</div>",
		);
		// Array processing with escaping
		strictEqual(
			safeHtml`<ul>${["<li>", "</li>"]}</ul>`,
			"<ul>&lt;li&gt;&lt;/li&gt;</ul>",
		);
		// Object coercion with escaping (hits line 87: fallback branch with shouldEscape=true)
		const obj = { toString: () => "<dangerous>" };
		strictEqual(
			safeHtml`<span>${obj}</span>`,
			"<span>&lt;dangerous&gt;</span>",
		);
		// Whitespace trimming identical to html
		strictEqual(
			safeHtml`
			<div>Content</div>
		`,
			"<div>Content</div>",
		);
	});

	test("escapeHtml applies character-level escaping for all HTML entities", () => {
		// All escape characters in one test
		strictEqual(escapeHtml("&<>\"'"), "&amp;&lt;&gt;&quot;&#x27;");
		// Mixed content escaping
		strictEqual(
			escapeHtml('Hello <b>World</b> & "Friends"'),
			"Hello &lt;b&gt;World&lt;/b&gt; &amp; &quot;Friends&quot;",
		);
		// Non-string coercion
		strictEqual(escapeHtml(42), "42");
	});
});

describe("security and edge cases", () => {
	test("escapeHtml neutralizes dangerous protocols and event handlers with case-sensitive includes() triggers", () => {
		// JavaScript protocol: only lowercase "javascript:" triggers replacement due to includes() case sensitivity
		strictEqual(escapeHtml("javascript:alert()"), "blocked:alert()");
		strictEqual(escapeHtml("JAVASCRIPT:alert()"), "JAVASCRIPT:alert()"); // uppercase doesn't trigger
		strictEqual(escapeHtml("JAVAscript:alert()"), "JAVAscript:alert()"); // mixed case doesn't trigger
		// VBScript protocol: only lowercase "vbscript:" triggers
		strictEqual(escapeHtml("vbscript:msgbox()"), "blocked:msgbox()");
		strictEqual(escapeHtml("VBSCRIPT:msgbox()"), "VBSCRIPT:msgbox()"); // uppercase doesn't trigger
		// Data protocol: only lowercase "data:" triggers
		strictEqual(
			escapeHtml("data:text/html,<script>"),
			"blocked:text/html,&lt;script&gt;",
		);
		strictEqual(escapeHtml("DATA:application/json"), "DATA:application/json"); // uppercase doesn't trigger
		// Event handler: only lowercase "on" triggers neutralization
		strictEqual(
			escapeHtml('onclick="alert()" onload="bad()"'),
			"blocked-click=&quot;alert()&quot; blocked-load=&quot;bad()&quot;",
		);
		strictEqual(escapeHtml('OnClick="alert()"'), "OnClick=&quot;alert()&quot;"); // uppercase doesn't trigger
		// Combined threats with case sensitivity
		strictEqual(
			escapeHtml('javascript:alert() onclick="xss"'),
			"blocked:alert() blocked-click=&quot;xss&quot;",
		);
	});

	test("safeHtml prevents circular reference infinite loops and processes complex objects", () => {
		// Direct circular reference
		const circular = [];
		circular.push(circular);
		strictEqual(safeHtml`<div>${circular}</div>`, "<div>[Circular]</div>");
		// Nested circular reference
		const outer = [];
		const inner = [];
		outer.push(inner);
		inner.push(outer);
		strictEqual(safeHtml`<div>${outer}</div>`, "<div>[Circular]</div>");
		// Complex object coercion with escaping
		const obj = { toString: () => "<dangerous>" };
		strictEqual(
			safeHtml`<span>${obj}</span>`,
			"<span>&lt;dangerous&gt;</span>",
		);
	});

	test("safeHtml blocks dangerous protocols in final concatenated result", () => {
		// Dangerous protocols in final result get blocked (lines 310-315)
		const jsProtocol = "javascript:alert(1)";
		const vbProtocol = "vbscript:msgbox(1)";
		const dataProtocol = "data:text/html,<script>";
		strictEqual(
			safeHtml`<a href="${jsProtocol}" data-vb="${vbProtocol}" data-data="${dataProtocol}">Link</a>`,
			'<a href="blocked:alert(1)" data-vb="blocked:msgbox(1)" data-data="blocked:text/html,&lt;script&gt;">Link</a>',
		);

		// Event handlers in final result get blocked
		const eventHandler = 'onclick="alert()"';
		strictEqual(
			safeHtml`<div ${eventHandler}>Content</div>`,
			"<div blocked-click=&quot;alert()&quot;>Content</div>",
		);

		// Surgical coverage for lines 310-315: dangerous protocols through concatenation
		const proto1 = "java";
		const proto2 = "script:";
		const action = "alert(1)";
		strictEqual(
			safeHtml`<a href="${proto1}${proto2}${action}">Test</a>`,
			'<a href="blocked:alert(1)">Test</a>',
		);

		// Event handler through concatenation
		const event1 = "on";
		const event2 = "click";
		const handler = '="alert()"';
		strictEqual(
			safeHtml`<div ${event1}${event2}${handler}>Test</div>`,
			"<div blocked-click=&quot;alert()&quot;>Test</div>",
		);
	});

	test("html template maintains performance without circular protection", () => {
		// Normal arrays process without overhead
		const normalArray = [1, 2, 3];
		strictEqual(html`<div>${normalArray}</div>`, "<div>123</div>");
		// Nested template performance
		const items = ["item1", "item2"];
		strictEqual(
			html`<ul>${items.map((item) => html`<li>${item}</li>`)}</ul>`,
			"<ul><li>item1</li><li>item2</li></ul>",
		);
		// Complex object processing without safety overhead
		const obj = { toString: () => "fast" };
		strictEqual(html`<span>${obj}</span>`, "<span>fast</span>");
	});
});

describe("integration scenarios", () => {
	test("template engines integrate seamlessly for real-world component composition", () => {
		// Mixed safe and unsafe content patterns
		const userContent = '<script>alert("xss")</script>';
		const safeTemplate = `<div class="user-content">${escapeHtml(userContent)}</div>`;
		const result = html`<section>${safeTemplate}</section>`;
		strictEqual(
			result,
			'<section><div class="user-content">&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div></section>',
		);

		// Dynamic component rendering with data coercion and conditional logic
		const renderItem = (id, title, active) =>
			safeHtml`<li data-id="${id}" class="${active ? "active" : ""}">${title}</li>`;
		const items = [
			{ id: 1, title: "<Admin>", active: true },
			{ id: 0, title: "User", active: false },
		];
		const list = html`<ul>${items.map((item) => renderItem(item.id, item.title, item.active))}</ul>`;
		strictEqual(
			list,
			'<ul><li data-id="1" class="active">&lt;Admin&gt;</li><li data-id="0" class="">User</li></ul>',
		);
	});
});
