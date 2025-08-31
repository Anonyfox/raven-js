[![Website](https://img.shields.io/badge/🌐_Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/📖_Documentation-docs.ravenjs.dev-blue.svg)](https://docs.ravenjs.dev/fledge)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen.svg)](https://github.com/Anonyfox/raven-js)
[![ESM Only](https://img.shields.io/badge/Modules-ESM_Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

<div align="center">
  <img src="media/logo.webp" alt="Fledge Logo" width="200" height="200">
</div>

# 🐣 Fledge

_Build & bundle tool for modern JavaScript applications_

**From nestling to flight-ready.**

Transforms your development application into production-ready deployables across three distinct modes: static site generation, optimized script bundling, and standalone binary compilation. No framework lock-in, no complex build chains—Fledge operates at the protocol and filesystem level to prepare your code for any deployment target.

Whether you need CDN-optimized static files, performance-tuned JavaScript bundles, or self-contained executables, Fledge systematically processes your application and delivers deployment artifacts. Your development workflow stays untouched—Fledge hunts at the boundaries where development ends and deployment begins.

## Installation

```bash
npm install -D @raven-js/fledge
```

## Usage

Fledge transforms development applications through three hunting modes, each targeting different deployment scenarios:

### 🌐 Static Mode - CDN-Ready Sites

Transform any HTTP server into static files optimized for edge deployment.

#### Config-as-Code

Fledge configuration is executable JavaScript—not JSON, not YAML, but real code with imports, variables, and conditional logic. Three input methods with clear precedence:

```bash
# 1. Pipe configuration (highest priority)
echo "export default {server: 'http://localhost:3000'}" | fledge static --out dist

# 2. Configuration file (second priority)
fledge static fledge.config.js --out dist

# 3. CLI flags only (lowest priority)
fledge static --server http://localhost:3000 --out dist
```

**Configuration Example:**

```javascript
// fledge.config.js
export default {
  // Server: URL string or boot function
  server: "http://localhost:3000",

  // Routes: static array or generator function
  routes: ["/shop", "/about", "/contact"],

  // Discovery: auto-crawl linked pages
  discover: {
    depth: 3,
    ignore: ["/admin", "/api/*"],
  },

  // URL rewriting for subdirectory deployment
  basePath: "/my-app",

  // Static assets to copy
  assets: "./public",

  // Build output
  output: "./dist",
};

// Dynamic configuration example
export const productionConfig = {
  server: async ({ port }) => {
    // Boot your server programmatically
    const { createServer } = await import("./server.js");
    await createServer().listen(port);
  },

  routes: async () => {
    // Generate routes from CMS/database
    const products = await fetchProducts();
    return products.map((p) => `/product/${p.slug}`);
  },
};
```

#### Blackbox Server Integration

Fledge treats your server as a blackbox—it doesn't care about your framework, build tools, or internal architecture. Just serve HTTP responses:

```javascript
// Works with any server
const servers = [
  "http://localhost:3000", // Next.js dev server
  "http://127.0.0.1:5173", // Vite dev server
  "http://localhost:8080", // Webpack dev server
  async ({ port }) => {
    // Custom server boot
    const server = createYourServer();
    await server.listen(port);
  },
];
```

**Boot Function Pattern:**

```javascript
// fledge.config.js - Server that needs setup
export default {
  server: async ({ port }) => {
    // Import your server module
    const { app } = await import("./src/server.js");

    // Perform any initialization
    await setupDatabase();

    // Start listening on provided port
    await app.listen(port);

    console.log(`Server ready on port ${port}`);
  },

  routes: ["/"],
  discover: true,
};
```

#### Crawling Process

The crawling process is deterministic and comprehensive:

1. **Server Boot**: Fledge allocates an OS port and boots your server function or connects to existing URL
2. **Route Seeding**: Initial routes added to crawl frontier
3. **Systematic Crawling**: Each URL fetched with attempt tracking, redirects followed manually
4. **URL Discovery**: HTML responses parsed for `<a>`, `<img>`, `<link>` tags—relative URLs added to frontier
5. **Asset Processing**: Static assets saved with original paths, HTML saved as directory indexes
6. **URL Rewriting**: If `basePath` configured, all internal links rewritten for subdirectory deployment
7. **Cleanup**: Server killed gracefully, statistics reported

**Crawl Example:**

```bash
# Minimal crawl
fledge static --server http://localhost:3000 --out dist

# Verbose output with validation
fledge static config.js --validate --verbose --out ./build

# Production deployment to subdirectory
fledge static prod.config.js --base /my-app --out dist
```

**Discovery Control:**

```javascript
// Fine-grained discovery control
export default {
  server: "http://localhost:3000",
  routes: ["/"],

  discover: {
    depth: 2, // Maximum link depth from initial routes
    ignore: [
      "/admin/*", // Glob patterns
      "/api/*",
      "*.pdf",
    ],
  },
};

// Disable discovery - crawl only specified routes
export const staticRoutes = {
  server: "http://localhost:3000",
  routes: ["/home", "/about", "/contact", "/pricing"],
  discover: false,
};
```

### ⚡ Script Mode - Server-Side Bundles

Transform your Node.js application into self-contained bundles with embedded assets for lightweight distribution.

```bash
# Coming soon - Server-side bundling with asset embedding
fledge script src/server.js --out dist/bundle.js
```

Generates single JavaScript files that include all dependencies and assets, running anywhere Node.js is installed. Optimal for CLI tools, FaaS environments, and scenarios requiring minimal deployment footprint without external dependencies or asset directories.

**Target deployment scenarios:**

- CLI tools and utilities
- AWS Lambda / Serverless functions
- Lightweight server applications
- Development tool distribution

### 🔧 Binary Mode - Native Executables

Transform your Node.js application into native executables using Node.js SEA (Single Executable Applications) with embedded code and assets.

```bash
# Coming soon - Native binary compilation with embedded Node.js runtime
fledge binary src/server.js --target linux-x64 --out dist/myapp
```

Generates truly standalone executables containing the Node.js runtime, your application code, and all assets. Larger file size but zero external dependencies—works like Go or Rust binaries. Platform and architecture specific, perfect for VPS deployments that skip containerization entirely.

**Target deployment scenarios:**

- VPS server deployments (alternative to Docker)
- Desktop applications and CLI tools
- Edge computing without Node.js runtime
- Distribution to environments without package managers

## CLI Reference

### Static Mode

```bash
fledge static [config.js] [options]

# Examples:
echo "export default {server: 'http://localhost:3000'}" | fledge static --out dist
fledge static myconfig.js --out dist
fledge static --server http://localhost:8080 --out dist
fledge static myconfig.js --validate

# Options:
--server <url>     Server origin (e.g. http://localhost:3000)
--out <path>       Output directory (default: ./dist)
--base <path>      Base path for URLs (default: /)
--validate         Validate config and exit
--verbose, -v      Verbose output
--help, -h         Show help
```

### Script Mode (Coming Soon)

```bash
fledge script <entry> [options]

# Examples:
fledge script src/server.js --out dist/bundle.js
fledge script src/cli.js --assets public/ --out dist/tool.js
fledge script src/lambda.js --out dist/function.js

# Options:
--out <path>       Output bundle file
--assets <dir>     Directory to embed in bundle
--minify           Enable minification (default: true)
--node <version>   Target Node.js version (default: 22)
```

### Binary Mode (Coming Soon)

```bash
fledge binary <entry> [options]

# Examples:
fledge binary src/server.js --target linux-x64 --out dist/myapp
fledge binary src/cli.js --target darwin-arm64 --out dist/tool
fledge binary src/app.js --assets public/ --target win32-x64 --out dist/app.exe

# Options:
--out <path>       Output executable file
--target <arch>    Target platform-architecture (linux-x64, darwin-arm64, win32-x64)
--assets <dir>     Directory to embed in executable
--name <string>    Executable name (default: entry basename)
```

## Requirements

### Static Mode

- Node.js 22.5+
- ESM-only environment (`"type": "module"` in package.json)
- HTTP server running on localhost during build

### Script Mode (Coming Soon)

- Node.js 22.5+
- Server-side JavaScript entry point
- Assets and dependencies accessible at build time

### Binary Mode (Coming Soon)

- Node.js 22.5+
- Node.js SEA (Single Executable Applications) support
- Target platform development environment for cross-compilation

## The Raven's Fledgling

Young ravens undergo systematic development before their first solo hunt—observing prey patterns, practicing flight mechanics, learning territory boundaries. Fledge transforms development applications through the same methodical progression: static crawling for CDN deployment, server-side bundling for lightweight distribution, native compilation for standalone survival. Each mode represents a different deployment maturity, preparing your code to thrive in environments where weak applications perish from dependency failures.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
