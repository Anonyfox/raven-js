/**
 * @packageDocumentation
 *
 * # Wings Server - Node.js Backend Runtime
 *
 * The Wings server submodule provides complete runtime adapters that transform
 * Wings routers into traditional Node.js backend applications. It offers three
 * specialized server implementations optimized for different deployment scenarios.
 *
 * ## Server Implementations
 *
 * ### NodeHttp - Minimal Production Server
 * **Use for:** Lightweight microservices, APIs, learning, prototyping
 * - Zero additional dependencies beyond Node.js core
 * - Minimal memory footprint (~2-5MB baseline)
 * - Direct access to native HTTP server
 * - Single-threaded (blocks on CPU-intensive operations)
 * - No built-in clustering or development conveniences
 *
 * ### DevServer - Development Server
 * **Use for:** Local development, rapid iteration, SPAs
 * - Live-reload capabilities with WebSocket monitoring
 * - Automatic HTML injection of reload scripts
 * - Enhanced error reporting for development
 * - ~5-10MB memory overhead vs NodeHttp
 * - WebSocket server on separate port (default: 3456)
 *
 * ### ClusteredServer - Production Server
 * **Use for:** Production deployments, high-traffic applications
 * - Multi-process clustering across CPU cores
 * - Automatic worker health monitoring and restart
 * - Graceful shutdown with zero-downtime deployments
 * - Load balancing across worker processes
 * - Production-grade error handling and logging
 *
 * ## How It Works
 *
 * Each server implementation:
 * 1. **Wraps the Wings Router** - Takes your router instance and provides HTTP server capabilities
 * 2. **Handles HTTP Protocol** - Manages request/response cycles, headers, body parsing
 * 3. **Provides Environment Context** - Gives your route handlers access to HTTP-specific features
 * 4. **Manages Server Lifecycle** - Handles startup, shutdown, and error recovery
 *
 * ## Comparison with Traditional Frameworks
 *
 * | Feature | Wings Server | Express.js | Fastify | Koa |
 * |---------|--------------|------------|---------|-----|
 * | Router | ✅ Built-in | ✅ Express Router | ✅ Fastify Routes | ❌ Requires @koa/router |
 * | Middleware | ✅ Context-based | ✅ Express Middleware | ✅ Fastify Hooks | ✅ Koa Middleware |
 * | Type Safety | ✅ JSDoc Types | ❌ Requires TypeScript | ✅ TypeScript First | ❌ Requires TypeScript |
 * | Isomorphic | ✅ Same code everywhere | ❌ Server-only | ❌ Server-only | ❌ Server-only |
 * | Runtime Switching | ✅ Zero code changes | ❌ Rewrite required | ❌ Rewrite required | ❌ Rewrite required |
 * | Clustering | ✅ Built-in | ❌ Manual setup | ❌ Manual setup | ❌ Manual setup |
 * | Live Reload | ✅ Built-in | ❌ Requires nodemon | ❌ Requires nodemon | ❌ Requires nodemon |
 *
 * ## Quick Start Examples
 *
 * ### Basic HTTP Server
 * ```javascript
 * import { Router } from '@ravenjs/wings/core';
 * import { NodeHttp } from '@ravenjs/wings/server';
 *
 * const router = new Router();
 * router.get('/api/users', (ctx) => {
 *   ctx.json({ users: [] });
 * });
 *
 * const server = new NodeHttp(router);
 * await server.listen(3000);
 * ```
 *
 * ### Development Server with Live Reload
 * ```javascript
 * import { Router } from '@ravenjs/wings/core';
 * import { DevServer } from '@ravenjs/wings/server';
 *
 * const router = new Router();
 * router.get('/', (ctx) => {
 *   ctx.html('<h1>Hello World!</h1>');
 * });
 *
 * const devServer = new DevServer(router);
 * await devServer.listen(3000);
 * // Automatically injects live-reload scripts into HTML responses
 * ```
 *
 * ### Production Clustered Server
 * ```javascript
 * import { Router } from '@ravenjs/wings/core';
 * import { ClusteredServer } from '@ravenjs/wings/server';
 *
 * const router = new Router();
 * router.get('/api/health', (ctx) => {
 *   ctx.json({ status: 'healthy' });
 * });
 *
 * const server = new ClusteredServer(router, {
 *   workers: 4,
 *   healthCheckInterval: 30000
 * });
 * await server.listen(3000);
 * ```
 *
 * ## Migration from Traditional Frameworks
 *
 * ### From Express.js
 * ```javascript
 * // Before (Express.js)
 * const express = require('express');
 * const app = express();
 * app.get('/api/users', (req, res) => {
 *   res.json({ users: [] });
 * });
 * app.listen(3000);
 *
 * // After (Wings Server)
 * import { Router } from '@ravenjs/wings/core';
 * import { NodeHttp } from '@ravenjs/wings/server';
 *
 * const router = new Router();
 * router.get('/api/users', (ctx) => {
 *   ctx.json({ users: [] });
 * });
 *
 * const server = new NodeHttp(router);
 * await server.listen(3000);
 * ```
 *
 * ### From Fastify
 * ```javascript
 * // Before (Fastify)
 * const fastify = require('fastify')();
 * fastify.get('/api/users', async (request, reply) => {
 *   return { users: [] };
 * });
 * await fastify.listen({ port: 3000 });
 *
 * // After (Wings Server)
 * import { Router } from '@ravenjs/wings/core';
 * import { NodeHttp } from '@ravenjs/wings/server';
 *
 * const router = new Router();
 * router.get('/api/users', (ctx) => {
 *   ctx.json({ users: [] });
 * });
 *
 * const server = new NodeHttp(router);
 * await server.listen(3000);
 * ```
 *
 * ## Advanced Features
 *
 * ### Environment-Specific Configuration
 * ```javascript
 * import { Router } from '@ravenjs/wings/core';
 * import { NodeHttp, DevServer, ClusteredServer } from '@ravenjs/wings/server';
 *
 * const router = new Router();
 * // ... your routes ...
 *
 * // Choose server based on environment
 * const isDev = process.env.NODE_ENV === 'development';
 * const isProd = process.env.NODE_ENV === 'production';
 *
 * let server;
 * if (isDev) {
 *   server = new DevServer(router, { websocketPort: 3456 });
 * } else if (isProd) {
 *   server = new ClusteredServer(router, { workers: 4 });
 * } else {
 *   server = new NodeHttp(router);
 * }
 *
 * await server.listen(3000);
 * ```
 *
 * ### Graceful Shutdown
 * ```javascript
 * const server = new ClusteredServer(router);
 * await server.listen(3000);
 *
 * process.on('SIGTERM', async () => {
 *   console.log('Shutting down gracefully...');
 *   await server.close();
 *   process.exit(0);
 * });
 * ```
 *
 * ## Performance Characteristics
 *
 * | Server | Memory Baseline | CPU Overhead | Startup Time | Best For |
 * |--------|----------------|--------------|--------------|----------|
 * | NodeHttp | ~2-5MB | Minimal | <100ms | Microservices, APIs |
 * | DevServer | ~5-10MB | Low | <200ms | Development, SPAs |
 * | ClusteredServer | ~10-20MB per worker | Medium | <500ms | Production, High-traffic |
 *
 * ## Key Advantages
 *
 * - **Zero-code switching** - Switch between servers without changing application code
 * - **Built-in features** - Clustering, live-reload, and health monitoring included
 * - **Isomorphic** - Same router code works in browser, server, and serverless
 * - **Type safety** - Full JSDoc type support without TypeScript dependencies
 * - **Performance** - Minimal overhead with maximum control
 * - **Familiar** - Express.js-like API with modern JavaScript features
 */

export { ClusteredServer } from "./clustered-server.js";
export { DevServer } from "./dev-server.js";
export * from "./node-http.js";
export * from "./server-options.js";
