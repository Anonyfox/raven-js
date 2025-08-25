# Resolve Middleware

Enables zero-build ESM development by auto-generating import maps from package.json dependencies and serving ES modules directly from node_modules and workspace packages. The middleware automatically injects import map script tags into HTML responses, allowing browsers to resolve bare module specifiers like `import { html } from '@raven-js/beak'` without any bundling or compilation step. Perfect for rapid development workflows where you want native browser ES modules with npm package support and instant hot reload.

**Scope:** This middleware exclusively targets modern JavaScript with native ES modules (`.js`, `.mjs` files). No CommonJS, TypeScript, or transpilation support - browsers must natively execute the served modules as-is.

## How ESM Loading Works

Modern browsers natively support ES modules through `<script type="module">` tags, enabling direct import/export statements without transpilation. When the browser encounters an import statement, it follows a specific resolution algorithm: relative paths like `'./utils.js'` resolve directly, while bare specifiers like `'lodash'` require import maps to determine their actual URLs.

Import maps provide the critical translation layer - a JSON structure served at `<script type="importmap">` that maps package names to their actual file locations. The browser consults this map when resolving bare imports, transforming `import lodash from 'lodash'` into `import lodash from '/node_modules/lodash/lodash.js'` automatically.

The workflow eliminates bundlers entirely: HTML loads with import map, browser fetches modules on-demand via HTTP/2 multiplexing, and each `.js` file executes as a native ES module with proper dependency resolution. This creates development environments that match production ESM behavior while maintaining the convenience of npm package imports.

**Browser Requirements:** ES modules require Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+. Import maps require Chrome 89+, Firefox 108+, Safari 16.4+, Edge 89+. Older browsers will need polyfills or should use traditional bundling approaches.

## Middleware Architecture

The Resolve middleware implements four core responsibilities to enable seamless ESM development:

**Import Map Injection** - Automatically injects `<script type="importmap" src="/importmap.json"></script>` into HTML responses before the closing `</head>` tag. This happens transparently for any HTML content, ensuring browsers receive the module mapping before executing any ES module code.

**Import Map Endpoint** - Serves the actual import map JSON at a configurable path (defaults to `/importmap.json`). This endpoint dynamically generates the mapping document by scanning `package.json` dependencies and workspace configurations, returning proper URL mappings for all available packages.

**Module Resolution** - Builds the import map by parsing `package.json` files to extract dependencies, resolving entry points through the modern `exports` field (with fallbacks to `module`/`main`), and creating URL mappings that point browsers to the actual module locations in `node_modules` or workspace packages.

**Module Serving** - Handles requests for ES module files by serving them with correct MIME types (`text/javascript` for `.js`, `.mjs` files) and resolving multi-level `node_modules` hierarchies. This includes both npm packages and workspace-relative imports like `@workspace/package-name`.

## Configuration Options

**Core Settings** - `importMapPath` sets the URL path for serving import maps (default: `/importmap.json`). `autoInject` enables automatic HTML injection of import map script tags (default: `true`). `cacheTimeout` controls import map cache duration in milliseconds (default: `5000`).

**Package Control** - `enableWorkspacePackages` allows serving workspace packages via `@workspace/` URLs (default: `true`). `allowedPackages` restricts which npm packages can be served (default: `null` for all packages). `traversalDepth` limits how many `../` levels are permitted (default: `10`).

**Production Settings** - `production` mode enables stricter security validation (default: `false`). When enabled, enforces package allowlisting, reduces traversal depth, and disables development-specific features like verbose error reporting.

## Caching Strategy

**Import Map Caching** - Import maps are cached in memory based on `package.json` modification times and the configured `cacheTimeout`. When dependencies change or the timeout expires, the cache invalidates and regenerates on the next request. This balances performance with development workflow responsiveness.

**Module File Caching** - Individual module files bypass internal caching to ensure immediate reflection of source code changes. Browser-level caching is controlled via HTTP headers, with development typically using `no-cache` for instant updates and production optionally enabling longer cache durations.

**Cache Invalidation** - Manual cache clearing is available via the `clearCache()` method. File system watchers are not implemented to maintain simplicity - cache invalidation relies on modification time checks and timeout-based expiration.

## Error Handling

**Missing Modules** - When requested modules cannot be found, the middleware returns HTTP 404 responses with appropriate error messages. Import map generation continues with available packages, logging missing dependencies without breaking the entire map.

**Malformed Requests** - Path traversal attempts and invalid file extensions are rejected with HTTP 400 responses. Security validation errors are logged for monitoring while preventing information disclosure about file system structure.

