# Beak

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-ravenjs.dev%2Fbeak-blue.svg)](https://docs.ravenjs.dev/beak)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

<div align="center">
  <img src="./media/logo.webp" alt="Beak Logo" width="200" height="200" />
</div>

**Zero-dependency template engine for modern JavaScript.** Tagged template literals for HTML, CSS, SQL, XML, and Markdown with platform-native performance.

## Purpose

Template engines add build complexity, runtime overhead, and vendor lock-in to solve problems that JavaScript template literals already handle efficiently. Most engines compile templates into string concatenation—exactly what template literals provide natively.

Beak eliminates the middleman. Write templates using native JavaScript syntax, get V8-optimized performance, and deploy anywhere without transpilation. Zero external dependencies prevent supply chain attacks and breaking changes from abandoned maintainers.

When your templates are JavaScript, they evolve with the platform instead of waiting for tool updates.

## Installation

```bash
npm install @raven-js/beak
```

## Usage

Import template functions and use them as tagged template literals:

```javascript
import { html, css, md, sh, sql } from "@raven-js/beak";

// HTML with XSS protection and array flattening
const page = html`
  <div class="${isActive ? "active" : "inactive"}">
    <h1>${title}</h1>
    ${items.map((item) => html`<li>${item.name}</li>`)}
  </div>
`;

// CSS with object-to-kebab-case conversion
const styles = css`
  .card {
    ${{ fontSize: "16px", borderRadius: [4, 8] }}px;
    color: ${theme.primary};
  }
`;

// SQL with automatic character escaping
const query = sql`
  SELECT * FROM users
  WHERE name = '${userName}' AND status = '${status}'
`;
```

**Security options for untrusted content:**

```javascript
// Automatic XSS protection
const safe = safeHtml`<p>User: ${userInput}</p>`;

// Manual escaping when needed
const escaped = escapeHtml('<script>alert("xss")</script>');
```

**Tree-shaking with sub-imports:**

```javascript
// Import only what you need
import { html } from "@raven-js/beak/html";
import { openGraph } from "@raven-js/beak/seo";
```

## IDE Integration

VS Code and Cursor plugin provides syntax highlighting and IntelliSense for all template types:

```bash
ext install ravenjs.beak-templates
```

Zero configuration required. Templates get full IDE support with automatic completion and error detection.

## SEO Integration

Generate platform-optimized meta tags for social media and search engines:

```javascript
import { openGraph, twitter, robots } from "@raven-js/beak/seo";

const meta = openGraph({
  title: "Page Title",
  description: "Page description",
  domain: "example.com",
  path: "/page",
  imageUrl: "/og-image.jpg",
});
```

Covers Open Graph, Twitter Cards, canonical URLs, robots directives, and structured data with dual name/property attributes for maximum compatibility.

## Architecture

**Core template processors:**

| Module  | Purpose                          |
| ------- | -------------------------------- |
| `html/` | XSS protection, event binding    |
| `css/`  | Minification, object transforms  |
| `md/`   | GitHub Flavored Markdown         |
| `js/`   | Script tag variants, filtering   |
| `sh/`   | Shell command assembly           |
| `sql/`  | Injection prevention             |
| `seo/`  | Meta generators, structured data |
| `xml/`  | Well-formed XML with escaping    |

**Performance optimization:**

Template processing uses tiered algorithms based on interpolation count: direct string return (0 values), concatenation (1 value), StringBuilder (2-3 values), pre-sized arrays (4+ values). Conditional whitespace trimming avoids unnecessary work.

**Import strategy:**

ESM sub-exports enable precise tree-shaking. Each module resolves directly without filesystem traversal, optimizing for both bundle size and runtime performance.

## Requirements

- **Node.js:** 22.5+ (leverages latest platform primitives)
- **Browsers:** ES2020+ (modern baseline, no legacy compromise)
- **Dependencies:** Absolutely zero

## The Raven's Beak

A raven's beak is surgically precise—built for extracting maximum value with minimal effort. Like the raven that efficiently processes complex materials into digestible forms, Beak transforms raw template strings into optimized output without unnecessary overhead.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
