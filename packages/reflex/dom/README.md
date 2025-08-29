# Reflex DOM: Automatic Signal Tracking

[![Website](https://img.shields.io/badge/website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)
[![Isomorphic](https://img.shields.io/badge/Isomorphic-SSR+Browser-blue.svg)](https://nodejs.org/api/esm.html)

Mount reactive templates. Signal changes automatically update DOM.

**One function. Zero complexity. Zero manual cleanup.**

_Optimized with CSS containment, priority scheduling, and automatic memory management._

## Install

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

Mount reactive template to DOM element. Signal reads inside `templateFn` automatically trigger DOM updates.

**Parameters:**

- `templateFn: () => string` - Function returning HTML string
- `target: string | Element` - CSS selector or DOM element
- `options: Object` - Optional mount configuration
  - `replace: boolean` - If true, replace target content instead of preserving (default: false)

**Returns:** Mount instance with optional `unmount()` method

_Cleanup happens automatically when elements are removed from DOM._

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

## Server Rendering

Server-side: call template directly (no mounting needed)

```javascript
// Server route
const html = App(); // Just call the function
```

Client-side: mount for reactivity

```javascript
// Browser script
mount(App, "#app"); // Creates reactive DOM
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

## Isomorphic Support

Same code works in Node.js and browsers:

```javascript
import { mount } from "@raven-js/reflex/dom";

// Browser: real DOM
mount(App, "#app");

// Server: virtual DOM (internal implementation)
// Use regular template function calls instead
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

- **Zero overhead** when signals unused
- **Single DOM operation** per signal change
- **Automatic cleanup** prevents memory leaks
- **Platform primitives** - no framework bloat
- **CSS containment** optimizes layout performance
- **Priority scheduling** via `scheduler.postTask()` when available
- **WeakRef tracking** for garbage collection assistance

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

- **Node.js:** 22.5+ (server-side)
- **Browsers:** ES2020+ support
- **Dependencies:** Zero

## License

MIT - Copyright (c) 2025 Anonyfox e.K.
