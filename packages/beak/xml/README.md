# Beak XML

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-ravenjs.dev%2Fbeak-blue.svg)](https://docs.ravenjs.dev/beak)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

**XML template literals with well-formed output generation, automatic escaping, and progressive feed/sitemap generators.** Complete entity escaping, CDATA support, attribute object conversion with kebab-case transformation, plus specialized generators that scale from basic feeds to enterprise content ecosystems.

## Purpose

XML generation requires strict entity escaping, proper attribute formatting, and well-formed document structure. Manual string building leads to escaping errors and malformed documents. Existing XML libraries add complexity for simple document generation tasks.

Beak XML provides complete XML entity escaping (all five required characters) with intelligent value processing. Objects convert to attributes with automatic camelCase-to-kebab-case conversion. CDATA sections handle termination sequence protection automatically.

Beyond core XML generation, Beak XML includes **progressive generators** that scale from basic feeds to enterprise content ecosystems. Template processing uses four-tiered optimization for consistent performance across document complexity levels.

## Installation

```bash
npm install @raven-js/beak
```

## Usage

Import XML functions and use them as tagged template literals:

```javascript
import {
  xml, cdata,
  feed, sitemap
} from "@raven-js/beak/xml";

// Core XML generation with automatic escaping
const document = xml`
  <user id="${userId}" active="${isActive}">
    <name>${userName}</name>
    <bio>${userBio}</bio>
  </user>
`;
// Input: userName="John & Jane", userBio="<script>alert()</script>"
// → '<user id="123" active="true"><name>John &amp; Jane</name><bio>&lt;script&gt;alert()&lt;/script&gt;</bio></user>'

// Object to attributes conversion
const config = { bindHost: "0.0.0.0", maxConnections: 100, enableSsl: true };
const serverXml = xml`<server ${config}/>`;
// → '<server bind-host="0.0.0.0" max-connections="100" enable-ssl="true"/>'

// CDATA sections for unescaped content
const rssItem = xml`
  <item>
    <title>${title}</title>
    <description>${cdata(htmlContent)}</description>
  </item>
`;

// Complex document structures
const feedXml = xml`
  <rss version="2.0">
    <channel>
      <title>${feedTitle}</title>
      ${articles.map(
        (article) => xml`
        <item>
          <title>${article.title}</title>
          <description>${cdata(article.content)}</description>
        </item>
      `
      )}
    </channel>
  </rss>
`;
```

**Value processing features:**

- **Complete entity escaping**: All five XML entities (&, <, >, ", ')
- **Object attributes**: camelCase → kebab-case conversion
- **Array flattening**: Recursive processing with space separation
- **CDATA protection**: Automatic termination sequence handling

## Advanced Features

Beyond core XML generation, Beak XML provides **progressive generators**—specialized functions that scale from basic feeds to enterprise content ecosystems. Each generator follows the same pattern: start simple, unlock complexity as needed.

### Progressive Feed Generation

**RSS/Atom feed generator with multi-format support:**

```javascript
// Tier 1: Basic feed structure
feed({
  title: 'My Blog',
  description: 'Latest posts',
  link: 'https://blog.example.com',
  items: [
    { title: 'First Post', url: '/posts/first' },
    { title: 'Second Post', url: '/posts/second' }
  ]
});

// Tier 2: Content enrichment
feed({
  title: 'My Blog',
  description: 'Latest posts',
  link: 'https://blog.example.com',
  author: { name: 'Jane Author', email: 'jane@example.com' },
  items: [{
    title: 'Advanced Post',
    url: '/posts/advanced',
    summary: 'Brief description',
    content: '<p>Full HTML content</p>',
    date: '2024-01-15T10:00:00Z',
    categories: ['javascript', 'webdev']
  }]
});

// Tier 3: Multi-format support
feed({ format: 'atom', /* ... */ }); // Atom 1.0 format

// Tier 4: Enterprise media support
feed({
  title: 'Podcast Feed',
  items: [{
    title: 'Episode 1',
    enclosure: {
      url: 'https://cdn.example.com/ep1.mp3',
      type: 'audio/mpeg',
      length: 12345678
    }
  }]
});
```

### Progressive Sitemap Generation

**XML sitemap generator with SEO optimization:**

```javascript
// Tier 1: Basic sitemap
sitemap({
  domain: 'example.com',
  pages: ['/', '/about', '/contact', '/blog']
});

// Tier 2: SEO optimization
sitemap({
  domain: 'example.com',
  pages: [
    { path: '/', priority: 1.0, changefreq: 'daily' },
    { path: '/blog', priority: 0.8, changefreq: 'weekly' },
    { path: '/about', priority: 0.5, changefreq: 'monthly' }
  ]
});

// Tier 3: Advanced SEO with lastmod
sitemap({
  domain: 'example.com',
  pages: [{
    path: '/premium-article',
    priority: 0.9,
    changefreq: 'weekly',
    lastmod: '2024-01-15T10:00:00Z'
  }]
});
```

### Advanced Composition

**Generate complete content ecosystems:**

```javascript
// Blog with RSS feed and sitemap
const blogSystem = (posts) => ({
  rss: feed({
    title: 'My Technical Blog',
    description: 'Deep dives into web development',
    link: 'https://blog.example.com',
    items: posts.map(post => ({
      title: post.title,
      url: `https://blog.example.com${post.slug}`,
      summary: post.excerpt,
      content: post.content,
      date: post.publishedAt,
      categories: post.tags
    }))
  }),

  sitemap: sitemap({
    domain: 'blog.example.com',
    pages: [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      ...posts.map(post => ({
        path: post.slug,
        priority: 0.8,
        changefreq: 'weekly',
        lastmod: post.updatedAt
      }))
    ]
  })
});
```

## Performance

Template processing optimized through **four-tiered algorithms** based on interpolation count:

- **0 interpolations**: Direct string return with conditional trim
- **1 interpolation**: String concatenation (fastest path)
- **2-3 interpolations**: StringBuilder pattern (optimal for few values)
- **4+ interpolations**: Pre-sized array join (scales with many values)

Additional optimizations:

- **WeakMap caching**: Unique templates cached as specialized functions
- **Character-level escaping**: Fast path optimization with regex probing
- **Monomorphic processing**: V8-optimized value handling paths
- **Conditional trimming**: Whitespace processing only when needed

## Requirements

- **Node.js:** 22.5+ (leverages latest platform primitives)
- **Browsers:** ES2020+ (modern baseline, no legacy compromise)
- **Dependencies:** Absolutely zero

## The Raven's XML

Like a raven that meticulously constructs intricate nests with precise material placement, Beak XML assembles well-formed documents with surgical accuracy. Every entity escaped, every attribute properly formatted, every structure validated.

From basic XML generation to enterprise content ecosystems, Beak XML embodies the raven's cunning: **progressive enhancement** that scales from simple documents to sophisticated feed and sitemap generation. Each generator auto-detects content types, unlocks sophisticated features through configuration tiers, and composes seamlessly into complete content management systems.

The package remembers XML's ecosystem failures—malformed feeds, invalid sitemaps, escaping vulnerabilities—and builds systems that endure through **platform mastery, zero dependencies, and algorithmic solutions over patches.**

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
