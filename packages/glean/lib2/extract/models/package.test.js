/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Package test suite - surgical documentation container testing
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { Package } from "./package.js";

// Mock module objects for testing
const createMockModule = (importPath, isDefault = false, entities = []) => ({
	importPath,
	isDefault,
	entities,
	toObject: () => ({ importPath, isDefault, entities }),
});

const createMockEntity = (name, type = "function") => ({
	name,
	entityType: type,
	location: { file: "test.js", line: 1, column: 1 },
});

describe("Package constructor", () => {
	test("should create package with all parameters", () => {
		const pkg = new Package("test-pkg", "1.0.0", "Test package", "# Test");

		strictEqual(pkg.name, "test-pkg");
		strictEqual(pkg.version, "1.0.0");
		strictEqual(pkg.description, "Test package");
		strictEqual(pkg.readme, "# Test");
		deepStrictEqual(pkg.modules, []);
	});

	test("should create package with missing parameters using defaults", () => {
		const pkg = new Package();

		strictEqual(pkg.name, "");
		strictEqual(pkg.version, "");
		strictEqual(pkg.description, "");
		strictEqual(pkg.readme, "");
		deepStrictEqual(pkg.modules, []);
	});

	test("should handle null and undefined parameters", () => {
		const pkg = new Package(null, undefined, null, undefined);

		strictEqual(pkg.name, "");
		strictEqual(pkg.version, "");
		strictEqual(pkg.description, "");
		strictEqual(pkg.readme, "");
	});
});

describe("Package module management", () => {
	test("should add valid module", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const module = createMockModule("test", true);

		pkg.addModule(module);

		strictEqual(pkg.modules.length, 1);
		strictEqual(pkg.modules[0], module);
	});

	test("should ignore null module", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");

		pkg.addModule(null);

		strictEqual(pkg.modules.length, 0);
	});

	test("should ignore undefined module", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");

		pkg.addModule(undefined);

		strictEqual(pkg.modules.length, 0);
	});

	test("should ignore non-object module", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");

		pkg.addModule("not-an-object");
		pkg.addModule(123);
		pkg.addModule(true);

		strictEqual(pkg.modules.length, 0);
	});

	test("should add multiple modules", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const module1 = createMockModule("test", true);
		const module2 = createMockModule("test/utils", false);

		pkg.addModule(module1);
		pkg.addModule(module2);

		strictEqual(pkg.modules.length, 2);
		strictEqual(pkg.modules[0], module1);
		strictEqual(pkg.modules[1], module2);
	});
});

describe("Package default module", () => {
	test("should return default module when it exists", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const defaultModule = createMockModule("test", true);
		const otherModule = createMockModule("test/utils", false);

		pkg.addModule(otherModule);
		pkg.addModule(defaultModule);

		strictEqual(pkg.defaultModule, defaultModule);
	});

	test("should return null when no default module exists", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const module1 = createMockModule("test/utils", false);
		const module2 = createMockModule("test/api", false);

		pkg.addModule(module1);
		pkg.addModule(module2);

		strictEqual(pkg.defaultModule, null);
	});

	test("should return null when no modules exist", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");

		strictEqual(pkg.defaultModule, null);
	});

	test("should return first default module when multiple defaults exist", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const default1 = createMockModule("test", true);
		const default2 = createMockModule("test-alt", true);

		pkg.addModule(default1);
		pkg.addModule(default2);

		strictEqual(pkg.defaultModule, default1);
	});
});

describe("Package all entities", () => {
	test("should return all entities from all modules", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const entity1 = createMockEntity("func1");
		const entity2 = createMockEntity("func2");
		const entity3 = createMockEntity("class1", "class");

		const module1 = createMockModule("test", true, [entity1, entity2]);
		const module2 = createMockModule("test/utils", false, [entity3]);

		pkg.addModule(module1);
		pkg.addModule(module2);

		const allEntities = pkg.allEntities;
		strictEqual(allEntities.length, 3);
		strictEqual(allEntities[0], entity1);
		strictEqual(allEntities[1], entity2);
		strictEqual(allEntities[2], entity3);
	});

	test("should return empty array when no modules exist", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");

		const allEntities = pkg.allEntities;
		strictEqual(allEntities.length, 0);
		deepStrictEqual(allEntities, []);
	});

	test("should return empty array when modules have no entities", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const module1 = createMockModule("test", true, []);
		const module2 = createMockModule("test/utils", false, []);

		pkg.addModule(module1);
		pkg.addModule(module2);

		const allEntities = pkg.allEntities;
		strictEqual(allEntities.length, 0);
		deepStrictEqual(allEntities, []);
	});
});

