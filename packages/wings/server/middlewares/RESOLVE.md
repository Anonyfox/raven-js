# Resolve Middleware

Enables zero-build ESM development by auto-generating import maps from package.json dependencies and serving ES modules directly from node_modules and workspace packages. The middleware automatically injects import map script tags into HTML responses, allowing browsers to resolve bare module specifiers like `import { html } from '@raven-js/beak'` without any bundling or compilation step. Perfect for rapid development workflows where you want native browser ES modules with npm package support and instant hot reload.

**Scope:** Development-only middleware exclusively targeting modern JavaScript with native ES modules (`.js`, `.mjs` files). No CommonJS, TypeScript, or transpilation support - browsers must natively execute the served modules as-is.

## How ESM Loading Works

Modern browsers natively support ES modules through `<script type="module">` tags, enabling direct import/export statements without transpilation. When the browser encounters an import statement, it follows a specific resolution algorithm: relative paths like `'./utils.js'` resolve directly, while bare specifiers like `'lodash'` require import maps to determine their actual URLs.

Import maps provide the critical translation layer - a JSON structure served at `<script type="importmap">` that maps package names to their actual file locations. The browser consults this map when resolving bare imports, transforming `import lodash from 'lodash'` into `import lodash from '/node_modules/lodash/lodash.js'` automatically.

The workflow eliminates bundlers entirely: HTML loads with import map, browser fetches modules on-demand via HTTP/2 multiplexing, and each `.js` file executes as a native ES module with proper dependency resolution. This creates development environments that match production ESM behavior while maintaining the convenience of npm package imports.

**Browser Requirements:** ES modules require Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+. Import maps require Chrome 89+, Firefox 108+, Safari 16.4+, Edge 89+.

## File Architecture

The middleware splits into four focused files, each handling one core concept:

**`import-map-generator.js`** (~80 lines) - Generates import maps from package.json dependencies using existing glean logic (`extractEntryPoints`, `parsePackageJson`). Implements Node modules traversal algorithm and creates JSON import map structure mapping bare specifiers to resolved URLs. Uses `Object.create(null)` for import map objects (V8 optimization).

**`html-injector.js`** (~40 lines) - Detects HTML responses via `ctx.responseHeaders.get(HEADER_NAMES.CONTENT_TYPE)` and injects `<script type="importmap" src="/importmap.json"></script>` before the closing `</head>` tag. Modifies `ctx.responseBody` directly (Wings mutable pattern). Handles various HTML structures and malformed HTML gracefully.

**`module-server.js`** (~50 lines) - Serves JavaScript files from configurable source folder using `ctx.js()` response helper. Uses `MIME_TYPES.TEXT_JAVASCRIPT` from Wings string pool. Throws exceptions on malformed requests for Wings error collection system.

**`resolve.js`** (~30 lines) - Main middleware exporting Wings Middleware instance with 'resolve' identifier. Orchestrates the three components and handles configuration/request routing logic.

## Configuration

**Minimal Configuration Options:**

```javascript
{
  sourceFolder: './src',           // Where JS files are served from (can equal public assets folder)
  importMapPath: '/importmap.json' // URL path for serving import maps
}
```

## Package Resolution Strategy

**Import Map Generation** - Uses existing `glean/lib2/discover/parser/entry-points.js` `extractEntryPoints()` function and `glean/lib/discovery/package-metadata.js` `parsePackageJson()` function. These battle-tested implementations handle modern `exports` field parsing, conditional exports, wildcards, and fallbacks to `module`/`main` fields.

**Node Modules Traversal** - Implements standard Node.js resolution algorithm: start from application's local `node_modules`, traverse upward through parent directories (`../node_modules`, `../../node_modules`, etc.) until package found or filesystem root reached. Supports npm workspace configurations with hoisted dependencies.

**Entry Point Resolution** - For bare specifiers like `'lodash'` or `'@raven-js/beak'`, locates correct entry point from package's `package.json` using the existing glean resolution logic. Creates URL mappings pointing browsers to actual module locations in `node_modules` or workspace packages.

## Error Handling

**Wings Error Collection** - Throws standard Error instances for malformed JavaScript requests. Wings automatically collects errors in `ctx.errors` array. After-middleware (like logger) can consume and format errors from `ctx.errors` for consistent error presentation.

**Pass-Through Behavior** - 404s for missing modules pass through to next middleware. Only malformed requests (path traversal attempts, invalid extensions) trigger exceptions that Wings collects and handles.

## Integration with Static File Serving

**Middleware Ordering** - Position after static file serving middleware in the chain. Asset serving order is irrelevant since both serve different URL spaces:

- Assets: `/favicon.ico`, `/styles.css`, etc.
- Resolve: `/node_modules/`, `/importmap.json`, source folder JS files

**URL Path Coordination** - Static middleware serves from public folder at root URL (`/`), while Resolve handles `/node_modules/`, `/@workspace/`, and import map endpoint. No path conflicts.

## HTTP Headers

**MIME Type Enforcement** - All served ES modules receive `MIME_TYPES.TEXT_JAVASCRIPT` headers via Wings string pool. Import maps served with `MIME_TYPES.APPLICATION_JSON`. Uses `HEADER_NAMES.CONTENT_TYPE` constants for consistent header management.

**Development Focus** - Uses `Cache-Control: no-cache` to ensure immediate reflection of source changes. No caching complexity - algorithm optimization over cache band-aids.

## Implementation Requirements

**Reuse Existing Logic** - Copy/adapt existing package resolution from glean:

- `extractEntryPoints()` from `glean/lib2/discover/parser/entry-points.js`
- `parsePackageJson()` from `glean/lib/discovery/package-metadata.js`
- `pickEntrypointFile()` from `glean/lib2/discover/fsutils/pick-entrypoint-file.js`

**Wings Integration Patterns** - Each file exports Wings Middleware instances:

```javascript
export const resolveMiddleware = new Middleware(async (ctx) => {
  // Implementation
}, "resolve");
```

**Context Mutation** - Modify `ctx` properties directly (Wings mutable design). Use `ctx.html()`, `ctx.js()`, `ctx.json()` response helpers instead of manual header setting.

**V8 Optimizations** - Use `Object.create(null)` for import maps, leverage Wings string pool constants (`MIME_TYPES`, `HEADER_NAMES`), implement LRU caching with bounded size similar to Wings core patterns.

**100% Branch Coverage** - Each file must have comprehensive tests covering all edge cases and error conditions.

**Zero External Dependencies** - Pure Node.js built-ins only, maintaining raven fortress-like boundaries.

## Wings Integration

**Router Registration**:

```javascript
router.use(resolveMiddleware);
// or
router.useEarly(corsMiddleware).use(resolveMiddleware);
```

**Error Collection** - Wings automatically collects thrown errors in `ctx.errors`. After-middleware can consume and format errors for logging.
