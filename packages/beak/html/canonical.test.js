/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { canonical } from "./canonical.js";

/**
 * @file Comprehensive test suite for progressive canonical generator.
 *
 * Tests all enhancement tiers, URL normalization, and ensures 100% code coverage
 * through systematic testing of configuration combinations.
 */

describe("canonical()", () => {
  describe("Input Validation", () => {
    it("should return empty string for undefined config", () => {
      assert.strictEqual(canonical(undefined), "");
    });

    it("should return empty string for null config", () => {
      assert.strictEqual(canonical(null), "");
    });

    it("should return empty string for non-object config", () => {
      assert.strictEqual(canonical("string"), "");
      assert.strictEqual(canonical(123), "");
      assert.strictEqual(canonical([]), "");
    });

    it("should return empty string when domain and path are missing", () => {
      assert.strictEqual(canonical({}), "");
    });

    it("should return empty string when domain is missing", () => {
      assert.strictEqual(canonical({ path: "/article" }), "");
    });

    it("should return empty string when path is missing", () => {
      assert.strictEqual(canonical({ domain: "example.com" }), "");
    });
  });

  describe("URL Normalization", () => {
    it("should construct basic absolute URL from domain and path", () => {
      const result = canonical({ domain: "example.com", path: "/article" });
      assert(result.includes('<link rel="canonical" href="https://example.com/article" />'));
    });

    it("should add leading slash to path if missing", () => {
      const result = canonical({ domain: "example.com", path: "article" });
      assert(result.includes('href="https://example.com/article"'));
    });

    it("should handle root path", () => {
      const result = canonical({ domain: "example.com", path: "/" });
      assert(result.includes('href="https://example.com/"'));
    });

    it("should handle empty path", () => {
      const result = canonical({ domain: "example.com", path: "" });
      assert(result.includes('href="https://example.com"'));
    });

    it("should use pre-constructed URL when provided", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        url: "https://custom.com/article",
      });
      assert(result.includes('href="https://custom.com/article"'));
    });

    it("should force HTTPS for pre-constructed URLs", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        url: "http://example.com/article",
      });
      assert(result.includes('href="https://example.com/article"'));
    });

    it("should normalize www subdomains", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        url: "https://www.example.com/article",
      });
      assert(result.includes('href="https://example.com/article"'));
    });
  });

  describe("Tier 1: Smart Canonical", () => {
    it("should generate basic canonical link", () => {
      const result = canonical({ domain: "example.com", path: "/article" });
      assert(result.includes('<link rel="canonical"'));
      assert(result.includes('href="https://example.com/article"'));
    });

    it("should handle query parameters in path", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article?page=1&sort=date",
      });
      assert(result.includes('href="https://example.com/article?page=1&sort=date"'));
    });

    it("should handle fragments in path", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article#section-1",
      });
      assert(result.includes('href="https://example.com/article#section-1"'));
    });
  });

  describe("Tier 2: Multi-Variant Canonical", () => {
    it("should generate mobile alternate link", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        variants: { mobile: "/mobile/article" },
      });

      assert(result.includes('<link rel="alternate"'));
      assert(result.includes('media="only screen and (max-width: 640px)"'));
      assert(result.includes('href="https://example.com/mobile/article"'));
    });

    it("should generate AMP alternate link", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        variants: { amp: "/amp/article" },
      });

      assert(result.includes('<link rel="amphtml"'));
      assert(result.includes('href="https://example.com/amp/article"'));
    });

    it("should generate print alternate link", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        variants: { print: "/print/article" },
      });

      assert(result.includes('<link rel="alternate"'));
      assert(result.includes('media="print"'));
      assert(result.includes('href="https://example.com/print/article"'));
    });

    it("should handle multiple variants simultaneously", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        variants: {
          mobile: "/mobile/article",
          amp: "/amp/article",
          print: "/print/article",
        },
      });

      assert(result.includes('rel="canonical"'));
      assert(result.includes('rel="alternate"'));
      assert(result.includes('rel="amphtml"'));
      assert(result.includes('media="print"'));
      assert(result.includes('media="only screen and (max-width: 640px)"'));
    });

    it("should handle absolute URLs in variants", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        variants: {
          mobile: "https://m.example.com/article",
          amp: "http://amp.example.com/article",
        },
      });

      assert(result.includes('href="https://m.example.com/article"'));
      assert(result.includes('href="https://amp.example.com/article"'));
    });

    it("should handle empty variants object", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        variants: {},
      });

      assert(result.includes('<link rel="canonical"'));
      assert(!result.includes('rel="alternate"'));
      assert(!result.includes('rel="amphtml"'));
    });
  });

  describe("Tier 3: International Canonical", () => {
    it("should generate hreflang links for multiple languages", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        languages: {
          "en-US": "/article",
          "es-ES": "/articulo",
          "fr-FR": "/article-fr",
        },
      });

      assert(result.includes('hreflang="en-US"'));
      assert(result.includes('hreflang="es-ES"'));
      assert(result.includes('hreflang="fr-FR"'));
      assert(result.includes('href="https://example.com/article"'));
      assert(result.includes('href="https://example.com/articulo"'));
      assert(result.includes('href="https://example.com/article-fr"'));
    });

    it("should add x-default hreflang for multiple languages", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        languages: {
          "en-US": "/article",
          "es-ES": "/articulo",
        },
      });

      assert(result.includes('hreflang="x-default"'));
    });

    it("should use region-specific URL for x-default when region specified", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        languages: {
          "en-US": "/article",
          "es-ES": "/articulo",
        },
        region: "es-ES",
      });

      assert(result.includes('hreflang="x-default"'));
      assert(result.includes('href="https://example.com/articulo"'));
    });

    it("should not add x-default for single language", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        languages: {
          "en-US": "/article",
        },
      });

      assert(!result.includes('hreflang="x-default"'));
    });

    it("should handle absolute URLs in languages", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        languages: {
          "en-US": "https://en.example.com/article",
          "es-ES": "http://es.example.com/articulo",
        },
      });

      assert(result.includes('href="https://en.example.com/article"'));
      assert(result.includes('href="https://es.example.com/articulo"'));
    });

    it("should handle empty languages object", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        languages: {},
      });

      assert(result.includes('<link rel="canonical"'));
      assert(!result.includes("hreflang="));
    });
  });

  describe("Tier 4: Strategic Canonical", () => {
    it("should generate syndicated canonical links", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        strategy: {
          syndicated: ["https://medium.com/@user/article", "https://dev.to/user/article"],
        },
      });

      assert(result.includes('href="https://medium.com/@user/article"'));
      assert(result.includes('href="https://dev.to/user/article"'));
    });

    it("should generate pagination prev/next links", () => {
      const result = canonical({
        domain: "example.com",
        path: "/articles?page=2",
        strategy: {
          paginated: {
            prev: "/articles?page=1",
            next: "/articles?page=3",
          },
        },
      });

      assert(result.includes('<link rel="prev"'));
      assert(result.includes('<link rel="next"'));
      assert(result.includes('href="https://example.com/articles?page=1"'));
      assert(result.includes('href="https://example.com/articles?page=3"'));
    });

    it("should generate pagination with only prev link", () => {
      const result = canonical({
        domain: "example.com",
        path: "/articles?page=2",
        strategy: {
          paginated: { prev: "/articles?page=1" },
        },
      });

      assert(result.includes('<link rel="prev"'));
      assert(!result.includes('<link rel="next"'));
    });

    it("should generate pagination with only next link", () => {
      const result = canonical({
        domain: "example.com",
        path: "/articles?page=1",
        strategy: {
          paginated: { next: "/articles?page=2" },
        },
      });

      assert(!result.includes('<link rel="prev"'));
      assert(result.includes('<link rel="next"'));
    });

    it("should handle empty strategy object", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        strategy: {},
      });

      assert(result.includes('<link rel="canonical"'));
      assert(!result.includes('rel="prev"'));
      assert(!result.includes('rel="next"'));
    });
  });

  describe("Progressive Enhancement Combinations", () => {
    it("should handle Tier 1 + Tier 2 (smart + multi-variant)", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        variants: { mobile: "/mobile/article" },
      });

      assert(result.includes('rel="canonical"'));
      assert(result.includes('rel="alternate"'));
      assert(result.includes('media="only screen and (max-width: 640px)"'));
    });

    it("should handle Tier 1 + Tier 3 (smart + international)", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        languages: { "en-US": "/article", "es-ES": "/articulo" },
      });

      assert(result.includes('rel="canonical"'));
      assert(result.includes('hreflang="en-US"'));
      assert(result.includes('hreflang="es-ES"'));
      assert(result.includes('hreflang="x-default"'));
    });

    it("should handle Tier 2 + Tier 3 (multi-variant + international)", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        variants: { amp: "/amp/article" },
        languages: { "en-US": "/article", "es-ES": "/articulo" },
      });

      assert(result.includes('rel="canonical"'));
      assert(result.includes('rel="amphtml"'));
      assert(result.includes('hreflang="en-US"'));
      assert(result.includes('hreflang="es-ES"'));
    });

    it("should handle all tiers combined", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        variants: {
          mobile: "/mobile/article",
          amp: "/amp/article",
        },
        languages: {
          "en-US": "/article",
          "es-ES": "/articulo",
        },
        strategy: {
          paginated: { next: "/article?page=2" },
        },
      });

      // Should contain elements from all tiers
      assert(result.includes('rel="canonical"'));
      assert(result.includes('rel="alternate"'));
      assert(result.includes('rel="amphtml"'));
      assert(result.includes('hreflang="en-US"'));
      assert(result.includes('hreflang="es-ES"'));
      assert(result.includes('rel="next"'));
    });
  });

  describe("Edge Cases", () => {
    it("should handle complex query parameters", () => {
      const result = canonical({
        domain: "example.com",
        path: "/search?q=hello+world&sort=relevance&filter=recent",
      });

      assert(result.includes('href="https://example.com/search?q=hello+world&sort=relevance&filter=recent"'));
    });

    it("should handle URL-encoded characters", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article?title=Hello%20World&author=John%20Doe",
      });

      assert(result.includes('href="https://example.com/article?title=Hello%20World&author=John%20Doe"'));
    });

    it("should handle subdomain domains", () => {
      const result = canonical({
        domain: "blog.example.com",
        path: "/article",
      });

      assert(result.includes('href="https://blog.example.com/article"'));
    });

    it("should handle port numbers in domain", () => {
      const result = canonical({
        domain: "localhost:3000",
        path: "/article",
      });

      assert(result.includes('href="https://localhost:3000/article"'));
    });

    it("should handle very long paths", () => {
      const longPath = "/very/long/path/to/a/deeply/nested/article/with/many/segments";
      const result = canonical({
        domain: "example.com",
        path: longPath,
      });

      assert(result.includes(`href="https://example.com${longPath}"`));
    });

    it("should handle special characters in domain", () => {
      const result = canonical({
        domain: "test-domain.co.uk",
        path: "/article",
      });

      assert(result.includes('href="https://test-domain.co.uk/article"'));
    });

    it("should handle empty strategy sub-objects", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        strategy: {
          paginated: {},
          syndicated: [],
        },
      });

      assert(result.includes('<link rel="canonical"'));
      assert(!result.includes('rel="prev"'));
      assert(!result.includes('rel="next"'));
    });
  });

  describe("Schema and Output Validation", () => {
    it("should generate valid HTML markup structure", () => {
      const result = canonical({ domain: "example.com", path: "/article" });

      // Should start and end with link tags
      assert(result.trim().startsWith("<link"));
      assert(result.trim().endsWith("/>"));

      // Should be valid HTML (no unclosed tags)
      const linkTagCount = (result.match(/<link/g) || []).length;
      const closingTagCount = (result.match(/\/>/g) || []).length;
      assert.strictEqual(linkTagCount, closingTagCount);
    });

    it("should generate properly formatted hreflang links", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        languages: { "en-US": "/article" },
      });

      // Should have proper hreflang attribute
      assert(result.includes('hreflang="en-US"'));
      assert(result.includes('rel="alternate"'));
      assert(result.includes('href="https://example.com/article"'));
    });

    it("should ensure all URLs are HTTPS", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        variants: { mobile: "http://m.example.com/article" },
        languages: { "en-US": "http://en.example.com/article" },
      });

      // All URLs should be HTTPS
      assert(!result.includes("http://"));
      assert(result.includes("https://"));
    });

    it("should handle malformed URLs gracefully", () => {
      const result = canonical({
        domain: "example.com",
        path: "/article",
        variants: { mobile: "not-a-url" },
      });

      // Should still generate canonical and normalize malformed relative URLs
      assert(result.includes('rel="canonical"'));
      assert(result.includes('href="https://example.com/not-a-url"'));
    });
  });
});
