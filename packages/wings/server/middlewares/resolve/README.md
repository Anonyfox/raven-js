# Resolve Middleware

**Zero-build ES module development middleware for Wings.**

Enables seamless ESM development with automatic import map generation, HTML injection, and JavaScript module serving. Eliminates bundling during development while maintaining full npm package support.

## ⚠️ **DEVELOPMENT ONLY**

**NEVER use this middleware in production.** It serves raw source files without optimization, minification, or bundling. Production deployments require proper build tools.

## Requirements

- **Modern JavaScript only** - `.js` and `.mjs` files
- **Native ES modules** - `import`/`export` syntax
- **No transpilation** - browsers must execute code as-is
- **Node.js 18+** - for import maps and ESM support

**Not supported:** TypeScript, JSX, CommonJS, Babel, or any transpilation.

## Quick Start

```javascript
import { Router } from "@wings/core";
import { Resolve } from "@wings/server/middlewares/resolve";

const router = new Router();

// Basic usage
router.use(
  new Resolve({
    sourceFolder: "./src",
  })
);

// Custom import map path
router.use(
  new Resolve({
    sourceFolder: "./src",
    importMapPath: "/my-imports.json",
  })
);
```

## How It Works

### 1. **Import Map Generation**

Scans `package.json` dependencies and generates browser-compatible import maps:

```json
{
  "imports": {
    "react": "/node_modules/react/index.js",
    "@my/package": "/node_modules/@my/package/dist/index.js"
  }
}
```

### 2. **HTML Injection**

Automatically injects import map script tags into HTML responses:

```html
<head>
  <script type="importmap" src="/importmap.json"></script>
  <title>Your App</title>
</head>
```

### 3. **Module Serving**

Serves JavaScript files directly from your source folder with security validation:

```javascript
// Browser can directly import from source
import { utils } from "./lib/utils.js";
import { Component } from "react";
```

## Configuration

```javascript
new Resolve({
  sourceFolder: string,    // Required - root folder for JS modules
  importMapPath?: string   // Optional - defaults to "/importmap.json"
})
```

### `sourceFolder`

- **Required** - Absolute path to serve JS modules from
- Can be same as or different from static asset folder
- Security validated to prevent path traversal

### `importMapPath`

- **Optional** - URL path for import map endpoint
- Defaults to `/importmap.json`
- Must not conflict with existing routes

## Security Features

- **Path traversal prevention** - Blocks `../` and `..\\` attempts
- **Hidden file protection** - Rejects `.hidden` file access
- **Extension validation** - Only serves `.js` and `.mjs` files
- **Source boundary enforcement** - Files must be within `sourceFolder`

## Package Resolution

Follows Node.js resolution algorithm with modern ESM support:

1. **`exports` field** - Conditional exports with `import` condition priority
2. **`module` field** - ESM entry point fallback
3. **`main` field** - Standard entry point fallback
4. **`index.js`** - Default fallback

Supports complex exports patterns:

```json
{
  "exports": {
    ".": {
      "import": "./esm/index.js",
      "require": "./cjs/index.js"
    }
  }
}
```

## Performance Characteristics

- **Zero caching** - Immediate reflection of source changes
- **O(1) import map serving** - Generated once per request
- **Minimal overhead** - Direct file serving without transformation
- **V8 optimized** - Uses `Object.create(null)` for import maps

## Error Handling

- **Security violations** - Throws descriptive errors
- **Missing files** - Passes through to next middleware (404s)
- **Malformed packages** - Graceful fallback to empty import map
- **File read errors** - Propagates with context

## Examples

### Basic React Development

```javascript
// package.json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}

// src/app.js
import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => <h1>Hello World</h1>;
createRoot(document.getElementById('root')).render(<App />);
```

### Workspace Packages

```javascript
// Works with monorepo workspace packages
import { shared } from "@my-workspace/shared";
import { utils } from "./utils.js";
```

### Custom Libraries

```javascript
// Any npm package with proper ESM exports
import { html } from "lit-html";
import { signal } from "@preact/signals";
```

## Integration Notes

- **Middleware ordering** - Place before static file serving
- **Asset coordination** - Can share or differ from public asset folder
- **HTML responses** - Automatically detects and injects import maps
- **After-handlers** - Uses Wings callback system for injection timing

## Limitations

- **Development only** - No production optimizations
- **Modern browsers** - Requires native ESM and import map support
- **Source files only** - No build step or transpilation
- **Security focused** - Strict path validation may reject edge cases

## Why Use This?

**Eliminates build step complexity during development:**

- No webpack/vite configuration
- No babel/typescript compilation
- No bundle watching/reloading
- No sourcemap generation

**Maintains npm ecosystem compatibility:**

- Direct package imports work
- No import rewriting needed
- Standard package.json resolution
- Proper conditional exports support

**Rapid iteration cycle:**

- Save file → refresh browser
- Zero compilation delay
- Instant change reflection
- Native debugging experience

Perfect for experienced developers who want **fast, simple development** without framework overhead.
