# Beak Core

[![Website](https://img.shields.io/badge/website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![npm version](https://img.shields.io/npm/v/@raven-js/beak.svg)](https://www.npmjs.com/package/@raven-js/beak)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

Zero-dependency template literals: HTML, CSS, JavaScript, SQL, Markdown. Near string-concatenation performance.

## Performance

- Multiple execution paths by interpolation count (0, 1, 2-3, 4+)
- Pre-allocated arrays eliminate string concatenation overhead
- Pre-compiled regex patterns
- Template result caching
- V8 JIT optimization via extracted validation functions

## API

### HTML

```javascript
import { html, safeHtml } from "@raven-js/beak";

const page = html`<h1>${title}</h1>
  ${items.map((item) => html`<li>${item}</li>`)}`;
const safe = safeHtml`<p>User: ${userInput}</p>`; // XSS protection
```

- Arrays flatten: `[1,2,3]` → `"123"`
- Zero preserved: `${0}` → `"0"`
- Whitespace normalized between tags

### CSS

```javascript
import { css, style } from "@raven-js/beak";

const styles = css`
  .btn {
    ${{ fontSize: "16px" }} margin: ${[10, 20]}px;
  }
`;
const wrapped = style`.theme { color: ${isDark ? "#fff" : "#000"}; }`;
```

- Objects: camelCase → kebab-case
- Arrays flatten: `[10, 20]` → `"10 20"`
- Single-line minification

### JavaScript

```javascript
import { js, script, scriptAsync, scriptDefer } from "@raven-js/beak";

const code = js`const ${varName} = ${value};`;
const inline = script`window.config = ${config};`;
const deferred = scriptDefer`document.focus();`;
const async = scriptAsync`fetch('/track', { body: ${data} });`;
```

- Preserves 0, excludes falsy
- Execution paths by interpolation count

### SQL

```javascript
import { sql } from "@raven-js/beak";

const query = sql`SELECT * FROM users WHERE name = '${input}' AND status = '${status}'`;
```

- Escapes: `'` → `''`, `\` → `\\`, newlines, null bytes
- **Prevents:** String literal breakouts, binary injection
- **Does NOT prevent:** Logical injection patterns
- **Use parameterized queries for complete protection**

### Markdown

```javascript
import { md } from "@raven-js/beak";

const doc = md`# ${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
```

- GitHub Flavored Markdown: tables, task lists, strikethrough, autolinks
- Deterministic: same input → same output
- O(n) parsing time

## Architecture

```
core/
├── css/              # CSS processing: minification, object notation
├── html/             # HTML rendering: escaping, normalization
├── js/               # JavaScript: value filtering, script tags
├── sql/              # SQL: character escaping, injection prevention
└── md/               # Markdown: parsing, AST, HTML transformation
```

**Performance paths:**

- 0 values: direct string return
- 1 value: optimized concatenation
- 2-3 values: StringBuilder pattern
- 4+ values: pre-allocated arrays

## Types

JSDoc types enable IDE integration. TypeScript compatibility via `.d.ts` exports.

## Patterns

```javascript
// Component composition
const Card = ({ title, content, actions = [] }) => html`
  <div class="card">
    <h3>${title}</h3>
    <p>${content}</p>
    ${actions.length
      ? html`<div>${actions.map((action) => Button(action))}</div>`
      : ""}
  </div>
`;

// Style co-location
const Button = ({ text, variant = "primary" }) => html`
  ${style`.btn-${variant} { background: #007bff; }`}
  <button class="btn-${variant}">${text}</button>
`;

// Multi-language generation
const generateAPI = (config) => ({
  sql: sql`CREATE TABLE ${config.table} (${config.fields.join(", ")});`,
  js: script`window.CONFIG = ${JSON.stringify(config)};`,
  html: html`<div data-config="${config.id}">${config.content}</div>`,
});
```

## Security

```javascript
// XSS protection
const unsafe = html`<p>${userInput}</p>`; // ❌ Vulnerable
const safe = safeHtml`<p>${userInput}</p>`; // ✅ Escaped

// SQL injection
const query = sql`SELECT * WHERE name = '${userName}'`; // ✅ Basic escaping
const stmt = db.prepare("SELECT * WHERE name = ?"); // ✅ Complete protection
```

## Benchmarks

Node.js 22+ with V8 optimization:

- Template processing: 100K ops in ~15ms
- CSS minification: 300KB in ~7ms
- HTML rendering: 50K templates in ~8ms
- Markdown parsing: 100KB in ~12ms

---

**Predatory performance. Surgical precision.**
