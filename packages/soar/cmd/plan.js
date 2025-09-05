/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Plan command implementation using Wings/Terminal.
 *
 * Handles deployment planning (dry-run) without executing changes.
 * Uses same flag validation and config logic as deploy command.
 */

import { CommandRoute } from "@raven-js/wings/terminal";
import { plan } from "../index.js";
import {
	createConfigFromSources,
	parseConfigArg,
	readStdin,
} from "./config-helper.js";
import { ALL_DEPLOYMENT_FLAGS } from "./shared-flags.js";

/**
 * Plan command - plans deployment without executing (dry-run)
 */
export class PlanCommand extends CommandRoute {
	/**
	 * Create a new PlanCommand instance
	 */
	constructor() {
		super("/plan/:config?", "Plan deployment without executing (dry-run)");

		// Add all deployment flags
		for (const flagDef of ALL_DEPLOYMENT_FLAGS) {
			this.flag(flagDef.name, /** @type {any} */ (flagDef));
		}
	}

	/**
	 * Execute deployment planning
	 * @param {import('@raven-js/wings').Context} context - Wings context
	 * @returns {Promise<any>} Plan result
	 */
	async execute(context) {
		const configFile = context.pathParams.config;
		const { exportName } = parseConfigArg(
			configFile,
			context.queryParams.get("export"),
		);

		// Read stdin for piped input
		const stdinConfig = await readStdin();

		// Create configuration from sources
		const config = await createConfigFromSources({
			configPath: configFile,
			stdinConfig,
			exportName,
			queryParams: context.queryParams,
			mode: "plan",
		});

		if (context.queryParams.get("verbose")) {
			const configDesc =
				typeof config === "string" && !config.includes("\n")
					? `${configFile || "flags"}${exportName ? `:${exportName}` : ""}`
					: "piped input";
			console.log(`📋 Starting plan from ${configDesc}`);
		}

		// Execute planning
		const result = await plan(config, exportName);

		// Display plan results
		console.log("📋 Deployment Plan:");
		console.log(
			`📦 Artifact: ${result.artifact.type} (${result.artifact.path})`,
		);
		console.log(`🎯 Target: ${result.target.type}`);

		if (result.artifact?.manifest) {
			const { fileCount, totalSize } = /** @type {any} */ (
				result.artifact.manifest
			);
			console.log(
				`📊 Files: ${fileCount}, Size: ${Math.round(totalSize / 1024)}KB`,
			);
		}

		if (context.queryParams.get("verbose")) {
			console.log("\nFull Plan:");
			console.log(JSON.stringify(result, null, 2));
		}

		return result;
	}

	/**
	 * Handle command errors
	 * @param {Error} error - The error that occurred
	 * @param {import('@raven-js/wings').Context} _context - Wings context
	 */
	async onError(error, _context) {
		console.error(`❌ Error: ${error.message}`);
		if (process.env.DEBUG) {
			console.error(error.stack);
		}
		process.exit(1);
	}
}
