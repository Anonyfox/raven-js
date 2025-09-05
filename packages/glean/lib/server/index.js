/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Documentation server assembly and main entry point.
 *
 * Creates a complete Wings server instance with all documentation routes,
 * static asset serving, and error handling. Loads package data once at
 * initialization for optimal performance.
 */

import { NodeHttp } from "@raven-js/wings/server";
import { createDocumentationRouter } from "./router.js";

// Re-export router creation function for direct use
export { createDocumentationRouter } from "./router.js";

/**
 * Creates documentation server instance with routes, static assets, and middleware.
 *
 * Loads and processes package data once at initialization, then creates Wings server
 * with all documentation routes configured but does not start listening.
 *
 * @param {string} packagePath - Path to package to document
 * @param {Object} options - Configuration options
 * @param {string} [options.domain] - Base domain for canonical URLs (optional)
 * @param {boolean} [options.enableLogging] - Enable request logging (default: false)
 * @returns {Object} Wings server instance ready to listen
 *
 * @example
 * // Create documentation server
 * const server = createDocumentationServer('./my-package');
 * server.listen(3000, 'localhost');
 *
 * @example
 * // Create server with custom options
 * const server = createDocumentationServer('./my-package', {
 *   domain: 'docs.mypackage.com',
 *   enableLogging: true
 * });
 */
export function createDocumentationServer(packagePath, options = {}) {
	// Create router using the extracted router creation logic
	const router = createDocumentationRouter(packagePath, options);

	// Create HTTP server with router
	const server = new NodeHttp(router);

	// Attach metadata for external access (cast to bypass TypeScript)
	/** @type {any} */ (server).serverOptions = {
		packagePath,
		...options,
	};

	return server;
}

/**
 * Convenience function to create and start documentation server in one step.
 *
 * Creates server instance and starts listening, with logging enabled by default
 * and console output showing package information and server details.
 *
 * @param {string} packagePath - Path to package to document
 * @param {Object} options - Server options
 * @param {number} [options.port=3000] - Port to listen on
 * @param {string} [options.host="localhost"] - Host to bind to
 * @param {string} [options.domain] - Base domain for canonical URLs
 * @param {boolean} [options.enableLogging=true] - Enable request logging
 * @returns {Promise<Object>} Started server instance
 *
 * @example
 * // Start server with defaults (port 3000, localhost)
 * const server = await startDocumentationServer('./my-package');
 *
 * @example
 * // Start server with custom port and domain
 * const server = await startDocumentationServer('./my-package', {
 *   port: 8080,
 *   host: '0.0.0.0',
 *   domain: 'docs.mypackage.com'
 * });
 */
export async function startDocumentationServer(packagePath, options = {}) {
	const { port = 3000, host = "localhost", ...serverOptions } = options;

	// Enable logging by default when starting server
	const finalOptions = { enableLogging: true, ...serverOptions };

	const server = createDocumentationServer(packagePath, finalOptions);

	return new Promise((resolve, reject) => {
		try {
			/** @type {any} */ (server).listen(port, host, () => {
				console.log(
					`📚 Documentation server running on http://${host}:${port}`,
				);
				console.log(`📦 Package: ${packagePath}`);
				resolve(server);
			});
		} catch (error) {
			reject(error);
		}
	});
}
