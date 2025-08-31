/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for entity page data extractor
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { extractEntityPageData } from "./entity-page.js";

describe("extractEntityPageData", () => {
	/**
	 * Create mock entity with JSDoc capabilities
	 * @param {string} name - Entity name
	 * @param {string} type - Entity type
	 * @param {Object} options - Additional options
	 * @returns {Object} Mock entity
	 */
	function createMockEntity(name, type = "function", options = {}) {
		const {
			description = "",
			source = "",
			location = null,
			jsdocTags = {},
			moduleId = null, // Allow setting moduleId externally
		} = options;

		return {
			name,
			entityType: type,
			description,
			source,
			location,
			moduleId: moduleId || "test-package/utils",
			signature: options.signature || "",

			// JSDoc tag simulation
			hasJSDocTag: (tagName) => Boolean(jsdocTags[tagName]),
			getJSDocTag: (tagName) => jsdocTags[tagName] || null,
			getJSDocTagsByType: (tagName) => {
				const tag = jsdocTags[tagName];
				if (!tag) return [];
				return Array.isArray(tag) ? tag : [tag];
			},
		};
	}

	/**
	 * Create mock module with entities
	 * @param {string} importPath - Module import path
	 * @param {Array} entities - Module entities
	 * @param {Object} options - Module options
	 * @returns {Object} Mock module
	 */
	function createMockModule(importPath, entities = [], options = {}) {
		const publicEntities = entities.filter(
			(e) => !e.hasJSDocTag?.("private") && !e.name?.startsWith("_"),
		);

		return {
			importPath,
			isDefault: options.isDefault || false,
			readme: options.readme || "",
			entities,
			entityCount: entities.length,
			publicEntityCount: publicEntities.length,
			availableEntityTypes: [
				...new Set(publicEntities.map((e) => e.entityType || "unknown")),
			],
			publicEntityGroups: options.publicEntityGroups || {},
			findEntityByName: (name) => entities.find((e) => e.name === name) || null,
		};
	}

	/**
	 * Create mock package with modules
	 * @param {Array} modules - Package modules
	 * @param {Object} options - Package options
	 * @returns {Object} Mock package
	 */
	function createMockPackage(modules = [], options = {}) {
		const allEntities = modules.flatMap((m) => m.entities || []);

		return {
			name: options.name || "test-package",
			version: options.version || "1.0.0",
			description: options.description || "A test package",
			modules,
			allEntities,
			findModuleByImportPath: (importPath) =>
				modules.find((m) => m.importPath === importPath) || null,
			...options,
		};
	}

	test("extracts basic entity information correctly", () => {
		const entity = createMockEntity("testFunction", "function", {
			description: "A test function for unit testing",
			source: "function testFunction() { return 'test'; }",
			location: { file: "utils.js", line: 10, column: 0 },
		});

		const module = createMockModule("test-package/utils", [entity]);
		const mockPackage = createMockPackage([module]);

		const result = extractEntityPageData(mockPackage, "utils", "testFunction");

		// Check basic entity data
		assert.strictEqual(result.entity.name, "testFunction");
		assert.strictEqual(result.entity.type, "function");
		assert.strictEqual(
			result.entity.description,
			"A test function for unit testing",
		);
		// Source and location removed from entity data

		// Check import statement generation
		assert.strictEqual(result.entity.importPath, "test-package/utils");
		assert.strictEqual(
			result.entity.importStatement,
			"import { testFunction } from 'test-package/utils';",
		);

		// Check metadata flags
		assert.strictEqual(result.packageName, "test-package");
		assert.strictEqual(result.moduleName, "utils");
		// hasSource and hasLocation removed from entity page data
	});

	test("extracts JSDoc parameters correctly", () => {
		const entity = createMockEntity("processData", "function", {
			description: "Processes input data with options",
			jsdocTags: {
				param: [
					{
						name: "data",
						type: "Array<Object>",
						description: "Input data to process",
						optional: false,
					},
					{
						name: "options",
						type: "Object",
						description: "Processing options",
						optional: true,
						defaultValue: "{}",
					},
				],
			},
		});

		const module = createMockModule("test-package/utils", [entity]);
		const mockPackage = createMockPackage([module]);

		const result = extractEntityPageData(mockPackage, "utils", "processData");

		// Check parameters extraction
		assert.strictEqual(result.hasParameters, true);
		assert.strictEqual(result.documentation.parameters.length, 2);

		const [dataParam, optionsParam] = result.documentation.parameters;

		assert.strictEqual(dataParam.name, "data");
		assert.strictEqual(dataParam.type, "Array<Object>");
		assert.strictEqual(dataParam.description, "Input data to process");
		assert.strictEqual(dataParam.isOptional, false);

		assert.strictEqual(optionsParam.name, "options");
		assert.strictEqual(optionsParam.type, "Object");
		assert.strictEqual(optionsParam.description, "Processing options");
		assert.strictEqual(optionsParam.isOptional, true);
		assert.strictEqual(optionsParam.defaultValue, "{}");
	});

	test("extracts JSDoc returns information correctly", () => {
		const entity = createMockEntity("calculateSum", "function", {
			description: "Calculates sum of numbers",
			jsdocTags: {
				returns: {
					type: "number",
					description: "The sum of all input numbers",
				},
			},
		});

		const module = createMockModule("test-package/math", [entity]);
		const mockPackage = createMockPackage([module]);

		const result = extractEntityPageData(mockPackage, "math", "calculateSum");

		// Check returns extraction
		assert.strictEqual(result.hasReturns, true);
		assert.strictEqual(result.documentation.returns.type, "number");
		assert.strictEqual(
			result.documentation.returns.description,
			"The sum of all input numbers",
		);
	});

	test("extracts JSDoc examples correctly", () => {
		const entity = createMockEntity("formatText", "function", {
			description: "Formats text with options",
			jsdocTags: {
				example: [
					{
						description: "formatText('hello', { uppercase: true })",
						title: "Basic usage",
						language: "javascript",
					},
					{
						description: "const result = formatText('world');",
						title: "Simple example",
					},
				],
			},
		});

		const module = createMockModule("test-package/text", [entity]);
		const mockPackage = createMockPackage([module]);

		const result = extractEntityPageData(mockPackage, "text", "formatText");

		// Check examples extraction
		assert.strictEqual(result.hasExamples, true);
		assert.strictEqual(result.documentation.examples.length, 2);

		const [example1, example2] = result.documentation.examples;

		assert.strictEqual(example1.title, "Basic usage");
		assert.strictEqual(
			example1.code,
			"formatText('hello', { uppercase: true })",
		);
		assert.strictEqual(example1.language, "javascript");

		assert.strictEqual(example2.title, "Simple example");
		assert.strictEqual(example2.code, "const result = formatText('world');");
		assert.strictEqual(example2.language, "javascript"); // Default
	});

	test("extracts deprecation information correctly", () => {
		const entity = createMockEntity("oldFunction", "function", {
			description: "Legacy function",
			jsdocTags: {
				deprecated: {
					description: "Use newFunction instead",
					since: "2.0.0",
				},
			},
		});

		const module = createMockModule("test-package/legacy", [entity]);
		const mockPackage = createMockPackage([module]);

		const result = extractEntityPageData(mockPackage, "legacy", "oldFunction");

		// Check deprecation extraction
		assert.strictEqual(result.isDeprecated, true);
		assert.strictEqual(result.documentation.deprecated.isDeprecated, true);
		assert.strictEqual(
			result.documentation.deprecated.reason,
			"Use newFunction instead",
		);
		assert.strictEqual(result.documentation.deprecated.since, "2.0.0");
	});

	test("extracts other JSDoc tags correctly", () => {
		const entity = createMockEntity("complexFunction", "function", {
			description: "A complex function with multiple JSDoc tags",
			jsdocTags: {
				since: { description: "1.2.0" },
				author: [{ description: "John Doe <john@example.com>" }],
				see: [
					{
						description: "Related function",
						link: "/modules/utils/relatedFunction/",
					},
					{
						description: "External docs",
						link: "https://example.com/docs",
					},
				],
				throws: [
					{
						type: "TypeError",
						description: "When input is not a string",
					},
				],
			},
		});

		const module = createMockModule("test-package/utils", [entity]);
		const mockPackage = createMockPackage([module]);

		const result = extractEntityPageData(
			mockPackage,
			"utils",
			"complexFunction",
		);

		// Check since version
		assert.strictEqual(result.documentation.since, "1.2.0");

		// Check author info
		assert.strictEqual(result.documentation.author.length, 1);
		assert.strictEqual(
			result.documentation.author[0],
			"John Doe <john@example.com>",
		);

		// See references removed from documentation data

		// Check throws info
		assert.strictEqual(result.documentation.throws.length, 1);
		assert.strictEqual(result.documentation.throws[0].type, "TypeError");
		assert.strictEqual(
			result.documentation.throws[0].description,
			"When input is not a string",
		);
	});

	test("extracts navigation context correctly", () => {
		const entity1 = createMockEntity("func1", "function");
		const entity2 = createMockEntity("func2", "function");
		const entity3 = createMockEntity("Class1", "class");

		const module1 = createMockModule("test-package", [entity1], {
			isDefault: true,
		});
		const module2 = createMockModule("test-package/utils", [entity2, entity3]);

		const mockPackage = createMockPackage([module1, module2]);

		const result = extractEntityPageData(mockPackage, "utils", "func2");

		// Check package navigation
		assert.strictEqual(result.navigation.packageName, "test-package");

		// Check current module info
		assert.strictEqual(result.navigation.currentModule.name, "utils");
		assert.strictEqual(
			result.navigation.currentModule.fullImportPath,
			"test-package/utils",
		);
		assert.strictEqual(result.navigation.currentModule.link, "/modules/utils/");

		// Check current entity info
		assert.strictEqual(result.navigation.currentEntity.name, "func2");
		assert.strictEqual(result.navigation.currentEntity.type, "function");

		// Check all modules navigation
		assert.strictEqual(result.navigation.allModules.length, 2);
		const [defaultModule, utilsModule] = result.navigation.allModules;

		assert.strictEqual(defaultModule.name, "test-package");
		assert.strictEqual(defaultModule.isDefault, true);
		assert.strictEqual(defaultModule.isCurrent, false);

		assert.strictEqual(utilsModule.name, "utils");
		assert.strictEqual(utilsModule.isDefault, false);
		assert.strictEqual(utilsModule.isCurrent, true);

		// Check module entities navigation
		assert.strictEqual(result.navigation.moduleEntities.length, 2);
		const currentEntityNav = result.navigation.moduleEntities.find(
			(e) => e.isCurrent,
		);
		assert.strictEqual(currentEntityNav.name, "func2");
		assert.strictEqual(currentEntityNav.type, "function");
	});

	test("extracts same module entities correctly", () => {
		const entity1 = createMockEntity("targetFunction", "function", {
			moduleId: "test-package/utils",
		});
		const entity2 = createMockEntity("helperFunction", "function", {
			description: "A helper function for testing",
			moduleId: "test-package/utils",
		});
		const entity3 = createMockEntity("UtilClass", "class", {
			description: "A utility class for common operations",
			moduleId: "test-package/utils",
		});

		const module = createMockModule("test-package/utils", [
			entity1,
			entity2,
			entity3,
		]);
		const mockPackage = createMockPackage([module]);

		const result = extractEntityPageData(
			mockPackage,
			"utils",
			"targetFunction",
		);

		// Check related entities in same module
		assert.strictEqual(result.relatedEntities.sameModule.length, 2);

		const helperRef = result.relatedEntities.sameModule.find(
			(e) => e.name === "helperFunction",
		);
		assert.strictEqual(helperRef.name, "helperFunction");
		assert.strictEqual(helperRef.type, "function");
		assert.strictEqual(helperRef.description, "A helper function for testing");
		assert.strictEqual(helperRef.link, "/modules/utils/helperFunction/");

		const classRef = result.relatedEntities.sameModule.find(
			(e) => e.name === "UtilClass",
		);
		assert.strictEqual(classRef.name, "UtilClass");
		assert.strictEqual(classRef.type, "class");
	});

	test("extracts similar entities across modules correctly", () => {
		const targetEntity = createMockEntity("parseData", "function", {
			moduleId: "test-package/parser",
		});
		const similarEntity1 = createMockEntity("processData", "function", {
			description: "Processes data with advanced options",
			moduleId: "test-package/processor",
		});
		const similarEntity2 = createMockEntity("formatData", "function", {
			description: "Formats data for display",
			moduleId: "test-package/formatter",
		});

		const module1 = createMockModule("test-package/parser", [targetEntity]);
		const module2 = createMockModule("test-package/processor", [
			similarEntity1,
		]);
		const module3 = createMockModule("test-package/formatter", [
			similarEntity2,
		]);

		const mockPackage = createMockPackage([module1, module2, module3]);

		const result = extractEntityPageData(mockPackage, "parser", "parseData");

		// Check similar entities (same type, different modules)
		assert.strictEqual(result.relatedEntities.similar.length, 2);

		const processRef = result.relatedEntities.similar.find(
			(e) => e.name === "processData",
		);
		assert.strictEqual(processRef.name, "processData");
		assert.strictEqual(processRef.type, "function");
		assert.strictEqual(processRef.moduleName, "processor");
		assert.strictEqual(processRef.link, "/modules/processor/processData/");
	});

	test("handles module not found error", () => {
		const entity = createMockEntity("testFunction", "function");
		const module = createMockModule("test-package/utils", [entity]);
		const mockPackage = createMockPackage([module]);

		assert.throws(
			() => {
				extractEntityPageData(mockPackage, "nonexistent", "testFunction");
			},
			{
				name: "Error",
				message: /Module 'nonexistent' not found/,
			},
		);
	});

	test("handles entity not found error", () => {
		const entity = createMockEntity("testFunction", "function");
		const module = createMockModule("test-package/utils", [entity]);
		const mockPackage = createMockPackage([module]);

		assert.throws(
			() => {
				extractEntityPageData(mockPackage, "utils", "nonexistentFunction");
			},
			{
				name: "Error",
				message: /Entity 'nonexistentFunction' not found/,
			},
		);
	});

	test("handles missing JSDoc gracefully", () => {
		const entity = createMockEntity("simpleFunction", "function", {
			description: "A simple function without JSDoc",
		});

		const module = createMockModule("test-package/simple", [entity]);
		const mockPackage = createMockPackage([module]);

		const result = extractEntityPageData(
			mockPackage,
			"simple",
			"simpleFunction",
		);

		// Check that missing JSDoc doesn't break extraction
		assert.strictEqual(result.hasParameters, false);
		assert.strictEqual(result.hasReturns, false);
		assert.strictEqual(result.hasExamples, false);
		assert.strictEqual(result.isDeprecated, false);

		assert.strictEqual(result.documentation.parameters.length, 0);
		assert.strictEqual(result.documentation.returns.type, "");
		assert.strictEqual(result.documentation.examples.length, 0);
		assert.strictEqual(result.documentation.since, "");
		assert.strictEqual(result.documentation.author.length, 0);
	});

	test("handles entities without source or location", () => {
		const entity = createMockEntity("externalFunction", "function", {
			description: "Function from external source",
			source: "",
			location: null,
		});

		const module = createMockModule("test-package/external", [entity]);
		const mockPackage = createMockPackage([module]);

		// Test that extraction works for entities without source/location
		extractEntityPageData(mockPackage, "external", "externalFunction");

		// Source and location data/flags removed from entity page
	});

	test("handles complex module resolution", () => {
		const entity = createMockEntity("deepFunction", "function");
		const module = createMockModule("test-package/deep/nested/module", [
			entity,
		]);
		const mockPackage = createMockPackage([module]);

		// Test finding by partial module name
		const result = extractEntityPageData(mockPackage, "module", "deepFunction");

		assert.strictEqual(result.entity.name, "deepFunction");
		assert.strictEqual(
			result.entity.importPath,
			"test-package/deep/nested/module",
		);
		assert.strictEqual(result.moduleName, "module");
	});

	test("handles default module correctly", () => {
		const entity = createMockEntity("mainFunction", "function");
		const module = createMockModule("test-package", [entity], {
			isDefault: true,
		});
		const mockPackage = createMockPackage([module]);

		const result = extractEntityPageData(
			mockPackage,
			"test-package",
			"mainFunction",
		);

		assert.strictEqual(result.entity.isDefault, true);
		assert.strictEqual(result.entity.importPath, "test-package");
		assert.strictEqual(
			result.entity.importStatement,
			"import { mainFunction } from 'test-package';",
		);
	});

	test("filters private entities from related entities", () => {
		const targetEntity = createMockEntity("publicFunction", "function");
		const privateEntity = createMockEntity("_privateFunction", "function", {
			description: "Private function",
		});
		const taggedPrivateEntity = createMockEntity("hiddenFunction", "function", {
			description: "Hidden function",
			jsdocTags: {
				private: { description: "Internal use only" },
			},
		});

		const module = createMockModule("test-package/utils", [
			targetEntity,
			privateEntity,
			taggedPrivateEntity,
		]);
		const mockPackage = createMockPackage([module]);

		const result = extractEntityPageData(
			mockPackage,
			"utils",
			"publicFunction",
		);

		// Should not include private entities in related entities
		assert.strictEqual(result.relatedEntities.sameModule.length, 0);

		// Should also filter from navigation
		const publicEntitiesInNav = result.navigation.moduleEntities.filter(
			(e) => !e.name.startsWith("_"),
		);
		assert.strictEqual(publicEntitiesInNav.length, 1); // Only the target entity
	});

	test("extracts type information correctly", () => {
		const entity = createMockEntity("typedFunction", "function", {
			description: "Function with TypeScript info",
			signature:
				"(data: string[], options?: ProcessOptions) => Promise<Result>",
		});

		const module = createMockModule("test-package/typed", [entity]);
		const mockPackage = createMockPackage([module]);

		const result = extractEntityPageData(mockPackage, "typed", "typedFunction");

		// Check type information extraction
		assert.strictEqual(result.hasTypeInfo, true);
		assert.strictEqual(
			result.documentation.typeInfo.signature,
			"(data: string[], options?: ProcessOptions) => Promise<Result>",
		);
	});

	test("handles package without name gracefully", () => {
		const entity = createMockEntity("testFunction", "function");
		const module = createMockModule("utils", [entity]);
		const mockPackage = createMockPackage([module], { name: null });

		const result = extractEntityPageData(mockPackage, "utils", "testFunction");

		assert.strictEqual(result.packageName, "");
		assert.strictEqual(result.navigation.packageName, "");
	});
});
