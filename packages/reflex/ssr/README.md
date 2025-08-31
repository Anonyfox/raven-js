# Reflex SSR: Component-Scoped Server Rendering

[![Website](https://img.shields.io/badge/website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-docs.ravenjs.dev/reflex-blue.svg)](https://docs.ravenjs.dev/reflex)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

Server-side rendering with component-scoped hydration, automatic fetch caching, and multi-pass stability.

## Purpose

Traditional SSR approaches inject global state at predetermined HTML structure points (`</head>`, `</body>`), creating layout dependencies and cache management headaches. Components become tightly coupled to specific HTML structures and global state management.

Reflex SSR provides component isolation: each `ssr()` call gets unique cache scoping, data injection happens inline with component HTML, and hydration works independently per component. No global state, no layout dependencies, no cache collisions.

## Installation

```bash
npm install @raven-js/reflex
```

## Usage

### Basic Component Rendering

```javascript
import { ssr } from "@raven-js/reflex/ssr";

const UserCard = ssr(async () => {
  const response = await fetch("/api/user/123");
  const user = await response.json();
  return `<div class="user-card">
    <h2>${user.name}</h2>
    <p>${user.email}</p>
  </div>`;
});

// Server: renders HTML with inline hydration data
const html = await UserCard();
// → <div>...</div><script>window.__SSR_DATA__abc123={...}</script>

// Client: uses cached data, then restores normal fetch
const clientHtml = await UserCard(); // Uses SSR cache
```

### Reactive Templates

```javascript
import { ssr, signal, computed } from "@raven-js/reflex/ssr";

const TodoWidget = ssr(async () => {
  const todos = signal([]);
  const filter = signal("all");

  // Fetch happens once during SSR, cached for hydration
  const response = await fetch("/api/todos");
  todos.set(await response.json());

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

  return `<div class="todo-widget">
    <h3>Todos (${filteredTodos().length})</h3>
    <ul>
      ${filteredTodos()
        .map(
          (todo) => `
        <li class="${todo.completed ? "done" : ""}">${todo.title}</li>
      `
        )
        .join("")}
    </ul>
  </div>`;
});
```

### Multiple Components in Layout

```javascript
const UserWidget = ssr(async () => {
  const user = await fetch("/api/user").then((r) => r.json());
  return `<span>Hello ${user.name}!</span>`;
});

const WeatherWidget = ssr(async () => {
  const weather = await fetch("/api/weather").then((r) => r.json());
  return `<div>${weather.temp}°C</div>`;
});

// Each component gets isolated cache and inline injection
const layout = `
  <header>${await UserWidget()}</header>
  <main>Content here</main>
  <sidebar>${await WeatherWidget()}</sidebar>
`;

// Result:
// <span>Hello Alice!</span><script>window.__SSR_DATA__abc123=...</script>
// <div>22°C</div><script>window.__SSR_DATA__def456=...</script>
```

### Custom Configuration

```javascript
const HeavyComponent = ssr(
  async () => {
    // Complex async operations
    const data = await heavyComputation();
    return `<div>${data}</div>`;
  },
  {
    timeout: 15000, // Total SSR timeout
    maxPasses: 12, // Max render passes for stability
    maxSettleAttempts: 200, // Max promise settlement attempts
  }
);
```

## Multi-Pass Rendering

Server runs multiple passes until output stabilizes:

```javascript
// Pass 1: Initial render, async operations start
// Pass 2: Some promises resolved, re-render
// Pass 3: More promises resolved, re-render
// Pass N: All promises settled, output stable → done
```

Criteria for stability:

- `html === prevHtml` (output unchanged)
- `promises.size === 0` (no pending async)
- `writeVersion === prevVersion` (no reactive writes)

## Fetch Caching

GET requests are automatically cached per component:

```javascript
const DataWidget = ssr(async () => {
  // First call: actual HTTP request
  const response = await fetch("/api/data");

  // Second call within same component: cache hit
  const sameData = await fetch("/api/data");

  return `<div>${response.data}</div>`;
});
```

**Cache key generation:**

- URL (resolved to absolute)
- Method (GET, POST, etc.)
- Headers (normalized, sorted)
- Body hash (for non-GET requests)

## Wings Integration

Works seamlessly with Wings server (automatic `RAVENJS_ORIGIN` setup):

```javascript
import { Router } from "@raven-js/wings";
import { ssr } from "@raven-js/reflex/ssr";

const router = new Router();

router.get(
  "/dashboard",
  ssr(async () => {
    // Relative URLs work automatically
    const user = await fetch("/api/user").then((r) => r.json());
    const stats = await fetch("/api/stats").then((r) => r.json());

    return `<div>
    <h1>Welcome ${user.name}</h1>
    <p>Total items: ${stats.count}</p>
  </div>`;
  })
);
```

## Requirements

- **Node.js:** 22.5+
- **Environment:** Server-side only (throws in browser)
- **Dependencies:** Zero

## The Raven's Vision

Like a raven's ability to see the entire territory from above while tracking individual movements below, Reflex SSR maintains global coherence through multi-pass rendering while preserving perfect component isolation - every piece fits seamlessly into the larger picture.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
