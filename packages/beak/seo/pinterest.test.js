import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { pinterest } from "./pinterest.js";

describe("pinterest", () => {
	it("generates basic Pinterest meta tags", () => {
		const result = pinterest({
			description: "Check out this amazing content!",
			domain: "example.com",
			imageUrl: "/my-image.jpg",
			sourceUrl: "/my-page",
		});
		assert(result.includes('name="pinterest:description"'));
		assert(result.includes('content="Check out this amazing content!"'));
		assert(result.includes('name="pinterest:media"'));
		assert(result.includes('content="https://example.com/my-image.jpg"'));
		assert(result.includes('name="pinterest:source"'));
		assert(result.includes('content="https://example.com/my-page"'));
	});

	it("handles description only", () => {
		const result = pinterest({
			description: "Simple description",
		});
		assert(result.includes('name="pinterest:description"'));
		assert(result.includes('content="Simple description"'));
		assert(!result.includes("pinterest:media"));
		assert(!result.includes("pinterest:source"));
	});

	it("includes image tag when imageUrl and domain provided", () => {
		const result = pinterest({
			description: "With image",
			domain: "example.com",
			imageUrl: "/image.jpg",
		});
		assert(result.includes('name="pinterest:media"'));
		assert(result.includes('content="https://example.com/image.jpg"'));
	});

	it("includes source tag when sourceUrl and domain provided", () => {
		const result = pinterest({
			description: "With source",
			domain: "example.com",
			sourceUrl: "/page",
		});
		assert(result.includes('name="pinterest:source"'));
		assert(result.includes('content="https://example.com/page"'));
	});

	it("excludes image tag when no imageUrl", () => {
		const result = pinterest({
			description: "No image",
			domain: "example.com",
			sourceUrl: "/page",
		});
		assert(!result.includes("pinterest:media"));
	});

	it("excludes source tag when no sourceUrl", () => {
		const result = pinterest({
			description: "No source",
			domain: "example.com",
			imageUrl: "/image.jpg",
		});
		assert(!result.includes("pinterest:source"));
	});

	it("handles imageUrl without domain", () => {
		const result = pinterest({
			description: "Local image",
			imageUrl: "/local.jpg",
		});
		assert(result.includes('content="/local.jpg"'));
	});

	it("handles sourceUrl without domain", () => {
		const result = pinterest({
			description: "Local source",
			sourceUrl: "/local-page",
		});
		assert(result.includes('content="/local-page"'));
	});

	it("includes both name and property attributes", () => {
		const result = pinterest({
			description: "Dual attributes test",
		});
		assert(result.includes('name="pinterest:description"'));
		assert(result.includes('property="pinterest:description"'));
	});

	it("handles HTML in description", () => {
		const result = pinterest({
			description: "Content with script and entities",
		});
		assert(result.includes("Content with script and entities"));
	});
});
