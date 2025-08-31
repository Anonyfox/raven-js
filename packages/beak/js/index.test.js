import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { js, script, scriptAsync, scriptDefer } from "./index.js";

describe("core functionality", () => {
	it("should process JavaScript templates with value filtering and performance optimization", () => {
		// Empty template fast path
		assert.equal(js``, "");

		// Static content only
		assert.equal(js`const x = 42;`, "const x = 42;");

		// Single value fast path with valid values
		assert.equal(js`value: ${42}`, "value: 42");
		assert.equal(js`text: ${"test"}`, "text: test");
		assert.equal(js`zero: ${0}`, "zero: 0"); // Zero preserved

		// Single value fast path with filtered values
		assert.equal(js`empty: ${null}`, "empty:");
		assert.equal(js`empty: ${undefined}`, "empty:");
		assert.equal(js`empty: ${false}`, "empty:");

		// StringBuilder pattern (2-3 values)
		assert.equal(js`values: ${42}, ${null}, ${"test"}`, "values: 42, , test");
		assert.equal(js`three: ${1}, ${2}, ${3}`, "three: 1, 2, 3");

		// Array flattening
		assert.equal(js`array: ${[1, 2, 3]}`, "array: 123");
		assert.equal(js`nested: ${[[1, 2], [3, 4]]}`, "nested: 1,23,4");

		// Whitespace trimming
		assert.equal(js`  value: ${42}  `, "value: 42");
	});

	it("should use pre-allocated array optimization for large templates", () => {
		// Template with 4+ values triggers array pre-allocation optimization (lines 58-84)
		const result = js`config = {
			a: ${1},
			b: ${2},
			c: ${3},
			d: ${4},
			e: ${5}
		};`;
		assert.equal(
			result,
			"config = {\n\t\t\ta: 1,\n\t\t\tb: 2,\n\t\t\tc: 3,\n\t\t\td: 4,\n\t\t\te: 5\n\t\t};",
		);

		// Large template with mixed valid/invalid values
		const mixedResult = js`data = [${1}, ${null}, ${2}, ${undefined}, ${3}, ${false}, ${4}, ${0}];`;
		assert.equal(mixedResult, "data = [1, , 2, , 3, , 4, 0];");

		// Complex objects and arrays in large templates
		const obj = { key: "value" };
		const arr = [1, 2, 3];
		const complexResult = js`setup({
			config: ${obj},
			data: ${arr},
			count: ${42},
			name: ${"test"},
			active: ${true}
		});`;
		assert.equal(
			complexResult,
			"setup({\n\t\t\tconfig: [object Object],\n\t\t\tdata: 123,\n\t\t\tcount: 42,\n\t\t\tname: test,\n\t\t\tactive: true\n\t\t});",
		);
	});

	it("should provide script tag variants with identical JavaScript processing", () => {
		// Basic script wrapping
		assert.equal(
			script`console.log('test');`,
			"<script type=\"text/javascript\">console.log('test');</script>",
		);

		// Deferred script with interpolation
		assert.equal(
			scriptDefer`document.getElementById('${"app"}').focus();`,
			"<script type=\"text/javascript\" defer>document.getElementById('app').focus();</script>",
		);

		// Async script with complex data
		const config = { api: "https://api.example.com" };
		assert.equal(
			scriptAsync`fetch('${config.api}', { method: 'GET' });`,
			"<script type=\"text/javascript\" async>fetch('https://api.example.com', { method: 'GET' });</script>",
		);

		// Empty content handling
		assert.equal(script``, '<script type="text/javascript"></script>');
		assert.equal(
			scriptDefer``,
			'<script type="text/javascript" defer></script>',
		);
		assert.equal(
			scriptAsync``,
			'<script type="text/javascript" async></script>',
		);
	});
});

