# Beak: JSX-like Templates Without The Weight

<div align="center">

<img src="logo.webp" alt="Beak Logo" width="200" height="200" />

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![Bundle Size](https://img.shields.io/badge/Bundle-4.2KB-blue.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

**The smallest, fastest tagged template engine.** JSX-like syntax with platform-native speed.

</div>

## Why Beak Wins

**Zero build dependency.** Edit template, refresh browser. No compilation lag, no toolchain complexity.

**Smallest possible bundle.** 4.2KB minified+gzipped vs 201KB (Pug), 38KB (Handlebars), 25KB (Liquid). [48x smaller than alternatives](../../examples/renderer-benchmark).

**Complete JavaScript runtime access.** Call `fetch()`, `crypto`, any ES module directly in templates. No helper registration ceremony.

**Native debugging.** Stack traces point to your actual template code with line numbers. Full IDE breakpoint support.

**Platform-native performance.** Template literals optimized by V8 engine automatically. No string compilation overhead.

**Dependency-free immortality.** Zero external dependencies mean zero supply chain attacks, zero abandoned maintainers, zero breaking changes.

## Install

```bash
npm install @raven-js/beak
```

## Templates That Just Work

```javascript
import { html, css, md, sh, sql } from "@raven-js/beak";

// JSX-like HTML without React overhead
const page = html`
  <div class="${isActive ? "active" : "inactive"}">
    <h1>${title}</h1>
    ${items.map((item) => html`<li>${item.name}</li>`)}
  </div>
`;

// CSS with object-to-kebab-case magic
const styles = css`
  .card {
    ${{ fontSize: "16px", borderRadius: [4, 8] }}px;
    color: ${theme.primary};
  }
`;

// GitHub Flavored Markdown in 4KB
const doc = md`
  # ${title}
  ${posts.map((post) => `- [${post.title}](${post.url})`).join("\n")}
`;

// Shell commands with array joining
const cmd = sh`docker run ${flags} -v ${volume} ${image}`;

// SQL with injection protection
const query = sql`
  SELECT * FROM users
  WHERE name = '${userName}' AND status = '${status}'
`;
```

## IDE Integration

**VS Code & Cursor plugin available.** Full syntax highlighting, IntelliSense, and autocomplete for all template types. Zero configuration required.

```bash
# Install from VS Code marketplace
ext install ravenjs.beak-templates
```

## Security Built-In

```javascript
// Automatic XSS protection when needed
const safe = safeHtml`<p>User: ${userInput}</p>`;

// Manual escaping available
const escaped = escapeHtml('<script>alert("xss")</script>');
```

## Performance Reality

**Template processing:** 0.68ms complex rendering, 6.28x slower than fastest (doT) but competitive with modern alternatives.

**Bundle impact:** 48x smaller than Pug, 9x smaller than Handlebars, 6x smaller than Liquid.

**Cold starts:** 2.83ms startup overhead - critical for serverless functions.

[Full benchmark comparison →](../../examples/renderer-benchmark/BENCHMARK.md)

## SEO Meta Generation

```javascript
import { openGraph, twitter, robots } from "@raven-js/beak/seo";

// All major platforms covered
const meta = openGraph({
  title: "Page Title",
  description: "Page description",
  domain: "example.com",
  path: "/page",
  imageUrl: "/og-image.jpg",
});
```

## Architecture

**Import strategy optimized for tree-shaking and native ESM:**

```javascript
// Root import: everything (convenience)
import { html, css, md, sql } from "@raven-js/beak";

// Sub-imports: minimal bundles (optimal)
import { html } from "@raven-js/beak/html";
import { openGraph } from "@raven-js/beak/seo";
```

**Core modules:**

| Module  | Purpose                          |
| ------- | -------------------------------- |
| `html/` | XSS protection, normalization    |
| `css/`  | Minification, object→kebab-case  |
| `md/`   | GitHub Flavored Markdown parser  |
| `js/`   | Script tag variations, filtering |
| `sh/`   | Shell command assembly, arrays   |
| `sql/`  | Injection prevention, escaping   |
| `seo/`  | Meta generators, structured data |
| `xml/`  | Well-formed XML with escaping    |

**Zero lookups for native browser imports.** Each sub-export resolves directly without filesystem traversal.

## The RavenJS Advantage

Unlike template engines that solve problems through syntax innovation, Beak eliminates constraints through platform mastery. When V8 optimizes template literals, your templates automatically get faster. When new JavaScript features arrive, use them immediately without transpiler permission.

**Zero framework lock-in.** Deploy to static sites, serverless functions, or traditional servers without code changes.

**Developer velocity over enterprise theater.** Build business logic, not configuration files.

**Surgical bundle optimization.** ESM sub-exports with perfect tree-shaking. Import only what executes.

## Requirements

- **Node.js:** 22.5+ (leverages latest platform primitives)
- **Browsers:** ES2020+ (modern baseline, no legacy compromise)
- **Dependencies:** Absolutely zero

## License

MIT - Copyright (c) 2025 [Anonyfox e.K.](https://anonyfox.com)

---

_Built for developers who've survived multiple framework migrations and value tools that outlast trends._
