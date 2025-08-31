import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { linkedin } from "./linkedin.js";

describe("linkedin", () => {
	it("generates basic LinkedIn meta tags", () => {
		const result = linkedin({
			title: "Professional Article",
			description: "Industry analysis",
			domain: "example.com",
			path: "/article",
		});
		assert(result.includes('name="linkedin:title"'));
		assert(result.includes('content="Professional Article"'));
		assert(result.includes('name="linkedin:description"'));
		assert(result.includes('content="Industry analysis"'));
		assert(result.includes('content="https://example.com/article"'));
	});

	it("includes image tag when imageUrl provided", () => {
		const result = linkedin({
			title: "Article",
			description: "Content",
			domain: "example.com",
			path: "/post",
			imageUrl: "/image.jpg",
		});
		assert(result.includes('name="linkedin:image"'));
		assert(result.includes('content="https://example.com/image.jpg"'));
	});

	it("includes owner tag when owner provided", () => {
		const result = linkedin({
			title: "Article",
			description: "Content",
			owner: "linkedin.com/in/johndoe",
		});
		assert(result.includes('name="linkedin:owner"'));
		assert(result.includes('content="linkedin.com/in/johndoe"'));
	});

	it("includes company tag when company provided", () => {
		const result = linkedin({
			title: "Update",
			description: "News",
			company: "linkedin.com/company/brand",
		});
		assert(result.includes('name="linkedin:company"'));
		assert(result.includes('content="linkedin.com/company/brand"'));
	});

	it("handles all optional fields together", () => {
		const result = linkedin({
			title: "Complete Post",
			description: "Full content",
			domain: "site.com",
			path: "/post",
			imageUrl: "/img.jpg",
			owner: "linkedin.com/in/author",
			company: "linkedin.com/company/corp",
		});
		assert(result.includes("linkedin:image"));
		assert(result.includes("linkedin:owner"));
		assert(result.includes("linkedin:company"));
		assert(result.includes("https://site.com/post"));
		assert(result.includes("https://site.com/img.jpg"));
	});

	it("excludes optional tags when not provided", () => {
		const result = linkedin({
			title: "Simple",
			description: "Basic content",
		});
		assert(!result.includes("linkedin:image"));
		assert(!result.includes("linkedin:owner"));
		assert(!result.includes("linkedin:company"));
	});

	it("handles imageUrl without domain", () => {
		const result = linkedin({
			title: "Test",
			description: "Test content",
			imageUrl: "/local.jpg",
		});
		assert(result.includes('content="/local.jpg"'));
	});

	it("handles HTML in content", () => {
		const result = linkedin({
			title: "Test Script",
			description: "Content and more",
		});
		assert(result.includes("Test Script"));
		assert(result.includes("Content and more"));
	});
});
