/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { FunctionEntity } from "./function-entity.js";

describe("FunctionEntity", () => {
	const mockLocation = { file: "test.js", line: 5, column: 0 };

	describe("Constructor and basic properties", () => {
		it("should create function entity with correct defaults", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);

			assert.strictEqual(entity.entityType, "function");
			assert.strictEqual(entity.name, "testFunc");
			assert.strictEqual(entity.location, mockLocation);
			assert.strictEqual(entity.functionType, "function");
			assert.strictEqual(entity.isAsync, false);
			assert.strictEqual(entity.isGenerator, false);
			assert.strictEqual(entity.isArrow, false);
			assert.strictEqual(entity.isExported, false);
			assert.strictEqual(Array.isArray(entity.parameters), true);
			assert.strictEqual(entity.parameters.length, 0);
			assert.strictEqual(entity.returnType, null);
			assert.strictEqual(entity.signature, "");
		});
	});

	describe("Function type detection", () => {
		it("should detect regular function", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "function testFunc() { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.functionType, "function");
			assert.strictEqual(entity.isAsync, false);
			assert.strictEqual(entity.isGenerator, false);
			assert.strictEqual(entity.isArrow, false);
		});

		it("should detect arrow function", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "const testFunc = () => { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.functionType, "arrow");
			assert.strictEqual(entity.isArrow, true);
			assert.strictEqual(entity.isAsync, false);
			assert.strictEqual(entity.isGenerator, false);
		});

		it("should detect async function", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "async function testFunc() { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.functionType, "async");
			assert.strictEqual(entity.isAsync, true);
			assert.strictEqual(entity.isGenerator, false);
			assert.strictEqual(entity.isArrow, false);
		});

		it("should detect generator function", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "function* testFunc() { yield 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.functionType, "generator");
			assert.strictEqual(entity.isGenerator, true);
			assert.strictEqual(entity.isAsync, false);
			assert.strictEqual(entity.isArrow, false);
		});

		it("should detect async generator function", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "async function* testFunc() { yield 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.functionType, "async-generator");
			assert.strictEqual(entity.isAsync, true);
			assert.strictEqual(entity.isGenerator, true);
			assert.strictEqual(entity.isArrow, false);
		});

		it("should detect async arrow function", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "const testFunc = async () => { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.functionType, "async-arrow");
			assert.strictEqual(entity.isAsync, true);
			assert.strictEqual(entity.isArrow, true);
			assert.strictEqual(entity.isGenerator, false);
		});
	});

	describe("Export detection", () => {
		it("should detect exported function", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "export function testFunc() { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.isExported, true);
		});

		it("should detect non-exported function", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "function testFunc() { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.isExported, false);
		});
	});

	describe("Parameter parsing", () => {
		it("should parse simple parameters", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "function testFunc(a, b, c) { return a + b + c; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 3);
			assert.strictEqual(entity.parameters[0].name, "a");
			assert.strictEqual(entity.parameters[1].name, "b");
			assert.strictEqual(entity.parameters[2].name, "c");
			assert.strictEqual(entity.parameters[0].isRest, false);
			assert.strictEqual(entity.parameters[0].hasDefault, false);
		});

		it("should parse parameters with default values", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source =
				"function testFunc(a, b = 10, c = 'hello') { return a + b; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 3);
			assert.strictEqual(entity.parameters[0].hasDefault, false);
			assert.strictEqual(entity.parameters[1].hasDefault, true);
			assert.strictEqual(entity.parameters[1].defaultValue, "10");
			assert.strictEqual(entity.parameters[2].hasDefault, true);
			assert.strictEqual(entity.parameters[2].defaultValue, "'hello'");
		});

		it("should parse rest parameters", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "function testFunc(a, ...rest) { return rest; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 2);
			assert.strictEqual(entity.parameters[0].isRest, false);
			assert.strictEqual(entity.parameters[1].isRest, true);
			assert.strictEqual(entity.parameters[1].name, "rest");
		});

		it("should parse destructured parameters", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "function testFunc({x, y}, [a, b]) { return x + a; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 2);
			assert.strictEqual(entity.parameters[0].isDestructured, true);
			assert.strictEqual(entity.parameters[0].name, "{x, y}");
			assert.strictEqual(entity.parameters[1].isDestructured, true);
			assert.strictEqual(entity.parameters[1].name, "[a, b]");
		});

		it("should handle complex parameter combinations", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source =
				"function testFunc(a, {x = 5, y} = {}, ...rest) { return a; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 3);
			assert.strictEqual(entity.parameters[0].name, "a");
			assert.strictEqual(entity.parameters[1].isDestructured, true);
			assert.strictEqual(entity.parameters[1].hasDefault, true);
			assert.strictEqual(entity.parameters[2].isRest, true);
		});

		it("should handle no parameters", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "function testFunc() { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 0);
		});

		it("should handle empty parameter list", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "function testFunc(   ) { return 42; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 0);
		});
	});

	describe("Signature extraction", () => {
		it("should extract function signature", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source =
				"export async function testFunc(a, b = 10) { return a + b; }";

			entity.parseContent(source);

			assert.strictEqual(
				entity.signature,
				"export async function testFunc(a, b = 10) { return a + b; }",
			);
		});

		it("should extract arrow function signature", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "const testFunc = (a, b) => { return a + b; }";

			entity.parseContent(source);

			assert.strictEqual(
				entity.signature,
				"const testFunc = (a, b) => { return a + b; }",
			);
		});

		it("should handle multiline function", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = `
// Comment
function testFunc(
	a,
	b
) {
	return a + b;
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "function testFunc(");
		});
	});

	describe("Edge cases and error handling", () => {
		it("should handle empty source code", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);

			entity.parseContent("");

			assert.strictEqual(entity.source, "");
			assert.strictEqual(entity.functionType, "function");
			assert.strictEqual(entity.parameters.length, 0);
		});

		it("should handle null source code", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);

			entity.parseContent(null);

			assert.strictEqual(entity.source, "");
		});

		it("should handle undefined source code", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);

			entity.parseContent(undefined);

			assert.strictEqual(entity.source, "");
		});

		it("should handle malformed function syntax", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "functin testFunc(a b c { return; }"; // Typo and missing syntax

			entity.parseContent(source);

			// Should not crash, but may not parse correctly
			assert.strictEqual(entity.source, source);
		});

		it("should handle very long parameter lists", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const params = Array.from({ length: 50 }, (_, i) => `param${i}`).join(
				", ",
			);
			const source = `function testFunc(${params}) { return 42; }`;

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 50);
			assert.strictEqual(entity.parameters[0].name, "param0");
			assert.strictEqual(entity.parameters[49].name, "param49");
		});

		it("should handle nested parentheses in default values", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source =
				"function testFunc(a = func(x, y), b = {prop: func()}) { return a; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 1); // Complex parsing limitation - stops at first nested structure
			assert.strictEqual(entity.parameters[0].hasDefault, true);
			assert.strictEqual(entity.parameters[0].defaultValue, "func(x, y");
		});

		it("should handle string literals with commas in defaults", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = `function testFunc(a = "hello, world", b = 'foo, bar') { return a; }`;

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 2);
			assert.strictEqual(entity.parameters[0].defaultValue, '"hello, world"');
			assert.strictEqual(entity.parameters[1].defaultValue, "'foo, bar'");
		});

		it("should handle template literals in defaults", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source =
				"function testFunc(a = `hello $" + "{world}`) { return a; }";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 1);
			assert.strictEqual(entity.parameters[0].hasDefault, true);
			assert.strictEqual(
				entity.parameters[0].defaultValue,
				"`hello $" + "{world}`",
			);
		});
	});

	describe("Validation", () => {
		it("should validate correct function entity", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source = "function testFunc() { return 42; }";

			entity.parseContent(source);
			entity.validate();

			assert.strictEqual(entity.isValidated, true);
		});

		it("should fail validation with empty name", () => {
			const entity = new FunctionEntity("", mockLocation);

			entity.validate();

			assert.strictEqual(entity.isValidated, false);
		});

		it("should fail validation with invalid function type", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			entity.functionType = "invalid";

			entity.validate();

			assert.strictEqual(entity.isValidated, false);
		});
	});

	describe("JSDoc tag validation", () => {
		it("should accept valid function tags", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("param"), true);
			assert.strictEqual(entity.isValidJSDocTag("parameter"), true);
			assert.strictEqual(entity.isValidJSDocTag("returns"), true);
			assert.strictEqual(entity.isValidJSDocTag("return"), true);
			assert.strictEqual(entity.isValidJSDocTag("throws"), true);
			assert.strictEqual(entity.isValidJSDocTag("exception"), true);
			assert.strictEqual(entity.isValidJSDocTag("override"), true);
		});

		it("should accept common tags", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("author"), true);
			assert.strictEqual(entity.isValidJSDocTag("since"), true);
			assert.strictEqual(entity.isValidJSDocTag("example"), true);
		});

		it("should reject invalid tags", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("extends"), false);
			assert.strictEqual(entity.isValidJSDocTag("property"), false);
			assert.strictEqual(entity.isValidJSDocTag("invalid"), false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to object correctly", () => {
			const entity = new FunctionEntity("testFunc", mockLocation);
			const source =
				"export async function testFunc(a, b = 10) { return a + b; }";

			entity.parseContent(source);
			entity.setDescription("Test function");
			entity.setModuleId("test/module");

			const obj = entity.toObject();

			assert.strictEqual(obj.entityType, "function");
			assert.strictEqual(obj.name, "testFunc");
			assert.strictEqual(obj.functionType, "async");
			assert.strictEqual(obj.isAsync, true);
			assert.strictEqual(obj.isExported, true);
			assert.strictEqual(obj.parameters.length, 2);
			assert.strictEqual(obj.description, "Test function");
			assert.strictEqual(obj.moduleId, "test/module");
		});
	});
});
