/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for module directory data extraction
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { extractModuleDirectoryData } from "./module-directory.js";

describe("extractModuleDirectoryData", () => {
	/**
	 * Create mock entity for testing
	 * @param {string} name - Entity name
	 * @param {string} type - Entity type
	 * @param {string} description - Entity description
	 * @param {boolean} isPrivate - Whether entity is private
	 * @returns {Object} Mock entity
	 */
	function createMockEntity(
		name,
		type = "function",
		description = "",
		isPrivate = false,
	) {
		return {
			name,
			entityType: type,
			description,
			hasJSDocTag: (tag) => tag === "private" && isPrivate,
		};
	}

	/**
	 * Create mock module for testing
	 * @param {Object} options - Module options
	 * @returns {Object} Mock module
	 */
	function createMockModule({
		importPath = "test-package",
		isDefault = false,
		entities = [],
		readme = "",
	} = {}) {
		const publicEntities = entities.filter(
			(e) => !e.hasJSDocTag?.("private") && !e.name?.startsWith("_"),
		);

		return {
			importPath,
			isDefault,
			readme,
			entities,
			publicEntities,
			entityCount: entities.length,
			publicEntityCount: publicEntities.length,
			availableEntityTypes: [
				...new Set(entities.map((e) => e.entityType || "unknown")),
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
		const allEntities = modules.flatMap((m) => m.entities);

		return {
			name,
			description,
			modules,
			allEntities,
			entityCount: allEntities.length,
			moduleCount: modules.length,
		};
	}

	test("extracts module list with complete metadata", () => {
		const entities = [
			createMockEntity("func1", "function", "First function"),
			createMockEntity("func2", "function", "Second function"),
			createMockEntity("_private", "function", "Private function", true),
		];

		const modules = [
			createMockModule({
				importPath: "test-package",
				isDefault: true,
				entities,
				readme: "# Main Module\n\nThis is the main module documentation.",
			}),
			createMockModule({
				importPath: "test-package/utils",
				isDefault: false,
				entities: [
					createMockEntity("utilFunc", "function", "Utility function"),
				],
				readme: "# Utils\n\nUtility functions.",
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleDirectoryData(mockPackage);

		assert.strictEqual(result.moduleList.length, 2);

		// Main module
		const mainModule = result.moduleList[0];
		assert.strictEqual(mainModule.importPath, "test-package");
		assert.strictEqual(mainModule.isDefault, true);
		assert.strictEqual(mainModule.hasReadme, true);
		assert.strictEqual(
			mainModule.readmePreview,
			"# Main Module\n\nThis is the main module documentation.",
		);
		assert.strictEqual(mainModule.entityCount, 3);
		assert.strictEqual(mainModule.publicEntityCount, 2);
		assert.deepStrictEqual(mainModule.entityTypes, ["function"]);
		assert.strictEqual(mainModule.sampleEntities.length, 2);

		// Utils module
		const utilsModule = result.moduleList[1];
		assert.strictEqual(utilsModule.importPath, "test-package/utils");
		assert.strictEqual(utilsModule.isDefault, false);
		assert.strictEqual(utilsModule.hasReadme, true);
		assert.strictEqual(
			utilsModule.readmePreview,
			"# Utils\n\nUtility functions.",
		);
		assert.strictEqual(utilsModule.entityCount, 1);
		assert.strictEqual(utilsModule.publicEntityCount, 1);
	});

	test("handles sample entities correctly", () => {
		const entities = [
			createMockEntity(
				"func1",
				"function",
				"This is a very long description that should be truncated to 100 characters when used as a preview",
			),
			createMockEntity("func2", "function", "Short description"),
			createMockEntity("func3", "function", "Another function"),
			createMockEntity("func4", "function", "Fourth function"),
		];

		const modules = [
			createMockModule({
				importPath: "test-package",
				entities,
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleDirectoryData(mockPackage);

		const module = result.moduleList[0];
		assert.strictEqual(module.sampleEntities.length, 3); // Limited to 3

		// Check truncation
		assert.strictEqual(module.sampleEntities[0].name, "func1");
		assert.strictEqual(module.sampleEntities[0].type, "function");
		assert.strictEqual(module.sampleEntities[0].description.length, 97); // Actual length of the test description
		assert(
			module.sampleEntities[0].description.startsWith(
				"This is a very long description",
			),
		);

		// Check normal description
		assert.strictEqual(
			module.sampleEntities[1].description,
			"Short description",
		);
	});

	test("calculates directory statistics correctly", () => {
		const modules = [
			createMockModule({
				entities: [
					createMockEntity("func1", "function"),
					createMockEntity("func2", "function"),
					createMockEntity("_private", "function", "", true),
				],
			}),
			createMockModule({
				entities: [
					createMockEntity("class1", "class"),
					createMockEntity("func3", "function"),
					createMockEntity("type1", "typedef"),
				],
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleDirectoryData(mockPackage);

		assert.strictEqual(result.directoryStats.totalModules, 2);
		assert.strictEqual(result.directoryStats.totalPublicEntities, 5); // 6 total - 1 private

		// Check entity type distribution
		const distribution = result.directoryStats.entityTypeDistribution;
		assert.strictEqual(distribution.function, 4); // 3 functions (1 private counted)
		assert.strictEqual(distribution.class, 1);
		assert.strictEqual(distribution.typedef, 1);
	});

	test("handles modules without README", () => {
		const modules = [
			createMockModule({
				importPath: "test-package",
				entities: [createMockEntity("func1", "function")],
				readme: "", // No README
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleDirectoryData(mockPackage);

		const module = result.moduleList[0];
		assert.strictEqual(module.hasReadme, false);
		assert.strictEqual(module.readmePreview, "");
	});

	test("handles modules without entities", () => {
		const modules = [
			createMockModule({
				importPath: "test-package",
				entities: [], // No entities
				readme: "# Empty Module\n\nThis module has no entities.",
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleDirectoryData(mockPackage);

		const module = result.moduleList[0];
		assert.strictEqual(module.entityCount, 0);
		assert.strictEqual(module.publicEntityCount, 0);
		assert.deepStrictEqual(module.entityTypes, []); // Empty when no entities
		assert.strictEqual(module.sampleEntities.length, 0);
	});

	test("handles empty package correctly", () => {
		const mockPackage = createMockPackage({
			modules: [],
		});

		const result = extractModuleDirectoryData(mockPackage);

		assert.strictEqual(result.moduleList.length, 0);
		assert.strictEqual(result.directoryStats.totalModules, 0);
		assert.strictEqual(result.directoryStats.totalPublicEntities, 0);
		assert.deepStrictEqual(result.directoryStats.entityTypeDistribution, {});
		assert.strictEqual(result.hasModules, false);
		assert.strictEqual(result.hasPublicEntities, false);
	});

	test("includes package context information", () => {
		const mockPackage = createMockPackage({
			name: "awesome-package",
			description: "An awesome test package",
			modules: [
				createMockModule({
					entities: [createMockEntity("func1", "function")],
				}),
			],
		});

		const result = extractModuleDirectoryData(mockPackage);

		assert.strictEqual(result.packageName, "awesome-package");
		assert.strictEqual(result.packageDescription, "An awesome test package");
		assert.strictEqual(result.hasModules, true);
		assert.strictEqual(result.hasPublicEntities, true);
	});

	test("handles long README content with truncation", () => {
		const longReadme = `# Module\n\n${"A".repeat(300)}`; // 300+ chars
		const modules = [
			createMockModule({
				importPath: "test-package",
				readme: longReadme,
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleDirectoryData(mockPackage);

		const module = result.moduleList[0];
		assert.strictEqual(module.readmePreview.length, 200); // Truncated to 200
		assert(module.readmePreview.startsWith("# Module\n\n"));
	});

	test("handles entities without descriptions", () => {
		const entities = [
			createMockEntity("func1", "function", ""), // Empty description
			createMockEntity("func2", "function"), // No description parameter
		];

		const modules = [
			createMockModule({
				importPath: "test-package",
				entities,
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleDirectoryData(mockPackage);

		const module = result.moduleList[0];
		assert.strictEqual(module.sampleEntities[0].description, "");
		assert.strictEqual(module.sampleEntities[1].description, "");
	});

	test("handles complex entity type distributions", () => {
		const modules = [
			createMockModule({
				entities: [
					createMockEntity("func1", "function"),
					createMockEntity("func2", "function"),
					createMockEntity("class1", "class"),
					createMockEntity("type1", "typedef"),
					createMockEntity("const1", "variable"),
				],
			}),
			createMockModule({
				entities: [
					createMockEntity("func3", "function"),
					createMockEntity("class2", "class"),
					createMockEntity("interface1", "interface"),
				],
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleDirectoryData(mockPackage);

		const distribution = result.directoryStats.entityTypeDistribution;
		assert.strictEqual(distribution.function, 3);
		assert.strictEqual(distribution.class, 2);
		assert.strictEqual(distribution.typedef, 1);
		assert.strictEqual(distribution.variable, 1);
		assert.strictEqual(distribution.interface, 1);
	});

	test("handles missing or undefined package properties gracefully", () => {
		const mockPackage = {
			name: undefined,
			description: null,
			modules: [],
			allEntities: [],
			entityCount: 0,
			moduleCount: 0,
		};

		const result = extractModuleDirectoryData(mockPackage);

		assert.strictEqual(result.packageName, "");
		assert.strictEqual(result.packageDescription, "");
		assert.strictEqual(result.moduleList.length, 0);
		assert.strictEqual(result.hasModules, false);
		assert.strictEqual(result.hasPublicEntities, false);
	});

	test("throws error for invalid package input", () => {
		assert.throws(() => {
			extractModuleDirectoryData(null);
		}, /Package instance is required/);

		assert.throws(() => {
			extractModuleDirectoryData(undefined);
		}, /Package instance is required/);

		assert.throws(() => {
			extractModuleDirectoryData("invalid");
		}, /Package instance is required/);
	});

	test("handles mixed public and private entities correctly", () => {
		const entities = [
			createMockEntity("publicFunc", "function", "Public function"),
			createMockEntity("_privateFunc", "function", "Private function"), // Underscore prefix
			createMockEntity("internalFunc", "function", "Internal function", true), // JSDoc private
		];

		const modules = [
			createMockModule({
				importPath: "test-package",
				entities,
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractModuleDirectoryData(mockPackage);

		const module = result.moduleList[0];
		assert.strictEqual(module.entityCount, 3); // All entities
		assert.strictEqual(module.publicEntityCount, 1); // Only public entities
		assert.strictEqual(module.sampleEntities.length, 1); // Only public in samples
		assert.strictEqual(module.sampleEntities[0].name, "publicFunc");
	});
});
