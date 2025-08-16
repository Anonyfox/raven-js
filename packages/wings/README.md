# 🦅 Wings: Zero-Dependency Isomorphic Routing for Modern JavaScript

_Your app's flight control: isomorphic router with submodules for SPA, Server, and CLI routing. A single route is a Feather — light, movable, composable._

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/Documentation-Online-blue.svg)](https://docs.ravenjs.dev/wings/)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)
[![ESM](https://img.shields.io/badge/ESM-Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

## What is Wings?

Wings is a **zero-dependency isomorphic routing library** that provides unified routing across different environments. It's designed for developers who want consistent routing patterns whether building SPAs, server applications, or CLI tools. Each route is a **Feather** — lightweight, composable, and easily movable between environments.

**No dependencies. No framework lock-in. No bullshit.**

## Critical Advantages for Seasoned Developers

### 🔄 **Isomorphic Routing**

- **Unified API** - Same routing patterns across SPA, Server, and CLI environments
- **Code sharing** - Route definitions work everywhere without modification
- **Environment agnostic** - Switch between client and server without changing route logic
- **Consistent behavior** - Predictable routing behavior regardless of execution context

### ⚡ **Zero-Dependency Performance**

- **No transitive dependencies** - Eliminates security vulnerabilities and bloat
- **Lightweight Feathers** - Minimal route objects with maximum flexibility
- **Fast route matching** - Optimized pattern matching for all route types
- **Memory efficient** - Small footprint with no complex data structures

### 🎯 **Multi-Environment Support**

- **SPA routing** - PushState navigation with history management
- **Server routing** - Complete Node.js backend with three specialized implementations
- **CLI routing** - Command-line argument parsing and routing
- **Unified patterns** - Consistent route definition syntax across all environments

### 🛡️ **Security-First Design**

- **No eval() or dynamic code execution** - Pure pattern matching for security
- **Input validation** - Built-in parameter validation and sanitization
- **Trust boundary awareness** - Clear separation between trusted and untrusted routes
- **No injection vulnerabilities** - Safe route parameter handling

### 🚀 **Modern Ecosystem Integration**

- **ESM-only** - Leverages modern JavaScript module system
- **Tree-shaking friendly** - Import only the routing modules you need
- **Framework agnostic** - Works with any JavaScript framework or vanilla JS
- **No custom loaders needed** - Pure JavaScript, no special configuration

### 🏢 **Enterprise-Ready Features**

- **Comprehensive test coverage** - Extensive testing for correctness across all environments
- **Middleware support** - Flexible middleware system for cross-cutting concerns
- **Route composition** - Build complex routing from simple Feathers
- **MIT license** - Business-friendly licensing with no vendor lock-in

## Quick Start

```bash
npm install @raven-js/wings
```

```javascript
import { Router } from "@raven-js/wings/core";
import { NodeHttp } from "@raven-js/wings/server";

// Define routes
const router = new Router();
router.get("/", (ctx) => ctx.html("<h1>Hello World!</h1>"));
router.get("/api/users/:id", (ctx) => ctx.json({ id: ctx.params.id }));

// Start server
const server = new NodeHttp(router);
await server.listen(3000);
```

## Core Features

### 🎯 SPA Routing

```javascript
import { Router } from "@raven-js/wings/core";
import { spaRouter } from "@raven-js/wings/spa";

const router = new Router();
router.get("/", () => renderHome());
router.get("/users/:id", (ctx) => renderUser(ctx.params.id));

const spa = spaRouter(router);
spa.start();
```

### 🌐 Server Routing - Complete Node.js Backend

Wings provides three specialized server implementations for different deployment scenarios:

#### **NodeHttp - Minimal Production Server**

```javascript
import { Router } from "@raven-js/wings/core";
import { NodeHttp } from "@raven-js/wings/server";

const router = new Router();
router.get("/api/users", (ctx) => ctx.json({ users: [] }));
router.post("/api/users", async (ctx) => {
  const user = await ctx.json();
  ctx.json({ id: 1, ...user }, 201);
});

const server = new NodeHttp(router, {
  timeout: 30000,
  keepAlive: true,
});
await server.listen(3000);
```

**Use for:** Lightweight microservices, APIs, learning, prototyping

- Zero additional dependencies beyond Node.js core
- Minimal memory footprint (~2-5MB baseline)
- Direct access to native HTTP server
- Single-threaded (blocks on CPU-intensive operations)

#### **DevServer - Development Server with Live Reload**

```javascript
import { Router } from "@raven-js/wings/core";
import { DevServer } from "@raven-js/wings/server";

const router = new Router();
router.get("/", (ctx) => ctx.html("<h1>Hello World!</h1>"));

const devServer = new DevServer(router, {
  websocketPort: 3456, // Custom WebSocket port for live reload
});
await devServer.listen(3000);
// Automatically injects live-reload scripts into HTML responses
```

**Use for:** Local development, rapid iteration, SPAs

- Live-reload capabilities with WebSocket monitoring
- Automatic HTML injection of reload scripts
- Enhanced error reporting for development
- ~5-10MB memory overhead vs NodeHttp

#### **ClusteredServer - Production Server with Clustering**

```javascript
import { Router } from "@raven-js/wings/core";
import { ClusteredServer } from "@raven-js/wings/server";

const router = new Router();
router.get("/api/health", (ctx) => ctx.json({ status: "healthy" }));

const server = new ClusteredServer(router, {
  workers: 4, // Use 4 CPU cores
  healthCheckInterval: 30000, // 30s health checks
  maxRestarts: 5, // Max 5 restarts per worker
  gracefulShutdownTimeout: 30000, // 30s graceful shutdown
});
await server.listen(3000);
```

**Use for:** Production deployments, high-traffic applications

- Multi-process clustering across CPU cores
- Automatic worker health monitoring and restart
- Graceful shutdown with zero-downtime deployments
- Load balancing across worker processes

### 💻 CLI Routing

```javascript
import { cliRouter } from "@raven-js/wings/cli";

const routes = [
  {
    pattern: "build [target]",
    handler: (args) => buildProject(args.target),
  },
  {
    pattern: "deploy --env <environment>",
    handler: (args) => deploy(args.environment),
  },
];

const router = cliRouter(routes);
router.handle(process.argv.slice(2));
```

## Server Performance Characteristics

| Server          | Memory Baseline     | CPU Overhead | Startup Time | Best For                 |
| --------------- | ------------------- | ------------ | ------------ | ------------------------ |
| NodeHttp        | ~2-5MB              | Minimal      | <100ms       | Microservices, APIs      |
| DevServer       | ~5-10MB             | Low          | <200ms       | Development, SPAs        |
| ClusteredServer | ~10-20MB per worker | Medium       | <500ms       | Production, High-traffic |

## Migration from Traditional Frameworks

### From Express.js

```javascript
// Before (Express.js)
const express = require("express");
const app = express();
app.get("/api/users", (req, res) => {
  res.json({ users: [] });
});
app.listen(3000);

// After (Wings Server)
import { Router } from "@raven-js/wings/core";
import { NodeHttp } from "@raven-js/wings/server";

const router = new Router();
router.get("/api/users", (ctx) => ctx.json({ users: [] }));

const server = new NodeHttp(router);
await server.listen(3000);
```

### From Fastify

```javascript
// Before (Fastify)
const fastify = require("fastify")();
fastify.get("/api/users", async (request, reply) => {
  return { users: [] };
});
await fastify.listen({ port: 3000 });

// After (Wings Server)
import { Router } from "@raven-js/wings/core";
import { NodeHttp } from "@raven-js/wings/server";

const router = new Router();
router.get("/api/users", (ctx) => ctx.json({ users: [] }));

const server = new NodeHttp(router);
await server.listen(3000);
```

## Advanced Server Features

### Environment-Specific Configuration

```javascript
import { Router } from "@raven-js/wings/core";
import { NodeHttp, DevServer, ClusteredServer } from "@raven-js/wings/server";

const router = new Router();
// ... your routes ...

// Choose server based on environment
const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

let server;
if (isDev) {
  server = new DevServer(router, { websocketPort: 3456 });
} else if (isProd) {
  server = new ClusteredServer(router, { workers: 4 });
} else {
  server = new NodeHttp(router);
}

await server.listen(3000);
```

### Graceful Shutdown

```javascript
const server = new ClusteredServer(router);
await server.listen(3000);

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await server.close();
  process.exit(0);
});
```

## Installation

```bash
npm install @raven-js/wings
```

## API Reference

### Core Module

The main `@raven-js/wings/core` export provides core routing functionality:

```javascript
import { Router } from "@raven-js/wings/core";

// Create a router with multiple routes
const router = new Router();
router.get("/", (ctx) => ctx.html("<h1>Home</h1>"));
router.get("/api/users/:id", (ctx) => ctx.json({ id: ctx.params.id }));
```

### SPA Module

```javascript
import { Router } from "@raven-js/wings/core";
import { spaRouter } from "@raven-js/wings/spa";

// Create SPA router with pushState support
const router = new Router();
router.get("/", () => renderHome());
router.get("/users/:id", (ctx) => renderUser(ctx.params.id));

const spa = spaRouter(router);
spa.start();
```

### Server Module

```javascript
import { Router } from "@raven-js/wings/core";
import { NodeHttp, DevServer, ClusteredServer } from "@raven-js/wings/server";

// Create server router with HTTP method support
const router = new Router();
router.get("/api/users", (ctx) => ctx.json({ users: [] }));
router.post("/api/users", async (ctx) => {
  const user = await ctx.json();
  ctx.json({ id: 1, ...user }, 201);
});

// Choose your server implementation
const server = new NodeHttp(router);
await server.listen(3000);
```

### CLI Module

```javascript
import { cliRouter } from "@raven-js/wings/cli";

// Create CLI router with argument parsing
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

## Roadmap

- [ ] Route composition and nesting
- [ ] Middleware support for all environments
- [ ] Advanced pattern matching (regex, wildcards)
- [ ] Route guards and authentication
- [ ] Performance optimizations
- [ ] TypeScript definitions
- [ ] Integration examples with popular frameworks

## Contributing

Wings is part of the RavenJS toolkit. See the [main repository](https://github.com/Anonyfox/raven-js) for contribution guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

</div>
