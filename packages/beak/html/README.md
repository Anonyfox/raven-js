# beak/html

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)

**Runtime template compilation engine** - WeakMap-cached function generation at 0.337μs per operation.

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

Tagged template compiles to specialized functions per unique template signature. Automatic isomorphic event binding via global function exposure.

```js
const navigation = html`
  <nav class="${isActive ? "active" : "inactive"}" onclick=${handleClick}>
    ${menuItems.map((item) => html`<a href="${item.href}">${item.label}</a>`)}
  </nav>
`;
```

**Performance**: Zero escaping overhead, variadic/array-indexed specialization for V8 optimization.
**⚠️ Security**: No escaping applied. Use only with sanitized data.

### `safeHtml(strings, ...values)`

WeakSet-protected processing with character-level escaping and protocol neutralization.

```js
const comment = safeHtml`
  <div class="comment">
    <h3>${author.name}</h3>
    <p>${userComment}</p>
  </div>
`;
```

**Security**: HTML entity escaping, blocks `javascript:`/`vbscript:`/`data:` protocols, neutralizes event handlers, prevents circular reference crashes.

**Performance**: ~3x slower than `html()` due to escaping overhead.

### `escapeHtml(str)`

Hybrid escaping with zero-cost fast path - regex probe first, character-level processing only when needed.

```js
const safe = escapeHtml("User input: <script>alert()</script>");
// → "User input: &lt;script&gt;alert()&lt;/script&gt;"

// Protocol/event neutralization
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

- **WeakMap template caching**: Unique templates compile once to specialized functions
- **Monomorphic value processing**: V8-optimized type paths with fast/slow specialization
- **String concatenation via `+=`**: Zero-allocation approach for V8 optimization
- **Hoisted regex constants**: Prevent per-call allocation overhead

## Integration

**Isomorphic components with automatic event binding:**

```js
const PostCard = (post) => html`
  <article
    class="post ${post.featured ? "featured" : ""}"
    data-id="${post.id}"
    onclick=${() => selectPost(post.id)}
  >
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
