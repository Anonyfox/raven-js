/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Configuration class for static site generation.
 *
 * Holds all configuration properties with proper types and sane defaults.
 * Platform-native JavaScript configuration over meta-language complexity.
 */

import { Discover } from "./discover.js";
import { importConfig } from "./import-config.js";

/**
 * @typedef {function({ port: number }): Promise<void>} ServerBootFunction
 */

/**
 * @typedef {function(): Promise<string[]>} RouteGeneratorFunction
 */

/**
 * Static site generator configuration
 */
export class Config {
	/**
	 * Server to crawl - origin URL or async boot function
	 * @type {string | ServerBootFunction | null}
	 */
	server = null;

	/**
	 * Starting routes for crawling
	 * @type {string[] | RouteGeneratorFunction | null}
	 */
	routes = null;

	/**
	 * Auto-discover linked pages
	 * @type {boolean | Discover | null}
	 */
	discover = null;

	/**
	 * JavaScript bundles to build (mount path -> source file)
	 * @type {Record<string, string> | null}
	 */
	bundles = null;

	/**
	 * Base path for deployment
	 * @type {string | null}
	 */
	basePath = null;

	/**
	 * Static files to copy
	 * @type {string | null}
	 */
	assets = null;

	/**
	 * Output directory
	 * @type {string | null}
	 */
	output = null;

	/**
	 * Create configuration instance
	 * @param {Partial<Config>} [options] - Configuration options to override defaults
	 */
	constructor(options = {}) {
		// Transform plain objects to Discover instances
		if (
			options.discover &&
			typeof options.discover === "object" &&
			!Array.isArray(options.discover) &&
			!(options.discover instanceof Discover)
		) {
			options.discover = new Discover(options.discover);
		}

		Object.assign(this, options);
	}

	/**
	 * Create configuration from JavaScript file
	 * @param {string} filePath - Path to the JavaScript config file
	 * @param {string} [exportName] - Optional named export to select (uses default if not specified)
	 * @returns {Promise<Config>} Configuration instance
	 * @throws {Error} If import, configuration creation, or validation fails
	 */
	static async fromFile(filePath, exportName) {
		const configData = await importConfig(filePath, exportName);
		const config = new Config(configData);
		config.validate();
		return config;
	}

	/**
	 * Create configuration from JavaScript code string
	 * @param {string} jsCode - JavaScript code string with ESM import/export syntax
	 * @param {string} [exportName] - Optional named export to select (uses default if not specified)
	 * @returns {Promise<Config>} Configuration instance
	 * @throws {Error} If import, configuration creation, or validation fails
	 */
	static async fromString(jsCode, exportName) {
		try {
			// Create data URL from JavaScript string for dynamic import
			const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(jsCode)}`;

			// Dynamic import works with data URLs and full ESM syntax
			const module = await import(dataUrl);

			let configData;
			if (exportName) {
				if (!(exportName in module)) {
					throw new Error(`Export '${exportName}' not found in code string`);
				}
				configData = module[exportName];
			} else {
				// Use default export or throw if not available
				if ("default" in module) {
					configData = module.default;
				} else {
					throw new Error("No default export found in code string");
				}
			}

			const config = new Config(configData);
			config.validate();
			return config;
		} catch (error) {
			const err = /** @type {any} */ (error);
			if (
				err.message.includes("Export ") ||
				err.message.includes("No default export")
			) {
				throw error; // Re-throw our clean export errors
			}

			throw new Error(
				`Failed to import config from code string: ${err.message}`,
			);
		}
	}

	/**
	 * Get server with validation
	 * @returns {string | ServerBootFunction} Server configuration
	 * @throws {Error} If server is not configured
	 */
	getServer() {
		if (!this.server) {
			throw new Error("Server configuration is required");
		}
		return this.server;
	}

	/**
	 * Get routes with defaults
	 * @returns {string[] | RouteGeneratorFunction} Routes configuration
	 */
	getRoutes() {
		return this.routes ?? ["/"];
	}

	/**
	 * Get discovery setting with defaults
	 * @returns {boolean | Discover} Discovery configuration
	 */
	getDiscover() {
		return this.discover ?? true;
	}

	/**
	 * Get bundles configuration
	 * @returns {Record<string, string>} Bundle mappings
	 */
	getBundles() {
		return this.bundles ?? {};
	}

	/**
	 * Get base path with defaults
	 * @returns {string} Base path for deployment
	 */
	getBasePath() {
		return this.basePath ?? "";
	}

	/**
	 * Get assets directory
	 * @returns {string | null} Assets directory path
	 */
	getAssets() {
		return this.assets;
	}

	/**
	 * Get output directory with defaults
	 * @returns {string} Output directory path
	 */
	getOutput() {
		return this.output ?? "_site";
	}

	/**
	 * Validate configuration completeness
	 * @throws {Error} If required configuration is missing or invalid
	 */
	validate() {
		// Server is required
		if (!this.server) {
			throw new Error("Server configuration is required");
		}

		// Server must be string (origin) or function
		if (typeof this.server !== "string" && typeof this.server !== "function") {
			throw new Error(
				"Server must be origin URL string or async boot function",
			);
		}

		// If server is string, must be valid origin
		if (typeof this.server === "string") {
			try {
				const url = new URL(this.server);
				if (!url.protocol.startsWith("http")) {
					throw new Error("Server URL must use http or https protocol");
				}
			} catch (error) {
				const err = /** @type {any} */ (error);
				// Re-throw specific protocol errors
				if (
					err.message.includes("Server URL must use http or https protocol")
				) {
					throw error;
				}
				throw new Error(
					"Server must be valid origin URL (http://localhost:3000)",
				);
			}
		}

		// Routes must be array or function if specified
		if (
			this.routes !== null &&
			!Array.isArray(this.routes) &&
			typeof this.routes !== "function"
		) {
			throw new Error(
				"Routes must be array of strings or async generator function",
			);
		}

		// Discovery must be boolean or Discover instance if specified
		if (
			this.discover !== null &&
			typeof this.discover !== "boolean" &&
			!(this.discover instanceof Discover)
		) {
			throw new Error("Discover must be boolean or Discover instance");
		}

		// Validate Discover instance if present
		if (this.discover instanceof Discover) {
			this.discover.validate();
		}

		// Bundles must be object if specified
		if (this.bundles !== null && typeof this.bundles !== "object") {
			throw new Error(
				"Bundles must be object mapping mount paths to source files",
			);
		}

		// String fields validation
		const stringFields = ["basePath", "assets", "output"];
		for (const field of stringFields) {
			if (
				/** @type {any} */ (this)[field] !== null &&
				typeof (/** @type {any} */ (this)[field]) !== "string"
			) {
				throw new Error(`${field} must be string if specified`);
			}
		}
	}
}
