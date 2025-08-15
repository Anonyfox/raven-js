import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { openGraph } from "./open-graph.js";

describe("openGraph", () => {
	it("should generate correct Open Graph meta tags with all parameters", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
			imageUrl: "/test-image.png",
			type: "article",
		};
		const result = openGraph(config);

		assert(
			result.includes(
				'<meta name="og:type" property="og:type" content="article">',
			),
		);
		assert(
			result.includes(
				'<meta name="og:title" property="og:title" content="Test Page" />',
			),
		);
		assert(
			result.includes(
				'<meta name="og:description" property="og:description" content="This is a test description." />',
			),
		);
		assert(
			result.includes(
				'<meta name="og:url" property="og:url" content="https://example.com/test-path" />',
			),
		);
		assert(
			result.includes(
				'<meta name="og:image" property="og:image" content="https://example.com/test-image.png" />',
			),
		);
	});

	it("should generate correct Open Graph meta tags without image", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
		};
		const result = openGraph(config);

		assert(
			result.includes(
				'<meta name="og:type" property="og:type" content="website">',
			),
		);
		assert(
			result.includes(
				'<meta name="og:title" property="og:title" content="Test Page" />',
			),
		);
		assert(
			result.includes(
				'<meta name="og:description" property="og:description" content="This is a test description." />',
			),
		);
		assert(
			result.includes(
				'<meta name="og:url" property="og:url" content="https://example.com/test-path" />',
			),
		);
		assert(!result.includes('<meta name="og:image" property="og:image"'));
	});

	it("should handle absolute image URLs correctly", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
			imageUrl: "https://other.com/test-image.png",
		};
		const result = openGraph(config);

		assert(
			result.includes(
				'<meta name="og:image" property="og:image" content="https://other.com/test-image.png" />',
			),
		);
	});

	it("should use default type when not specified", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
		};
		const result = openGraph(config);

		assert(
			result.includes(
				'<meta name="og:type" property="og:type" content="website">',
			),
		);
	});
});
