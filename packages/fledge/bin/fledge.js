#!/usr/bin/env node

/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Fledge CLI executable - Wings Terminal powered build & bundle tool.
 *
 * Command-line interface for the Fledge build tool. Uses Wings Terminal
 * for surgical CLI routing, validation, and build artifact generation.
 */

import { Router } from "@raven-js/wings";
import { Terminal } from "@raven-js/wings/terminal";
import { BinaryCommand, ScriptCommand, StaticCommand } from "../cmd/index.js";

/**
 * Create and configure the Wings router with all commands
 * @returns {Router} Configured router instance
 */
function createRouter() {
	const router = new Router();

	// Register CommandRoute classes
	router.addRoute(new StaticCommand());
	router.addRoute(new ScriptCommand());
	router.addRoute(new BinaryCommand());

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
		console.error(`🚨 Unknown command: ${command}\n`);
		console.error("Available commands: static, script, binary");
		console.error("Use 'fledge --help' for usage information.");
		ctx.responseStatusCode = 404;
	});

	return router;
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
 * Main CLI execution using Wings Terminal
 */
async function main() {
	try {
		const router = createRouter();
		const terminal = new Terminal(router);

		await terminal.run(process.argv.slice(2));
	} catch (error) {
		console.error(`🚨 Error: ${/** @type {Error} */ (error).message}`);
		process.exit(1);
	}
}

main();
