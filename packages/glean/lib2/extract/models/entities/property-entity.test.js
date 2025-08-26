/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { PropertyEntity } from "./property-entity.js";

describe("PropertyEntity", () => {
	const mockLocation = { file: "test.js", line: 5, column: 0 };

	describe("Constructor and basic properties", () => {
		it("should create property entity with correct defaults", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);

			assert.strictEqual(entity.entityType, "property");
			assert.strictEqual(entity.name, "testProperty");
			assert.strictEqual(entity.location, mockLocation);
			assert.strictEqual(entity.isStatic, false);
			assert.strictEqual(entity.isPrivate, false);
			assert.strictEqual(entity.isReadonly, false);
			assert.strictEqual(entity.hasInitializer, false);
			assert.strictEqual(entity.initializer, null);
			assert.strictEqual(entity.inferredType, "unknown");
			assert.strictEqual(entity.parentClass, null);
			assert.strictEqual(entity.signature, "");
			assert.strictEqual(entity.accessModifier, "public");
		});
	});

	describe("Property type detection", () => {
		it("should detect instance property", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = 'value';";

			entity.parseContent(source);

			assert.strictEqual(entity.isStatic, false);
			assert.strictEqual(entity.isPrivate, false);
			assert.strictEqual(entity.hasInitializer, true);
		});

		it("should detect static property", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "static testProperty = 'value';";

			entity.parseContent(source);

			assert.strictEqual(entity.isStatic, true);
			assert.strictEqual(entity.isPrivate, false);
		});

		it("should detect private property", () => {
			const entity = new PropertyEntity("#privateProperty", mockLocation);
			const source = "#privateProperty = 'private';";

			entity.parseContent(source);

			assert.strictEqual(entity.isPrivate, true);
			assert.strictEqual(entity.isStatic, false);
		});

		it("should detect static private property", () => {
			const entity = new PropertyEntity("#staticPrivate", mockLocation);
			const source = "static #staticPrivate = 'value';";

			entity.parseContent(source);

			assert.strictEqual(entity.isStatic, true);
			assert.strictEqual(entity.isPrivate, true);
		});

		it("should detect readonly property", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "readonly testProperty = 'value';";

			entity.parseContent(source);

			assert.strictEqual(entity.isReadonly, true);
		});

		it("should detect declared property without initializer", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty;";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, false);
			assert.strictEqual(entity.initializer, null);
		});
	});

	describe("Initializer detection and type inference", () => {
		it("should detect string initializer", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = 'hello world';";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "'hello world'");
			assert.strictEqual(entity.inferredType, "string");
		});

		it("should detect number initializer", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = 42;";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "42");
			assert.strictEqual(entity.inferredType, "number");
		});

		it("should detect boolean initializer", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = true;";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "true");
			assert.strictEqual(entity.inferredType, "boolean");
		});

		it("should detect array initializer", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = [1, 2, 3];";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "[1, 2, 3]");
			assert.strictEqual(entity.inferredType, "Array");
		});

		it("should detect object initializer", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = { x: 1, y: 2 };";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "{ x: 1, y: 2 }");
			assert.strictEqual(entity.inferredType, "Object");
		});

		it("should detect function initializer", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = function() { return 42; };";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "function() { return 42");
			assert.strictEqual(entity.inferredType, "unknown");
		});

		it("should detect arrow function initializer", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = () => 42;";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "() => 42");
			assert.strictEqual(entity.inferredType, "Function");
		});

		it("should detect null initializer", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = null;";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "null");
			assert.strictEqual(entity.inferredType, "null");
		});

		it("should detect undefined initializer", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = undefined;";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "undefined");
			assert.strictEqual(entity.inferredType, "undefined");
		});

		it("should handle complex nested initializers", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source =
				"testProperty = { nested: { deep: [1, 2, { x: 'value' }] } };";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.inferredType, "Object");
		});
	});

	describe("Access modifier detection", () => {
		it("should detect public property", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = 'value';";

			entity.parseContent(source);

			assert.strictEqual(entity.accessModifier, "public");
		});

		it("should detect private property", () => {
			const entity = new PropertyEntity("#privateProperty", mockLocation);
			const source = "#privateProperty = 'value';";

			entity.parseContent(source);

			assert.strictEqual(entity.accessModifier, "private");
		});

		it("should detect protected property (TypeScript)", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "protected testProperty = 'value';";

			entity.parseContent(source);

			assert.strictEqual(entity.accessModifier, "protected");
		});
	});

	describe("Parent class detection", () => {
		it("should detect parent class from context", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			entity.parentClass = "TestClass";

			assert.strictEqual(entity.parentClass, "TestClass");
		});

		it("should handle property without parent class", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);

			assert.strictEqual(entity.parentClass, null);
		});
	});

	describe("Signature extraction", () => {
		it("should extract property signature", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = 'value';";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "testProperty = 'value';");
		});

		it("should extract static property signature", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "static testProperty = 42;";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "static testProperty = 42;");
		});

		it("should extract private property signature", () => {
			const entity = new PropertyEntity("#privateProperty", mockLocation);
			const source = "#privateProperty = 'private';";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "#privateProperty = 'private';");
		});

		it("should extract declared property signature", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty;";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "testProperty;");
		});

		it("should extract readonly property signature", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "readonly testProperty = 'value';";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "readonly testProperty = 'value';");
		});
	});

	describe("Edge cases and error handling", () => {
		it("should handle empty source code", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);

			entity.parseContent("");

			assert.strictEqual(entity.source, "");
			assert.strictEqual(entity.hasInitializer, false);
		});

		it("should handle null source code", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);

			entity.parseContent(null);

			assert.strictEqual(entity.source, "");
		});

		it("should handle undefined source code", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);

			entity.parseContent(undefined);

			assert.strictEqual(entity.source, "");
		});

		it("should handle malformed property syntax", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = ; // malformed";

			entity.parseContent(source);

			// Should not crash
			assert.strictEqual(entity.source, source);
		});

		it("should handle very long property names", () => {
			const longName = "a".repeat(200);
			const entity = new PropertyEntity(longName, mockLocation);
			const source = `${longName} = 'value';`;

			entity.parseContent(source);

			assert.strictEqual(entity.name, longName);
		});

		it("should handle complex nested objects", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = `testProperty = {
				level1: {
					level2: {
						array: [1, 2, { nested: true }],
						func: () => ({ result: 'deep' })
					}
				}
			};`;

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, false);
			assert.strictEqual(entity.inferredType, "unknown");
		});

		it("should handle template literals", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = `hello $" + "{world}`;";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.inferredType, "string");
		});

		it("should handle regex literals", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = /test/gi;";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.inferredType, "unknown");
		});

		it("should handle unicode property names", () => {
			const entity = new PropertyEntity("属性", mockLocation);
			const source = "属性 = 'unicode';";

			entity.parseContent(source);

			assert.strictEqual(entity.name, "属性");
			assert.strictEqual(entity.hasInitializer, true);
		});

		it("should handle class field syntax", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = 'field value';";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "'field value'");
		});

		it("should handle computed property names", () => {
			const entity = new PropertyEntity("[computedKey]", mockLocation);
			const source = "[computedKey] = 'computed';";

			entity.parseContent(source);

			assert.strictEqual(entity.name, "[computedKey]");
		});
	});

	describe("Validation", () => {
		it("should validate correct property entity", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty = 'value';";

			entity.parseContent(source);
			entity.validate();

			assert.strictEqual(entity.isValidated, true);
		});

		it("should fail validation with empty name", () => {
			const entity = new PropertyEntity("", mockLocation);

			entity.validate();

			assert.strictEqual(entity.isValidated, false);
		});

		it("should validate property without initializer", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "testProperty;";

			entity.parseContent(source);
			entity.validate();

			assert.strictEqual(entity.isValidated, true);
		});
	});

	describe("JSDoc tag validation", () => {
		it("should accept valid property tags", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("type"), true);
			assert.strictEqual(entity.isValidJSDocTag("default"), true);
			assert.strictEqual(entity.isValidJSDocTag("readonly"), true);
			assert.strictEqual(entity.isValidJSDocTag("static"), true);
			assert.strictEqual(entity.isValidJSDocTag("private"), true);
			assert.strictEqual(entity.isValidJSDocTag("protected"), true);
		});

		it("should accept common tags", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("author"), true);
			assert.strictEqual(entity.isValidJSDocTag("since"), true);
			assert.strictEqual(entity.isValidJSDocTag("example"), true);
		});

		it("should reject invalid tags", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("param"), false);
			assert.strictEqual(entity.isValidJSDocTag("returns"), false);
			assert.strictEqual(entity.isValidJSDocTag("throws"), false);
			assert.strictEqual(entity.isValidJSDocTag("invalid"), false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to object correctly", () => {
			const entity = new PropertyEntity("testProperty", mockLocation);
			const source = "static #privateProperty = { x: 1, y: 2 };";

			entity.parseContent(source);
			entity.setDescription("Test property");
			entity.setModuleId("test/module");
			entity.parentClass = "TestClass";

			const obj = entity.toObject();

			assert.strictEqual(obj.entityType, "property");
			assert.strictEqual(obj.name, "testProperty");
			assert.strictEqual(obj.isStatic, true);
			assert.strictEqual(obj.isPrivate, true);
			assert.strictEqual(obj.hasInitializer, true);
			assert.strictEqual(obj.inferredType, "Object");
			assert.strictEqual(obj.parentClass, "TestClass");
			assert.strictEqual(obj.description, "Test property");
			assert.strictEqual(obj.moduleId, "test/module");
		});
	});
});
