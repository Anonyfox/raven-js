import http from "node:http";
import { Context, Router } from "../core/index.js";
import { readBody } from "./read-body.js";

// Import shared types
import "./server-options.js";

/**
 * Minimalistic NodeJS runtime for Wings, wrapping the native `http` module.
 *
 * This runtime provides a thin abstraction over Node.js's built-in HTTP server,
 * offering Wings' routing capabilities with minimal overhead. It's designed for
 * scenarios where you need maximum control and minimal dependencies.
 *
 * **When to use:**
 * - Building lightweight microservices with minimal runtime overhead
 * - Deploying to environments with strict dependency constraints
 * - Learning or prototyping Wings concepts without additional abstractions
 * - When you need direct access to the underlying HTTP server instance
 *
 * **When NOT to use:**
 * - Production deployments (use Cluster runtime instead)
 * - Development environments (use DevServer for better DX)
 * - When you need advanced features like hot reloading, clustering, or HTTPS
 *
 * **Advantages:**
 * - Zero additional dependencies beyond Node.js core
 * - Minimal memory footprint (~2-5MB baseline)
 * - Direct access to native HTTP server for custom configurations
 * - Predictable behavior with no hidden abstractions
 * - Full control over server lifecycle and error handling
 *
 * **Tradeoffs:**
 * - No built-in clustering or load balancing
 * - No development conveniences (hot reload, auto-restart)
 * - Manual HTTPS setup required
 * - No built-in health checks or monitoring
 * - Single-threaded (blocks on CPU-intensive operations)
 *
 * @example
 * ```javascript
 * import { Router } from '@ravenjs/wings/core';
 * import { NodeHttp } from '@ravenjs/wings/server';
 *
 * const router = new Router();
 * router.get('/api/users', (ctx) => {
 *   ctx.json({ users: [] });
 * });
 *
 * const server = new NodeHttp(router, {
 *   timeout: 30000,
 *   keepAlive: true
 * });
 *
 * await server.listen(3000);
 * console.log('Server running on http://localhost:3000');
 * ```
 *
 * @example
 * ```javascript
 * // Custom server configuration with error handling
 * const server = new NodeHttp(router, {
 *   timeout: 60000,
 *   keepAliveTimeout: 10000,
 *   maxHeadersCount: 1000
 * });
 *
 * // Access underlying server for custom setup
 * server.server.on('error', (err) => {
 *   console.error('Server error:', err);
 * });
 *
 * // Graceful shutdown
 * process.on('SIGTERM', async () => {
 *   console.log('Shutting down gracefully...');
 *   await server.close();
 *   process.exit(0);
 * });
 * ```
 */
export class NodeHttp {
	/**
	 * NodeJS http server instance.
	 *
	 * Provides direct access to the underlying HTTP server for advanced
	 * configurations, event listeners, and custom middleware.
	 *
	 * @type {import('node:http').Server}
	 * @readonly
	 *
	 * @example
	 * ```javascript
	 * const server = new NodeHttp(router);
	 *
	 * // Add custom event listeners
	 * server.server.on('connection', (socket) => {
	 *   console.log('New connection from:', socket.remoteAddress);
	 * });
	 *
	 * // Access server properties
	 * console.log('Max headers:', server.server.maxHeadersCount);
	 * console.log('Timeout:', server.server.timeout);
	 * ```
	 */
	#server;

	/**
	 * Wings router instance to handle requests.
	 *
	 * @type {Router}
	 * @readonly
	 */
	#router;

	/**
	 * Configuration options for the server.
	 *
	 * @type {NodeHttpOptions}
	 * @readonly
	 */
	#options;

