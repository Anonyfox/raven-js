/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { youtube } from "./youtube.js";

/**
 * @file Comprehensive test suite for progressive YouTube SEO optimization.
 *
 * Tests all enhancement tiers, video metadata, live streaming, and ensures 100% code coverage
 * through systematic testing of configuration combinations and YouTube-specific features.
 */

describe("youtube()", () => {
  describe("Input Validation and Defaults", () => {
    it("should return empty string for undefined config", () => {
      assert.strictEqual(youtube(undefined), "");
    });

    it("should return empty string for null config", () => {
      assert.strictEqual(youtube(null), "");
    });

    it("should return empty string for non-object config", () => {
      assert.strictEqual(youtube("string"), "");
      assert.strictEqual(youtube(123), "");
      assert.strictEqual(youtube([]), "");
    });

    it("should return empty string when title is missing", () => {
      assert.strictEqual(youtube({ description: "test" }), "");
    });

    it("should return empty string when description is missing", () => {
      assert.strictEqual(youtube({ title: "test" }), "");
    });

    it("should return empty string when both title and description are missing", () => {
      assert.strictEqual(youtube({ domain: "youtube.com" }), "");
    });
  });

  describe("Tier 1: Basic Video Integration", () => {
    it("should generate basic Open Graph video tags", () => {
      const result = youtube({
        title: "Amazing Tutorial",
        description: "Learn something incredible",
      });

      assert(result.includes('<meta property="og:title"'));
      assert(result.includes('<meta property="og:description"'));
      assert(result.includes('<meta property="og:type" content="video.other"'));
      assert(result.includes('<meta property="og:site_name" content="YouTube"'));
    });

    it("should include URL when domain provided", () => {
      const result = youtube({
        domain: "youtube.com",
        title: "Content",
        description: "Description",
      });

      assert(result.includes('<meta property="og:url"'));
      assert(result.includes('content="https://youtube.com"'));
    });

    it("should handle basic video information", () => {
      const result = youtube({
        title: "Video Content",
        description: "Video description",
        video: {
          url: "/tutorial.mp4",
          thumbnail: "/thumbnail.jpg",
        },
      });

      assert(result.includes('<meta property="og:video"'));
      assert(result.includes('content="/tutorial.mp4"'));
      assert(result.includes('<meta property="og:image"'));
      assert(result.includes('content="/thumbnail.jpg"'));
      assert(result.includes('<meta property="og:video:type"'));
    });

    it("should normalize video URLs when domain provided", () => {
      const result = youtube({
        domain: "example.com",
        title: "Video",
        description: "Description",
        video: {
          url: "/tutorial.mp4",
          thumbnail: "/thumbnail.jpg",
        },
      });

      assert(result.includes('content="https://example.com/tutorial.mp4"'));
      assert(result.includes('content="https://example.com/thumbnail.jpg"'));
    });

    it("should handle video dimensions and duration", () => {
      const result = youtube({
        title: "Video Specs",
        description: "Technical specs",
        video: {
          url: "/video.mp4",
          width: 1920,
          height: 1080,
          duration: 1800,
        },
      });

      assert(result.includes('<meta property="og:video:width" content="1920"'));
      assert(result.includes('<meta property="og:video:height" content="1080"'));
      assert(result.includes('<meta property="og:video:duration" content="1800"'));
    });

    it("should handle live video tagging", () => {
      const result = youtube({
        title: "Live Stream",
        description: "Live content",
        video: {
          url: "/live.mp4",
          isLive: true,
        },
      });

      assert(result.includes('<meta property="og:video:tag" content="live"'));
    });
  });

  describe("Tier 2: Enhanced Video Content", () => {
    it("should generate content details metadata", () => {
      const result = youtube({
        title: "Enhanced Video",
        description: "Enhanced content",
        contentDetails: {
          definition: "HD",
          caption: true,
          licensedContent: false,
          projection: "rectangular",
          dimension: "2d",
        },
      });

      assert(result.includes('<meta property="video:definition" content="HD"'));
      assert(result.includes('<meta property="video:caption" content="true"'));
      assert(result.includes('<meta property="video:licensed_content" content="false"'));
      assert(result.includes('<meta property="video:projection" content="rectangular"'));
      assert(result.includes('<meta property="video:dimension" content="2d"'));
    });

    it("should handle boolean content details correctly", () => {
      const result = youtube({
        title: "Boolean Test",
        description: "Boolean values",
        contentDetails: {
          caption: false,
          licensedContent: true,
        },
      });

      assert(result.includes('<meta property="video:caption" content="false"'));
      assert(result.includes('<meta property="video:licensed_content" content="true"'));
    });

    it("should generate statistics metadata", () => {
      const result = youtube({
        title: "Popular Video",
        description: "Highly viewed content",
        statistics: {
          viewCount: 150000,
          likeCount: 8500,
          dislikeCount: 234,
          commentCount: 1200,
          subscriberCount: 50000,
        },
      });

      assert(result.includes('<meta property="video:view_count" content="150000"'));
      assert(result.includes('<meta property="video:like_count" content="8500"'));
      assert(result.includes('<meta property="video:comment_count" content="1200"'));
      assert(result.includes('<meta property="channel:subscriber_count" content="50000"'));
    });

    it("should generate playlist metadata", () => {
      const result = youtube({
        title: "Playlist Video",
        description: "Part of a series",
        playlist: {
          title: "Tutorial Series",
          description: "Complete tutorial series",
          position: 3,
          totalVideos: 10,
        },
      });

      assert(result.includes('<meta property="playlist:title"'));
      assert(result.includes('<meta property="playlist:description"'));
      assert(result.includes('<meta property="playlist:position" content="3"'));
      assert(result.includes('<meta property="playlist:total_videos" content="10"'));
    });
  });

  describe("Tier 3: Business & Monetization Features", () => {
    it("should generate channel metadata", () => {
      const result = youtube({
        title: "Channel Video",
        description: "Channel content",
        channel: {
          title: "Premium Channel",
          description: "High-quality content",
          customUrl: "@premiumchannel",
          publishedAt: "2020-01-15T00:00:00Z",
          country: "US",
        },
      });

      assert(result.includes('<meta property="channel:title"'));
      assert(result.includes('<meta property="channel:description"'));
      assert(result.includes('<meta property="channel:custom_url" content="@premiumchannel"'));
      assert(result.includes('<meta property="channel:published_at"'));
      assert(result.includes('<meta property="channel:country" content="US"'));
    });

    it("should generate monetization metadata", () => {
      const result = youtube({
        title: "Monetized Video",
        description: "Sponsored content",
        monetization: {
          isMonetized: true,
          adsEnabled: true,
          sponsorships: [
            { brand: "TechCorp", disclosure: "Sponsored by TechCorp" },
            { brand: "BrandX", disclosure: "Thanks to BrandX" },
          ],
          merchandise: {
            available: true,
            url: "/merch",
          },
        },
      });

      assert(result.includes('<meta property="video:monetized" content="true"'));
      assert(result.includes('<meta property="video:ads_enabled" content="true"'));
      assert(result.includes('<meta property="video:sponsorship"'));
      assert(result.includes('<meta property="video:sponsorship_disclosure"'));
      assert(result.includes('<meta property="channel:merchandise_available" content="true"'));
      assert(result.includes('<meta property="channel:merchandise_url"'));
    });

    it("should limit sponsorships to 5", () => {
      const sponsorships = Array.from({ length: 7 }, (_, i) => ({
        brand: `Brand${i}`,
        disclosure: `Disclosure ${i}`,
      }));
      const result = youtube({
        title: "Many Sponsors",
        description: "Multiple sponsorships",
        monetization: { sponsorships },
      });

      let sponsorshipCount = 0;
      const matches = result.match(/property="video:sponsorship"/g) || [];
      sponsorshipCount = matches.length;

      assert.strictEqual(sponsorshipCount, 5);
    });

    it("should generate business metadata", () => {
      const result = youtube({
        title: "Business Video",
        description: "Business content",
        business: {
          type: "product",
          price: "$99.99",
          availability: "available",
          brand: "Premium Brand",
          category: "Education",
        },
      });

      assert(result.includes('<meta property="business:type" content="product"'));
      assert(result.includes('<meta property="business:price" content="$99.99"'));
      assert(result.includes('<meta property="business:availability" content="available"'));
      assert(result.includes('<meta property="business:brand"'));
      assert(result.includes('<meta property="business:category"'));
    });
  });

  describe("Tier 4: Advanced YouTube Features", () => {
    it("should generate live streaming metadata", () => {
      const result = youtube({
        title: "Live Stream",
        description: "Live event",
        liveStreaming: {
          concurrentViewers: 12500,
          totalViewers: 45000,
          chatEnabled: true,
          donationsEnabled: true,
          superChats: [
            { amount: 50, currency: "USD", message: "Amazing content!" },
            { amount: 25, currency: "EUR", message: "Great stream!" },
          ],
        },
      });

      assert(result.includes('<meta property="live:concurrent_viewers" content="12500"'));
      assert(result.includes('<meta property="live:total_viewers" content="45000"'));
      assert(result.includes('<meta property="live:chat_enabled" content="true"'));
      assert(result.includes('<meta property="live:donations_enabled" content="true"'));
      assert(result.includes('<meta property="live:super_chat"'));
    });

    it("should limit super chats to 10", () => {
      const superChats = Array.from({ length: 12 }, (_, i) => ({
        amount: 10 + i,
        currency: "USD",
        message: `Message ${i}`,
      }));
      const result = youtube({
        title: "Many Super Chats",
        description: "Popular live stream",
        liveStreaming: { superChats },
      });

      let superChatCount = 0;
      const matches = result.match(/property="live:super_chat"/g) || [];
      superChatCount = matches.length;

      assert.strictEqual(superChatCount, 10);
    });

    it("should generate localization metadata", () => {
      const result = youtube({
        title: "Localized Video",
        description: "International content",
        localization: {
          defaultLanguage: "en",
          defaultAudioLanguage: "en",
          title: {
            es: "Video Localizado",
            fr: "Vidéo Localisée",
            de: "Lokalisierte Video",
          },
          description: {
            es: "Contenido internacional",
            fr: "Contenu international",
          },
        },
      });

      assert(result.includes('<meta property="video:default_language" content="en"'));
      assert(result.includes('<meta property="video:default_audio_language" content="en"'));
      assert(result.includes('<meta property="video:title:es"'));
      assert(result.includes('<meta property="video:title:fr"'));
      assert(result.includes('<meta property="video:description:es"'));
      assert(result.includes('<meta property="video:description:fr"'));
    });

    it("should limit localization entries to 10", () => {
      const titles = {};
      for (let i = 0; i < 12; i++) {
        titles[`lang${i}`] = `Title ${i}`;
      }
      const result = youtube({
        title: "Many Languages",
        description: "Multi-language",
        localization: { title: titles },
      });

      let titleCount = 0;
      const matches = result.match(/property="video:title:/g) || [];
      titleCount = matches.length;

      assert.strictEqual(titleCount, 10);
    });

    it("should generate SEO metadata", () => {
      const result = youtube({
        title: "SEO Optimized",
        description: "SEO content",
        seo: {
          tags: ["tutorial", "education", "how-to", "premium"],
          category: "Education",
          recordingDate: "2024-01-15",
          keywords: ["masterclass", "tutorial", "education"],
        },
      });

      assert(result.includes('<meta property="video:tag"'));
      assert(result.includes('<meta property="video:category" content="Education"'));
      assert(result.includes('<meta property="video:recording_date"'));
      assert(result.includes('<meta property="video:keyword"'));
    });

    it("should limit tags and keywords", () => {
      const tags = Array.from({ length: 17 }, (_, i) => `tag${i}`);
      const keywords = Array.from({ length: 12 }, (_, i) => `keyword${i}`);
      const result = youtube({
        title: "Many Tags",
        description: "Lots of metadata",
        seo: { tags, keywords },
      });

      let tagCount = 0;
      let keywordCount = 0;
      const tagMatches = result.match(/property="video:tag"/g) || [];
      const keywordMatches = result.match(/property="video:keyword"/g) || [];
      tagCount = tagMatches.length;
      keywordCount = keywordMatches.length;

      assert.strictEqual(tagCount, 15);
      assert.strictEqual(keywordCount, 10);
    });

    it("should generate engagement metadata", () => {
      const result = youtube({
        title: "Engaging Video",
        description: "High engagement content",
        engagement: {
          likes: 15420,
          dislikes: 234,
          comments: 3420,
          shares: 1250,
          subscriptions: 890,
          watchLater: 2100,
        },
      });

      assert(result.includes('<meta property="engagement:likes" content="15420"'));
      assert(result.includes('<meta property="engagement:comments" content="3420"'));
      assert(result.includes('<meta property="engagement:shares" content="1250"'));
      assert(result.includes('<meta property="engagement:subscriptions" content="890"'));
      assert(result.includes('<meta property="engagement:watch_later" content="2100"'));
    });

    it("should generate shorts metadata", () => {
      const result = youtube({
        title: "Video with Shorts",
        description: "Multiple formats",
        shorts: {
          clips: [
            {
              url: "/clip1.mp4",
              title: "Key Moment",
              startTime: 180,
              duration: 15,
            },
            {
              url: "/clip2.mp4",
              title: "Funny Part",
              startTime: 300,
              duration: 10,
            },
          ],
        },
      });

      assert(result.includes('<meta property="shorts:clip"'));
      assert(result.includes('<meta property="shorts:clip_title"'));
      assert(result.includes('<meta property="shorts:clip_start"'));
      assert(result.includes('<meta property="shorts:clip_duration"'));
    });

    it("should limit shorts clips to 5", () => {
      const clips = Array.from({ length: 7 }, (_, i) => ({
        url: `/clip${i}.mp4`,
        title: `Clip ${i}`,
        startTime: i * 60,
        duration: 15,
      }));
      const result = youtube({
        title: "Many Clips",
        description: "Multiple shorts",
        shorts: { clips },
      });

      let clipCount = 0;
      const matches = result.match(/property="shorts:clip"/g) || [];
      clipCount = matches.length;

      assert.strictEqual(clipCount, 5);
    });

    it("should generate video chapters metadata", () => {
      const result = youtube({
        title: "Video with Chapters",
        description: "Structured content",
        chapters: [
          { title: "Introduction", startTime: 0, endTime: 120 },
          { title: "Main Content", startTime: 120, endTime: 600 },
          { title: "Conclusion", startTime: 600 },
        ],
      });

      assert(result.includes('<meta property="chapter:title"'));
      assert(result.includes('<meta property="chapter:start_time"'));
      assert(result.includes('<meta property="chapter:end_time"'));
    });

    it("should limit chapters to 20", () => {
      const chapters = Array.from({ length: 22 }, (_, i) => ({
        title: `Chapter ${i}`,
        startTime: i * 60,
      }));
      const result = youtube({
        title: "Many Chapters",
        description: "Highly structured",
        chapters,
      });

      let chapterCount = 0;
      const matches = result.match(/property="chapter:title"/g) || [];
      chapterCount = matches.length;

      assert.strictEqual(chapterCount, 20);
    });

    it("should generate cards metadata", () => {
      const result = youtube({
        title: "Video with Cards",
        description: "Interactive content",
        cards: {
          endScreens: [
            {
              type: "video",
              videoId: "next-video-id",
              timing: "end",
            },
            {
              type: "playlist",
              playlistId: "playlist-id",
              timing: "end",
            },
          ],
          infoCards: [
            {
              type: "link",
              url: "/related-content",
              timing: 180,
            },
          ],
        },
      });

      assert(result.includes('<meta property="card:end_screen:video"'));
      assert(result.includes('<meta property="card:end_screen:playlist"'));
      assert(result.includes('<meta property="card:info:link"'));
      assert(result.includes('<meta property="card:end_screen:video_id"'));
      assert(result.includes('<meta property="card:end_screen:playlist_id"'));
    });

    it("should limit cards to 5 per type", () => {
      const endScreens = Array.from({ length: 7 }, (_, i) => ({
        type: "video",
        videoId: `video${i}`,
        timing: "end",
      }));
      const infoCards = Array.from({ length: 7 }, (_, i) => ({
        type: "link",
        url: `/link${i}`,
        timing: i * 60,
      }));
      const result = youtube({
        title: "Many Cards",
        description: "Interactive",
        cards: { endScreens, infoCards },
      });

      let endScreenCount = 0;
      let infoCardCount = 0;
      // Count only the main card type tags, not the additional video_id/playlist_id/url tags
      const endScreenMatches = result.match(/property="card:end_screen:video"/g) || [];
      const infoCardMatches = result.match(/property="card:info:link"/g) || [];
      endScreenCount = endScreenMatches.length;
      infoCardCount = infoCardMatches.length;

      assert.strictEqual(endScreenCount, 5);
      assert.strictEqual(infoCardCount, 5);
    });
  });

  describe("Content Type Intelligence", () => {
    it("should apply educational content type defaults", () => {
      const result = youtube({
        title: "Educational Video",
        description: "Learning content",
        contentType: "educational",
      });

      assert(result.includes('<meta property="video:caption" content="true"'));
      assert(result.includes('<meta property="video:licensed_content" content="false"'));
      assert(result.includes('<meta property="video:category" content="Education"'));
    });

    it("should apply entertainment content type defaults", () => {
      const result = youtube({
        title: "Entertainment Video",
        description: "Fun content",
        contentType: "entertainment",
      });

      assert(result.includes('<meta property="video:category" content="Entertainment"'));
    });

    it("should apply live content type defaults", () => {
      const result = youtube({
        title: "Live Stream",
        description: "Live content",
        contentType: "live",
      });

      assert(result.includes('<meta property="og:video:tag" content="live"'));
      assert(result.includes('<meta property="live:chat_enabled" content="true"'));
      assert(result.includes('<meta property="video:caption" content="true"'));
    });

    it("should apply business content type defaults", () => {
      const result = youtube({
        title: "Business Video",
        description: "Business content",
        contentType: "business",
      });

      assert(result.includes('<meta property="video:monetized" content="true"'));
      assert(result.includes('<meta property="video:licensed_content" content="true"'));
      assert(result.includes('<meta property="video:category" content="Howto &amp; Style"'));
    });

    it("should apply tutorial content type defaults", () => {
      const result = youtube({
        title: "Tutorial Video",
        description: "Tutorial content",
        contentType: "tutorial",
      });

      assert(result.includes('<meta property="video:caption" content="true"'));
      assert(result.includes('<meta property="video:category" content="Howto &amp; Style"'));
    });
  });

  describe("Progressive Enhancement Combinations", () => {
    it("should handle Tier 1 + Tier 2 (basic + enhanced)", () => {
      const result = youtube({
        title: "Enhanced Video",
        description: "Enhanced content",
        video: {
          url: "/video.mp4",
          thumbnail: "/thumb.jpg",
          duration: 1800,
          width: 1920,
          height: 1080,
        },
        contentDetails: {
          definition: "HD",
          caption: true,
        },
        statistics: {
          viewCount: 100000,
          likeCount: 5000,
        },
      });

      assert(result.includes('<meta property="og:video"'));
      assert(result.includes('<meta property="og:video:duration"'));
      assert(result.includes('<meta property="video:definition"'));
      assert(result.includes('<meta property="video:view_count"'));
    });

    it("should handle Tier 2 + Tier 3 (enhanced + monetization)", () => {
      const result = youtube({
        title: "Monetized Video",
        description: "Sponsored content",
        video: { url: "/video.mp4" },
        statistics: { viewCount: 50000 },
        channel: {
          title: "Premium Channel",
          subscriberCount: 100000,
        },
        monetization: {
          isMonetized: true,
          sponsorships: [{ brand: "Sponsor", disclosure: "Sponsored" }],
        },
      });

      assert(result.includes('<meta property="video:view_count"'));
      assert(result.includes('<meta property="channel:title"'));
      assert(result.includes('<meta property="video:monetized"'));
      assert(result.includes('<meta property="video:sponsorship"'));
    });

    it("should handle Tier 3 + Tier 4 (monetization + advanced)", () => {
      const result = youtube({
        title: "Advanced Monetized",
        description: "Advanced content",
        video: { url: "/video.mp4" },
        channel: { title: "Channel" },
        monetization: { isMonetized: true },
        liveStreaming: { chatEnabled: true },
        localization: { defaultLanguage: "en" },
        seo: { tags: ["premium"] },
        chapters: [{ title: "Intro", startTime: 0 }],
      });

      assert(result.includes('<meta property="channel:title"'));
      assert(result.includes('<meta property="video:monetized"'));
      assert(result.includes('<meta property="live:chat_enabled"'));
      assert(result.includes('<meta property="video:default_language"'));
      assert(result.includes('<meta property="video:tag"'));
      assert(result.includes('<meta property="chapter:title"'));
    });

    it("should handle all tiers combined", () => {
      const result = youtube({
        domain: "youtube.com",
        title: "Ultimate YouTube Video",
        description: "Complete optimization",
        video: {
          url: "/video.mp4",
          thumbnail: "/thumb.jpg",
          duration: 3600,
          width: 1920,
          height: 1080,
          isLive: false,
        },
        contentDetails: {
          definition: "HD",
          caption: true,
          licensedContent: false,
        },
        statistics: {
          viewCount: 1000000,
          likeCount: 50000,
          commentCount: 5000,
        },
        channel: {
          title: "Ultimate Channel",
          subscriberCount: 500000,
        },
        monetization: {
          isMonetized: true,
          sponsorships: [{ brand: "Brand", disclosure: "Sponsored" }],
        },
        liveStreaming: {
          concurrentViewers: 10000,
        },
        localization: {
          defaultLanguage: "en",
          title: { es: "Video Ultimate" },
        },
        seo: {
          tags: ["ultimate", "premium"],
          category: "Education",
        },
        engagement: {
          likes: 50000,
          comments: 5000,
        },
        chapters: [{ title: "Introduction", startTime: 0 }],
        contentType: "educational",
      });

      // Tier 1 - Basic
      assert(result.includes('<meta property="og:title"'));
      assert(result.includes('<meta property="og:video"'));

      // Tier 2 - Enhanced
      assert(result.includes('<meta property="video:definition"'));
      assert(result.includes('<meta property="video:view_count"'));

      // Tier 3 - Monetization
      assert(result.includes('<meta property="channel:title"'));
      assert(result.includes('<meta property="video:monetized"'));

      // Tier 4 - Advanced
      assert(result.includes('<meta property="live:concurrent_viewers"'));
      assert(result.includes('<meta property="video:default_language"'));
      assert(result.includes('<meta property="video:tag"'));
      assert(result.includes('<meta property="chapter:title"'));
    });
  });

  describe("Edge Cases", () => {
    it("should handle complex query parameters in URLs", () => {
      const result = youtube({
        domain: "youtube.com",
        url: "/watch?v=VIDEO_ID&utm_source=share&feature=share",
        title: "Video",
        description: "Description",
      });

      assert(result.includes('content="https://youtube.com/watch?v=VIDEO_ID&amp;utm_source=share&amp;feature=share"'));
    });

    it("should handle URL-encoded characters in content", () => {
      const result = youtube({
        title: 'Video "Title" & Description',
        description: "Content with & symbols",
        channel: { title: 'Channel "Name"' },
      });

      assert(!result.includes('Video "Title"'));
      assert(result.includes("Video &quot;Title&quot; &amp; Description"));
      assert(result.includes("Channel &quot;Name&quot;"));
    });

    it("should handle port numbers in domain", () => {
      const result = youtube({
        domain: "localhost:3000",
        title: "Dev Video",
        description: "Development",
      });

      assert(result.includes('content="https://localhost:3000"'));
    });

    it("should handle subdomain domains", () => {
      const result = youtube({
        domain: "studio.youtube.com",
        title: "Studio Video",
        description: "Studio content",
      });

      assert(result.includes('content="https://studio.youtube.com"'));
    });

    it("should handle very long content", () => {
      const longTitle = "A".repeat(100);
      const longDescription = "B".repeat(5000);
      const result = youtube({
        title: longTitle,
        description: longDescription,
      });

      assert(result.includes(longTitle));
      assert(result.includes(longDescription));
    });

    it("should handle mixed absolute and relative URLs", () => {
      const result = youtube({
        domain: "youtube.com",
        title: "Mixed URLs",
        description: "Description",
        video: {
          url: "https://cdn.youtube.com/video.mp4",
          thumbnail: "/thumbnail.jpg",
        },
        cards: {
          infoCards: [
            { type: "link", url: "/internal", timing: 60 },
            { type: "link", url: "https://external.com/link", timing: 120 },
          ],
        },
      });

      assert(result.includes('content="https://cdn.youtube.com/video.mp4"'));
      assert(result.includes('content="https://youtube.com/thumbnail.jpg"'));
      assert(result.includes('content="https://youtube.com/internal"'));
      assert(result.includes('content="https://external.com/link"'));
    });

    it("should handle empty arrays gracefully", () => {
      const result = youtube({
        title: "Empty Arrays",
        description: "Test empty arrays",
        seo: {},
        engagement: {},
        cards: {},
        shorts: { clips: [] },
      });

      assert(result.includes('<meta property="og:title"'));
      assert(!result.includes('property="video:tag"'));
      assert(!result.includes('property="engagement:likes"'));
    });

    it("should handle null/undefined values in objects", () => {
      const result = youtube({
        title: "Null Values",
        description: "Test null handling",
        video: { url: "/video.mp4", duration: null, width: undefined },
        contentDetails: { definition: null, caption: undefined },
        statistics: { viewCount: null, likeCount: undefined },
      });

      assert(result.includes('<meta property="og:video"'));
      assert(!result.includes('property="og:video:duration"'));
      assert(!result.includes('property="og:video:width"'));
      assert(!result.includes('property="video:definition"'));
      assert(!result.includes('property="video:view_count"'));
    });

    it("should handle extreme edge cases", () => {
      const result = youtube({
        title: "Extreme",
        description: "Test extreme values",
        video: {
          url: "/video.mp4",
          width: Number.MAX_SAFE_INTEGER,
          height: Number.MIN_SAFE_INTEGER,
          duration: -1,
        },
        statistics: {
          viewCount: Number.MAX_SAFE_INTEGER,
          likeCount: Number.MIN_SAFE_INTEGER,
        },
        liveStreaming: { concurrentViewers: -100 },
      });

      assert(result.includes('<meta property="og:video:width"'));
      assert(result.includes('<meta property="og:video:height"'));
      assert(result.includes('<meta property="og:video:duration"'));
      assert(result.includes('<meta property="video:view_count"'));
      assert(result.includes('<meta property="live:concurrent_viewers"'));
    });

    it("should handle malformed objects gracefully", () => {
      const result = youtube({
        title: "Malformed",
        description: "Test malformed objects",
        monetization: null,
        localization: undefined,
        seo: "not-an-object",
      });

      assert(result.includes('<meta property="og:title"'));
      assert(!result.includes('property="video:monetized"'));
      assert(!result.includes('property="video:default_language"'));
    });

    it("should handle conflicting configurations", () => {
      const result = youtube({
        title: "Conflict",
        description: "Test conflicts",
        contentType: "educational",
        contentDetails: { definition: "SD" }, // Override content type default
        seo: { category: "Entertainment" }, // Override content type default
      });

      // Should include both custom overrides and content type defaults
      assert(result.includes('<meta property="video:definition" content="SD"'));
      assert(result.includes('<meta property="video:category" content="Entertainment"'));
    });

    it("should handle boolean string values", () => {
      const result = youtube({
        title: "Boolean Strings",
        description: "Test boolean strings",
        contentDetails: { caption: false },
        monetization: { isMonetized: true },
        video: { url: "/video.mp4", isLive: false },
      });

      assert(result.includes('<meta property="video:caption" content="false"'));
      assert(result.includes('<meta property="video:monetized" content="true"'));
      assert(!result.includes('property="og:video:tag"'));
    });

    it("should handle numeric zero as valid value", () => {
      const result = youtube({
        title: "Zero Values",
        description: "Test zero handling",
        video: { url: "/video.mp4", width: 0, height: 0, duration: 0 },
        statistics: { viewCount: 0, likeCount: 0 },
        engagement: { likes: 0, comments: 0 },
      });

      assert(result.includes('<meta property="og:video:width" content="0"'));
      assert(result.includes('<meta property="og:video:height" content="0"'));
      assert(result.includes('<meta property="og:video:duration" content="0"'));
      assert(result.includes('<meta property="video:view_count" content="0"'));
      assert(result.includes('<meta property="engagement:likes" content="0"'));
    });
  });

  describe("Schema and Output Validation", () => {
    it("should generate valid HTML markup structure", () => {
      const result = youtube({
        title: "Test",
        description: "Test description",
      });

      assert(result.trim().startsWith("<meta"));
      const metaTagCount = (result.match(/<meta/g) || []).length;
      const closingTagCount = (result.match(/\/>/g) || []).length;
      assert.strictEqual(metaTagCount, closingTagCount);
    });

    it("should generate properly formatted Open Graph tags", () => {
      const result = youtube({
        title: "Test Title",
        description: "Test Description",
      });

      assert(result.includes('property="og:title"'));
      assert(result.includes('property="og:description"'));
      assert(result.includes('property="og:type" content="video.other"'));
      assert(result.includes('property="og:site_name" content="YouTube"'));
    });

    it("should validate YouTube-specific property formatting", () => {
      const result = youtube({
        title: "YouTube Test",
        description: "Test",
        video: { url: "/video.mp4", isLive: true },
        contentDetails: { definition: "HD" },
        monetization: { isMonetized: true },
        liveStreaming: { chatEnabled: true },
      });

      assert(result.includes('property="og:video"'));
      assert(result.includes('property="video:definition"'));
      assert(result.includes('property="video:monetized"'));
      assert(result.includes('property="live:chat_enabled"'));
    });

    it("should ensure all generated URLs are HTTPS", () => {
      const result = youtube({
        title: "Test",
        description: "Test",
        domain: "youtube.com",
        url: "/watch",
        video: {
          url: "http://youtube.com/video.mp4",
          thumbnail: "http://youtube.com/thumb.jpg",
        },
        cards: {
          infoCards: [{ type: "link", url: "http://external.com/link", timing: 60 }],
        },
      });

      assert(!result.includes("http://"));
      assert(result.includes("https://"));
    });

    it("should handle malformed URLs gracefully", () => {
      const result = youtube({
        domain: "youtube.com",
        title: "Malformed URLs",
        description: "Test",
        video: { url: "not-a-url" },
        cards: {
          infoCards: [{ type: "link", url: "invalid-url", timing: 60 }],
        },
      });

      assert(result.includes('content="https://youtube.com/not-a-url"'));
      assert(result.includes('content="https://youtube.com/invalid-url"'));
    });

    it("should properly escape HTML in content", () => {
      const result = youtube({
        title: 'Test "Quote" & <Tag>',
        description: "Test description",
        channel: { title: 'Channel "Name" & Co' },
        seo: { tags: ['Tag "One" & Two'] },
      });

      assert(!result.includes('Test "Quote"'));
      assert(result.includes("Test &quot;Quote&quot; &amp; &lt;Tag&gt;"));
      assert(result.includes("Channel &quot;Name&quot; &amp; Co"));
      assert(result.includes("Tag &quot;One&quot; &amp; Two"));
    });

    it("should validate progressive enhancement", () => {
      // Basic configuration
      const basicResult = youtube({
        title: "Basic",
        description: "Basic video",
      });

      // Enhanced configuration
      const enhancedResult = youtube({
        title: "Enhanced",
        description: "Enhanced video",
        video: { url: "/video.mp4", duration: 1800 },
        contentDetails: { definition: "HD" },
        statistics: { viewCount: 100000 },
        channel: { title: "Channel" },
        monetization: { isMonetized: true },
        seo: { tags: ["premium"] },
        chapters: [{ title: "Intro", startTime: 0 }],
      });

      // Enhanced should have more meta tags
      const basicTagCount = (basicResult.match(/<meta/g) || []).length;
      const enhancedTagCount = (enhancedResult.match(/<meta/g) || []).length;

      assert(enhancedTagCount > basicTagCount, "Enhanced configuration should generate more meta tags");
    });

    it("should validate content-type specific optimizations", () => {
      const educationalResult = youtube({
        title: "Educational",
        description: "Learning content",
        contentType: "educational",
      });

      const liveResult = youtube({
        title: "Live",
        description: "Live content",
        contentType: "live",
      });

      const businessResult = youtube({
        title: "Business",
        description: "Business content",
        contentType: "business",
      });

      // Educational should have education category and captions
      assert(educationalResult.includes('content="Education"'));
      assert(educationalResult.includes('content="true"'));

      // Live should have live tag and chat enabled
      assert(liveResult.includes('content="live"'));
      assert(liveResult.includes('content="true"'));

      // Business should be monetized
      assert(businessResult.includes('content="true"'));
    });

    it("should validate YouTube ecosystem integration", () => {
      const result = youtube({
        title: "Ecosystem Test",
        description: "Full integration",
        video: { url: "/video.mp4" },
        contentDetails: { definition: "HD" },
        statistics: { viewCount: 100000 },
        channel: { title: "Channel" },
        monetization: { isMonetized: true },
        liveStreaming: { chatEnabled: true },
        localization: { defaultLanguage: "en" },
        seo: { tags: ["test"] },
        engagement: { likes: 1000 },
        shorts: { clips: [{ url: "/clip.mp4", title: "Clip", startTime: 60, duration: 15 }] },
        chapters: [{ title: "Chapter", startTime: 0 }],
        cards: {
          endScreens: [{ type: "video", videoId: "vid", timing: "end" }],
          infoCards: [{ type: "link", url: "/link", timing: 120 }],
        },
      });

      // Should include comprehensive YouTube features
      assert(result.includes('property="og:video"'));
      assert(result.includes('property="video:definition"'));
      assert(result.includes('property="video:view_count"'));
      assert(result.includes('property="channel:title"'));
      assert(result.includes('property="video:monetized"'));
      assert(result.includes('property="live:chat_enabled"'));
      assert(result.includes('property="video:default_language"'));
      assert(result.includes('property="video:tag"'));
      assert(result.includes('property="engagement:likes"'));
      assert(result.includes('property="shorts:clip"'));
      assert(result.includes('property="chapter:title"'));
      assert(result.includes('property="card:end_screen:video"'));
      assert(result.includes('property="card:info:link"'));
    });

    it("should validate video commerce integration completeness", () => {
      const result = youtube({
        title: "Commerce Video",
        description: "Monetized content",
        video: { url: "/video.mp4" },
        channel: {
          title: "Commerce Channel",
          subscriberCount: 100000,
        },
        monetization: {
          isMonetized: true,
          adsEnabled: true,
          sponsorships: [{ brand: "Brand", disclosure: "Sponsored" }],
          merchandise: { available: true, url: "/merch" },
        },
        business: {
          type: "product",
          price: "$49.99",
          availability: "available",
        },
        engagement: {
          likes: 5000,
          subscriptions: 100,
        },
      });

      // Should include complete commerce metadata
      assert(result.includes('property="channel:title"'));
      assert(result.includes('property="channel:subscriber_count"'));
      assert(result.includes('property="video:monetized"'));
      assert(result.includes('property="video:ads_enabled"'));
      assert(result.includes('property="video:sponsorship"'));
      assert(result.includes('property="channel:merchandise_available"'));
      assert(result.includes('property="business:type"'));
      assert(result.includes('property="business:price"'));
      assert(result.includes('property="engagement:likes"'));
    });
  });
});
