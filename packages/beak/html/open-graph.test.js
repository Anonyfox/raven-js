/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { openGraph } from "./open-graph.js";

/**
 * @file Comprehensive test suite for progressive Open Graph generator.
 *
 * Tests all enhancement tiers, content type detection, and ensures 100% code coverage
 * through systematic testing of configuration combinations.
 */

describe("openGraph()", () => {
  describe("Input Validation", () => {
    it("should return empty string for undefined config", () => {
      assert.strictEqual(openGraph(undefined), "");
    });

    it("should return empty string for null config", () => {
      assert.strictEqual(openGraph(null), "");
    });

    it("should return empty string for non-object config", () => {
      assert.strictEqual(openGraph("string"), "");
      assert.strictEqual(openGraph(123), "");
      assert.strictEqual(openGraph([]), "");
    });

    it("should return empty string when title is missing", () => {
      assert.strictEqual(openGraph({ description: "test" }), "");
    });

    it("should return empty string when description is missing", () => {
      assert.strictEqual(openGraph({ title: "test" }), "");
    });

    it("should return empty string when both title and description are missing", () => {
      assert.strictEqual(openGraph({ domain: "example.com", path: "/test" }), "");
    });
  });

  describe("Content Type Detection", () => {
    it("should auto-detect video content from URL pattern", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/videos/demo",
        title: "Demo Video",
        description: "Watch our demo",
      });

      assert(result.includes('content="video.other"'));
    });

    it("should auto-detect video content from file extension", () => {
      const result = openGraph({
        title: "Video Demo",
        description: "Demo description",
        video: { url: "/demo.mp4" },
      });

      assert(result.includes('content="video.other"'));
      assert(result.includes('<meta name="og:video"'));
    });

    it("should auto-detect audio content from URL pattern", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/audio/podcast",
        title: "Tech Podcast",
        description: "Listen to our podcast",
      });

      assert(result.includes('content="music.song"'));
    });

    it("should auto-detect audio content from file extension", () => {
      const result = openGraph({
        title: "Music Track",
        description: "Listen now",
        audio: { url: "/track.mp3" },
      });

      assert(result.includes('content="music.song"'));
    });

    it("should auto-detect book content from URL pattern", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/books/javascript-guide",
        title: "JavaScript Guide",
        description: "ISBN: 1234567890",
      });

      assert(result.includes('content="book"'));
    });

    it("should auto-detect book content from ISBN in description", () => {
      const result = openGraph({
        title: "Programming Book",
        description: "ISBN: 9780123456789",
      });

      assert(result.includes('content="book"'));
    });

    it("should auto-detect profile content from URL pattern", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/profile/johndoe",
        title: "John Doe",
        description: "Software developer",
      });

      assert(result.includes('content="profile"'));
    });

    it("should auto-detect product content from URL pattern", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/products/widget",
        title: "Amazing Widget",
        description: "Buy now for $29.99",
      });

      assert(result.includes('content="product"'));
    });

    it("should auto-detect business content from URL pattern", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/contact",
        title: "Contact Us",
        description: "Get in touch",
      });

      assert(result.includes('content="business.business"'));
    });

    it("should auto-detect article content from URL pattern", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/blog/post-123",
        title: "Blog Post",
        description: "Learn something new",
      });

      assert(result.includes('content="article"'));
    });

    it("should default to website content type", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/page",
        title: "Regular Page",
        description: "Regular description",
      });

      assert(result.includes('content="website"'));
    });

    it("should use explicit type over auto-detection", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/videos/demo",
        title: "Demo Video",
        description: "Watch our demo",
        type: "article",
      });

      assert(result.includes('content="article"'));
    });
  });

  describe("URL Normalization", () => {
    it("should construct basic absolute URL from domain and path", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/article",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://example.com/article"'));
    });

    it("should add leading slash to path if missing", () => {
      const result = openGraph({
        domain: "example.com",
        path: "article",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://example.com/article"'));
    });

    it("should use pre-constructed URL when provided", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/article",
        url: "https://custom.com/article",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://custom.com/article"'));
    });

    it("should force HTTPS for pre-constructed URLs", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/article",
        url: "http://example.com/article",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://example.com/article"'));
    });
  });

  describe("Tier 1: Basic Open Graph Tags", () => {
    it("should generate basic Open Graph meta tags", () => {
      const result = openGraph({
        title: "Test Title",
        description: "Test description for Open Graph",
      });

      assert(result.includes('<meta name="og:title"'));
      assert(result.includes('content="Test Title"'));
      assert(result.includes('<meta name="og:description"'));
      assert(result.includes('content="Test description for Open Graph"'));
      assert(result.includes('<meta name="og:type"'));
    });

    it("should include URL when domain and path provided", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/test",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('<meta name="og:url"'));
      assert(result.includes('content="https://example.com/test"'));
    });

    it("should include site name when provided", () => {
      const result = openGraph({
        title: "Test",
        description: "Test description",
        siteName: "My Blog",
      });

      assert(result.includes('<meta name="og:site_name"'));
      assert(result.includes('content="My Blog"'));
    });

    it("should include simple string image", () => {
      const result = openGraph({
        title: "Test",
        description: "Test description",
        image: "/banner.jpg",
      });

      assert(result.includes('<meta name="og:image"'));
      assert(result.includes('content="/banner.jpg"'));
    });

    it("should normalize image URL when domain provided", () => {
      const result = openGraph({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        image: "/banner.jpg",
      });

      assert(result.includes('content="https://example.com/banner.jpg"'));
    });
  });

  describe("Image Handling", () => {
    it("should handle rich image object with all properties", () => {
      const result = openGraph({
        title: "Test",
        description: "Test description",
        image: {
          url: "/banner.jpg",
          secureUrl: "https://example.com/banner.jpg",
          type: "image/jpeg",
          width: 1200,
          height: 630,
          alt: "Banner image",
        },
      });

      assert(result.includes('<meta name="og:image"'));
      assert(result.includes('content="/banner.jpg"'));
      assert(result.includes('<meta name="og:image:secure_url"'));
      assert(result.includes('<meta name="og:image:type"'));
      assert(result.includes('<meta name="og:image:width"'));
      assert(result.includes('<meta name="og:image:height"'));
      assert(result.includes('<meta name="og:image:alt"'));
    });

    it("should handle multiple images array", () => {
      const result = openGraph({
        title: "Test",
        description: "Test description",
        image: [
          {
            url: "/banner1.jpg",
            width: 1200,
            height: 630,
          },
          {
            url: "/banner2.jpg",
            width: 800,
            height: 600,
          },
        ],
      });

      assert(result.includes('content="/banner1.jpg"'));
      assert(result.includes('content="/banner2.jpg"'));
      assert(result.includes('content="1200"'));
      assert(result.includes('content="630"'));
      assert(result.includes('content="800"'));
      assert(result.includes('content="600"'));
    });
  });

  describe("Tier 2: Content Type Specialization", () => {
    it("should generate article tags", () => {
      const result = openGraph({
        title: "Blog Post",
        description: "Article content",
        type: "article",
        article: {
          authors: ["John Doe", "Jane Smith"],
          publishedTime: "2024-01-15T10:00:00Z",
          modifiedTime: "2024-01-20T15:30:00Z",
          section: "Technology",
          tags: ["javascript", "web-development"],
        },
      });

      assert(result.includes('<meta name="article:author"'));
      assert(result.includes('content="John Doe"'));
      assert(result.includes('content="Jane Smith"'));
      assert(result.includes('<meta name="article:published_time"'));
      assert(result.includes('<meta name="article:modified_time"'));
      assert(result.includes('<meta name="article:section"'));
      assert(result.includes('<meta name="article:tag"'));
      assert(result.includes('content="javascript"'));
    });

    it("should generate book tags", () => {
      const result = openGraph({
        title: "JavaScript Guide",
        description: "Programming book",
        type: "book",
        book: {
          authors: ["John Doe"],
          isbn: "978-0123456789",
          releaseDate: "2024-01-01",
          tags: ["programming", "javascript"],
        },
      });

      assert(result.includes('<meta name="book:author"'));
      assert(result.includes('<meta name="book:isbn"'));
      assert(result.includes('<meta name="book:release_date"'));
      assert(result.includes('<meta name="book:tag"'));
    });

    it("should generate profile tags", () => {
      const result = openGraph({
        title: "John Doe",
        description: "Software developer",
        type: "profile",
        profile: {
          firstName: "John",
          lastName: "Doe",
          username: "johndoe",
          gender: "male",
        },
      });

      assert(result.includes('<meta name="profile:first_name"'));
      assert(result.includes('<meta name="profile:last_name"'));
      assert(result.includes('<meta name="profile:username"'));
      assert(result.includes('<meta name="profile:gender"'));
    });

    it("should generate product tags", () => {
      const result = openGraph({
        title: "Amazing Widget",
        description: "Buy now",
        type: "product",
        product: {
          price: { amount: "29.99", currency: "USD" },
          availability: "in stock",
          condition: "new",
        },
      });

      assert(result.includes('<meta name="product:price:amount"'));
      assert(result.includes('<meta name="product:price:currency"'));
      assert(result.includes('<meta name="product:availability"'));
      assert(result.includes('<meta name="product:condition"'));
    });

    it("should generate business contact tags", () => {
      const result = openGraph({
        title: "Contact Us",
        description: "Get in touch",
        type: "business.business",
        business: {
          contactData: {
            streetAddress: "123 Main St",
            locality: "Anytown",
            region: "CA",
            postalCode: "12345",
            countryName: "USA",
            email: "contact@example.com",
            phoneNumber: "+1-555-123-4567",
          },
        },
      });

      assert(result.includes('<meta name="business:contact_data:street_address"'));
      assert(result.includes('<meta name="business:contact_data:locality"'));
      assert(result.includes('<meta name="business:contact_data:email"'));
      assert(result.includes('<meta name="business:contact_data:phone_number"'));
    });

    it("should handle empty content type objects", () => {
      const result = openGraph({
        title: "Test",
        description: "Test",
        type: "article",
        article: {},
      });

      assert(result.includes('<meta name="og:title"'));
      assert(!result.includes('<meta name="article:'));
    });
  });

  describe("Tier 3: Rich Media & Technical Optimization", () => {
    it("should generate video tags", () => {
      const result = openGraph({
        title: "Demo Video",
        description: "Watch our demo",
        type: "video.other",
        video: {
          url: "/demo.mp4",
          secureUrl: "https://example.com/demo.mp4",
          type: "video/mp4",
          width: 1920,
          height: 1080,
          duration: 180,
          title: "Product Demo",
        },
      });

      assert(result.includes('<meta name="og:video"'));
      assert(result.includes('<meta name="og:video:secure_url"'));
      assert(result.includes('<meta name="og:video:type"'));
      assert(result.includes('<meta name="og:video:width"'));
      assert(result.includes('<meta name="og:video:height"'));
      assert(result.includes('<meta name="og:video:duration"'));
      assert(result.includes('<meta name="og:video:title"'));
    });

    it("should generate audio tags", () => {
      const result = openGraph({
        title: "Podcast Episode",
        description: "Listen now",
        type: "music.song",
        audio: {
          url: "/episode.mp3",
          secureUrl: "https://example.com/episode.mp3",
          type: "audio/mpeg",
          title: "Tech Talk",
        },
      });

      assert(result.includes('<meta name="og:audio"'));
      assert(result.includes('<meta name="og:audio:secure_url"'));
      assert(result.includes('<meta name="og:audio:type"'));
      assert(result.includes('<meta name="og:audio:title"'));
    });

    it("should generate locale tags", () => {
      const result = openGraph({
        title: "Content",
        description: "Localized content",
        locale: "en_US",
        alternateLocales: ["es_ES", "fr_FR"],
      });

      assert(result.includes('<meta name="og:locale"'));
      assert(result.includes('content="en_US"'));
      assert(result.includes('<meta name="og:locale:alternate"'));
      assert(result.includes('content="es_ES"'));
      assert(result.includes('content="fr_FR"'));
    });

    it("should generate Facebook integration tags", () => {
      const result = openGraph({
        title: "Test",
        description: "Test",
        fbAppId: "123456789",
        fbPages: ["111", "222"],
        fbAdmins: ["333", "444"],
      });

      assert(result.includes('<meta name="fb:app_id"'));
      assert(result.includes('<meta name="fb:pages"'));
      assert(result.includes('<meta name="fb:admins"'));
    });
  });

  describe("Tier 4: Enterprise Analytics & Syndication", () => {
    it("should generate analytics tags", () => {
      const result = openGraph({
        title: "Test",
        description: "Test",
        analytics: {
          pixelId: "987654321",
          conversionGoals: ["Purchase", "Lead"],
          customEvents: ["Content_View", "Share"],
        },
      });

      assert(result.includes('<meta name="fb:analytics"'));
      assert(result.includes('<meta name="fb:conversion"'));
      assert(result.includes('<meta name="fb:event"'));
    });

    it("should generate syndication tags", () => {
      const result = openGraph({
        title: "Test",
        description: "Test",
        syndication: {
          originalSource: "https://original-site.com",
          partners: ["twitter.com", "linkedin.com"],
        },
      });

      assert(result.includes('<meta name="og:syndication"'));
      assert(result.includes('<meta name="og:syndication:partner"'));
    });

    it("should generate verification tag", () => {
      const result = openGraph({
        title: "Test",
        description: "Test",
        verification: "abc123def456",
      });

      assert(result.includes('<meta name="fb:domain_verification"'));
      assert(result.includes('content="abc123def456"'));
    });
  });

  describe("Progressive Enhancement Combinations", () => {
    it("should handle Tier 1 + Tier 2 (basic + article)", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/blog/post-123",
        title: "How to Code Better",
        description: "Learn coding best practices",
        siteName: "Dev Blog",
        image: "/blog-image.jpg",
        type: "article",
        article: {
          authors: ["John Doe"],
          publishedTime: "2024-01-15T10:00:00Z",
          section: "Technology",
          tags: ["javascript"],
        },
      });

      assert(result.includes('<meta name="og:title"'));
      assert(result.includes('<meta name="og:description"'));
      assert(result.includes('<meta name="og:url"'));
      assert(result.includes('<meta name="og:site_name"'));
      assert(result.includes('<meta name="og:image"'));
      assert(result.includes('<meta name="article:author"'));
      assert(result.includes('<meta name="article:published_time"'));
      assert(result.includes('<meta name="article:section"'));
      assert(result.includes('<meta name="article:tag"'));
    });

    it("should handle Tier 1 + Tier 3 (basic + rich media)", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/videos/demo",
        title: "Product Demo",
        description: "See our product in action",
        siteName: "TechCorp",
        image: {
          url: "/thumbnail.jpg",
          width: 1200,
          height: 630,
          alt: "Video thumbnail",
        },
        type: "video.other",
        video: {
          url: "/demo.mp4",
          type: "video/mp4",
          width: 1920,
          height: 1080,
        },
        locale: "en_US",
        fbAppId: "123456789",
      });

      assert(result.includes('<meta name="og:title"'));
      assert(result.includes('<meta name="og:url"'));
      assert(result.includes('<meta name="og:site_name"'));
      assert(result.includes('<meta name="og:image"'));
      assert(result.includes('<meta name="og:image:width"'));
      assert(result.includes('<meta name="og:image:alt"'));
      assert(result.includes('<meta name="og:video"'));
      assert(result.includes('<meta name="og:video:type"'));
      assert(result.includes('<meta name="og:locale"'));
      assert(result.includes('<meta name="fb:app_id"'));
    });

    it("should handle Tier 2 + Tier 3 (content + technical)", () => {
      const result = openGraph({
        title: "Company Profile",
        description: "About our company",
        type: "business.business",
        business: {
          contactData: {
            email: "contact@example.com",
            phoneNumber: "+1-555-123-4567",
          },
        },
        locale: "en_US",
        alternateLocales: ["es_ES"],
        fbAppId: "123456789",
      });

      assert(result.includes('<meta name="business:contact_data:email"'));
      assert(result.includes('<meta name="business:contact_data:phone_number"'));
      assert(result.includes('<meta name="og:locale"'));
      assert(result.includes('<meta name="og:locale:alternate"'));
      assert(result.includes('<meta name="fb:app_id"'));
    });

    it("should handle Tier 1 + Tier 4 (basic + enterprise)", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/products/widget",
        title: "Amazing Widget",
        description: "The best widget ever",
        image: "/product.jpg",
        type: "product",
        product: {
          price: { amount: "29.99", currency: "USD" },
        },
        analytics: {
          pixelId: "987654321",
          conversionGoals: ["Purchase"],
        },
        syndication: {
          originalSource: "https://original-site.com",
        },
        verification: "abc123",
      });

      assert(result.includes('<meta name="og:title"'));
      assert(result.includes('<meta name="og:url"'));
      assert(result.includes('<meta name="og:image"'));
      assert(result.includes('<meta name="product:price:amount"'));
      assert(result.includes('<meta name="product:price:currency"'));
      assert(result.includes('<meta name="fb:analytics"'));
      assert(result.includes('<meta name="fb:conversion"'));
      assert(result.includes('<meta name="og:syndication"'));
      assert(result.includes('<meta name="fb:domain_verification"'));
    });

    it("should handle all tiers combined", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/blog/advanced-javascript",
        url: "https://example.com/blog/advanced-javascript",
        title: "Advanced JavaScript Techniques",
        description: "Master advanced JavaScript concepts",
        siteName: "Dev Blog",
        type: "article",
        image: [
          {
            url: "/blog-header.jpg",
            secureUrl: "https://example.com/blog-header.jpg",
            type: "image/jpeg",
            width: 1200,
            height: 630,
            alt: "JavaScript code on screen",
          },
        ],
        article: {
          authors: ["Jane Doe", "John Smith"],
          publishedTime: "2024-01-15T10:00:00Z",
          modifiedTime: "2024-01-20T15:30:00Z",
          section: "Programming",
          tags: ["javascript", "advanced", "programming"],
        },
        video: {
          url: "/tutorial.mp4",
          secureUrl: "https://example.com/tutorial.mp4",
          type: "video/mp4",
          width: 1920,
          height: 1080,
          duration: 900,
          title: "Advanced JS Tutorial",
        },
        locale: "en_US",
        alternateLocales: ["es_ES", "fr_FR", "de_DE"],
        fbAppId: "123456789",
        fbPages: ["111222333"],
        fbAdmins: ["444555666"],
        analytics: {
          pixelId: "987654321",
          conversionGoals: ["Lead", "Newsletter_Signup"],
          customEvents: ["Blog_Read", "Tutorial_Watch"],
        },
        syndication: {
          originalSource: "https://original-blog.com",
          partners: ["medium.com/@devblog", "dev.to"],
        },
        verification: "verification123",
      });

      // Should contain elements from all tiers
      assert(result.includes('<meta name="og:title"'));
      assert(result.includes('<meta name="og:description"'));
      assert(result.includes('<meta name="og:url"'));
      assert(result.includes('<meta name="og:site_name"'));
      assert(result.includes('<meta name="og:type"'));
      assert(result.includes('content="article"'));

      // Multiple images
      assert(result.includes('<meta name="og:image"'));
      assert(result.includes('<meta name="og:image:secure_url"'));
      assert(result.includes('<meta name="og:image:type"'));
      assert(result.includes('<meta name="og:image:width"'));
      assert(result.includes('<meta name="og:image:height"'));
      assert(result.includes('<meta name="og:image:alt"'));

      // Article metadata
      assert(result.includes('<meta name="article:author"'));
      assert(result.includes('<meta name="article:published_time"'));
      assert(result.includes('<meta name="article:modified_time"'));
      assert(result.includes('<meta name="article:section"'));
      assert(result.includes('<meta name="article:tag"'));

      // Video metadata
      assert(result.includes('<meta name="og:video"'));
      assert(result.includes('<meta name="og:video:secure_url"'));
      assert(result.includes('<meta name="og:video:type"'));
      assert(result.includes('<meta name="og:video:width"'));
      assert(result.includes('<meta name="og:video:height"'));
      assert(result.includes('<meta name="og:video:duration"'));
      assert(result.includes('<meta name="og:video:title"'));

      // Locale and Facebook integration
      assert(result.includes('<meta name="og:locale"'));
      assert(result.includes('<meta name="og:locale:alternate"'));
      assert(result.includes('<meta name="fb:app_id"'));
      assert(result.includes('<meta name="fb:pages"'));
      assert(result.includes('<meta name="fb:admins"'));

      // Analytics and tracking
      assert(result.includes('<meta name="fb:analytics"'));
      assert(result.includes('<meta name="fb:conversion"'));
      assert(result.includes('<meta name="fb:event"'));

      // Syndication
      assert(result.includes('<meta name="og:syndication"'));
      assert(result.includes('<meta name="og:syndication:partner"'));

      // Verification
      assert(result.includes('<meta name="fb:domain_verification"'));
    });
  });

  describe("Edge Cases", () => {
    it("should handle complex query parameters", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/article?param1=value1&param2=value2&utm_source=facebook",
        title: "Article",
        description: "Description",
      });

      assert(result.includes('content="https://example.com/article?param1=value1&param2=value2&utm_source=facebook"'));
    });

    it("should handle URL-encoded characters", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/article?title=What%20is%20JavaScript%3F",
        title: "Article",
        description: "Description",
      });

      assert(result.includes('content="https://example.com/article?title=What%20is%20JavaScript%3F"'));
    });

    it("should handle subdomain domains", () => {
      const result = openGraph({
        domain: "blog.example.com",
        path: "/post",
        title: "Post",
        description: "Description",
      });

      assert(result.includes('content="https://blog.example.com/post"'));
    });

    it("should handle port numbers in domain", () => {
      const result = openGraph({
        domain: "localhost:3000",
        path: "/test",
        title: "Test",
        description: "Description",
      });

      assert(result.includes('content="https://localhost:3000/test"'));
    });

    it("should handle very long paths", () => {
      const longPath = "/blog/categories/programming/languages/javascript/advanced/topics/closures-and-scope";
      const result = openGraph({
        domain: "example.com",
        path: longPath,
        title: "Advanced JavaScript",
        description: "Deep dive into closures",
      });

      assert(result.includes(`content="https://example.com${longPath}"`));
    });

    it("should handle special characters in domain", () => {
      const result = openGraph({
        domain: "tech-company.co.uk",
        path: "/about",
        title: "About",
        description: "About us",
      });

      assert(result.includes('content="https://tech-company.co.uk/about"'));
    });

    it("should handle Unicode characters in text fields", () => {
      const result = openGraph({
        title: "Développeur 🚀",
        description: "Opportunité exceptionnelle 🌟",
        type: "article",
        article: {
          authors: ["José María", "François Müller"],
        },
        alternateLocales: ["es_ES", "fr_FR", "de_DE"],
      });

      assert(result.includes('content="Développeur 🚀"'));
      assert(result.includes('content="Opportunité exceptionnelle 🌟"'));
      assert(result.includes('content="José María"'));
      assert(result.includes('content="François Müller"'));
    });

    it("should handle very long text content", () => {
      const longTitle = "A".repeat(300);
      const longDescription = "B".repeat(600);
      const result = openGraph({
        title: longTitle,
        description: longDescription,
      });

      assert(result.includes(longTitle));
      assert(result.includes(longDescription));
    });

    it("should handle mixed absolute and relative URLs", () => {
      const result = openGraph({
        domain: "example.com",
        title: "Mixed URLs",
        description: "Testing mixed URLs",
        image: "https://cdn.example.com/image.jpg",
        video: {
          url: "/video.mp4",
        },
      });

      assert(result.includes('content="https://cdn.example.com/image.jpg"'));
      assert(result.includes('content="https://example.com/video.mp4"'));
    });

    it("should handle empty arrays in all contexts", () => {
      const result = openGraph({
        title: "Test",
        description: "Test",
        image: [],
        article: { authors: [], tags: [] },
        alternateLocales: [],
        fbPages: [],
        fbAdmins: [],
        analytics: { conversionGoals: [], customEvents: [] },
        syndication: { partners: [] },
      });

      assert(result.includes('<meta name="og:title"'));
      assert(!result.includes('<meta name="og:image"'));
      assert(!result.includes('<meta name="article:author"'));
      assert(!result.includes('<meta name="og:locale:alternate"'));
      assert(!result.includes('<meta name="fb:pages"'));
      assert(!result.includes('<meta name="fb:conversion"'));
      assert(!result.includes('<meta name="og:syndication:partner"'));
    });

    it("should handle zero and negative values gracefully", () => {
      const result = openGraph({
        title: "Test",
        description: "Test",
        image: {
          url: "/test.jpg",
          width: 0,
          height: -100,
        },
        video: {
          url: "/test.mp4",
          duration: 0,
        },
      });

      assert(result.includes('<meta name="og:image"'));
      assert(result.includes('<meta name="og:image:width"'));
      assert(result.includes('content="0"'));
      assert(result.includes('<meta name="og:image:height"'));
      assert(result.includes('content="-100"'));
      assert(result.includes('<meta name="og:video"'));
      assert(result.includes('<meta name="og:video:duration"'));
    });

    it("should handle malformed price objects", () => {
      const result = openGraph({
        title: "Product",
        description: "Test product",
        type: "product",
        product: {
          price: { amount: "invalid", currency: "" },
        },
      });

      assert(result.includes('<meta name="product:price:amount"'));
      assert(result.includes('content="invalid"'));
      // Empty currency should not generate a tag
      assert(!result.includes('<meta name="product:price:currency"'));
    });
  });

  describe("Schema and Output Validation", () => {
    it("should generate valid HTML markup structure", () => {
      const result = openGraph({
        title: "Test",
        description: "Test description",
      });

      assert(result.trim().startsWith("<meta"));
      const metaTagCount = (result.match(/<meta/g) || []).length;
      const closingTagCount = (result.match(/\/>/g) || []).length;
      assert.strictEqual(metaTagCount, closingTagCount);
    });

    it("should generate properly formatted Open Graph meta tags", () => {
      const result = openGraph({
        title: "Test Title",
        description: "Test Description",
      });

      assert(result.includes('name="og:title"'));
      assert(result.includes('property="og:title"'));
      assert(result.includes('name="og:description"'));
      assert(result.includes('property="og:description"'));
    });

    it("should ensure all generated URLs are HTTPS", () => {
      const result = openGraph({
        domain: "example.com",
        path: "/test",
        title: "Test",
        description: "Test description",
        image: "http://example.com/image.jpg",
        video: {
          url: "http://example.com/video.mp4",
        },
      });

      assert(!result.includes("http://"));
      assert(result.includes("https://"));
    });

    it("should handle malformed URLs gracefully", () => {
      const result = openGraph({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        image: "not-a-url",
        video: {
          url: "invalid-url",
        },
      });

      assert(result.includes('<meta name="og:image"'));
      assert(result.includes('content="https://example.com/not-a-url"'));
      assert(result.includes('<meta name="og:video"'));
      assert(result.includes('content="https://example.com/invalid-url"'));
    });

    it("should properly escape HTML in content", () => {
      const result = openGraph({
        title: 'Test "Quote" & <Tag>',
        description: "Test description",
      });

      assert(!result.includes('Test "Quote" & <Tag>'));
      assert(result.includes("Test &quot;Quote&quot; &amp; &lt;Tag&gt;"));
    });

    it("should generate consistent property/name attributes", () => {
      const result = openGraph({
        title: "Test",
        description: "Test description",
        article: {
          authors: ["Test Author"],
        },
      });

      const metaTags = result.match(/<meta[^>]*>/g) || [];
      for (const tag of metaTags) {
        if (tag.includes("og:") || tag.includes("article:") || tag.includes("fb:")) {
          assert(tag.includes('name="') || tag.includes('property="'));
        }
      }
    });

    it("should handle content type edge cases correctly", () => {
      const videoResult = openGraph({
        title: "Watch This Video",
        description: "Video content",
      });
      assert(videoResult.includes('content="video.other"'));

      const audioResult = openGraph({
        title: "Listen to Music",
        description: "Audio content",
      });
      assert(audioResult.includes('content="music.song"'));

      const bookResult = openGraph({
        title: "Read This Book",
        description: "ISBN: 1234567890",
      });
      assert(bookResult.includes('content="book"'));

      const profileResult = openGraph({
        domain: "example.com",
        path: "/author/john",
        title: "John Doe",
        description: "Profile page",
      });
      assert(profileResult.includes('content="profile"'));

      const productResult = openGraph({
        title: "Buy This Product",
        description: "Price: $29.99",
      });
      assert(productResult.includes('content="product"'));
    });

    it("should validate image dimensions", () => {
      const result = openGraph({
        title: "Test",
        description: "Test",
        image: {
          url: "/test.jpg",
          width: 1200,
          height: 630,
        },
      });

      assert(result.includes('<meta name="og:image:width"'));
      assert(result.includes('content="1200"'));
      assert(result.includes('<meta name="og:image:height"'));
      assert(result.includes('content="630"'));
    });

    it("should handle missing optional properties gracefully", () => {
      const result = openGraph({
        title: "Minimal",
        description: "Minimal description",
      });

      assert(result.includes('<meta name="og:title"'));
      assert(result.includes('<meta name="og:description"'));
      assert(result.includes('<meta name="og:type"'));
      assert(!result.includes('<meta name="og:url"'));
      assert(!result.includes('<meta name="og:image"'));
      assert(!result.includes('<meta name="og:site_name"'));
    });
  });
});
