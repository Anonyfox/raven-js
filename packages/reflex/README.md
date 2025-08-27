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

### Universal SSR

```javascript
import { ssr } from "@raven-js/reflex/ssr";

// Same code runs on server and client
const App = ssr(async () => {
  const data = signal([]);

  // Automatic fetch caching during SSR
  const response = await fetch("/api/data");
  data.set(await response.json());

  return () =>
    `<div>${data()
      .map((item) => `<p>${item}</p>`)
      .join("")}</div>`;
});

// Server: renders HTML with embedded state
// Client: hydrates automatically, no duplicate fetches
```

### DOM Utilities

```javascript
import { mount } from "@raven-js/reflex/dom";

// Mount reactive components (browser-only)
mount(() => `<h1>Hello ${signal("World")()}</h1>`, "#app");
```

## Features

- **Universal Signals** - Work identically everywhere
- **Diamond Problem Solved** - Automatic scheduling eliminates glitches
- **Automatic SSR** - No configuration needed
- **Perfect Hydration** - No flicker, no duplicate requests
- **Zero Dependencies** - Pure JavaScript only
- **Framework Agnostic** - Integrates with any server/router
- **Performance Optimized** - Paint-aligned updates, efficient DOM operations

### 🔮 Automagic Features

- **Resource Auto-Cleanup** - Timers, event listeners automatically cleaned up on effect disposal
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
- **SSR Data Injection** - Fetch responses embedded in HTML, no client round-trips
- **Seamless Hydration** - Client picks up exactly where server left off
- **Reactive Updates** - Signal changes update DOM efficiently
- **Beak Integration** - Clean HTML templating with reactive interpolation

## Requirements

- **Node.js:** 22.5+
- **Browsers:** ES2020+ support
- **Dependencies:** Zero

## License

MIT - Copyright (c) 2025 Anonyfox e.K.
