import http from "node:http";
import process from "node:process";
import { Context, Router } from "../core/index.js";
import { readBody } from "./read-body.js";

/**
 * Minimalistic NodeJS runtime for Wings, wrapping the native `http` module.
 *
 * For a better DX, consider using the DevServer runtime instead. For deploying
 * to a VPS, the Cluster runtime is recommended instead. Use this NodeJS runtime
 * only when you absolutely want no features beyond the native `http` module.
 */
export class NodeHttp {
	/**
	 * NodeJS http server instance.
	 *
	 * @type {import('node:http').Server}
	 */
	#server;

	/**
	 * Wings router instance to handle requests.
	 *
	 * @type {Router}
	 */
	#router;

	/**
	 * Configuration options for the server.
	 *
	 * @type {NodeHttpOptions}
	 */
	#options;

	/**
	 * Create a new NodeJS runtime instance for a given Wings router.
	 *
	 * This will create a new http server instance and attach the request handler,
	 * but not start listening on any port. Use the `listen` method to start the server.
	 *
	 * @param {Router} router - The Wings router instance to handle requests
	 * @param {NodeHttpOptions} [options] - Configuration options for the server
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
	 * @param {http.IncomingMessage} req - The incoming HTTP request
	 * @returns {Promise<Context>} A Promise that resolves to a Context instance
	 */
	async #createContext(req) {
		const protocol = /** @type {any} */ (req.socket).encrypted
			? "https"
			: "http";
		const host = req.headers.host || process.env.HOST || "localhost";
		const url = new URL(`${protocol}://${host}${req.url}`);
		const headers = new Headers(/** @type {any} */ ({ ...req.headers }));
		const body = await readBody(req);

		return new Context(req.method, url, headers, body);
	}

	/**
	 * Transformer function to convert a Context object to an outgoing http response.
	 *
	 * @param {Context} context - The Wings context with response data
	 * @param {http.ServerResponse} res - The HTTP server response object
	 */
	#sendResponse(context, res) {
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
	 * @param {Error} err - The error that occurred
	 * @param {http.IncomingMessage} req - The original request object
	 * @param {http.ServerResponse} res - The response object
	 */
	#handleError(err, req, res) {
		console.error(`Error handling request <${req.url}>: ${err.message}`);

		res.writeHead(500, { "Content-Type": "text/plain" });
		res.end(err.message || "Internal Server Error");
	}

	/**
	 * Main request handler that processes incoming HTTP requests.
	 *
	 * @param {http.IncomingMessage} req - The incoming HTTP request
	 * @param {http.ServerResponse} res - The HTTP server response
	 */
	async #handleRequest(req, res) {
		try {
			const context = await this.#createContext(req);
			await this.#router.handleRequest(context);
			this.#sendResponse(context, res);
		} catch (err) {
			this.#handleError(err, req, res);
		}
	}

	/**
	 * Start the NodeJS http server listening on a given port.
	 *
	 * @param {number} port - The port to listen on
	 * @param {string} [host] - The host to bind to (defaults to 'localhost')
	 * @param {() => void} [callback] - Optional callback when server starts listening
	 * @returns {Promise<void>} A Promise that resolves when the server starts listening
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
	 * @returns {Promise<void>} A Promise that resolves when the server is closed
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
	 * @returns {import('node:http').Server} The Node.js HTTP server instance
	 */
	get server() {
		return this.#server;
	}

	/**
	 * Get the Wings router instance.
	 *
	 * @returns {Router} The Wings router instance
	 */
	get router() {
		return this.#router;
	}

	/**
	 * Get the current configuration options.
	 *
	 * @returns {NodeHttpOptions} The current configuration options
	 */
	get options() {
		return { ...this.#options };
	}
}

/**
 * Configuration options for the NodeHttp server.
 *
 * @typedef {Object} NodeHttpOptions
 * @property {number} [timeout=30000] - Request timeout in milliseconds
 * @property {boolean} [keepAlive=true] - Enable HTTP keep-alive
 * @property {number} [keepAliveTimeout=5000] - Keep-alive timeout in milliseconds
 * @property {number} [maxHeadersCount=2000] - Maximum number of headers allowed
 */
