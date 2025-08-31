# 🦅 Wings: Zero-Dependency Isomorphic Routing

_Your app's flight control. Same routes work everywhere - server, CLI, wherever. No dependencies, no framework lock-in, no bullshit._

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/Documentation-Online-blue.svg)](https://docs.ravenjs.dev/wings/)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)
[![ESM](https://img.shields.io/badge/ESM-Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

<div align="center">
  <img src="./media/logo.webp" alt="Wings Logo" width="200" height="200" />
</div>

Wings gives you isomorphic routing that actually works. Define routes once, use them everywhere. Server, CLI, doesn't matter. Each route is a Feather - light, movable, composable.

**Zero dependencies. Modern JavaScript. Ship it.**

## Why Wings Works

**Same routes everywhere.** Your route definitions work on server and CLI without modification. No more rewriting logic for different environments.

**Zero bloat.** No transitive dependencies to rot or break. Just pure JavaScript that does what you need.

**Modern by default.** ESNext features without transpilation. If your environment can't handle modern JS, it's time to upgrade.

**Framework agnostic.** Works with anything or nothing. No lock-in, no special configuration.

## Quick Start

```bash
npm install @raven-js/wings
```

```javascript
import { Router } from "@raven-js/wings/core";
import {
  DevServer,
  ClusteredServer,
  Logger,
  generateSSLCert,
} from "@raven-js/wings/server";

// Define routes once
const router = new Router();

// Add logging middleware (use with server adapters)
router.useEarly(new Logger());

router.get("/", (ctx) => ctx.html("<h1>Hello World!</h1>"));
router.get("/api/users/:id", (ctx) => ctx.json({ id: ctx.params.id }));

// Use DevServer for development
const devServer = new DevServer(router);
await devServer.listen(3000);

// Use ClusteredServer for production
const server = new ClusteredServer(router);
await server.listen(3000);
```

## Server Implementations

**DevServer** - Development with live-reload and HTTPS support. WebSocket-based browser reload that actually works. For file watching: `node --watch-path=./src boot.js`. Server restart triggers browser reload automatically. Built-in HTTPS support for testing real-world scenarios.

**ClusteredServer** - Production scaling without the complexity. Uses all CPU cores for horizontal scaling. Automatically restarts crashed workers (no PM2 needed). Zero logging by default to prevent disk filling. HTTPS support with same simple API as HTTP.

**NodeHttp** - Base class that gets out of your way. NOT meant for direct use (extend for custom implementations). Lightweight with zero dependencies. HTTP/HTTPS detection built-in, no special configuration.

## HTTPS Support

Every server supports HTTPS with two simple options. No certificates? Generate them in one line. Need custom certificates? Just pass them in. It's that simple.

```javascript
import {
  DevServer,
  ClusteredServer,
  generateSSLCert,
} from "@raven-js/wings/server";

// Generate certificates (development)
const { privateKey, certificate } = await generateSSLCert();
const server = new DevServer(router, {
  sslCertificate: certificate,
  sslPrivateKey: privateKey,
});
await server.listen(3000); // https://localhost:3000

// Production with your certificates
const prodServer = new ClusteredServer(router, {
  sslCertificate: fs.readFileSync("cert.pem", "utf8"),
  sslPrivateKey: fs.readFileSync("key.pem", "utf8"),
});
await prodServer.listen(443);
```

## Terminal Runtime

Transform CLI commands into URL patterns, then leverage the blazing-fast HTTP router for command dispatch. COMMAND routes are separate from HTTP routes but use the same O(1) Trie matching.

```javascript
import { Router } from "@raven-js/wings/core";
import { Terminal, success, table } from "@raven-js/wings/terminal";

const router = new Router();

// CLI commands use router.cmd() (COMMAND method)
router.cmd("/users/list", async (ctx) => {
  const active = ctx.queryParams.get("active") === "true";
  const users = await getUsers({ active });
  table(users); // Built-in terminal table renderer
});

router.cmd("/deploy/:env", async (ctx) => {
  const env = ctx.pathParams.env;
  await deployToEnvironment(env);
  success(`Deployed to ${env}`);
});

// CLI execution: args → URL pattern → fast router matching
const terminal = new Terminal(router);
await terminal.run(process.argv.slice(2));

// Usage: node app.js users list --active
//        node app.js deploy production
```

## Environment-Specific Setup

```javascript
const isDev = process.env.NODE_ENV === "development";
const server = isDev ? new DevServer(router) : new ClusteredServer(router);
await server.listen(3000);
```

### RAVENJS_ORIGIN Auto-Detection

Wings automatically sets `RAVENJS_ORIGIN` environment variable for SSR components. This enables relative URLs to resolve correctly during server-side rendering.

```javascript
// Wings automatically sets based on server configuration:
// RAVENJS_ORIGIN = "http://localhost:3000"   (development)
// RAVENJS_ORIGIN = "https://your-domain.com" (production)

// Your SSR components can use relative URLs:
const response = await fetch("/api/data"); // Works in SSR!
```

**Manual Override (containers, reverse proxies):**

```javascript
// Set before server starts - Wings respects explicit values
process.env.RAVENJS_ORIGIN = "https://api.example.com";
await server.listen(3000);
// Wings will NOT override your explicit setting
```

**Common use cases:**

- **Containers:** `RAVENJS_ORIGIN=https://your-domain.com`
- **Reverse proxies:** `RAVENJS_ORIGIN=https://api.internal:8080`
- **Development:** Auto-detected as `http://localhost:3000`
- **Testing:** Set explicit value for consistent test URLs

## Migration from Express

```javascript
// Before (Express.js)
const express = require("express");
const app = express();
app.get("/api/users", (req, res) => res.json({ users: [] }));
app.listen(3000);

// After (Wings)
import { Router } from "@raven-js/wings/core";
import { DevServer } from "@raven-js/wings/server";

const router = new Router();
router.get("/api/users", (ctx) => ctx.json({ users: [] }));

const server = new DevServer(router);
await server.listen(3000);
```

## Installation

```bash
npm install @raven-js/wings
```

## API Reference

### Core Module

```javascript
import { Router } from "@raven-js/wings/core";

const router = new Router();
router.get("/", (ctx) => ctx.html("<h1>Home</h1>"));
router.get("/api/users/:id", (ctx) => ctx.json({ id: ctx.params.id }));
```

### Server Module

```javascript
import { Router } from "@raven-js/wings/core";
import {
  DevServer,
  ClusteredServer,
  Logger,
  generateSSLCert,
} from "@raven-js/wings/server";

const router = new Router();

// Add logging middleware (use with server adapters)
router.useEarly(new Logger());

router.get("/api/users", (ctx) => ctx.json({ users: [] }));

// Development (HTTP)
const devServer = new DevServer(router);
await devServer.listen(3000);

// Development (HTTPS)
const { privateKey, certificate } = await generateSSLCert();
const httpsServer = new DevServer(router, {
  sslCertificate: certificate,
  sslPrivateKey: privateKey,
});
await httpsServer.listen(3000);

// Production
const server = new ClusteredServer(router);
await server.listen(3000);
```

**Logger Middleware**: Request logging with colored terminal output (development) or structured JSON (production). Includes performance indicators (⚡🚀🐌), request tracing, and compliance standards (SOC2, ISO 27001, GDPR).

**ClusteredServer Helpers**: `isMainProcess` and `isWorkerProcess` getters for process identification in clustered environments.

### Terminal Module

```javascript
import { Router } from "@raven-js/wings/core";
import {
  Terminal,
  ask,
  confirm,
  success,
  error,
  table,
  bold,
} from "@raven-js/wings/terminal";

const router = new Router();

// Interactive CLI commands
router.cmd("/setup", async (ctx) => {
  const name = await ask("Project name: ");
  const confirmed = await confirm(`Create ${bold(name)}?`);

  if (confirmed) {
    await createProject(name);
    success("Project created!");
  }
});

// Data display
router.cmd("/users", async (ctx) => {
  const users = await getUsers();
  table(users); // ASCII table output
});

const terminal = new Terminal(router);
await terminal.run(process.argv.slice(2));
```

**Available actions**: `ask()`, `confirm()` (async input) • `success()`, `error()`, `warning()`, `info()`, `print()` (colored output) • `bold()`, `italic()`, `dim()`, `underline()` (text formatting) • `table()` (structured data display)

## Combined Runtimes

Your app becomes multi-purpose. Starts as CLI tool but can boot into web server mode using the same router. Single deliverable handles both operational commands and web serving.

```javascript
import { Router } from "@raven-js/wings/core";
import { ClusteredServer } from "@raven-js/wings/server";
import { Terminal, success, info } from "@raven-js/wings/terminal";

const router = new Router();

// HTTP routes for web traffic
router.get("/", (ctx) => ctx.html("<h1>Hello, World!</h1>"));
router.get("/api/users", (ctx) => ctx.json({ users: [] }));
router.get("/health", (ctx) => ctx.json({ status: "ok" }));

// CLI operational commands
router.cmd("/migrate", async (ctx) => {
  info("Running database migrations...");
  await runMigrations();
  success("Migrations completed");
});

router.cmd("/seed", async (ctx) => {
  await seedDatabase();
  success("Database seeded");
});

router.cmd("/backup", async (ctx) => {
  const filename = await backupDatabase();
  success(`Backup created: ${filename}`);
});

// CLI command that boots web server
router.cmd("/boot", async (ctx) => {
  info("Starting web server...");
  const server = new ClusteredServer(router);
  await server.listen(3000);
  success("Server running on port 3000");
  // Server now handles HTTP routes while CLI commands remain available
});

// Start in CLI mode
const terminal = new Terminal(router);
await terminal.run(process.argv.slice(2));
```

**Usage patterns**:

```bash
# Operational commands
node app.js migrate
node app.js seed
node app.js backup

# Boot web server (uses same router for HTTP routes)
node app.js boot

# In another terminal, operational commands still work
node app.js health-check
```

**Deployment advantages**: Your final application handles its own operational needs. No separate migration scripts, backup tools, or health check utilities needed. One deliverable, multiple operational modes.

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

</div>
