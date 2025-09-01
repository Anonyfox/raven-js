/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main configuration class for script mode bundling.
 *
 * Orchestrates script generation configuration with validation, defaults, and
 * factory methods for creating instances from various sources.
 */

import { Assets } from "./assets.js";
import { Environment } from "./environment.js";
import {
	importConfigFromFile,
	importConfigFromString,
	validateConfigObject,
} from "./import-config.js";
import { Metadata } from "./metadata.js";

/**
 * @typedef {function({ port: number }): Promise<void>} ServerBootFunction
 */

/**
 * Script bundling configuration with validation and defaults
 */
export class ScriptConfig {
	/**
	 * Entry point file path - required
	 * @type {string}
	 */
	entry;

	/**
	 * Output executable file path - required
	 * @type {string}
	 */
	output;

	/**
	 * Module format for bundling
	 * @type {"cjs" | "esm"}
	 */
	format;

	/**
	 * Node.js runtime flags
	 * @type {string[]}
	 */
	nodeFlags;

	/**
	 * Client bundles to build and embed
	 * @type {Record<string, string>}
	 */
	bundles;

	/**
	 * Assets to embed in executable
	 * @type {Assets}
	 */
	assets;

	/**
	 * Environment variables to embed
	 * @type {Environment}
	 */
	env;

	/**
	 * Banner metadata for executable
	 * @type {Metadata}
	 */
	metadata;

	/**
	 * Create ScriptConfig instance
	 * @param {Object} config - Configuration object
	 * @param {string} config.entry - Entry point file path
	 * @param {string} config.output - Output executable file path
	 * @param {"cjs" | "esm"} [config.format="cjs"] - Module format
	 * @param {string[]} [config.nodeFlags=[]] - Node.js runtime flags
	 * @param {Record<string, string>} [config.bundles={}] - Client bundles
	 * @param {Assets} [config.assets] - Assets instance
	 * @param {Environment} [config.env] - Environment instance
	 * @param {Metadata} [config.metadata] - Metadata instance
	 */
	constructor(config) {
		// Validate configuration object
		validateConfigObject(config);

		// Required fields
		this.entry = config.entry;
		this.output = config.output;

		// Optional fields with defaults
		this.format = config.format || "cjs";
		this.nodeFlags = config.nodeFlags || [];
		this.bundles = config.bundles || {};

		// Complex fields - expect instances or create defaults
		this.assets = config.assets || new Assets([]);
		this.env = config.env || new Environment({});
		this.metadata = config.metadata || Metadata.fromPackageJson();
	}

	/**
	 * Create config from JavaScript string (piped input)
	 * @param {string} configString - JavaScript configuration code
	 * @param {string} [exportName] - Optional named export to select (uses default if not specified)
	 * @returns {Promise<ScriptConfig>} ScriptConfig instance
	 * @throws {Error} If string parsing or validation fails
	 */
	static async fromString(configString, exportName) {
		const configObject = await importConfigFromString(configString, exportName);
		return await ScriptConfig.fromObject(configObject);
	}

	/**
	 * Create config from JavaScript file
	 * @param {string} configPath - Path to configuration file
	 * @param {string} [exportName] - Optional named export to select (uses default if not specified)
	 * @returns {Promise<ScriptConfig>} ScriptConfig instance
	 * @throws {Error} If file doesn't exist or validation fails
	 */
	static async fromFile(configPath, exportName) {
		const configObject = await importConfigFromFile(configPath, exportName);
		return await ScriptConfig.fromObject(configObject);
	}

	/**
	 * Create config from object (for programmatic usage)
	 * @param {Object} configObject - Configuration object
	 * @returns {Promise<ScriptConfig>} ScriptConfig instance
	 * @throws {Error} If validation fails
	 */
	static async fromObject(configObject) {
		// Resolve complex fields asynchronously

		const assets = await Assets.resolve(configObject.assets);
		const env = await Environment.resolve(configObject.env);
		const metadata = Metadata.fromPackageJson(configObject.metadata);

		// Create final config with resolved instances
		const resolvedConfig = {
			...configObject,
			assets,
			env,
			metadata,
		};

		return new ScriptConfig(resolvedConfig);
	}

	/**
	 * Get entry point file path
	 * @returns {string} Entry point path
	 */
	getEntry() {
		return this.entry;
	}

	/**
	 * Get output executable file path
	 * @returns {string} Output path
	 */
	getOutput() {
		return this.output;
	}

	/**
	 * Get module format
	 * @returns {"cjs" | "esm"} Module format
	 */
	getFormat() {
		return this.format;
	}

	/**
	 * Get Node.js runtime flags (includes default --experimental-sqlite)
	 * @returns {string[]} Runtime flags array
	 */
	getNodeFlags() {
		const defaultFlags = ["--experimental-sqlite"];
		return [...defaultFlags, ...this.nodeFlags];
	}

	/**
	 * Get client bundles configuration
	 * @returns {Record<string, string>} Mount path to source file mapping
	 */
	getBundles() {
		return this.bundles;
	}

	/**
	 * Get assets configuration
	 * @returns {Assets} Assets instance
	 */
	getAssets() {
		return this.assets;
	}

	/**
	 * Get environment configuration
	 * @returns {Environment} Environment instance
	 */
	getEnvironment() {
		return this.env;
	}

	/**
	 * Get metadata configuration
	 * @returns {Metadata} Metadata instance
	 */
	getMetadata() {
		return this.metadata;
	}
}
