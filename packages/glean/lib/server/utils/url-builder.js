/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file URL building utilities for documentation site generation.
 *
 * Provides centralized URL building with base path support for consistent
 * URL generation across all documentation templates and components.
 */

/**
 * Create URL builder with base path support
 * @param {string} basePath - Base path for URL prefixing (default: "/")
 * @returns {Object} URL builder functions
 */
export function createUrlBuilder(basePath = "/") {
	// Normalize base path - ensure it starts with / and doesn't end with / (unless root)
	const normalizedBasePath =
		basePath === "/" ? "/" : `/${basePath.replace(/^\/+|\/+$/g, "")}`;

	/**
	 * Build URL with base path prefix
	 * @param {string} path - Path to prefix
	 * @returns {string} Complete URL with base path
	 */
	function buildUrl(path) {
		// Remove leading slash from path to avoid double slashes
		const cleanPath = path.replace(/^\/+/, "");

		if (normalizedBasePath === "/") {
			return `/${cleanPath}`;
		}

		// Combine base path with clean path
		return `${normalizedBasePath}/${cleanPath}`;
	}

	/**
	 * Build module overview URL
	 * @param {string} moduleName - Module name
	 * @returns {string} Module overview URL
	 */
	function moduleUrl(moduleName) {
		return buildUrl(`modules/${moduleName}/`);
	}

	/**
	 * Build entity page URL
	 * @param {string} moduleName - Module name
	 * @param {string} entityName - Entity name
	 * @returns {string} Entity page URL
	 */
	function entityUrl(moduleName, entityName) {
		return buildUrl(`modules/${moduleName}/${entityName}/`);
	}

	/**
	 * Build asset URL
	 * @param {string} filename - Asset filename
	 * @returns {string} Asset URL
	 */
	function assetUrl(filename) {
		return buildUrl(`assets/${filename}`);
	}

	/**
	 * Build sitemap URL
	 * @returns {string} Sitemap URL
	 */
	function sitemapUrl() {
		return buildUrl("sitemap.xml");
	}

	/**
	 * Build modules directory URL
	 * @returns {string} Modules directory URL
	 */
	function modulesUrl() {
		return buildUrl("modules/");
	}

	/**
	 * Build home URL
	 * @returns {string} Home URL
	 */
	function homeUrl() {
		return buildUrl("");
	}

	/**
	 * Build static file URL (for bootstrap, favicon, etc.)
	 * @param {string} filename - Static file name
	 * @returns {string} Static file URL
	 */
	function staticUrl(filename) {
		return buildUrl(filename);
	}

	return {
		buildUrl,
		moduleUrl,
		entityUrl,
		assetUrl,
		staticUrl,
		sitemapUrl,
		modulesUrl,
		homeUrl,
	};
}
