import assert from "node:assert";
import { describe, it } from "node:test";
import * as seo from "./index.js";

describe("seo/index.js", () => {
	it("should export all SEO functions", () => {
		// Test individual exports directly to avoid dynamic namespace access
		assert.strictEqual(typeof seo.author, "function");
		assert.strictEqual(typeof seo.canonical, "function");
		assert.strictEqual(typeof seo.discord, "function");
		assert.strictEqual(typeof seo.general, "function");
		assert.strictEqual(typeof seo.linkedin, "function");
		assert.strictEqual(typeof seo.openGraph, "function");
		assert.strictEqual(typeof seo.pinterest, "function");
		assert.strictEqual(typeof seo.robots, "function");
		assert.strictEqual(typeof seo.sitemap, "function");
		assert.strictEqual(typeof seo.social, "function");
		assert.strictEqual(typeof seo.twitter, "function");
	});

	it("should have working general function", () => {
		const result = seo.general({
			title: "Test Page",
			description: "Test description",
			domain: "example.com",
			path: "/test",
		});
		assert.strictEqual(typeof result, "string");
		assert(result.includes("Test Page"));
		assert(result.includes("Test description"));
	});

	it("should have working social function", () => {
		const result = seo.social({
			title: "Test Page",
			description: "Test description",
			domain: "example.com",
			path: "/test",
		});
		assert.strictEqual(typeof result, "string");
		assert(result.includes("og:title"));
		assert(result.includes("twitter:title"));
	});

	it("should have working robots function", () => {
		const result = seo.robots({ index: true, follow: true });
		assert.strictEqual(typeof result, "string");
		assert(result.includes("robots"));
	});

	it("should have working author function", () => {
		const result = seo.author({ name: "John Doe", email: "john@example.com" });
		assert.strictEqual(typeof result, "string");
		assert(result.includes("John Doe"));
	});

	it("should have working canonical function", () => {
		const result = seo.canonical({ domain: "example.com", path: "/test" });
		assert.strictEqual(typeof result, "string");
		assert(result.includes("canonical"));
		assert(result.includes("example.com/test"));
	});

	it("should have working sitemap function", () => {
		const result = seo.sitemap({
			domain: "example.com",
			pages: ["/", "/about"],
		});
		assert.strictEqual(typeof result, "string");
		assert(result.includes("<?xml"));
		assert(result.includes("urlset"));
	});
});
