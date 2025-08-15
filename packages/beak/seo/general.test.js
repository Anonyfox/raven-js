import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { general } from "./general.js";

describe("general", () => {
	it("should generate correct general meta tags with all parameters", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
			suffix: "Test Suffix",
		};
		const result = general(config);

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
	});

	it("should generate correct general meta tags without suffix", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			path: "/test-path",
		};
		const result = general(config);

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
	});

	it("should handle absolute URLs correctly", () => {
		const config = {
			title: "Test Page",
			description: "This is a test description.",
			domain: "example.com",
			path: "https://other.com/test-path",
		};
		const result = general(config);

		assert(
			result.includes(
				'<link rel="canonical" href="https://other.com/test-path" />',
			),
		);
	});
});
