/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Template inlining tests - validate correctness and edge cases
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { inline } from "./inline.js";

// Mock html2 function for testing
function html2(strings, ...values) {
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		result += (values[i] == null ? "" : String(values[i])) + strings[i + 1];
	}
	return result;
}

describe("inline - Template Literal Inlining", () => {
	it("should return original function when no tagged templates found", () => {
		const original = (data) => {
			return data.title;
		};

		const optimized = inline(original);
		assert.strictEqual(typeof optimized, "function");

		const result = optimized({ title: "Test" });
		assert.strictEqual(result, "Test");
	});

	it("should inline simple static template", () => {
		const original = () => {
			const header = html2`<h1>Hello World</h1>`;
			return header;
		};

		const optimized = inline(original);
		const result = optimized();

		// Should produce same result as original
		const expected = original();
		assert.strictEqual(result, expected);
		assert.strictEqual(result, "<h1>Hello World</h1>");
	});

	it("should inline template with simple interpolation", () => {
		const original = (data) => {
			const greeting = html2`<h1>Hello ${data.name}!</h1>`;
			return greeting;
		};

		const optimized = inline(original);
		const testData = { name: "Alice" };

		const result = optimized(testData);
		const expected = original(testData);

		assert.strictEqual(result, expected);
		assert.strictEqual(result, "<h1>Hello Alice!</h1>");
	});

	it("should inline multiple nested templates", () => {
		const original = (data) => {
			const header = html2`<h1>${data.title}</h1>`;
			const content = html2`<div>${data.content}</div>`;
			return html2`<article>${header}${content}</article>`;
		};

		const optimized = inline(original);
		const testData = {
			title: "Test Article",
			content: "Some content here",
		};

		const result = optimized(testData);
		const expected = original(testData);

		assert.strictEqual(result, expected);
	});

	it("should handle templates with complex expressions", () => {
		const original = (data) => {
			return html2`<div class="${data.active ? "active" : "inactive"}">${data.count > 0 ? data.count : "none"}</div>`;
		};

		const optimized = inline(original);
		const testData = { active: true, count: 5 };

		const result = optimized(testData);
		const expected = original(testData);

		assert.strictEqual(result, expected);
	});

	it("should not break on backticks in strings", () => {
		const original = () => {
			const message = "This is a `test` string";
			return html2`<div>${message}</div>`;
		};

		const optimized = inline(original);
		const result = optimized();
		const expected = original();

		assert.strictEqual(result, expected);
	});

	it("should handle escaped characters in templates", () => {
		const original = (data) => {
			return html2`<div>Price: \$${data.price}</div>`;
		};

		const optimized = inline(original);
		const testData = { price: "19.99" };

		const result = optimized(testData);
		const expected = original(testData);

		assert.strictEqual(result, expected);
	});

	it("should handle nested braces in expressions", () => {
		const original = (data) => {
			return html2`<ul>${data.items.map((item) => html2`<li>${item.name}</li>`)}</ul>`;
		};

		const optimized = inline(original);
		const testData = {
			items: [{ name: "Item 1" }, { name: "Item 2" }],
		};

		const result = optimized(testData);
		const expected = original(testData);

		assert.strictEqual(result, expected);
	});

	it("should preserve function parameters correctly", () => {
		const original = ({ title, description }) => {
			return html2`<div title="${title}">${description}</div>`;
		};

		const optimized = inline(original);
		const result = optimized({ title: "Test", description: "Content" });
		const expected = original({ title: "Test", description: "Content" });

		assert.strictEqual(result, expected);
	});

	it("should work with arrow functions", () => {
		const original = (data) => html2`<span>${data.value}</span>`;

		const optimized = inline(original);
		const testData = { value: "test" };

		const result = optimized(testData);
		const expected = original(testData);

		assert.strictEqual(result, expected);
	});

	it("should handle empty templates", () => {
		const original = () => {
			const empty = html2``;
			return html2`<div>${empty}</div>`;
		};

		const optimized = inline(original);
		const result = optimized();
		const expected = original();

		assert.strictEqual(result, expected);
	});
});
