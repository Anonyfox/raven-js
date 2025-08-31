# Static Config Architecture

**Config-as-code over meta-language cancer.**

While industry drowns in YAML complexity and JSON limitations, ravens execute JavaScript directly. No parsing overhead, no invented syntax, pure platform primitives.

## Core Intelligence

The static generator hunts any running server like a precision crawler, transforming live applications into deployable artifacts. Configuration lives in `static.config.js`—real JavaScript that executes with full async capabilities.

## The Configuration Format

### Required: Server Target

```js
// Origin string - crawl running server
export default {
  server: "http://localhost:3000",
};

// Async function - boot server on demand
export default {
  server: async ({ port }) => {
    const { app } = await import("./server.js");
    await app.listen(port);
  },
};
```

**Intelligence:** Server must be origin URL (http://localhost:3000) or async boot function. Dynamic mode spins up your application, crawls it, then kills it—surgical extraction without external dependencies.

### Routes: Starting Points

```js
// Static array - explicit entry points
export default {
  server: './server.js',
  routes: ['/', '/blog', '/products'],
}

// Async function - generated routes
export default {
  server: './server.js',
  routes: async () => {
    const posts = await getAllPosts();
    return [
      '/',
      '/sitemap.xml',
      ...posts.map(p => `/blog/${p.slug}`),
    ];
  },
}
```

**Default:** `['/']` if not specified.

### Discovery: Link Following

```js
// Boolean - crawl all discovered links
export default {
  server: './server.js',
  discover: true,  // default
}

// Object - controlled discovery
export default {
  server: './server.js',
  discover: {
    depth: 3,                    // max depth from starting points
    ignore: ['/admin/*', '*.pdf'], // patterns to skip
  },
}

// Disabled - only explicit routes
export default {
  server: './server.js',
  routes: ['/about', '/contact.json'],
  discover: false,
}
```

**Intelligence:** By default, follows every link discovered during crawl. Discovery depth prevents infinite loops, ignore patterns avoid admin/binary content.

### Bundles: JavaScript Assets

```js
export default {
  server: "http://localhost:3000",
  bundles: {
    "/app.js": "./src/app/index.js",
    "/admin.js": "./src/admin/index.js",
  },
};
```

**Intelligence:** Bundles are built with ESBuild (including sourcemaps) and placed at mount paths, effectively replacing any preexisting JS files discovered during crawling. Never crawled—built directly from source.

### Deployment Configuration

```js
export default {
  server: "http://localhost:3000",
  basePath: "/my-app", // deployment base path
  assets: "./public", // static files to copy
  output: "./dist", // output directory (default: '_site')
};
```

## Execution Flow

1. **Bootstrap** - If `server` is function, execute to boot application
2. **Initialize** - Default routes to `['/']`, discover to `true`
3. **Crawl** - Fetch starting routes, extract content
4. **Discover** - If enabled, extract links from HTML and queue
5. **Iterate** - Continue until no new URLs found or depth limit reached
6. **Bundle** - Build JavaScript bundles directly (never crawled)
7. **Deploy** - Copy assets, write files to output directory

## Minimal Examples

### Absolute Minimum

```js
// Crawl everything from localhost:3000
export default {
  server: "http://localhost:3000",
};
```

### Specific Entry Points

```js
// Crawl from 3 starting points, discover all links
export default {
  server: "http://localhost:3000",
  routes: ["/", "/docs", "/api"],
};
```

### No Discovery

```js
// Only crawl explicit routes
export default {
  server: "http://localhost:3000",
  routes: ["/", "/about", "/contact.json"],
  discover: false,
};
```

### Dynamic Routes

```js
// Generated starting points + discovery
export default {
  server: "http://localhost:3000",
  routes: async () => {
    const posts = await getAllPosts();
    return ["/", "/sitemap.xml", ...posts.map((p) => `/blog/${p.slug}`)];
  },
};
```

### SPA Application

```js
// HTML shell + JavaScript bundles
export default {
  server: async ({ port }) => {
    const { app } = await import("./backend.js");
    await app.listen(port);
  },
  routes: ["/"], // just the HTML shell
  discover: { depth: 1 }, // only immediate links from home
  bundles: {
    "/js/app.js": "./src/main.js", // the SPA itself
  },
};
```

## Platform Advantages

**Zero meta-language overhead** - Configuration executes as JavaScript, no parsing layers or invented syntax.

**Async native** - Routes and server functions use platform async/await directly.

**Dynamic intelligence** - Configuration can query databases, read files, make HTTP requests during setup.

**Type safety** - JSDoc types and editor intellisense work naturally.

**No external dependencies** - Pure Node.js execution, zero attack vectors.

**Institutional memory** - Comments and logic preserve architectural decisions directly in config.

## Export Flexibility

Configuration can be exported as `default` (fallback) or any named export:

```js
// Default export (fallback)
export default {
  server: "http://localhost:3000",
};

// Named exports (CLI flag selects which one)
export const production = {
  server: "https://api.mysite.com",
  basePath: "/app",
};

export const development = {
  server: async ({ port }) => {
    const { app } = await import("./dev-server.js");
    await app.listen(port);
  },
};
```

**Intelligence:** CLI flag `--config-export=production` selects named export. Default export used if no flag specified.

---

This is config-as-code: executable intelligence over static declarations. While others invent YAML DSLs, ravens use the platform.
