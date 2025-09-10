import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { sitemap } from "./sitemap.js";

describe("sitemap", () => {
  describe("Simple API: sitemap(domain, pages)", () => {
    it("generates basic XML sitemap", () => {
      const result = sitemap("example.com", ["/", "/about", "/contact"]);

      assert(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
      assert(result.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
      assert(result.includes("<loc>https://example.com/</loc>"));
      assert(result.includes("<loc>https://example.com/about</loc>"));
      assert(result.includes("<loc>https://example.com/contact</loc>"));
      assert(result.includes("</urlset>"));
    });

    it("includes default values", () => {
      const result = sitemap("example.com", ["/"]);

      assert(result.includes("<lastmod>"));
      assert(result.includes("<changefreq>weekly</changefreq>"));
      assert(result.includes("<priority>0.8</priority>"));
    });

    it("throws on invalid pages parameter", () => {
      assert.throws(() => sitemap("example.com", "not-an-array"), {
        name: "TypeError",
        message: "Invalid arguments: expected sitemap(domain, pages), sitemap(config), or sitemap(pages)",
      });
    });

    it("throws on invalid domain", () => {
      assert.throws(() => sitemap("invalid..domain", ["/"]), {
        name: "TypeError",
        message: "Invalid domain format",
      });
    });
  });

  describe("Advanced API: sitemap(config)", () => {
    it("generates sitemap with custom defaults", () => {
      const result = sitemap({
        domain: "example.com",
        pages: ["/"],
        lastmod: "2024-01-01T00:00:00.000Z",
        changefreq: "daily",
        priority: 1.0,
      });

      assert(result.includes("<lastmod>2024-01-01T00:00:00.000Z</lastmod>"));
      assert(result.includes("<changefreq>daily</changefreq>"));
      assert(result.includes("<priority>1.0</priority>"));
    });

    it("uses page-specific values over defaults", () => {
      const result = sitemap({
        domain: "example.com",
        pages: [
          {
            path: "/important",
            lastmod: "2024-02-01T00:00:00.000Z",
            changefreq: "hourly",
            priority: 1.0,
          },
        ],
        lastmod: "2024-01-01T00:00:00.000Z",
        changefreq: "weekly",
        priority: 0.5,
      });

      assert(result.includes("<lastmod>2024-02-01T00:00:00.000Z</lastmod>"));
      assert(result.includes("<changefreq>hourly</changefreq>"));
      assert(result.includes("<priority>1.0</priority>"));
    });

    it("handles mixed page configurations", () => {
      const result = sitemap({
        domain: "example.com",
        pages: ["/", { path: "/blog", changefreq: "daily" }, { path: "/contact", priority: 0.5 }],
      });

      assert(result.includes("<loc>https://example.com/</loc>"));
      assert(result.includes("<loc>https://example.com/blog</loc>"));
      assert(result.includes("<loc>https://example.com/contact</loc>"));
      assert(result.includes("<changefreq>daily</changefreq>"));
      assert(result.includes("<priority>0.5</priority>"));
    });
  });

  describe("Relative paths API: sitemap(pages)", () => {
    it("generates sitemap with relative paths", () => {
      const result = sitemap(["/", "/about", "/contact"]);

      assert(result.includes("<loc>/</loc>"));
      assert(result.includes("<loc>/about</loc>"));
      assert(result.includes("<loc>/contact</loc>"));
    });

    it("handles mixed string and object pages", () => {
      const result = sitemap(["/", { path: "/blog", changefreq: "daily" }]);

      assert(result.includes("<loc>/</loc>"));
      assert(result.includes("<loc>/blog</loc>"));
      assert(result.includes("<changefreq>daily</changefreq>"));
    });
  });

  describe("Input validation", () => {
    it("throws on invalid arguments", () => {
      assert.throws(() => sitemap(123), {
        name: "TypeError",
        message: "Invalid arguments: expected sitemap(domain, pages), sitemap(config), or sitemap(pages)",
      });

      assert.throws(() => sitemap(null), {
        name: "TypeError",
        message: "Invalid arguments: expected sitemap(domain, pages), sitemap(config), or sitemap(pages)",
      });
    });

    it("throws on invalid domain in config", () => {
      assert.throws(() => sitemap({ domain: "invalid..domain", pages: ["/"] }), {
        name: "TypeError",
        message: "Invalid domain format",
      });
    });

    it("throws on non-array pages in config", () => {
      assert.throws(() => sitemap({ domain: "example.com", pages: "not-an-array" }), {
        name: "TypeError",
        message: "Pages must be an array",
      });
    });
  });

  describe("Value normalization", () => {
    it("normalizes priority values", () => {
      // String to number
      const result1 = sitemap({ domain: "example.com", pages: ["/"], priority: "0.9" });
      assert(result1.includes("<priority>0.9</priority>"));

      // Invalid values default to 0.8
      const result2 = sitemap({ domain: "example.com", pages: ["/"], priority: 1.5 });
      assert(result2.includes("<priority>0.8</priority>"));

      // Rounds to 1 decimal place
      const result3 = sitemap({ domain: "example.com", pages: ["/"], priority: 0.85 });
      assert(result3.includes("<priority>0.9</priority>"));
    });

    it("normalizes change frequency values", () => {
      // Valid values pass through
      const result1 = sitemap({ domain: "example.com", pages: ["/"], changefreq: "hourly" });
      assert(result1.includes("<changefreq>hourly</changefreq>"));

      // Invalid values default to weekly
      const result2 = sitemap({ domain: "example.com", pages: ["/"], changefreq: "invalid" });
      assert(result2.includes("<changefreq>weekly</changefreq>"));
    });

    it("normalizes date values", () => {
      // ISO string
      const result1 = sitemap({
        domain: "example.com",
        pages: ["/"],
        lastmod: "2024-01-01T00:00:00.000Z",
      });
      assert(result1.includes("<lastmod>2024-01-01T00:00:00.000Z</lastmod>"));

      // Date object
      const date = new Date("2024-01-01T00:00:00.000Z");
      const result2 = sitemap({ domain: "example.com", pages: ["/"], lastmod: date });
      assert(result2.includes("<lastmod>2024-01-01T00:00:00.000Z</lastmod>"));

      // Invalid date defaults to current time
      const result3 = sitemap({ domain: "example.com", pages: ["/"], lastmod: "invalid-date" });
      assert(result3.includes("<lastmod>"));
    });

    it("handles undefined/null values", () => {
      const result = sitemap({ domain: "example.com", pages: ["/"], lastmod: null });
      assert(result.includes("<lastmod>"));
      assert(result.includes("<changefreq>weekly</changefreq>"));
      assert(result.includes("<priority>0.8</priority>"));
    });
  });

  describe("Edge cases", () => {
    it("handles empty pages array", () => {
      const result = sitemap({ domain: "example.com", pages: [] });
      assert(result.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
      assert(result.includes("</urlset>"));
      assert(!result.includes("<url>"));
    });

    it("handles URLs with query parameters", () => {
      const result = sitemap("example.com", ["/search?q=test&type=all"]);
      assert(result.includes("/search?q=test&type=all"));
    });

    it("generates consistent timestamps per generation", () => {
      const result1 = sitemap("example.com", ["/"]);
      const result2 = sitemap("example.com", ["/"]);

      // Extract timestamps from both results
      const dateMatch1 = result1.match(/<lastmod>([^<]+)<\/lastmod>/);
      const dateMatch2 = result2.match(/<lastmod>([^<]+)<\/lastmod>/);

      if (dateMatch1 && dateMatch2) {
        const date1 = new Date(dateMatch1[1]);
        const date2 = new Date(dateMatch2[1]);

        // Should be very close (within 100ms)
        assert(Math.abs(date1.getTime() - date2.getTime()) < 100);
      }
    });

    it("handles invalid page objects gracefully", () => {
      const result = sitemap("example.com", [null, undefined, {}, { path: "" }]);
      // Should not crash and generate valid XML with default paths
      assert(result.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
      assert(result.includes("</urlset>"));
    });
  });

  describe("XML structure", () => {
    it("generates valid XML structure", () => {
      const result = sitemap("example.com", ["/"]);

      // Check XML declaration
      assert(result.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));

      // Check urlset element with namespace
      assert(result.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));

      // Check url elements
      assert(result.includes("<url>"));
      assert(result.includes("<loc>"));
      assert(result.includes("<lastmod>"));
      assert(result.includes("<changefreq>"));
      assert(result.includes("<priority>"));
      assert(result.includes("</url>"));

      // Check closing tags
      assert(result.includes("</urlset>"));
    });

    it("properly indents XML", () => {
      const result = sitemap("example.com", ["/"]);

      // Check that url elements are properly indented
      assert(result.includes("      <url>"));
      assert(result.includes("        <loc>"));
      assert(result.includes("        <lastmod>"));
      assert(result.includes("        <changefreq>"));
      assert(result.includes("        <priority>"));
      assert(result.includes("      </url>"));
    });
  });
});
