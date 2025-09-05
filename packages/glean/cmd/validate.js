/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file ValidateCommand - JSDoc quality validation command using CommandRoute
 *
 * Surgical CLI command that validates JSDoc quality and reports issues
 * with proper flag validation and error handling.
 */

import { CommandRoute } from "@raven-js/wings/terminal";
import { displayAnalysisReport } from "../lib/analyze.js";
import { validate } from "../lib/validate.js";

/**
 * Command for validating JSDoc quality in JavaScript files
 * @extends {CommandRoute}
 */
export class ValidateCommand extends CommandRoute {
	/**
	 * Create a new ValidateCommand instance
	 */
	constructor() {
		super("/validate/:path?", "Validate JSDoc quality and report issues");

		this.flag("verbose", {
			type: "boolean",
			description: "Show detailed output",
		});
	}

	/**
	 * Execute the validate command
	 * @param {import("@raven-js/wings").Context} ctx - Request context
	 * @returns {Promise<void>}
	 */
	async execute(ctx) {
		const target = ctx.pathParams.path || ".";
		const verbose = ctx.queryParams.get("verbose") === "true";

		console.log(`📊 Analyzing JSDoc quality in: ${target}`);

		try {
			// Call business logic directly with clean parameters
			const report = validate(target);

			if (report.summary.filesAnalyzed === 0) {
				console.log("⚠️  No JavaScript files found in target directory");
				return;
			}

			if (verbose) {
				console.log(
					`📁 Found ${report.summary.filesAnalyzed} JavaScript files`,
				);
			}

			// Display results using dedicated display function
			displayAnalysisReport(report, verbose);
		} catch (error) {
			throw new Error(`Analysis failed: ${error.message}`);
		}
	}
}
