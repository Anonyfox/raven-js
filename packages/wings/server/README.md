# @raven-js/wings/server

[![Website](https://img.shields.io/badge/website-ravenjs.dev-black?style=flat-square)](https://ravenjs.dev)
[![Zero Deps](https://img.shields.io/badge/deps-0-black?style=flat-square)](#)
[![ESM Only](https://img.shields.io/badge/esm-only-black?style=flat-square)](#)
[![Node](https://img.shields.io/badge/node-%3E%3D22.5-black?style=flat-square)](#)

Zero-dependency server adapters and middlewares for Wings. Platform-native performance, SSR ergonomics, and battle-tested HTTP primitives.

## Purpose

Wings/server provides the server-side pieces you actually need: structured logging, CORS, compression, static assets, security hardening, module resolution for dev, and request-scoped `fetch()` that behaves like the browser (LocalFetch). All built on Node’s native Web APIs and AsyncLocalStorage.

## Installation

```bash
npm install @raven-js/wings
```

## Usage

```javascript
import { Router } from "@raven-js/wings/core";
import { DevServer, ClusteredServer } from "@raven-js/wings/server";
import { Logger, CORS, Compression, Assets, Resolve, Armor, LocalFetch } from "@raven-js/wings/server";

const router = new Router();

// Order matters: logger early, CORS before routes, compression in after callbacks
router.useEarly(new Logger());
router.use(new CORS());
router.use(new Armor());

// Browser-like fetch in SSR: relative URLs, header forwarding, request isolation
router.use(new LocalFetch());

// Static assets and dev module server
router.use(new Assets());
router.use(new Resolve());

// Optional compression (runs as after-callback)
router.use(new Compression());

// Start a development server with live reload
await new DevServer(router).listen(3000);
```

### LocalFetch (SSR-friendly fetch)

Request-scoped enhancement for `fetch()`:

- Resolves relative URLs against `ctx.origin`
- Forwards incoming request headers to internal `fetch()` calls (caller headers win)
- Absolute/external URLs are untouched
- Isolation guaranteed via AsyncLocalStorage

```javascript
import { LocalFetch } from "@raven-js/wings/server";

// Blanket-forward all headers
router.use(new LocalFetch());

// Allow-list: only forward certain headers
router.use(new LocalFetch({ allow: ["authorization", /^x-/i] }));

// Deny-list: forward everything except cookies
router.use(new LocalFetch({ deny: ["cookie"] }));
```

## Adapters

### Node HTTP (base)

Foundation adapter that translates Node’s HTTP/HTTPS requests into Wings `Context`. Handles protocol/host detection and SSL based on provided certificate + key. Not intended for direct use, extend for custom servers.

### DevServer

Development adapter with WebSocket live-reload support.

- Injects reconnection script into HTML responses (before `</body>`)
- Plays nicely with `node --watch-path`
- Cleans up WS connections on shutdown to prevent leaks

```js
import { DevServer } from "@raven-js/wings/server";
await new DevServer(router).listen(3000);
```

### ClusteredServer

Production adapter with horizontal scaling + crash recovery.

- Forks workers across all CPU cores
- Instant worker restart on crash
- Clean process role separation (primary vs workers)

```js
import { ClusteredServer } from "@raven-js/wings/server";
await new ClusteredServer(router).listen(3000);
```

## Middlewares (overview)

- **Logger**: Development-friendly colored logs; production JSON; error collection.
- **CORS**: RFC 6454 compliant origin handling; preflight optimization.
- **Armor**: IP access control, rate limiting, request validation, attack detection, security headers.
- **Assets**: Static asset serving with optimal caching and environment detection.
- **Resolve**: Dev-time ESM module resolver / module server, HTML injection helpers.
- **Compression**: Brotli/gzip with intelligent content-type detection; after-callback execution.
- **LocalFetch**: Request-scoped `fetch()` enhancement (relative URL resolution, header forwarding, ALS isolation).

## Requirements

- Node.js 22.5+
- ESM only
- Zero external dependencies

## The Raven’s Server

Ravens hunt with focus and share what works. Wings/server brings surgical, zero-nonsense middlewares that make SSR and HTTP pipelines fast, predictable, and easy to reason about.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
