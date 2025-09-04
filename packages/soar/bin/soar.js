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
import { stdin } from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { deploy, plan } from "../index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, "..", "package.json");
const { version } = JSON.parse(readFileSync(packagePath, "utf8"));

/**
 * Read configuration from stdin (piped input)
 * @returns {Promise<string | null>} Config string or null if no piped input
 */
export async function readStdin() {
	if (stdin.isTTY) {
		return null; // No piped input
	}

	let input = "";
	for await (const chunk of stdin) {
		input += chunk;
	}
	return input.trim() || null;
}

/**
 * @typedef {Object} ParsedArgs
 * @property {string|null} command - The command to run
 * @property {string|null} configFile - Config file path
 * @property {string|null} exportName - Named export to use
 * @property {boolean} help - Show help
 * @property {boolean} verbose - Show verbose output
 * @property {boolean} autoApprove - Auto-approve deployment
 * @property {string|null} static - Static files path
 * @property {string|null} cloudflareWorkers - Cloudflare Workers script name
 * @property {string|null} cfToken - Cloudflare API token
 * @property {string|null} cfAccount - Cloudflare account ID
 * @property {string|null} cfCompatibility - Cloudflare compatibility date
 * @property {string|null} script - Script file path (future)
 * @property {string|null} binary - Binary file path (future)
 * @property {string|null} s3 - S3 bucket name (future)
 * @property {string|null} doSpaces - DO Spaces name (future)
 * @property {string|null} doDroplet - DO Droplet name (future)
 */

/**
 * Create config object from CLI flags for common deployment patterns
 * @param {ParsedArgs} flags - Parsed CLI flags
 * @returns {Object|null} Config object or null if no flags provided
 */
export function createConfigFromFlags(flags) {
	// Static to Cloudflare Workers (most common case)
	if (flags.static && flags.cloudflareWorkers) {
		return {
			artifact: {
				type: "static",
				path: flags.static,
			},
			target: {
				name: "cloudflare-workers",
				scriptName: flags.cloudflareWorkers,
				accountId: flags.cfAccount || process.env.CF_ACCOUNT_ID,
				apiToken: flags.cfToken || process.env.CF_API_TOKEN,
				compatibilityDate: flags.cfCompatibility || "2024-01-01",
			},
		};
	}

	// Future: Other deployment patterns would go here
	return null;
}

/**
 * Shows help information
 * @param {string} [command] - Specific command to show help for
 */
export function showHelp(command) {
	if (command) {
		switch (command) {
			case "deploy":
				console.log(`
soar deploy - Deploy artifacts to targets

USAGE:
  soar deploy [config.js] [options]
  soar deploy --static <path> --cloudflare-workers <name> [options]

EXAMPLES:
  # Using configuration file
      soar deploy raven.soar.js
    soar deploy raven.soar.js:production

  # Using piped input
  echo "export default {artifact: {...}, target: {...}}" | soar deploy

  # Using CLI flags (no config file needed)
  soar deploy --static ./dist --cloudflare-workers my-app
  soar deploy --static ./dist --cf-workers my-app --cf-account $CF_ACCOUNT_ID

OPTIONS:
  --verbose, -v              Show detailed output
  --auto-approve             Skip confirmation prompts
  --export <name>            Use named export from config file
  --static <path>            Deploy static files from path
  --cloudflare-workers <name> Deploy to Cloudflare Workers with script name
  --cf-workers <name>        Alias for --cloudflare-workers
  --cf-token <token>         Cloudflare API token
  --cf-account <id>          Cloudflare account ID
  --cf-compatibility <date>  Cloudflare compatibility date (default: 2024-01-01)
`);
				break;
			case "plan":
				console.log(`
soar plan - Plan deployment without executing (dry-run)

USAGE:
  soar plan [config.js] [options]
  soar plan --static <path> --cloudflare-workers <name> [options]

EXAMPLES:
  soar plan raven.soar.js
  soar plan --static ./dist --cf-workers my-app --verbose
`);
				break;
			default:
				console.log(`Unknown command: ${command}`);
				showHelp();
		}
		return;
	}

	console.log(`
Soar v${version} - Zero-dependency deployment tool

USAGE:
  soar <command> [options]

COMMANDS:
  deploy [config.js] [options]     Deploy artifact to target
  plan [config.js] [options]       Plan deployment (dry-run)

  validate [config.js]             Validate configuration [NOT IMPLEMENTED]
  list [--provider <name>]         List deployed resources [NOT IMPLEMENTED]
  show <resource-name>             Show resource details [NOT IMPLEMENTED]
  destroy <resource-name>          Destroy specific resource [NOT IMPLEMENTED]

  version                          Show version
  help [command]                   Show help

QUICK DEPLOYMENT (no config file needed):
  # Static site to Cloudflare Workers
  soar deploy --static ./dist --cloudflare-workers my-app-name
  soar deploy --static ./dist --cf-workers my-app --cf-account $CF_ACCOUNT_ID

INPUT METHODS (Unix philosophy - in order of precedence):
  1. Piped input:    echo "export default {...}" | soar deploy
  2. Config file:    soar deploy raven.soar.js
  3. Named export:   soar deploy raven.soar.js:production
  4. CLI flags:      soar deploy --static ./dist --cf-workers my-app

GLOBAL OPTIONS:
  --verbose, -v              Show detailed output
  --auto-approve             Skip confirmation prompts
  --export <name>            Use named export from config file
  --help, -h                 Show help

ENVIRONMENT VARIABLES:
  CF_API_TOKEN               Cloudflare API token
  CF_ACCOUNT_ID              Cloudflare account ID
  DEBUG                      Show debug information on errors

EXAMPLES:
  # Deploy static site using config file
  soar deploy raven.soar.js --verbose

  # Deploy to staging environment
  soar deploy raven.soar.js:staging

  # Quick deploy without config file
  soar deploy --static ./dist --cf-workers my-site-prod

  # Plan deployment first
  soar plan --static ./dist --cf-workers my-site --verbose

  # Deploy using piped config
  echo "export default {artifact: {type: 'static', path: './dist'}, target: {name: 'cloudflare-workers', scriptName: 'my-app'}}" | soar deploy

Get started: https://ravenjs.dev/soar
Report issues: https://github.com/Anonyfox/ravenjs/issues
`);
}

