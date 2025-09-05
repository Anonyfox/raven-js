/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file BinaryCommand - Binary executable generation command using Wings Terminal
 *
 * Surgical CLI command for generating native executable binaries with proper
 * flag validation, configuration precedence, and error handling.
 */

import { CommandRoute, info, success } from "@raven-js/wings/terminal";
import { BinaryConfig } from "../src/binary/config/config.js";
import {
	createBinaryConfigFromFlags,
	generateBinaryExecutable,
} from "../src/binary/index.js";
import { createConfigFromSources, parseConfigArg } from "./config-helper.js";

/**
 * Command for binary executable generation
 * @extends {CommandRoute}
 */
export class BinaryCommand extends CommandRoute {
	/**
	 * Create a new BinaryCommand instance
	 */
	constructor() {
		super("/binary/:config?", "Generate native executable binary");

		// Mode-specific flags
		this.flag("entry", {
			type: "string",
			description: "Entry point JavaScript file",
		});
		this.flag("output", {
			type: "string",
			description: "Output executable path",
		});
		this.flag("assets", {
			type: "string",
			multiple: true,
			description: "Asset file paths (can be used multiple times)",
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
	 * Execute the binary generation command
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
			ConfigClass: BinaryConfig,
			createFromFlags: this.createConfigFromFlags.bind(this),
			queryParams: ctx.queryParams,
			mode: "binary",
		});

		// Validate-only mode
		if (ctx.queryParams.get("validate") === "true") {
			success("✅ Binary configuration validation successful!");
			console.log("");
			console.log("📋 Configuration summary:");
			console.log(`   Entry: ${config.getEntry()}`);
			console.log(`   Output: ${config.getOutput()}`);
			console.log(`   Platform: ${config.getPlatformTarget()}`);
			console.log(`   Assets: ${config.getAssets().getFiles().length} files`);
			console.log(
				`   Bundles: ${Object.keys(config.getBundles()).length} client bundles`,
			);
			console.log(
				`   Signing: ${/** @type {{enabled: boolean}} */ (config.getSigning()).enabled ? "enabled" : "disabled"}`,
			);
			return;
		}

		// Run binary generation
		const verbose = ctx.queryParams.get("verbose") === "true";

		if (verbose) {
			info(`🏗️ Generating binary executable: ${config.getOutput()}`);
		}

		await generateBinaryExecutable(config);
		success(
			`✅ Binary executable generated successfully: ${config.getOutput()}`,
		);
	}

	/**
	 * Create config from CLI flags when no config file provided
	 * @param {URLSearchParams} queryParams - CLI flags as query params
	 * @returns {Promise<import("../src/binary/config/config.js").BinaryConfig|null>} Config instance or null
	 */
	async createConfigFromFlags(queryParams) {
		const entry = queryParams.get("entry");
		const output = queryParams.get("output");

		if (!entry || !output) {
			return null;
		}

		return createBinaryConfigFromFlags({
			entry,
			output,
			assets: queryParams.getAll("assets"),
		});
	}

	/**
	 * Handle command errors gracefully
	 * @param {Error} error - The error that occurred
	 * @param {import("@raven-js/wings").Context} ctx - Request context
	 */
	async onError(error, ctx) {
		console.error(`❌ Binary generation failed: ${error.message}`);
		if (ctx.queryParams.get("verbose") === "true") {
			console.error(error.stack);
		}
		ctx.responseStatusCode = 500; // Set error status code for proper exit code
	}
}
