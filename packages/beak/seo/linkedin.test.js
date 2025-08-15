import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { linkedin } from "./linkedin.js";

describe("linkedin", () => {
	it("should generate correct LinkedIn meta tags with all parameters", () => {
		const config = {
			title: "My Professional Article",
			description: "A detailed analysis of industry trends",
			domain: "example.com",
			path: "/article",
			imageUrl: "/article-image.jpg",
			owner: "linkedin.com/in/johndoe",
			company: "linkedin.com/company/mycompany",
		};
		const result = linkedin(config);

		assert(result.includes('content="My Professional Article"'));
		assert(result.includes('content="A detailed analysis of industry trends"'));
		assert(result.includes('content="https://example.com/article"'));
		assert(result.includes('content="https://example.com/article-image.jpg"'));
		assert(result.includes('content="linkedin.com/in/johndoe"'));
		assert(result.includes('content="linkedin.com/company/mycompany"'));
		assert(result.includes('name="linkedin:title"'));
		assert(result.includes('name="linkedin:description"'));
		assert(result.includes('name="linkedin:url"'));
		assert(result.includes('name="linkedin:image"'));
		assert(result.includes('name="linkedin:owner"'));
		assert(result.includes('name="linkedin:company"'));
	});

	it("should generate correct LinkedIn meta tags without optional parameters", () => {
		const config = {
			title: "Basic Article",
			description: "Basic description",
			domain: "example.com",
			path: "/basic",
		};
		const result = linkedin(config);

		assert(result.includes('content="Basic Article"'));
		assert(result.includes('content="Basic description"'));
		assert(result.includes('content="https://example.com/basic"'));
		assert(result.includes('name="linkedin:title"'));
		assert(result.includes('name="linkedin:description"'));
		assert(result.includes('name="linkedin:url"'));
		assert(!result.includes("linkedin:image"));
		assert(!result.includes("linkedin:owner"));
		assert(!result.includes("linkedin:company"));
	});

	it("should handle absolute URLs correctly", () => {
		const config = {
			title: "Test Article",
			description: "Test description",
			domain: "example.com",
			path: "/test",
			imageUrl: "https://other.com/test-image.png",
		};
		const result = linkedin(config);

		assert(result.includes('content="https://other.com/test-image.png"'));
	});
});
