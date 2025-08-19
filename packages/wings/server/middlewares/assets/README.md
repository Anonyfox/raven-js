# Assets Middleware

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=raven&logoColor=white)](https://ravenjs.dev)

**Multi-source static file serving with transparent deployment mode detection.** Zero-config operation across SEA bundles, JavaScript variables, and traditional filesystems.

## Install

```bash
npm install @raven-js/wings
```

## Usage

```javascript
import { Router } from "@raven-js/wings/core";
import { Assets } from "@raven-js/wings/server/middlewares/assets";

const router = new Router();
const assets = new Assets(); // Zero config - automatic mode detection

router.use(assets);
// → Development: serves from ./public/
// → SEA bundle: serves from embedded resources
// → JS bundle: serves from globalThis.RavenJS.assets
```

**Same code. Three deployment modes. Zero changes.**

## Architecture

**Priority-based source detection:**

1. **SEA mode**: Single Executable Application embedded resources (fastest)
2. **Global mode**: JavaScript variables in memory (fast)
3. **FileSystem mode**: Traditional disk-based serving (flexible)

Mode selection happens transparently based on environment capabilities. No configuration required.

**Security model:**

- Path traversal prevention across all modes
- Only paths starting with `/` served (public assets)
- Mode isolation prevents cross-contamination
- Defense-in-depth validation layers

**Error handling:**

- Wings error collection pattern - no pipeline disruption
- Graceful fallthrough for missing assets
- Initialization failures degrade gracefully

## Performance

**SEA Mode**: In-memory embedded resources

- Asset retrieval: `~0.1ms` (memory access)
- Zero disk I/O during serving
- Manifest-based asset discovery

**Global Mode**: JavaScript variables

- Asset retrieval: `~0.2ms` (object property access)
- Automatic string/Buffer type handling
- Direct memory access pattern

**FileSystem Mode**: Traditional disk serving

- Asset retrieval: `~2-5ms` (disk I/O dependent)
- Lazy asset list generation
- Path security validation overhead

_Measurements on Node.js 22+ with modern SSDs. Your performance depends on deployment environment._

## Examples

### Custom Directory

```javascript
const assets = new Assets({ assetsDir: "static" });
router.use(assets);

// Directory structure:
// static/
//   ├── css/app.css     → GET /css/app.css
//   ├── js/bundle.js    → GET /js/bundle.js
//   └── images/logo.png → GET /images/logo.png
```

### SEA Deployment

```javascript
// SEA mode (automatic detection)
const assets = new Assets(); // assetsDir ignored
router.use(assets);

// Assets served from embedded SEA resources
// Manifest: @raven-js/assets.json lists public assets
// Fastest mode: zero disk I/O, memory-resident
```

### Global Variables Mode

```javascript
// JavaScript-embedded assets
globalThis.RavenJS = {
  assets: {
    "/css/app.css": "body { margin: 0; }",
    "/js/app.js": 'console.log("loaded");',
    "/api/data.json": '{"version": "1.0"}',
  },
};

const assets = new Assets();
router.use(assets);
// Fast mode: direct memory access, automatic type conversion
```

### Error Handling

```javascript
router.use(assets);

// Errors collected without breaking pipeline
router.use((ctx) => {
  if (ctx.errors.length > 0) {
    ctx.errors.forEach((err) => {
      if (err.name === "AssetError") {
        console.log(`Asset serving failed: ${err.message}`);
        console.log(`Mode: ${err.mode}, Path: ${err.path}`);
      }
    });
  }
});
```

## Integration

**Wings Middleware Composition:**

```javascript
import { Router } from "@raven-js/wings/core";
import { Assets } from "@raven-js/wings/server/middlewares/assets";
import { Compression } from "@raven-js/wings/server/middlewares/compression";

const router = new Router();

// Order matters: assets before routing
router.use(new Compression());
router.use(new Assets());

// Your routes
router.get("/api/health", (ctx) => {
  ctx.json({ status: "ok" });
});

// Assets take priority: GET /css/app.css → served by Assets
// Missing assets fallthrough: GET /missing.css → reaches your 404 handler
```

**Security Boundaries:**

```javascript
// All modes enforce identical security model
const assets = new Assets();

// ✅ Public assets served
// GET /css/style.css
// GET /js/app.js
// GET /images/logo.png

// ❌ Security violations blocked
// GET /../etc/passwd      → path traversal (rejected)
// GET /app\..\file       → backslash traversal (rejected)
// GET /file\0            → null byte injection (rejected)
// GET config.json        → no leading slash (rejected)
```

## API

### `new Assets(options?)`

Create Assets middleware with automatic source detection.

**Options:**

- `assetsDir?: string` - Filesystem assets directory (default: `'public'`, ignored in SEA/global modes)
- `identifier?: string` - Middleware identifier for debugging (default: `'@raven-js/wings/assets'`)

**Properties:**

- `mode: 'sea'|'global'|'filesystem'|'uninitialized'` - Current serving mode
- `assetsList: string[]` - Cached available assets
- `assetsPath: string|null` - Resolved assets directory (filesystem mode only)

**Methods:**

- Extends `Middleware` - standard Wings middleware interface

## Requirements

- **Node.js 22+** - Uses native `node:fs/promises`, `node:path`, optional `node:sea`
- **Wings Core** - Middleware base class and Context types
- **Zero external dependencies** - Platform primitives only

Ravens build what conquers.
