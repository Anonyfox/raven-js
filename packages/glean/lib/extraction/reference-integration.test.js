/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok, strictEqual } from "node:assert";
import { test } from "node:test";
import { ClassEntity } from "../models/class-entity.js";
import { DocumentationGraph } from "../models/documentation-graph.js";
import { FunctionEntity } from "../models/function-entity.js";
import { ModuleEntity } from "../models/module-entity.js";
import { PackageEntity } from "../models/package-entity.js";
import { buildEntityReferences } from "./reference-resolution.js";

test("Integration: Complete reference resolution pipeline", () => {
	const packageData = { name: "@test/integration", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create a realistic module structure
	const userModule = new ModuleEntity("user", "./src/user.js");
	userModule.exports = ["User", "UserService"];
	userModule.imports = ["./validation.js", "./database.js"];

	const validationModule = new ModuleEntity(
		"validation",
		"./src/validation.js",
	);
	validationModule.exports = ["ValidationError", "validateUser"];

	const databaseModule = new ModuleEntity("database", "./src/database.js");
	databaseModule.exports = ["Database", "Connection"];

	// Create entities with complex relationships
	const userClass = new ClassEntity("User", "User");
	userClass.moduleId = "user";
	userClass.getAllJSDocTags = () => [
		{
			tagType: "see",
			reference: "UserService",
		},
		{
			tagType: "see",
			reference: "{@link ValidationError}",
		},
	];

	const userService = new FunctionEntity("userService", "UserService");
	userService.moduleId = "user";
	userService.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "user",
			type: "User",
			description: "User instance",
		},
		{
			tagType: "returns",
			type: "Promise<User|ValidationError>",
			description: "Result or error",
		},
		{
			tagType: "see",
			reference: "Database.saveUser",
		},
	];

	const validationError = new ClassEntity("ValidationError", "ValidationError");
	validationError.moduleId = "validation";

	const validateUser = new FunctionEntity("validateUser", "validateUser");
	validateUser.moduleId = "validation";
	validateUser.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "user",
			type: "User",
			description: "User to validate",
		},
		{
			tagType: "returns",
			type: "ValidationError[]",
			description: "Validation errors",
		},
	];

	const database = new ClassEntity("Database", "Database");
	database.moduleId = "database";

	// Add all entities and modules to graph
	graph.addModule(userModule);
	graph.addModule(validationModule);
	graph.addModule(databaseModule);
	graph.addEntity(userClass);
	graph.addEntity(userService);
	graph.addEntity(validationError);
	graph.addEntity(validateUser);
	graph.addEntity(database);

	// Run complete reference resolution
	buildEntityReferences(graph);

	// Validate JSDoc references
	const userReferences = graph.getReferences(userClass.getId());
	ok(userReferences.some((ref) => ref.includes("userService")));
	ok(userReferences.some((ref) => ref.includes("ValidationError")));

	// Validate type references
	const serviceReferences = graph.getReferences(userService.getId());
	ok(serviceReferences.some((ref) => ref.includes("User")));
	ok(serviceReferences.some((ref) => ref.includes("ValidationError")));

	// Validate import/export references exist
	ok(graph.getReferences(userService.getId()).length > 0);
	ok(graph.getReferences(validateUser.getId()).length > 0);
});

