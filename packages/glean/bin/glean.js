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

import { parseArguments, processCodebase, showBanner } from "../index.js";

/**
 * Main CLI execution
 */
async function main() {
	try {
		showBanner();
		const args = parseArguments(process.argv.slice(2));
		await processCodebase(args);
	} catch (error) {
		console.error(`🚨 Error: ${error.message}`);
		process.exit(1);
	}
}

main();
