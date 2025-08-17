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
 * ## Middleware
 *
 * **Logger** - Request logging middleware for server adapters
 * - Development: Colored terminal output with performance indicators
 * - Production: Structured JSON logging (SOC2, ISO 27001, GDPR compliant)
 * - Use with `router.useEarly(new Logger())` when using server adapters
 *
 * ## Utilities
 *
 * **generateSSLCert** - Self-signed SSL certificate generator
 * - Creates RSA key pairs and X.509 certificates for HTTPS development
 * - Uses native Node.js WebCrypto API and ASN.1 encoding
 * - Returns PEM-formatted private key and certificate
 *
 * ## Quick Start
 *
 * ```javascript
 * import { Router } from '@ravenjs/wings/core';
 * import { DevServer, ClusteredServer, Logger, generateSSLCert } from '@ravenjs/wings/server';
 *
 * const router = new Router();
 *
 * // Add logging middleware (use with server adapters)
 * router.useEarly(new Logger());
 *
 * router.get('/api/users', (ctx) => {
 *   ctx.json({ users: [] });
 * });
 *
 * // Development
 * const devServer = new DevServer(router);
 * await devServer.listen(3000);
 *
 * // Production with HTTPS
 * const { privateKey, certificate } = await generateSSLCert();
 * const server = new ClusteredServer(router);
 * await server.listen(3000, { key: privateKey, cert: certificate });
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
export { Logger } from "./logger.js";
export { generateSSLCert } from "./generate-ssl-cert.js";
export * from "./node-http.js";
export * from "./server-options.js";
