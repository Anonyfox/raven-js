# Parsing (Cortex)

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

Pure, DOM-free HTML parsing utilities: fast text conversion, readability checks, content extraction, and URL/asset discovery. Zero deps, string-only, deterministic.

## Purpose

- **DOM-free**: Stream-style regex tokenization; no jsdom, no browser APIs
- **Fast + deterministic**: O(n) over input slices, stable outputs, no side effects
- **Just-enough knobs**: Base URL normalization, internal/external scoping, dedupe, and safety filters

## Install

```bash
npm install @raven-js/cortex
```

## Usage

```javascript
// Extract core content (title, text, excerpt, images, optional minimal HTML)
import { htmlToContent } from "@raven-js/cortex/parsing";

const article = htmlToContent(html, { html: true });
console.log(article.title);
console.log(article.text);
console.log(article.images);
console.log(article.html); // minimal paragraph HTML when enabled
```

```javascript
// Convert HTML → plaintext with essential knobs
import { htmlToText } from "@raven-js/cortex/parsing";

const text = htmlToText(html, {
  links: "inline",           // 'text' | 'inline' | 'remove'
  images: "alt",             // 'alt' | 'remove'
  collapseWhitespace: true,
  maxNewlines: 2,
  tableCellSeparator: "tab",  // 'tab' | 'space'
});
```

```javascript
// Readability pre-check (boolean) for fast gating
import { isProbablyReadableHtml } from "@raven-js/cortex/parsing";

if (isProbablyReadableHtml(html)) {
  // run heavier extraction only when promising
}
```

```javascript
// URL discovery across links, assets, meta, inline CSS url(...)
import { extractUrlsFromHtml } from "@raven-js/cortex/parsing";

const urls = extractUrlsFromHtml(html, {
  base: "https://example.com",
  scope: "internal",         // 'all' | 'internal' | 'external'
  normalize: true,            // return URL objects
});
```

```javascript
// Anchor links only (navigation/sitemaps)
import { extractLinksFromHtml } from "@raven-js/cortex/parsing";

const links = extractLinksFromHtml(html, {
  base: "https://example.com",
  relFilter: ["nofollow"],
});
```

```javascript
// Categorized assets for prefetch/copy/bundling
import { extractAssetsFromHtml } from "@raven-js/cortex/parsing";

const assets = extractAssetsFromHtml(html, { base: "https://example.com" });
// assets.images, assets.stylesheets, assets.scripts, assets.fonts, assets.media, assets.icons, assets.manifest
```

## Requirements

- Node.js 22.5+
- ESM only ("type": "module")

## The Raven’s Parsing

Ravens learn structures without ceremony—these parsers harvest signal from raw HTML, fast. No DOM, minimal knobs, outputs that downstream systems can trust.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
