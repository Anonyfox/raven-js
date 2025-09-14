# Reflex: Universal Reactive Signals

[![Website](https://img.shields.io/badge/website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-docs.ravenjs.dev/reflex-blue.svg)](https://docs.ravenjs.dev/reflex)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

<div align="center">
  <img src="./media/logo.webp" alt="Reflex Logo" width="200" height="200" />
</div>

Universal reactive signals with automatic SSR, seamless hydration, and zero-dependency DOM updates.

## Purpose

Reactive programming suffers from complexity taxation - frameworks demand steep learning curves, bloated dependencies, and vendor lock-in. Most reactive systems exhibit glitches where intermediate states leak through, breaking consistency guarantees developers expect.

Reflex provides mathematical precision: computed-first execution prevents glitched states, component-scoped SSR eliminates global state headaches, and zero dependencies mean no supply chain vulnerabilities. Works identically across browser, Node.js, Deno, and Bun environments.

## Installation

```bash
npm install @raven-js/reflex
```

## Usage

### Core Signals

```javascript
import { signal, computed, effect } from "@raven-js/reflex";

// Create reactive state
const count = signal(0);
const doubled = computed(() => count() * 2);

// React to changes
effect(() => {
  console.log(`Count: ${count()}, Doubled: ${doubled()}`);
});

// Update state
count.set(5); // Logs: "Count: 5, Doubled: 10"
```

### Component-Scoped SSR

Inline component-scoped SSR with per-component data injection. Each `ssr()` call gets unique cache isolation and works in any HTML structure.

```javascript
import { ssr } from "@raven-js/reflex/ssr";

const UserWidget = ssr(async () => {
  const response = await fetch("/api/user"); // relative URLs work via RAVENJS_ORIGIN
  const user = await response.json();
  return `<span>Hello ${user.name}!</span>`;
});

const WeatherWidget = ssr(async () => {
  const response = await fetch("/api/weather");
  const weather = await response.json();
  return `<div>${weather.temp}°C</div>`;
});

// Works anywhere in HTML structure - header, footer, modal, nested components
const layout = `
  <header>${await UserWidget()}</header>
  <main>Content here</main>
  <footer>${await WeatherWidget()}</footer>
`;

// Server output:
// <span>Hello Alice!</span><script>window.__SSR_DATA__abc123 = {...}</script>
// <div>22°C</div><script>window.__SSR_DATA__def456 = {...}</script>

// Client hydrates using cached data, then restores normal fetch behavior
```

**Architectural Difference:**

- **Traditional SSR**: Global state injection at HTML structure points (`</head>`, `</body>`)
- **Reflex SSR**: Component-scoped data injected inline with each component
- **Result**: Component isolation, layout independence, automatic cache management

### DOM Utilities

```javascript
import { mount } from "@raven-js/reflex/dom";

// Mount reactive components (browser-only)
mount(() => `<h1>Hello ${signal("World")()}</h1>`, "#app");
```

## Architecture

### Signal Scheduler

Computed-first microtask execution prevents glitched intermediate states. Computeds propagate until stable, then effects execute with consistent data view.

### Template Context System

Render slots preserve component instances across renders, preventing object churn. Deferred effects execute after template completion rather than during rendering, enabling proper initialization order.

### Multi-pass SSR

Server runs multiple passes until output stabilizes (`html === prevHtml && promises.size === 0`). Uses exponential backoff between promise settlement attempts, individual timeouts per promise.

### Fetch Integration in SSR

`fetch()` calls work within `effect()` callbacks using relative URLs via `RAVENJS_ORIGIN` environment variable. Server proxies `globalThis.fetch`, caches GET responses per component ID. Client finds cached entries across component-scoped SSR blobs, consumes them, then restores original fetch behavior.

### Hydration Intelligence

`mount()` tracks write version baseline - skips initial DOM replacement when SSR content exists and no reactive writes occurred yet. Prevents downgrade from server-rendered to empty client state.

### Performance Implementation

- WeakMap template caching
- Monomorphic signal reads optimize V8
- rAF + microtask scheduling for paint alignment
- WeakRef DOM tracking for cleanup

## Wings Integration

Reflex integrates with [@raven-js/wings](https://github.com/Anonyfox/ravenjs/tree/main/packages/wings) for fullstack reactivity:

```javascript
import { Router } from "@raven-js/wings";
import { html } from "@raven-js/beak";
import { ssr, signal, computed } from "@raven-js/reflex";

const router = new Router();

// Reactive route handlers - same code runs server & client
router.get(
  "/todos",
  ssr(async (ctx) => {
    // Create reactive state
    const todos = signal([]);
    const filter = signal("all");

    // Automatic fetch interception + SSR caching
    const response = await fetch("/api/todos");
    todos.set(await response.json());

    // Computed values work perfectly
    const filteredTodos = computed(() => {
      switch (filter()) {
        case "active":
          return todos().filter((t) => !t.completed);
        case "completed":
          return todos().filter((t) => t.completed);
        default:
          return todos();
      }
    });

    // Return beak template with reactive data
    return ctx.html(html`
      <html>
        <head>
          <title>Todo App</title>
          <script src="/client.js"></script>
        </head>
        <body>
          <h1>Todos (${filteredTodos().length})</h1>
          <ul>
            ${filteredTodos().map(
              (todo) => html`
                <li class="${todo.completed ? "done" : ""}">${todo.title}</li>
              `
            )}
          </ul>
        </body>
      </html>
    `);
  })
);

// Wings handles the server, Reflex handles the reactivity
router.listen(3000);
```

**Integration Benefits:**

- Wings `LocalFetch` transparently resolves relative URLs and forwards headers
- Component-scoped SSR data injection with cache isolation
- SSR components work in any HTML structure
- Client hydration uses server response cache, eliminates duplicate requests
- Signal changes trigger efficient DOM updates
- Beak template integration for HTML generation

### SSR Fetch Behavior

In SSR, use relative URLs in `fetch()` and register Wings `LocalFetch` middleware. It resolves relative URLs against the current request, forwards headers (and self-signed HTTPS agent for internal hosts), and isolates per request.

## Requirements

- **Node.js:** 22.5+
- **Browsers:** ES2020+ support
- **Dependencies:** Zero

## The Raven's Reflex

Like a raven's lightning-fast reflexes responding to environmental changes, Reflex signals react instantly to state mutations, propagating updates through the system with surgical precision and unwavering consistency.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
