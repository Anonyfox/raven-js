#!/usr/bin/env node

/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Fledge CLI executable - command-line interface for build & bundle operations.
 *
 * Entry point for the fledge command-line tool that provides build, bundle, and
 * deployment artifact generation capabilities.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { stdin } from "node:process";
import { parseArgs } from "node:util";
import {
	createBinaryConfigFromFlags,
	generateBinaryExecutable,
} from "../src/binary/index.js";
import {
	createConfigFromFlags,
	generateScriptBundle,
} from "../src/script/index.js";
// Import our generation components
import { Config } from "../src/static/config/config.js";
import { generateStaticSite } from "../src/static/index.js";

/**
 * Read configuration from stdin (piped input)
 * @returns {Promise<string | null>} Config string or null if no piped input
 */
async function readStdin() {
	if (stdin.isTTY) {
		// No piped input
		return null;
	}

	let input = "";
	for await (const chunk of stdin) {
		input += chunk;
	}
	return input.trim() || null;
}

/**
 * @typedef {Object} ParsedArgs
 * @property {string|null} command - The subcommand
 * @property {string|null} configFile - Path to config file
 * @property {boolean} [help] - Show help
 * @property {boolean} [validate] - Validate only
 * @property {string} [server] - Server origin URL
 * @property {string} [out] - Output directory
 * @property {string} [base] - Base path
 * @property {boolean} [verbose] - Verbose output
 * @property {string} [entry] - Entry point file (script mode)
 * @property {string} [output] - Output executable path (script mode)
 * @property {string} [format] - Bundle format (script mode)
 * @property {string[]} [assets] - Asset paths (script mode)
 * @property {string[]} [nodeFlags] - Node.js flags (script mode)
 * @property {string|null} [export] - Named export from config
 */

/**
 * Parse command line arguments
 * @param {string[]} argv - Process arguments
 * @returns {ParsedArgs} Parsed arguments
 */
function parseCliArgs(argv) {
	try {
		const { values, positionals } = parseArgs({
			args: argv.slice(2), // Remove 'node' and script name
			options: {
				help: { type: "boolean", short: "h" },
				validate: { type: "boolean" },
				server: { type: "string" },
				out: { type: "string" },
				base: { type: "string" },
				verbose: { type: "boolean", short: "v" },
				// Script mode options
				entry: { type: "string" },
				output: { type: "string" },
				format: { type: "string" },
				assets: { type: "string", multiple: true },
				"node-flags": { type: "string", multiple: true },
				export: { type: "string" },
			},
			allowPositionals: true,
		});

		// Handle config file with optional export syntax (file.js:exportName)
		let configFile = positionals[1] || null;
		let exportName = values.export || null;

		if (configFile?.includes(":")) {
			const [file, exportFromFile] = configFile.split(":", 2);
			configFile = file || null;
			exportName = exportFromFile || null; // Override --export flag if specified in file syntax
		}

		return {
			command: positionals[0] || null,
			configFile,
			...values,
			export: exportName,
			nodeFlags: values["node-flags"] || [], // Map kebab-case to camelCase
		};
	} catch (error) {
		console.error(
			`Error parsing arguments: ${/** @type {Error} */ (error).message}`,
		);
		process.exit(1);
	}
}

/**
 * Show usage information
 */
function showUsage() {
	console.log(`
Fledge CLI - From nestling to flight-ready
Build & bundle tool for modern JavaScript applications

USAGE:
  fledge static [config.js] [options]
  fledge script [config.js] [options]
  fledge binary [config.js] [options]

EXAMPLES:
  # Static site generation
  echo "export default {server: 'http://localhost:3000'}" | fledge static --out dist
  fledge static config.js --out dist
  fledge static --server http://localhost:8080 --out dist

  # Script bundle generation
  echo "export default {entry: './app.js', output: './dist/app.js'}" | fledge script
  fledge script config.js --validate
  fledge script --entry ./app.js --output ./dist/app.js

  # Binary executable generation
  echo "export default {entry: './app.js', output: './dist/app'}" | fledge binary
  fledge binary config.js:binary --verbose
  fledge binary --entry ./app.js --output ./dist/app

STATIC OPTIONS:
  --server <url>     Server origin (e.g. http://localhost:3000)
  --out <path>       Output directory (default: ./dist)
  --base <path>      Base path for URLs (default: /)

SCRIPT OPTIONS:
  --entry <file>     Entry point JavaScript file
  --output <file>    Output executable path
  --format <fmt>     Bundle format: cjs or esm (default: cjs)
  --assets <path>    Asset file paths (can be used multiple times)
  --node-flags <f>   Node.js flags (can be used multiple times)

BINARY OPTIONS:
  --entry <file>     Entry point JavaScript file
  --output <file>    Output executable path
  --assets <path>    Asset file paths (can be used multiple times)

SHARED OPTIONS:
  --export <name>    Use named export from config file
  --validate         Validate config and exit
  --verbose, -v      Verbose output
  --help, -h         Show this help

COMMANDS:
  static             Generate static site files
  script             Generate executable script bundle
  binary             Generate native executable binary
`);
}

