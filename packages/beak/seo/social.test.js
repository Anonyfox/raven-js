import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { social } from "./social.js";

describe("social", () => {
	it("generates combined social media tags", () => {
		const result = social({
			title: "My Page",
			description: "Page description",
			domain: "example.com",
			path: "/page",
		});

		// Should include tags from all platforms
		assert(result.includes('property="og:title"')); // Open Graph
		assert(result.includes('name="twitter:title"')); // Twitter
		assert(result.includes('name="pinterest:description"')); // Pinterest
		assert(result.includes('name="linkedin:title"')); // LinkedIn
		assert(result.includes('name="discord:title"')); // Discord
	});

	it("passes through configuration to all platforms", () => {
		const result = social({
			title: "Article",
			description: "Content description",
			domain: "site.com",
			path: "/post",
			imageUrl: "/image.jpg",
		});

		// Check that image URL is constructed properly for each platform
		assert(result.includes('content="https://site.com/image.jpg"'));
		assert(result.includes('content="https://site.com/post"'));
		assert(result.includes('content="Article"'));
		assert(result.includes('content="Content description"'));
	});

	it("handles platform-specific configurations", () => {
		const result = social({
			title: "Full Page",
			description: "Complete description",
			domain: "site.com",
			path: "/post",
			imageUrl: "/social.jpg",
			ogType: "article",
			twitterCardType: "summary_large_image",
			linkedinOwner: "linkedin.com/in/author",
			linkedinCompany: "linkedin.com/company/corp",
			discordInvite: "abc123",
		});

		// Check Open Graph type
		assert(result.includes('content="article"'));

		// Check Twitter card type
		assert(result.includes('content="summary_large_image"'));

		// Check LinkedIn owner and company
		assert(result.includes('content="linkedin.com/in/author"'));
		assert(result.includes('content="linkedin.com/company/corp"'));

		// Check Discord invite
		assert(result.includes('content="abc123"'));
	});

	it("uses Pinterest sourceUrl fallback to path", () => {
		const result = social({
			title: "Test",
			description: "Test content",
			domain: "example.com",
			path: "/test-page",
		});

		// Pinterest should use path as sourceUrl when pinterestSourceUrl not provided
		assert(result.includes('name="pinterest:source"'));
		assert(result.includes('content="https://example.com/test-page"'));
	});

	it("uses explicit Pinterest sourceUrl when provided", () => {
		const result = social({
			title: "Test",
			description: "Test content",
			domain: "example.com",
			path: "/page",
			pinterestSourceUrl: "/custom-source",
		});

		assert(result.includes('content="https://example.com/custom-source"'));
	});

	it("handles minimal configuration", () => {
		const result = social({
			title: "Simple",
			description: "Basic content",
		});

		// Should still generate tags for all platforms
		assert(result.includes("og:title"));
		assert(result.includes("twitter:title"));
		assert(result.includes("pinterest:description"));
		assert(result.includes("linkedin:title"));
		assert(result.includes("discord:title"));
	});

	it("excludes optional fields when not provided", () => {
		const result = social({
			title: "No Optional",
			description: "Basic content",
		});

		// Should not include optional fields
		assert(!result.includes("linkedin:owner"));
		assert(!result.includes("linkedin:company"));
		assert(!result.includes("discord:invite"));
		assert(!result.includes("og:image"));
		assert(!result.includes("twitter:image"));
	});

	it("generates valid HTML structure", () => {
		const result = social({
			title: "HTML Test",
			description: "Structure test",
		});

		// Should have proper meta tag structure
		const metaTagCount = (result.match(/<meta/g) || []).length;
		assert(metaTagCount > 10); // Should have multiple meta tags

		// Should contain expected platforms
		assert(result.includes("og:title"));
		assert(result.includes("twitter:title"));
	});
});
