# Server Adapters

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](../../../../LICENSE)

HTTP server adapters for Wings routing with zero external dependencies.

## Classes

### NodeHttp

Base HTTP/HTTPS adapter - **not for direct use**.

```js
import { NodeHttp } from "@ravenjs/wings/server/adapters";

// DON'T - meant for extending only
const server = new NodeHttp(router);

// DO - extend for custom implementations
class CustomServer extends NodeHttp {
  // your custom logic
}
```

**SSL Detection**: Automatic HTTPS when both `sslCertificate` and `sslPrivateKey` provided.

**Context Conversion**: Transforms Node.js HTTP requests to Wings Context, handles protocol detection.

### DevServer

Development adapter with WebSocket live-reload.

```js
import { DevServer } from "@ravenjs/wings/server/adapters";

const server = new DevServer(router, { websocketPort: 3456 });
await server.listen(3000);

// Use with Node.js file watching:
// node --watch-path=./src boot.js
```

**HTML Injection**: Automatically injects WebSocket reconnection script before `</body>`.

**File Watching**: Pairs with Node.js `--watch-path` flag for instant server restarts.

**Connection Tracking**: Prevents WebSocket memory leaks via proper cleanup on close.

### ClusteredServer

Production adapter with horizontal scaling and crash recovery.

```js
import { ClusteredServer } from "@ravenjs/wings/server/adapters";

const server = new ClusteredServer(router);
await server.listen(3000);

// Primary process: manages workers
// Worker processes: handle requests
```

**Scaling**: Forks workers across all CPU cores (`availableParallelism()`).

**Crash Recovery**: Instant worker restart on crashes (code !== 0), zero coordination delays.

**Process Detection**: `isMainProcess` and `isWorkerProcess` getters for runtime branching.

**Memory Safety**: Event listener cleanup prevents leaks in long-running processes.

## Integration Patterns

**Development**:

```js
const server = new DevServer(router);
```

**Production**:

```js
const server = new ClusteredServer(router);
```

**Custom Logic**:

```js
class MyServer extends NodeHttp {
  async createContext(req) {
    const context = await super.createContext(req);
    // custom context modifications
    return context;
  }
}
```

## Critical Behaviors

**SSL Mode**: Detected by presence of both certificate and private key - no explicit HTTPS flag.

**Clustering**: Primary process manages workers, workers handle requests. Never mix process roles.

**DevServer Port**: WebSocket server runs on separate port (default: 3456) for live-reload.

**Close Order**: DevServer closes WebSocket connections before HTTP server to prevent connection leaks.

**Worker Communication**: Uses `process.send("ready")` signal for startup coordination - don't interfere.

## Performance Notes

**Zero Dependencies**: All adapters use only Node.js built-ins - no PM2, ws, or other external packages.

**Event-Driven**: Clustering uses pure event architecture with no timeouts or polling.

**Instant Recovery**: Worker crashes trigger immediate replacement without waiting periods.
