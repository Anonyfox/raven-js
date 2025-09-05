/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file ScriptCommand - Script bundle generation command using Wings Terminal
 *
 * Surgical CLI command for generating executable script bundles with proper
 * flag validation, configuration precedence, and error handling.
 */

import { CommandRoute, info, success } from "@raven-js/wings/terminal";
import { ScriptConfig } from "../src/script/config/config.js";
import {
	createConfigFromFlags,
	generateScriptBundle,
} from "../src/script/index.js";
import { createConfigFromSources, parseConfigArg } from "./config-helper.js";

/**
 * Command for script bundle generation
 * @extends {CommandRoute}
 */
export class ScriptCommand extends CommandRoute {
	/**
	 * Create a new ScriptCommand instance
	 */
	constructor() {
		super("/script/:config?", "Generate executable script bundle");

		// Mode-specific flags
		this.flag("entry", {
			type: "string",
			description: "Entry point JavaScript file",
		});
		this.flag("output", {
			type: "string",
			description: "Output executable path",
		});
		this.flag("format", {
			type: "string",
			default: "cjs",
			description: "Bundle format: cjs or esm",
		});
		this.flag("assets", {
			type: "string",
			multiple: true,
			description: "Asset file paths (can be used multiple times)",
		});
		this.flag("node-flags", {
			type: "string",
			multiple: true,
			description: "Node.js flags (can be used multiple times)",
		});

		// Shared flags
		this.flag("export", {
			type: "string",
			description: "Use named export from config file",
		});
		this.flag("validate", {
			type: "boolean",
			description: "Validate config and exit",
		});
		this.flag("verbose", {
			type: "boolean",
			description: "Verbose output",
		});
	}

	/**
	 * Execute the script generation command
	 * @param {import("@raven-js/wings").Context} ctx - Request context
	 * @returns {Promise<void>}
	 */
	async execute(ctx) {
		const { configPath, exportName } = parseConfigArg(
			ctx.pathParams.config || null,
			ctx.queryParams.get("export"),
		);

		const config = await createConfigFromSources({
			configPath,
			stdinConfig: ctx.requestBody()?.toString() || null,
			exportName,
			ConfigClass: ScriptConfig,
			createFromFlags: this.createConfigFromFlags.bind(this),
			queryParams: ctx.queryParams,
			mode: "script",
		});

		// Validate-only mode
		if (ctx.queryParams.get("validate") === "true") {
			success("✅ Script configuration validation successful!");
			console.log("");
			console.log("📋 Configuration summary:");
			console.log(`   Entry: ${config.getEntry()}`);
			console.log(`   Output: ${config.getOutput()}`);
			console.log(`   Format: ${config.getFormat()}`);
			console.log(`   Assets: ${config.getAssets().getFiles().length} files`);
			console.log(
				`   Node flags: ${config.getNodeFlags().join(", ") || "none"}`,
			);
			return;
		}

		// Run script generation
		const verbose = ctx.queryParams.get("verbose") === "true";

		if (verbose) {
			info(`🏗️ Generating script bundle: ${config.getOutput()}`);
		}

		await generateScriptBundle(config);
		success(`✅ Script bundle generated successfully: ${config.getOutput()}`);
	}

	/**
	 * Create config from CLI flags when no config file provided
	 * @param {URLSearchParams} queryParams - CLI flags as query params
	 * @returns {Promise<import("../src/script/config/config.js").ScriptConfig|null>} Config instance or null
	 */
	async createConfigFromFlags(queryParams) {
		const entry = queryParams.get("entry");
		const output = queryParams.get("output");

		if (!entry || !output) {
			return null;
		}

		return createConfigFromFlags({
			entry,
			output,
			format: queryParams.get("format") || undefined,
			assets: queryParams.getAll("assets"),
			nodeFlags: queryParams.getAll("node-flags"),
		});
	}

	/**
	 * Handle command errors gracefully
	 * @param {Error} error - The error that occurred
	 * @param {import("@raven-js/wings").Context} ctx - Request context
	 */
	async onError(error, ctx) {
		console.error(`❌ Script generation failed: ${error.message}`);
		if (ctx.queryParams.get("verbose") === "true") {
			console.error(error.stack);
		}
		ctx.responseStatusCode = 500; // Set error status code for proper exit code
	}
}
