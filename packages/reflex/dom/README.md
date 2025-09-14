# Reflex DOM: Reactive Templates & Islands

[![Website](https://img.shields.io/badge/website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-docs.ravenjs.dev/reflex-blue.svg)](https://docs.ravenjs.dev/reflex)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

Mount reactive templates with automatic signal tracking, efficient DOM updates, and islands architecture for selective hydration with optional server-side rendering.

## Purpose

Modern web applications demand instant interactivity without sacrificing initial load performance. Traditional frameworks force a choice: full hydration (slow) or static rendering (non-interactive). Reflex DOM eliminates this tradeoff through surgical reactivity and islands architecture.

Signal reads inside templates automatically trigger DOM updates. No virtual DOM, no diffing algorithms, no framework overhead. Islands enable selective hydration - static HTML with interactive components that load precisely when needed. Server-side rendering with multi-pass stability ensures content appears instantly while maintaining full interactivity.

## Installation

```bash
npm install @raven-js/reflex
```

## Usage

### Reactive Templates

```javascript
import { mount } from "@raven-js/reflex/dom";
import { signal } from "@raven-js/reflex";

// Create reactive state
const count = signal(0);

// Template function reads signals
const Counter = () => `<h1>Count: ${count()}</h1>`;

// Mount to DOM - automatic updates
mount(Counter, "#app");

// Changes trigger DOM updates
count.set(5); // DOM shows "Count: 5"
```

### Islands Architecture

```javascript
import { island, islandSSR } from "@raven-js/reflex/dom";
import { Counter } from "./counter.js";

// Client-only island (synchronous)
const clientIsland = island({
  src: "/apps/counter.js#Counter",
  props: { initial: 0 }
});

// SSR island (asynchronous)
const ssrIsland = await islandSSR({
  src: "/apps/counter.js#Counter",
  ssr: Counter,
  props: { initial: 0 }
});
```

### Server-Side Rendering

```javascript
import { ssr } from "@raven-js/reflex/dom";

// Wrap component for multi-pass rendering
const StableCounter = ssr(async () => {
  const data = await fetch('/api/count');
  const count = await data.json();
  return `<div>Count: ${count}</div>`;
});

// Renders with automatic fetch caching
const html = await StableCounter();
```

## Core Functions

### mount(templateFn, target, options?)

Mount reactive template to DOM with automatic signal tracking and efficient updates.

```javascript
// Basic mounting
const app = mount(() => `<h1>${title()}</h1>`, "#app");

// Async templates
const widget = mount(async () => {
  const data = await fetch('/api/data');
  return `<div>${await data.text()}</div>`;
}, "#widget");

// Manual cleanup
app.unmount();
```

### island(config)

Generate island placeholder for client-side hydration without server rendering.

```javascript
// Basic client-only island
island({
  src: "/apps/counter.js",
  props: { initial: 0 }
});

// With loading strategy
island({
  src: "/apps/widget.js#Widget",
  props: { data: "test" },
  on: "visible"  // Load when scrolled into view
});
```

### islandSSR(config)

Generate island with server-side rendering and hydration metadata. Always asynchronous.

```javascript
// Server-rendered island
await islandSSR({
  src: "/apps/counter.js#Counter",
  ssr: Counter,  // Required SSR function
  props: { initial: 10 }
});

// Parallel rendering for performance
const [nav, content, footer] = await Promise.all([
  islandSSR({ src: "/nav.js", ssr: Nav }),
  islandSSR({ src: "/content.js", ssr: Content }),
  islandSSR({ src: "/footer.js", ssr: Footer })
]);
```

### ssr(fn, options?)

Wrap functions for server-side rendering with multi-pass stability and fetch caching.

```javascript
// Simple component
const Widget = ssr(() => `<div>Static content</div>`);

// Async with fetch caching
const DataWidget = ssr(async () => {
  const res = await fetch('/api/data');
  const data = await res.json();
  return `<div>${data.value}</div>`;
});

// Multi-pass rendering for reactive stability
const ReactiveWidget = ssr(() => {
  const count = signal(0);
  effect(() => {
    if (count() === 0) count.set(1);
  });
  return `<div>Count: ${count()}</div>`;
});
```

### hydrateIslands()

Hydrate all islands on the page with their configured loading strategies.

```javascript
// Auto-hydrate on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", hydrateIslands);
} else {
  hydrateIslands();
}
```

## Loading Strategies

Islands support three loading strategies:

- **`load`** - Immediate hydration (default)
- **`idle`** - When browser is idle via requestIdleCallback
- **`visible`** - When scrolled into viewport via IntersectionObserver

```javascript
// Immediate loading
island({ src: "/critical.js", on: "load" });

// Deferred loading
island({ src: "/analytics.js", on: "idle" });

// Lazy loading
island({ src: "/comments.js", on: "visible" });
```

## Advanced Patterns

### Reactive Composition

```javascript
const todos = signal([]);
const filter = signal("all");

const TodoApp = () => {
  const filtered = todos().filter(t =>
    filter() === "all" || t.status === filter()
  );

  return `
    <div>
      <h1>Todos (${filtered.length})</h1>
      <ul>
        ${filtered.map(t => `<li>${t.text}</li>`).join("")}
      </ul>
    </div>
  `;
};

mount(TodoApp, "#app");
```

### SSR with Hydration

```javascript
// Server route
router.get("/page", async (ctx) => {
  const content = await islandSSR({
    src: "/apps/interactive.js",
    ssr: InteractiveComponent,
    props: { userId: ctx.params.id }
  });

  ctx.html(`
    <!DOCTYPE html>
    <html>
      <body>
        ${content}
        <script type="module">
          import { hydrateIslands } from "@raven-js/reflex/dom";
          hydrateIslands();
        </script>
      </body>
    </html>
  `);
});
```

### Error Boundaries

```javascript
const SafeWidget = ssr(async (props) => {
  try {
    const data = await riskyOperation(props);
    return `<div>${data}</div>`;
  } catch (err) {
    return `<div class="error">Failed to load</div>`;
  }
});

// islandSSR catches component errors automatically
const html = await islandSSR({
  src: "/widget.js",
  ssr: SafeWidget,
  props: {}
}); // Returns island wrapper even if component fails
```

## Performance Characteristics

- **Mount**: O(1) signal subscription, requestAnimationFrame batching
- **Islands**: Zero runtime until hydration trigger
- **SSR**: Multi-pass stabilization, automatic fetch deduplication
- **Memory**: WeakRef tracking, automatic cleanup on unmount

## Requirements

- **Node.js:** 22.5+
- **Browsers:** ES2020+ (Chrome 84+, Firefox 80+, Safari 14+)
- **Dependencies:** Zero

## The Raven's Perch

Like a raven surveying its territory from high above, Reflex DOM maintains perfect awareness of signal changes below. Each update strikes with surgical precision - no wasted motion, no missed opportunities. The raven sees all, reacts instantly, wastes nothing.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
