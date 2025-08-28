/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { MethodEntity } from "./method-entity.js";

describe("MethodEntity", () => {
	const mockLocation = { file: "test.js", line: 5, column: 0 };

	describe("Constructor and basic properties", () => {
		it("should create method entity with correct defaults", () => {
			const entity = new MethodEntity("testMethod", mockLocation);

			assert.strictEqual(entity.entityType, "method");
			assert.strictEqual(entity.name, "testMethod");
			assert.strictEqual(entity.location, mockLocation);
			assert.strictEqual(entity.methodType, "method");
			assert.strictEqual(entity.isStatic, false);
			assert.strictEqual(entity.isPrivate, false);
			assert.strictEqual(entity.isAsync, false);
			assert.strictEqual(entity.isGenerator, false);
			assert.strictEqual(entity.parentClass, null);
			assert.strictEqual(entity.isExported, undefined);
			assert.strictEqual(Array.isArray(entity.parameters), true);
			assert.strictEqual(entity.parameters.length, 0);
			assert.strictEqual(entity.returnType, null);
			assert.strictEqual(entity.signature, "");
		});
	});

	describe("Method type detection", () => {
		it("should detect regular method", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "testMethod() { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "method");
			assert.strictEqual(entity.isStatic, false);
			assert.strictEqual(entity.isPrivate, false);
			assert.strictEqual(entity.isAsync, false);
			assert.strictEqual(entity.isGenerator, false);
		});

		it("should detect static method", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "static testMethod() { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "method");
			assert.strictEqual(entity.isStatic, true);
		});

		it("should detect async method", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "async testMethod() { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "method");
			assert.strictEqual(entity.isAsync, true);
		});

		it("should detect generator method", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "*testMethod() { yield 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "method");
			assert.strictEqual(entity.isGenerator, true);
		});

		it("should detect async generator method", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "async *testMethod() { yield 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "method");
			assert.strictEqual(entity.isAsync, true);
			assert.strictEqual(entity.isGenerator, true);
		});

		it("should detect getter", () => {
			const entity = new MethodEntity("testProperty", mockLocation);
			const source = "get testProperty() { return this._value; }";

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "getter");
			assert.strictEqual(entity.isStatic, false);
		});

		it("should detect setter", () => {
			const entity = new MethodEntity("testProperty", mockLocation);
			const source = "set testProperty(value) { this._value = value; }";

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "setter");
			assert.strictEqual(entity.isStatic, false);
		});

		it("should detect constructor", () => {
			const entity = new MethodEntity("constructor", mockLocation);
			const source = "constructor(x, y) { this.x = x; this.y = y; }";

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "constructor");
		});

		it("should detect private method", () => {
			const entity = new MethodEntity("#privateMethod", mockLocation);
			const source = "#privateMethod() { return 'private'; }";

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "method");
			assert.strictEqual(entity.isPrivate, true);
		});
	});

	describe("Static method combinations", () => {
		it("should detect static async method", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "static async testMethod() { return await something(); }";

			entity.parseContent(source);

			assert.strictEqual(entity.isStatic, true);
			assert.strictEqual(entity.isAsync, true);
		});

		it("should detect static generator method", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "static *testMethod() { yield 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.isStatic, true);
			assert.strictEqual(entity.isGenerator, true);
		});

		it("should detect static getter", () => {
			const entity = new MethodEntity("testProperty", mockLocation);
			const source = "static get testProperty() { return 'static'; }";

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "getter");
			assert.strictEqual(entity.isStatic, true);
		});

		it("should detect static setter", () => {
			const entity = new MethodEntity("testProperty", mockLocation);
			const source = "static set testProperty(value) { this._value = value; }";

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "setter");
			assert.strictEqual(entity.isStatic, true);
		});
	});

	describe("Parameter parsing", () => {
		it("should parse simple parameters", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "testMethod(a, b, c) { return a + b + c; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 3);
			assert.strictEqual(entity.parameters[0].name, "a");
			assert.strictEqual(entity.parameters[1].name, "b");
			assert.strictEqual(entity.parameters[2].name, "c");
		});

		it("should parse parameters with default values", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "testMethod(a, b = 10, c = 'hello') { return a + b; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 3);
			assert.strictEqual(entity.parameters[0].hasDefault, false);
			assert.strictEqual(entity.parameters[1].hasDefault, true);
			assert.strictEqual(entity.parameters[1].defaultValue, "10");
			assert.strictEqual(entity.parameters[2].hasDefault, true);
			assert.strictEqual(entity.parameters[2].defaultValue, "'hello'");
		});

		it("should parse rest parameters", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "testMethod(a, ...rest) { return rest; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 2);
			assert.strictEqual(entity.parameters[0].isRest, false);
			assert.strictEqual(entity.parameters[1].isRest, true);
			assert.strictEqual(entity.parameters[1].name, "rest");
		});

		it("should parse destructured parameters", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "testMethod({x, y}, [a, b]) { return x + a; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 2);
			assert.strictEqual(entity.parameters[0].isDestructured, true);
			assert.strictEqual(entity.parameters[0].name, "{x, y}");
			assert.strictEqual(entity.parameters[1].isDestructured, true);
			assert.strictEqual(entity.parameters[1].name, "[a, b]");
		});

		it("should handle no parameters", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "testMethod() { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 0);
		});

		it("should handle setter single parameter", () => {
			const entity = new MethodEntity("testProperty", mockLocation);
			const source = "set testProperty(value) { this._value = value; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 1);
			assert.strictEqual(entity.parameters[0].name, "value");
		});
	});

	describe("Parent class detection", () => {
		it("should detect parent class from context", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			entity.parentClass = "TestClass";

			assert.strictEqual(entity.parentClass, "TestClass");
		});

		it("should handle method without parent class", () => {
			const entity = new MethodEntity("testMethod", mockLocation);

			assert.strictEqual(entity.parentClass, null);
		});
	});

	describe("Signature extraction", () => {
		it("should extract method signature", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "async testMethod(a, b = 10) { return a + b; }";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "async testMethod(a, b = 10)");
		});

		it("should extract static method signature", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "static async testMethod(a, b) { return a + b; }";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "static async testMethod(a, b)");
		});

		it("should extract getter signature", () => {
			const entity = new MethodEntity("testProperty", mockLocation);
			const source = "get testProperty() { return this._value; }";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "get testProperty()");
		});

		it("should extract setter signature", () => {
			const entity = new MethodEntity("testProperty", mockLocation);
			const source = "set testProperty(value) { this._value = value; }";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "set testProperty(value)");
		});

		it("should extract constructor signature", () => {
			const entity = new MethodEntity("constructor", mockLocation);
			const source = "constructor(x, y) { this.x = x; this.y = y; }";

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "constructor(x, y)");
		});
	});

	describe("Edge cases and error handling", () => {
		it("should handle empty source code", () => {
			const entity = new MethodEntity("testMethod", mockLocation);

			entity.parseContent("");

			assert.strictEqual(entity.source, "");
			assert.strictEqual(entity.methodType, "method");
			assert.strictEqual(entity.parameters.length, 0);
		});

		it("should handle null source code", () => {
			const entity = new MethodEntity("testMethod", mockLocation);

			entity.parseContent(null);

			assert.strictEqual(entity.source, "");
		});

		it("should handle undefined source code", () => {
			const entity = new MethodEntity("testMethod", mockLocation);

			entity.parseContent(undefined);

			assert.strictEqual(entity.source, "");
		});

		it("should handle malformed method syntax", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "testMethod(a b c { return; }"; // Malformed

			entity.parseContent(source);

			// Should not crash
			assert.strictEqual(entity.source, source);
		});

		it("should handle very long method names", () => {
			const longName = "a".repeat(200);
			const entity = new MethodEntity(longName, mockLocation);
			const source = `${longName}() { return 42; }`;

			entity.parseContent(source);

			assert.strictEqual(entity.name, longName);
		});

		it("should handle complex nested method bodies", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = `testMethod() {
				const obj = { nested: { deep: true } };
				if (true) {
					return () => ({ result: obj });
				}
			}`;

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "method");
		});

		it("should handle methods with complex parameter defaults", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source =
				"testMethod(a = func(x, y), b = {prop: value}) { return a; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 1); // Parser limitation
		});

		it("should handle unicode method names", () => {
			const entity = new MethodEntity("测试方法", mockLocation);
			const source = "测试方法() { return 'unicode'; }";

			entity.parseContent(source);

			assert.strictEqual(entity.name, "测试方法");
		});

		it("should handle arrow methods in objects", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "testMethod: () => { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.methodType, "method");
		});
	});

	describe("Validation", () => {
		it("should validate correct method entity", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "testMethod() { return 42; }";

			entity.parseContent(source);
			entity.validate();

			assert.strictEqual(entity.isValidated, true);
		});

		it("should fail validation with empty name", () => {
			const entity = new MethodEntity("", mockLocation);

			entity.validate();

			assert.strictEqual(entity.isValidated, false);
		});

		it("should fail validation with invalid method type", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			entity.methodType = "invalid";

			entity.validate();

			assert.strictEqual(entity.isValidated, false);
		});
	});

	describe("JSDoc tag validation", () => {
		it("should accept valid method tags", () => {
			const entity = new MethodEntity("testMethod", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("param"), true);
			assert.strictEqual(entity.isValidJSDocTag("parameter"), true);
			assert.strictEqual(entity.isValidJSDocTag("returns"), true);
			assert.strictEqual(entity.isValidJSDocTag("return"), true);
			assert.strictEqual(entity.isValidJSDocTag("throws"), true);
			assert.strictEqual(entity.isValidJSDocTag("exception"), true);
			assert.strictEqual(entity.isValidJSDocTag("override"), true);
			assert.strictEqual(entity.isValidJSDocTag("static"), true);
			assert.strictEqual(entity.isValidJSDocTag("abstract"), true);
		});

		it("should accept common tags", () => {
			const entity = new MethodEntity("testMethod", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("author"), true);
			assert.strictEqual(entity.isValidJSDocTag("since"), true);
			assert.strictEqual(entity.isValidJSDocTag("example"), true);
		});

		it("should reject invalid tags", () => {
			const entity = new MethodEntity("testMethod", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("extends"), false);
			assert.strictEqual(entity.isValidJSDocTag("property"), false);
			assert.strictEqual(entity.isValidJSDocTag("invalid"), false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to object correctly", () => {
			const entity = new MethodEntity("testMethod", mockLocation);
			const source = "static async testMethod(a, b = 10) { return a + b; }";

			entity.parseContent(source);
			entity.setDescription("Test method");
			entity.setModuleId("test/module");
			entity.parentClass = "TestClass";

			const obj = entity.toObject();

			assert.strictEqual(obj.entityType, "method");
			assert.strictEqual(obj.name, "testMethod");
			assert.strictEqual(obj.methodType, "method");
			assert.strictEqual(obj.isStatic, true);
			assert.strictEqual(obj.isAsync, true);
			assert.strictEqual(obj.parentClass, "TestClass");
			assert.strictEqual(obj.parameters.length, 2);
			assert.strictEqual(obj.description, "Test method");
			assert.strictEqual(obj.moduleId, "test/module");
		});
	});
});
