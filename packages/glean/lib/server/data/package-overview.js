/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Package overview data extraction for documentation homepage.
 *
 * Transforms Package instance to structured data optimized for homepage rendering
 * with modules, statistics, and README content organization.
 */

/**
 * Extract package overview data for homepage with modules, statistics, and README content.
 *
 * @param {import('../../extract/models/package.js').Package} packageInstance - Package data
 * @param {Object} [_urlBuilder] - URL builder for generating navigation links (unused currently)
 * @returns {Object} Structured data for package overview template
 *
 * @example
 * // Basic package overview extraction
 * const overview = extractPackageOverviewData(packageInstance);
 * console.log(overview.name, overview.stats.entityCount);
 *
 * @example
 * // Check for available content
 * const overview = extractPackageOverviewData(packageInstance);
 * if (overview.hasReadme) console.log('README available');
 * if (overview.hasModules) console.log('Modules available');
 */
export function extractPackageOverviewData(packageInstance, _urlBuilder) {
	if (!packageInstance || typeof packageInstance !== "object") {
		throw new Error("Package instance is required");
	}

	// STEP 1: Basic package information
	const name = packageInstance.name || "";
	const version = packageInstance.version || "";
	const description = packageInstance.description || "";

	// STEP 2: README content for main content area
	const readmeMarkdown = packageInstance.readme || "";

	// STEP 3: Module navigation data
	const modules = packageInstance.modules.map((module) => ({
		name: module.importPath,
		isDefault: module.isDefault,
		publicEntityCount: module.publicEntityCount,
		availableTypes: module.availableEntityTypes,
	}));

	// STEP 4: Package statistics
	const stats = {
		moduleCount: packageInstance.moduleCount,
		entityCount: packageInstance.entityCount,
		publicEntityCount: packageInstance.modules.reduce(
			(sum, m) => sum + m.publicEntityCount,
			0,
		),
	};

	return {
		// Basic package information
		name,
		version,
		description,

		// Content
		readmeMarkdown,

		// Navigation
		modules,

		// Statistics
		stats,

		// Meta information for template
		hasReadme: readmeMarkdown.length > 0,
		hasModules: modules.length > 0,
		hasPublicEntities: stats.publicEntityCount > 0,

		// Footer data
		packageMetadata: extractPackageMetadata(packageInstance),
		generationTimestamp: new Date().toISOString(),
	};
}

/**
 * Extract package metadata for footer attribution
 * @param {import('../../extract/models/package.js').Package} packageInstance - Package instance
 * @returns {Object|null} Package metadata for attribution
 */
function extractPackageMetadata(packageInstance) {
	/** @type {any} */
	const pkg = packageInstance;
	if (pkg.packageJsonData) {
		return {
			author: pkg.packageJsonData.author,
			homepage: pkg.packageJsonData.homepage,
			repository: pkg.packageJsonData.repository,
			bugs: pkg.packageJsonData.bugs,
			funding: pkg.packageJsonData.funding,
		};
	}
	return null;
}
