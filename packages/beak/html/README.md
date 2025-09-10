# Beak HTML

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-ravenjs.dev%2Fbeak-blue.svg)](https://docs.ravenjs.dev/beak)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

**HTML template literals with XSS protection, performance optimization, and progressive SEO generators.** Automatic escaping, event binding, WeakMap-cached template compilation, plus specialized generators that scale from basic to enterprise-grade meta tag management.

## Purpose

HTML generation requires balancing performance with security. String concatenation is fast but vulnerable to XSS attacks. Template engines add build complexity and runtime overhead. Manual escaping is error-prone and tedious.

Beak HTML provides both secure and unsafe paths with identical syntax. Use `html()` for trusted content with maximum performance, or `safeHtml()` for user input with automatic XSS protection. Templates compile to specialized functions cached by signature for consistent performance.

Event handlers bind transparently without manual registration, enabling isomorphic components that work in both server and browser environments.

Beyond core HTML generation, Beak HTML includes **progressive SEO generators**—specialized functions that scale from basic meta tags to enterprise-grade SEO management. Each generator follows a consistent pattern: start simple, unlock sophisticated markup through configuration tiers, auto-detect content types, and compose seamlessly with core HTML generation.

## Installation

```bash
npm install @raven-js/beak
```

## Usage

Import HTML functions and use them as tagged template literals:

```javascript
import {
  html, safeHtml, escapeHtml,
  author, canonical, openGraph,
  robots, twitter
} from "@raven-js/beak/html";

// Core HTML generation - trusted content, maximum performance
const navigation = html`
  <nav class="${isActive ? "active" : "inactive"}" onclick=${handleClick}>
    ${menuItems.map((item) => html`<a href="${item.href}">${item.label}</a>`)}
  </nav>
`;

// Core HTML generation - untrusted content, automatic XSS protection
const userComment = safeHtml`
  <div class="comment">
    <h3>${author.name}</h3>
    <p>${userInput}</p>
  </div>
`;

// Manual escaping when needed
const escaped = escapeHtml('<script>alert("xss")</script>');
// → "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
```

## Advanced Features

Beyond core HTML generation, Beak HTML provides **progressive snippet generators**—specialized functions that scale from basic implementation to enterprise-grade SEO management. Each generator follows the same pattern: start simple, unlock complexity as needed.

### SEO & Meta Tag Generators

**Progressive Enhancement Pattern:**

Each generator auto-detects content type and unlocks sophisticated markup through configuration tiers:

#### Author Attribution (4 Tiers)

```javascript
// Tier 1: Basic attribution
author({ name: 'Anonyfox' });

// Tier 2: Professional identity
author({
  name: 'Anonyfox',
  email: 'max@anonyfox.com',
  jobTitle: 'Senior Developer',
  organization: 'RavenJS'
});

// Tier 3: Social verification
author({
  name: 'Anonyfox',
  profiles: {
    github: 'https://github.com/Anonyfox',
    twitter: 'https://twitter.com/anonyfox'
  }
});

// Tier 4: Rich profile + structured data
author({
  name: 'Anonyfox',
  photo: '/images/authors/anonyfox.jpg',
  bio: 'Creator of zero-dependency toolkit',
  credentials: ['Google Developer Expert']
});
```

#### Canonical URLs (4 Tiers)

```javascript
// Tier 1: Basic canonical
canonical({ domain: 'example.com', path: '/article' });

// Tier 2: Device variants
canonical({
  domain: 'example.com',
  path: '/article',
  variants: {
    mobile: '/mobile/article',
    amp: '/amp/article'
  }
});

// Tier 3: International SEO
canonical({
  domain: 'example.com',
  path: '/article',
  languages: {
    'en-US': '/article',
    'es-ES': '/articulo',
    'fr-FR': '/article-fr'
  }
});

// Tier 4: Enterprise syndication
canonical({
  domain: 'example.com',
  strategy: {
    paginated: { prev: '/page/1', next: '/page/3' },
    syndicated: ['https://medium.com/@user/article']
  }
});
```

#### Open Graph (4 Tiers)

```javascript
// Tier 1: Core metadata
openGraph({
  title: 'My Article',
  description: 'Learn something incredible',
  image: '/hero.jpg'
});

// Tier 2: Content specialization
openGraph({
  title: 'My Article',
  description: 'Learn something incredible',
  article: {
    authors: ['Jane Author'],
    publishedTime: '2024-01-15T10:00:00Z',
    tags: ['javascript', 'performance']
  }
});

// Tier 3: Rich media + localization
openGraph({
  title: 'Product Demo',
  description: 'See it in action',
  video: {
    url: '/demo.mp4',
    type: 'video/mp4',
    width: 1920,
    height: 1080
  },
  locale: 'en_US',
  fbAppId: '123456789'
});

// Tier 4: Enterprise analytics
openGraph({
  title: 'Premium Article',
  analytics: {
    pixelId: '987654321',
    conversionGoals: ['Purchase', 'Subscribe']
  }
});
```

### Advanced Composition

**Compose generators into complete head sections:**

```javascript
const generateHead = (pageData) => html`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${pageData.title}</title>

    ${canonical(pageData.canonical)}
    ${openGraph(pageData.og)}
    ${twitter(pageData.twitter)}
    ${author(pageData.author)}
    ${robots(pageData.robots)}

    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    ${pageData.content}
  </body>
  </html>
`;
```

**Zero-config intelligent defaults:**

```javascript
// Auto-detects content type from URL patterns
const headMarkup = html`
  ${canonical({ domain: 'blog.example.com', path: '/posts/my-article' })}
  ${openGraph({
    domain: 'blog.example.com',
    url: '/posts/my-article',
    title: 'My Technical Article',
    description: 'Deep dive into performance optimization'
  })}
`;

// Generates: article-specific Open Graph + canonical with auto-detected types
```

### Complete Examples

**Blog Post Head:**

```javascript
const blogPostHead = (post) => html`
  <head>
    <meta charset="utf-8">
    <title>${post.title}</title>

    ${canonical({
      domain: 'blog.example.com',
      path: post.slug,
      variants: { amp: `/amp${post.slug}` }
    })}

    ${openGraph({
      domain: 'blog.example.com',
      url: post.slug,
      title: post.title,
      description: post.excerpt,
      image: post.heroImage,
      article: {
        authors: [post.author.name],
        publishedTime: post.publishedAt,
        section: post.category,
        tags: post.tags
      }
    })}

    ${author(post.author)}
    ${robots({ maxSnippet: 160, maxImagePreview: 'large' })}
  </head>
`;
```

**Security model:**

- **html()**: No escaping - use only with sanitized data
- **safeHtml()**: Character-level escaping, protocol blocking, circular reference protection
- **escapeHtml()**: Manual escaping with fast path optimization

**Event binding:**

```javascript
const PostCard = (post) => html`
  <article onclick=${() => selectPost(post.id)}>
    <h2>${post.title}</h2>
  </article>
`;
```

Functions automatically bind to global scope in browser environments for seamless event handling.

## Performance

Measured performance on modern V8:

| Operation            | Time    | Comparison                    |
| -------------------- | ------- | ----------------------------- |
| html() template      | 0.337μs | Baseline                      |
| safeHtml() template  | ~1.0μs  | 3x slower (security overhead) |
| Manual concatenation | 0.280μs | 17% faster                    |

Template caching via WeakMap eliminates compilation overhead for repeated usage. Monomorphic value processing optimizes for V8 JIT compilation. Simply put: yes its fast, competitive within the best
template engines in Javascript land (see the [benchmark](../../../examples/renderer-benchmark/BENCHMARK.md)).

## Requirements

- **Node.js:** 22.5+ (leverages latest platform primitives)
- **Browsers:** ES2020+ (modern baseline, no legacy compromise)
- **Dependencies:** Absolutely zero

## The Raven's HTML

Like a raven that swiftly constructs complex structures from available materials, Beak HTML assembles dynamic templates with surgical precision. Automatic event binding and security protection ensure reliable construction without manual intervention.

From basic HTML generation to enterprise-grade SEO management, Beak HTML embodies the raven's cunning: **progressive enhancement** that scales from simple markup to sophisticated meta tag ecosystems. Each generator auto-detects content types, unlocks sophisticated features through configuration tiers, and composes seamlessly into complete web applications.

The package remembers JavaScript's ecosystem failures—Angular migrations, left-pad catastrophes, framework betrayals—and builds systems that endure through **platform mastery, zero dependencies, and algorithmic solutions over patches.**

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
