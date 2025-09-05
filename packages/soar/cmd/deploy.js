/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Deploy command implementation using Wings/Terminal.
 *
 * Handles artifact deployment to various targets with automatic flag validation
 * and config precedence logic.
 */

import { CommandRoute } from "@raven-js/wings/terminal";
import { deploy } from "../index.js";
import {
	createConfigFromSources,
	parseConfigArg,
	readStdin,
} from "./config-helper.js";
import { ALL_DEPLOYMENT_FLAGS } from "./shared-flags.js";

/**
 * Deploy command - executes deployment to targets
 */
export class DeployCommand extends CommandRoute {
	/**
	 * Create a new DeployCommand instance
	 */
	constructor() {
		super("/deploy/:config?", "Deploy artifacts to targets");

		// Add all deployment flags
		for (const flagDef of ALL_DEPLOYMENT_FLAGS) {
			this.flag(flagDef.name, /** @type {any} */ (flagDef));
		}
	}

	/**
	 * Execute deployment
	 * @param {import('@raven-js/wings').Context} context - Wings context
	 * @returns {Promise<any>} Deployment result
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
			mode: "deploy",
		});

		if (context.queryParams.get("verbose")) {
			const configDesc =
				typeof config === "string" && !config.includes("\n")
					? `${configFile || "flags"}${exportName ? `:${exportName}` : ""}`
					: "piped input";
			console.log(`🚀 Starting deploy from ${configDesc}`);
		}

		// Execute deployment
		const result = await deploy(config, exportName);

		// Display results
		console.log("✅ Deployment successful!");

		if (context.queryParams.get("verbose")) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			console.log(`📦 Deployed to: ${result.url || "target"}`);
			if (result.message) {
				console.log(`📝 ${result.message}`);
			}
		}

		// Add domain activation guidance for Cloudflare Workers
		if (result.url?.includes(".workers.dev")) {
			console.log("\n🔗 Important: If your site shows a 404 error:");
			console.log("   1. Visit https://dash.cloudflare.com/workers-and-pages");
			console.log("   2. Click on your worker script");
			console.log("   3. Go to Settings > Domains & Routes");
			console.log('   4. Enable the "workers.dev" subdomain');
			console.log("   This is a one-time setup per Cloudflare account.");
		}

		return result;
	}

	/**
	 * Handle command errors
	 * @param {Error} error - The error that occurred
	 * @param {import('@raven-js/wings').Context} context - Wings context
	 */
	async onError(error, context) {
		console.error(`❌ Error: ${error.message}`);
		if (process.env.DEBUG) {
			console.error(error.stack);
		}
		process.exit(1);
	}
}
