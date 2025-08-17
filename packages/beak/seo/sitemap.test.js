import assert from "node:assert";
import { describe, it } from "node:test";
import { sitemap } from "./sitemap.js";

describe("sitemap", () => {
	it("should generate basic sitemap with required fields", () => {
		const result = sitemap({
			domain: "example.com",
			pages: ["/", "/about", "/contact"],
		});

		assert(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
		assert(
			result.includes(
				'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
			),
		);
		assert(result.includes("<loc>https://example.com/</loc>"));
		assert(result.includes("<loc>https://example.com/about</loc>"));
		assert(result.includes("<loc>https://example.com/contact</loc>"));
		assert(result.includes("<changefreq>weekly</changefreq>"));
		assert(result.includes("<priority>0.8</priority>"));
		assert(result.includes("</urlset>"));
	});

	it("should use custom lastmod, changefreq, and priority", () => {
		const customDate = "2024-01-01T00:00:00.000Z";
		const result = sitemap({
			domain: "example.com",
			pages: ["/"],
			lastmod: customDate,
			changefreq: "daily",
			priority: "1.0",
		});

		assert(result.includes(`<lastmod>${customDate}</lastmod>`));
		assert(result.includes("<changefreq>daily</changefreq>"));
		assert(result.includes("<priority>1.0</priority>"));
	});

	it("should handle pages without leading slash", () => {
		const result = sitemap({
			domain: "example.com",
			pages: ["about", "contact"],
		});

		assert(result.includes("<loc>https://example.com/about</loc>"));
		assert(result.includes("<loc>https://example.com/contact</loc>"));
	});

	it("should handle empty pages array", () => {
		const result = sitemap({
			domain: "example.com",
			pages: [],
		});

		assert(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
		assert(
			result.includes(
				'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
			),
		);
		assert(result.includes("</urlset>"));
		// Should not contain any <url> tags
		assert(!result.includes("<url>"));
	});

	it("should handle single page", () => {
		const result = sitemap({
			domain: "example.com",
			pages: ["/"],
		});

		const urlCount = (result.match(/<url>/g) || []).length;
		assert.strictEqual(urlCount, 1);
		assert(result.includes("<loc>https://example.com/</loc>"));
	});

	it("should use current date when lastmod is not provided", () => {
		const before = new Date();
		const result = sitemap({
			domain: "example.com",
			pages: ["/"],
		});
		const after = new Date();

		// Extract the lastmod from the result
		const lastmodMatch = result.match(/<lastmod>(.*?)<\/lastmod>/);
		assert(lastmodMatch, "Should contain lastmod tag");

		const lastmod = new Date(lastmodMatch[1]);
		assert(
			lastmod >= before,
			"lastmod should be after or equal to before time",
		);
		assert(lastmod <= after, "lastmod should be before or equal to after time");
	});

	it("should generate valid XML structure", () => {
		const result = sitemap({
			domain: "example.com",
			pages: ["/", "/about"],
		});

		// Check XML structure
		assert(result.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
		assert(
			result.includes(
				'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
			),
		);
		assert(result.endsWith("</urlset>"));

		// Count URL entries
		const urlCount = (result.match(/<url>/g) || []).length;
		assert.strictEqual(urlCount, 2);

		// Each URL should have all required elements
		const locCount = (result.match(/<loc>/g) || []).length;
		const lastmodCount = (result.match(/<lastmod>/g) || []).length;
		const changefreqCount = (result.match(/<changefreq>/g) || []).length;
		const priorityCount = (result.match(/<priority>/g) || []).length;

		assert.strictEqual(locCount, 2);
		assert.strictEqual(lastmodCount, 2);
		assert.strictEqual(changefreqCount, 2);
		assert.strictEqual(priorityCount, 2);
	});
});