/**
 * Create static config from various sources with proper precedence
 * @param {ParsedArgs} args - Parsed CLI arguments
 * @param {string | null} stdinConfig - Config from piped input
 * @returns {Promise<Config>} Validated config instance
 */
async function createStaticConfigFromSources(args, stdinConfig) {
	let config;

	try {
		if (stdinConfig) {
			// Highest priority: piped input
			config = await Config.fromString(stdinConfig, args.export || undefined);
		} else if (args.configFile) {
			// Second priority: config file
			if (!existsSync(args.configFile)) {
				throw new Error(`Config file not found: ${args.configFile}`);
			}
			config = await Config.fromFile(
				resolve(args.configFile),
				args.export || undefined,
			);
		} else if (args.server) {
			// Third priority: minimal CLI config
			config = new Config({
				server: args.server,
				routes: ["/"], // Default route
			});
		} else {
			throw new Error(
				"No configuration provided. Use piped input, config file, or --server flag.",
			);
		}

		// Apply CLI overrides to config
		if (args.base) {
			// Create new config with base path override - need to reconstruct
			const configData = {
				server: config.getServer(),
				routes: config.getRoutes(),
				discover: config.getDiscover(),
				bundles: config.getBundles(),
				basePath: args.base, // Use basePath instead of base
				assets: config.getAssets(),
				output: config.getOutput(),
			};
			config = new Config(configData);
		}

		return config;
	} catch (error) {
		console.error(
			`Configuration error: ${/** @type {Error} */ (error).message}`,
		);
		process.exit(1);
	}
}

/**
 * Create script config from various sources with proper precedence
 * @param {ParsedArgs} args - Parsed CLI arguments
 * @param {string | null} stdinConfig - Config from piped input
 * @returns {Promise<import("../src/script/config/config.js").ScriptConfig>} Validated config instance
 */
async function createScriptConfigFromSources(args, stdinConfig) {
	try {
		if (stdinConfig) {
			// Highest priority: piped input
			const { ScriptConfig } = await import("../src/script/config/config.js");
			return ScriptConfig.fromString(stdinConfig, args.export || undefined);
		} else if (args.configFile) {
			// Second priority: config file
			if (!existsSync(args.configFile)) {
				throw new Error(`Config file not found: ${args.configFile}`);
			}
			const { ScriptConfig } = await import("../src/script/config/config.js");
			return ScriptConfig.fromFile(
				resolve(args.configFile),
				args.export || undefined,
			);
		} else if (args.entry && args.output) {
			// Third priority: minimal CLI config

			return createConfigFromFlags({
				entry: args.entry,
				output: args.output,
				format: args.format,
				assets: args.assets || [],
				nodeFlags: args.nodeFlags,
			});
		} else {
			throw new Error(
				"No configuration provided. Use piped input, config file, or --entry/--output flags.",
			);
		}
	} catch (error) {
		console.error(
			`Configuration error: ${/** @type {Error} */ (error).message}`,
		);
		process.exit(1);
	}
}

/**
 * Create binary config from various sources with proper precedence
 * @param {ParsedArgs} args - Parsed CLI arguments
 * @param {string | null} stdinConfig - Config from piped input
 * @returns {Promise<import("../src/binary/config/config.js").BinaryConfig>} Validated config instance
 */
async function createBinaryConfigFromSources(args, stdinConfig) {
	try {
		if (stdinConfig) {
			// Highest priority: piped input
			const { BinaryConfig } = await import("../src/binary/config/config.js");
			return BinaryConfig.fromString(stdinConfig, args.export || undefined);
		} else if (args.configFile) {
			// Second priority: config file
			if (!existsSync(args.configFile)) {
				throw new Error(`Config file not found: ${args.configFile}`);
			}
			const { BinaryConfig } = await import("../src/binary/config/config.js");
			return BinaryConfig.fromFile(
				resolve(args.configFile),
				args.export || undefined,
			);
		} else if (args.entry && args.output) {
			// Third priority: minimal CLI config
			return createBinaryConfigFromFlags({
				entry: args.entry,
				output: args.output,
				assets: args.assets || [],
			});
		} else {
			throw new Error(
				"No configuration provided. Use piped input, config file, or --entry/--output flags.",
			);
		}
	} catch (error) {
		console.error(
			`Configuration error: ${/** @type {Error} */ (error).message}`,
		);
		process.exit(1);
	}
}

