# 🦜 Beak: Zero-Dependency Templating for Modern JavaScript

_The raven's beak speaks in many tongues - HTML, CSS, SQL, and more. No dependencies, no bloat, just pure templating power._

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/Documentation-Online-blue.svg)](https://docs.ravenjs.dev/beak/)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)
[![ESM](https://img.shields.io/badge/ESM-Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

## What is Beak?

Beak is a **zero-dependency templating library** that leverages JavaScript's tagged template literals to provide powerful, flexible templating for modern web development. It's designed for developers who want the expressiveness of JSX without the framework overhead. Includes built-in SEO meta tag generators for production-ready web apps.

**No dependencies. No transpilation. No bullshit.**

## Critical Advantages for Seasoned Developers

### 🔒 **Zero-Dependency Security**

- **No transitive dependencies** - Eliminates security vulnerabilities from code you didn't write
- **Perfect for regulated environments** - Financial, healthcare, government applications where dependency audits are critical
- **Predictable builds** - No surprise updates or breaking changes from external packages
- **Compliance-friendly** - No dependency hell or security messes

### ⚡ **Native JavaScript Performance**

- **Template literal optimization** - Uses JavaScript's native tagged template literals with performance optimizations
- **Fast-path handling** - Specialized optimizations for common cases (0 values, 1 value) with pre-allocated arrays
- **String caching** - Intelligent caching of normalized strings for repeated patterns
- **No virtual DOM overhead** - Direct string interpolation, nearly as fast as string concatenation
- **Memory efficient** - Minimal memory footprint with no complex data structures

### 🎯 **Multi-Domain Templating**

- **Unified API** - Single library for HTML, CSS, SQL, Markdown, and JavaScript templating
- **Consistent patterns** - Same interpolation syntax across all domains
- **Cross-domain composition** - Mix HTML, CSS, and JS templates seamlessly
- **Specialized optimizations** - Each template type has domain-specific processing (CSS minification, SQL escaping, etc.)

### 🛡️ **Security-First Design**

- **XSS protection** - `safeHtml` function with automatic HTML entity escaping
- **SQL injection prevention** - Built-in SQL escaping for dynamic queries
- **Trust boundary awareness** - Clear distinction between trusted and untrusted content
- **No eval() or dynamic code execution** - Pure string processing for security

### 🚀 **Modern Ecosystem Integration**

- **ESM-only** - Leverages modern JavaScript module system
- **Tree-shaking friendly** - Import only what you need
- **Bundler agnostic** - Works with webpack, esbuild, Rollup, Vite, etc.
- **No custom loaders needed** - Pure JavaScript, no special bundler configuration

### 🏢 **Enterprise-Ready Features**

- **Comprehensive test coverage** - Extensive testing for correctness across all template types
- **Production optimizations** - Whitespace normalization, array flattening, falsy value handling
- **Component architecture** - Reusable template functions with clear patterns
- **MIT license** - Business-friendly licensing with no vendor lock-in

## Quick Start

```bash
npm install @raven-js/beak
```

```javascript
import { html, css } from "@raven-js/beak";

const styles = css`
  .greeting {
    color: rebeccapurple;
    font-weight: bold;
  }
`;

const Greeting = (name) => html`
  <style>
    ${styles}
  </style>
  <h1 class="greeting">Hello, ${name}!</h1>
`;

console.log(Greeting("Raven"));
// Output: <style>.greeting{color:rebeccapurple;font-weight:bold}</style><h1 class="greeting">Hello, Raven!</h1>
```

## Core Features

### 🎨 HTML Templating

```javascript
import { html, safeHtml } from "@raven-js/beak";

// Basic HTML templating
const user = { name: "Raven", power: 9000 };
const template = html`
  <div>
    ${user.name}'s power level: ${user.power > 9000 ? "OVER 9000!" : user.power}
  </div>
`;

// XSS-safe HTML for untrusted input
const userInput = '<script>alert("nice try")</script>';
const safe = safeHtml`<div>${userInput}</div>`;
// Output: <div>&lt;script&gt;alert("nice try")&lt;/script&gt;</div>
```

### 🎭 CSS-in-JS

```javascript
import { html, css, style } from "@raven-js/beak";

// CSS templating with automatic optimization
const buttonStyles = css`
  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    cursor: pointer;
  }
`;

// Inline styles with style tag
const component = html`
  ${style`${buttonStyles}`}
  <button class="btn">Click me</button>
`;
```

### 💻 JavaScript Snippets

```javascript
import { js, script, scriptDefer, scriptAsync } from "@raven-js/beak";

// JavaScript code generation
const variableName = "count";
const value = 10;
const snippet = js`
  let ${variableName} = ${value};
  console.log(${variableName});
`;

// Script tags with different loading strategies
const normalScript = script`${snippet}`;
const deferredScript = scriptDefer`${snippet}`;
const asyncScript = scriptAsync`${snippet}`;
```

### 📝 Markdown Parsing

```javascript
import { md } from "@raven-js/beak";

const content = md`
  # Welcome to RavenJS

  This is **bold** text and this is _italic_ text.

  - Feature 1
  - Feature 2
  - Feature 3
`;

// Output: <h1>Welcome to RavenJS</h1><p>This is <strong>bold</strong> text...</p>
```

### 🗄️ SQL Query Building

```javascript
import { sql } from "@raven-js/beak";

const tableName = "users";
const userId = 42;
const query = sql`
  SELECT * FROM ${tableName}
  WHERE id = ${userId}
  AND active = true;
`;
```

## Advanced Patterns

### Component Architecture

```javascript
import { html } from "@raven-js/beak";

// Reusable components
const Header = (title) => html`
  <header>
    <h1>${title}</h1>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
`;

const Footer = () => html`
  <footer>© ${new Date().getFullYear()} RavenJS</footer>
`;

// Page composition
const Page = (content) => html`
  ${Header("Welcome to the Nest")}
  <main>${content}</main>
  ${Footer()}
`;
```

### Conditional Rendering & Loops

```javascript
import { html } from "@raven-js/beak";

const todos = ["Build MVP", "Get users", "Profit"];
const isLoggedIn = true;

const template = html`
  <div>
    ${isLoggedIn ? html`<p>Welcome back!</p>` : html`<p>Please log in.</p>`}

    <ul>
      ${todos.map((todo) => html`<li>${todo}</li>`)}
    </ul>
  </div>
`;
```

## API Reference

### Core Exports

```javascript
import {
  // HTML templating
  html,
  safeHtml,
  // CSS templating
  css,
  style,
  // JavaScript templating
  js,
  script,
  scriptDefer,
  scriptAsync,
  // Markdown parsing
  md,
  // SQL query building
  sql,
} from "@raven-js/beak";

// SEO meta tag generation
import {
  general, // Basic SEO tags (title, description, canonical)
  social, // Combined social media tags (Open Graph + Twitter)
  openGraph, // Open Graph meta tags
  twitter, // Twitter Card meta tags
} from "@raven-js/beak/seo";
```

### 🎯 SEO Meta Tag Generation

```javascript
import { general, social, openGraph, twitter } from "@raven-js/beak/seo";

// Basic SEO tags (title, description, canonical)
const basicTags = general({
  title: "My Awesome Page",
  description: "The best page ever created",
  domain: "example.com",
  path: "/awesome-page",
  suffix: "My Site",
});

// Social media tags (Open Graph + Twitter Cards)
const socialTags = social({
  title: "My Awesome Page",
  description: "The best page ever created",
  domain: "example.com",
  path: "/awesome-page",
  imageUrl: "/hero-image.jpg",
});

// Individual social platforms
const ogTags = openGraph({
  title: "My Page",
  description: "Page description",
  domain: "example.com",
  path: "/my-page",
  imageUrl: "/image.jpg",
  type: "article",
});

const twitterTags = twitter({
  title: "My Page",
  description: "Page description",
  domain: "example.com",
  imageUrl: "/image.jpg",
  cardType: "summary_large_image",
});
```

## Requirements

- **Node.js**: 22.5+
- **Browsers**: All modern browsers with ES2020+ support
- **No polyfills needed** - Uses native template literals and modern JS features

## Documentation

📚 [Full API Documentation](https://docs.ravenjs.dev/beak/)

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2025 Anonyfox e.K.

---

_Beak: Because sometimes the best way to speak is to keep it simple._

---

<div align="center">

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**

</div>
