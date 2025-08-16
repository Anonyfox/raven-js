/**
 * @packageDocumentation
 *
 * # Wings Server - Node.js Backend Runtime
 *
 * Complete runtime adapters for Wings routers in Node.js environments.
 *
 * ## Server Implementations
 *
 * **DevServer** - Use for development with live-reload
 * - WebSocket-based browser reload
 * - For file watching: `node --watch-path=./src boot.js`
 * - Server restart triggers browser reload automatically
 *
 * **ClusteredServer** - Use for production with scaling
 * - Uses all CPU cores for horizontal scaling
 * - Automatically restarts crashed workers
 * - Zero logging by default to prevent disk filling
 *
 * **NodeHttp** - Base class (extend for custom implementations)
 * - NOT meant for direct use
 * - Lightweight with zero dependencies
 * - Extend when building custom server implementations
 *
 * ## Quick Start
 *
 * ```javascript
 * import { Router } from '@ravenjs/wings/core';
 * import { DevServer, ClusteredServer } from '@ravenjs/wings/server';
 *
 * const router = new Router();
 * router.get('/api/users', (ctx) => {
 *   ctx.json({ users: [] });
 * });
 *
 * // Development
 * const devServer = new DevServer(router);
 * await devServer.listen(3000);
 *
 * // Production
 * const server = new ClusteredServer(router);
 * await server.listen(3000);
 * ```
 *
 * ## Environment-Specific Setup
 *
 * ```javascript
 * const isDev = process.env.NODE_ENV === 'development';
 * const server = isDev ? new DevServer(router) : new ClusteredServer(router);
 * await server.listen(3000);
 * ```
 */

export { ClusteredServer } from "./clustered-server.js";
export { DevServer } from "./dev-server.js";
export * from "./node-http.js";
export * from "./server-options.js";
