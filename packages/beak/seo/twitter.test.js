import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { twitter } from "./twitter.js";

describe("twitter", () => {
	it("should generate correct Twitter Card meta tags with all parameters", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			imageUrl: "/test-image.png",
			cardType: "summary_large_image",
		};
		const result = twitter(config);

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
		assert(
			result.includes(
				'<meta name="twitter:image:src" property="twitter:image:src" content="https://example.com/test-image.png">',
			),
		);
		assert(
			result.includes(
				'<meta name="twitter:image:alt" property="twitter:image:alt" content="Illustration of Test Page">',
			),
		);
	});

	it("should generate correct Twitter Card meta tags without image", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
		};
		const result = twitter(config);

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
		assert(
			!result.includes(
				'<meta name="twitter:image:src" property="twitter:image:src"',
			),
		);
		assert(
			!result.includes(
				'<meta name="twitter:image:alt" property="twitter:image:alt"',
			),
		);
	});

	it("should handle absolute image URLs correctly", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			imageUrl: "https://other.com/test-image.png",
		};
		const result = twitter(config);

		assert(
			result.includes(
				'<meta name="twitter:image" property="twitter:image" content="https://other.com/test-image.png" />',
			),
		);
	});

	it("should use default card type when not specified", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
		};
		const result = twitter(config);

		assert(
			result.includes(
				'<meta name="twitter:card" property="twitter:card" content="summary" />',
			),
		);
	});
});
