# Beak HTML

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-ravenjs.dev%2Fbeak-blue.svg)](https://docs.ravenjs.dev/beak)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

**HTML template literals with XSS protection and performance optimization.** Automatic escaping, event binding, and WeakMap-cached template compilation.

## Purpose

HTML generation requires balancing performance with security. String concatenation is fast but vulnerable to XSS attacks. Template engines add build complexity and runtime overhead. Manual escaping is error-prone and tedious.

Beak HTML provides both secure and unsafe paths with identical syntax. Use `html()` for trusted content with maximum performance, or `safeHtml()` for user input with automatic XSS protection. Templates compile to specialized functions cached by signature for consistent performance.

Event handlers bind transparently without manual registration, enabling isomorphic components that work in both server and browser environments.

## Installation

```bash
npm install @raven-js/beak
```

## Usage

Import HTML functions and use them as tagged template literals:

```javascript
import { html, safeHtml, escapeHtml } from "@raven-js/beak/html";

// Trusted content - maximum performance
const navigation = html`
  <nav class="${isActive ? "active" : "inactive"}" onclick=${handleClick}>
    ${menuItems.map((item) => html`<a href="${item.href}">${item.label}</a>`)}
  </nav>
`;

// Untrusted content - automatic XSS protection
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

Template caching via WeakMap eliminates compilation overhead for repeated usage. Monomorphic value processing optimizes for V8 JIT compilation.

## Requirements

- **Node.js:** 22.5+ (leverages latest platform primitives)
- **Browsers:** ES2020+ (modern baseline, no legacy compromise)
- **Dependencies:** Absolutely zero

## The Raven's HTML

Like a raven that swiftly constructs complex structures from available materials, Beak HTML assembles dynamic templates with surgical precision. Automatic event binding and security protection ensure reliable construction without manual intervention.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
