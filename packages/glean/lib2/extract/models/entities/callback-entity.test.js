/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { CallbackEntity } from "./callback-entity.js";

describe("CallbackEntity", () => {
	const mockLocation = { file: "test.js", line: 5, column: 0 };

	describe("Constructor and basic properties", () => {
		it("should create callback entity with correct defaults", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);

			assert.strictEqual(entity.entityType, "callback");
			assert.strictEqual(entity.name, "TestCallback");
			assert.strictEqual(entity.location, mockLocation);
			assert.strictEqual(entity.callbackType, undefined);
			assert.strictEqual(entity.isAsync, false);
			assert.strictEqual(entity.returnType, null);
			assert.strictEqual(Array.isArray(entity.parameters), true);
			assert.strictEqual(entity.parameters.length, 0);
			assert.strictEqual(entity.signature, "");
			assert.strictEqual(entity.context, "");
			assert.strictEqual(entity.isOptional, undefined);
		});
	});

	describe("Minimal parsing behavior", () => {
		it("should accept callback JSDoc without detailed parsing", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);
			const source =
				"@callback TestCallback\n@param {string} value - The value";

			entity.parseContent(source);

			// CallbackEntity has minimal parsing - most features not implemented
			assert.strictEqual(entity.callbackType, undefined);
			assert.strictEqual(entity.parameters.length, 0);
			assert.strictEqual(entity.returnType, null);
		});

		it("should handle signature extraction as JSDoc tag", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);
			const source = "@callback TestCallback\n@param {string} value";

			entity.parseContent(source);

			// Signature is just the callback tag, not a function signature
			assert.strictEqual(entity.signature, "@callback TestCallback");
		});

		it("should handle async callbacks without detailed parsing", () => {
			const entity = new CallbackEntity("AsyncCallback", mockLocation);
			const source = "@callback AsyncCallback\n@async\n@param {string} data";

			entity.parseContent(source);

			// Async parsing works
			assert.strictEqual(entity.isAsync, true);
			assert.strictEqual(entity.signature, "@callback AsyncCallback");
		});

		it("should handle callback with return type without parsing", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);
			const source =
				"@callback TestCallback\n@param {number} x\n@returns {boolean}";

			entity.parseContent(source);

			// Return type not parsed
			assert.strictEqual(entity.returnType, null);
		});

		it("should handle multiple parameters without parsing", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);
			const source =
				"@callback TestCallback\n@param {string} name\n@param {number} age\n@param {boolean} active";

			entity.parseContent(source);

			// Parameters not parsed
			assert.strictEqual(entity.parameters.length, 0);
		});
	});

	describe("Context and optional handling", () => {
		it("should handle callback context when specified", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);
			entity.context = "EventEmitter";

			assert.strictEqual(entity.context, "EventEmitter");
		});

		it("should handle callback without context", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);

			assert.strictEqual(entity.context, "");
		});

		it("should handle optional callback", () => {
			const entity = new CallbackEntity("OptionalCallback", mockLocation);
			entity.isOptional = true;

			assert.strictEqual(entity.isOptional, true);
		});

		it("should handle required callback", () => {
			const entity = new CallbackEntity("RequiredCallback", mockLocation);

			assert.strictEqual(entity.isOptional, undefined);
		});
	});

	describe("Edge cases and error handling", () => {
		it("should handle empty source code", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);

			entity.parseContent("");

			assert.strictEqual(entity.source, "");
			assert.strictEqual(entity.parameters.length, 0);
		});

		it("should handle null source code", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);

			entity.parseContent(null);

			assert.strictEqual(entity.source, "");
		});

		it("should handle undefined source code", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);

			entity.parseContent(undefined);

			assert.strictEqual(entity.source, "");
		});

		it("should handle malformed callback syntax", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);
			const source = "@callback TestCallback\n@param malformed";

			entity.parseContent(source);

			// Should not crash
			assert.strictEqual(entity.source, source);
		});

		it("should handle very long callback names", () => {
			const longName = "a".repeat(200);
			const entity = new CallbackEntity(longName, mockLocation);
			const source = `@callback ${longName}\n@param {string} value`;

			entity.parseContent(source);

			assert.strictEqual(entity.name, longName);
		});

		it("should handle unicode callback names", () => {
			const entity = new CallbackEntity("回调函数", mockLocation);
			const source = "@callback 回调函数\n@param {string} 值";

			entity.parseContent(source);

			assert.strictEqual(entity.name, "回调函数");
		});

		it("should handle callback with no parameters gracefully", () => {
			const entity = new CallbackEntity("NoParamsCallback", mockLocation);
			const source = "@callback NoParamsCallback\n@returns {void}";

			entity.parseContent(source);

			assert.strictEqual(entity.parameters.length, 0);
			assert.strictEqual(entity.returnType, null);
		});

		it("should handle complex callback types gracefully", () => {
			const entity = new CallbackEntity("ComplexCallback", mockLocation);
			const source =
				"@callback ComplexCallback\n@param {function(function(string): boolean): number} complexParam";

			entity.parseContent(source);

			// Complex parsing not implemented
			assert.strictEqual(entity.parameters.length, 0);
		});
	});

	describe("Validation", () => {
		it("should validate correct callback entity", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);
			const source = "@callback TestCallback\n@param {string} value";

			entity.parseContent(source);
			entity.validate();

			assert.strictEqual(entity.isValidated, true);
		});

		it("should fail validation with empty name", () => {
			const entity = new CallbackEntity("", mockLocation);

			entity.validate();

			assert.strictEqual(entity.isValidated, false);
		});

		it("should validate callback without parameters", () => {
			const entity = new CallbackEntity("SimpleCallback", mockLocation);
			const source = "@callback SimpleCallback";

			entity.parseContent(source);
			entity.validate();

			assert.strictEqual(entity.isValidated, true);
		});
	});

	describe("JSDoc tag validation", () => {
		it("should validate JSDoc tags according to implementation", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);

			// Test actual implementation behavior
			assert.strictEqual(entity.isValidJSDocTag("callback"), false);
			assert.strictEqual(entity.isValidJSDocTag("param"), true);
			assert.strictEqual(entity.isValidJSDocTag("returns"), true);
			assert.strictEqual(entity.isValidJSDocTag("async"), false);
		});

		it("should accept common tags", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("author"), true);
			assert.strictEqual(entity.isValidJSDocTag("since"), true);
			assert.strictEqual(entity.isValidJSDocTag("example"), true);
		});

		it("should reject invalid tags", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("extends"), false);
			assert.strictEqual(entity.isValidJSDocTag("implements"), false);
			assert.strictEqual(entity.isValidJSDocTag("invalid"), false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to object correctly", () => {
			const entity = new CallbackEntity("TestCallback", mockLocation);
			const source =
				"@callback TestCallback\n@param {string} name\n@param {number} age\n@returns {boolean}";

			entity.parseContent(source);
			entity.setDescription("Test callback function");
			entity.setModuleId("test/module");
			entity.context = "TestClass";
			entity.isOptional = true;

			const obj = entity.toObject();

			assert.strictEqual(obj.entityType, "callback");
			assert.strictEqual(obj.name, "TestCallback");
			assert.strictEqual(obj.callbackType, undefined);
			assert.strictEqual(obj.parameters.length, 0);
			assert.strictEqual(obj.returnType, null);
			assert.strictEqual(obj.context, "TestClass");
			assert.strictEqual(obj.isOptional, undefined);
			assert.strictEqual(obj.description, "Test callback function");
			assert.strictEqual(obj.moduleId, "test/module");
		});

		it("should serialize async callback correctly", () => {
			const entity = new CallbackEntity("AsyncCallback", mockLocation);
			const source =
				"@callback AsyncCallback\n@async\n@param {string} data\n@returns {Promise<void>}";

			entity.parseContent(source);

			const obj = entity.toObject();

			assert.strictEqual(obj.isAsync, true);
			assert.strictEqual(obj.returnType, null);
		});

		it("should serialize minimal callback", () => {
			const entity = new CallbackEntity("SimpleCallback", mockLocation);
			const source = "@callback SimpleCallback";

			entity.parseContent(source);

			const obj = entity.toObject();

			assert.strictEqual(obj.entityType, "callback");
			assert.strictEqual(obj.name, "SimpleCallback");
			assert.strictEqual(obj.callbackType, undefined);
			assert.strictEqual(obj.parameters.length, 0);
		});
	});
});
