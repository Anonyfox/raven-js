# Reflex DOM: Automatic Signal Tracking

[![Website](https://img.shields.io/badge/website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-docs.ravenjs.dev/reflex-blue.svg)](https://docs.ravenjs.dev/reflex)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

Mount reactive templates with automatic signal tracking, efficient DOM updates, and islands architecture for selective hydration.

## Installation

```bash
npm install @raven-js/reflex
```

## Usage

```javascript
import { mount } from "@raven-js/reflex/dom";
import { signal } from "@raven-js/reflex";

// Create reactive state
const count = signal(0);

// Template function reads signals
const App = () => `<h1>Count: ${count()}</h1>`;

// Mount to DOM - automatic updates
mount(App, "#app");

// Changes trigger DOM updates
count.set(5); // DOM shows "Count: 5"
```

## API

### mount(templateFn, target, options)

Mount reactive template to DOM element with automatic signal tracking.

- `templateFn: () => string` - Function returning HTML string
- `target: string | Element` - CSS selector or DOM element
- `options: Object` - Optional configuration
- Returns: Mount instance with `unmount()` method

```javascript
// CSS selector (browser only)
const app = mount(App, "#app");

// DOM element
const app = mount(App, document.querySelector("#app"));

// Replace existing content instead of preserving
const app = mount(App, "#app", { replace: true });

// Optional manual cleanup (automatic when element removed)
app.unmount();
```

### island(config)

Generate island placeholder for selective client-side hydration.

- `config.src: string` - Module path with optional export (e.g., `/apps/counter.js#Counter`)
- `config.ssr?: Function` - Server-side render function
- `config.props?: Object` - Initial props object
- `config.on?: 'load'|'idle'|'visible'` - Loading strategy (default: 'load')
- `config.id?: string` - Custom element ID
- Returns: HTML string with island placeholder

```javascript
import { island } from "@raven-js/reflex/dom";
import { Counter } from "./counter.js";

// Basic island
const html = island({
  src: "/apps/counter.js#Counter",
  props: { initial: 0 }
});

// With SSR and loading strategy
const html = island({
  src: "/apps/counter.js#Counter",
  ssr: Counter,           // Render on server
  props: { initial: 10 },
  on: "visible"          // Load when scrolled into view
});
```

### hydrateIslands()

Hydrate all islands on the page with selective loading strategies.

```javascript
import { hydrateIslands } from "@raven-js/reflex/dom";

// Auto-hydrate all islands
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", hydrateIslands);
} else {
  hydrateIslands();
}
```

## Islands Architecture

Islands enable selective hydration - static HTML with interactive components that load on demand.

```javascript
import { island, hydrateIslands } from "@raven-js/reflex/dom";
import { Counter } from "./counter.js";

// Server: Generate static HTML with island placeholders
const page = `
  <h1>My Blog Post</h1>
  <p>Static content loads instantly...</p>

  ${island({
    src: "/apps/counter.js#Counter",
    ssr: Counter,                    // Pre-render on server
    props: { initial: 0 },
    on: "visible"                   // Load when scrolled into view
  })}

  <p>More static content...</p>
`;

// Client: Auto-hydrate islands
hydrateIslands();
```

### Loading Strategies

- **`load`** (default): Immediate hydration
- **`idle`**: When browser is idle (requestIdleCallback)
- **`visible`**: When scrolled into viewport (IntersectionObserver)

## Server Rendering

Server: call template function directly. Client: mount for reactivity.

```javascript
// Server route
const html = App();

// Browser script
mount(App, "#app");
```

## Signal Integration

Templates automatically track signal dependencies:

```javascript
const todos = signal([]);
const filter = signal("all");

const TodoApp = () => `
  <div>
    <h1>Todos (${todos().length})</h1>
    <p>Filter: ${filter()}</p>
    <ul>
      ${todos()
        .filter((t) => filter() === "all" || t.status === filter())
        .map((t) => `<li>${t.text}</li>`)
        .join("")}
    </ul>
  </div>
`;

mount(TodoApp, "#app");

// These automatically update DOM
todos.set([{ text: "Learn RavenJS", status: "active" }]);
filter.set("active");
```

## Integration

### With Beak Templates

```javascript
import { html } from "@raven-js/beak";

const items = signal(["Apple", "Banana"]);

const List = () => html`
  <ul>
    ${items().map((item) => html`<li>${item}</li>`)}
  </ul>
`;

mount(List, "#list");
```

### With Wings Server

```javascript
import { Router } from "@raven-js/wings";

const router = new Router();

router.get("/app", (ctx) => {
  // Server: direct template call
  const html = App();

  return ctx.html(`
    <div id="app">${html}</div>
    <script>
      import { mount } from "@raven-js/reflex/dom";
      mount(App, "#app");
    </script>
  `);
});
```

## Performance

- requestAnimationFrame scheduling for paint alignment
- Automatic cleanup prevents memory leaks
- WeakRef tracking assists garbage collection

## Error Handling

```javascript
// Element not found
mount(App, "#nonexistent"); // Error: Element not found for selector: #nonexistent

// Invalid template function
mount("not a function", "#app"); // Error: mount() requires a template function as first argument

// CSS selectors in Node.js
mount(App, "#app"); // Error: CSS selectors only work in browser. Use DOM/virtual elements for isomorphic code.
```

## Requirements

- **Node.js:** 22.5+
- **Browsers:** ES2020+ support
- **Dependencies:** Zero

## The Raven's Perch

Like a raven perched high above, watching the territory below and reacting instantly to changes, Reflex DOM observes signal changes and updates the DOM with surgical precision - no wasted motion, maximum awareness.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
