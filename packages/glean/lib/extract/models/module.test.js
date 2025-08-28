/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Module test suite - surgical entity organization testing
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { Module } from "./module.js";

// Mock entity objects for testing
const createMockEntity = (name, entityType = "function", isPrivate = false) => {
	const entity = {
		name,
		entityType,
		location: { file: "test.js", line: 1, column: 1 },
		hasJSDocTag: (tagType) => {
			if (tagType === "private") return isPrivate;
			return false;
		},
		toObject: () => ({ name, entityType, isPrivate }),
	};
	return entity;
};

const createPrivateNameEntity = (name, entityType = "function") => ({
	name,
	entityType,
	location: { file: "test.js", line: 1, column: 1 },
	hasJSDocTag: (_tagType) => false,
	toObject: () => ({ name, entityType }),
});

const createEntityWithoutJSDoc = (name, entityType = "function") => ({
	name,
	entityType,
	location: { file: "test.js", line: 1, column: 1 },
	toObject: () => ({ name, entityType }),
});

describe("Module constructor", () => {
	test("should create module with all parameters", () => {
		const entities = [createMockEntity("func1"), createMockEntity("func2")];
		const module = new Module("test/utils", true, "# Utils", entities);

		strictEqual(module.importPath, "test/utils");
		strictEqual(module.isDefault, true);
		strictEqual(module.readme, "# Utils");
		strictEqual(module.entities.length, 2);
		strictEqual(module.entities[0], entities[0]);
		strictEqual(module.entities[1], entities[1]);
	});

	test("should create module with missing parameters using defaults", () => {
		const module = new Module();

		strictEqual(module.importPath, "");
		strictEqual(module.isDefault, false);
		strictEqual(module.readme, "");
		deepStrictEqual(module.entities, []);
	});

	test("should handle null and undefined parameters", () => {
		const module = new Module(null, null, null, null);

		strictEqual(module.importPath, "");
		strictEqual(module.isDefault, false);
		strictEqual(module.readme, "");
		deepStrictEqual(module.entities, []);
	});

	test("should handle isDefault as falsy values", () => {
		const module1 = new Module("test", 0, "readme", []);
		const module2 = new Module("test", "", "readme", []);
		const module3 = new Module("test", false, "readme", []);

		strictEqual(module1.isDefault, false);
		strictEqual(module2.isDefault, false);
		strictEqual(module3.isDefault, false);
	});

	test("should handle isDefault as truthy values", () => {
		const module1 = new Module("test", 1, "readme", []);
		const module2 = new Module("test", "yes", "readme", []);
		const module3 = new Module("test", true, "readme", []);

		strictEqual(module1.isDefault, true);
		strictEqual(module2.isDefault, true);
		strictEqual(module3.isDefault, true);
	});

	test("should handle non-array entities parameter", () => {
		const module1 = new Module("test", false, "readme", "not-array");
		const module2 = new Module("test", false, "readme", 123);
		const module3 = new Module("test", false, "readme", {});

		deepStrictEqual(module1.entities, []);
		deepStrictEqual(module2.entities, []);
		deepStrictEqual(module3.entities, []);
	});
});

describe("Module entity management", () => {
	test("should add valid entity", () => {
		const module = new Module("test", false, "readme", []);
		const entity = createMockEntity("func1");

		module.addEntity(entity);

		strictEqual(module.entities.length, 1);
		strictEqual(module.entities[0], entity);
	});

	test("should ignore null entity", () => {
		const module = new Module("test", false, "readme", []);

		module.addEntity(null);

		strictEqual(module.entities.length, 0);
	});

	test("should ignore undefined entity", () => {
		const module = new Module("test", false, "readme", []);

		module.addEntity(undefined);

		strictEqual(module.entities.length, 0);
	});

	test("should ignore non-object entity", () => {
		const module = new Module("test", false, "readme", []);

		module.addEntity("not-object");
		module.addEntity(123);
		module.addEntity(true);

		strictEqual(module.entities.length, 0);
	});

	test("should remove existing entity", () => {
		const entity1 = createMockEntity("func1");
		const entity2 = createMockEntity("func2");
		const module = new Module("test", false, "readme", [entity1, entity2]);

		const removed = module.removeEntity(entity1);

		strictEqual(removed, true);
		strictEqual(module.entities.length, 1);
		strictEqual(module.entities[0], entity2);
	});

	test("should return false when removing non-existent entity", () => {
		const entity1 = createMockEntity("func1");
		const entity2 = createMockEntity("func2");
		const module = new Module("test", false, "readme", [entity1]);

		const removed = module.removeEntity(entity2);

		strictEqual(removed, false);
		strictEqual(module.entities.length, 1);
		strictEqual(module.entities[0], entity1);
	});

	test("should return false when removing from empty module", () => {
		const module = new Module("test", false, "readme", []);
		const entity = createMockEntity("func1");

		const removed = module.removeEntity(entity);

		strictEqual(removed, false);
		strictEqual(module.entities.length, 0);
	});
});

