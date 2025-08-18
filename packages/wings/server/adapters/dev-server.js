import { createHash } from "node:crypto";
import http from "node:http";
import { Router } from "../../core/index.js";
import { NodeHttp } from "./node-http.js";

/**
 * Development server with live-reload for Wings.
 *
 * Extends NodeHttp to inject WebSocket-based reload scripts into HTML responses.
 * For file watching, use Node.js CLI flags: `node --watch-path=./src boot.js`
 * This restarts the server instantly, triggering browser reload via WebSocket.
 *
 * @extends {NodeHttp}
 */
export class DevServer extends NodeHttp {
	/**
	 * WebSocket server for live-reload.
	 * @type {http.Server}
	 * @protected
	 */
	websocketServer;

	/**
	 * WebSocket server port.
	 * @type {number}
	 * @readonly
	 */
	websocketServerPort;

	/**
	 * Create development server instance.
	 *
	 * @param {Router} router - Wings router to handle requests
	 * @param {import('../server-options.js').ServerOptions} [options] - Server options
	 * @throws {TypeError} When router is invalid
	 * @throws {RangeError} When websocketPort is invalid
	 */
	constructor(router, options = {}) {
		super(router, options);
		this.websocketServerPort = options.websocketPort ?? 3456;
	}

	/**
	 * Start WebSocket server for live-reload.
	 *
	 * @protected
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

			// Keep the WebSocket connection alive for live reload
			// The connection will be closed when the server is stopped
		});
		this.websocketServer.listen(this.websocketServerPort, () => {});
	}

	/**
	 * Handle HTTP requests with HTML injection.
	 *
	 * @param {http.IncomingMessage} req - HTTP request
	 * @param {http.ServerResponse} res - HTTP response
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
	 * Inject live-reload script into HTML.
	 *
	 * @param {string} html - HTML content
	 * @returns {string} HTML with reload script
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
	 * Start development server with live-reload.
	 *
	 * @param {number} port - Port to listen on
	 * @param {string} [host] - Host to bind to (default: 'localhost')
	 * @param {() => void} [callback] - Optional callback
	 * @returns {Promise<void>} Resolves when listening
	 * @throws {Error} When port is in use or invalid
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
			callback();
		});
	}

	/**
	 * Close both HTTP and WebSocket servers.
	 *
	 * @returns {Promise<void>} Resolves when both servers are closed
	 */
	async close() {
		// Close WebSocket server first
		if (this.websocketServer) {
			await Promise.race([
				new Promise((resolve) => {
					this.websocketServer.close(() => resolve());
				}),
				new Promise((resolve) => setTimeout(resolve, 500)),
			]);
			this.websocketServer = null;
		}

		// Then close main server
		return super.close();
	}
}
