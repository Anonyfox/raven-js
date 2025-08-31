/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Module directory data extraction for /modules/ route
 *
 * Surgical data transformation from Package instance to structured data
 * optimized for module directory rendering. Follows WEBAPP.md specification
 * for step-by-step module overview extraction.
 */

/**
 * Extract module directory data for overview page with statistics and navigation.
 *
 * Transforms package modules into directory format with entity counts, descriptions,
 * and navigation links for the modules overview page.
 *
 * @param {import('../../extract/models/package.js').Package} packageInstance - Package data
 * @returns {Object} Structured data for module directory template
 *
 * @example
 * // Basic module directory extraction
 * const directory = extractModuleDirectoryData(packageInstance);
 * console.log(directory.moduleList.length, directory.directoryStats.totalPublicEntities);
 *
 * @example
 * // Check directory contents
 * const directory = extractModuleDirectoryData(packageInstance);
 * directory.moduleList.forEach(module => console.log(module.importPath, module.entityCount));
 */
export function extractModuleDirectoryData(packageInstance) {
	if (!packageInstance || typeof packageInstance !== "object") {
		throw new Error("Package instance is required");
	}

	// STEP 1: Module list with metadata
	const moduleList = packageInstance.modules.map((module) => {
		return {
			// Basic module info
			importPath: module.importPath,
			isDefault: module.isDefault,

			// Content preview
			hasReadme: Boolean(module.readme),
			readmePreview: module.readme ? module.readme.slice(0, 200) : "",
			hasDescription: Boolean(module.description),
			description: module.description || "",

			// Entity statistics
			entityCount: module.entityCount,
			publicEntityCount: module.publicEntityCount,
			entityTypes: module.availableEntityTypes,

			// Sample entities for preview cards
			sampleEntities: module.publicEntities.slice(0, 3).map((entity) => ({
				name: entity.name,
				type: entity.entityType,
				description: entity.description ? entity.description.slice(0, 100) : "",
			})),
		};
	});

	// STEP 2: Directory statistics
	const directoryStats = {
		totalModules: packageInstance.moduleCount,
		totalPublicEntities: packageInstance.modules.reduce(
			(sum, m) => sum + m.publicEntityCount,
			0,
		),
		entityTypeDistribution: getEntityTypeDistribution(packageInstance),
	};

	return {
		// Module listings
		moduleList,

		// Statistics
		directoryStats,

		// Package context
		packageName: packageInstance.name || "",
		packageDescription: packageInstance.description || "",

		// Meta information for template
		hasModules: moduleList.length > 0,
		hasPublicEntities: directoryStats.totalPublicEntities > 0,

		// Footer data
		packageMetadata: extractPackageMetadata(packageInstance),
		generationTimestamp: new Date().toISOString(),
	};
}

/**
 * Calculate entity type distribution across all modules
 * @param {import('../../extract/models/package.js').Package} packageInstance - Package data
 * @returns {Object<string, number>} Entity type counts
 */
function getEntityTypeDistribution(packageInstance) {
	/** @type {Object<string, number>} */
	const types = {};
	packageInstance.allEntities.forEach((entity) => {
		const type = entity.entityType || "unknown";
		types[type] = (types[type] || 0) + 1;
	});
	return types;
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
