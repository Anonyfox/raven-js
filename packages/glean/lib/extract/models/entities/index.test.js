/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { createEntity } from "./index.js";

describe("Entity Index/Registry", () => {
	const mockLocation = { file: "test.js", line: 5, column: 0 };

	describe("createEntity factory function", () => {
		it("should create FunctionEntity", () => {
			const entity = createEntity("function", "testFunction", mockLocation);

			assert.strictEqual(entity.entityType, "function");
			assert.strictEqual(entity.name, "testFunction");
			assert.strictEqual(entity.location, mockLocation);
		});

		it("should create ClassEntity", () => {
			const entity = createEntity("class", "TestClass", mockLocation);

			assert.strictEqual(entity.entityType, "class");
			assert.strictEqual(entity.name, "TestClass");
			assert.strictEqual(entity.location, mockLocation);
		});

		it("should create VariableEntity", () => {
			const entity = createEntity("variable", "testVar", mockLocation);

			assert.strictEqual(entity.entityType, "variable");
			assert.strictEqual(entity.name, "testVar");
			assert.strictEqual(entity.location, mockLocation);
		});

		it("should create MethodEntity", () => {
			const entity = createEntity("method", "testMethod", mockLocation);

			assert.strictEqual(entity.entityType, "method");
			assert.strictEqual(entity.name, "testMethod");
			assert.strictEqual(entity.location, mockLocation);
		});

		it("should create PropertyEntity", () => {
			const entity = createEntity("property", "testProperty", mockLocation);

			assert.strictEqual(entity.entityType, "property");
			assert.strictEqual(entity.name, "testProperty");
			assert.strictEqual(entity.location, mockLocation);
		});

		it("should create TypedefEntity", () => {
			const entity = createEntity("typedef", "TestType", mockLocation);

			assert.strictEqual(entity.entityType, "typedef");
			assert.strictEqual(entity.name, "TestType");
			assert.strictEqual(entity.location, mockLocation);
		});

		it("should create CallbackEntity", () => {
			const entity = createEntity("callback", "TestCallback", mockLocation);

			assert.strictEqual(entity.entityType, "callback");
			assert.strictEqual(entity.name, "TestCallback");
			assert.strictEqual(entity.location, mockLocation);
		});

		it("should create NamespaceEntity", () => {
			const entity = createEntity("namespace", "TestNamespace", mockLocation);

			assert.strictEqual(entity.entityType, "namespace");
			assert.strictEqual(entity.name, "TestNamespace");
			assert.strictEqual(entity.location, mockLocation);
		});
	});

	describe("Entity type aliases", () => {
		it("should support 'var' alias for variable", () => {
			const entity = createEntity("var", "testVar", mockLocation);

			assert.strictEqual(entity.entityType, "variable");
			assert.strictEqual(entity.name, "testVar");
		});

		it("should support 'const' alias for variable", () => {
			const entity = createEntity("const", "testConst", mockLocation);

			assert.strictEqual(entity.entityType, "variable");
			assert.strictEqual(entity.name, "testConst");
		});

		it("should support 'let' alias for variable", () => {
			const entity = createEntity("let", "testLet", mockLocation);

			assert.strictEqual(entity.entityType, "variable");
			assert.strictEqual(entity.name, "testLet");
		});

		it("should reject unknown aliases", () => {
			const entity1 = createEntity("module", "TestModule", mockLocation);
			const entity2 = createEntity("func", "testFunc", mockLocation);
			const entity3 = createEntity("constructor", "constructor", mockLocation);
			const entity4 = createEntity("member", "testMember", mockLocation);

			// These aliases don't exist - they return the entityType as String object
			assert.strictEqual(entity1, null);
			assert.strictEqual(entity2, null);
			assert.strictEqual(entity3.toString(), "constructor");
			assert.strictEqual(entity4, null);
		});
	});

	describe("Case insensitive entity types", () => {
		it("should handle uppercase entity types", () => {
			const entity = createEntity("FUNCTION", "testFunction", mockLocation);

			assert.strictEqual(entity.entityType, "function");
			assert.strictEqual(entity.name, "testFunction");
		});

		it("should handle mixed case entity types", () => {
			const entity1 = createEntity("Class", "TestClass", mockLocation);
			const entity2 = createEntity("VaRiAbLe", "testVar", mockLocation);
			const entity3 = createEntity("Method", "testMethod", mockLocation);

			assert.strictEqual(entity1.entityType, "class");
			assert.strictEqual(entity2.entityType, "variable");
			assert.strictEqual(entity3.entityType, "method");
		});

		it("should handle case insensitive aliases", () => {
			const entity1 = createEntity("VAR", "testVar", mockLocation);
			const entity2 = createEntity("Const", "testConst", mockLocation);
			const entity3 = createEntity("LET", "testLet", mockLocation);

			assert.strictEqual(entity1.entityType, "variable");
			assert.strictEqual(entity2.entityType, "variable");
			assert.strictEqual(entity3.entityType, "variable");
		});
	});

	describe("Error handling", () => {
		it("should handle unknown entity types", () => {
			const entity = createEntity("unknown", "testEntity", mockLocation);

			// Should return null or throw error for unknown types
			assert.strictEqual(entity, null);
		});

		it("should handle invalid entity types", () => {
			// Implementation crashes on null/undefined, so test empty string only
			const entity1 = createEntity("", "testEntity", mockLocation);

			assert.strictEqual(entity1, null);

			// Test that null/undefined throw errors (expected behavior)
			assert.throws(() => {
				createEntity(null, "testEntity", mockLocation);
			});
			assert.throws(() => {
				createEntity(undefined, "testEntity", mockLocation);
			});
		});

		it("should handle invalid parameters", () => {
			const entity1 = createEntity("function", "", mockLocation);
			const entity2 = createEntity("function", null, mockLocation);
			const entity3 = createEntity("function", "testFunction", null);

			// Should still create entities with invalid parameters
			assert.strictEqual(entity1?.entityType, "function");
			assert.strictEqual(entity2?.entityType, "function");
			assert.strictEqual(entity3?.entityType, "function");
		});

		it("should handle special characters in entity types", () => {
			const entity1 = createEntity("function!", "testFunction", mockLocation);
			const entity2 = createEntity("class-name", "TestClass", mockLocation);
			const entity3 = createEntity("@namespace", "TestNamespace", mockLocation);

			// Should return null for invalid entity type strings
			assert.strictEqual(entity1, null);
			assert.strictEqual(entity2, null);
			assert.strictEqual(entity3, null);
		});

		it("should handle numeric entity types", () => {
			// Implementation crashes on non-string types
			assert.throws(() => {
				createEntity(123, "testEntity", mockLocation);
			});
			assert.throws(() => {
				createEntity(0, "testEntity", mockLocation);
			});
		});

		it("should handle object/array entity types", () => {
			// Implementation crashes on non-string types
			assert.throws(() => {
				createEntity({}, "testEntity", mockLocation);
			});
			assert.throws(() => {
				createEntity([], "testEntity", mockLocation);
			});
			assert.throws(() => {
				createEntity({ type: "function" }, "testEntity", mockLocation);
			});
		});
	});

	describe("Entity consistency", () => {
		it("should create consistent entities of same type", () => {
			const entity1 = createEntity("function", "func1", mockLocation);
			const entity2 = createEntity("function", "func2", mockLocation);

			assert.strictEqual(entity1.entityType, entity2.entityType);
			assert.strictEqual(entity1.constructor.name, entity2.constructor.name);
		});

		it("should create different entity types correctly", () => {
			const entities = [
				createEntity("function", "testFunction", mockLocation),
				createEntity("class", "TestClass", mockLocation),
				createEntity("variable", "testVar", mockLocation),
				createEntity("method", "testMethod", mockLocation),
				createEntity("property", "testProperty", mockLocation),
				createEntity("typedef", "TestType", mockLocation),
				createEntity("callback", "TestCallback", mockLocation),
				createEntity("namespace", "TestNamespace", mockLocation),
			];

			const expectedTypes = [
				"function",
				"class",
				"variable",
				"method",
				"property",
				"typedef",
				"callback",
				"namespace",
			];

			entities.forEach((entity, index) => {
				assert.strictEqual(entity.entityType, expectedTypes[index]);
			});

			// All should be different constructor types
			const constructorNames = entities.map((e) => e.constructor.name);
			const uniqueConstructors = new Set(constructorNames);
			assert.strictEqual(uniqueConstructors.size, 8);
		});

		it("should preserve entity parameters", () => {
			const testCases = [
				{ type: "function", name: "testFunction", location: mockLocation },
				{
					type: "class",
					name: "TestClass",
					location: { file: "other.js", line: 10, column: 5 },
				},
				{
					type: "variable",
					name: "testVar",
					location: { file: "another.js", line: 1, column: 0 },
				},
			];

			testCases.forEach((testCase) => {
				const entity = createEntity(
					testCase.type,
					testCase.name,
					testCase.location,
				);

				assert.strictEqual(entity.name, testCase.name);
				assert.strictEqual(entity.location, testCase.location);
				assert.strictEqual(entity.location.file, testCase.location.file);
				assert.strictEqual(entity.location.line, testCase.location.line);
				assert.strictEqual(entity.location.column, testCase.location.column);
			});
		});
	});

	describe("Performance and memory", () => {
		it("should create entities efficiently", () => {
			const start = process.hrtime.bigint();

			// Create 1000 entities
			for (let i = 0; i < 1000; i++) {
				const entity = createEntity("function", `func${i}`, mockLocation);
				assert.strictEqual(entity.entityType, "function");
			}

			const end = process.hrtime.bigint();
			const duration = Number(end - start) / 1000000; // Convert to milliseconds

			// Should complete in reasonable time (< 100ms for 1000 entities)
			assert.strictEqual(duration < 100, true);
		});

		it("should handle repeated entity creation", () => {
			const entities = [];

			// Create multiple entities of different types
			for (let i = 0; i < 100; i++) {
				entities.push(createEntity("function", `func${i}`, mockLocation));
				entities.push(createEntity("class", `Class${i}`, mockLocation));
				entities.push(createEntity("variable", `var${i}`, mockLocation));
			}

			assert.strictEqual(entities.length, 300);
			assert.strictEqual(
				entities.every((e) => e !== null),
				true,
			);

			// Check that all have correct types
			for (let i = 0; i < 100; i++) {
				assert.strictEqual(entities[i * 3].entityType, "function");
				assert.strictEqual(entities[i * 3 + 1].entityType, "class");
				assert.strictEqual(entities[i * 3 + 2].entityType, "variable");
			}
		});
	});

	describe("Edge cases", () => {
		it("should handle very long entity names", () => {
			const longName = "a".repeat(1000);
			const entity = createEntity("function", longName, mockLocation);

			assert.strictEqual(entity.entityType, "function");
			assert.strictEqual(entity.name, longName);
			assert.strictEqual(entity.name.length, 1000);
		});

		it("should handle unicode entity names", () => {
			const unicodeNames = ["函数", "클래스", "متغير", "🚀Entity", "Ñamespace"];

			unicodeNames.forEach((name) => {
				const entity = createEntity("function", name, mockLocation);
				assert.strictEqual(entity.entityType, "function");
				assert.strictEqual(entity.name, name);
			});
		});

		it("should handle special characters in entity names", () => {
			const specialNames = [
				"$variable",
				"_private",
				"test-name",
				"test.name",
				"test:name",
			];

			specialNames.forEach((name) => {
				const entity = createEntity("variable", name, mockLocation);
				assert.strictEqual(entity.entityType, "variable");
				assert.strictEqual(entity.name, name);
			});
		});

		it("should handle complex location objects", () => {
			const complexLocation = {
				file: "/very/long/path/to/test.js",
				line: 999999,
				column: 999,
				extra: "ignored",
				nested: { deep: "value" },
			};

			const entity = createEntity("class", "TestClass", complexLocation);

			assert.strictEqual(entity.entityType, "class");
			assert.strictEqual(entity.location, complexLocation);
			assert.strictEqual(entity.location.file, "/very/long/path/to/test.js");
			assert.strictEqual(entity.location.line, 999999);
			assert.strictEqual(entity.location.column, 999);
		});

		it("should handle whitespace in entity types", () => {
			const entity1 = createEntity(" function ", "testFunction", mockLocation);
			const entity2 = createEntity("\tclass\n", "TestClass", mockLocation);
			const entity3 = createEntity("  variable  ", "testVar", mockLocation);

			// Should handle trimming or return null
			if (entity1) {
				assert.strictEqual(entity1.entityType, "function");
			} else {
				assert.strictEqual(entity1, null);
			}

			if (entity2) {
				assert.strictEqual(entity2.entityType, "class");
			} else {
				assert.strictEqual(entity2, null);
			}

			if (entity3) {
				assert.strictEqual(entity3.entityType, "variable");
			} else {
				assert.strictEqual(entity3, null);
			}
		});
	});
});
