# Wings Server Middlewares

Surgical middleware collection for Wings applications. Zero dependencies, maximum efficiency, predatory focus on real-world deployment requirements.

## Core Middlewares

### CORS

```javascript
import { CORS } from "./cors.js";
const cors = new CORS({ origin: ["https://app.com"] });
```

RFC 6454 compliant cross-origin handling. Intelligent preflight optimization, security constraint enforcement.

### Logger

```javascript
import { Logger } from "./logger.js";
const logger = new Logger({ production: true });
```

Beautiful development output, SOC2/ISO27001/GDPR compliant production logs. Error collection architecture.

### Compression

```javascript
import { Compression } from "./compression.js";
const compression = new Compression({ algorithms: ["brotli", "gzip"] });
```

Intelligent content-type detection, algorithm selection. Graceful fallback, memory-efficient streaming.

### LocalFetch

```javascript
import { LocalFetch } from "@raven-js/wings/server/middlewares";

// Blanket-forward all request headers to relative fetch() calls
router.use(new LocalFetch());

// Allow-list example: only forward specific headers (case-insensitive)
router.use(new LocalFetch({ allow: ["authorization", /^x-/i] }));

// Deny-list example: forward everything except cookies
router.use(new LocalFetch({ deny: ["cookie"] }));
```

Transparent, request-scoped enhancement for server-side `fetch()`:

- Resolves relative URLs against `ctx.origin`
- Forwards incoming request headers to `fetch()` (caller-provided headers win)
- Absolute/external URLs are untouched

Isolation is guaranteed via AsyncLocalStorage; no cross-request leakage. After-callback performs best-effort cleanup; ALS scope end ensures GC even on errors.

## Security & Performance

### [Armor](./armor/)

Multi-layered security middleware. Attack detection, rate limiting, security headers, IP validation.

### [Assets](./assets/)

High-performance static file serving. SEA/filesystem/global detection, optimal caching strategies.

## Integration

```javascript
import { Router } from "@raven-js/wings/core";
import { Logger, CORS, Compression } from "@raven-js/wings/server/middlewares";

const router = new Router();

// Order matters - logger first, CORS before routes, compression last
router.useEarly(new Logger());
router.use(new CORS());
router.use(new Compression());
```

**Critical:** Logger requires early registration. CORS must precede route handlers. Compression runs in after-callbacks.

## Philosophy

Each middleware embodies raven survival instincts:

- **Fail-fast validation** - Invalid configurations throw immediately
- **Graceful degradation** - Network failures never break requests
- **Zero external dependencies** - No supply chain vulnerabilities
- **Platform-native performance** - Built on Node.js primitives

Perfect for experienced developers who value functional solutions over framework complexity.
