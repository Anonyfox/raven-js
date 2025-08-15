import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { pinterest } from "./pinterest.js";

describe("pinterest", () => {
	it("should generate correct Pinterest meta tags with all parameters", () => {
		const config = {
			description: "Check out this amazing content!",
			domain: "example.com",
			imageUrl: "/my-image.jpg",
			sourceUrl: "/my-page",
		};
		const result = pinterest(config);

		assert(result.includes('content="Check out this amazing content!"'));
		assert(result.includes('content="https://example.com/my-image.jpg"'));
		assert(result.includes('content="https://example.com/my-page"'));
		assert(result.includes('name="pinterest:description"'));
		assert(result.includes('name="pinterest:media"'));
		assert(result.includes('name="pinterest:source"'));
	});

	it("should generate correct Pinterest meta tags without optional parameters", () => {
		const config = {
			description: "Basic description",
			domain: "example.com",
		};
		const result = pinterest(config);

		assert(result.includes('content="Basic description"'));
		assert(result.includes('name="pinterest:description"'));
		assert(!result.includes("pinterest:media"));
		assert(!result.includes("pinterest:source"));
	});

	it("should handle absolute URLs correctly", () => {
		const config = {
			description: "Test description",
			domain: "example.com",
			imageUrl: "https://other.com/test-image.png",
			sourceUrl: "https://other.com/test-page",
		};
		const result = pinterest(config);

		assert(result.includes('content="https://other.com/test-image.png"'));
		assert(result.includes('content="https://other.com/test-page"'));
	});
});
