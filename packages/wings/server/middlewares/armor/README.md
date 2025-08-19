# Armor Security Middleware

Zero-dependency production security middleware implementing defense-in-depth strategy. Two-phase processing: blocking pre-checks → route handling → security headers.

**Performance**: O(1) most operations, sliding window rate limiting, automatic memory cleanup
**Memory**: O(k×r) where k = unique keys, r = requests per window
**Integration**: Drop-in Wings middleware, standard HTTP compatible

## Install

```bash
npm install @raven-js/wings
```

## Quick Start

```javascript
import { Armor } from "@raven-js/wings/server/middlewares/armor";

const armor = new Armor();
router.use(armor);
// Provides: security headers, request validation, attack detection
```

## Security Layers

1. **IP Access Control** - Whitelist/blacklist with CIDR, proxy-aware
2. **Rate Limiting** - Sliding window algorithm, per-route limits
3. **Request Validation** - DoS protection via size/structure limits
4. **Attack Detection** - SQL injection, XSS, path traversal patterns
5. **Security Headers** - CSP, HSTS, COEP/COOP modern protections

## Production Setup

```javascript
const armor = new Armor({
  rateLimiting: {
    enabled: true,
    global: { max: 1000, windowMs: 3600000 }, // 1000/hour
    routes: {
      "/api/auth/": { max: 5, windowMs: 900000 }, // 5/15min
      "/api/": { max: 100, windowMs: 60000 }, // 100/minute
    },
  },
  ipAccess: {
    mode: "blacklist",
    blacklist: ["192.168.1.100", "10.0.0.0/8"],
    trustProxy: true, // Behind load balancer
  },
  securityHeaders: {
    contentSecurityPolicy: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "https://cdn.trusted.com"],
    },
    httpStrictTransportSecurity: {
      maxAge: 63072000, // 2 years
      preload: true,
    },
  },
});
```

## API Gateway Config

```javascript
const armor = new Armor({
  rateLimiting: {
    enabled: true,
    keyGenerator: (ctx) => {
      const apiKey = ctx.requestHeaders.get("x-api-key") || "anon";
      const ip = getClientIP(ctx, true);
      return `${apiKey}:${ip}`;
    },
    global: { max: 10000, windowMs: 3600000 },
  },
  requestValidation: {
    maxBodySize: 10485760, // 10MB uploads
    maxHeaders: 50,
  },
});
```

## Development Mode

```javascript
const armor = new Armor({
  securityHeaders: {
    contentSecurityPolicy: false, // Dev tools compatibility
    httpStrictTransportSecurity: false,
  },
  rateLimiting: { enabled: false },
  attackDetection: { sqlInjection: false },
});
```

## Error Events

Security events logged to `ctx.errors`:

- `IPBlocked` - IP denied by access control
- `RateLimitExceeded` - Rate limit violation
- `RequestValidationError` - Oversized/malformed request
- `AttackPatternDetected` - Suspicious patterns detected
- `SecurityHeaderError` - Header setting failure (non-blocking)

## Configuration

### Rate Limiting

```javascript
rateLimiting: {
  enabled: boolean,
  global: { max: number, windowMs: number },
  routes: { [path]: { max: number, windowMs: number } },
  keyGenerator: (ctx) => string, // Custom key function
  cleanupInterval: number // Memory cleanup interval (ms)
}
```

### IP Access Control

```javascript
ipAccess: {
  mode: 'disabled' | 'whitelist' | 'blacklist',
  whitelist: string[], // IPs and CIDR ranges
  blacklist: string[],
  trustProxy: boolean // Trust X-Forwarded-For
}
```

### Request Validation

```javascript
requestValidation: {
  enabled: boolean,
  maxPathLength: number,
  maxQueryParams: number,
  maxQueryParamLength: number,
  maxHeaders: number,
  maxHeaderSize: number, // Total header bytes
  maxBodySize: number
}
```

### Security Headers

```javascript
securityHeaders: {
  enabled: boolean,
  contentSecurityPolicy: object | false,
  httpStrictTransportSecurity: object | false,
  frameOptions: 'DENY' | 'SAMEORIGIN' | string,
  noSniff: boolean,
  xssProtection: string | boolean,
  referrerPolicy: string,
  permissionsPolicy: object
}
```

## Performance Monitoring

```javascript
const stats = armor.getStats();
console.log(stats.rateLimit); // { totalKeys: 150, totalRequests: 2847 }
console.log(stats.config.enabled); // true

// Reset rate limits (testing/emergency)
armor.clearRateLimits();
```

## Memory Management

Rate limiting uses sliding window with automatic cleanup:

- **Cleanup Interval**: 5 minutes default
- **Memory Growth**: Linear with unique request keys
- **Production Impact**: O(k) CPU spike during cleanup
- **Capacity Planning**: Monitor totalKeys and totalRequests

## Security Trade-offs

- **Pattern Matching**: CPU cost vs attack detection coverage
- **Rate Limiting**: Memory usage vs precise sliding windows
- **IP Filtering**: Proxy trust vs spoofing protection
- **Header Setting**: First-wins policy vs application control

## Integration Notes

**Middleware Order**: Place Armor before route handlers, after body parsing
**Header Conflicts**: Application headers preserved (first-wins)
**Proxy Setup**: Configure `trustProxy: true` behind load balancers
**Error Handling**: Security failures logged, responses continue
**Memory Leaks**: Automatic cleanup prevents unbounded growth
