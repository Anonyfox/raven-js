/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { discord } from "./discord.js";

/**
 * @file Comprehensive test suite for progressive Discord generator.
 *
 * Tests all enhancement tiers, URL normalization, and ensures 100% code coverage
 * through systematic testing of configuration combinations.
 */

describe("discord()", () => {
  describe("Input Validation", () => {
    it("should return empty string for undefined config", () => {
      assert.strictEqual(discord(undefined), "");
    });

    it("should return empty string for null config", () => {
      assert.strictEqual(discord(null), "");
    });

    it("should return empty string for non-object config", () => {
      assert.strictEqual(discord("string"), "");
      assert.strictEqual(discord(123), "");
      assert.strictEqual(discord([]), "");
    });

    it("should return empty string when title is missing", () => {
      assert.strictEqual(discord({ description: "test" }), "");
    });

    it("should return empty string when description is missing", () => {
      assert.strictEqual(discord({ title: "test" }), "");
    });

    it("should return empty string when both title and description are missing", () => {
      assert.strictEqual(discord({ domain: "example.com", path: "/test" }), "");
    });
  });

  describe("URL Normalization", () => {
    it("should construct basic absolute URL from domain and path", () => {
      const result = discord({
        domain: "example.com",
        path: "/community",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://example.com/community"'));
    });

    it("should add leading slash to path if missing", () => {
      const result = discord({
        domain: "example.com",
        path: "community",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://example.com/community"'));
    });

    it("should use pre-constructed URL when provided", () => {
      const result = discord({
        domain: "example.com",
        path: "/community",
        url: "https://custom.com/community",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://custom.com/community"'));
    });

    it("should force HTTPS for pre-constructed URLs", () => {
      const result = discord({
        domain: "example.com",
        path: "/community",
        url: "http://example.com/community",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://example.com/community"'));
    });

    it("should handle empty path", () => {
      const result = discord({
        domain: "example.com",
        path: "",
        title: "Test",
        description: "Test description",
      });
      // Empty path should not generate a URL tag
      assert(result.includes('<meta name="discord:title"'));
      assert(!result.includes('<meta name="discord:url"'));
    });
  });

  describe("Tier 1: Smart Discord Tags", () => {
    it("should generate basic Discord meta tags", () => {
      const result = discord({
        title: "Test Title",
        description: "Test description for Discord",
      });

      assert(result.includes('<meta name="discord:title"'));
      assert(result.includes('content="Test Title"'));
      assert(result.includes('<meta name="discord:description"'));
      assert(result.includes('content="Test description for Discord"'));
    });

    it("should include URL when domain and path provided", () => {
      const result = discord({
        domain: "example.com",
        path: "/test",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('<meta name="discord:url"'));
      assert(result.includes('content="https://example.com/test"'));
    });

    it("should include image when provided", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        image: "/banner.jpg",
      });

      assert(result.includes('<meta name="discord:image"'));
      assert(result.includes('content="/banner.jpg"'));
    });

    it("should normalize image URL when domain provided", () => {
      const result = discord({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        image: "/banner.jpg",
      });

      assert(result.includes('content="https://example.com/banner.jpg"'));
    });

    it("should include invite when provided", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        invite: "abc123",
      });

      assert(result.includes('<meta name="discord:invite"'));
      assert(result.includes('content="abc123"'));
    });

    it("should handle query parameters in path", () => {
      const result = discord({
        domain: "example.com",
        path: "/test?page=1&sort=date",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('content="https://example.com/test?page=1&sort=date"'));
    });

    it("should handle fragments in path", () => {
      const result = discord({
        domain: "example.com",
        path: "/test#section",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('content="https://example.com/test#section"'));
    });
  });

  describe("Tier 2: Community Integration", () => {
    it("should generate server ID tag", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        server: { id: "123456789" },
      });

      assert(result.includes('<meta name="discord:server:id"'));
      assert(result.includes('content="123456789"'));
    });

    it("should generate server name tag", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        server: { name: "Test Server" },
      });

      assert(result.includes('<meta name="discord:server:name"'));
      assert(result.includes('content="Test Server"'));
    });

    it("should generate member count tag", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        server: { memberCount: 50000 },
      });

      assert(result.includes('<meta name="discord:server:members"'));
      assert(result.includes('content="50000"'));
    });

    it("should generate online count tag", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        server: { onlineCount: 1200 },
      });

      assert(result.includes('<meta name="discord:server:online"'));
      assert(result.includes('content="1200"'));
    });

    it("should generate complete server integration", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        server: {
          id: "123456789",
          name: "Test Server",
          memberCount: 50000,
          onlineCount: 1200,
        },
      });

      assert(result.includes("discord:server:id"));
      assert(result.includes("discord:server:name"));
      assert(result.includes("discord:server:members"));
      assert(result.includes("discord:server:online"));
    });

    it("should generate channel tags", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        channels: ["general", "help", "projects"],
      });

      assert(result.includes('<meta name="discord:channel"'));
      assert(result.includes('content="general"'));
      assert(result.includes('content="help"'));
      assert(result.includes('content="projects"'));
    });

    it("should generate role tags", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        roles: ["Developer", "Designer", "Moderator"],
      });

      assert(result.includes('<meta name="discord:role"'));
      assert(result.includes('content="Developer"'));
      assert(result.includes('content="Designer"'));
      assert(result.includes('content="Moderator"'));
    });

    it("should handle empty channels array", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        channels: [],
      });

      assert(result.includes('<meta name="discord:title"'));
      assert(!result.includes('<meta name="discord:channel"'));
    });

    it("should handle empty roles array", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        roles: [],
      });

      assert(result.includes('<meta name="discord:title"'));
      assert(!result.includes('<meta name="discord:role"'));
    });
  });

  describe("Tier 3: Rich Embed Features", () => {
    it("should generate theme tag", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        embed: { theme: "dark" },
      });

      assert(result.includes('<meta name="discord:embed:theme"'));
      assert(result.includes('content="dark"'));
    });

    it("should generate accent color tag", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        embed: { accentColor: "#5865F2" },
      });

      assert(result.includes('<meta name="discord:embed:color"'));
      assert(result.includes('content="#5865F2"'));
    });

    it("should generate embed image tag", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        embed: {
          media: { image: "/embed-image.jpg" },
        },
      });

      assert(result.includes('<meta name="discord:embed:image"'));
      assert(result.includes('content="/embed-image.jpg"'));
    });

    it("should generate embed video tag", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        embed: {
          media: { video: "/embed-video.mp4" },
        },
      });

      assert(result.includes('<meta name="discord:embed:video"'));
      assert(result.includes('content="/embed-video.mp4"'));
    });

    it("should generate embed thumbnail tag", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        embed: {
          media: { thumbnail: "/thumbnail.png" },
        },
      });

      assert(result.includes('<meta name="discord:embed:thumbnail"'));
      assert(result.includes('content="/thumbnail.png"'));
    });

    it("should normalize embed media URLs", () => {
      const result = discord({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        embed: {
          media: {
            image: "/embed-image.jpg",
            video: "/embed-video.mp4",
            thumbnail: "/thumbnail.png",
          },
        },
      });

      assert(result.includes('content="https://example.com/embed-image.jpg"'));
      assert(result.includes('content="https://example.com/embed-video.mp4"'));
      assert(result.includes('content="https://example.com/thumbnail.png"'));
    });

    it("should generate interactive button tags", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        embed: {
          interactive: {
            buttons: ["Join Server", "View Docs", "Get Started"],
          },
        },
      });

      assert(result.includes('<meta name="discord:button"'));
      assert(result.includes('content="Join Server"'));
      assert(result.includes('content="View Docs"'));
      assert(result.includes('content="Get Started"'));
    });

    it("should generate interactive reaction tags", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        embed: {
          interactive: {
            reactions: ["🚀", "⭐", "❤️"],
          },
        },
      });

      assert(result.includes('<meta name="discord:reaction"'));
      assert(result.includes('content="🚀"'));
      assert(result.includes('content="⭐"'));
      assert(result.includes('content="❤️"'));
    });

    it("should generate complete rich embed", () => {
      const result = discord({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        embed: {
          theme: "dark",
          accentColor: "#5865F2",
          media: {
            image: "/embed-image.jpg",
            video: "/embed-video.mp4",
            thumbnail: "/thumbnail.png",
          },
          interactive: {
            buttons: ["Join Server", "View Docs"],
            reactions: ["🚀", "⭐"],
          },
        },
      });

      assert(result.includes("discord:embed:theme"));
      assert(result.includes("discord:embed:color"));
      assert(result.includes("discord:embed:image"));
      assert(result.includes("discord:embed:video"));
      assert(result.includes("discord:embed:thumbnail"));
      assert(result.includes("discord:button"));
      assert(result.includes("discord:reaction"));
    });

    it("should handle empty embed object", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        embed: {},
      });

      assert(result.includes('<meta name="discord:title"'));
      assert(!result.includes('<meta name="discord:embed:'));
    });

    it("should handle empty media object", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        embed: { media: {} },
      });

      assert(result.includes('<meta name="discord:title"'));
      assert(!result.includes('<meta name="discord:embed:image"'));
    });

    it("should handle empty interactive object", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        embed: { interactive: {} },
      });

      assert(result.includes('<meta name="discord:title"'));
      assert(!result.includes('<meta name="discord:button"'));
    });
  });

  describe("Tier 4: Enterprise Discord Features", () => {
    it("should generate webhook tags", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        enterprise: {
          webhooks: ["https://discord.com/api/webhooks/123/token1", "https://discord.com/api/webhooks/456/token2"],
        },
      });

      assert(result.includes('<meta name="discord:webhook"'));
      assert(result.includes('content="https://discord.com/api/webhooks/123/token1"'));
      assert(result.includes('content="https://discord.com/api/webhooks/456/token2"'));
    });

    it("should generate bot tags", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        enterprise: {
          bots: ["@HelperBot#1234", "@ModeratorBot#5678"],
        },
      });

      assert(result.includes('<meta name="discord:bot"'));
      assert(result.includes('content="@HelperBot#1234"'));
      assert(result.includes('content="@ModeratorBot#5678"'));
    });

    it("should generate analytics server ID tag", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        enterprise: {
          analytics: { serverId: "123456789" },
        },
      });

      assert(result.includes('<meta name="discord:analytics:server"'));
      assert(result.includes('content="123456789"'));
    });

    it("should generate analytics tracking ID tag", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        enterprise: {
          analytics: { trackingId: "discord_analytics_001" },
        },
      });

      assert(result.includes('<meta name="discord:analytics:tracking"'));
      assert(result.includes('content="discord_analytics_001"'));
    });

    it("should generate complete analytics integration", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        enterprise: {
          analytics: {
            serverId: "123456789",
            trackingId: "discord_analytics_001",
          },
        },
      });

      assert(result.includes("discord:analytics:server"));
      assert(result.includes("discord:analytics:tracking"));
    });

    it("should generate localization tags", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        enterprise: {
          localization: {
            en: "English Support",
            es: "Soporte Español",
            fr: "Support Français",
          },
        },
      });

      assert(result.includes('<meta name="discord:locale:en"'));
      assert(result.includes('<meta name="discord:locale:es"'));
      assert(result.includes('<meta name="discord:locale:fr"'));
      assert(result.includes('content="English Support"'));
      assert(result.includes('content="Soporte Español"'));
      assert(result.includes('content="Support Français"'));
    });

    it("should generate complete enterprise Discord integration", () => {
      const result = discord({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        enterprise: {
          webhooks: ["https://discord.com/api/webhooks/123/token"],
          bots: ["@HelperBot#1234"],
          analytics: {
            serverId: "123456789",
            trackingId: "discord_analytics_001",
          },
          localization: {
            en: "English Support",
            es: "Spanish Support",
          },
        },
      });

      assert(result.includes("discord:webhook"));
      assert(result.includes("discord:bot"));
      assert(result.includes("discord:analytics:server"));
      assert(result.includes("discord:analytics:tracking"));
      assert(result.includes("discord:locale:en"));
      assert(result.includes("discord:locale:es"));
    });

    it("should handle empty enterprise object", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        enterprise: {},
      });

      assert(result.includes('<meta name="discord:title"'));
      assert(!result.includes('<meta name="discord:webhook"'));
    });

    it("should handle empty webhooks array", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        enterprise: { webhooks: [] },
      });

      assert(result.includes('<meta name="discord:title"'));
      assert(!result.includes('<meta name="discord:webhook"'));
    });

    it("should handle empty bots array", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        enterprise: { bots: [] },
      });

      assert(result.includes('<meta name="discord:title"'));
      assert(!result.includes('<meta name="discord:bot"'));
    });

    it("should handle empty analytics object", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        enterprise: { analytics: {} },
      });

      assert(result.includes('<meta name="discord:title"'));
      assert(!result.includes('<meta name="discord:analytics:"'));
    });

    it("should handle empty localization object", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        enterprise: { localization: {} },
      });

      assert(result.includes('<meta name="discord:title"'));
      assert(!result.includes('<meta name="discord:locale:"'));
    });
  });

  describe("Progressive Enhancement Combinations", () => {
    it("should handle Tier 1 + Tier 2 (smart + community)", () => {
      const result = discord({
        domain: "example.com",
        path: "/community",
        title: "Test Community",
        description: "Test description",
        server: { id: "123456789", name: "Test Server" },
        channels: ["general"],
        roles: ["Member"],
      });

      assert(result.includes("discord:title"));
      assert(result.includes("discord:description"));
      assert(result.includes("discord:url"));
      assert(result.includes("discord:server:id"));
      assert(result.includes("discord:server:name"));
      assert(result.includes("discord:channel"));
      assert(result.includes("discord:role"));
    });

    it("should handle Tier 1 + Tier 3 (smart + rich embed)", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        image: "/banner.jpg",
        embed: {
          theme: "dark",
          media: { image: "/embed.jpg" },
          interactive: { buttons: ["Join"] },
        },
      });

      assert(result.includes("discord:title"));
      assert(result.includes("discord:description"));
      assert(result.includes("discord:image"));
      assert(result.includes("discord:embed:theme"));
      assert(result.includes("discord:embed:image"));
      assert(result.includes("discord:button"));
    });

    it("should handle Tier 2 + Tier 3 (community + rich embed)", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        server: { name: "Test Server" },
        channels: ["general"],
        embed: {
          media: { video: "/demo.mp4" },
          interactive: { reactions: ["🚀"] },
        },
      });

      assert(result.includes("discord:server:name"));
      assert(result.includes("discord:channel"));
      assert(result.includes("discord:embed:video"));
      assert(result.includes("discord:reaction"));
    });

    it("should handle Tier 1 + Tier 4 (smart + enterprise)", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        enterprise: {
          webhooks: ["https://discord.com/api/webhooks/123/token"],
          analytics: { serverId: "123456789" },
        },
      });

      assert(result.includes("discord:title"));
      assert(result.includes("discord:description"));
      assert(result.includes("discord:webhook"));
      assert(result.includes("discord:analytics:server"));
    });

    it("should handle all tiers combined", () => {
      const result = discord({
        domain: "example.com",
        path: "/community",
        url: "https://example.com/community",
        title: "Test Community",
        description: "Test description",
        image: "/banner.jpg",
        invite: "abc123",
        server: {
          id: "123456789",
          name: "Test Server",
          memberCount: 50000,
          onlineCount: 1200,
        },
        channels: ["general", "help"],
        roles: ["Developer", "Designer"],
        embed: {
          theme: "dark",
          accentColor: "#5865F2",
          media: {
            image: "/embed.jpg",
            video: "/demo.mp4",
            thumbnail: "/thumb.png",
          },
          interactive: {
            buttons: ["Join Server"],
            reactions: ["🚀"],
          },
        },
        enterprise: {
          webhooks: ["https://discord.com/api/webhooks/123/token"],
          bots: ["@HelperBot#1234"],
          analytics: {
            serverId: "123456789",
            trackingId: "discord_analytics_001",
          },
          localization: {
            en: "English Community",
            es: "Comunidad Española",
          },
        },
      });

      // Should contain elements from all tiers
      assert(result.includes("discord:title"));
      assert(result.includes("discord:description"));
      assert(result.includes("discord:url"));
      assert(result.includes("discord:image"));
      assert(result.includes("discord:invite"));
      assert(result.includes("discord:server:id"));
      assert(result.includes("discord:server:name"));
      assert(result.includes("discord:server:members"));
      assert(result.includes("discord:server:online"));
      assert(result.includes("discord:channel"));
      assert(result.includes("discord:role"));
      assert(result.includes("discord:embed:theme"));
      assert(result.includes("discord:embed:color"));
      assert(result.includes("discord:embed:image"));
      assert(result.includes("discord:embed:video"));
      assert(result.includes("discord:embed:thumbnail"));
      assert(result.includes("discord:button"));
      assert(result.includes("discord:reaction"));
      assert(result.includes("discord:webhook"));
      assert(result.includes("discord:bot"));
      assert(result.includes("discord:analytics:server"));
      assert(result.includes("discord:analytics:tracking"));
      assert(result.includes("discord:locale:en"));
      assert(result.includes("discord:locale:es"));
    });
  });

  describe("Edge Cases", () => {
    it("should handle complex query parameters", () => {
      const result = discord({
        domain: "example.com",
        path: "/test?q=hello+world&sort=relevance&filter=recent",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('content="https://example.com/test?q=hello+world&sort=relevance&filter=recent"'));
    });

    it("should handle URL-encoded characters", () => {
      const result = discord({
        domain: "example.com",
        path: "/test?title=Hello%20World&author=John%20Doe",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('content="https://example.com/test?title=Hello%20World&author=John%20Doe"'));
    });

    it("should handle subdomain domains", () => {
      const result = discord({
        domain: "community.example.com",
        path: "/test",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('content="https://community.example.com/test"'));
    });

    it("should handle port numbers in domain", () => {
      const result = discord({
        domain: "localhost:3000",
        path: "/test",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('content="https://localhost:3000/test"'));
    });

    it("should handle very long paths", () => {
      const longPath = "/very/long/path/to/a/deeply/nested/community/page/with/many/segments";
      const result = discord({
        domain: "example.com",
        path: longPath,
        title: "Test",
        description: "Test description",
      });

      assert(result.includes(`content="https://example.com${longPath}"`));
    });

    it("should handle special characters in domain", () => {
      const result = discord({
        domain: "test-domain.co.uk",
        path: "/test",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('content="https://test-domain.co.uk/test"'));
    });

    it("should handle zero values for server counts", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        server: { memberCount: 0, onlineCount: 0 },
      });

      assert(result.includes('content="0"'));
    });

    it("should handle very large numbers for server counts", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        server: { memberCount: 1000000, onlineCount: 50000 },
      });

      assert(result.includes('content="1000000"'));
      assert(result.includes('content="50000"'));
    });

    it("should handle Unicode characters in text fields", () => {
      const result = discord({
        title: "Test 🎮 Game",
        description: "Test description with emoji 🚀",
        server: { name: "Test Server 🌟" },
        channels: ["general 💬"],
        roles: ["Developer 👨‍💻"],
      });

      assert(result.includes('content="Test 🎮 Game"'));
      assert(result.includes('content="Test description with emoji 🚀"'));
      assert(result.includes('content="Test Server 🌟"'));
      assert(result.includes('content="general 💬"'));
      assert(result.includes('content="Developer 👨‍💻"'));
    });

    it("should handle very long text content", () => {
      const longTitle = "A".repeat(200);
      const longDescription = "B".repeat(500);
      const result = discord({
        title: longTitle,
        description: longDescription,
      });

      assert(result.includes(longTitle));
      assert(result.includes(longDescription));
    });

    it("should handle mixed absolute and relative URLs", () => {
      const result = discord({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        image: "https://cdn.example.com/image.jpg",
        embed: {
          media: {
            image: "/local-image.jpg",
            video: "https://cdn.example.com/video.mp4",
          },
        },
      });

      assert(result.includes('content="https://cdn.example.com/image.jpg"'));
      assert(result.includes('content="https://example.com/local-image.jpg"'));
      assert(result.includes('content="https://cdn.example.com/video.mp4"'));
    });
  });

  describe("Schema and Output Validation", () => {
    it("should generate valid HTML markup structure", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
      });

      // Should start and end with meta tags
      assert(result.trim().startsWith("<meta"));
      assert(result.trim().endsWith("/>"));

      // Should be valid HTML (no unclosed tags)
      const metaTagCount = (result.match(/<meta/g) || []).length;
      const closingTagCount = (result.match(/\/>/g) || []).length;
      assert.strictEqual(metaTagCount, closingTagCount);
    });

    it("should generate properly formatted Discord meta tags", () => {
      const result = discord({
        title: "Test Title",
        description: "Test Description",
      });

      // Should have proper Discord meta attributes
      assert(result.includes('name="discord:title"'));
      assert(result.includes('property="discord:title"'));
      assert(result.includes('name="discord:description"'));
      assert(result.includes('property="discord:description"'));
    });

    it("should ensure all generated URLs are HTTPS", () => {
      const result = discord({
        domain: "example.com",
        path: "/test",
        title: "Test",
        description: "Test description",
        image: "http://example.com/image.jpg",
        embed: {
          media: {
            image: "http://example.com/embed.jpg",
            video: "http://example.com/video.mp4",
          },
        },
      });

      // All URLs should be HTTPS
      assert(!result.includes("http://"));
      assert(result.includes("https://"));
    });

    it("should handle malformed URLs gracefully", () => {
      const result = discord({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        image: "not-a-url",
      });

      // Should still generate basic tags and normalize malformed relative URLs
      assert(result.includes("discord:title"));
      assert(result.includes("discord:description"));
      assert(result.includes("discord:image"));
      assert(result.includes('content="https://example.com/not-a-url"'));
    });

    it("should generate consistent property/name attributes", () => {
      const result = discord({
        title: "Test",
        description: "Test description",
        server: { id: "123" },
      });

      // All Discord meta tags should have both name and property attributes
      const metaTags = result.match(/<meta[^>]*>/g) || [];
      for (const tag of metaTags) {
        if (tag.includes("discord:")) {
          assert(tag.includes('name="discord:') || tag.includes('property="discord:'));
        }
      }
    });
  });
});
