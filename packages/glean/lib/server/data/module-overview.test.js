/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for module overview data extraction
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { extractModuleOverviewData } from "./module-overview.js";

describe("extractModuleOverviewData", () => {
	/**
	 * Create mock entity for testing
	 * @param {string} name - Entity name
	 * @param {string} type - Entity type
	 * @param {string} description - Entity description
	 * @param {Object} jsdocTags - JSDoc tags present
	 * @returns {Object} Mock entity
	 */
	function createMockEntity(
		name,
		type = "function",
		description = "",
		jsdocTags = {},
	) {
		return {
			name,
			entityType: type,
			description,
			location: {
				file: `${name}.js`,
				line: 10,
				column: 0,
			},
			hasJSDocTag: (tag) => Boolean(jsdocTags[tag]),
		};
	}

	/**
	 * Create mock module for testing
	 * @param {Object} options - Module options
	 * @returns {Object} Mock module
	 */
	function createMockModule({
		importPath = "test-package/utils",
		isDefault = false,
		entities = [],
		readme = "",
	} = {}) {
		const publicEntities = entities.filter(
			(e) => !e.hasJSDocTag?.("private") && !e.name?.startsWith("_"),
		);

		// Group entities by type
		const publicEntityGroups = {};
		publicEntities.forEach((entity) => {
			const type = entity.entityType || "unknown";
			if (!publicEntityGroups[type]) publicEntityGroups[type] = [];
			publicEntityGroups[type].push(entity);
		});

		return {
			importPath,
			isDefault,
			readme,
			entities,
			publicEntities,
			publicEntityGroups,
			entityCount: entities.length,
			publicEntityCount: publicEntities.length,
			availableEntityTypes: [
				...new Set(publicEntities.map((e) => e.entityType || "unknown")),
			],
		};
	}

	/**
	 * Create mock package for testing
	 * @param {Object} options - Package options
	 * @returns {Object} Mock package
	 */
	function createMockPackage({
		name = "test-package",
		description = "Test package description",
		modules = [],
	} = {}) {
		return {
			name,
			description,
			modules,
			findModuleByImportPath: (importPath) =>
				modules.find((m) => m.importPath === importPath) || null,
		};
	}

	test("extracts module metadata correctly", () => {
		const entities = [
			createMockEntity("func1", "function", "First function"),
			createMockEntity("func2", "function", "Second function"),
		];

		const modules = [
			createMockModule({
				importPath: "test-package/utils",
				isDefault: false,
				entities,
				readme: "# Utils Module\n\nUtility functions for the package.",
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleOverviewData(mockPackage, "utils");

		// Module metadata
		assert.strictEqual(result.module.importPath, "test-package/utils");
		assert.strictEqual(result.module.isDefault, false);
		assert.strictEqual(result.module.name, "utils");
		assert.strictEqual(result.module.fullName, "test-package/utils");
		assert.strictEqual(result.module.hasReadme, true);
		assert.strictEqual(
			result.module.readme,
			"# Utils Module\n\nUtility functions for the package.",
		);
		assert.strictEqual(result.module.entityCount, 2);
		assert.deepStrictEqual(result.module.availableTypes, ["function"]);
	});

	test("organizes entities by type with detailed metadata", () => {
		const entities = [
			createMockEntity("basicFunc", "function", "Basic function"),
			createMockEntity("advancedFunc", "function", "Advanced function", {
				param: true,
				returns: true,
				example: true,
			}),
			createMockEntity("deprecatedFunc", "function", "Deprecated function", {
				deprecated: true,
			}),
			createMockEntity("MyClass", "class", "Example class", {
				param: true,
			}),
		];

		const modules = [
			createMockModule({
				importPath: "test-package/core",
				entities,
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleOverviewData(mockPackage, "core");

		// Entity organization
		assert(result.organizedEntities.function, "Contains function entities");
		assert(result.organizedEntities.class, "Contains class entities");
		assert.strictEqual(result.organizedEntities.function.length, 3);
		assert.strictEqual(result.organizedEntities.class.length, 1);

		// Function entity metadata
		const basicFunc = result.organizedEntities.function.find(
			(e) => e.name === "basicFunc",
		);
		assert.strictEqual(basicFunc.name, "basicFunc");
		assert.strictEqual(basicFunc.description, "Basic function");
		assert.strictEqual(basicFunc.hasParams, false);
		assert.strictEqual(basicFunc.hasReturns, false);
		assert.strictEqual(basicFunc.hasExamples, false);
		assert.strictEqual(basicFunc.isDeprecated, false);
		assert.strictEqual(basicFunc.link, "/modules/core/basicFunc/");

		// Advanced function with JSDoc tags
		const advancedFunc = result.organizedEntities.function.find(
			(e) => e.name === "advancedFunc",
		);
		assert.strictEqual(advancedFunc.hasParams, true);
		assert.strictEqual(advancedFunc.hasReturns, true);
		assert.strictEqual(advancedFunc.hasExamples, true);
		assert.strictEqual(advancedFunc.isDeprecated, false);

		// Deprecated function
		const deprecatedFunc = result.organizedEntities.function.find(
			(e) => e.name === "deprecatedFunc",
		);
		assert.strictEqual(deprecatedFunc.isDeprecated, true);

		// Class entity
		const myClass = result.organizedEntities.class[0];
		assert.strictEqual(myClass.name, "MyClass");
		assert.strictEqual(myClass.hasParams, true);
		assert.strictEqual(myClass.link, "/modules/core/MyClass/");
	});

	test("builds navigation context with sibling modules", () => {
		const modules = [
			createMockModule({
				importPath: "test-package",
				isDefault: true,
				entities: [createMockEntity("mainFunc", "function")],
			}),
			createMockModule({
				importPath: "test-package/utils",
				isDefault: false,
				entities: [createMockEntity("utilFunc", "function")],
			}),
			createMockModule({
				importPath: "test-package/helpers",
				isDefault: false,
				entities: [],
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleOverviewData(mockPackage, "utils");

		// Navigation context
		assert.strictEqual(result.navigation.packageName, "test-package");
		assert.strictEqual(result.navigation.currentModule, "utils");
		assert.strictEqual(result.navigation.allModules.length, 3);

		// Check module navigation entries
		const defaultModule = result.navigation.allModules.find((m) => m.isDefault);
		assert.strictEqual(defaultModule.name, "test-package");
		assert.strictEqual(defaultModule.isCurrent, false);
		assert.strictEqual(defaultModule.link, "/modules/test-package/");
		assert.strictEqual(defaultModule.entityCount, 1);

		const currentModule = result.navigation.allModules.find((m) => m.isCurrent);
		assert.strictEqual(currentModule.name, "utils");
		assert.strictEqual(currentModule.isCurrent, true);
		assert.strictEqual(currentModule.link, "/modules/utils/");

		const helpersModule = result.navigation.allModules.find(
			(m) => m.name === "helpers",
		);
		assert.strictEqual(helpersModule.entityCount, 0);
	});

	test("calculates comprehensive statistics", () => {
		const entities = [
			createMockEntity("func1", "function", "", { example: true }),
			createMockEntity("func2", "function", "", { deprecated: true }),
			createMockEntity("Class1", "class", "", {
				example: true,
				deprecated: true,
			}),
			createMockEntity("type1", "typedef", ""),
		];

		const modules = [
			createMockModule({
				importPath: "test-package/stats",
				entities,
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleOverviewData(mockPackage, "stats");

		// Statistics
		assert.strictEqual(result.stats.totalEntities, 4);
		assert.strictEqual(result.stats.entitiesByType.function, 2);
		assert.strictEqual(result.stats.entitiesByType.class, 1);
		assert.strictEqual(result.stats.entitiesByType.typedef, 1);
		assert.strictEqual(result.stats.deprecatedCount, 2);
		assert.strictEqual(result.stats.withExamplesCount, 2);

		// Meta flags
		assert.strictEqual(result.hasEntities, true);
		assert.strictEqual(result.hasMultipleTypes, true);
		assert.strictEqual(result.hasDeprecatedEntities, true);
		assert.strictEqual(result.hasExampleEntities, true);
	});

	test("handles module without entities", () => {
		const modules = [
			createMockModule({
				importPath: "test-package/empty",
				entities: [],
				readme: "# Empty Module\n\nThis module has no entities.",
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleOverviewData(mockPackage, "empty");

		assert.strictEqual(result.module.entityCount, 0);
		assert.deepStrictEqual(result.organizedEntities, {});
		assert.strictEqual(result.stats.totalEntities, 0);
		assert.strictEqual(result.stats.deprecatedCount, 0);
		assert.strictEqual(result.stats.withExamplesCount, 0);
		assert.strictEqual(result.hasEntities, false);
		assert.strictEqual(result.hasMultipleTypes, false);
		assert.strictEqual(result.hasDeprecatedEntities, false);
		assert.strictEqual(result.hasExampleEntities, false);
	});

	test("handles module without README", () => {
		const modules = [
			createMockModule({
				importPath: "test-package/no-readme",
				entities: [createMockEntity("func1", "function")],
				readme: "",
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleOverviewData(mockPackage, "no-readme");

		assert.strictEqual(result.module.hasReadme, false);
		assert.strictEqual(result.module.readme, "");
	});

	test("handles default module correctly", () => {
		const modules = [
			createMockModule({
				importPath: "test-package",
				isDefault: true,
				entities: [createMockEntity("mainFunc", "function")],
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleOverviewData(mockPackage, "test-package");

		assert.strictEqual(result.module.isDefault, true);
		assert.strictEqual(result.module.name, "test-package");
		assert.strictEqual(result.module.fullName, "test-package");

		// Navigation should mark this module as current
		const currentModule = result.navigation.allModules.find((m) => m.isCurrent);
		assert.strictEqual(currentModule.isDefault, true);
	});

	test("throws error for module not found", () => {
		const modules = [
			createMockModule({
				importPath: "test-package/existing",
			}),
		];

		const mockPackage = createMockPackage({ modules });

		assert.throws(() => {
			extractModuleOverviewData(mockPackage, "nonexistent");
		}, /Module 'nonexistent' not found/);
	});

	test("throws error for invalid package input", () => {
		assert.throws(() => {
			extractModuleOverviewData(null, "utils");
		}, /Package instance is required/);

		assert.throws(() => {
			extractModuleOverviewData(undefined, "utils");
		}, /Package instance is required/);

		assert.throws(() => {
			extractModuleOverviewData("invalid", "utils");
		}, /Package instance is required/);
	});

	test("throws error for invalid module name", () => {
		const mockPackage = createMockPackage();

		assert.throws(() => {
			extractModuleOverviewData(mockPackage, "");
		}, /Module name is required/);

		assert.throws(() => {
			extractModuleOverviewData(mockPackage, null);
		}, /Module name is required/);

		assert.throws(() => {
			extractModuleOverviewData(mockPackage, undefined);
		}, /Module name is required/);
	});

	test("handles entities without location information", () => {
		const entityWithoutLocation = createMockEntity("noLocation", "function");
		delete entityWithoutLocation.location;

		const modules = [
			createMockModule({
				importPath: "test-package/no-location",
				entities: [entityWithoutLocation],
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleOverviewData(mockPackage, "no-location");

		const entity = result.organizedEntities.function[0];
		assert.strictEqual(entity.location, null);
		assert.strictEqual(entity.name, "noLocation");
	});

	test("handles entities without descriptions", () => {
		const entities = [
			createMockEntity("noDesc", "function", ""),
			createMockEntity("withDesc", "function", "Has description"),
		];

		const modules = [
			createMockModule({
				importPath: "test-package/mixed-desc",
				entities,
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleOverviewData(mockPackage, "mixed-desc");

		const noDescEntity = result.organizedEntities.function.find(
			(e) => e.name === "noDesc",
		);
		const withDescEntity = result.organizedEntities.function.find(
			(e) => e.name === "withDesc",
		);

		assert.strictEqual(noDescEntity.description, "");
		assert.strictEqual(withDescEntity.description, "Has description");
	});

	test("handles mixed public and private entities", () => {
		const entities = [
			createMockEntity("publicFunc", "function", "Public function"),
			createMockEntity("_privateFunc", "function", "Private function"), // Underscore prefix
			{
				...createMockEntity("internalFunc", "function", "Internal function"),
				hasJSDocTag: (tag) => tag === "private", // JSDoc private
			},
		];

		const modules = [
			createMockModule({
				importPath: "test-package/mixed",
				entities,
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleOverviewData(mockPackage, "mixed");

		// Should only include public entities
		assert.strictEqual(result.organizedEntities.function.length, 1);
		assert.strictEqual(result.organizedEntities.function[0].name, "publicFunc");
		assert.strictEqual(result.module.entityCount, 1); // Only public entities counted
	});

	test("includes package context information", () => {
		const modules = [
			createMockModule({
				importPath: "awesome-package/core",
				entities: [createMockEntity("func1", "function")],
			}),
		];

		const mockPackage = createMockPackage({
			name: "awesome-package",
			description: "An awesome package for testing",
			modules,
		});

		const result = extractModuleOverviewData(mockPackage, "core");

		assert.strictEqual(result.packageName, "awesome-package");
		assert.strictEqual(
			result.packageDescription,
			"An awesome package for testing",
		);
	});

	test("handles missing optional package properties gracefully", () => {
		const modules = [
			createMockModule({
				importPath: "graceful",
				entities: [createMockEntity("func1", "function")],
			}),
		];

		const mockPackage = {
			name: undefined,
			description: null,
			modules,
			findModuleByImportPath: (importPath) =>
				modules.find((m) => m.importPath === importPath) || null,
		};

		const result = extractModuleOverviewData(mockPackage, "graceful");

		assert.strictEqual(result.packageName, "");
		assert.strictEqual(result.packageDescription, "");
	});

	test("handles single entity type correctly", () => {
		const entities = [
			createMockEntity("func1", "function"),
			createMockEntity("func2", "function"),
		];

		const modules = [
			createMockModule({
				importPath: "test-package/single-type",
				entities,
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleOverviewData(mockPackage, "single-type");

		assert.strictEqual(result.hasMultipleTypes, false);
		assert.deepStrictEqual(result.module.availableTypes, ["function"]);
		assert.strictEqual(result.stats.entitiesByType.function, 2);
	});

	test("builds correct entity links for complex module names", () => {
		const entities = [createMockEntity("deepFunc", "function")];

		const modules = [
			createMockModule({
				importPath: "test-package/deeply/nested/deep-module",
				entities,
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleOverviewData(mockPackage, "deep-module");

		const entity = result.organizedEntities.function[0];
		assert.strictEqual(entity.link, "/modules/deep-module/deepFunc/");
	});
});
