import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { twitter } from "./twitter.js";

describe("twitter", () => {
	it("generates basic Twitter Card meta tags", () => {
		const result = twitter({
			title: "My Page",
			description: "Page description",
			imageUrl: "/image.jpg",
			cardType: "summary_large_image",
		});

		assert(result.includes('name="twitter:card"'));
		assert(result.includes('content="summary_large_image"'));
		assert(result.includes('name="twitter:title"'));
		assert(result.includes('content="My Page"'));
		assert(result.includes('name="twitter:description"'));
		assert(result.includes('content="Page description"'));
	});

	it("defaults to summary card type", () => {
		const result = twitter({
			title: "Default Card",
			description: "Default description",
		});

		assert(result.includes('content="summary"'));
	});

	it("includes image tags when imageUrl provided", () => {
		const result = twitter({
			title: "With Image",
			description: "Has image",
			imageUrl: "/image.jpg",
		});

		assert(result.includes('name="twitter:image"'));
		assert(result.includes('content="/image.jpg"'));
		assert(result.includes('name="twitter:image:src"'));
		assert(result.includes('name="twitter:image:alt"'));
		assert(result.includes('content="Illustration of With Image"'));
	});

	it("constructs absolute image URLs with domain", () => {
		const result = twitter({
			title: "Absolute URL",
			description: "URL test",
			domain: "example.com",
			imageUrl: "/social.jpg",
		});

		assert(result.includes('content="https://example.com/social.jpg"'));
	});

	it("excludes image tags when no imageUrl", () => {
		const result = twitter({
			title: "No Image",
			description: "Without image",
		});

		assert(!result.includes("twitter:image"));
		assert(!result.includes("twitter:image:src"));
		assert(!result.includes("twitter:image:alt"));
	});

	it("handles imageUrl without domain", () => {
		const result = twitter({
			title: "Relative Image",
			description: "Local image",
			imageUrl: "/local.jpg",
		});

		assert(result.includes('content="/local.jpg"'));
	});

	it("includes both name and property attributes", () => {
		const result = twitter({
			title: "Dual Attrs",
			description: "Test content",
		});

		assert(result.includes('name="twitter:card"'));
		assert(result.includes('property="twitter:card"'));
		assert(result.includes('name="twitter:title"'));
		assert(result.includes('property="twitter:title"'));
		assert(result.includes('name="twitter:description"'));
		assert(result.includes('property="twitter:description"'));
	});

	it("handles HTML in content", () => {
		const result = twitter({
			title: "Test Script",
			description: "Content and more tags",
		});

		assert(result.includes("Test Script"));
		assert(result.includes("Content and more tags"));
	});

	it("generates alt text from title", () => {
		const result = twitter({
			title: "Amazing Product Launch",
			description: "Description",
			imageUrl: "/product.jpg",
		});

		assert(result.includes('content="Illustration of Amazing Product Launch"'));
	});

	it("accepts custom card types", () => {
		const cardTypes = ["summary", "summary_large_image", "app", "player"];

		for (const cardType of cardTypes) {
			const result = twitter({
				title: "Test",
				description: "Test",
				cardType,
			});

			assert(result.includes(`content="${cardType}"`));
		}
	});

	it("handles empty strings properly", () => {
		const result = twitter({
			title: "",
			description: "",
			imageUrl: "",
		});

		assert(result.includes('content=""'));
		assert(!result.includes("twitter:image"));
	});
});
