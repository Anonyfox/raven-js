/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Binary mode executable generation.
 *
 * Main orchestration function for generating native executables using Node.js SEA
 * (Single Executable Applications) with embedded assets and environment variables.
 * Current platform only - no cross-compilation complexity.
 */

import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { BinaryBundler } from "./bundler.js";
import { BinaryConfig } from "./config/config.js";

/**
 * Generate native executable from configuration
 * @param {string | object | (() => Promise<object>)} configInput - Configuration input
 * @param {object} [options] - Generation options
 * @param {boolean} [options.validate=false] - Validate configuration only
 * @param {string} [options.exportName] - Named export from config file/string
 * @param {string} [options.outputDir] - Output directory (defaults to config output dir)
 * @returns {Promise<{executable: string, statistics: object, outputDir: string}>} Generation result
 * @throws {Error} If configuration is invalid or bundling fails
 */
export async function generateBinaryExecutable(configInput, options = {}) {
	const { validate = false, exportName, outputDir } = options;

	// Parse configuration from input
	const config = await parseConfigInput(configInput, exportName);

	// Validation mode - return early without bundling
	if (validate) {
		return {
			executable: "",
			statistics: {
				startTime: 0,
				endTime: 0,
				totalTime: 0,
				executableSize: 0,
				assetCount: config.getAssets().getFiles().length,
				message: "Configuration validation successful",
			},
			outputDir: outputDir || dirname(config.getOutput()),
		};
	}

	// Determine output directory
	const finalOutputDir = outputDir || dirname(resolve(config.getOutput()));

	// Ensure output directory exists
	mkdirSync(finalOutputDir, { recursive: true });

	// Create bundler and generate executable
	const bundler = new BinaryBundler(config);
	const executablePath = await bundler.generate(finalOutputDir);
	const statistics = bundler.getStatistics();

	return {
		executable: executablePath,
		statistics,
		outputDir: finalOutputDir,
	};
}

/**
 * Parse configuration input into BinaryConfig instance
 * @param {string | object | (() => Promise<object>)} configInput - Configuration input
 * @param {string} [exportName] - Named export from config file/string
 * @returns {Promise<BinaryConfig>} Parsed configuration
 * @throws {Error} If configuration parsing fails
 */
async function parseConfigInput(configInput, exportName) {
	try {
		// Handle different input types
		if (typeof configInput === "string") {
			// Assume file path if string doesn't contain export/import keywords
			if (configInput.includes("export") || configInput.includes("import")) {
				return await BinaryConfig.fromString(configInput, exportName);
			}
			return await BinaryConfig.fromFile(configInput, exportName);
		}

		if (typeof configInput === "object" && configInput !== null) {
			// Check if it's already a BinaryConfig instance
			if (configInput.constructor?.name === "BinaryConfig") {
				return /** @type {BinaryConfig} */ (configInput);
			}
			return await BinaryConfig.fromObject(configInput);
		}

		if (typeof configInput === "function") {
			const resolvedConfig = await configInput();
			return await BinaryConfig.fromObject(resolvedConfig);
		}

		throw new Error("Configuration input must be string, object, or function");
	} catch (error) {
		const err = /** @type {Error} */ (error);
		throw new Error(`Failed to parse configuration: ${err.message}`);
	}
}

/**
 * Create minimal binary configuration from CLI flags
 * @param {object} flags - CLI flags object
 * @param {string} flags.entry - Entry point file path
 * @param {string} [flags.output] - Output executable path (defaults to entry basename)
 * @param {Record<string, string>} [flags.bundles] - Client bundle configuration
 * @param {string[]} [flags.assets] - Asset file paths
 * @param {object} [flags.env] - Environment variables
 * @param {object} [flags.sea] - SEA configuration options
 * @param {object} [flags.signing] - Code signing options
 * @returns {Promise<BinaryConfig>} Binary configuration
 * @throws {Error} If required flags are missing
 */
export async function createBinaryConfigFromFlags(flags) {
	if (!flags || typeof flags !== "object") {
		throw new Error("Entry point is required (--entry)");
	}

	const { entry, output, bundles, assets, env, sea, signing } = flags;

	if (!entry) {
		throw new Error("Entry point is required (--entry)");
	}

	const configObject = {
		entry,
		output: output || undefined, // Let BinaryConfig auto-derive if not provided
		bundles: bundles || {},
		assets: assets || [],
		env: env || {},
		sea: sea || {},
		signing: signing || {},
	};

	return await BinaryConfig.fromObject(configObject);
}