/**
 * Run static site generation
 * @param {Config} config - Validated configuration
 * @param {ParsedArgs} args - CLI arguments
 */
async function runStaticGeneration(config, args) {
	const outputDir = args.out || "./dist";
	const verbose = args.verbose || false;

	if (verbose) {
		const routes = config.getRoutes();
		const routeDisplay = Array.isArray(routes)
			? routes.join(", ")
			: "Dynamic routes function";

		console.log(`📋 Configuration:`);
		console.log(
			`   Server: ${typeof config.getServer() === "function" ? "Custom function" : config.getServer()}`,
		);
		console.log(`   Routes: ${routeDisplay}`);
		console.log(`   Output: ${resolve(outputDir)}`);
		console.log("");
	}

	console.log("🦅 Starting static site generation...");

	try {
		// Generate static site
		const result = await generateStaticSite(config, {
			outputDir,
			verbose,
		});

		console.log(`📦 Found ${result.totalFiles} resources to process`);

		// Show verbose file details if requested
		if (verbose && result.savedPaths) {
			for (const saved of result.savedPaths) {
				console.log(`   💾 ${saved.url} → ${saved.path}`);
			}
		}

		// Show any errors
		for (const error of result.errors) {
			console.warn(`   ⚠️  Failed to save ${error.url}: ${error.error}`);
		}

		// Show final statistics
		console.log("");
		console.log(`✅ Static site generation complete!`);
		console.log(`   📁 Output directory: ${resolve(result.outputDir)}`);
		console.log(`   📄 Files saved: ${result.savedFiles}/${result.totalFiles}`);
		console.log(`   ⏱️  Total time: ${result.totalTime}ms`);
		console.log(`   🌐 Resources crawled: ${result.resourcesCount}`);
		if (result.errorsCount > 0) {
			console.log(`   ⚠️  Errors encountered: ${result.errorsCount}`);
		}
	} catch (error) {
		console.error(
			`❌ Static generation failed: ${/** @type {Error} */ (error).message}`,
		);
		process.exit(1);
	}
}

/**
 * Run script bundle generation
 * @param {import("../src/script/config/config.js").ScriptConfig} config - Validated configuration
 * @param {ParsedArgs} args - CLI arguments
 */
async function runScriptGeneration(config, args) {
	const verbose = args.verbose || false;

	if (verbose) {
		console.log(`📋 Configuration:`);
		console.log(`   Entry: ${config.getEntry()}`);
		console.log(`   Output: ${resolve(config.getOutput())}`);
		console.log(`   Format: ${config.getFormat()}`);
		console.log(`   Assets: ${config.getAssets().getFiles().length} files`);
		console.log(`   Node flags: ${config.getNodeFlags().join(", ") || "none"}`);
		console.log("");
	}

	console.log("🦅 Starting script bundle generation...");

	try {
		// Generate script bundle
		const result = await generateScriptBundle(config, {
			validate: false,
			write: true,
		});

		if (verbose) {
			const stats = /** @type {any} */ (result.statistics);
			console.log(`📦 Bundle size: ${stats.bundleSize} bytes`);
			console.log(`📁 Assets embedded: ${stats.assetCount}`);
		}

		// Show final statistics
		console.log("");
		console.log(`✅ Script bundle generation complete!`);
		const stats = /** @type {any} */ (result.statistics);
		console.log(`   📄 Executable: ${result.outputPath}`);
		console.log(`   📦 Bundle size: ${(stats.bundleSize / 1024).toFixed(1)}KB`);
		console.log(`   ⏱️  Build time: ${stats.totalTime}ms`);
		if (stats.assetCount > 0) {
			console.log(`   📁 Assets embedded: ${stats.assetCount}`);
		}
	} catch (error) {
		console.error(
			`❌ Script generation failed: ${/** @type {Error} */ (error).message}`,
		);
		process.exit(1);
	}
}

/**
 * Run binary executable generation
 * @param {import("../src/binary/config/config.js").BinaryConfig} config - Validated configuration
 * @param {ParsedArgs} args - CLI arguments
 */
