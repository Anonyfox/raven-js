import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { author } from "./author.js";

describe("author", () => {
	it("generates author meta tag with name only", () => {
		const result = author({ name: "John Doe" });
		assert(result.includes('name="author"'));
		assert(result.includes('content="John Doe"'));
		assert(!result.includes("reply-to"));
	});

	it("generates author and reply-to meta tags with email", () => {
		const result = author({ name: "Jane Smith", email: "jane@example.com" });
		assert(result.includes('name="author"'));
		assert(result.includes('content="Jane Smith"'));
		assert(result.includes('name="reply-to"'));
		assert(result.includes('content="jane@example.com"'));
	});

	it("handles empty name", () => {
		const result = author({ name: "" });
		assert(result.includes('name="author"'));
		assert(result.includes('content=""'));
	});

	it("includes HTML in author name", () => {
		const result = author({ name: "John <script>alert('xss')</script> Doe" });
		assert(result.includes("<script>"));
		assert(
			result.includes("content=\"John <script>alert('xss')</script> Doe\""),
		);
	});

	it("includes HTML in email", () => {
		const result = author({
			name: "Test",
			email: "test@<malicious>.com",
		});
		assert(result.includes("<malicious>"));
		assert(result.includes('content="test@<malicious>.com"'));
	});

	it("handles special characters in name", () => {
		const result = author({ name: "José María & Co." });
		assert(result.includes("José María & Co."));
	});
});
