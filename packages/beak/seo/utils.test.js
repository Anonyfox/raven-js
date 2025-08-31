import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { absoluteUrl } from "./utils.js";

describe("absoluteUrl", () => {
	it("returns full URLs unchanged", () => {
		const url = "https://example.com/page";
		assert.equal(absoluteUrl(url, "other.com"), url);

		const httpUrl = "http://example.com/page";
		assert.equal(absoluteUrl(httpUrl, "other.com"), httpUrl);
	});

	it("constructs absolute URL from relative path", () => {
		const result = absoluteUrl("/path/to/page", "example.com");
		assert.equal(result, "https://example.com/path/to/page");
	});

	it("constructs absolute URL from path without leading slash", () => {
		const result = absoluteUrl("page", "example.com");
		assert.equal(result, "https://example.com/page");
	});

	it("handles empty path", () => {
		const result = absoluteUrl("", "example.com");
		assert.equal(result, "https://example.com");
	});

	it("handles null or undefined path", () => {
		const result1 = absoluteUrl(null, "example.com");
		assert.equal(result1, "https://example.com");

		const result2 = absoluteUrl(undefined, "example.com");
		assert.equal(result2, "https://example.com");
	});

	it("handles complex paths", () => {
		const result = absoluteUrl("/api/v1/users?active=true", "api.example.com");
		assert.equal(result, "https://api.example.com/api/v1/users?active=true");
	});

	it("handles path with fragment", () => {
		const result = absoluteUrl("/page#section", "example.com");
		assert.equal(result, "https://example.com/page#section");
	});
});
