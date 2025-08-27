/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Module overview data extraction for /modules/{moduleName}/ route
 *
 * Surgical data transformation from Package instance to structured data
 * optimized for individual module presentation. Follows WEBAPP.md specification
 * for step-by-step module overview extraction with entity organization.
 */

/**
 * Extract module overview data for specific module page
 * @param {import('../../extract/models/package.js').Package} packageInstance - Package data
 * @param {string} moduleName - Module name from URL parameter
 * @returns {Object} Structured data for module overview template
 * @throws {Error} When module not found or invalid parameters
 */
export function extractModuleOverviewData(packageInstance, moduleName) {
	if (!packageInstance || typeof packageInstance !== "object") {
		throw new Error("Package instance is required");
	}

	if (!moduleName || typeof moduleName !== "string") {
		throw new Error("Module name is required");
	}

	// STEP 1: Find the target module
	const packageName = packageInstance.name || "";
	let module = null;

	// Try exact import path match first (for default modules like "package-name")
	if (packageInstance.findModuleByImportPath) {
		module = packageInstance.findModuleByImportPath(moduleName);
	} else {
		module = packageInstance.modules.find((m) => m.importPath === moduleName);
	}

	// If not found, try constructing full import path
	if (!module && packageName) {
		const fullImportPath = `${packageName}/${moduleName}`;
		if (packageInstance.findModuleByImportPath) {
			module = packageInstance.findModuleByImportPath(fullImportPath);
		} else {
			module = packageInstance.modules.find(
				(m) => m.importPath === fullImportPath,
			);
		}
	}

	// If still not found, try finding by module name (last part of import path)
	if (!module) {
		module = packageInstance.modules.find(
			(m) => m.importPath.split("/").pop() === moduleName,
		);
	}

	if (!module) {
		throw new Error(
			`Module '${moduleName}' not found in package '${packageName}'`,
		);
	}

	// STEP 2: Module metadata
	const moduleData = {
		importPath: module.importPath,
		isDefault: module.isDefault,
		name: moduleName,
		fullName: module.importPath,

		// Documentation content
		readme: module.readme || "",
		hasReadme: Boolean(module.readme),

		// Entity organization
		publicEntityGroups: module.publicEntityGroups || {},
		entityCount: module.publicEntityCount || 0,
		availableTypes: module.availableEntityTypes || [],
	};

	// STEP 3: Entity listings organized by type
	/** @type {Object<string, Array<Object>>} */
	const organizedEntities = {};
	Object.entries(moduleData.publicEntityGroups).forEach(([type, entities]) => {
		organizedEntities[type] = entities.map((entity) => ({
			name: entity.name,
			description: entity.description || "",
			location: entity.location || null,

			// Quick metadata for listing
			hasParams: entity.hasJSDocTag?.("param") || false,
			hasReturns: entity.hasJSDocTag?.("returns") || false,
			hasExamples: entity.hasJSDocTag?.("example") || false,
			isDeprecated: entity.hasJSDocTag?.("deprecated") || false,

			// Direct link generation
			link: `/modules/${moduleName}/${entity.name}/`,
		}));
	});

	// STEP 4: Navigation context
	const navigationContext = {
		packageName: packageName,
		currentModule: moduleName,
		allModules: packageInstance.modules.map((m) => ({
			name: m.importPath.split("/").pop() || "index",
			fullImportPath: m.importPath,
			isCurrent: m.importPath === module.importPath,
			isDefault: m.isDefault,
			link: `/modules/${m.importPath.split("/").pop()}/`,
			entityCount: m.publicEntityCount || 0,
		})),
	};

	// Calculate statistics
	const entityStats = {
		totalEntities: moduleData.entityCount,
		entitiesByType: Object.entries(organizedEntities).reduce(
			(acc, [type, entities]) => {
				acc[type] = entities.length;
				return acc;
			},
			/** @type {Object<string, number>} */ ({}),
		),
		deprecatedCount: Object.values(organizedEntities)
			.flat()
			.filter(/** @param {any} e */ (e) => e.isDeprecated).length,
		withExamplesCount: Object.values(organizedEntities)
			.flat()
			.filter(/** @param {any} e */ (e) => e.hasExamples).length,
	};

	return {
		// Module information
		module: moduleData,

		// Organized entities by type
		organizedEntities,

		// Navigation context
		navigation: navigationContext,

		// Statistics
		stats: entityStats,

		// Package context
		packageName: packageName,
		packageDescription: packageInstance.description || "",

		// Meta information for template
		hasEntities: moduleData.entityCount > 0,
		hasMultipleTypes: moduleData.availableTypes.length > 1,
		hasDeprecatedEntities: entityStats.deprecatedCount > 0,
		hasExampleEntities: entityStats.withExamplesCount > 0,
	};
}
