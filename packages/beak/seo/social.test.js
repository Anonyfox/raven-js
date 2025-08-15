import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { social } from "./social.js";

describe("social", () => {
	it("should generate correct social meta tags with all parameters", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
			imageUrl: "/test-image.png",
			ogType: "article",
			twitterCardType: "summary_large_image",
		};
		const result = social(config);

		// Open Graph tags
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

		// Twitter Card tags
		assert(
			result.includes(
				'<meta name="twitter:card" property="twitter:card" content="summary_large_image" />',
			),
		);
		assert(
			result.includes(
				'<meta name="twitter:title" property="twitter:title" content="Test Page" />',
			),
		);
		assert(
			result.includes(
				'<meta name="twitter:description" property="twitter:description" content="This is a test description." />',
			),
		);
		assert(
			result.includes(
				'<meta name="twitter:image" property="twitter:image" content="https://example.com/test-image.png" />',
			),
		);
	});

	it("should generate correct social meta tags without image", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
		};
		const result = social(config);

		// Open Graph tags
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

		// Twitter Card tags
		assert(
			result.includes(
				'<meta name="twitter:card" property="twitter:card" content="summary" />',
			),
		);
		assert(
			result.includes(
				'<meta name="twitter:title" property="twitter:title" content="Test Page" />',
			),
		);
		assert(
			result.includes(
				'<meta name="twitter:description" property="twitter:description" content="This is a test description." />',
			),
		);
		assert(
			!result.includes('<meta name="twitter:image" property="twitter:image"'),
		);
	});

	it("should use default types when not specified", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
		};
		const result = social(config);

		assert(
			result.includes(
				'<meta name="og:type" property="og:type" content="website">',
			),
		);
		assert(
			result.includes(
				'<meta name="twitter:card" property="twitter:card" content="summary" />',
			),
		);
	});
});
