import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { feed } from "./feed.js";

describe("feed", () => {
  describe("Simple API: feed(format, items)", () => {
    it("generates basic RSS feed", () => {
      const result = feed("rss", [
        { title: "Post 1", url: "/post1", date: "2024-01-01" },
        { title: "Post 2", url: "/post2", date: "2024-01-02" },
      ]);

      assert(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
      assert(result.includes('<rss version="2.0"'));
      assert(result.includes("<title>Post 1</title>"));
      assert(result.includes("<title>Post 2</title>"));
      assert(result.includes("<link>/post1</link>"));
      assert(result.includes("<link>/post2</link>"));
      assert(result.includes("<title>Untitled Feed</title>"));
    });

    it("generates basic Atom feed", () => {
      const result = feed("atom", [
        { title: "Post 1", url: "/post1", date: "2024-01-01" },
        { title: "Post 2", url: "/post2", date: "2024-01-02" },
      ]);

      assert(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
      assert(result.includes('<feed xmlns="http://www.w3.org/2005/Atom">'));
      assert(result.includes("<title>Post 1</title>"));
      assert(result.includes("<title>Post 2</title>"));
      assert(result.includes('<link rel="alternate" type="text/html" href="/post1"/>'));
      assert(result.includes('<link rel="alternate" type="text/html" href="/post2"/>'));
      assert(result.includes("<title>Untitled Feed</title>"));
    });

    it("throws on invalid format", () => {
      assert.throws(() => feed("invalid", []), {
        name: "TypeError",
        message: "Invalid format: invalid. Must be 'rss' or 'atom'",
      });
    });

    it("throws on invalid items parameter", () => {
      assert.throws(() => feed("rss", "not-an-array"), {
        name: "TypeError",
        message: "Invalid arguments: expected feed(format, items) or feed(config)",
      });
    });
  });

  describe("Advanced API: feed(config)", () => {
    it("generates RSS feed with full configuration", () => {
      const result = feed({
        format: "rss",
        title: "My Tech Blog",
        description: "Latest technology insights",
        link: "https://example.com",
        language: "en",
        author: { name: "John Doe", email: "john@example.com" },
        updated: "2024-01-01T00:00:00Z",
        items: [
          {
            title: "Advanced JavaScript",
            url: "/posts/advanced-js",
            date: "2024-01-01T10:00:00Z",
            author: "Jane Smith",
            summary: "Deep dive into modern JS",
            content: "<p>Full article content...</p>",
            categories: ["javascript", "programming"],
          },
        ],
      });

      assert(result.includes("<title>My Tech Blog</title>"));
      assert(result.includes("<description>Latest technology insights</description>"));
      assert(result.includes("<link>https://example.com</link>"));
      assert(result.includes("<language>en</language>"));
      assert(result.includes("<managingEditor>john@example.com</managingEditor>"));
      assert(result.includes("<title>Advanced JavaScript</title>"));
      assert(result.includes("<link>https://example.com/posts/advanced-js</link>"));
      assert(result.includes("<author>Jane Smith</author>"));
      assert(result.includes("<description><![CDATA[Deep dive into modern JS]]></description>"));
      assert(result.includes("<content:encoded><![CDATA[<p>Full article content...</p>]]></content:encoded>"));
      assert(result.includes("<category>javascript</category>"));
      assert(result.includes("<category>programming</category>"));
    });

    it("generates Atom feed with full configuration", () => {
      const result = feed({
        format: "atom",
        title: "My Tech Blog",
        description: "Latest technology insights",
        link: "https://example.com",
        language: "en",
        author: { name: "John Doe", email: "john@example.com" },
        updated: "2024-01-01T00:00:00Z",
        items: [
          {
            title: "Advanced JavaScript",
            url: "/posts/advanced-js",
            date: "2024-01-01T10:00:00Z",
            author: "Jane Smith",
            summary: "Deep dive into modern JS",
            content: "<p>Full article content...</p>",
            categories: ["javascript", "programming"],
          },
        ],
      });

      assert(result.includes("<title>My Tech Blog</title>"));
      assert(result.includes("<subtitle>Latest technology insights</subtitle>"));
      assert(result.includes('<link rel="self" type="application/atom+xml" href="https://example.com"/>'));
      assert(result.includes('<link rel="alternate" type="text/html" href="https://example.com"/>'));
      assert(result.includes("<author><name>John Doe</name><email>john@example.com</email></author>"));
      assert(result.includes("<title>Advanced JavaScript</title>"));
      assert(result.includes('<link rel="alternate" type="text/html" href="https://example.com/posts/advanced-js"/>'));
      assert(result.includes("<author><name>Jane Smith</name></author>"));
      assert(result.includes("<summary><![CDATA[Deep dive into modern JS]]></summary>"));
      assert(result.includes('<content type="html"><![CDATA[<p>Full article content...</p>]]></content>'));
      assert(result.includes('<category term="javascript"/>'));
      assert(result.includes('<category term="programming"/>'));
    });

    it("handles enclosures in RSS", () => {
      const result = feed({
        format: "rss",
        items: [
          {
            title: "Podcast Episode",
            url: "/episode1",
            date: "2024-01-01",
            enclosure: {
              url: "https://example.com/podcast.mp3",
              type: "audio/mpeg",
              length: 12345678,
            },
          },
        ],
      });

      assert(result.includes('<enclosure url="https://example.com/podcast.mp3" type="audio/mpeg" length="12345678"/>'));
    });

    it("handles enclosures in Atom", () => {
      const result = feed({
        format: "atom",
        items: [
          {
            title: "Podcast Episode",
            url: "/episode1",
            date: "2024-01-01",
            enclosure: {
              url: "https://example.com/podcast.mp3",
              type: "audio/mpeg",
              length: 12345678,
            },
          },
        ],
      });

      assert(
        result.includes(
          '<link rel="enclosure" type="audio/mpeg" href="https://example.com/podcast.mp3" length="12345678"/>'
        )
      );
    });

    it("handles missing required fields", () => {
      const result = feed({
        format: "rss",
        items: [
          { url: "/test" }, // Missing title and date
          {}, // Empty object
        ],
      });

      assert(result.includes("<title>Untitled</title>"));
      assert(result.includes("<link>/test</link>"));
      assert(result.includes("<link>/</link>"));
    });
  });

  describe("Input validation", () => {
    it("throws on invalid configuration object", () => {
      assert.throws(() => feed({}), {
        name: "TypeError",
        message: "Items must be an array",
      });
    });

    it("throws on invalid enclosure", () => {
      assert.throws(
        () =>
          feed({
            items: [
              {
                title: "Test",
                url: "/test",
                enclosure: { url: "test.mp3" }, // Missing type and length
              },
            ],
          }),
        {
          name: "TypeError",
          message: "Invalid enclosure in item 0: must have url, type, and length",
        }
      );
    });

    it("throws on invalid arguments", () => {
      assert.throws(() => feed(123), {
        name: "TypeError",
        message: "Invalid arguments: expected feed(format, items) or feed(config)",
      });

      assert.throws(() => feed(null), {
        name: "TypeError",
        message: "Invalid arguments: expected feed(format, items) or feed(config)",
      });
    });
  });

  describe("Value normalization", () => {
    it("normalizes dates", () => {
      const result = feed({
        format: "rss",
        items: [{ title: "Test", url: "/test", date: new Date("2024-01-01T10:00:00Z") }],
      });

      // RSS uses RFC 2822 format for pubDate
      assert(result.includes("<pubDate>"));
      assert(result.includes("2024"));
    });

    it("normalizes authors", () => {
      const result = feed({
        format: "atom",
        author: "John Doe",
        items: [{ title: "Test", url: "/test", author: { name: "Jane", email: "jane@example.com" } }],
      });

      assert(result.includes("<author><name>John Doe</name></author>"));
      assert(result.includes("<author><name>Jane</name><email>jane@example.com</email></author>"));
    });

    it("generates unique IDs for items", () => {
      const result = feed({
        format: "atom",
        items: [
          { title: "Test 1", url: "/test1", date: "2024-01-01" },
          { title: "Test 2", url: "/test2", date: "2024-01-02" },
        ],
      });

      const idMatches = result.match(/<id>([^<]+)<\/id>/g);
      assert(idMatches);
      assert(idMatches.length >= 3); // Feed ID + 2 item IDs
      assert(idMatches[1] !== idMatches[2]); // Item IDs should be different
    });

    it("handles string items (simple URLs)", () => {
      const result = feed({
        format: "rss",
        link: "https://example.com",
        items: ["/post1", "/post2"],
      });

      assert(result.includes("<link>https://example.com/post1</link>"));
      assert(result.includes("<link>https://example.com/post2</link>"));
      assert(result.includes("<title>Untitled</title>"));
    });
  });

  describe("Format differences", () => {
    it("RSS uses pubDate, Atom uses published/updated", () => {
      const rss = feed("rss", [{ title: "Test", url: "/test", date: "2024-01-01T10:00:00Z" }]);
      const atom = feed("atom", [{ title: "Test", url: "/test", date: "2024-01-01T10:00:00Z" }]);

      // RSS uses RFC 2822 format for pubDate
      assert(rss.includes("<pubDate>"));
      assert(rss.includes("GMT"));

      // Atom uses ISO 8601 format
      assert(atom.includes("<published>2024-01-01T10:00:00.000Z</published>"));
      // Check that the entry has the correct updated date
      const entryMatch = atom.match(/<entry>[\s\S]*?<updated>([^<]+)<\/updated>/);
      assert(entryMatch && entryMatch[1] === "2024-01-01T10:00:00.000Z");
    });

    it("RSS uses guid, Atom uses id", () => {
      const rss = feed("rss", [{ title: "Test", url: "/test" }]);
      const atom = feed("atom", [{ title: "Test", url: "/test" }]);

      assert(rss.includes("<guid"));
      assert(atom.includes("<id>"));
    });

    it("RSS uses managingEditor, Atom uses author", () => {
      const rss = feed({
        format: "rss",
        author: { name: "John", email: "john@example.com" },
        items: [{ title: "Test", url: "/test" }],
      });
      const atom = feed({
        format: "atom",
        author: { name: "John", email: "john@example.com" },
        items: [{ title: "Test", url: "/test" }],
      });

      assert(rss.includes("<managingEditor>john@example.com</managingEditor>"));
      assert(atom.includes("<author><name>John</name><email>john@example.com</email></author>"));
    });
  });

  describe("Edge cases", () => {
    it("handles empty items array", () => {
      const result = feed({ format: "rss", items: [] });
      assert(result.includes("<channel>"));
      assert(result.includes("</channel>"));
      assert(!result.includes("<item>"));
    });

    it("handles HTML content properly", () => {
      const result = feed({
        format: "rss",
        items: [
          {
            title: "Test",
            url: "/test",
            content: '<script>alert("test");</script><p>Content</p>',
          },
        ],
      });

      assert(result.includes("<content:encoded>"));
      assert(result.includes("<![CDATA["));
      assert(result.includes("]]></content:encoded>"));
    });

    it("handles very long content gracefully", () => {
      const longContent = `<p>${"word ".repeat(1000)}</p>`;
      const result = feed({
        format: "atom",
        items: [
          {
            title: "Test",
            url: "/test",
            content: longContent,
          },
        ],
      });

      assert(result.includes('<content type="html">'));
      assert(result.includes(longContent));
    });

    it("handles special characters in titles and content", () => {
      const result = feed({
        format: "rss",
        items: [
          {
            title: 'Title with "quotes" & <tags>',
            url: "/test",
            content: 'Content with "quotes" & <tags>',
          },
        ],
      });

      assert(result.includes("Title with &quot;quotes&quot; &amp; &lt;tags&gt;"));
      assert(result.includes('Content with "quotes" & <tags>'));
    });
  });

  describe("XML structure", () => {
    it("generates valid RSS XML structure", () => {
      const result = feed("rss", [{ title: "Test", url: "/test" }]);

      assert(result.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
      assert(result.includes('<rss version="2.0"'));
      assert(result.includes("<channel>"));
      assert(result.includes("<item>"));
      assert(result.includes("<title>Test</title>"));
      assert(result.includes("<link>/test</link>"));
      assert(result.includes("<guid"));
      assert(result.includes("<pubDate>"));
      assert(result.includes("</item>"));
      assert(result.includes("</channel>"));
      assert(result.includes("</rss>"));
    });

    it("generates valid Atom XML structure", () => {
      const result = feed("atom", [{ title: "Test", url: "/test" }]);

      assert(result.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
      assert(result.includes('<feed xmlns="http://www.w3.org/2005/Atom">'));
      assert(result.includes("<entry>"));
      assert(result.includes("<title>Test</title>"));
      assert(result.includes('<link rel="alternate"'));
      assert(result.includes("<id>"));
      assert(result.includes("<published>"));
      assert(result.includes("<updated>"));
      assert(result.includes("</entry>"));
      assert(result.includes("</feed>"));
    });
  });
});