test("Integration: Circular reference detection", () => {
	const packageData = { name: "@test/circular", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create circular references
	const classA = new ClassEntity("ClassA", "ClassA");
	classA.moduleId = "moduleA";
	classA.getAllJSDocTags = () => [
		{
			tagType: "see",
			reference: "ClassB",
		},
		{
			tagType: "param",
			name: "b",
			type: "ClassB",
		},
	];

	const classB = new ClassEntity("ClassB", "ClassB");
	classB.moduleId = "moduleB";
	classB.getAllJSDocTags = () => [
		{
			tagType: "see",
			reference: "ClassA",
		},
		{
			tagType: "returns",
			type: "ClassA",
		},
	];

	graph.addEntity(classA);
	graph.addEntity(classB);

	// Should handle circular references gracefully
	buildEntityReferences(graph);

	// Verify bidirectional references
	const aReferences = graph.getReferences(classA.getId());
	const bReferences = graph.getReferences(classB.getId());

	ok(aReferences.some((ref) => ref.includes("ClassB")));
	ok(bReferences.some((ref) => ref.includes("ClassA")));
});

test("Integration: Complex type hierarchy resolution", () => {
	const packageData = { name: "@test/hierarchy", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create inheritance hierarchy
	const baseEntity = new ClassEntity("BaseEntity", "BaseEntity");
	baseEntity.moduleId = "base";

	const userEntity = new ClassEntity("User", "User");
	userEntity.moduleId = "user";
	userEntity.getAllJSDocTags = () => [
		{
			tagType: "extends",
			reference: "BaseEntity",
		},
	];

	const adminEntity = new ClassEntity("Admin", "Admin");
	adminEntity.moduleId = "admin";
	adminEntity.getAllJSDocTags = () => [
		{
			tagType: "extends",
			reference: "User",
		},
	];

	// Service using the hierarchy
	const entityService = new FunctionEntity("service", "EntityService");
	entityService.moduleId = "service";
	entityService.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "entities",
			type: "Array<BaseEntity|User|Admin>",
			description: "Mixed entity array",
		},
		{
			tagType: "returns",
			type: "Record<string, Partial<BaseEntity>>",
			description: "Processed entities",
		},
	];

	graph.addEntity(baseEntity);
	graph.addEntity(userEntity);
	graph.addEntity(adminEntity);
	graph.addEntity(entityService);

	buildEntityReferences(graph);

	// Verify hierarchy references
	const userReferences = graph.getReferences(userEntity.getId());
	ok(userReferences.some((ref) => ref.includes("BaseEntity")));

	const adminReferences = graph.getReferences(adminEntity.getId());
	ok(adminReferences.some((ref) => ref.includes("User")));

	// Verify service references all hierarchy levels
	const serviceReferences = graph.getReferences(entityService.getId());
	ok(serviceReferences.some((ref) => ref.includes("BaseEntity")));
	ok(serviceReferences.some((ref) => ref.includes("User")));
	ok(serviceReferences.some((ref) => ref.includes("Admin")));
});

test("Integration: Module boundary reference resolution", () => {
	const packageData = { name: "@test/modules", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create modules with cross-references
	const coreModule = new ModuleEntity("core", "./src/core/index.js");
	coreModule.exports = ["CoreService"];
	coreModule.imports = ["../utils/validator.js"];

	const utilsModule = new ModuleEntity("utils", "./src/utils/validator.js");
	utilsModule.exports = ["Validator"];

	const appModule = new ModuleEntity("app", "./src/app.js");
	appModule.imports = ["./core/index.js", "./utils/validator.js"];

	// Entities in different modules
	const coreService = new ClassEntity("CoreService", "CoreService");
	coreService.moduleId = "core";
	coreService.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "validator",
			type: "Validator",
			description: "External validator",
		},
	];

	const validator = new ClassEntity("Validator", "Validator");
	validator.moduleId = "utils";

	const appController = new FunctionEntity("appController", "AppController");
	appController.moduleId = "app";
	appController.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "service",
			type: "CoreService",
		},
		{
			tagType: "param",
			name: "validator",
			type: "Validator",
		},
	];

	graph.addModule(coreModule);
	graph.addModule(utilsModule);
	graph.addModule(appModule);
	graph.addEntity(coreService);
	graph.addEntity(validator);
	graph.addEntity(appController);

	buildEntityReferences(graph);

	// Verify cross-module references
	const coreReferences = graph.getReferences(coreService.getId());
	ok(coreReferences.some((ref) => ref.includes("Validator")));

	const appReferences = graph.getReferences(appController.getId());
	ok(appReferences.some((ref) => ref.includes("CoreService")));
	ok(appReferences.some((ref) => ref.includes("Validator")));
});

