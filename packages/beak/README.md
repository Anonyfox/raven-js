# Beak: Zero-Dependency Template Literals

[![Website](https://img.shields.io/badge/website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)
[![ESM](https://img.shields.io/badge/ESM-Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

Tagged template literals for HTML, CSS, JavaScript, SQL, Markdown + SEO meta generators. Near string-concatenation performance.

**Zero dependencies. Zero transpilation. Zero framework lock-in.**

## Install

```bash
npm install @raven-js/beak
```

## API

### HTML

```javascript
import { html, safeHtml, escapeHtml } from "@raven-js/beak";

// Trusted content - no escaping
const page = html`<h1>${title}</h1>
  ${items.map((x) => html`<li>${x}</li>`)}`;

// Untrusted content - XSS protection
const safe = safeHtml`<p>User: ${userInput}</p>`;

// Manual escaping
const escaped = escapeHtml('<script>alert("xss")</script>');
```

**Behavior:**

- Arrays flatten: `[1,2,3]` → `"123"`
- Zero preserved: `${0}` → `"0"`
- Falsy filtered: `${null}` → `""`
- Whitespace normalized between tags

### CSS

```javascript
import { css, style } from "@raven-js/beak";

// Template with objects and arrays
const styles = css`
  .btn {
    ${{ fontSize: "16px", margin: [10, 20] }}px;
    color: ${isDark ? "#fff" : "#000"};
  }
`;

// Wrapped in <style> tags
const inlined = style`${styles}`;
```

**Processing:**

- Objects: camelCase → kebab-case
- Arrays: space-separated flattening
- Single-line minification

### JavaScript

```javascript
import { js, script, scriptAsync, scriptDefer } from "@raven-js/beak";

// Template processing
const code = js`const ${varName} = ${value};`;

// Script tag variations
const inline = script`window.config = ${config};`;
const deferred = scriptDefer`document.focus();`;
const async = scriptAsync`fetch('/track', { body: ${data} });`;
```

### SQL

```javascript
import { sql } from "@raven-js/beak";

const query = sql`SELECT * FROM users WHERE name = '${input}' AND status = '${status}'`;
```

**Security:** Escapes `'` → `''`, `\` → `\\`, newlines, null bytes. Prevents string literal breakouts. **Use parameterized queries for complete protection.**

### Markdown

```javascript
import { md } from "@raven-js/beak";

const doc = md`
  # ${title}

  ${items.map((item) => `- ${item}`).join("\n")}

  Visit [our site](${url}) for more.
`;
```

**Features:** GitHub Flavored Markdown with tables, task lists, strikethrough, autolinks. Deterministic O(n) parsing.

### SEO

```javascript
import {
  general,
  social,
  openGraph,
  twitter,
  pinterest,
  linkedin,
  discord,
  robots,
  author,
  canonical,
} from "@raven-js/beak/seo";

// Basic SEO
const basic = general({
  title: "Page Title",
  description: "Page description",
  domain: "example.com",
  path: "/page",
});

// All social platforms
const socialTags = social({
  title: "Page Title",
  description: "Page description",
  domain: "example.com",
  path: "/page",
  imageUrl: "/image.jpg",
});

// Individual platforms
const og = openGraph({
  title,
  description,
  domain,
  path,
  imageUrl,
  type: "article",
});
const tw = twitter({
  title,
  description,
  domain,
  imageUrl,
  cardType: "summary_large_image",
});
```

## Performance

**Template processing:** 4 execution paths by interpolation count (0, 1, 2-3, 4+) with pre-allocated arrays.

**CSS minification:** Single-pass regex normalization.

**Markdown parsing:** O(n) time complexity, deterministic output.

## Architecture

```
core/
├── css/     # CSS processing: minification, object→kebab-case
├── html/    # HTML rendering: escaping, normalization
├── js/      # JavaScript: value filtering, script tags
├── sql/     # SQL: character escaping, injection prevention
└── md/      # Markdown: GitHub Flavored Markdown parser

seo/         # Meta tag generators for all social platforms
```

## Security

```javascript
// XSS prevention
const unsafe = html`<p>${userInput}</p>`; // ❌ Vulnerable
const safe = safeHtml`<p>${userInput}</p>`; // ✅ Escaped

// SQL injection
const query = sql`SELECT * WHERE name = '${userName}'`; // ✅ Basic escaping
const stmt = db.prepare("SELECT * WHERE name = ?"); // ✅ Complete protection
```

## Requirements

- **Node.js:** 22.5+
- **Browsers:** ES2020+ support
- **Dependencies:** Zero

## License

MIT - Copyright (c) 2025 Anonyfox e.K.
