import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { author } from "./author.js";

describe("author", () => {
	it("should generate correct author meta tags with all parameters", () => {
		const config = {
			name: "John Doe",
			email: "john@example.com",
		};
		const result = author(config);

		assert(result.includes('content="John Doe"'));
		assert(result.includes('content="john@example.com"'));
		assert(result.includes('name="author"'));
		assert(result.includes('name="reply-to"'));
		assert(!result.includes('rel="author"'));
		assert(!result.includes("twitter:creator"));
		assert(!result.includes("linkedin:owner"));
		assert(!result.includes("github:author"));
		assert(!result.includes("description"));
	});

	it("should generate correct author meta tags with minimal parameters", () => {
		const config = {
			name: "Jane Smith",
		};
		const result = author(config);

		assert(result.includes('content="Jane Smith"'));
		assert(result.includes('name="author"'));
		assert(!result.includes("reply-to"));
		assert(!result.includes('rel="author"'));
		assert(!result.includes("twitter:creator"));
		assert(!result.includes("linkedin:owner"));
		assert(!result.includes("github:author"));
		assert(!result.includes("description"));
	});

	it("should handle email only", () => {
		const config = {
			name: "Test User",
			email: "test@example.com",
		};
		const result = author(config);

		assert(result.includes('content="Test User"'));
		assert(result.includes('content="test@example.com"'));
		assert(result.includes('name="author"'));
		assert(result.includes('name="reply-to"'));
	});
});
