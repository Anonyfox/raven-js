/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Package overview data extraction for documentation homepage
 *
 * Surgical data transformation from Package instance to structured data
 * optimized for homepage rendering. Follows WEBAPP.md specification
 * for step-by-step data extraction patterns.
 */

/**
 * Extract package overview data for homepage
 * @param {import('../../extract/models/package.js').Package} packageInstance - Package data
 * @returns {Object} Structured data for package overview template
 */
export function extractPackageOverviewData(packageInstance) {
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
	};
}