describe("Module public entities", () => {
	test("should filter out entities with @private JSDoc tag", () => {
		const publicEntity = createMockEntity("public", "function", false);
		const privateEntity = createMockEntity("private", "function", true);
		const module = new Module("test", false, "readme", [
			publicEntity,
			privateEntity,
		]);

		const publicEntities = module.publicEntities;

		strictEqual(publicEntities.length, 1);
		strictEqual(publicEntities[0], publicEntity);
	});

	test("should filter out entities with private naming convention", () => {
		const publicEntity = createPrivateNameEntity("public");
		const privateEntity = createPrivateNameEntity("_private");
		const module = new Module("test", false, "readme", [
			publicEntity,
			privateEntity,
		]);

		const publicEntities = module.publicEntities;

		strictEqual(publicEntities.length, 1);
		strictEqual(publicEntities[0], publicEntity);
	});

	test("should handle entities without hasJSDocTag method", () => {
		const entity1 = createEntityWithoutJSDoc("func1");
		const entity2 = createEntityWithoutJSDoc("_private");
		const module = new Module("test", false, "readme", [entity1, entity2]);

		const publicEntities = module.publicEntities;

		strictEqual(publicEntities.length, 1);
		strictEqual(publicEntities[0], entity1);
	});

	test("should handle entities without name property", () => {
		const entityWithoutName = { entityType: "function" };
		const module = new Module("test", false, "readme", [entityWithoutName]);

		const publicEntities = module.publicEntities;

		strictEqual(publicEntities.length, 1);
		strictEqual(publicEntities[0], entityWithoutName);
	});

	test("should return empty array when no public entities exist", () => {
		const privateEntity1 = createMockEntity("private1", "function", true);
		const privateEntity2 = createPrivateNameEntity("_private2");
		const module = new Module("test", false, "readme", [
			privateEntity1,
			privateEntity2,
		]);

		const publicEntities = module.publicEntities;

		strictEqual(publicEntities.length, 0);
		deepStrictEqual(publicEntities, []);
	});

	test("should return empty array when no entities exist", () => {
		const module = new Module("test", false, "readme", []);

		const publicEntities = module.publicEntities;

		strictEqual(publicEntities.length, 0);
		deepStrictEqual(publicEntities, []);
	});
});

describe("Module entity groups", () => {
	test("should group entities by type", () => {
		const func1 = createMockEntity("func1", "function");
		const func2 = createMockEntity("func2", "function");
		const class1 = createMockEntity("Class1", "class");
		const var1 = createMockEntity("var1", "variable");
		const module = new Module("test", false, "readme", [
			func1,
			func2,
			class1,
			var1,
		]);

		const groups = module.entityGroups;

		strictEqual(Object.keys(groups).length, 3);
		strictEqual(groups.function.length, 2);
		strictEqual(groups.class.length, 1);
		strictEqual(groups.variable.length, 1);
		strictEqual(groups.function[0], func1);
		strictEqual(groups.function[1], func2);
		strictEqual(groups.class[0], class1);
		strictEqual(groups.variable[0], var1);
	});

	test("should handle entities without entityType", () => {
		const entityWithoutType = { name: "test" };
		const module = new Module("test", false, "readme", [entityWithoutType]);

		const groups = module.entityGroups;

		strictEqual(Object.keys(groups).length, 1);
		strictEqual(groups.unknown.length, 1);
		strictEqual(groups.unknown[0], entityWithoutType);
	});

	test("should return empty object when no entities exist", () => {
		const module = new Module("test", false, "readme", []);

		const groups = module.entityGroups;

		deepStrictEqual(groups, {});
	});

	test("should group public entities by type", () => {
		const publicFunc = createMockEntity("publicFunc", "function", false);
		const privateFunc = createMockEntity("privateFunc", "function", true);
		const publicClass = createMockEntity("PublicClass", "class", false);
		const module = new Module("test", false, "readme", [
			publicFunc,
			privateFunc,
			publicClass,
		]);

		const groups = module.publicEntityGroups;

		strictEqual(Object.keys(groups).length, 2);
		strictEqual(groups.function.length, 1);
		strictEqual(groups.class.length, 1);
		strictEqual(groups.function[0], publicFunc);
		strictEqual(groups.class[0], publicClass);
	});

	test("should handle public entities without entityType in publicEntityGroups", () => {
		const entityWithoutType = { name: "test" }; // No entityType property, and not private
		const module = new Module("test", false, "readme", [entityWithoutType]);

		const groups = module.publicEntityGroups;

		strictEqual(Object.keys(groups).length, 1);
		strictEqual(groups.unknown.length, 1);
		strictEqual(groups.unknown[0], entityWithoutType);
	});
});

