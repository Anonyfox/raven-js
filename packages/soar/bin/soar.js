#!/usr/bin/env node

/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file CLI entry point for Soar deployment tool
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deploy, plan } from "../index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, "..", "package.json");
const { version } = JSON.parse(readFileSync(packagePath, "utf8"));

const [, , command, ...args] = process.argv;

/**
 * Shows help information
 */
function showHelp() {
	console.log(`
Soar v${version} - Zero-dependency deployment tool

Usage:
  soar deploy [config.js] [options]    Deploy using configuration file
  soar plan [config.js] [options]      Plan deployment (dry-run)
  soar version                         Show version
  soar help                            Show this help

Options:
  --verbose                            Show detailed output
  --auto-approve                       Skip confirmation prompts

Examples:
  soar deploy soar.config.js           Deploy using config file
  soar deploy soar.config.js:prod      Deploy using named export 'prod'
  soar plan soar.config.js             Plan deployment without executing

Environment Variables:
  CF_API_TOKEN                         Cloudflare API token
  CF_ACCOUNT_ID                        Cloudflare account ID
`);
}

/**
 * @typedef {Object} ParsedOptions
 * @property {boolean} verbose - Show verbose output
 * @property {boolean} autoApprove - Auto-approve deployment
 * @property {string|null} configFile - Config file path
 * @property {string|null} exportName - Export name to use
 */

/**
 * Parses command line arguments
 * @param {string[]} args - Command line arguments
 * @returns {ParsedOptions} Parsed options
 */
function parseArgs(args) {
	const options = {
		verbose: false,
		autoApprove: false,
		configFile: /** @type {string|null} */ (null),
		exportName: /** @type {string|null} */ (null),
	};

	for (const arg of args) {
		if (arg === "--verbose") {
			options.verbose = true;
		} else if (arg === "--auto-approve") {
			options.autoApprove = true;
		} else if (!options.configFile && !arg.startsWith("--")) {
			if (arg.includes(":")) {
				const [file, exportName] = arg.split(":");
				options.configFile = file;
				options.exportName = exportName;
			} else {
				options.configFile = arg;
			}
		}
	}

	// Default to soar.config.js if no config specified
	if (!options.configFile) {
		options.configFile = "soar.config.js";
	}

	return options;
}

/**
 * Main CLI handler
 */
async function main() {
	try {
		switch (command) {
			case "deploy": {
				const options = parseArgs(args);
				if (options.verbose) {
					console.log(
						`🚀 Starting deployment from ${options.configFile}${options.exportName ? `:${options.exportName}` : ""}`,
					);
				}

				const result = await deploy(options.configFile, options.exportName);

				console.log("✅ Deployment successful!");
				if (options.verbose) {
					console.log(JSON.stringify(result, null, 2));
				} else {
					console.log(
						`📦 Deployed to: ${/** @type {any} */ (result).url || "target"}`,
					);
					if (/** @type {any} */ (result).message) {
						console.log(`📝 ${/** @type {any} */ (result).message}`);
					}
				}

				// Add domain activation guidance for Cloudflare Workers
				const resultUrl = /** @type {any} */ (result).url;
				if (resultUrl && resultUrl.includes(".workers.dev")) {
					console.log("\n🔗 Important: If your site shows a 404 error:");
					console.log(
						"   1. Visit https://dash.cloudflare.com/workers-and-pages",
					);
					console.log("   2. Click on your worker script");
					console.log("   3. Go to Settings > Domains & Routes");
					console.log('   4. Enable the "workers.dev" subdomain');
					console.log("   This is a one-time setup per Cloudflare account.");
				}
				break;
			}

			case "plan": {
				const options = parseArgs(args);
				if (options.verbose) {
					console.log(
						`📋 Planning deployment from ${options.configFile}${options.exportName ? `:${options.exportName}` : ""}`,
					);
				}

				const planResult = await plan(options.configFile, options.exportName);

				console.log("📋 Deployment Plan:");
				console.log(
					`📦 Artifact: ${/** @type {any} */ (planResult).artifact.type} (${/** @type {any} */ (planResult).artifact.path})`,
				);
				console.log(
					`🎯 Target: ${/** @type {any} */ (planResult).target.type}`,
				);

				if (/** @type {any} */ (planResult).artifact.manifest) {
					const { fileCount, totalSize } = /** @type {any} */ (planResult)
						.artifact.manifest;
					console.log(
						`📊 Files: ${fileCount}, Size: ${Math.round(totalSize / 1024)}KB`,
					);
				}

				if (options.verbose) {
					console.log("\nFull Plan:");
					console.log(JSON.stringify(planResult, null, 2));
				}
				break;
			}

			case "version":
				console.log(version);
				break;

			case "help":
			case undefined:
				showHelp();
				break;

			default:
				console.error(`Unknown command: ${command}`);
				showHelp();
				process.exit(1);
		}
	} catch (error) {
		console.error(`❌ Error: ${error.message}`);
		if (process.env.DEBUG) {
			console.error(error.stack);
		}
		process.exit(1);
	}
}

main();
