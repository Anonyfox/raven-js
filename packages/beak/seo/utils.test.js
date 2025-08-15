import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { absoluteUrl } from "./utils.js";

describe("absoluteUrl", () => {
	it("should convert relative URLs to absolute URLs", () => {
		assert.strictEqual(
			absoluteUrl("/test-path", "example.com"),
			"https://example.com/test-path",
		);
		assert.strictEqual(absoluteUrl("/", "example.com"), "https://example.com/");
		assert.strictEqual(
			absoluteUrl("/path/to/resource", "subdomain.example.com"),
			"https://subdomain.example.com/path/to/resource",
		);
	});

	it("should return absolute URLs unchanged", () => {
		assert.strictEqual(
			absoluteUrl("https://example.com/test-path", "example.com"),
			"https://example.com/test-path",
		);
		assert.strictEqual(
			absoluteUrl("http://other.com/path", "example.com"),
			"http://other.com/path",
		);
		assert.strictEqual(
			absoluteUrl("https://subdomain.example.com/resource", "example.com"),
			"https://subdomain.example.com/resource",
		);
	});

	it("should handle URLs without leading slash", () => {
		assert.strictEqual(
			absoluteUrl("test-path", "example.com"),
			"https://example.com/test-path",
		);
		assert.strictEqual(
			absoluteUrl("path/to/resource", "example.com"),
			"https://example.com/path/to/resource",
		);
	});

	it("should handle empty paths", () => {
		assert.strictEqual(absoluteUrl("", "example.com"), "https://example.com");
	});
});