**Development vs Production** - Development mode provides verbose error details including file paths and resolution attempts. Production mode returns generic error messages to prevent information leakage while maintaining error logging for debugging.

## Performance Considerations

**HTTP/2 Multiplexing** - The approach relies on HTTP/2's ability to efficiently handle many concurrent requests. Ensure your server supports HTTP/2 for optimal performance when serving multiple small ES modules simultaneously.

**File System Operations** - Import map generation involves filesystem traversal and `package.json` parsing. Cache timeouts should balance responsiveness with CPU usage. Longer timeouts (10-30 seconds) work well for stable dependency trees.

**Development Overhead** - Each module request triggers individual HTTP requests instead of bundled assets. This trades bundling complexity for network overhead. Modern browsers handle this efficiently, but very large applications may benefit from selective bundling of stable dependencies.

**Production Optimization** - Production deployments should consider CDN caching for node_modules content, aggressive import map caching, and potentially pre-generating import maps to avoid runtime filesystem operations.

## HTTP Headers Strategy

**MIME Type Enforcement** - All served ES modules receive `Content-Type: text/javascript` headers regardless of file extension to ensure proper browser execution. Import maps are served with `Content-Type: application/json`.

**Cache Control** - Development mode typically uses `Cache-Control: no-cache` to ensure immediate reflection of source changes. Production mode can enable longer cache durations for node_modules content while keeping application code cache-light for deployments.

**CORS Considerations** - Cross-origin requests for ES modules require proper CORS headers when serving from different domains. The middleware should inherit CORS settings from the main server configuration rather than implementing independent CORS logic.

## Integration with Static File Serving

**Middleware Ordering** - The Resolve middleware should be positioned after static file serving middleware (e.g., Assets) in the middleware chain. This ensures static files are served first, with ES module resolution handling remaining requests for Node modules and workspace packages.

**URL Path Coordination** - Configure the static file middleware to serve from a public folder at the root URL (`/`), while the Resolve middleware handles `/node_modules/`, `/@workspace/`, and the import map endpoint. Avoid path conflicts between static and dynamic module serving.

**Fallback Behavior** - When a module request cannot be resolved, the middleware should pass through to subsequent middleware rather than terminating the request chain. This allows other middleware or route handlers to potentially serve the content or provide appropriate error responses.

## Module Resolution Strategy

The middleware implements three distinct resolution paths for different import types:

**Relative Path Resolution** - For imports like `'./utils.js'` or `'../components/form.js'`, the middleware serves files relative to the requesting file's location. This works within the configured public folder (served at `/`) but can also resolve files outside the public directory, such as shared code folders used by both frontend and backend. These paths resolve directly without import map entries since browsers handle relative imports natively.

**Package Resolution** - For bare specifiers like `'lodash'` or `'@raven-js/beak'`, the middleware must locate the correct entry point from the package's `package.json`. This involves parsing the modern `exports` field for ESM-specific entry points, with fallbacks to `module` and `main` fields for legacy compatibility. The existing `glean/lib2/discover/fsutils` implementation provides package resolution logic that can be adapted for import map generation.

**Node Modules Traversal** - Packages are resolved by searching `node_modules` directories using Node.js resolution algorithm: start from the application's local `node_modules`, then traverse upward through parent directories (`../node_modules`, `../../node_modules`, etc.) until the package is found or filesystem root is reached. This supports modern npm workspace configurations where dependencies are hoisted to higher-level `node_modules` folders, allowing applications in workspace subdirectories to access shared dependencies.

## Security Considerations

The middleware implements layered security to prevent common attack vectors while preserving development flexibility:

**Always-Enabled Protections** - File extension validation restricts serving to `.js`, `.mjs` files only. Path normalization and sanitization prevents directory traversal attacks. MIME type enforcement ensures all modules are served as `text/javascript`. Directory enumeration is prevented by only serving actual files, never listing directory contents.

**Production Configuration** - Optional package allowlisting restricts which npm packages can be served from `node_modules`. Traversal depth limits control how many `../` levels are permitted for shared code access. Workspace package serving can be completely disabled via configuration. File pattern restrictions allow serving only modules matching specific naming conventions.

**Security-Functionality Balance** - The requirement to serve files outside the public folder via `../` imports creates inherent tension with path traversal prevention. The middleware resolves this by allowing controlled traversal within application boundaries while preventing filesystem escapes through path normalization and boundary enforcement. Production deployments should use explicit allowlisting and depth limits to minimize exposure surface.
