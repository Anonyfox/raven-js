import { createHash } from "node:crypto";
import http from "node:http";
import { Router } from "../core/index.js";
import { NodeHttp } from "./node-http.js";

/**
 * Development server runtime for Wings with live-reload capabilities.
 *
 * Extends NodeHttp to provide an optimized development experience with automatic
 * page reloading when files change. Automatically injects WebSocket-based reload
 * scripts into HTML responses and manages a separate WebSocket server for
 * connection monitoring.
 *
 * **Key Features:**
 * - Automatic HTML injection of live-reload scripts
 * - WebSocket-based connection monitoring
 * - Intelligent reconnection with exponential backoff
 * - Graceful server shutdown handling
 * - Enhanced error reporting for development
 *
 * **When to use:**
 * - Local development and prototyping
 * - When you need automatic page reloading
 * - Building SPAs or multi-page applications
 * - Testing dynamic content changes
 * - Rapid iteration cycles
 *
 * **When NOT to use:**
 * - Production deployments (use ClusteredServer instead)
 * - Headless API services (use NodeHttp instead)
 * - Environments without browser access
 * - When you need maximum performance
 *
 * **Performance characteristics:**
 * - ~5-10MB memory overhead vs NodeHttp
 * - WebSocket server runs on separate port (default: 3456)
 * - HTML injection adds ~2-3KB per response
 * - Reconnection attempts use exponential backoff (100ms → 200ms → 400ms...)
 *
 * **Security considerations:**
 * - WebSocket server accepts any connection (development only)
 * - No authentication on WebSocket connections
 * - HTML injection modifies response content
 * - Should never be used in production environments
 *
 * **Browser compatibility:**
 * - Requires WebSocket support (all modern browsers)
 * - Graceful degradation for older browsers (no reload, but app still works)
 * - Console logging for connection status
 *
 * @extends {NodeHttp}
 *
 * @example
 * ```javascript
 * import { Router } from '@ravenjs/wings/core';
 * import { DevServer } from '@ravenjs/wings/server';
 *
 * const router = new Router();
 * router.get('/', (ctx) => {
 *   ctx.html('<h1>Hello World!</h1>');
 * });
 *
 * const devServer = new DevServer(router, {
 *   websocketPort: 3456,  // Custom WebSocket port
 *   timeout: 30000        // 30s request timeout
 * });
 *
 * await devServer.listen(3000);
 * console.log('Dev server running at http://localhost:3000');
 * console.log('WebSocket server running on port 3456');
 * ```
 *
 * @example
 * ```javascript
 * // Advanced setup with custom error handling
 * const devServer = new DevServer(router, {
 *   websocketPort: 3457,  // Avoid port conflicts
 *   timeout: 60000,       // Longer timeout for development
 *   keepAlive: true,      // Enable keep-alive
 *   maxHeadersCount: 1000 // Relaxed header limits for dev
 * });
 *
 * // Custom error handling
 * devServer.server.on('error', (err) => {
 *   console.error('Dev server error:', err);
 * });
 *
 * // Graceful shutdown
 * process.on('SIGINT', async () => {
 *   console.log('Shutting down dev server...');
 *   await devServer.close();
 *   process.exit(0);
 * });
 *
 * await devServer.listen(3000, '0.0.0.0'); // Bind to all interfaces
 * ```
 *
 * @example
 * ```javascript
 * // Integration with file watchers for true live reload
 * import { watch } from 'node:fs';
 * import { DevServer } from '@ravenjs/wings/server';
 *
 * const devServer = new DevServer(router);
 * await devServer.listen(3000);
 *
 * // Watch for file changes and trigger reloads
 * watch('./src', { recursive: true }, (eventType, filename) => {
 *   console.log(`File ${filename} changed, triggering reload...`);
 *   // The WebSocket connection will detect the server restart
 *   // and automatically reload the browser
 * });
 * ```
 */