/**
 * Parse command line arguments using Node.js built-in parseArgs
 * @param {string[]} argv - Process arguments
 * @returns {ParsedArgs} Parsed arguments
 */
export function parseCliArgs(argv) {
	try {
		const { values, positionals } = parseArgs({
			args: argv.slice(2),
			options: {
				// Global options
				help: { type: "boolean", short: "h" },
				verbose: { type: "boolean", short: "v" },
				"auto-approve": { type: "boolean" },
				export: { type: "string" },

				// Quick deployment flags
				static: { type: "string" },
				"cloudflare-workers": { type: "string" },
				"cf-workers": { type: "string" },
				"cf-token": { type: "string" },
				"cf-account": { type: "string" },
				"cf-compatibility": { type: "string" },

				// Future deployment flags (not implemented)
				script: { type: "string" },
				binary: { type: "string" },
				s3: { type: "string" },
				"do-spaces": { type: "string" },
				"do-droplet": { type: "string" },
			},
			allowPositionals: true,
		});

		// Handle config file with optional export syntax (file.js:exportName)
		let configFile = positionals[1] || null;
		let exportName = values.export || null;

		if (configFile?.includes(":")) {
			const [file, namedExport] = configFile.split(":");
			configFile = file;
			exportName = namedExport || exportName;
		}

		// Handle flag aliases
		const cloudflareWorkers =
			values["cloudflare-workers"] || values["cf-workers"];

		return /** @type {ParsedArgs} */ ({
			command: positionals[0] || null,
			configFile,
			exportName,
			help: values.help || false,
			verbose: values.verbose || false,
			autoApprove: values["auto-approve"] || false,

			// Quick deployment flags
			static: values.static || null,
			cloudflareWorkers: cloudflareWorkers || null,
			cfToken: values["cf-token"] || null,
			cfAccount: values["cf-account"] || null,
			cfCompatibility: values["cf-compatibility"] || null,

			// Future flags (for error messages)
			script: values.script || null,
			binary: values.binary || null,
			s3: values.s3 || null,
			doSpaces: values["do-spaces"] || null,
			doDroplet: values["do-droplet"] || null,
		});
	} catch (error) {
		console.error(`❌ Invalid arguments: ${error.message}`);
		showHelp();
		process.exit(1);
	}
}

/**
 * Show not implemented message for future features
 * @param {string} feature - Feature name
 */
