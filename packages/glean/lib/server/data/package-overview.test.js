/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for package overview data extraction
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { extractPackageOverviewData } from "./package-overview.js";

describe("extractPackageOverviewData", () => {
	/**
	 * Create mock entity for testing
	 * @param {string} name - Entity name
	 * @param {string} type - Entity type
	 * @param {boolean} isPrivate - Whether entity is private
	 * @returns {Object} Mock entity
	 */
	function createMockEntity(name, type = "function", isPrivate = false) {
		return {
			name,
			entityType: type,
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

		const entityGroups = {};
		const publicEntityGroups = {};

		// Group all entities
		entities.forEach((entity) => {
			const type = entity.entityType || "unknown";
			if (!entityGroups[type]) entityGroups[type] = [];
			entityGroups[type].push(entity);
		});

		// Group public entities
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
			entityGroups,
			publicEntityGroups,
			entityCount: entities.length,
			publicEntityCount: publicEntities.length,
			availableEntityTypes: [
				...new Set(entities.map((e) => e.entityType || "unknown")),
			],
			findEntityByName: (name) => entities.find((e) => e.name === name) || null,
		};
	}

	/**
	 * Create mock package for testing
	 * @param {Object} options - Package options
	 * @returns {Object} Mock package
	 */
	function createMockPackage({
		name = "test-package",
		version = "1.0.0",
		description = "Test package description",
		readme = "# Test Package\n\nTest README content",
		modules = [],
	} = {}) {
		const allEntities = modules.flatMap((m) => m.entities);

		return {
			name,
			version,
			description,
			readme,
			modules,
			allEntities,
			entityCount: allEntities.length,
			moduleCount: modules.length,
			defaultModule: modules.find((m) => m.isDefault) || null,
			findModuleByImportPath: (path) =>
				modules.find((m) => m.importPath === path) || null,
		};
	}

	test("extracts basic package information correctly", () => {
		const mockPackage = createMockPackage({
			name: "awesome-package",
			version: "2.1.0",
			description: "An awesome test package",
		});

		const result = extractPackageOverviewData(mockPackage);

		assert.strictEqual(result.name, "awesome-package");
		assert.strictEqual(result.version, "2.1.0");
		assert.strictEqual(result.description, "An awesome test package");
	});

	test("extracts README content", () => {
		const readmeContent =
			"# My Package\n\nThis is a great package for testing.";
		const mockPackage = createMockPackage({
			readme: readmeContent,
		});

		const result = extractPackageOverviewData(mockPackage);

		assert.strictEqual(result.readmeMarkdown, readmeContent);
		assert.strictEqual(result.hasReadme, true);
	});

	test("handles missing README content", () => {
		const mockPackage = createMockPackage({
			readme: "",
		});

		const result = extractPackageOverviewData(mockPackage);

		assert.strictEqual(result.readmeMarkdown, "");
		assert.strictEqual(result.hasReadme, false);
	});

	test("extracts module navigation data", () => {
		const entities = [
			createMockEntity("func1", "function"),
			createMockEntity("func2", "function"),
			createMockEntity("_private", "function", true),
		];

		const modules = [
			createMockModule({
				importPath: "test-package",
				isDefault: true,
				entities: entities,
			}),
			createMockModule({
				importPath: "test-package/utils",
				isDefault: false,
				entities: [createMockEntity("utilFunc", "function")],
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractPackageOverviewData(mockPackage);

		assert.strictEqual(result.modules.length, 2);

		// Default module
		assert.strictEqual(result.modules[0].name, "test-package");
		assert.strictEqual(result.modules[0].isDefault, true);
		assert.strictEqual(result.modules[0].publicEntityCount, 2); // 2 public entities
		assert.deepStrictEqual(result.modules[0].availableTypes, ["function"]);

		// Utils module
		assert.strictEqual(result.modules[1].name, "test-package/utils");
		assert.strictEqual(result.modules[1].isDefault, false);
		assert.strictEqual(result.modules[1].publicEntityCount, 1);
		assert.deepStrictEqual(result.modules[1].availableTypes, ["function"]);
	});

	test("calculates package statistics correctly", () => {
		const modules = [
			createMockModule({
				entities: [
					createMockEntity("func1", "function"),
					createMockEntity("func2", "function"),
					createMockEntity("_private", "function", true),
				],
			}),
			createMockModule({
				entities: [
					createMockEntity("class1", "class"),
					createMockEntity("func3", "function"),
				],
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractPackageOverviewData(mockPackage);

		assert.strictEqual(result.stats.moduleCount, 2);
		assert.strictEqual(result.stats.entityCount, 5); // Total entities
		assert.strictEqual(result.stats.publicEntityCount, 4); // Excluding _private
	});

	test("handles empty package correctly", () => {
		const mockPackage = createMockPackage({
			modules: [],
		});

		const result = extractPackageOverviewData(mockPackage);

		assert.strictEqual(result.modules.length, 0);
		assert.strictEqual(result.stats.moduleCount, 0);
		assert.strictEqual(result.stats.entityCount, 0);
		assert.strictEqual(result.stats.publicEntityCount, 0);
		assert.strictEqual(result.hasModules, false);
		assert.strictEqual(result.hasPublicEntities, false);
	});

	test("handles package with modules but no entities", () => {
		const modules = [
			createMockModule({
				importPath: "test-package",
				entities: [],
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractPackageOverviewData(mockPackage);

		assert.strictEqual(result.modules.length, 1);
		assert.strictEqual(result.stats.moduleCount, 1);
		assert.strictEqual(result.stats.entityCount, 0);
		assert.strictEqual(result.stats.publicEntityCount, 0);
		assert.strictEqual(result.hasModules, true);
		assert.strictEqual(result.hasPublicEntities, false);
	});

	test("includes meta information flags", () => {
		const modules = [
			createMockModule({
				entities: [createMockEntity("func1", "function")],
			}),
		];

		const mockPackage = createMockPackage({
			readme: "# Test",
			modules,
		});

		const result = extractPackageOverviewData(mockPackage);

		assert.strictEqual(result.hasReadme, true);
		assert.strictEqual(result.hasModules, true);
		assert.strictEqual(result.hasPublicEntities, true);
	});

	test("handles missing or undefined package properties gracefully", () => {
		const mockPackage = {
			name: undefined,
			version: null,
			description: "",
			readme: undefined,
			modules: [],
			allEntities: [],
			entityCount: 0,
			moduleCount: 0,
		};

		const result = extractPackageOverviewData(mockPackage);

		assert.strictEqual(result.name, "");
		assert.strictEqual(result.version, "");
		assert.strictEqual(result.description, "");
		assert.strictEqual(result.readmeMarkdown, "");
		assert.strictEqual(result.hasReadme, false);
	});

	test("throws error for invalid package input", () => {
		assert.throws(() => {
			extractPackageOverviewData(null);
		}, /Package instance is required/);

		assert.throws(() => {
			extractPackageOverviewData(undefined);
		}, /Package instance is required/);

		assert.throws(() => {
			extractPackageOverviewData("invalid");
		}, /Package instance is required/);
	});

	test("handles complex module structures with multiple entity types", () => {
		const entities = [
			createMockEntity("myFunction", "function"),
			createMockEntity("MyClass", "class"),
			createMockEntity("MyType", "typedef"),
			createMockEntity("MY_CONSTANT", "variable"),
			createMockEntity("_privateHelper", "function", true),
		];

		const modules = [
			createMockModule({
				importPath: "complex-package",
				isDefault: true,
				entities,
			}),
		];

		const mockPackage = createMockPackage({ modules });
		const result = extractPackageOverviewData(mockPackage);

		assert.strictEqual(result.modules[0].publicEntityCount, 4);
		assert.strictEqual(result.modules[0].availableTypes.length, 4);
		assert(result.modules[0].availableTypes.includes("function"));
		assert(result.modules[0].availableTypes.includes("class"));
		assert(result.modules[0].availableTypes.includes("typedef"));
		assert(result.modules[0].availableTypes.includes("variable"));
	});
});
