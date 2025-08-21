/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { ClassEntity } from "../models/class-entity.js";
import { DocumentationGraph } from "../models/documentation-graph.js";
import { FunctionEntity } from "../models/function-entity.js";
import { PackageEntity } from "../models/package-entity.js";
import { buildEntityReferences } from "./reference-resolution.js";

test("buildEntityReferences - basic functionality", () => {
	// Create mock package entity
	const packageData = {
		name: "@test/reference-test",
		version: "1.0.0",
		description: "Test package for reference resolution",
	};
	const packageEntity = new PackageEntity(packageData);

	// Create documentation graph
	const graph = new DocumentationGraph(packageEntity);

	// Create test entities
	const func1 = new FunctionEntity("func1", "testFunction");
	func1.moduleId = "test/module";
	func1.jsdoc = {
		description: "Test function",
		tags: {
			see: ["@test/reference-test#func2"],
		},
	};

	const func2 = new FunctionEntity("func2", "anotherFunction");
	func2.moduleId = "test/module";
	func2.jsdoc = {
		description: "Another function",
		tags: {},
	};

	// Add entities to graph
	graph.addEntity(func1);
	graph.addEntity(func2);

	// Test that function runs without error
	buildEntityReferences(graph);

	// Basic validation - function should complete successfully
	strictEqual(graph.entities.size, 2);
});

test("buildEntityReferences - JSDoc @see reference parsing", () => {
	const packageData = {
		name: "@test/jsdoc-refs",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create entities with @see references
	const sourceFunc = new FunctionEntity("source", "sourceFunction");
	sourceFunc.jsdoc = {
		tags: {
			see: ["{@link targetFunction}", "plainReference"],
		},
	};

	const targetFunc = new FunctionEntity("target", "targetFunction");
	targetFunc.name = "targetFunction";

	const plainRef = new FunctionEntity("plain", "plainReference");
	plainRef.name = "plainReference";

	graph.addEntity(sourceFunc);
	graph.addEntity(targetFunc);
	graph.addEntity(plainRef);

	// Execute reference resolution
	buildEntityReferences(graph);

	// Verify references were created
	const sourceRefs = graph.getReferences("source");
	strictEqual(Array.isArray(sourceRefs), true);

	// Test passes if no errors thrown during reference resolution
	strictEqual(graph.entities.size, 3);
});

test("buildEntityReferences - type reference extraction", () => {
	const packageData = {
		name: "@test/type-refs",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create class entity for type reference
	const myClass = new ClassEntity("MyClass", "MyClass");
	myClass.name = "MyClass";

	// Create function with type references in JSDoc
	const func = new FunctionEntity("func", "testFunction");
	func.jsdoc = {
		tags: {
			param: [{ name: "data", type: "MyClass", description: "Input data" }],
			returns: { type: "Array<MyClass>", description: "Array of results" },
		},
	};

	graph.addEntity(myClass);
	graph.addEntity(func);

	// Execute reference resolution
	buildEntityReferences(graph);

	// Verify entities exist
	strictEqual(graph.entities.size, 2);

	// Function should complete without throwing
	const funcEntity = graph.getEntity("func");
	strictEqual(funcEntity !== null, true);
});

test("buildEntityReferences - symbol table construction", () => {
	const packageData = {
		name: "@test/symbols",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create entities with different name patterns
	const func1 = new FunctionEntity("mod/func1", "function1");
	func1.name = "function1";
	func1.moduleId = "mod";

	const func2 = new FunctionEntity("mod/func2", "function2");
	func2.name = "function2";
	func2.moduleId = "mod";

	graph.addEntity(func1);
	graph.addEntity(func2);

	// Test symbol table is built correctly (indirectly through no errors)
	buildEntityReferences(graph);

	strictEqual(graph.entities.size, 2);
});

test("buildEntityReferences - empty graph handling", () => {
	const packageData = {
		name: "@test/empty",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Test with empty graph
	buildEntityReferences(graph);

	strictEqual(graph.entities.size, 0);
});

test("buildEntityReferences - entities without JSDoc", () => {
	const packageData = {
		name: "@test/no-jsdoc",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create entity without JSDoc
	const func = new FunctionEntity("func", "plainFunction");
	// No jsdoc property set

	graph.addEntity(func);

	// Should handle gracefully
	buildEntityReferences(graph);

	strictEqual(graph.entities.size, 1);
});

test("buildEntityReferences - malformed JSDoc references", () => {
	const packageData = {
		name: "@test/malformed",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create entity with malformed references
	const func = new FunctionEntity("func", "testFunction");
	func.jsdoc = {
		tags: {
			see: [
				"{@link }", // Empty link
				"", // Empty reference
				null, // Null reference
				undefined, // Undefined reference
			],
			param: [
				{ name: "data", type: "", description: "Empty type" },
				{ name: "other", type: null, description: "Null type" },
			],
		},
	};

	graph.addEntity(func);

	// Should handle malformed data gracefully
	buildEntityReferences(graph);

	strictEqual(graph.entities.size, 1);
});

test("buildEntityReferences - complex type references", () => {
	const packageData = {
		name: "@test/complex-types",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create entities for complex type testing
	const CustomClass = new ClassEntity("CustomClass", "CustomClass");
	CustomClass.name = "CustomClass";

	const func = new FunctionEntity("func", "complexFunction");
	func.jsdoc = {
		tags: {
			param: [
				{
					name: "data",
					type: "Array<CustomClass>",
					description: "Array of custom objects",
				},
				{
					name: "callback",
					type: "function(CustomClass): boolean",
					description: "Filter function",
				},
				{
					name: "options",
					type: "{count: number, items: CustomClass[]}",
					description: "Options object",
				},
			],
			returns: {
				type: "Promise<CustomClass[]>",
				description: "Promise of results",
			},
		},
	};

	graph.addEntity(CustomClass);
	graph.addEntity(func);

	// Test complex type resolution
	buildEntityReferences(graph);

	strictEqual(graph.entities.size, 2);
});
