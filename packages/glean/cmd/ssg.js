/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file SsgCommand - Static site generation command using CommandRoute
 *
 * Surgical CLI command that generates static documentation sites with proper
 * flag validation and error handling.
 */

import { CommandRoute, ValidationError } from "@raven-js/wings/terminal";
import { generateStaticSite } from "../lib/static-generate.js";

/**
 * Command for generating static documentation sites
 * @extends {CommandRoute}
 */
export class SsgCommand extends CommandRoute {
	/**
	 * Create a new SsgCommand instance
	 */
	constructor() {
		super("/ssg/:source/:output", "Generate static documentation site");

		this.flag("domain", {
			type: "string",
			description: "Domain for SEO tags",
		});
		this.flag("base", {
			type: "string",
			default: "/",
			description: "Base path for subdirectory deployment",
		});
		this.flag("verbose", {
			type: "boolean",
			description: "Show detailed output",
		});
	}

	/**
	 * Validate required path parameters before execution
	 * @param {import("@raven-js/wings").Context} ctx - Request context
	 * @returns {Promise<void>}
	 */
	async beforeExecute(ctx) {
		if (!ctx.pathParams.source) {
			throw new ValidationError("Missing required parameter: source directory");
		}
		if (!ctx.pathParams.output) {
			throw new ValidationError("Missing required parameter: output directory");
		}
	}

	/**
	 * Execute the static site generation command
	 * @param {import("@raven-js/wings").Context} ctx - Request context
	 * @returns {Promise<void>}
	 */
	async execute(ctx) {
		const sourceDir = ctx.pathParams.source;
		const outputDir = ctx.pathParams.output;
		const domain = ctx.queryParams.get("domain");
		const basePath = ctx.queryParams.get("base") || "/";
		const verbose = ctx.queryParams.get("verbose") === "true";

		console.log(`🚀 Generating static documentation site...`);
		console.log(`📦 Source package: ${sourceDir}`);
		console.log(`📁 Output directory: ${outputDir}`);
		if (domain) {
			console.log(`🌐 Using domain for SEO: ${domain}`);
		}
		if (basePath !== "/") {
			console.log(`📍 Using base path: ${basePath}`);
		}

		try {
			// Generate static site using existing business logic
			const stats = await generateStaticSite(sourceDir, outputDir, {
				domain,
				basePath,
			});

			console.log(`\n📊 Generation Results:`);
			console.log(`   Files generated: ${stats.totalFiles}`);
			console.log(`   Total size: ${Math.round(stats.totalBytes / 1024)}KB`);
			console.log(`   Generated at: ${stats.generatedAt}`);
			console.log(`   Output: ${outputDir}`);

			console.log(`\n🎉 Static site generation complete!`);
			if (verbose) {
				console.log(
					`💡 Deploy the '${outputDir}' folder to any static hosting service`,
				);
			}
		} catch (error) {
			throw new Error(`Static site generation failed: ${error.message}`);
		}
	}
}
