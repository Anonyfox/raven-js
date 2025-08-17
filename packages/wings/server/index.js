/**
 * @packageDocumentation
 *
 * # Wings Server - Node.js Backend Runtime
 *
 * _Zero-dependency server adapters that just work. No configuration hell, no framework lock-in._
 *
 * Built with the Raven philosophy: pragmatic solutions for developers who want to ship working
 * software, not fight with their tools. Every server supports HTTPS out of the box because
 * modern web development shouldn't require jumping through hoops for basic security.
 *
 * ## Server Implementations
 *
 * **DevServer** - Development with live-reload and HTTPS support
 * - WebSocket-based browser reload that actually works
 * - For file watching: `node --watch-path=./src boot.js`
 * - Server restart triggers browser reload automatically
 * - Built-in HTTPS support for testing real-world scenarios
 *
 * **ClusteredServer** - Production scaling without the complexity
 * - Uses all CPU cores for horizontal scaling
 * - Automatically restarts crashed workers (no PM2 needed)
 * - Zero logging by default to prevent disk filling
 * - HTTPS support with same simple API as HTTP
 *
 * **NodeHttp** - Base class that gets out of your way
 * - NOT meant for direct use (extend for custom implementations)
 * - Lightweight with zero dependencies
 * - HTTP/HTTPS detection built-in, no special configuration
 *
 * ## HTTPS Support
 *
 * Every server supports HTTPS with two simple options. No certificates? Generate them in one line.
 * Need custom certificates? Just pass them in. It's that simple.
 *
 * ```javascript
 * // Generate certificates (development)
 * const { privateKey, certificate } = await generateSSLCert();
 * const server = new DevServer(router, { sslCertificate: certificate, sslPrivateKey: privateKey });
 *
 * // Production with your certificates
 * const server = new ClusteredServer(router, {
 *   sslCertificate: fs.readFileSync('cert.pem', 'utf8'),
 *   sslPrivateKey: fs.readFileSync('key.pem', 'utf8')
 * });
 * ```
 *
 * ## Middleware
 *
 * **Logger** - Request logging that doesn't get in your way
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
 * - Rock-solid implementation that just works
 *
 * ## Quick Start
 *
 * ```javascript
 * import { Router } from '@ravenjs/wings/core';
 * import { DevServer, ClusteredServer, Logger, generateSSLCert } from '@ravenjs/wings/server';
 *
 * const router = new Router();
 *
 * // Add logging middleware
 * router.useEarly(new Logger());
 *
 * router.get('/api/users', (ctx) => {
 *   ctx.json({ users: [] });
 * });
 *
 * // Development (HTTP)
 * const devServer = new DevServer(router);
 * await devServer.listen(3000);
 *
 * // Development (HTTPS)
 * const { privateKey, certificate } = await generateSSLCert();
 * const httpsServer = new DevServer(router, {
 *   sslCertificate: certificate,
 *   sslPrivateKey: privateKey
 * });
 * await httpsServer.listen(3000);
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
export { Compression } from "./compression.js";
export { DevServer } from "./dev-server.js";
export { generateSSLCert } from "./generate-ssl-cert.js";
export { Logger } from "./logger.js";
export * from "./node-http.js";
export * from "./server-options.js";