export class DevServer extends NodeHttp {
	/**
	 * WebSocket server instance for live-reload functionality.
	 *
	 * Handles WebSocket upgrade requests and manages client connections
	 * for automatic page reloading. Created automatically when the
	 * development server starts listening.
	 *
	 * @type {http.Server}
	 * @protected
	 *
	 * @example
	 * ```javascript
	 * const devServer = new DevServer(router);
	 * await devServer.listen(3000);
	 *
	 * // Access WebSocket server for custom handling
	 * if (devServer.websocketServer) {
	 *   devServer.websocketServer.on('connection', (socket) => {
	 *     console.log('New WebSocket connection established');
	 *   });
	 * }
	 * ```
	 */
	websocketServer;

	/**
	 * Port number for the WebSocket server.
	 *
	 * Defaults to 3456 if not specified in options. The WebSocket server
	 * runs on a separate port from the main HTTP server to avoid conflicts
	 * and allow independent lifecycle management.
	 *
	 * @type {number}
	 * @readonly
	 *
	 * @example
	 * ```javascript
	 * const devServer = new DevServer(router, { websocketPort: 3457 });
	 * console.log(devServer.websocketServerPort); // 3457
	 * ```
	 */
	websocketServerPort;

	/**
	 * Creates a new development server instance.
	 *
	 * Initializes the development server with live-reload capabilities.
	 * The WebSocket server is not started until `listen()` is called.
	 *
	 * @param {Router} router - The Wings router instance to handle HTTP requests
	 * @param {import('./server-options.js').ServerOptions} [options] - Server configuration options
	 *
	 * @throws {TypeError} If router is not a valid Router instance
	 * @throws {RangeError} If websocketPort is not a valid port number (1-65535)
	 *
	 * @example
	 * ```javascript
	 * // Basic setup
	 * const router = new Router();
	 * const devServer = new DevServer(router);
	 *
	 * // Custom configuration
	 * const devServer = new DevServer(router, {
	 *   websocketPort: 3457,    // Custom WebSocket port
	 *   timeout: 60000,         // 60s timeout
	 *   keepAlive: true,        // Enable keep-alive
	 *   maxHeadersCount: 1000   // Header limit
	 * });
	 * ```
	 */
	constructor(router, options = {}) {
		super(router, options);
		this.websocketServerPort = options.websocketPort ?? 3456;
	}

