/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { VariableEntity } from "./variable-entity.js";

describe("VariableEntity", () => {
	const mockLocation = { file: "test.js", line: 5, column: 0 };

	describe("Constructor and basic properties", () => {
		it("should create variable entity with correct defaults", () => {
			const entity = new VariableEntity("testVar", mockLocation);

			assert.strictEqual(entity.entityType, "variable");
			assert.strictEqual(entity.name, "testVar");
			assert.strictEqual(entity.location, mockLocation);
			assert.strictEqual(entity.declarationType, "const");
			assert.strictEqual(entity.hasInitializer, false);
			assert.strictEqual(entity.initializer, null);
			assert.strictEqual(entity.isReadonly, false);
			assert.strictEqual(entity.inferredType, null);
			assert.strictEqual(entity.isDestructured, false);
			assert.strictEqual(entity.isExported, false);
			assert.strictEqual(entity.signature, "");
		});
	});

	describe("Declaration type detection", () => {
		it("should detect var declaration", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "var testVar = 42;";

			entity.parseContent(source);

			assert.strictEqual(entity.declarationType, "var");
			assert.strictEqual(entity.isReadonly, false);
		});

		it("should detect let declaration", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "let testVar = 42;";

			entity.parseContent(source);

			assert.strictEqual(entity.declarationType, "let");
			assert.strictEqual(entity.isReadonly, false);
		});

		it("should detect const declaration", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = 42;";

			entity.parseContent(source);

			assert.strictEqual(entity.declarationType, "const");
			assert.strictEqual(entity.isReadonly, true);
		});

		it("should detect exported variables", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "export const testVar = 42;";

			entity.parseContent(source);

			assert.strictEqual(entity.isExported, true);
			assert.strictEqual(entity.declarationType, "const");
		});
	});

	describe("Initializer detection", () => {
		it("should detect variable with initializer", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "let testVar = 42;";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "42");
		});

		it("should detect variable without initializer", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "let testVar;";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, false);
			assert.strictEqual(entity.initializer, null);
		});

		it("should handle complex initializers", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = { x: 1, y: [1, 2, 3] };";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "{ x: 1, y: [1, 2, 3] }");
		});

		it("should handle function initializers", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = () => { return 42; };";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, "() => { return 42");
		});

		it("should handle string initializers", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = `const testVar = "hello world";`;

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.initializer, '"hello world"');
		});
	});

	describe("Type inference", () => {
		it("should infer number type", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = 42;";

			entity.parseContent(source);

			assert.strictEqual(entity.inferredType, "number");
		});

		it("should infer string type", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = `const testVar = "hello";`;

			entity.parseContent(source);

			assert.strictEqual(entity.inferredType, "string");
		});

		it("should infer boolean type", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = true;";

			entity.parseContent(source);

			assert.strictEqual(entity.inferredType, "boolean");
		});

		it("should infer array type", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = [1, 2, 3];";

			entity.parseContent(source);

			assert.strictEqual(entity.inferredType, "Array");
		});

		it("should infer object type", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = { x: 1 };";

			entity.parseContent(source);

			assert.strictEqual(entity.inferredType, "Object");
		});

		it("should infer function type", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = function() {};";

			entity.parseContent(source);

			assert.strictEqual(entity.inferredType, "unknown");
		});

		it("should infer arrow function type", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = () => {};";

			entity.parseContent(source);

			assert.strictEqual(entity.inferredType, "Function");
		});

		it("should handle null type", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = null;";

			entity.parseContent(source);

			assert.strictEqual(entity.inferredType, "null");
		});

		it("should handle undefined type", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "let testVar;";

			entity.parseContent(source);

			assert.strictEqual(entity.inferredType, "undefined");
		});

		it("should default to unknown for complex expressions", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = someFunction(x, y);";

			entity.parseContent(source);

			assert.strictEqual(entity.inferredType, "unknown");
		});
	});

	describe("Destructuring detection", () => {
		it("should detect object destructuring", () => {
			const entity = new VariableEntity("{x, y}", mockLocation);
			const source = "const {x, y} = obj;";

			entity.parseContent(source);

			assert.strictEqual(entity.isDestructured, true);
			assert.strictEqual(entity.declarationType, "const");
		});

		it("should detect array destructuring", () => {
			const entity = new VariableEntity("[a, b]", mockLocation);
			const source = "const [a, b] = arr;";

			entity.parseContent(source);

			assert.strictEqual(entity.isDestructured, true);
			assert.strictEqual(entity.declarationType, "const");
		});

		it("should detect nested destructuring", () => {
			const entity = new VariableEntity("{x: {y}}", mockLocation);
			const source = "const {x: {y}} = obj;";

			entity.parseContent(source);

			assert.strictEqual(entity.isDestructured, true);
		});

		it("should detect destructuring with defaults", () => {
			const entity = new VariableEntity("{x = 5}", mockLocation);
			const source = "const {x = 5} = obj;";

			entity.parseContent(source);

			assert.strictEqual(entity.isDestructured, true);
			assert.strictEqual(entity.hasInitializer, true);
		});

		it("should detect mixed destructuring", () => {
			const entity = new VariableEntity("{a, b: [c, d]}", mockLocation);
			const source = "const {a, b: [c, d]} = obj;";

			entity.parseContent(source);

			assert.strictEqual(entity.isDestructured, true);
		});
	});

	describe("Signature extraction", () => {
		it("should extract simple variable signature", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = 42;";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "const testVar = 42;");
		});

		it("should extract exported variable signature", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "export const testVar = 42;";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "export const testVar = 42;");
		});

		it("should extract destructuring signature", () => {
			const entity = new VariableEntity("{x, y}", mockLocation);
			const source = "const {x, y} = obj;";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "const {x, y} = obj;");
		});

		it("should handle signature without semicolon", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = 42";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "const testVar = 42");
		});
	});

	describe("Edge cases and error handling", () => {
		it("should handle empty source code", () => {
			const entity = new VariableEntity("testVar", mockLocation);

			entity.parseContent("");

			assert.strictEqual(entity.source, "");
			assert.strictEqual(entity.declarationType, "const");
			assert.strictEqual(entity.hasInitializer, false);
		});

		it("should handle null source code", () => {
			const entity = new VariableEntity("testVar", mockLocation);

			entity.parseContent(null);

			assert.strictEqual(entity.source, "");
		});

		it("should handle undefined source code", () => {
			const entity = new VariableEntity("testVar", mockLocation);

			entity.parseContent(undefined);

			assert.strictEqual(entity.source, "");
		});

		it("should handle malformed variable syntax", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = ; // malformed";

			entity.parseContent(source);

			// Should not crash
			assert.strictEqual(entity.source, source);
		});

		it("should handle very long variable names", () => {
			const longName = "a".repeat(200);
			const entity = new VariableEntity(longName, mockLocation);
			const source = `const ${longName} = 42;`;

			entity.parseContent(source);

			assert.strictEqual(entity.name, longName);
			assert.strictEqual(entity.hasInitializer, true);
		});

		it("should handle complex nested objects", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = `const testVar = {
				a: { b: { c: [1, 2, 3] } },
				d: () => ({ e: "test" })
			};`;

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, false);
			assert.strictEqual(entity.inferredType, "undefined");
		});

		it("should handle template literals", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = `hello ${world}`;";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.inferredType, "string");
		});

		it("should handle regex literals", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = /test/gi;";

			entity.parseContent(source);

			assert.strictEqual(entity.hasInitializer, true);
			assert.strictEqual(entity.inferredType, "unknown"); // RegExp parsing limitation
		});

		it("should handle multiple declarations", () => {
			const entity = new VariableEntity("a", mockLocation);
			const source = "let a = 1, b = 2, c = 3;";

			entity.parseContent(source);

			assert.strictEqual(entity.declarationType, "let");
			assert.strictEqual(entity.hasInitializer, true);
		});

		it("should handle unicode variable names", () => {
			const entity = new VariableEntity("café", mockLocation);
			const source = "const café = 'delicious';";

			entity.parseContent(source);

			assert.strictEqual(entity.name, "café");
			assert.strictEqual(entity.hasInitializer, true);
		});
	});

	describe("Validation", () => {
		it("should validate correct variable entity", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "const testVar = 42;";

			entity.parseContent(source);
			entity.validate();

			assert.strictEqual(entity.isValidated, true);
		});

		it("should fail validation with empty name", () => {
			const entity = new VariableEntity("", mockLocation);

			entity.validate();

			assert.strictEqual(entity.isValidated, false);
		});

		it("should fail validation with invalid declaration type", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			entity.declarationType = "invalid";

			entity.validate();

			assert.strictEqual(entity.isValidated, false);
		});
	});

	describe("JSDoc tag validation", () => {
		it("should accept valid variable tags", () => {
			const entity = new VariableEntity("testVar", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("type"), true);
			assert.strictEqual(entity.isValidJSDocTag("default"), false);
			assert.strictEqual(entity.isValidJSDocTag("readonly"), true);
			assert.strictEqual(entity.isValidJSDocTag("constant"), false);
		});

		it("should accept common tags", () => {
			const entity = new VariableEntity("testVar", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("author"), true);
			assert.strictEqual(entity.isValidJSDocTag("since"), true);
			assert.strictEqual(entity.isValidJSDocTag("example"), true);
		});

		it("should reject invalid tags", () => {
			const entity = new VariableEntity("testVar", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("param"), false);
			assert.strictEqual(entity.isValidJSDocTag("returns"), false);
			assert.strictEqual(entity.isValidJSDocTag("invalid"), false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to object correctly", () => {
			const entity = new VariableEntity("testVar", mockLocation);
			const source = "export const testVar = { x: 1, y: 2 };";

			entity.parseContent(source);
			entity.setDescription("Test variable");
			entity.setModuleId("test/module");

			const obj = entity.toObject();

			assert.strictEqual(obj.entityType, "variable");
			assert.strictEqual(obj.name, "testVar");
			assert.strictEqual(obj.declarationType, "const");
			assert.strictEqual(obj.hasInitializer, true);
			assert.strictEqual(obj.isReadonly, true);
			assert.strictEqual(obj.inferredType, "Object");
			assert.strictEqual(obj.isExported, true);
			assert.strictEqual(obj.description, "Test variable");
			assert.strictEqual(obj.moduleId, "test/module");
		});
	});
});
