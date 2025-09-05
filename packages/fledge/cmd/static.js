/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file StaticCommand - Static site generation command using Wings Terminal
 *
 * Surgical CLI command for generating static sites with proper flag validation,
 * configuration precedence, and error handling through Wings Terminal.
 */

import { CommandRoute, info, success } from "@raven-js/wings/terminal";
import { Config } from "../src/static/config/config.js";
import { generateStaticSite } from "../src/static/index.js";
import { createConfigFromSources, parseConfigArg } from "./config-helper.js";

/**
 * Command for static site generation
 * @extends {CommandRoute}
 */
export class StaticCommand extends CommandRoute {
	/**
	 * Create a new StaticCommand instance
	 */
	constructor() {
		super("/static/:config?", "Generate static site from server");

		// Mode-specific flags
		this.flag("server", {
			type: "string",
			description: "Server origin (e.g. http://localhost:3000)",
		});
		this.flag("out", {
			type: "string",
			default: "./dist",
			description: "Output directory",
		});
		this.flag("base", {
			type: "string",
			default: "/",
			description: "Base path for URLs",
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
	 * Execute the static generation command
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
			ConfigClass: Config,
			createFromFlags: this.createConfigFromFlags.bind(this),
			queryParams: ctx.queryParams,
			mode: "static",
		});

		// Apply CLI overrides
		const finalConfig = this.applyCliOverrides(config, ctx.queryParams);

		// Validate-only mode
		if (ctx.queryParams.get("validate") === "true") {
			success("✅ Static configuration validation successful!");
			console.log("");
			console.log("📋 Configuration summary:");
			console.log(
				`   Server: ${typeof finalConfig.getServer() === "function" ? "Custom function" : finalConfig.getServer()}`,
			);

			const routes = finalConfig.getRoutes();
			const routeDisplay = Array.isArray(routes)
				? routes.join(", ")
				: "Dynamic routes function";
			console.log(`   Routes: ${routeDisplay}`);

			const discover = finalConfig.getDiscover();
			if (typeof discover === "boolean") {
				console.log(`   Discovery: ${discover ? "enabled" : "disabled"}`);
			} else {
				console.log(`   Discovery depth: ${discover.getDepth()}`);
			}

			console.log(`   Base path: ${finalConfig.getBasePath() || "/"}`);
			return;
		}

		// Run static generation
		const outputDir = ctx.queryParams.get("out") || "./dist";
		const verbose = ctx.queryParams.get("verbose") === "true";

		if (verbose) {
			info(`🏗️ Generating static site to: ${outputDir}`);
		}

		await generateStaticSite(finalConfig, { outputDir });
		success(`✅ Static site generated successfully in: ${outputDir}`);
	}

	/**
	 * Create config from CLI flags when no config file provided
	 * @param {URLSearchParams} queryParams - CLI flags as query params
	 * @returns {Config|null} Config instance or null if insufficient flags
	 */
	createConfigFromFlags(queryParams) {
		const server = queryParams.get("server");
		if (!server) {
			return null;
		}

		return new Config({
			server,
			routes: ["/"], // Default route
		});
	}

	/**
	 * Apply CLI flag overrides to configuration
	 * @param {Config} config - Base configuration
	 * @param {URLSearchParams} queryParams - CLI flags as query params
	 * @returns {Config} Configuration with overrides applied
	 */
	applyCliOverrides(config, queryParams) {
		const basePath = queryParams.get("base");
		if (!basePath || basePath === "/") {
			return config;
		}

		// Create new config with base path override
		const configData = {
			server: config.getServer(),
			routes: config.getRoutes(),
			discover: config.getDiscover(),
			bundles: config.getBundles(),
			basePath,
			assets: config.getAssets(),
			output: config.getOutput(),
		};

		return new Config(configData);
	}

	/**
	 * Handle command errors gracefully
	 * @param {Error} error - The error that occurred
	 * @param {import("@raven-js/wings").Context} ctx - Request context
	 */
	async onError(error, ctx) {
		console.error(`❌ Static generation failed: ${error.message}`);
		if (ctx.queryParams.get("verbose") === "true") {
			console.error(error.stack);
		}
		ctx.responseStatusCode = 500; // Set error status code for proper exit code
	}
}
