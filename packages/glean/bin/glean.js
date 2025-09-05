#!/usr/bin/env node
/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Glean CLI entry point - Wings Terminal powered JSDoc documentation tool.
 *
 * Command-line interface for the Glean documentation tool. Uses Wings Terminal
 * for surgical CLI routing, validation, and beautiful documentation generation.
 */

import { Router } from "@raven-js/wings";
import { Terminal } from "@raven-js/wings/terminal";
import { ServerCommand, SsgCommand, ValidateCommand } from "../cmd/index.js";
import { showBanner, showHelp } from "../index.js";

/**
 * Create and configure the Wings router with all commands
 * @returns {Router} Configured router instance
 */
function createRouter() {
	const router = new Router();

	// Register CommandRoute classes
	router.addRoute(new ValidateCommand());
	router.addRoute(new ServerCommand());
	router.addRoute(new SsgCommand());

	// Global help routes
	router.cmd("/help", () => {
		showBanner();
		showHelp();
	});
	router.cmd("/", () => {
		showBanner();
		showHelp();
	});

	return router;
}

/**
 * Main CLI execution using Wings Terminal
 */
async function main() {
	try {
		const router = createRouter();
		const terminal = new Terminal(router);

		showBanner();
		await terminal.run(process.argv.slice(2));
	} catch (error) {
		console.error(`🚨 Error: ${error.message}`);
		process.exit(1);
	}
}

main();
