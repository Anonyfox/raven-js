# @raven-js/wings/core

[![Website](https://img.shields.io/badge/website-ravenjs.dev-black?style=flat-square)](https://ravenjs.dev)
[![NPM Version](https://img.shields.io/npm/v/@raven-js/wings?style=flat-square)](https://www.npmjs.com/package/@raven-js/wings)
[![License](https://img.shields.io/npm/l/@raven-js/wings?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/node/v/@raven-js/wings?style=flat-square)](package.json)

**Zero-dependency isomorphic HTTP router.** Trie-based O(1) matching for serverless, browser, Node.js.

```bash
npm install @raven-js/wings
```

```javascript
import { Router, Route, Context } from "@raven-js/wings";

const router = new Router();
router.add(
  Route.GET("/users/:id", (ctx) => ctx.json({ id: ctx.pathParams.id }))
);

const ctx = new Context(
  "GET",
  new URL("https://api.com/users/123"),
  new Headers()
);
router.handle(ctx);
```

## API

**Router** - route registration, Trie matching, middleware execution
**Route** - HTTP method + path + handler + middleware
**Context** - mutable request/response state
**Middleware** - before/after callback functions

## Routes

```javascript
Route.GET("/users/:id", handler); // Named params
Route.POST("/users", handler, { middleware: [auth] }); // With middleware
Route.GET("/files/*", handler); // Wildcards
Route.GET("/search/:query?", handler); // Optional params
Route.COMMAND("/deploy", handler); // CLI commands

// Constraints
Route.GET("/users/:id", handler, { constraints: { id: "\\d+" } });
```

## Context

```javascript
// Request
ctx.method, ctx.path, ctx.pathParams, ctx.queryParams;
ctx.requestHeaders, ctx.requestBody();

// Response
ctx.json(data), ctx.text(str), ctx.html(markup);
ctx.redirect(url), ctx.notFound(), ctx.serverError();
ctx.responseStatusCode, ctx.responseHeaders, ctx.responseBody;
```

## Middleware

```javascript
const auth = new Middleware((ctx) => {
  if (!ctx.requestHeaders.get("authorization")) {
    ctx.unauthorized();
    return;
  }
});

Route.GET("/profile", handler, { middleware: [auth] });
```

## Performance

- **String pooling** - MIME types, headers, status codes interned
- **Bit flags** - HTTP method operations via bitwise math
- **Caching** - parsed bodies, MIME detection, route matching

```javascript
import {
  isMethodAllowed,
  METHOD_COMBINATIONS,
  getMimeType,
} from "@raven-js/wings";

isMethodAllowed("GET", METHOD_COMBINATIONS.READ_METHODS); // Bitwise check
getMimeType("file.pdf"); // Cached lookup
```

**Node.js** 22.5.0+ **|** **Browsers** ES2022+

MIT © [Anonyfox](https://anonyfox.com)
