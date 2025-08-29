# Reflex: Universal Reactive Signals

[![Website](https://img.shields.io/badge/website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)
[![ESM](https://img.shields.io/badge/ESM-Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

Universal reactive signals with automatic SSR, seamless hydration, and zero-dependency DOM updates. Works everywhere - browser, Node.js, Deno, Bun.

**Zero dependencies. Zero transpilation. Zero framework lock-in.**

## Install

```bash
npm install @raven-js/reflex
```

## API

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

### Revolutionary Component-Scoped SSR

Reflex introduces **inline component-scoped SSR** - a breakthrough that makes SSR completely **layout-independent** and **component-isolated**.

```javascript
import { ssr } from "@raven-js/reflex/ssr";

// 🎯 Each component is self-contained with its own SSR data
const UserWidget = ssr(async () => {
  const response = await fetch("/api/user");
  const user = await response.json();
  return `<span>Hello ${user.name}!</span>`;
});

const WeatherWidget = ssr(async () => {
  const response = await fetch("/api/weather");
  const weather = await response.json();
  return `<div>${weather.temp}°C</div>`;
});

// 🚀 Works anywhere in your HTML - header, footer, modal, anywhere!
const layout = `
  <header>${await UserWidget()}</header>    <!-- Independent SSR data -->
  <main>Content here</main>
  <footer>${await WeatherWidget()}</footer> <!-- Independent SSR data -->
`;

// Server output:
// <span>Hello Alice!</span><script>window.__SSR_DATA__abc123 = {...}</script>
// <div>22°C</div><script>window.__SSR_DATA__def456 = {...}</script>

// ✨ Client hydrates perfectly - zero duplicate requests, zero conflicts!
```

**Key Innovation:**

- **Traditional SSR**: Global state at HTML structure points (`</head>`, `</body>`)
- **Reflex SSR**: Component-scoped data injected inline with each component
- **Result**: True component isolation, works in any layout, zero configuration

### DOM Utilities

```javascript
import { mount } from "@raven-js/reflex/dom";

// Mount reactive components (browser-only)
mount(() => `<h1>Hello ${signal("World")()}</h1>`, "#app");
```

## Features

- **Revolutionary SSR** - Component-scoped inline data injection, layout-independent
- **Universal Signals** - Work identically everywhere
- **Diamond Problem Solved** - Automatic scheduling eliminates glitches
- **Perfect Hydration** - Zero flicker, zero duplicate requests, zero conflicts
- **True Component Isolation** - Each ssr() call has unique ID and cache
- **Zero Dependencies** - Pure JavaScript only
- **Framework Agnostic** - Integrates with any server/router
- **Performance Optimized** - Paint-aligned updates, efficient DOM operations

### 🔮 Automagic Features

- **Component-Scoped SSR** - Automatic unique ID generation, inline injection, zero configuration
- **Layout Independence** - SSR components work in any HTML structure, any nesting level
- **Smart Cache Management** - Per-component cache isolation, automatic cleanup after consumption
- **SSR Timeout Protection** - Graceful degradation with individual promise timeouts and exponential backoff
- **Browser API Shims** - Automatic localStorage, window, navigator shims prevent SSR crashes
- **Memory Leak Prevention** - Deterministic cleanup prevents hanging processes
- **DOM Optimizations** - Target reuse, scroll preservation, coalesced updates, safe HTML replacement
- **XSS Protection** - Automatic escaping and size caps for SSR data injection

## Wings Integration

Reflex integrates seamlessly with [@raven-js/wings](https://github.com/Anonyfox/ravenjs/tree/main/packages/wings) for optimal fullstack reactivity:

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

**Key Benefits:**

- **Zero Configuration** - Wings + Reflex work together automatically
- **Component-Scoped SSR** - Each component's data injected inline, complete isolation
- **Layout Independent** - SSR components work anywhere in HTML structure
- **Perfect Hydration** - Client uses exact server responses, zero duplicate requests
- **Reactive Updates** - Signal changes update DOM efficiently
- **Beak Integration** - Clean HTML templating with reactive interpolation

### Origin Resolution for SSR

Reflex automatically resolves relative URLs during SSR using `RAVENJS_ORIGIN` environment variable:

```javascript
// In your SSR components - use relative URLs:
const response = await fetch("/api/data");
// ✅ Works perfectly! Wings auto-sets RAVENJS_ORIGIN

// Reflex resolves to: http://localhost:3000/api/data (development)
//                or: https://your-domain.com/api/data (production)
```

**How it works:**

1. **Wings sets origin** - Automatically based on server configuration
2. **Reflex uses origin** - For resolving relative URLs in `fetch()` calls
3. **Zero config needed** - Works out of the box with Wings integration

**Error handling:**

```javascript
// If RAVENJS_ORIGIN not set (non-Wings usage):
const response = await fetch("/api/data");
// ❌ Throws: "RAVENJS_ORIGIN environment variable must be set for SSR"
```

**Manual override** (containers, reverse proxies):

```bash
# Set before starting Wings server
export RAVENJS_ORIGIN=https://api.example.com
node server.js
```

## Requirements

- **Node.js:** 22.5+
- **Browsers:** ES2020+ support
- **Dependencies:** Zero

## License

MIT - Copyright (c) 2025 Anonyfox e.K.
