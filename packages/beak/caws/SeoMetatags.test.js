import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { SeoMetatags } from "./SeoMetatags.js";

describe("Metatags", () => {
	it("should generate correct meta tags with all parameters", () => {
		const params = {
			title: "Test Page",
			suffix: "Test Suffix",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
			imageUrl: "/test-image.png",
		};
		const result = SeoMetatags(params);
		assert(result.includes("<title>Test Page | Test Suffix</title>"));
		assert(
			result.includes(
				'<meta name="description" property="description" content="This is a test description." />',
			),
		);
		assert(
			result.includes(
				'<link rel="canonical" href="https://example.com/test-path" />',
			),
		);
		assert(
			result.includes(
				'<meta name="og:title" property="og:title" content="Test Page" />',
			),
		);
		assert(
			result.includes(
				'<meta name="og:image" property="og:image" content="https://example.com/test-image.png" />',
			),
		);
		assert(
			result.includes(
				'<meta name="twitter:image" property="twitter:image" content="https://example.com/test-image.png" />',
			),
		);
	});

	it("should generate correct meta tags without optional image", () => {
		const params = {
			title: "Test Page",
			suffix: "Test Suffix",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
		};
		const result = SeoMetatags(params);
		assert(result.includes("<title>Test Page | Test Suffix</title>"));
		assert(
			result.includes(
				'<meta name="description" property="description" content="This is a test description." />',
			),
		);
		assert(
			result.includes(
				'<link rel="canonical" href="https://example.com/test-path" />',
			),
		);
		assert(
			result.includes(
				'<meta name="og:title" property="og:title" content="Test Page" />',
			),
		);
		assert(!result.includes('<meta name="og:image" property="og:image"'));
		assert(
			!result.includes('<meta name="twitter:image" property="twitter:image"'),
		);
	});

	it("should handle missing suffix", () => {
		const params = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
			imageUrl: "/test-image.png",
		};
		const result = SeoMetatags(params);
		assert(result.includes("<title>Test Page</title>"));
		assert(
			result.includes(
				'<meta name="description" property="description" content="This is a test description." />',
			),
		);
		assert(
			result.includes(
				'<link rel="canonical" href="https://example.com/test-path" />',
			),
		);
		assert(
			result.includes(
				'<meta name="og:title" property="og:title" content="Test Page" />',
			),
		);
		assert(
			result.includes(
				'<meta name="og:image" property="og:image" content="https://example.com/test-image.png" />',
			),
		);
		assert(
			result.includes(
				'<meta name="twitter:image" property="twitter:image" content="https://example.com/test-image.png" />',
			),
		);
	});

	it("should handle absolute image URL", () => {
		const params = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
			imageUrl: "https://example.com/test-image.png",
		};
		const result = SeoMetatags(params);
		assert(
			result.includes(
				'<meta name="og:image" property="og:image" content="https://example.com/test-image.png" />',
			),
		);
		assert(
			result.includes(
				'<meta name="twitter:image" property="twitter:image" content="https://example.com/test-image.png" />',
			),
		);
	});
});
