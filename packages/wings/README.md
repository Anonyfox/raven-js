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
- **Server routing** - HTTP request routing with middleware support
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
import { createRouter } from "@raven-js/wings";
import { spaRouter } from "@raven-js/wings/spa";
import { serverRouter } from "@raven-js/wings/server";
import { cliRouter } from "@raven-js/wings/cli";

// Define routes as Feathers
const routes = [
  { path: "/", handler: () => "Home" },
  { path: "/users/:id", handler: (params) => `User ${params.id}` },
  { path: "/api/posts", handler: () => ({ posts: [] }) },
];

// Use in different environments
const spa = spaRouter(routes);
const server = serverRouter(routes);
const cli = cliRouter(routes);
```

## Core Features

### 🎯 SPA Routing

```javascript
import { spaRouter } from "@raven-js/wings/spa";

const routes = [
  { path: "/", handler: () => renderHome() },
  { path: "/users/:id", handler: (params) => renderUser(params.id) },
  { path: "/posts/:slug", handler: (params) => renderPost(params.slug) },
];

const router = spaRouter(routes);
router.start();
```

### 🌐 Server Routing

```javascript
import { serverRouter } from "@raven-js/wings/server";

const routes = [
  {
    path: "/api/users/:id",
    method: "GET",
    handler: (params, req, res) => {
      const user = getUserById(params.id);
      res.json(user);
    },
  },
];

const router = serverRouter(routes);
```

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

## Installation

```bash
npm install @raven-js/wings
```

## API Reference

### Core Module

The main `@raven-js/wings` export provides core routing functionality:

```javascript
import { createRouter, createFeather } from "@raven-js/wings";

// Create a route definition (Feather)
const homeFeather = createFeather("/", () => "Home");

// Create a router with multiple routes
const router = createRouter([homeFeather]);
```

### SPA Module

```javascript
import { spaRouter, pushState } from "@raven-js/wings/spa";

// Create SPA router with pushState support
const router = spaRouter(routes);

// Navigate programmatically
pushState("/users/123");

// Listen for route changes
router.on("change", (route) => {
  console.log("Route changed to:", route.path);
});
```

### Server Module

```javascript
import { serverRouter, httpHandler } from "@raven-js/wings/server";

// Create server router with HTTP method support
const router = serverRouter(routes);

// Use with any HTTP server
const handler = httpHandler(router);
```

### CLI Module

```javascript
import { cliRouter, parseArgs } from "@raven-js/wings/cli";

// Create CLI router with argument parsing
const router = cliRouter(routes);

// Handle command line arguments
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
