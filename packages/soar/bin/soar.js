#!/usr/bin/env node

/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file CLI entry point for Soar deployment tool.
 *
 * Uses Wings/Terminal for automatic CLI handling, replacing 482 lines
 * of manual argument parsing with clean CommandRoute classes.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "@raven-js/wings";
import { Terminal } from "@raven-js/wings/terminal";
import { DeployCommand, PlanCommand } from "../cmd/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, "..", "package.json");
const { version } = JSON.parse(readFileSync(packagePath, "utf8"));

/**
 * Show not implemented message for future features
 * @param {string} feature - Feature name
 */
function showNotImplemented(feature) {
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
 * Create and configure the Wings router with all commands
 * @returns {Router} Configured router instance
 */
function createRouter() {
	const router = new Router();

	// Register CommandRoute classes
	router.addRoute(new DeployCommand());
	router.addRoute(new PlanCommand());

	// Global help routes
	router.cmd("/help", () => {
		showUsage();
	});

	// Handle --help flag (transforms to /?help=true) and default route
	router.cmd("/", (ctx) => {
		const helpFlag = ctx.queryParams.get("help");
		if (helpFlag === "true") {
			showUsage();
			return; // Exit code 0 (success)
		}
		showUsage();
		ctx.responseStatusCode = 404; // This will map to exit code 1
	});

	// Handle unknown commands with better error messages using catch-all route
	router.cmd("/:command", (ctx) => {
		const command = ctx.pathParams.command;

		// Handle special commands
		if (command === "version") {
			console.log(version);
			return;
		}

		// Handle not implemented commands
		const notImplementedCommands = ["validate", "list", "show", "destroy"];
		if (notImplementedCommands.includes(command)) {
			showNotImplemented(`Command: ${command}`);
			return;
		}

		console.error(`❌ Unknown command: ${command}\n`);
		console.error("Available commands: deploy, plan");
		console.error("Use 'soar --help' for usage information.");
		ctx.responseStatusCode = 404;
	});

	return router;
}

/**
 * Show usage information
 */
function showUsage() {
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
  soar deploy --static ./dist --cf-workers my-app-name
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
 * Main CLI execution using Wings Terminal
 */
async function main() {
	try {
		const router = createRouter();
		const terminal = new Terminal(router);

		await terminal.run(process.argv.slice(2));
	} catch (error) {
		console.error(`❌ Error: ${/** @type {Error} */ (error).message}`);
		if (process.env.DEBUG) {
			console.error(error.stack);
		}
		process.exit(1);
	}
}

main();

// Export functions for testing
export { showNotImplemented as notImplemented };
