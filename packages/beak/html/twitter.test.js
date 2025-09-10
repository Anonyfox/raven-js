/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { twitter } from "./twitter.js";

/**
 * @file Comprehensive test suite for progressive Twitter Cards generator.
 *
 * Tests all enhancement tiers, card type detection, and ensures 100% code coverage
 * through systematic testing of configuration combinations.
 */

describe("twitter()", () => {
  describe("Input Validation", () => {
    it("should return empty string for undefined config", () => {
      assert.strictEqual(twitter(undefined), "");
    });

    it("should return empty string for null config", () => {
      assert.strictEqual(twitter(null), "");
    });

    it("should return empty string for non-object config", () => {
      assert.strictEqual(twitter("string"), "");
      assert.strictEqual(twitter(123), "");
      assert.strictEqual(twitter([]), "");
    });

    it("should return empty string when title is missing", () => {
      assert.strictEqual(twitter({ description: "test" }), "");
    });

    it("should return empty string when description is missing", () => {
      assert.strictEqual(twitter({ title: "test" }), "");
    });

    it("should return empty string when both title and description are missing", () => {
      assert.strictEqual(twitter({ domain: "example.com" }), "");
    });
  });

  describe("Card Type Detection", () => {
    it("should auto-detect summary card type by default", () => {
      const result = twitter({
        title: "Test Title",
        description: "Test description",
      });

      assert(result.includes('content="summary"'));
    });

    it("should auto-detect summary_large_image for large images", () => {
      const result = twitter({
        title: "Test Title",
        description: "Test description",
        image: { url: "/large-image.jpg", width: 1200, height: 600 },
      });

      assert(result.includes('content="summary_large_image"'));
    });

    it("should auto-detect player card for video content", () => {
      const result = twitter({
        title: "Video Content",
        description: "Watch this video",
        video: { url: "/video.mp4" },
      });

      assert(result.includes('content="player"'));
    });

    it("should auto-detect app card for app content", () => {
      const result = twitter({
        title: "App Download",
        description: "Download our app",
        contentType: "app",
      });

      assert(result.includes('content="app"'));
    });

    it("should auto-detect gallery card for multiple images", () => {
      const result = twitter({
        title: "Gallery",
        description: "Multiple images",
        gallery: { images: ["/img1.jpg", "/img2.jpg"] },
      });

      assert(result.includes('content="gallery"'));
    });

    it("should use explicit cardType over auto-detection", () => {
      const result = twitter({
        title: "Test",
        description: "Test",
        video: { url: "/video.mp4" },
        cardType: "summary",
      });

      assert(result.includes('content="summary"'));
    });

    it("should handle contentType auto-detection", () => {
      const result = twitter({
        title: "Article",
        description: "Article content",
        contentType: "article",
      });

      assert(result.includes('content="summary"')); // Article doesn't change card type
    });
  });

  describe("URL Normalization", () => {
    it("should construct basic absolute URL from domain", () => {
      const result = twitter({
        domain: "example.com",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('content="https://example.com"'));
    });

    it("should use pre-constructed URL when provided", () => {
      const result = twitter({
        domain: "example.com",
        url: "https://custom.com/article",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('content="https://custom.com/article"'));
    });

    it("should force HTTPS for pre-constructed URLs", () => {
      const result = twitter({
        domain: "example.com",
        url: "http://example.com/article",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('content="https://example.com/article"'));
    });

    it("should handle subdomain domains", () => {
      const result = twitter({
        domain: "blog.example.com",
        title: "Post",
        description: "Description",
      });

      assert(result.includes('content="https://blog.example.com"'));
    });
  });

  describe("Tier 1: Basic Twitter Cards", () => {
    it("should generate basic Twitter card meta tags", () => {
      const result = twitter({
        title: "Test Title",
        description: "Test description for Twitter",
      });

      assert(result.includes('<meta name="twitter:card"'));
      assert(result.includes('content="summary"'));
      assert(result.includes('<meta name="twitter:title"'));
      assert(result.includes('content="Test Title"'));
      assert(result.includes('<meta name="twitter:description"'));
      assert(result.includes('content="Test description for Twitter"'));
    });

    it("should include URL when domain provided", () => {
      const result = twitter({
        domain: "example.com",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('<meta name="twitter:url"'));
      assert(result.includes('content="https://example.com"'));
    });

    it("should include simple string image", () => {
      const result = twitter({
        title: "Test",
        description: "Test description",
        image: "/banner.jpg",
      });

      assert(result.includes('<meta name="twitter:image"'));
      assert(result.includes('content="/banner.jpg"'));
      assert(result.includes('<meta name="twitter:image:alt"'));
    });

    it("should normalize image URL when domain provided", () => {
      const result = twitter({
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
      const result = twitter({
        title: "Test",
        description: "Test description",
        image: {
          url: "/banner.jpg",
          alt: "Banner image",
          width: 1200,
          height: 630,
        },
      });

      assert(result.includes('<meta name="twitter:image"'));
      assert(result.includes('content="/banner.jpg"'));
      assert(result.includes('<meta name="twitter:image:alt"'));
      assert(result.includes('<meta name="twitter:image:width"'));
      assert(result.includes('<meta name="twitter:image:height"'));
    });

    it("should handle multiple images for gallery", () => {
      const result = twitter({
        title: "Test",
        description: "Test description",
        image: [
          { url: "/img1.jpg", alt: "First image" },
          { url: "/img2.jpg", alt: "Second image" },
          { url: "/img3.jpg", alt: "Third image" },
          { url: "/img4.jpg", alt: "Fourth image" },
        ],
      });

      assert(result.includes('content="/img1.jpg"'));
      assert(result.includes('content="/img2.jpg"'));
      assert(result.includes('content="/img3.jpg"'));
      assert(result.includes('content="/img4.jpg"'));
      assert(result.includes('<meta name="twitter:image0"'));
      assert(result.includes('<meta name="twitter:image1"'));
      assert(result.includes('<meta name="twitter:image2"'));
      assert(result.includes('<meta name="twitter:image3"'));
    });

    it("should limit gallery images to 4", () => {
      const images = Array.from({ length: 6 }, (_, i) => ({ url: `/img${i}.jpg` }));
      const result = twitter({
        title: "Test",
        description: "Test description",
        image: images,
      });

      assert(result.includes('<meta name="twitter:image0"'));
      assert(result.includes('<meta name="twitter:image3"'));
      assert(!result.includes('<meta name="twitter:image4"'));
    });

    it("should handle gallery object", () => {
      const result = twitter({
        title: "Gallery Test",
        description: "Multiple images",
        gallery: {
          images: ["/img1.jpg", "/img2.jpg"],
        },
      });

      assert(result.includes('<meta name="twitter:image0"'));
      assert(result.includes('<meta name="twitter:image1"'));
    });
  });

  describe("Video Handling", () => {
    it("should generate player card with all video properties", () => {
      const result = twitter({
        title: "Video Content",
        description: "Watch this video",
        video: {
          url: "/video.mp4",
          width: 1280,
          height: 720,
          duration: 180,
          thumbnail: "/thumb.jpg",
          stream: {
            url: "/stream.mp4",
            contentType: "video/mp4",
          },
        },
      });

      assert(result.includes('<meta name="twitter:player"'));
      assert(result.includes('content="/video.mp4"'));
      assert(result.includes('<meta name="twitter:player:width"'));
      assert(result.includes('<meta name="twitter:player:height"'));
      assert(result.includes('<meta name="twitter:player:stream"'));
      assert(result.includes('<meta name="twitter:player:stream:content_type"'));
    });

    it("should use video thumbnail as image when no image provided", () => {
      const result = twitter({
        title: "Video Only",
        description: "Video content",
        video: {
          url: "/video.mp4",
          thumbnail: "/thumb.jpg",
        },
      });

      assert(result.includes('<meta name="twitter:image"'));
      assert(result.includes('content="/thumb.jpg"'));
    });

    it("should handle zero duration", () => {
      const result = twitter({
        title: "Video",
        description: "Description",
        video: { url: "/video.mp4", duration: 0 },
      });

      assert(!result.includes('<meta name="twitter:player:duration"'));
    });

    it("should handle null/undefined video properties", () => {
      const result = twitter({
        title: "Video",
        description: "Description",
        video: { url: "/video.mp4", width: null, height: undefined },
      });

      assert(result.includes('<meta name="twitter:player"'));
      assert(!result.includes('<meta name="twitter:player:width"'));
      assert(!result.includes('<meta name="twitter:player:height"'));
    });
  });

  describe("Tier 2: Enhanced Card Types", () => {
    it("should generate app card with iPhone details", () => {
      const result = twitter({
        title: "App Download",
        description: "Download our app",
        app: {
          iphone: {
            name: "My App",
            id: "123456789",
            url: "myapp://home",
          },
        },
      });

      assert(result.includes('<meta name="twitter:app:name:iphone"'));
      assert(result.includes('<meta name="twitter:app:id:iphone"'));
      assert(result.includes('<meta name="twitter:app:url:iphone"'));
    });

    it("should generate app card with Google Play details", () => {
      const result = twitter({
        title: "App Download",
        description: "Download our app",
        app: {
          googleplay: {
            name: "My App",
            id: "com.mycompany.myapp",
            url: "https://play.google.com/store/apps/details?id=com.mycompany.myapp",
          },
        },
      });

      assert(result.includes('<meta name="twitter:app:name:googleplay"'));
      assert(result.includes('<meta name="twitter:app:id:googleplay"'));
      assert(result.includes('<meta name="twitter:app:url:googleplay"'));
    });

    it("should generate app card with country", () => {
      const result = twitter({
        title: "App Download",
        description: "Download our app",
        app: {
          iphone: { name: "Test App" },
          country: "US",
        },
      });

      assert(result.includes('<meta name="twitter:app:country"'));
      assert(result.includes('content="US"'));
    });

    it("should generate player card from player config", () => {
      const result = twitter({
        title: "Video Player",
        description: "Embedded video",
        video: { url: "/video.mp4" },
        player: {
          url: "/player.html",
          width: 640,
          height: 360,
          stream: "/stream.mp4",
          streamContentType: "video/mp4",
        },
      });

      assert(result.includes('<meta name="twitter:player"'));
      assert(result.includes('<meta name="twitter:player:width"'));
      assert(result.includes('<meta name="twitter:player:height"'));
      assert(result.includes('<meta name="twitter:player:stream"'));
      assert(result.includes('<meta name="twitter:player:stream:content_type"'));
    });
  });

  describe("Tier 3: Advanced Twitter Features", () => {
    it("should format creator username correctly", () => {
      const result = twitter({
        title: "Content",
        description: "Description",
        creator: "username",
      });

      assert(result.includes('<meta name="twitter:creator"'));
      assert(result.includes('content="@username"'));
    });

    it("should format creator username with @ prefix", () => {
      const result = twitter({
        title: "Content",
        description: "Description",
        creator: "@username",
      });

      assert(result.includes('<meta name="twitter:creator"'));
      assert(result.includes('content="@username"'));
    });

    it("should format site username correctly", () => {
      const result = twitter({
        title: "Content",
        description: "Description",
        site: "brandaccount",
      });

      assert(result.includes('<meta name="twitter:site"'));
      assert(result.includes('content="@brandaccount"'));
    });

    it("should generate article metadata", () => {
      const result = twitter({
        title: "Article",
        description: "Article content",
        article: {
          author: "Jane Doe",
          section: "Technology",
        },
      });

      assert(result.includes('<meta name="twitter:label1"'));
      assert(result.includes('content="Written by"'));
      assert(result.includes('<meta name="twitter:data1"'));
      assert(result.includes('content="Jane Doe"'));
      assert(result.includes('<meta name="twitter:label2"'));
      assert(result.includes('content="Filed under"'));
      assert(result.includes('<meta name="twitter:data2"'));
      assert(result.includes('content="Technology"'));
    });

    it("should generate thread metadata", () => {
      const result = twitter({
        title: "Thread Part 1",
        description: "First part of thread",
        thread: {
          position: 1,
          total: 3,
          nextUrl: "/thread-part-2",
        },
      });

      assert(result.includes('<meta name="twitter:label1"'));
      assert(result.includes('content="Reading"'));
      assert(result.includes('<meta name="twitter:data1"'));
      assert(result.includes('content="1 of 3"'));
      assert(result.includes('<meta name="twitter:label2"'));
      assert(result.includes('content="Next"'));
      assert(result.includes('<meta name="twitter:data2"'));
      assert(result.includes('content="/thread-part-2"'));
    });
  });

  describe("Tier 4: Enterprise Twitter Integration", () => {
    it("should generate analytics metadata", () => {
      const result = twitter({
        title: "Content",
        description: "Description",
        analytics: {
          trackingId: "twitter_pixel_123",
          conversionEvents: ["Purchase", "SignUp"],
        },
      });

      assert(result.includes('<meta name="twitter:tracking"'));
      assert(result.includes('<meta name="twitter:conversion"'));
    });

    it("should limit conversion events to 3", () => {
      const events = Array.from({ length: 5 }, (_, i) => `Event ${i}`);
      const result = twitter({
        title: "Content",
        description: "Description",
        analytics: { conversionEvents: events },
      });

      let eventCount = 0;
      const matches = result.match(/name="twitter:conversion"/g) || [];
      eventCount = matches.length;

      assert.strictEqual(eventCount, 3);
    });

    it("should generate ads metadata", () => {
      const result = twitter({
        title: "Content",
        description: "Description",
        ads: {
          campaignId: "campaign_456",
          creativeId: "creative_789",
          attribution: "purchase",
        },
      });

      assert(result.includes('<meta name="twitter:campaign"'));
      assert(result.includes('<meta name="twitter:creative"'));
      assert(result.includes('<meta name="twitter:attribution"'));
    });
  });

  describe("Progressive Enhancement Combinations", () => {
    it("should handle Tier 1 + Tier 3 (basic + creator attribution)", () => {
      const result = twitter({
        domain: "example.com",
        title: "Amazing Article",
        description: "Read this amazing article",
        image: "/article-image.jpg",
        creator: "@journalist",
        site: "@newsbrand",
      });

      assert(result.includes('<meta name="twitter:card"'));
      assert(result.includes('<meta name="twitter:title"'));
      assert(result.includes('<meta name="twitter:description"'));
      assert(result.includes('<meta name="twitter:url"'));
      assert(result.includes('<meta name="twitter:image"'));
      assert(result.includes('<meta name="twitter:creator"'));
      assert(result.includes('<meta name="twitter:site"'));
    });

    it("should handle Tier 2 + Tier 3 (app card + creator attribution)", () => {
      const result = twitter({
        title: "Download Our App",
        description: "Amazing productivity app",
        image: "/app-screenshot.jpg",
        app: {
          iphone: {
            name: "Productivity Pro",
            id: "123456789",
            url: "productivitypro://home",
          },
        },
        creator: "@appdeveloper",
        site: "@techcompany",
      });

      assert(result.includes('<meta name="twitter:card"'));
      assert(result.includes('content="app"'));
      assert(result.includes('<meta name="twitter:app:name:iphone"'));
      assert(result.includes('<meta name="twitter:app:id:iphone"'));
      assert(result.includes('<meta name="twitter:app:url:iphone"'));
      assert(result.includes('<meta name="twitter:creator"'));
      assert(result.includes('<meta name="twitter:site"'));
    });

    it("should handle Tier 2 + Tier 4 (video + analytics)", () => {
      const result = twitter({
        domain: "example.com",
        title: "Product Demo Video",
        description: "Watch our amazing product demo",
        video: {
          url: "/demo.mp4",
          width: 1280,
          height: 720,
        },
        analytics: {
          trackingId: "twitter_pixel_123",
          conversionEvents: ["Lead"],
        },
      });

      assert(result.includes('<meta name="twitter:card"'));
      assert(result.includes('content="player"'));
      assert(result.includes('<meta name="twitter:player"'));
      assert(result.includes('<meta name="twitter:player:width"'));
      assert(result.includes('<meta name="twitter:player:height"'));
      assert(result.includes('<meta name="twitter:tracking"'));
      assert(result.includes('<meta name="twitter:conversion"'));
    });

    it("should handle all tiers combined", () => {
      const result = twitter({
        domain: "example.com",
        url: "https://example.com/premium-article",
        title: "Premium Article with Video",
        description: "Exclusive content with embedded video",
        image: [
          { url: "/hero-image.jpg", alt: "Hero image" },
          { url: "/secondary-image.jpg", alt: "Secondary image" },
        ],
        video: {
          url: "/premium-video.mp4",
          width: 1280,
          height: 720,
          stream: {
            url: "/premium-stream.mp4",
            contentType: "video/mp4",
          },
        },
        contentType: "article",
        article: {
          author: "Premium Writer",
          section: "Premium Content",
        },
        creator: "@premiumwriter",
        site: "@premiumbrand",
        analytics: {
          trackingId: "premium_pixel_123",
          conversionEvents: ["Purchase"],
        },
        ads: {
          campaignId: "premium_campaign",
          attribution: "lead",
        },
      });

      // Tier 1 - Basic
      assert(result.includes('<meta name="twitter:card"'));
      assert(result.includes('<meta name="twitter:title"'));
      assert(result.includes('<meta name="twitter:description"'));
      assert(result.includes('<meta name="twitter:url"'));

      // Images (gallery)
      assert(result.includes('<meta name="twitter:image0"'));
      assert(result.includes('<meta name="twitter:image1"'));

      // Video
      assert(result.includes('<meta name="twitter:player"'));
      assert(result.includes('<meta name="twitter:player:width"'));
      assert(result.includes('<meta name="twitter:player:height"'));
      assert(result.includes('<meta name="twitter:player:stream"'));

      // Tier 3 - Creator and article
      assert(result.includes('<meta name="twitter:creator"'));
      assert(result.includes('<meta name="twitter:site"'));
      assert(result.includes('<meta name="twitter:label1"'));
      assert(result.includes('content="Written by"'));

      // Tier 4 - Analytics and ads
      assert(result.includes('<meta name="twitter:tracking"'));
      assert(result.includes('<meta name="twitter:conversion"'));
      assert(result.includes('<meta name="twitter:campaign"'));
      assert(result.includes('<meta name="twitter:attribution"'));
    });
  });

  describe("Edge Cases", () => {
    it("should handle complex query parameters", () => {
      const result = twitter({
        domain: "example.com",
        url: "/article?id=123&utm_source=twitter&ref=homepage",
        title: "Article",
        description: "Description",
      });

      assert(result.includes('content="https://example.com/article?id=123&utm_source=twitter&ref=homepage"'));
    });

    it("should handle URL-encoded characters", () => {
      const result = twitter({
        domain: "example.com",
        url: "/article?name=Breaking%20News&category=Tech",
        title: "Article",
        description: "Description",
      });

      assert(result.includes('content="https://example.com/article?name=Breaking%20News&category=Tech"'));
    });

    it("should handle port numbers in domain", () => {
      const result = twitter({
        domain: "localhost:3000",
        title: "Dev Article",
        description: "Development content",
      });

      assert(result.includes('content="https://localhost:3000"'));
    });

    it("should handle very long title and description", () => {
      const longTitle = "A".repeat(300);
      const longDescription = "B".repeat(600);
      const result = twitter({
        title: longTitle,
        description: longDescription,
      });

      assert(result.includes(longTitle));
      assert(result.includes(longDescription));
    });

    it("should handle Unicode characters in text fields", () => {
      const result = twitter({
        title: "Café & Restaurant 🍽️",
        description: "Délicieux plats français avec ambiance romantique",
        creator: "@restaurant_paris",
      });

      assert(result.includes('content="Café &amp; Restaurant 🍽️"'));
      assert(result.includes('content="Délicieux plats français avec ambiance romantique"'));
      assert(result.includes('content="@restaurant_paris"'));
    });

    it("should handle mixed absolute and relative URLs", () => {
      const result = twitter({
        domain: "example.com",
        title: "Mixed URLs",
        description: "Description",
        image: "https://cdn.example.com/image.jpg",
        video: { url: "/video.mp4" },
      });

      assert(result.includes('content="https://cdn.example.com/image.jpg"'));
      assert(result.includes('content="https://example.com/video.mp4"'));
    });

    it("should handle empty arrays in all contexts", () => {
      const result = twitter({
        title: "Test",
        description: "Test",
        image: [],
        gallery: { images: [] },
        app: {},
        video: {},
        article: {},
        analytics: { conversionEvents: [] },
      });

      assert(result.includes('<meta name="twitter:title"'));
      assert(!result.includes('<meta name="twitter:image0"'));
      assert(!result.includes('<meta name="twitter:app:name:iphone"'));
      assert(!result.includes('<meta name="twitter:conversion"'));
    });

    it("should handle zero and negative values gracefully", () => {
      const result = twitter({
        title: "Test",
        description: "Test",
        image: { url: "/test.jpg", width: 0, height: -100 },
        video: { url: "/test.mp4", width: 0, height: -100 },
      });

      assert(result.includes('<meta name="twitter:image:width"'));
      assert(result.includes('content="0"'));
      assert(result.includes('<meta name="twitter:image:height"'));
      assert(result.includes('content="-100"'));
      assert(result.includes('<meta name="twitter:player:width"'));
      assert(result.includes('<meta name="twitter:player:height"'));
    });

    it("should handle malformed objects gracefully", () => {
      const result = twitter({
        title: "Product",
        description: "Test product",
        app: {
          iphone: { name: "", id: null },
          googleplay: { url: undefined },
        },
        creator: "",
        site: null,
      });

      assert(result.includes('<meta name="twitter:title"'));
      assert(!result.includes('<meta name="twitter:app:name:iphone"'));
      assert(!result.includes('<meta name="twitter:app:id:iphone"'));
      assert(!result.includes('<meta name="twitter:creator"'));
      assert(!result.includes('<meta name="twitter:site"'));
    });

    it("should handle missing optional properties gracefully", () => {
      const result = twitter({
        title: "Minimal",
        description: "Minimal description",
      });

      assert(result.includes('<meta name="twitter:title"'));
      assert(result.includes('<meta name="twitter:description"'));
      assert(!result.includes('<meta name="twitter:url"'));
      assert(!result.includes('<meta name="twitter:image"'));
      assert(!result.includes('<meta name="twitter:creator"'));
    });

    it("should handle extreme edge cases", () => {
      const result = twitter({
        title: "Edge Case",
        description: "Testing edge cases",
        image: { url: "/test.jpg", width: null, height: undefined },
        video: { url: "/test.mp4", width: null, height: undefined },
        app: {
          iphone: { name: null, id: undefined },
          googleplay: { name: "", id: null },
        },
        creator: null,
        site: undefined,
        analytics: { conversionEvents: [null, undefined, ""] },
      });

      assert(result.includes('<meta name="twitter:title"'));
      assert(result.includes('<meta name="twitter:image"'));
      assert(result.includes('<meta name="twitter:player"'));
      // Should not include null/undefined values
      assert(!result.includes('<meta name="twitter:image:width"'));
      assert(!result.includes('<meta name="twitter:image:height"'));
      assert(!result.includes('<meta name="twitter:player:width"'));
      assert(!result.includes('<meta name="twitter:player:height"'));
      assert(!result.includes('<meta name="twitter:app:name:iphone"'));
      assert(!result.includes('<meta name="twitter:creator"'));
      assert(!result.includes('<meta name="twitter:conversion"'));
    });
  });

  describe("Schema and Output Validation", () => {
    it("should generate valid HTML markup structure", () => {
      const result = twitter({
        title: "Test",
        description: "Test description",
      });

      assert(result.trim().startsWith("<meta"));
      const metaTagCount = (result.match(/<meta/g) || []).length;
      const closingTagCount = (result.match(/\/>/g) || []).length;
      assert.strictEqual(metaTagCount, closingTagCount);
    });

    it("should generate properly formatted Twitter meta tags", () => {
      const result = twitter({
        title: "Test Title",
        description: "Test Description",
      });

      assert(result.includes('name="twitter:card"'));
      assert(result.includes('property="twitter:card"'));
      assert(result.includes('name="twitter:title"'));
      assert(result.includes('property="twitter:title"'));
    });

    it("should ensure all generated URLs are HTTPS", () => {
      const result = twitter({
        domain: "example.com",
        url: "/test",
        title: "Test",
        description: "Test description",
        image: "http://example.com/image.jpg",
        video: { url: "http://example.com/video.mp4" },
      });

      assert(!result.includes("http://"));
      assert(result.includes("https://"));
    });

    it("should handle malformed URLs gracefully", () => {
      const result = twitter({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        image: "not-a-url",
        video: { url: "invalid-url" },
      });

      assert(result.includes('<meta name="twitter:image"'));
      assert(result.includes('content="https://example.com/not-a-url"'));
      assert(result.includes('<meta name="twitter:player"'));
      assert(result.includes('content="https://example.com/invalid-url"'));
    });

    it("should properly escape HTML in content", () => {
      const result = twitter({
        title: 'Test "Quote" & <Tag>',
        description: "Test description",
      });

      assert(!result.includes('Test "Quote" & <Tag>'));
      assert(result.includes("Test &quot;Quote&quot; &amp; &lt;Tag&gt;"));
    });

    it("should validate creator username formatting", () => {
      const result = twitter({
        title: "Content",
        description: "Description",
        creator: "username",
      });

      assert(result.includes('content="@username"'));
      assert(!result.includes('content="username"'));
    });

    it("should validate card type detection accuracy", () => {
      const testCases = [
        { video: { url: "/video.mp4" }, expected: "player" },
        { app: { iphone: { name: "App" } }, expected: "app" },
        { gallery: { images: ["/img1.jpg", "/img2.jpg"] }, expected: "gallery" },
        { image: { url: "/large.jpg", width: 1200 }, expected: "summary_large_image" },
        { image: "/small.jpg", expected: "summary" },
      ];

      for (const testCase of testCases) {
        const config = {
          title: "Test",
          description: "Test",
          ...testCase,
        };
        delete config.expected;

        const result = twitter(config);
        assert(result.includes(`content="${testCase.expected}"`), `Failed for ${testCase.expected}`);
      }
    });

    it("should handle Twitter-specific character limits", () => {
      const longTitle = "A".repeat(300);
      const longDescription = "B".repeat(600);
      const result = twitter({
        title: longTitle,
        description: longDescription,
      });

      assert(result.includes(longTitle));
      assert(result.includes(longDescription));
    });

    it("should validate Twitter card structure integrity", () => {
      const result = twitter({
        title: "Test",
        description: "Test",
        creator: "@testuser",
        site: "@testsite",
      });

      // Should have basic required tags
      assert(result.includes('<meta name="twitter:card"'));
      assert(result.includes('<meta name="twitter:title"'));
      assert(result.includes('<meta name="twitter:description"'));

      // Should have creator tags
      assert(result.includes('<meta name="twitter:creator"'));
      assert(result.includes('<meta name="twitter:site"'));
    });

    it("should validate progressive enhancement", () => {
      // Basic card
      const basicResult = twitter({
        title: "Basic",
        description: "Basic card",
      });

      // Enhanced card
      const enhancedResult = twitter({
        title: "Enhanced",
        description: "Enhanced card",
        creator: "@creator",
        site: "@site",
      });

      // Basic should have fewer tags
      const basicTagCount = (basicResult.match(/<meta/g) || []).length;
      const enhancedTagCount = (enhancedResult.match(/<meta/g) || []).length;

      assert(enhancedTagCount > basicTagCount, "Enhanced card should have more tags than basic card");
    });
  });
});