test("Integration: Performance with large entity count", () => {
	const packageData = { name: "@test/performance", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create many entities with references
	const entities = [];
	const entityCount = 100;

	for (let i = 0; i < entityCount; i++) {
		const entity = new ClassEntity(`entity${i}`, `Entity${i}`);
		entity.moduleId = `module${i % 10}`;

		// Add references to other entities
		entity.getAllJSDocTags = () => [
			{
				tagType: "see",
				reference: `Entity${(i + 1) % entityCount}`,
			},
			{
				tagType: "param",
				name: "related",
				type: `Entity${(i + 2) % entityCount}|Entity${(i + 3) % entityCount}`,
			},
		];

		entities.push(entity);
		graph.addEntity(entity);
	}

	const startTime = Date.now();
	buildEntityReferences(graph);
	const endTime = Date.now();

	// Should complete reasonably quickly (< 1 second for 100 entities)
	const duration = endTime - startTime;
	ok(
		duration < 1000,
		`Performance test took ${duration}ms, should be < 1000ms`,
	);

	// Verify references were created
	let totalReferences = 0;
	for (const entity of entities) {
		const references = graph.getReferences(entity.getId());
		totalReferences += references.length;
	}

	ok(totalReferences > 0, "Should have created references");
	ok(
		totalReferences < entityCount * 10,
		"Should not have excessive references",
	);
});

test("Integration: Reference accuracy validation", () => {
	const packageData = { name: "@test/accuracy", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create precise test case
	const targetClass = new ClassEntity("TargetClass", "TargetClass");
	targetClass.moduleId = "target";

	const similarClass = new ClassEntity(
		"TargetClassSimilar",
		"TargetClassSimilar",
	);
	similarClass.moduleId = "similar";

	const sourceFunction = new FunctionEntity("source", "sourceFunction");
	sourceFunction.moduleId = "source";
	sourceFunction.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "target",
			type: "TargetClass", // Should reference exact match, not similar
		},
		{
			tagType: "see",
			reference: "TargetClass.method", // Should reference the class
		},
	];

	graph.addEntity(targetClass);
	graph.addEntity(similarClass);
	graph.addEntity(sourceFunction);

	buildEntityReferences(graph);

	const references = graph.getReferences(sourceFunction.getId());

	// Should reference the exact class, not the similar one
	const targetReferences = references.filter((ref) =>
		ref.includes("TargetClass"),
	);
	const similarReferences = references.filter((ref) =>
		ref.includes("TargetClassSimilar"),
	);

	ok(targetReferences.length > 0, "Should reference target class");
	strictEqual(
		similarReferences.length,
		0,
		"Should not reference similar class",
	);
});

test("Integration: Reference completeness verification", () => {
	const packageData = { name: "@test/completeness", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create comprehensive test case
	const userClass = new ClassEntity("User", "User");
	userClass.moduleId = "user";

	const errorClass = new ClassEntity("UserError", "UserError");
	errorClass.moduleId = "error";

	const serviceFunction = new FunctionEntity("service", "userService");
	serviceFunction.moduleId = "service";
	serviceFunction.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "user",
			type: "User",
		},
		{
			tagType: "param",
			name: "options",
			type: "{timeout: number, validate: boolean}",
		},
		{
			tagType: "returns",
			type: "Promise<User|UserError>",
		},
		{
			tagType: "see",
			reference: "User",
		},
		{
			tagType: "see",
			reference: "UserError",
		},
	];

	graph.addEntity(userClass);
	graph.addEntity(errorClass);
	graph.addEntity(serviceFunction);

	buildEntityReferences(graph);

	const references = graph.getReferences(serviceFunction.getId());

	// Should have references from all sources
	const userReferences = references.filter((ref) => ref.includes("User"));
	const errorReferences = references.filter((ref) => ref.includes("UserError"));

	// Should have references to User (param, returns, see - deduplicated to 1)
	ok(
		userReferences.length >= 1,
		`Expected >= 1 User reference, got ${userReferences.length}`,
	);

	// Should have references to UserError (returns, see - deduplicated to 1)
	ok(
		errorReferences.length >= 1,
		`Expected >= 1 UserError reference, got ${errorReferences.length}`,
	);
});

test("Integration: Bidirectional reference validation", () => {
	const packageData = { name: "@test/bidirectional", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const classA = new ClassEntity("ClassA", "ClassA");
	classA.moduleId = "moduleA";
	classA.getAllJSDocTags = () => [
		{
			tagType: "see",
			reference: "ClassB",
		},
	];

	const classB = new ClassEntity("ClassB", "ClassB");
	classB.moduleId = "moduleB";
	classB.getAllJSDocTags = () => [
		{
			tagType: "see",
			reference: "ClassA",
		},
	];

	graph.addEntity(classA);
	graph.addEntity(classB);

	buildEntityReferences(graph);

	// Check A -> B references
	const aReferences = graph.getReferences(classA.getId());
	ok(aReferences.some((ref) => ref.includes("ClassB")));

	// Check B -> A references
	const bReferences = graph.getReferences(classB.getId());
	ok(bReferences.some((ref) => ref.includes("ClassA")));

	// Check reverse references (what references A and B)
	const aReferencedBy = graph.getReferencedBy(classA.getId());
	const bReferencedBy = graph.getReferencedBy(classB.getId());

	ok(bReferencedBy.some((ref) => ref.includes("ClassA")));
	ok(aReferencedBy.some((ref) => ref.includes("ClassB")));
});
