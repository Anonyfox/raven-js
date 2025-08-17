# 🦅 Wings: Zero-Dependency Isomorphic Routing

_Your app's flight control. Same routes work everywhere - server, CLI, wherever. No dependencies, no framework lock-in, no bullshit._

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/Documentation-Online-blue.svg)](https://docs.ravenjs.dev/wings/)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)
[![ESM](https://img.shields.io/badge/ESM-Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

## What Raven Built

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
import { DevServer, ClusteredServer, Logger } from "@raven-js/wings/server";

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

**DevServer** - Development with live-reload. WebSocket-based browser reload. For file watching: `node --watch-path=./src boot.js`. Server restart triggers browser reload automatically.

**ClusteredServer** - Production with scaling. Uses all CPU cores for horizontal scaling. Automatically restarts crashed workers. Zero logging by default to prevent disk filling.

**NodeHttp** - Base class (extend for custom implementations). NOT meant for direct use. Lightweight with zero dependencies.

## CLI Routing

```javascript
import { cliRouter } from "@raven-js/wings/cli";

const routes = [
  { pattern: "build [target]", handler: (args) => buildProject(args.target) },
  {
    pattern: "deploy --env <environment>",
    handler: (args) => deploy(args.environment),
  },
];

const router = cliRouter(routes);
router.handle(process.argv.slice(2));
```

## Environment-Specific Setup

```javascript
const isDev = process.env.NODE_ENV === "development";
const server = isDev ? new DevServer(router) : new ClusteredServer(router);
await server.listen(3000);
```

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
import { DevServer, ClusteredServer, Logger } from "@raven-js/wings/server";

const router = new Router();

// Add logging middleware (use with server adapters)
router.useEarly(new Logger());

router.get("/api/users", (ctx) => ctx.json({ users: [] }));

// Development
const devServer = new DevServer(router);
await devServer.listen(3000);

// Production
const server = new ClusteredServer(router);
await server.listen(3000);
```

**Logger Middleware**: Request logging with colored terminal output (development) or structured JSON (production). Includes performance indicators (⚡🚀🐌), request tracing, and compliance standards (SOC2, ISO 27001, GDPR).

**ClusteredServer Helpers**: `isMainProcess` and `isWorkerProcess` getters for process identification in clustered environments.

### CLI Module

```javascript
import { cliRouter } from "@raven-js/wings/cli";

const routes = [
  { pattern: "build [target]", handler: (args) => buildProject(args.target) },
  {
    pattern: "deploy --env <environment>",
    handler: (args) => deploy(args.environment),
  },
];

const router = cliRouter(routes);
router.handle(process.argv.slice(2));
```

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

</div>
