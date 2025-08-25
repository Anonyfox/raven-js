# beak/html

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)

**Apex-performance HTML template engine** - tagged templates at 0.337μs per operation.

## Install

```bash
npm install @raven-js/beak
```

## Usage

```js
import { html, safeHtml, escapeHtml } from "@raven-js/beak";

// Trusted content - maximum speed
const page = html`<div class="${className}">${content}</div>`;

// Untrusted content - automatic XSS protection
const userContent = safeHtml`<div>${userInput}</div>`;

// Manual escaping
const escaped = escapeHtml('<script>alert("xss")</script>');
```

## Functions

### `html(strings, ...values)`

Tagged template for **trusted content only**. Zero escaping overhead.

```js
const navigation = html`
  <nav class="${isActive ? "active" : "inactive"}">
    ${menuItems.map((item) => html`<a href="${item.href}">${item.label}</a>`)}
  </nav>
`;
```

**⚠️ Security**: No escaping applied. Use only with sanitized data.

### `safeHtml(strings, ...values)`

Tagged template for **untrusted content**. Automatic XSS protection.

```js
const comment = safeHtml`
  <div class="comment">
    <h3>${author.name}</h3>
    <p>${userComment}</p>
  </div>
`;
```

**Security Features:**

- HTML entity escaping (`<`, `>`, `&`, `"`, `'`)
- Protocol blocking (`javascript:`, `vbscript:`, `data:`)
- Event handler neutralization (`onclick`, `onload`, etc.)
- Circular reference protection (prevents crashes)

**Performance**: ~3x slower than `html()` due to escaping.

### `escapeHtml(str)`

Character-level HTML escaping with XSS protection.

```js
const safe = escapeHtml("User input: <script>alert()</script>");
// → "User input: &lt;script&gt;alert()&lt;/script&gt;"

// Blocks dangerous patterns
escapeHtml("javascript:alert()"); // → "blocked:alert()"
escapeHtml('onclick="evil()"'); // → "blocked-click=&quot;evil()&quot;"
```

## Optimization ⚡

### `compile(templateFunc)` **EXPERIMENTAL**

AST-based template optimization converts tagged templates to string concatenation.

```js
import { compile } from "@raven-js/beak/core/html/compile";

const optimized = compile((data) => html`<div>${data.value}</div>`);
const result = optimized({ value: "fast" });
```

**Status**: Experimental - API may change
**Fallback**: Returns original function on complex cases

## Performance

Measured performance on modern V8:

| Operation            | Time    | Comparison           |
| -------------------- | ------- | -------------------- |
| `html` template      | 0.337μs | Baseline             |
| `safeHtml` template  | ~1.0μs  | 3x slower (security) |
| Manual concatenation | 0.280μs | 17% faster           |

## Architecture

- **Monomorphic paths**: Optimized for V8 type speculation
- **Switch-based escaping**: Branch prediction friendly
- **Minimal allocations**: String concatenation via `+=`
- **Circular detection**: WeakSet prevents infinite loops

## Integration

**Component patterns:**

```js
const PostCard = (post) => html`
  <article class="post ${post.featured ? "featured" : ""}" data-id="${post.id}">
    <h2>${post.title}</h2>
    <div class="content">${safeHtml`${post.userContent}`}</div>
    <footer>
      ${post.tags.map((tag) => html`<span class="tag">${tag}</span>`)}
    </footer>
  </article>
`;
```

**Mixed trust levels:**

```js
const page = html`
  <section class="safe-zone">
    ${staticHeader} ${safeHtml`<div class="user-content">${userInput}</div>`}
  </section>
`;
```

## Requirements

- **Node.js**: 16+ (for performance.now in tests)
- **Import**: ESM only, no CommonJS
- **Types**: JSDoc annotations for TypeScript intellisense

## License

MIT