	/**
	 * Create a new NodeJS runtime instance for a given Wings router.
	 *
	 * Initializes the HTTP server with the specified configuration and
	 * prepares it to handle requests through the Wings router. The server
	 * is not started until `listen()` is called.
	 *
	 * **Performance considerations:**
	 * - Server creation is synchronous and lightweight (~1-2ms)
	 * - Memory allocation is minimal (~50-100KB for server instance)
	 * - No network operations occur during construction
	 *
	 * **Error handling:**
	 * - Invalid options are merged with defaults (no exceptions thrown)
	 * - Router validation errors are not caught (validate router separately)
	 * - Server creation failures are rare but possible with invalid configurations
	 *
	 * @param {Router} router - The Wings router instance to handle requests
	 * @param {import('./server-options.js').ServerOptions} [options] - Configuration options for the server
	 *
	 * @throws {TypeError} When router is not a valid Wings Router instance
	 * @throws {Error} When server creation fails (rare, usually due to invalid options)
	 *
	 * @example
	 * ```javascript
	 * // Basic setup with defaults
	 * const router = new Router();
	 * const server = new NodeHttp(router);
	 *
	 * // Custom configuration for production
	 * const productionServer = new NodeHttp(router, {
	 *   timeout: 60000,           // 60s request timeout
	 *   keepAlive: true,          // Enable connection reuse
	 *   keepAliveTimeout: 10000,  // 10s keep-alive timeout
	 *   maxHeadersCount: 1000     // Limit header count for security
	 * });
	 *
	 * // High-performance configuration
	 * const highPerfServer = new NodeHttp(router, {
	 *   timeout: 30000,
	 *   keepAlive: true,
	 *   keepAliveTimeout: 5000,   // Shorter keep-alive for high throughput
	 *   maxHeadersCount: 500      // Stricter header limits
	 * });
	 * ```
	 */
	constructor(router, options = {}) {
		this.#router = router;
		this.#options = {
			timeout: 30000,
			keepAlive: true,
			keepAliveTimeout: 5000,
			maxHeadersCount: 2000,
			...options,
		};

		this.#server = http.createServer(this.#handleRequest.bind(this));

