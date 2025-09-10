/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { robots } from "./robots.js";

/**
 * @file Comprehensive test suite for progressive robots meta tags generator.
 *
 * Tests all enhancement tiers, content-type intelligence, and ensures 100% code coverage
 * through systematic testing of configuration combinations and edge cases.
 */

describe("robots()", () => {
  describe("Input Validation and Defaults", () => {
    it("should handle empty configuration with default values", () => {
      const result = robots();

      assert(result.includes('<meta name="robots"'));
      assert(result.includes('content="index, follow"'));
    });

    it("should handle null configuration", () => {
      const result = robots(null);

      assert(result.includes('<meta name="robots"'));
      assert(result.includes('content="index, follow"'));
    });

    it("should handle undefined configuration", () => {
      const result = robots(undefined);

      assert(result.includes('<meta name="robots"'));
      assert(result.includes('content="index, follow"'));
    });

    it("should handle non-object configuration", () => {
      const result = robots("string");

      assert(result.includes('<meta name="robots"'));
      assert(result.includes('content="index, follow"'));
    });
  });

  describe("Tier 1: Basic SEO Control", () => {
    it("should generate basic index/follow directives", () => {
      const result = robots({
        index: true,
        follow: true,
      });

      assert(result.includes('<meta name="robots"'));
      assert(result.includes('content="index, follow"'));
    });

    it("should generate noindex/nofollow directives", () => {
      const result = robots({
        index: false,
        follow: false,
      });

      assert(result.includes('<meta name="robots"'));
      assert(result.includes('content="noindex, nofollow"'));
    });

    it("should generate mixed index/nofollow directives", () => {
      const result = robots({
        index: true,
        follow: false,
      });

      assert(result.includes('<meta name="robots"'));
      assert(result.includes('content="index, nofollow"'));
    });

    it("should generate noindex/follow directives", () => {
      const result = robots({
        index: false,
        follow: true,
      });

      assert(result.includes('<meta name="robots"'));
      assert(result.includes('content="noindex, follow"'));
    });
  });

  describe("Tier 2: Advanced Crawling Directives", () => {
    it("should include noarchive directive", () => {
      const result = robots({
        index: true,
        follow: true,
        archive: false,
      });

      assert(result.includes('content="index, follow, noarchive"'));
    });

    it("should include nosnippet directive", () => {
      const result = robots({
        index: true,
        follow: true,
        snippet: false,
      });

      assert(result.includes('content="index, follow, nosnippet"'));
    });

    it("should include noimageindex directive", () => {
      const result = robots({
        index: true,
        follow: true,
        imageindex: false,
      });

      assert(result.includes('content="index, follow, noimageindex"'));
    });

    it("should include nocache directive", () => {
      const result = robots({
        index: true,
        follow: true,
        cache: false,
      });

      assert(result.includes('content="index, follow, nocache"'));
    });

    it("should combine multiple advanced directives", () => {
      const result = robots({
        index: true,
        follow: true,
        archive: false,
        snippet: false,
        imageindex: false,
        cache: false,
      });

      assert(result.includes('content="index, follow, noarchive, nosnippet, noimageindex, nocache"'));
    });

    it("should generate max-snippet directive", () => {
      const result = robots({
        maxSnippet: 160,
      });

      assert(result.includes('<meta name="robots" content="max-snippet:160"'));
    });

    it("should generate max-image-preview directive", () => {
      const result = robots({
        maxImagePreview: "large",
      });

      assert(result.includes('<meta name="robots" content="max-image-preview:large"'));
    });

    it("should generate max-video-preview directive", () => {
      const result = robots({
        maxVideoPreview: 30,
      });

      assert(result.includes('<meta name="robots" content="max-video-preview:30"'));
    });

    it("should generate unavailable_after directive", () => {
      const result = robots({
        unavailableAfter: "2024-12-31T23:59:59Z",
      });

      assert(result.includes('<meta name="robots" content="unavailable_after:2024-12-31T23:59:59Z"'));
    });

    it("should handle zero values for numeric directives", () => {
      const result = robots({
        maxSnippet: 0,
        maxVideoPreview: 0,
      });

      assert(result.includes('<meta name="robots" content="max-snippet:0"'));
      assert(result.includes('<meta name="robots" content="max-video-preview:0"'));
    });

    it("should handle negative values for numeric directives", () => {
      const result = robots({
        maxSnippet: -1,
        maxVideoPreview: -30,
      });

      assert(result.includes('<meta name="robots" content="max-snippet:-1"'));
      assert(result.includes('<meta name="robots" content="max-video-preview:-30"'));
    });
  });

  describe("Tier 3: Search Engine Specific Optimization", () => {
    it("should generate googlebot noindex directive", () => {
      const result = robots({
        googlebot: false,
      });

      assert(
        result.includes(
          '<meta name="robots" content="googlebot: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache"'
        )
      );
    });

    it("should generate bingbot noindex directive", () => {
      const result = robots({
        bingbot: false,
      });

      assert(
        result.includes('<meta name="robots" content="bingbot: noindex, nofollow, noarchive, nosnippet, nocache"')
      );
    });

    it("should generate slurp noindex directive", () => {
      const result = robots({
        slurp: false,
      });

      assert(result.includes('<meta name="robots" content="slurp: noindex, nofollow, noarchive, nosnippet"'));
    });

    it("should generate duckduckbot noindex directive", () => {
      const result = robots({
        duckduckbot: false,
      });

      assert(result.includes('<meta name="robots" content="duckduckbot: noindex, nofollow, nosnippet"'));
    });

    it("should generate host directive", () => {
      const result = robots({
        host: "example.com",
      });

      assert(result.includes('<link rel="canonical" href="https://example.com"'));
    });

    it("should handle multiple search engine blocks", () => {
      const result = robots({
        googlebot: false,
        bingbot: false,
        slurp: false,
      });

      assert(result.includes("googlebot: noindex"));
      assert(result.includes("bingbot: noindex"));
      assert(result.includes("slurp: noindex"));
    });
  });

  describe("Tier 4: Enterprise SEO Management", () => {
    it("should handle staging environment defaults", () => {
      const result = robots({
        isStaging: true,
      });

      assert(result.includes('content="noindex, nofollow, noarchive, nosnippet, noimageindex, nocache"'));
      assert(result.includes("googlebot: noindex"));
      assert(result.includes("bingbot: noindex"));
    });

    it("should handle private content defaults", () => {
      const result = robots({
        isPrivate: true,
      });

      assert(result.includes('content="noindex, nofollow, noarchive, nosnippet, noimageindex, nocache"'));
    });

    it("should handle paid content defaults", () => {
      const result = robots({
        isPaid: true,
      });

      assert(result.includes('content="noindex, nofollow, noarchive, nosnippet, noimageindex, nocache"'));
    });

    it("should apply article content type defaults", () => {
      const result = robots({
        contentType: "article",
      });

      assert(result.includes('content="index, follow"'));
      assert(result.includes('<meta name="robots" content="max-snippet:160"'));
      assert(result.includes('<meta name="robots" content="max-image-preview:large"'));
      assert(result.includes('<meta name="robots" content="max-video-preview:30"'));
    });

    it("should apply news content type defaults", () => {
      const result = robots({
        contentType: "news",
      });

      assert(result.includes('content="index, follow"'));
      assert(result.includes('<meta name="robots" content="max-snippet:200"'));
      assert(result.includes('<meta name="robots" content="max-image-preview:large"'));
      assert(result.includes('<meta name="robots" content="max-video-preview:60"'));
    });

    it("should apply product content type defaults", () => {
      const result = robots({
        contentType: "product",
      });

      assert(result.includes('content="index, follow"'));
      assert(result.includes('<meta name="robots" content="max-snippet:120"'));
      assert(result.includes('<meta name="robots" content="max-image-preview:large"'));
      assert(result.includes('<meta name="robots" content="max-video-preview:45"'));
    });

    it("should apply category content type defaults", () => {
      const result = robots({
        contentType: "category",
      });

      assert(result.includes('content="index, follow, noimageindex"'));
      assert(result.includes('<meta name="robots" content="max-snippet:140"'));
      assert(result.includes('<meta name="robots" content="max-image-preview:standard"'));
    });

    it("should generate sitemap links", () => {
      const result = robots({
        sitemaps: ["/sitemap.xml", "/sitemap-news.xml"],
      });

      assert(result.includes('<link rel="sitemap" type="application/xml" href="/sitemap.xml"'));
      assert(result.includes('<link rel="sitemap" type="application/xml" href="/sitemap-news.xml"'));
    });

    it("should limit sitemap links to 5", () => {
      const sitemaps = Array.from({ length: 7 }, (_, i) => `/sitemap${i}.xml`);
      const result = robots({
        sitemaps,
      });

      let sitemapCount = 0;
      const matches = result.match(/rel="sitemap"/g) || [];
      sitemapCount = matches.length;

      assert.strictEqual(sitemapCount, 5);
    });

    it("should handle news-specific directives", () => {
      const result = robots({
        contentType: "news",
        news: {
          follow: false,
          archive: false,
        },
      });

      assert(result.includes('<meta name="robots" content="nofollow, noarchive"'));
    });

    it("should handle e-commerce specific directives", () => {
      const result = robots({
        contentType: "product",
        ecommerce: {
          index: false,
          snippet: false,
          maxImagePreview: "standard",
        },
      });

      assert(result.includes('<meta name="robots" content="noindex, nosnippet"'));
      assert(result.includes('<meta name="robots" content="max-image-preview:standard"'));
    });
  });

  describe("Progressive Enhancement Combinations", () => {
    it("should handle Tier 1 + Tier 2 (basic + advanced)", () => {
      const result = robots({
        index: true,
        follow: true,
        maxSnippet: 160,
        maxImagePreview: "large",
        archive: false,
        snippet: false,
      });

      assert(result.includes('content="index, follow, noarchive, nosnippet"'));
      assert(result.includes('<meta name="robots" content="max-snippet:160"'));
      assert(result.includes('<meta name="robots" content="max-image-preview:large"'));
    });

    it("should handle Tier 2 + Tier 3 (advanced + search engines)", () => {
      const result = robots({
        index: true,
        follow: true,
        maxSnippet: 160,
        maxImagePreview: "large",
        googlebot: false,
        unavailableAfter: "2024-12-31T23:59:59Z",
      });

      assert(result.includes('<meta name="robots" content="max-snippet:160"'));
      assert(result.includes('<meta name="robots" content="max-image-preview:large"'));
      assert(result.includes("googlebot: noindex"));
      assert(result.includes("unavailable_after:2024-12-31T23:59:59Z"));
    });

    it("should handle Tier 3 + Tier 4 (search engines + enterprise)", () => {
      const result = robots({
        contentType: "article",
        googlebot: true,
        host: "example.com",
        sitemaps: ["/sitemap.xml"],
      });

      assert(result.includes('<meta name="robots" content="max-snippet:160"'));
      assert(result.includes('<link rel="canonical" href="https://example.com"'));
      assert(result.includes('<link rel="sitemap" type="application/xml" href="/sitemap.xml"'));
    });

    it("should handle all tiers combined", () => {
      const result = robots({
        contentType: "news",
        index: true,
        follow: true,
        maxSnippet: 200,
        maxImagePreview: "large",
        maxVideoPreview: 60,
        googlebot: true,
        bingbot: true,
        host: "news.example.com",
        sitemaps: ["/sitemap.xml", "/sitemap-news.xml"],
        news: {
          follow: true,
          archive: true,
        },
        unavailableAfter: "2024-12-31T23:59:59Z",
      });

      // Tier 1 - Basic
      assert(result.includes('content="index, follow"'));

      // Tier 2 - Advanced
      assert(result.includes('<meta name="robots" content="max-snippet:200"'));
      assert(result.includes('<meta name="robots" content="max-image-preview:large"'));
      assert(result.includes('<meta name="robots" content="max-video-preview:60"'));

      // Tier 3 - Search engines
      assert(result.includes("unavailable_after:2024-12-31T23:59:59Z"));

      // Tier 4 - Enterprise
      assert(result.includes('<link rel="canonical" href="https://news.example.com"'));
      assert(result.includes('<link rel="sitemap" type="application/xml" href="/sitemap.xml"'));
      assert(result.includes('<link rel="sitemap" type="application/xml" href="/sitemap-news.xml"'));
    });
  });

  describe("Edge Cases", () => {
    it("should handle complex query parameters in host", () => {
      const result = robots({
        host: "example.com/path?param=value&other=test",
      });

      assert(result.includes('href="https://example.com/path?param=value&amp;other=test"'));
    });

    it("should handle URL-encoded characters in sitemaps", () => {
      const result = robots({
        sitemaps: ["/sitemap.xml?locale=en-US"],
      });

      assert(result.includes('href="/sitemap.xml?locale=en-US"'));
    });

    it("should handle port numbers in host", () => {
      const result = robots({
        host: "localhost:3000",
      });

      assert(result.includes('href="https://localhost:3000"'));
    });

    it("should handle subdomain hosts", () => {
      const result = robots({
        host: "blog.example.com",
      });

      assert(result.includes('href="https://blog.example.com"'));
    });

    it("should handle very long content in directives", () => {
      const longUnavailableAfter = "2024-12-31T23:59:59.999999Z";
      const result = robots({
        unavailableAfter: longUnavailableAfter,
      });

      assert(result.includes(`unavailable_after:${longUnavailableAfter}`));
    });

    it("should handle mixed absolute and relative sitemap URLs", () => {
      const result = robots({
        sitemaps: ["/sitemap.xml", "https://cdn.example.com/sitemap-news.xml"],
      });

      assert(result.includes('href="/sitemap.xml"'));
      assert(result.includes('href="https://cdn.example.com/sitemap-news.xml"'));
    });

    it("should handle empty arrays gracefully", () => {
      const result = robots({
        sitemaps: [],
      });

      assert(!result.includes('rel="sitemap"'));
    });

    it("should handle null/undefined values in objects", () => {
      const result = robots({
        news: {
          follow: null,
          archive: undefined,
        },
        ecommerce: {
          index: null,
          snippet: undefined,
        },
      });

      assert(!result.includes("nofollow"));
      assert(!result.includes("noarchive"));
      assert(!result.includes("noindex"));
      assert(!result.includes("nosnippet"));
    });

    it("should handle extreme edge cases", () => {
      const result = robots({
        maxSnippet: Number.MAX_SAFE_INTEGER,
        maxVideoPreview: Number.MIN_SAFE_INTEGER,
        sitemaps: Array.from({ length: 10 }, (_, i) => `/sitemap${i}.xml`),
        contentType: "invalid",
      });

      // Should handle extreme numeric values
      assert(result.includes(`max-snippet:${Number.MAX_SAFE_INTEGER}`));
      assert(result.includes(`max-video-preview:${Number.MIN_SAFE_INTEGER}`));

      // Should limit sitemaps to 5
      let sitemapCount = 0;
      const matches = result.match(/rel="sitemap"/g) || [];
      sitemapCount = matches.length;
      assert.strictEqual(sitemapCount, 5);

      // Should fallback to default content type
      assert(result.includes('content="index, follow"'));
    });

    it("should handle malformed objects gracefully", () => {
      const result = robots({
        news: null,
        ecommerce: undefined,
        maxSnippet: null,
        maxImagePreview: undefined,
      });

      // Should not crash and should generate basic robots tag
      assert(result.includes('<meta name="robots"'));
      assert(result.includes('content="index, follow"'));
    });

    it("should handle conflicting configurations", () => {
      const result = robots({
        index: true,
        googlebot: false,
        contentType: "article",
        isStaging: true,
      });

      // Staging should override content type defaults
      assert(result.includes('content="noindex, nofollow, noarchive, nosnippet, noimageindex, nocache"'));
      assert(result.includes("googlebot: noindex"));
    });

    it("should handle boolean string values", () => {
      const result = robots({
        index: "false",
        follow: "true",
      });

      // String booleans should be treated as truthy
      assert(result.includes('content="index, follow"'));
    });

    it("should handle numeric zero as valid value", () => {
      const result = robots({
        index: 0,
        follow: 1,
      });

      // Numeric zero should be treated as falsy for index
      assert(result.includes('content="noindex, follow"'));
    });
  });

  describe("Schema and Output Validation", () => {
    it("should generate valid HTML markup structure", () => {
      const result = robots({
        index: true,
        follow: true,
      });

      assert(result.trim().startsWith("<meta"));
      const metaTagCount = (result.match(/<meta/g) || []).length;
      const closingTagCount = (result.match(/\/>/g) || []).length;
      assert.strictEqual(metaTagCount, closingTagCount);
    });

    it("should generate properly formatted robots meta tags", () => {
      const result = robots({
        index: true,
        follow: true,
      });

      assert(result.includes('name="robots"'));
      assert(result.includes('content="'));
    });

    it("should generate valid link tags for sitemaps", () => {
      const result = robots({
        sitemaps: ["/sitemap.xml"],
      });

      assert(result.includes('rel="sitemap"'));
      assert(result.includes('type="application/xml"'));
      assert(result.includes('href="/sitemap.xml"'));
    });

    it("should generate valid canonical link for host", () => {
      const result = robots({
        host: "example.com",
      });

      assert(result.includes('rel="canonical"'));
      assert(result.includes('href="https://example.com"'));
    });

    it("should validate content type intelligence", () => {
      const contentTypes = ["article", "news", "product", "category", "page"];

      for (const contentType of contentTypes) {
        const result = robots({
          contentType,
        });

        // Should generate valid robots tag
        assert(result.includes('<meta name="robots"'));

        // Should not crash
        assert(result.length > 0);
      }
    });

    it("should validate search engine directive formatting", () => {
      const result = robots({
        googlebot: false,
      });

      assert(result.includes("googlebot: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache"));
    });

    it("should validate progressive enhancement", () => {
      // Basic configuration
      const basicResult = robots({
        index: true,
        follow: true,
      });

      // Enhanced configuration
      const enhancedResult = robots({
        index: true,
        follow: true,
        maxSnippet: 160,
        maxImagePreview: "large",
        googlebot: true,
        contentType: "article",
      });

      // Enhanced should have more meta tags
      const basicTagCount = (basicResult.match(/<meta/g) || []).length;
      const enhancedTagCount = (enhancedResult.match(/<meta/g) || []).length;

      assert(enhancedTagCount > basicTagCount, "Enhanced configuration should generate more meta tags");
    });

    it("should validate directive combination integrity", () => {
      const result = robots({
        index: true,
        follow: true,
        archive: false,
        snippet: false,
        maxSnippet: 160,
      });

      // Should have main robots tag
      assert(result.includes('content="index, follow, noarchive, nosnippet"'));

      // Should have separate max-snippet tag
      assert(result.includes('content="max-snippet:160"'));

      // Should not have duplicate directives
      const indexCount = (result.match(/index/g) || []).length;
      assert.strictEqual(indexCount, 1, "Should not have duplicate index directives");
    });

    it("should validate environment-specific behavior", () => {
      const stagingResult = robots({
        isStaging: true,
      });

      const privateResult = robots({
        isPrivate: true,
      });

      const paidResult = robots({
        isPaid: true,
      });

      // All should block indexing
      assert(stagingResult.includes("noindex"));
      assert(privateResult.includes("noindex"));
      assert(paidResult.includes("noindex"));

      // All should block following
      assert(stagingResult.includes("nofollow"));
      assert(privateResult.includes("nofollow"));
      assert(paidResult.includes("nofollow"));
    });

    it("should validate content-type specific optimizations", () => {
      const articleResult = robots({
        contentType: "article",
      });

      const newsResult = robots({
        contentType: "news",
      });

      const productResult = robots({
        contentType: "product",
      });

      // Article should have snippet control
      assert(articleResult.includes("max-snippet:160"));

      // News should have higher snippet limit
      assert(newsResult.includes("max-snippet:200"));

      // Product should have lower snippet limit
      assert(productResult.includes("max-snippet:120"));
    });
  });
});