describe("edge cases and errors", () => {
	it("should handle complex data types and edge scenarios", () => {
		// Special JavaScript values
		const date = new Date("2023-01-01");
		assert.equal(js`date: ${date}`, `date: ${date}`);

		// Functions get stringified
		const func = () => "test";
		assert.equal(js`fn: ${func}`, 'fn: () => "test"');

		// Symbols convert to string
		const sym = Symbol("test");
		assert.equal(js`sym: ${sym}`, "sym: Symbol(test)");

		// BigInt handling
		const big = BigInt(123);
		assert.equal(js`big: ${big}`, "big: 123");

		// Deeply nested arrays
		const deep = [[[[[1]]]]];
		assert.equal(js`deep: ${deep}`, "deep: 1");

		// Mixed falsy values including edge cases
		assert.equal(
			js`mix: ${""}, ${0}, ${false}, ${null}, ${undefined}`,
			"mix: , 0, , ,",
		);
	});

	it("should optimize performance paths for various template sizes", () => {
		// Single value edge cases
		assert.equal(js`single: ${[]}`, "single:"); // Empty array
		assert.equal(js`single: ${{}}`, "single: [object Object]"); // Empty object

		// StringBuilder pattern with all invalid values
		assert.equal(js`invalid: ${null}, ${undefined}, ${false}`, "invalid: , ,");

		// Large template with mostly invalid values (tests validCount optimization)
		const largeInvalidResult = js`data = [
			${null}, ${undefined}, ${false}, ${null},
			${42}, // Only one valid value
			${undefined}, ${null}, ${false}, ${null}
		];`;
		assert.equal(
			largeInvalidResult,
			"data = [\n\t\t\t, , , ,\n\t\t\t42, // Only one valid value\n\t\t\t, , , \n\t\t];",
		);

		// Performance edge case: all values invalid in large template
		const allInvalidResult = js`config = {
			a: ${null},
			b: ${undefined},
			c: ${false},
			d: ${null},
			e: ${undefined}
		};`;
		assert.equal(
			allInvalidResult,
			"config = {\n\t\t\ta: ,\n\t\t\tb: ,\n\t\t\tc: ,\n\t\t\td: ,\n\t\t\te: \n\t\t};",
		);
	});
});

describe("integration scenarios", () => {
	it("should support real-world JavaScript generation patterns", () => {
		// Module initialization pattern
		const apiKey = "abc123";
		const debug = true;
		const moduleInit = js`
			window.MyApp = {
				apiKey: ${apiKey},
				debug: ${debug},
				version: ${"1.0.0"},
				init: function() {
					console.log('App initialized');
				}
			};
		`;
		assert.equal(
			moduleInit,
			"window.MyApp = {\n\t\t\t\tapiKey: abc123,\n\t\t\t\tdebug: true,\n\t\t\t\tversion: 1.0.0,\n\t\t\t\tinit: function() {\n\t\t\t\t\tconsole.log('App initialized');\n\t\t\t\t}\n\t\t\t};",
		);

		// Dynamic script generation with event handlers
		const handlers = {
			onClick: () => console.log("clicked"),
			onLoad: () => console.log("loaded"),
		};
		const eventScript = script`
			document.addEventListener('DOMContentLoaded', function() {
				const button = document.getElementById('btn');
				if (button) {
					button.onclick = ${handlers.onClick};
					window.onload = ${handlers.onLoad};
				}
			});
		`;
		assert.ok(eventScript.includes('<script type="text/javascript">'));
		assert.ok(
			eventScript.includes('button.onclick = () => console.log("clicked")'),
		);
		assert.ok(
			eventScript.includes('window.onload = () => console.log("loaded")'),
		);
		assert.ok(eventScript.includes("</script>"));

		// Configuration object generation
		const userConfig = {
			theme: "dark",
			language: "en",
			features: [1, 2, 3],
			enabled: true,
		};
		const configScript = scriptDefer`
			window.CONFIG = ${userConfig};
			window.init = function() {
				console.log('Config loaded:', window.CONFIG);
			};
		`;
		assert.ok(configScript.includes("defer>"));
		assert.ok(configScript.includes("[object Object]"));
		assert.ok(configScript.includes("console.log"));
		assert.ok(configScript.includes("window.CONFIG"));
	});

	it("should handle complex template composition and performance scenarios", () => {
		// API client generation
		const endpoints = ["users", "posts", "comments"];
		const baseUrl = "https://api.example.com";
		const apiClient = js`
			const api = {
				base: ${baseUrl},
				endpoints: ${endpoints},
				fetch: async (endpoint, options = {}) => {
					const url = api.base + '/' + endpoint;
					return fetch(url, options);
				}
			};
		`;
		assert.ok(apiClient.includes("https://api.example.com"));
		assert.ok(apiClient.includes("userspostscomments"));
		assert.ok(apiClient.includes("const url = api.base"));

		// Analytics tracking with async script
		const trackingId = "GA-123456";
		const events = ["pageview", "click", "scroll"];
		const analyticsScript = scriptAsync`
			(function() {
				const trackingId = ${trackingId};
				const events = ${events};

				function track(event, data) {
					fetch('/analytics', {
						method: 'POST',
						body: JSON.stringify({ event, data, id: trackingId })
					});
				}

				events.forEach(event => {
					document.addEventListener(event, (e) => track(event, e.target));
				});
			})();
		`;
		assert.ok(analyticsScript.includes("async>"));
		assert.ok(analyticsScript.includes("GA-123456"));
		assert.ok(analyticsScript.includes("pageviewclickscroll"));
		assert.ok(analyticsScript.includes("JSON.stringify"));
	});
});
