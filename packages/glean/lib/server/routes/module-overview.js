/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Module overview route handler for /modules/{moduleName}/ endpoint
 *
 * Handles individual module documentation display with URL parameter validation,
 * data extraction, template rendering, and comprehensive error handling.
 * Follows WEBAPP.md specification for module overview presentation.
 */

import { extractModuleOverviewData } from "../data/module-overview.js";
import { moduleOverviewTemplate } from "../templates/module-overview.js";

/**
 * Create module overview route handler with entity listings and navigation.
 *
 * @param {import('../../extract/models/package.js').Package} packageInstance - Package data
 * @param {import('../../assets/registry.js').AssetRegistry} [assetRegistry] - Asset registry for path rewriting
 * @returns {Function} Wings route handler function
 *
 * @example
 * // Create module overview route handler
 * const handler = createModuleOverviewHandler(packageInstance, assetRegistry);
 * app.get('/modules/:moduleName/', handler);
 */
export function createModuleOverviewHandler(packageInstance, assetRegistry) {
	/**
	 * Handle module overview page requests
	 * @param {import('@raven-js/wings').Context} ctx - Wings request context
	 */
	return async function moduleOverviewHandler(ctx) {
		try {
			// Extract and validate module name parameter
			const moduleName = ctx.pathParams?.moduleName;
			if (!moduleName || typeof moduleName !== "string") {
				return await ctx.error("Missing or invalid module name parameter");
			}

			// Validate module name format (basic security check)
			if (
				moduleName.includes("..") ||
				moduleName.includes("//") ||
				moduleName.startsWith("/")
			) {
				return await ctx.error("Invalid module name format");
			}

			// Extract data for the specific module
			const data = extractModuleOverviewData(packageInstance, moduleName);

			// Generate HTML using template
			const html = moduleOverviewTemplate(
				/** @type {any} */ (data),
				assetRegistry,
			);

			// Send HTML response with caching
			await ctx.html(html);
			ctx.responseHeaders.set("Cache-Control", "public, max-age=3600");
		} catch (error) {
			// Handle module not found specifically
			if (error.message.includes("not found")) {
				return await ctx.notFound(`Module not found: ${error.message}`);
			}

			// Handle other errors as internal server errors
			console.error("Module overview generation error:", error);
			await ctx.error(`Failed to generate module overview: ${error.message}`);
		}
	};
}
