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

Whether you need CDN-optimized static files, performance-tuned JavaScript bundles, or self-contained native executables, Fledge systematically processes your application and delivers deployment artifacts. Your development workflow stays untouched—Fledge hunts at the boundaries where development ends and deployment begins.

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

#### Config-as-Code

Binary configuration supports the same executable JavaScript pattern as other modes:

```bash
# 1. Pipe configuration (highest priority)
echo "export default {entry: './src/server.js'}" | fledge binary --out dist/myapp

# 2. Configuration file (second priority)
fledge binary fledge.config.js --out dist/myapp

# 3. Named export from config file
fledge binary fledge.config.js:binary --out dist/myapp

# 4. CLI flags only (lowest priority)
fledge binary src/server.js --out dist/myapp
```

**Configuration Example:**

```javascript
// fledge.config.js
export const binary = {
  // Entry point: your main server/application file
  entry: "./src/server.js",

  // Output: where to save the executable
  output: "./dist/myapp",

  // Client bundles: browser JavaScript to embed
  bundles: {
    "/app.js": "./src/client.js",
    "/admin.js": "./src/admin.js",
  },

  // Assets: static files to embed in executable
  assets: ["./public", "./templates", "./config.json"],

  // Environment: variables to inject at build time
  env: {
    NODE_ENV: "production",
    API_BASE: "https://api.example.com",
  },

  // SEA options: Node.js Single Executable Application settings
  sea: {
    disableExperimentalSEAWarning: true,
    useSnapshot: false,
    useCodeCache: true,
  },

  // Code signing: macOS executable signing
  signing: {
    enabled: true,
    identity: "Developer ID Application: Your Name (XXXXXXXXXX)",
  },

  // Metadata: executable information
  metadata: {
    name: "My Application",
    version: "1.0.0",
    description: "Standalone server application",
  },
};

// Dynamic configuration example
export const productionBinary = {
  entry: "./boot.js",
  output: `./dist/myapp-${process.platform}-${process.arch}`,

  bundles: async () => {
    // Generate client bundles dynamically
    const pages = await import("./src/pages.js");
    return pages.getClientBundles();
  },

  assets: () => {
    // Conditional assets based on environment
    const base = ["./public", "./templates"];
    if (process.env.INCLUDE_DOCS) {
      base.push("./docs");
    }
    return base;
  },

  env: {
    NODE_ENV: "production",
    BUILD_TIME: new Date().toISOString(),
  },
};
```

#### Binary Generation Process

The binary compilation process is systematic and comprehensive:

1. **Configuration Loading**: Parse config from pipe, file, or CLI flags with named export support
2. **Asset Resolution**: Resolve and validate all asset paths, compute file hashes
3. **Client Bundling**: Use ESBuild to create optimized browser bundles with minification
4. **Server Bundling**: Bundle your Node.js application with embedded asset references
5. **SEA Configuration**: Generate Node.js SEA config with embedded assets and environment variables
6. **Binary Creation**: Copy Node.js runtime and inject application blob using postject
7. **Code Signing**: Sign macOS executables with developer certificates (optional)
8. **Validation**: Test executable launch and report statistics

**Generation Example:**

```bash
# Minimal binary generation
fledge binary src/server.js --out dist/myapp

# Full configuration with validation
fledge binary config.js:binary --validate --verbose

# Production build with signing
fledge binary prod.config.js --out dist/myapp-v1.0.0
```

Generates truly standalone executables containing the Node.js runtime, your application code, and all assets. Larger file size (~100MB) but zero external dependencies—works like Go or Rust binaries. Current platform only, perfect for VPS deployments that skip containerization entirely.

**Real-World Example:**

```javascript
// raven.fledge.js - HelloWorld app configuration
export const binary = {
  entry: "./boot.js",
  output: "./dist/helloworld",

  bundles: {
    "/app.js": "./src/client.js",
    "/admin.js": "./src/admin.js",
  },

  assets: ["./public", "./src/templates"],

  env: {
    NODE_ENV: "production",
    PORT: "3000",
  },

  signing: { enabled: true },

  metadata: {
    name: "HelloWorld Server",
    version: "1.0.0",
  },
};
```

```bash
# Generate the binary
npm run bundle:binary
# → Creates ./dist/helloworld (~100MB)

# Deploy and run anywhere
scp dist/helloworld user@server:/opt/myapp/
ssh user@server '/opt/myapp/helloworld'
# → 🚀 Hello World server running at https://0.0.0.0:3000
```

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

### Binary Mode

```bash
fledge binary [config.js[:exportName]] [options]

# Examples:
echo "export default {entry: './src/server.js'}" | fledge binary --out dist/myapp
fledge binary config.js --out dist/myapp
fledge binary config.js:binary --validate --verbose
fledge binary src/server.js --out dist/myapp

# Options:
--out <path>       Output executable file
--export <name>    Named export from config file
--validate         Validate config and exit
--verbose, -v      Verbose output
--help, -h         Show help
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

### Binary Mode

- Node.js 22.5+
- Node.js SEA (Single Executable Applications) support
- Current platform only (builds for the platform you're running on)
- macOS: Xcode Command Line Tools (for code signing)
- Sufficient disk space (~100MB per executable)

## The Raven's Fledgling

Young ravens undergo systematic development before their first solo hunt—observing prey patterns, practicing flight mechanics, learning territory boundaries. Fledge transforms development applications through the same methodical progression: static crawling for CDN deployment, server-side bundling for lightweight distribution, native compilation for standalone survival. Each mode represents a different deployment maturity, preparing your code to thrive in environments where weak applications perish from dependency failures.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