describe("Package module queries", () => {
	test("should find modules by prefix", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const module1 = createMockModule("test", true);
		const module2 = createMockModule("test/utils", false);
		const module3 = createMockModule("test/api", false);
		const module4 = createMockModule("other/utils", false);

		pkg.addModule(module1);
		pkg.addModule(module2);
		pkg.addModule(module3);
		pkg.addModule(module4);

		const testModules = pkg.getModulesByPrefix("test");
		strictEqual(testModules.length, 3);
		strictEqual(testModules[0], module1);
		strictEqual(testModules[1], module2);
		strictEqual(testModules[2], module3);
	});

	test("should return empty array when no modules match prefix", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const module1 = createMockModule("other", true);

		pkg.addModule(module1);

		const result = pkg.getModulesByPrefix("test");
		strictEqual(result.length, 0);
		deepStrictEqual(result, []);
	});

	test("should find module by exact import path", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const module1 = createMockModule("test", true);
		const module2 = createMockModule("test/utils", false);

		pkg.addModule(module1);
		pkg.addModule(module2);

		const found = pkg.findModuleByImportPath("test/utils");
		strictEqual(found, module2);
	});

	test("should return null when module not found by import path", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const module1 = createMockModule("test", true);

		pkg.addModule(module1);

		const found = pkg.findModuleByImportPath("test/missing");
		strictEqual(found, null);
	});

	test("should return null when no modules exist for import path query", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");

		const found = pkg.findModuleByImportPath("test");
		strictEqual(found, null);
	});
});

describe("Package counts", () => {
	test("should return correct entity count", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const entity1 = createMockEntity("func1");
		const entity2 = createMockEntity("func2");
		const entity3 = createMockEntity("class1", "class");

		const module1 = createMockModule("test", true, [entity1, entity2]);
		const module2 = createMockModule("test/utils", false, [entity3]);

		pkg.addModule(module1);
		pkg.addModule(module2);

		strictEqual(pkg.entityCount, 3);
	});

	test("should return zero entity count when no entities exist", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const module1 = createMockModule("test", true, []);

		pkg.addModule(module1);

		strictEqual(pkg.entityCount, 0);
	});

	test("should return correct module count", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const module1 = createMockModule("test", true);
		const module2 = createMockModule("test/utils", false);

		pkg.addModule(module1);
		pkg.addModule(module2);

		strictEqual(pkg.moduleCount, 2);
	});

	test("should return zero module count when no modules exist", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");

		strictEqual(pkg.moduleCount, 0);
	});
});

describe("Package serialization", () => {
	test("should serialize to object with all properties", () => {
		const pkg = new Package("test", "1.0.0", "Test package", "# Test");
		const entity = createMockEntity("func1");
		const module = createMockModule("test", true, [entity]);

		pkg.addModule(module);

		const obj = pkg.toObject();

		deepStrictEqual(obj, {
			name: "test",
			version: "1.0.0",
			description: "Test package",
			readme: "# Test",
			modules: [{ importPath: "test", isDefault: true, entities: [entity] }],
			entityCount: 1,
			moduleCount: 1,
		});
	});

	test("should serialize empty package", () => {
		const pkg = new Package();

		const obj = pkg.toObject();

		deepStrictEqual(obj, {
			name: "",
			version: "",
			description: "",
			readme: "",
			modules: [],
			entityCount: 0,
			moduleCount: 0,
		});
	});

	test("should handle modules without toObject method", () => {
		const pkg = new Package("test", "1.0.0", "desc", "readme");
		const moduleWithoutToObject = {
			importPath: "test",
			isDefault: true,
			entities: [],
		};

		pkg.addModule(moduleWithoutToObject);

		const obj = pkg.toObject();

		strictEqual(obj.modules.length, 1);
		strictEqual(obj.modules[0], moduleWithoutToObject);
	});
});
