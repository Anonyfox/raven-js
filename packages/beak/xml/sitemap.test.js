import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { sitemap } from "./sitemap.js";

describe("sitemap", () => {
	it("generates basic XML sitemap", () => {
		const pages = [{ path: "/" }, { path: "/about" }, { path: "/contact" }];
		const result = sitemap({ domain: "example.com", pages });

		assert(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
		assert(
			result.includes(
				'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
			),
		);
		assert(result.includes("<loc>https://example.com/</loc>"));
		assert(result.includes("<loc>https://example.com/about</loc>"));
		assert(result.includes("<loc>https://example.com/contact</loc>"));
		assert(result.includes("</urlset>"));
	});

	it("includes lastmod, changefreq, and priority", () => {
		const pages = [{ path: "/" }];
		const result = sitemap({ domain: "example.com", pages });

		assert(result.includes("<lastmod>"));
		assert(result.includes("<changefreq>weekly</changefreq>"));
		assert(result.includes("<priority>0.8</priority>"));
	});

	it("uses custom default values", () => {
		const pages = [{ path: "/" }];
		const result = sitemap({
			domain: "example.com",
			pages,
			lastmod: "2024-01-01T00:00:00.000Z",
			changefreq: "daily",
			priority: "1.0",
		});

		assert(result.includes("<lastmod>2024-01-01T00:00:00.000Z</lastmod>"));
		assert(result.includes("<changefreq>daily</changefreq>"));
		assert(result.includes("<priority>1.0</priority>"));
	});

	it("uses page-specific values over defaults", () => {
		const pages = [
			{
				path: "/important",
				lastmod: "2024-02-01T00:00:00.000Z",
				changefreq: "hourly",
				priority: "1.0",
			},
		];
		const result = sitemap({
			domain: "example.com",
			pages,
			lastmod: "2024-01-01T00:00:00.000Z",
			changefreq: "weekly",
			priority: "0.5",
		});

		assert(result.includes("<lastmod>2024-02-01T00:00:00.000Z</lastmod>"));
		assert(result.includes("<changefreq>hourly</changefreq>"));
		assert(result.includes("<priority>1.0</priority>"));
	});

	it("handles pages without domain", () => {
		const pages = [{ path: "/local" }];
		const result = sitemap({ pages });

		assert(result.includes("<loc>/local</loc>"));
	});

	it("handles empty pages array", () => {
		const result = sitemap({ domain: "example.com", pages: [] });

		assert(
			result.includes(
				'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
			),
		);
		assert(result.includes("</urlset>"));
		assert(!result.includes("<url>"));
	});

	it("includes URLs properly", () => {
		const pages = [{ path: "/search?q=test&type=all" }];
		const result = sitemap({ domain: "example.com", pages });

		assert(result.includes("/search?q=test&type=all"));
	});

	it("generates valid ISO date for default lastmod", () => {
		const pages = [{ path: "/" }];
		const result = sitemap({ domain: "example.com", pages });

		// Should contain a valid ISO date format
		const dateMatch = result.match(
			/<lastmod>(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)<\/lastmod>/,
		);
		assert(dateMatch);

		// Should be a valid date
		const date = new Date(dateMatch[1]);
		assert(!Number.isNaN(date.getTime()));
	});

	it("handles multiple pages with mixed configurations", () => {
		const pages = [
			{ path: "/" },
			{ path: "/blog", changefreq: "daily" },
			{ path: "/contact", priority: "0.5" },
		];
		const result = sitemap({ domain: "example.com", pages });

		assert(result.includes("<loc>https://example.com/</loc>"));
		assert(result.includes("<loc>https://example.com/blog</loc>"));
		assert(result.includes("<loc>https://example.com/contact</loc>"));

		// Check for custom values
		assert(result.includes("<changefreq>daily</changefreq>"));
		assert(result.includes("<priority>0.5</priority>"));
	});
});
