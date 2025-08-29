/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for sitemap route handler
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Context } from "@raven-js/wings";
import { createSitemapHandler } from "./sitemap.js";

describe("createSitemapHandler", () => {
	/**
	 * Create real Wings context for testing
	 * @returns {Context} Real Wings context
	 */
	function createTestContext() {
		const url = new URL("http://localhost:3000/sitemap.xml");
		const headers = new Headers();
		return new Context("GET", url, headers);
	}

	/**
	 * Create mock package for testing
	 * @returns {Object} Mock package instance
	 */
	function createMockPackage() {
		return {
			modules: [
				{
					importPath: "test-package",
					isDefault: true,
					publicEntities: [{ name: "mainFunction" }, { name: "MainClass" }],
				},
				{
					importPath: "test-package/utils",
					isDefault: false,
					publicEntities: [{ name: "helperFunction" }],
				},
			],
		};
	}

	test("generates XML sitemap response", async () => {
		const mockPackage = createMockPackage();
		const handler = createSitemapHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Should return 200 status
		assert.strictEqual(ctx.responseStatusCode, 200, "Returns 200 status");

		// Should set proper XML content type
		assert.strictEqual(
			ctx.responseHeaders.get("Content-Type"),
			"application/xml; charset=utf-8",
			"Sets XML content type",
		);

		// Should have XML response body
		assert(typeof ctx.responseBody === "string", "Response body is string");
		assert(
			ctx.responseBody.startsWith("<?xml"),
			"Response starts with XML declaration",
		);
		assert(ctx.responseBody.includes("<urlset"), "Response contains urlset");
	});

	test("includes all expected URLs in sitemap", async () => {
		const mockPackage = createMockPackage();
		const baseUrl = "https://docs.example.com";
		const handler = createSitemapHandler(mockPackage, { baseUrl });
		const ctx = createTestContext();

		await handler(ctx);

		const xml = ctx.responseBody;

		// Should include package overview
		assert(
			xml.includes(`<loc>${baseUrl}/</loc>`),
			"Includes package overview URL",
		);

		// Should include module directory
		assert(
			xml.includes(`<loc>${baseUrl}/modules/</loc>`),
			"Includes module directory URL",
		);

		// Should include module pages
		assert(
			xml.includes(`<loc>${baseUrl}/modules/test-package/</loc>`),
			"Includes default module URL",
		);
		assert(
			xml.includes(`<loc>${baseUrl}/modules/utils/</loc>`),
			"Includes utils module URL",
		);

		// Should include entity pages
		assert(
			xml.includes(`<loc>${baseUrl}/modules/test-package/mainFunction/</loc>`),
			"Includes entity URL",
		);
		assert(
			xml.includes(`<loc>${baseUrl}/modules/test-package/MainClass/</loc>`),
			"Includes class URL",
		);
		assert(
			xml.includes(`<loc>${baseUrl}/modules/utils/helperFunction/</loc>`),
			"Includes helper URL",
		);
	});

	test("sets appropriate HTTP headers", async () => {
		const mockPackage = createMockPackage();
		const handler = createSitemapHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Should set XML content type
		assert.strictEqual(
			ctx.responseHeaders.get("Content-Type"),
			"application/xml; charset=utf-8",
			"Sets correct content type",
		);

		// Should set cache headers for 24 hours
		assert.strictEqual(
			ctx.responseHeaders.get("Cache-Control"),
			"public, max-age=86400",
			"Sets appropriate cache control",
		);

		// Should set robots tag to not index sitemap itself
		assert.strictEqual(
			ctx.responseHeaders.get("X-Robots-Tag"),
			"noindex",
			"Sets noindex robots tag",
		);
	});

	test("handles custom base URL option", async () => {
		const mockPackage = createMockPackage();
		const customBaseUrl = "https://custom.docs.com";
		const handler = createSitemapHandler(mockPackage, {
			baseUrl: customBaseUrl,
		});
		const ctx = createTestContext();

		await handler(ctx);

		const xml = ctx.responseBody;

		// All URLs should use custom base URL
		assert(
			xml.includes(`<loc>${customBaseUrl}/</loc>`),
			"Uses custom base URL",
		);
		assert(
			xml.includes(`<loc>${customBaseUrl}/modules/</loc>`),
			"Uses custom base URL for modules",
		);
		assert(!xml.includes("docs.example.com"), "Does not use default base URL");
	});

	test("generates valid XML structure", async () => {
		const mockPackage = createMockPackage();
		const handler = createSitemapHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		const xml = ctx.responseBody;

		// Should be valid XML structure
		assert(
			xml.includes('<?xml version="1.0" encoding="UTF-8"?>'),
			"Has XML declaration",
		);
		assert(
			xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'),
			"Has sitemap namespace",
		);
		assert(xml.includes("<urlset"), "Has urlset opening tag");
		assert(xml.includes("</urlset>"), "Has urlset closing tag");

		// Should have proper URL entries
		const urlMatches = xml.match(/<url>[\s\S]*?<\/url>/g);
		assert(urlMatches, "Contains URL entries");
		assert(urlMatches.length >= 7, "Has expected number of URLs"); // 2 base + 2 modules + 3 entities

		// Each URL should have required elements
		for (const urlBlock of urlMatches) {
			assert(urlBlock.includes("<loc>"), "URL has location");
			assert(urlBlock.includes("<lastmod>"), "URL has last modified");
			assert(urlBlock.includes("<changefreq>"), "URL has change frequency");
			assert(urlBlock.includes("<priority>"), "URL has priority");
		}
	});

	test("handles empty package gracefully", async () => {
		const emptyPackage = { modules: [] };
		const handler = createSitemapHandler(emptyPackage);
		const ctx = createTestContext();

		await handler(ctx);

		assert.strictEqual(
			ctx.responseStatusCode,
			200,
			"Returns 200 status for empty package",
		);

		const xml = ctx.responseBody;
		assert(xml.includes("<?xml"), "Still generates valid XML");
		assert(xml.includes("<urlset"), "Has urlset element");

		// Should still include package overview and module directory
		const urlMatches = xml.match(/<url>[\s\S]*?<\/url>/g);
		assert(urlMatches, "Contains URL entries");
		assert.strictEqual(urlMatches.length, 2, "Has base URLs only");
	});

	test("handles data extraction errors gracefully", async () => {
		// Create package that will cause an error
		const faultyPackage = {
			get modules() {
				throw new Error("Module access failed");
			},
		};

		const handler = createSitemapHandler(faultyPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Should return error response
		assert.strictEqual(
			ctx.responseStatusCode,
			500,
			"Returns 500 status on error",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("Content-Type"),
			"text/plain",
			"Sets plain text content type for error",
		);
		assert(
			ctx.responseBody.includes("Failed to generate sitemap"),
			"Contains error message",
		);
	});

	test("includes generation metadata in XML comments", async () => {
		const mockPackage = createMockPackage();
		const handler = createSitemapHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		const xml = ctx.responseBody;

		// Should include metadata comments
		assert(
			xml.includes("Generated by RavenJS Documentation Generator"),
			"Includes generator comment",
		);
		assert(xml.includes("Total URLs:"), "Includes URL count comment");
		assert(xml.includes("Generated:"), "Includes generation timestamp comment");
	});

	test("generates fresh timestamps on each request", async () => {
		const mockPackage = createMockPackage();
		const handler = createSitemapHandler(mockPackage);

		// Make two requests
		const ctx1 = createTestContext();
		const ctx2 = createTestContext();

		handler(ctx1);
		// Small delay to ensure different timestamps
		setTimeout(() => {
			handler(ctx2);

			// Both should have current dates
			const xml1 = ctx1.responseBody;
			const xml2 = ctx2.responseBody;

			const today = new Date().toISOString().split("T")[0];
			assert(
				xml1.includes(`<lastmod>${today}</lastmod>`),
				"First request has current date",
			);
			assert(
				xml2.includes(`<lastmod>${today}</lastmod>`),
				"Second request has current date",
			);
		}, 10);
	});
});
