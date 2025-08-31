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

// Import our static generation components
import { Config } from "../src/static/config/config.js";
import { Crawler } from "../src/static/crawler.js";

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
			},
			allowPositionals: true,
		});

		return {
			command: positionals[0] || null,
			configFile: positionals[1] || null,
			...values,
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

EXAMPLES:
  # Pipe config from stdin
  echo "export default {server: 'http://localhost:3000'}" | fledge static --out dist

  # Use config file
  fledge static myconfig.js --out dist

  # Minimal config with CLI flags only
  fledge static --server http://localhost:8080 --out dist

  # Validate config without running
  fledge static myconfig.js --validate

OPTIONS:
  --server <url>     Server origin (e.g. http://localhost:3000)
  --out <path>       Output directory (default: ./dist)
  --base <path>      Base path for URLs (default: /)
  --validate         Validate config and exit
  --verbose, -v      Verbose output
  --help, -h         Show this help

COMMANDS:
  static             Generate static site files
`);
}

/**
 * Create config from various sources with proper precedence
 * @param {ParsedArgs} args - Parsed CLI arguments
 * @param {string | null} stdinConfig - Config from piped input
 * @returns {Promise<Config>} Validated config instance
 */
async function createConfigFromSources(args, stdinConfig) {
	let config;

	try {
		if (stdinConfig) {
			// Highest priority: piped input
			config = await Config.fromString(stdinConfig);
		} else if (args.configFile) {
			// Second priority: config file
			if (!existsSync(args.configFile)) {
				throw new Error(`Config file not found: ${args.configFile}`);
			}
			config = await Config.fromFile(resolve(args.configFile));
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
		const crawler = new Crawler(config);

		// Start crawling
		await crawler.start();
		await crawler.crawl();

		// Get crawled resources
		const resources = crawler.getResources();
		console.log(`📦 Found ${resources.length} resources to process`);

		// Save all resources to files
		let savedCount = 0;
		for (const resource of resources) {
			try {
				const savedPath = await resource.saveToFile(outputDir);
				if (verbose) {
					const url = resource.getUrl();
					console.log(`   💾 ${url.pathname} → ${savedPath}`);
				}
				savedCount++;
			} catch (error) {
				const url = resource.getUrl();
				console.warn(
					`   ⚠️  Failed to save ${url.href}: ${/** @type {Error} */ (error).message}`,
				);
			}
		}

		// Show final statistics
		const stats =
			/** @type {{startTime: number, endTime: number, totalTime: number, resourcesCount: number, errorsCount: number}} */ (
				crawler.getStatistics()
			);
		console.log("");
		console.log(`✅ Static site generation complete!`);
		console.log(`   📁 Output directory: ${resolve(outputDir)}`);
		console.log(`   📄 Files saved: ${savedCount}/${resources.length}`);
		console.log(`   ⏱️  Total time: ${stats.totalTime}ms`);
		console.log(`   🌐 Resources crawled: ${stats.resourcesCount}`);
		if (stats.errorsCount > 0) {
			console.log(`   ⚠️  Errors encountered: ${stats.errorsCount}`);
		}

		await crawler.stop();
	} catch (error) {
		console.error(
			`❌ Static generation failed: ${/** @type {Error} */ (error).message}`,
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

	// Only support 'static' command for now
	if (args.command !== "static") {
		console.error(`Unknown command: ${args.command}`);
		console.error("Currently supported commands: static");
		process.exit(1);
	}

	// Read piped input
	const stdinConfig = await readStdin();

	// Create configuration from sources
	const config = await createConfigFromSources(args, stdinConfig);

	// Validate-only mode
	if (args.validate) {
		console.log("✅ Configuration validation successful!");
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
}

// Run CLI
main().catch((error) => {
	console.error(`💥 Unexpected error: ${error.message}`);
	process.exit(1);
});
