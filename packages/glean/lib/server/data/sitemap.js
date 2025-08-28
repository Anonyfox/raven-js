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
 * Extract sitemap data from package instance
 * @param {{name: string, modules: Array<{importPath: string, isDefault: boolean, publicEntities: Array<{name: string}>}>}} packageInstance - Package instance with modules and entities
 * @param {string} baseUrl - Base URL for the documentation site
 * @returns {{urls: Array<{loc: string, lastmod: string, changefreq: string, priority: string}>, totalUrls: number, generatedAt: string}} Sitemap data with URLs, priorities, and metadata
 */
export function extractSitemapData(
	packageInstance,
	baseUrl = "https://docs.example.com",
) {
	const urls = [];

	// Package overview page - highest priority
	urls.push({
		loc: `${baseUrl}/`,
		lastmod: new Date().toISOString().split("T")[0],
		changefreq: "weekly",
		priority: "1.0",
	});

	// Module directory page
	urls.push({
		loc: `${baseUrl}/modules/`,
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
		const moduleUrl = `${baseUrl}/modules/${moduleName}/`;

		urls.push({
			loc: moduleUrl,
			lastmod: new Date().toISOString().split("T")[0],
			changefreq: "monthly",
			priority: module.isDefault ? "0.8" : "0.7",
		});

		// Entity pages within modules
		for (const entity of module.publicEntities) {
			const entityUrl = `${baseUrl}/modules/${moduleName}/${encodeURIComponent(entity.name)}/`;

			urls.push({
				loc: entityUrl,
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
