/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for shared URL normalization utility.
 *
 * Comprehensive test coverage for the normalizeUrl function ensuring
 * consistent HTTPS enforcement and proper URL formatting across all
 * social media utilities.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { normalizeUrl } from "./url.js";

describe("normalizeUrl()", () => {
  describe("Input Validation", () => {
    it("should return default HTTPS URL for undefined input", () => {
      assert.strictEqual(normalizeUrl(undefined), "https://example.com");
    });

    it("should return default HTTPS URL for null input", () => {
      assert.strictEqual(normalizeUrl(null), "https://example.com");
    });

    it("should return default HTTPS URL for non-string input", () => {
      assert.strictEqual(normalizeUrl(123), "https://example.com");
      assert.strictEqual(normalizeUrl({}), "https://example.com");
      assert.strictEqual(normalizeUrl([]), "https://example.com");
    });

    it("should return default HTTPS URL for empty string", () => {
      assert.strictEqual(normalizeUrl(""), "https://example.com");
    });

    it("should use custom domain when provided", () => {
      assert.strictEqual(normalizeUrl("", "mydomain.com"), "https://mydomain.com");
      assert.strictEqual(normalizeUrl(undefined, "custom.com"), "https://custom.com");
    });
  });

  describe("HTTP to HTTPS Conversion", () => {
    it("should convert HTTP URLs to HTTPS", () => {
      assert.strictEqual(normalizeUrl("http://example.com/page"), "https://example.com/page");
      assert.strictEqual(
        normalizeUrl("http://sub.example.com/path?query=value"),
        "https://sub.example.com/path?query=value"
      );
    });

    it("should preserve HTTPS URLs unchanged", () => {
      assert.strictEqual(normalizeUrl("https://example.com/page"), "https://example.com/page");
      assert.strictEqual(
        normalizeUrl("https://secure.example.com/path/to/resource"),
        "https://secure.example.com/path/to/resource"
      );
    });

    it("should handle URLs with ports", () => {
      assert.strictEqual(normalizeUrl("http://localhost:3000/api"), "https://localhost:3000/api");
      assert.strictEqual(normalizeUrl("https://example.com:8080/path"), "https://example.com:8080/path");
    });

    it("should handle complex query parameters and fragments", () => {
      assert.strictEqual(
        normalizeUrl("http://example.com/path?param1=value1&param2=value2#section"),
        "https://example.com/path?param1=value1&param2=value2#section"
      );
    });
  });

  describe("Relative URL Handling", () => {
    it("should handle paths with leading slash", () => {
      assert.strictEqual(normalizeUrl("/page", "example.com"), "https://example.com/page");
      assert.strictEqual(normalizeUrl("/path/to/resource", "example.com"), "https://example.com/path/to/resource");
    });

    it("should handle paths without leading slash", () => {
      assert.strictEqual(normalizeUrl("page", "example.com"), "https://example.com/page");
      assert.strictEqual(normalizeUrl("path/to/resource", "example.com"), "https://example.com/path/to/resource");
    });

    it("should handle root path", () => {
      assert.strictEqual(normalizeUrl("/", "example.com"), "https://example.com/");
    });

    it("should handle paths with query parameters", () => {
      assert.strictEqual(
        normalizeUrl("/search?q=test&page=1", "example.com"),
        "https://example.com/search?q=test&page=1"
      );
    });

    it("should handle paths with fragments", () => {
      assert.strictEqual(normalizeUrl("/page#section", "example.com"), "https://example.com/page#section");
    });
  });

  describe("Edge Cases", () => {
    it("should handle domain names with subdomains", () => {
      assert.strictEqual(normalizeUrl("/api", "api.example.com"), "https://api.example.com/api");
      assert.strictEqual(
        normalizeUrl("/v1/users", "staging.api.example.com"),
        "https://staging.api.example.com/v1/users"
      );
    });

    it("should handle domain names with hyphens and numbers", () => {
      assert.strictEqual(normalizeUrl("/test", "my-domain-123.com"), "https://my-domain-123.com/test");
    });

    it("should handle international domain names (if supported)", () => {
      // Note: This test may need adjustment based on Node.js URL support
      assert.strictEqual(normalizeUrl("/test", "xn--example.com"), "https://xn--example.com/test");
    });

    it("should handle very long paths", () => {
      const longPath = "/very/long/path/with/many/segments/that/should/be/handled/correctly";
      assert.strictEqual(normalizeUrl(longPath, "example.com"), `https://example.com${longPath}`);
    });

    it("should handle paths with special characters", () => {
      assert.strictEqual(normalizeUrl("/path with spaces", "example.com"), "https://example.com/path with spaces");
      assert.strictEqual(normalizeUrl("/path%20encoded", "example.com"), "https://example.com/path%20encoded");
    });
  });

  describe("Social Media Compatibility", () => {
    it("should work with various social media domains", () => {
      // Twitter
      assert.strictEqual(normalizeUrl("/status/123", "twitter.com"), "https://twitter.com/status/123");

      // Facebook
      assert.strictEqual(normalizeUrl("/page/posts/456", "facebook.com"), "https://facebook.com/page/posts/456");

      // LinkedIn
      assert.strictEqual(normalizeUrl("/company/example", "linkedin.com"), "https://linkedin.com/company/example");

      // YouTube
      assert.strictEqual(normalizeUrl("/watch?v=VIDEO_ID", "youtube.com"), "https://youtube.com/watch?v=VIDEO_ID");

      // Instagram
      assert.strictEqual(normalizeUrl("/p/POST_ID", "instagram.com"), "https://instagram.com/p/POST_ID");
    });

    it("should handle social media URLs with query parameters", () => {
      assert.strictEqual(
        normalizeUrl("/share?url=https://example.com", "facebook.com"),
        "https://facebook.com/share?url=https://example.com"
      );
    });
  });

  describe("Progressive Enhancement Scenarios", () => {
    it("should handle basic to advanced configurations", () => {
      // Basic: just domain
      assert.strictEqual(normalizeUrl(undefined, "example.com"), "https://example.com");

      // Enhanced: relative path
      assert.strictEqual(normalizeUrl("/blog", "example.com"), "https://example.com/blog");

      // Advanced: full URL (already HTTPS)
      assert.strictEqual(normalizeUrl("https://example.com/blog/post"), "https://example.com/blog/post");

      // Enterprise: HTTP URL conversion
      assert.strictEqual(normalizeUrl("http://example.com/secure/path"), "https://example.com/secure/path");
    });

    it("should be consistent across different input types", () => {
      const testCases = [
        ["/page", "example.com", "https://example.com/page"],
        ["page", "example.com", "https://example.com/page"],
        ["http://example.com/page", "example.com", "https://example.com/page"],
        ["https://example.com/page", "example.com", "https://example.com/page"],
        ["", "example.com", "https://example.com"],
        [undefined, "example.com", "https://example.com"],
      ];

      for (const [url, domain, expected] of testCases) {
        assert.strictEqual(normalizeUrl(url, domain), expected);
      }
    });
  });
});
