# Beak SEO

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-ravenjs.dev%2Fbeak-blue.svg)](https://docs.ravenjs.dev/beak)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

**SEO meta tag generators for social media platforms and search engines.** Open Graph, Twitter Cards, canonical URLs, robots directives, and structured data with platform-specific optimization.

## Purpose

SEO meta tag generation requires understanding platform-specific requirements, proper attribute formatting, and consistent URL construction. Manual HTML building leads to missing attributes, incorrect formats, and cross-platform compatibility issues.

Beak SEO provides comprehensive meta tag generation with dual name/property attributes for maximum platform compatibility. Automatic URL construction, consistent attribute formatting, and platform-optimized output ensure reliable social media sharing and search engine indexing.

Functions cover all major platforms: Open Graph, Twitter Cards, LinkedIn, Pinterest, Discord, plus essential SEO elements like canonical URLs, robots directives, and structured data.

## Installation

```bash
npm install @raven-js/beak
```

## Usage

Import SEO functions and use them for meta tag generation:

```javascript
import {
  openGraph,
  twitter,
  canonical,
  robots,
  general,
} from "@raven-js/beak/seo";

// Open Graph meta tags for social media sharing
const ogTags = openGraph({
  title: "Page Title",
  description: "Page description",
  domain: "example.com",
  path: "/article",
  imageUrl: "/og-image.jpg",
  type: "article",
});
// → '<meta name="og:type" property="og:type" content="article">...'

// Twitter Card optimization
const twitterTags = twitter({
  title: "Article Title",
  description: "Article description",
  domain: "example.com",
  imageUrl: "/twitter-card.jpg",
  cardType: "summary_large_image",
});

// Essential SEO elements
const seoTags = general({
  title: "Page Title",
  description: "Page description",
  domain: "example.com",
  path: "/page",
  suffix: "Site Name",
});

// Search engine directives
const robotsTags = robots({
  index: true,
  follow: true,
});

// Canonical URL for duplicate content prevention
const canonicalTag = canonical({
  domain: "example.com",
  path: "/canonical-page",
});
```

**Platform coverage:**

- **Open Graph**: Facebook, LinkedIn, general social sharing
- **Twitter Cards**: Twitter-optimized sharing
- **General SEO**: Title, description, canonical URLs
- **Robots**: Search engine crawling control
- **Author**: Content attribution
- **Discord/Pinterest**: Platform-specific optimizations

**Features:**

- **Dual attributes**: Both `name` and `property` for compatibility
- **URL construction**: Automatic absolute URL generation
- **Image optimization**: Proper image URL handling
- **Type safety**: Consistent attribute formatting

## Platform Integration

Each function generates platform-optimized HTML with maximum compatibility:

```javascript
// Complete page head setup
const headContent = `
  ${general({
    title: "My Article",
    description: "Article description",
    domain: "blog.com",
    path: "/article",
  })}
  ${openGraph({
    title: "My Article",
    description: "Article description",
    domain: "blog.com",
    path: "/article",
    imageUrl: "/image.jpg",
  })}
  ${twitter({
    title: "My Article",
    description: "Article description",
    domain: "blog.com",
    imageUrl: "/image.jpg",
    cardType: "summary_large_image",
  })}
  ${canonical({ domain: "blog.com", path: "/article" })}
  ${robots({ index: true, follow: true })}
`;
```

## Requirements

- **Node.js:** 22.5+ (leverages latest platform primitives)
- **Browsers:** ES2020+ (modern baseline, no legacy compromise)
- **Dependencies:** Absolutely zero

## The Raven's SEO

Like a raven that strategically marks territory for maximum visibility and recognition, Beak SEO optimizes content presentation across all digital platforms. Surgical precision in meta tag generation ensures maximum reach without compatibility compromises.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