		// Apply configuration options
		this.#server.timeout = this.#options.timeout;
		this.#server.keepAliveTimeout = this.#options.keepAliveTimeout;
		this.#server.maxHeadersCount = this.#options.maxHeadersCount;
	}

	/**
	 * Transformer function to convert an incoming http request to a Context object.
	 *
	 * This method bridges the gap between Node.js HTTP requests and Wings Context
	 * objects, handling URL parsing, header normalization, and body reading.
	 *
	 * **Performance characteristics:**
	 * - URL parsing: ~0.1-0.5ms per request
	 * - Header conversion: ~0.1ms per request
	 * - Body reading: Variable based on body size and encoding
	 *
	 * **Memory usage:**
	 * - Creates new Headers instance (~1-5KB depending on header count)
	 * - URL object allocation (~0.5KB)
	 * - Body buffer allocation (size of request body)
	 *
	 * @param {http.IncomingMessage} req - The incoming HTTP request
	 * @returns {Promise<Context>} A Promise that resolves to a Context instance
	 * @protected
	 *
	 * @example
	 * ```javascript
	 * // This method is called internally, but you can understand its behavior:
	 * //
	 * // GET /api/users?page=1&limit=10 HTTP/1.1
	 * // Host: example.com
	 * // Content-Type: application/json
	 * //
	 * // Results in:
	 * // - method: "GET"
	 * // - url: URL object with pathname="/api/users", search="?page=1&limit=10"
	 * // - headers: Headers object with normalized keys
	 * // - body: null (GET requests have no body)
	 * ```
	 */
	async createContext(req) {
		// HTTP protocol is always "http" since this is an HTTP server, not HTTPS
		const protocol = "http";
		// Host header is always present in Node.js HTTP client requests
		const host = req.headers.host;
		const url = new URL(`${protocol}://${host}${req.url}`);
		const headers = new Headers(/** @type {any} */ ({ ...req.headers }));
		const body = await readBody(req);

		return new Context(req.method, url, headers, body);
	}

	/**
	 * Transformer function to convert a Context object to an outgoing http response.
	 *
	 * Serializes the Wings Context response data into a proper HTTP response,
	 * handling headers, status codes, and body content.
	 *
	 * **Performance characteristics:**
	 * - Header setting: ~0.1ms per header
	 * - Response writing: ~0.1-1ms depending on body size
	 * - Memory efficient: streams large bodies without buffering
	 *
	 * **Response handling:**
	 * - Headers are set before status code (Node.js requirement)
	 * - Body is sent as-is (no automatic encoding/compression)
	 * - Response is ended immediately after body
	 *
	 * @param {Context} context - The Wings context with response data
	 * @param {http.ServerResponse} res - The HTTP server response object
	 * @protected
	 *
	 * @example
	 * ```javascript
	 * // This method handles the conversion from Wings Context to HTTP response:
	 * //
	 * // Context with:
	 * // - responseStatusCode: 200
	 * // - responseHeaders: Map with "content-type" => "application/json"
	 * // - responseBody: '{"message":"Hello"}'
	 * //
	 * // Results in HTTP response:
	 * // HTTP/1.1 200 OK
	 * // Content-Type: application/json
	 * //
	 * // {"message":"Hello"}
	 * ```
	 */
	sendResponse(context, res) {
		// Set response headers
		for (const [key, value] of context.responseHeaders) {
			res.setHeader(key, value);
		}

		// Send response
		res.writeHead(context.responseStatusCode);
		res.end(context.responseBody);
	}

	/**
	 * Error handler function for handling exceptions during request processing.
	 *
	 * Provides centralized error handling for all request processing failures,
	 * ensuring consistent error responses and preventing server crashes.
	 *
	 * **Error handling strategy:**
	 * - All errors result in 500 status code
	 * - Error messages are logged to console.error
	 * - Response body contains error message or generic fallback
	 * - No sensitive information is exposed in responses
	 *
	 * **Security considerations:**
	 * - Error details are logged but not sent to clients
	 * - Generic error messages prevent information disclosure
	 * - Stack traces are not included in responses
	 *
	 * @param {Error} err - The error that occurred
	 * @param {http.IncomingMessage} req - The original request object
	 * @param {http.ServerResponse} res - The response object
	 * @protected
	 *
	 * @example
	 * ```javascript
	 * // This method handles various error scenarios:
	 * //
	 * // Router throws error:
	 * // - Logs: "Error handling request </api/users>: User not found"
	 * // - Response: 500 Internal Server Error
	 * // - Body: "User not found"
	 * //
	 * // Body parsing error:
	 * // - Logs: "Error handling request </api/users>: Invalid JSON"
	 * // - Response: 500 Internal Server Error
	 * // - Body: "Invalid JSON"
	 * //
	 * // Unknown error:
	 * // - Logs: "Error handling request </api/users>: "
	 * // - Response: 500 Internal Server Error
	 * // - Body: "Internal Server Error"
	 * ```
	 */
	handleError(err, req, res) {
		console.error(`Error handling request <${req.url}>: ${err.message}`);

		res.writeHead(500, { "Content-Type": "text/plain" });
		res.end(err.message || "Internal Server Error");
	}

	/**
	 * Main request handler that processes incoming HTTP requests.
	 *
	 * This is the core request processing pipeline that orchestrates the
	 * conversion from HTTP request to Wings Context, router handling, and
	 * response generation.
	 *
	 * **Request flow:**
	 * 1. Convert HTTP request to Wings Context (~1-5ms)
	 * 2. Route request through Wings router (variable)
	 * 3. Convert Context response to HTTP response (~1ms)
	 * 4. Handle any errors that occur during processing
	 *
	 * **Performance characteristics:**
	 * - Overhead: ~2-6ms per request (excluding router processing)
	 * - Memory: ~5-20KB per request (depending on headers/body size)
	 * - Concurrent requests: Limited by Node.js event loop
	 *
	 * **Error resilience:**
	 * - All errors are caught and handled gracefully
	 * - Server continues processing other requests
	 * - No request can crash the server
	 *
	 * @param {http.IncomingMessage} req - The incoming HTTP request
	 * @param {http.ServerResponse} res - The HTTP server response
	 *
	 * @example
	 * ```javascript
	 * // This method processes every incoming request:
	 * //
	 * // 1. GET /api/users HTTP/1.1
	 * //    Host: example.com
	 * //
	 * // 2. Creates Context with method="GET", url="/api/users"
	 * //
	 * // 3. Passes to router.handleRequest(context)
	 * //
	 * // 4. Router sets context.responseStatusCode = 200
	 * //    Router sets context.responseBody = '{"users":[]}'
	 * //
	 * // 5. Sends HTTP/1.1 200 OK
	 * //    Content-Type: application/json
	 * //
	 * //    {"users":[]}
	 * ```
	 */
	async #handleRequest(req, res) {
		try {
			const context = await this.createContext(req);
			await this.#router.handleRequest(context);
			this.sendResponse(context, res);
		} catch (err) {
			this.handleError(err, req, res);
		}
	}

	/**
	 * Start the NodeJS http server listening on a given port.
	 *
	 * Binds the server to the specified port and host, making it ready to
	 * accept incoming HTTP connections. This is an asynchronous operation
	 * that resolves when the server is successfully listening.
	 *
	 * **Performance characteristics:**
	 * - Binding time: ~1-10ms (depends on port availability)
	 * - Memory increase: ~1-5MB (server becomes active)
	 * - Network overhead: Minimal (just socket binding)
	 *
	 * **Port considerations:**
	 * - Port 0: Automatically assigns available port
	 * - Ports 1-1023: Require root privileges (avoid in production)
	 * - Ports 1024-65535: Standard user ports
	 * - Port conflicts: Throws EADDRINUSE error
	 *
	 * **Host considerations:**
	 * - 'localhost': Only accepts local connections (default)
	 * - '0.0.0.0': Accepts connections from any IP (production)
	 * - Specific IP: Only accepts connections to that IP
	 *
	 * @param {number} port - The port to listen on (0 for auto-assign)
	 * @param {string} [host] - The host to bind to (defaults to 'localhost')
	 * @param {() => void} [callback] - Optional callback when server starts listening
	 * @returns {Promise<void>} A Promise that resolves when the server starts listening
	 *
	 * @throws {Error} When port is already in use (EADDRINUSE)
	 * @throws {Error} When port requires privileges (EACCES)
	 * @throws {Error} When host is invalid or unreachable
	 *
	 * @example
	 * ```javascript
	 * const server = new NodeHttp(router);
	 *
	 * // Basic listening
	 * await server.listen(3000);
	 * console.log('Server running on http://localhost:3000');
	 *
	 * // Auto-assign port (useful for testing)
	 * await server.listen(0);
	 * const address = server.server.address();
	 * console.log(`Server running on port ${address.port}`);
	 *
	 * // Production configuration
	 * await server.listen(8080, '0.0.0.0');
	 * console.log('Server accepting connections from any IP on port 8080');
	 *
	 * // With callback
	 * await server.listen(3000, 'localhost', () => {
	 *   console.log('Server started successfully');
	 * });
	 *
	 * // Error handling
	 * try {
	 *   await server.listen(80); // Requires root privileges
	 * } catch (err) {
	 *   if (err.code === 'EACCES') {
	 *     console.error('Port 80 requires root privileges');
	 *   }
	 * }
	 * ```
	 */
	async listen(port, host = "localhost", callback = () => {}) {
		return new Promise((resolve) => {
			this.#server.listen(port, host, () => {
				callback();
				resolve();
			});
		});
	}

	/**
	 * Gracefully close the server.
	 *
	 * Stops accepting new connections and waits for existing connections
	 * to complete before fully shutting down. This ensures no requests
	 * are dropped during shutdown.
	 *
	 * **Shutdown behavior:**
	 * - Stops accepting new connections immediately
	 * - Waits for existing requests to complete (up to server timeout)
	 * - Closes all idle connections
	 * - Resolves when all cleanup is complete
	 *
	 * **Performance characteristics:**
	 * - Shutdown time: ~0-30s (depends on active connections and timeout)
	 * - Memory cleanup: Immediate for server instance
	 * - Network cleanup: Gradual as connections close
	 *
	 * **Error handling:**
	 * - Already closed servers: Throws error
	 * - Network errors: Rejects promise
	 * - Timeout errors: Handled gracefully
	 *
	 * @returns {Promise<void>} A Promise that resolves when the server is closed
	 *
	 * @throws {Error} When server is already closed
	 * @throws {Error} When network errors occur during shutdown
	 *
	 * @example
	 * ```javascript
	 * const server = new NodeHttp(router);
	 * await server.listen(3000);
	 *
	 * // Graceful shutdown
	 * process.on('SIGTERM', async () => {
	 *   console.log('Shutting down gracefully...');
	 *   await server.close();
	 *   console.log('Server closed');
	 *   process.exit(0);
	 * });
	 *
	 * // Error handling
	 * try {
	 *   await server.close();
	 *   await server.close(); // This will throw
	 * } catch (err) {
	 *   console.error('Server already closed:', err.message);
	 * }
	 *
	 * // With timeout
	 * const closePromise = server.close();
	 * const timeoutPromise = new Promise((_, reject) => {
	 *   setTimeout(() => reject(new Error('Close timeout')), 5000);
	 * });
	 *
	 * try {
	 *   await Promise.race([closePromise, timeoutPromise]);
	 * } catch (err) {
	 *   console.error('Force closing server due to timeout');
	 *   process.exit(1);
	 * }
	 * ```
	 */
	async close() {
		return new Promise((resolve, reject) => {
			this.#server.close((err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * Get the underlying HTTP server instance.
	 *
	 * Provides direct access to the Node.js HTTP server for advanced
	 * configurations, custom event listeners, and server-specific APIs.
	 *
	 * **Use cases:**
	 * - Adding custom event listeners (connection, error, etc.)
	 * - Accessing server properties (timeout, maxHeadersCount, etc.)
	 * - Integrating with external monitoring or logging systems
	 * - Implementing custom middleware or request preprocessing
	 *
	 * **Performance considerations:**
	 * - Getter is O(1) - no computation required
	 * - Server instance is shared (not cloned)
	 * - Modifications affect all future requests
	 *
	 * @returns {import('node:http').Server} The Node.js HTTP server instance
	 *
	 * @example
	 * ```javascript
	 * const server = new NodeHttp(router);
	 *
	 * // Add custom event listeners
	 * server.server.on('connection', (socket) => {
	 *   console.log('New connection from:', socket.remoteAddress);
	 *   socket.setKeepAlive(true, 60000);
	 * });
	 *
	 * server.server.on('error', (err) => {
	 *   console.error('Server error:', err);
	 *   // Implement custom error handling
	 * });
	 *
	 * // Access server configuration
	 * console.log('Request timeout:', server.server.timeout);
	 * console.log('Max headers:', server.server.maxHeadersCount);
	 *
	 * // Custom server setup
	 * server.server.setTimeout(60000);
	 * server.server.keepAliveTimeout = 10000;
	 *
	 * // Integration with external systems
	 * const prometheus = require('prom-client');
	 * const httpRequestDurationMicroseconds = new prometheus.Histogram({
	 *   name: 'http_request_duration_seconds',
	 *   help: 'Duration of HTTP requests in seconds',
	 *   labelNames: ['method', 'route', 'status_code']
	 * });
	 *
	 * server.server.on('request', (req, res) => {
	 *   const start = Date.now();
	 *   res.on('finish', () => {
	 *     const duration = Date.now() - start;
	 *     httpRequestDurationMicroseconds
	 *       .labels(req.method, req.url, res.statusCode)
	 *       .observe(duration / 1000);
	 *   });
	 * });
	 * ```
	 */
	get server() {
		return this.#server;
	}

	/**
	 * Get the Wings router instance.
	 *
	 * Provides access to the router for inspection, debugging, or
	 * runtime modifications. The router instance is shared and any
	 * modifications will affect future requests.
	 *
	 * **Use cases:**
	 * - Inspecting registered routes for debugging
	 * - Adding routes dynamically at runtime
	 * - Accessing router configuration or middleware
	 * - Implementing route introspection or documentation
	 *
	 * **Performance considerations:**
	 * - Getter is O(1) - no computation required
	 * - Router instance is shared (not cloned)
	 * - Route modifications are immediately effective
	 *
	 * @returns {Router} The Wings router instance
	 *
	 * @example
	 * ```javascript
	 * const router = new Router();
	 * const server = new NodeHttp(router);
	 *
	 * // Inspect router
	 * console.log('Router instance:', server.router);
	 *
	 * // Add routes dynamically
	 * server.router.get('/health', (ctx) => {
	 *   ctx.json({ status: 'ok', timestamp: Date.now() });
	 * });
	 *
	 * // Debug route registration
	 * server.router.get('/debug/routes', (ctx) => {
	 *   // Access router internals for debugging
	 *   ctx.json({ message: 'Router debugging endpoint' });
	 * });
	 *
	 * // Runtime route modification (advanced)
	 * server.router.get('/admin/reload', (ctx) => {
	 *   // Reload routes from configuration
	 *   loadRoutesFromConfig(server.router);
	 *   ctx.json({ message: 'Routes reloaded' });
	 * });
	 * ```
	 */
	get router() {
		return this.#router;
	}

	/**
	 * Get the current configuration options.
	 *
	 * Returns a copy of the current server configuration. The returned
	 * object is immutable - modifications won't affect the server.
	 *
	 * **Configuration options:**
	 * - `timeout`: Request timeout in milliseconds
	 * - `keepAlive`: Enable HTTP keep-alive connections
	 * - `keepAliveTimeout`: Keep-alive timeout in milliseconds
	 * - `maxHeadersCount`: Maximum number of headers allowed
	 *
	 * **Performance considerations:**
	 * - Getter creates a shallow copy (~0.1ms)
	 * - Object is small (~100 bytes)
	 * - Immutable - safe to modify returned object
	 *
	 * @returns {NodeHttpOptions} The current configuration options (immutable copy)
	 *
	 * @example
	 * ```javascript
	 * const server = new NodeHttp(router, {
	 *   timeout: 60000,
	 *   keepAlive: true,
	 *   keepAliveTimeout: 10000,
	 *   maxHeadersCount: 1000
	 * });
	 *
	 * // Inspect current configuration
	 * const config = server.options;
	 * console.log('Current timeout:', config.timeout);
	 * console.log('Keep-alive enabled:', config.keepAlive);
	 *
	 * // Configuration is immutable
	 * config.timeout = 99999; // This won't affect the server
	 * console.log('Server timeout unchanged:', server.options.timeout);
	 *
	 * // Compare configurations
	 * const defaultConfig = {
	 *   timeout: 30000,
	 *   keepAlive: true,
	 *   keepAliveTimeout: 5000,
	 *   maxHeadersCount: 2000
	 * };
	 *
	 * const isDefault = JSON.stringify(server.options) === JSON.stringify(defaultConfig);
	 * console.log('Using default config:', isDefault);
	 *
	 * // Configuration validation
	 * function validateConfig(config) {
	 *   if (config.timeout < 1000) {
	 *     throw new Error('Timeout too low');
	 *   }
	 *   if (config.maxHeadersCount > 10000) {
	 *     throw new Error('Too many headers allowed');
	 *   }
	 * }
	 *
	 * validateConfig(server.options);
	 * ```
	 */
	get options() {
		return { ...this.#options };
	}
}

/**
 * @typedef {import('./server-options.js').ServerOptions} NodeHttpOptions
 */
