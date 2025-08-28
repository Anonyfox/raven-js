/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Package overview route handler for documentation homepage
 *
 * Wings route handler that processes Package data through the
 * extraction layer and renders the complete HTML page.
 * Follows surgical request-response pattern with zero side effects.
 */

import { extractPackageOverviewData } from "../data/package-overview.js";
import { packageOverviewTemplate } from "../templates/package-overview.js";

/**
 * Create package overview route handler
 * @param {import('../../extract/models/package.js').Package} packageInstance - Package data
 * @returns {Function} Wings route handler function
 */
export function createPackageOverviewHandler(packageInstance) {
	/**
	 * Package overview route handler
	 * @param {import('@raven-js/wings').Context} ctx - Wings request context
	 */
	return function handlePackageOverview(ctx) {
		try {
			// Extract structured data from Package instance
			const data = extractPackageOverviewData(packageInstance);

			// Generate complete HTML page
			const html = packageOverviewTemplate(/** @type {any} */ (data));

			// Send HTML response with caching
			ctx.html(html);
			ctx.responseHeaders.set("Cache-Control", "public, max-age=3600");
		} catch (error) {
			// Handle extraction or rendering errors
			ctx.error(`Failed to generate package overview: ${error.message}`);
		}
	};
}
