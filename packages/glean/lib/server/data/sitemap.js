/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Sitemap data extraction for documentation generator
 *
 * Generates XML sitemap data from Package structure for SEO optimization.
 * Includes all documentation pages with proper priority and change frequency.
 */

/**
 * Extract sitemap data from package instance for SEO optimization with proper priorities.
 *
 * Generates XML sitemap URLs for homepage, module pages, and entity pages with
 * appropriate change frequencies and priority rankings.
 *
 * @param {{name: string, modules: Array<{importPath: string, isDefault: boolean, publicEntities: Array<{name: string}>}>}} packageInstance - Package instance with modules and entities
 * @param {string} baseUrl - Base URL for the documentation site
 * @param {Object} [options] - Additional options
 * @param {Object} [options.urlBuilder] - URL builder for base path handling
 * @returns {{urls: Array<{loc: string, lastmod: string, changefreq: string, priority: string}>, totalUrls: number, generatedAt: string}} Sitemap data with URLs, priorities, and metadata
 *
 * @example
 * // Generate sitemap for documentation site
 * const sitemap = extractSitemapData(packageInstance, 'https://docs.mypackage.com');
 * console.log(sitemap.totalUrls, sitemap.urls[0].priority);
 */
export function extractSitemapData(
	packageInstance,
	baseUrl = "https://docs.example.com",
	options = {},
) {
	const { urlBuilder } = options;
	const urls = [];

	// Package overview page - highest priority
	const homeUrl = urlBuilder ? /** @type {any} */ (urlBuilder).homeUrl() : "/";
	urls.push({
		loc: `${baseUrl}${homeUrl}`,
		lastmod: new Date().toISOString().split("T")[0],
		changefreq: "weekly",
		priority: "1.0",
	});

	// Module directory page
	const modulesUrl = urlBuilder
		? /** @type {any} */ (urlBuilder).modulesUrl()
		: "/modules/";
	urls.push({
		loc: `${baseUrl}${modulesUrl}`,
		lastmod: new Date().toISOString().split("T")[0],
		changefreq: "weekly",
		priority: "0.9",
	});

	// Module overview pages
	for (const module of /** @type {any} */ (packageInstance).modules) {
		// Extract module name from import path, following the same logic as module overview
		// This ensures consistency with how modules are accessed via URLs
		let moduleName = module.importPath.split("/").pop() || "index";

		// Handle main module (package name) - use package name for consistency with integration tests
		if (moduleName === packageInstance.name) {
			moduleName = packageInstance.name;
		}

		// Always use the extracted module name for URLs, following the same logic as module overview
		// Integration tests show that modules are accessible at /modules/utils/, /modules/api/, etc.
		const moduleUrl = urlBuilder
			? /** @type {any} */ (urlBuilder).moduleUrl(moduleName)
			: `/modules/${moduleName}/`;

		urls.push({
			loc: `${baseUrl}${moduleUrl}`,
			lastmod: new Date().toISOString().split("T")[0],
			changefreq: "monthly",
			priority: module.isDefault ? "0.8" : "0.7",
		});

		// Entity pages within modules
		for (const entity of module.publicEntities) {
			const entityUrl = urlBuilder
				? /** @type {any} */ (urlBuilder).entityUrl(moduleName, entity.name)
				: `/modules/${moduleName}/${encodeURIComponent(entity.name)}/`;

			urls.push({
				loc: `${baseUrl}${entityUrl}`,
				lastmod: new Date().toISOString().split("T")[0],
				changefreq: "monthly",
				priority: "0.6",
			});
		}
	}

	return {
		urls,
		totalUrls: urls.length,
		generatedAt: new Date().toISOString(),
	};
}
