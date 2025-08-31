/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Module directory route handler for /modules/ endpoint
 *
 * Surgical route implementation connecting data extraction to template rendering.
 * Follows WEBAPP.md specification for module directory presentation with proper
 * HTTP response headers and error handling.
 */

import { extractModuleDirectoryData } from "../data/module-directory.js";
import { moduleDirectoryTemplate } from "../templates/module-directory.js";

/**
 * Create module directory route handler for /modules/ route with package overview.
 *
 * @param {import('../../extract/models/package.js').Package} packageInstance - Package data
 * @returns {Function} Wings route handler function
 *
 * @example
 * // Create module directory route handler
 * const handler = createModuleDirectoryHandler(packageInstance);
 * app.get('/modules/', handler);
 */
export function createModuleDirectoryHandler(packageInstance) {
	/**
	 * Module directory route handler
	 * @param {import('@raven-js/wings').Context} ctx - Wings request context
	 */
	return async function handleModuleDirectory(ctx) {
		try {
			// Extract structured data from Package instance
			const data = extractModuleDirectoryData(packageInstance);

			// Generate complete HTML page
			const html = moduleDirectoryTemplate(/** @type {any} */ (data));

			// Send HTML response with caching
			await ctx.html(html);
			ctx.responseHeaders.set("Cache-Control", "public, max-age=3600");
		} catch (error) {
			// Handle extraction or rendering errors
			await ctx.error(`Failed to generate module directory: ${error.message}`);
		}
	};
}
