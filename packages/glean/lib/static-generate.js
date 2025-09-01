/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Static site generation using Fledge
 *
 * Uses Fledge to crawl a background glean documentation server and generate
 * static HTML files. This approach validates that the server actually works
 * and produces the exact same output that browsers would receive.
 */

import net from "node:net";
import {
	Config,
	generateStaticSite as fledgeGenerateStaticSite,
} from "@raven-js/fledge";
import { createDocumentationServer } from "./server/index.js";

/**
 * Generate static documentation site from package using Fledge
 * @param {string} packagePath - Path to package to document
 * @param {string} outputPath - Destination directory for static files
 * @param {Object} options - Generation options
 * @param {string} [options.domain] - Base domain for canonical URLs (unused with Fledge)
 * @param {string} [options.basePath] - Base path for URL prefixing (unused with Fledge)
 * @returns {Promise<{totalFiles: number, totalBytes: number, generatedAt: string}>} Generation statistics
 */
export async function generateStaticSite(
	packagePath,
	outputPath,
	options = {},
) {
	// Validate inputs
	if (!packagePath || typeof packagePath !== "string") {
		throw new Error("packagePath is required and must be a string");
	}
	if (!outputPath || typeof outputPath !== "string") {
		throw new Error("outputPath is required and must be a string");
	}

	// Find an available port for the background server
	const port = await findAvailablePort(3001);

	// Create documentation server instance (but don't start listening yet)
	const server = createDocumentationServer(packagePath, {
		enableLogging: false, // Silent background operation
		domain: options.domain,
	});

	// Start server in background
	let serverStarted = false;
	await new Promise((resolve, reject) => {
		try {
			/** @type {any} */ (server).listen(port, "localhost", () => {
				serverStarted = true;
				resolve(undefined);
			});
		} catch (error) {
			reject(new Error(`Failed to start background server: ${error.message}`));
		}
	});

	try {
		// Create fledge config as JS string
		const configString = `
			export default {
				server: "http://localhost:${port}",
				routes: [
					"/",
					"/sitemap.xml",
					"/bootstrap.esm.js.map",
					"/bootstrap.min.css.map"
				],
				discover: true,
				output: "${outputPath.replace(/\\/g, "\\\\")}"
			};
		`;

		// Create fledge config from string
		const config = await Config.fromString(configString);

		// Generate static site using fledge
		const result = await fledgeGenerateStaticSite(config, {
			outputDir: outputPath,
			verbose: false,
		});

		// Return glean-compatible result format
		return {
			totalFiles: result.savedFiles,
			totalBytes: 0, // Fledge doesn't track bytes, but glean expects this
			generatedAt: new Date().toISOString(),
		};
	} finally {
		// Always cleanup background server
		if (serverStarted) {
			try {
				await new Promise((resolve) => {
					/** @type {any} */ (server).close(() => resolve(undefined));
				});
			} catch {
				// Ignore cleanup errors
			}
		}
	}
}

/**
 * Find an available port starting from the given port
 * @param {number} startPort - Port to start searching from
 * @returns {Promise<number>} Available port
 */
async function findAvailablePort(startPort) {
	return new Promise((resolve, reject) => {
		const server = net.createServer();

		server.listen(startPort, () => {
			const { port } = /** @type {any} */ (server.address());
			server.close(() => resolve(port));
		});

		server.on("error", (err) => {
			if (/** @type {any} */ (err).code === "EADDRINUSE") {
				// Port is in use, try the next one
				resolve(findAvailablePort(startPort + 1));
			} else {
				reject(err);
			}
		});
	});
}