describe("Module entity queries", () => {
	test("should find entity by name", () => {
		const entity1 = createMockEntity("func1");
		const entity2 = createMockEntity("func2");
		const module = new Module("test", false, "readme", [entity1, entity2]);

		const found = module.findEntityByName("func2");

		strictEqual(found, entity2);
	});

	test("should return null when entity not found by name", () => {
		const entity = createMockEntity("func1");
		const module = new Module("test", false, "readme", [entity]);

		const found = module.findEntityByName("missing");

		strictEqual(found, null);
	});

	test("should return null when no entities exist for name query", () => {
		const module = new Module("test", false, "readme", []);

		const found = module.findEntityByName("func1");

		strictEqual(found, null);
	});

	test("should get entities by type", () => {
		const func1 = createMockEntity("func1", "function");
		const func2 = createMockEntity("func2", "function");
		const class1 = createMockEntity("Class1", "class");
		const module = new Module("test", false, "readme", [func1, func2, class1]);

		const functions = module.getEntitiesByType("function");

		strictEqual(functions.length, 2);
		strictEqual(functions[0], func1);
		strictEqual(functions[1], func2);
	});

	test("should return empty array when no entities match type", () => {
		const func = createMockEntity("func1", "function");
		const module = new Module("test", false, "readme", [func]);

		const classes = module.getEntitiesByType("class");

		strictEqual(classes.length, 0);
		deepStrictEqual(classes, []);
	});
});

describe("Module entity counts and flags", () => {
	test("should return correct entity count", () => {
		const entities = [
			createMockEntity("func1"),
			createMockEntity("func2"),
			createMockEntity("Class1", "class"),
		];
		const module = new Module("test", false, "readme", entities);

		strictEqual(module.entityCount, 3);
	});

	test("should return zero entity count when no entities exist", () => {
		const module = new Module("test", false, "readme", []);

		strictEqual(module.entityCount, 0);
	});

	test("should return correct public entity count", () => {
		const publicEntity = createMockEntity("public", "function", false);
		const privateEntity = createMockEntity("private", "function", true);
		const module = new Module("test", false, "readme", [
			publicEntity,
			privateEntity,
		]);

		strictEqual(module.publicEntityCount, 1);
	});

	test("should return true when module has entities", () => {
		const module = new Module("test", false, "readme", [
			createMockEntity("func1"),
		]);

		strictEqual(module.hasEntities, true);
	});

	test("should return false when module has no entities", () => {
		const module = new Module("test", false, "readme", []);

		strictEqual(module.hasEntities, false);
	});

	test("should return true when module has public entities", () => {
		const publicEntity = createMockEntity("public", "function", false);
		const module = new Module("test", false, "readme", [publicEntity]);

		strictEqual(module.hasPublicEntities, true);
	});

	test("should return false when module has no public entities", () => {
		const privateEntity = createMockEntity("private", "function", true);
		const module = new Module("test", false, "readme", [privateEntity]);

		strictEqual(module.hasPublicEntities, false);
	});

	test("should return available entity types", () => {
		const func = createMockEntity("func1", "function");
		const class1 = createMockEntity("Class1", "class");
		const class2 = createMockEntity("Class2", "class");
		const module = new Module("test", false, "readme", [func, class1, class2]);

		const types = module.availableEntityTypes;

		strictEqual(types.length, 2);
		strictEqual(types.includes("function"), true);
		strictEqual(types.includes("class"), true);
	});

	test("should return empty array for available types when no entities exist", () => {
		const module = new Module("test", false, "readme", []);

		const types = module.availableEntityTypes;

		strictEqual(types.length, 0);
		deepStrictEqual(types, []);
	});

	test("should handle entities without entityType in available types", () => {
		const entityWithoutType = { name: "test" };
		const module = new Module("test", false, "readme", [entityWithoutType]);

		const types = module.availableEntityTypes;

		strictEqual(types.length, 1);
		strictEqual(types[0], "unknown");
	});
});

describe("Module serialization", () => {
	test("should serialize to object with all properties", () => {
		const entity = createMockEntity("func1", "function");
		const module = new Module("test/utils", true, "# Utils", [entity]);

		const obj = module.toObject();

		deepStrictEqual(obj, {
			importPath: "test/utils",
			isDefault: true,
			readme: "# Utils",
			entities: [{ name: "func1", entityType: "function", isPrivate: false }],
			entityCount: 1,
			publicEntityCount: 1,
			availableEntityTypes: ["function"],
		});
	});

	test("should serialize empty module", () => {
		const module = new Module();

		const obj = module.toObject();

		deepStrictEqual(obj, {
			importPath: "",
			isDefault: false,
			readme: "",
			entities: [],
			entityCount: 0,
			publicEntityCount: 0,
			availableEntityTypes: [],
		});
	});

	test("should handle entities without toObject method", () => {
		const entityWithoutToObject = { name: "test", entityType: "function" };
		const module = new Module("test", false, "readme", [entityWithoutToObject]);

		const obj = module.toObject();

		strictEqual(obj.entities.length, 1);
		strictEqual(obj.entities[0], entityWithoutToObject);
	});

	test("should serialize module with mixed entity types", () => {
		const func = createMockEntity("func1", "function", false);
		const privateClass = createMockEntity("Class1", "class", true);
		const module = new Module("test", false, "readme", [func, privateClass]);

		const obj = module.toObject();

		strictEqual(obj.entityCount, 2);
		strictEqual(obj.publicEntityCount, 1);
		deepStrictEqual(obj.availableEntityTypes, ["function", "class"]);
	});
});
