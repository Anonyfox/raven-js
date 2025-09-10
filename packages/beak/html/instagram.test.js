/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { instagram } from "./instagram.js";

/**
 * @file Comprehensive test suite for progressive Instagram SEO optimization.
 *
 * Tests all enhancement tiers, visual content optimization, and ensures 100% code coverage
 * through systematic testing of configuration combinations and Instagram-specific features.
 */

describe("instagram()", () => {
  describe("Input Validation and Defaults", () => {
    it("should return empty string for undefined config", () => {
      assert.strictEqual(instagram(undefined), "");
    });

    it("should return empty string for null config", () => {
      assert.strictEqual(instagram(null), "");
    });

    it("should return empty string for non-object config", () => {
      assert.strictEqual(instagram("string"), "");
      assert.strictEqual(instagram(123), "");
      assert.strictEqual(instagram([]), "");
    });

    it("should return empty string when title is missing", () => {
      assert.strictEqual(instagram({ description: "test" }), "");
    });

    it("should return empty string when description is missing", () => {
      assert.strictEqual(instagram({ title: "test" }), "");
    });

    it("should return empty string when both title and description are missing", () => {
      assert.strictEqual(instagram({ domain: "example.com" }), "");
    });
  });

  describe("Tier 1: Basic Instagram Integration", () => {
    it("should generate basic Open Graph tags", () => {
      const result = instagram({
        title: "Beautiful Sunset",
        description: "Amazing sunset at the beach",
      });

      assert(result.includes('<meta property="og:title"'));
      assert(result.includes('<meta property="og:description"'));
      assert(result.includes('<meta property="og:type"'));
      assert(result.includes('<meta property="og:site_name"'));
    });

    it("should include URL when domain provided", () => {
      const result = instagram({
        domain: "example.com",
        title: "Content",
        description: "Description",
      });

      assert(result.includes('<meta property="og:url"'));
      assert(result.includes('content="https://example.com"'));
    });

    it("should include simple string image", () => {
      const result = instagram({
        title: "Image Post",
        description: "Beautiful image",
        image: "/sunset.jpg",
      });

      assert(result.includes('<meta property="og:image"'));
      assert(result.includes('content="/sunset.jpg"'));
      assert(result.includes('<meta property="og:image:alt"'));
    });

    it("should normalize image URL when domain provided", () => {
      const result = instagram({
        domain: "example.com",
        title: "Image Post",
        description: "Description",
        image: "/sunset.jpg",
      });

      assert(result.includes('content="https://example.com/sunset.jpg"'));
    });
  });

  describe("Tier 2: Enhanced Visual Content", () => {
    it("should handle rich image object with all properties", () => {
      const result = instagram({
        title: "Product Image",
        description: "Product description",
        image: {
          url: "/product.jpg",
          alt: "Beautiful product",
          width: 800,
          height: 600,
          aspectRatio: "landscape",
        },
      });

      assert(result.includes('<meta property="og:image"'));
      assert(result.includes('content="/product.jpg"'));
      assert(result.includes('<meta property="og:image:alt"'));
      assert(result.includes('<meta property="og:image:width"'));
      assert(result.includes('<meta property="og:image:height"'));
    });

    it("should optimize square aspect ratio", () => {
      const result = instagram({
        title: "Square Image",
        description: "Square content",
        image: {
          url: "/square.jpg",
          aspectRatio: "square",
        },
      });

      assert(result.includes('<meta property="og:image:width" content="1080"'));
      assert(result.includes('<meta property="og:image:height" content="1080"'));
    });

    it("should optimize landscape aspect ratio", () => {
      const result = instagram({
        title: "Landscape Image",
        description: "Landscape content",
        image: {
          url: "/landscape.jpg",
          aspectRatio: "landscape",
        },
      });

      assert(result.includes('<meta property="og:image:width" content="1080"'));
      assert(result.includes('<meta property="og:image:height" content="566"'));
    });

    it("should optimize portrait aspect ratio", () => {
      const result = instagram({
        title: "Portrait Image",
        description: "Portrait content",
        image: {
          url: "/portrait.jpg",
          aspectRatio: "portrait",
        },
      });

      assert(result.includes('<meta property="og:image:width" content="1080"'));
      assert(result.includes('<meta property="og:image:height" content="1350"'));
    });

    it("should handle multiple images for carousel", () => {
      const result = instagram({
        title: "Carousel Post",
        description: "Multiple images",
        image: "/main.jpg",
        multipleImages: ["/img1.jpg", "/img2.jpg", "/img3.jpg"],
      });

      assert(result.includes('content="/main.jpg"'));
      assert(result.includes('content="/img1.jpg"'));
      assert(result.includes('content="/img2.jpg"'));
      assert(result.includes('content="/img3.jpg"'));
    });

    it("should limit carousel images to 10", () => {
      const images = Array.from({ length: 12 }, (_, i) => `/img${i}.jpg`);
      const result = instagram({
        title: "Many Images",
        description: "Multiple images",
        multipleImages: images,
      });

      let imageCount = 0;
      const matches = result.match(/property="og:image"/g) || [];
      imageCount = matches.length;

      assert.strictEqual(imageCount, 10);
    });

    it("should handle rich multiple image objects", () => {
      const result = instagram({
        title: "Rich Carousel",
        description: "Rich images",
        multipleImages: [
          { url: "/img1.jpg", alt: "First image" },
          { url: "/img2.jpg", alt: "Second image" },
        ],
      });

      assert(result.includes('content="/img1.jpg"'));
      assert(result.includes('content="/img2.jpg"'));
    });
  });

  describe("Tier 3: Business & Commerce Features", () => {
    it("should generate business metadata", () => {
      const result = instagram({
        title: "Business Post",
        description: "Business content",
        business: {
          type: "product",
          price: "$99.99",
          availability: "in_stock",
          brand: "Brand Name",
          category: "Fashion",
          condition: "new",
        },
      });

      assert(result.includes('<meta property="og:type" content="product"'));
      assert(result.includes('<meta property="product:price"'));
      assert(result.includes('<meta property="product:availability"'));
      assert(result.includes('<meta property="product:brand"'));
      assert(result.includes('<meta property="product:category"'));
      assert(result.includes('<meta property="product:condition"'));
    });

    it("should generate shoppable post metadata", () => {
      const result = instagram({
        title: "Shoppable Post",
        description: "Buy now",
        shoppable: {
          products: [
            { name: "Product A", price: "$49.99", url: "/product-a" },
            { name: "Product B", price: "$29.99", url: "/product-b" },
          ],
          checkoutUrl: "/checkout",
        },
      });

      assert(result.includes('<meta property="product:name"'));
      assert(result.includes('<meta property="product:url"'));
      assert(result.includes('<meta property="commerce:checkout_url"'));
    });

    it("should limit shoppable products to 5", () => {
      const products = Array.from({ length: 7 }, (_, i) => ({
        name: `Product ${i}`,
        url: `/product-${i}`,
      }));
      const result = instagram({
        title: "Many Products",
        description: "Multiple products",
        shoppable: { products },
      });

      let productCount = 0;
      const matches = result.match(/property="product:name"/g) || [];
      productCount = matches.length;

      assert.strictEqual(productCount, 5);
    });

    it("should generate contact information", () => {
      const result = instagram({
        title: "Contact Post",
        description: "Get in touch",
        contact: {
          phone: "+1-555-0123",
          email: "contact@example.com",
          address: "123 Main St, City, State 12345",
        },
      });

      assert(result.includes('<meta property="business:contact_data:phone_number"'));
      assert(result.includes('<meta property="business:contact_data:email"'));
      assert(result.includes('<meta property="business:contact_data:street_address"'));
    });
  });

  describe("Tier 4: Advanced Instagram Features", () => {
    it("should generate stories metadata", () => {
      const result = instagram({
        title: "Story Content",
        description: "Instagram story",
        stories: {
          type: "event",
          cta: "Learn More",
          url: "/event-details",
        },
      });

      assert(result.includes('<meta property="instagram:story:type"'));
      assert(result.includes('<meta property="instagram:story:cta"'));
      assert(result.includes('<meta property="instagram:story:url"'));
    });

    it("should generate reels metadata", () => {
      const result = instagram({
        title: "Reel Content",
        description: "Instagram reel",
        reels: {
          duration: 30,
          audio: "Trending Sound",
          hashtags: ["viral", "dance", "music"],
          duetEnabled: true,
          stitchEnabled: true,
        },
      });

      assert(result.includes('<meta property="instagram:reel:duration"'));
      assert(result.includes('<meta property="instagram:reel:audio"'));
      assert(result.includes('<meta property="instagram:reel:hashtag"'));
      assert(result.includes('<meta property="instagram:reel:duet_enabled"'));
      assert(result.includes('<meta property="instagram:reel:stitch_enabled"'));
    });

    it("should limit reel hashtags to 10", () => {
      const hashtags = Array.from({ length: 12 }, (_, i) => `hashtag${i}`);
      const result = instagram({
        title: "Hashtag Reel",
        description: "Many hashtags",
        reels: { hashtags },
      });

      let hashtagCount = 0;
      const matches = result.match(/property="instagram:reel:hashtag"/g) || [];
      hashtagCount = matches.length;

      assert.strictEqual(hashtagCount, 10);
    });

    it("should generate IGTV metadata", () => {
      const result = instagram({
        title: "IGTV Content",
        description: "Long-form video",
        igtv: {
          title: "Behind the Scenes",
          description: "Exclusive content",
          duration: 300,
          series: "Making Of",
          episode: 1,
        },
      });

      assert(result.includes('<meta property="instagram:igtv:title"'));
      assert(result.includes('<meta property="instagram:igtv:description"'));
      assert(result.includes('<meta property="instagram:igtv:duration"'));
      assert(result.includes('<meta property="instagram:igtv:series"'));
      assert(result.includes('<meta property="instagram:igtv:episode"'));
    });

    it("should generate live streaming metadata", () => {
      const result = instagram({
        title: "Live Stream",
        description: "Going live",
        live: {
          title: "Live Q&A",
          description: "Ask me anything",
          startTime: "2024-01-15T20:00:00Z",
        },
      });

      assert(result.includes('<meta property="instagram:live:title"'));
      assert(result.includes('<meta property="instagram:live:description"'));
      assert(result.includes('<meta property="instagram:live:start_time"'));
    });

    it("should generate location metadata", () => {
      const result = instagram({
        title: "Location Post",
        description: "Check out this place",
        location: {
          name: "Beautiful Beach",
          latitude: 40.7128,
          longitude: -74.006,
          address: "123 Beach St, Beach City",
        },
      });

      assert(result.includes('<meta property="instagram:location:name"'));
      assert(result.includes('<meta property="instagram:location:latitude"'));
      assert(result.includes('<meta property="instagram:location:longitude"'));
      assert(result.includes('<meta property="instagram:location:address"'));
    });

    it("should generate hashtag metadata", () => {
      const result = instagram({
        title: "Hashtag Post",
        description: "Trending content",
        hashtags: {
          primary: ["brand", "product"],
          trending: ["viral", "hot"],
          location: ["nyc", "manhattan"],
          niche: ["premium", "luxury"],
        },
      });

      assert(result.includes('<meta property="instagram:hashtag"'));
      // Should include all types of hashtags
      assert(result.includes('content="brand"'));
      assert(result.includes('content="viral"'));
      assert(result.includes('content="nyc"'));
      assert(result.includes('content="premium"'));
    });

    it("should limit total hashtags to 30", () => {
      const hashtags = Array.from({ length: 35 }, (_, i) => `tag${i}`);
      const result = instagram({
        title: "Many Hashtags",
        description: "Lots of tags",
        hashtags: {
          primary: hashtags,
          trending: hashtags,
          location: hashtags,
          niche: hashtags,
        },
      });

      let hashtagCount = 0;
      const matches = result.match(/property="instagram:hashtag"/g) || [];
      hashtagCount = matches.length;

      assert.strictEqual(hashtagCount, 30);
    });

    it("should generate engagement metadata", () => {
      const result = instagram({
        title: "Collaborative Post",
        description: "Team effort",
        engagement: {
          mentions: ["@partner1", "@influencer2", "@brand3"],
          collaboration: true,
          brandedContent: true,
          sponsored: false,
        },
      });

      assert(result.includes('<meta property="instagram:mention"'));
      assert(result.includes('<meta property="instagram:collaboration"'));
      assert(result.includes('<meta property="instagram:branded_content"'));
      assert(!result.includes('<meta property="instagram:sponsored"'));
    });

    it("should limit mentions to 20", () => {
      const mentions = Array.from({ length: 25 }, (_, i) => `@user${i}`);
      const result = instagram({
        title: "Many Mentions",
        description: "Lots of tags",
        engagement: { mentions },
      });

      let mentionCount = 0;
      const matches = result.match(/property="instagram:mention"/g) || [];
      mentionCount = matches.length;

      assert.strictEqual(mentionCount, 20);
    });
  });

  describe("Content Type Intelligence", () => {
    it("should apply article content type defaults", () => {
      const result = instagram({
        title: "Article",
        description: "Article content",
        contentType: "article",
      });

      assert(result.includes('<meta property="og:type" content="article"'));
    });

    it("should apply product content type defaults", () => {
      const result = instagram({
        title: "Product",
        description: "Product description",
        contentType: "product",
      });

      assert(result.includes('<meta property="og:type" content="product"'));
    });

    it("should apply event content type defaults", () => {
      const result = instagram({
        title: "Event",
        description: "Event description",
        contentType: "event",
      });

      assert(result.includes('<meta property="og:type" content="event"'));
    });

    it("should apply video content type defaults", () => {
      const result = instagram({
        title: "Video",
        description: "Video content",
        contentType: "video",
      });

      // Video content type defaults should be applied but og:type remains website
      assert(result.includes('<meta property="og:type" content="website"'));
    });

    it("should apply business content type defaults", () => {
      const result = instagram({
        title: "Business",
        description: "Business content",
        contentType: "business",
      });

      assert(result.includes('<meta property="og:type" content="business"'));
    });
  });

  describe("Progressive Enhancement Combinations", () => {
    it("should handle Tier 1 + Tier 2 (basic + visual)", () => {
      const result = instagram({
        title: "Enhanced Post",
        description: "Enhanced content",
        image: {
          url: "/enhanced.jpg",
          alt: "Enhanced image",
          aspectRatio: "square",
        },
        multipleImages: ["/img1.jpg", "/img2.jpg"],
      });

      assert(result.includes('<meta property="og:title"'));
      assert(result.includes('<meta property="og:image:alt"'));
      assert(result.includes('content="/img1.jpg"'));
      assert(result.includes('content="/img2.jpg"'));
    });

    it("should handle Tier 2 + Tier 3 (visual + commerce)", () => {
      const result = instagram({
        title: "Shoppable Visual",
        description: "Buy this item",
        image: "/product.jpg",
        business: {
          type: "product",
          price: "$99.99",
        },
        shoppable: {
          products: [{ name: "Product", url: "/product" }],
          checkoutUrl: "/checkout",
        },
      });

      assert(result.includes('<meta property="og:image"'));
      assert(result.includes('<meta property="product:price"'));
      assert(result.includes('<meta property="commerce:checkout_url"'));
    });

    it("should handle Tier 3 + Tier 4 (commerce + advanced)", () => {
      const result = instagram({
        title: "Advanced Commerce",
        description: "Advanced product",
        image: "/product.jpg",
        business: { type: "product", price: "$99.99" },
        stories: { type: "product", cta: "Shop Now" },
        reels: { hashtags: ["shop", "product"] },
        hashtags: { primary: ["brand"] },
      });

      assert(result.includes('<meta property="product:price"'));
      assert(result.includes('<meta property="instagram:story:type"'));
      assert(result.includes('<meta property="instagram:reel:hashtag"'));
      assert(result.includes('<meta property="instagram:hashtag"'));
    });

    it("should handle all tiers combined", () => {
      const result = instagram({
        domain: "example.com",
        title: "Ultimate Instagram Post",
        description: "Complete Instagram optimization",
        image: {
          url: "/hero.jpg",
          alt: "Hero image",
          aspectRatio: "landscape",
        },
        multipleImages: ["/img1.jpg"],
        contentType: "product",
        business: {
          type: "product",
          price: "$299.99",
          brand: "Premium Brand",
        },
        shoppable: {
          products: [{ name: "Premium Item", url: "/item" }],
          checkoutUrl: "/cart",
        },
        stories: {
          type: "product",
          cta: "Shop Now",
          url: "/product-page",
        },
        reels: {
          duration: 30,
          hashtags: ["premium", "luxury"],
        },
        location: {
          name: "Premium Store",
          latitude: 40.7128,
          longitude: -74.006,
        },
        hashtags: {
          primary: ["premiumbrand"],
          trending: ["luxury"],
        },
        engagement: {
          mentions: ["@premiumbrand"],
          brandedContent: true,
        },
      });

      // Tier 1 - Basic
      assert(result.includes('<meta property="og:title"'));
      assert(result.includes('<meta property="og:description"'));

      // Tier 2 - Visual
      assert(result.includes('<meta property="og:image"'));
      assert(result.includes('<meta property="og:image:width"'));
      assert(result.includes('<meta property="og:image:height"'));

      // Tier 3 - Commerce
      assert(result.includes('<meta property="product:price"'));
      assert(result.includes('<meta property="commerce:checkout_url"'));

      // Tier 4 - Advanced
      assert(result.includes('<meta property="instagram:story:type"'));
      assert(result.includes('<meta property="instagram:reel:hashtag"'));
      assert(result.includes('<meta property="instagram:location:name"'));
      assert(result.includes('<meta property="instagram:hashtag"'));
      assert(result.includes('<meta property="instagram:branded_content"'));
    });
  });

  describe("Edge Cases", () => {
    it("should handle complex query parameters in URLs", () => {
      const result = instagram({
        domain: "example.com",
        url: "/product?id=123&utm_source=instagram&ref=homepage",
        title: "Product",
        description: "Description",
      });

      assert(result.includes('content="https://example.com/product?id=123&amp;utm_source=instagram&amp;ref=homepage"'));
    });

    it("should handle URL-encoded characters in content", () => {
      const result = instagram({
        title: "Café & Restaurant 📸",
        description: "Délicieux plats français",
      });

      assert(result.includes('content="Café &amp; Restaurant 📸"'));
      assert(result.includes('content="Délicieux plats français"'));
    });

    it("should handle port numbers in domain", () => {
      const result = instagram({
        domain: "localhost:3000",
        title: "Dev Post",
        description: "Development content",
      });

      assert(result.includes('content="https://localhost:3000"'));
    });

    it("should handle subdomain domains", () => {
      const result = instagram({
        domain: "blog.example.com",
        title: "Blog Post",
        description: "Blog content",
      });

      assert(result.includes('content="https://blog.example.com"'));
    });

    it("should handle very long content", () => {
      const longTitle = "A".repeat(300);
      const longDescription = "B".repeat(600);
      const result = instagram({
        title: longTitle,
        description: longDescription,
      });

      assert(result.includes(longTitle));
      assert(result.includes(longDescription));
    });

    it("should handle mixed absolute and relative URLs", () => {
      const result = instagram({
        domain: "example.com",
        title: "Mixed URLs",
        description: "Description",
        image: "https://cdn.example.com/image.jpg",
        shoppable: {
          products: [{ name: "Product", url: "/product" }],
          checkoutUrl: "https://shop.example.com/checkout",
        },
      });

      assert(result.includes('content="https://cdn.example.com/image.jpg"'));
      assert(result.includes('content="https://example.com/product"'));
      assert(result.includes('content="https://shop.example.com/checkout"'));
    });

    it("should handle empty arrays gracefully", () => {
      const result = instagram({
        title: "Empty Arrays",
        description: "Test empty arrays",
        multipleImages: [],
        hashtags: {},
        engagement: { mentions: [] },
      });

      assert(result.includes('<meta property="og:title"'));
      assert(!result.includes('property="og:image"')); // Only main image
      assert(!result.includes('property="instagram:hashtag"'));
    });

    it("should handle null/undefined values in objects", () => {
      const result = instagram({
        title: "Null Values",
        description: "Test null handling",
        image: { url: "/test.jpg", alt: null, width: undefined },
        business: { type: null, price: undefined },
        reels: { hashtags: null, duration: undefined },
      });

      assert(result.includes('<meta property="og:image"'));
      assert(!result.includes('property="og:image:alt"'));
      assert(!result.includes('property="og:image:width"'));
      assert(!result.includes('property="product:price"'));
      assert(!result.includes('property="instagram:reel:hashtag"'));
    });

    it("should handle extreme edge cases", () => {
      const result = instagram({
        title: "Extreme",
        description: "Test extreme values",
        image: { url: "/test.jpg", width: Number.MAX_SAFE_INTEGER, height: Number.MIN_SAFE_INTEGER },
        reels: { duration: -1 },
        live: { startTime: "invalid-date" },
      });

      assert(result.includes('<meta property="og:image:width"'));
      assert(result.includes('<meta property="og:image:height"'));
      assert(result.includes('<meta property="instagram:reel:duration"'));
      assert(result.includes('<meta property="instagram:live:start_time"'));
    });

    it("should handle malformed objects gracefully", () => {
      const result = instagram({
        title: "Malformed",
        description: "Test malformed objects",
        business: null,
        shoppable: undefined,
        stories: "not-an-object",
      });

      assert(result.includes('<meta property="og:title"'));
      assert(!result.includes('property="product:'));
      assert(!result.includes('property="commerce:'));
    });

    it("should handle conflicting configurations", () => {
      const result = instagram({
        title: "Conflict",
        description: "Test conflicts",
        contentType: "article",
        business: { type: "product" }, // Override content type
      });

      // Business type should override content type defaults
      assert(result.includes('<meta property="og:type" content="product"'));
    });

    it("should handle boolean string values", () => {
      const result = instagram({
        title: "Boolean Strings",
        description: "Test boolean strings",
        image: { url: "/test.jpg", alt: "test" }, // truthy string
        business: { price: "" }, // falsy empty string
      });

      assert(result.includes('<meta property="og:image:alt"'));
      assert(!result.includes('property="product:price"'));
    });

    it("should handle numeric zero as valid value", () => {
      const result = instagram({
        title: "Zero Values",
        description: "Test zero handling",
        image: { url: "/test.jpg", width: 0, height: 0 },
        reels: { duration: 0 },
      });

      assert(result.includes('<meta property="og:image:width" content="0"'));
      assert(result.includes('<meta property="og:image:height" content="0"'));
      assert(result.includes('<meta property="instagram:reel:duration" content="0"'));
    });
  });

  describe("Schema and Output Validation", () => {
    it("should generate valid HTML markup structure", () => {
      const result = instagram({
        title: "Test",
        description: "Test description",
      });

      assert(result.trim().startsWith("<meta"));
      const metaTagCount = (result.match(/<meta/g) || []).length;
      const closingTagCount = (result.match(/\/>/g) || []).length;
      assert.strictEqual(metaTagCount, closingTagCount);
    });

    it("should generate properly formatted Open Graph tags", () => {
      const result = instagram({
        title: "Test Title",
        description: "Test Description",
      });

      assert(result.includes('property="og:title"'));
      assert(result.includes('property="og:description"'));
      assert(result.includes('property="og:type"'));
      assert(result.includes('property="og:site_name"'));
    });

    it("should validate Instagram-specific property formatting", () => {
      const result = instagram({
        title: "Instagram Test",
        description: "Test",
        stories: { type: "event" },
        reels: { duration: 30 },
        location: { name: "Test Location" },
      });

      assert(result.includes('property="instagram:story:type"'));
      assert(result.includes('property="instagram:reel:duration"'));
      assert(result.includes('property="instagram:location:name"'));
    });

    it("should ensure all generated URLs are HTTPS", () => {
      const result = instagram({
        title: "Test",
        description: "Test",
        domain: "example.com",
        url: "/test",
        image: "http://example.com/image.jpg",
        shoppable: {
          products: [{ name: "Product", url: "http://example.com/product" }],
          checkoutUrl: "http://example.com/checkout",
        },
      });

      assert(!result.includes("http://"));
      assert(result.includes("https://"));
    });

    it("should handle malformed URLs gracefully", () => {
      const result = instagram({
        domain: "example.com",
        title: "Malformed URLs",
        description: "Test",
        image: "not-a-url",
        shoppable: {
          products: [{ name: "Product", url: "invalid-url" }],
        },
      });

      assert(result.includes('content="https://example.com/not-a-url"'));
      assert(result.includes('content="https://example.com/invalid-url"'));
    });

    it("should properly escape HTML in content", () => {
      const result = instagram({
        title: 'Test "Quote" & <Tag>',
        description: "Test description",
        business: { brand: 'Brand "Name" & Co' },
      });

      assert(!result.includes('Test "Quote" & <Tag>'));
      assert(result.includes("Test &quot;Quote&quot; &amp; &lt;Tag&gt;"));
      assert(result.includes("Brand &quot;Name&quot; &amp; Co"));
    });

    it("should validate progressive enhancement", () => {
      // Basic configuration
      const basicResult = instagram({
        title: "Basic",
        description: "Basic post",
      });

      // Enhanced configuration
      const enhancedResult = instagram({
        title: "Enhanced",
        description: "Enhanced post",
        image: { url: "/image.jpg", aspectRatio: "square" },
        business: { type: "product" },
        stories: { type: "product" },
        hashtags: { primary: ["test"] },
      });

      // Enhanced should have more meta tags
      const basicTagCount = (basicResult.match(/<meta/g) || []).length;
      const enhancedTagCount = (enhancedResult.match(/<meta/g) || []).length;

      assert(enhancedTagCount > basicTagCount, "Enhanced configuration should generate more meta tags");
    });

    it("should validate content-type specific optimizations", () => {
      const articleResult = instagram({
        title: "Article",
        description: "Article content",
        contentType: "article",
      });

      const productResult = instagram({
        title: "Product",
        description: "Product content",
        contentType: "product",
      });

      const eventResult = instagram({
        title: "Event",
        description: "Event content",
        contentType: "event",
      });

      // Article should have article type
      assert(articleResult.includes('content="article"'));

      // Product should have product type
      assert(productResult.includes('content="product"'));

      // Event should have event type
      assert(eventResult.includes('content="event"'));
    });

    it("should validate Instagram ecosystem integration", () => {
      const result = instagram({
        title: "Full Ecosystem",
        description: "Complete Instagram integration",
        stories: { type: "event" },
        reels: { duration: 30 },
        igtv: { title: "Video" },
        live: { title: "Live" },
        location: { name: "Location" },
        hashtags: { primary: ["test"] },
        engagement: { mentions: ["@user"] },
      });

      // Should include all Instagram-specific features
      assert(result.includes('property="instagram:story:type"'));
      assert(result.includes('property="instagram:reel:duration"'));
      assert(result.includes('property="instagram:igtv:title"'));
      assert(result.includes('property="instagram:live:title"'));
      assert(result.includes('property="instagram:location:name"'));
      assert(result.includes('property="instagram:hashtag"'));
      assert(result.includes('property="instagram:mention"'));
    });

    it("should validate commerce integration completeness", () => {
      const result = instagram({
        title: "Commerce Test",
        description: "Test commerce features",
        business: {
          type: "product",
          price: "$99.99",
          availability: "in_stock",
          brand: "Test Brand",
        },
        shoppable: {
          products: [{ name: "Test Product", url: "/product" }],
          checkoutUrl: "/checkout",
        },
        contact: {
          email: "contact@example.com",
          phone: "+1-555-0123",
        },
      });

      // Should include complete commerce metadata
      assert(result.includes('property="product:price"'));
      assert(result.includes('property="product:availability"'));
      assert(result.includes('property="product:brand"'));
      assert(result.includes('property="commerce:checkout_url"'));
      assert(result.includes('property="business:contact_data:email"'));
      assert(result.includes('property="business:contact_data:phone_number"'));
    });
  });
});
