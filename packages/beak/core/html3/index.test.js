/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file HTML3 experimental template engine tests - stub implementation validation
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { escapeHtml, html3, safeHtml3 } from "./index.js";

describe("html3", () => {
	it("should export html3 function", () => {
		assert.strictEqual(typeof html3, "function");
	});

	it("should return helloworld stub for any template", () => {
		const result = html3`<div>test</div>`;
		assert.strictEqual(result, "helloworld");
	});

	it("should return helloworld stub for template with values", () => {
		const name = "test";
		const result = html3`<div>${name}</div>`;
		assert.strictEqual(result, "helloworld");
	});
});

describe("safeHtml3", () => {
	it("should export safeHtml3 function", () => {
		assert.strictEqual(typeof safeHtml3, "function");
	});

	it("should return helloworld stub for any template", () => {
		const result = safeHtml3`<div>test</div>`;
		assert.strictEqual(result, "helloworld");
	});

	it("should return helloworld stub for template with values", () => {
		const name = "test";
		const result = safeHtml3`<div>${name}</div>`;
		assert.strictEqual(result, "helloworld");
	});
});

describe("escapeHtml", () => {
	it("should export escapeHtml function", () => {
		assert.strictEqual(typeof escapeHtml, "function");
	});

	it("should return helloworld stub for any input", () => {
		const result = escapeHtml("<script>alert('xss')</script>");
		assert.strictEqual(result, "helloworld");
	});

	it("should return helloworld stub for empty input", () => {
		const result = escapeHtml("");
		assert.strictEqual(result, "helloworld");
	});
});
