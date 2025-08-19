/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import http from "node:http";
import https from "node:https";
import { Context, Router } from "../../core/index.js";
import { readBody } from "../read-body.js";

// Import shared types
import "../server-options.js";

/**
 * @packageDocumentation
 *
 * Base HTTP server class for Wings - NOT meant for direct use.
 * This is a lightweight, fast base class with zero dependencies and strong test coverage.
 * For development, use DevServer. For production, use ClusteredServer.
 * Only extend this class when building custom server implementations.
 */
export class NodeHttp {
	/**
	 * NodeJS http/https server instance.
	 * @type {import('node:http').Server | import('node:https').Server}
	 * @readonly
	 */
	#server;

	/**
	 * Wings router instance.
	 * @type {Router}
	 * @readonly
	 */
	#router;

	/**
	 * Server configuration options.
	 * @type {import("../server-options.js").ServerOptions}
	 * @readonly
	 */
	#options;

	/**
	 * Whether SSL/HTTPS mode is enabled.
	 * @type {boolean}
	 * @readonly
	 */
	#isSSL;

	/**
	 * Create a new NodeJS HTTP server instance.
	 *
	 * @param {Router} router - Wings router to handle requests
	 * @param {import('../server-options.js').ServerOptions} [options] - Server options
	 * @throws {TypeError} When router is invalid
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

		// Detect SSL mode - both certificate and private key must be provided
		this.#isSSL = Boolean(
			this.#options.sslCertificate && this.#options.sslPrivateKey,
		);

		// Create server based on SSL detection
		if (this.#isSSL) {
			const sslOptions = {
				key: /** @type {string | Buffer} */ (this.#options.sslPrivateKey),
				cert: /** @type {string | Buffer} */ (this.#options.sslCertificate),
			};
			this.#server = https.createServer(
				sslOptions,
				this.#handleRequest.bind(this),
			);
		} else {
			this.#server = http.createServer(this.#handleRequest.bind(this));
		}

		// Apply configuration options
		this.#server.timeout = this.#options.timeout;
		this.#server.keepAliveTimeout = this.#options.keepAliveTimeout;
		this.#server.maxHeadersCount = this.#options.maxHeadersCount;
	}

	/**
	 * Convert HTTP/HTTPS request to Wings Context.
	 *
	 * @param {http.IncomingMessage} req - HTTP/HTTPS request
	 * @returns {Promise<Context>} Wings context
	 * @protected
	 */
	async createContext(req) {
		// Dynamically detect protocol based on SSL mode
		const protocol = this.#isSSL ? "https" : "http";
		// Host header is always present in Node.js HTTP client requests
		const host = req.headers.host;
		const url = new URL(`${protocol}://${host}${req.url}`);
		const headers = new Headers(/** @type {any} */ ({ ...req.headers }));
		const body = await readBody(req);

		return new Context(req.method, url, headers, body);
	}

	/**
	 * Convert Wings Context to HTTP response.
	 *
	 * @param {Context} context - Wings context with response data
	 * @param {http.ServerResponse} res - HTTP response object
	 * @protected
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
	 * Handle request processing errors.
	 *
	 * @param {Error} err - Error that occurred
	 * @param {http.IncomingMessage} req - Original request
	 * @param {http.ServerResponse} res - Response object
	 * @protected
	 */
	handleError(err, req, res) {
		console.error(`Error handling request <${req.url}>: ${err.message}`);

		res.writeHead(500, { "Content-Type": "text/plain" });
		res.end(err.message || "Internal Server Error");
	}

	/**
	 * Main request handler.
	 *
	 * @param {http.IncomingMessage} req - HTTP request
	 * @param {http.ServerResponse} res - HTTP response
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
	 * Start server listening on port.
	 *
	 * @param {number} port - Port to listen on (0 for auto-assign)
	 * @param {string} [host] - Host to bind to (default: 'localhost')
	 * @param {() => void} [callback] - Optional callback
	 * @returns {Promise<void>} Resolves when listening
	 * @throws {Error} When port is in use or requires privileges
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
	 * Gracefully close server.
	 *
	 * @returns {Promise<void>} Resolves when closed
	 * @throws {Error} When already closed or network errors occur
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
	 * Get underlying HTTP server instance.
	 *
	 * @returns {import('node:http').Server} Node.js HTTP server
	 */
	get server() {
		return this.#server;
	}

	/**
	 * Get Wings router instance.
	 *
	 * @returns {Router} Wings router
	 */
	get router() {
		return this.#router;
	}

	/**
	 * Get current configuration options.
	 *
	 * @returns {import("../server-options.js").ServerOptions} Configuration options
	 */
	get options() {
		return { ...this.#options };
	}

	/**
	 * Check if SSL/HTTPS mode is enabled.
	 *
	 * @returns {boolean} True if server is running in HTTPS mode
	 */
	get isSSL() {
		return this.#isSSL;
	}
}
