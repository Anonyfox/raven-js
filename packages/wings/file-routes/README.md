# Wings File-Based Routing

File-based routing for Wings applications - automatically discover and register routes from your filesystem structure.

## Features

- **Zero Dependencies** - Only uses Node.js built-ins
- **Type Safe** - Full JSDoc typing with TypeScript support
- **Flexible Patterns** - Static, dynamic, and catch-all routes
- **Wings Integration** - Seamless router registration
- **Tree Shakable** - Import only what you need

## Route Patterns

| File Path                               | URL Pattern             | Example URLs               |
| --------------------------------------- | ----------------------- | -------------------------- |
| `pages/index.js`                        | `/`                     | `/`                        |
| `pages/about/index.js`                  | `/about`                | `/about`                   |
| `pages/blog/[slug]/index.js`            | `/blog/:slug`           | `/blog/hello-world`        |
| `pages/shop/[category]/[item]/index.js` | `/shop/:category/:item` | `/shop/electronics/laptop` |
| `pages/docs/[...path]/index.js`         | `/docs/*path`           | `/docs/api/routing`        |

## Quick Start

```javascript
import { Router } from "@raven-js/wings";
import { scanRoutes, registerFileRoutes } from "@raven-js/wings/file-routes";

const router = new Router();

// Scan for routes
const routes = await scanRoutes("src/pages");
console.log(`Found ${routes.length} routes`);

// Register with custom handler
await registerFileRoutes(router, "src/pages", {
  handler: async (ctx, route) => {
    const pageModule = await import(route.module);
    // Your page handling logic
    ctx.html(pageModule.render());
  },
});
```

## API Reference

### `scanRoutes(pagesDir, options?)`

Scan filesystem for file-based routes.

**Parameters:**

- `pagesDir` (string) - Directory to scan for pages
- `options` (object, optional) - Scanner options
  - `indexFile` (string) - Index file name (default: "index.js")
  - `includeNested` (boolean) - Include nested directories (default: true)
  - `baseDir` (string) - Base directory for path resolution (default: process.cwd())

**Returns:** `Promise<FileRoute[]>`

### `registerFileRoutes(router, pagesDir, options?)`

Register file-based routes with a Wings router.

**Parameters:**

- `router` (Router) - Wings router instance
- `pagesDir` (string) - Directory to scan for pages
- `options` (object, optional) - Registration options
  - `handler` (function) - Custom route handler
  - `method` (string) - HTTP method (default: "GET")
  - ...scanner options

**Returns:** `Promise<FileRoute[]>`

### `FileRoute`

Class representing a discovered file-based route.

**Properties:**

- `pattern` (string) - URL pattern (e.g., "/blog/:slug")
- `module` (string) - Absolute path to module file
- `params` (string[]) - Dynamic parameter names
- `catchAll` (boolean) - Whether this is a catch-all route
- `priority` (number) - Sort priority for route matching

## Examples

### Basic Usage

```javascript
import { Router } from "@raven-js/wings";
import { registerFileRoutes } from "@raven-js/wings/file-routes";

const router = new Router();

// Register all pages with default handler
await registerFileRoutes(router, "src/pages");
```

### Custom Handler

```javascript
await registerFileRoutes(router, "src/pages", {
  handler: async (ctx, route) => {
    const pageModule = await import(route.module);

    // Load dynamic data if available
    const data = pageModule.loadData ? await pageModule.loadData(ctx) : {};

    // Render page
    const html = pageModule.render(data);
    ctx.html(html);
  },
});
```

### API Routes

```javascript
await registerFileRoutes(router, "src/api", {
  method: "POST",
  handler: async (ctx, route) => {
    const apiModule = await import(route.module);
    const result = await apiModule.handler(ctx);
    ctx.json(result);
  },
});
```

### Manual Route Discovery

```javascript
import { scanRoutes, FileRoute } from "@raven-js/wings/file-routes";

const routes = await scanRoutes("src/pages");

for (const route of routes) {
  console.log(`${route.pattern} -> ${route.module}`);

  // Register with custom logic
  router.get(route.pattern, async (ctx) => {
    // Your custom handling
  });
}
```

## Route Priority

Routes are automatically sorted by priority:

1. **Static routes** (priority 0) - `/about`
2. **Dynamic routes** (priority 1) - `/blog/:slug`
3. **Catch-all routes** (priority 2) - `/docs/*path`

Within the same priority, routes with fewer parameters are matched first.

## Integration with SSG

Perfect for static site generators:

```javascript
import { scanRoutes } from "@raven-js/wings/file-routes";

// Discover all routes for static generation
const routes = await scanRoutes("src/pages");

// Generate static files
for (const route of routes) {
  const pageModule = await import(route.module);
  const html = await pageModule.render();
  await writeFile(`dist${route.pattern}/index.html`, html);
}
```
