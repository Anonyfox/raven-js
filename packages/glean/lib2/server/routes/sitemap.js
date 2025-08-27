/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Sitemap route handler for documentation generator
 *
 * Serves XML sitemap at /sitemap.xml with proper headers for SEO.
 * Generates fresh sitemap from package structure on each request.
 */

import { extractSitemapData } from "../data/sitemap.js";
import { sitemapTemplate } from "../templates/sitemap.js";

/**
 * Create sitemap route handler
 * @param {{name: string, modules: Array<{importPath: string, isDefault: boolean, publicEntities: Array<{name: string}>}>}} packageInstance - Package instance with modules and entities
 * @param {Object} options - Configuration options
 * @param {string} [options.baseUrl] - Base URL for the documentation site
 * @returns {Function} Wings route handler for sitemap.xml
 */
export function createSitemapHandler(packageInstance, options = {}) {
	const { baseUrl = "https://docs.example.com" } = options;

	/**
	 * Handle sitemap.xml requests
	 * @param {import('@raven-js/wings').Context} ctx - Wings request context
	 */
	return function sitemapHandler(ctx) {
		try {
			// Extract sitemap data from package
			const data = extractSitemapData(packageInstance, baseUrl);

			// Generate XML sitemap
			const xmlContent = sitemapTemplate(data);

			// Send XML response with proper headers
			ctx.responseStatusCode = 200;
			ctx.responseHeaders.set("Content-Type", "application/xml; charset=utf-8");
			ctx.responseHeaders.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
			ctx.responseHeaders.set("X-Robots-Tag", "noindex"); // Don't index the sitemap itself
			ctx.responseBody = xmlContent;
		} catch (error) {
			console.error("Sitemap generation error:", error);
			ctx.error(`Failed to generate sitemap: ${error.message}`);
		}
	};
}
