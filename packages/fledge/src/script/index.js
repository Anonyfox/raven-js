/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Script mode executable generation.
 *
 * Main orchestration function for generating executable JavaScript bundles
 * with embedded assets, environment variables, and metadata banners.
 * Compatible with Wings middleware asset loading via globalThis.RavenJS.assets.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Bundler } from "./bundler.js";
import { ScriptConfig } from "./config/config.js";

/**
 * Generate executable script bundle from configuration
 * @param {string | object | (() => Promise<object>)} configInput - Configuration input
 * @param {object} [options] - Generation options
 * @param {boolean} [options.validate=false] - Validate configuration only
 * @param {string} [options.exportName] - Named export from config file/string
 * @param {boolean} [options.write=true] - Write output file automatically
 * @returns {Promise<{executable: string, statistics: object, outputPath?: string}>} Generation result
 * @throws {Error} If configuration is invalid or bundling fails
 */
export async function generateScriptBundle(configInput, options = {}) {
  const { validate = false, exportName, write = true } = options;

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
        bundleSize: 0,
        assetCount: config.getAssets().getFiles().length,
        message: "Configuration validation successful",
      },
    };
  }

  // Create bundler and generate executable
  const bundler = new Bundler(config);
  const executable = await bundler.generate();
  const statistics = bundler.getStatistics();

  // Write output file if requested
  let outputPath;
  if (write) {
    outputPath = resolve(config.getOutput());
    const outputDir = dirname(outputPath);

    // Ensure output directory exists (mkdirp behavior)
    mkdirSync(outputDir, { recursive: true });

    writeFileSync(outputPath, executable, { mode: 0o755 }); // Make executable
  }

  return {
    executable,
    statistics,
    ...(outputPath && { outputPath }),
  };
}

/**
 * Parse configuration input into ScriptConfig instance
 * @param {string | object | (() => Promise<object>)} configInput - Configuration input
 * @param {string} [exportName] - Named export from config file/string
 * @returns {Promise<ScriptConfig>} Parsed configuration
 * @throws {Error} If configuration parsing fails
 */
async function parseConfigInput(configInput, exportName) {
  try {
    // Handle different input types
    if (typeof configInput === "string") {
      // Assume file path if string doesn't contain export/import keywords
      if (configInput.includes("export") || configInput.includes("import")) {
        return await ScriptConfig.fromString(configInput, exportName);
      }
      return await ScriptConfig.fromFile(configInput, exportName);
    }

    if (typeof configInput === "object" && configInput !== null) {
      // Check if it's already a ScriptConfig instance
      if (configInput.constructor?.name === "ScriptConfig") {
        return /** @type {ScriptConfig} */ (configInput);
      }
      return await ScriptConfig.fromObject(configInput);
    }

    if (typeof configInput === "function") {
      const resolvedConfig = await configInput();
      return await ScriptConfig.fromObject(resolvedConfig);
    }

    throw new Error("Configuration input must be string, object, or function");
  } catch (error) {
    const err = /** @type {Error} */ (error);
    throw new Error(`Failed to parse configuration: ${err.message}`);
  }
}

/**
 * Create minimal script configuration from CLI flags
 * @param {object} flags - CLI flags object
 * @param {string} flags.entry - Entry point file path
 * @param {string} flags.output - Output executable path
 * @param {string} [flags.format] - Bundle format (cjs/esm)
 * @param {string[]} [flags.assets] - Asset file paths
 * @param {string[]} [flags.nodeFlags] - Additional Node.js flags
 * @param {object} [flags.env] - Environment variables
 * @param {object} [flags.bundles] - Client bundle configuration
 * @returns {Promise<ScriptConfig>} Script configuration
 * @throws {Error} If required flags are missing
 */
export async function createConfigFromFlags(flags) {
  const { entry, output, format, assets, nodeFlags, env, bundles } = flags;

  if (!entry) {
    throw new Error("Entry point is required (--entry)");
  }

  if (!output) {
    throw new Error("Output path is required (--output)");
  }

  const configObject = {
    entry,
    output,
    format: format || "cjs",
    assets: assets || [],
    nodeFlags: nodeFlags || [],
    env: env || {},
    bundles: bundles || {},
  };

  return await ScriptConfig.fromObject(configObject);
}
