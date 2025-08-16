import { createHash } from "node:crypto";
import http from "node:http";
import { Router } from "../core/index.js";
import { NodeHttp } from "./node-http.js";

/**
 * A development server runtime for Wings, with live-reload capabilities.
 *
 * Extends the basic node-http runtime for optimized DX during local development.
 * Provides automatic page reloading when files change and enhanced error reporting.
 */
export class DevServer extends NodeHttp {
	/**
	 * @type {http.Server}
	 * @protected
	 */
	websocketServer;

	websocketServerPort;

	/**
	 * @param {Router} router - The Wings router instance to handle requests
	 * @param {import('./server-options.js').ServerOptions} [options] - Configuration options
	 */
	constructor(router, options = {}) {
		super(router, options);
		this.websocketServerPort = options.websocketPort ?? 3456;
	}

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
	 * Override the request handler to inject auto-reload script into HTML responses.
	 *
	 * @param {http.IncomingMessage} req - The incoming HTTP request
	 * @param {http.ServerResponse} res - The HTTP server response
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
	 * Injects an auto-reload script into the provided HTML.
	 *
	 * It will attempt to reconnect to the WebSocket server if the connection is closed,
	 * and reload the page when the connection is re-established.
	 *
	 * @param {string} html - The HTML content.
	 * @returns {string} The HTML content with the auto-reload script injected.
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
	 * Start the development server listening on a given port.
	 *
	 * @param {number} port - The port to listen on
	 * @param {string} [host] - The host to bind to (defaults to 'localhost')
	 * @param {() => void} [callback] - Optional callback when server starts listening
	 * @returns {Promise<void>} A Promise that resolves when the server starts listening
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
	 * Gracefully close both the main server and WebSocket server.
	 *
	 * @returns {Promise<void>} A Promise that resolves when both servers are closed
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