export function notImplemented(feature) {
	console.log(`
🚧 ${feature} - Not implemented yet

This feature is planned for a future release of Soar.
Current version (${version}) supports:
  ✅ Static site deployment to Cloudflare Workers

Coming soon:
  🔄 Script bundle deployment
  🔄 Binary deployment
  🔄 AWS S3/CloudFront deployment
  🔄 DigitalOcean Spaces/Droplets deployment
  🔄 Resource management (list, show, destroy)
  🔄 Configuration validation

Track progress: https://github.com/Anonyfox/ravenjs/projects
`);
}

/**
 * Main CLI handler
 */
export async function main() {
	try {
		const args = parseCliArgs(process.argv);

		// Handle help
		if (args.help) {
			showHelp(args.command);
			return;
		}

		// Handle version
		if (args.command === "version") {
			console.log(version);
			return;
		}

		// Handle help command
		if (args.command === "help") {
			showHelp(args.configFile); // configFile becomes the command to show help for
			return;
		}

		// Check for not implemented features
		if (
			args.script ||
			args.binary ||
			args.s3 ||
			args.doSpaces ||
			args.doDroplet
		) {
			const features = [];
			if (args.script) features.push("Script deployment");
			if (args.binary) features.push("Binary deployment");
			if (args.s3) features.push("AWS S3 deployment");
			if (args.doSpaces) features.push("DigitalOcean Spaces deployment");
			if (args.doDroplet) features.push("DigitalOcean Droplet deployment");

			notImplemented(features.join(", "));
			return;
		}

		// Check for not implemented commands
		if (["validate", "list", "show", "destroy"].includes(args.command)) {
			notImplemented(`Command: ${args.command}`);
			return;
		}

		// Handle main commands
		switch (args.command) {
			case "deploy":
			case "plan": {
				let config = null;

				// 1. Try piped input first (highest priority)
				const stdinInput = await readStdin();
				if (stdinInput) {
					config = stdinInput;
				}
				// 2. Try config from CLI flags
				else if (args.static || args.cloudflareWorkers) {
					config = createConfigFromFlags(args);
					if (!config) {
						console.error(
							"❌ Invalid flag combination. Use --static <path> --cloudflare-workers <name>",
						);
						process.exit(1);
					}
				}
				// 3. Try config file
				else if (args.configFile) {
					config = args.configFile;
				}
				// 4. Default to raven.soar.js
				else {
					config = "raven.soar.js";
				}

				if (args.verbose) {
					const configDesc =
						typeof config === "string" && !config.includes("\n")
							? `${config}${args.exportName ? `:${args.exportName}` : ""}`
							: "piped input";
					console.log(
						`${args.command === "deploy" ? "🚀" : "📋"} Starting ${args.command} from ${configDesc}`,
					);
				}

				const result =
					args.command === "deploy"
						? await deploy(/** @type {any} */ (config), args.exportName)
						: await plan(/** @type {any} */ (config), args.exportName);

				if (args.command === "deploy") {
					console.log("✅ Deployment successful!");
					if (args.verbose) {
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
					if (resultUrl?.includes(".workers.dev")) {
						console.log("\n🔗 Important: If your site shows a 404 error:");
						console.log(
							"   1. Visit https://dash.cloudflare.com/workers-and-pages",
						);
						console.log("   2. Click on your worker script");
						console.log("   3. Go to Settings > Domains & Routes");
						console.log('   4. Enable the "workers.dev" subdomain');
						console.log("   This is a one-time setup per Cloudflare account.");
					}
				} else {
					console.log("📋 Deployment Plan:");
					console.log(
						`📦 Artifact: ${/** @type {any} */ (result).artifact.type} (${/** @type {any} */ (result).artifact.path})`,
					);
					console.log(`🎯 Target: ${/** @type {any} */ (result).target.type}`);

					if (/** @type {any} */ (result).artifact.manifest) {
						const { fileCount, totalSize } = /** @type {any} */ (result)
							.artifact.manifest;
						console.log(
							`📊 Files: ${fileCount}, Size: ${Math.round(totalSize / 1024)}KB`,
						);
					}

					if (args.verbose) {
						console.log("\nFull Plan:");
						console.log(JSON.stringify(result, null, 2));
					}
				}
				break;
			}

			case null:
			case undefined:
				showHelp();
				break;

			default:
				console.error(`❌ Unknown command: ${args.command}`);
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

// Only run main() if this file is executed directly (not imported)
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error(`❌ Error: ${error.message}`);
		if (process.env.DEBUG) {
			console.error(error.stack);
		}
		process.exit(1);
	});
}
