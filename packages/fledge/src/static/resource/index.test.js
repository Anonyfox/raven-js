/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";

import { Attempt, extractUrlsFromHtml, Resource } from "./index.js";

describe("resource index", () => {
	test("exports Resource class", () => {
		assert.strictEqual(typeof Resource, "function");
		assert.strictEqual(Resource.name, "Resource");
	});

	test("exports Attempt class", () => {
		assert.strictEqual(typeof Attempt, "function");
		assert.strictEqual(Attempt.name, "Attempt");
	});

	test("exports extractUrlsFromHtml function", () => {
		assert.strictEqual(typeof extractUrlsFromHtml, "function");
		assert.strictEqual(extractUrlsFromHtml.name, "extractUrlsFromHtml");
	});

	test("Resource has static fetch method", () => {
		assert.strictEqual(typeof Resource.fetch, "function");
	});

	test("Attempt can be instantiated", () => {
		const attempt = new Attempt("https://example.com", 200, 100);
		assert(attempt instanceof Attempt);
		assert.strictEqual(attempt.statusCode, 200);
	});

	test("extractUrlsFromHtml processes HTML", () => {
		const html = '<a href="/test">Test</a>';
		const urls = extractUrlsFromHtml(html, "https://example.com");
		assert(urls instanceof Set);
		assert.strictEqual(urls.size, 1);
	});
});
