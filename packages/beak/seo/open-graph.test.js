import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { openGraph } from "./open-graph.js";

describe("openGraph", () => {
	it("generates basic Open Graph meta tags", () => {
		const result = openGraph({
			title: "My Page",
			description: "Page description",
			domain: "example.com",
			path: "/my-page",
			imageUrl: "/og-image.jpg",
		});
		assert(result.includes('property="og:title"'));
		assert(result.includes('content="My Page"'));
		assert(result.includes('property="og:description"'));
		assert(result.includes('content="Page description"'));
		assert(result.includes('property="og:url"'));
		assert(result.includes('content="https://example.com/my-page"'));
		assert(result.includes('property="og:image"'));
		assert(result.includes('content="https://example.com/og-image.jpg"'));
	});

	it("defaults to website type", () => {
		const result = openGraph({
			title: "Page",
			description: "Description",
		});
		assert(result.includes('property="og:type"'));
		assert(result.includes('content="website"'));
	});

	it("accepts custom type", () => {
		const result = openGraph({
			title: "Article",
			description: "Blog post",
			type: "article",
		});
		assert(result.includes('content="article"'));
	});

	it("excludes image tag when no imageUrl", () => {
		const result = openGraph({
			title: "No Image",
			description: "Content without image",
		});
		assert(!result.includes("og:image"));
	});

	it("handles minimal configuration", () => {
		const result = openGraph({
			title: "Simple",
			description: "Basic",
		});
		assert(result.includes('content="Simple"'));
		assert(result.includes('content="Basic"'));
		assert(result.includes('content="website"'));
	});

	it("constructs absolute URLs correctly", () => {
		const result = openGraph({
			title: "Test",
			description: "Test content",
			domain: "site.com",
			path: "page",
			imageUrl: "image.jpg",
		});
		assert(result.includes('content="https://site.com/page"'));
		assert(result.includes('content="https://site.com/image.jpg"'));
	});

	it("handles path and imageUrl without domain", () => {
		const result = openGraph({
			title: "Local",
			description: "Local content",
			path: "/local",
			imageUrl: "/local.jpg",
		});
		assert(result.includes('content="/local"'));
		assert(result.includes('content="/local.jpg"'));
	});

	it("includes both name and property attributes", () => {
		const result = openGraph({
			title: "Dual Attrs",
			description: "Test content",
		});
		assert(result.includes('name="og:title"'));
		assert(result.includes('property="og:title"'));
		assert(result.includes('name="og:description"'));
		assert(result.includes('property="og:description"'));
	});

	it("handles HTML in content", () => {
		const result = openGraph({
			title: "Test Script",
			description: "Content and more",
		});
		assert(result.includes("Test Script"));
		assert(result.includes("Content and more"));
	});
});
