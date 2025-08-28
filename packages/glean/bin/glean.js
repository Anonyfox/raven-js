#!/usr/bin/env node
/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Glean CLI entry point - JSDoc parsing, validation, and documentation generation.
 *
 * Command-line interface for the Glean documentation tool. Provides surgical
 * JSDoc analysis and beautiful documentation generation for modern JavaScript projects.
 */

import {
	runServerCommand,
	runSsgCommand,
	runValidateCommand,
	showBanner,
	showHelp,
} from "../index.js";

/**
 * Main CLI execution
 */
async function main() {
	try {
		const rawArgs = process.argv.slice(2);

		// Handle help
		if (
			rawArgs.length === 0 ||
			rawArgs.includes("--help") ||
			rawArgs.includes("-h")
		) {
			showBanner();
			showHelp();
			return;
		}

		// Parse subcommand
		const subcommand = rawArgs[0];
		const subArgs = rawArgs.slice(1);

		showBanner();

		switch (subcommand) {
			case "validate":
				await runValidateCommand(subArgs);
				break;
			case "server":
				await runServerCommand(subArgs);
				break;
			case "ssg":
				await runSsgCommand(subArgs);
				break;
			default: {
				console.error(`🚨 Unknown command: ${subcommand}`);
				console.error(`💡 Use 'glean --help' to see available commands`);
				process.exit(1);
			}
		}
	} catch (error) {
		console.error(`🚨 Error: ${error.message}`);
		process.exit(1);
	}
}

main();