async function runBinaryGeneration(config, args) {
	const verbose = args.verbose || false;

	if (verbose) {
		console.log(`📋 Configuration:`);
		console.log(`   Entry: ${config.getEntry()}`);
		console.log(`   Output: ${resolve(config.getOutput())}`);
		console.log(`   Platform: ${config.getPlatformTarget()}`);
		console.log(`   Assets: ${config.getAssets().getFiles().length} files`);
		console.log(
			`   Bundles: ${Object.keys(config.getBundles()).length} client bundles`,
		);
		console.log(
			`   Signing: ${/** @type {{enabled: boolean}} */ (config.getSigning()).enabled ? "enabled" : "disabled"}`,
		);
		console.log("");
	}

	console.log("🦅 Starting binary executable generation...");

	try {
		// Generate binary executable
		const result = await generateBinaryExecutable(config, {
			validate: false,
		});

		if (verbose) {
			const stats =
				/** @type {{executableSize: number, assetCount: number}} */ (
					result.statistics
				);
			console.log(
				`📦 Executable size: ${(stats.executableSize / 1024).toFixed(1)}KB`,
			);
			console.log(`📁 Assets embedded: ${stats.assetCount}`);
		}

		// Show final statistics
		console.log("");
		console.log(`✅ Binary executable generation complete!`);
		console.log(`   🚀 Executable: ${result.executable}`);
		const stats =
			/** @type {{executableSize: number, totalTime: number, assetCount: number}} */ (
				result.statistics
			);
		console.log(`   📦 Size: ${(stats.executableSize / 1024).toFixed(1)}KB`);
		console.log(`   ⏱️  Build time: ${stats.totalTime}ms`);
		if (stats.assetCount > 0) {
			console.log(`   📁 Assets embedded: ${stats.assetCount}`);
		}
		console.log(`   🏃 Run with: ${result.executable}`);
	} catch (error) {
		console.error(
			`❌ Binary generation failed: ${/** @type {Error} */ (error).message}`,
		);
		process.exit(1);
	}
}

/**
 * Main CLI entry point
 */
async function main() {
	const args = parseCliArgs(process.argv);

	// Handle help
	if (args.help || !args.command) {
		showUsage();
		process.exit(args.help ? 0 : 1);
	}

	// Validate command
	if (!["static", "script", "binary"].includes(args.command)) {
		console.error(`Unknown command: ${args.command || "none"}`);
		console.error("Available commands: static, script, binary");
		process.exit(1);
	}

	// Read piped input
	const stdinConfig = await readStdin();

	if (args.command === "static") {
		// Create static configuration from sources
		const config = await createStaticConfigFromSources(args, stdinConfig);

		// Validate-only mode
		if (args.validate) {
			console.log("✅ Static configuration validation successful!");
			console.log("");
			console.log("📋 Configuration summary:");
			console.log(
				`   Server: ${typeof config.getServer() === "function" ? "Custom function" : config.getServer()}`,
			);

			const routes = config.getRoutes();
			const routeDisplay = Array.isArray(routes)
				? routes.join(", ")
				: "Dynamic routes function";
			console.log(`   Routes: ${routeDisplay}`);

			const discover = config.getDiscover();
			if (typeof discover === "boolean") {
				console.log(`   Discovery: ${discover ? "enabled" : "disabled"}`);
			} else {
				console.log(`   Discovery depth: ${discover.getDepth()}`);
			}

			console.log(`   Base path: ${config.getBasePath() || "/"}`);
			process.exit(0);
		}

		// Run static generation
		await runStaticGeneration(config, args);
	} else if (args.command === "script") {
		// Create script configuration from sources
		const config = await createScriptConfigFromSources(args, stdinConfig);

		// Validate-only mode
		if (args.validate) {
			console.log("✅ Script configuration validation successful!");
			console.log("");
			console.log("📋 Configuration summary:");
			console.log(`   Entry: ${config.getEntry()}`);
			console.log(`   Output: ${config.getOutput()}`);
			console.log(`   Format: ${config.getFormat()}`);
			console.log(`   Assets: ${config.getAssets().getFiles().length} files`);
			console.log(
				`   Node flags: ${config.getNodeFlags().join(", ") || "none"}`,
			);
			process.exit(0);
		}

		// Run script generation
		await runScriptGeneration(config, args);
	} else if (args.command === "binary") {
		// Create binary configuration from sources
		const config = await createBinaryConfigFromSources(args, stdinConfig);

		// Validate-only mode
		if (args.validate) {
			console.log("✅ Binary configuration validation successful!");
			console.log("");
			console.log("📋 Configuration summary:");
			console.log(`   Entry: ${config.getEntry()}`);
			console.log(`   Output: ${config.getOutput()}`);
			console.log(`   Platform: ${config.getPlatformTarget()}`);
			console.log(`   Assets: ${config.getAssets().getFiles().length} files`);
			console.log(
				`   Bundles: ${Object.keys(config.getBundles()).length} client bundles`,
			);
			console.log(
				`   Signing: ${/** @type {{enabled: boolean}} */ (config.getSigning()).enabled ? "enabled" : "disabled"}`,
			);
			process.exit(0);
		}

		// Run binary generation
		await runBinaryGeneration(config, args);
	}
}

// Run CLI
main().catch((error) => {
	console.error(`💥 Unexpected error: ${error.message}`);
	process.exit(1);
});
