/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main configuration class for binary mode bundling.
 *
 * Orchestrates native executable generation configuration with validation, defaults, and
 * factory methods for creating instances from various sources. Current platform only.
 */

import { Assets } from "../../script/config/assets.js";
import { Environment } from "../../script/config/environment.js";
import { Metadata } from "../../script/config/metadata.js";
import {
	importConfigFromFile,
	importConfigFromString,
	validateConfigObject,
} from "./import-config.js";

/**
 * Binary executable configuration with validation and lean defaults
 */
export class BinaryConfig {
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
	 * SEA configuration options
	 * @type {object}
	 */
	sea;

	/**
	 * Code signing configuration
	 * @type {object}
	 */
	signing;

	/**
	 * Create BinaryConfig instance
	 * @param {Object} config - Configuration object
	 * @param {string} config.entry - Entry point file path
	 * @param {string} [config.output] - Output executable file path (defaults to entry basename)
	 * @param {Record<string, string>} [config.bundles={}] - Client bundles
	 * @param {Assets} [config.assets] - Assets instance
	 * @param {Environment} [config.env] - Environment instance
	 * @param {Metadata} [config.metadata] - Metadata instance
	 * @param {object} [config.sea] - SEA configuration options
	 * @param {object} [config.signing] - Code signing options
	 */
	constructor(config) {
		// Validate configuration object
		validateConfigObject(config);

		// Required fields
		this.entry = config.entry;

		// Output defaults to entry basename without extension
		if (config.output) {
			this.output = config.output;
		} else {
			// Extract basename from entry path and remove extension
			const entryBasename = config.entry.split("/").pop() || "app";
			const nameWithoutExt = entryBasename.replace(/\.[^.]*$/, "");
			this.output = nameWithoutExt || "app"; // Fallback for empty strings
		}

		// Optional fields with defaults
		this.bundles = config.bundles || {};

		// Complex fields - expect instances or create defaults
		this.assets = config.assets || new Assets([]);
		this.env = config.env || new Environment({});
		this.metadata = config.metadata || Metadata.fromPackageJson();

		// SEA-specific configuration with sane defaults
		this.sea = {
			useCodeCache: true,
			disableExperimentalSEAWarning: true,
			...config.sea,
		};

		// Code signing configuration with platform detection
		this.signing = {
			enabled: process.platform === "darwin", // Auto-enable on macOS
			identity: undefined, // Use default signing identity
			...config.signing,
		};
	}

	/**
	 * Create config from JavaScript string (piped input)
	 * @param {string} configString - JavaScript configuration code
	 * @param {string} [exportName] - Optional named export to select (uses default if not specified)
	 * @returns {Promise<BinaryConfig>} BinaryConfig instance
	 * @throws {Error} If string parsing or validation fails
	 */
	static async fromString(configString, exportName) {
		const configObject = await importConfigFromString(configString, exportName);
		return await BinaryConfig.fromObject(configObject);
	}

	/**
	 * Create config from JavaScript file
	 * @param {string} configPath - Path to configuration file
	 * @param {string} [exportName] - Optional named export to select (uses default if not specified)
	 * @returns {Promise<BinaryConfig>} BinaryConfig instance
	 * @throws {Error} If file doesn't exist or validation fails
	 */
	static async fromFile(configPath, exportName) {
		const configObject = await importConfigFromFile(configPath, exportName);
		return await BinaryConfig.fromObject(configObject);
	}

	/**
	 * Create config from object (for programmatic usage)
	 * @param {Object} configObject - Configuration object
	 * @returns {Promise<BinaryConfig>} BinaryConfig instance
	 * @throws {Error} If validation fails
	 */
	static async fromObject(configObject) {
		// Resolve complex fields asynchronously
		const config = /** @type {any} */ (configObject);

		// Handle Assets - check if already an instance
		const assets =
			config.assets instanceof Assets
				? config.assets
				: await Assets.resolve(config.assets);

		// Handle Environment - check if already an instance
		const env =
			config.env instanceof Environment
				? config.env
				: await Environment.resolve(config.env);

		// Handle Metadata - check if already an instance
		const metadata =
			config.metadata instanceof Metadata
				? config.metadata
				: Metadata.fromPackageJson(config.metadata);

		// Create final config with resolved instances
		const resolvedConfig = {
			...config,
			assets,
			env,
			metadata,
		};

		return new BinaryConfig(/** @type {any} */ (resolvedConfig));
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
	 * Get client bundles configuration
	 * @returns {Record<string, string>} Mount path to source file mapping
	 */
	getBundles() {
		return { ...this.bundles };
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

	/**
	 * Get SEA configuration options
	 * @returns {object} SEA configuration
	 */
	getSea() {
		return { ...this.sea };
	}

	/**
	 * Get code signing configuration
	 * @returns {{enabled: boolean, identity?: string}} Signing configuration
	 */
	getSigning() {
		return /** @type {{enabled: boolean, identity?: string}} */ ({
			...this.signing,
		});
	}

	/**
	 * Get current platform identifier for debugging
	 * @returns {string} Platform string (e.g., "darwin", "linux", "win32")
	 */
	getPlatform() {
		return process.platform;
	}

	/**
	 * Get current architecture identifier for debugging
	 * @returns {string} Architecture string (e.g., "x64", "arm64")
	 */
	getArchitecture() {
		return process.arch;
	}

	/**
	 * Get platform-architecture pair for informational purposes
	 * @returns {string} Combined platform-arch string (e.g., "darwin-arm64")
	 */
	getPlatformTarget() {
		return `${this.getPlatform()}-${this.getArchitecture()}`;
	}
}
