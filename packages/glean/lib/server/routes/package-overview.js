/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Package overview route handler for documentation homepage.
 *
 * Wings route handler that processes Package data through the extraction layer
 * and renders the complete HTML page with caching headers.
 */

import { extractPackageOverviewData } from "../data/package-overview.js";
import { packageOverviewTemplate } from "../templates/package-overview.js";

/**
 * Create package overview route handler with data extraction and HTML rendering.
 *
 * @param {import('../../extract/models/package.js').Package} packageInstance - Package data
 * @param {import('../../assets/registry.js').AssetRegistry} [assetRegistry] - Asset registry for path rewriting
 * @param {Object} [options] - Handler options
 * @param {Object} [options.urlBuilder] - URL builder for generating navigation links
 * @returns {Function} Wings route handler function
 *
 * @example
 * // Create homepage route handler
 * const handler = createPackageOverviewHandler(packageInstance, assetRegistry);
 * app.get('/', handler);
 */
export function createPackageOverviewHandler(
	packageInstance,
	assetRegistry,
	options = {},
) {
	const { urlBuilder } = options;
	/**
	 * Package overview route handler
	 * @param {import('@raven-js/wings').Context} ctx - Wings request context
	 */
	return async function handlePackageOverview(ctx) {
		try {
			// Extract structured data from Package instance
			const data = extractPackageOverviewData(packageInstance);

			// Generate complete HTML page
			const html = packageOverviewTemplate(
				/** @type {any} */ (data),
				assetRegistry,
				{ urlBuilder },
			);

			// Send HTML response with caching
			await ctx.html(html);
			ctx.responseHeaders.set("Cache-Control", "public, max-age=3600");
		} catch (error) {
			// Handle extraction or rendering errors
			await ctx.error(`Failed to generate package overview: ${error.message}`);
		}
	};
}