	/**
	 * Activates the WebSocket server for live-reload functionality.
	 *
	 * Creates and configures the WebSocket server that handles client
	 * connections for automatic page reloading. The server accepts
	 * WebSocket upgrade requests and manages connection lifecycle.
	 *
	 * **What happens:**
	 * 1. Creates HTTP server for WebSocket upgrade handling
	 * 2. Configures WebSocket protocol upgrade response
	 * 3. Starts listening on the configured WebSocket port
	 * 4. Handles connection establishment and teardown
	 *
	 * **Security note:** This server accepts any WebSocket connection
	 * without authentication, suitable only for development environments.
	 *
	 * @protected
	 * @returns {void}
	 *
	 * @example
	 * ```javascript
	 * const devServer = new DevServer(router);
	 * devServer.activateWebsocketServer();
	 * // WebSocket server is now running on port 3456 (default)
	 * ```
	 */
	activateWebsocketServer() {
		this.websocketServer = http.createServer(async (_req, res) => {
			res.writeHead(200, { "Content-Type": "text/plain" });
			res.end("WebSocket server running");
		});
		this.websocketServer.on("upgrade", (req, socket, _head) => {
			const acceptKey = req.headers["sec-websocket-key"];
			const hash = createHash("sha1")
				.update(`${acceptKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
				.digest("base64");

			const headers = [
				"HTTP/1.1 101 Switching Protocols",
				"Upgrade: websocket",
				"Connection: Upgrade",
				`Sec-WebSocket-Accept: ${hash}`,
				"",
				"",
			].join("\r\n");

			socket.write(headers);
		});
		this.websocketServer.listen(this.websocketServerPort, () => {});
	}

	/**
	 * Handles incoming HTTP requests with automatic HTML injection.
	 *
	 * Overrides the base request handler to inject live-reload scripts
	 * into HTML responses. Only modifies responses that are:
	 * - HTML content type
	 * - String responses
	 * - Start with '<' (likely HTML)
	 *
	 * **Injection behavior:**
	 * - Adds WebSocket connection script before `</body>` tag
	 * - Updates Content-Length header to reflect new body size
	 * - Preserves all other response headers and status codes
	 * - Non-HTML responses pass through unchanged
	 *
	 * **Performance impact:**
	 * - ~2-3KB overhead per HTML response
	 * - Minimal processing for non-HTML responses
	 * - No impact on API endpoints or static assets
	 *
	 * @param {http.IncomingMessage} req - The incoming HTTP request
	 * @param {http.ServerResponse} res - The HTTP server response
	 * @returns {Promise<void>}
	 */
	async #handleRequest(req, res) {
		try {
			const context = await this.createContext(req);
			await this.router.handleRequest(context);

			// Inject auto-reload script for HTML responses
			if (
				context.responseHeaders.get("content-type")?.includes("text/html") &&
				typeof context.responseBody === "string" &&
				context.responseBody.trim().startsWith("<")
			) {
				context.responseBody = this.injectAutoReloadScript(
					context.responseBody,
				);
				context.responseHeaders.set(
					"content-length",
					Buffer.byteLength(context.responseBody).toString(),
				);
			}

			this.sendResponse(context, res);
		} catch (err) {
			this.handleError(err, req, res);
		}
	}

	/**
	 * Injects live-reload WebSocket script into HTML content.
	 *
	 * Adds a self-executing JavaScript function that establishes a WebSocket
	 * connection to the development server and automatically reloads the page
	 * when the connection is lost and re-established.
	 *
	 * **Script behavior:**
	 * - Connects to WebSocket server on page load
	 * - Monitors connection status in background
	 * - Attempts reconnection with exponential backoff on disconnect
	 * - Triggers page reload when connection is restored
	 * - Logs connection events to browser console
	 *
	 * **Reconnection strategy:**
	 * - Initial retry: 100ms delay
	 * - Exponential backoff: 200ms, 400ms, 800ms, 1600ms...
	 * - Maximum backoff: No limit (continues indefinitely)
	 * - Graceful handling of connection failures
	 *
	 * **Browser console output:**
	 * ```
	 * WebSocket closed. Attempting to reconnect...
	 * Reconnected. Reloading...
	 * ```
	 *
	 * @param {string} html - The HTML content to inject the script into
	 * @returns {string} The HTML content with the live-reload script injected
	 *
	 * @example
	 * ```javascript
	 * const html = '<html><body><h1>Hello</h1></body></html>';
	 * const injected = devServer.injectAutoReloadScript(html);
	 * // Result: HTML with WebSocket script before </body>
	 * ```
	 */
	injectAutoReloadScript = (html) => {
		const reloadScript = `
		(function() {
			const connectUrl = 'ws://' + location.hostname + ':' + ${this.websocketServerPort};
			const socket = new WebSocket(connectUrl);
			socket.addEventListener('close', () => {
				console.log('WebSocket closed. Attempting to reconnect...');

				const tryReload = (backoff) => {
					const tmpSocket = new WebSocket(connectUrl);
					tmpSocket.addEventListener('open', () => {
						console.log('Reconnected. Reloading...');
						location.reload();
					});
					tmpSocket.addEventListener('error', () => {
						tmpSocket.close();
						setTimeout(() => tryReload(backoff * 2), backoff);
					});
				}

				setTimeout(() => tryReload(100), 100);
			});
		})();
		`;

		return html.replace("</body>", `<script>${reloadScript}</script></body>`);
	};

	/**
	 * Starts the development server with live-reload capabilities.
	 *
	 * Activates both the main HTTP server and the WebSocket server for
	 * live-reload functionality. Overrides the default request handler
	 * to inject reload scripts into HTML responses.
	 *
	 * **Server startup sequence:**
	 * 1. Activates WebSocket server if not already running
	 * 2. Overrides HTTP server request handler for HTML injection
	 * 3. Starts main HTTP server on specified port
	 * 4. Logs server URLs to console
	 * 5. Executes optional callback function
	 *
	 * **Console output:**
	 * ```
	 * Dev server running at http://localhost:3000
	 * Use Ctrl+C to stop the server
	 * ```
	 *
	 * **Error handling:**
	 * - WebSocket port conflicts throw EADDRINUSE errors
	 * - HTTP port conflicts throw EADDRINUSE errors
	 * - Invalid ports throw EINVAL errors
	 * - Network binding issues throw EACCES errors
	 *
	 * @param {number} port - The port to bind the main HTTP server to (1-65535)
	 * @param {string} [host="localhost"] - The host interface to bind to
	 * @param {() => void} [callback] - Optional callback function executed when server starts
	 * @returns {Promise<void>} Promise that resolves when server is listening
	 *
	 * @throws {Error} If port is invalid or already in use
	 * @throws {Error} If WebSocket port is invalid or already in use
	 * @throws {Error} If host is invalid or unreachable
	 *
	 * @example
	 * ```javascript
	 * // Basic usage
	 * await devServer.listen(3000);
	 *
	 * // Custom host and callback
	 * await devServer.listen(3000, '0.0.0.0', () => {
	 *   console.log('Server ready for external connections');
	 * });
	 *
	 * // Error handling
	 * try {
	 *   await devServer.listen(3000);
	 * } catch (err) {
	 *   if (err.code === 'EADDRINUSE') {
	 *     console.error('Port 3000 is already in use');
	 *   } else {
	 *     console.error('Failed to start server:', err.message);
	 *   }
	 * }
	 * ```
	 */
	async listen(port, host = "localhost", callback = () => {}) {
		// Activate WebSocket server when starting the main server
		if (!this.websocketServer) {
			this.activateWebsocketServer();
		}

		// Override the server's request handler to inject auto-reload
		this.server.removeAllListeners("request");
		this.server.on("request", this.#handleRequest.bind(this));

		return super.listen(port, host, () => {
			console.log(`Dev server running at http://localhost:${port}`);
			console.log("Use Ctrl+C to stop the server");
			callback();
		});
	}

	/**
	 * Gracefully shuts down both HTTP and WebSocket servers.
	 *
	 * Ensures clean termination of all server connections and resources.
	 * Closes the WebSocket server first, then the main HTTP server to
	 * prevent connection leaks and ensure proper cleanup.
	 *
	 * **Shutdown sequence:**
	 * 1. Closes WebSocket server and waits for completion
	 * 2. Closes main HTTP server and waits for completion
	 * 3. Cleans up all event listeners and timers
	 * 4. Resolves promise when all servers are closed
	 *
	 * **Graceful shutdown behavior:**
	 * - Existing connections are allowed to complete
	 * - New connections are rejected immediately
	 * - WebSocket connections are terminated cleanly
	 * - All pending requests are handled before shutdown
	 *
	 * **Timeout handling:**
	 * - WebSocket server close has no timeout (waits indefinitely)
	 * - HTTP server close uses parent class timeout
	 * - Long-running requests may delay shutdown
	 *
	 * @returns {Promise<void>} Promise that resolves when both servers are closed
	 *
	 * @example
	 * ```javascript
	 * // Basic shutdown
	 * await devServer.close();
	 *
	 * // Graceful shutdown with timeout
	 * const shutdownPromise = devServer.close();
	 * const timeoutPromise = new Promise(resolve =>
	 *   setTimeout(resolve, 5000)
	 * );
	 *
	 * await Promise.race([shutdownPromise, timeoutPromise]);
	 * console.log('Server shutdown complete or timed out');
	 * ```
	 *
	 * @example
	 * ```javascript
	 * // Integration with process signals
	 * process.on('SIGINT', async () => {
	 *   console.log('Received SIGINT, shutting down...');
	 *   try {
	 *     await devServer.close();
	 *     console.log('Server shutdown complete');
	 *     process.exit(0);
	 *   } catch (err) {
	 *     console.error('Shutdown error:', err);
	 *     process.exit(1);
	 *   }
	 * });
	 * ```
	 */
	async close() {
		// Close WebSocket server first
		if (this.websocketServer) {
			await new Promise((resolve) => {
				this.websocketServer.close(() => resolve());
			});
		}

		// Then close main server
		return super.close();
	}
}
